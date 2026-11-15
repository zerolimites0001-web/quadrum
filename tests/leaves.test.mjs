import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {World} from '../src/world.js';
import {BLOCKS,ID} from '../src/blocks.js';
import {index} from '../src/terrain.js';
const textures={uv:()=>[0,0,1,1],opaque:new THREE.MeshBasicMaterial(),transparent:new THREE.MeshBasicMaterial()};
function setup(){const w=new World({seed:'folhas'},new THREE.Scene(),textures),c=w.ensure(0,0);c.data.fill(0);return{w,c};}
function faceCount(c,axis,plane,normal){let n=0;for(const mesh of c.group.children){const p=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal');for(let i=0;i<p.count;i+=4)if([0,1,2,3].every(k=>Math.abs(p.array[(i+k)*3+axis]-plane)<1e-5&&Math.abs(normals.array[(i+k)*3+axis]-normal)<1e-5))n++;}return n;}
test('chão mantém a face superior sob todas as espécies de folhas',()=>{const {w,c}=setup();for(const leaf of BLOCKS.filter(b=>b.leaves)){c.data.fill(0);c.data[index(4,79,4)]=ID.stone;c.data[index(4,80,4)]=leaf.id;w.mesh(c);assert.equal(faceCount(c,1,80,1),1,leaf.name);}w.dispose();});
test('bloco mantém face lateral junto de folha, inclusive entre chunks',()=>{const {w,c}=setup(),neighbor=w.ensure(1,0);neighbor.data.fill(0);c.data[index(15,79,4)]=ID.dirt;neighbor.data[index(0,79,4)]=ID.oak_leaves;w.mesh(c);assert.equal(faceCount(c,0,16,1),1);w.dispose();});
test('entre dois blocos opacos a face interna continua descartada',()=>{const {w,c}=setup();c.data[index(4,79,4)]=ID.stone;c.data[index(4,80,4)]=ID.dirt;w.mesh(c);assert.equal(faceCount(c,1,80,1),0);w.dispose();});
test('folhas adjacentes da mesma espécie não geram faces internas redundantes',()=>{const {w,c}=setup();c.data[index(4,79,4)]=ID.oak_leaves;c.data[index(4,80,4)]=ID.oak_leaves;w.mesh(c);assert.equal(faceCount(c,1,80,1),0);assert.equal(faceCount(c,1,80,-1),0);w.dispose();});
