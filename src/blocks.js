// IDs estáveis: acrescente blocos ao final; não reordene mundos já salvos.
export const BLOCKS = [{ id:0, name:'Ar', solid:false, transparent:true }];
export const ID = { air:0 };
const add = (key,name,category,texture,color,extra={}) => {
 const b={id:BLOCKS.length,key,name,category,texture,color,solid:true,transparent:false,...extra};
 BLOCKS.push(b); ID[key]=b.id; return b;
};
add('grass','Bloco de grama','Natureza','grass_side_carried','#7caa43',{top:'grass_top',bottom:'dirt',topTint:'#82b94c'});
add('dirt','Terra','Natureza','dirt','#795539');
add('stone','Pedra','Pedras','stone','#828381');
add('bedrock','Rocha matriz','Pedras','bedrock','#434343');
add('sand','Areia','Natureza','sand','#ded29d');
add('water','Água','Natureza','water_still','#3984ce',{solid:false,transparent:true,liquid:true});
add('oak_log','Tronco de carvalho','Madeiras','log_oak','#72512e',{top:'log_oak_top',bottom:'log_oak_top'});
add('oak_leaves','Folhas de carvalho','Natureza','oak_leaves','#579335',{leaves:true});
add('snow','Neve','Natureza','snow','#ebf4f6');
add('gravel','Cascalho','Natureza','gravel','#8a837c');
add('clay','Argila','Natureza','clay','#a2a8b9');
add('ice','Gelo','Natureza','ice','#a0c6ed',{transparent:true});
add('cobble','Pedregulho','Pedras','cobblestone','#777a75');
add('planks','Tábuas de carvalho','Madeiras','planks_oak','#b3945c');
const stones=[['mossy_cobble','Pedregulho musgoso','mossy_cobblestone','#6b815b'],['stone_bricks','Tijolos de pedra','stonebrick','#777b76'],['mossy_stone','Tijolos de pedra musgosos','stonebrick_mossy','#718260'],['cracked_stone','Tijolos de pedra rachados','stonebrick_cracked','#747571'],['granite','Granito','granite','#986c5b'],['polished_granite','Granito polido','granite_smooth','#a87766'],['diorite','Diorito','diorite','#c5c5c0'],['polished_diorite','Diorito polido','diorite_smooth','#d3d3cb'],['andesite','Andesito','andesite','#888e89'],['polished_andesite','Andesito polido','andesite_smooth','#949a96'],['deepslate','Ardósia','deepslate','#4c4d50'],['blackstone','Pedra negra','blackstone','#303037'],['calcite','Calcita','calcite','#d5d3c9'],['basalt','Basalto liso','smooth_basalt','#53545a'],['obsidian','Obsidiana','obsidian','#241a38'],['bricks','Tijolos','bricks','#a45e48'],['netherrack','Netherrack','netherrack','#7c3634'],['soul_sand','Areia das almas','soul_sand','#604a3d'],['end_stone','Pedra do End','end_stone','#d8d6a0'],['mud','Lama','mud','#45413e'],['mud_bricks','Tijolos de lama','mud_bricks','#8a6b53']];
for(const [key,name,tex,color] of stones)add(key,name,'Pedras',tex,color);
add('sandstone','Arenito','Pedras','sandstone','#d6c997',{top:'sandstone_top',bottom:'sandstone_bottom'});
add('red_sand','Areia vermelha','Natureza','red_sand','#b66b37');
add('red_sandstone','Arenito vermelho','Pedras','red_sandstone_normal','#b66b37',{top:'red_sandstone_top',bottom:'red_sandstone_bottom'});
add('packed_ice','Gelo compacto','Natureza','packed_ice','#87afd9');
const woods=[['spruce','Pinheiro','log_spruce','log_spruce_top','planks_spruce','#705033'],['birch','Bétula','log_birch','log_birch_top','planks_birch','#d5c99a'],['jungle','Selva','log_jungle','log_jungle_top','planks_jungle','#aa8058'],['acacia','Acácia','log_acacia','log_acacia_top','planks_acacia','#aa603b'],['dark_oak','Carvalho escuro','log_oak','log_oak_top','planks_big_oak','#493522'],['cherry','Cerejeira','cherry_log_side','cherry_log_top',null,'#e4b5b0'],['mangrove','Mangue','mangrove_log_side','mangrove_log_top',null,'#8a3c3a'],['pale_oak','Carvalho pálido','pale_oak_log_side','pale_oak_log_top',null,'#e3ddc5']];
for(const [key,name,side,top,plank,color] of woods){add(key+'_log','Tronco de '+name,'Madeiras',side,color,{top,bottom:top});add(key+'_planks','Tábuas de '+name,'Madeiras',plank||'generated:planks:'+key,color,{pattern:'planks'});add(key+'_leaves','Folhas de '+name,'Natureza',key==='cherry'?'cherry_leaves_opaque':key==='mangrove'?'mangrove_leaves_opaque':key==='pale_oak'?'pale_oak_leaves_opaque':'oak_leaves',key==='cherry'?'#e8a3bd':'#54834b',{leaves:true,...(!['cherry','mangrove','pale_oak'].includes(key)?{tint:key==='spruce'?'#b5cebf':'#d2e6ac'}:key==='mangrove'?{tint:'#77a54a'}:key==='pale_oak'?{tint:'#a9b58c'}:{})});}
for(const [key,name,c] of [['coal','Carvão','#292a2a'],['iron','Ferro','#c3b3a0'],['gold','Ouro','#f2d444'],['diamond','Diamante','#55dad1'],['redstone','Redstone','#bb2520'],['emerald','Esmeralda','#33c66a'],['lapis','Lápis-lazúli','#3158b6'],['copper','Cobre','#c47b54']]){add(key+'_ore','Minério de '+name,'Minérios',key+'_ore','#858583',{pattern:'ore',accent:c});add(key+'_block','Bloco de '+name,'Minérios',key+'_block',c,{pattern:'metal'});}
add('glass','Vidro','Construção','generated:glass','#d4edef',{transparent:true,glass:true});
add('glowstone','Pedra luminosa','Construção','glowstone','#d9b76d',{emissive:true});
add('quartz','Quartzo','Construção','quartz_block_side','#e1ded4',{top:'quartz_block_top',bottom:'quartz_block_bottom'});
add('prismarine','Prismarinho','Construção','prismarine_bricks','#68a79c');
add('dark_prismarine','Prismarinho escuro','Construção','prismarine_dark','#355c50');
add('sea_lantern','Lanterna do mar','Construção','sea_lantern','#c0e9da',{emissive:true});
add('amethyst','Ametista','Construção','amethyst_block','#956bc1');
add('terracotta','Terracota','Construção','hardened_clay','#a7664c');
add('slime','Bloco de slime','Construção','slime','#7ab958',{transparent:true});
add('honey','Bloco de mel','Construção','honey_block','#dba63c',{transparent:true});
add('bookshelf','Estante','Decoração','bookshelf','#ad8957',{top:'planks_oak',bottom:'planks_oak'});
add('crafting','Bancada de trabalho','Decoração','crafting_table_side','#9a6739',{top:'crafting_table_top',bottom:'planks_oak'});
add('furnace','Fornalha','Decoração','furnace_side','#777777',{front:'furnace_front_off',top:'furnace_top',bottom:'furnace_top'});
add('tnt','TNT decorativa','Decoração','tnt_side','#c94732',{top:'tnt_top',bottom:'tnt_bottom'});
add('pumpkin','Abóbora','Natureza','pumpkin_side','#bd7926',{top:'pumpkin_top',bottom:'pumpkin_top'});
add('melon','Melancia','Natureza','melon_side','#6c9b30',{top:'melon_top',bottom:'melon_top'});
const colors=[['white','Branca','#e5e5df'],['orange','Laranja','#df7c24'],['magenta','Magenta','#b64ca2'],['light_blue','Azul-clara','#5aaed2'],['yellow','Amarela','#e5c02c'],['lime','Verde-limão','#7ebc2c'],['pink','Rosa','#df91ad'],['gray','Cinza','#494c4d'],['light_gray','Cinza-clara','#a0a39d'],['cyan','Ciano','#268995'],['purple','Roxa','#7b3ca8'],['blue','Azul','#374caa'],['brown','Marrom','#79512f'],['green','Verde','#536c27'],['red','Vermelha','#a7322b'],['black','Preta','#242629']];
for(const [key,name,color] of colors){
 add('wool_'+key,'Lã '+name,'Coloridos','generated:wool:'+key,color,{pattern:'wool'});
 add('concrete_'+key,'Concreto '+name,'Coloridos','generated:concrete:'+key,color);
 add('terracotta_'+key,'Terracota '+name,'Coloridos','generated:terracotta:'+key,color,{pattern:'clay'});
 add('glass_'+key,'Vidro '+name,'Coloridos','generated:glass:'+key,color,{transparent:true,glass:true});
}
const flowers=[['dandelion','Dente-de-leão','flower_dandelion'],['rose','Papoula','flower_rose'],['cornflower','Centáurea','flower_cornflower'],['allium','Álio','flower_allium'],['daisy','Margarida','flower_oxeye_daisy'],['orchid','Orquídea-azul','flower_blue_orchid'],['lily','Lírio do vale','flower_lily_of_the_valley'],['tulip_red','Tulipa vermelha','flower_tulip_red'],['tulip_orange','Tulipa laranja','flower_tulip_orange'],['tulip_white','Tulipa branca','flower_tulip_white'],['tulip_pink','Tulipa rosa','flower_tulip_pink'],['torchflower','Flor-tocha','torchflower'],['tallgrass','Grama alta','tallgrass']];
for(const [key,name,tex] of flowers)add(key,name,'Plantas',tex,'#689d3c',{solid:false,plant:true,...(key==='tallgrass'?{tint:'#88b349'}:{})});
// Variantes cúbicas adicionais, mantidas ao final para preservar os IDs de save.
for(const [key,name,texture,color] of [
 ['smooth_stone','Pedra lisa','stone','#aaa9a6'],['chiseled_stone','Pedra talhada','stonebrick_carved','#777a78'],['polished_deepslate','Ardósia polida','polished_deepslate','#505054'],['deepslate_bricks','Tijolos de ardósia','deepslate_bricks','#47474b'],['deepslate_tiles','Ladrilhos de ardósia','deepslate_tiles','#3c3c40'],['nether_bricks','Tijolos do Nether','nether_brick','#41262d'],['red_nether_bricks','Tijolos vermelhos do Nether','red_nether_brick','#6b2529'],['magma','Bloco de magma','magma','#bf6524'],['crying_obsidian','Obsidiana chorona','crying_obsidian','#4d286b'],['purpur','Púrpura','purpur_block','#a879a5'],['end_bricks','Tijolos do End','end_bricks','#d5d6a5'],['bone','Bloco de osso','bone_block_side','#d6d2bb'],['dried_kelp','Algas secas','dried_kelp_side','#3c4d24'],['hay','Fardo de feno','hay_block_side','#ba9a2e'],['target','Alvo decorativo','target_side','#d3bda8'],['sponge','Esponja','sponge','#c5c24f'],['wet_sponge','Esponja molhada','sponge_wet','#a4a335'],['soul_soil','Terra das almas','soul_soil','#4f3b32'],['rooted_dirt','Terra enraizada','dirt_with_roots','#976d4f'],['coarse_dirt','Terra infértil','coarse_dirt','#7a583d'],['podzol','Podzol','dirt_podzol_top','#705134'],['mycelium','Micélio','mycelium_top','#89758a'],['moss','Bloco de musgo','moss_block','#657d36']
])add(key,name,'Construção',texture,color);
for(const [key,name,color] of colors)add('powder_'+key,'Cimento '+name,'Coloridos','generated:powder:'+key,color,{pattern:'wool'});
for(const [key,name,,top,,color] of woods)add('stripped_'+key,'Tronco descascado de '+name,'Madeiras','generated:stripped:'+key,color,{top,bottom:top,pattern:'planks'});
add('stripped_oak','Tronco descascado de carvalho','Madeiras','generated:stripped:oak','#b2925b',{top:'log_oak_top',bottom:'log_oak_top',pattern:'planks'});
add('azalea_leaves','Folhas de azaleia','Natureza','azalea_leaves_opaque','#6c923a',{leaves:true});
export const CATEGORIES=['Todos',...new Set(BLOCKS.slice(1).map(b=>b.category))];
export const DEFAULT_HOTBAR=['grass','stone','planks','oak_log','glass','water','bricks','glowstone','rose'].map(k=>ID[k]);
export const getBlock = id => BLOCKS[id] || BLOCKS[0];

