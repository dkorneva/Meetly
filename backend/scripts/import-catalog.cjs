require('dotenv/config');
const fs=require('node:fs/promises');
const path=require('node:path');
const {PrismaClient}=require('@prisma/client');
const {AREA,inside,normalize,distance,cuisines,matchPrice}=require('./lib/osm-catalog.cjs');
// Можно указать отдельную папку снимков, например для проверки импорта на тестовой базе.
const root=process.env.CATALOG_DIR?path.resolve(process.env.CATALOG_DIR):path.resolve(__dirname,'../catalog');
const OpeningHours=require('opening_hours');
/**
 * Преобразует расписание Restorating в строку opening_hours.
 */
function hoursFromApi(row){
  const days=['Mo','Tu','We','Th','Fr','Sa','Su'];
  return (row.working_hours||[]).flatMap(group=>group.time_value||[]).filter(v=>!v.is_closed&&/^\d{2}:\d{2}/.test(v.start||'')&&/^\d{2}:\d{2}/.test(v.end||'')).map(v=>`${days[Number(v.day_of_week)]} ${v.start.slice(0,5)}-${v.end.slice(0,5)==='00:00'?'24:00':v.end.slice(0,5)}`).join('; ');
}
/**
 * Выполняет команду обслуживания каталога и завершает процесс с ошибкой при неполных данных.
 */
