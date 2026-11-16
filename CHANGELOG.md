# Histórico

## 0.3.5

- API central de painéis de mods (`api.ui.panel`) preserva câmera, joystick e multitouch no celular.
- Coordenação de múltiplos painéis no desktop, sem devolver controles antes do último fechar.
- Limpeza automática na pausa, saída do mundo e desativação do mod.
- Documentação para migrar menus que manipulam controles diretamente.
- Correção aprovada pelo usuário no LAB com mod mínimo; testes permanecem locais.

## 0.3.4

- Partículas com a textura do bloco ao colocar/quebrar, incluindo portas e lajes.
- Minimapa com orientação do jogador, atualização por chunks e botão liga/desliga.
- Vilas procedurais com casas, caminhos, poço e horta em mundos novos.
- Geração anterior preservada para saves legados.
- Lab aprovado no navegador pelo usuário; testes mantidos apenas localmente.

## 0.3.3

- Mão voxel em primeira pessoa, com animações distintas de quebra, colocação e uso.
- Prévia do bloco/item da hotbar e movimento suave ao andar/trocar de slot.
- Preferências para mão, bloco segurado e balanço, persistidas no navegador.
- Cena separada do mundo e dos reflexos; animação limpa ao pausar/sair.
- Prévia atualizada quando o conteúdo de um mod desaparece ou muda de aparência.
- Versão aprovada no LAB; verificações mantidas e executadas apenas localmente.

## 0.3.2

- Exportação e importação do HUD em JSON, preservando precisão dos valores e
  configurações de retrato/paisagem no mesmo arquivo.
- Importação como prévia, com Salvar/Cancelar e validação estrita de formato/tamanho.
- Arquivo inválido não substitui o rascunho nem o layout salvo.
- Proteção contra importações assíncronas antigas sobrescreverem uma nova sessão/escolha.
- Verificações mantidas e executadas apenas localmente, sem arquivos de teste no envio.

## 0.3.1

- Editor de HUD na pausa e nos ajustes, com 15 elementos movíveis/redimensionáveis.
- Posições proporcionais, limites de tela e perfis separados por orientação.
- Salvar, cancelar e restaurar padrão por item ou orientação; persistência local.
- Mira redimensionável sem alterar seu centro ou a pontaria.
- Joystick ajustado para coordenadas locais e limite do cursor ao usar escala.
- Testes executados somente no aparelho e não incluídos na publicação.

## 0.3.0

- Promovida a versão local aprovada pelo usuário, sem copiar dados pessoais do navegador.
- Escadas/lajes em 17 materiais e portas de nove madeiras, com texturas oficiais,
  orientação, formas parciais, colisão e raycast precisos.
- Portas de duas metades, abertura/fechamento, apoio e proteção contra fechar no jogador.
- Dia de 600s, noite de 490s, amanhecer/crepúsculo, sol com halo e lua oficial com fases.
- Chuva/neve/neblina, gotas amostradas de 1×1 pixel da água e cobertura por tetos.
- Poças visuais com reflexo planar: espera de 300s após a chuva e secagem gradual de 180s.
- Céu em clip-space e nuvens com ruído filtrado para corrigir faixas/triângulos no celular.
- Flocos menores com textura suave e chuva mais clara.
- Testes retirados do versionamento e mantidos somente no aparelho, conforme solicitado;
  removida a CI que dependia deles. 77 verificações de lógica passaram localmente.

## 0.2.2

- Ativação/desativação de mods persistida por pacote no IndexedDB, com migração
  da preferência antiga em localStorage.
- Pacotes novos e reimportados continuam desativados por padrão, mesmo que o
  manifesto declare enabled ou haja um cache antigo com o mesmo UUID.
- Falhas temporárias ao restaurar não apagam a ativação desejada; a interface
  mostra o erro e mantém a preferência para a próxima abertura.
- A lista de mods indica o estado salvo; não exige um botão Salvar separado.
- Interromper uma ativação pendente encerra seu escopo antes de salvar desativado.
- Dez testes adicionais de persistência/reativação: 45 testes de lógica no total.

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
