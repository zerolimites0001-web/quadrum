# Quadrum Mod API v1

## Importação explícita

O jogo **não procura nem lê pastas do aparelho**. O usuário seleciona um ZIP,
uma pasta ou arquivos pelo seletor do navegador. Nada é executado até **Ativar**.
A cópia importada fica no IndexedDB, não vinculada ao arquivo original.

Pacotes recém-importados (inclusive atualizações) ficam desativados por padrão.
Ativar/desativar grava uma preferência por UUID nos metadados do IndexedDB.
Ao reabrir o site, o engine restaura essa escolha; um erro temporário de ativação
não a apaga. Dados antigos baseados apenas em localStorage são migrados sem
reimportar os arquivos. A origem/perfil do navegador continua delimitando o save.
Para atualizar um pacote, importe a nova versão com o mesmo UUID.

Exemplos completos estão em [examples/mods/](examples/mods/):
[água realista (ZIP)](examples/mods/realistic-water.zip),
[fontes da água](examples/mods/realistic-water/) e
[JavaScript único](examples/mods/exemplo-bloco.js). Nenhum é carregado automaticamente.

ZIP: store/deflate, até 2048 arquivos e 64 MB descompactados, 16 MB por arquivo.
ZIP com senha, ZIP64 e multipartes não são suportados. Se o navegador não possuir
`DecompressionStream('deflate-raw')`, use importação de pasta/arquivos.
No Android, ZIP é a opção mais prática para preservar subpastas.

Estrutura:

```text
meu-mod/
  pack.json
  src/main.js
  src/helpers.js
  ui/menu.css
  ui/menu.html
  textures/bloco.png
  shaders/efeito.vert
  shaders/efeito.frag
  sounds/clique.ogg
```

```json
{
  "uuid": "4d370100-99de-4505-862b-356ce196ebee",
  "name": "Meu pacote",
  "description": "O que este pacote faz",
  "version": "1.0.0",
  "apiVersion": 1,
  "files": {
    "js": ["src/main.js"],
    "css": ["ui/menu.css"],
    "html": ["ui/menu.html"]
  },
  "assets": {"icone": "textures/bloco.png"},
  "dependencies": []
}
```

Aliases: `UUID`/`UIID`, `NOME`, `DESCRICAO`/`DESCRICAL`; `js`/`scripts`/`entry`,
`css`/`styles`, `html`/`ui`. `files` também pode ser uma lista de caminhos.
UUID e chaves aceitam letras, números, ponto, hífen e `_` (até 100 caracteres).
UUID é normalizado para minúsculas. Dependências são UUIDs de pacotes já importados;
nada é baixado automaticamente. A API suporta a versão 1, sem resolução de faixas
semânticas de dependência.

Também é possível importar um **único `.js`**, sem manifesto. Seu namespace é
calculado a partir do nome do arquivo; para conteúdo persistente use pack.json
com UUID estável e nunca renomeie as chaves de blocos já usadas nos saves.

## Entrada e ciclo de vida

```js
import { algumaFuncao } from './helpers.js';

export default async function activate(api) {
  const bloco = await api.blocks.register('meu_bloco', {
    name: 'Meu bloco', texture: 'textures/bloco.png', category: 'Meu pacote'
  });
  api.events.on('worldEnter', () => api.toast('Pacote ativo!'));
  // Opcional, para alterações arbitrárias que o rastreador não consegue desfazer:
  return () => console.log('limpeza específica');
}
```

Pode exportar `activate(api)` e `deactivate(api)` em vez de default. Cada JS do
manifesto é um módulo; arquivos auxiliares devem ser importados pelos módulos de
entrada, não repetidos em `files.js`. Um script sem exports pode capturar
`const api = window.Quadrum.current` no topo; módulos com default são recomendados.
Não dependa de consultar `Quadrum.current` depois de um await.

`api.camera`, `scene`, `renderer`, `world`, `player` são getters vivos e podem ser
nulos antes de entrar em um mundo. `canvas`, `game`, `controls`, `THREE`,
`manifest`, `namespace` também são expostos. Não importe outra cópia do Three.js.

`await api.ready()` inicializa o renderizador e as texturas, se necessário;
não abre um mundo. Para comportamento do mundo use `worldEnter`.

Eventos `engineReady` e `worldEnter` são reproduzidos ao assinar quando essa
etapa já está disponível. `{replay:false}` evita isso.

## Eventos e sistemas

```js
const off = api.events.on('tick', ({dt, time}) => {});
api.systems.register('vento', {update(dt, api) {}, dispose(api) {}});
api.events.once('worldEnter', ({world, player}) => {});
api.events.on('beforeBreak', event => {
  if (event.y < 5) event.preventDefault();
});
```

