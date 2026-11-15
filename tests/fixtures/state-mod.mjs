export default function(api){
 if(globalThis.failStateMod)throw new Error('Falha temporária simulada');
 globalThis.loadedStateMods.push(api.manifest.uuid);
}
