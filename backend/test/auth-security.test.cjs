const {test}=require('node:test');
const assert=require('node:assert/strict');
const argon2=require('argon2');
const {fixture}=require('./helpers/fixture.cjs');
const {tokenHash}=require('../dist/application/auth.service');

test('Authentication security with real HTTP and SQL sessions',async t=>{
  const f=await fixture(t),user=await f.register('auth');let current=user;
  await t.test('password is hashed and public profile does not expose credentials',async()=>{
    const stored=await f.db.user.findUniqueOrThrow({where:{id:user.id}});
    assert.notEqual(stored.passwordHash,user.password);
    assert.ok(await argon2.verify(stored.passwordHash,user.password));
    const profile=(await f.auth(f.http.get('/api/users/me'),user).expect(200)).body;
    for(const field of ['passwordHash','sessions','tokenHash','reminders'])assert.equal(field in profile,false);
    const session=await f.db.session.findUnique({where:{tokenHash:tokenHash(user.refreshToken)}});
    assert.ok(session);assert.notEqual(session.tokenHash,user.refreshToken);
  });
  await t.test('email normalization prevents duplicate registration; login failures are uniform',async()=>{
    await f.http.post('/api/auth/register').send({name:'Другой Пользователь',email:user.email.toUpperCase(),password:user.password}).expect(409);
    const wrong=await f.http.post('/api/auth/login').send({email:user.email,password:'WrongPassword123!'}).expect(401);
    const missing=await f.http.post('/api/auth/login').send({email:'missing@example.test',password:'WrongPassword123!'}).expect(401);
    assert.deepEqual(wrong.body,missing.body);
    const login=await f.http.post('/api/auth/login').send({email:user.email.toUpperCase(),password:user.password}).expect(201);
    await f.http.get('/api/users/me').auth(login.body.accessToken,{type:'bearer'}).expect(200);
  });
  await t.test('two simultaneous refresh requests consume the token only once',async()=>{
    const results=await Promise.all([0,1].map(()=>f.http.post('/api/auth/refresh').send({refreshToken:user.refreshToken})));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,401]);
    current=results.find(r=>r.status===201).body;
    assert.equal(await f.db.session.count({where:{tokenHash:tokenHash(user.refreshToken)}}),0);
    assert.equal(await f.db.session.count({where:{tokenHash:tokenHash(current.refreshToken)}}),1);
    await f.auth(f.http.get('/api/users/me'),user).expect(401);
    await f.auth(f.http.get('/api/users/me'),current).expect(200);
  });
  await t.test('tampered access and refresh tokens cannot authorize a request',async()=>{
    const parts=current.accessToken.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);
    await f.http.get('/api/users/me').auth(parts.join('.'),{type:'bearer'}).expect(401);
    await f.http.get('/api/users/me').auth(current.refreshToken,{type:'bearer'}).expect(401);
  });
  await t.test('logout is idempotent and immediately invalidates access and refresh',async()=>{
    for(let i=0;i<2;i++)await f.http.post('/api/auth/logout').send({refreshToken:current.refreshToken}).expect(201);
    await f.auth(f.http.get('/api/users/me'),current).expect(401);
    await f.http.post('/api/auth/refresh').send({refreshToken:current.refreshToken}).expect(401);
  });
  await t.test('an expired database session cannot be refreshed or used by a valid JWT',async()=>{
    const login=(await f.http.post('/api/auth/login').send({email:user.email,password:user.password}).expect(201)).body;
    await f.db.session.update({where:{tokenHash:tokenHash(login.refreshToken)},data:{expiresAt:new Date(Date.now()-1000)}});
    await f.auth(f.http.get('/api/users/me'),login).expect(401);
    await f.http.post('/api/auth/refresh').send({refreshToken:login.refreshToken}).expect(401);
  });
});
