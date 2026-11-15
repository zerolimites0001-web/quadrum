import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {ModManager} from '../src/mods.js';
import {createModAPI} from '../src/mod-api.js';
import {KillScope} from '../src/kill.js';
import {EventBus} from '../src/events.js';
import {ID,BLOCKS} from '../src/blocks.js';
import {World} from '../src/world.js';
import {index} from '../src/terrain.js';
function setup(){BLOCKS[ID.water].renderHidden=false;const scene=new THREE.Scene(),textures={uv:()=>[0,0,1,1],opaque:new THREE.MeshBasicMaterial(),transparent:new THREE.MeshBasicMaterial(),sync:async()=>{}};const world=new World({seed:'teste'},scene,textures),c=world.ensure(0,0);c.data.fill(0);c.data[index(3,30,3)]=ID.water;world.mesh(c);const game={world,scene,textures,ready:true,ui:{renderHotbar(){},contentChanged(){}}},manager=Object.create(ModManager.prototype);Object.assign(manager,{game,renderOverrides:new Map(),bus:new EventBus(),error:e=>{throw e;}});return{world,c,game,manager,liquid:c.group.children.find(m=>m.userData.originalLiquid)};}
function mod(game,id){const manifest={uuid:id,name:id,baseURL:'http://localhost/importado/'+id+'/',files:{js:[]},assets:{}},record={manifest,cleanups:[],blocks:[],items:[],status:'active'};record.scope=new KillScope(game,manifest);return record;}
test('desligar o shader restaura a MESMA malha da água, sem recarregar mundo',async()=>{const {world,c,game,manager,liquid}=setup();assert.ok(liquid);const geometry=liquid.geometry;const r=mod(game,'water-mod'),api=createModAPI(manager,r);await api.blocks.hide('water');assert.equal(liquid.visible,false);assert.ok(c.group.children.includes(liquid));await manager.cleanup(r);assert.equal(BLOCKS[ID.water].renderHidden,false);assert.equal(liquid.visible,true);assert.equal(liquid.geometry,geometry);assert.equal(world.get(3,30,3),ID.water);});
test('kill restaura override mesmo sem callback de limpeza do mod',async()=>{const {game,manager,liquid}=setup(),r=mod(game,'forgot-cleanup');await createModAPI(manager,r).blocks.hide('water');r.cleanups=[];await manager.cleanup(r);assert.equal(liquid.visible,true);assert.equal(manager.renderOverrides.size,0);});
test('dois mods podem esconder a água sem um liberar o override do outro',async()=>{const {game,manager,liquid}=setup(),a=mod(game,'mod-a'),b=mod(game,'mod-b');await createModAPI(manager,a).blocks.hide('water');await createModAPI(manager,b).blocks.hide('water');await manager.cleanup(a);assert.equal(liquid.visible,false);await manager.cleanup(b);assert.equal(liquid.visible,true);});
test('chunk gerado durante o shader já guarda a água padrão para restauração',async()=>{const {game,manager,world,c}=setup(),r=mod(game,'shader');await createModAPI(manager,r).blocks.hide('water');world.mesh(c);const hidden=c.group.children.find(m=>m.userData.originalLiquid);assert.ok(hidden);assert.equal(hidden.visible,false);await manager.cleanup(r);assert.equal(hidden.visible,true);});
