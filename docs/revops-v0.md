# RevOps V0 — contrato de dados e jornada

Estado: desenho implementado localmente em 07/10/2026; migration não aplicada.

## 1. Limite desta fatia

Esta V0 registra o funil comercial **da própria V2G** antes da compra: pessoa, empresa prospectiva, oportunidade, fonte e interação. Ela não armazena os contatos que um anúncio gera para um cliente. “Conversas iniciadas” continua sendo métrica de mídia; não é venda da V2G nem venda do cliente.

Não há união automática por nome, e-mail, telefone ou texto parecido. Uma pessoa pode participar de oportunidades de duas empresas e uma interação pode aparecer nas duas linhas do tempo sem virar dois eventos.

## 2. Mapa ponta a ponta

| etapa | entidade e ID de ligação | fonte de verdade | evento mínimo | responsável | desconhecido explícito |
|---|---|---|---|---|---|
| Origem | `leads_lp.id` ou `revops_source_references.id` | LP ou fonte comercial preservada | `interest_registered` | pessoa que registrou | origem/campanha não informada |
| Pessoa | `revops_people.id` | registro manual com referência de fonte | vínculo à oportunidade | RevOps autorizado | identidade ainda não conciliada |
| Empresa prospectiva | `revops_prospect_organizations.id` | declaração do contato ou documento futuro | oportunidade criada | RevOps autorizado | CNPJ/estrutura/Instagram não avaliados |
| Oportunidade | `revops_opportunities.id` | linha do tempo de eventos | mudança comercial registrada | `owner_profile_id` quando definido | responsável ou próximo passo ausente |
| Interação | `revops_interactions.id` | fonte única por `(source_system, source_external_id)` | mensagem, reunião, proposta ou estado | `recorded_by` | transcrição ou desfecho pendente |
| Pedido | `commercial_orders.id` | WebApp/pedido | compra/pagamento em eventos separados | operação comercial | compra relatada sem pedido/pagamento |
| Negócio WebApp | `businesses.id` | WebApp | vínculo verificado após compra | operação/produto | pedido sem negócio vinculado |
| Pagamento | `commercial_orders.status = payment_approved` nesta fase; provedor depois | confirmação operacional/provedor | `payment_approved` | financeiro/operação | comprovante sem liquidação externa |
| Contrato | ID futuro de contrato, ligado a `businesses.id` | provedor de assinatura ainda não escolhido | assinatura confirmada | signatários/operação | documento enviado sem assinatura |
| Onboarding | `businesses.id` + `businesses.onboarding` | WebApp | início/conclusão | cliente e gestor | resposta “não sei”/reunião não conciliada |
| Campanha | `execucoes.business_id` e IDs externos preservados | backend/Meta | `campaign_live` somente com prova | gestor/backend | campanha citada sem ID da plataforma |
| CS | futuro ID de atendimento ligado a `businesses.id` | canal de suporte autorizado | contato, risco, ação | CS/gestor | retorno do cliente ausente |
| Finance | ID externo futuro entre pedido/negócio e Finance | projeto Finance separado | recebimento/estorno | financeiro | cliente financeiro sem ponte canônica |

O Finance usa outro Supabase e IDs seriais próprios. A V0 não copia sua tabela nem tenta conciliá-la por nome. A ponte futura precisa de um identificador externo aprovado em ambos os lados.

## 3. Entidades implementadas

- `revops_people`: pessoa comercial. Telefone e e-mail são atributos auxiliares, nunca chave de identidade.
- `revops_prospect_organizations`: empresa antes de existir em `businesses`. O diagnóstico de Instagram tem apenas `not_assessed`, `guidance_needed` e `adequate`; orientação necessária não veta compra.
- `revops_opportunities`: uma jornada comercial de uma empresa. Aceita prospect sem pedido e sem conta no WebApp.
- `revops_opportunity_people`: N:N entre pessoas e oportunidades.
- `revops_source_references`: referência idempotente à origem. O par sistema + ID externo é único.
- `revops_interactions`: evento único da linha do tempo, com data, canal, autor, tipo de evidência e estado de transcrição/revisão.
- `revops_interaction_opportunities`: N:N que permite uma reunião ou grupo compartilhado aparecer em duas oportunidades sem fundir as empresas nem duplicar o evento.

