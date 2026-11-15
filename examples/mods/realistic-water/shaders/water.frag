uniform float uTime;
uniform float uWaves;
uniform sampler2D uReflection;
uniform float uHasReflection;
uniform vec3 uWaterColor;
varying vec3 vWorld;
varying vec4 vReflection;
varying float vDepth;
#include <fog_pars_fragment>
void main(){
  float a=vWorld.x*.57+vWorld.z*.24+uTime*1.3;
  float b=vWorld.z*.73-vWorld.x*.17+uTime*1.05;
  float ripple=sin(vWorld.x*3.9+uTime*2.1)*cos(vWorld.z*3.4-uTime*1.6);
  float dx=uWaves*(cos(a)*.0912+sin(b)*.0153+ripple*.085);
  float dz=uWaves*(cos(a)*.0384-sin(b)*.0657+ripple*.065);
  vec3 N=normalize(vec3(-dx,1.0,-dz));
  vec3 V=normalize(cameraPosition-vWorld);
  if(V.y<0.0)N=-N;
  float fresnel=.045+.86*pow(1.0-max(dot(N,V),0.0),4.0);
  vec2 ruv=vReflection.xy/max(.0001,vReflection.w)+N.xz*.018;
  float valid=step(0.0,ruv.x)*step(ruv.x,1.0)*step(0.0,ruv.y)*step(ruv.y,1.0)*step(0.0,vReflection.w)*uHasReflection;
  vec3 reflected=texture2D(uReflection,clamp(ruv,.002,.998)).rgb;
  vec3 sky=mix(vec3(.18,.42,.53),vec3(.56,.77,.88),clamp(N.y*.6+.25,0.0,1.0));
  reflected=mix(sky,reflected,valid);
  vec3 shallow=vec3(.09,.38,.38),deep=uWaterColor;
  vec3 color=mix(shallow,deep,clamp(vDepth/8.0,0.0,1.0));
  color=mix(color,reflected,fresnel);
  vec3 L=normalize(vec3(.45,.8,.3));
  float spec=pow(max(dot(reflect(-L,N),V),0.0),130.0);
  color+=vec3(1.0,.92,.72)*spec*.85;
  float foam=(1.0-smoothstep(.2,1.2,vDepth))*.15*(.5+.5*sin(uTime*1.8+vWorld.x*4.0+vWorld.z*3.0));
  color=mix(color,vec3(.73,.87,.84),foam);
  gl_FragColor=vec4(color,mix(.64,.9,clamp(fresnel+vDepth*.025,0.0,1.0)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
