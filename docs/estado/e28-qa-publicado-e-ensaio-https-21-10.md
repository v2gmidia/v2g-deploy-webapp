# E28 — publicação isolada QA e ensaio HTTPS em 21/10/2026

## Escopo e autorização

Victor informou o deploy do backend e autorizou executar os itens 2–6: conferir leitura, revisar/publicar WebApp, aplicar a migration individual necessária e preparar/executar QA. Este registro substitui apenas o estado de execução dos roteiros anteriores; não transforma QA em produção nem encerra E28-06-C/E28-08-C completos.

## Publicação efetiva

- Projeto Vercel: **v2g-webapp-qa**, `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- URL estável: https://v2g-webapp-qa.vercel.app/criativos.
- Deploy `dpl_FPL7MgKoXR8r5UCFD7HW6hgJqmJs`, confirmado READY e com alias estável.
- Commit remoto **6f94bc03d86ae1755c21b08919072fc1cad93d43**, branch **codex/e28-criativos-leitura-qa**.
- Snapshot de 64 arquivos de criativos/gestor/leitura sobre `4cb5c9557a8efa012349fc29730f827d507c4c68`. Alterações financeiras do working tree compartilhado foram excluídas.
- Nenhum merge na main, publicação no projeto de produção ou alteração de campanha. O commit QA não contém os scripts/checkpoints adicionados depois do deploy nem a migration local não versionada; guardar esses artefatos antes de uma promoção futura.
- Working tree compartilhado preservado; cópia descartável de build em `C:/Users/victo/AppData/Local/Temp/v2g-e28-qa-ad38abd8fccd4cabae4f9917c8b92b61`. Não é worktree Git.

Configuração somente no projeto QA: revisão, trabalho do gestor e leitura de métricas habilitados; autoanálise e pedidos de geração desabilitados. Nenhum segredo existente foi exibido/copiado para relatório nem enviado à Vercel nesta rodada. A conexão do backend QA **não foi configurada**.

## Migration individual, somente QA

- Projeto Supabase confirmado: **zskpijnqgkqwxksqmzmf**. Produção `ushccxpoxjikzqnwhgfd` não recebeu escrita.
- Arquivo: `supabase/migrations/20261021032617_creative_review_upload_intent.sql:3`.
- SHA-256: `d69e2fe4189fdc5b22c785f89f973347ac84b67a925ec776213740f3e40dbe4a`.
- Versão remota: **20261021133718**, nome `qa_creative_review_upload_intent`.
- Preflight salvou definições, constraints, RLS, grants, policies e metadados do bucket em `docs/qa/e28-21-10-fila-preflight.json`. Fila e Storage estavam vazios.
- Snapshot SHA-256: `1d9f417908bf33446c3e7c62ac6f4483bd3c03980722d001b947c9130c4bbc89`.
- `scripts/qa/restaurar-snapshot-fila-21-10.mjs:1` restaurou esse escopo vazio em PGlite descartável e aplicou o SQL exato. Não é backup completo de Auth/Storage/projeto.
- Pós-DDL: JSONB nullable; RLS, policy de leitura própria e ACL preservadas; bucket privado, limite 9437184 bytes e JPEG/PNG. Sem reaplicação de dependências e sem lote de migrations.
- Advisor sem nova ocorrência específica da fila. Avisos gerais preexistentes de funções/segurança de Auth não foram alterados.

## HTTPS autenticado real: 17 verificações passaram

Comando: `node --env-file=.env.local scripts/qa/e28-envio-https-21-10.mjs`. O script carrega a configuração em runtime sem imprimir chaves/senhas/cookies/URLs assinadas. Usa quatro usuários sintéticos, dois negócios marcados fictícios e duas atribuições de gestor.

1. Auth real e carteiras fictícias preparadas.
2. Outro dono não envia para negócio alheio.
3. Falta de confirmação falha sem criar pedido.
4. Upload pela action Next publicada, sem análise paga.
5. Replay idêntico é idempotente.
6. Replay com objetivo alterado é negado.
7. DB e Storage conservam intenção e SHA-256 dos bytes.
8. Storage privado nega download anônimo.
9. RLS nega leitura do pedido por outro dono.
10. Galeria autenticada recupera o pedido.
11. URL assinada emitida pela galeria recupera bytes com mesmo SHA-256.
12. Novo login conserva o pedido na galeria.
13. Galeria de outro dono não expõe o arquivo.
14. Gestor de outra carteira não decide.
15. Gestor correto registra decisão por HTTPS.
16. Uma única tarefa acompanha a decisão, finalizada.
17. Segunda decisão não sobrescreve a primeira.

Rodada final `ba7e9adf-77b4-44d4-9f7c-a4d5cfc84d5b`; pedido sintético `dc7915d2-05f4-4b59-acb2-bd51817ccf9e`; negócio sintético `1ac6abe8-c18b-447a-933f-6ff5b04d5d01`. Removidos somente os objetos/linhas/usuários criados por cada rodada. Sign-out global dos clientes autenticados antes da exclusão dos usuários. SELECT posterior confirmou **0 pedidos, 0 objetos no bucket, 0 usuários e 0 negócios do ensaio**. Esses dados descartáveis não estão disponíveis para recuperar; permaneceu apenas evidência técnica sintética.

Evidência visual adicional: sessão QA já existente renderizou a página publicada; não foi usada para criar pedido. A prova dos 17 passos é HTTPS + Auth + DB/Storage, não interação manual integral pela interface.

## Leitura backend: comprovado e não comprovado

`scripts/qa/e28-leitura-backend-21-10.mjs:1` executou apenas GETs:

- Fingerprint de produção `dbf2611f3b1e` corresponde à entrega backend.
- OpenAPI contém contrato e rota de associação manual.
- Consolidado sem token: **401**.
- Consolidado com autenticação de servidor e IDs fictícios inexistentes: **404**.

Isto **não** prova consolidado 200 com dados, isolamento de carteira via WebApp publicado ou integração de métricas QA. SELECT em produção não encontrou negócio fictício com `profile_id` preenchido; não foi criado dado de teste lá.

Bloqueio concreto: `execucoes` e `metricas_diarias` ausentes no banco QA; inventário Easypanel mostra apenas um backend, de produção. Vercel QA não tinha as duas configurações de conexão ao backend. Não foi copiado segredo de produção nem usado fallback V2G.

A carteira principal também exclui negócios fictícios (`app/(protected)/gestor/page.tsx:39`); eles não foram reclassificados como reais para aparecer na mesa. A revisão foi verificada na rota específica `/gestor/criativos`.

## Validação e limites restantes

- Working tree original: typecheck e build Next passaram.
- Snapshot isolado publicado: typecheck, build Vercel e **125/125** testes direcionados passaram, incluindo contrato canônico de nove cenários.
- Ensaio PostgreSQL da intenção e proteção de schema/ACL também passou localmente.
- `git diff --check`: limpo, somente avisos existentes LF/CRLF.
- Verificação global não ficou verde: conferidor de banco apontou **21 grupos ausentes em QA**; não são 21 migrations aprovadas. Suíte comercial ampla teve **65 passes e 1 falha** na expectativa de integração de alerta na LP (`scripts/conferir-jornada-comercial-portas.mjs:90`), fora deste snapshot. Não foi corrigida por afrouxamento do teste.
- Não medidos nesta rodada: falha parcial remota de Storage com retomada, expiração efetiva de URL, concorrência entre processos, revisão completa de todas as decisões/promoção vencida em HTTPS, geração/refações, publicação Meta/Google, pagamento, email e ensaio integral do evento.

Próximo portão: decidir/provisionar **backend-qa isolado**, conectado ao banco QA, com provedores reais desligados, e reconciliar somente seu schema necessário. Isso é infraestrutura adicional, não mera ativação de flag. Depois repetir leitura 200/contrato/isolações pela mesa autenticada e tratar os portões independentes antes de produção. Não declarar itens 2–6 integralmente concluídos com este recorte.
