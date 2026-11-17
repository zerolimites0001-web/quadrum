import * as T from '../vendor/three.module.js';
import {getBlock,getEntry} from './blocks.js';
import {shapeFaces} from './shapes.js';
import {hash2} from './noise.js';
import {FirstPersonMotion} from './first-person-motion.js';

const FACES=[
 {face:'side',v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},
 {face:'side',v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},
 {face:'top',v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
 {face:'bottom',v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
 {face:'front',v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},
 {face:'side',v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]}
];

export function skinPixels(kind='skin'){
 const data=new Uint8Array(16*16*4);
 const base=kind==='sleeve'?[35,137,165]:[198,146,108];
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const n=(hash2(x,y,kind==='skin'?421:811)-.5)*16+(kind==='sleeve'&&y>12?-18:0);
  const shade=(kind==='skin'&&x===0)?-12:0;
  const i=(x+y*16)*4;
  for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,base[c]+n+shade));
  data[i+3]=255;
 }
 return data;
}
function skinTexture(kind){
 const texture=new T.DataTexture(skinPixels(kind),16,16,T.RGBAFormat,T.UnsignedByteType);
 texture.colorSpace=T.SRGBColorSpace;
 texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;
 texture.generateMipmaps=false;texture.needsUpdate=true;
 return texture;
}

