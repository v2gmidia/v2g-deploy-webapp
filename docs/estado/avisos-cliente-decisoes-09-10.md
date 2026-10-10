# Avisos do cliente — separação do rastro operacional (09/10/2026)

## Observação em interface

Na sessão autenticada do WebApp principal, `/inicio` mostrou no cartão “Enquanto você dormia” a frase `nao_encontrado (404): Não encontramos esse item. Ele pode ter sido removido.`. A ficha do gestor continuou consultável na mesma sessão. O código de `app/(protected)/ativar-campanha/actions.ts` grava falhas operacionais em `decisions` com `status = failed`, `needs_review = true` e a mensagem técnica no `payload.mensagem`; a tela buscava a última linha de qualquer tipo e exibia essa mensagem. A correspondência com a linha específica do banco não foi consultada, portanto a origem exata da linha vista na interface permanece inferida do formato e do código.

## Ajuste local

- `/inicio` lê somente `classification` e `diagnosis` concluídas, sem revisão pendente, do negócio ativo. Se a leitura falha, informa indisponibilidade em vez de declarar ausência de dados.
- `/alertas` aplica a mesma lista de tipos visíveis ao cliente; o histórico exige estado concluído. Tentativas, recusas e falhas da operação ficam registradas para diagnóstico sem aparecer nas telas do cliente.
- O cartão do início deixa de prometer decisões automáticas sobre verba ou pausa de campanha. A primeira publicação continua manual com o gestor.

## Prova e limite

`pnpm conferir:inicio` (39/39), `pnpm typecheck` e `pnpm build` passaram com servidor dev parado. O problema foi visto na interface **antes** do ajuste; não há deploy deste código, então a correção ainda não foi verificada na interface publicada. Nenhuma linha de banco foi alterada. O FigJam de outubro foi consultado, mas a API de edição do plano Starter atingiu o limite; esta correção local ainda não está marcada no quadro.
