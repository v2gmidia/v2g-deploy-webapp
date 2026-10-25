# E28 — passagem dos primeiros dez clientes preparada

**Data:** 22/10/2026  
**Escopo:** documentação operacional das frentes 03/04; sem reabrir o aceite de multiconta/onboarding.

## Entrega

O playbook existente `docs/recebimento-cliente-meta.md` agora contém:

- ficha copiável por negócio, aplicável aos lugares `C01` a `C10`;
- matriz vazia dos dez lugares, sem nome, ID, pagamento ou estado inventado;
- separação entre contratação histórica, conta WebApp, ativos Meta, primeira operação e dados;
- roteiro do gestor para validar um cliente-piloto antes dos outros nove;
- aceite explícito do piloto e caminhos manuais quando API/automação não estão provadas;
- handoffs exatos para `E28-01-A/B`, `E28-02-A`, `E28-05/06` e `E28-07-A/B/C/D`;
- próximo ato humano único para Victor escolher e identificar o piloto.

## Decisões preservadas

- 03/04 permanecem concluídos no recorte; este trabalho é passagem operacional, não reconstrução do produto.
- cliente não recebe papel no Meta for Developers;
- senha, token, 2FA, chave e cartão não entram no documento;
- parceria/portfólio, acesso manual, leitura API e publicação API têm aceites separados;
- publicação manual é o caminho inicial válido quando peça, conta, orçamento e autorização específica estão conferidos;
- agenda continua externa no Google, com evidência humana; agenda própria/automática fica fora deste bloco;
- cliente histórico não recebe nova compra para substituir reconciliação: `E28-01-A/B` recebe a pendência;
- métricas externas dependem de `E28-07-A/B/C/D` e preservam desconhecido como desconhecido.

## Verificação

- `git status --short` foi conferido antes da edição e estava limpo.
- revisão textual dirigida confirmou a presença dos dez lugares, dos campos obrigatórios, das sete ações do gestor e dos handoffs.
- nenhuma suíte de produto foi repetida: não houve mudança de código nem risco novo de runtime.
- o FigJam operacional `DGGCCnjlOlmy5vzsa11yoW` foi mantido como referência, mas **NÃO RELIDO** neste bloco porque a conta Figma Starter atingiu o limite de chamadas MCP. Não houve tentativa de contornar a cota nem edição do quadro.

## Limite de evidência

Entrega **LOCAL e documental**. Não comprova dez clientes identificados, pagamentos, contas WebApp, `business_id`, acessos Meta, ativos, reservas, campanhas, publicação, métricas, QA ou produção. Nenhum cliente foi contatado e nenhuma escrita externa foi feita.

## Próximo ato

Victor escolhe um lugar `C__` e fornece por canal seguro o conjunto mínimo listado no final do playbook. Só então o gestor preenche a ficha, reconcilia a contratação e testa o acesso manual do piloto; os outros nove aguardam o aceite.
