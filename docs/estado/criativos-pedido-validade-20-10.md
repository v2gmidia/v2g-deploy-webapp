# Etapa 06 — validade da promoção na prévia (20/10/2026)

## Feito

- A prévia `/exemplo/criativos-pedido` recebe o dia de São Paulo da rota, como já faz a lógica de datas do produto, e usa esse dia como limite mínimo do campo de promoção.
- Data anterior a hoje mantém o pedido pendente e mostra o problema junto ao campo: “Essa data já passou. Escolha hoje ou uma data futura.” A data digitada não é apagada. Hoje e data futura deixam apenas a ressalva de que a prévia ainda não gera peça.
- A orientação de UI levou a mensagem específica e próxima do campo, sem mudar identidade, navegação ou os demais passos.

## Prova e limites

- `pnpm typecheck` passou.
- No Chrome local, com dados fictícios, `2020-01-01` exibiu erro e pendência; `2026-10-20` e `2026-10-27` não exibiram erro. É ensaio da bancada de desenvolvimento, não da conta autenticada nem de produção.
- Nenhuma chamada ao Jev, gerador, Meta, banco ou serviço externo foi feita.

## Falta

- Conferência em viewport móvel e tema claro, revisão de `aria-live`, ajuste de tipografia apontado na auditoria anterior.
- Persistir o pedido sob sessão e vínculo com negócio; carregar fontes confiáveis, consentimento e referências; integrar provedor sob teto e medir custo; QA ponta a ponta.

## Depende de Victor

- Negócio piloto, autorização específica dos materiais, provedor e teto de custo antes de chamadas pagas. Etapa 06 segue aberta.
