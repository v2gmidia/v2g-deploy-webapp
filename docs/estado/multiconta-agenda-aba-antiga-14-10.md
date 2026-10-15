# Etapas 03 e 04 — reunião aberta em aba antiga, 14/10/2026

## 0. Aberto

- A agenda própria ainda está desativada. Quando for configurada, ensaiar no QA com dois CNPJs: abrir a reunião do negócio A, trocar para B em outra aba e tentar reservar ou cancelar pela aba antiga. A operação deve ser recusada, sem criar ou apagar evento.
- Testar também a reserva única por negócio, a confirmação no WebApp e o cancelamento real com o calendário conectado. Os testes locais não substituem essa prova.

## Trabalho local

- A tela de conclusão entrega o ID do negócio que a originou às ações de consulta, reserva e cancelamento da agenda. Cada ação compara esse ID com o negócio atualmente autorizado na sessão antes de ler ou escrever a reserva.
- Antes, reserva e cancelamento recebiam apenas o horário ou nenhum argumento: após trocar o negócio em outra aba, uma tela antiga poderia operar sobre o negócio recém-selecionado. A checagem agora retorna erro de contexto em vez de usar silenciosamente o novo negócio.
- A bancada de desenvolvimento usa um ID fictício para manter a prévia tipada; ela não agenda evento.

## Conferências

- `pnpm typecheck`: passou após ajustar a bancada.
- Testes offline de horário, regras e conciliação: 16/16 passaram.
- `git diff --check`: passou; somente avisos de finais de linha.

Nenhum evento foi criado ou cancelado, e não houve commit, push, deploy, migração ou escrita na Meta neste bloco.