// Registro público: identidades de conteúdo persistem por chave, não pela ordem de mods.
export const BUILTIN_COUNT=BLOCKS.length;
export const ITEMS=new Map();
const validName=s=>typeof s==='string'&&/^[a-z0-9_.-]{1,100}$/i.test(s);
export function contentKey(namespace,key){if(!validName(namespace)||!validName(key))throw new Error('Namespace e chave devem conter letras, números, ponto, _ ou - (até 100 caracteres).');return namespace.toLowerCase()+':'+key.toLowerCase();}
export function registerBlock(namespace,key,definition={}){
 const qualified=contentKey(namespace,key);let block=BLOCKS.find(b=>b.key===qualified);
 if(block&&!block.missing)throw new Error('Bloco já registrado: '+qualified);
 if(!block&&BLOCKS.length>=65535)throw new Error('Limite de 65535 blocos atingido.');
 const id=block?.id??BLOCKS.length;
 const def={name:key,category:'Mods',texture:'generated:'+qualified,color:'#c16ee3',solid:true,transparent:false,...definition,id,key:qualified,namespace,missing:false};
 if(typeof def.name!=='string'||typeof def.texture!=='string')throw new Error('Bloco precisa de nome e textura válidos.');
 if(block){for(const k of Object.keys(block))delete block[k];Object.assign(block,def);}else{block=def;BLOCKS.push(block);}
 ID[qualified]=id;if(!CATEGORIES.includes(block.category))CATEGORIES.push(block.category);return id;
}
export function registerItem(namespace,key,definition={}){
 const qualified=contentKey(namespace,key),id='item:'+qualified;
 if(ITEMS.has(id)&&!ITEMS.get(id).missing)throw new Error('Item já registrado: '+id);
 const item={name:key,category:'Itens',texture:'generated:'+qualified,color:'#eacb6c',...definition,id,key:qualified,namespace,item:true,solid:false,transparent:false,missing:false};
 if(typeof item.name!=='string'||typeof item.texture!=='string')throw new Error('Item precisa de nome e textura válidos.');
 ITEMS.set(id,item);if(!CATEGORIES.includes(item.category))CATEGORIES.push(item.category);return id;
}
export const getEntry=id=>typeof id==='string'?(ITEMS.get(id)||{id,name:'Item ausente',item:true,missing:true,texture:'generated:missing',color:'#dc38d0'}):getBlock(id);
export const listEntries=()=>[...BLOCKS.slice(1),...ITEMS.values()].filter(b=>!b.hidden);
export const blockPalette=()=>BLOCKS.map(b=>b.key||'air');
export function restorePalette(palette){
 const map=new Map();if(!Array.isArray(palette))return map;
 const keys=new Map(BLOCKS.map(b=>[b.key||'air',b.id]));
 palette.forEach((key,oldId)=>{if(typeof key!=='string')return;let id=keys.get(key);
  if(id===undefined){const parts=key.split(':');if(parts.length!==2||!validName(parts[0])||!validName(parts[1]))return;
   id=registerBlock(parts[0],parts[1],{name:'Bloco ausente · '+key,color:'#db39c8',hidden:true});BLOCKS[id].missing=true;keys.set(key,id);
  }map.set(oldId,id);
 });return map;
}
