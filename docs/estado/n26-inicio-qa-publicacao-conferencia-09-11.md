# Início — conferência da publicação QA e série diária — 09/11/2026

## 0. Publicado e validado somente na QA

> ATUALIZAÇÃO POSTERIOR — 09/11/2026: Victor autorizou o registro Git pelo agente. Backend commit/push **646ab181d30255cf6a592d98b0bb994ce454c704**, branch `codex/qa-inicio-serie-diaria`, concluídos e ref remota conferida; main preservada. Cauã confirmou Ver números e enviou a peça; teto mensal de R$ 3 mil confirmado. A peça foi recebida para revisão na QA, ainda sem decisão do gestor/retorno ao cliente. Ver [registro Git e rodada da peça](./n26-duu-piloto-registro-git-09-11.md). As pendências de Git/teto/material mencionadas abaixo descrevem o estado anterior a essa autorização e resposta.

**WebApp publicado e números reais do Dúú presentes no Início.** Projeto QA, commit `24340c32007073b63778f29a47d0548d445d8061`, alias correto. Sessão Victor/Piligrin, conta `act_1165478988908157`, período 01–07/11: **R$ 281,80**, **26.129 impressões**, **466 cliques totais**, cobertura **1 de 10 campanhas**. A UI distingue entrega no período de configuração atual e não apresenta a campanha como “sendo preparada”.

**Backend QA publicado e gráfico real validado.** Build **Success em 09/11/2026 01:48:38 BRT / 04:48:38 UTC**. Saúde posterior confirmou runtime **002587a88fae**, exatamente a impressão digital esperada do pacote fechado. Nova coleta no Início às **01:49:59 BRT** mostrou o gráfico e a tabela diários reais: **7/7 gastos iguais à referência direta da Meta**, soma R$ 281,80. As impressões e cliques da tabela somam respectivamente 26.129 e 466, iguais aos totais conferidos nas telas.

Victor concluiu privadamente o login solicitado. A UI autenticada do Easypanel **v2.37.0** já estava com **Upload** selecionado no serviço **ia/backend-qa**, builder Dockerfile e arquivo `infra/Dockerfile`. A Central enviou uma única vez o pacote fechado abaixo. O upload iniciou automaticamente a ação **Deploy service**; não se clicou em Implantar de novo. Não houve alteração de fonte para main ou de configuração de ambiente. Produção não recebeu ação desta rodada.

Antes da troca, a saúde pública do host QA confirmou `ok=true`, runtime **37f082b62c06**, schema true, leitura Meta true, observador false, banco real e provedores simulados. `ambiente=production` nessa resposta é o modo de execução da imagem; o alvo continua o host/serviço QA, não o serviço de produção. Nenhum editor de ambiente foi aberto ou alterado.

A autorização desta rodada é publicar somente o backend **QA** e validar Início/números/gráfico. A frase final do pedido foi interpretada pelo escopo explícito “somente no QA” e pelas restrições anteriores: produção permanece fora do ato. Não é autorização para push/commit do agente ou mudança de produção.

**Pendência operacional separada:** o candidato backend isolado ainda não tem commit/push. A publicação autorizada usou o arquivo de fonte fechado e conferido por hash, no método Upload já existente. Registrar futuramente esse candidato no Git continua com Victor; isso não impede a prova da versão que está efetivamente rodando na QA. O piloto da peça e o aceite na sessão própria do Cauã continuam fora deste aceite de leitura.

## WebApp — fonte efetivamente publicada

| Campo | Conferido |
|---|---|
| Projeto | `v2g-webapp-qa` — `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn` |
| Equipe | `team_sEnWVgpk9PlXLZwMQmd4sv3O` |
| Branch e commit | `QA` / `24340c32007073b63778f29a47d0548d445d8061` |
| Deployment | `dpl_Gf8Fng2QNNizjBz5QLgiBUrrQtno` |
| URL imutável | `https://v2g-webapp-bdqjkf97y-v2-g.vercel.app` |
| Alias | `https://v2g-webapp-qa.vercel.app` |
| Resultado | READY, aliasError=null, origem Git |
| Pronto | **09/11/2026 01:34:22 BRT** |

`target=production` é o alvo principal do projeto isolado QA, não o projeto de produção do produto. O checkout local QA está limpo no mesmo commit; nenhuma alteração de produto foi feita nesta conferência.

