import * as T from '../vendor/three.module.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// Luz de preenchimento separada da posição do disco solar: noite legível,
// transição contínua nos horizontes e sol com contraste direcional real.
export function lightLevels(phase,cloud=0){const t=clamp((phase.elevation+.20)/.55),fill=t*t*(3-2*t),sun=Math.pow(Math.max(0,phase.elevation),.45),moon=Math.pow(Math.max(0,-phase.elevation),.5);return{fill,ambient:(.62+fill*.92+phase.twilight*.12)*(1-cloud*.14),direct:(phase.isDay?2.6*sun:.34*moon)*(1-cloud*.42)};}
export class SunShadows{
 constructor(game,light){this.game=game;this.light=light;this.last=-Infinity;this.dirty=true;if(!light)return;
  game.scene.add(light.target);const shadow=light.shadow;shadow.mapSize.set(512,512);shadow.bias=-.00035;shadow.normalBias=.045;shadow.intensity=.72;shadow.camera.near=1;shadow.camera.far=190;
  if(game.renderer){game.renderer.shadowMap.enabled=false;game.renderer.shadowMap.type=T.PCFSoftShadowMap;game.renderer.shadowMap.autoUpdate=false;}
 }
 invalidate(){this.dirty=true;}
 update(enabled,elevation,time){const {game,light}=this;if(!light)return;const on=enabled===true&&elevation>.07,changed=light.castShadow!==on;light.castShadow=on;
  if(game.renderer){game.renderer.shadowMap.enabled=on;if(!on)game.renderer.shadowMap.needsUpdate=false;}
  if(!on){this.last=-Infinity;if(light.shadow.map){light.shadow.map.dispose();light.shadow.map=null;}if(light.shadow.mapPass){light.shadow.mapPass.dispose();light.shadow.mapPass=null;}return;}
  if(!game.renderer||!game.world)return;
  // Até cinco mapas/s; edições entram na próxima atualização. Apenas região local.
  if(!changed&&time>=this.last&&time-this.last<.20)return;this.last=time;this.dirty=false;
  const p=game.player.position,extent=Math.min(28,Math.max(16,game.settings.distance*12)),c=light.shadow.camera;c.left=-extent;c.right=extent;c.top=extent;c.bottom=-extent;c.updateProjectionMatrix();
  for(const chunk of game.world.chunks.values())for(const mesh of chunk.group?.children||[])if(mesh.userData.voxelShadowCaster)mesh.castShadow=Math.abs(chunk.cx*16+8-p.x)<extent+24&&Math.abs(chunk.cz*16+8-p.z)<extent+24;
  light.shadow.needsUpdate=true;game.renderer.shadowMap.needsUpdate=true;
 }
}
