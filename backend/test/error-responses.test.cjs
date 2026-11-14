const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Prisma}=require('@prisma/client');
const {errorResponse}=require('../dist/http/error-handler');
const {RuleViolation}=require('../dist/domain/meeting-rules');

function responseFor(error) {
  const body = errorResponse(error);
  return {status: body.statusCode, body};
}

test('database conflicts and missing records have stable public HTTP responses',()=>{
  for(const [code,status] of [['P2002',409],['P2025',404],['P2034',409]]){
    const result=responseFor(new Prisma.PrismaClientKnownRequestError('internal SQL diagnostic',{code,clientVersion:'6.19.3'}));
    assert.equal(result.status,status);assert.equal(result.body.statusCode,status);
    assert.ok(!JSON.stringify(result.body).includes('internal SQL diagnostic'));
  }
});
test('unexpected failures do not disclose stack traces, SQL or request secrets',()=>{
  const result=responseFor(new Error('private-diagnostic-marker'));
  assert.deepEqual(result,{status:500,body:{statusCode:500,message:'Внутренняя ошибка сервера'}});
});
test('business rule conflicts retain an actionable message and HTTP 409',()=>{
  const result=responseFor(new RuleViolation('Ничья: участникам нужно изменить голоса'));
  assert.equal(result.status,409);assert.equal(result.body.message,'Ничья: участникам нужно изменить голоса');
});
