const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {fixture}=require('./helpers/fixture.cjs');
const {HIDDEN_BOOKING_NOTICE}=require('../dist/domain/chat');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGmQAAAAASUVORK5CYII=','base64');

test('Chat pagination and file access enforce meeting boundaries',async t=>{
  const f=await fixture(t),owner=await f.register('chat-owner'),member=await f.register('chat-member');
  const a=await f.meeting(owner,'Основная проверка'),b=await f.meeting(owner,'Другая переписка');
  const foreignId=randomUUID(),base=Date.now()-5000;
  await f.db.message.updateMany({where:{meetingId:a.id},data:{createdAt:new Date(base-1000)}});
  await f.db.message.createMany({data:[
    ...Array.from({length:110},(_,i)=>({id:randomUUID(),meetingId:a.id,senderId:owner.id,text:`page-${i}`,createdAt:new Date(base+i*10)})),
    {id:randomUUID(),meetingId:a.id,senderId:owner.id,kind:'system',text:HIDDEN_BOOKING_NOTICE,createdAt:new Date(base+2000)},
    {id:foreignId,meetingId:b.id,senderId:owner.id,text:'foreign-message',createdAt:new Date(base+3000)},
  ]});
  await t.test('pagination has no duplicates, gaps, foreign messages or hidden notices',async()=>{
    let cursor;const seen=new Set(),numbers=[];let pages=0;
    do {
      const result=(await f.auth(f.http.get(`/api/meetings/${a.id}/messages`).query(cursor?{before:cursor}:{}),owner).expect(200)).body;
      assert.ok(result.items.length<=50);
      const dates=result.items.map(m=>new Date(m.createdAt).getTime());
      assert.deepEqual(dates,[...dates].sort((x,y)=>x-y));
      for(const m of result.items){
        assert.ok(!seen.has(m.id));seen.add(m.id);
        assert.equal(m.meetingId,a.id);assert.notEqual(m.text,HIDDEN_BOOKING_NOTICE);
        if(m.text.startsWith('page-'))numbers.push(Number(m.text.slice(5)));
      }
      cursor=result.nextCursor;pages++;assert.ok(pages<=3);
    }while(cursor);
    assert.equal(pages,3);assert.deepEqual(numbers.sort((x,y)=>x-y),Array.from({length:110},(_,i)=>i));
    const summaries=(await f.auth(f.http.get('/api/meetings'),owner).expect(200)).body;
    assert.equal(summaries.find(m=>m.id===a.id).lastMessage.text,'page-109');
  });
  await t.test('foreign and nonexistent cursors are rejected and outsiders cannot read messages',async()=>{
    await f.auth(f.http.get(`/api/meetings/${a.id}/messages`).query({before:foreignId}),owner).expect(400);
    await f.auth(f.http.get(`/api/meetings/${a.id}/messages`).query({before:randomUUID()}),owner).expect(400);
    await f.auth(f.http.get(`/api/meetings/${a.id}/messages`),member).expect(403);
  });
  let attachment,avatar;
  await t.test('avatar validation rejects empty requests, documents and another user\'s image',async()=>{
    await f.auth(f.http.post('/api/files'),owner).expect(400);
    await f.auth(f.http.post('/api/files'),owner).attach('file',Buffer.from('plain text'),{filename:'document.txt',contentType:'text/plain'}).expect(400);
    avatar=(await f.auth(f.http.post('/api/files'),owner).attach('file',png,{filename:'avatar.png',contentType:'image/png'}).expect(201)).body;
    await f.auth(f.http.patch('/api/users/me'),member).send({avatarId:avatar.id}).expect(400);
    await f.auth(f.http.patch('/api/users/me'),owner).send({avatarId:avatar.id}).expect(200);
  });
  await t.test('file tokens are bound to a file, expire and cannot be replaced by access tokens',async()=>{
    attachment=(await f.auth(f.http.post('/api/files'),owner).field('meetingId',a.id).attach('file',Buffer.from('private attachment'),{filename:'notes.txt',contentType:'text/plain'}).expect(201)).body;
    const signed=new URL(attachment.url);
    await f.http.get(signed.pathname+signed.search).expect(200).expect('Cache-Control','private, no-store');
    await f.http.get(`/api/files/${avatar.id}`).query({token:signed.searchParams.get('token')}).expect(403);
    await f.http.get(`/api/files/${attachment.id}`).query({token:owner.accessToken}).expect(403);
    const expired=await f.app.services.tokens.sign({sub:owner.id,fileId:attachment.id,kind:'file'},-1);
    await f.http.get(`/api/files/${attachment.id}`).query({token:expired}).expect(403);
  });
  await t.test('messages cannot reuse avatars or attachments from another meeting',async()=>{
    await f.auth(f.http.post(`/api/meetings/${a.id}/messages`),owner).send({text:'',fileId:avatar.id}).expect(400);
    await f.auth(f.http.post(`/api/meetings/${b.id}/messages`),owner).send({text:'',fileId:attachment.id}).expect(400);
    await f.auth(f.http.post(`/api/meetings/${a.id}/messages`),owner).send({text:'   '}).expect(400);
  });
  await t.test('removing a member immediately revokes previously issued file links',async()=>{
    await f.auth(f.http.post(`/api/meetings/${a.id}/members`),owner).send({email:member.email}).expect(201);
    await f.auth(f.http.post(`/api/meetings/${a.id}/messages`),owner).send({text:'Attachment',fileId:attachment.id}).expect(201);
    const page=(await f.auth(f.http.get(`/api/meetings/${a.id}/messages`),member).expect(200)).body;
    const item=page.items.find(m=>m.fileId===attachment.id);assert.ok(item);
    const url=new URL(item.attachment.uri);
    await f.http.get(url.pathname+url.search).expect(200);
    await f.auth(f.http.delete(`/api/meetings/${a.id}/members/${member.id}`),owner).expect(200);
    await f.http.get(url.pathname+url.search).expect(403);
    await f.auth(f.http.get(`/api/meetings/${a.id}/messages`),member).expect(403);
  });
  await t.test('oversized files and unsupported MIME types are rejected before being stored',async()=>{
    const before=await f.db.file.count({where:{ownerId:owner.id}});
    await f.auth(f.http.post('/api/files'),owner).field('meetingId',a.id).attach('file',Buffer.from('executable'),{filename:'run.exe',contentType:'application/octet-stream'}).expect(400);
    await f.auth(f.http.post('/api/files'),owner).attach('file',Buffer.alloc(10*1024*1024+1),{filename:'large.png',contentType:'image/png'}).expect(413);
    assert.equal(await f.db.file.count({where:{ownerId:owner.id}}),before);
  });
});
