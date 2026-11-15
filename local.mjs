import {CONSTRAINT_KEYS,CONSTRAINT_COLORS,drapedRingSegments} from './constraints.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const sharedAsset=await new GLTFLoader().loadAsync('models/turbine.gltf');
const sharedGeometries=new Set();sharedAsset.scene.traverse(o=>{if(o.geometry)sharedGeometries.add(o.geometry);});
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {localXY,lonLat,dimensions,insidePolygon} from './core.mjs';
import {LANDSCAPES,landscapeHeight,treePositions,inModelForest} from './landscape.mjs';
const SIZE=6000,N=128;
const cache=new Map();
const merc=([lon,lat],z)=>{const k=2**z;return [(lon+180)/360*k,(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*k];};
async function tile(x,y,z=12) {
  const key=`${z}/${x}/${y}`;
  if(!cache.has(key)) cache.set(key,(async()=>{
    const cached=z===12&&x>=2208&&x<=2209&&y>=1385&&y<=1386;
    let response=await fetch(cached?`dem/${key}.png`:`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${key}.png`);
    if(!response.ok&&cached)response=await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${key}.png`);
    if(!response.ok) throw Error('Výškové dlaždice nejsou dostupné');
    const bitmap=await createImageBitmap(await response.blob());
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);bitmap.close();
    return ctx.getImageData(0,0,256,256).data;
  })().catch(e=>{cache.delete(key);throw e;}));
  return cache.get(key);
}
export async function terrainGrid(origin, signal) {
  const coords=[];const jobs=new Map();
  for(let j=0;j<=N;j++) for(let i=0;i<=N;i++) {
    const x=(i/N-.5)*SIZE,z=(j/N-.5)*SIZE;
    const [u,v]=merc(lonLat([x,z],origin),12);const tx=Math.floor(u),ty=Math.floor(v),key=`${tx}/${ty}`;
    coords.push([u-tx,v-ty,key]);if(!jobs.has(key)) jobs.set(key,tile(tx,ty));
  }
  const data=new Map(await Promise.all([...jobs].map(async([k,p])=>[k,await p])));
  if(signal.aborted) throw new DOMException('Aborted','AbortError');
  const heights=coords.map(([u,v,key])=>{
    const p=data.get(key);const a=Math.min(255,Math.floor(u*256)),b=Math.min(255,Math.floor(v*256));
    const k=(b*256+a)*4;return p[k]*256+p[k+1]+p[k+2]/256-32768;
  });
  // Match the actual diagonal used by PlaneGeometry, not bilinear interpolation.
  function height(x,z) {
    const u=Math.max(0,Math.min(N-.000001,(x/SIZE+.5)*N)),v=Math.max(0,Math.min(N-.000001,(z/SIZE+.5)*N));
    const i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*(N+1)+i;
    const h00=heights[k],h10=heights[k+1],h01=heights[k+N+1],h11=heights[k+N+2];
    return a+b<=1?h00+(h10-h00)*a+(h01-h00)*b:h11+(h01-h11)*(1-a)+(h10-h11)*(1-b);
  }
  return {heights,height};
}
export function turbine(p) {
  const d=dimensions(p);if(!d)return null;
  const group=sharedAsset.scene.clone(true);const color=p.status==='simulation'?0xa73888:p.status==='model'?0xc38c50:p.status==='planned'?0x779eae:0xebece4;
  group.traverse(o=>{if(o.isMesh){o.material=new T.MeshLambertMaterial({color,side:T.DoubleSide});}});
  const tower=group.getObjectByName('tower');tower.scale.y=d.hub;tower.position.y=d.hub/2;
  group.getObjectByName('nacelle').position.y=d.hub;
  const rotor=group.getObjectByName('rotor');rotor.position.y=d.hub;group.getObjectByName('blades').scale.setScalar(d.rotor);
  group.rotation.y=Math.PI-(p.heading_deg||0)*Math.PI/180;
  group.userData=p;return group;
}
export class LocalView {
  constructor(container,onPick,onNotice,onCamera,onGround) {
    this.onGround=onGround;this.el=container;this.onPick=onPick;this.notice=onNotice;this.onCamera=onCamera;
    this.renderer=new T.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.setClearColor(0xdce5d6);container.append(this.renderer.domElement);
    this.scene=new T.Scene();this.scene.background=new T.Color(0xdce5d6);this.scene.fog=new T.Fog(0xdce5d6,5000,11000);
    this.scene.add(new T.HemisphereLight(0xfaf7e9,0x6c775c,2));const sun=new T.DirectionalLight(0xfff5d6,2.2);sun.position.set(-800,1500,900);this.scene.add(sun);
    this.ground=new T.Group();this.existing=new T.Group();this.future=new T.Group();this.zones=new T.Group();
    this.constraintGroups=new Map(CONSTRAINT_KEYS.map(k=>[k,new T.Group()]));for(const group of this.constraintGroups.values())this.scene.add(group);this.simulation=new T.Group();this.scene.add(this.ground,this.existing,this.future,this.zones,this.simulation);this.scenery=new T.Group();this.scene.add(this.scenery);this.lastFrame=0;this.reducedMotion=false;
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];this.drag=[e.clientX,e.clientY];});
    this.renderer.domElement.addEventListener('pointermove',e=>{
      if(this.mode==='eye' && e.buttons===1 && this.drag){this.yaw-=(e.clientX-this.drag[0])*.004;this.lookPitch=Math.max(-1.2,Math.min(1.2,this.lookPitch-(e.clientY-this.drag[1])*.004));this.eyeLook();this.drag=[e.clientX,e.clientY];}
    });
    this.renderer.domElement.addEventListener('pointerup',e=>{
      if(this.down&&Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])<5) this.pick(e);
      this.drag=null;this.saveCamera();
    });
    this.renderer.domElement.addEventListener('wheel',()=>{clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.saveCamera(),200);});
    window.addEventListener('keydown',e=>{
      if(!this.visible||this.mode!=='eye'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();const f=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0,r=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
      this.moveEye(f,r);
    });
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
    this.renderer.setAnimationLoop(time=>{const dt=this.lastFrame?Math.min((time-this.lastFrame)/1000,.1):0;this.lastFrame=time;if(this.visible){this.animateRotors(dt);this.controls?.update();this.draw();}});
  }
  clear(group) {for(const child of [...group.children]){group.remove(child);child.traverse(o=>{if(!sharedGeometries.has(o.geometry))o.geometry?.dispose();o.material?.map?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose();});}}
  async load(origin,mode,data,state) {
    this.ready=false;this.visible=true;this.el.hidden=false;this.origin=origin;this.state=state;this.data=data;
    this.abort?.abort();const abort=this.abort=new AbortController();
    for(const g of [this.ground,this.existing,this.future,this.zones,this.scenery,this.simulation])this.clear(g);
    this.notice('Načítání místního terénu · 6 × 6 km…');
    try {
      const illustrative=state.landscape&&state.landscape!=='map';this.illustrative=illustrative;
      const grid=illustrative?{heights:Array.from({length:(N+1)**2},(_,i)=>landscapeHeight((i%(N+1)/N-.5)*SIZE,(Math.floor(i/(N+1))/N-.5)*SIZE)),height:landscapeHeight}:await terrainGrid(origin,abort.signal);if(abort.signal.aborted)return;
      this.height=grid.height;if(illustrative){this.height=(x,z)=>{const u=T.MathUtils.clamp((x/SIZE+.5)*N,0,N-.000001),v=T.MathUtils.clamp((z/SIZE+.5)*N,0,N-.000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*(N+1)+i,H=grid.heights;return a+b<=1?H[k]+(H[k+1]-H[k])*a+(H[k+N+1]-H[k])*b:H[k+N+2]+(H[k+N+1]-H[k+N+2])*(1-a)+(H[k+1]-H[k+N+2])*(1-b);};}this.ready=false;
      const geo=new T.PlaneGeometry(SIZE,SIZE,N,N);geo.rotateX(-Math.PI/2);
      const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,grid.heights[i]);geo.computeVertexNormals();
      const colors=[];for(const h of grid.heights){const c=new T.Color(h>800?0x97a581:0xb1bb8b);colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      this.ground.add(new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,flatShading:true})));
      // Context is a separately fetched demonstrator, never synthetic buildings across CZ.
      const isPchery=!illustrative&&Math.hypot(...localXY([14.132,50.197],origin))<1500;
      const context=isPchery?await fetch('data/pchery-context.geojson').then(r=>{if(!r.ok)throw Error('Kontext Pcher není dostupný');return r.json();}):null;if(abort.signal.aborted)return;
      if(isPchery){this.addContext(context);this.addMappedTrees(context);}if(illustrative)this.addLandscape();
      const mask=document.createElement('canvas');mask.width=mask.height=2048;const context2d=mask.getContext('2d');
      for(const f of (illustrative?[]:data.zones.features)){const polys=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];for(const rings of polys){context2d.beginPath();for(const ring of rings){ring.forEach((p,i)=>{const [x,z]=localXY(p,origin),u=(x/SIZE+.5)*2048,v=(z/SIZE+.5)*2048;i?context2d.lineTo(u,v):context2d.moveTo(u,v);});context2d.closePath();}context2d.fillStyle='#b97c45';context2d.fill('evenodd');context2d.strokeStyle='#88562f';context2d.lineWidth=1.3;context2d.stroke();}}
      const zoneGeo=geo.clone();for(let i=0;i<zoneGeo.attributes.position.count;i++)zoneGeo.attributes.position.setY(i,zoneGeo.attributes.position.getY(i)+.7);
      const zoneTexture=new T.CanvasTexture(mask);zoneTexture.colorSpace=T.SRGBColorSpace;this.zones.add(new T.Mesh(zoneGeo,new T.MeshBasicMaterial({map:zoneTexture,transparent:true,opacity:.28,depthWrite:false})));
      this.rebuildTurbines();this.setConstraintLayers(this.data.constraints?.layers);this.setMode(mode,state.camera);this.resize();
      if(illustrative)this.notice(`${LANDSCAPES[state.landscape]} · modelová krajina, stromy ${state.treeHeight} m, turbína ${state.height} m · není skutečná lokalita ani projekt. Měřítko 1 : 1.`);else this.notice(`Místní terén 1 : 1 · ${isPchery?`Pchery: pole a lesy OSM; stromy modelové ${state.treeHeight} m, neznámé výšky budov bez objemu.`:'Mimo demonstrátor chybí místní budovy a vegetace.'} Výška očí je orientační.`);
      this.ready=true;
    } catch(e){if(e.name!=='AbortError'){this.ready=false;this.notice('Místní terén nelze načíst. Pohled není dostupný; vraťte se do přehledu. '+e.message);}}
  }
  addContext(context) {
    // A draped texture shares the actual terrain triangles: no floating forest polygons.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#aebc8c';ctx.fillRect(0,0,2048,2048);
    const coord=p=>{const [x,z]=localXY(p,this.origin);return [(x/SIZE+.5)*2048,(z/SIZE+.5)*2048];};
    const colors={field:'#c8b77a',forest:'#668660',water:'#81a9ac',building:'#c8bba6',road:'#d9d0b5'};
    const sorted=[...context.features].sort((a,b)=>['field','forest','water','road','building'].indexOf(a.properties.kind)-['field','forest','water','road','building'].indexOf(b.properties.kind));
    const boxes=[];
    for(const f of sorted){const p=f.properties;ctx.fillStyle=ctx.strokeStyle=colors[p.kind];ctx.beginPath();
      const rings=f.geometry.type==='Polygon'?f.geometry.coordinates:[f.geometry.coordinates];
      for(const ring of rings){ring.forEach((p,i)=>{const [x,y]=coord(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});if(p.kind!=='road')ctx.closePath();}
      if(p.kind==='road'){ctx.lineWidth=1.3;ctx.stroke();}else ctx.fill('evenodd');
      if(p.kind==='building'&&p.heightKnown){const q=rings[0].map(c=>localXY(c,this.origin)),xs=q.map(p=>p[0]),zs=q.map(p=>p[1]);const x=(Math.min(...xs)+Math.max(...xs))/2,z=(Math.min(...zs)+Math.max(...zs))/2;boxes.push({x,z,h:p.height,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs)});}
    }
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const terrain=this.ground.children[0];terrain.material.vertexColors=false;terrain.material.map=texture;terrain.material.needsUpdate=true;
    if(boxes.length){const b=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xc6b49b}),boxes.length);const m=new T.Matrix4();for(let i=0;i<boxes.length;i++){const q=boxes[i];m.compose(new T.Vector3(q.x,this.height(q.x,q.z)+q.h/2,q.z),new T.Quaternion(),new T.Vector3(q.w,q.h,q.d));b.setMatrixAt(i,m);}b.instanceMatrix.needsUpdate=true;this.ground.add(b);}
  }
  addLandscape(){
    const kind=this.state.landscape,treeHeight=this.state.treeHeight;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#a9ba84';ctx.fillRect(0,0,2048,2048);const unit=2048/SIZE;const pixel=(x,z)=>[(x/SIZE+.5)*2048,(z/SIZE+.5)*2048];
    const palette=['#c9ba79','#d4c68c','#b9bf7b','#a4b479','#c1aa72'];
    for(let z=-3000,j=0;z<3000;z+=310,j++)for(let x=-3000,i=0;x<3000;x+=390,i++){
      ctx.fillStyle=palette[(i+j*3)%palette.length];const [u,v]=pixel(x,z);ctx.fillRect(u+2,v+2,390*unit-4,310*unit-4);
      ctx.strokeStyle='#827a4c18';ctx.lineWidth=.8;for(let stripe=0;stripe<390;stripe+=18){ctx.beginPath();ctx.moveTo(u+stripe*unit,v+3);ctx.lineTo(u+stripe*unit,v+310*unit-3);ctx.stroke();}
    }
    ctx.fillStyle='#63835a';for(let z=-1100;z<1100;z+=25)for(let x=-1100;x<1100;x+=25)if(inModelForest(x,z,kind)){const [u,v]=pixel(x-12.5,z-12.5);ctx.fillRect(u,v,26*unit,26*unit);}
    const trees=treePositions(kind,treeHeight);this.treeCount=trees.length;
    ctx.fillStyle='#63835a';for(const p of trees){const [u,v]=pixel(p.x,p.z);ctx.beginPath();ctx.ellipse(u,v,27*unit,27*unit,0,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#e7d8b5';ctx.lineWidth=8*unit;ctx.beginPath();ctx.moveTo(...pixel(-1600,180));ctx.bezierCurveTo(...pixel(-500,170),...pixel(400,190),...pixel(1600,100));ctx.stroke();
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const terrain=this.ground.children[0];terrain.material.vertexColors=false;terrain.material.map=texture;terrain.material.needsUpdate=true;
    this.addTrees(trees);
    // One reference house, 8 m to the ridge; a person is 1.7 m tall.
    const house=new T.Group();house.name='reference-house';
    const wall=new T.Mesh(new T.BoxGeometry(14,5,10),new T.MeshLambertMaterial({color:0xe8dfc6}));wall.position.y=2.5;house.add(wall);
    const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute([-7,5,-5,7,5,-5,0,8,-5,-7,5,5,0,8,5,7,5,5,-7,5,-5,0,8,-5,-7,5,5,0,8,-5,0,8,5,-7,5,5,7,5,-5,7,5,5,0,8,-5,0,8,-5,7,5,5,0,8,5],3));roof.computeVertexNormals();house.add(new T.Mesh(roof,new T.MeshLambertMaterial({color:0x986e52,side:T.DoubleSide})));house.position.set(150,this.height(150,180),180);this.scenery.add(house);
    const person=new T.Group();person.name='reference-person';const body=new T.Mesh(new T.CylinderGeometry(.18,.18,1.3,6),new T.MeshLambertMaterial({color:0x324d58}));body.position.y=.65;person.add(body);const head=new T.Mesh(new T.SphereGeometry(.2,8,6),new T.MeshLambertMaterial({color:0xd6af83}));head.position.y=1.5;person.add(head);person.position.set(125,this.height(125,175),175);this.scenery.add(person);
    // Vertical ruler is tied to metres in the scene, rather than screen pixels.
    const ruler=new T.Group();ruler.name='height-ruler';const base=this.height(0,0);
    const points=[new T.Vector3(90,base,0),new T.Vector3(90,base+this.state.height,0)];
    ruler.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x3d594a})));
    for(const h of [...new Set([...Array.from({length:Math.floor(this.state.height/50)+1},(_,i)=>i*50),this.state.height])]){ruler.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(84,base+h,0),new T.Vector3(96,base+h,0)]),new T.LineBasicMaterial({color:0x3d594a})));const c=document.createElement('canvas');c.width=192;c.height=64;const t=c.getContext('2d');t.fillStyle='#f7f6efdd';t.fillRect(0,0,192,64);t.fillStyle='#263c32';t.font='36px system-ui';t.textAlign='center';t.fillText(h+' m',96,45);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map:tex}));label.position.set(119,base+h,0);label.scale.set(42,14,1);ruler.add(label);}
    this.scenery.add(ruler);
  }
  addTrees(trees){
    const m=new T.Matrix4(),q=new T.Quaternion();
    const trunks=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),new T.MeshLambertMaterial({color:0x77614b}),trees.length);
    const leaves=new T.InstancedMesh(new T.SphereGeometry(1,7,5),new T.MeshLambertMaterial({flatShading:true}),trees.length);
    const pine=new T.InstancedMesh(new T.ConeGeometry(1,1,7),new T.MeshLambertMaterial({flatShading:true}),trees.length);
    let deciduous=0,conifer=0;const c=new T.Color();
    trees.forEach((p,i)=>{const h=p.height,y=this.height(p.x,p.z);m.compose(new T.Vector3(p.x,y+h*.225,p.z),q,new T.Vector3(.45,h*.45,.45));trunks.setMatrixAt(i,m);
      const target=p.pine?pine:leaves,index=p.pine?conifer++:deciduous++;m.compose(new T.Vector3(p.x,y+h*.61,p.z),q,new T.Vector3(h*(p.pine?.2:.24),h*(p.pine?.78:.39),h*(p.pine?.2:.24)));target.setMatrixAt(index,m);c.setHSL(.27+p.tone*.06,.24,.27+p.tone*.12);target.setColorAt(index,c);
    });leaves.count=deciduous;pine.count=conifer;trunks.name='tree-trunks';leaves.name='tree-crowns';pine.name='pine-crowns';for(const o of [trunks,leaves,pine]){o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();this.scenery.add(o);}
  }
  addMappedTrees(context){
    const trees=[];for(const f of context.features){if(f.properties.kind!=='forest')continue;const ring=f.geometry.coordinates[0],q=ring.map(p=>localXY(p,this.origin)),xs=q.map(p=>p[0]),zs=q.map(p=>p[1]);
      for(let z=Math.max(-2900,Math.ceil(Math.min(...zs)/75)*75);z<=Math.min(2900,Math.max(...zs));z+=75)for(let x=Math.max(-2900,Math.ceil(Math.min(...xs)/75)*75);x<=Math.min(2900,Math.max(...xs));x+=75){if(insidePolygon(lonLat([x,z],this.origin),f.geometry.coordinates))trees.push({x,z,height:this.state.treeHeight,pine:Math.sin(x*3+z*7)>0,tone:(Math.sin(x+z)+1)/2});}
    }this.treeCount=trees.length;if(trees.length)this.addTrees(trees);
  }
  rebuildTurbines() {
    if(!this.height)return;this.clear(this.existing);this.clear(this.future);this.clear(this.simulation);
    if(this.illustrative){const model=turbine({id:'landscape-turbine',name:'Turbína v modelové krajině',status:'model',source:'model',hubHeight:this.state.height-75,rotorDiameter:150,uncertainty:'Výslovná ilustrace měřítka. Modelová krajina, stromy i stavby; nejde o skutečnou lokalitu, plánované stavby ani simulaci větru.'});model.position.set(0,this.height(0,0),0);this.future.add(model);return;}
    const datasets=[this.data.existing,this.state.scenario==='model'?this.data.model:this.state.scenario==='projects'?this.data.planned:{features:[]},this.data.simulation||{features:[]}];
    datasets.forEach((data,i)=>{for(const f of data.features){const [x,z]=localXY(f.geometry.coordinates,this.origin);if(Math.abs(x)>SIZE/2||Math.abs(z)>SIZE/2)continue;
      const p={...f.properties,coordinates:f.geometry.coordinates};let model=turbine(p);
      if(!model){model=new T.Mesh(new T.CylinderGeometry(8,8,2,8),new T.MeshLambertMaterial({color:0x3b654c}));model.userData={...p,uncertainty:p.uncertainty+' V místním pohledu jen bod polohy; rozměry chybí.'};}
      model.position.set(x,this.height(x,z),z);(i===2?this.simulation:i?this.future:this.existing).add(model);
    }});
  }
  setConstraintLayers(layers){if(!this.constraintGroups||!this.height)return;for(const [key,group] of this.constraintGroups){this.clear(group);if(this.illustrative)continue;for(const f of layers?.[key]?.features||[]){const polys=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];for(const rings of polys)for(const ring of rings){const points=drapedRingSegments(ring,this.origin,this.height).map(p=>new T.Vector3(...p));if(points.length){const line=new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:CONSTRAINT_COLORS[key]}));line.userData.entityStatus=f.properties.entityStatus;group.add(line);}}}}}
  constraintVisibility(before=false){for(const [key,group] of this.constraintGroups||[]){group.visible=!this.illustrative&&!!this.state.constraintLayers?.[key];for(const line of group.children)line.visible=!before||line.userData.entityStatus!=='simulation';}}
  setMode(mode,saved) {
    this.mode=mode;this.controls?.dispose();this.controls=null;const h=this.height?.(0,0)??0;
    if(mode==='eye'){
      this.camera=new T.PerspectiveCamera(this.state.fov||55,1,.2,15000);this.camera.position.set(0,h+1.7,0);this.yaw=Math.PI;this.lookPitch=.08;
      if(this.state.observer&&!this.illustrative){const [x,z]=localXY(this.state.observer,this.origin);if(Math.abs(x)<SIZE/2&&Math.abs(z)<SIZE/2)this.camera.position.set(x,this.height(x,z)+1.7,z);else this.notice('Pozorovatel je mimo místní výřez. Zvolte jeho stanoviště v editoru.');}
      if(saved?.length===6&&saved.every(Number.isFinite)){this.camera.position.fromArray(saved);this.yaw=saved[3];this.lookPitch=saved[4];}
      this.eyeLook();
    }else{
      this.camera=new T.OrthographicCamera(-2500,2500,1800,-1800,1,18000);this.camera.position.set(-3500,h+2858,3500);this.camera.lookAt(0,h,0);
      this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,h,0);this.controls.minZoom=.5;this.controls.maxZoom=20;this.controls.maxPolarAngle=Math.PI*.49;this.controls.enableDamping=false;
      this.camera.zoom=this.state.localZoom||(this.illustrative?3.3:1.7);if(saved?.length===6&&saved.every(Number.isFinite)){this.camera.position.fromArray(saved);this.controls.target.fromArray(saved,3);}this.controls.update();
    }this.resize();
  }
  animateRotors(dt){if(!this.state?.animation||this.reducedMotion)return;for(const group of [this.existing,this.future,this.simulation])for(const obj of group.children){const rotor=obj.getObjectByName('rotor');if(rotor)rotor.rotation.z=(rotor.rotation.z-dt*this.state.rpm*Math.PI/30)%(Math.PI*2);}}
  moveEye(f,r){if(this.mode!=='eye'||!this.height)return;this.camera.position.x+=20*(f*Math.sin(this.yaw)+r*Math.cos(this.yaw));this.camera.position.z+=20*(f*Math.cos(this.yaw)-r*Math.sin(this.yaw));this.camera.position.x=T.MathUtils.clamp(this.camera.position.x,-SIZE/2+10,SIZE/2-10);this.camera.position.z=T.MathUtils.clamp(this.camera.position.z,-SIZE/2+10,SIZE/2-10);this.eyeLook();this.saveCamera();}
  eyeLook(){this.camera.position.y=this.height(this.camera.position.x,this.camera.position.z)+1.7;this.camera.lookAt(this.camera.position.x+Math.sin(this.yaw)*Math.cos(this.lookPitch)*100,this.camera.position.y+Math.sin(this.lookPitch)*100,this.camera.position.z+Math.cos(this.yaw)*Math.cos(this.lookPitch)*100);}
  saveCamera(){if(!this.camera)return;const p=this.camera.position.toArray();this.onCamera(this.mode==='eye'?[...p,this.yaw,this.lookPitch,0]:[...p,...this.controls.target.toArray()],this.camera.zoom);}
  resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h||!this.camera)return;this.renderer.setSize(w,h);if(this.camera.isPerspectiveCamera)this.camera.aspect=w/h;else{this.camera.left=-1800*w/h;this.camera.right=1800*w/h;this.camera.top=1800;this.camera.bottom=-1800;}this.camera.updateProjectionMatrix();}
  draw(){if(!this.camera)return;const w=this.el.clientWidth,h=this.el.clientHeight;this.zones.visible=!this.illustrative&&this.state.zones;this.existing.visible=this.state.existing;this.simulation.visible=!this.illustrative;this.future.visible=this.state.scenario==='model'||(this.state.scenario==='projects'&&this.state.planned);
    this.constraintVisibility();this.renderer.setScissorTest(false);this.renderer.clear();
    if(this.state.compare){const s=Math.round(w*this.state.split/100);this.renderer.setScissorTest(true);this.renderer.setScissor(0,0,s,h);const show=this.future.visible;this.future.visible=false;this.simulation.visible=false;this.constraintVisibility(true);this.renderer.render(this.scene,this.camera);this.future.visible=show;this.simulation.visible=!this.illustrative;this.constraintVisibility();this.renderer.setScissor(s,0,w-s,h);this.renderer.render(this.scene,this.camera);this.renderer.setScissorTest(false);}else this.renderer.render(this.scene,this.camera);
  }
  pick(e){if(!this.camera)return;const rect=this.el.getBoundingClientRect();const v=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);const ray=new T.Raycaster();ray.setFromCamera(v,this.camera);
    // Include terrain/buildings in picking so hidden turbines cannot be clicked through hills.
    const after=!this.state.compare||(e.clientX-rect.left)/rect.width>=this.state.split/100;
    const objects=[this.ground,...(this.state.existing?[this.existing]:[]),...(after&&this.future.visible?[this.future]:[]),...(!this.illustrative&&this.state.zones?[this.zones]:[])];
    if(!this.illustrative&&this.onGround){const terrainHit=ray.intersectObject(this.ground.children[0],false)[0];if(terrainHit&&this.onGround(lonLat([terrainHit.point.x,terrainHit.point.z],this.origin)))return;}
    if(after&&this.simulation.visible)objects.push(this.simulation);
    const hit=ray.intersectObjects(objects,true)[0];if(!hit)return;let o=hit.object;while(o&&!o.userData.id)o=o.parent;if(o?.userData.id)this.onPick(o.userData);else if(!this.illustrative&&this.state.zones){const point=lonLat([hit.point.x,hit.point.z],this.origin);const zone=this.data.zones.features.find(f=>(f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]).some(r=>insidePolygon(point,r)));if(zone)this.onPick(zone.properties);}
  }
  hide(){this.visible=false;this.abort?.abort();this.el.hidden=true;}
}
