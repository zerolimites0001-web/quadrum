import * as THREE from '../vendor/three.module.js';
import {getBlock} from './blocks.js';
import {HEIGHT} from './terrain.js';
import {boxesFor,intersectsBox} from './shapes.js';
const HALF=.30, BODY=1.78,EYE=1.62;
export class Player {
 constructor(camera,world,saved){this.camera=camera;this.world=world;const spawn=world.terrain.spawn();this.position=new THREE.Vector3(spawn.x,spawn.y,spawn.z);this.velocity=new THREE.Vector3();this.yaw=0;this.pitch=0;this.flying=false;this.onGround=false;if(saved){if(['x','y','z'].every(k=>Number.isFinite(saved[k])&&Math.abs(saved[k])<3e7))this.position.set(saved.x,Math.max(1,Math.min(HEIGHT+120,saved.y)),saved.z);this.yaw=Number.isFinite(saved.yaw)?saved.yaw:0;this.pitch=Number.isFinite(saved.pitch)?Math.max(-1.55,Math.min(1.55,saved.pitch)):0;this.flying=!!saved.flying;}this.updateCamera();}
 look(dx,dy,sensitivity){this.yaw-=dx*.0023*sensitivity;this.pitch=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,this.pitch-dy*.0023*sensitivity));this.updateCamera();}
 toggleFly(){this.flying=!this.flying;this.velocity.y=0;return this.flying;}
 update(dt,input){const p=this.position,w=this.world;const pcx=Math.floor(p.x/16),pcz=Math.floor(p.z/16);w.ensure(pcx,pcz);
  // Chunk ainda vazio provisório (worker a caminho): não aplica gravidade para não
  // fazer o jogador cair no void enquanto os dados reais não chegam.
  const pchunk=w.chunks.get(pcx+','+pcz);
  if(pchunk&&pchunk.provisional){this.velocity.y=0;this.updateCamera();return;}
  const underwater=getBlock(w.get(Math.floor(p.x),Math.floor(p.y+1),Math.floor(p.z))).liquid;
  let forward=(input.keys.has('KeyW')?1:0)-(input.keys.has('KeyS')?1:0)-input.joy.y;
  let strafe=(input.keys.has('KeyD')?1:0)-(input.keys.has('KeyA')?1:0)+input.joy.x;const length=Math.hypot(strafe,forward);if(length>1){strafe/=length;forward/=length;}
  const sprint=input.keys.has('ControlLeft')||input.keys.has('ControlRight');const speed=(this.flying?11:underwater?3.2:5.2)*(sprint?1.7:1);
  const vx=(Math.cos(this.yaw)*strafe-Math.sin(this.yaw)*forward)*speed,vz=(-Math.sin(this.yaw)*strafe-Math.cos(this.yaw)*forward)*speed;
  const blend=1-Math.exp(-(this.flying?10:16)*dt);this.velocity.x+=(vx-this.velocity.x)*blend;this.velocity.z+=(vz-this.velocity.z)*blend;
  const up=input.keys.has('Space')||input.actions.has('jump')||input.actions.has('up'),down=input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')||input.actions.has('down');
  if(this.flying)this.velocity.y=((up?1:0)-(down?1:0))*speed*.8;
  else if(underwater){this.velocity.y=Math.max(-3,this.velocity.y-5*dt);if(up)this.velocity.y=4;}
  else{if(up&&this.onGround){this.velocity.y=8.5;this.onGround=false;}this.velocity.y=Math.max(-42,this.velocity.y-24*dt);}
  this.stepFloor=this.position.y;this.canStep=this.onGround&&!this.flying&&!underwater;this.move('x',this.velocity.x*dt);this.move('z',this.velocity.z*dt);this.onGround=false;this.move('y',this.velocity.y*dt);
  if(p.y>HEIGHT+120){p.y=HEIGHT+120;this.velocity.y=0;}if(p.y<-15){const spawn=w.terrain.spawn();p.set(spawn.x,spawn.y,spawn.z);this.velocity.set(0,0,0);}
  this.underwater=!!getBlock(w.get(Math.floor(p.x),Math.floor(p.y+EYE),Math.floor(p.z))).liquid;this.updateCamera();
 }
 canOccupy(x,y,z){const position={x,y,z};for(let yy=Math.floor(y);yy<=Math.floor(y+BODY-.0001);yy++)for(let zz=Math.floor(z-HALF);zz<=Math.floor(z+HALF-.0001);zz++)for(let xx=Math.floor(x-HALF);xx<=Math.floor(x+HALF-.0001);xx++)for(const box of this.world.collisionBoxes(xx,yy,zz))if(intersectsBox(position,box,xx,yy,zz))return false;return true;}
 move(axis,amount){if(Math.abs(amount)<1e-8)return;const p=this.position;p[axis]+=amount;const minX=Math.floor(p.x-HALF+.0001),maxX=Math.floor(p.x+HALF-.0001),minY=Math.floor(p.y+.0001),maxY=Math.floor(p.y+BODY-.0001),minZ=Math.floor(p.z-HALF+.0001),maxZ=Math.floor(p.z+HALF-.0001);
  for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++)for(const box of this.world.collisionBoxes(x,y,z)){
   if(!intersectsBox(p,box,x,y,z))continue;
   const top=y+box[4];if(axis!=='y'&&this.canStep&&top>p.y+.0001&&top<=this.stepFloor+.601&&this.canOccupy(p.x,top,p.z)){p.y=top;continue;}
   if(axis==='x')p.x=amount>0?x+box[0]-HALF:x+box[3]+HALF;
   else if(axis==='z')p.z=amount>0?z+box[2]-HALF:z+box[5]+HALF;
   else{p.y=amount>0?y+box[1]-BODY:y+box[4];if(amount<0)this.onGround=true;}
   this.velocity[axis]=0;
  }
 }
 intersects(x,y,z){return intersectsBox(this.position,[0,0,0,1,1,1],x,y,z);}
 intersectsBlock(id,x,y,z){return boxesFor(id).some(box=>intersectsBox(this.position,box,x,y,z));}

 updateCamera(){this.camera.position.copy(this.position);this.camera.position.y+=EYE;this.camera.rotation.order='YXZ';this.camera.rotation.set(this.pitch,this.yaw,0);}
 serialize(){return{x:this.position.x,y:this.position.y,z:this.position.z,yaw:this.yaw,pitch:this.pitch,flying:this.flying};}
}
