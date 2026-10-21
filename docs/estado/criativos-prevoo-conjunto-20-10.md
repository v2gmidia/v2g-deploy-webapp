# Criativos — pré-voo conjunto da geração (20/10/2026)

## §0. Depende de Victor e da integração

- O pré-voo é local e puro. Para uma geração real ainda faltam: negócio e materiais piloto autorizados, consentimento persistido e revogável, documento de nicho preenchido e conferido, referências admissíveis, provedor, teto aprovado, reserva transacional, registro de tentativa e QA autenticado.
- Nenhum resultado desta rodada autoriza gasto, upload ao gerador, publicação ou afirma que a etapa 06 está pronta. A futura rota deve conferir sessão, posse do negócio e fontes originais imediatamente antes do uso.

## Fato observado

- Seleção de marca (`lib/criativos/selecionar-marca.ts`), briefing (`lib/criativos/briefing-geracao.ts`) e limite de custo (`lib/criativos/porta-geracao.ts`) existiam como decisões locais separadas, sem um chamador único. O uso futuro poderia compor entradas com IDs de negócios diferentes ou ignorar um dos portões.

## Feito neste bloco

- `lib/criativos/prevoo-geracao.ts` encadeia as três decisões na ordem: conferir mesmo negócio, selecionar logo/fachada autorizados, montar briefing com contexto e referência rastreáveis, avaliar teto de custo. Falha retorna a etapa e as pendências; sucesso entrega briefing e saldo **projetado**, sem ler arquivo ou chamar provedor.
- Um teste sintético percorre o sucesso e quatro bloqueios: negócio divergente, falta de autorização da fachada, referência inadmissível e teto da chamada desconhecido.
- Não houve leitura de material privado, consulta de banco, migração, chamada paga, alteração externa, Meta ou deploy.

## Testes e limites

- `scripts/conferir-prevoo-geracao.mjs`: 5/5 casos passaram. O conjunto com os três conferidores existentes passou sem falhas; `pnpm typecheck` passou.
- O teste não prova sessão, RLS, persistência, reserva atômica, qualidade visual nem custo medido. A composição local não está ligada ao aplicativo.
