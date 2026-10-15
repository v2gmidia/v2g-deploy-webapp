# Etapa 03 — Página compartilhada por negócio, 14/10/2026

## 0. Aberto

- Conferir no QA autenticado um CNPJ com duas contas de anúncios contratadas: a segunda deve aceitar a mesma Página, e outra Página deve receber recusa clara sem alterar a primeira. Nenhuma chamada de escrita na Meta foi feita aqui.
- Hoje `meta_connections.meta_page_id` é único por negócio (`supabase/migrations/0001_init.sql`). O produto **não** oferece Páginas independentes por conta de anúncios. Se esse caso for necessário, será preciso evoluir o schema compartilhado, a função `registrar_conta_contratada`, o pré-voo, a tela Conta e o publicador, com migração autorizada e teste no QA.
- Os 28 testes offline de multiconta tratam autorização de negócios, não a transação da conta Meta; não afirmar que o fluxo real com duas contas foi provado.
- A checagem da Server Action ocorre antes da RPC e não é uma trava transacional contra duas escolhas simultâneas com Páginas distintas. A proteção definitiva exige validar a Página dentro da própria `registrar_conta_contratada`, sob o bloqueio do negócio, em uma migration revisada e autorizada.
- A suíte completa `pnpm conferir` para em `conferir:migrations`: a comparação com o schema vivo encontrou 20 falhas de objetos/manifesto de migrations anteriores e o projeto não está linkado para ler o ledger. Os testes anteriores de tipo, build e multiconta continuam válidos nos seus respectivos limites; a suíte completa não está verde.

## Achado e ajuste local

- A função `registrar_conta_contratada` (migration `0033`) aceita várias `ad_accounts` no mesmo negócio, mas a cada vínculo atualiza a mesma `meta_connections.meta_page_id`. Uma segunda conta escolhida com Página diferente trocaria a Página usada pela primeira sem aviso. `lib/meta/publicar.ts` lê essa Página global.
- A ação de escolha agora consulta as contas ativas sob a sessão e recusa uma Página diferente quando já há outra conta ativa. A interface informa que a Página é compartilhada.
- Em Conta, quando há mais de uma conta ativa, a troca de Página mostra a limitação e direciona à equipe. A própria Server Action confere a quantidade e recusa a troca; se a consulta falhar, também recusa. Um negócio com uma conta conserva a troca existente.

## Conferências

- `pnpm typecheck`: passou.
- `pnpm build`: passou.
- 28/28 casos offline de autorização multiconta passaram; eles não cobrem esta escrita na Meta.
- `git diff --check`: sem erro de whitespace; avisos de final de linha.

Sem commit, push, deploy, migração ou escrita na Meta.
