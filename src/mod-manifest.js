import {hashSeed} from './noise.js';
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
export function normalizeManifest(raw,url){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('pack.json precisa ser um objeto.');
 const uuid=String(raw.uuid||raw.UUID||raw.UIID||raw.uiid||raw.id||'').toLowerCase();
 if(!/^[a-z0-9_.-]{1,100}$/.test(uuid))throw new Error('UUID/UIID obrigatório (1–100 letras, números, _, - ou ponto).');
 const apiVersion=Number(raw.apiVersion??raw.api??1);if(apiVersion!==1)throw new Error('Versão da API incompatível: '+apiVersion);
 const files={js:[],css:[],html:[]};
 const push=(type,values)=>{for(const path of array(values)){if(typeof path!=='string'||!path.trim())throw new Error('Caminho de arquivo inválido.');const u=new URL(path,url);if(!['http:','https:'].includes(u.protocol))throw new Error('Arquivos de mods precisam ser servidos por HTTP(S).');if(!files[type].includes(u.href))files[type].push(u.href);}};
 const infer=value=>{for(const path of array(value)){if(typeof path!=='string')throw new Error('files deve conter caminhos.');const ext=new URL(path,url).pathname.split('.').pop().toLowerCase();if(!files[ext])throw new Error('Arquivo não executável em files: '+path);push(ext,path);}};
 if(typeof raw.files==='string'||Array.isArray(raw.files))infer(raw.files);
 else if(raw.files){for(const type of ['js','css','html'])push(type,raw.files[type]);}
 for(const v of [raw.entry,raw.main,raw.js,raw.scripts])push('js',v);
 for(const v of [raw.css,raw.styles])push('css',v);
 for(const v of [raw.html,raw.ui])push('html',v);
 if(!Object.values(files).some(v=>v.length))throw new Error('Declare pelo menos um arquivo .js, .css ou .html.');
 return{uuid,name:String(raw.name||raw.nome||raw.NOME||uuid).slice(0,100),description:String(raw.description||raw.descricao||raw.descrical||raw.DESCRICAO||raw.DESCRICAL||'').slice(0,2000),version:String(raw.version||'1.0.0'),apiVersion,url:new URL(url).href,baseURL:new URL('.',url).href,files,assets:raw.assets||{},dependencies:array(raw.dependencies).map(d=>String(typeof d==='string'?d:d.uuid||d.id).toLowerCase()),raw};
}
export function singleFileManifest(url){const u=new URL(url),name=decodeURIComponent(u.pathname.split('/').pop());return normalizeManifest({uuid:'single-'+hashSeed(u.href).toString(16),name,description:'Mod JavaScript de arquivo único',js:name},u.href);}
export function resolveAssets(value,base){if(typeof value==='string')return new URL(value,base).href;if(Array.isArray(value))return value.map(v=>resolveAssets(v,base));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolveAssets(v,base)]));return value;}
