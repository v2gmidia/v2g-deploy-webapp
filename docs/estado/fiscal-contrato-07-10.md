# NFS-e — contrato de integração preparado em 07/10/2026

## Estado verificado

O WebApp guarda pedido, unidades contratadas e uma tabela `fiscal_documents` com estado. `/pedidos` mostra ao operador se há autorização registrada, mas **não agenda, emite nem envia nota**. A NFS-e de exemplo recebida indica Curitiba/PR e inscrição municipal 13448418; não determina regime tributário, serviço municipal, alíquotas nem retenções para futuras notas. O Asaas ainda está em aprovação na conta da V2G. Nenhum endpoint fiscal foi chamado nesta entrega.

## Sequência exigida pelo provedor

Segundo a [documentação de NFS-e do Asaas](https://docs.asaas.com/docs/notas-fiscais), a sequência é: consultar opções municipais, configurar informações fiscais da conta, identificar o serviço, agendar a nota e acompanhar a autorização por webhook. A [emissão de serviços](https://docs.asaas.com/docs/emitindo-notas-fiscais-de-servico) aceita vínculo com `payment`, `installment` ou `customer`; o Pix direto da venda assistida não cria uma cobrança Asaas, portanto a hipótese para ele é nota avulsa vinculada a `customer`, a validar no sandbox. Quando houver lista municipal, usar `municipalServiceId`; quando não houver, pedir ao contador o `municipalServiceCode`, sem preencher os dois com o mesmo código. O objeto `taxes` depende da situação tributária confirmada.

O [webhook fiscal](https://docs.asaas.com/docs/webhook-para-notas-fiscais) separa agendamento, sincronização e autorização. O WebApp só pode escrever `authorized` após evento autêntico e correspondência com pedido, tomador, valor e identificador da nota. Evento repetido não deve gerar segunda emissão nem segundo e-mail. A versão do payload deve tolerar novos atributos.

## Dados mínimos antes de integrar

| Origem | Campos/decisão | Situação |
|---|---|---|
| V2G e contador | Regime tributário, código do serviço, alíquotas/retenções, credenciais fiscais exigidas pelo município, série e município da prestação | Pendente de confirmação com contador e configuração no Asaas |
| Pedido | `order_id`, `business_id`, CNPJ e razão social do tomador, quantidade de contas, preço, desconto, forma e período de pagamento | Parcialmente persistido em `commercial_orders` |
| Tomador | Endereço e dados fiscais que a API/município efetivamente exigir | Ainda não coletado em fluxo validado |
| Cobrança | ID da cobrança Asaas quando houver; no Pix direto, vínculo a `customer` e comprovante aprovado pela V2G | Integração externa pendente |
| Competência | Identificador de ciclo mensal/anual para não emitir duas vezes a mesma competência | Ainda não modelado; `order_id` sozinho não identifica renovações mensais |

## Contrato de processamento seguinte

1. Não enviar `POST /v3/invoices` até que a conta Asaas esteja habilitada, o contador aprove a configuração fiscal, o tomador tenha os dados exigidos e exista uma competência/cobrança identificável.
2. Criar chave única interna `(pedido, competencia, tipo_de_nota)` e guardar o ID do provedor. Uma repetição deve consultar a nota anterior, não criar outra.
3. Associar eventos pelo ID da nota e validar a origem do webhook antes de mudar o estado. `SCHEDULED` e `SYNCHRONIZED` são pendências; somente `AUTHORIZED` comprova emissão. Rejeição e cancelamento exigem estados próprios, histórico e tratamento operacional.
4. Só enviar PDF/XML ao e-mail verificado da compra depois de autorização e URL/documento confirmado; registrar tentativa de entrega sem dizer que chegou quando não houver prova.
5. Testar no sandbox com CNPJ e tomador fictícios, Pix direto e cobrança Asaas, rejeição municipal, repetição e eventos fora de ordem. Validar com contador antes de produção.

Este documento especifica integração e dados ausentes. Não aprova enquadramento fiscal nem substitui a análise do contador.