// Geometria do item/bloco segurado. Blocos mantêm cubo unitário; itens planos
// (plants, itens) ficam numa placa fina em pé. A escala final é feita no pivot,
// NÃO normalizando tudo para 1 — assim item pequeno não vira bloco gigante.
export function heldGeometry(id,textures){
 const entry=getEntry(id),positions=[],uvs=[],indices=[];
 function quad(vertices,uv,offsetY=0){
  const start=positions.length/3;
  for(let k=0;k<4;k++){
   positions.push(vertices[k][0],vertices[k][1]+offsetY,vertices[k][2]);
   uvs.push(k===0||k===3?uv[0]:uv[2],k<2?uv[1]:uv[3]);
  }
  indices.push(start,start+1,start+2,start,start+2,start+3);
 }
 if(entry.item||entry.plant){
  // placa em pé, levemente centrada
  quad([[0,0,.5],[1,0,.5],[1,1,.5],[0,1,.5]],textures.uv(entry,'side'));
 }else{
  const parts=[{id,offset:0}];
  if(entry.shape==='door'&&entry.mateId)parts.push({id:entry.mateId,offset:1});
  for(const part of parts){
   const b=getBlock(part.id);
   if(b.shape){for(const f of shapeFaces(part.id))quad(f.vertices,textures.uv(b,FACES[f.face].face),part.offset);}
   else for(const f of FACES)quad(f.v,textures.uv(b,f.face),part.offset);
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 geometry.computeBoundingBox();
 // Centraliza no centro do bounding box e normaliza para caber em 1 unidade
 // (o tamanho visual relativo é definido depois no pivot, por tipo de item).
 const size=new T.Vector3(),center=new T.Vector3();
 geometry.boundingBox.getSize(size);
 geometry.boundingBox.getCenter(center);
 geometry.translate(-center.x,-center.y,-center.z);
 const maxDim=Math.max(size.x,size.y,size.z,1e-6);
 geometry.scale(1/maxDim,1/maxDim,1/maxDim);
 geometry.computeBoundingBox();
 geometry.computeBoundingSphere();
 geometry.userData.size=size.clone();
 return geometry;
}

export class FirstPerson{
 constructor(textures){
  this.textures=textures;this.enabled=true;this.showHeld=true;this.bob=true;
  this.motion=new FirstPersonMotion();this.pose=this.motion.update(0);
  this.scene=new T.Scene();
  this.camera=new T.PerspectiveCamera(55,1,.03,8);
  this.camera.position.set(0,0,0);this.camera.lookAt(0,0,-1);
  this.rig=new T.Group();this.scene.add(this.rig);
  this.materials=[];this.geometries=[];

  this.skin=skinTexture('skin');this.sleeve=skinTexture('sleeve');
  const skin=new T.MeshLambertMaterial({map:this.skin});
  const shirt=new T.MeshLambertMaterial({map:this.sleeve});
  this.materials.push(skin,shirt);

  // ---- MÃO + BRAÇO (antebraço e mão conectados, proporções de Minecraft) ----
  // O grupo "arm" segura tudo; rotacionado para entrar pela direita.
  this.arm=new T.Group();
  this.rig.add(this.arm);

  const box=(size,pos,material,parent=this.arm)=>{
   const geometry=new T.BoxGeometry(...size);
   const mesh=new T.Mesh(geometry,material);
   mesh.position.set(...pos);
   parent.add(mesh);this.geometries.push(geometry);
   return mesh;
  };
  // Antebraço (manga) — comprido, entra pela borda inferior direita
  box([.26,.62,.26],[0,.13,0],shirt);
  // Mão/punho — peça da pele acima da manga
  box([.24,.30,.26],[0,.56,0],skin);
  // Polegar discreto na lateral (para não parecer bloco)
  const thumb=box([.08,.17,.11],[-.15,.52,.02],skin);
  thumb.rotation.z=-.18;

  // ---- PIVOT DO ITEM: preso à "boca" da mão ----
  this.heldPivot=new T.Group();
  this.heldPivot.position.set(-.02,.60,-.16);
  this.heldPivot.rotation.set(.12,.52,-.10);
  this.arm.add(this.heldPivot);

  this.heldOpaque=new T.MeshLambertMaterial({map:textures.texture,alphaTest:.35,side:T.DoubleSide});
  this.heldTransparent=new T.MeshLambertMaterial({map:textures.texture,alphaTest:.025,transparent:true,depthWrite:false,side:T.DoubleSide});
  this.materials.push(this.heldOpaque,this.heldTransparent);

  this.hemi=new T.HemisphereLight(0xe4eeff,0x67503b,1.0);
  this.light=new T.DirectionalLight(0xffefd5,.85);
  this.light.position.set(-2,3,4);
  this.scene.add(this.hemi,this.light);
  this.resize(360,720);this.update(0);
 }

 resize(width,height){this.camera.aspect=Math.max(.1,width/Math.max(1,height));this.camera.updateProjectionMatrix();this.applyPose();}

 select(id){
  const entry=getEntry(id);
  const signature=[id,!!entry.missing,entry.shape,!!entry.transparent,entry.mateId,JSON.stringify(entry.boxes),...['side','top','bottom','front'].map(face=>this.textures.uv(entry,face).join(','))].join('|');
  if(this.signature===signature)return;
  const hadSelection=this.heldId!==undefined&&this.heldId!==id;
  this.signature=signature;this.heldId=id;
  if(this.held){this.held.removeFromParent();this.held.geometry.dispose();this.held=null;}
  if(id&&!entry.missing){
   const geo=heldGeometry(id,this.textures);
   this.held=new T.Mesh(geo,entry.transparent?this.heldTransparent:this.heldOpaque);
   // geometria já normalizada (max dim = 1). Escala visual por tipo:
   const isFlat=entry.item||entry.plant;
   const target=isFlat?0.34:0.42;
   this.held.scale.setScalar(target);
   // centraliza o item no pivô; itens planos ficam um pouco à frente
   this.held.position.set(0, isFlat?0.02:0.05, isFlat?-0.02:0);
   if(isFlat)this.held.rotation.y=Math.PI*0.5; // placa de lado, visível de frente
   this.heldPivot.add(this.held);
  }
  if(hadSelection)this.motion.equip();
 }

 swing(kind){if(this.enabled)this.motion.trigger(kind);}
 reset(){this.motion.reset();this.pose=this.motion.update(0);this.applyPose();}

 update(dt,{player=null,daylight=1,cloud=0}={}){
  const speed=player?Math.hypot(player.velocity.x,player.velocity.z):0;
  this.pose=this.motion.update(dt,{speed,grounded:!!player?.onGround,flying:!!player?.flying,bob:this.bob});
  this.hemi.intensity=(.65+daylight*.8)*(1-cloud*.14);
  this.light.intensity=.30+daylight*.9;
  this.applyPose();
 }

 applyPose(){
  if(!this.rig||!this.camera)return;
  const aspect=this.camera.aspect;
  const scale=.62*Math.min(1,aspect/.72);
  const depth=1.2;
  const tan=Math.tan(this.camera.fov*Math.PI/360);
  const pose=this.pose||{x:0,y:0,z:0,rx:0,ry:0,rz:0};
  this.rig.scale.setScalar(scale);
  // posiciona o braço à direita, dentro do quadro
  this.rig.position.set(.66*depth*tan*aspect+pose.x*scale,-1.15*depth*tan+pose.y*scale,-depth+pose.z*scale);
  // inclinação do braço vindo da direita (mais natural que centralizado)
  this.rig.rotation.set(-.30+pose.rx,-.24+pose.ry,.16+pose.rz);
  // o braço em si fica ligeiramente rotacionado para o item apontar pra frente
  if(this.arm)this.arm.rotation.set(-.15,0,-.08);
  if(this.heldPivot)this.heldPivot.visible=this.showHeld;
 }

 render(renderer,{running=true,paused=false}={}){
  if(!this.enabled||!running||paused)return;
  const state={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),test:renderer.getScissorTest(),auto:renderer.autoClear,xr:renderer.xr.enabled,clip:renderer.clippingPlanes,shadow:renderer.shadowMap.autoUpdate};
  try{
   renderer.autoClear=false;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;
   renderer.clippingPlanes=[];renderer.setScissorTest(false);
   renderer.clearDepth();
   renderer.render(this.scene,this.camera);
  }finally{
   renderer.autoClear=state.auto;renderer.xr.enabled=state.xr;renderer.shadowMap.autoUpdate=state.shadow;
   renderer.clippingPlanes=state.clip;
   renderer.setRenderTarget(state.target);renderer.setViewport(state.viewport);renderer.setScissor(state.scissor);renderer.setScissorTest(state.test);
  }
 }

 dispose(){
  if(this.held){this.held.geometry.dispose();this.held.removeFromParent();this.held=null;}
  for(const geometry of this.geometries)geometry.dispose();
  for(const material of this.materials)material.dispose();
  this.skin.dispose();this.sleeve.dispose();
  this.rig.removeFromParent();
 }
}
