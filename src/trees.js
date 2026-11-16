import {hash2} from './noise.js';
// Alcance horizontal máximo, incluindo ramos e folhas. Usado nas bordas de chunks.
export const TREE_REACH=7,MAX_TREE_SPACING=8;
export function treeSpacing(type,x,z,seed){const base=['cherry','acacia','pale_oak','jungle','mangrove'].includes(type)?6:5;return base+Math.floor(hash2(x,z,seed+619)*3);}
export const MODERN_TREE_SPECS={oak:{height:4,variation:3},birch:{height:5,variation:3},spruce:{height:7,variation:4},acacia:{height:5,variation:3},jungle:{height:8,variation:4},cherry:{height:6,variation:3},mangrove:{height:7,variation:3},pale_oak:{height:7,variation:3},azalea:{height:4,variation:2}};
// Silhuetas inspiradas nas espécies/referências, não o algoritmo proprietário do Minecraft.
export function modernTreeBlocks(tree,put,seed){
 const {x,z,y,type,height:h,trunk,leaves}=tree,wood=new Map(),foliage=new Map();
 const random=s=>hash2(x+s*31,z-s*17,seed+479),turn=Math.floor(random(1)*4),basis=[[1,0],[0,1],[-1,0],[0,-1]][turn],[dx,dz]=basis,px=-dz,pz=dx;
 const key=(a,b,c)=>a+','+b+','+c;
 const log=(a,b,c)=>wood.set(key(a,b,c),[a,b,c]);
 const leaf=(a,b,c)=>foliage.set(key(a,b,c),[a,b,c]);
 const stem=(a,c,b0,b1,width=1)=>{for(let b=b0;b<=b1;b++)for(let i=0;i<width;i++)for(let j=0;j<width;j++)log(a+i,b,c+j);};
 const branch=(a,b,c,A,B,C)=>{const n=Math.max(Math.abs(A-a),Math.abs(B-b),Math.abs(C-c));let last=[a,b,c];log(...last);for(let i=1;i<=n;i++){const t=i/n,next=[Math.round(a+(A-a)*t),Math.round(b+(B-b)*t),Math.round(c+(C-c)*t)];for(const axis of [1,0,2]){last[axis]=next[axis];log(...last);}}};
 // Copas em patamares largos; recorte só dos cantos, nunca um cone genérico.
 const layer=(a,b,c,r,salt=0)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const edge=Math.abs(i)+Math.abs(j);if(edge>r*1.75)continue;if(Math.abs(i)===r&&Math.abs(j)===r&&hash2(x+a+i*11+salt,z+c+j*13,seed)>.25)continue;leaf(a+i,b,c+j);}};
 const crown=(a,b,c,r=2)=>{layer(a,b-1,c,r,1);layer(a,b,c,r,2);layer(a,b+1,c,Math.max(1,r-1),3);};
 if(type==='oak'){
  // Referência escolhida: tree new, com base cheia e contorno irregular.
  stem(0,0,1,h);branch(0,h-2,0,dx,h, dz);crown(0,h,0,2);layer(dx,h-2,dz,2,8);layer(0,h+2,0,1,9);
 }else if(type==='birch'){
  stem(0,0,1,h);layer(0,h-2,0,2,1);layer(0,h-1,0,2,2);layer(0,h,0,1,3);layer(0,h+1,0,1,4);
 }else if(type==='spruce'){
  stem(0,0,1,h);for(let b=3;b<=h;b++){const fromTop=h-b,rad=Math.min(3,1+Math.floor(fromTop/3)),r=fromTop%3===1?Math.max(1,rad-1):rad;layer(0,b,0,r,b);}leaf(0,h+1,0);leaf(0,h+2,0);
 }else if(type==='acacia'){
  stem(0,0,1,h-2);branch(0,h-2,0,dx*2,h,dz*2);branch(0,h-3,0,-dx*2,h-1,-dz*2);
  layer(dx*2,h,dz*2,3,1);layer(dx*2,h+1,dz*2,2,2);layer(-dx*2,h-1,-dz*2,2,3);layer(-dx*2,h,-dz*2,1,4);
 }else if(type==='cherry'){
  // Bifurcação em Y e duas copas horizontais, como tree rosa1/rosa2.
  stem(0,0,1,h-2);const higher=random(3)>.5?1:0;
  for(const side of [-1,1]){const a=dx*side*3,c=dz*side*3,b=h+(side===1?higher:0);branch(0,h-2,0,a,b-1,c);log(a,b,c);crown(a,b,c,3);}
  branch(0,h-2,0,px*2,h-1,pz*2);layer(px,h-1,pz,2,7);
  // Pétalas de folhas salientes na borda inferior, não blocos suspensos isolados.
  for(const side of [-1,1]){const a=dx*side*3+px*2,c=dz*side*3+pz*2;leaf(a,h-2,c);}
 }else if(type==='jungle'){
  const giant=random(5)>.73,H=giant?h+7:h,width=giant?2:1;
  stem(0,0,1,H,width);crown(0,H,0,giant?4:3);
  for(let side=-1;side<=1;side+=2){const a=side*dx*3,c=side*dz*3,b=H-3+(side===1?1:0);branch(0,b-2,0,a,b,c);crown(a,b,c,2);}
 }else if(type==='mangrove'){
  // Raízes escoradas visíveis, tronco elevado e copa assimétrica.
  stem(0,0,3,h);for(const [a,c] of [[2,0],[-2,0],[0,2],[0,-2]]){branch(a,1,c,0,4,0);log(a,2,c);}
  branch(0,h-2,0,dx*2,h,dz*2);crown(0,h,0,3);crown(dx*2,h,dz*2,2);
  for(const side of [-1,1]){leaf(px*side*2,h-2,pz*side*2);leaf(px*side*2,h-3,pz*side*2);}
 }else if(type==='pale_oak'){
  // Tronco robusto, galhos altos e copa larga/achatada.
  stem(0,0,1,h,2);for(const side of [-1,1]){branch(0,h-2,0,side*dx*3,h,side*dz*3);crown(side*dx*3,h,side*dz*3,3);}layer(0,h+1,0,3,7);
 }else if(type==='azalea'){
  stem(0,0,1,2);branch(0,2,0,dx,h-1,dz);crown(dx,h,dz,2);layer(0,h-1,0,2,4);
 }else{
  stem(0,0,1,h);crown(0,h,0,2);
 }
 // Sempre madeira antes de folhas: impede que a própria copa engula um ramo.
 for(const [a,b,c] of wood.values())put(x+a,y+b,z+c,trunk);
 for(const [a,b,c] of foliage.values())if(!wood.has(key(a,b,c)))put(x+a,y+b,z+c,leaves,true);
}
