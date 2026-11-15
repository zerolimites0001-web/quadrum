import * as T from '../vendor/three.module.js';
import {hash2} from './noise.js';
import {HEIGHT} from './terrain.js';
import {getBlock} from './blocks.js';
// A cor das gotas vem de um recorte 1×1 de water_still no atlas; não há textura de chuva adicional.
export class Precipitation{
 constructor(scene,textures){this.scene=scene;this.textures=textures;this.count=320;this.positions=new Float32Array(this.count*6);this.colors=new Float32Array(this.count*6);this.seeds=Array.from({length:this.count},(_,i)=>[hash2(i,1,17),hash2(i,2,23),hash2(i,3,41)]);this.tops=new Map();this.previousCenter='';
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(this.positions,3));geometry.setAttribute('color',new T.BufferAttribute(this.colors,3));const color=this.waterPixel();this.rainColor=color;
  this.rain=new T.LineSegments(geometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.76,depthWrite:false,fog:true}));this.rain.frustumCulled=false;scene.add(this.rain);
  const snowGeo=new T.BufferGeometry();this.snowPositions=new Float32Array(180*3);snowGeo.setAttribute('position',new T.BufferAttribute(this.snowPositions,3));const flake=document.createElement('canvas');flake.width=flake.height=32;const f=flake.getContext('2d'),gradient=f.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.36,'rgba(255,255,255,.9)');gradient.addColorStop(.72,'rgba(255,255,255,.28)');gradient.addColorStop(1,'rgba(255,255,255,0)');f.fillStyle=gradient;f.fillRect(0,0,32,32);this.flakeTexture=new T.CanvasTexture(flake);this.flakeTexture.magFilter=T.LinearFilter;this.flakeTexture.minFilter=T.LinearFilter;this.snow=new T.Points(snowGeo,new T.PointsMaterial({map:this.flakeTexture,alphaTest:.015,color:0xf2f6ff,size:.075,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false,fog:true}));this.snow.frustumCulled=false;scene.add(this.snow);this.hide();
 }
 waterPixel(){const block=this.textures.tiles.get('water_still|');const pixel=document.createElement('canvas');pixel.width=pixel.height=1;const ctx=pixel.getContext('2d');if(block)ctx.drawImage(block.tile,7,7,1,1,0,0,1,1);const rgba=ctx.getImageData(0,0,1,1).data;return new T.Color().setRGB(rgba[0]/255,rgba[1]/255,rgba[2]/255,T.SRGBColorSpace).lerp(new T.Color(0xc4d7e7),.60);}

 roof(world,x,z){const key=x+','+z;if(this.tops.has(key))return this.tops.get(key);let y=HEIGHT-1;for(;y>=0;y--){const b=getBlock(world.get(x,y,z));if(b.solid||b.liquid)break;}const top=y+1;this.tops.set(key,top);return top;}
 invalidate(){this.tops.clear();}
 hide(){this.rain.visible=this.snow.visible=false;}
 update(world,player,time,weather,daylight,enabled=true){const rainy=weather==='rain'&&enabled,snowy=weather==='snow'&&enabled;this.rain.visible=rainy;this.snow.visible=snowy;if(!rainy&&!snowy)return;const p=player.position,center=Math.floor(p.x)+','+Math.floor(p.z);if(center!==this.previousCenter){this.previousCenter=center;this.tops.clear();}
  if(rainy){for(let i=0;i<this.count;i++){const [a,b,c]=this.seeds[i],x=Math.floor(p.x/4)*4+(a-.5)*34+Math.sin(time*.6)*.3,z=Math.floor(p.z/4)*4+(b-.5)*34,y=p.y-5+((c*27-time*17)%27+27)%27,roof=this.roof(world,Math.floor(x),Math.floor(z)),visible=y>roof+.04&&y>=p.y-4;const j=i*6;this.positions.set([x,visible?y:-999,z,x+.08,visible?Math.max(roof+.02,y-.95):-999,z+.025],j);const k=.6+.4*daylight;for(let v=0;v<2;v++)this.colors.set([this.rainColor.r*k,this.rainColor.g*k,this.rainColor.b*k],j+v*3);}this.rain.geometry.attributes.position.needsUpdate=true;this.rain.geometry.attributes.color.needsUpdate=true;}
  if(snowy){for(let i=0;i<180;i++){const [a,b,c]=this.seeds[i],x=p.x+(a-.5)*30+Math.sin(time*.7+i)*.7,z=p.z+(b-.5)*30+Math.cos(time*.5+i)*.5,y=p.y-4+((c*24-time*2.1)%24+24)%24;const tooClose=(x-p.x)**2+(y-(p.y+1.62))**2+(z-p.z)**2<2.25;this.snowPositions.set([x,!tooClose&&y>this.roof(world,Math.floor(x),Math.floor(z))?y:-999,z],i*3);}this.snow.geometry.attributes.position.needsUpdate=true;}
 }
 dispose(){for(const object of [this.rain,this.snow]){object.removeFromParent();object.geometry.dispose();object.material.dispose();}this.flakeTexture.dispose();}
}
