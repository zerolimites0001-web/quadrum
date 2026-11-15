# Quadrum

**Construa, voe e explore um mundo voxel direto no navegador.**

## Jogar online

**[▶ Abrir Quadrum — quadrum-chi.vercel.app](https://quadrum-chi.vercel.app/)**

Jogue direto no navegador, sem instalar. Os mundos ficam salvos no navegador
desse endereço; use a exportação de mundos para fazer backups ou transferi-los.

[![Testes](https://github.com/zerolimites0001-web/quadrum/actions/workflows/tests.yml/badge.svg)](https://github.com/zerolimites0001-web/quadrum/actions/workflows/tests.yml)
![Versão](https://img.shields.io/badge/vers%C3%A3o-0.2.1-77a75c)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_modules-f7df1e)
![Three.js](https://img.shields.io/badge/Three.js-local-222222)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

Quadrum é um jogo voxel em modo criativo, desenvolvido para **celular e desktop**.
Tem terreno procedural por chunks, construção livre, voo, mundos persistentes e
uma API de mods com acesso ao Three.js e aos sistemas do jogo.

**Sem build, sem dependências npm para jogar e sem downloads de bibliotecas em
runtime.** O Three.js e os recursos necessários estão incluídos no repositório.
Shaders extras são opcionais: o jogo-base não carrega o mod de água sozinho.

> Projeto em desenvolvimento. Não é uma implementação completa do Minecraft,
> nem um produto oficial da Mojang/Microsoft. Muitos blocos são decorativos;
> sobrevivência, mobs, máquinas, redstone funcional e multiplayer ainda não existem.

## Navegação

- [Jogar online](https://quadrum-chi.vercel.app/)
- [Executar](#executar)
- [Recursos](#recursos)
- [Controles](#controles)
- [Mundos e backups](#mundos-e-backups)
- [Mods](#mods)
- [Estrutura](#estrutura)
- [Testes e contribuição](#testes-e-contribuição)
- [API de mods](MODDING.md)
- [Histórico de alterações](CHANGELOG.md)
- [Créditos e recursos de terceiros](THIRD_PARTY_NOTICES.md)

## Executar

Requisitos para jogar: **Python 3** para servir os arquivos e navegador com
**WebGL 2**. Mods importados usam IndexedDB e Service Worker em localhost/HTTPS.

```sh
git clone https://github.com/zerolimites0001-web/quadrum.git
cd quadrum
python3 server.py --port 8081
```

Abra **http://127.0.0.1:8081** no mesmo aparelho.

No Termux/Android, execute os mesmos comandos em uma pasta onde você tenha acesso.
Se o projeto já estiver em `/sdcard/Quadrum`, basta entrar nessa pasta e executar
o servidor. Não é preciso instalar Chromium, bundlers ou ferramentas pesadas.

Com Node disponível, `npm start` inicia o mesmo servidor. **Não é necessário
`npm install`.** Para apenas jogar, Node também não é necessário.

### Outros servidores e hospedagem

O jogo é estático e pode ser servido por outro servidor HTTP ou hospedagem HTTPS.
Mantenha os arquivos e subpastas juntos, incluindo `mod-worker.js` e `vendor/`.
Não abra `index.html` por `file://`: módulos e a importação de mods precisam de HTTP.
Um link público do repositório, por si só, não hospeda o jogo.

O servidor fornecido serve somente a pasta do projeto, por padrão em loopback.
**Não monta pastas externas nem procura mods no armazenamento interno.**

## Recursos

- **Modo criativo:** quebrar, colocar, selecionar blocos e voar.
- **221 blocos e plantas**, com inventário pesquisável e categorias.
- **16 biomas**, incluindo florestas, taiga, selva, savana, deserto, manguezal,
  cerejeiras, bosque pálido, tundra, montanhas, praias e oceano.
- **Nove variantes de árvores**, com troncos e folhas da espécie correspondente.
- **Terreno Perlin contínuo em X/Z**, carregado e descartado por chunks;
  altura atual limitada a 96 blocos.
- **Joystick multitouch**, câmera por arraste e botões de ação para celular.
- **Mundos em IndexedDB:** nome, semente, posição, hotbar e alterações de blocos.
- **Exportação/importação de mundos** em JSON.
- Ajustes de distância de visão, sensibilidade, FOV, som e coordenadas/FPS.
- **Mods por importação manual:** ZIP, pasta ou JavaScript único.
- **API v1:** blocos, itens, sistemas, eventos, UI, texturas, sons, animações,
  efeitos, shaders, render targets e acesso à câmera/canvas/cena/Three.js.
- Desligamento rastreado por `kill.js`, com preservação de blocos nos saves.

## Controles

### Celular

| Ação | Controle |
| --- | --- |
| Mover | Joystick esquerdo |
| Olhar | Arrastar no mundo |
| Quebrar / colocar | Botões próprios à direita |
| Pular | PULAR |
| Alternar voo | VOAR / ANDAR ou duplo toque em pular |
| Subir / descer voando | ▲ / ▼ |
| Inventário | ▦ |
| Pausar | Ⅱ |
| Escolher bloco | Tocar na hotbar ou selecionar no inventário |

É possível mover, olhar e usar os botões com dedos diferentes simultaneamente.

### Desktop

| Ação | Controle |
| --- | --- |
| Mover | WASD |
| Olhar | Mouse; clique no canvas para capturar |
| Quebrar / colocar | Clique esquerdo / direito |
| Copiar bloco apontado | Botão do meio |
| Selecionar slot | 1–9 ou roda do mouse |
| Inventário | E |
| Pular / subir voando | Espaço |
| Alternar voo | F ou duplo espaço |
| Descer voando | Shift |
| Acelerar | Ctrl |
| Pausar | Esc |

## Mundos e backups

Crie um mundo com nome e semente opcional e toque em **JOGAR**. Use **Salvar e
sair** para voltar ao menu. O jogo também salva automaticamente durante a sessão.

| Dados | Armazenamento |
| --- | --- |
| Mundos e edições | IndexedDB `quadrum-worlds` |
| Arquivos de mods importados | IndexedDB `quadrum-imported-mods` |
| Preferências e estado dos mods | localStorage |

**Os saves ficam no navegador, não no GitHub nem em uma conta online.** Use sempre
o mesmo endereço, porta e perfil do navegador. Trocar de origem, limpar dados do
site ou usar navegação privada pode tornar os dados indisponíveis.

Exporte backups no menu de mundos, principalmente antes de limpar dados do
navegador ou testar mods. Dados pessoais e saves não fazem parte deste repositório.

## Mods

### Instalar manualmente

1. Abra **Mods** no menu inicial ou na pausa.
2. Escolha **Importar ZIP**, **Importar pasta** ou **JS / arquivos**.
3. Selecione explicitamente o pacote no seletor do navegador.
4. Confira a origem e confirme **Ativar**.
5. Para desligar, volte à lista e toque em **Desativar**.

**Não existe varredura automática de pastas, importação por caminho/URL ou acesso
genérico ao armazenamento do aparelho.** O loader recebe apenas os arquivos
escolhidos e mantém uma cópia no IndexedDB. O Service Worker fornece esses Blobs
em uma rota virtual para preservar imports relativos, CSS e recursos em subpastas.
Pacotes já importados e habilitados podem ser reativados dessa cópia ao abrir o jogo.

No celular, ZIP costuma ser a opção mais prática. Se a seleção de pasta ou a
descompactação nativa não estiver disponível no seu navegador, veja as alternativas
no [guia de mods](MODDING.md).

### Exemplos incluídos

| Exemplo | O que demonstra |
| --- | --- |
| [realistic-water.zip](examples/mods/realistic-water.zip) | Pacote pronto para importar: ondas, Fresnel e reflexo planar da cena |
| [Fontes da água](examples/mods/realistic-water/) | Manifesto, JS, CSS, HTML e shaders em subpastas |
| [exemplo-bloco.js](examples/mods/exemplo-bloco.js) | Um único JS que registra bloco, item, partículas e som |

Baixe o arquivo desejado e importe pelo menu do jogo. Os exemplos **não são
ativados automaticamente**, mesmo estando no repositório.

A água realista usa reflexo planar de 256px, limitado a aproximadamente 8 FPS,
com opções de 128/256/512px e reflexo desligável. Reflete a altura dominante da
água; não é ray tracing nem simulação física de fluido.

A água original fica em uma camada própria: **desativar o shader restaura sua
visibilidade imediatamente**, sem recriar o mundo ou apagar blocos.

### Criar um pacote

```text
meu-mod/
├── pack.json
├── src/main.js
├── ui/menu.css
├── ui/menu.html
└── textures/bloco.png
```

```json
{
  "uuid": "4d370100-99de-4505-862b-356ce196ebee",
  "name": "Meu mod",
  "description": "Meu primeiro pacote para Quadrum",
  "version": "1.0.0",
  "apiVersion": 1,
  "files": {"js": ["src/main.js"]}
}
```

```js
export default async function activate(api) {
  await api.blocks.register('cristal', {
    name: 'Cristal',
    color: '#6de5ed',
    category: 'Meu mod'
  });
  api.events.on('worldEnter', () => api.toast('Meu mod está ativo!'));
}
```

**[Leia o guia completo da API → MODDING.md](MODDING.md)**

### Segurança e desligamento

Mods são código confiável, **não uma sandbox**: podem acessar a página e os dados
dessa origem. Só ative código que você conheça e faça backup dos mundos.

O engine cria automaticamente um escopo `kill.js` para rastrear recursos e limpar
UI, eventos, timers, objetos, materiais, shaders e overrides ao desligar o pacote.
Blocos salvos de mods ausentes são preservados como placeholders, não apagados.

Nenhum mecanismo na mesma thread consegue interromper um `while(true)` ou desfazer
qualquer alteração arbitrária em JavaScript. Recursos fora do rastreamento precisam
de limpeza explícita. As garantias e limitações estão detalhadas no guia.

## Estrutura

```text
index.html             Interface e ponto de entrada
src/                   Engine, terreno, física, controles, UI, saves e API de mods
mod-worker.js          Ponte HTTP virtual dos Blobs importados
server.py              Servidor estático local, sem montagem de diretórios externos
vendor/                Three.js local e sua licença
assets/textures/       Texturas e manifesto
examples/mods/         Exemplos de mods, fontes e ZIP pronto
examples_ui/           Imagens de referência fornecidas durante o desenvolvimento
tests/                 Testes de lógica e regressão com Node
.github/workflows/     Verificação automática no GitHub Actions
```

`assets/shaders/` fica reservada para uso futuro e não é carregada pelo jogo-base.
Shaders do exemplo de água pertencem ao próprio pacote.

## Testes e contribuição

Para desenvolvimento/testes, use **Node.js 24+**:

```sh
npm test
```

A suíte atual tem **35 testes** de geração, física, árvores, biomas, malhas,
importação manual/ZIP, eventos, kill, paletas de save e regressões de água e folhas.
Não instala navegador nem depende de frameworks de teste externos.

A CI executa os testes no Node 24 e verifica a sintaxe JS/Python. A validação visual
WebGL, o seletor de arquivos e o Service Worker precisam ser conferidos em um
navegador real; os testes de lógica não substituem essa verificação.

Para relatar bugs e propor alterações, veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

O código original, a documentação e os exemplos de mods do Quadrum são
licenciados sob a **[MIT License](LICENSE)**. Você pode usar, modificar e
redistribuir esse software, inclusive comercialmente, preservando os avisos
exigidos pela licença. O software é fornecido sem garantias.

**Recursos de terceiros não são relicenciados por essa autorização.** Texturas
Minecraft/Bedrock Samples, imagens de referência e bibliotecas mantêm seus
próprios direitos e termos, descritos abaixo e nos avisos de terceiros.

## Créditos e direitos

- Three.js está incluído com sua licença MIT em
  [`vendor/THREE-LICENSE.txt`](vendor/THREE-LICENSE.txt).
- Texturas do Minecraft/Bedrock Samples pertencem aos respectivos titulares;
  não são arte original do Quadrum e não são automaticamente cobertas pela licença
  do Three.js.
- Imagens em `examples_ui/` são referências de desenvolvimento, não capturas que
  comprovem o estado atual do jogo.

Consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) e os termos dos recursos
antes de redistribuir. A MIT do código do Quadrum não altera os direitos de
terceiros nem autoriza automaticamente o uso de todos os recursos gráficos.
