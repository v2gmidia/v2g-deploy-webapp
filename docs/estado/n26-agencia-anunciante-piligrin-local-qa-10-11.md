# N26 — Piligrin, Dúú e FamFire: implementação local QA — 10/11/2026

## 0. Entrega e próximo ato

**Pacote WebApp pronto para revisão, commit e push manuais somente na QA. Nenhuma migração foi aplicada e nenhum deploy, commit ou push foi feito.**

Destino local conferido ao fechar o bloco: branch `QA`, acompanhando `origin/QA`, base `b6334de`, em `C:/Users/victo/v2g-deploy/webapp`. Alterações anteriores de outros blocos continuam na árvore; nenhuma foi descartada ou levada à produção.

A estrutura foi implementada e testada localmente. O banco QA ainda não tem o novo vínculo preparado neste bloco, e a FamFire não foi cadastrada lá. Commit/push do código conserva o percurso atual do Dúú; mostrar os dois cadastros reais exige outro bloco de aprovação do banco QA, backup privado e validação autenticada após aplicação.

| Responsável | Próxima ação | Evidência de saída |
|---|---|---|
| Victor | Conferir e commitar/enviar pacote WebApp na branch QA | Commit e versão publicados no projeto QA exato |
| Central / Victor | Revisar o pacote de banco e autorizar nominalmente a aplicação QA em outro bloco | Backup, ACL/RLS, IDs e preservação dos registros conferidos |
| Piligrin / Central | Após a aplicação, percorrer Dúú e FamFire na sessão legítima | Carteira, abertura, números/ausência, peças, retorno e aba antiga sem mistura |
| Victor / Cauã | Completar dados e ativos próprios da FamFire | Sem reaproveitar conta, teto, região, imagem ou gestor por inferência |

M3/M4 do Dúú não foram encerrados por esta implementação. Data da arte, marca/material, rodada e aceite humano continuam conforme os checkpoints anteriores. Nota 360 e clientes diretos não foram implantados por consequência.

## 1. Decisão de preservação

O cadastro histórico da Piligrin já contém o recorte operacional do Dúú. Mover todos os números, arquivos, hashes, revisões, contas e contratos agora aumentaria o risco e extrapolaria este bloco.

Foi implementada relação explícita `agency_advertisers`: a agência é identificada por `agency_business_id`; o anunciante por `advertiser_business_id`, nome declarado e referência estável. O Dúú conserva o business_id existente por uma ponte legada declarada. A FamFire receberá negócio independente no futuro ato do pacote QA, sem copiar os dados do Dúú. Não há associação por nome parecido.

O schema pendente usa FKs compostas para provar titular comum, SELECT sob RLS e escrita apenas de serviço. Não cria RPC pública, direitos financeiros, concessão Meta, assinatura, campanha ou publicação.

## 2. Produto implementado

- Carteira Início carrega os anunciantes efetivamente vinculados e liberados, com resumo de peças separado. A única agência anteriormente liberada continua sendo a entrada inicial, sem selecionar um filho ao acaso.
- Criativos da agência reúne peças com cliente identificado e oferece entrada na biblioteca mesmo quando um anunciante está sem peças.
- Abrir outro anunciante é um POST: confere sessão, agência, filho liberado e titular antes de alterar a preferência. Links GET não trocam o contexto de escrita. Filtros e peça solicitada são preservados com destino local.
- Detalhe mantém números/conta/período, cadastro, marca e biblioteca do negócio selecionado. Assinaturas de arquivo exigem titular e caminho correspondente; respostas cruzadas são descartadas e sinalizadas.
- O novo acesso de preparação fica sob o portão QA existente. Pai sem concessão válida, vínculo revogado ou pedido comercial próprio não são contornados. Fora da QA, essa ampliação não opera.
- Enquanto a tabela não existe, a leitura reconhece instalação pendente e conserva o Dúú legado. Erros reais de consulta/ACL não viram carteira vazia ou falsa instalação ausente.
- Tipografia, cores, superfícies e composição aprovadas foram preservadas. Só foram acrescentados controles de abertura e os estados necessários.

Código principal:

