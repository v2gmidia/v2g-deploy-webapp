# Etapa 04 — portão da reserva no servidor

## 0. Aberto

- A agenda própria ainda está desativada. Falta configurar e testar no QA autenticado; a página pública anterior do Google continua sem a regra de reserva única por CNPJ.

## Achado

A página de conclusão só oferecia a agenda depois de verificar o onboarding, mas `reservarHorarioAction` não repetia essa verificação. Uma chamada direta da action ou uma aba antiga poderia tentar reservar antes de terminar as perguntas, contas e marca.

## Ajuste local

- O contexto da reserva agora lê as colunas usadas por `estadoDaConclusao`, além do documento de onboarding.
- A action de reservar exige o mesmo veredito de conclusão da página antes de consultar horários ou criar a reserva. Leitura e cancelamento de uma reserva já existente continuam disponíveis se as respostas forem posteriormente editadas.

## Conferência

- `pnpm typecheck`: passou.
- `node scripts/conferir-conciliacao-agenda.mjs`: 13/13 simulações passaram. Elas não executam a action com Supabase e Google reais.
- `git diff --check` do arquivo alterado: passou com aviso de fim de linha do Windows.

Nenhuma reserva, evento, migração, commit, push ou deploy foi feito.
