# QA publicada — validação Dúú e Cauã — 09/11/2026

## 0. Estado atual e próximo passo

> RESOLVIDO parcialmente em 09/11/2026: login nominal Piligrin aberto, leitura Meta concedida após autorização e números Dúú conferidos com a BM. Ver [prova posterior](./n26-duu-qa-numeros-conferidos-09-11.md). Permanecem aceite do Cauã e fluxo da peça. A descrição abaixo preserva o estado anterior.

**Publicação correta confirmada.** Commit `fe5384de889dd222cfcee0d69677a6685b076caa`, branch **QA**, no projeto isolado **v2g-webapp-qa**. Build READY e alias QA no mesmo deployment, sem erro. O endereço de produção continua no commit anterior da main; nenhuma alteração de produção foi feita pela Central.

**M1 avançou no publicado:** a nova coleção mostrou números da conta **V2G** em sessão autenticada. Não se promove essa prova a números do Dúú. A sessão aberta só oferece V2G; falta abrir o login nominal `victor.cabral@v2gmidia.com.br`, já proprietário da Piligrin no QA. A Central solicitou ao Victor indicar ou abrir essa sessão e deixou uma nova aba de entrada QA preparada com esse e-mail, senha vazia e sem submissão. A validação do piloto continua pendente desse passo e da sessão própria do Cauã; nenhum acesso novo foi criado.

**M2:** formulário publicado e porta negativa de gestor conferidos. Falta peça escolhida/autorizada com arquivo ou post de origem, envio na Piligrin, decisão pela sessão própria do Cauã e retorno persistido ao cliente. Não houve upload ou decisão nessa rodada. A estimativa de R$ 3 mil mensais continua sem confirmação e não libera gasto.

## Publicação efetivamente observada

| Campo | Prova atual |
|---|---|
| Equipe | V2G — `team_sEnWVgpk9PlXLZwMQmd4sv3O` |
| Projeto | `v2g-webapp-qa` — `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn` |
| Branch / commit | `QA` / `fe5384de889dd222cfcee0d69677a6685b076caa` |
| Deployment | `dpl_8athSV5dryDvY5euqaNLat1wVHSw` |
| URL imutável | `https://v2g-webapp-vif75pcvm-v2-g.vercel.app` |
| Alias conferido | `https://v2g-webapp-qa.vercel.app` |
| Origem / resultado | Git / READY / aliasError=null |
| Criado | 08/11/2026 23:57:54 BRT |
| Pronto | 08/11/2026 23:59:46.447 BRT — 09/11 02:59:46.447 UTC |

A primeira consulta encontrou BUILDING e o alias antigo; a consulta posterior encontrou READY, e a resolução independente do alias confirmou o novo deployment. `target=production` é o ambiente principal **do projeto isolado QA**, não o projeto de produção do produto. A confirmação usa projeto, commit, branch e alias; não o título do commit.

Consulta somente de leitura ao alias de produção `v2g-deploy-webapp.vercel.app` encontrou **`dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`**, branch main, commit **`13f8943471b391bd22e9dd8362f5748653ad9c5b`**, ainda READY. Nenhuma promoção, configuração ou publicação adicional foi feita.

O recurso opcional de cartão vivo `open_deployments` não está disponível no servidor desta conexão. A confirmação foi concluída pelas ferramentas de deployment/alias, sem contornar proteção ou criar credenciais de bypass.

## Prova atual da interface e seu limite

Fonte detalhada do 05/06: `n26-m1-m2-ui-qa-publicada-09-11.md`. Na nova versão, a sessão V2G mostrou a coleção Meta com conta `act_2818009911919726`, período 01–07/11, BRL/Brazil/East, fonte/data da consulta e **medições parciais**. Na campanha V2G observada, mostrou **R$ 26,49 / 1.493 impressões / 22 cliques**, com conversas **Não medido**. Os níveis não foram somados.

Esse resultado confirma que o consumidor publicado avançou. A conta do Dúú é **outra**, `act_1165478988908157`, ligada à Piligrin `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`. A referência humana da BM para 01–07/11 permanece R$ 281,80 gastos / 18.635 de alcance / 26.129 impressões, campanha `52570261860675`, conjunto `52570262603875`. Alcance não é clique; métricas diferentes ou contas diferentes não são divergência entre UI e Meta.

O seletor atual mostrou somente V2G. Não se injetou negócio por URL/cookie nem se alterou propriedade, papel ou grant. A concessão nominal existente e a atribuição do Cauã não foram recriadas. A conta de cliente também não recebeu acesso à fila de gestor ao navegar pela rota; voltou ao Início. Esses controles não substituem a prova positiva com as duas identidades reais do piloto.

Consulta da Central aos logs do novo deployment, 02:49:39–03:04:39 UTC, filtro `meta`, não retornou entradas. Isso é ausência na amostra filtrada, **não prova de ausência de requests nem certificado de funcionamento da API Dúú**. As falhas legadas da V2G estão separadas da coleção nova no checkpoint de UI.

## Coordenação com Cauã

WhatsApp Web, grupo autorizado **🎯 03 | Operação — Gestores**. A última mensagem anterior visível era a enviada pela Central em 08/11 às 23:10; permanecia Entregue, sem resposta posterior observada no trecho conferido.

Em **09/11 às 00:02**, foi enviada **uma única orientação nova**, depois de READY: informa a nova QA, pede que Cauã abra sua própria conta/carteira Piligrin e confira a CA Dúú no período 01–07/11; pede qual peça aprovada AD01/AD02 e seu arquivo/post original; explica a sequência envio → fila → decisão → retorno. Dispensa prints recorrentes, reconexão e alterações de campanha/verba. O WhatsApp confirmou **Entregue**, não leitura ou conclusão do teste.

Evidência local: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-09-11/caua-qa-publicada-entregue.jpg`.

## Entrada nominal preparada

Nova aba Chrome no domínio QA, rota existente `/entrar?adicionar=1&next=%2Fanuncios%3Fdesde%3D2026-11-01%26ate%3D2026-11-07`. O parâmetro `adicionar=1` é o caminho já implementado para mostrar o formulário mesmo com outra sessão aberta; não concede acesso nem troca identidade sozinho.

Somente o e-mail nominal foi preenchido. Senha permaneceu vazia; Entrar não foi acionado, não houve logout ou extração de cookies/tokens. Aba preservada para o Victor concluir o login com suas próprias credenciais. Evidência: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-09-11/login-piligrin-qa-preparado.jpg`. O sucesso do login e o negócio selecionado ainda precisam ser observados.

## Próxima prova que fecha os marcos

1. Victor abre o login nominal já autorizado da Piligrin. Conferir negócio/conta/período corretos e comparar gasto/impressões e demais métricas equivalentes com fonte/fuso/cobertura explícitos. Nenhum sucesso V2G substitui esse aceite.
2. Cauã confere a mesma conta e recorte na própria carteira. Erro ou leitura parcial deve ser registrado como observado, sem zero inventado ou inferência de acesso da credencial de backend.
3. Com a peça escolhida e autorizada e sua origem, executar um envio no negócio correto, registrar ID/hash/autor e conferir uma decisão pela sessão de Cauã e o mesmo resultado após reentrada do cliente. Não usar captura da prévia como arquivo original nem simular identidade.

U1–U6 e testes locais permanecem evidências do bloco anterior. Nenhuma suíte local foi repetida para substituir a prova real. Esta rodada não criou commit, push, deploy, grant, pedido de compra, cobrança, análise paga, alteração de banco/Storage, anúncio ou verba. Sessões e confirmação da peça são os próximos fatos necessários; produção permanece fora do escopo.
