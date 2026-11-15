// Modelo puro. Posições normalizadas por orientação; nenhum dado de mundo é alterado.
export const HUD_LAYOUT_KEY='quadrum-hud-layout-v1';
export const HUD_ELEMENTS=Object.freeze([
 {key:'joystick',selector:'#joystick',name:'Joystick',interactive:true},
 ...[['use','Usar'],['fly','Voar / andar'],['up','Subir'],['down','Descer'],['jump','Pular'],['break','Quebrar'],['place','Colocar']].map(([id,name])=>({key:'action-'+id,selector:`#touch-actions [data-action="${id}"]`,name,interactive:true})),
 {key:'hotbar',selector:'#hotbar',name:'Barra de blocos',interactive:true},
 {key:'inventory',selector:'#inventory-open',name:'Inventário',interactive:true},
 {key:'pause',selector:'#pause-open',name:'Pausa',interactive:true},
 {key:'weather',selector:'#environment-open',name:'Clima e ciclo',interactive:true},
 {key:'debug',selector:'#debug',name:'FPS / coordenadas'},
 {key:'block-name',selector:'#block-label',name:'Nome do bloco'},
 {key:'crosshair',selector:'#crosshair',name:'Mira · tamanho apenas',movable:false,minScale:.5,maxScale:3}
]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const orientationFor=(width,height)=>width>height?'landscape':'portrait';
export const emptyLayout=()=>({version:1,profiles:{portrait:{},landscape:{}}});
export function sanitizeLayout(raw){const clean=emptyLayout();if(!raw||raw.version!==1)return clean;for(const orientation of ['portrait','landscape'])for(const def of HUD_ELEMENTS){const value=raw.profiles?.[orientation]?.[def.key];if(!value||![value.x,value.y,value.scale].every(Number.isFinite))continue;clean.profiles[orientation][def.key]={x:def.movable===false?.5:clamp(value.x,0,1),y:def.movable===false?.5:clamp(value.y,0,1),scale:clamp(value.scale,def.minScale??.65,def.maxScale??2.5)};}return clean;}
export function entryFromRect(rect,viewport){return{x:(rect.left+rect.width/2)/viewport.width,y:(rect.top+rect.height/2)/viewport.height,scale:1};}
export function clampHudEntry(entry,base,viewport,def={},insets={}){const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height),margin={left:Math.max(4,insets.left||0),right:Math.max(4,insets.right||0),top:Math.max(4,insets.top||0),bottom:Math.max(4,insets.bottom||0)},availableW=Math.max(1,width-margin.left-margin.right),availableH=Math.max(1,height-margin.top-margin.bottom),fit=Math.min(availableW/Math.max(1,base.width),availableH/Math.max(1,base.height)),scale=Math.max(.05,Math.min(clamp(Number.isFinite(entry.scale)?entry.scale:1,def.minScale??.65,def.maxScale??2.5),fit)),w=base.width*scale,h=base.height*scale;
 let cx=(Number.isFinite(entry.x)?entry.x:.5)*width,cy=(Number.isFinite(entry.y)?entry.y:.5)*height;if(def.movable===false){cx=width/2;cy=height/2;}else{cx=clamp(cx,margin.left+w/2,width-margin.right-w/2);cy=clamp(cy,margin.top+h/2,height-margin.bottom-h/2);}return{x:cx/width,y:cy/height,scale,left:cx-w/2,top:cy-h/2,width:w,height:h};}
export function resizeHudEntry(start,delta,base,viewport,def={},insets={}){const denominator=base.width**2+base.height**2,change=denominator?(delta.x*base.width+delta.y*base.height)/denominator:0,scale=start.scale+change;const fixed=clampHudEntry({...start,scale},base,viewport,def,insets);if(def.movable===false)return fixed;const left=start.x*viewport.width-base.width*start.scale/2,top=start.y*viewport.height-base.height*start.scale/2;return clampHudEntry({x:(left+base.width*fixed.scale/2)/viewport.width,y:(top+base.height*fixed.scale/2)/viewport.height,scale:fixed.scale},base,viewport,def,insets);}
export class HudLayoutStore{
 constructor(storage){this.storage=storage;}
 load(){try{return sanitizeLayout(JSON.parse(this.storage.getItem(HUD_LAYOUT_KEY)||'null'));}catch{return emptyLayout();}}
 save(layout){const value=sanitizeLayout(layout);this.storage.setItem(HUD_LAYOUT_KEY,JSON.stringify(value));return value;}
}