Eventos: `engineReady`, `worldEnter`, `worldLeave`, `pause`, `resume`, `tick`,
`beforeRender`, `afterRender`, `slotChange`, `beforeBreak`, `beforePlace`,
`blockBreak`, `blockPlace`, `blockChange`, `beforeItemUse`, `itemUse`,
`chunkGenerate`, `chunkMesh`, `chunkDispose`, `modLoaded`, `modUnloaded`.

`tick`/sistemas/animações param durante pausa; timers normais não.
`beforeBreak`, `beforePlace` e `beforeItemUse` são canceláveis, de forma síncrona.
Modificar o objeto do evento não reposiciona automaticamente uma ação padrão.
Erros são isolados e um callback que falha três vezes é ignorado.

`chunkGenerate` recebe `{world,cx,cz,data,set}`. Use `set(x,y,z,id)` com X/Z locais
0–15 e Y 1–95. As edições salvas do usuário são aplicadas **depois** desse evento.
Geração de mod deve ser determinística. O hook não persiste o terreno gerado:
se o mod for desativado, a geração original volta em chunks reconstruídos.

## Blocos e itens

```js
const id = await api.blocks.register('cristal', {
  name:'Cristal', category:'Meu pacote', color:'#6de5ed',
  texture:'textures/cristal.png',
  // ou textures:{side:'...',top:'...',bottom:'...',front:'...'}
  solid:true, transparent:false,
  onPlace(event, api) {}, onBreak(event, api) {}
});
api.items.equip(id);
const wand = await api.items.register('varinha', {
  name:'Varinha', color:'#efd55b', cooldown:.3,
  onUse({kind,target,world,player}, api) { /* kind: break/place */ }
});
```

Blocos de mods continuam cúbicos por padrão; `plant:true, solid:false` usa planos cruzados e `liquid:true`
usa o tratamento de líquido. Transparência precisa de `transparent:true` e alpha
na textura. Bancadas, TNT e outros blocos do jogo-base são decorativos nesta etapa.
Formas/colliders personalizados não são uma API de blocos pronta: objetos extras
podem ser criados diretamente na cena, mas não ganham colisão nem save automático.

`api.blocks.get('stone')`, `.id('stone')`, `.list()`;
chaves de mods são `uuid:chave`. Itens têm IDs textuais `item:uuid:chave`.
O inventário recebe as categorias de conteúdo registrado automaticamente.

`world.getBlock(x,y,z)` retorna ID; `world.setBlock(x,y,z,idOuChave)` persiste uma
edição. Coordenadas devem ser inteiras. Y é 0–95; a base em Y=0 não é editável.
`get` não gera chunks ausentes: use `world.ensure(cx,cz)` se precisar.
`world.chunks` é um Map; cada chunk contém `data`, `cx`, `cz`, `key`, `group`.
`api.constants` expõe `CHUNK`, `HEIGHT`, `SEA`, `index`.

Saves guardam uma paleta de chaves. Mudar a ordem dos mods não troca blocos.
Desativar/remover um pacote transforma seus blocos em placeholders preservados,
não em ar. Reimportar o mesmo UUID/chave recupera esses blocos.

### Substituição visual segura da água

```js
const restore = await api.blocks.hide('water');
// desenhe sua própria superfície
// restore() é opcional: desativar o pacote SEMPRE libera seus overrides.
```

A água original permanece numa camada de geometria própria, invisível mas pronta.
Liberar o override restaura essa camada imediatamente, inclusive em chunks que
foram gerados com o mod ativo. Não muda IDs, física ou dados salvos. Dois mods
podem manter overrides: o original só volta quando o último liberar.
Outros blocos não líquidos usam remesh ao mudar visibilidade.

## Texturas e recursos

```js
api.url('textures/a.png'); // URL virtual do Blob importado, NÃO caminho no disco
api.assets.icone;          // manifest.assets resolvido
const alias = api.textures.register('animada', meuCanvas);
const id = await api.blocks.register('animado',{texture:alias});
api.textures.update('animada', meuCanvas); // mesma UV, sem remesh
const textura = await api.textures.load('textures/efeito.png'); // THREE.Texture
const json = await api.resources.json('dados/config.json');
const texto = await api.resources.text('shaders/efeito.vert');
```

Atlas de blocos: pixels 16×16, primeira moldura de imagens verticais, limite de
784 texturas/tints distintos simultâneos. Texturas de blocos são reamostradas;
para efeitos de alta resolução use `textures.load()` em um material próprio.
Slots sem uso são liberados ao desativar, e aliases do pacote são removidos.
Subpastas e imports JS relativos funcionam pela ponte do Service Worker.
Recursos não importados retornam 404, sem buscar o disco como fallback.

## Cena, efeitos, animação e shaders

