import {Perlin,hashSeed,hash2} from './noise.js';
import {ID,getBlock} from './blocks.js';
import {validateGenerator,flatIds,WORLD_HEIGHT} from './world-options.js';
import {VillageGenerator} from './villages.js';
import {modernTreeBlocks,MODERN_TREE_SPECS,TREE_REACH,MAX_TREE_SPACING,treeSpacing} from './trees.js';
export const CHUNK=16, HEIGHT=WORLD_HEIGHT, SEA=29;
export const index=(x,y,z)=>x+z*CHUNK+y*CHUNK*CHUNK;
export const chunkKey=(cx,cz)=>cx+','+cz;
export const TREE_TYPES={
 oak:{trunk:'oak_log',leaves:'oak_leaves',height:5,variation:2},
 birch:{trunk:'birch_log',leaves:'birch_leaves',height:6,variation:2},
 spruce:{trunk:'spruce_log',leaves:'spruce_leaves',height:7,variation:3},
 acacia:{trunk:'acacia_log',leaves:'acacia_leaves',height:5,variation:2},
 jungle:{trunk:'jungle_log',leaves:'jungle_leaves',height:8,variation:3},
 cherry:{trunk:'cherry_log',leaves:'cherry_leaves',height:5,variation:2},
 mangrove:{trunk:'mangrove_log',leaves:'mangrove_leaves',height:5,variation:2},
 pale_oak:{trunk:'pale_oak_log',leaves:'pale_oak_leaves',height:6,variation:2},
 azalea:{trunk:'oak_log',leaves:'azalea_leaves',height:4,variation:2},
};
export class Terrain {
 constructor(seed,options){this.seed=hashSeed(seed);this.options=validateGenerator(options,{legacy:true});this.noise=new Perlin(seed);this.climate=new Perlin(seed+':biomes');this.flat=this.options.type==='flat'?flatIds(this.options):null;this.villages=new VillageGenerator(seed,this.options,(x,z)=>this.baseColumn(x,z));}
 column(x,z){return this.villages.surface(x,z,this.baseColumn(x,z));}
 baseColumn(x,z){
  if(this.flat){const h=this.flat.length-1;return{h,biome:'Planícies',sandy:false,snow:false,top:this.flat[h],fill:this.flat[Math.max(0,h-1)],tree:null,density:0,flora:'meadow',temperature:0,humidity:0};}
  const n=this.noise,continental=n.fbm(x*.0035,z*.0035,3),hills=n.fbm(x*.018,z*.018,4),ridge=1-Math.abs(n.fbm(x*.008+180,z*.008-120,3));
  const mountain=Math.max(0,this.climate.noise(x*.004+50,z*.004+50)-.04)*45*ridge;
  // A altura original foi preservada: só superfícies, flora e árvores mudaram.
  const h=Math.max(9,Math.min(HEIGHT-13,Math.floor(33+continental*24+hills*13+mountain)));
  const temperature=this.climate.fbm(x*.0025,z*.0025,3),humidity=this.climate.fbm(x*.003+391,z*.003-219,3),special=this.climate.noise(x*.004-147,z*.004+631);
  let biome='Planícies',tree='oak',density=.009,flora='meadow';
  if(h<SEA-3){biome='Oceano';tree=null;density=0;}
  else if(h<=SEA+1){biome='Praia';tree=null;density=0;}
  else if(h>57){biome='Montanhas';tree=null;density=0;}
  else if(temperature<-.32){biome='Tundra';tree=null;density=0;}
  else if(temperature<-.16){biome='Taiga';tree='spruce';density=.045;}
  else if(temperature>.22&&humidity<-.03){biome=h>43?'Terras áridas':'Deserto';tree=null;density=0;}
  else if(temperature>.12&&humidity<.04){biome='Savana';tree='acacia';density=.019;}
  else if(temperature>.10&&humidity>.10&&h<SEA+9){biome='Manguezal';tree='mangrove';density=.06;}
  else if(temperature>.15&&humidity>.03){biome='Selva';tree='jungle';density=.08;}
  else if(special>.35){biome='Bosque de cerejeiras';tree='cherry';density=.055;flora='cherry';}
  else if(special<-.39){biome='Bosque pálido';tree='pale_oak';density=.06;flora='pale';}
  else if(humidity>.17){biome='Floresta de bétulas';tree='birch';density=.065;}
  else if(humidity>.045){biome='Floresta';tree='oak';density=.065;flora='forest';}
  else if(humidity<-.13){biome='Campo de flores';tree='azalea';density=.012;flora='flowers';}
  const sandy=biome==='Praia'||biome==='Deserto',snow=biome==='Tundra'||biome==='Taiga'||h>64;
  let top=sandy?ID.sand:snow?ID.snow:ID.grass,fill=sandy?ID.sand:ID.dirt;
  if(biome==='Terras áridas'){top=ID.red_sand;fill=ID.terracotta;}
  if(biome==='Montanhas'&&!snow){top=ID.stone;fill=ID.stone;}
  if(biome==='Manguezal'){top=ID.mud;fill=ID.mud;}
  if(biome==='Oceano'){top=humidity>0?ID.clay:ID.gravel;fill=ID.sand;}
  if(biome==='Bosque pálido')top=ID.moss;
  return{h,biome,sandy,snow,top,fill,tree,density,flora,temperature,humidity};
 }
 treeAt(x,z){
  const r=hash2(x,z,this.seed+73);if(r<.92)return null;const c=this.column(x,z);
  if(!c.tree||r<1-c.density)return null;
  // Espécie NÃO depende da probabilidade usada para escolher uma raiz.
  let type=c.tree;if(c.biome==='Floresta'&&hash2(x,z,this.seed+829)>.84)type='birch';
  if(this.options.version>=3){
   const gap=treeSpacing(type,x,z,this.seed);
   for(let dz=-MAX_TREE_SPACING;dz<=MAX_TREE_SPACING;dz++)for(let dx=-MAX_TREE_SPACING;dx<=MAX_TREE_SPACING;dx++){
    const d2=dx*dx+dz*dz;if(!d2||d2>=MAX_TREE_SPACING**2)continue;
    const nx=x+dx,nz=z+dz,priority=hash2(nx,nz,this.seed+73);if(priority<=r)continue;
    const neighbor=this.column(nx,nz);if(!neighbor.tree||priority<1-neighbor.density)continue;
    const species=neighbor.biome==='Floresta'&&hash2(nx,nz,this.seed+829)>.84?'birch':neighbor.tree;
    if(d2<Math.max(gap,treeSpacing(species,nx,nz,this.seed))**2)return null;
   }
  }else for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)if((dx||dz)&&hash2(x+dx,z+dz,this.seed+73)>r)return null;
  const spec=this.options.version>=3?{...TREE_TYPES[type],...MODERN_TREE_SPECS[type]}:TREE_TYPES[type],height=spec.height+Math.floor(hash2(x,z,this.seed+3)*spec.variation);
  return{x,z,y:c.h,type,height,trunk:ID[spec.trunk],leaves:ID[spec.leaves]};
 }
 treeBlocks(tree,put){
  if(this.options.version>=3)return modernTreeBlocks(tree,put,this.seed);
  const {x,z,y,type,height:h,trunk,leaves}=tree;
  for(let dy=1;dy<=h;dy++)put(x,y+dy,z,trunk);
  if(type==='spruce'){
   for(let dy=2;dy<=h+1;dy++){const radius=Math.min(3,Math.max(0,Math.floor((h+2-dy)/2)));for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++)if(Math.abs(dx)+Math.abs(dz)<=radius*1.6)put(x+dx,y+dy,z+dz,leaves,true);}
   put(x,y+h+2,z,leaves,true);return;
  }
  const flat=type==='acacia',wide=type==='cherry'||flat||type==='jungle';
  const layers=flat?[[-1,3],[0,3],[1,2]]:[[-3,2],[-2,wide?4:3],[-1,wide?4:3],[0,2],[1,1]];
  for(const [dy,radius] of layers)for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   const edge=Math.abs(dx)+Math.abs(dz),jitter=hash2(x+dx*71+dy*13,z+dz*53,this.seed+307);
   if(edge>radius*1.55||edge>=radius*1.3&&jitter>.67)continue;
   put(x+dx,y+h+dy,z+dz,leaves,true);
  }
  const dir=hash2(x,z,this.seed+18)>.5?1:-1;put(x+dir,y+h-2,z,trunk);put(x,y+h-1,z-dir,trunk);
  if(type==='mangrove')for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){put(x+dx,y+1,z+dz,trunk);put(x+dx*2,y,z+dz*2,trunk);}
 }
 generate(cx,cz){
  if(this.flat){const data=new Uint16Array(16*16*HEIGHT);for(let y=0;y<this.flat.length;y++)data.fill(this.flat[y],y*256,(y+1)*256);this.villages.apply(cx,cz,data,index);return data;}
  const data=new Uint16Array(CHUNK*CHUNK*HEIGHT),ox=cx*CHUNK,oz=cz*CHUNK,columns=[];
  for(let z=0;z<16;z++)for(let x=0;x<16;x++){
   const wx=ox+x,wz=oz+z,c=this.column(wx,wz);columns[x+z*16]=c;
   for(let y=0;y<=Math.max(c.h,SEA);y++){
    let b;if(y===0)b=ID.bedrock;else if(y>c.h)b=ID.water;else if(y===c.h)b=c.top;else if(y>c.h-4)b=c.fill;else{
     b=y<12?ID.deepslate:ID.stone;
     if(y>4&&y<c.h-6&&this.noise.noise(wx*.065,y*.09,wz*.065)>.54)b=0;
     else{const r=hash2(wx+y*941,wz-y*173,this.seed);if(r>.984)b=ID.coal_ore;else if(r>.975&&y<35)b=ID.iron_ore;else if(r>.971&&y<22)b=ID.gold_ore;else if(r>.968&&y<13)b=ID.diamond_ore;else if(r>.965&&y<17)b=ID.redstone_ore;}
    }data[index(x,y,z)]=b;
   }
  }
  const put=(wx,y,wz,b,onlyAir=false)=>{const x=wx-ox,z=wz-oz;if(x<0||x>=16||z<0||z>=16||y<0||y>=HEIGHT)return;const i=index(x,y,z);if(!onlyAir||data[i]===0)data[i]=b;};
  const reach=this.options.version>=3?TREE_REACH:4;for(let z=oz-reach;z<oz+16+reach;z++)for(let x=ox-reach;x<ox+16+reach;x++){const tree=this.treeAt(x,z);if(tree)this.treeBlocks(tree,put);}
  const meadow=['rose','dandelion','cornflower','daisy','allium','lily','tulip_red','tulip_white','tulip_orange','tulip_pink','orchid','torchflower'];
  for(let z=0;z<16;z++)for(let x=0;x<16;x++){
   const c=columns[x+z*16];if(c.h<=SEA||c.sandy||c.snow||!c.tree||c.village)continue;const i=index(x,c.h+1,z);if(data[i])continue;
   const r=hash2(ox+x,oz+z,this.seed+124),flowers=c.flora==='flowers';if(r>(flowers?.77:.95)){const select=Math.floor(hash2(ox+x,oz+z,this.seed+728)*meadow.length);data[i]=r>(flowers?.80:.983)?ID[meadow[select]]:ID.tallgrass;}
  }this.villages.apply(cx,cz,data,index);return data;
 }
 spawn(){if(this.options.villages){const village=this.villages.nearest(0,0,1);if(village)return{x:village.x+.5,y:village.level+2.1,z:village.z+6.5};}if(this.flat)return{x:.5,y:this.flat.length+1.1,z:.5};for(let r=0;r<96;r+=4)for(let z=-r;z<=r;z+=4)for(let x=-r;x<=r;x+=4){const c=this.column(x,z);if(c.h>SEA+2&&c.h<54&&!c.sandy)return{x:x+.5,y:c.h+2.1,z:z+.5};}return{x:.5,y:this.column(0,0).h+3,z:.5};}
}
