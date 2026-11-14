/** Реальная OSM-карта. Стили меток соответствуют макету, координаты поступают из БД. */
export function mapHtml() {
  return `<!doctype html>
<html lang="ru"><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="/api/map-assets/leaflet.css">
<style>
html,body,#map{margin:0;width:100%;height:100%;overflow:hidden;background:#e9e7e2;font-family:Arial,sans-serif}
.leaflet-container{background:#e9e7e2}.leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.88);color:#64748b}
.leaflet-control-attribution a{color:#64748b}.leaflet-top .leaflet-control-zoom{margin-top:142px;margin-right:14px;border:0;box-shadow:0 2px 8px #18213b15;border-radius:10px;overflow:hidden}
.leaflet-control-zoom a{width:28px;height:28px;line-height:28px;font-size:18px;color:#64748b;border-color:#edf0f4}
.leaflet-marker-icon.restaurant-marker{background:none;border:0;pointer-events:none;touch-action:manipulation}.pin{position:absolute;left:0;top:0;width:43px;height:43px;background:#242878;border-radius:24px 24px 5px 24px;transform:rotate(45deg);box-shadow:0 3px 6px #1e2a7820;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto}
.pin.selected{background:#ff6b6b}.pin span{font:500 16px Arial,sans-serif;color:#fff;transform:rotate(-45deg);pointer-events:none}
.selection-halo{position:absolute;width:90px;height:90px;left:21px;top:21px;transform:translate(-50%,-50%);background:#24287812;border:1px solid #24287825;border-radius:50%;pointer-events:none}
.restaurant-picker .leaflet-popup-content{margin:12px;min-width:190px}.restaurant-picker-title{font:500 12px Arial,sans-serif;color:#64748b;margin-bottom:8px}.restaurant-picker-list{max-height:180px;overflow:auto}.restaurant-picker-list button{display:block;width:100%;padding:10px 8px;text-align:left;border:0;border-radius:8px;background:white;color:#242878;font:14px Arial,sans-serif;cursor:pointer}.restaurant-picker-list button:hover,.restaurant-picker-list button:focus{background:#eaeaff;outline:none}
#mapstatus{position:absolute;bottom:180px;left:20px;right:20px;background:#ffffffed;color:#64748b;padding:10px 14px;border-radius:12px;font-size:12px;text-align:center;z-index:1000}
</style>
<script src="/api/map-assets/leaflet.js"></script>
</head><body><div id="map" role="region" aria-label="Карта ресторанов OpenStreetMap"></div><div id="mapstatus" hidden>Не удалось загрузить фон карты. Проверьте подключение к интернету.</div>
<script>(function(){
 function send(data){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));else parent.postMessage(data,'*')}
 var map=L.map('map',{center:[55.7558,37.6176],zoom:13,zoomControl:false,attributionControl:true,fadeAnimation:false});
 L.control.zoom({position:'topright'}).addTo(map);
 var tiles=L.tileLayer('/api/map-tiles/{z}/{x}/{y}.png',{maxZoom:19,keepBuffer:1,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> | Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a>'}).addTo(map);
 var tileErrors=0;
 tiles.on('loading',function(){tileErrors=0});
 tiles.on('tileerror',function(){tileErrors++;document.getElementById('mapstatus').hidden=false});
 tiles.on('load',function(){document.getElementById('mapstatus').hidden=tileErrors===0;if(!tileErrors)send({type:'tilesready'})});
 var pins=L.layerGroup().addTo(map),markers=new Map();
 var lastScope='',lastSelected='',currentMode='catalog',currentSelected='';
 function sizeFor(id){return currentMode==='meeting'||id===currentSelected?43:map.getZoom()<=13?18:map.getZoom()===14?26:map.getZoom()===15?34:43}
 function paint(marker,id){
  var element=marker.getElement();if(!element)return;var selected=id===currentSelected,size=sizeFor(id),pin=element.querySelector('.pin'),label=pin.querySelector('span');
  pin.classList.toggle('selected',selected);element.querySelector('.selection-halo').hidden=!selected;
  pin.style.width=size+'px';pin.style.height=size+'px';pin.style.left=(21-size/2)+'px';pin.style.top=(52-size*1.2071)+'px';pin.style.borderRadius=(size*.56)+'px '+(size*.56)+'px '+(size*.12)+'px '+(size*.56)+'px';label.hidden=size<26;label.style.fontSize=(size<34?11:16)+'px';
  marker.setZIndexOffset(selected?1000:0);
 }
 function choose(marker,id){
  send({type:'select',id:id});
  var origin=map.latLngToContainerPoint(marker.getLatLng());origin.y-=sizeFor(id)*.7071;var options=[];
  markers.forEach(function(other,otherId){var point=map.latLngToContainerPoint(other.getLatLng());point.y-=sizeFor(otherId)*.7071;if(point.distanceTo(origin)<(sizeFor(id)+sizeFor(otherId))*.65)options.push({id:otherId,marker:other})});
  if(options.length<2){map.closePopup();return}
  var content=document.createElement('div'),title=document.createElement('div'),list=document.createElement('div');title.className='restaurant-picker-title';title.textContent='Выберите ресторан';list.className='restaurant-picker-list';content.appendChild(title);content.appendChild(list);
  options.forEach(function(option){var button=document.createElement('button');button.type='button';button.textContent=option.marker.options.title;button.setAttribute('data-choose-restaurant',option.id);button.onclick=function(event){L.DomEvent.stopPropagation(event);send({type:'select',id:option.id});map.closePopup()};list.appendChild(button)});
  L.popup({className:'restaurant-picker',maxWidth:280,autoPanPaddingTopLeft:[20,140],autoPanPaddingBottomRight:[20,190]}).setLatLng(marker.getLatLng()).setContent(content).openOn(map);
 }
 map.on('zoomend',function(){markers.forEach(paint)});
 // Допуск касания в экранных пикселях: небольшой промах по компактной метке тоже выбирает ресторан.
 map.on('click',function(event){var nearest=null,best=26;markers.forEach(function(marker,id){var point=map.latLngToContainerPoint(marker.getLatLng());point.y-=sizeFor(id)*.7071;var delta=point.distanceTo(event.containerPoint);if(delta<best){nearest={marker:marker,id:id};best=delta}});if(nearest)choose(nearest.marker,nearest.id)});
 function receive(event){
  var d=event.data;try{if(typeof d==='string')d=JSON.parse(d)}catch(e){return}
  if(!d||d.type!=='places'||!Array.isArray(d.items))return;
  currentMode=d.mode||'catalog';currentSelected=d.selectedId;
  var bounds=[],focus,ids=new Set(d.items.map(function(r){return r.id}));
  markers.forEach(function(marker,id){if(!ids.has(id)){pins.removeLayer(marker);markers.delete(id)}});
  d.items.forEach(function(r,index){
   if(!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude))return;
   var selected=r.id===d.selectedId,point=[r.latitude,r.longitude];bounds.push(point);if(selected)focus=point;
   var marker=markers.get(r.id);
   if(!marker){
    var icon=L.divIcon({className:'restaurant-marker',html:'<div class="selection-halo" hidden></div><div class="pin"><span>'+(index+1)+'</span></div>',iconSize:[43,53],iconAnchor:[21,52]});
    marker=L.marker(point,{icon:icon,keyboard:true,bubblingMouseEvents:false,title:String(r.name||''),alt:String(r.name||'')});
    marker.on('click',function(){choose(marker,r.id)});pins.addLayer(marker);markers.set(r.id,marker);
   }else if(!marker.getLatLng().equals(point)){marker.setLatLng(point)}
   var element=marker.getElement();
   if(element){element.dataset.restaurantId=String(r.id);element.querySelector('.pin span').textContent=String(index+1);element.title=String(r.name||'')}
   paint(marker,r.id);
  });
  var scope=(d.mode||'catalog')+':'+d.items.map(function(r){return r.id}).join(',');
  var paddingTop=[24,d.mode==='meeting'?95:145],paddingBottom=[24,190];
  if(bounds.length&&scope!==lastScope){map.fitBounds(bounds,{paddingTopLeft:paddingTop,paddingBottomRight:paddingBottom,maxZoom:14,animate:false});lastScope=scope}
  if(focus&&lastSelected!==d.selectedId)map.panInside(focus,{paddingTopLeft:paddingTop,paddingBottomRight:paddingBottom,animate:false});
  lastSelected=d.selectedId;document.getElementById('map').setAttribute('aria-label','Карта ресторанов: '+bounds.length);
 }
 window.addEventListener('message',receive);document.addEventListener('message',receive);
 window.addEventListener('resize',function(){map.invalidateSize()});send({type:'ready'});
})();</script></body></html>`;
}
