const AREA = 'garden-ring';
/**
 * Проверяет попадание точки в полигон, включая точки на его границе.
 * @param point Проверяемая точка [долгота, широта].
 * @param polygon Узлы границы [долгота, широта].
 */
function inside(point, polygon) {
  const [x,y]=point; let result=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [xi,yi]=polygon[i], [xj,yj]=polygon[j];
    const cross=(x-xi)*(yj-yi)-(y-yi)*(xj-xi);
    if(Math.abs(cross)<1e-12 && x>=Math.min(xi,xj)-1e-10 && x<=Math.max(xi,xj)+1e-10 && y>=Math.min(yi,yj)-1e-10 && y<=Math.max(yi,yj)+1e-10)return true;
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)result=!result;
  }
  return result;
}
/**
 * Вычисляет расстояние между координатами на сфере в метрах.
 * @param a Первый объект с координатами.
 * @param b Второй объект с координатами.
 */
function distance(a,b) {
  const r=Math.PI/180, dlat=(a.latitude-b.latitude)*r, dlon=(a.longitude-b.longitude)*r;
  return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlon/2)**2)));
}
/**
 * Нормализует название заведения для сопоставления филиалов из разных источников.
 * @param s Исходный текст для преобразования.
 */
function normalize(s) {
  return s.toLowerCase().replace(/ё/g,'е').replace(/\b(?:restaurant|cafe|bar)\b|ресторан|кафе|ресто[- ]?бар/gu,'').replace(/[^\p{L}\p{N}]/gu,'');
}
/**
 * Объединяет и нормализует коды кухонь и диетических признаков двух источников.
 * @param tags Теги объекта OSM.
 * @param extra Дополнительные кухни источника либо дополнительный получатель события.
 */
