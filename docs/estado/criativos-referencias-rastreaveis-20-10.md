# Criativos — metadados rastreáveis de referência no pré-voo (20/10/2026)

## §0. Depende de Victor e da integração

- Selecionar negócio e material piloto; confirmar ID técnico do nicho e referências cujo uso como inspiração estrutural seja permitido. Link de anúncio ativo não comprova venda nem autoriza reprodução da imagem.
- Ainda falta um catálogo persistente de referências com revisão humana e verificação efetiva do localizador, da condição de uso e do arquivo. O texto preenchido no pré-voo não prova que esses fatos sejam verdadeiros.
- Chamada paga a Jev ou gerador, envio de material privado, banco real, migração, publicação e deploy continuam fora deste bloco; cada portão requer autorização própria.

## Fato observado

- `lib/criativos/briefing-geracao.ts` filtrava imagem/vídeo e revisão, mas a saída guardava só ID, origem e padrão. Data, localizador, condição de uso e responsável pela revisão se perdiam na passagem ao briefing.
- O piloto de barbearia no n8n tem 10 IDs observados, 6 candidatos e 4 descartados; só uma imagem foi conferida visualmente. Isso não constitui uma biblioteca de peças vencedoras nem uma fonte pronta para o gerador.

## Feito neste bloco

- `ReferenciaDaPeca` passou a exigir localizador da fonte, data de observação, condição de uso e identificador do revisor humano. Sem esses metadados, a referência não é admitida pelo pré-voo.
- `BriefingVisual` preserva esses campos junto de ID, origem e padrão. A regra continua limitada a imagens revisadas e uso como inspiração permitido; não transporta a imagem nem sinaliza desempenho comercial.
- A saída não verifica a URL, a licença ou a identidade do revisor contra fonte externa. É um contrato local para não perder evidência quando houver integração.

## Testes e limites

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-briefing-geracao.mjs`: 10/10 testes sintéticos passaram.
- `pnpm typecheck`: passou. `pnpm conferir:criativos`: 30 conferências passaram.
- Nenhuma chamada externa, dado de cliente, modificação no n8n, banco ou interface ocorreu.

## Próximo recorte possível

Conectar um catálogo de referências com condições de uso verificadas e versão ao pré-voo, mas antes mapear autorização e persistência da entrada do cliente. A geração não deve ser ligada só porque o contrato local passou.
