import {getBlock} from './blocks.js';
const CUBE=[[0,0,0,1,1,1]],cache=new Map();
export const boxesFor=id=>getBlock(id).boxes||CUBE;
export const isFullOccluder=id=>{const b=getBlock(id);return !!id&&b.solid&&!b.transparent&&!b.plant&&!b.leaves&&!b.shape;};
export function intersectsBox(p,box,x,y,z,half=.30,height=1.78){return p.x+half>x+box[0]+1e-5&&p.x-half<x+box[3]-1e-5&&p.y+height>y+box[1]+1e-5&&p.y<y+box[4]-1e-5&&p.z+half>z+box[2]+1e-5&&p.z-half<z+box[5]-1e-5;}
// Superfície exata da união de cuboides; não deixa faces internas nas escadas.
export function shapeFaces(id){if(cache.has(id))return cache.get(id);const boxes=boxesFor(id),axes=[0,1,2].map(a=>[...new Set(boxes.flatMap(b=>[b[a],b[a+3]]))].sort((a,b)=>a-b)),inside=(x,y,z)=>boxes.some(b=>x>b[0]-1e-8&&x<b[3]+1e-8&&y>b[1]-1e-8&&y<b[4]+1e-8&&z>b[2]-1e-8&&z<b[5]+1e-8),faces=[];
 for(let xi=0;xi<axes[0].length-1;xi++)for(let yi=0;yi<axes[1].length-1;yi++)for(let zi=0;zi<axes[2].length-1;zi++){
  const a=[axes[0][xi],axes[1][yi],axes[2][zi]],b=[axes[0][xi+1],axes[1][yi+1],axes[2][zi+1]],mid=a.map((v,i)=>(v+b[i])/2);if(!inside(...mid))continue;
  const [x,y,z]=a,[X,Y,Z]=b,vertices=[[[X,y,Z],[X,y,z],[X,Y,z],[X,Y,Z]],[[x,y,z],[x,y,Z],[x,Y,Z],[x,Y,z]],[[x,Y,Z],[X,Y,Z],[X,Y,z],[x,Y,z]],[[x,y,z],[X,y,z],[X,y,Z],[x,y,Z]],[[x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z]],[[X,y,z],[x,y,z],[x,Y,z],[X,Y,z]]];
  for(let face=0;face<6;face++){const axis=Math.floor(face/2),positive=face%2===0,plane=positive?b[axis]:a[axis],next=[...mid];next[axis]=plane+(positive?1e-6:-1e-6);if(inside(...next))continue;faces.push({face,vertices:vertices[face],boundary:Math.abs(plane-(positive?1:0))<1e-8});}
 }cache.set(id,faces);return faces;
}
export function rayBoxes(origin,direction,x,y,z,id,max=7){const o=[origin.x-x,origin.y-y,origin.z-z],d=[direction.x,direction.y,direction.z];let closest=null;
 for(const box of boxesFor(id)){let near=-Infinity,far=Infinity,normal=[0,0,0],valid=true;for(let a=0;a<3;a++){if(Math.abs(d[a])<1e-12){if(o[a]<box[a]||o[a]>box[a+3]){valid=false;break;}continue;}let t0=(box[a]-o[a])/d[a],t1=(box[a+3]-o[a])/d[a];const sign=d[a]>0?-1:1;if(t0>t1)[t0,t1]=[t1,t0];if(t0>near){near=t0;normal=[0,0,0];normal[a]=sign;}far=Math.min(far,t1);if(near>far){valid=false;break;}}
  const distance=Math.max(0,near);if(valid&&far>=0&&distance<=max&&(!closest||distance<closest.distance))closest={distance,normal:near<0?[0,0,0]:normal,bounds:box};
 }return closest;
}
export const facingFromYaw=yaw=>((Math.round(-yaw/(Math.PI/2))%4)+4)%4;
export function placementId(id,yaw,normal,point){const b=getBlock(id),facing=facingFromYaw(yaw);if(!b.shape)return id;const top=normal[1]===-1||(normal[1]===0&&point&&point.y-Math.floor(point.y)>.5);if(b.shape==='stairs')return b.variants[top?'top':'bottom'][facing];if(b.shape==='slab')return b.variants[top?'top':'bottom'][0];if(b.shape==='door')return b.variants.closed.lower[facing];return id;}
