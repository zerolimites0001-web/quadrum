import {EventBus} from './events.js';
import {normalizeManifest,singleFileManifest} from './mod-manifest.js';
import {createModAPI} from './mod-api.js';
import {BLOCKS,ITEMS,ID} from './blocks.js';
import {KillScope,installKillHooks} from './kill.js';
import {ModStore,MOD_BASE} from './mod-store.js';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
export class ModManager {
 constructor(game){installKillHooks();this.game=game;this.renderOverrides=new Map();this.effects=new Map();this.sounds=new Map();this.records=new Map();this.urls=new Set();this.bus=new EventBus((e,name)=>this.error(e,'evento '+name));this.enabledPrefs=new Set(read('quadrum-enabled-mods',[]));this.store=new ModStore();this.listeners=new Set();this.booted=false;game.mods=this;
  this.globalRecord={manifest:{uuid:'console',name:'Console',baseURL:new URL('./',location.href).href,assets:{}},cleanups:[],blocks:[],items:[],status:'active'};
  const api=createModAPI(this,this.globalRecord);api.mods=this;api.getMod=id=>this.records.get(id)?.api||null;api.current=null;window.Quadrum=api;
 }
 changed(){for(const f of this.listeners)f();}
 subscribe(callback){this.listeners.add(callback);return()=>this.listeners.delete(callback);}
 error(error,context='mod'){console.error('[Quadrum mods]',context,error);this.game.ui.toast('Erro em '+context+': '+(error?.message||error));}
 persist(){try{localStorage.setItem('quadrum-enabled-mods',JSON.stringify([...this.enabledPrefs]));}catch(e){this.error(e,'preferências dos mods');}}
 record(pack){const url=new URL(encodeURIComponent(pack.uuid)+'/pack.json',MOD_BASE).href,manifest=normalizeManifest(pack.raw,url);return{manifest,imported:pack,status:'disabled',error:null,cleanups:[],blocks:[],items:[],api:null};}
 async importFiles(files){const pack=await this.store.prepare([...files]);const existing=this.records.get(pack.uuid);if(existing){if(!confirm('Atualizar o pacote '+existing.manifest.name+' com os arquivos selecionados?'))return null;await this.disable(pack.uuid);}await this.store.put(pack);const record=this.record(pack);this.records.set(pack.uuid,record);this.changed();return record;}
 async remove(id){await this.disable(id);await this.store.remove(id);this.records.delete(id);this.enabledPrefs.delete(id);this.persist();this.changed();}
 async boot(){if(this.booted)return;try{for(const pack of await this.store.list())try{const record=this.record(pack);this.records.set(record.manifest.uuid,record);}catch(e){this.error(e,'pacote importado');}for(const id of [...this.enabledPrefs]){const record=this.records.get(id);if(record)try{await this.enable(id,[]);}catch(e){this.error(e,record.manifest.name);}}}catch(e){console.warn('Mods indisponíveis:',e);}this.booted=true;this.changed();}

