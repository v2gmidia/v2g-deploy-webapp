# V2G — identidade do cliente e dados 1P entre sistemas (proposta)

Retrato local de 05/10/2026 para a entrega J01–J03 do plano de outubro–dezembro. É um contrato a decidir, não uma integração aprovada nem uma medição de produção. Não houve leitura de linhas reais dos bancos.

## O que existe no código

| Etapa | Identificador e dado | Evidência | Limite atual |
|---|---|---|---|
| LP | `leads_lp.id` numérico; nome, WhatsApp, e-mail, negócio, Instagram, consentimento e UTM | `../../lp/supabase/leads_lp.sql:21-53` | A função `inserir_lead_lp` insere e retorna apenas `{ok:true}` (`:126-151`). Não devolve o ID para a LP nem há vínculo demonstrado com uma conta do produto. O limite é por hash do IP na última hora (`:114-122`), não deduplicação por pessoa/negócio. |
| WebApp | `auth.users.id` → `profiles.id`; `businesses.id` UUID e `businesses.profile_id` | `supabase/migrations/0001_init.sql:46-48,84-112` | Uma pessoa autenticada e um negócio são entidades distintas. A ficha e o onboarding pertencem ao negócio, cujo ID é passado ao backend. |
| Backend | `business_id` e `cliente_id` enviados a `/cadastro` a partir do mesmo `businesses.id` | `lib/backend/cadastro.ts:129` | A execução tem seu próprio ID; a convenção de IDs do cadastro não transforma um lead da LP em negócio autenticado nem em pagador. |
| Finance | `clientes` = quem paga; `contas` = negócios atendidos; IDs numéricos próprios | `../../../v2g-finance/supabase/migrations/007_cliente_conta.sql:1-7,13-27` | Assinaturas e recebimentos apontam para `conta_id` (`:118-124`), mas criar assinatura em `lib/actions/clientes.ts:102-111` é gravar registro financeiro, não confirmar cobrança externa. A especificação prevê projeto Supabase separado (`../../../v2g-finance/V2G_FINANCE_SPEC.md:38`), ainda não conferido em produção. Nenhuma coluna de vínculo com `businesses.id` ou `leads_lp.id` foi localizada nas migrations consultadas. |

**Consequência:** `lead`, usuário, negócio, conta financeira e pagador não são sinônimos. Uma agência pode pagar por várias contas. E-mail, telefone ou nome servem para localizar candidatos, mas não são chave automática confiável. O plano de compra self service precisará de um vínculo explícito e auditável entre esses objetos.

**Colisão de nome:** o `cliente_id` legado enviado ao backend representa o UUID do `businesses.id` no fluxo do WebApp; `clientes.id` no Finance representa **quem paga**. Não cruzar essas colunas apenas porque ambas se chamam “cliente”.

## Contrato a fechar antes de integrar

1. **Quem compra e quem opera.** Definir se o comprador é pessoa/empresa, agência ou negócio direto; qual entidade possui o contrato e pode convidar usuários. Separar pagador de negócio atendido.
2. **Evento de conversão.** Uma transição `lead → conta` deve guardar o `lead_id` original, o novo `business_id`, o `finance_conta_id` e o `finance_cliente_id` quando existirem, com origem, data e responsável. Ausência de uma dessas chaves deve ser estado explícito, nunca correspondência presumida por e-mail.
3. **Deduplicação.** Definir chaves de idempotência para pré-cadastro, criação de conta e confirmação de pagamento; duplicatas potenciais devem ir a revisão com trilha de decisão. Um novo envio do mesmo formulário não deve criar um segundo contrato ou disparar duas execuções.
4. **Fonte da verdade.** LP registra interesse e consentimento; Auth registra acesso; `businesses` registra respostas operacionais e procedência; provedor de cobrança confirma pagamento; Finance registra contrato/competência/recebimento. Um evento de pagamento não deve ser inferido de uma tela de sucesso ou de um lead.
5. **Dados 1P.** Para cada métrica, registrar definição, período, unidade, conta, origem, data de coleta e se foi declarada pelo cliente ou medida. `vendas`, `receita`, leads e conversões precisam de conceitos separados; respostas diárias do Início não provam histórico de faturamento.
6. **Privacidade e correção.** Especificar quem pode ver/editar, consentimento aplicável, retenção, exclusão, correção e reconciliação quando os sistemas divergem. O sistema deve preservar resposta original e procedência nas correções.
7. **Carteira atual.** O 1P pedido no PDF é, primeiro, dos clientes que a V2G já atende. Inventariar conta por conta quais registros históricos de faturamento, leads e conversões existem, em que período e com qual fonte; preservar “não medido” onde faltam dados. A carga legada precisa de um vínculo revisado pelo gestor com `business_id` e conta financeira, sem criar nova compra ou novo onboarding por importação.

## Próxima prova mínima

Com um cliente de teste autorizado, seguir pré-cadastro → conta → negócio → onboarding → pagamento confirmado → conta financeira, registrando os IDs em cada passagem. Testar reenvio, mudança de e-mail, agência com duas contas, falha parcial e reprocessamento. Conferir dados reais e RLS em ambiente apropriado antes de afirmar que a ligação funciona em produção. Essa prova exige decisões de produto e integração ainda pendentes; este documento não cria tabelas nem envia dados.

**Recorte adicional:** a ação de resposta diária em `app/(protected)/inicio/actions.ts:92-103` depende de uma execução já existente e devolve mensagem de campanha não iniciada quando ela falta. Assim, esse caminho não preenche a lacuna de dados 1P de um cliente recém-comprado antes da primeira campanha.
