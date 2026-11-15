export class Controls {
 constructor(canvas,callbacks){this.canvas=canvas;this.cb=callbacks;this.keys=new Set();this.actions=new Set();this.joy={x:0,y:0};this.enabled=false;this.touch=false;this.lookPointer=null;this.joyPointer=null;this.lastJump=0;this.lastTouch=0;this.bind();}
 setTouch(value){this.touch=value;document.body.classList.toggle('touch',value);}
 clear(){this.keys.clear();this.actions.clear();this.joy.x=this.joy.y=0;this.lookPointer=null;this.joyPointer=null;document.getElementById('stick').style.transform='';document.querySelectorAll('.pressed').forEach(e=>e.classList.remove('pressed'));}
 jumpTap(){const now=performance.now();if(now-this.lastJump<300){this.cb.fly();this.lastJump=0;}else this.lastJump=now;}
 lock(){if(!this.touch&&this.enabled&&document.pointerLockElement!==this.canvas){try{const promise=this.canvas.requestPointerLock?.();promise?.catch?.(()=>{});}catch{}}}
 unlock(){if(document.pointerLockElement)document.exitPointerLock();}
 bind(){
  window.addEventListener('keydown',e=>{if(!this.enabled)return;const key=e.code;if(['Space','Tab','ArrowUp','ArrowDown'].includes(key))e.preventDefault();if(e.repeat)return;if(key==='Escape'){e.preventDefault();this.cb.pause();return;}if(key==='KeyE'||key==='Tab'){e.preventDefault();this.cb.inventory();return;}if(key==='KeyF'){this.cb.fly();return;}if(key==='KeyR')this.actions.add('use');if(key==='Space')this.jumpTap();if(/^Digit[1-9]$/.test(key))this.cb.slot(Number(key.slice(-1))-1);this.keys.add(key);});
  window.addEventListener('keyup',e=>{this.keys.delete(e.code);if(e.code==='KeyR')this.actions.delete('use');});
  window.addEventListener('blur',()=>{this.clear();if(this.enabled)this.cb.pause();});
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&this.enabled&&!this.touch)this.cb.pause();});
  this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
  this.canvas.addEventListener('pointerdown',e=>{if(!this.enabled)return;if(e.pointerType==='touch'){e.preventDefault();this.lastTouch=performance.now();if(this.lookPointer!==null)return;this.lookPointer=e.pointerId;this.lastLook={x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);return;}if(performance.now()-this.lastTouch<500)return;if(document.pointerLockElement!==this.canvas){this.lock();return;}if(e.button===0)this.actions.add('break');if(e.button===2)this.actions.add('place');if(e.button===1)this.cb.pick();});
  window.addEventListener('pointermove',e=>{if(!this.enabled)return;if(e.pointerId===this.lookPointer){const dx=e.clientX-this.lastLook.x,dy=e.clientY-this.lastLook.y;this.lastLook={x:e.clientX,y:e.clientY};this.cb.look(dx,dy);}else if(document.pointerLockElement===this.canvas&&e.pointerType!=='touch')this.cb.look(e.movementX,e.movementY);});
  const release=e=>{if(e.pointerId===this.lookPointer)this.lookPointer=null;if(e.pointerType!=='touch'){if(e.button===0)this.actions.delete('break');if(e.button===2)this.actions.delete('place');}};
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  this.canvas.addEventListener('wheel',e=>{if(this.enabled){e.preventDefault();this.cb.scroll(e.deltaY>0?1:-1);}},{passive:false});
  const joy=document.getElementById('joystick'),stick=document.getElementById('stick');
  const update=e=>{const r=joy.getBoundingClientRect(),sx=r.width/(joy.offsetWidth||r.width)||1,sy=r.height/(joy.offsetHeight||r.height)||1,max=Math.max(4,Math.min((joy.offsetWidth||r.width)-(stick.offsetWidth||48),(joy.offsetHeight||r.height)-(stick.offsetHeight||48))/2-3);let x=(e.clientX-r.left-r.width/2)/sx,y=(e.clientY-r.top-r.height/2)/sy;const n=Math.hypot(x,y);if(n>max){x=x/n*max;y=y/n*max;}this.joy.x=x/max;this.joy.y=y/max;if(Math.hypot(this.joy.x,this.joy.y)<.12)this.joy={x:0,y:0};stick.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;};
  joy.addEventListener('pointerdown',e=>{if(!this.enabled||this.joyPointer!==null)return;e.preventDefault();this.joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);update(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===this.joyPointer)update(e);});
  const reset=e=>{if(e.pointerId!==this.joyPointer)return;this.joyPointer=null;this.joy={x:0,y:0};stick.style.transform='';};joy.addEventListener('pointerup',reset);joy.addEventListener('pointercancel',reset);joy.addEventListener('lostpointercapture',reset);
  for(const button of document.querySelectorAll('[data-action]')){const action=button.dataset.action;let active=null;button.addEventListener('contextmenu',e=>e.preventDefault());button.addEventListener('pointerdown',e=>{if(!this.enabled||active!==null)return;e.preventDefault();active=e.pointerId;button.setPointerCapture(e.pointerId);button.classList.add('pressed');if(action==='fly')this.cb.fly();else{if(action==='jump')this.jumpTap();this.actions.add(action);}});const end=e=>{if(e.pointerId!==active)return;active=null;button.classList.remove('pressed');this.actions.delete(action);};button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);}
 }
}
