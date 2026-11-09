# N26 — U6 aplicada e verificada somente no QA — 08/11/2026

## 0. Resultado e próxima etapa

**U1–U6 concluídas no QA no escopo dos pacotes revisados.** U6 aplicada uma única vez às **23:24:41 BRT de 08/11** (02:24:41 UTC de 09/11), com backup privado anterior. Conferência final às **23:27:27 BRT**. Sem produção, pagamentos, assinatura, e-mail, Meta, configuração ou deploy.

**`pnpm conferir` completo passou (exit 0)** depois da aplicação. Antes dela, a mesma suíte parava corretamente nas duas funções ausentes da U6. O conferidor não foi afrouxado. Isso não transforma a suíte em homologação funcional, build atual ou prova de produção.

Próximo ato concreto: Victor preparar/atualizar a branch **QA (maiúscula)** com a base atual e a candidata, fazer seu commit/push **nessa branch** e acompanhar a publicação no projeto isolado QA; depois ensaiar M1/M2 com as identidades próprias do cliente Piligrin e do Cauã. A conferência posterior `n26-destino-push-qa-08-11.md` mediu que a `main` publica produção automaticamente e que a QA local está 27 commits atrás. Portanto, **não está liberado push na main neste bloco QA**. Não houve commit, push, merge ou deploy pelo agente. Roteiro funcional: `docs/handoffs/n26-m1-m2-publicacao-manual-qa-08-11.md`. O aplicativo QA publicado ainda usa consumidores antigos; schema concluído não os atualiza.

O Dúú já está escolhido e vinculado. A BM foi conferida diretamente e a mensagem ao Cauã entregue; teto mensal e peça aprovada da rodada ainda precisam de confirmação, conforme `piloto-duu-bm-conferida-08-11.md`. Não é necessário repetir a escolha do piloto nem exigir nova compra.

## Autorização e alvo

O Victor autorizou avançar em todas as áreas possíveis. A Central comunicou antes do ato o recorte: concluir revisão, capturar backup privado, aplicar **somente U6 no QA**, conferir e parar antes de homologação/publicação/produção. O preparador 01/02 e o revisor 07/08 não aplicaram DDL.

Projeto único de SQL: `zskpijnqgkqwxksqmzmf`, **v2g-webapp-qa**, ACTIVE_HEALTHY, Postgres `17.11.0.003`. Produção não recebeu consultas SQL nem escrita.

## Provas antes do ato

- 28 grupos locais do pacote aprovados; 8 testes da fonte corrigida passaram também na execução independente da Central.
- Revisão independente 07/08 encerrada sem impedimento concreto, vinculada aos 28 hashes finais.
- Central conferiu os 127 selos anteriores e os 28 U6: **155 íntegros**.
- `u6-conferir-pre.sql` passou no QA em transação somente leitura; PRE atual continha os **49 pares version/name** esperados.
- Captura atual de catálogos incluiu as sete definições financeiras completas, atributos/ACL e dependências; não leu linhas de pedidos/clientes/Auth/Vault nem payloads/IPs reais.

## Aplicação e resultado real

Canal: `apply_migration`, tentativa única, retorno `success=true`. Nome: `qa_reconciliacao_u6_eventos_readiness_20261108`; versão registrada **`20261109022441`**.

- `u6-verificar.sql` passou em somente leitura.
- PRE/PÓS reais comparados por `conferirRecibos(pre,pos,'apply')`: **ok=true**, fase apply, nove objetos backend protegidos.
- **49 → 50 entradas**, exatamente uma nova nominal; todos os 49 pares anteriores preservados.
- Delta exato e contexto fora dele iguais. Bigints históricos continuam texto; nenhuma correção manual do ledger.
- Readiness estrutural retornou **1 sob service_role**, em transação somente leitura. Não foi chamada nenhuma RPC de aprovação, evento financeiro, reserva de assinatura, rate limit de negócio, e-mail ou provedor no QA.
- Os 155 selos e os 35 arquivos iniciais do backup foram relidos e permaneceram íntegros depois do ato.

