// Exemplo externo completo. Não fornece kill(): o engine injeta kill.js e rastreia
// os recursos; a API registra a limpeza do target, do material e do override.
export default function activate(api){
 const T=api.THREE,{CHUNK,HEIGHT,index}=api.constants,water=api.blocks.id('water');
 const panel=api.ui.root.querySelector('.water-mod-controls'),options=panel.querySelector('.water-options');
 let group=null,material=null,target=null,virtualCamera=null,reflectionPlaneY=29.88,lastReflection=-Infinity,reflect=true,loading=null;
 const patches=new Map();
 panel.querySelector('.water-expand').onclick=()=>{options.hidden=!options.hidden;};
 panel.querySelector('.water-waves').oninput=e=>{if(material)material.uniforms.uWaves.value=Number(e.target.value);};
 panel.querySelector('.water-reflection').onchange=e=>{reflect=e.target.checked;if(material)material.uniforms.uHasReflection.value=0;};
 panel.querySelector('.water-quality').onchange=e=>{if(target){const size=Number(e.target.value);target.setSize(size,size);lastReflection=-Infinity;}};
 function remove(key){const mesh=patches.get(key);if(mesh){mesh.removeFromParent();mesh.geometry.dispose();patches.delete(key);}}
 function clear(){for(const key of [...patches.keys()])remove(key);}
 function patch(chunk){if(!material||!group||!api.world)return;remove(chunk.key);const positions=[],depths=[],indices=[],levels=new Map();const data=chunk.data;
  for(let z=0;z<CHUNK;z++)for(let x=0;x<CHUNK;x++)for(let y=1;y<HEIGHT;y++){
   if(data[index(x,y,z)]!==water||(y+1<HEIGHT&&data[index(x,y+1,z)]===water))continue;
   levels.set(y,(levels.get(y)||0)+1);let bottom=y-1;while(bottom>0&&data[index(x,bottom,z)]===water)bottom--;const depth=y-bottom;
   const divisions=2;
   for(let dz=0;dz<divisions;dz++)for(let dx=0;dx<divisions;dx++){
    const start=positions.length/3,x0=x+dx/divisions,z0=z+dz/divisions,s=1/divisions;
    positions.push(x0,y+.88,z0+s,x0+s,y+.88,z0+s,x0+s,y+.88,z0,x0,y+.88,z0);
    depths.push(depth,depth,depth,depth);indices.push(start,start+1,start+2,start,start+2,start+3);
   }
  }
  if(!positions.length)return;const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('aDepth',new T.Float32BufferAttribute(depths,1));geometry.setIndex(indices);geometry.computeBoundingSphere();if(geometry.boundingSphere)geometry.boundingSphere.radius+=.5;
  const mesh=new T.Mesh(geometry,material);mesh.position.set(chunk.cx*CHUNK,0,chunk.cz*CHUNK);mesh.userData.waterLevels=levels;mesh.renderOrder=1;group.add(mesh);patches.set(chunk.key,mesh);
 }
 async function setup(){if(material)return;if(loading)return loading;loading=(async()=>{
   target=api.rendering.createRenderTarget(256,256,{depthBuffer:true,stencilBuffer:false});
   target.texture.minFilter=T.LinearFilter;target.texture.magFilter=T.LinearFilter;target.texture.generateMipmaps=false;
   virtualCamera=new T.PerspectiveCamera();group=new T.Group();group.name='realistic-water';api.add(group);
   material=await api.shaders.load({vertex:'shaders/water.vert',fragment:'shaders/water.frag',transparent:true,depthWrite:false,side:T.DoubleSide,fog:true,uniforms:{...T.UniformsUtils.clone(T.UniformsLib.fog),uTime:{value:0},uWaves:{value:.6},uReflection:{value:target.texture},uHasReflection:{value:0},uReflectionMatrix:{value:new T.Matrix4()},uWaterColor:{value:new T.Color(0x135c7c)}}});
   await api.blocks.hide('water');
   if(api.world)for(const chunk of api.world.chunks.values())if(chunk.group)patch(chunk);
  })();return loading;
 }
 api.events.on('engineReady',()=>setup());
 api.events.on('worldEnter',async()=>{panel.classList.add('visible');await setup();clear();for(const chunk of api.world.chunks.values())if(chunk.group)patch(chunk);});
 api.events.on('worldLeave',()=>{panel.classList.remove('visible');clear();});
 api.events.on('pause',()=>panel.classList.remove('visible'));
 api.events.on('resume',()=>{if(api.game.running)panel.classList.add('visible');});
 api.events.on('chunkMesh',({chunk})=>patch(chunk));
 api.events.on('chunkDispose',({chunk})=>remove(chunk.key));
 api.animations.onFrame((dt)=>{if(material)material.uniforms.uTime.value+=dt;});
 const normal=new T.Vector3(0,1,0),direction=new T.Vector3(),up=new T.Vector3(),look=new T.Vector3();
 const bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
 api.events.on('beforeRender',()=>{
  if(!reflect||!group||!material||!patches.size||!api.game.running||api.game.paused)return;
  const levels=new Map();for(const mesh of patches.values())for(const [level,count] of mesh.userData.waterLevels)levels.set(level,(levels.get(level)||0)+count);let best=0;for(const [level,count] of levels)if(count>best){best=count;reflectionPlaneY=level+.88;}
  if(api.camera.position.y<reflectionPlaneY+.05){material.uniforms.uHasReflection.value=0;return;}
  const now=performance.now();if(now-lastReflection<125)return;lastReflection=now;
  const camera=api.camera,renderer=api.renderer;camera.updateMatrixWorld();virtualCamera.copy(camera);virtualCamera.position.copy(camera.position);virtualCamera.position.y=2*reflectionPlaneY-camera.position.y;
  camera.getWorldDirection(direction);direction.reflect(normal);look.copy(virtualCamera.position).add(direction);up.set(0,1,0).applyQuaternion(camera.quaternion).reflect(normal);virtualCamera.up.copy(up);virtualCamera.lookAt(look);virtualCamera.updateMatrixWorld();
  material.uniforms.uReflectionMatrix.value.copy(bias).multiply(virtualCamera.projectionMatrix).multiply(virtualCamera.matrixWorldInverse);
  const previous={target:renderer.getRenderTarget(),clipping:renderer.clippingPlanes,visible:group.visible,xr:renderer.xr.enabled,autoClear:renderer.autoClear};
  try{group.visible=false;renderer.xr.enabled=false;renderer.autoClear=true;renderer.clippingPlanes=[new T.Plane(normal,-reflectionPlaneY+.05)];renderer.setRenderTarget(target);renderer.clear();renderer.render(api.scene,virtualCamera);material.uniforms.uHasReflection.value=1;}
  finally{group.visible=previous.visible;renderer.clippingPlanes=previous.clipping;renderer.xr.enabled=previous.xr;renderer.autoClear=previous.autoClear;renderer.setRenderTarget(previous.target);}
 });
}
