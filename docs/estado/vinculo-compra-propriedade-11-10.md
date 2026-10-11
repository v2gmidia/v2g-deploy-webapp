# Vínculo de compra condicionado ao dono do negócio — 11/10/2026

## 0. Dependência humana

- A prova de e-mail confirmado, pedido aprovado e dois CNPJs na interface autenticada segue pendente. O Supabase de QA está pausado; nenhuma conta foi criada ou reivindicada neste lote.

## Defeito e correção local

No primeiro acesso, `vincularComprasAprovadas` tentava reivindicar os negócios por `claim_email`, mas em seguida gravava `buyer_profile_id` em todos os pedidos aprovados com o mesmo e-mail, mesmo se a reivindicação do negócio não tivesse atualizado aquela linha. Isso podia atribuir um pedido ao perfil sem que o negócio pertencesse a ele.

Agora a rotina descarta pedidos já ligados a outro perfil, consulta quais negócios efetivamente pertencem ao usuário depois da tentativa de reivindicação e limita a gravação dos pedidos a esse conjunto. Uma nova tentativa pode completar um vínculo parcial. A trava de acesso existente ainda verifica pedido aprovado e negócio do perfil.

## Verificação e limite

- `node --test scripts/conferir-multiconta.mjs`: 12/12. A rotina de vínculo foi exercitada com cliente de banco simulado: reivindicação parcial, negócio de outro dono, pedido de outro perfil, consulta de propriedade com erro, e-mail não verificado e repetição.
- `pnpm typecheck` e `pnpm build`: passaram com o servidor local parado.
- Não houve teste com banco, RLS, e-mail ou interface autenticada; a operação continua composta de mais de uma consulta e não é transacional.
