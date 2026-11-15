require('dotenv/config');
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const request = require('supertest');
const {io} = require('socket.io-client');
const {createApp} = require('../dist/main');
const {UnauthorizedError, ForbiddenError} = require('../dist/http/errors');
const {Tokens} = require('../dist/infrastructure/tokens');

const user = randomUUID(), meeting = randomUUID(), restaurant = randomUUID();
const input = {title:'Встреча',date:'2099-01-01',time:'19:30',budget:1500,cuisines:[],format:'В помещении'};

// Реальные Express, middleware, маршруты и Socket.IO. Вместо SQL вызываются контролируемые сервисы.
async function fixture(t) {
  const application = await createApp({connectDatabase:false});
  t.after(() => application.close());
  const calls = [];
  const services = application.services;
  services.auth.identify = async token => {
    if (token !== 'valid') throw new UnauthorizedError('Войдите в аккаунт');
    return user;
  };
  services.realtime.changed = async (...args) => { calls.push(['changed',...args]); };
  function stub(service, method, result = {ok:true}) {
    services[service][method] = async (...args) => { calls.push([service+'.'+method,...args]);return result; };
  }
  return {application,services,calls,stub,http:request(application.app)};
}

test('Business routes keep their URLs, methods, success statuses and service handoff',async t=>{
  const f = await fixture(t);
  const cases = [
    ['post','/auth/register','auth','register',{name:'Тестовый Пользователь',email:'user@example.test',password:'StrongPass123!'}],
    ['post','/auth/login','auth','login',{email:'user@example.test',password:'x'}],
    ['post','/auth/refresh','auth','refresh',{refreshToken:'r'.repeat(64)}],
    ['post','/auth/logout','auth','logout',{refreshToken:'r'.repeat(64)}],
    ['get','/users/me','users','me'],['patch','/users/me','users','update',{dark:true}],
    ['get','/meetings','meetings','list'],['post','/meetings','meetings','create',input],
    ['patch',`/meetings/${meeting}`,'meetings','edit',input],
    ['put',`/meetings/${meeting}/preferences`,'meetings','preferences',{budget:1500,cuisines:[]}],
    ['get',`/meetings/${meeting}/recommendations`,'discovery','list'],
    ['post',`/meetings/${meeting}/recommendations/apply`,'discovery','apply'],
    ['post',`/meetings/${meeting}/candidates`,'meetings','propose',{restaurantId:restaurant}],
    ['put',`/meetings/${meeting}/vote`,'meetings','vote',{restaurantId:restaurant}],
    ['delete',`/meetings/${meeting}/candidates/${restaurant}`,'meetings','removeCandidate'],
    ['post',`/meetings/${meeting}/select`,'meetings','select'],
    ['post',`/meetings/${meeting}/booking`,'meetings','booking',{restaurantId:restaurant}],
    ['delete',`/meetings/${meeting}/booking`,'meetings','booking'],
    ['post',`/meetings/${meeting}/members`,'meetings','addMember',{email:'user@example.test'}],
    ['delete',`/meetings/${meeting}/members/${user}`,'meetings','removeMember'],
    ['post',`/meetings/${meeting}/invitations`,'meetings','invite'],
    ['post','/meetings/invitations/accept','meetings','accept',{token:'i'.repeat(64)}],
    ['get',`/meetings/${meeting}/messages`,'chat','list'],
    ['post',`/meetings/${meeting}/messages`,'chat','send',{text:'Привет'}],
    ['put',`/meetings/${meeting}/messages/${user}/reaction`,'chat','react',{liked:true}],
    ['get','/restaurants','restaurants','list'],['get','/restaurants/filters','restaurants','filters'],
    ['get','/restaurants/discovery','restaurants','discover'],['get','/restaurants/search','restaurants','search'],
    ['get',`/restaurants/${restaurant}/details`,'restaurants','details'],
  ];
  for (const [method,path,service,operation,body] of cases) {
    const result = {ok:true,meetingId:meeting,changed:true};
    f.stub(service,operation,result);
    f.calls.length=0;
    let req=f.http[method]('/api'+path).auth('valid',{type:'bearer'});
    if(body)req=req.send(body);
    const response=await req.expect(method==='post'?201:200);
    assert.deepEqual(response.body,result,path);
    const call=f.calls.find(call=>call[0]===service+'.'+operation);
    assert.ok(call,path+' must reach its service');
    if(service!=='auth' && operation!=='filters' && operation!=='details')assert.equal(call[1],user,path);
  }
});

