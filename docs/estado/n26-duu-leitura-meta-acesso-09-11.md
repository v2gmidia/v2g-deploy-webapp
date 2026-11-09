# Dúú — sessão nominal confirmada e leitura Meta bloqueada — 09/11/2026

## 0. Resultado e próximo ato

> RESOLVIDO em 09/11/2026: Victor autorizou a concessão apresentada, a Meta persistiu somente Ver desempenho e a leitura cliente Dúú passou a carregar. Gasto, impressões e cliques totais do conjunto conferem com a Meta. Ver [prova posterior e pendências restantes](./n26-duu-qa-numeros-conferidos-09-11.md). O restante deste documento preserva o diagnóstico anterior ao ato.

**A pendência de login do cliente foi resolvida.** Victor concluiu o login na aba QA preparada; a UI ofereceu Piligrin, cadastro `9cb85308`, e a Central a selecionou pelo botão próprio. O cabeçalho passou a mostrar Victor/Piligrin. Nenhum perfil, papel, vínculo ou grant foi alterado para obter o acesso.

**M1 permanece bloqueado na fonte Meta:** na conta/negócio correto e período 01–07/11, a nova coleção respondeu **HTTP 424**, com mensagem normalizada de conferência do acesso de leitura. Não apareceram números Dúú; não houve comparação numérica positiva nem conversão de falha em zero.

**Correção mínima preparada, ainda não aplicada:** atribuir ao usuário de sistema QA **v2g-qa-leitura (`61595938936618`)** somente **Ver desempenho** da **CA - Dúú Gomes (`1165478988908157`)**. A seleção está no formulário da Meta, um ativo, com Gerenciar campanhas, Gerenciar modelos da Central de Criativos e Gerenciar contas de anúncios desligados. O botão final Atribuir ativos **não foi acionado**. É ampliação de acesso aos dados reais do Dúú e exige confirmação humana no momento do ato; não está embutida no login.

M2: área Criativos da própria Piligrin abriu, biblioteca/Instagram/revisão/arquivados em zero e formulário ativo. Sem arquivo selecionado/enviado ou decisão; peça escolhida/autorizada e origem, além da sessão própria do Cauã, continuam necessárias.

## Sessão e coleta observadas

- QA publicada: commit `fe5384de889dd222cfcee0d69677a6685b076caa`, deployment `dpl_8athSV5dryDvY5euqaNLat1wVHSw`, alias `v2g-webapp-qa.vercel.app`.
- Escolha na UI: **Piligrin Cadastro 9cb85308**, em `/escolher-negocio`; depois **Negócio atual: Piligrin**. Não foi fabricado ID de negócio em cookie/URL.
- Consulta de cliente: `/anuncios?desde=2026-11-01&ate=2026-11-07`. Período visível 01/11/2026–07/11/2026.
- Aviso da coleção: **“O acesso de leitura da V2G à Meta precisa de conferência. Fale com a equipe V2G.”**
- Log correlato Vercel, **09/11 03:20:34.128 UTC / 00:20:34.128 BRT**: request `k286z-1794194427585-374b12995e1e`, domínio QA, branch QA; `[backend:anuncios-meta] GET /negocios/9cb85308-02cc-4ce7-bacf-15be77f9ba5e/meta/campanhas status=424 categoria=dados_invalidos`.

403 de `/execucao` e 404 de `/consolidado` também aparecem na rodada, mas são as leituras legadas separadas. A ausência de execução não é a causa atribuída ao novo 424 da coleção independente.

## O que o erro prova e o que não prova

`lib/backend/anuncios-do-negocio.ts` mapeia HTTP 424 para motivo `fonte`, depois de confirmar sessão, proprietário/negócio e conta ativa. No backend, `src/meta/leitura_anuncios.py`, códigos Meta **10, 190, 200 e 294** resultam em `meta_acesso_indisponivel`/424. O retorno sanitizado não distingue qual desses códigos aconteceu nesta chamada.

Portanto o 424 comprova falha da autorização/credencial na fonte nessa consulta, **não identifica sozinho** token expirado, escopo faltante ou ativo sem atribuição. Não se repetiu OAuth humano nem se leu segredo para tentar adivinhar o caso.

