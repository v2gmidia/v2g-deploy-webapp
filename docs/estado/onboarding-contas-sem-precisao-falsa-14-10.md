# Etapa 04 — três contas sem precisão inventada, 14/10/2026

## 0. Aberto

- Conferir após publicação manual no QA o percurso com ticket exato, ticket em faixa, custo conhecido, custo desconhecido e retomada. O ensaio local não prova o comportamento hospedado.
- O número médio de ticket ainda pode ser derivado internamente de uma faixa para o cadastro legado. Este bloco impede que esse ponto médio produza novo custo ou margem na interface e na action; a mudança de todo o modelo de perfil exige revisão própria.
- As estimativas “sobra quase tudo/metade/pouco” ainda usam percentuais fixos quando o ticket é exato e dependem da confirmação visível do cliente. Conferir se essa aproximação é útil no teste guiado com Victor.
- Etapas 03 e 04 continuam abertas; marca, agenda e prova autenticada ainda faltam.

## Trabalho local

- Um ticket informado em faixa aparece como faixa na tela. Seu ponto médio não gera custo médio nem margem para as outras duas perguntas.
- Quando o ticket está em faixa, o custo fica para a conversa com o gestor; a action também recusa tentativas antigas de gravar um custo calculado desse ponto médio. A resposta “não sei” segue disponível.
- A terceira conta deixou de converter preferências como “quero crescer” em valores financeiros arbitrários. Aceita valor em reais com confirmação ou registra a lacuna para o gestor. Os registros históricos não foram apagados.

## Conferências

- `pnpm typecheck`: passou.
- `node --test scripts/conferir-onboarding-preservacao.mjs`: 69/69 passaram, inclusive recusa de cálculo sobre faixa e preferência abstrata.
- `git diff --check`: passou, apenas com avisos de finais de linha.

Nenhum commit, push, deploy, migração ou escrita na Meta foi feito neste bloco.
