# Etapas 03 e 04: suíte local e manifesto da migration

## 0. Pendente de decisão ou ação humana

- A migration `20261015011547_proteger_pagina_compartilhada_multiconta.sql` continua **somente local**. Aplicar no QA exige autorização específica e teste de concorrência com duas contas de anúncios do mesmo CNPJ; não há prova de produção.
- A suíte completa não está verde. O conferidor de migrations lê um banco remoto que não contém vários objetos de migrations antigas nem a RPC alterada pela migration local. O ledger de migrations não está vinculado neste checkout. Resolver essas divergências exige inventário e decisão separados; este bloco não aplica migrations.
- As etapas 03 e 04 ainda exigem publicação pelo Victor e ensaio autenticado no QA; a agenda própria segue desativada.

## O que foi feito

Ao rodar `pnpm conferir`, a sequência passou por TypeScript e pelos conferidores anteriores até parar em `conferir:migrations`. O primeiro resultado tinha 20 falhas, inclusive a ausência da migration nova no manifesto `supabase/objetos.ts`.

Registrei no manifesto a RPC `registrar_conta_contratada` alterada pela migration local e declarei explicitamente os limites do instrumento: trigger, locks, corpo e grants não são provados pelo OpenAPI. A migration não foi aplicada.

## Resultado verificável

- `pnpm typecheck`: passou.
- `git diff --check -- supabase/objetos.ts`: passou, com aviso de fim de linha do Windows.
- `pnpm conferir:migrations`: **21 falhas** após incluir o manifesto. A migration nova saiu da lista de arquivos sem entrada, mas aparece corretamente como RPC ausente no banco consultado, pois ainda não foi aplicada. Sete outras migrations continuam sem entrada no manifesto; há divergências antigas de objetos ausentes. O aumento de 20 para 21 reflete a checagem adicional, não uma alteração no banco.
- A suíte completa parou nesse conferidor; seus passos posteriores não foram executados por esse comando. Conferidores específicos de multiconta e onboarding tinham passado em blocos anteriores.

Sem commit, push, deploy, aplicação SQL ou escrita na Meta.
