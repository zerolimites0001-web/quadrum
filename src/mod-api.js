import * as THREE from '../vendor/three.module.js';
import {BLOCKS,ID,ITEMS,registerBlock,registerItem,getBlock,getEntry,contentKey} from './blocks.js';
import {resolveAssets} from './mod-manifest.js';
import {CHUNK,HEIGHT,SEA,index} from './terrain.js';
import {withoutTracking} from './kill.js';
function disposeObject(object){object.traverse?.(child=>{child.geometry?.dispose();for(const material of Array.isArray(child.material)?child.material:[child.material])material?.dispose();});}
export function createModAPI(manager,record){
 const game=manager.game,manifest=record.manifest,ns=manifest.uuid,scope=record.scope||null;let root=null;
 const assertActive=()=>{if(scope&&!scope.active)throw new DOMException('Mod desativado','AbortError');};
 const own=cleanup=>{if(scope&&!scope.active){cleanup();return()=>{};}let done=false;const stop=()=>{if(done)return;done=true;const i=record.cleanups.indexOf(stop);if(i>=0)record.cleanups.splice(i,1);return cleanup();};record.cleanups.push(stop);return stop;};
 const guard=(fn,label)=>{let errors=0;return function(...args){if(errors>=3)return;try{const result=scope?scope.run(()=>fn.apply(this,args)):fn.apply(this,args);if(result?.catch)return result.catch(e=>{errors++;manager.error(e,manifest.name+' / '+label);});return result;}catch(e){errors++;manager.error(e,manifest.name+' / '+label);}};};
 const url=path=>new URL(path,manifest.baseURL).href;
 const on=(name,callback,options={})=>{const safe=guard(callback,name),off=own(manager.bus.on(name,safe,options));if(options.replay!==false&&((name==='engineReady'&&game.ready)||(name==='worldEnter'&&game.running)))queueMicrotask(()=>{if(record.status!=='disabled'&&record.status!=='error')safe({type:name,game,world:game.world,player:game.player,scene:game.scene,camera:game.camera,replay:true});});return off;};
 const fetchAsset=async path=>{const response=await fetch(url(path));if(!response.ok)throw new Error('Recurso não encontrado: '+path+' ('+response.status+')');return response;};
 const texturePath=path=>typeof path==='string'&&!path.startsWith('generated:')&&(/[\/]|\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(path))?url(path):path;
 const definition=def=>{const out={...def};if(out.textures){out.texture=out.texture||out.textures.all||out.textures.side;for(const face of ['top','bottom','side','front'])if(out.textures[face])out[face]=out.textures[face];}for(const face of ['texture','top','bottom','side','front'])if(out[face])out[face]=texturePath(out[face]);return out;};
 const scoped=name=>name.includes(':')?name:contentKey(ns,name);
 const api={version:'1.0.0',apiVersion:1,THREE,manifest,namespace:ns,url,resolve:url,assets:resolveAssets(manifest.assets,manifest.baseURL),constants:{CHUNK,HEIGHT,SEA,index},
  onDispose:own,log:(...args)=>console.log('['+manifest.name+']',...args),warn:(...args)=>console.warn('['+manifest.name+']',...args),toast:message=>game.ui.toast(String(message)),
  events:{on,once:(name,fn)=>on(name,fn,{once:true}),emit:(name,data)=>manager.bus.emit(name,data)},
  ready:async()=>{assertActive();await withoutTracking(()=>game.init());assertActive();return api;},
  save:()=>game.save(),
  blocks:{
   async register(key,def={}){assertActive();const id=registerBlock(ns,key,definition(def));record.blocks.push(id);for(const [hook,event] of [['onPlace','blockPlace'],['onBreak','blockBreak']])if(typeof def[hook]==='function')on(event,e=>{if(e.id===id)def[hook](e,api);});await manager.refreshContent();return id;},
   get:key=>typeof key==='number'?getBlock(key):getBlock(ID[key]??ID[scoped(key)]??0),
   id:key=>typeof key==='number'?key:ID[key]??ID[scoped(key)],
   async hide(key){assertActive();const id=typeof key==='number'?key:ID[key]??ID[scoped(key)];if(!BLOCKS[id])throw new Error('Bloco não encontrado: '+key);const stop=own(manager.acquireRenderOverride(record,id));await manager.refreshContent();return stop;},
   list:()=>BLOCKS.filter(b=>!b.hidden),
  },
  items:{async register(key,def={}){assertActive();const item=definition(def);if(typeof item.onUse==='function'){const callback=item.onUse;item.onUse=guard(event=>callback(event,api),'item '+key);}const id=registerItem(ns,key,item);record.items.push(id);await manager.refreshContent();return id;},get:key=>ITEMS.get(key.startsWith('item:')?key:'item:'+scoped(key)),list:()=>[...ITEMS.values()].filter(b=>!b.hidden),equip:id=>game.equip(id)},
  systems:{register(name,system){const spec=typeof system==='function'?{update:system}:system;if(typeof spec?.update!=='function')throw new Error('Sistema precisa de update(dt, api).');const stop=on('tick',e=>spec.update(e.dt,api));if(spec.start)spec.start(api);return own(()=>{stop();spec.dispose?.(api);});}},
  textures:{
   register(name,source){assertActive();const key=scoped(name),value=typeof source==='string'?url(source):source;game.textures.register(key,value);own(()=>{if(game.textures.sources.get(key)===value)game.textures.sources.delete(key);});return key;},
   update:(name,source)=>game.textures.update(scoped(name),source),
   async load(path,{nearest=true,...options}={}){const texture=await new THREE.TextureLoader().setCrossOrigin('anonymous').loadAsync(url(path));if(nearest){texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;}texture.colorSpace=THREE.SRGBColorSpace;Object.assign(texture,options);own(()=>texture.dispose());return texture;},
   sync:()=>manager.refreshContent(),
  },
  resources:{text:async path=>(await fetchAsset(path)).text(),json:async path=>(await fetchAsset(path)).json(),blob:async path=>(await fetchAsset(path)).blob()},
  ui:{
   get root(){if(!root){root=document.createElement('div');root.className='mod-root';root.dataset.mod=ns;document.body.append(root);own(()=>root.remove());}return root;},
   async mount(pathOrHTML,{parent}={}){const inline=pathOrHTML.trim().startsWith('<'),base=inline?manifest.baseURL:url(pathOrHTML),text=inline?pathOrHTML:await(await fetchAsset(pathOrHTML)).text();const node=document.createElement('div');node.dataset.mod=ns;node.innerHTML=text;
    // HTML é interface; o código é carregado como módulo JS, não via innerHTML.
    for(const script of node.querySelectorAll('script'))script.remove();
    for(const element of node.querySelectorAll('[src],[href],[poster]'))for(const attr of ['src','href','poster']){const value=element.getAttribute(attr);if(value&&!value.startsWith('#'))element.setAttribute(attr,new URL(value,base).href);}
    (parent||api.ui.root).append(node);own(()=>node.remove());return node;
   },
   async style(pathOrCSS,{inline=false}={}){let element;if(inline){element=document.createElement('style');element.textContent=pathOrCSS;document.head.append(element);}else{element=document.createElement('link');element.rel='stylesheet';element.href=url(pathOrCSS);const loaded=new Promise((resolve,reject)=>{element.onload=resolve;element.onerror=()=>reject(new Error('CSS indisponível: '+pathOrCSS));});document.head.append(element);own(()=>element.remove());await loaded;return element;}own(()=>element.remove());return element;},
   button(label,callback,{parent,className=''}={}){const button=document.createElement('button');button.textContent=label;button.className=className;button.addEventListener('click',guard(callback,'botão'));(parent||api.ui.root).append(button);own(()=>button.remove());return button;},
  },
  input:{get keys(){return game.controls.keys;},get actions(){return game.controls.actions;},get joystick(){return game.controls.joy;},on(type,callback,target=window){const safe=guard(callback,'input '+type);target.addEventListener(type,safe);return own(()=>target.removeEventListener(type,safe));}},
  timers:{interval(fn,ms){const id=setInterval(guard(fn,'interval'),Math.max(10,ms));return own(()=>clearInterval(id));},timeout(fn,ms){const id=setTimeout(guard(fn,'timeout'),ms);return own(()=>clearTimeout(id));}},
  rendering:{createRenderTarget(width,height,options={}){const target=new THREE.WebGLRenderTarget(width,height,options);own(()=>target.dispose());return target;}},
  shaders:{create(options){const material=new THREE.ShaderMaterial(options);own(()=>material.dispose());return material;},async load({vertex,fragment,...options}){const [vertexShader,fragmentShader]=await Promise.all([api.resources.text(vertex),api.resources.text(fragment)]);return api.shaders.create({...options,vertexShader,fragmentShader});}},
  add(object,{dispose=true}={}){const add=()=>game.scene?.add(object);if(game.scene)add();else on('engineReady',add,{once:true});own(()=>{object.removeFromParent();if(dispose)disposeObject(object);});return object;},
  animations:{
   onFrame:callback=>on('tick',e=>callback(e.dt,api)),
   play(object,clip,{timeScale=1,loop=THREE.LoopRepeat,repetitions=Infinity}={}){const mixer=new THREE.AnimationMixer(object),action=mixer.clipAction(clip);action.setLoop(loop,repetitions);mixer.timeScale=timeScale;action.play();const off=on('tick',e=>mixer.update(e.dt)),stop=own(()=>{off();mixer.stopAllAction();mixer.uncacheRoot(object);});return{mixer,action,stop};},
  },
  effects:{
   register(name,factory){if(typeof factory!=='function')throw new Error('Efeito precisa de função.');const key=scoped(name);manager.effects.set(key,factory);own(()=>manager.effects.delete(key));return key;},
   play(name,options={}){const factory=manager.effects.get(scoped(name));if(!factory)throw new Error('Efeito não registrado: '+name);return factory(options,api);},
   spawn({object,duration=1,update,dispose=true}){if(!game.scene)throw new Error('Aguarde engineReady antes de criar efeitos.');game.scene.add(object);let elapsed=0,off=()=>{};const stop=own(()=>{off();object.removeFromParent();if(dispose)disposeObject(object);});off=on('tick',e=>{elapsed+=e.dt;if(update)update({object,dt:e.dt,elapsed,api});if(elapsed>=duration)stop();});return{object,stop};},
  },
  sounds:{
   register(name,path,options={}){const key=scoped(name);manager.sounds.set(key,{url:url(path),...options});own(()=>manager.sounds.delete(key));return key;},
   play(name,options={}){if(!game.settings.sound)return null;const def=manager.sounds.get(scoped(name));if(!def)throw new Error('Som não registrado: '+name);const audio=new Audio(def.url);audio.volume=Math.max(0,Math.min(1,options.volume??def.volume??1));audio.loop=!!(options.loop??def.loop);audio.playbackRate=options.rate??def.rate??1;const stop=own(()=>{audio.pause();audio.src='';});audio.onended=()=>{if(!audio.loop)stop();};audio.play().catch(e=>{console.warn('Som bloqueado/indisponível:',name,e);stop();});audio.stop=stop;return audio;},
   tone({frequency=440,duration=.12,volume=.05,type='sine'}={}){if(!game.settings.sound)return;const ctx=game.audio||(game.audio=new(window.AudioContext||window.webkitAudioContext)());ctx.resume().catch(()=>{});const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+Math.max(.01,duration));osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+Math.max(.01,duration));osc.onended=()=>{osc.disconnect();gain.disconnect();};},
  },
  storage:{get(key,fallback=null){try{return JSON.parse(localStorage.getItem('quadrum:mod:'+ns+':'+key))??fallback;}catch{return fallback;}},set(key,value){assertActive();localStorage.setItem('quadrum:mod:'+ns+':'+key,JSON.stringify(value));},remove:key=>localStorage.removeItem('quadrum:mod:'+ns+':'+key)},
  worldData:{get(key,fallback=null){return game.world?.meta.modData?.[ns]?.[key]??fallback;},set(key,value){assertActive();if(!game.world)throw new Error('Nenhum mundo aberto.');const data=JSON.parse(JSON.stringify(value));const meta=game.world.meta;meta.modData??={};meta.modData[ns]??={};meta.modData[ns][key]=data;}},
  getEntry,
 };
 for(const name of ['scene','camera','renderer','canvas','world','player','controls'])Object.defineProperty(api,name,{enumerable:true,get:()=>game[name]||null});
 Object.defineProperty(api,'game',{enumerable:true,get:()=>game});
 return api;
}
