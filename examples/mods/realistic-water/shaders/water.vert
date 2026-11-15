uniform float uTime;
uniform float uWaves;
uniform mat4 uReflectionMatrix;
attribute float aDepth;
varying vec3 vWorld;
varying vec4 vReflection;
varying float vDepth;
#include <fog_pars_vertex>
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  float shore=smoothstep(0.0,2.0,aDepth);
  world.y+=uWaves*shore*(sin(world.x*.57+world.z*.24+uTime*1.3)*.16+cos(world.z*.73-world.x*.17+uTime*1.05)*.09);
  vWorld=world.xyz;vDepth=aDepth;vReflection=uReflectionMatrix*world;
  vec4 mvPosition=viewMatrix*world;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}
