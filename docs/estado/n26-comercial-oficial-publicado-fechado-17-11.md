# Comercial oficial publicado fechado em 17/11/2026

## 0. Situação e próximo responsável

Banco, WebApp e LP oficiais publicados e conferidos. Cobranças, processamento, recorrência e envios seguem OFF. A abertura comercial ainda não foi concluída.

Próximo ato: Central confere conexões oficiais e as configurações privadas que faltam à nova ponte; Victor define responsável e rotina financeira. Abertura e primeira contratação válida são etapa separada. Não criar cobrança artificial.

## Fatos verificados

| Prova | Resultado |
|---|---|
| Backup privado | 19 tabelas do escopo, 42 linhas e metadados; recuperação local e retorno conservador passaram. Auth e credenciais fora do backup. |
| Migração produtiva | `20261117125516_comercial_oficial_fechado_v1`; 11 tabelas adicionais e 36 funções públicas do conjunto; guardas de versão e preservação. |
| Dados produtivos | As 52 tabelas anteriores mantiveram contagem e checksum; novas tabelas com RLS e acesso direto negado a anon/authenticated. |
| Testes | 157 aprovados e compilação isolada; nova conferência da LP preservada passou em oito testes oficiais e três conferidores. |
| WebApp | `dpl_7QVw8auDs7pPiEhJ9BzbeUbV9hPH`, READY em https://app.v2gmidia.com.br. |
| LP | `dpl_AmUwyb2aiX5fHt4mfrSCuHz2ehvC`, READY em https://www.v2gmidia.com.br; publicação intermediária de outro chat preservada. |
| Sessão real | Titular da Piligrin abriu Dúú e voltou à carteira; Pedidos redireciona para a carteira. Nenhum papel ou acesso alterado. |
| Resultados Dúú | 01–17/11: R$ 756,31; 1.175 cliques; 65.092 impressões; 252 conversas. Gráfico/tabela diária disponíveis, dia 17 Não medido. |
| Compra fechada | LP sem compra online; Entrar oficial; páginas de compra sem formulário de pagamento; filas e pedidos nominais novos vazios. |
| Planilha | 19 células atualizadas e relidas; histórico, formato e opções preservados. Comercial Em andamento. |

## Decisões de composição

A QA continha mudanças de outras frentes. Foi composta uma publicação seletiva sobre a produção, preservando Início, Criativos, navegação e comportamento de onboarding, com os consumidores necessários à proteção nominal e os ajustes aprovados de Pedidos/cabeçalho.

A LP recebeu a revisão Git `d21dffdc4e831b83e70ff759b8bbf61a837c52bd` durante o trabalho. Ela foi incorporada antes do último deploy; nenhum ajuste desse estado foi descartado. Páginas legais intactas.

Publicação por pacote, sem commit, push ou merge. Fontes em andamento preservadas. O delta reproduzível foi registrado para reconciliar a próxima publicação por Git.

## Limite da prova

Não houve pagamento, e-mail real, nova assinatura, convite, troca de permissão, anúncio ou verba alterada. O teste local usa provedores/Auth substituídos; recuperação local cobre o escopo declarado, não o projeto inteiro. Leituras do Dúú foram verificadas no aplicativo, sem nova comparação independente na BM. Os quatro avisos de segurança anteriores não mudaram.

As páginas de compra exibem 404 e noindex; os GETs RSC responderam HTTP 200. Não usar só o status HTTP para afirmar que existe compra aberta. O nome antigo do perfil e a pendência de marca do Dúú permanecem como estavam.

## Evidência detalhada

Pacote: [README](../qa/comercial-oficial-publicacao-fechada-v1/README.md), com hashes, IDs, provas, patches, limites e próximo ato. Migração: [SQL registrado](../../supabase/migrations/20261117125516_comercial_oficial_fechado_v1.sql).

Backup privado: `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-comercial-oficial-producao`. Dados não foram incluídos nos documentos públicos. Planilha: https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit.
