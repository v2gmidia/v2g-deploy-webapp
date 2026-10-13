# NFS-e — contrato de integração preparado em 07/10/2026

## Resposta complementar da Contabilizei trazida por Victor em 12/10/2026

**Fonte atribuída:** mensagem da Contabilizei colada por Victor nesta conversa. É insumo contábil, ainda não uma parametrização conferida no Asaas ou no Portal Nacional.

- Emitente: inscrição municipal `13448418`, Simples Nacional, Curitiba/PR. Serviço informado: item `17.06`, código municipal `170601000`, para CNAEs `7311-4/00` e `7319-0/04`. Descrição informada: propaganda e publicidade, inclusive planejamento de campanhas e materiais publicitários. A base deve conter somente o serviço de gestão; a verba de mídia paga separadamente ao veículo fica fora da nota.
- **Competência:** uma NFS-e por mês de serviço prestado. Mesmo com pagamento semestral ou anual antecipado, não emitir uma nota pelo total no recebimento. Para uma conta, os valores nominais por mês são R$ 500 no mensal, R$ 475 no semestral de R$ 2.850 e R$ 440 no anual de R$ 5.280; validar início da prestação, meses parciais e eventual reembolso antes de automatizar.
- A resposta informou, como referência de outubro/2026, alíquota total de 6,00% e ISS de 2,01% para tomador em Curitiba; para tomador fora, total de 3,05% e ISS de 0%. **Não parametrizar esses percentuais:** o próprio contador ressalva variação mensal e a regra para tomador fora aparenta conflitar com o art. 3º da LC 116/2003 e com o manual de Curitiba para o serviço 17.06. Pedir fundamento, distinção entre alíquota do DAS, ISS da nota e retenção, e exemplo de nota antes de emitir.
- Cancelamento, conforme a mensagem: até o último dia do mês seguinte se o imposto não foi pago; após fechamento no dia 05, avisar a Contabilizei para recálculo. Tratar como orientação a confirmar por competência e situação concreta; não criar cancelamento automático. Certificado informado como válido até 27/07/2027. A Contabilizei deve conferir a captura da nota emitida via Asaas até o dia 05 do mês seguinte; se faltar, importação manual. Não há integração direta Contabilizei–Asaas.
- A emissão pelo Portal Nacional foi informada e é consistente com a orientação federal para optantes do Simples desde setembro/2026. A documentação do Asaas manda usar `municipalServiceCode` nesse caso e só considerar nota emitida após `INVOICE_AUTHORIZED`. Ainda faltam habilitação fiscal, parâmetros reais da conta, dados completos do tomador, idempotência por competência, webhook fiscal e teste de emissão em ambiente apropriado.

**Efeito no produto:** manter pagamento aprovado → acesso, assinatura e NFS-e como estados separados. Criar futuramente uma obrigação fiscal por `(pedido, competência, tipo de nota)` e agenda de emissão por mês de prestação. A tabela atual `fiscal_documents` só guarda `order_id` e estado; ainda não representa competência nem o valor proporcional. Nenhum `POST /v3/invoices` foi habilitado por esta resposta.

## Estado verificado

O WebApp guarda pedido, unidades contratadas e uma tabela `fiscal_documents` com estado. `/pedidos` mostra ao operador se há autorização registrada, mas **não agenda, emite nem envia nota**. A NFS-e de exemplo recebida indica Curitiba/PR e inscrição municipal 13448418. Em 07/10, Victor trouxe resposta da Contabilizei por Gabriel: Simples Nacional, item 17.06, código municipal 170601000 para os CNAEs 7311-4/00 e 7319-0/04, Anexo V sujeito ao Fator R. Isso é informação atribuída ao contador, ainda não confrontada com o cadastro fiscal no Asaas. A aprovação geral da conta Asaas foi vista em 07/10; habilitação fiscal permanece sem verificação. Nenhum endpoint fiscal foi chamado nesta entrega.

## Sequência exigida pelo provedor

