const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {fixture}=require('./helpers/fixture.cjs');
const {tokenHash}=require('../dist/application/auth.service');

test('Invitations enforce expiry, revocation and closed voting without unwanted membership',async t=>{
  const f=await fixture(t),owner=await f.register('invite-owner'),guest=await f.register('invite-guest');
  const meeting=await f.meeting(owner,'Проверка приглашений');
  const invite=async()=>(await f.auth(f.http.post(`/api/meetings/${meeting.id}/invitations`),owner).send({}).expect(201)).body.token;
  const accept=token=>f.auth(f.http.post('/api/meetings/invitations/accept'),guest).send({token});
  const count=()=>f.db.member.count({where:{meetingId:meeting.id,userId:guest.id}});
  await t.test('unknown, expired and revoked tokens cannot add a member',async()=>{
    await accept(randomBytes(32).toString('base64url')).expect(400);
    const expired=await invite();
    await f.db.invitation.update({where:{tokenHash:tokenHash(expired)},data:{expiresAt:new Date(Date.now()-1000)}});
    await accept(expired).expect(400);
    const revoked=await invite();
    await f.db.invitation.update({where:{tokenHash:tokenHash(revoked)},data:{revoked:true}});
    await accept(revoked).expect(400);assert.equal(await count(),0);
  });
  await t.test('a valid token adds only one membership when accepted repeatedly',async()=>{
    const token=await invite();
    await accept(token).expect(201);await accept(token).expect(201);
    assert.equal(await count(),1);
    await f.auth(f.http.delete(`/api/meetings/${meeting.id}/members/${guest.id}`),owner).expect(200);
  });
  await t.test('a token issued before selection cannot bypass closed voting',async()=>{
    const token=await invite();
    const restaurant=await f.db.restaurant.findFirstOrThrow({where:{catalogArea:'garden-ring',catalogActive:true}});
    await f.auth(f.http.post(`/api/meetings/${meeting.id}/candidates`),owner).send({restaurantId:restaurant.id}).expect(201);
    await f.auth(f.http.put(`/api/meetings/${meeting.id}/vote`),owner).send({restaurantId:restaurant.id}).expect(200);
    await f.auth(f.http.post(`/api/meetings/${meeting.id}/select`),owner).send({}).expect(201);
    await accept(token).expect(409);assert.equal(await count(),0);
  });
});
