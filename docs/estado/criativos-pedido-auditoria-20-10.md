# Etapa 06 — auditoria da prévia do pedido (20/10/2026)

## Feito e prova

- A bancada `/exemplo/criativos-pedido` abriu no Chrome local. Com dados inteiramente fictícios, objetivo, oferta, destino e prazo apareceram no resumo; ao ativar promoção, o campo de data surgiu e a pendência mudou para o prazo.
- O teste com `2020-01-01` mostrou um defeito: o resumo continuou dizendo “Pedido preenchido nesta prévia”, apesar de a promoção estar vencida. É defeito da prévia, não de uma rota autenticada.
- O detector visual do projeto apontou um desvio: `font-size: clamp(2rem, 4vw, 3.5rem)` do título termina fora da escala de `DESIGN.md`. Inspeção visual desktop não mostrou corte de conteúdo, mas não houve teste em viewport móvel.

## Avaliação provisória da prévia, não do produto

| Dimensão | Nota / 4 | Evidência e limite |
| --- | ---: | --- |
| Acessibilidade | 3 | Campos têm rótulo, foco visível e ordem coerente; o `aria-live` envolve todo o resumo e pode ser verboso, sem teste com leitor de tela. |
| Desempenho | 4 | Só estado local e texto; nenhuma chamada externa, imagem ou animação nesta tela. Não medi tempo de renderização. |
| Tema | 3 | CSS usa tokens e o tema escuro apareceu legível; tema claro não foi conferido nesta rodada. |
| Responsividade | 2 | CSS tem quebra em 800 px, mas viewport móvel não foi inspecionada. |
| Integridade | 3 | Aviso de bancada e estados honestos; prazo vencido aceito e título fora da escala. |

Total provisório: 15/20. O achado prioritário é impedir que uma promoção vencida receba a mensagem de pedido preenchido. A nota não certifica WCAG, mobile nem produção.

## Falta

- Corrigir validade vencida e testar também data de hoje/futura, preservando o restante do formulário.
- Conferir mobile e tema claro; revisar se a região `aria-live` deve anunciar apenas a pendência, não todo o resumo.
- Formulário autenticado, persistência, autorização por negócio, pré-voo com fontes confiáveis, provedor e QA ponta a ponta continuam pendentes.

## Depende de Victor

- Para o piloto real: negócio e material autorizados, provedor e teto de custo. Nenhum deles foi usado na auditoria.
