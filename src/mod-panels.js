// Política central de painéis de mods. Multitouch fica sob controle do jogo.
// Não é sandbox: mods confiáveis ainda podem alterar game.controls diretamente.
export class ModPanels {
 constructor(game,bus){this.game=game;this.entries=new Set();this.suspended=null;
  bus?.on('tick',()=>this.sync({lock:false}));
  bus?.on('pause',()=>this.closeAll({lock:false}));
  bus?.on('worldLeave',()=>this.closeAll({lock:false}));
 }
 active(){return this.game.running&&!this.game.paused;}
 create(element){if(!element||typeof element.setAttribute!=='function')throw new TypeError('api.ui.panel precisa de um elemento HTML.');
  const owner=this,entry={element,open:false,disposed:false},had=element.hasAttribute('data-interactive'),previous=element.getAttribute('data-interactive');
  element.setAttribute('data-interactive','');element.hidden=true;this.entries.add(entry);
  function setOpen(open,{lock=true}={}){if(entry.disposed)return;entry.open=!!open;element.hidden=!entry.open;owner.sync({lock});}
  return{get isOpen(){return entry.open;},open:()=>setOpen(true),close:options=>setOpen(false,options),toggle:()=>setOpen(!entry.open),dispose(){if(entry.disposed)return;entry.open=false;element.hidden=true;entry.disposed=true;owner.entries.delete(entry);if(had)element.setAttribute('data-interactive',previous);else element.removeAttribute('data-interactive');owner.sync({lock:false});}};
 }
 sync({lock=false}={}){const controls=this.game.controls;if(!controls)return;
  const wantsMouse=this.active()&&!controls.touch&&[...this.entries].some(e=>e.open);
  if(wantsMouse){if(this.suspended===null){this.suspended={controls,enabled:controls.enabled};controls.enabled=false;controls.clear();controls.unlock();}else controls.enabled=false;return;}
  if(this.suspended!==null){const saved=this.suspended;this.suspended=null;
   saved.controls.enabled=saved.enabled&&this.active();
   if(lock&&saved.controls.enabled&&!saved.controls.touch)saved.controls.lock();
  }
 }
 closeAll({lock=false}={}){for(const entry of this.entries){entry.open=false;entry.element.hidden=true;}this.sync({lock});}
}
