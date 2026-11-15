// Eventos síncronos canceláveis. Erros de um mod não derrubam o loop do jogo.
export class EventBus {
 constructor(onError=console.error){this.listeners=new Map();this.onError=onError;}
 on(name,callback,options={}){if(typeof callback!=='function')throw new TypeError('Listener precisa ser função');const entry={callback,once:!!options.once,errors:0};if(!this.listeners.has(name))this.listeners.set(name,new Set());const set=this.listeners.get(name);set.add(entry);return()=>set.delete(entry);}
 emit(name,detail={}){const event={...detail,type:name,cancelled:false,preventDefault(){this.cancelled=true;}};for(const entry of [...(this.listeners.get(name)||[])]){if(entry.once)this.listeners.get(name).delete(entry);try{const result=entry.callback(event);if(result?.catch)result.catch(e=>this.fail(name,entry,e));}catch(e){this.fail(name,entry,e);}}return event;}
 fail(name,entry,error){entry.errors++;this.onError(error,name);if(entry.errors>=3)this.listeners.get(name)?.delete(entry);}
}
