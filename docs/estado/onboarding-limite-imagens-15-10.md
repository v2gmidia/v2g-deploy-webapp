# Limite de imagens da marca — 15/10/2026

## 0. Dependência humana

Conferir os envios pela interface autenticada do QA depois da publicação pelo Victor. O limite em pedidos simultâneos ainda não é garantido pelo banco; duas abas podem ler a mesma contagem antes de gravar. Resolver isso exigirá mecanismo transacional e autorização específica se envolver migration.

## Problema encontrado

Dois caminhos de envio tratavam contagem desconhecida como zero: as fotos de identidade em `lib/identidade/armazenar.ts` e as imagens adicionais do onboarding em `app/(fluxo)/onboarding/marca/variacoes-actions.ts`. Uma falha na consulta poderia permitir um envio sem conferir o limite.

## Alteração local

Ambos agora recusam o envio quando a contagem volta com erro ou sem número. A mensagem orienta a tentar novamente; nenhum arquivo é enviado antes dessa verificação. Os limites existentes permanecem 10 fotos de identidade e 6 imagens adicionais da marca.

## Verificação

`pnpm typecheck` e `git diff --check` passaram em 15/10/2026. Não houve upload real, escrita no banco, migration ou deploy. A correção cobre falha de leitura, não concorrência entre dois envios simultâneos.
