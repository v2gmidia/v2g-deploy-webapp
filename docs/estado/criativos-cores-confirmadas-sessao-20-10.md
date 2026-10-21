# Criativos — cores confirmadas lidas sob a sessão (20/10/2026)

## §0. Depende de Victor e da integração

- Escolher negócio/material piloto e autorizar o uso específico de cada imagem na geração. Cor confirmada no onboarding não é autorização para enviar logo ou fachada a provedor externo.
- Ainda faltam entrada e versões persistidas, documento de nicho aplicável, referências verificadas, teto/provedor, aprovação no app e ensaio autenticado com dados reais. Nenhuma chamada paga ou gravação real ocorreu aqui.

## Fato observado

- O onboarding salva `marca.coresConfirmadas` e `marca.em` quando o cliente conclui ou atualiza a etapa visual. `lerMarca()` separa cores válidas de dados ausentes, mas o carregador da geração anterior devolvia só metadados de arquivos.
- `negocioAtivoDaSessao()` confirma o negócio selecionado, mas não traz `onboarding`; uma leitura adicional sob a mesma sessão e RLS é necessária para obter as cores sem aceitar valor enviado pelo navegador.

## Feito neste bloco

- `carregarMarcaDaSessao()` passou a consultar `businesses` por ID autorizado, selecionando explicitamente `id, onboarding` após validar os arquivos. Devolve cores com origem e data como `confirmado_cliente` apenas quando a lista original é íntegra, não vazia, datada e sem a indicação contraditória de que o visual ainda precisa ser definido.
- Ausência de cores ou resposta inválida retorna `coresConfirmadas: null`, para o briefing manter a pendência. Falha da consulta, negócio divergente e coluna ausente recusam o carregamento. Não há inferência a partir do logo.
- O carregador continua server-only e não está ligado à UI ou ao gerador; não assina URL, lê arquivo ou atesta consentimento para IA.

## Testes e limites

- `scripts/conferir-carregar-marca-da-sessao.mjs`: 6/6 casos offline com rede proibida, incluindo cores válidas, inválidas, data inválida e negócio trocado.
- `pnpm typecheck`, `pnpm conferir:identidade`, `pnpm conferir:multiconta` (28/28) e `scripts/conferir-briefing-geracao.mjs` (10/10) passaram.
- Não houve consulta autenticada ao Supabase real nem prova de RLS em produção. Não houve migração, chamada paga, uso de material privado, escrita externa ou deploy.

## Próximo recorte possível

Antes de preencher o briefing com arquivos, persistir autorização específica e revogável por imagem/finalidade; depois, ligar origem de marca e nicho ao pedido autenticado. A cor sozinha não torna o fluxo gerável.
