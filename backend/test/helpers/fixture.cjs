require('dotenv/config');
const request=require('supertest');
const {createApp}=require('../../dist/main');
const {Database}=require('../../dist/infrastructure/database');

/** Creates isolated users/meetings and deletes only records owned by this fixture. */
async function fixture(t) {
  const app=await createApp();await app.init();
  const db=app.get(Database),http=request(app.getHttpServer());
  const users=[],meetings=[];
  t.after(async()=>{
    try {
      await db.user.updateMany({where:{id:{in:users}},data:{avatarId:null}});
      await db.reaction.deleteMany({where:{message:{meetingId:{in:meetings}}}});
      await db.message.deleteMany({where:{meetingId:{in:meetings}}});
      await db.file.deleteMany({where:{ownerId:{in:users}}});
      await db.vote.deleteMany({where:{meetingId:{in:meetings}}});
      await db.candidate.deleteMany({where:{meetingId:{in:meetings}}});
      await db.invitation.deleteMany({where:{meetingId:{in:meetings}}});
      await db.member.deleteMany({where:{meetingId:{in:meetings}}});
      await db.meeting.deleteMany({where:{id:{in:meetings}}});
      await db.session.deleteMany({where:{userId:{in:users}}});
      await db.user.deleteMany({where:{id:{in:users}}});
    } finally { await app.close(); }
  });
  async function register(label='user') {
    const email=`${label}-${require('node:crypto').randomUUID()}@example.test`;
    const password='StrongPass123!';
    const response=await http.post('/api/auth/register').send({name:'Тестовый Пользователь',email,password}).expect(201);
    const tokens=response.body;
    const id=JSON.parse(Buffer.from(tokens.accessToken.split('.')[1],'base64url')).sub;
    users.push(id);
    return {id,email,password,...tokens};
  }
  const auth=(req,user)=>req.auth(user.accessToken,{type:'bearer'});
  async function meeting(user,title='Изолированная проверка') {
    const date=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    const response=await auth(http.post('/api/meetings'),user).send({title,date,time:'19:00',budget:1500,cuisines:[],city:'Москва',format:'В помещении'}).expect(201);
    meetings.push(response.body.id);return response.body;
  }
  return {app,db,http,register,auth,meeting};
}
module.exports={fixture};
