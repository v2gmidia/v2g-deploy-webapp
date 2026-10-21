# Criativos — caminho da marca no pré-voo da geração (20/10/2026)

## §0. Depende de Victor e da integração

- Ainda não há fluxo autenticado de geração: faltam consentimento persistido e revogável por imagem/finalidade, negócio piloto, referências e documento de nicho conferidos, provedor e teto de custo autorizados.
- O teste local não comprova que o bucket privado, a sessão, a RLS ou o gerador rejeitam o arquivo. QA com dois negócios e caminhos reais continua pendente, sem uso de material privado nesta rodada.

## Fato observado

- `lib/criativos/briefing-geracao.ts` conferia `material.businessId`, tipo e autorização, mas aceitava qualquer `caminhoPrivado` não vazio. Assim, um metadado com o negócio correto e caminho de outro negócio poderia entrar no briefing entregue ao futuro adaptador.
- `lib/criativos/selecionar-marca.ts` já limita sua seleção a `identidade/{businessId}/`; esta rodada adiciona uma segunda trava no pré-voo, sem presumir que todo futuro chamador usará o seletor.

## Feito neste bloco

- O pré-voo exige que logo e fachada apontem para `identidade/{businessId}/` com objeto não vazio e sem segmentos `.` ou `..`. Caso contrário, devolve as pendências já existentes `logo_nao_autorizado` ou `fachada_real_ausente`.
- A fixture sintética passou a usar o caminho privado atual. Foram acrescentados cenários de caminho de outro negócio e ambíguo para logo e fachada.
- Nenhuma imagem foi aberta, assinada, enviada ou gerada. Nenhum dado real, configuração externa, migração, Meta ou deploy foi alterado.

## Testes e limite

- `node --test scripts/conferir-briefing-geracao.mjs`: 11/11 passaram.
- `pnpm typecheck`: passou. `pnpm conferir:criativos`: 30/30 passaram.
- A validação do prefixo é defesa local; a futura rota ainda deve conferir sessão, posse do negócio, autorização vigente e caminho diretamente na fonte antes de ler ou transmitir o arquivo.
