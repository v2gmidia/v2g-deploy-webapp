# Comercial — build corrigido e release mínimo local pronto

## 0. Resultado, responsável e próximo passo

11/11/2026. Após a autorização ampla de Victor para avançar, corrigido o impedimento de build, concluídas as provas locais e preparada uma entrega comercial separada das demais mudanças de QA.

**Implementação e pacote local encerrados. Nada publicado.**

| Frente | Estado atual | Próxima ação / responsável |
|---|---|---|
| Banco mínimo | Aplicado e conferido no bloco anterior | Não reaplicar |
| Conexões | Configuradas; último estado remoto conferido OFF | Não recriar credenciais; funcionalidade real será observada na primeira compra efetiva |
| Eventos sem pedido | Correção local, testes e build concluídos | Publicar somente a entrega mínima, inicialmente OFF |
| Fonte pronta para revisão | Worktree `C:/Users/victo/v2g-deploy/webapp-comercial-off`, branch `codex/comercial-webhook-off` | Victor faz commit/push conforme fluxo manual do repositório; publicação exige conferir essa revisão exata e o destino |
| Compra controlada | Dispensada por Victor após os testes locais | Pergunta de modalidade/finalidade encerrada; não criar cobrança de ensaio |
| Abertura comercial | Ainda não executada; aceite local definido por Victor | Publicar a entrega mínima e conferir sua configuração; percurso real será observado na primeira compra efetiva |

> ATUALIZAÇÃO de Victor em 11/11: compra de ensaio dispensada e pacote aceito pelas provas locais. Não há mais pergunta de método/finalidade pendente. Ver `n26-comercial-compra-ensaio-dispensada-11-11.md`. As seções seguintes preservam o relato técnico e os limites da prova preparada; não representam compra real ou abertura executada.

Não realizar merge de toda a QA como consequência. A preparação mostrou **260 arquivos diferentes** entre o HEAD QA `2cdeb5cb545ae519ee947bd3c978198404fd9eac` e a revisão produtiva observada `13f8943471b391bd22e9dd8362f5748653ad9c5b`. A entrega abaixo evita levar mudanças de agência, onboarding, criativos e outras migrations juntas.

## 1. Correção de build aplicada

- `lib/meta/oauth-state.ts:2`: constante `COOKIE_STATE`, com o mesmo literal `meta_oauth_state`.
- `app/auth/meta/iniciar/route.ts:5`: importa a constante; removido o export não permitido do arquivo de rota.
- `app/auth/meta/callback/route.ts:8`: importa o módulo compartilhado.

Sem alteração de nonce, prazo, cookie, validação de sessão/negócio, autorização, chamada Meta ou credencial. Não foi testado consentimento Meta válido de ponta a ponta; o ajuste é de organização dos exports e a prova HTTP cobre as saídas negativas sem sessão/state.

O build completo da fonte QA corrigida passou, com tipos gerados e 57 páginas estáticas processadas. A execução em cópia isolada validou sete requisições HTTP locais. Isso resolve o bloqueio registrado em `n26-comercial-revisao-release-bloqueio-build-11-11.md`; aquele registro permanece histórico.

## 2. Entrega mínima para revisão/publicação futura

Base: revisão produtiva observada `13f8943471b391bd22e9dd8362f5748653ad9c5b`. Essa base foi consultada no turno anterior; não foi feita nova leitura remota neste bloco. Antes da publicação, conferir se continua sendo a revisão ativa; se mudou, reconciliar novamente sem sobrescrever trabalho alheio.

Exportada cópia somente de leitura dessa revisão, sem arquivos `.env`. Acrescentados apenas estes sete arquivos/deltas:

1. `lib/contratacao/webhook-pagamento.ts`: chamada ao verificador de evento externo após ausência de vínculo.
2. `lib/contratacao/evento-sem-pedido.ts`: verificador conservador somente de leitura.
3. `lib/meta/oauth-state.ts`: constante compartilhada.
4. `app/auth/meta/iniciar/route.ts`: ajuste de import/export.
5. `app/auth/meta/callback/route.ts`: ajuste de import.
6. `scripts/conferir-webhook-sem-pedido.mjs`: 78 casos do handler real isolado.
7. `package.json`: apenas comando novo e inclusão no comando de conferência produtiva da base; não copiado o package completo da QA.

