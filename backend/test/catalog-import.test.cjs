const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {scratchDatabase}=require('./helpers/scratch-database.cjs');

/** Synthetic sources are used only in a disposable database, never in the app catalog. */
function sources(){
  const fetchedAt='2026-11-01T12:00:00.000Z';
  const places=Array.from({length:205},(_,i)=>({
    sourceId:`osm:node/${100000+i}`,osmType:'node',osmId:String(100000+i),osmVersion:1,
    osmUpdatedAt:fetchedAt,name:`Проверочный филиал ${String(i).padStart(4,'0')}`,
    latitude:55.7558,longitude:37.6176,address:'Тестовая улица, 1',
    tags:{cuisine:'italian',phone:'+74950000000',website:'https://example.test',opening_hours:'24/7','addr:housenumber':'1'},
  }));
  return {
    snapshot:{source:'synthetic-test',fetchedAt,places},
    boundary:{geometry:{coordinates:[[[37.60,55.74],[37.64,55.74],[37.64,55.77],[37.60,55.77],[37.60,55.74]]]}},
    prices:{source:'synthetic-test',fetchedAt,rows:places.map((p,i)=>({
      id:i+1,name:p.name,bill:1000+i,slug:`test-${i}`,address:p.address,
      position:{lat:p.latitude,lng:p.longitude},kitchens:[],
    }))},
  };
}

