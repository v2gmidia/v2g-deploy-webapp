# WebApp — ponto de passagem em 05/10/2026

Leitura local para o próximo trabalho no WebApp. Este registro não confirma o estado da produção.

## Estado conferido

- `main` em `0068a21`, sem alterações locais antes deste registro. O commit de 05/10 já contém a consulta de fichas em `/revisar-perfil` e a preservação dos outros blocos do JSON de onboarding ao salvar o bloco 1. Portanto, não aplicar novamente `entrega07-fichas/fichas-operador.patch`.
- A ficha é somente de leitura, para operador, inclui negócios completos e incompletos nos registros retornados. A consulta declara seu recorte; não é armazenamento completo de leads, conversões ou campanhas.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-ficha-operador.ts`: 11/11 em 05/10. `node scripts/conferir-onboarding-preservacao.mjs`: 15/15. `pnpm typecheck` com o binário do runtime Codex: passou. Não houve teste logado, build ou consulta ao banco nesta passagem.
- O onboarding real termina o bloco 1 em `/onboarding/contas`; ao terminar o bloco 2, a continuação para o visual da marca está desabilitada em `Contas.tsx`. O onboarding v4 continua na bancada `/exemplo`, segundo `docs/HANDOFF.md` §9 e o código atual.
- Existe tela de operador para ativar/pausar uma campanha que já está em `execucoes.campanha_meta`, mas isto não equivale ao fluxo completo decidido de reunião, publicação manual do primeiro criativo, solicitação posterior, alerta ao gestor e aviso ao cliente. Compra self service e assinatura também não aparecem implementadas no WebApp atual (`conta/page.tsx`, `verba/page.tsx`).

## Decisão atual do Victor

Onboarding concluído deve levar à escolha de data e horário da reunião com o gestor. Na reunião, acessos e primeiro criativo são definidos, inclusive a possibilidade de aproveitar conteúdo do Instagram. O gestor publica a primeira campanha manualmente. Depois, o cliente envia criativos pelo app; o gestor recebe alerta, analisa, publica, marca “no ar” e o cliente é avisado. Google Calendar é preferência, não integração aprovada. Preço não definido. Não atribuir estado “no ar” só à publicação: usar evidência da plataforma conforme `lib/veiculacao/estado.ts`.

## Próxima entrega, pela ordem de outubro

Plano de execução: depois da inspeção da jornada (05–06/10) e da consulta de fichas (07–12/10, parte já em código), vem **validar fluxo e campos do onboarding (08–12/10)** antes da implementação do onboarding automático (13–19/10) e do agendamento (19–20/10). A próxima sessão deve comparar o onboarding real, a bancada v4, o contrato de cadastro no backend e a decisão acima; listar campos obrigatórios, estados, destino final, dependências e divergências com evidência `arquivo:linha`. Preparar um recorte de implementação com critérios de aceite e testes. Não escolher provedor de calendário, preço, nem prometer compra ou publicação automáticas por inferência.

Seguir `AGENTS.md`: apresentar o mapeamento e aguardar aprovação para implementar. Sem commit, push, migration, Meta ou deploy pelo agente.
