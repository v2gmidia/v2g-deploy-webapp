# Transições das contas do onboarding — 11/10/2026

## 0. Dependência humana

- Percorrer as três contas na interface autenticada quando houver ambiente de QA. Nenhuma escrita no Supabase ocorreu neste lote.

## Defeito e correção local

A tela não oferece “não sei” para o ticket e só mostra a confirmação de custo ou lucro depois de salvar uma estimativa. A ação de servidor, porém, aceitava “não sei” forjado para ticket e confirmação direta de custo/lucro sem estimativa anterior. Como uma Server Action pode ser chamada fora do botão, esse caminho poderia registrar uma resposta que o cliente não viu.

A ação agora recusa “não sei” para ticket, confirmação do ticket, confirmação de custo/lucro sem estimativa não confirmada e envio simultâneo de “não sei” com confirmação. Mantém a retomada normal: estimar, mostrar em reais e confirmar ou ajustar.

## Verificação e limite

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 45/45; ações reais executadas com transporte local simulado e rede bloqueada. Inclui tentativa forjada, ausência de escrita após rejeição e confirmação após estimativa.
- `pnpm typecheck` e `pnpm build`: passaram com o servidor local parado.
- Persistência real, interface e RLS não verificados enquanto QA está pausado.
