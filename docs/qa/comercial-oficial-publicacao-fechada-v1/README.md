# Comercial oficial publicado fechado

17/11/2026. Banco, WebApp e LP publicados com autorização de Victor. Cobranças, processamento financeiro, recorrência, preparação e envio de mensagens permanecem desligados.

## Publicação verificada

| Parte | Resultado |
|---|---|
| WebApp | `dpl_7QVw8auDs7pPiEhJ9BzbeUbV9hPH`, READY, domínio `https://app.v2gmidia.com.br`. 663 arquivos de produto. |
| LP | `dpl_AmUwyb2aiX5fHt4mfrSCuHz2ehvC`, READY, domínios `https://www.v2gmidia.com.br` e `https://v2gmidia.com.br`. 55 arquivos. |
| Banco | Projeto `ushccxpoxjikzqnwhgfd`, migração `20261117125516_comercial_oficial_fechado_v1`; readiness = 1. Readiness indica schema presente, não abertura das vendas. |
| Configuração | Todas as opções comerciais novas OFF; opções financeiras antigas continuam OFF. Valores sensíveis não foram lidos nem alterados. |
| Dados | Contagem e checksum das 52 tabelas públicas anteriores iguais antes/depois da migração e após a conferência autenticada. |
| Isolamento | Onze tabelas novas com RLS e SELECT direto negado a anon/authenticated; RPC da LP sem EXECUTE nesses papéis. Testes locais positivos/negativos por comprador, anunciante, agência e unidade. |

O pacote publica a entrada comercial oficial, contratação nominal por anunciante, confirmação canônica de pagamento, preparação das duas mensagens, recorrência nominal e consumidores de acesso. Os controles OFF impedem o uso financeiro deste conjunto. O endereço do aviso interno é `victor.cabral@v2gmidia.com.br`.

## Preservação de fonte

A QA inteira não foi promovida. Havia mudanças de outras frentes em Início, Criativos, onboarding e navegação. A composição usa a produção WebApp `4e32f0d0822e1f5ac55fc0171a1da67a2eeadc41`, acrescenta somente o conjunto comercial e seus consumidores e reaplica os ajustes aprovados de Pedidos/cabeçalho. O comportamento e a navegação produtivos foram preservados, incluindo o retorno à carteira.

Durante o trabalho, a LP recebeu a publicação Git `d21dffdc4e831b83e70ff759b8bbf61a837c52bd` (`dpl_FqkkNZXRadkw1viNMea8BG2c2jLv`). A composição foi atualizada para esse estado antes de publicar. Os 55 arquivos da LP publicada coincidem com essa revisão, incluindo os assets novos; o delta de fonte da LP contra essa base é zero. Páginas legais preservadas.

`fontes-publicadas.json` registra os hashes exatos. `deltas-publicados.json` registra as bases e os 122 arquivos WebApp diferentes em bytes. `webapp-producao.patch` permite revisar/reproduzir esse delta; `lp-producao.patch` está vazio pelo motivo acima. Não aplicar o patch indiscriminadamente sobre uma pasta em andamento.

A reprodução foi conferida em diretório privado descartável: os 663 arquivos resultantes coincidiram byte a byte com o manifesto publicado. No Windows, o ensaio usa `git -c core.autocrlf=false apply` para preservar os finais de linha do pacote, sem alterar a configuração global. A primeira tentativa com a configuração local converteu LF/CRLF em 46 arquivos; não houve diferença de conteúdo e o ensaio com preservação de bytes passou. Evidência: `patch-replay-result.json`.

A publicação foi feita por pacote na Vercel. Não houve commit, push ou merge neste bloco. As fontes em andamento dos outros chats foram preservadas. Antes de uma futura publicação por Git, reconciliar a composição publicada com a branch de destino para não perder esses consumidores de acesso.

## Backup e recuperação

Backup privado em `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-comercial-oficial-producao`, com ACL restrita ao usuário local. Capturados metadados das 52 tabelas públicas, funções e 19 tabelas de dados do escopo, totalizando 42 linhas. Nenhum arquivo de dados privados foi incluído neste pacote público ou enviado à Vercel.

A restauração local em PGlite reconstituiu as 19 tabelas com colunas, restrições, FKs do escopo, índices, políticas, ACL e funções capturadas. Os dados restaurados conferiram na representação JSON do PostgreSQL. A aplicação do SQL oficial preservou todas essas linhas; o retorno conservador também preservou as linhas e a proteção do cadastro.

Limites: não é backup integral do projeto. Usuários Auth e credenciais Meta não foram capturados; suas dependências são substitutos explícitos no ensaio local. Dados de tabelas fora do escopo não foram restaurados. Não foi feita restauração remota em produção.

