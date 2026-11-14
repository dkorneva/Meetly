require('dotenv/config');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const {createApp}=require('../dist/main');
const {cuisineCodes}=require('../dist/domain/places');

test('HTTP: filters cover every stored cuisine and price; meeting preferences accept expanded selections',async()=>{
  const app=await createApp();
  const db=app.services.db,http=request(app.server);let userId,meetingId;
  try{
    const session=await http.post('/api/auth/register').send({name:'Проверка Фильтров',email:`filters-${Date.now()}@example.test`,password:'StrongPass123!'}).expect(201);
    const auth=r=>r.auth(session.body.accessToken,{type:'bearer'});
    userId=(await auth(http.get('/api/users/me')).expect(200)).body.id;
    const options=(await auth(http.get('/api/restaurants/filters')).expect(200)).body;
    const rows=await db.restaurant.findMany({where:{catalogArea:'garden-ring',catalogActive:true},include:{cuisines:true}});
    const codes=new Set(rows.flatMap(r=>r.cuisines.map(c=>c.code)));
    assert.ok(options.cuisines.length>6);
    for(const code of codes)assert.ok(options.cuisines.some(label=>cuisineCodes(label).includes(code)),`Missing ${code}`);
    for(const row of rows)if(row.price!==null){assert.ok(options.budget.prices.includes(row.price));assert.ok(options.budget.max>=row.price);}
    for(const label of options.cuisines){
      const result=(await auth(http.get('/api/restaurants/discovery').query({cuisine:label})).expect(200)).body;
      const expected=rows.filter(r=>r.cuisines.some(c=>cuisineCodes(label).includes(c.code))).map(r=>r.id).sort();
      assert.deepEqual(result.items.map(r=>r.id).sort(),expected,label);
    }
    const all=(await auth(http.get('/api/restaurants/discovery').query({budget:options.budget.max})).expect(200)).body;
    assert.equal(all.total,rows.filter(r=>r.price!==null).length);
    const selectedCuisines=['Японская','Грузинская'];
    const combined=(await auth(http.get('/api/restaurants/discovery').query({cuisines:selectedCuisines})).expect(200)).body;
    const combinedCodes=selectedCuisines.flatMap(cuisineCodes);
    assert.deepEqual(combined.items.map(r=>r.id).sort(),rows.filter(r=>r.cuisines.some(c=>combinedCodes.includes(c.code))).map(r=>r.id).sort());
    const opened=(await auth(http.get('/api/restaurants/discovery').query({openNow:true})).expect(200)).body;
    assert.ok(opened.items.every(r=>r.openNow===true));
    const input={title:'Все кухни каталога',date:new Date(Date.now()+7*86400000).toISOString().slice(0,10),time:'19:00',budget:options.budget.max,cuisines:options.cuisines,city:'Москва',format:'Не важно'};
    const meeting=await auth(http.post('/api/meetings')).send(input).expect(201);meetingId=meeting.body.id;
    let member=await db.member.findUnique({where:{meetingId_userId:{meetingId,userId}}});
    assert.deepEqual(JSON.parse(member.cuisines),options.cuisines);assert.equal(member.budget,options.budget.max);
    await auth(http.put(`/api/meetings/${meetingId}/preferences`)).send({budget:options.budget.max,cuisines:['Грузинская','Чешская','Веганская']}).expect(200);
    member=await db.member.findUnique({where:{meetingId_userId:{meetingId,userId}}});
    assert.deepEqual(JSON.parse(member.cuisines),['Грузинская','Чешская','Веганская']);
    const legacy='Организатор подтвердил бронирование после связи с заведением';
    await db.message.create({data:{meetingId,senderId:userId,kind:'selected',text:'Выбранное место',createdAt:new Date(Date.now()+1000)}});
    await db.message.create({data:{meetingId,senderId:userId,kind:'system',text:legacy,createdAt:new Date(Date.now()+2000)}});
    const messages=(await auth(http.get(`/api/meetings/${meetingId}/messages`)).expect(200)).body;
    assert.ok(!messages.items.some(m=>m.text===legacy));
    assert.ok(messages.items.some(m=>m.kind==='selected'));
    const meetings=(await auth(http.get('/api/meetings')).expect(200)).body;
    assert.equal(meetings.find(m=>m.id===meetingId).lastMessage.kind,'selected');
    const profile=(await auth(http.get('/api/users/me')).expect(200)).body;
    assert.equal('reminders' in profile,false);
  }finally{
    if(meetingId){await db.vote.deleteMany({where:{meetingId}});await db.candidate.deleteMany({where:{meetingId}});await db.message.deleteMany({where:{meetingId}});await db.member.deleteMany({where:{meetingId}});await db.meeting.deleteMany({where:{id:meetingId}});}
    if(userId){await db.session.deleteMany({where:{userId}});await db.user.deleteMany({where:{id:userId}});}
    await app.close();
  }
});