function cuisines(tags, extra=[]) {
  const raw=(tags.cuisine||'').split(/[;,]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
  const codes=new Set(raw);
  const extraCodes={европейская:'european',смешанная:'mixed',авторская:'author',французская:'french',грузинская:'georgian',китайская:'chinese',азиатская:'asian',паназиатская:'asian',американская:'american',рыбная:'seafood',мясная:'meat',узбекская:'uzbek',средиземноморская:'mediterranean',индийская:'indian',корейская:'korean',турецкая:'turkish',еврейская:'jewish',мексиканская:'mexican',сербская:'serbian',восточная:'oriental',испанская:'spanish',бургеры:'burger',пицца:'pizza'};
  for(const name of extra)if(extraCodes[name.toLowerCase()])codes.add(extraCodes[name.toLowerCase()]);
  const groups={italian:['italian','pizza','итальянская'],japanese:['japanese','sushi','ramen','японская'],russian:['russian','русская'],coffee:['coffee','coffee_shop','cafe','кофейня'],bar:['bar','pub','пивная']};
  for(const [code,variants] of Object.entries(groups))if([...raw,...extra].some(c=>variants.includes(c.toLowerCase())))codes.add(code);
  for(const key of ['vegetarian','vegan'])if(['yes','only'].includes(tags['diet:'+key])||raw.includes(key)||extra.some(c=>/вегетарианская|веганская/.test(c)))codes.add(key);
  if(codes.has('vegan'))codes.add('vegetarian');
  return [...codes].filter(c=>/^[a-z_\-]{1,50}$/.test(c));
}
/**
 * Восстанавливает замкнутую границу Садового кольца, отбирает рестораны внутри неё и удаляет дубли.
 * @param map Полный набор элементов OSM и сведения об источнике.
 */
function buildSnapshot(map) {
  const nodes=new Map(map.elements.filter(e=>e.type==='node').map(e=>[e.id,e]));
  const ways=new Map(map.elements.filter(e=>e.type==='way').map(e=>[e.id,e]));
  const relation=map.elements.find(e=>e.type==='relation'&&e.id===2094267);
  if(!relation)throw Error('Отсутствует отношение Садового кольца OSM 2094267');
  const ids=[], wayIds=[];
  for(const m of relation.members){
    if(m.type!=='way')continue;
    const w=ways.get(m.ref);if(!w)throw Error(`Нет геометрии участка ${m.ref}`);
    let part=w.nodes;
    if(ids.length&&part.at(-1)===ids.at(-1))part=[...part].reverse();
    if(ids.length&&part[0]!==ids.at(-1))throw Error('Граница не связна: проверьте актуальную геометрию отношения');
    ids.push(...(ids.length?part.slice(1):part));wayIds.push(w.id);
    if(ids.length>3&&ids[0]===ids.at(-1))break;
  }
  if(ids[0]!==ids.at(-1)||ids.length<50)throw Error('Граница не замкнута');
  const polygon=ids.map(id=>{const n=nodes.get(id);if(!n)throw Error(`Нет узла ${id}`);return[n.lon,n.lat]});
  if(!inside([37.6176,55.7558],polygon)||inside([37.54,55.7558],polygon))throw Error('Проверка полигона Садового кольца не пройдена');
  /**
   * Определяет координаты объекта OSM по точке, центру Overpass или среднему координат его узлов.
   */
  const center=e=>{
    if(e.type==='node')return{latitude:e.lat,longitude:e.lon};
    // Overpass supplies the bounding-box center without downloading every building node.
    if(Number.isFinite(e.center?.lat)&&Number.isFinite(e.center?.lon))return{latitude:e.center.lat,longitude:e.center.lon};
    const refs=e.type==='way'?e.nodes:e.members.filter(m=>m.type==='way'&&m.role!=='inner').flatMap(m=>ways.get(m.ref)?.nodes||[]);
    const ns=[...new Set(refs)].map(id=>nodes.get(id)).filter(Boolean);
    if(!ns.length)return null;
    return{latitude:ns.reduce((s,n)=>s+n.lat,0)/ns.length,longitude:ns.reduce((s,n)=>s+n.lon,0)/ns.length};
  };
  const places=map.elements.filter(e=>e.tags?.amenity==='restaurant'&&(e.tags['name:ru']||e.tags.name)).map(e=>{
    const c=center(e);if(!c||!inside([c.longitude,c.latitude],polygon))return null;
    const tags=e.tags, name=tags['name:ru']||tags.name;
    return{sourceId:`osm:${e.type}/${e.id}`,osmType:e.type,osmId:String(e.id),osmVersion:e.version,osmUpdatedAt:e.timestamp,
      name,...c,tags,address:[tags['addr:street'],tags['addr:housenumber']].filter(Boolean).join(', ')};
  }).filter(Boolean);
  // OSM иногда размечает одно заведение и точкой, и контуром здания.
  const unique=[];const duplicateIds=[];
  for(const p of places.sort((a,b)=>Object.keys(b.tags).length-Object.keys(a.tags).length)) {
    const duplicate=unique.find(q=>normalize(q.name)===normalize(p.name)&&q.tags.level===p.tags.level&&distance(p,q)<15);
    if(duplicate)duplicateIds.push({sourceId:p.sourceId,canonical:duplicate.sourceId});else unique.push(p);
  }
  const fetchedAt=map.importedAt||new Date().toISOString();
  return{boundary:{type:'Feature',properties:{source:'https://www.openstreetmap.org/relation/2094267',relationVersion:relation.version,fetchedAt,wayIds,
    definition:'Первая замкнутая цепочка основной проезжей части маршрута Садового кольца OSM. Для площадных ресторанов используется центр геометрии.'},geometry:{type:'Polygon',coordinates:[polygon]}},
    snapshot:{source:map.source||'https://api.openstreetmap.org/api/0.6/map',license:'ODbL-1.0',fetchedAt,area:AREA,duplicateIds,places:unique.sort((a,b)=>a.sourceId.localeCompare(b.sourceId))}};
}
/**
 * Сопоставляет конкретный филиал по названию, расстоянию и номеру дома; неоднозначное соответствие отклоняется.
 * @param place Заведение OSM для сопоставления.
 * @param rows Записи Restorating с координатами и средним чеком.
 */
function matchPrice(place, rows) {
  const n=normalize(place.name);if(n.length<3)return null;
  const candidates=rows.map(r=>{
    if(!Number.isFinite(r.bill)||r.bill<=0||!r.position)return null;
    const other=normalize(r.name),exact=n===other;
    const compatible=exact||(Math.min(n.length,other.length)>=5&&(n.includes(other)||other.includes(n)));
    if(!compatible)return null;
    const meters=distance(place,{latitude:r.position.lat,longitude:r.position.lng});
    if(meters>(exact?100:60))return null;
    const house=place.tags['addr:housenumber'];
    const apiHouse=r.address?.match(/(?:,|\s)(\d+[а-яa-z]?(?:[\s/]+(?:с|стр\.?|к|корп\.?)?\s*\d+)?)/i)?.[1];
    if(house&&apiHouse&&house.match(/^\d+/)?.[0]!==apiHouse.match(/^\d+/)?.[0])return null;
    return{row:r,meters,exact};
  }).filter(Boolean).sort((a,b)=>Number(b.exact)-Number(a.exact)||a.meters-b.meters);
  if(!candidates.length)return null;
  if(candidates[1]&&candidates[0].exact===candidates[1].exact&&Math.abs(candidates[1].meters-candidates[0].meters)<20)return null;
  return candidates[0];
}
module.exports={AREA,inside,distance,normalize,cuisines,buildSnapshot,matchPrice};