Consulta real em `/inicio?desde=2026-11-01&ate=2026-11-07`: fonte Meta Marketing API, BRL, America/Sao_Paulo; coleta exibida **09/11/2026 01:36:48 BRT**. Conversas/vendas não foram inferidas dos cliques. Teto mensal segue não definido, separado do desempenho.

Comparação publicada com `/anuncios?desde=2026-11-01&ate=2026-11-07&conta=act_1165478988908157`, sessão Victor/Piligrin, coleta **01:43:11 BRT**: campanha `52570261860675` e conjunto `52570262603875` mostraram os mesmos R$ 281,80 / 26.129 / 466. AD01 permaneceu R$ 265,96 / 25.025 / 444; AD02 R$ 15,84 / 1.104 / 22. Conversas WhatsApp continuaram não medidas. Não se somaram níveis para construir o resumo.

## Candidato backend preparado

A pasta isolada `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio`, branch `codex/qa-inicio-serie-diaria`, ainda está com seis arquivos de candidato sem commit, HEAD base `fae0877bdc44fc2ea89dc855f6473b6167cd6fe0`. A consulta das refs remotas não encontrou essa branch ou QA. Main remota está em `c3e13596e5c4642b1cf9a342472fa411907313d4`, cujo último commit é o diagnóstico 424; o arquivo de leitura Meta nela continua sem a série. Não se tomou esse main posterior como candidato diário.

Para permitir publicação QA do snapshot já testado sem commit/push pelo agente, foi preparado um arquivo de fonte fechado, com base Git fae0877 e somente os dois arquivos alterados que entram no contexto de runtime: a série Meta e o script da ponte legada. Nenhum `.env`, `.git`, `.venv`, cache ou credencial está incluído. O pacote tem **283 arquivos**, todos relidos do TAR e comparados ao candidato testado. Os seis arquivos locais do candidato também conferiram com o manifesto SHA-256 da rodada anterior.

- Arquivo privado: `C:/Users/victo/.codex/private-backups/v2g/releases/qa-inicio-serie-20261109/backend-qa-inicio-serie-diaria.tar.gz`.
- SHA-256: `5db68085bed48197fb0d42659c3da2da1d32452b0f561b5ed5a696ec4564b724`.
- Impressão digital esperada do runtime: **`002587a88fae`**, calculada pelo mesmo algoritmo de `src/versao.py` sobre o conteúdo incluído.
- Dockerfile: `infra/Dockerfile`, contexto raiz, porta interna 8000.
- Manifesto: `manifesto-pacote-qa.json` na mesma pasta privada.

