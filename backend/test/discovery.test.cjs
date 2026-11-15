require('dotenv/config');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {join}=require('node:path');
const request=require('supertest');
const {createApp}=require('../dist/main');
const {inside,matchPrice}=require('../scripts/lib/osm-catalog.cjs');

const hasImportSnapshots=['osm/garden-ring.geojson','osm/restaurants.json','osm/selected-restaurants.json','imports/restorating.json'].every(file=>fs.existsSync(join(__dirname,'../catalog',file)));
test('Снимок: 200 полных записей из OSM, внутри реального полигона, цены привязаны к конкретным филиалам', { skip: hasImportSnapshots ? false : 'Нужны исходные выгрузки catalog:fetch и список последнего импорта catalog:import' }, ()=>{
  const root=join(__dirname,'../catalog');
  const ring=JSON.parse(fs.readFileSync(join(root,'osm/garden-ring.geojson'))).geometry.coordinates[0];
  const all=require('../catalog/osm/restaurants.json').places;
  const selected=require('../catalog/osm/selected-restaurants.json').sourceIds;
  const prices=require('../catalog/imports/restorating.json').rows;
  assert.equal(selected.length,200);assert.equal(new Set(selected).size,200);
  assert.ok(inside([37.6176,55.7558],ring));assert.equal(inside([37.54,55.7558],ring),false);
  for(const id of selected){
    const p=all.find(p=>p.sourceId===id);assert.equal(p.tags.amenity,'restaurant');
    assert.ok(inside([p.longitude,p.latitude],ring));
    const price=matchPrice(p,prices);assert.ok(price);assert.ok(price.row.bill>0);
    assert.ok(p.address||price.row.address);assert.ok(p.tags.phone||p.tags['contact:phone']);assert.ok(p.tags.website||p.tags['contact:website']);
  }
});

test('HTTP и SQL: весь каталог без встречи, фильтры бюджета и кухни, отсутствие внешнего поиска, сохранность голосов',async()=>{
  const app=await createApp();const db=app.services.db,http=request(app.server);
  let userId,meetingId;const originalFetch=global.fetch;
  global.fetch=async()=>{throw Error('Внешняя сеть запрещена в этом тесте')};
  try{
    const register=await http.post('/api/auth/register').send({name:'Проверка Каталога',email:`catalog-${Date.now()}@example.test`,password:'StrongPass123!'}).expect(201);
    const auth=r=>r.auth(register.body.accessToken,{type:'bearer'});
    userId=(await auth(http.get('/api/users/me')).expect(200)).body.id;
    const catalog=(await auth(http.get('/api/restaurants/discovery')).expect(200)).body;
    assert.equal(catalog.total,200);assert.equal(catalog.source,'osm-database');
    for(const p of catalog.items){assert.equal(p.source,'osm');assert.ok(p.price>0&&p.phone&&p.website&&p.openingHours&&p.address);assert.ok(p.priceSource&&p.priceFetchedAt);assert.equal(p.available,true)}
    const budget=(await auth(http.get('/api/restaurants/discovery?budget=1500')).expect(200)).body;
    assert.ok(budget.items.length>0&&budget.items.length<200);assert.ok(budget.items.every(p=>p.price<=1500));
    const vegetarian=(await auth(http.get('/api/restaurants/discovery?cuisine='+encodeURIComponent('Вегетарианская'))).expect(200)).body;
    assert.ok(vegetarian.items.length>0);assert.ok(vegetarian.items.every(p=>/vegetarian|vegan/.test(p.cuisine)));
    await auth(http.get('/api/restaurants/discovery?distance=1')).expect(400);
    assert.ok(catalog.items.every(p=>!('distanceKm' in p)));
    await auth(http.get('/api/restaurants/discovery?budget=-1')).expect(400);
    // Устаревший параметр city больше не ограничивает список заведений.
    const listed=(await auth(http.get('/api/restaurants')).expect(200)).body;
    const withCity=(await auth(http.get('/api/restaurants').query({city:'Санкт-Петербург'})).expect(200)).body;
    assert.deepEqual(withCity.map(r=>r.id).sort(),listed.map(r=>r.id).sort());
    assert.equal(listed.length,200);
    assert.ok(withCity.every(r=>r.city==='Москва' && r.address));
    const first=catalog.items[0];await auth(http.get(`/api/restaurants/${first.id}/details`)).expect(200);
    const m=await auth(http.post('/api/meetings')).send({title:'Тест локального каталога',date:new Date(Date.now()+7*86400000).toISOString().slice(0,10),time:'19:00',budget:5000,cuisines:[],city:'Санкт-Петербург',format:'В помещении'}).expect(201);meetingId=m.body.id;
    // Город встречи сохраняется как данные, но не блокирует подбор из каталога.
    assert.equal(m.body.city,'Санкт-Петербург');
    const suggested=(await auth(http.get(`/api/meetings/${meetingId}/recommendations`)).expect(200)).body;
    assert.equal(suggested.total,200);
    assert.equal(suggested.warning,undefined);
    await auth(http.post(`/api/meetings/${meetingId}/recommendations/apply`)).send({}).expect(201);
    const candidates=await db.candidate.findMany({where:{meetingId}});assert.equal(candidates.length,3);
    const voted=candidates[0].restaurantId;
    await auth(http.put(`/api/meetings/${meetingId}/vote`)).send({restaurantId:voted}).expect(200);
    await auth(http.post(`/api/meetings/${meetingId}/recommendations/apply?budget=1500`)).send({}).expect(201);
    assert.equal(await db.vote.count({where:{meetingId}}),1);assert.ok(await db.candidate.findUnique({where:{meetingId_restaurantId:{meetingId,restaurantId:voted}}}));
    const snapshot=await db.candidate.count({where:{meetingId}});
    await auth(http.get('/api/restaurants/discovery?budget=1000')).expect(200);
    assert.equal(await db.candidate.count({where:{meetingId}}),snapshot);
    await auth(http.delete(`/api/meetings/${meetingId}/candidates/${voted}`)).expect(200);
    assert.equal(await db.vote.count({where:{meetingId,restaurantId:voted}}),0);
    const refreshed=(await auth(http.get('/api/meetings')).expect(200)).body.find(m=>m.id===meetingId);
    assert.ok(!refreshed.candidates.some(c=>c.restaurant.id===voted));
    await auth(http.put(`/api/meetings/${meetingId}/vote`)).send({restaurantId:voted}).expect(400);
    const recommendations=(await auth(http.post(`/api/meetings/${meetingId}/recommendations/apply`)).send({}).expect(201)).body;
    assert.ok(!recommendations.items.some(r=>r.id===voted));
    assert.equal((await db.candidate.findUnique({where:{meetingId_restaurantId:{meetingId,restaurantId:voted}}})).origin,'excluded');
    await auth(http.post(`/api/meetings/${meetingId}/candidates`)).send({restaurantId:voted}).expect(201);
    assert.equal((await db.candidate.findUnique({where:{meetingId_restaurantId:{meetingId,restaurantId:voted}}})).origin,'manual');
  }finally{
    global.fetch=originalFetch;
    if(meetingId){await db.vote.deleteMany({where:{meetingId}});await db.candidate.deleteMany({where:{meetingId}});await db.message.deleteMany({where:{meetingId}});await db.member.deleteMany({where:{meetingId}});await db.meeting.deleteMany({where:{id:meetingId}})}
    if(userId){await db.session.deleteMany({where:{userId}});await db.user.deleteMany({where:{id:userId}})}await app.close();
  }
});
