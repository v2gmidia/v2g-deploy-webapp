# Cauã, histórico e confirmação da arte — bloco QA, 09/11/2026

## 0. Resultado e o que falta

| Pendência | Resultado |
| --- | --- |
| Nome do Cauã | **Resolvido no banco e conferido na sessão publicada da Piligrin, somente QA.** |
| Histórico antigo com erro | **Causa comprovada e correção local testada nos dois projetos.** Pronta para commit/push; ainda não publicada no backend ou no WebApp QA. |
| Publicação da arte | **Aguardando a data exata do Cauã.** Pedido entregue no grupo de gestores às 22:51; nenhuma resposta à pergunta até a última conferência. Registro permanece aprovado, sem confirmação fictícia. |

Nenhum commit, push, deploy, migração ou alteração em produção executado pelo agente. A única escrita remota foi o nome de exibição no projeto Supabase QA. Nenhuma campanha, anúncio, verba, atribuição, permissão ou credencial alterada.

## 1. Nome salvo e verificado

Projeto: `zskpijnqgkqwxksqmzmf` (**QA**). Perfil atribuído à Piligrin: `45f996e1-5f2b-4bd3-ab19-5e8b19bc5c67`, negócio `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`.

Foi reconferido o vínculo exato em `manager_accounts` e `profiles.full_name=null`. Antes da alteração, o valor do campo e a identificação do alvo foram registrados em cópia privada fora do Git. O UPDATE aceitou somente o perfil exato, ainda com nome nulo e com a atribuição esperada. Retornou uma linha com **Cauã Carlos**.

Uma leitura posterior confirmou o nome, a atribuição preservada e zero confirmações de publicação. Depois de recarregar o WebApp QA, o Início do Dúú passou a mostrar **Responsável: Cauã Carlos** e o cadastro apresentou o mesmo nome. Não foi colocado um nome fixo no código.

Evidências privadas: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/pendencias-qa-09-11/caua-nome-antes.json` e `caua-nome-qa.jpg`. A cópia contém somente o campo alterado e metadados do alvo; não é um backup integral do perfil.

## 2. Causa e correção do histórico

**Fato:** uma consulta de contagem na QA retornou **zero execuções** da V2G para a Piligrin/Dúú. Isso é diferente das campanhas existentes na Meta.

**Fato de código:** o backend em `src/api/rotas.py`, função `consolidado_do_negocio`, respondia HTTP 404 se não encontrasse execuções. O WebApp em `lib/resultado/do-negocio.ts:156` classifica falha da consulta como indisponibilidade. Assim, ausência de rodada era apresentada como erro do histórico, enquanto a leitura Meta funcionava.

Correção preparada na candidata backend QA:

- Se não houver execução, retornar consolidado vazio **somente depois de comprovar o par negócio/titular no cadastro**.
- Negócio/titular não comprovado, titular diferente ou ausência de `profile_id` continuam com 404. Uma falha de leitura não vira histórico vazio.
- Janela invertida continua inválida, inclusive sem rodadas.
- Campos medidos permanecem nulos; nenhuma receita, gasto, campanha ou execução é criada. Apenas listas de histórico vazias e contagem de rodadas zero.

Correção preparada no WebApp `QA`:

- O leitor do consolidado exige que o `business_id` retornado coincida com o solicitado.
- O estado comprovado `sem-execucao` mostra **“Ainda não há rodadas da V2G para este negócio.”**, mantendo a consulta Meta separada acima.
- HTTP 404/401/500 e resposta ilegível continuam mostrando indisponibilidade. Nenhuma troca genérica de 404 por sucesso.
- Identidade visual, fonte de métricas e demais páginas preservadas; nenhum CSS ou recurso de marca modificado.

## 3. Testes

| Verificação | Resultado |
| --- | --- |
| Backend: suíte unitária completa | **3.073 aprovados, 10 pulados, 9 avisos**, sem falhas. Rodada declarada em mocks, sem banco/API real. |
| Backend: consolidado e regressões novas | **27 aprovados**, incluindo seis casos novos de vazio/titularidade/falha/janela. Também incluídos na suíte completa. |
| Backend: Ruff | Aprovado em `src` e no novo arquivo de testes. |
| Backend: mypy | Aprovado, 178 arquivos de fonte. |
| WebApp: `pnpm conferir` | Aprovado; inclui o novo `conferir:historico` com **7/7** e o de agência com **22/22**. |
| WebApp: `pnpm build` | Aprovado. Nenhum servidor de desenvolvimento concorrente. |
| Revisão/publicação de criativos | **11/11** e **6/6** aprovados separadamente. |
| Diferenças e formato | `git diff --check` aprovado nos dois projetos. |

Os sete testes do WebApp exercitam os leitores reais e a página real com fronteiras controladas: contrato vazio, query com titular e datas, recusa de outro negócio, falhas que não se tornam vazio, Meta preservada e mensagem do histórico. O contrato JSON foi exportado do modelo Pydantic real, com identidade fictícia.

Limites: os dez testes pulados do backend continuam contabilizados como pulados, não como aprovados. Na suíte WebApp, rede real de nichos/dia seguinte foi pulada explicitamente; cadastro usa OpenAPI local e metadados de schema foram lidos somente da QA. O histórico corrigido ainda exige verificação publicada depois do commit/push e do deploy exclusivo do backend QA.

## 4. Confirmação com Cauã

Foi aberta uma aba separada do WhatsApp porque havia uma edição do usuário em andamento em outra aba. A edição não foi enviada ou modificada pelo agente.

No grupo **🎯 03 | Operação — Gestores**, foi reconferida a pergunta anterior, das 20:48, e enviado um acompanhamento às **22:51 de 09/11/2026**. A mensagem pede a data em que a versão **“Tenha Dúú Gomes no seu estabelecimento”**, garrafas e mesa roxa, entrou no **AD 01 `52570262604075`**. Explicita que não é a data de criação da campanha e que não é necessário publicar ou alterar o anúncio.

O envio passou de pendente para **Entregue**. A conversa direta também foi consultada no trecho recente; não trouxe a data da arte. Nenhuma mensagem sobre outro assunto foi respondida. Sem confirmação suficiente, `creative_publication_confirmations` permaneceu com **zero registros** para esse negócio.

O snapshot de texto da conversa relevante está no diretório privado `pendencias-qa-09-11/confirmacao-caua-grupo.txt`. A captura de tela do WhatsApp mostrou uma janela diferente da conversa controlada e foi descartada; não é usada como prova. A evidência de entrega é o estado textual observado no grupo.

## 5. Pacotes prontos para o Victor

| Projeto | Pasta / branch | Alterações deste bloco |
| --- | --- | --- |
| WebApp QA | `C:/Users/victo/v2g-deploy/webapp`, `QA` | Leitura com negócio exato, apresentação do histórico vazio, contrato exportado, teste de regressão integrado à suíte e registro operacional. |
| Backend candidato QA | `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio`, `codex/qa-inicio-serie-diaria` | Consolidado vazio com titular comprovado e seis testes novos. |

O registro da validação publicada anterior já estava sem commit no início e foi preservado. Nenhum arquivo de backup, credencial ou conversa privada foi adicionado ao Git.

Depois do commit/push nos destinos QA e da publicação autorizada do backend QA: conferir Anúncios com a Piligrin, mensagem de ausência de rodadas e números Meta de 01–07/11 (R$ 281,80; 26.129 impressões; 466 cliques). Depois da resposta exata do Cauã: conferir versão/ID/data e registrar pelo mecanismo do gestor atribuído, antes de confirmar o retorno ao cliente. Não marcar a publicação como resolvida enquanto essa evidência não existir.
