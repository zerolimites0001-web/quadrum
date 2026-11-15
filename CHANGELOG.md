# Histórico

## 0.2.1

### Correções

- Água original mantida em uma camada própria: desligar um shader restaura a mesma
  malha imediatamente, inclusive em chunks gerados com o mod ativo.
- Overrides de renderização têm dono e não são liberados enquanto outro mod os usa.
- Folhas não ocultam mais as faces do chão ou dos blocos vizinhos pelos recortes
  alpha; faces redundantes entre folhas da mesma espécie continuam descartadas.
- Testes portáveis: o exemplo ZIP é lido do próprio repositório.

### Distribuição e documentação

- Exemplos de mods incluídos com fontes e ZIP para importação manual.
- README, guia da API, contribuição, avisos de terceiros e CI de testes.
- 35 testes de lógica e regressão, sem dependências externas de teste.

## 0.2.0

- API de mods v1, manifesto pack.json e JavaScript de arquivo único.
- Importação exclusivamente manual de ZIP, pasta ou arquivos, com cópia em IndexedDB.
- Service Worker para servir recursos importados em rotas virtuais.
- Registros de blocos/itens, eventos, sistemas, UI, efeitos, áudio, shaders e animações.
- Escopo kill.js para rastreamento e limpeza de recursos; não é sandbox de segurança.
- Paleta de blocos por chave para preservar saves ao mudar a ordem dos mods.
- 16 biomas, nove tipos de árvore e seleção de troncos por espécie/bioma.

## 0.1.0

- Base criativa voxel com terreno Perlin por chunks.
- Construção, quebra, voo, colisão e inventário.
- Controles de desktop e joystick multitouch.
- Mundos em IndexedDB, autosave e backups JSON.