async function main(){
  const snapshot=JSON.parse(await fs.readFile(path.join(root,'osm/restaurants.json'),'utf8'));
  const boundary=JSON.parse(await fs.readFile(path.join(root,'osm/garden-ring.geojson'),'utf8'));
  let prices;
  try {
    prices=JSON.parse(await fs.readFile(path.join(root,'imports/restorating.json'),'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw Error('Нет выгрузки Restorating. Сначала выполните npm run catalog:fetch, затем npm run catalog:import');
    throw error;
  }
  if(snapshot.places.length<100)throw Error('Подозрительно маленький снимок: импорт отменён');
  const candidates=snapshot.places.map(p=>{
    const match=matchPrice(p,prices.rows);if(!match)return null;
    const openingHours=p.tags.opening_hours||hoursFromApi(match.row);
    const codes=cuisines(p.tags,match.row.kitchens?.map(k=>k.name)||[]);
    if(!(p.address||match.row.address)||!openingHours||!codes.length||!(p.tags.phone||p.tags['contact:phone'])||!(p.tags.website||p.tags['contact:website']))return null;
    try{new OpeningHours(openingHours)}catch{return null}
    return{...p,match,openingHours,codes};
  }).filter(Boolean).sort((a,b)=>Number(b.match.exact)-Number(a.match.exact)||a.match.meters-b.match.meters||a.sourceId.localeCompare(b.sourceId));
  const selected=new Map();
  for(const code of ['vegetarian','japanese','italian','russian','bar','coffee'])for(const p of candidates.filter(p=>p.codes.includes(code)).slice(0,15))selected.set(p.sourceId,p);
  for(const p of candidates){if(selected.size>=200)break;selected.set(p.sourceId,p)}
  const places=[...selected.values()];
  if(places.length<180)throw Error(`Полных записей только ${places.length}: импорт отменён, проверьте источники`);
  const seen=new Set();
  for(const p of places){
    if(seen.has(p.sourceId)||!inside([p.longitude,p.latitude],boundary.geometry.coordinates[0]))throw Error(`Некорректная запись: ${p.sourceId}`);
    seen.add(p.sourceId);
  }
  if(process.argv.includes('--dry-run')){
    console.log(JSON.stringify({dryRun:true,total:places.length,eligible:candidates.length}));
    return;
  }
  const db=new PrismaClient();const report={source:snapshot.source,osmFetchedAt:snapshot.fetchedAt,priceApi:prices.source,pricesFetchedAt:prices.fetchedAt,total:places.length,eligible:candidates.length,selection:'До 200 записей: обязательны средний чек, адрес, кухня, контакты и валидные часы работы; обеспечено разнообразие кухонь',withPrice:0,withoutPrice:0,reusedIds:0,matches:[]};
  try{
    const before=await db.restaurant.findMany();
    const staleWhere={catalogArea:AREA,sourceId:{notIn:[...seen]}};
    const staleIds=(await db.restaurant.findMany({where:staleWhere,select:{id:true}})).map(r=>r.id);
    if(staleIds.length && (await db.candidate.count({where:{restaurantId:{in:staleIds}}}) || await db.meeting.count({where:{restaurantId:{in:staleIds}}})))
      throw Error('Импорт отменён: удаляемые заведения используются во встречах. История сохранена.');
    const claimed=new Set();
    for(const p of places){
      const match=p.match, tags=p.tags;
      const extra=match?.row.kitchens?.map(k=>k.name)||[];
      const codes=p.codes;
      const existing=before.find(r=>r.sourceId===p.sourceId)||before.filter(r=>!claimed.has(r.id)&&!r.osmId&&normalize(r.name)===normalize(p.name)&&distance(r,p)<30).sort((a,b)=>distance(a,p)-distance(b,p))[0];
      const data={sourceId:p.sourceId,source:'osm',providerId:'',name:p.name.slice(0,150),address:(p.address||match.row.address).slice(0,500),city:'Москва',district:(tags['addr:suburb']||tags['addr:district']||'Центр').slice(0,100),latitude:p.latitude,longitude:p.longitude,
        cuisine:codes.join(';').slice(0,150),phone:(tags.phone||tags['contact:phone']||'').slice(0,50),website:(tags.website||tags['contact:website']||'').slice(0,1000),openingHours:p.openingHours.slice(0,500),outdoor:tags.outdoor_seating==='yes',
        catalogArea:AREA,osmType:p.osmType,osmId:p.osmId,osmVersion:p.osmVersion,osmUpdatedAt:p.osmUpdatedAt?new Date(p.osmUpdatedAt):null,importedAt:new Date(snapshot.fetchedAt),rawTags:JSON.stringify(tags),
        dietVegetarian:tags['diet:vegetarian']|| (codes.includes('vegetarian')?'yes':'unknown'),dietVegan:tags['diet:vegan']||(codes.includes('vegan')?'yes':'unknown'),
        price:match?Math.round(match.row.bill):null,priceCurrency:'RUB',priceSource:match?`https://www.restorating.ru/msk/catalogue/${match.row.slug}`:null,priceSourceId:match?String(match.row.id):null,priceFetchedAt:match?new Date(prices.fetchedAt):null,priceMatchDistance:match?match.meters:null};
      const row=await db.$transaction(async tx=>{
        const r=existing?await tx.restaurant.update({where:{id:existing.id},data}):await tx.restaurant.create({data});
        await tx.restaurantCuisine.deleteMany({where:{restaurantId:r.id}});
        if(codes.length)await tx.restaurantCuisine.createMany({data:codes.map(code=>({restaurantId:r.id,code}))});
        return r;
      });
      claimed.add(row.id);if(existing)report.reusedIds++;
      if(match){report.withPrice++;report.matches.push({osm:p.sourceId,name:p.name,price:data.price,restoratingId:match.row.id,restoratingName:match.row.name,distanceMeters:Math.round(match.meters),source:data.priceSource});}else report.withoutPrice++;
    }
    // Связанные со встречами записи проверены до начала импорта.
    await db.restaurant.deleteMany({where:staleWhere});
    await fs.writeFile(path.join(root,'import-report.json'),JSON.stringify(report,null,2));
    await fs.writeFile(path.join(root,'osm/selected-restaurants.json'),JSON.stringify({fetchedAt:snapshot.fetchedAt,selection:report.selection,sourceIds:[...seen]},null,2));
    console.log(JSON.stringify({total:report.total,withPrice:report.withPrice,withoutPrice:report.withoutPrice,reusedIds:report.reusedIds}));
  }finally{await db.$disconnect()}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
