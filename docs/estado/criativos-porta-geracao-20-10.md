# Criativos — porta local de tentativas e orçamento (20/10/2026)

## §0. Depende de Victor e da integração

- Definir o teto aprovado por sequência de uma peça e autorizar separadamente cada chamada paga ao provedor; o valor de R$ 1,50 por imagem da hipótese financeira não é um preço medido nem um teto aprovado.
- Selecionar provedor e obter um limite superior de custo por tentativa; se não houver limite superior verificável, a porta bloqueia.
- Antes da primeira chamada real, persistir tentativas e custos por negócio/peça, com reserva atômica no servidor, idempotência e reconciliação de custos finais. A função pura não impede duas requisições simultâneas nem comprova a fatura do provedor.
- Negócio piloto, identidade, oferta e referências precisam de autorização própria. Sem isso, não enviar dados de cliente.

## Feito neste bloco

- Criado `lib/criativos/porta-geracao.ts` para avaliar, sem rede, a próxima geração inicial ou refação. A inicial só pode ser entregue uma vez; a refação exige imagem inicial e instrução textual; há até três refações entregues. Falha técnica não consome a franquia de refações, mas custo cobrado por falha consome orçamento.
- A decisão falha fechada se a consulta estiver incompleta, houver tentativa em andamento, outro negócio no histórico, custo anterior desconhecido, teto total não aprovado, custo máximo da próxima chamada desconhecido ou saldo insuficiente. O orçamento considera custos anteriores e o teto da próxima tentativa; não escolhe valor padrão.
- A função não está ligada à tela, ao banco ou a um provedor. Ela é apenas um contrato de pré-chamada para integração posterior.

## Prova local e limites

- `node scripts/conferir-porta-geracao.mjs`: 15/15 casos sintéticos passaram.
- `pnpm typecheck`: passou.
- Nenhuma chamada paga, uso de material privado, alteração de banco, Meta, n8n ou deploy ocorreu. Não há prova de interface autenticada, concorrência real, custo faturado ou geração de imagem.

## Próximo recorte possível

Mapear os campos de identidade já persistidos e o carregador seguro por negócio para conectar o briefing e esta porta a uma action futura, sem chamar provedor nem criar escrita externa. Antes disso, conferir se outro chat não implementou o mesmo recorte.