test('Полный импорт: миграции с нуля, 200 заполненных записей и безопасное обновление',async t=>{
  const {db,folder,run,deploy}=await scratchDatabase(t);
  await deploy();
  const applied=await db.$queryRaw`SELECT migration_name FROM [dbo].[_prisma_migrations] WHERE finished_at IS NOT NULL ORDER BY migration_name`;
  const expected=(await fs.readdir(path.join(__dirname,'../prisma/migrations'))).filter(n=>/^\d/.test(n)).sort();
  assert.deepEqual(applied.map(r=>r.migration_name),expected);
  // Повторное применение миграций не создаёт новых записей и не меняет схему.
  await deploy();
  assert.equal((await db.$queryRaw`SELECT migration_name FROM [dbo].[_prisma_migrations]`).length,expected.length);
  await fs.mkdir(path.join(folder,'osm'));await fs.mkdir(path.join(folder,'imports'));
  const write=async data=>{
    await fs.writeFile(path.join(folder,'osm/restaurants.json'),JSON.stringify(data.snapshot));
    await fs.writeFile(path.join(folder,'osm/garden-ring.geojson'),JSON.stringify(data.boundary));
    await fs.writeFile(path.join(folder,'imports/restorating.json'),JSON.stringify(data.prices));
  };
  const input=sources();await write(input);
  const seed={name:input.snapshot.places[0].name,sourceId:input.snapshot.places[0].sourceId,
    address:'Старый адрес',city:'Москва',district:'Центр',latitude:55.7558,longitude:37.6176,
    cuisine:'russian',price:500,catalogArea:'garden-ring'};
  const existing=await db.restaurant.create({data:seed});
  await db.restaurantCuisine.create({data:{restaurantId:existing.id,code:'russian'}});
  const stale=await db.restaurant.create({data:{...seed,sourceId:'old-snapshot'}});
  const before=await db.restaurant.findMany({orderBy:{id:'asc'}});
  await run('scripts/import-catalog.cjs',['--dry-run']);
  assert.deepEqual(await db.restaurant.findMany({orderBy:{id:'asc'}}),before);

  await run('scripts/import-catalog.cjs');
  const imported=await db.restaurant.findMany({include:{cuisines:true},orderBy:{sourceId:'asc'}});
  assert.equal(imported.length,200);
  assert.equal(await db.restaurant.findUnique({where:{id:stale.id}}),null);
  assert.equal(imported[0].id,existing.id);
  for(const row of imported){
    const source=input.snapshot.places.find(p=>p.sourceId===row.sourceId);
    const price=input.prices.rows.find(p=>p.name===row.name);
    assert.ok(source && price);
    assert.equal(row.price,price.bill);assert.equal(row.city,'Москва');
    assert.equal(row.address,source.address);assert.equal(row.openingHours,'24/7');
    assert.equal(row.phone,source.tags.phone);assert.equal(row.website,source.tags.website);
    assert.equal(row.cuisine,'italian');assert.deepEqual(row.cuisines.map(c=>c.code),['italian']);
    assert.equal(row.priceSource,`https://www.restorating.ru/msk/catalogue/${price.slug}`);
    assert.equal(row.priceSourceId,String(price.id));
    assert.equal(row.priceFetchedAt.toISOString(),input.prices.fetchedAt);
    assert.equal(row.priceMatchDistance,0);assert.deepEqual(JSON.parse(row.rawTags),source.tags);
  }
  const selected=JSON.parse(await fs.readFile(path.join(folder,'osm/selected-restaurants.json'),'utf8'));
  assert.deepEqual([...selected.sourceIds].sort(),imported.map(r=>r.sourceId).sort());
  input.prices.rows[0].bill=2200;await write(input);
  await run('scripts/import-catalog.cjs');
  assert.equal(await db.restaurant.count(),200);
  assert.equal((await db.restaurant.findUniqueOrThrow({where:{id:existing.id}})).price,2200);
  assert.equal(await db.restaurantCuisine.count(),200);
  const report=JSON.parse(await fs.readFile(path.join(folder,'import-report.json'),'utf8'));
  assert.equal(report.reusedIds,200);assert.equal(report.withPrice,200);assert.equal(report.withoutPrice,0);

  const snapshot=async()=>({
    restaurants:await db.restaurant.findMany({orderBy:{id:'asc'}}),
    cuisines:await db.restaurantCuisine.findMany({orderBy:[{restaurantId:'asc'},{code:'asc'}]}),
  });
  const stable=await snapshot();
  await t.test('Неполные данные и неверная граница отклоняются до записи в базу',async()=>{
    const cases=[
      [data=>{data.snapshot.places=data.snapshot.places.slice(0,10);},/маленький снимок/],
      [data=>{data.prices.rows=[];},/Полных записей только 0/],
      [data=>{for(const p of data.snapshot.places)delete p.tags.phone;},/Полных записей только 0/],
      [data=>{for(const p of data.snapshot.places)delete p.tags.website;},/Полных записей только 0/],
      [data=>{for(const p of data.snapshot.places)p.address='';for(const r of data.prices.rows)r.address='';},/Полных записей только 0/],
      [data=>{for(const p of data.snapshot.places){p.tags.cuisine='';}},/Полных записей только 0/],
      [data=>{for(const p of data.snapshot.places)p.tags.opening_hours='invalid-hours';},/Полных записей только 0/],
      [data=>{data.boundary.geometry.coordinates=[[[0,0],[1,0],[1,1],[0,1],[0,0]]];},/Некорректная запись/],
    ];
    for(const [alter,reason] of cases){
      const invalid=sources();alter(invalid);await write(invalid);
      await assert.rejects(run('scripts/import-catalog.cjs'),error=>{assert.match(error.stderr,reason);return true;});
      assert.deepEqual(await snapshot(),stable);
    }
  });
  await t.test('Импорт не удаляет заведения, связанные со встречами или кандидатами',async()=>{
    const user=await db.user.create({data:{name:'Проверка импорта',email:'import@example.test',passwordHash:'fixture'}});
    const meeting=await db.meeting.create({data:{ownerId:user.id,title:'Сохранить историю',startsAt:new Date('2030-01-01'),format:'В помещении',restaurantId:existing.id}});
    // Из нового снимка исчез выбранный ресторан. Вместо него мог бы войти другой.
    const changed=sources();changed.snapshot.places.shift();await write(changed);
    const denied=()=>assert.rejects(run('scripts/import-catalog.cjs'),e=>{assert.match(e.stderr,/используются во встречах/);return true;});
    await denied();assert.deepEqual(await snapshot(),stable);
    await db.meeting.update({where:{id:meeting.id},data:{restaurantId:null}});
    await db.candidate.create({data:{meetingId:meeting.id,restaurantId:existing.id}});
    await denied();assert.deepEqual(await snapshot(),stable);
    assert.ok(await db.candidate.findUnique({where:{meetingId_restaurantId:{meetingId:meeting.id,restaurantId:existing.id}}}));
  });
});
