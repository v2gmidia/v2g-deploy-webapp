# Mocks — V2G Webapp

> Registro de todo dado fake/placeholder usado no código, prefixado
> `MOCK_`, conforme regra inegociável nº 4 do briefing.

## Neste PR

**Nenhum.** As duas telas implementadas (`/entrar` e `/inicio`) não usam
nenhum dado fake:

- `/entrar` só tem formulários — nenhum dado é exibido, só coletado.
- `/inicio` mostra `profiles.nome`, lido de verdade do Supabase via
  `lib/supabase/server.ts` — se a busca falhar ou o nome estiver vazio,
  a página cai no texto "Olá, tudo bem!" (fallback de copy, não um mock
  de dado — não há nenhuma constante `MOCK_NOME` ou parecida no código).

Se, no futuro, alguma tela precisar de placeholder antes de a integração
real existir (ex.: uma prévia de dashboard antes de haver métricas reais
vindas do Meta Ads), a constante correspondente deve ser criada com o
prefixo `MOCK_` (ex.: `MOCK_METRICAS_DASHBOARD`) e um novo bloco deve ser
adicionado aqui, explicando o que ela representa e quando deve ser
removida.
