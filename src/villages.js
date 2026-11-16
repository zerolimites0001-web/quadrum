import {hashSeed,hash2} from './noise.js';
import {ID} from './blocks.js';
import {WORLD_HEIGHT} from './world-options.js';
export const VILLAGE_CELL=192,VILLAGE_RADIUS=33;
const forbidden=new Set(['Oceano','Praia','Montanhas','Manguezal']);
export class VillageGenerator{
 constructor(seed,options,baseColumn){this.seed=hashSeed(seed+':villages-v2');this.options=options;this.baseColumn=baseColumn;this.cache=new Map();}
 cell(gx,gz){if(!this.options.villages)return null;const key=gx+','+gz;if(this.cache.has(key))return this.cache.get(key);let plan=null;
  for(let attempt=0;attempt<8;attempt++){const x=gx*VILLAGE_CELL+56+Math.floor(hash2(gx*19+attempt,gz,this.seed)*72),z=gz*VILLAGE_CELL+56+Math.floor(hash2(gx,gz*23+attempt,this.seed+7)*72),center=this.baseColumn(x,z);if(forbidden.has(center.biome))continue;const heights=[];let valid=true;for(const dz of [-24,0,24])for(const dx of [-24,0,24]){const c=this.baseColumn(x+dx,z+dz);if(forbidden.has(c.biome)||this.options.type!=='flat'&&c.h<31||c.h>WORLD_HEIGHT-16)valid=false;heights.push(c.h);}if(!valid||Math.max(...heights)-Math.min(...heights)>8)continue;heights.sort((a,b)=>a-b);const level=heights[4],style=center.biome==='Deserto'||center.biome==='Terras áridas'?'desert':center.biome==='Taiga'||center.biome==='Tundra'?'spruce':center.biome==='Savana'?'acacia':'oak';plan={id:key,x,z,level,style,radius:VILLAGE_RADIUS,name:'Vila '+gx+','+gz};break;
  }this.cache.set(key,plan);return plan;
 }
 at(x,z){const plan=this.cell(Math.floor(x/VILLAGE_CELL),Math.floor(z/VILLAGE_CELL));return plan&&Math.hypot(x-plan.x,z-plan.z)<=VILLAGE_RADIUS?plan:null;}
 surface(x,z,base){const plan=this.at(x,z);if(!plan)return base;const d=Math.hypot(x-plan.x,z-plan.z),t=Math.max(0,Math.min(1,(d-25)/8)),blend=t*t*(3-2*t),h=Math.round(plan.level*(1-blend)+base.h*blend);return{...base,h,village:plan.id,tree:d<29?null:base.tree,density:d<29?0:base.density};}
 nearest(x,z,radius=3){const gx=Math.floor(x/VILLAGE_CELL),gz=Math.floor(z/VILLAGE_CELL);let best=null,bestDistance=Infinity;for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){const plan=this.cell(gx+dx,gz+dz);if(plan){const d=Math.hypot(plan.x-x,plan.z-z);if(d<bestDistance){bestDistance=d;best=plan;}}}return best;}
 apply(cx,cz,data,index){const plan=this.cell(Math.floor(cx*16/VILLAGE_CELL),Math.floor(cz*16/VILLAGE_CELL));if(!plan||Math.abs(cx*16+8-plan.x)>42||Math.abs(cz*16+8-plan.z)>42)return;const ox=cx*16,oz=cz*16,h=plan.level;
  const put=(x,y,z,id)=>{x-=ox;z-=oz;if(x>=0&&x<16&&z>=0&&z<16&&y>=0&&y<WORLD_HEIGHT)data[index(x,y,z)]=id;};
  const fill=(x0,x1,y0,y1,z0,z1,id)=>{for(let z=Math.max(z0,oz);z<=Math.min(z1,oz+15);z++)for(let x=Math.max(x0,ox);x<=Math.min(x1,ox+15);x++)for(let y=y0;y<=y1;y++)put(x,y,z,id);};
  const path=(x0,x1,z0,z1)=>{fill(x0,x1,h-2,h-1,z0,z1,ID.dirt);fill(x0,x1,h,h,z0,z1,ID.gravel);fill(x0,x1,h+1,h+3,z0,z1,0);};
  path(plan.x-25,plan.x+25,plan.z-1,plan.z+1);path(plan.x-1,plan.x+1,plan.z-25,plan.z+25);for(const dz of [-11,11]){path(plan.x-13,plan.x-1,plan.z+dz-1,plan.z+dz+1);path(plan.x+1,plan.x+12,plan.z+dz-1,plan.z+dz+1);}
  const species=plan.style==='desert'?'oak':plan.style,planks=species==='oak'?ID.planks:ID[species+'_planks'],logs=ID[species+'_log'],wall=plan.style==='desert'?ID.sandstone:planks,roof=plan.style==='desert'?'sandstone':species;
  const house=(x,z,doorFace)=>{fill(x-1,x+7,h-2,h-1,z-1,z+9,ID.cobble);fill(x,x+6,h,h+1,z,z+8,ID.cobble);fill(x,x+6,h+2,h+9,z,z+8,0);
   for(let yy=h+2;yy<=h+4;yy++)for(let zz=0;zz<9;zz++)for(let xx=0;xx<7;xx++)if(xx===0||xx===6||zz===0||zz===8){const corner=(xx===0||xx===6)&&(zz===0||zz===8),window=yy===h+3&&((xx===0||xx===6)&&[2,6].includes(zz)||(zz===0||zz===8)&&[2,4].includes(xx));put(x+xx,yy,z+zz,corner?logs:window?ID.glass:wall);}
   for(let xx=-1;xx<=7;xx++){const height=h+5+Math.min(4,4-Math.abs(xx-3)),facing=xx<3?1:3,id=xx===3?ID['lab:slab_'+roof+'_bottom']:ID[`lab:stairs_${roof}_bottom_${facing}`];fill(x+xx,x+xx,height,height,z-1,z+9,id||planks);}
   const door=doorFace==='east'?[x+6,z+4,3]:doorFace==='west'?[x,z+4,1]:doorFace==='north'?[x+3,z,2]:[x+3,z+8,0],doorKey=species==='oak'?'oak':species;put(door[0],h+2,door[1],ID[`lab:door_${doorKey}_closed_lower_${door[2]}`]);put(door[0],h+3,door[1],ID[`lab:door_${doorKey}_closed_upper_${door[2]}`]);put(x+1,h+2,z+1,ID.crafting);put(x+5,h+2,z+1,ID.furnace);put(x+1,h+3,z+1,ID.bookshelf);put(x+5,h+4,z+7,ID.glowstone);
  };
  house(plan.x-20,plan.z-15,'east');house(plan.x-20,plan.z+7,'east');house(plan.x+13,plan.z-15,'west');house(plan.x+13,plan.z+7,'west');house(plan.x-3,plan.z-23,'south');house(plan.x-3,plan.z+15,'north');
  // Poço central: fonte e cobertura, sem entidades ou lógica de comércio.
  fill(plan.x-2,plan.x+2,h,h+1,plan.z-2,plan.z+2,ID.cobble);fill(plan.x-1,plan.x+1,h,h+1,plan.z-1,plan.z+1,ID.water);for(const dx of [-2,2])for(const dz of [-2,2])fill(plan.x+dx,plan.x+dx,h+2,h+4,plan.z+dz,plan.z+dz,logs);fill(plan.x-2,plan.x+2,h+5,h+5,plan.z-2,plan.z+2,planks);
  // Pequena horta decorativa e iluminação dos caminhos.
  fill(plan.x+5,plan.x+10,h,h,plan.z-4,plan.z+4,ID.dirt);fill(plan.x+7,plan.x+7,h,h,plan.z-4,plan.z+4,ID.water);for(let z=plan.z-4;z<=plan.z+4;z++)for(const dx of [5,6,8,9,10])put(plan.x+dx,h+1,z,(z+dx)%4===0?ID.melon:ID.tallgrass);
  for(const [dx,dz] of [[-4,-5],[4,5],[-4,18],[4,-18]]){put(plan.x+dx,h+1,plan.z+dz,logs);put(plan.x+dx,h+2,plan.z+dz,logs);put(plan.x+dx,h+3,plan.z+dz,ID.glowstone);}
 }
}
