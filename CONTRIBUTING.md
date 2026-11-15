# Contribuindo com o Quadrum

## Ambiente leve

- Python 3 para servir o jogo: `python3 server.py --port 8081`.
- Node.js 24+ para testes: `npm test`.
- Nenhum `npm install`, bundler ou navegador automatizado é obrigatório.

## Antes de enviar uma alteração

1. Abra uma issue ou descreva claramente o objetivo no pull request.
2. Preserve o funcionamento no celular: joystick, câmera e ações simultâneas.
3. Execute `npm test` e adicione uma regressão quando corrigir um bug.
4. Confira o comportamento no navegador real quando alterar WebGL, UI, IndexedDB,
   importação de arquivos ou Service Worker.
5. Não acrescente buscas automáticas de mods no disco nem permissões desnecessárias.
6. Não envie credenciais, saves pessoais, caches ou recursos sem origem conhecida.

## Compatibilidade de saves e mods

- Não reordene os IDs de blocos existentes; acrescente conteúdo ao final.
- Preserve UUIDs/chaves estáveis e o remapeamento de paletas.
- Não transforme automaticamente conteúdo de um mod ausente em ar.
- Overrides e recursos devem ter dono e ser liberados ao desativar o pacote.
- Não remova a água original ao desenhar uma substituição visual.
- Folhas com recorte alpha não podem ocultar a face do bloco vizinho.
- Mudanças incompatíveis na API precisam de versão e documentação apropriadas.

## Reportar um bug

Inclua dispositivo, sistema, navegador/versão, versão do jogo, passos para reproduzir,
resultado esperado/obtido e os mods ativos. Se possível, anexe captura de tela e
mensagem do console. Exporte o mundo antes de testar correções; não compartilhe
dados pessoais no arquivo de exemplo.

## Direitos de recursos

Mantenha os avisos de terceiros e indique a origem/licença de qualquer recurso novo.
Não assuma que as texturas existentes têm a mesma licença do código ou do Three.js.
