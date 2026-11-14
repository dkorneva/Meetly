const fs=require('node:fs/promises');
const path=require('node:path');
const {buildSnapshot,inside}=require('./lib/osm-catalog.cjs');
const {getJson}=require('./lib/catalog-http.cjs');
const root=path.resolve(__dirname,'../catalog');
const OVERPASS='https://overpass-api.de/api/interpreter';
const PRICES='https://apiv2.restorating.ru/api/places/catalogue/?city=msk&state=open&limit=500&sort=rating';
/**
 * Выполняет команду обслуживания каталога и завершает процесс с ошибкой при неполных данных.
 */
async function main(){
  const sourceIndex=process.argv.indexOf('--from-map');let map;
  if(sourceIndex>=0)map=JSON.parse(await fs.readFile(process.argv[sourceIndex+1],'utf8'));
  else{
    console.log('OSM: загрузка границы Садового кольца...');
    const ring=await getJson('https://api.openstreetmap.org/api/0.6/relation/2094267/full.json');
    console.log('OSM: загрузка только ресторанов через Overpass...');
    const query='[out:json][timeout:90];nwr["amenity"="restaurant"](55.725,37.57,55.785,37.66);out meta center;';
    let restaurants,source=OVERPASS;
    try{
      restaurants=await getJson(OVERPASS,{
        method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({data:query}),timeout:45000,attempts:1,
      });
    }catch(error){
      console.warn(`Overpass недоступен (${error.message}). Загрузка небольшими участками через OSM API.`);
      const collected=new Map();
      /**
       * Загружает участок карты; слишком большой запрос делит на четыре меньших участка.
       * @param box Прямоугольник [запад, юг, восток, север].
       * @param depth Текущая глубина деления участка.
       */
      async function tile(box,depth=0){
        const address='https://api.openstreetmap.org/api/0.6/map.json?bbox='+box.map(n=>n.toFixed(5)).join(',');
        try{
          const data=await getJson(address);
          if(!Array.isArray(data.elements))throw Error('Некорректный ответ участка OSM');
          for(const e of data.elements)collected.set(e.type+'/'+e.id,e);
        }catch(e){
          if(e.status!==400||depth>=4)throw e;
          const [x1,y1,x2,y2]=box,x=(x1+x2)/2,y=(y1+y2)/2;
          for(const b of [[x1,y1,x,y],[x,y1,x2,y],[x1,y,x,y2],[x,y,x2,y2]])await tile(b,depth+1);
        }
      }
      for(let x=0;x<3;x++)for(let y=0;y<3;y++){
        console.log(`OSM: участок ${x*3+y+1}/9...`);
        await tile([37.57+x*.03,55.725+y*.02,37.60+x*.03,55.745+y*.02]);
      }
      restaurants={elements:[...collected.values()]};source='https://api.openstreetmap.org/api/0.6/map';
    }
    if(!Array.isArray(ring.elements)||!Array.isArray(restaurants.elements))throw Error('Некорректный ответ OpenStreetMap');
    const elements=new Map([...ring.elements,...restaurants.elements].map(e=>[e.type+'/'+e.id,e]));
    map={elements:[...elements.values()],importedAt:new Date().toISOString(),source};
  }
  const {boundary,snapshot}=buildSnapshot(map);
  if(snapshot.places.length<100)throw Error('Источник вернул менее 100 ресторанов; сохранённые данные не изменены');
  console.log(`OSM: ${snapshot.places.length} ресторанов внутри Садового кольца`);
  const skipPrices=process.argv.includes('--skip-prices');
  let url=skipPrices?null:PRICES;const rows=[];let pages=0;const visited=new Set();
  while(url&&pages++<100){
    const parsed=new URL(url);
    if(parsed.origin!=='https://apiv2.restorating.ru'||parsed.pathname!=='/api/places/catalogue/'||visited.has(url))throw Error('Некорректная ссылка следующей страницы Restorating');
    visited.add(url);
    console.log(`Restorating: страница ${pages}...`);
    const j=await getJson(url);
    if(!Array.isArray(j.rows))throw Error('Некорректный ответ Restorating');
    rows.push(...j.rows.filter(p=>p.position&&inside([p.position.lng,p.position.lat],boundary.geometry.coordinates[0])).map(p=>({id:p.id,name:p.name,address:p.address,position:p.position,bill:p.bill,kitchens:p.kitchens,state:p.state_code,slug:p.slug,working_hours:p.working_hours})));url=j.next;
  }
  if(url)throw Error('Не все страницы источника цен прочитаны');
  if(!skipPrices&&rows.length<100)throw Error('Источник цен вернул менее 100 записей; сохранённые данные не изменены');
  // Publish only after every requested source has been downloaded and validated.
  await fs.mkdir(path.join(root,'osm'),{recursive:true});
  await fs.writeFile(path.join(root,'osm/garden-ring.geojson'),JSON.stringify(boundary,null,2));
  await fs.writeFile(path.join(root,'osm/restaurants.json'),JSON.stringify(snapshot,null,2));
  if(!skipPrices){
    await fs.mkdir(path.join(root,'imports'),{recursive:true});
    await fs.writeFile(path.join(root,'imports/restorating.json'),JSON.stringify({source:PRICES,fetchedAt:new Date().toISOString(),rows},null,2));
    console.log(`Restorating: ${rows.length} записей внутри полигона для сопоставления цен`);
  }
  console.log('Снимки сохранены. База данных не изменялась.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
