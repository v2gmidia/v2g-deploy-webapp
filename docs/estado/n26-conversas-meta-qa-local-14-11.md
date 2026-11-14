# Conversas por mensagem e cobertura — pacote local somente QA

Data: 14/11/2026. Estado final: implementação e provas locais concluídas, sem commit,
push, merge, publicação ou escrita no banco/Meta. A conferência publicada na QA ainda não ocorreu.

## 0. Próxima ação e pastas certas

Victor faz o commit e publica as branches abaixo pelo GitHub Desktop. Integrar somente
nos destinos QA existentes; não integrar em main. Ambas estão sem upstream para evitar
envio acidental a uma branch diferente. Conferir o destino no Desktop antes de publicar.

| Projeto | Pasta com o pacote final | Branch | Base verificada |
|---|---|---|---|
| WebApp | `C:/Users/victo/v2g-deploy/webapp-qa-conversas` | `codex/qa-conversas-meta` | `origin/QA`, `d7b7739` |
| Backend | `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-conversas-integrada` | `codex/qa-conversas-meta-integrada` | `origin/codex/qa-inicio-serie-diaria`, `18d503b` |

Commit sugerido: **Integra conversas Meta e esclarece cobertura**.

A pasta intermediária `backend_v2g-qa-conversas` ficou limpa e NÃO contém o pacote final.
A implementação foi transportada para a base QA para não remover onboarding nem importar
as demais diferenças entre main e QA. A pasta antiga `backend_v2g-qa-inicio`, com alterações
de outro trabalho, foi preservada. Produção não foi modificada neste bloco.

Após os commits/pushes, a Central deve conferir os hashes e os destinos antes de qualquer
publicação. Ordem sugerida do próximo bloco: backend QA → WebApp QA → leitura autenticada
da Piligrin/Dúú. Esse bloco NÃO fez nova publicação. Nenhuma migração é necessária.

## 1. Comportamento implementado

- Backend: `src/meta/leitura_anuncios.py:19` define a ação exata
  `onsite_conversion.messaging_conversation_started_7d`.
  O leitor de `actions` em `:22` acrescenta `conversas_mensagem` e sua definição ao contrato
  existente (`:77`), sem novos GETs ou mudança de configuração de atribuição.
- Contagem decimal exata em string, até 15 dígitos inteiros e 6 casas decimais; não usa float.
  Ausência em qualquer linha diária observada, repetição da mesma ação, formato inválido
  ou excesso mantém null. Zero somente quando confirmado explicitamente pela fonte.
- A contagem pode reunir canais de mensagem. Não confirma WhatsApp exclusivo, pessoas únicas,
  vendas ou mensagens lidas na caixa de entrada. `conversas_whatsapp` continua null.
- WebApp: `lib/anuncios/contrato-meta.ts:100` exige a definição conhecida para usar o campo novo.
  Backend anterior continua aceito e mostra “Não medido”. Não reutiliza a contagem legada de WhatsApp.
- `lib/inicio/resumo-meta.ts:6` soma somente campanhas, sem acrescentar conjuntos/anúncios.
  Campanha observada com contagem desconhecida torna o agregado desconhecido; nove campanhas
  sem registros não tornam automaticamente incompleta uma leitura válida da campanha observada.
- `lib/inicio/resumo-meta.ts:34` explica a cobertura: **“1 campanha com dados no período;
  9 sem registros neste período.”** A frase sobre leitura incompleta só aparece quando há
  incompletude efetiva nas campanhas com dados. A ausência de registros não comprova gasto zero.
- Card **“Conversas por mensagem (Meta)”** em Início, detalhe do anunciante e Anúncios.
  Fontes: `components/agencia/InicioDoCliente.tsx:53`,
  `app/(protected)/inicio/ResumoMetaDoInicio.tsx:114`,
  `app/(protected)/anuncios/AnunciosMeta.tsx:106`.
- Período, moeda, conta e fonte continuam ligados ao mesmo recorte. O gráfico mantém a série
  de investimento; não foi inventada uma série diária de conversas.
- Identidade visual preservada. No resumo do cliente direto, a grade acompanha os quatro
  indicadores, mantendo o comportamento móvel existente.

