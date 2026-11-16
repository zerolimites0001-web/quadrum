// Preferências globais de gráficos. Não dependem do devicePixelRatio do aparelho.
export const GRAPHICS_DEFAULTS=Object.freeze({shadows:false,pixelRatio:1,filter:'normal'});
export const GRAPHICS_FILTERS=Object.freeze({
 normal:{name:'Normal · sem filtro',css:'none',imageRendering:'auto'},
 vivid:{name:'Vívido',css:'saturate(1.22) contrast(1.06) brightness(1.015)',imageRendering:'auto'},
 classic:{name:'Clássico',css:'saturate(.90) contrast(.98)',imageRendering:'auto'}
});
export function normalizeGraphics(raw={}){const source=raw&&typeof raw==='object'?raw:{},value=Number(source.pixelRatio),pixelRatio=(typeof source.pixelRatio==='number'||typeof source.pixelRatio==='string'&&source.pixelRatio.trim()!=='')&&Number.isFinite(value)?Math.round(Math.max(.5,Math.min(2,value))*10)/10:1;return{shadows:source.shadows===true,pixelRatio,filter:Object.hasOwn(GRAPHICS_FILTERS,source.filter)?source.filter:'normal'};}
export function applyGraphics(renderer,canvas,raw){const options=normalizeGraphics(raw),filter=GRAPHICS_FILTERS[options.filter];if(renderer&&renderer.getPixelRatio()!==options.pixelRatio)renderer.setPixelRatio(options.pixelRatio);if(canvas){canvas.style.filter=filter.css;canvas.style.imageRendering=filter.imageRendering;}return options;}
