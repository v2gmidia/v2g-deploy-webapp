# Criativos — chamada para ação confirmada no pré-voo (20/10/2026)

## §0. Depende de Victor e da integração

- Escolher negócio/material piloto e confirmar oferta, canal de resposta e destino reais. Não presumir que todo anúncio use WhatsApp ou inventar telefone/link.
- Ainda faltam entrada autenticada e persistente no aplicativo, marca autorizada para IA, nicho preenchido, referências admissíveis, provedor/teto aprovados, versões, aprovação no app e ensaio ponta a ponta. Chamadas pagas, migração e publicação exigem autorização específica.

## Fato observado antes da mudança

- `lib/criativos/briefing-geracao.ts` exigia objetivo e oferta, mas o briefing final não carregava a ação desejada pelo cliente. Um gerador futuro poderia completar sozinho a chamada ou o destino da resposta.
- `app/(protected)/criativos/page.tsx` monta `TelaDeCriativos` para biblioteca, upload e análise. `CriarPeca.tsx` não é importado por essa página; o desenho antigo, deliberadamente sem formulário funcional, não é a tela atual. Não inserir ali campos que aceitam e descartam dados.

## Feito neste bloco

- O pré-voo agora exige `acaoDesejada` confirmada pelo cliente, com origem e data válidas, antes de compor `BriefingVisual`.
- A saída transporta o texto confirmado e proíbe inventar canal, link, endereço ou telefone. Isso não valida se um número externo existe; é apenas uma fronteira de proveniência.
- Acrescentado caso sintético para recusar ação inferida e aceitar a confirmada.

## Testes e limites

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-briefing-geracao.mjs`: 9/9 passaram.
- `pnpm typecheck`: passou.
- Nenhuma alteração na interface, no banco, n8n, Meta ou provedor; nenhuma imagem gerada. A orientação de UI/UX preservou a regra atual de não mostrar formulário falso ao cliente.

## Próximo recorte possível

Mapear a entrada autenticada e um armazenamento adequado de pedido/versão antes de expor campos em `/criativos`. Só então conectar este pré-voo ao app e provar que o que o cliente informou permanece e volta para aprovação.
