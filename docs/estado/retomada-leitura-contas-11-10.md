# Retomada após erro de leitura em contas do onboarding — 11/10/2026

## 0. Pendência

Percorrer a tela com sessão autenticada e persistência real quando o QA estiver disponível. O projeto de QA está pausado; este bloco foi verificado apenas no código local e com cliente de banco simulado.

## Falha e correção

A ação pode gravar a resposta de custo ou reabrir o campo e, em seguida, falhar ao consultar o estado atualizado. Nessa situação ela retorna sucesso sem `estado`. A tela antes exibia “Não conseguimos salvar”, embora a gravação pudesse ter ocorrido, incentivando uma segunda tentativa.

Agora a tela distingue falha de gravação de falha de atualização. Após sucesso sem estado, informa que a resposta foi salva mas não pôde ser atualizada, oferece **Recarregar** e impede novo envio enquanto a tela estiver desatualizada. A ação do servidor mantém o resultado verdadeiro; não presume falha ou sucesso de uma gravação ambígua.

## Verificação

- `node --test scripts/conferir-onboarding-preservacao.mjs`: 47/47, incluindo gravação e reabertura seguidas de erro na leitura.
- `pnpm typecheck`: passou.
- `pnpm build`, com servidor de desenvolvimento parado: passou.
- Interface autenticada, Supabase QA e comportamento do navegador após recarga: não verificados.

Nenhum deploy, migration ou alteração externa foi realizado.
