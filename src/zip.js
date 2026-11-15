// Leitor ZIP pequeno, sem dependências: métodos store e deflate, sem executar nada.
export function safePath(value){if(typeof value!=='string'||value.length>512||value.includes('\0'))throw new Error('Caminho inválido no pacote');const path=value.replace(/\\/g,'/');if(path.startsWith('/')||path.includes(':')||path.split('/').some(p=>p==='..'||p==='.'))throw new Error('Caminho fora do pacote: '+path);return path;}
export async function readZip(file){
 if(file.size>64*1024*1024)throw new Error('ZIP maior que 64 MB');const buffer=await file.arrayBuffer(),view=new DataView(buffer),bytes=new Uint8Array(buffer);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('ZIP inválido');const count=view.getUint16(end+10,true);let cursor=view.getUint32(end+16,true),total=0;const files=[];
 if(count>2048||view.getUint16(end+4,true)!==0||view.getUint16(end+6,true)!==0)throw new Error('ZIP muito grande, multipartes ou ZIP64 não suportado');
 for(let n=0;n<count;n++){
  if(cursor+46>bytes.length||view.getUint32(cursor,true)!==0x02014b50)throw new Error('Índice ZIP inválido');const flags=view.getUint16(cursor+8,true),method=view.getUint16(cursor+10,true),compressed=view.getUint32(cursor+20,true),size=view.getUint32(cursor+24,true),nameLength=view.getUint16(cursor+28,true),extra=view.getUint16(cursor+30,true),comment=view.getUint16(cursor+32,true),offset=view.getUint32(cursor+42,true);
  if(cursor+46+nameLength+extra+comment>bytes.length)throw new Error('ZIP truncado');const path=safePath(new TextDecoder().decode(bytes.subarray(cursor+46,cursor+46+nameLength)));cursor+=46+nameLength+extra+comment;if(path.endsWith('/')||path.startsWith('__MACOSX/'))continue;
  if(flags&1)throw new Error('ZIP com senha não suportado');if(size>16*1024*1024||(total+=size)>64*1024*1024)throw new Error('Pacote descompactado maior que o limite (64 MB / 16 MB por arquivo)');
  if(offset+30>bytes.length||view.getUint32(offset,true)!==0x04034b50)throw new Error('Entrada ZIP inválida');const start=offset+30+view.getUint16(offset+26,true)+view.getUint16(offset+28,true);if(start+compressed>bytes.length)throw new Error('Entrada ZIP truncada');let blob=new Blob([bytes.subarray(start,start+compressed)]);
  if(method===8){let stream;try{stream=blob.stream().pipeThrough(new DecompressionStream('deflate-raw'));}catch{throw new Error('Este navegador não abre ZIP deflate. Importe a pasta ou arquivos.');}const reader=stream.getReader(),parts=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>size||length>16*1024*1024){await reader.cancel();throw new Error('ZIP excedeu o tamanho declarado');}parts.push(value);}}finally{reader.releaseLock();}blob=new Blob(parts);}
  else if(method!==0)throw new Error('Compressão ZIP não suportada: '+method);if(blob.size!==size)throw new Error('Tamanho incorreto no ZIP');files.push({path,blob});
 }return files;
}