O delta instala dois helpers, atualiza sete corpos financeiros e o CHECK de eventos. Os grants declarados são no-op sobre as ACLs medidas; privilégios legados não foram ampliados nem removidos por conveniência. A correção mínima da fonte readiness exige cada uma das 23 permissões necessárias e fecha a brecha de acesso por coluna; o teste do repositório acompanha a fonte.

## Backup privado e hashes

Diretório fora do repositório: `C:/Users/victo/.codex/private-backups/v2g/qa-schema/U6-20261109T022255Z`.

45 arquivos ao fechar, incluindo SQL/fontes aceitos, PRE/PÓS atuais, sete definições completas, autorização/alvo, tentativa, revisão, comparação e auditorias. Herança bloqueada; apenas Victor e SYSTEM. É backup de **metadados**, não cópia de dados financeiros ou de clientes. Releitura integral e hashes conferidos antes e depois.

| Artefato | SHA-256 |
|---|---|
| Aplicação | `cc0c8961308b38477218ec64ec366b59454dbafe522eb9e0856d9fe80384e2cd` |
| Retorno, não executado | `abb3812c77ce1fa01591dc3afab3aadac47fcf505ef20d37f9d5aeabf3e1c648` |
| SHA256SUMS U6 | `9905bef1f6b6d65be0585b2591687705877e962ade9096e9ab8fd0a660acb0d3` |
| PRE privado | `adf39b502eab99c6d35478bb538be6c16086aa97e88b9903305ae963614dec07` |
| PÓS privado | `a5be441b093650f9ae6e811d262eeb2851577db24f8ec7faa7f992fc1d80be07` |
| Auditoria final privada | `f84a5dc13752cf1dc81d50bb2a283b7c0b4c420cf6addfeddb5f5cd5042ec06c` |
| Hashes finais privados | `0ffac7bbb0017f9693a271b2b84d8ab966adf5d00991ff1e2a84b3a348355a22` |

O pacote selado U6 continua registrando sua preparação; este documento posterior registra o ato. Não se reescreveram os pacotes históricos para mudar seu estado declarado.

## Validação de código e limites

- Falha R1 de sessão da U5 corrigida localmente nas páginas públicas de acesso contratado e interna de Pedidos; cinco casos novos, 13 com regressão histórica, typecheck aprovado.
- Central registrou `conferir:sessao-contratacao` no `package.json` e na suíte padrão. O novo comando passou; depois a suíte padrão completa passou com ele.
- `git diff --check` exit 0. Avisos de normalização LF/CRLF nos três arquivos de fonte não foram tratados como defeito de execução nem motivaram mudança de selos. Nenhum Git de escrita.
- Os 179 testes locais de M1/M2 foram medidos pelo 05/06; continuam separados das provas autenticadas reais e da suíte padrão. Candidata e limites: `n26-m1-m2-consumidor-qa-piloto-08-11.md`.
- Build novo não executado neste recorte; nenhum servidor compartilhado foi interrompido.

Advisors de segurança PRE/PÓS coincidem por nome/nível/identidade: 32 INFO de RLS sem policy, 3 WARN de SECURITY DEFINER público, 3 WARN de SECURITY DEFINER autenticado e 1 WARN de proteção de senha vazada. Não se ampliaram permissões ou alterou Auth para retirar avisos. Referências de remediação: [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [SECURITY DEFINER público](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

O retorno conservador **não foi executado**. Ele pode recusar histórico financeiro utilizado, inclusive legado; não apaga registros nem desfaz cobranças/assinaturas/efeitos externos. Não há prova de concorrência multissessão, HTTP/JWT, Storage, 3DS bancário, e-mail entregue ou fluxo real de compra. Readiness=1 comprova o contrato estrutural examinado, não conta externa/configuração/pagamento ou liberação do checkout.

Bloco encerrado após conferência QA. Homologação funcional, publicação QA manual e operação assistida permanecem atos seguintes concretos; produção e gasto não foram liberados por este resultado.
