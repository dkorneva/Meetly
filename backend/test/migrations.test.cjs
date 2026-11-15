const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {scratchDatabase}=require('./helpers/scratch-database.cjs');
const migrations=path.resolve(__dirname,'../prisma/migrations');
const activity='202611150001_remove_catalog_active';
const price='202611150002_require_restaurant_price';

test('Миграции SQL: сохранение каталога, защита истории и обязательная цена',async t=>{
  const {db}=await scratchDatabase(t);
  const apply=async name=>db.$executeRawUnsafe(await fs.readFile(path.join(migrations,name,'migration.sql'),'utf8'));
  // Восстанавливаем предыдущую версию схемы в отдельной пустой базе.
  for(const name of (await fs.readdir(migrations)).filter(n=>/^\d/.test(n)&&n<activity).sort())await apply(name);
  const user=await db.user.create({data:{name:'Тест миграции',email:'migration@example.test',passwordHash:'fixture'}});
  const data={name:'Сохранить ресторан',address:'Москва, тестовый адрес',city:'Москва',district:'Центр',latitude:55.75,longitude:37.61,cuisine:'italian',price:1500,catalogArea:'garden-ring'};
  const visible=await db.restaurant.create({data});
  const hidden=await db.restaurant.create({data:{...data,name:'Скрытый ресторан'}});
  await db.$executeRaw`UPDATE [dbo].[Restaurant] SET [catalogActive]=1 WHERE [id]=${visible.id}`;
  await db.restaurantCuisine.createMany({data:[{restaurantId:visible.id,code:'italian'},{restaurantId:hidden.id,code:'italian'}]});
  const meeting=await db.meeting.create({data:{ownerId:user.id,title:'История встречи',startsAt:new Date('2030-01-01T12:00:00Z'),format:'В помещении',restaurantId:hidden.id}});
  const columns=()=>db.$queryRaw`SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Restaurant'`;

  // Сначала срабатывает защита выбранного места, даже без Candidate.
  await assert.rejects(apply(activity),/referenced by meetings/);
  assert.equal(await db.restaurant.count(),2);
  assert.ok((await columns()).some(c=>c.COLUMN_NAME==='catalogActive'));
  await db.meeting.update({where:{id:meeting.id},data:{restaurantId:visible.id}});
  await db.member.create({data:{meetingId:meeting.id,userId:user.id}});
  await db.candidate.create({data:{meetingId:meeting.id,restaurantId:hidden.id}});
  await db.vote.create({data:{meetingId:meeting.id,userId:user.id,restaurantId:hidden.id}});
  await assert.rejects(apply(activity),/referenced by meetings/);
  assert.equal(await db.restaurantCuisine.count(),2);
  assert.equal(await db.vote.count(),1);
  await db.vote.deleteMany({where:{meetingId:meeting.id}});
  await db.candidate.deleteMany({where:{meetingId:meeting.id}});
  const before=await db.restaurant.findUniqueOrThrow({where:{id:visible.id}});
  const meetingBefore=await db.meeting.findUniqueOrThrow({where:{id:meeting.id}});
  await apply(activity);
  assert.deepEqual(await db.restaurant.findMany(),[before]);
  assert.deepEqual(await db.meeting.findUniqueOrThrow({where:{id:meeting.id}}),meetingBefore);
  assert.deepEqual(await db.restaurantCuisine.findMany(),[{restaurantId:visible.id,code:'italian'}]);
  assert.equal((await columns()).some(c=>c.COLUMN_NAME==='catalogActive'),false);

  // Миграция цены не подставляет выдуманную цену и не удаляет неполные записи.
  await db.$executeRaw`UPDATE [dbo].[Restaurant] SET [price]=NULL WHERE [id]=${visible.id}`;
  await assert.rejects(apply(price),/Fill missing prices/);
  assert.equal((await columns()).find(c=>c.COLUMN_NAME==='price').IS_NULLABLE,'YES');
  assert.equal(await db.restaurant.count(),1);
  await db.restaurant.update({where:{id:visible.id},data:{price:1500}});
  await apply(price);
  assert.deepEqual(await db.restaurant.findMany(),[before]);
  assert.equal((await columns()).find(c=>c.COLUMN_NAME==='price').IS_NULLABLE,'NO');
  await assert.rejects(db.$executeRaw`UPDATE [dbo].[Restaurant] SET [price]=NULL WHERE [id]=${visible.id}`);
  assert.equal((await db.restaurant.findUniqueOrThrow({where:{id:visible.id}})).price,1500);
});
