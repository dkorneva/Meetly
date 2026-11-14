const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Prisma}=require('@prisma/client');
const {Database}=require('../dist/infrastructure/database');

const conflict=()=>new Prisma.PrismaClientKnownRequestError('transaction conflict',{code:'P2034',clientVersion:'6.19.3'});

test('serializable transactions retry only retryable conflicts, at most three attempts',async()=>{
  let attempts=0;
  const result=await Database.prototype.atomic.call({$transaction:async(action,options)=>{
    assert.equal(options.isolationLevel,'Serializable');
    if(++attempts<3)throw conflict();
    return action({marker:'committed'});
  }},async tx=>tx.marker);
  assert.equal(result,'committed');assert.equal(attempts,3);
  attempts=0;
  await assert.rejects(Database.prototype.atomic.call({$transaction:async()=>{attempts++;throw conflict();}},async()=>{}),e=>e.code==='P2034');
  assert.equal(attempts,3);
});

test('validation and arbitrary SQL errors are not retried or converted into successful writes',async()=>{
  let attempts=0;const failure=new Error('constraint violation');
  await assert.rejects(Database.prototype.atomic.call({$transaction:async()=>{attempts++;throw failure;}},async()=>{}),e=>e===failure);
  assert.equal(attempts,1);
});
