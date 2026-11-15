// Public, versioned scenario contract. All imported objects are user simulations.
export const MAX_TURBINES=32;
function num(v,min,max,label){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+' je mimo rozsah '+min+'–'+max);return v;}
export function coordinates(p){if(!Array.isArray(p)||p.length!==2)throw Error('Poloha musí být [délka, šířka].');return [num(p[0],11.5,19.5,'Délka'),num(p[1],48,51.6,'Šířka')];}
export function normalizeScenario(input){
 if(!input||input.version!==1||!Array.isArray(input.objects)||input.objects.length>MAX_TURBINES)throw Error('Neplatný scénář v1; nejvýše 32 turbín.');
 const ids=new Set();const objects=input.objects.map((o,i)=>{if(o.type!=='wind_turbine'||o.geometry?.type!=='Point')throw Error('Podporovány jsou bodové větrné turbíny.');
 const id=typeof o.id==='string'&&/^[\w-]{1,64}$/.test(o.id)?o.id:'user-'+(i+1);if(ids.has(id))throw Error('Duplicitní ID.');ids.add(id);
 const hub=num(o.dimensions?.hub_height_m,20,250,'Náboj'),rotor=num(o.dimensions?.rotor_diameter_m,10,220,'Rotor');if(hub-rotor/2<5)throw Error('Lopatka musí zůstat alespoň 5 m nad patou.');
 return {id,type:'wind_turbine',status:'simulation',name:typeof o.name==='string'?o.name.slice(0,80):'Moje turbína '+(i+1),geometry:{type:'Point',coordinates:coordinates(o.geometry.coordinates)},capacity_mw:num(o.capacity_mw??5,0,30,'Výkon'),dimensions:{hub_height_m:hub,rotor_diameter_m:rotor,total_height_m:hub+rotor/2},heading_deg:num(o.heading_deg??0,0,360,'Natočení'),source:'user',source_date:null,positional_accuracy:'Uživatelská poloha; bez geodetického ověření'};
 });return {version:1,objects};
}
export function toFeatures(scenario){return {type:'FeatureCollection',features:scenario.objects.map(o=>({type:'Feature',geometry:o.geometry,properties:{...o,hubHeight:o.dimensions.hub_height_m,rotorDiameter:o.dimensions.rotor_diameter_m,uncertainty:'Moje simulace, nikoli plánovaná nebo schválená stavba. '+o.positional_accuracy}}))};}
export function parseScenario(text){return normalizeScenario(JSON.parse(text));}
export function newTurbine(position,id='user-'+crypto.randomUUID()){return normalizeScenario({version:1,objects:[{id,type:'wind_turbine',geometry:{type:'Point',coordinates:position},dimensions:{hub_height_m:175,rotor_diameter_m:150}}]}).objects[0];}
