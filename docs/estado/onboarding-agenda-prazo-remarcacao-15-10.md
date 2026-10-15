# Etapa 04 — prazo de troca da reunião

## 0. Aberto

- A agenda própria segue desativada até configuração e ensaio autenticado no QA. O link público antigo do Google permanece sem trava por CNPJ.

## Achado

`lib/agenda/regras.ts` já definia remarcação até 25 minutos antes do início, mas o botão de cancelar da agenda própria não aplicava essa regra. Cancelar liberava outra reserva mesmo depois do prazo.

## Ajuste local

- A ação do servidor confere o horário real conciliado com o Google antes de cancelar. A partir de menos de 25 minutos para o início, mantém a reserva ativa.
- A tela oculta a troca de horário quando o prazo terminou e orienta a avisar a equipe em caso de ausência. A conferência do servidor continua valendo se a tela ficou aberta e passou do prazo.

## Conferência

- `pnpm typecheck` passou.
- Cinco testes locais das regras de agenda passaram, incluindo o limite exato de 25 minutos.
- `git diff --check` passou com avisos de fim de linha do Windows.

Não houve evento criado/cancelado, envio, alteração de banco, commit, push ou deploy.