- `lib/agencia/vinculos.ts` e `vinculos-da-sessao.ts`: contrato e leitura da relação.
- `lib/agencia/da-sessao.ts`: carteira autenticada e contexto de cada anunciante.
- `lib/multiconta/ativo.ts`: preparação QA limitada ao pai piloto e preferência validada.
- `app/(protected)/agencia/actions.ts` e `components/agencia/AbrirCliente.tsx`: abertura validada e feedback junto ao botão.
- `lib/criativos/galeria-da-sessao.ts`: leitor compartilhado extraído da página, por negócio e titular.
- Início, Criativos e componentes da agência: carteira, fila e navegação conectadas ao contrato.

O backend foi lido em `src/db/acesso_anuncios.py`: já confere titular/atribuição e conta por business_id. Não precisou mudar de contrato nem de publicação neste bloco. Não houve modificação no repositório backend.

## 3. Conferências concluídas

| Conferência | Resultado |
|---|---|
| Agência, estrutura, servidor e abertura | 43/43 testes |
| SQL local descartável | 34 verificações; 1 teste integrado |
| Onboarding e preservação / aba antiga | 79/79 testes |
| Multiconta / elegibilidade anterior | 30/30 testes |
| Meta, revisão e publicação | 79/79 testes |
| Histórico | 13/13 testes |
| Início Meta / fronteira cliente-servidor | 40/40 testes |
| Início | 70/70 conferências |
| Resultado | 86/86 conferências |
| Criativos | 30 conferências |
| Envio | 48/48 conferências |
| Portão de fixtures | 8/8 conferências |
| Tipos | Aprovado |
| Build | Aprovado; 57 páginas estáticas geradas |
| Diff / preservação de alterações anteriores | Conferido |

Os testes novos exercitam módulos reais com fronteiras substituídas para Auth/RLS/HTTP/cookie. Incluem relações com titular errado, duplicadas/cíclicas, concessão vencida, ausência de e-mail verificado, acesso revogado, pedido próprio, URL e POST forjados, falta do pai liberado, galeria cruzada e assinatura apenas do arquivo correspondente. O SQL prova que reexecutar o preparo preserva tanto o Dúú quanto dados posteriores da FamFire.

Foram ajustadas duas expectativas de testes estáticos para acompanhar a extração do leitor e uma lista de imports do ensaio Anúncios que ainda não incluía histórico/contexto QA do pacote anterior. Não se alterou comportamento de produto para satisfazer essas expectativas.

A suíte global `pnpm conferir` inteira não foi declarada executada: foram rodados os conferidores afetados acima. Não houve prova de aplicação no banco remoto nem de duas identidades reais já publicadas.

## 4. Prova visual local e limites

Rota dev-only: `/exemplo/agencia?carteira=dupla&visao=agencia-inicio`, porta local 3197. Usa componentes reais com dados fictícios claramente rotulados e nenhum envio. O servidor foi encerrado antes do build.

Percurso observado:

1. Carteira com dois anunciantes; abertura por botão da FamFire.
2. Início FamFire sem números, teto, região ou responsável copiados do Dúú.
3. Biblioteca FamFire vazia; volta para Criativos da agência com os dois clientes.
4. Fila consolidada com a peça do Dúú identificada como dele. Filtro FamFire retorna zero peças, sem exibir essa peça.

O roteiro visual usa uma ação local de ensaio para navegação, sem cookie real. O POST real de troca de preferência foi exercitado separadamente nos testes offline com validação e destino conferidos. Não foi alegado um ensaio autenticado publicado da estrutura ainda não aplicada.

A rota da arte opcional da bancada retornou 404. Não foi configurada nem tomada como prova de prévia real; a assinatura e o isolamento dos arquivos foram exercitados nos testes do leitor. As capturas comprovam composição/estados locais, não uma nova aprovação de arte.

Evidência privada:
`C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/agencia-estrutura-10-11/`

- `carteira-local.png`
- `famfire-inicio-local.png`
- `famfire-criativos-local.png`
- `criativos-agencia-local.png`

## 5. Pacote de banco pendente

Ver `docs/qa/agencia-anunciante-piligrin/README.md`. Schema e preparo de dados estão fora da pasta automática principal, com SHA256, procedimento de aplicação futura e retorno que preserva dados.

**Sem banco remoto, produção, permissões reais, configuração de painéis, Meta, verba, cobrança, anúncios, n8n, páginas legais ou mensagens neste bloco.** As alterações locais anteriores de Início/Anúncios, testes e checkpoints foram preservadas.
