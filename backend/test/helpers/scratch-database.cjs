require('dotenv/config');
const {PrismaClient}=require('@prisma/client');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const exec=promisify(execFile);
const backend=path.resolve(__dirname,'../..');

/** Creates a separate SQL database. Never migrates or imports into the application database. */
async function scratchDatabase(t){
  const name='Meetly_test_'+randomUUID().replaceAll('-','');
  const original=process.env.DATABASE_URL;
  if(!original || !/;database=[^;]+/i.test(original))throw Error('DATABASE_URL must include database=');
  const url=original.replace(/;database=[^;]+/i,`;database=${name}`);
  const admin=new PrismaClient();
  let created=false,db,folder;
  t.after(async()=>{
    try{
      if(db)await db.$disconnect();
      // Only the randomly named database made by this helper may be deleted.
      if(created){
        if(!/^Meetly_test_[a-f0-9]{32}$/.test(name))throw Error('Unsafe test database name');
        await admin.$executeRawUnsafe(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE`);
        await admin.$executeRawUnsafe(`DROP DATABASE [${name}]`);
      }
    }finally{
      await admin.$disconnect();
      if(folder){
        const target=path.resolve(folder);
        if(path.dirname(target)!==path.resolve(os.tmpdir()) || !path.basename(target).startsWith('meetly-tests-'))throw Error('Unsafe temporary folder');
        await fs.rm(target,{recursive:true,force:true});
      }
    }
  });
  await admin.$executeRawUnsafe(`CREATE DATABASE [${name}]`);created=true;
  db=new PrismaClient({datasources:{db:{url}}});
  folder=await fs.mkdtemp(path.join(os.tmpdir(),'meetly-tests-'));
  const env={...process.env,DATABASE_URL:url,CATALOG_DIR:folder};
  async function run(script,args=[]){
    return exec(process.execPath,[path.join(backend,script),...args],{
      cwd:backend,env,windowsHide:true,timeout:120000,maxBuffer:1024*1024,
    });
  }
  const deploy=()=>run('node_modules/prisma/build/index.js',['migrate','deploy']);
  return {db,folder,run,deploy};
}
module.exports={scratchDatabase};