Os vínculos opcionais `lead_lp_id`, `commercial_order_id` e `business_id` têm foreign keys. Quando qualquer um é preenchido, `linked_at`, `linked_by` e `link_evidence` passam a ser obrigatórios. A aplicação desta V0 ainda não oferece formulário para criar esses vínculos.

## 4. Vocabulário de evidência

| valor | definição | uso permitido |
|---|---|---|
| `source_fact` | fato que a fonte preservada sustenta diretamente | data/mensagem/evento presente no original |
| `human_report` | relato de uma pessoa sobre algo que não foi verificado na fonte | “Victor relata que vendeu” |
| `inference` | interpretação derivada | só com revisão humana pendente/confirmada/rejeitada |

Jev ou outro classificador futuro pode sugerir `interaction_type`, objeção ou responsável depois que existir texto autorizado. Deve guardar modelo, versão da pergunta, confiança, fonte e correção humana em uma extensão futura. Não pode provar identidade, pagamento, venda, transcrever áudio ou sobrescrever o original.

## 5. Estados que não se confundem

- `proposal_liked`: gostou da proposta.
- `purchase_reported`: alguém relatou compra.
- `payment_approved`: existe aprovação de pagamento na fonte competente.
- `campaign_live`: existe confirmação operacional de veiculação.

Nenhum evento implica automaticamente o seguinte. O estágio atual da oportunidade é uma síntese operacional; a evidência permanece nos eventos.

## 6. Métricas e denominadores

| métrica | definição | não significa |
|---|---|---|
| Interessados | oportunidades com `interest_registered` | pessoas únicas após deduplicação automática |
| Origem conhecida | oportunidades com fonte/canal diferente de desconhecido | atribuição causal de campanha |
| Próximo passo conhecido | oportunidades com `next_step` preenchido | tarefa executada |
| Reuniões realizadas | eventos `meeting_held` | reunião transcrita |
| Propostas aceitas verbalmente | eventos `proposal_liked` | compra ou pagamento |
| Compras relatadas | eventos `purchase_reported` | receita confirmada |
| Vendas verificadas | eventos `payment_approved` ligados à evidência de pagamento | conversas, leads ou intenção |
| Conversão verificada | vendas verificadas / oportunidades elegíveis no período, com ambos os lados datados | taxa confiável quando há eventos faltantes |
| Tempo entre etapas | diferença entre datas verificadas dos dois eventos | estimativa quando uma data é relato sem fonte |
| Conversas de anúncio | contagem agregada da plataforma para um cliente | vendas do cliente ou da V2G |

Enquanto o histórico for incompleto, a tela deve preferir contagens e alertas de qualidade a taxas suaves.

## 7. Alertas de qualidade

- Venda relatada sem pagamento confirmado.
- Conversas geradas por anúncio sem vendas informadas pelo cliente.
- Reunião realizada com transcrição pendente.
- Reunião dita agendada sem evento/calendário conciliado.
- Campanha citada sem ID da plataforma.
- Receita alegada sem comprovante ou confirmação do provedor.
- Pedido aprovado sem negócio WebApp vinculado.
- Negócio/recebimento no Finance sem ID de ponte aprovado.
- Oportunidade sem responsável, próximo passo ou data.
- Inferência sem revisão humana.

## 8. Acesso e retenção

As sete tabelas têm RLS ligada e nenhum grant para `anon` ou `authenticated`. O WebApp usa `service_role` somente no servidor, depois de validar `app_metadata.autorizacoes` contendo `revops`. `app_metadata.papel = operador` isoladamente não libera nada. Nenhuma conta recebe essa autorização nesta entrega.

Retenção de interessados, conversas, transcrições e originais continua aberta. A V0 armazena só referência/metadados e resumo manual; não importa arquivo, áudio, transcrição ou mensagem real.

## 9. Contradições encontradas e adaptação

1. O relatório inicial falava em “lead” ligado diretamente a `businesses`; os casos exigem pessoa, empresa e oportunidade separados. A migration implementa as três camadas.
2. `entrevistas` exige `business_id`, então não serve para reunião pré-compra. A V0 registra reunião em `revops_interactions` e não recria `entrevistas`.
3. A política histórica que barrava Instagram fraco foi substituída em `docs/decisoes.md`: `guidance_needed` é diagnóstico/orientação, nunca veto.
4. O Finance é banco separado e não oferece ID comum com o WebApp. A integração fica desenhada, não simulada.
5. O padrão atual de telas administrativas aceita operador genérico; RevOps usa autorização mais restrita e assinada.
