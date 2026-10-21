# Etapa 06 — prévia local do pedido de imagem (20/10/2026)

## Feito

- Adicionada `/exemplo/criativos-pedido`, protegida pelo portão de desenvolvimento já existente em `app/exemplo/[tela]/page.tsx`. A prévia oferece campos para objetivo, oferta/serviço, prazo de promoção e destino da resposta.
- O resumo acompanha o preenchimento no navegador e aponta campos vazios. O aviso vem antes dos campos: nada é salvo, gerado ou publicado. Não usa conta, dados de cliente, Jev, gerador ou Meta.
- `pnpm typecheck` passou. A rota local respondeu HTTP 200 e serviu o aviso de prévia e o título esperado. `git diff --check` passou; há apenas avisos de conversão LF/CRLF em arquivos do worktree.

## Falta

- Revisão visual/interativa da prévia, inclusive no celular. O HTTP 200 e o typecheck não provam aparência nem interação.
- Ligar um formulário real à sessão, ao vínculo com o negócio e à persistência do pedido; depois, carregar marca, documentos e referências admissíveis, passar pelo pré-voo e definir o provedor. A tela autenticada continua sem geração.
- QA ponta a ponta e medição de custo antes de alegar que a etapa 06 está pronta para o evento.

## Depende de Victor

- Escolha do negócio piloto e autorização específica para usar seus materiais; decisão do provedor e teto para chamadas pagas. Nenhuma chamada foi feita neste recorte.