A [documentação oficial do Easypanel](https://easypanel.io/docs/services/app) oferece fonte Upload para arquivo de código, com builder Dockerfile. A UI desta instalação confirmou Upload selecionado e aceitou gzip no input de arquivo. O método e o Dockerfile existentes foram preservados. A troca foi o conteúdo do upload somente do serviço QA. Referência de retorno do código: arquivo privado `base-fae0877-runtime.tar`; a impressão digital desse fonte de base corresponde ao runtime QA anterior. Isso não é afirmação de backup byte a byte da imagem anterior ou de preservação das dependências resolvidas pelo pip.

### Resultado do build e runtime

- Nome no build: `docker.io/easypanel/ia/backend-qa:latest`.
- Digest do manifest exportado: `sha256:48acb8d2def7332fb9fab1c4894bfbe27dd6dab0936f8f659619324426ffc773`.
- Digest de configuração exportada: `sha256:3ca5fffb229d90ceb3fd9cfdd06280466dce1482efb96deaa6fde86f782f792f`.
- Manifest list exportada: `sha256:b98b7e10e4f736f7fffb8e258a62ffcfba6583097d93f7e8fef25ba831e86444`.
- São valores do log de build; não se declarou um `docker inspect` independente do host nem digest de imagem de produção.
- Saúde depois: `ok=true`, **002587a88fae**, schema true, leitura Meta habilitada, observador false, banco real e demais provedores simulados, migrations pendentes vazias. Mesmos indicadores públicos de modo antes/depois, exceto a versão de código esperada.
- Dependências foram resolvidas durante o build conforme as faixas existentes do projeto. A impressão digital de código não mede essas dependências. Este ato valida o percurso de leitura Meta/Início indicado, não todos os fluxos do backend ou uma release de produção.

## Referência real do gráfico na Meta

Conta **CA - Dúú Gomes (`1165478988908157`)**, campanha `52570261860675`, conjunto **Donos de bares 23-50 (`52570262603875`)**, período visível **1–7/11/2026**, detalhamento **Dia**. Nenhum anúncio, orçamento ou estado foi editado; Conferir e publicar permaneceu desabilitado.

| Dia | Gasto na Meta |
|---|---:|
| 01/11 | R$ 45,14 |
| 02/11 | R$ 29,37 |
| 03/11 | R$ 56,56 |
| 04/11 | R$ 66,87 |
| 05/11 | R$ 28,76 |
| 06/11 | R$ 29,18 |
| 07/11 | R$ 25,92 |
| Soma | **R$ 281,80** |

São valores lidos diretamente das linhas diárias, não uma divisão do total. Algumas colunas de impressões/cliques diários da BM permaneceram em carregamento; não foram atribuídos valores a elas. A comparação independente por dia é de **gasto**; contagens diárias da QA foram conferidas por soma com o resumo, não individualmente com a BM.

### Tabela real recebida no Início após publicar o backend

| Dia | Gasto QA | Impressões QA | Cliques totais QA | Gasto igual à Meta |
|---|---:|---:|---:|---|
| 01/11 | R$ 45,14 | 4.454 | 88 | Sim |
| 02/11 | R$ 29,37 | 4.161 | 54 | Sim |
| 03/11 | R$ 56,56 | 3.538 | 49 | Sim |
| 04/11 | R$ 66,87 | 5.696 | 112 | Sim |
| 05/11 | R$ 28,76 | 2.654 | 61 | Sim |
| 06/11 | R$ 29,18 | 3.188 | 47 | Sim |
| 07/11 | R$ 25,92 | 2.438 | 55 | Sim |
| Soma | **R$ 281,80** | **26.129** | **466** | **7/7** |

A tabela foi lida do DOM renderizado, exportada e comparada por cálculo inteiro em centavos com a referência BM. Gráfico de barras e tabela existem na UI da QA publicada, sem fixture, login simulado ou chamada com identidade de outro usuário. A cobertura permanece explicitamente 1 de 10 campanhas; as nove sem observação não viraram zero.

## Evidências e parada controlada

Pasta `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/inicio-qa-09-11/`:

- `inicio-qa-totais-antes-backend-dom.txt` e `.png`: leitura real positiva do Início, fonte, recorte e gráfico ainda indisponível.
- `meta-diario-05-07-dom.txt`, `meta-diario-01-04-dom.txt`, `meta-diario-conferencia.png`: referência da Meta com detalhamento por dia.
- `meta-referencia-diaria-gasto.json`: sete gastos em centavos e soma 28180; contagens diárias explicitamente não conferidas.
- `anuncios-qa-mesmo-recorte-dom.txt`: comparação publicada das duas telas na mesma conta/recorte.
- `backend-fonte-antes.png`, `backend-qa-publicado-fonte.png`: método Upload e alvo QA.
- `backend-build-success-log.txt`: final do build, digests exportados e horário Success.
- `backend-saude-antes-dom.txt`, `backend-saude-depois-dom.txt`: modo e versão pública antes/depois.
- `inicio-qa-grafico-diario-dom.txt`, `inicio-diario-real-tabela.json`: gráfico e tabela reais, coleta01:49:59.
- `conferencia-diaria-qa-meta.json`: cálculo PASS, 7/7 gastos e somas conferidas.
- `inicio-duu-grafico-real-qa.png`: gráfico real publicado, com Piligrin selecionada.

Sem repetição de suíte local, DDL remoto, rotação de credencial, alteração de permissão, mensagem ao Cauã ou modificação de campanha. Nenhuma ação no serviço backend de produção ou no projeto WebApp de produção. O código de produto local permaneceu igual ao candidato já testado; apenas registros operacionais foram acrescentados depois do push de Victor.

## Planilha atualizada e encerramento

Na mesma planilha operacional, o controle atualizou **Visão geral!C12:F12, A23** e **Novembro — execução!H3:L3, L4, H5, J5, L5**. Releitura: **14/14 textos conferidos**, histórico/formato preservados e **32 vizinhas intactas**. Números e gráfico do cliente ficaram concluídos na QA. A comparação individual de impressões/cliques diários não foi declarada; peça, teto, aceite da sessão própria do Cauã e registro Git do candidato backend continuam separados.

O bloco de publicação/leitura pedido está concluído. Não foi criada automação ou acompanhamento repetitivo. Início QA e fonte do serviço QA ficaram abertos como resultados conferíveis para Victor.
