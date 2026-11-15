# Exemplos para importar manualmente

- `realistic-water.zip`: pacote pronto com ondas, Fresnel e reflexo planar da cena.
- `realistic-water/`: código-fonte do pacote, incluindo UI e shaders em subpastas.
- `exemplo-bloco.js`: arquivo único com bloco, varinha, partículas e tom sintetizado.

No jogo: **Mods → Importar ZIP** (ou pasta / JS), selecione e confirme **Ativar**.
Nenhum exemplo é procurado ou ativado automaticamente.

O pacote de água não modifica IDs de água nem fornece um kill próprio: usa a API
para possuir os recursos e ocultar temporariamente a camada original. Desativar
restaura a água padrão. Reflexos podem ser reduzidos ou desligados no painel do mod.

A API e suas limitações estão em [`../../MODDING.md`](../../MODDING.md).
