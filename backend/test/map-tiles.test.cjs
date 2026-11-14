const {test}=require('node:test');
const assert=require('node:assert/strict');
const {MapTiles}=require('../dist/infrastructure/map-tiles');

test('map tiles validate coordinates, deduplicate requests and cache successful PNGs',async()=>{
  const original=global.fetch,key=process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY='test-key';
  let calls=0;
  const png=Buffer.from([137,80,78,71,13,10,26,10,1]);
  global.fetch=async url=>{calls++;assert.match(url,/maps\.geoapify\.com\/v1\/tile\/positron/);return new Response(png,{headers:{'content-type':'image/png'}})};
  try{
    const tiles=new MapTiles();
    await assert.rejects(tiles.get('20','0','0'));
    await assert.rejects(tiles.get('1','2','0'));
    await assert.rejects(tiles.get('1','../x','0'));
    assert.equal(calls,0);
    const results=await Promise.all([tiles.get('13','4952','2560'),tiles.get('13','4952','2560')]);
    assert.deepEqual(results,[png,png]);
    assert.deepEqual(await tiles.get('13','4952','2560'),png);
    assert.equal(calls,1);
  }finally{global.fetch=original;if(key===undefined)delete process.env.GEOAPIFY_API_KEY;else process.env.GEOAPIFY_API_KEY=key}
});

test('failed tiles are not cached or returned as images, and credentials stay private',async()=>{
  const original=global.fetch,key=process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY='private-test-key';let calls=0;
  global.fetch=async()=>{calls++;return new Response('private-test-key quota exceeded',{status:429})};
  try{
    const tiles=new MapTiles();
    for(let i=0;i<2;i++)await assert.rejects(tiles.get('13','4952','2560'),e=>!e.message.includes('private-test-key')&&e.status===503);
    assert.equal(calls,2);
  }finally{global.fetch=original;if(key===undefined)delete process.env.GEOAPIFY_API_KEY;else process.env.GEOAPIFY_API_KEY=key}
});