test('Protected routes reject absent credentials and invalid data before service calls',async t=>{
  const f=await fixture(t);
  for(const path of ['/users/me','/meetings','/restaurants/filters',`/meetings/${meeting}/messages`]) {
    await f.http.get('/api'+path).expect(401);
  }
  f.stub('meetings','create');f.stub('meetings','vote');
  const badBodies=[{...input,admin:true},{...input,budget:'1500'},{...input,budget:1550},{...input,cuisines:['a','a']},{...input,cuisines:Array.from({length:100},(_,i)=>String(i)+'x'.repeat(50))},{...input,title:'  '},{...input,time:'25:00'}];
  for(const body of badBodies) await f.http.post('/api/meetings').auth('valid',{type:'bearer'}).send(body).expect(400);
  await f.http.put('/api/meetings/not-a-uuid/vote').auth('valid',{type:'bearer'}).send({restaurantId:restaurant}).expect(400);
  await f.http.get('/api/restaurants/discovery?distance=1').auth('valid',{type:'bearer'}).expect(400);
  assert.deepEqual(f.calls,[]);
  const malformed=await f.http.post('/api/auth/login').set('Content-Type','application/json').send('{broken').expect(400);
  assert.equal(malformed.body.statusCode,400);
  await f.http.get('/api/map-assets/%E0%A4%A').expect(400);
});

test('Query arrays, booleans and budget reach services as validated values; profile can clear an avatar',async t=>{
  const f=await fixture(t);f.stub('restaurants','discover');f.stub('users','update');
  await f.http.get('/api/restaurants/discovery').auth('valid',{type:'bearer'}).query({cuisines:['Итальянская','Русская'],budget:2000,openNow:false}).expect(200);
  assert.deepEqual(f.calls[0],['restaurants.discover',user,{cuisines:['Итальянская','Русская'],budget:2000,openNow:false}]);
  await f.http.get('/api/restaurants/discovery?openNow=wrong').auth('valid',{type:'bearer'}).expect(400);
  await f.http.patch('/api/users/me').auth('valid',{type:'bearer'}).send({avatarId:null}).expect(200);
  assert.deepEqual(f.calls.at(-1),['users.update',user,{avatarId:null}]);
});

test('ICS, file downloads, uploads and public map resources keep headers and limits',async t=>{
  const f=await fixture(t);f.stub('calendar','export','BEGIN:VCALENDAR\r\nEND:VCALENDAR');
  await f.http.get(`/api/meetings/${meeting}/calendar.ics`).auth('valid',{type:'bearer'}).expect(200).expect('Content-Type',/text\/calendar/).expect('Content-Disposition',`attachment; filename="meetly-${meeting}.ics"`);
  f.stub('files','download',{mime:'text/plain',name:'тест.txt',data:Buffer.from('hello')});
  await f.http.get(`/api/files/${user}?token=signed`).expect(200).expect('Cache-Control','private, no-store').expect('hello');
  f.stub('files','upload',{id:user});
  await f.http.post('/api/files').auth('valid',{type:'bearer'}).field('meetingId',meeting).attach('file',Buffer.from('hello'),'test.txt').expect(201);
  assert.equal(f.calls.at(-1)[3],meeting);
  await f.http.post('/api/files').auth('valid',{type:'bearer'}).attach('file',Buffer.alloc(10*1024*1024+1),'big.txt').expect(413);
  await f.http.post('/api/files').attach('file',Buffer.from('hello'),'test.txt').expect(401);
  await f.http.get('/api/health').expect(200,{status:'ok'});
  await f.http.get('/api/map').expect(200).expect('Content-Security-Policy',/frame-ancestors \*/);
  await f.http.get('/api/map-assets/leaflet.js').expect(200).expect('Cache-Control',/max-age=604800/);
  await f.http.get('/api/map-assets/package.json').expect(404);
  await f.http.get('/api/map-tiles/20/0/0.png').expect(404);
  await f.http.get('/api/docs').expect(404);
  await f.http.get('/api/docs/').expect(404);
  await f.http.get('/api/docs-json').expect(404);
});

