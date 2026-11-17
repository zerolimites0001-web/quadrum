import * as THREE from '../vendor/three.module.js';
import {BLOCKS,getEntry,listEntries} from './blocks.js';
const TILE=16, PAD=1, STRIDE=18, SIZE=512;
export class Textures {
 constructor(){this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=SIZE;this.ctx=this.canvas.getContext('2d');this.ctx.imageSmoothingEnabled=false;this.sources=new Map();this.freeSlots=[];this.nextTile=0;this.tiles=new Map();this.icons=new Map();}
 async load(progress=()=>{}) {
  await this.sync(progress);
  const tex=this.texture=new THREE.CanvasTexture(this.canvas);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.colorSpace=THREE.SRGBColorSpace;
  this.opaque=new THREE.MeshLambertMaterial({map:tex,vertexColors:true,alphaTest:.35,side:THREE.DoubleSide});
  this.transparent=new THREE.MeshLambertMaterial({map:tex,vertexColors:true,transparent:true,depthWrite:false,alphaTest:.03,side:THREE.DoubleSide});
  // Líquidos: material próprio com depthWrite ativo evita que a água de um chunk
  // "suma" (z-fighting) ao ficar ao lado da água de outro chunk. A água é quase
  // opaca, então escrever profundidade é seguro e resolve o vão/seam.
  this.liquid=new THREE.MeshLambertMaterial({map:tex,vertexColors:true,transparent:true,depthWrite:true,alphaTest:.03,side:THREE.DoubleSide});
 }
 sync(progress=()=>{}) {
  const run=async()=>{
   if(!this.available)this.available=new Set(await (await fetch('assets/textures/manifest.json')).json());
   const requests=new Map(),required=new Set();
   for(const b of [...BLOCKS.slice(1),...listEntries().filter(b=>b.item)])for(const face of ['side','top','bottom','front']){
    const name=b[face]||b.texture;const tint=face==='top'?(b.topTint||b.tint):b.tint;
    const key=name+'|'+(tint||'');b[face+'Key']=key;required.add(key);
    if(!this.tiles.has(key)&&!requests.has(key))requests.set(key,{name,tint,b});
   }
   for(const [key,tile] of this.tiles)if(!required.has(key)){this.ctx.clearRect(tile.x-1,tile.y-1,18,18);this.freeSlots.push(tile.slot);this.tiles.delete(key);}
   if(requests.size>28*28-this.nextTile+this.freeSlots.length)throw new Error('Atlas cheio: limite de 784 texturas distintas.');
   const entries=[...requests];let done=0,cursor=0;
   await Promise.all(Array.from({length:8},async()=>{while(cursor<entries.length){const [key,info]=entries[cursor++];await this.addTile(key,info);progress(++done/entries.length);}}));
   this.icons.clear();if(this.texture)this.texture.needsUpdate=true;
  };
  const task=(this.syncChain||Promise.resolve()).then(run);this.syncChain=task.catch(()=>{});return task;
 }
 register(name,source){this.sources.set(name,source);return name;}
 paint(t){const {x,y,tile}=t;this.ctx.clearRect(x-1,y-1,18,18);this.ctx.drawImage(tile,x,y);this.ctx.drawImage(tile,0,0,16,1,x,y-1,16,1);this.ctx.drawImage(tile,0,15,16,1,x,y+16,16,1);this.ctx.drawImage(tile,0,0,1,16,x-1,y,1,16);this.ctx.drawImage(tile,15,0,1,16,x+16,y,1,16);}
 update(name,source){for(const [key,tile] of this.tiles)if(key.startsWith(name+'|')){const c=tile.tile.getContext('2d');c.clearRect(0,0,16,16);c.drawImage(source,0,0,source.width,source.height,0,0,16,16);this.paint(tile);}this.icons.clear();if(this.texture)this.texture.needsUpdate=true;}
 async addTile(key,{name,tint,b}){
  const slot=this.freeSlots.length?this.freeSlots.pop():this.nextTile++; const x=(slot%28)*STRIDE+PAD,y=Math.floor(slot/28)*STRIDE+PAD;
  const tile=document.createElement('canvas');tile.width=tile.height=TILE;const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
  let image=null;
  const source=this.sources.get(name)||(this.available.has(name)?'assets/textures/'+name+'.png':/^(https?:|data:|blob:|\/)/.test(name)?name:null);
  if(source&&typeof source!=='string')image=source;
  else if(source)image=await new Promise(resolve=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>{console.warn('Quadrum: textura indisponível:',source);resolve(null);};img.src=source;});
  if(image){c.drawImage(image,0,0,Math.min(image.width,image.height),Math.min(image.width,image.height),0,0,16,16);
   if(tint){c.globalCompositeOperation='multiply';c.fillStyle=tint;c.fillRect(0,0,16,16);c.globalCompositeOperation='destination-in';c.drawImage(image,0,0,Math.min(image.width,image.height),Math.min(image.width,image.height),0,0,16,16);c.globalCompositeOperation='source-over';}
  }else this.generate(c,b,name);
  if(b.liquid){const pixels=c.getImageData(0,0,16,16);for(let i=0;i<pixels.data.length;i+=4){const lum=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;pixels.data[i]=22+lum*.12;pixels.data[i+1]=80+lum*.30;pixels.data[i+2]=150+lum*.36;pixels.data[i+3]=185;}c.putImageData(pixels,0,0);}
  const entry={slot,x,y,tile};this.paint(entry);this.tiles.set(key,entry);
 }
 generate(c,b,name){
  let seed=0;for(const ch of name)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle=b.glass?'#c9e8ec':b.pattern==='ore'?'#81817d':b.color;c.globalAlpha=b.glass?.22:1;c.fillRect(0,0,16,16);c.globalAlpha=1;
  if(b.glass){c.strokeStyle=b.color;c.lineWidth=1;c.strokeRect(.5,.5,15,15);c.globalAlpha=.55;c.fillStyle='#eefaff';c.fillRect(3,3,2,5);c.fillRect(5,2,4,2);c.fillRect(11,10,2,3);c.globalAlpha=1;return;}
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const n=rand();c.fillStyle=n>.5?'#ffffff':'#000000';c.globalAlpha=(n-.5)**2*(b.pattern==='wool'?.55:.30);c.fillRect(x,y,1,1);}c.globalAlpha=1;
  if(b.pattern==='planks'||name.includes('planks')){c.fillStyle='#0005';for(let y=3;y<16;y+=4)c.fillRect(0,y,16,1);for(let y=0;y<16;y+=4)c.fillRect((y%8?3:11),y,1,3);}
  if(b.pattern==='ore'){c.fillStyle=b.accent;for(let n=0;n<8;n++)c.fillRect(1+Math.floor(rand()*13),1+Math.floor(rand()*13),2,2);}
  if(b.pattern==='metal'){c.strokeStyle='#ffffff55';c.strokeRect(.5,.5,15,15);c.strokeStyle='#0004';c.strokeRect(1.5,1.5,13,13);}
 }
 uv(b,face){const t=this.tiles.get(b[face+'Key']||b.sideKey)||this.tiles.values().next().value;if(!t)return[0,0,1/32,1/32];return[(t.x+.02)/SIZE,1-(t.y+15.98)/SIZE,(t.x+15.98)/SIZE,1-(t.y+.02)/SIZE];}
 icon(id){
  // Nunca deixe uma exceção (ex.: canvas tainted no getImageData de líquidos)
  // derrubar a hotbar. Em qualquer falha, devolve um canvas de fallback.
  try{
   if(!this.icons.has(id)){const b=getEntry(id);const t=this.tiles.get(b.sideKey);if(t)this.icons.set(id,t.tile);else{const tile=document.createElement('canvas');tile.width=tile.height=16;this.generate(tile.getContext('2d'),b,b.texture||'generated:missing');this.icons.set(id,tile);}}const tile=this.icons.get(id);
   if(!this.iconCanvases)this.iconCanvases=new Map();
   const hit=this.iconCanvases.get(id);if(hit&&hit._tile===tile)return hit;
   const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,0,0,32,32);c._tile=tile;this.iconCanvases.set(id,c);return c;
  }catch(err){
   console.warn('Quadrum: falha ao gerar ícone do bloco',id,err&&err.message);
   try{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');const b=getEntry(id)||{};ctx.fillStyle=b.color||'#888';ctx.fillRect(0,0,32,32);ctx.strokeStyle='#0006';ctx.lineWidth=2;ctx.strokeRect(1,1,30,30);return c;}catch{return null;}
  }
 }
}
