import * as THREE from '../vendor/three.module.js';
import {Textures} from './textures.js';
import {World} from './world.js';
import {Player} from './player.js';
import {BLOCKS,ITEMS,DEFAULT_HOTBAR,getBlock,getEntry,restorePalette,blockPalette} from './blocks.js';
import {Controls} from './controls.js';
export class Game {
 constructor(storage,settings,ui){this.storage=storage;this.settings=settings;this.ui=ui;this.canvas=document.getElementById('game');this.textures=new Textures();this.ready=false;this.running=false;this.paused=true;this.selected=0;this.hotbar=[...DEFAULT_HOTBAR];this.lastAction=0;this.lastSave=0;this.saving=null;
  this.controls=new Controls(this.canvas,{look:(x,y)=>this.player?.look(x,y,this.settings.sensitivity),pause:()=>this.ui.pause(),inventory:()=>this.ui.inventory(),slot:i=>this.select(i),scroll:d=>this.select((this.selected+d+9)%9),fly:()=>this.toggleFly(),pick:()=>this.pick()});
  window.addEventListener('resize',()=>this.resize());
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.running){this.ui.pause();this.save().catch(e=>this.ui.toast('Falha ao salvar: '+e.message));}});
  window.addEventListener('pagehide',()=>{if(this.running)this.save().catch(()=>{});});
  this.frame=this.frame.bind(this);this.lastTime=performance.now();requestAnimationFrame(this.frame);
 }
 init(progress=()=>{}){if(this.ready)return Promise.resolve();if(this.initializing)return this.initializing;this.initializing=this.initialize(progress).finally(()=>{this.initializing=null;});return this.initializing;}
 async initialize(progress){if(this.ready)return;
  try{this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:false,powerPreference:'high-performance',alpha:false});}catch{throw new Error('WebGL 2 indisponível. Ative a aceleração gráfica ou use um navegador atualizado.');}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.setClearColor(0x8dc4e8);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.sortObjects=true;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x8dc4e8);this.camera=new THREE.PerspectiveCamera(this.settings.fov,1,.06,160);
  this.scene.add(new THREE.HemisphereLight(0xddecff,0x8f8a69,1.45));const sun=new THREE.DirectionalLight(0xffefcf,1.4);sun.position.set(80,120,50);this.scene.add(sun);
  this.outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.008,1.008,1.008)),new THREE.LineBasicMaterial({color:0x171f13,transparent:true,opacity:.8}));this.scene.add(this.outline);this.outline.visible=false;
  await this.textures.load(progress);this.ready=true;this.resize();this.mods?.bus.emit('engineReady',{game:this,scene:this.scene,camera:this.camera,renderer:this.renderer});
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(this.running)this.ui.pause();this.ui.toast('Contexto gráfico perdido. Seu mundo foi preservado; recarregue a página.');this.save().catch(()=>{});});
 }
 async start(meta,onProgress){const remap=restorePalette(meta.blockPalette);await this.init(v=>onProgress(v*.65,'Carregando texturas'));await this.textures.sync();if(this.world)this.world.dispose();const edits=await this.storage.edits(meta.id);this.world=new World(meta,this.scene,this.textures,edits,this.mods?.bus);this.player=new Player(this.camera,this.world,meta.player);this.hotbar=meta.hotbar?.length===9?meta.hotbar.map((id,i)=>typeof id==='string'&&id.startsWith('item:')?id:BLOCKS[remap.get(id)??id]&&id?(remap.get(id)??id):DEFAULT_HOTBAR[i]):[...DEFAULT_HOTBAR];this.selected=0;
  const p=this.player.position;this.world.stream(p.x,p.z,this.settings.distance);
  for(let i=0;i<9&&this.world.queue.length;i++){this.world.update(0);onProgress(.65+(i+1)/9*.35,'Gerando o terreno');await new Promise(r=>setTimeout(r,0));}
  // Evita nascer dentro de uma árvore nova ou de blocos importados.
  for(let i=0;i<12;i++){const x=Math.floor(p.x),z=Math.floor(p.z),y=Math.floor(p.y);if(!this.world.solid(x,y,z)&&!this.world.solid(x,y+1,z))break;p.y++;}
  this.player.updateCamera();this.running=true;this.paused=false;this.lastSave=performance.now();this.lastTime=performance.now();this.controls.enabled=true;this.applySettings();this.ui.renderHotbar();this.select(0);this.ui.flyState(this.player.flying);this.mods?.bus.emit('worldEnter',{game:this,world:this.world,player:this.player});this.render();
 }
 resize(){if(!this.renderer)return;const w=window.innerWidth,h=window.innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 applySettings(){this.controls.setTouch(this.settings.touch||matchMedia('(pointer:coarse)').matches);if(!this.camera)return;this.camera.fov=this.settings.fov;this.camera.far=(this.settings.distance+2)*16;this.camera.updateProjectionMatrix();this.scene.fog=new THREE.Fog(0x8dc4e8,this.settings.distance*16*.48,(this.settings.distance+.8)*16);this.world&&(this.world.lastCenter='');}
 setPaused(paused){this.paused=paused;this.mods?.bus.emit(paused?'pause':'resume',{game:this});this.controls.enabled=!paused&&this.running;this.controls.clear();if(paused)this.controls.unlock();else{this.lastTime=performance.now();this.controls.lock();}}
 select(slot){if(!Number.isInteger(slot)||slot<0||slot>8)return;this.selected=slot;this.ui.selectSlot(slot,getEntry(this.hotbar[slot]).name);this.mods?.bus.emit('slotChange',{slot,id:this.hotbar[slot]});}
 equip(id){if(!(typeof id==='string'?ITEMS.has(id):BLOCKS[id]&&id))return;this.hotbar[this.selected]=id;this.ui.renderHotbar();this.select(this.selected);this.sound('place');}
 pick(){if(this.target)this.equip(this.target.id);}
 toggleFly(){if(!this.player)return;this.player.toggleFly();this.ui.flyState(this.player.flying);this.ui.toast(this.player.flying?'Voo ativado • ▲ subir / ▼ descer':'Voo desativado');}
 targetBlock(){const direction=new THREE.Vector3();this.camera.getWorldDirection(direction);this.target=this.world.raycast(this.camera.position,direction,7);this.outline.visible=!!this.target;if(this.target){this.outline.position.set(this.target.x+.5,this.target.y+.5,this.target.z+.5);}}
 action(kind){const t=this.target,w=this.world,held=getEntry(this.hotbar[this.selected]),bus=this.mods?.bus;
  if(held.item){if(held.missing)return;const event=bus?.emit('beforeItemUse',{kind,item:held,target:t,world:w,player:this.player,game:this});if(!event?.cancelled)held.onUse?.({kind,item:held,target:t,world:w,player:this.player,game:this});bus?.emit('itemUse',{kind,item:held,target:t});return;}
  if(!t)return;
  if(kind==='break'){if(bus?.emit('beforeBreak',{...t,world:w,player:this.player,held}).cancelled||t.y===0)return;if(w.set(t.x,t.y,t.z,0)){this.sound('break');if(getBlock(w.get(t.x,t.y+1,t.z)).plant)w.set(t.x,t.y+1,t.z,0);bus?.emit('blockBreak',{...t,world:w,player:this.player});}}
  else{const x=t.x+t.normal[0],y=t.y+t.normal[1],z=t.z+t.normal[2],id=this.hotbar[this.selected],b=getBlock(id);if(bus?.emit('beforePlace',{x,y,z,id,target:t,world:w,player:this.player}).cancelled)return;if(b.solid&&this.player.intersects(x,y,z))return;const existing=getBlock(w.get(x,y,z));if(existing.solid&&!existing.plant)return;if(b.plant&&!w.solid(x,y-1,z))return;if(w.set(x,y,z,id)){this.sound('place');bus?.emit('blockPlace',{x,y,z,id,world:w,player:this.player});}}
  this.targetBlock();
 }
 sound(kind){if(!this.settings.sound)return;try{if(!this.audio)this.audio=new(window.AudioContext||window.webkitAudioContext)();if(this.audio.state==='suspended')this.audio.resume();const ctx=this.audio,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(kind==='break'?130:240,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(45,ctx.currentTime+.07);gain.gain.setValueAtTime(.05,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.08);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.09);}catch{}}
 async save(){if(!this.world||!this.player)return;if(this.saving){await this.saving;return this.save();}
  const world=this.world,meta={...world.meta,player:this.player.serialize(),hotbar:[...this.hotbar],blockPalette:blockPalette(),updatedAt:Date.now()},chunks=world.snapshotDirty();for(const c of chunks)world.dirty.delete(c.key);
  this.saving=this.storage.save(meta,chunks);try{await this.saving;world.meta=meta;this.lastSave=performance.now();this.ui.saved(meta.updatedAt);}catch(e){for(const c of chunks)world.dirty.add(c.key);throw e;}finally{this.saving=null;}
 }
 async exit(){this.setPaused(true);await this.save();this.mods?.bus.emit('worldLeave',{world:this.world,player:this.player});this.running=false;this.world.dispose();this.world=null;this.outline.visible=false;this.renderer.clear();}
 render(){if(this.renderer&&this.scene){this.mods?.bus.emit('beforeRender',{game:this,renderer:this.renderer,scene:this.scene,camera:this.camera});this.renderer.render(this.scene,this.camera);this.mods?.bus.emit('afterRender',{game:this,renderer:this.renderer});}}
 frame(now){requestAnimationFrame(this.frame);const dt=Math.min(.05,Math.max(0,(now-this.lastTime)/1000));this.lastTime=now;if(!this.running)return;
  if(!this.paused){const p=this.player.position;this.world.stream(p.x,p.z,this.settings.distance);const steps=Math.max(1,Math.ceil(dt/.016));for(let i=0;i<steps;i++)this.player.update(dt/steps,this.controls);this.mods?.bus.emit('tick',{dt,time:now/1000,game:this,world:this.world,player:this.player});this.world.update(5);this.targetBlock();
   const action=this.controls.actions.has('break')?'break':this.controls.actions.has('place')?'place':null;
   if(action&&(now-this.lastAction>(getEntry(this.hotbar[this.selected]).cooldown??.165)*1000||this.lastActionKind!==action)){this.action(action);this.lastAction=now;}if(!action)this.lastAction=0;this.lastActionKind=action;
   document.getElementById('water-overlay').style.display=this.player.underwater?'block':'none';
   if(now-this.lastSave>10000&&!this.saving){this.lastSave=now;this.save().catch(e=>this.ui.toast('Não foi possível salvar: '+e.message));}
   this.render();
  }
  if(!this.fpsAt)this.fpsAt=now;this.frames=(this.frames||0)+1;if(now-this.fpsAt>700){const fps=Math.round(this.frames*1000/(now-this.fpsAt));this.frames=0;this.fpsAt=now;const p=this.player.position;this.ui.debug(this.settings.debug?`${fps} FPS · ${this.player.flying?'VOANDO':'CRIATIVO'}\nXYZ ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}\n${this.world.terrain.column(p.x,p.z).biome} · ${this.world.chunks.size} chunks${this.world.queue.length?' · gerando…':''}`:'');}
 }
}
