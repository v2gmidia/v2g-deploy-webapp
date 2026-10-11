# Corrigir a região de atendimento no onboarding — 11/10/2026

## 0. Pendência de prova

- Verificar a gravação autenticada e a RLS da função de limpeza quando o QA voltar. O Supabase de QA está pausado e não foi acessado nesta sessão.

## Correção local

Ao trocar uma resposta por chip da pergunta “De onde vêm seus clientes?” por texto livre, o formulário substituía a frase, mas deixava no cadastro a cidade e o raio numérico derivados da escolha antiga. Esses campos podiam influenciar preparação e segmentação como se ainda fossem a resposta atual.

Se cidade e raio ainda coincidem com a escolha anterior, a ação agora usa a função existente `esvaziar_campos_do_cliente` para limpar coluna e procedência antes de gravar a nova frase. Valores divergentes corrigidos em outra tela são preservados. Falha de limpeza não marca a resposta como salva; se o JSON falhar após a limpeza, a repetição conclui a troca sem inventar cidade ou raio. A ação também rejeita origem desconhecida e ignora `cidade` enviada fora da escolha por chip dessa pergunta.

Não houve migration nem inferência de geografia a partir do texto livre. A limpeza e a gravação do JSON são duas operações; uma falha entre elas deixa a pergunta antiga visível até a repetição.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 42/42, incluindo troca chip → texto, correção posterior, falha da limpeza e retomada após falha do JSON.
- `pnpm typecheck` e `pnpm build`, com o servidor de desenvolvimento parado: passaram.
- Os testes usam banco simulado; não provam interface autenticada ou persistência real.
