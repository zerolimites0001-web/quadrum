const DURATIONS={break:.20,place:.18,use:.22};
const zero=()=>({x:0,y:0,z:0,rx:0,ry:0,rz:0});
export function swingPose(kind,progress){const t=Math.max(0,Math.min(1,progress));if(t===0||t===1)return zero();const hit=Math.sin(Math.PI*t),snap=Math.sin(Math.PI*Math.sqrt(t));if(kind==='place')return{x:-.045*hit,y:.045*hit,z:-.19*snap,rx:-.32*hit,ry:.16*hit,rz:.12*hit};if(kind==='use')return{x:-.025*hit,y:.075*hit,z:-.105*snap,rx:-.20*hit,ry:.12*hit,rz:.18*hit};return{x:-.095*hit,y:.065*hit,z:-.17*snap,rx:-.72*hit,ry:.27*hit,rz:.47*hit};}
export class FirstPersonMotion{
 constructor(){this.reset();}
 reset(){this.kind=null;this.elapsed=0;this.pending=null;this.time=0;this.walk=0;this.swap=1;this.bobAmount=0;}
 trigger(kind){if(!Object.hasOwn(DURATIONS,kind))return;if(this.kind){this.pending=kind;return;}this.kind=kind;this.elapsed=0;}
 equip(){this.swap=0;}
 update(dt,{speed=0,grounded=false,flying=false,bob=true}={}){dt=Math.max(0,Math.min(.1,Number(dt)||0));this.time+=dt;this.swap=Math.min(1,this.swap+dt/.20);if(this.kind){this.elapsed+=dt;const duration=DURATIONS[this.kind];if(this.elapsed>=duration){const rest=this.elapsed-duration;this.kind=this.pending;this.pending=null;this.elapsed=this.kind?rest:0;}}
  const moving=bob&&grounded&&!flying&&speed>.15;if(moving)this.walk+=dt*Math.min(8,speed)*1.7;const desired=moving?Math.min(1,speed/5):0;this.bobAmount=(this.bobAmount||0)+(desired-(this.bobAmount||0))*(1-Math.exp(-dt*12));const pose=this.kind?swingPose(this.kind,this.elapsed/DURATIONS[this.kind]):zero();if(bob){pose.x+=Math.cos(this.walk)*.012*this.bobAmount;pose.y+=Math.sin(this.walk*2)*.017*this.bobAmount;pose.rz+=Math.sin(this.walk)*.018*this.bobAmount;}pose.y+=Math.sin(this.time*1.6)*.004;pose.y-=Math.sin(this.swap*Math.PI)*.14;return pose;
 }
}
