const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./helpers/fixture.cjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGmQAAAAASUVORK5CYII=','base64');

test('Профиль: изменения сохраняются в SQL, чужой аккаунт не меняется',async t=>{
  const f=await fixture(t),owner=await f.register('profile'),other=await f.register('other');
  const original=await f.db.user.findUniqueOrThrow({where:{id:other.id}});
  const email=`changed-${owner.id}@example.test`;
  const result=(await f.auth(f.http.patch('/api/users/me'),owner)
    .send({name:'Дарья',email:email.toUpperCase(),dark:true,calendar:false}).expect(200)).body;
  const stored=await f.db.user.findUniqueOrThrow({where:{id:owner.id}});
  for(const row of [result,stored]){
    assert.equal(row.name,'Дарья');assert.equal(row.email,email);
    assert.equal(row.dark,true);assert.equal(row.calendar,false);
  }
  assert.equal('passwordHash' in result,false);
  assert.deepEqual(await f.db.user.findUniqueOrThrow({where:{id:other.id}}),original);
  // Частичное обновление не должно сбросить ранее изменённые поля.
  await f.auth(f.http.patch('/api/users/me'),owner).send({dark:false}).expect(200);
  const profile=(await f.auth(f.http.get('/api/users/me'),owner).expect(200)).body;
  assert.equal(profile.dark,false);assert.equal(profile.name,'Дарья');
  assert.equal(profile.email,email);assert.equal(profile.calendar,false);
  await f.http.post('/api/auth/login').send({email,password:owner.password}).expect(201);
  await f.http.post('/api/auth/login').send({email:owner.email,password:owner.password}).expect(401);
  // Конфликт email не должен частично сохранить имя или другие поля.
  await f.auth(f.http.patch('/api/users/me'),owner).send({email:other.email,name:'Другое имя'}).expect(409);
  assert.equal((await f.db.user.findUniqueOrThrow({where:{id:owner.id}})).name,'Дарья');
  const upload=(await f.auth(f.http.post('/api/files'),owner).attach('file',png,'avatar.png').expect(201)).body;
  const withAvatar=(await f.auth(f.http.patch('/api/users/me'),owner).send({avatarId:upload.id}).expect(200)).body;
  assert.equal(withAvatar.avatarId,upload.id);assert.ok(withAvatar.avatar);
  const url=new URL(withAvatar.avatar);
  await f.http.get(url.pathname+url.search).expect(200).expect('Content-Type',/image\/png/);
  await f.auth(f.http.patch('/api/users/me'),owner).send({avatarId:null}).expect(200);
  assert.equal((await f.db.user.findUniqueOrThrow({where:{id:owner.id}})).avatarId,null);
  assert.equal((await f.auth(f.http.get('/api/users/me'),owner).expect(200)).body.avatar,undefined);
});

test('Календарь: настройка запрещает экспорт; после включения используется адрес выбранного места',async t=>{
  const f=await fixture(t),owner=await f.register('calendar'),outsider=await f.register('outsider');
  const meeting=await f.meeting(owner);
  const restaurant=await f.db.restaurant.findFirstOrThrow();
  await f.db.meeting.update({where:{id:meeting.id},data:{restaurantId:restaurant.id}});
  const path=`/api/meetings/${meeting.id}/calendar.ics`;
  await f.auth(f.http.patch('/api/users/me'),owner).send({calendar:false}).expect(200);
  const denied=await f.auth(f.http.get(path),owner).expect(400);
  assert.match(JSON.stringify(denied.body),/Включите экспорт календаря/);
  await f.auth(f.http.patch('/api/users/me'),owner).send({calendar:true}).expect(200);
  const ics=await f.auth(f.http.get(path),owner).expect(200).expect('Content-Type',/text\/calendar/);
  // Склеиваем строки ICS, перенесённые по правилу формата, затем читаем LOCATION.
  const unfolded=ics.text.replace(/\r\n[ \t]/g,'');
  const escape=s=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  assert.ok(unfolded.includes(`LOCATION:${escape(`${restaurant.name}, ${restaurant.address}`)}`));
  await f.auth(f.http.get(path),outsider).expect(403);
});

test('Бронь: повторное подтверждение не меняет даты, версию, сообщения и голоса',async t=>{
  const f=await fixture(t),owner=await f.register('booking');
  const meeting=await f.meeting(owner);
  const [restaurant,other]=await f.db.restaurant.findMany({take:2,orderBy:{id:'asc'}});
  assert.ok(restaurant && other);
  await f.auth(f.http.post(`/api/meetings/${meeting.id}/candidates`),owner).send({restaurantId:restaurant.id}).expect(201);
  await f.auth(f.http.put(`/api/meetings/${meeting.id}/vote`),owner).send({restaurantId:restaurant.id}).expect(200);
  const path=`/api/meetings/${meeting.id}/booking`;
  await f.auth(f.http.post(path),owner).send({restaurantId:restaurant.id}).expect(201);
  const snapshot=async()=>({
    meeting:await f.db.meeting.findUniqueOrThrow({where:{id:meeting.id}}),
    messages:await f.db.message.findMany({where:{meetingId:meeting.id},orderBy:{id:'asc'}}),
    votes:await f.db.vote.findMany({where:{meetingId:meeting.id}}),
  });
  const before=await snapshot();assert.equal(before.meeting.status,'completed');
  assert.ok(before.meeting.bookedAt && before.meeting.completedAt);
  await f.auth(f.http.post(path),owner).send({restaurantId:restaurant.id}).expect(201);
  assert.deepEqual(await snapshot(),before);
  await f.auth(f.http.post(path),owner).send({restaurantId:other.id}).expect(400);
  assert.deepEqual(await snapshot(),before);
  await f.auth(f.http.delete(path),owner).expect(200);
  const cancelled=await f.db.meeting.findUniqueOrThrow({where:{id:meeting.id}});
  assert.equal(cancelled.status,'selected');assert.equal(cancelled.bookedAt,null);
  assert.equal(cancelled.completedAt,null);assert.equal(cancelled.restaurantId,restaurant.id);
  assert.equal(cancelled.version,before.meeting.version+1);
});
