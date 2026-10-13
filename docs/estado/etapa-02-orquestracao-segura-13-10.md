# Etapa 02 — desenho executável após as decisões, 13/10/2026

## Estado desta entrega

Este é um roteiro de implementação, **não um fluxo ativo**. O rascunho n8n contém somente uma nota, sem gatilho, credenciais, envio ou emissão. A minuta final, o provedor de assinatura e os parâmetros fiscais efetivos continuam pendentes em [`etapa-02-perguntas-para-fechar-13-10.md`](./etapa-02-perguntas-para-fechar-13-10.md).

## Contrato: transições que o fluxo deverá executar

1. Um evento interno de pedido `payment_approved` solicita preparo. A aplicação relê o pedido e o vínculo do comprador no banco; não confia apenas no corpo do evento. `prepararAssinatura` deve aprovar a versão e o SHA-256 do PDF final, o e-mail verificado, o provedor e os poderes do representante. Falha vira pendência visível, sem enviar documento.
2. A aplicação reserva a chave `(order_id, template_version)` em `contract_documents` antes de chamar o provedor. A restrição única já existe na migration `0026`. Em repetição, consulta a mesma linha e o identificador remoto. Se a chamada expirou sem resposta, consulta o provedor pela chave de correlação antes de criar outro envelope. Não marcar `sent` apenas porque a requisição foi iniciada.
3. O retorno confirmado do provedor grava `provider_document_id` e `sent`. Eventos de webhook são autenticados e deduplicados por identificador externo; `commercial_events` já tem unicidade `(source, external_event_id)`. Eventos fora de ordem exigem consulta ao estado atual do documento, sem regressão de `signed` para `sent`.
4. `partially_signed` registra assinatura incompleta. `signed` só após conferir **todos** os signatários exigidos, baixar o PDF concluído e a trilha de auditoria e persistir a referência desses arquivos. O comprovante de entrega ao cliente é separado em `delivered_at`. Recusa, expiração ou cancelamento deixam `voided`/`failed` e tarefa para o gestor; retentativa explícita não duplica a versão assinada.
5. Acesso ao WebApp continua definido pelo pagamento. A publicação manual da primeira campanha exige assinatura comprovada no pré-voo de `lib/campanha/ativacao.ts`, além da conta contratada. Antes da operação real, auditar também o `backend_v2g`, que efetivamente fala com a Meta.

**Lacunas de esquema a resolver antes da integração:** `contract_documents` não guarda hoje a referência persistente do PDF assinado nem da trilha de auditoria. O fluxo não pode declarar contrato concluído apenas por `status='signed'` sem projetar e testar o armazenamento protegido desses artefatos. Sua unicidade por `(order_id, template_version)` também exige desenhar tentativas de envio e substituição após `failed` ou `voided`, sem criar dois contratos vigentes para a mesma versão. A autenticação do webhook depende do provedor escolhido.

## Fiscal: uma competência por prestação

1. Um operador ou regra jurídica/contábil aprovada fixa o início da prestação e o tratamento de meses parciais. `planejarCompetenciasFiscais` só oferece prévia de **meses integrais**; não cria obrigação pela data do pagamento. Para plano mensal, não presume cobrança seguinte aprovada.
2. Depois de aplicada e auditada a migration `20261013060000`, gravar obrigação única por `(order_id, competence_month, document_kind)`. A nota usa apenas o valor do serviço de gestão daquela competência; verba de mídia permanece fora. Validar tomador, município, serviço, alíquota e retenção do mês antes da solicitação.
3. A solicitação de emissão referencia a obrigação e usa uma chave de correlação estável. Antes de repetir uma chamada com resultado incerto, consultar o emissor. `fiscal_documents` permite tentativas rejeitadas/canceladas e, pela migration preparada, no máximo um documento `authorized` por obrigação.
4. Webhook fiscal autenticado e consulta ao emissor conciliam `requested`, `authorized`, `rejected` ou `cancelled`. Somente autorização comprovada pelo emissor permite registrar data, ID remoto, PDF/XML e entrega. Falha e ausência de retorno aparecem na fila do gestor; não são nota emitida.
5. Conferir até o dia 05 do mês seguinte se cada documento autorizado consta na Contabilizei, como ela orientou. Ausência exige importação/conferência humana; não apagar nem repetir emissão automaticamente. Estorno/cancelamento segue as regras da competência e da Contabilizei, ainda pendentes de confirmação específica.

## Contrato do futuro n8n

O n8n deve **orquestrar**, não decidir sozinho a autorização financeira, jurídica ou fiscal. O gatilho futuro recebe somente IDs opacos, relê o estado em rotas autenticadas e de menor privilégio da aplicação, executa a operação no provedor configurado e devolve IDs/resultados para reconciliação. Não colocar `service_role`, PDF assinado, dados de cartão nem segredo em logs do workflow. Cada passo externo precisa de chave de idempotência, estado persistido, repetição com consulta antes de recriar, limite de tentativas e tarefa para intervenção quando o resultado permanecer desconhecido.

**Cenários mínimos antes de ativar:** evento duplicado; timeout antes/depois da criação remota; webhook anterior à resposta de criação; assinatura parcial, recusa e expiração; PDF final indisponível; emissão rejeitada e substituída; webhook fiscal repetido; cancelamento/estorno após competência prestada; mês parcial; recuperação após queda do n8n. As provas devem usar sandbox e dados fictícios, com registro do que foi observado em cada provedor.

Nenhum nó de envio, webhook público ou emissor deve ser ativado enquanto faltarem versão jurídica final, provedor escolhido, configuração fiscal comprovada e revisão das migrations exatas no ambiente desejado.
