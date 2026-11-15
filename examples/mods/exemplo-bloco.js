// Importe este arquivo manualmente em Mods → JS / arquivos.
// Um .js único não precisa de pack.json. O UUID automático depende do nome do arquivo.
export default async function(api){
 const blue=await api.blocks.register('azul',{name:'Bloco azul de exemplo',color:'#36bfd4',category:'Exemplo'});
 await api.items.register('varinha',{name:'Varinha de partículas',color:'#e8a63f',category:'Exemplo',cooldown:.35,
  onUse({kind,target},api){if(kind!=='place'||!api.scene)return;const T=api.THREE,mesh=new T.Mesh(new T.IcosahedronGeometry(.15,0),new T.MeshBasicMaterial({color:0xffdc66}));
   if(target)mesh.position.set(target.x+.5,target.y+1.4,target.z+.5);else{api.camera.getWorldDirection(mesh.position);mesh.position.multiplyScalar(2).add(api.camera.position);}
   api.effects.spawn({object:mesh,duration:1.4,update:({object,dt})=>{object.rotation.y+=dt*3;object.position.y+=dt*.7;}});
   api.sounds.tone({frequency:660,duration:.12});
  }
 });
 api.events.on('worldEnter',()=>api.toast('Exemplo ativo: procure "Exemplo" no inventário.'));
 api.log('Bloco registrado:',blue);
 // Sem kill próprio: eventos, objetos, texturas e conteúdo são rastreados pelo jogo.
}
