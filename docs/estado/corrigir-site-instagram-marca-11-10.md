# Corrigir site e Instagram no onboarding — 11/10/2026

## 0. Pendência de prova

- Verificar em interface autenticada e persistência real quando o ambiente de QA estiver disponível. Não acessei o Supabase pausado nesta sessão.

## Correção local

O cliente conseguia preencher ou trocar site e Instagram na etapa da marca, mas não retirar um endereço antigo. Marcar “Não tenho site” era bloqueado quando já havia URL salva; apagar o Instagram no formulário também preservava o valor anterior no banco. Isso deixava o perfil incoerente com a resposta atual.

A etapa agora permite marcar “Não tenho site” e apagar um Instagram antigo. Usa a RPC existente `esvaziar_campos_do_cliente`, que apaga a coluna e sua procedência na mesma operação sob a RLS do cliente. O bloco da marca é gravado só depois da limpeza; erro não retorna sucesso e uma tentativa posterior retoma. Desmarcar “Não tenho site” restaura o endereço carregado na tela para evitar perda acidental. A remoção do Instagram é inferida do campo vazio, cujo rótulo já o declara opcional.

Se o cliente apagar o endereço do campo, mas deixar “Não tenho site” desmarcado, a ação pede uma das duas escolhas. Antes ela podia responder sucesso preservando silenciosamente o endereço antigo.

Não houve migration nem acesso a banco. Uma falha entre a limpeza das colunas e a gravação do JSON deixa a etapa incompleta até a repetição; as duas gravações não são transação única.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 38/38, incluindo retirada de site e Instagram, entrada vazia sem declaração de ausência, falha da limpeza e repetição após falha do JSON.
- `pnpm typecheck`, `pnpm build` (com dev parado) e `git diff --check`: passaram.
- O teste é isolado com banco simulado; não prova a RLS nem a interface autenticada.
