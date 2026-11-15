import * as T from '../vendor/three.module.js';
import {hash2} from './noise.js';
// Ruído periódico pré-calculado: evita sin()*43758 e artefatos de precisão em GPU móvel.
export function cloudNoiseData(size=128){const data=new Uint8Array(size*size*4),smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
 const noise=(u,v,n,seed)=>{const x=u*n,z=v*n,ix=Math.floor(x),iz=Math.floor(z),fx=smooth(x-ix),fz=smooth(z-iz),sample=(a,b)=>hash2(((a%n)+n)%n,((b%n)+n)%n,seed);return mix(mix(sample(ix,iz),sample(ix+1,iz),fx),mix(sample(ix,iz+1),sample(ix+1,iz+1),fx),fz);};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,value=Math.round(255*(noise(u,v,8,714)*.65+noise(u,v,16,938)*.25+noise(u,v,32,183)*.1)),i=(x+y*size)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}return data;
}
export const SKY_VERTEX=`varying vec2 vScreen;void main(){vScreen=position.xy;gl_Position=vec4(position.xy,1.0,1.0);}`;
export const SKY_FRAGMENT=`
varying vec2 vScreen;
uniform mat4 uInvProjection;
uniform mat3 uViewRotation;
uniform sampler2D uNoise;
uniform vec3 uTop,uHorizon;
uniform float uCloud,uTime,uDay;
void main(){
 vec4 view=uInvProjection*vec4(vScreen,1.0,1.0);
 vec3 d=normalize(uViewRotation*view.xyz);
 float height=pow(max(d.y,0.0),.48);
 vec3 color=mix(uHorizon,uTop,height);
 vec2 plane=d.xz/max(.13,d.y)*.14+vec2(uTime*.0008,uTime*.0003);
 float field=texture2D(uNoise,plane).r*.76+texture2D(uNoise,plane*1.91+vec2(.37,.19)).r*.24;
 float cover=smoothstep(.66-uCloud*.22,.84-uCloud*.20,field);
 // Horizonte fica contínuo, sem colunas ou costuras de uma esfera triangulada.
 cover*=smoothstep(.055,.26,d.y);
 vec3 cloudColor=mix(vec3(.025,.032,.048),vec3(.66,.70,.75),uDay);
 color=mix(color,cloudColor,cover*(.58+uCloud*.34));
 gl_FragColor=vec4(color,1.0);
 #include <colorspace_fragment>
}`;
export function createSky(uniforms){const noise=new T.DataTexture(cloudNoiseData(),128,128,T.RGBAFormat,T.UnsignedByteType);noise.wrapS=noise.wrapT=T.RepeatWrapping;noise.magFilter=T.LinearFilter;noise.minFilter=T.LinearMipmapLinearFilter;noise.generateMipmaps=true;noise.needsUpdate=true;
 Object.assign(uniforms,{uNoise:{value:noise},uInvProjection:{value:new T.Matrix4()},uViewRotation:{value:new T.Matrix3()}});
 const material=new T.ShaderMaterial({uniforms,vertexShader:SKY_VERTEX,fragmentShader:SKY_FRAGMENT,depthWrite:false,depthTest:false,toneMapped:false,precision:'highp'}),mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);mesh.name='Quadrum fullscreen sky';mesh.renderOrder=-1000;mesh.frustumCulled=false;
 mesh.onBeforeRender=(_renderer,_scene,camera)=>{uniforms.uInvProjection.value.copy(camera.projectionMatrixInverse);uniforms.uViewRotation.value.setFromMatrix4(camera.matrixWorld);material.uniformsNeedUpdate=true;};return mesh;
}
