# Etapa 02 — competência fiscal por mês, 13/10/2026

## Estado

Implementação **local**, sem aplicação da migration e sem emissão de NFS-e. A minuta `minuta-interna-2026-10-09-v1` continua sem aprovação jurídica; nenhum contrato pode ser enviado para assinatura. O provedor de assinatura não foi contratado nem testado. Nenhuma autorização fiscal da conta Asaas foi comprovada.

## Problema observado

`fiscal_documents` associa uma nota apenas a `order_id` e guarda um estado. Nas telas internas, o último registro `authorized` aparecia como autorização da nota do pedido. Isso não prova quais competências de serviço foram cobertas, principalmente quando a compra paga seis ou doze meses antecipados. Fonte contábil: resposta da Contabilizei trazida por Victor em 12/10, registrada em `fiscal-contrato-07-10.md`: uma nota por mês de prestação, com verba de mídia fora da base.

## Mudança local

- `/gestor/compras` e `/pedidos` passam a dizer que a autorização é do **último registro** e que competência e meses restantes precisam de conferência. Nenhum estado fiscal passa a ser inferido do pagamento.
- `planejarCompetenciasFiscais` divide o preço atual em 1, 6 ou 12 meses, com valores inteiros e soma idêntica ao pedido. Recebe explicitamente o primeiro mês **integral** de serviço; rejeita data parcial, preço divergente e período desconhecido. Para mensal, produz só a primeira competência, sem presumir renovação paga.
- A migration `20261013060000_competencia_documento_fiscal.sql` foi **preparada e não aplicada**. Cria `fiscal_obligations` única por `(pedido, competência, tipo)` e permite múltiplos documentos para a mesma obrigação, necessários se houver rejeição ou cancelamento. Registros fiscais antigos ficam sem vínculo até conciliação individual. O vínculo composto impede associar uma nota ao pedido de outra empresa. Um índice parcial impede duas notas simultaneamente registradas como `authorized` para a mesma obrigação; notas rejeitadas ou canceladas continuam permitindo substituição.
- `prepararAssinatura` é um portão local sem efeito externo. Ele exige pagamento aprovado, e-mail do comprador verificado, versão da minuta diferente da interna e idêntica à aprovada, SHA-256 do PDF igual ao artefato aprovado, provedor configurado e representante com dados e poderes conferidos. Se tudo estiver presente, devolve a chave estável `pedido:versão` para evitar envelope duplicado. Ainda não é chamado por um envio: não há minuta aprovada nem provedor escolhido.

## Rascunho no n8n

No n8n já autenticado, foi criado [V2G | Etapa 02 | Contrato e fiscal (rascunho)](https://ia-n8n.5hue9s.easypanel.host/workflow/1gPKolQ4baLIm2Z1). Ele contém somente uma nota com a sequência e os portões de contrato, competência fiscal, idempotência, arquivamento e entrega; está **não publicado, sem gatilho ou nós executáveis**. A lista do n8n confirmou que os workflows existentes `V2G - BACKEND` e `V2G - WEBHOOK` permanecem publicados e sem alteração. Nenhum e-mail de contrato ou NFS-e saiu desse rascunho. Não foi criada credencial/MCP novo: isso exige definir o escopo de acesso e não é necessário para desenhar o fluxo.

## Verificação

- `node --test scripts/conferir-competencias-fiscais.mjs scripts/conferir-gestor.mjs`: 29/29 cenários passaram, incluindo virada de ano, pedido com duas contas, mensal sem renovação inventada, data parcial e preço divergente.
- `node --test scripts/conferir-preparo-assinatura.mjs`: 6/6 cenários passaram, incluindo minuta interna, pedido pendente, e-mail não verificado, falta de poderes e PDF sem hash.
- `pnpm typecheck`: passou.
- `pnpm build`: passou com servidor de desenvolvimento parado. Não houve teste autenticado em QA nesta passagem nem validação da migration em banco.

## Portões para ativar

1. Confirmar quando começa a prestação e como tratar mês parcial/estorno. Data da compra ou aprovação do pagamento não é automaticamente competência do serviço.
2. Revisar a migration exata e autorizar sua aplicação **especificamente** no ambiente desejado; conferir o banco compartilhado e os registros legados antes de aplicar.
3. Confirmar com a Contabilizei parâmetros efetivos, inclusive divergência sobre ISS fora de Curitiba, e conferir cadastro fiscal do Asaas. A alíquota não foi codificada.
4. Só após isso integrar solicitação, webhook autenticado, reconciliação, PDF/XML e entrega. `INVOICE_AUTHORIZED` do emissor continua sendo a prova de nota emitida.
5. Para contrato, aprovar a minuta e escolher/configurar o provedor. A tela de ativação reconfere pagamento, assinatura e conta contratada no clique, mas o serviço `backend_v2g` que efetivamente fala com a Meta ainda exige auditoria própria do bloqueio.