Migração formal registrada em `supabase/migrations/20261117125516_comercial_oficial_fechado_v1.sql`. SHA-256 do arquivo e do SQL aplicado: `89898bc34207187eabc1335ab21dc085920bf6442eabcfe6d3256e542e440bb1`. O CLI Supabase 2.81.3 foi usado somente para gerar o arquivo local; a versão do nome foi reconciliada com o histórico real após a aplicação. A transação aplicada incluiu guardas de versão, locks e conferências antes/depois das 52 tabelas anteriores.

## Provas e limites

- 157 testes locais aprovados e compilação isolada concluída, sem `.env` copiado. Asaas, Resend e Auth dos testes são substituídos; nenhum pagamento ou e-mail real foi criado pelo ensaio.
- Após preservar a publicação intermediária da LP: os oito testes de limites oficiais passaram com os arquivos exatos da LP, além dos conferidores de contato, jornada e comercial. Rede substituída nos testes.
- Pela sessão legítima de `victorcabralns@piligrin.com.br`: carteira Piligrin → aplicativo Dúú → volta à carteira. Acesso a Pedidos redirecionou à carteira, sem expor a consulta do operador.
- Dúú, conta `act_1165478988908157`, 01 a 17/11/2026: R$ 756,31 investidos, 1.175 cliques, 65.092 impressões e 252 conversas. Gráfico e tabela diária carregados; 17/11 aparece Não medido. Essa conferência comprova a leitura do aplicativo após a publicação, não uma nova auditoria independente na Meta.
- Cadastro do Dúú preservado: teto R$ 3.000 e todo o estado do Rio de Janeiro. Nome antigo do perfil `TESTE-20-09-B` e pendência visual de marca apareceram na sessão e foram preservados; não foram tratados como defeito criado pelo pacote.
- LP: Entrar aponta a `https://app.v2gmidia.com.br/entrar`; contatos continuam no formulário; compra online não apareceu. Nenhum formulário produtivo foi enviado.
- `/api/comercial-config` da LP respondeu 404/no-store. `/contratar` e `/contratar/finalizar` do WebApp renderizaram a página 404, sem campos de pagamento e com noindex. O transporte RSC devolveu HTTP 200 nesses dois GETs; não confundir com formulário habilitado ou declarar HTTP 404.
- Filas do comprador e aviso interno, pedidos nominais, assinaturas, vínculos de unidade e leads comerciais novos permaneceram vazios. Onze tabelas novas protegidas; quatro avisos de segurança preexistentes permanecem idênticos, sem novos avisos nesta leitura.
- QA WebApp continua em `dpl_FkxZrcfG64aDWHMd7Ni6j8KqzZyC` no seu projeto isolado. Nada foi publicado no backend FastAPI por este pacote: o processamento comercial alterado pertence às rotas do WebApp e à LP.

## Próximo ato

Central: conferir as conexões oficiais Asaas/3DS, webhook, remetente, proteção e retorno Auth; completar a ponte privada LP/WebApp quando necessário, sem ligar os controles. A LP de produção ainda não tem as configurações privadas de serviço e assinatura exigidas para a nova ponte. Esta publicação fechada não valida essas credenciais nem exige copiá-las agora.

Victor: definir o responsável financeiro e o procedimento de conciliação, cancelamento, estorno e contestação. Comandos financeiros e eventos `SUBSCRIPTION_*` não foram automatizados por este conjunto.

Abertura exige decisão separada. Uma primeira contratação válida poderá comprovar pagamento → e-mails recebidos → acesso do novo comprador. Victor dispensou outra cobrança artificial; não fabricar essa prova. Comercial permanece Em andamento até essas dependências serem resolvidas.

## Arquivos de evidência

- `published-summary.json`: IDs, controles públicos OFF, readiness e proteção.
- `release-tests-final-result.json`, `build-result.json`: testes e compilação.
- `restore-result.json`: recuperação local, hashes e limites, sem dados restaurados.
- `http-closed-result.json`, `closed-pages-result.json`: bloqueios públicos.
- `lp-preservation-latest.json`: publicação intermediária preservada.
- `fontes-publicadas.json`, `deltas-publicados.json`, patches: composição publicada.
- `patch-replay-result.json`: reprodução local de todos os 663 arquivos WebApp com hashes exatos.

Planilha existente atualizada em Visão geral, Próximos passos e Novembro — execução: 19 células verificadas, notas antigas, formatos e opções preservados. O estado comercial continua Em andamento. A renderização visual da planilha não foi reavaliada neste bloco.