Lockfile, dependências, configurações e demais fontes da base preservados. Nenhum SQL/migration ou mudança de backend faz parte do delta. As diferenças posteriores de QA não foram incorporadas à candidata.

Gerado `release-minimo.patch`, conferido com `git apply --check` e aplicado somente em cópia privada descartável para comparação. As sete fontes resultantes são iguais às testadas após normalizar CRLF/LF; não declarar igualdade byte a byte onde há diferença de quebra de linha. Verificação registrada em `patch-check.json`.

Criado worktree Git legítimo, a partir dessa mesma base, na branch citada na §0. Patch aplicado e comparado com as sete fontes da candidata testada. `git diff --check` aprovado; somente quatro arquivos preexistentes alterados e três novos. Sem commit/push, mudança da branch QA ou merge. A listagem de nomes encontrou apenas `.env.example` versionado, cujo conteúdo não foi lido; nenhum `.env`/`.env.local` operacional foi copiado nem credencial de pagamento utilizada.

## 3. Provas da candidata mínima

**184 testes passaram, zero falhas/skips**, executados na cópia da revisão produtiva mais o delta. Incluem os 78 casos novos, handler de estorno/replay, exceção histórica restrita Sandbox, guards e transporte produtivos, SQL em PGlite descartável, cartão mensal/3DS e eventos financeiros.

Não confundir com os 186 casos distintos aprovados anteriormente na QA: a base produtiva tem duas verificações SQL a menos que o arquivo de testes posterior da QA. Esse arquivo/migrations da QA não foram promovidos para ampliar o release. Os 184 resultados estão integralmente em `testes-financeiros.tap`. O banco mínimo e sua matriz de permissões já têm prova própria no checkpoint de aplicação.

Build completo separado, Next.js 16.2.12/webpack, compilação, tipos de rotas e geração de páginas aprovados, exit 0. Foram processadas 53 páginas estáticas nessa base. Não foi reaproveitado o build da QA para declarar sucesso da candidata.

Execução do artefato compilado, somente loopback e sem credenciais, aprovou:

| Prova | Resultado observado |
|---|---|
| GET `/entrar` | 200, um formulário |
| GET `/contratar` | 200 com not-found transmitido e zero formulários; não é HTTP 404 literal |
| POST `/api/webhooks/asaas-production-payment` | 503 `indisponivel` |
| POST `/api/webhooks/asaas-payment` | 503 `indisponivel` |
| POST `/api/webhooks/asaas-checkout` | 503 `indisponivel` |
| GET `/auth/meta/iniciar`, sem sessão | 307 para entrar |
| GET `/auth/meta/callback`, sem state | 307 para aviso de state e limpeza do cookie original |

Servidor local encerrado e porta fechada após cada ensaio. O uso de `/api/webhooks/` aqui foi em loopback com processamento OFF, antes de banco/provedor; nenhum webhook remoto ou cobrança foi acionado. Os testes financeiros ativos usam módulos reais e fronteiras em memória; o SQL usa dados fictícios locais.

## 4. Evidência e limite

Evidência da candidata: `docs/comercial/release-comercial-minimo-11-11/`, com manifest, patch, prova de reconstrução, TAP, build, metadados, execução HTTP e comparação da worktree. Prova da QA corrigida: `docs/comercial/build-fechado-aprovado-11-11/`.

Comparação com os 805 fingerprints anteriores: somente as duas rotas Meta, handler financeiro e package alterados entre as fontes preexistentes; demais fontes preservadas. Adicionados os módulos/teste já delimitados. Documentos de outros blocos e alterações preexistentes de `docs/decisoes.md` preservados. Nenhum segredo lido; build/runtime não copiaram `.env` nem herdaram credenciais.

Não houve publicação, commit, push, merge, migração, escrita remota, troca de permissões, geração de credenciais, e-mail financeiro, compra, cobrança, assinatura, estorno ou anúncio. Controles remotos não foram alterados nem relidos. Os builds locais com controles ausentes/OFF não são nova medição dos valores privados/configuração de produção.

Próxima prova externa após publicar a revisão fechada e delimitar o ensaio: confirmar estado público/controles, disponibilizar a compra controlada nos limites acordados, Victor realizar o pagamento e conferir fato canônico → evento persistido → e-mail efetivamente recebido → sessão legítima no negócio correto. Nenhuma destas etapas foi marcada concluída pelo build.