## Permissões conferidas na Meta — somente leitura

Portfólio **V2G Midia**, `1014960154276237`, seção Usuários do sistema. Usuário **v2g-qa-leitura**, ID **61595938936618**, papel **Employee**. UI informa exatamente **dois ativos atribuídos**:

| Ativo | Acesso atual |
|---|---|
| V2G CONTA | Acesso parcial: Ver desempenho |
| V2G MÍDIA | Acesso parcial: Testar app |

**Dúú não aparece nessa atribuição atual.** Não foram modificados V2G APPS, v2g-coletor, ativos já atribuídos ou funções do app. Os botões Gerar token/Anular tokens não foram acionados nem se abriu uma credencial.

O checkpoint backend `docs/estado/n26-p3-ativacao-leitura-real-qa-06-11.md` registra a criação desse mesmo usuário/ID para leitura exclusiva QA, a preparação de token apenas `ads_read` e a confirmação de Victor de que o colocou privadamente no serviço QA. Isso liga **documentalmente** o leitor ao preparo daquele serviço. Não equivale a observar a identidade do token atualmente carregado; nenhum valor foi extraído ou submetido a debug.

A falta de Dúú no leitor nominal é compatível com o 424 atual e é uma lacuna concreta de escopo. O êxito anterior da V2G e o acesso humano à BM não comprovam autorização desse leitor para o Dúú. O parecer de diagnóstico 07/08 mantém essa distinção.

## Pacote de correção preparado e critério de aceite

Formulário **Selecionar ativos e atribuir permissões**, aberto a partir do usuário nominal. Tipo Contas de anúncios, pesquisa pelo ID externo **1165478988908157**, resultado único **CA - Dúú Gomes**, propriedade **BM - Vinho Dúúgomes**. Somente esse ativo está selecionado.

- **ON:** Ver desempenho — acessar relatórios e visualizar anúncios.
- **OFF:** Gerenciar campanhas (anúncios); Gerenciar modelos da Central de Criativos; Gerenciar contas de anúncios (configurações/finanças/permissões).
- Nenhuma Página, Instagram, app adicional ou outra conta selecionada.
- Sem novo token, rotação, alteração de ambiente, deploy, SQL, verba, publicação ou produção do produto.

Se autorizado nominalmente, a Central deve conferir novamente ator/ativo/permissões, confirmar uma vez, observar sucesso e reler a atribuição persistida. Depois repetir uma única consulta de cliente no mesmo recorte/identidade e comparar números/IDs/moeda/fuso/cobertura com a referência BM. Se o 424 persistir, registrar e diagnosticar sem elevar permissões ou gerar credencial por consequência. Não prometer que a concessão proposta resolve todos os possíveis códigos da fonte.

## Peças — prova atual no negócio correto

`/criativos`, cabeçalho Victor/Piligrin: Biblioteca **0**, Instagram **0**, Em revisão **0**, Arquivados **0**. Formulário **Já tenho um criativo**, JPG/PNG até 9 MB, dois objetivos e prazo promocional; Conferir criativo desabilitado sem arquivo. Envio não coloca anúncio no ar.

Ainda falta arquivo/post original e indicação de qual peça aprovada usar, solicitados ao Cauã no grupo às 00:02 desta data. Não se usou captura da prévia como criativo original, nem se enviou peça pela identidade V2G ou se simulou a sessão dele. Nenhuma nova mensagem foi enviada nesta conferência nominal até este registro.

## Evidências locais

Na pasta `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-09-11/`:

- `piligrin-leitura-meta-bloqueada.jpg` — conta Piligrin/período e aviso.
- `piligrin-criativos-sem-envio.jpg` — área de peças do negócio correto.
- `leitor-qa-apenas-v2g.jpg` — dois ativos atuais do leitor nominal.
- `leitura-duu-preparada-aprovacao.jpg` — seleção/permissões prontas, ainda sem confirmar.

Nenhuma suíte local, migration ou deploy foi repetido; o avanço medido é o ensaio autenticado real. Produção, campanhas e valores de credenciais permaneceram intocados. O próximo ato é a confirmação nominal da concessão somente de leitura, seguida de conferência real, com os limites acima.
