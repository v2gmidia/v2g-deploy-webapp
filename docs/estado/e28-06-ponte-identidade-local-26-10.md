# E28-06 — ponte de identidade humana para geração (local)

## Resultado

O WebApp agora encaminha ao backend de geração o token de sessão do usuário no cabeçalho `Authorization`, além do token de máquina já existente. Antes de chamar o backend, confere `auth.getUser()`, a sessão, o mesmo `user.id` e o negócio ativo. O backend tem um verificador injetável que consulta o Supabase Auth `/auth/v1/user` para obter o `profile_id` verdadeiro. UUID enviado no corpo ou token de máquina não substituem essa prova.

O verificador ainda **não foi injetado em um serviço implantado**. A factory de geração permanece local/default OFF; não houve chamada paga, escrita remota, flag, deploy ou mudança em produção. O backend QA de métricas continua somente leitura, separado desta factory.

## Arquivos

- WebApp: `lib/backend/cliente.ts` aceita credencial humana somente por opção explícita; `lib/criativos/geracao/backend-da-sessao.ts` exige sessão coerente e encaminha o JWT; harness e teste em `scripts/test-utils/fila-geracao-local.mjs` e `scripts/conferir-dispatch-real-webapp-local.mjs`.
- Backend: `src/api/geracao_identidade.py` implementa a validação contra Supabase Auth; `tests/integracao/geracao_fila_bridge.py` usa Auth fictício local em vez de confiar em header UUID; `scripts/conferir_fila_geracao_local.mjs` envia os tokens fictícios correspondentes; `tests/unit/test_geracao_identidade.py` cobre token ausente/inválido, papel, falha de rede e URL sem segredo.

## Prova e limite

No ensaio integrado local, sessão fictícia válida conserva o mesmo pedido/job e resultado; sessão ausente bloqueia antes de HTTP e token humano inválido recebe recusa do backend sem criar job ou chamar o provider substituído. O endpoint Auth e os pixels do provedor foram simulados em memória: **não provam autenticação remota nem imagem feita por IA**.

Verificação: 6 casos no dispatcher real local, 27 casos dos ensaios de integração/leitura legados após atualização da sessão fictícia, 3 testes unitários da nova fronteira, `pnpm typecheck`, `ruff check`, `mypy src` e suíte unitária backend completa (**2889 passaram, 9 pulados**). `git diff --check` passou. O primeiro passe da suíte encontrou os dois scripts de ensaio antigos que ainda mandavam um header UUID; depois de atualizá-los para o Auth fictício, os dois casos passaram e a suíte inteira foi repetida verde. `make` não está instalado neste PowerShell; a mesma suíte foi executada pelo Python da `.venv`.

Continuam necessários, em blocos separados: fonte persistente e autorização dos três materiais por negócio/pedido; ambiente gravável isolado de geração e schema/outbox/bucket; injeção do verificador com URL/chave pública do projeto correto; teste autenticado com dois usuários/negócios no QA; e piloto pago nominal de uma imagem com teto aprovado. Não ativar submissão apenas porque esta ponte local passou.
