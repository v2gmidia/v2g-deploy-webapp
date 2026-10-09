# Fila de criativos: pendências antes do histórico — 09/10/2026

## 0. Dependência humana

- Conferir a tela `/gestor/criativos` com sessão real de operador e volume representativo antes de considerar a fila validada para operação. A mudança local não foi publicada.

## Correção local

- A consulta anterior limitava os 100 envios mais recentes e só depois ordenava os pendentes primeiro. Com mais de 100 envios novos, uma peça antiga ainda sem decisão desaparecia da fila.
- A tela agora consulta primeiro até 100 peças `awaiting_review`, da mais antiga para a mais nova, e mostra separadamente os 30 itens mais recentes do histórico. Se houver mais pendências que o limite, avisa que a consulta é parcial. O histórico informa seu próprio recorte.
- A alteração é apenas leitura. Não muda status, não envia aviso e não publica campanha.
- A carteira `/gestor` agora abre `/gestor/criativos?negocio=<id>` para cada conta. A fila aplica o filtro no banco às pendências e ao histórico antes de gerar links privados. A carteira mostra a quantidade pendente por negócio somente quando a consulta é completa; se ultrapassar o limite ou falhar, exibe um aviso em vez de inferir zero.

## Verificação e limite

- `corepack pnpm typecheck`: passou.
- `corepack pnpm build`: passou sem servidor dev na porta 3000.
- `corepack pnpm conferir:revisao-criativos`: 4/4 passaram; são testes locais das regras de arquivo e estado, não prova desta consulta no banco.
- `node --env-file-if-exists=.env.local scripts/qa-prioridade-criativos.mjs`: passou no Supabase QA nomeado. Criou uma pendência antiga e 101 envios mais novos de histórico; a consulta anterior ocultou a pendência, enquanto a nova a retornou antes dos 30 itens recentes. O ensaio removeu as fixtures; consulta posterior encontrou zero negócios e zero peças de QA restantes.
- `git diff --check`: sem erro de whitespace; aviso de LF/CRLF do checkout Windows.
- Nesta continuação, `pnpm typecheck`, `pnpm conferir:revisao-criativos` (4/4), `pnpm build` (sem servidor na porta 3000) e `git diff --check` passaram. O ensaio QA foi ampliado com um segundo negócio e provou que o filtro do primeiro retorna sua pendência antiga, sem trazer a peça do segundo. A fixture inicial do ensaio violou a regra de caminho privado; foi corrigida e a repetição passou com limpeza dos registros sintéticos.
- Não houve sessão autenticada do operador. A ordem e o limite foram provados no banco QA, mas sua apresentação no navegador com esse volume continua sem prova de interface.
