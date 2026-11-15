import {initCatalogUI} from './catalog-ui.mjs';
import {newTurbine,normalizeScenario,parseScenario,MAX_TURBINES} from './scenario.mjs';
export function initEditor({state,center,changed,openEye,arm,notice,catalog}){
 const host=document.createElement('fieldset');host.id='scenario-editor';host.innerHTML=`
 <legend>Moje simulace</legend><p class="warning">Vlastní návrhy, nikoli doložené projekty. Nejvýše 32 turbín.</p>
 <div class="editor-actions"><button type="button" id="user-add">+ Do středu mapy</button><button type="button" id="user-place">+ Kliknutím</button></div>
 <label for="user-select">Moje turbíny</label><select id="user-select"></select>
 <form id="user-form"><div class="editor-grid">
 <label>Délka °E<input name="lng" type="number" min="11.5" max="19.5" step="any" required></label><label>Šířka °N<input name="lat" type="number" min="48" max="51.6" step="any" required></label>
 <label>Náboj (m)<input name="hub" type="number" min="20" max="250" step="any" required></label><label>Rotor Ø (m)<input name="rotor" type="number" min="10" max="220" step="any" required></label>
 <label>Výkon (MW)<input name="power" type="number" min="0" max="30" step="any" required></label><label>Natočení od severu (°)<input name="heading" type="number" min="0" max="360" step="any" required></label></div>
 <output id="user-total"></output><div class="editor-actions"><button>Uložit parametry</button><button id="user-delete" type="button">Odebrat</button></div>
 <button id="user-move" type="button">Přesunout kliknutím do mapy</button></form>
 <p id="user-empty">Zatím nemáte žádnou turbínu.</p><p id="editor-message" role="status"></p>
 <div class="editor-actions"><button type="button" id="user-export">Export JSON</button><label class="file-button">Import JSON<input id="user-import" type="file" accept="application/json,.json"></label></div>
 <hr><label>Pozorovatel · délka °E<input id="observer-lng" type="number" step="any" min="11.5" max="19.5"></label><label>Pozorovatel · šířka °N<input id="observer-lat" type="number" step="any" min="48" max="51.6"></label>
 <div class="editor-actions"><button type="button" id="observer-place">Vybrat v mapě</button><button type="button" id="observer-show">Pohled 1,7 m</button></div>
 <label for="observer-fov">Zorné pole kamery <output id="fov-value"></output></label><input id="observer-fov" type="range" min="35" max="90" value="55">
 <p class="muted">Pohled z terénu je orientační. Budovy a vegetace jsou dostupné jen v demonstrátoru Pchery. Místní výřez má 6 × 6 km.</p>`;
 document.querySelector('.landscape-panel').before(host);const $=id=>host.querySelector('#'+id),form=$('user-form');let selected=state.simulation.objects[0]?.id;let catalogUI;catalogUI=initCatalogUI(host,{catalog,current:()=>state.simulation.objects.find(o=>o.id===selected),apply:o=>commit(state.simulation.objects.map(x=>x.id===o.id?o:x))});
 function report(e){$('editor-message').textContent=e.message||String(e);}
 function refresh(){const select=$('user-select');select.replaceChildren();for(const o of state.simulation.objects){const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.name;select.append(opt);}if(!state.simulation.objects.some(o=>o.id===selected))selected=state.simulation.objects[0]?.id;select.value=selected||'';const o=state.simulation.objects.find(o=>o.id===selected);form.hidden=!o;$('user-empty').hidden=!!o;if(o){for(const [name,v]of Object.entries({lng:o.geometry.coordinates[0],lat:o.geometry.coordinates[1],hub:o.dimensions.hub_height_m,rotor:o.dimensions.rotor_diameter_m,power:o.capacity_mw,heading:o.heading_deg}))form.elements[name].value=v;$('user-total').textContent='Maximum po špičku: '+o.dimensions.total_height_m+' m';}const p=state.observer||center();$('observer-lng').value=p[0].toFixed(6);$('observer-lat').value=p[1].toFixed(6);$('observer-fov').value=state.fov;$('fov-value').textContent=state.fov+'°';catalogUI?.refresh();}
 function commit(objects){try{state.simulation=normalizeScenario({version:1,objects});$('editor-message').textContent='Scénář uložen do sdíleného odkazu.';refresh();changed();}catch(e){report(e);}}
 function add(p){if(state.simulation.objects.length>=MAX_TURBINES){report('Nejvýše 32 turbín.');return;}try{const o=newTurbine(p);let n=1;while(state.simulation.objects.some(x=>x.name==='Moje turbína '+n))n++;o.name='Moje turbína '+n;selected=o.id;commit([...state.simulation.objects,o]);}catch(e){report(e);}}
 function place(kind,fn){arm(fn);notice(kind+' · klikněte do přehledu nebo na terén místní ISO mapy. Esc výběr zruší.');}
 $('user-add').onclick=()=>add(center());$('user-place').onclick=()=>place('Umístění nové turbíny',add);
 $('user-select').onchange=e=>{selected=e.target.value;refresh();};
 form.onsubmit=e=>{e.preventDefault();const current=state.simulation.objects.find(o=>o.id===selected);if(!current)return;const n=k=>Number(form.elements[k].value);commit(state.simulation.objects.map(o=>o.id===selected?{...o,...(o.catalog_ref?{catalog_ref:{...o.catalog_ref,manual:true}}:{}),geometry:{type:'Point',coordinates:[n('lng'),n('lat')]},dimensions:{hub_height_m:n('hub'),rotor_diameter_m:n('rotor')},capacity_mw:n('power'),heading_deg:n('heading')}:o));};
 $('user-delete').onclick=()=>commit(state.simulation.objects.filter(o=>o.id!==selected));
 $('user-move').onclick=()=>place('Přesun vybrané turbíny',p=>commit(state.simulation.objects.map(o=>o.id===selected?{...o,geometry:{type:'Point',coordinates:p}}:o)));
 $('user-export').onclick=()=>{const blob=new Blob([JSON.stringify(state.simulation,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vitr-scenar.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('user-import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>50000)throw Error('Soubor je příliš velký.');const s=parseScenario(await file.text());commit(s.objects);}catch(e){report(e);}finally{e.target.value='';}};
 function observer(p){try{const probe=newTurbine(p);state.observer=probe.geometry.coordinates;refresh();changed();}catch(e){report(e);}}
 $('observer-place').onclick=()=>place('Stanoviště pozorovatele',observer);
 $('observer-show').onclick=()=>{const p=[Number($('observer-lng').value),Number($('observer-lat').value)];try{newTurbine(p);state.observer=p;changed();openEye(p);}catch(e){report(e);}};
 $('observer-fov').oninput=e=>{state.fov=Number(e.target.value);$('fov-value').textContent=state.fov+'°';changed();};refresh();
 return {select(id){selected=id;refresh();host.scrollIntoView({block:'nearest'});}};
}