```js
const T=api.THREE;
api.events.on('engineReady',()=>{
  const mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial({color:0xffbb44}));
  api.add(mesh); // remoção e dispose rastreados
});
api.effects.register('brilho',(options,api)=>{/* factory */});
api.effects.play('brilho',{});
api.effects.spawn({object:mesh,duration:2,update:({object,dt,elapsed})=>{}});
const {mixer,action,stop}=api.animations.play(root,animationClip);
api.animations.onFrame((dt,api)=>{});
const target=api.rendering.createRenderTarget(256,256,{depthBuffer:true});
const mat=await api.shaders.load({vertex:'shaders/a.vert',fragment:'shaders/a.frag',uniforms:{}});
// ou api.shaders.create({vertexShader,fragmentShader,uniforms,...})
```

Shaders não são aplicados automaticamente: associe o material ao seu objeto.
Ao fazer passes em `beforeRender`, use `renderer.render`, não `game.render`
(para evitar recursão). Preserve/restaure target, clipping, visibilidade e estado
do renderer num `try/finally`. Recursos raw externos devem usar `api.onDispose`.

O exemplo de água faz ondas por vértice, normais de ondulação, Fresnel, brilho e
reflexo planar real em render target de 256px/8 FPS. Reflete a altura dominante
da água, não várias alturas ao mesmo tempo. Ondas são visuais, sem deslocar a
física; não é SSR, ray tracing nem simulação de fluido. O painel permite reduzir
para 128px ou desligar reflexos em aparelhos mais lentos.

## Interface, sons, entrada e dados

```js
const node=await api.ui.mount('ui/painel.html');
await api.ui.style('ui/painel.css');
api.ui.button('Ação',()=>{}, {parent:node});
api.input.on('keydown',event=>{}); // removido ao desligar
api.input.keys; api.input.actions; api.input.joystick;
api.timers.interval(()=>{},1000); // retorna função para cancelar
api.timers.timeout(()=>{},500);
api.sounds.register('click','sounds/click.ogg',{volume:.5});
api.sounds.play('click');
api.sounds.tone({frequency:440,duration:.1,volume:.05});
api.storage.set('global',{valor:1}); // localStorage isolado por namespace
api.worldData.set('valor',1);       // salvo no metadata do mundo em IndexedDB
await api.save();
```

HTML montado não executa tags script: declare JS no manifesto. Imagens/links no
HTML são resolvidos a partir do arquivo; URLs em CSS seguem a semântica normal
da folha. Use `[data-interactive]` na área do painel que deve receber toque, pois
a camada raiz não pode bloquear todo o joystick/canvas por padrão.
Dados devem ser serializáveis em JSON; alterações arbitrárias em objetos Three,
closures ou variáveis JS não são persistidas automaticamente.

## kill.js automático: garantias e limites

Cada ativação recebe um `KillScope` do engine, mesmo sem `kill()` no mod.
A API rastreia assinaturas, sistemas, timers, UI/CSS, sons, objetos, materiais,
texturas, render targets, efeitos, animações, registros e overrides. Há também
hooks para timers/RAF, EventTarget, inserções DOM, Object3D.add, fetch, observers
e áudio usados diretamente pelo código. Callbacks rastreados propagam o escopo.
Ativações pendentes podem ser interrompidas; fetches rastreados são abortados.

Recursos compartilhados do engine são protegidos; a textura atlas não é destruída
para desligar um pacote. Blocos persistidos conservam chave/ID via placeholder.
A API é o caminho mais confiável para possuir e liberar recursos.

**Não é sandbox nem isolamento de segurança.** Mods têm acesso à página inteira,
aos dados dessa origem e à rede disponível para JS. A importação não concede
permissão genérica ao armazenamento interno: o loader só recebe os arquivos
selecionados. Mas não ative código não confiável.

Não se pode interromper `while(true)` na mesma thread, descarregar completamente
a cache de módulos ES ou desfazer qualquer mutação arbitrária. `Promise`s raw
com efeitos depois do kill, workers próprios, alterações diretas em objetos do
jogo, `window.onresize=...`, referências nativas guardadas e recursos WebGL raw
não necessariamente são reversíveis pelos hooks. Para esses casos registre uma
limpeza com `api.onDispose(fn)`. Alterar renderer/câmera exige restaurar o estado.
Não prometa a usuários que desligar código malicioso recupera uma página travada.


## Céu e peças de construção a partir de 0.3.0

O jogo possui um controlador próprio de céu/clima, com relógio e secagem de poças
salvos em `world.meta.environment`. Mods que substituem sol, luzes ou reflexos
podem disputar esses recursos; evite ativar dois controladores gráficos ao mesmo tempo.

As escadas/lajes/portas integradas usam estados com chaves no namespace `lab:`
para preservar a compatibilidade com os saves aprovados no laboratório. Esse nome
interno não significa que o recurso esteja desativado. As variantes ficam ocultas
no inventário, que mostra apenas as peças-base. O raycast devolve `point` e `bounds`
para a forma atingida; não presuma mais que todo bloco sólido ocupa o cubo inteiro.
