# E28-06 — fonte canônica de veiculação em Criativos — 27/10/2026

## §0. Resultado e limite

**Recorte local corrigido.** `pnpm conferir:veiculacao` passou nas **117 conferências**; `pnpm typecheck` passou. O resultado informado pelo Central antes do bloco era de duas asserções reprovadas: frases literais em Anúncios/prévia e uso da data de publicação em Criativos. O conferidor não foi alterado.

**Falta publicação autorizada e conferência autenticada no QA.** Sem commit, push, deploy, migration, escrita externa, chamada paga ou mudança de flag. O bloco de contexto do onboarding permanece separado e preservado.

## Alterações mínimas

- `app/(protected)/anuncios/page.tsx`: mensagem de falha continua dizendo que a consulta falhou e não altera campanhas; passa a falar em “situação atual”, sem escrever uma frase própria de veiculação. Não foi removida a distinção entre backend indisponível e ausência de campanha.
- `app/exemplo/_anuncios/PreviaDeAnuncios.tsx`: usa `fraseDeVeiculacao` com cenário explicitamente fictício, preservando as métricas e itens da bancada.
- `app/(protected)/criativos/page.tsx`: remove a coluna histórica de publicação do tipo, do SELECT e das condições de classificação/associação. `external_ad_id` indica somente um vínculo registrado; o texto não o apresenta como prova de exibição atual. Imagens, registros, notas, estados de revisão, arquivo e histórico continuam no mapeamento. Um registro sem identificador externo não ganha associação pelo tempo passado.
- `app/(protected)/criativos/TelaDeCriativos.tsx`: recebe o `estado.veiculacao` canônico do negócio e mostra `fraseDeVeiculacao` no cabeçalho, com o rótulo “Situação do negócio”. Não projeta o estado do negócio como estado individual de cada criativo. `nao_sabemos` tem frase e permanece visível. Bancadas que não fornecem estado não inventam um padrão.

Publicação histórica não prova exibição presente. Um identificador de anúncio prova o vínculo registrado, não o estado atual. Aprovação/rejeição/arquivamento da peça continuam estados da biblioteca, distintos da situação do negócio.

## Validação e alcance da prova

```text
pnpm conferir:veiculacao
pnpm typecheck
```

Ambos concluíram com código zero. **117/117** no conferidor existente: fonte única, passado versus presente, falha de leitura como desconhecida, vocabulário, frases e varredura de telas. Nenhuma outra suíte foi repetida e nenhum teste novo espelhando a implementação foi criado.

Esta prova é local de regras/varredura/tipos. Não é navegação autenticada, consulta nova à Meta ou comprovação do estado de anúncio real. O trecho de `creatives` antes classificado na biblioteca somente por data, sem identificador externo ou geração, passa pela classificação conservadora de revisão; a linha/arquivo não é apagada. Na homologação, conferir também esse legado para decidir se precisa de vínculo real corrigido.

## Próximo portão

Depois da publicação autorizada, conferir no QA um negócio ativo, um com publicação passada e um com consulta indisponível. Criativos e Anúncios devem concordar com o mesmo estado canônico; nenhum card individual pode ganhar estado ativo a partir de gasto, aprovação, data antiga ou identificador externo isolado. Sem alteração de configuração para fabricar esses estados.

Mudanças simultâneas em anúncios, contexto, onboarding, início e agenda foram mantidas. Índice compartilhado fica para a integração coordenada.