Segundo a [documentação de NFS-e do Asaas](https://docs.asaas.com/docs/notas-fiscais), a sequência é: consultar opções municipais, configurar informações fiscais da conta, identificar o serviço, agendar a nota e acompanhar a autorização por webhook. A [emissão de serviços](https://docs.asaas.com/docs/emitindo-notas-fiscais-de-servico) aceita vínculo com `payment`, `installment` ou `customer`; o Pix direto da venda assistida não cria uma cobrança Asaas, portanto a hipótese para ele é nota avulsa vinculada a `customer`, a validar no sandbox. Quando houver lista municipal, usar `municipalServiceId`; quando não houver, pedir ao contador o `municipalServiceCode`, sem preencher os dois com o mesmo código. O objeto `taxes` depende da situação tributária confirmada.

O [webhook fiscal](https://docs.asaas.com/docs/webhook-para-notas-fiscais) separa agendamento, sincronização e autorização. O WebApp só pode escrever `authorized` após evento autêntico e correspondência com pedido, tomador, valor e identificador da nota. Evento repetido não deve gerar segunda emissão nem segundo e-mail. A versão do payload deve tolerar novos atributos.

## Dados mínimos antes de integrar

| Origem | Campos/decisão | Situação |
|---|---|---|
| V2G e contador | Regime Simples Nacional; item 17.06; código municipal 170601000; CNAEs 7311-4/00 e 7319-0/04; Anexo V sujeito ao Fator R | Informado pela Contabilizei via Gabriel em 07/10; falta conferir cadastro efetivo no Asaas |
| V2G e contador | Alíquotas/retenções aplicáveis, credenciais fiscais exigidas pelo emissor, série, competência e município da prestação | Pendente; não derivar alíquota de “Anexo V” nem do exemplo de NFS-e |
| Pedido | `order_id`, `business_id`, CNPJ e razão social do tomador, quantidade de contas, preço, desconto, forma e período de pagamento | Parcialmente persistido em `commercial_orders` |
| Tomador | Endereço e dados fiscais que a API/município efetivamente exigir | Ainda não coletado em fluxo validado |
| Cobrança | ID da cobrança Asaas quando houver; no Pix direto, vínculo a `customer` e comprovante aprovado pela V2G | Integração externa pendente |
| Competência | Identificador de ciclo mensal/anual para não emitir duas vezes a mesma competência | Ainda não modelado; `order_id` sozinho não identifica renovações mensais |

## Contrato de processamento seguinte

1. Não enviar `POST /v3/invoices` até que a emissão fiscal da conta Asaas esteja habilitada, o contador aprove os parâmetros fiscais restantes, o tomador tenha os dados exigidos e exista uma competência/cobrança identificável. Consultar `GET /v3/fiscalInfo/services`: usar o ID retornado em `municipalServiceId` se houver lista; só usar `municipalServiceCode` quando a lista não estiver disponível ou o emissor for o Portal Nacional. Não presumir que `170601000` seja o ID interno do Asaas.
2. Criar chave única interna `(pedido, competencia, tipo_de_nota)` e guardar o ID do provedor. Uma repetição deve consultar a nota anterior, não criar outra.
3. Associar eventos pelo ID da nota e validar a origem do webhook antes de mudar o estado. `SCHEDULED` e `SYNCHRONIZED` são pendências; somente `AUTHORIZED` comprova emissão. Rejeição e cancelamento exigem estados próprios, histórico e tratamento operacional.
4. Só enviar PDF/XML ao e-mail verificado da compra depois de autorização e URL/documento confirmado; registrar tentativa de entrega sem dizer que chegou quando não houver prova.
5. Testar no sandbox com CNPJ e tomador fictícios, Pix direto e cobrança Asaas, rejeição municipal, repetição e eventos fora de ordem. Validar com contador antes de produção.

Este documento especifica integração e dados ausentes. Não aprova enquadramento fiscal nem substitui a análise do contador.
