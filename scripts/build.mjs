import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),out=path.resolve('dist'),policy=JSON.parse(fs.readFileSync('data/catalog-policy.json','utf8')),withCatalog=process.argv.includes('--with-catalog');
if(withCatalog&&(!policy.redistributionApproved||!policy.authorizationUrl||!policy.approvedAt))throw Error('Katalog ČSVE nelze zahrnout: chybí doložené oprávnění k redistribuci.');
if(path.dirname(out)!==root||path.basename(out)!=='dist'||!fs.existsSync(path.join(root,'index.html')))throw Error('Neplatný adresář sestavení.');
// Recreate only the verified build directory, so a prior research build cannot leak reference files.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const files=['index.html','style.css','app.mjs','core.mjs','local.mjs','landscape.mjs','scenario.mjs','editor.mjs','catalog.mjs','catalog-ui.mjs','constraints.mjs','constraint-ui.mjs','visibility.mjs','view-sector.mjs','dem.mjs','panorama.mjs','pin-ui.mjs','README.md','_headers','.htaccess'];for(const file of files)fs.copyFileSync(file,path.join(out,file));
for(const dir of ['vendor','data','dem','models','credits','spike','docs'])fs.cpSync(dir,path.join(out,dir),{recursive:true,filter:src=>withCatalog||!path.relative(root,path.resolve(src)).split(path.sep).join('/').startsWith('data/reference')});
let bytes=0,count=0;function walk(p){for(const f of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,f.name);if(f.isDirectory())walk(q);else{const size=fs.statSync(q).size;if(size>25*1024*1024)throw Error('Soubor přesahuje 25 MiB: '+q);bytes+=size;count++;}}}walk(out);console.log(JSON.stringify({files:count,bytes,mib:+(bytes/1024/1024).toFixed(2),catalogIncluded:withCatalog}));
