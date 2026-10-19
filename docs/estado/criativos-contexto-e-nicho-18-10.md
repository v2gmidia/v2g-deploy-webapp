# Criativos — base central e modelo de nicho (18/10/2026)

## §0. Depende de Victor

- Escolher o primeiro nicho/negócio piloto, materiais autorizados e teto de custo para qualquer chamada paga de análise ou geração. O modelo de nicho **não** foi preenchido com um cliente real.
- Validar juridicamente a troca do canal formal de aprovação de e-mail para aplicativo antes de operação real. A decisão de produto foi registrada em `docs/decisoes.md`, mas o contrato e a trilha de auditoria no app não mudaram.
- Aprovar separadamente o próximo bloco de código, eventual migration, configuração externa, deploy e qualquer escrita na Meta. Esta aprovação de planejamento não equivale a essas autorizações.

## O que foi feito

- Reconciliada em `docs/decisoes.md` a decisão mais recente: app como canal principal de aprovação explícita; e-mail complementar; sem publicação automática.
- Criado `docs/criativos-base-central.md`: proveniência dos dados, limites de cada fonte, ordem de decisão, papel do Jev e portas de avanço.
- Criado `docs/criativos-modelo-nicho.md`: estrutura versionável para o primeiro nicho sem congelar o catálogo vivo ou inventar padrões de sucesso.
- Conferida a documentação oficial da TypeSafe: imagens entram em perguntas do System One, mas o fornecedor as declara experimentais e exige ativação explícita por requisição. Isso corrige a hipótese anterior de que Jev não podia receber imagens. Não foi feita chamada à API.

## Evidência e limites

- `lib/jev/typesafe.ts` contém piloto de classificação textual de pendências, não classificador de anúncios. `lib/backend/nichos.ts` lê o catálogo vivo. `lib/identidade/armazenar.ts` usa arquivos privados de marca por negócio. A migration local `20261009034500_fila_revisao_criativos.sql` descreve a fila de revisão de peça pronta, sem versões geradas nem aceite formal no app.
- A documentação produzida é desenho técnico e operacional; não comprova coleta da Biblioteca/Pinterest, acurácia do Jev, geração de imagem, custo, resultado de anúncio, QA autenticado ou instalação de migration.
- Não houve alterações de código, banco, ambiente, serviço externo, publicação ou commit neste bloco.

## Próximo bloco proposto, não executado

Com aprovação específica, escolher um caso piloto e completar um documento de nicho real; depois testar coleta autorizada e classificação de uma amostra pequena, rotulada por humano, com teto de custo. A persistência do resultado da análise de peça pronta e o fluxo de geração são blocos separados, com critérios de aceite próprios.
