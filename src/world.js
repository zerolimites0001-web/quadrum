import * as THREE from '../vendor/three.module.js';
import {BLOCKS,getBlock,ID,restorePalette} from './blocks.js';
import {Terrain,CHUNK,HEIGHT,index,chunkKey} from './terrain.js';
import {boxesFor,shapeFaces,isFullOccluder,rayBoxes} from './shapes.js';
const FACES=[
 {d:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],light:.79,face:'side'},
 {d:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],light:.66,face:'side'},
 {d:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],light:1,face:'top'},
 {d:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],light:.48,face:'bottom'},
 {d:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],light:.88,face:'front'},
 {d:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],light:.73,face:'side'}
];
export class World {
 constructor(meta,scene,textures,saved=[],events=null){this.events=events;this.meta=meta;this.scene=scene;this.textures=textures;this.terrain=new Terrain(meta.seed,meta.generator);this.chunks=new Map();this.edits=new Map();this.dirty=new Set();this.queue=[];this.queued=new Set();this.lastCenter='';this.totalMeshes=0;
  // Dados de chunk prontos vindos do Web Worker (key → Uint16Array). Se vazio,
  // o ensure() gera de forma síncrona (comportamento antigo, como fallback).
  this.prefetched=new Map();
  // bridge opcional: {request(cx,cz)} pede geração fora da thread principal.
  this.bridge=null;
  // contador de dados consumidos do worker (para telemetria leve)
  this.fromWorker=0;this.syncGenerated=0;
  const remap=restorePalette(meta.blockPalette);for(const c of saved){const edits=c.edits.map(([i,b])=>{const mapped=remap.get(b)??b;if(mapped!==b)this.dirty.add(c.key);return[i,BLOCKS[mapped]?mapped:0];});this.edits.set(c.key,new Map(edits));}}
 ensure(cx,cz){const key=chunkKey(cx,cz);let c=this.chunks.get(key);if(!c){
   let data=this.prefetched.get(key),provisional=false;
   if(data){this.prefetched.delete(key);this.fromWorker++;}
   else if(this.bridge){
     // Com worker ativo: NÃO gerar sync. Pede e devolve um chunk vazio provisório;
     // ele será substituído quando o worker entregar (evita travar o frame).
     this.bridge.request(cx,cz);
     if(!this._pendingGen)this._pendingGen=new Set();
     this._pendingGen.add(key);
     data=new Uint16Array(CHUNK*CHUNK*HEIGHT);provisional=true;
   }
   else{data=this.terrain.generate(cx,cz);this.syncGenerated++;}
   c={cx,cz,key,data,group:null,provisional};this.chunks.set(key,c);
   this.events?.emit('chunkGenerate',{world:this,cx,cz,data,set:(x,y,z,id)=>{if(Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&x>=0&&x<16&&z>=0&&z<16&&y>=1&&y<HEIGHT&&BLOCKS[id])data[index(x,y,z)]=id;}});
   const edits=this.edits.get(key);if(edits)for(const [i,b] of edits)data[i]=BLOCKS[b]?b:0;
   c.topY=this._topSolid(data);
  }return c;}
 // Substitui um chunk provisório (vazio) pelos dados reais do worker e re-mesha.
 upgradeChunk(cx,cz){const key=chunkKey(cx,cz);const data=this.prefetched.get(key);if(!data)return false;const c=this.chunks.get(key);
  if(!c){return false;} // ainda não pedido; o ensure normal pegará
  this.prefetched.delete(key);this.fromWorker++;
  c.data=data;c.provisional=false;const edits=this.edits.get(key);if(edits)for(const [i,b] of edits)data[i]=BLOCKS[b]?b:0;
  c.topY=this._topSolid(data);c.needsMesh=true;this.enqueue(cx,cz,true);return true;}
 // altura da camada sólida mais alta do chunk (evita varrer coluna inteira de 96 no mesh)
 _topSolid(data){for(let y=HEIGHT-1;y>=0;y--){const base=y*256;for(let i=0;i<256;i++)if(data[base+i])return y;}return 0;}
 get(x,y,z){if(y<0)return ID.bedrock;if(y>=HEIGHT)return 0;const cx=Math.floor(x/16),cz=Math.floor(z/16);const c=this.chunks.get(chunkKey(cx,cz));if(!c)return 0;return c.data[index(x-cx*16,y,z-cz*16)];}
 solid(x,y,z){return getBlock(this.get(x,y,z)).solid;}
 set(x,y,z,id){if(![x,y,z,id].every(Number.isSafeInteger))return false;if(y<1||y>=HEIGHT||!BLOCKS[id])return false;const cx=Math.floor(x/16),cz=Math.floor(z/16),c=this.ensure(cx,cz),i=index(x-cx*16,y,z-cz*16);if(c.data[i]===id)return false;const oldId=c.data[i];c.data[i]=id;c.needsMesh=true;
  // mantém a altura máxima correta: subir ao colocar, recalcular ao remover topo
  if(id&&y>(c.topY??0))c.topY=y;
  else if(!id&&y===(c.topY??-1))c.topY=this._topSolid(c.data);
  if(!this.edits.has(c.key))this.edits.set(c.key,new Map());this.edits.get(c.key).set(i,id);this.dirty.add(c.key);this.enqueue(cx,cz,true);if(x-cx*16===0)this.enqueue(cx-1,cz,true);if(x-cx*16===15)this.enqueue(cx+1,cz,true);if(z-cz*16===0)this.enqueue(cx,cz-1,true);if(z-cz*16===15)this.enqueue(cx,cz+1,true);this.events?.emit('blockChange',{world:this,x,y,z,id,oldId});const old=getBlock(oldId),current=getBlock(id);if(old.shape==='door'&&current.family!==old.family){const yy=y+(old.part==='upper'?-1:1),mate=getBlock(this.get(x,yy,z));if(mate.family===old.family&&mate.part!==old.part)this.set(x,yy,z,0);}if(!current.solid){const above=getBlock(this.get(x,y+1,z));if(above.shape==='door'&&above.part==='lower')this.set(x,y+1,z,0);}return true;}
 enqueue(cx,cz,urgent=false){const key=chunkKey(cx,cz);if(urgent){const existing=this.chunks.get(key);if(existing)existing.needsMesh=true;}if(this.queued.has(key))return;this.queued.add(key);if(urgent)this.queue.unshift({cx,cz,key});else this.queue.push({cx,cz,key});}
 stream(x,z,radius){const cx=Math.floor(x/16),cz=Math.floor(z/16),center=chunkKey(cx,cz)+':'+radius;if(center===this.lastCenter)return;this.lastCenter=center;this.center={cx,cz,radius};const wanted=[];for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++)if(dx*dx+dz*dz<=(radius+.5)**2)wanted.push({cx:cx+dx,cz:cz+dz,dist:dx*dx+dz*dz});wanted.sort((a,b)=>a.dist-b.dist);this.queue=[];this.queued.clear();for(const p of wanted){const c=this.chunks.get(chunkKey(p.cx,p.cz));if(!c?.group||c.needsMesh)this.enqueue(p.cx,p.cz);}for(const [key,c] of this.chunks)if(Math.abs(c.cx-cx)>radius+2||Math.abs(c.cz-cz)>radius+2){this.disposeChunk(c);this.chunks.delete(key);}}

 // O dado REAL de um chunk já chegou? (prefetched do worker, ou chunk carregado não-provisório)
 _hasData(cx,cz){const k=chunkKey(cx,cz);const c=this.chunks.get(k);if(c&&!c.provisional)return true;return this.prefetched.has(k);}

 update(budget=6){const start=performance.now();let n=0,attempts=0;
  // Promove chunks provisórios cujos dados do worker já chegaram.
  if(this.prefetched.size){for(const [k,c] of this.chunks){if(c.provisional&&this.prefetched.has(k))this.upgradeChunk(c.cx,c.cz);}}
  const maxAttempts=this.queue.length+2;
  while(this.queue.length&&(n===0||performance.now()-start<budget)){
   if(attempts++>maxAttempts)break; // evita loop infinito quando o worker ainda não entregou
   const p=this.queue.shift();this.queued.delete(p.key);
   const hasBridge=!!this.bridge;
   if(hasBridge){
     // pede ao worker tudo que for preciso para meshar este chunk (próprio + 4 vizinhos)
     this.bridge.request(p.cx,p.cz);
     let waiting=false;
     if(!this._hasData(p.cx,p.cz))waiting=true;
     for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){if(!this._hasData(p.cx+dx,p.cz+dz)){this.bridge.request(p.cx+dx,p.cz+dz);waiting=true;}}
     if(waiting){ // ainda não pronto: devolve à fila e tenta outro
       if(!this.queued.has(p.key)){this.queued.add(p.key);this.queue.push({cx:p.cx,cz:p.cz,key:p.key});}
       continue;
     }
   }
   const c=this.ensure(p.cx,p.cz);
   if(c.provisional)continue; // não meshar chunk vazio provisório
   if(!hasBridge){for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(!this.chunks.has(chunkKey(p.cx+dx,p.cz+dz)))this.ensure(p.cx+dx,p.cz+dz);}
   else{
     // materializa vizinhos do prefetched em chunks (sem meshar), para o mesher
     // enxergar as bordas reais e não criar paredes falsas. Os vizinhos serão
     // meshados depois pela própria fila do stream.
     for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
       const nk=chunkKey(p.cx+dx,p.cz+dz);
       if(!this.chunks.has(nk)&&this.prefetched.has(nk))this.ensure(p.cx+dx,p.cz+dz);
     }
   }
   this.mesh(c);n++;break;
  }return n;}
 mesh(c){
  const makeBuffer=(transparent=false,blockId=null)=>({p:[],uv:[],color:[],nrm:[],idx:[],transparent,blockId});const buffers=new Map([['opaque',makeBuffer()],['transparent',makeBuffer(true)]]),ox=c.cx*16,oz=c.cz*16;
  // normais por face (constantes — evita computeVertexNormals, que custa ~58ms/chunk)
  const FACE_N=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const quad=(buf,verts,uv,light,nx=0,ny=0,nz=0,local=null,faceIndex=0)=>{const start=buf.p.length/3;for(let k=0;k<4;k++){buf.p.push(...verts[k]);buf.nrm.push(nx,ny,nz);if(local){const [vx,vy,vz]=local[k],coords=[[1-vz,vy],[vz,vy],[vx,1-vz],[vx,vz],[vx,vy],[1-vx,vy]][faceIndex];buf.uv.push(uv[0]+(uv[2]-uv[0])*coords[0],uv[1]+(uv[3]-uv[1])*coords[1]);}else buf.uv.push(k===0||k===3?uv[0]:uv[2],k<2?uv[1]:uv[3]);buf.color.push(light,light,light);}buf.idx.push(start,start+1,start+2,start,start+2,start+3);};
  // Recalcula a altura sólida no início do mesh (barato: ~poucos ms) para
  // garantir correção mesmo quando dados mudam fora de set() (mods, testes).
  c.topY=this._topSolid(c.data);
  const maxY=Math.min(HEIGHT-1,(c.topY===undefined?HEIGHT-1:c.topY)+1); // +1 p/ faces do topo e folhas
  for(let y=0;y<=maxY;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){
   const id=c.data[index(x,y,z)];if(!id)continue;const b=getBlock(id);if(b.renderHidden&&!b.liquid)continue;const layer=b.liquid?'liquid:'+id:b.transparent?'transparent':'opaque';if(!buffers.has(layer))buffers.set(layer,makeBuffer(true,id));const wx=ox+x,wz=oz+z,buf=buffers.get(layer);
   if(b.shape){for(const part of shapeFaces(id)){const f=FACES[part.face];if(part.boundary&&isFullOccluder(this.get(wx+f.d[0],y+f.d[1],wz+f.d[2])))continue;const verts=part.vertices.map(v=>[x+v[0],y+v[1],z+v[2]]);const n=FACE_N[part.face];quad(buf,verts,this.textures.uv(b,f.face),(.72+.28*f.light),n[0],n[1],n[2],part.vertices,part.face);}continue;}
   if(b.plant){const uv=this.textures.uv(b,'side');quad(buf,[[x+.14,y,z+.14],[x+.86,y,z+.86],[x+.86,y+.85,z+.86],[x+.14,y+.85,z+.14]],uv,.94,0,0,1);quad(buf,[[x+.86,y,z+.14],[x+.14,y,z+.86],[x+.14,y+.85,z+.86],[x+.86,y+.85,z+.14]],uv,.94,0,0,1);continue;}
   for(let fi=0;fi<6;fi++){const f=FACES[fi];const nx=x+f.d[0],ny=y+f.d[1],nz=z+f.d[2];const neighbor=nx>=0&&nx<16&&nz>=0&&nz<16&&ny>=0&&ny<HEIGHT?c.data[index(nx,ny,nz)]:this.get(wx+f.d[0],ny,wz+f.d[2]);const nb=getBlock(neighbor);
    if(neighbor===id&&!nb.shape)continue;
    // Folhas colidem, mas os recortes alpha não podem apagar a face do vizinho.
    if(isFullOccluder(neighbor))continue;
    if(y===0&&f.d[1]===-1)continue;
    const top=b.liquid&&this.get(wx,y+1,wz)!==id?.88:1;
    const vertices=f.v.map(v=>[x+v[0],y+(v[1]?top:0),z+v[2]]);
    quad(buf,vertices,this.textures.uv(b,f.face),b.emissive?1:Math.min(1,(.72+.28*f.light)),f.d[0],f.d[1],f.d[2]);
   }
  }
  this.disposeChunk(c);const group=new THREE.Group();group.position.set(ox,0,oz);
  for(const b of buffers.values()){if(!b.p.length)continue;const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(b.color,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.nrm,3));geo.setIndex(b.idx);geo.computeBoundingSphere();
   // escolhe material: líquidos usam material próprio (depthWrite) p/ não sumirem entre chunks
   const mat = b.blockId!==null && getBlock(b.blockId).liquid && this.textures.liquid ? this.textures.liquid : (b.transparent?this.textures.transparent:this.textures.opaque);
   const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=!b.transparent;mesh.castShadow=!b.transparent;mesh.userData.voxelShadowCaster=!b.transparent;
   if(b.blockId!==null){mesh.userData.blockId=b.blockId;mesh.userData.originalLiquid=true;mesh.visible=!getBlock(b.blockId).renderHidden;mesh.renderOrder=1;}
   group.add(mesh);}
  c.group=group;c.needsMesh=false;this.scene.add(group);this.totalMeshes++;this.events?.emit('chunkMesh',{world:this,chunk:c,group});
 }
 refreshRenderOverrides(){for(const c of this.chunks.values())for(const mesh of c.group?.children||[])if(mesh.userData.originalLiquid)mesh.visible=!getBlock(mesh.userData.blockId).renderHidden;}
 disposeChunk(c){if(!c.group)return;this.events?.emit('chunkDispose',{world:this,chunk:c});this.scene.remove(c.group);for(const m of c.group.children)m.geometry.dispose();c.group=null;}
 getBlock(x,y,z){return this.get(x,y,z);}
 setBlock(x,y,z,id){return this.set(x,y,z,typeof id==='string'?ID[id]:id);}
 snapshotDirty(){return[...this.dirty].map(key=>({key,edits:[...this.edits.get(key)]}));}
 dispose(){for(const c of this.chunks.values())this.disposeChunk(c);this.chunks.clear();this.queue=[];}
 // Raycast DDA: não depende da geometria; funciona logo após construir ou quebrar.
 raycast(origin,direction,max=7){const d=[direction.x,direction.y,direction.z],o=[origin.x,origin.y,origin.z],cell=o.map(Math.floor),step=d.map(Math.sign),delta=d.map(v=>v?Math.abs(1/v):Infinity),t=d.map((v,i)=>v?((v>0?cell[i]+1:cell[i])-o[i])/v:Infinity);let distance=0;
  for(let i=0;i<Math.ceil(max*4)+8&&distance<=max;i++){const [x,y,z]=cell,id=this.get(x,y,z);if(id&&!getBlock(id).liquid){const hit=rayBoxes(origin,direction,x,y,z,id,max);if(hit&&hit.distance>=distance-1e-5)return{x,y,z,id,...hit,point:{x:origin.x+direction.x*hit.distance,y:origin.y+direction.y*hit.distance,z:origin.z+direction.z*hit.distance}};}const axis=t[0]<t[1]?(t[0]<t[2]?0:2):(t[1]<t[2]?1:2);distance=t[axis];cell[axis]+=step[axis];t[axis]+=delta[axis];}return null;
 }
 collisionBoxes(x,y,z){const id=this.get(x,y,z);return getBlock(id).solid?boxesFor(id):[];}
 placeDoor(x,y,z,id,player){const b=getBlock(id);if(b.shape!=='door'||b.part!=='lower'||y<1||y>=HEIGHT-1)return false;const replaceable=(yy)=>{const cell=getBlock(this.get(x,yy,z));return!cell.solid||cell.plant;};if(!replaceable(y)||!replaceable(y+1))return false;const below=this.collisionBoxes(x,y-1,z);if(!below.some(box=>box[4]===1))return false;if(player&&(player.intersectsBlock(id,x,y,z)||player.intersectsBlock(b.mateId,x,y+1,z)))return false;this.set(x,y,z,id);this.set(x,y+1,z,b.mateId);return true;}
 toggleDoor(x,y,z,player){const id=this.get(x,y,z),b=getBlock(id);if(b.shape!=='door')return false;const bottomY=y-(b.part==='upper'?1:0),lower=getBlock(this.get(x,bottomY,z)),upper=getBlock(this.get(x,bottomY+1,z));if(lower.shape!=='door'||upper.family!==lower.family||lower.part!=='lower'||upper.part!=='upper')return false;if(player&&(player.intersectsBlock(lower.toggleId,x,bottomY,z)||player.intersectsBlock(upper.toggleId,x,bottomY+1,z)))return false;this.set(x,bottomY,z,lower.toggleId);this.set(x,bottomY+1,z,upper.toggleId);return true;}
}
