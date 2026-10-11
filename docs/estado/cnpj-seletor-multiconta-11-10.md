# CNPJ no seletor multiconta — 11/10/2026

## 0. Dependência humana

- Falta percorrer a interface autenticada com dois CNPJs e um pedido aprovado cujo vínculo por e-mail ainda não foi gravado em `buyer_profile_id`. O Supabase de QA está pausado.

## Defeito e correção local

A lista de negócios pode liberar um pedido aprovado com e-mail verificado mesmo quando `buyer_profile_id` ainda é nulo. A tela `/escolher-negocio` buscava CNPJ somente pelo perfil já gravado no pedido; assim, um negócio liberado podia aparecer sem seu CNPJ, dificultando distinguir empresas de mesmo nome.

A consulta agora examina apenas os IDs previamente liberados, exige pedido aprovado e confirma que o e-mail do comprador corresponde ao e-mail verificado da sessão e que o perfil do pedido está vazio ou é o perfil atual. Pedidos de outro comprador, de outro negócio ou sem e-mail verificado não fornecem CNPJ à tela. Falha de consulta mantém a escolha indisponível, como antes. Não houve vínculo, compra ou alteração de banco nesta sessão.

## Provas e limites

- `pnpm conferir:multiconta`: 13/13, incluindo pedido aprovado ainda ligado só por e-mail, comprador alheio e e-mail não verificado.
- `pnpm typecheck` e `pnpm build`: passaram com o servidor local parado. `git diff --check`: sem erro de whitespace.
- `pnpm conferir` foi iniciado, mas parou em `conferir:migrations`: a consulta de leitura ao Supabase retornou `ENOTFOUND` com o projeto pausado. Nenhuma migration foi aplicada; a suíte geral não recebeu veredito completo e não será repetida enquanto QA estiver indisponível.
- Somente código local; interface autenticada, QA e produção não verificados.
