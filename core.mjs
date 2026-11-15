import {parseScenario} from './scenario.mjs';
export const empty = () => ({type:'FeatureCollection', features:[]});
export const totalHeight = (hub, rotor) => hub + rotor / 2;
export function dimensions(p) {
  return Number.isFinite(p.hubHeight) && p.hubHeight > 0 && Number.isFinite(p.rotorDiameter) && p.rotorDiameter > 0
    ? {hub:p.hubHeight, rotor:p.rotorDiameter, total:totalHeight(p.hubHeight,p.rotorDiameter)} : null;
}
export function insideRing([x,y], ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
export function insidePolygon(point,rings) {return insideRing(point,rings[0]) && !rings.slice(1).some(r=>insideRing(point,r));}
// Deterministic illustrative lattice. Never used to populate the project dataset.
export function modelPositions(zones, total=250) {
  const features=[];
  for(const z of zones.features) {
    const polygons=z.geometry.type==='MultiPolygon'?z.geometry.coordinates:[z.geometry.coordinates];
    for(const rings of polygons) {
      const xs=rings[0].map(p=>p[0]), ys=rings[0].map(p=>p[1]);
      const dx=800/(111320*Math.cos(ys[0]*Math.PI/180)), dy=800/110574;
      for(let y=Math.ceil(Math.min(...ys)/dy)*dy;y<Math.max(...ys);y+=dy)
        for(let x=Math.ceil(Math.min(...xs)/dx)*dx;x<Math.max(...xs);x+=dx)
          if(insidePolygon([x,y],rings)) features.push({type:'Feature',geometry:{type:'Point',coordinates:[x,y]},properties:{id:`model-${z.id}-${features.length}`,name:'Modelové rozmístění – nejde o plánované stavby',status:'model',zone:z.id,hubHeight:total-75,rotorDiameter:150,source:'model',uncertainty:'Ilustrativní geometrická síť po 800 m. Neověřuje odstupy, majetkové vztahy, vítr ani proveditelnost.'}});
    }
  }
  return {type:'FeatureCollection',features};
}
const finite=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
export function readState(hash) {
  const p=new URLSearchParams(hash.replace(/^#/,''));
  let simulation={version:1,objects:[]};try{if(p.get('user')?.length<24000)simulation=parseScenario(p.get('user'));}catch{}
  let observer=null;try{const v=p.get('observer')?.split(',').map(Number);if(v?.length===2&&v.every(Number.isFinite)&&v[0]>=11.5&&v[0]<=19.5&&v[1]>=48&&v[1]<=51.6)observer=v;}catch{}
  return {simulation,observer,fov:finite(p.get('fov')??55,35,90,55),landscape:['map','fields','forest','mixed'].includes(p.get('landscape'))?p.get('landscape'):'map',treeHeight:finite(p.get('trees')??22,10,35,22),animation:p.get('animate')!=='0',rpm:finite(p.get('rpm')??8,0,15,8),lng:finite(p.get('lng')??15.4,12,19,15.4),lat:finite(p.get('lat')??49.8,48.4,51.2,49.8),zoom:finite(p.get('z')??6.4,5,17,6.4),bearing:finite(p.get('b')??-25,-360,360,-25),pitch:finite(p.get('p')??45,0,70,45),localZoom:finite(p.get('lz')??1.7,.5,20,1.7),mode:['overview','iso','eye'].includes(p.get('view'))?p.get('view'):'overview',scenario:['current','projects','model'].includes(p.get('s'))?p.get('s'):'current',height:finite(p.get('h')??250,250,300,250),zones:p.get('zones')!=='0',existing:p.get('existing')!=='0',planned:p.get('planned')!=='0',compare:p.get('compare')==='1',split:finite(p.get('split')??50,0,100,50),camera:p.get('camera')?.split(',').map(Number).filter(Number.isFinite)};
}
export function writeState(s) {return new URLSearchParams({user:JSON.stringify(s.simulation||{version:1,objects:[]}),...(s.observer?{observer:s.observer.join(',')}:{}),fov:s.fov??55,landscape:s.landscape,trees:s.treeHeight,animate:+s.animation,rpm:s.rpm,lng:s.lng.toFixed(6),lat:s.lat.toFixed(6),z:s.zoom.toFixed(2),b:s.bearing.toFixed(1),p:s.pitch.toFixed(1),view:s.mode,lz:s.localZoom,s:s.scenario,h:s.height,zones:+s.zones,existing:+s.existing,planned:+s.planned,compare:+s.compare,split:s.split,...(s.camera?.length===6?{camera:s.camera.join(',')}:{})}).toString();}
export function localXY([lng,lat], origin) {return [(lng-origin[0])*111320*Math.cos(origin[1]*Math.PI/180),-(lat-origin[1])*110574];}
export function lonLat([x,z], origin) {return [origin[0]+x/(111320*Math.cos(origin[1]*Math.PI/180)),origin[1]-z/110574];}
