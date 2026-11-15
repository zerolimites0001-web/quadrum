import {safePath,readZip} from './zip.js';
import {normalizeManifest} from './mod-manifest.js';
import {hashSeed} from './noise.js';
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||new Error('Falha no armazenamento do mod'));});
export const MOD_BASE=new URL('../__quadrum_mods__/',import.meta.url).href;
export class ModStore {
 constructor({baseURL=MOD_BASE}={}){this.baseURL=baseURL;}
 async open(){if(this.db)return;const r=indexedDB.open('quadrum-imported-mods',1);r.onupgradeneeded=()=>{r.result.createObjectStore('packs',{keyPath:'uuid'});const files=r.result.createObjectStore('files',{keyPath:'key'});files.createIndex('pack','pack');};this.db=await request(r);}
 async list(){await this.open();return request(this.db.transaction('packs').objectStore('packs').getAll());}
 async prepare(input){
  let files=[];for(const file of input){if(/\.zip$/i.test(file.name)){if(input.length!==1)throw new Error('Importe apenas um ZIP por vez');files=await readZip(file);}else files.push({path:safePath(file.webkitRelativePath||file.name),blob:file});}
  if(!files.length||files.length>2048||files.reduce((s,f)=>s+f.blob.size,0)>64*1024*1024)throw new Error('Seleção vazia ou pacote maior que 64 MB / 2048 arquivos');
  const packs=files.filter(f=>f.path.split('/').pop()==='pack.json');let raw,uuid,root='',entry;
  if(packs.length===1){const p=packs[0];if(p.blob.size>128*1024)throw new Error('pack.json muito grande');raw=JSON.parse(await p.blob.text());uuid=String(raw.uuid||raw.UUID||raw.UIID||raw.uiid||raw.id||'').toLowerCase();root=p.path.slice(0,-'pack.json'.length);entry='pack.json';files=files.filter(f=>f.path.startsWith(root)).map(f=>({path:f.path.slice(root.length),blob:f.blob}));}
  else if(!packs.length&&files.length===1&&/\.m?js$/i.test(files[0].path)){const file=files[0];uuid='single-'+hashSeed(file.path.split('/').pop()).toString(16);raw={uuid,name:file.path.split('/').pop(),description:'JavaScript importado manualmente',js:'main.js'};files=[{path:'main.js',blob:file.blob}];entry='pack.json';files.push({path:'pack.json',blob:new Blob([JSON.stringify(raw)],{type:'application/json'})});}
  else throw new Error('Selecione uma pasta/ZIP com um único pack.json, ou um único arquivo .js');
  const base=new URL(encodeURIComponent(uuid)+'/',this.baseURL).href,manifest=normalizeManifest(raw,new URL(entry,base).href),paths=new Set();
  for(const file of files){file.path=safePath(file.path);if(paths.has(file.path))throw new Error('Arquivo duplicado: '+file.path);paths.add(file.path);}
  for(const url of Object.values(manifest.files).flat()){if(!url.startsWith(base)||!paths.has(decodeURIComponent(new URL(url).pathname.slice(new URL(base).pathname.length))))throw new Error('Arquivo não selecionado ou fora do pacote: '+url);}
  return{uuid,raw,manifest,files,importedAt:Date.now(),size:files.reduce((s,f)=>s+f.blob.size,0)};
 }
 async put(pack){await this.open();const tx=this.db.transaction(['packs','files'],'readwrite'),finished=done(tx);const store=tx.objectStore('files');const cursor=store.index('pack').openCursor(IDBKeyRange.only(pack.uuid));cursor.onsuccess=()=>{const c=cursor.result;if(c){c.delete();c.continue();}else{for(const file of pack.files)store.put({key:pack.uuid+'/'+file.path,pack:pack.uuid,blob:file.blob});tx.objectStore('packs').put({uuid:pack.uuid,raw:pack.raw,importedAt:pack.importedAt,size:pack.size,fileCount:pack.files.length});}};await finished;}
 async remove(uuid){await this.open();const tx=this.db.transaction(['packs','files'],'readwrite'),finished=done(tx);tx.objectStore('packs').delete(uuid);const cursor=tx.objectStore('files').index('pack').openCursor(IDBKeyRange.only(uuid));cursor.onsuccess=()=>{const c=cursor.result;if(c){c.delete();c.continue();}};await finished;}
 async bridge(){if(this.bridged&&navigator.serviceWorker.controller)return;if(!navigator.serviceWorker||!isSecureContext)throw new Error('Mods importados precisam de localhost/HTTPS com Service Worker (não file://)');const registration=await navigator.serviceWorker.register(new URL('../mod-worker.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname});
  if(!registration.active)await new Promise((resolve,reject)=>{const worker=registration.installing||registration.waiting;if(!worker)return reject(new Error('Service Worker indisponível'));const check=()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(new Error('Service Worker recusado'));};worker.addEventListener('statechange',check);check();});
  if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',change);reject(new Error('Recarregue a página para concluir a importação'));},8000);const change=()=>{clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',change);resolve();};navigator.serviceWorker.addEventListener('controllerchange',change);});this.bridged=true;
 }
}