test('Async service errors retain status codes and unknown failures hide internal diagnostics',async t=>{
  const f=await fixture(t);
  f.services.users.me=async()=>{throw new ForbiddenError('Нет доступа');};
  const denied=await f.http.get('/api/users/me').auth('valid',{type:'bearer'}).expect(403);
  assert.equal(denied.body.message.message,'Нет доступа');
  f.services.users.me=async()=>{throw new Error('private-diagnostic');};
  const failed=await f.http.get('/api/users/me').auth('valid',{type:'bearer'}).expect(500);
  assert.deepEqual(failed.body,{statusCode:500,message:'Внутренняя ошибка сервера'});
  await f.http.get('/api/unknown').expect(404);
  await f.http.post('/api/restaurants').auth('valid',{type:'bearer'}).send({name:'Новый ресторан'}).expect(404);
});

test('Login rate limits and browser CORS remain enabled',async t=>{
  const f=await fixture(t);f.stub('auth','login');
  for(let i=0;i<10;i++) await f.http.post('/api/auth/login').send({email:'a@example.test',password:'x'}).expect(201);
  await f.http.post('/api/auth/login').send({email:'a@example.test',password:'x'}).expect(429);
  const origin=(process.env.WEB_ORIGINS??'http://localhost:8081').split(',')[0];
  await f.http.get('/api/health').set('Origin',origin).expect('Access-Control-Allow-Origin',origin);
  const response=await f.http.get('/api/health').set('Origin','https://untrusted.example');
  assert.equal(response.headers['access-control-allow-origin'],undefined);
});

test('JWT signature, expiration and token purpose survive the replacement of JwtService',()=>{
  const tokens=new Tokens('test-secret-'.repeat(4));
  const token=tokens.sign({sub:user,sid:meeting,kind:'access'},900);
  const payload=tokens.verify(token);
  assert.equal(payload.sub,user);assert.equal(payload.kind,'access');assert.equal(payload.exp-payload.iat,900);
  assert.throws(()=>tokens.verify(tokens.sign({sub:user,kind:'file'},-1)));
  assert.throws(()=>new Tokens('different-secret-'.repeat(4)).verify(token));
});

test('Socket.IO authenticates connections and sends meeting changes only to current recipients',{timeout:5000},async t=>{
  const f=await fixture(t),other=randomUUID();
  f.services.auth.identify=async token=>{if(token==='owner')return user;if(token==='other')return other;throw new UnauthorizedError();};
  let members=[{userId:user},{userId:other}];
  f.services.db.member.findMany=async()=>members;
  // В этом тесте выполняется настоящий метод рассылки, без замены на заглушку.
  const {Realtime}=require('../dist/infrastructure/realtime');
  f.services.realtime.changed=Realtime.prototype.changed;
  await f.application.listen(0,'127.0.0.1');
  const url=`http://127.0.0.1:${f.application.server.address().port}`;
  const sockets=[];t.after(()=>sockets.forEach(socket=>socket.disconnect()));
  async function connect(token) {
    const socket=io(url,{auth:{token},transports:['websocket'],reconnection:false});sockets.push(socket);
    await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);setTimeout(()=>reject(new Error('Socket connect timeout')),2000).unref();});
    return socket;
  }
  const ownerSocket=await connect('owner'),otherSocket=await connect('other');
  const invalidSocket=await connect('invalid');
  if(invalidSocket.connected)await new Promise(resolve=>invalidSocket.once('disconnect',resolve));
  assert.equal(invalidSocket.connected,false);
  const events=[];otherSocket.on('meeting.changed',event=>events.push(event));
  const changed=new Promise(resolve=>ownerSocket.once('meeting.changed',resolve));
  await f.services.realtime.changed(meeting);assert.deepEqual(await changed,{meetingId:meeting});
  await new Promise(resolve=>setTimeout(resolve,30));assert.equal(events.length,1);
  members=[{userId:user}];
  await f.services.realtime.changed(meeting);
  await new Promise(resolve=>setTimeout(resolve,30));assert.equal(events.length,1);
});
