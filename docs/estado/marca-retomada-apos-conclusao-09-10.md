# Marca: atualização depois da conclusão — 09/10/2026

## Mudança local

- O cliente que concluiu o onboarding com “Ainda não sei” sobre a marca pode voltar a `/onboarding/marca`, escrever a descrição e salvar. Também pode corrigir a descrição, Instagram e site pelos campos já existentes.
- Uma atualização real grava apenas `onboarding.marca` e os campos de perfil alterados; preserva `onboarding.conclusao`, respostas anteriores, contas e blocos futuros. A repetição idêntica não grava de novo. O próximo passo permanece `agendamento_pendente`, sem criar reserva, pagamento ou campanha.
- A tela mostra os campos mesmo depois de concluída e distingue “Salvar alterações” de “Guardar e concluir”. Uma falha de gravação mantém o valor anterior no banco e oferece nova tentativa.

## Verificação e limite

- `pnpm conferir:onboarding-preservacao`: 33/33. Os dois novos casos cobrem “não sei” corrigido depois da conclusão, repetição idêntica e falha de JSON seguida de retomada, sem apagar outros blocos.
- `pnpm typecheck` e `pnpm build`: passaram; não havia servidor dev na porta 3000 no momento do build.
- Não houve sessão autenticada para percorrer a alteração em navegador ou validar a persistência por RLS no banco QA. O teste usa as actions reais com transporte e banco simulados.