Referência da definição: [Meta AdsActionStats](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/).
A atribuição segue a fonte, sem forçar novos parâmetros:
[Meta Insights — boas práticas](https://developers.facebook.com/docs/marketing-api/insights/best-practices/v2.9/).

## 2. Provas e limites

Recorte do Dúú observado no Gerenciador na etapa anterior: **01–07/11/2026**,
R$ **281,80**, **26.129** impressões, **466** cliques totais e **105** conversas por mensagem iniciadas.
Somente uma das dez campanhas apresentou impressões nesse período. A reprodução local
conservou esses totais e os sete pontos diários de gasto/impressões/cliques.

**Limite explícito:** o envelope de teste foi reconstruído, com IDs fictícios. Não é uma
captura da resposta `actions` da API. Não foi medida nem inventada a distribuição diária das
105 conversas. Assim, os testes comprovam cálculo, interpretação, apresentação e isolamento,
mas ainda não comprovam que o backend QA publicado receberá esta ação em todas as linhas
do recorte real. Se a fonte não a confirmar, a tela continuará mostrando “Não medido”.

Testes concluídos na candidata FINAL:

| Verificação | Resultado |
|---|---|
| Backend QA: `ruff check src tests` | Passou |
| Backend QA: `mypy src` | Passou, 178 arquivos |
| Backend QA: suíte unitária | **3.085 passaram, 10 pulados**, 8 avisos de depreciação existentes |
| Backend QA: testes de conversas/rota | **80 passaram**, incluindo ponte ASGI → parser TS → resumo → Anúncios/gráfico SSR |
| WebApp: tipos e build final | Passaram |
| WebApp: integração de conversas, Início, Anúncios, agência, marca/período e fronteira cliente | Passaram; sete testes novos de conversas |
| WebApp: etapas restantes de `conferir` | Passaram nas partes locais; etapas de rede de nichos/dia seguinte avisaram que foram puladas |
| WebApp: `conferir:migrations` | **Não medido**: requer credenciais conectadas; não foram copiadas ou lidas |
| Interface local | Desktop e 390 px: 105, zero explícito, ausência “Não medido” e incompletude real conferidos |
| Interface real QA / resposta Meta real deste pacote | **Pendente de publicação QA** |

Um falso negativo antigo do conferidor cadastral em Windows foi corrigido: a busca textual
da chamada aceita LF e CRLF. A exigência de que a guarda ocorra antes de `/cadastro` permanece;
o código de cadastro não foi alterado.

A bancada dev-only tem dados fictícios próprios (diferentes dos totais do Dúú), sem sessão
de cliente ou gravação. Foi usada apenas para conferir o visual e os estados. Servidor e aba
de ensaio foram encerrados. Capturas e logs ficam no diretório local:

`C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/insumos-produto/`

- `2026-11-14-conversas-previa-local-desktop.png`
- `2026-11-14-conversas-previa-local-mobile.jpg`
- `2026-11-14-conversas-backend-qa-integrada-tests.log` — suíte da base QA final.
- `2026-11-14-conversas-webapp-build.log`
- `2026-11-14-conversas-webapp-tests.log` — início da suíte até a exigência de credenciais do banco.
- `2026-11-14-conversas-webapp-restantes.log` — demais etapas locais.

## 3. Prova publicada seguinte — responsável: Central, após envio de Victor

1. Confirmar branches/hashes e destino QA dos dois projetos. Não usar main.
2. Publicar somente o backend QA e conferir o campo adicional no contrato entregue.
3. Na sessão legítima da Piligrin, abrir Dúú e selecionar 01–07/11/2026 em Início e Anúncios.
4. Comparar conta, moeda, atribuição e período antes de exigir os mesmos 105 da Meta;
   documentar o valor efetivamente recebido, sem substituir ausência por zero.
5. Conferir cobertura 1+9, gasto, cliques, impressões e gráfico; trocar período e voltar à carteira.
6. Confirmar isolamento de anunciante/conta/sessão. Não criar campanhas, cobranças,
   vínculos, confirmações de publicação, nem alterar verba para produzir evidência.

Reversão do código, se necessária: retirar apenas os arquivos/hunks deste pacote na QA,
preservando o restante do onboarding e dados. Nenhuma reversão de banco é necessária.