 async enable(id,stack=[]){if([...this.records.values()].some(r=>r.status==='loading'))throw new Error('Aguarde o carregamento do outro mod.');const r=this.records.get(id);if(!r)throw new Error('Mod não encontrado: '+id);if(r.status==='active')return r.api;if(stack.includes(id))throw new Error('Dependência circular: '+[...stack,id].join(' → '));if(r.status==='loading')throw new Error('Mod já está carregando.');
  await this.store.bridge();for(const dep of r.manifest.dependencies){if(!this.records.has(dep))throw new Error('Dependência ausente: '+dep);await this.enable(dep,[...stack,id]);}
  if([...this.records.values()].some(other=>other.status==='loading'))throw new Error('Aguarde o outro mod.');r.status='loading';r.error=null;r.cleanups=[];r.blocks=[];r.items=[];r.scope=new KillScope(this.game,r.manifest);r.api=createModAPI(this,r);const scope=r.scope;this.changed();window.Quadrum.current=r.api;
  try{
   for(const href of r.manifest.files.css)await scope.wait(r.api.ui.style(href));
   for(const href of r.manifest.files.html)await scope.wait(r.api.ui.mount(href));
   for(const src of r.manifest.files.js){const moduleURL=new URL(src);moduleURL.searchParams.set('quadrumActivation',String((r.activations=(r.activations||0)+1)));const module=await scope.wait(import(moduleURL.href));const activate=module.activate||module.default;if(activate!==undefined&&typeof activate!=='function')throw new Error('default/activate precisa ser uma função.');if(activate){const cleanup=await scope.wait(scope.run(activate,r.api));if(typeof cleanup==='function')r.cleanups.push(cleanup);}if(typeof module.deactivate==='function')r.cleanups.push(()=>module.deactivate(r.api));}
   await scope.wait(this.refreshContent());if(!scope.active)throw new DOMException('Mod desativado','AbortError');r.status='active';this.enabledPrefs.add(id);this.persist();this.bus.emit('modLoaded',{id,api:r.api});return r.api;
  }catch(e){if(r.scope===scope){await this.cleanup(r);r.status=e.name==='AbortError'?'disabled':'error';r.error=e.name==='AbortError'?null:e.message;this.enabledPrefs.delete(id);this.persist();await this.refreshContent();}throw e;}
  finally{window.Quadrum.current=null;this.changed();}
 }
 async disable(id){const r=this.records.get(id);if(!r)return;const dependent=[...this.records.values()].find(other=>other.status==='active'&&other.manifest.dependencies.includes(id));if(dependent)throw new Error('Desative primeiro '+dependent.manifest.name);await this.cleanup(r);r.status='disabled';this.enabledPrefs.delete(id);this.persist();await this.refreshContent();this.bus.emit('modUnloaded',{id});if(this.game.running)this.game.render();this.changed();}
 cleanup(r){if(r.cleaning)return r.cleaning;const scope=r.scope;r.scope?.kill();this.releaseScopeOverrides(scope);const callbacks=r.cleanups.splice(0),blockIds=r.blocks.splice(0),itemIds=r.items.splice(0);const task=(async()=>{
  for(const fn of callbacks.reverse())try{await fn();}catch(e){this.error(e,r.manifest.name+' / limpeza');}
  for(const id of blockIds){const block=BLOCKS[id],key=block.key,namespace=block.namespace;for(const k of Object.keys(block))delete block[k];Object.assign(block,{id,key,namespace,name:'Bloco ausente · '+key,category:'Mods',texture:'generated:missing:'+key,color:'#db39c8',solid:true,transparent:false,missing:true,hidden:true});}
  for(const id of itemIds){const item=ITEMS.get(id);if(item){const key=item.key;for(const k of Object.keys(item))delete item[k];Object.assign(item,{id,key,name:'Item ausente · '+key,item:true,missing:true,hidden:true,texture:'generated:missing:'+key,color:'#db39c8',onUse:null});}}
 })();r.cleaning=task;return task.finally(()=>{if(r.cleaning===task)r.cleaning=null;});
 }

 acquireRenderOverride(record,id){const token={record,scope:record.scope,id};if(!this.renderOverrides.has(id))this.renderOverrides.set(id,new Set());this.renderOverrides.get(id).add(token);BLOCKS[id].renderHidden=true;this.game.world?.refreshRenderOverrides();return()=>this.releaseRenderOverride(token);}
 releaseRenderOverride(token){const owners=this.renderOverrides.get(token.id);owners?.delete(token);if(!owners?.size)this.renderOverrides.delete(token.id);BLOCKS[token.id].renderHidden=!!owners?.size;this.game.world?.refreshRenderOverrides();}
 releaseScopeOverrides(scope){if(!scope)return;for(const owners of [...this.renderOverrides.values()])for(const token of [...owners])if(token.scope===scope)this.releaseRenderOverride(token);}
 async refreshContent(){if(!this.game.ready)return;await this.game.textures.sync();this.game.world?.refreshRenderOverrides();const world=this.game.world;if(world)for(const c of world.chunks.values())if(c.group)world.enqueue(c.cx,c.cz,true);this.game.ui.renderHotbar();this.game.ui.contentChanged?.();}
}
