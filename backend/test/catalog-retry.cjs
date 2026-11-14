const assert=require('node:assert/strict');
const {getJson}=require('../scripts/lib/catalog-http.cjs');
(async()=>{
  const base=process.env.CATALOG_SIM_URL??'http://127.0.0.1:4011/catalog';
  const started=Date.now();
  const result=await getJson(`${base}/retry?run=${Date.now()}`);
  assert.equal(result.attempts,2);
  assert.ok(Date.now()-started>=1000,'Retry-After must be respected');
  await assert.rejects(getJson(`${base}/invalid`),/HTTP 400/);
  await assert.rejects(getJson(`${base}/partial`),/неполный ответ/);
  await assert.rejects(getJson(`${base}/unavailable`,{attempts:1}),/HTTP 503/);
  console.log('Simulation passed: 429 → wait → 200; 400, 503 and incomplete responses rejected.');
})().catch(e=>{console.error(e);process.exitCode=1;});
