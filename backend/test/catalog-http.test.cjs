const {test}=require('node:test');
const assert=require('node:assert/strict');
const {getJson,retryDelay}=require('../scripts/lib/catalog-http.cjs');
const {buildSnapshot}=require('../scripts/lib/osm-catalog.cjs');

test('Overpass way centers do not require downloading building geometry',()=>{
  const nodes=Array.from({length:60},(_,i)=>({type:'node',id:i+1,lat:55.7558+0.01*Math.sin(i*Math.PI/30),lon:37.6176+0.01*Math.cos(i*Math.PI/30)}));
  const ring={type:'way',id:100,nodes:[...nodes.map(n=>n.id),1]};
  const relation={type:'relation',id:2094267,version:1,members:[{type:'way',ref:100}]};
  const restaurant={type:'way',id:200,version:1,nodes:[999],center:{lat:55.7558,lon:37.6176},tags:{amenity:'restaurant',name:'Test restaurant'}};
  const {snapshot}=buildSnapshot({elements:[...nodes,ring,relation,restaurant],source:'https://overpass-api.de/api/interpreter'});
  assert.equal(snapshot.places.length,1);
  assert.equal(snapshot.places[0].sourceId,'osm:way/200');
  assert.equal(snapshot.places[0].latitude,55.7558);
  assert.equal(snapshot.source,'https://overpass-api.de/api/interpreter');
});

test('HTTP 429 respects Retry-After, then returns the complete response',async()=>{
  let calls=0;const delays=[];
  const result=await getJson('https://catalog.example/',{}, {
    fetch:async()=>++calls===1?new Response('',{status:429,headers:{'Retry-After':'7'}}):Response.json({rows:[{id:1}]}),
    sleep:async ms=>delays.push(ms),log:()=>{},
  });
  assert.equal(calls,2);assert.deepEqual(delays,[7000]);assert.deepEqual(result.rows,[{id:1}]);
  assert.equal(retryDelay('Thu, 01 Jan 1970 00:00:10 GMT',5,0),10000);
  assert.equal(retryDelay('invalid',5000),5000);
});

test('long rate limits and invalid queries are not retried; partial responses are rejected',async()=>{
  for(const response of [new Response('',{status:429,headers:{'Retry-After':'120'}}),new Response('',{status:400}),Response.json({remark:'Query timed out',elements:[]})]){
    let calls=0;
    await assert.rejects(getJson('https://catalog.example/',{}, {
      fetch:async()=>{calls++;return response;},sleep:async()=>assert.fail('Must not retry'),
    }));
    assert.equal(calls,1);
  }
});

test('network errors are retried a bounded number of times and reported with their cause',async()=>{
  let calls=0;const delays=[];
  await assert.rejects(getJson('https://catalog.example/',{}, {
    fetch:async()=>{calls++;throw new TypeError('fetch failed',{cause:{code:'ECONNRESET'}});},
    sleep:async ms=>delays.push(ms),log:()=>{},
  }),/ECONNRESET/);
  assert.equal(calls,3);assert.deepEqual(delays,[5000,10000]);
});
