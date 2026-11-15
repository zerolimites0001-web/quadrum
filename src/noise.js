export function hashSeed(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function hash2(x,z,seed=0){let h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
export class Perlin {
 constructor(seed){let s=hashSeed(seed)||1;const p=Array.from({length:256},(_,i)=>i);for(let i=255;i>0;i--){s^=s<<13;s^=s>>>17;s^=s<<5;const j=(s>>>0)%(i+1);[p[i],p[j]]=[p[j],p[i]];}this.p=new Uint8Array(512);for(let i=0;i<512;i++)this.p[i]=p[i&255];}
 noise(x,y,z=0){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(t,a,b)=>a+t*(b-a),grad=(h,x,y,z)=>{h&=15;const u=h<8?x:y,v=h<4?y:h===12||h===14?x:z;return((h&1)?-u:u)+((h&2)?-v:v);};const p=this.p,u=fade(x),v=fade(y),w=fade(z),A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z,B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;return lerp(w,lerp(v,lerp(u,grad(p[AA],x,y,z),grad(p[BA],x-1,y,z)),lerp(u,grad(p[AB],x,y-1,z),grad(p[BB],x-1,y-1,z))),lerp(v,lerp(u,grad(p[AA+1],x,y,z-1),grad(p[BA+1],x-1,y,z-1)),lerp(u,grad(p[AB+1],x,y-1,z-1),grad(p[BB+1],x-1,y-1,z-1))));}
 fbm(x,z,octaves=4){let sum=0,amp=1,norm=0;for(let i=0;i<octaves;i++){sum+=this.noise(x,z)*amp;norm+=amp; x=x*2.03+13.7;z=z*2.03+9.2;amp*=.5;}return sum/norm;}
}
