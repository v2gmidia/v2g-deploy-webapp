# N26-P1 — compra direta → primeiro acesso → negócio — 04/11/2026

## 0. Resultado e próximo ato

**Jornada pública ainda BLOQUEADA.** Mapeamento e primeira correção LOCAL
concluídos. Nenhuma nova compra, cobrança, mensagem, conta ou grant real.
Nenhuma migration/deploy/configuração externa executada. Histórico N26-05
permanece caminho separado para cliente já contratado.

**Primeiro defeito corrigido:** `signUpAction` aceitava um pedido com status
histórico `payment_approved` mesmo após estorno da cobrança inicial. A action
agora verifica a situação documental financeira antes de chamar Auth.
Isso NÃO corrige a autorização de contas já existentes após estorno.

Próximo bloco proposto, dono **01/02**: reconciliar a mesma regra por
pedido/negócio nas portas de acesso/vínculo/seleção de contas existentes,
preservando direitos independentes e negócios A/B. Não liberar a LP antes
dessa prova e de preparar suporte explícito a pagamentos de produção.
Victor/Central aprovam esse próximo recorte; lançamento, migrations e ensaio
externo continuam portões específicos posteriores.

## 1. Prioridade e fontes

Direção de Victor transmitida pelo Central em 04/11: compra direta é prioridade
1, antes de números/fila/piloto. Atualiza a prioridade de venda assistida
registrada em outubro, sem transformar a proteção Sandbox em defeito removível.

- [Planilha novembro](https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o),
  leitura atual: P1 exige compra → confirmação → primeiro acesso → negócio,
  sem acesso por pagamento pendente/estornado.
- [FigJam novembro](https://www.figma.com/board/Ofzj9dZqeSbqN5Uq0jZLVI),
  texto `1:13` e `1:19`, mesma prioridade e correção do primeiro defeito concreto.
- `n26-05-acesso-contratacao-historica-04-11.md`: 92 testes históricos locais
  não são prova da compra direta, de publicação ou de operação de produção.

## 2. Versões e leituras atuais

Consultas Vercel somente leitura e GETs públicos sem sessão:

| Ambiente | Versão / implantação | Observação medida |
|---|---|---|
| LP pública `v2gmidia.com.br` | `78e942984c43a5e20d9d89a09a24e6d4a8894080`, `dpl_2u4cGSYMVnKggwnbaJQwuta2uUpF`, READY | GET `/` 200; links para `#pre-cadastro`, sem link `/contratar`. `index.html` local sem diff dessa versão. |
| WebApp QA | `959e78ea4e528ed2caaed182d7b281b1ba26dc6f`, `dpl_2XUw4sXQyG7jVxudZsvRVonaWqYC`, READY | GET `/contratar` 200. Isso não confirma submissão, pagamento, e-mail ou acesso. |
| WebApp produção `v2g-deploy-webapp.vercel.app` | mesmo commit `959e78e`, `dpl_4rpY5iEieFUvjB5dKu6NuYAxcZ3w`, READY | GET `/contratar` 404. Código exige checkout isolado QA/Sandbox. |
| Local | HEAD `959e78e` + alterações não versionadas | Novo helper/correção deste bloco e N26-05 não publicados. Alterações de outras frentes preservadas. |

Supabase QA, leitura de objetos às **23:51 BRT de 04/11**: tabelas
`commercial_orders` e `commercial_payment_events` presentes;
`historical_contract_access` ausente; coluna `contractor_document_type` ausente.
Presença de tabela não prova definição/grants corretos de todas as RPCs.
Não foram lidos clientes, tokens, senhas ou valores de configuração.

## 3. Matriz da jornada

`QA/prod 959e78e` abaixo identifica a versão lida, não uma execução financeira.

| Etapa | Ambiente / versão | Prova observável e fonte | Bloqueio / dono |
|---|---|---|---|
| LP → comprar | LP pública `78e9429` | HTML/GET mostram CTA para formulário/WhatsApp. Fonte local coincidente: `lp/index.html:133`. | Não existe entrada pública para compra. **01/02 + LP**, depois de aprovar o destino de produção. |
| `/contratar` | QA 959e78e: 200; prod 959e78e: 404 | `app/contratar/page.tsx:16`; guard em `lib/contratacao/ambiente-checkout.ts`. | Integração é Sandbox, não gateway de produção. **01/02**, preparar operação de produção sem remover guards por conveniência. |
| Qualificação / pedido | Código QA/prod 959e78e; testes fictícios locais | `app/contratar/actions.ts:49`: RPC com referência, e-mail, documento, unidades, período e método; vincula ID do pedido ao pagamento. | RPC atual não foi exercitada nesta rodada. CPF/CNPJ aditivo pendente no QA; definição SQL antiga pode reutilizar negócio por contato/documento. **01/02**, auditar/aplicar unidade autorizada. |
| Pix | Código 959e78e; teste local | `app/contratar/actions.ts`: `asaas_pix` inicia pagamento; página exibe Pix do pedido. Qualificação permite semestral/anual à vista; mensal exige cartão. | Criar cobrança externa não autorizado neste bloco. **01/02 + Victor**, ensaio próprio posterior. |
| Cartão / 3DS | Código 959e78e; provas de outubro históricas | `lib/contratacao/iniciar-pagamento.ts`; webhook separa evento inicial 3DS e assinatura. | Não há nova prova de cartão nem recorrência em 04/11. **01/02**, teste autorizado após publicação/configuração própria. |
| Pendente, risco, falha | Projeção publicada 959e78e; testes locais | `consultar-estado-pagamento.ts:8`, `estado-pagamento-publico.ts:16`: não prometer aprovação; UI/polling usam mesma projeção. | Ausência de pagamento confirmado não pode virar acesso. Recusa/3DS/contestação pedem revisão. **01/02**. |
| Asaas confirmado → pedido | Código 959e78e | `app/api/webhooks/asaas-payment/route.ts:25`: Sandbox/token; parser/identidade; RPC por pedido; `CONFIRMED/RECEIVED`; gravação idempotente. 3DS/assistido confere cobrança canônica. | HTTP GET/READY não provam entrega do webhook ou configuração atual. **01/02**, E2E autorizado posterior. |
| Confirmação ao comprador | Código 959e78e | Webhook chama `processarEmailPagamento`; `lib/contratacao/processar-email-pagamento.ts:15` restringe destino QA e confere cobrança. | Nenhum e-mail enviado nesta rodada; aceite do provedor não equivale a entrega. **01/02**, medir recebimento em ensaio autorizado. |
| Estorno / estados adversos | Projeção 959e78e + correção LOCAL | Ledger por `order_id` E cobrança inicial; estorno integral/parcial/em processamento prevalece sobre status histórico. | Cadastro corrigido só local. Acesso de conta existente ainda falha no estorno. **01/02**. |
| Primeiro cadastro | Publicado: antigo. Local: N26-P1 | `app/(public)/entrar/actions.ts:90` chama `cadastro-por-compra.ts` antes de Auth; documento/e-mail exatos e situação financeira limpa. | Correção não publicada. Não promete bloqueio de compra estornada na camada de vínculo já existente. **01/02**, revisão/publicação posterior. |
| E-mail confirmado → vínculo | Código 959e78e + N26-05 local separado | `lib/contratacao/vincular-core.ts`: e-mail confirmado, pedido aprovado, negócio reivindicado e propriedade relida antes de atribuir pedido. | Ainda usa aprovação histórica; trigger Auth antigo também reivindica órfãos por e-mail. **01/02**, reconciliar estorno e identidade por negócio no próximo bloco. |
| Sessão → somente negócio autorizado | Código 959e78e + N26-05 local | `lib/contratacao/acesso.ts:32`, `lib/multiconta/elegibilidade.ts:45`: perfil/e-mail/propriedade; cookie não concede permissão. Teste local A/B pendente/misto passa. | Não consulta ledger adverso para conta existente. Defeito de estorno permanece; não afirmar isolamento financeiro completo. **01/02**. |
| Clientes já contratados | N26-05 LOCAL | Liberação explícita/evidência/aceite próprios, sem compra fictícia. | Migration/flag/publicação e piloto nominal pendentes. Não usar como atalho para a compra direta. **01/02 + Cauã + Victor**. |

## 4. Primeiro defeito: reprodução e correção limitada

Antes: pedido A, `payment_approved`, cobrança `pay_A`, evento
`PAYMENT_REFUNDED` registrado; ao enviar o primeiro cadastro, Auth era chamado
uma vez. O novo teste da action real esperava zero e falhou (`1 !== 0`).
Primeira rodada: 3 dos 6 testes falharam; pendente/cancelado já eram recusados.

Depois: `permiteCadastroPorCompra` lê todos os pedidos aprovados para o
e-mail/documento exatos, com seus IDs/método/cobrança inicial. Para Asaas,
reutiliza a projeção financeira existente, incluindo falha/leitura parcial.
Sem cobrança inicial ou consulta íntegra, não cria usuário por essa compra.
Pix direto assistido já conferido mantém seu caminho próprio. Métodos
desconhecidos não são aceitos por omissão.

Uma compra válida independente ainda pode permitir o cadastro, inclusive
para o mesmo e-mail/documento. Isso não funde negócios nem cria grant.
Consulta com erro não vira falso sucesso. Retorno neutro de cadastro mantém
a proteção contra enumeração; indisponibilidade retorna orientação de tentar.

**Limite importante:** criar conta não é conceder acesso. Este conserto fecha
o portão de cadastro; não altera `temAcessoWebApp`, elegibilidade multiconta,
claim do trigger Auth nem `vincularComprasAprovadasComCliente` neste bloco.
TOCTOU entre consulta e Auth, estorno posterior à criação, outros ciclos de
recorrência, revogação efetiva e consultas diretas sob RLS continuam fora desta
prova e precisam entrar na decisão de autorização por negócio seguinte.

## 5. Arquivos e verificação

Novos: `lib/contratacao/cadastro-por-compra.ts`,
`scripts/conferir-primeiro-acesso-compra.mjs`, este checkpoint.

Alterados: `app/(public)/entrar/actions.ts`, `package.json`,
`scripts/conferir-documento-contratante.mjs` (fixtures completas),
`scripts/conferir-checkout-self-service.mjs` (a conferência saiu da action para
helper real; testes de comportamento estão no novo conferidor).

- `conferir:primeiro-acesso-compra`: **6/6**, action e projeção reais em portas
  fictícias: A estornado/B válido, pendente/cancelado/sem pedido, Pix/cartão,
  cobrança de outro ciclo, parcial/em processamento/contestação, indisponível,
  sem charge e duas compras da mesma identidade.
- `conferir:documento-contratante`: **15/15**.
- Projeção pública + checkout self-service: **18/18**.
- Regressão N26-05 após a integração: **19/19**, sem tratar os 92 testes antigos
  como nova prova de compra ou produção.
- Multiconta dirigido: **4/4**, casos de compra pendente, aprovação, pedidos
  mistos e perfil sem pedido. Total dos testes desta rodada: **62/62**.
- `pnpm typecheck --pretty false`: passou; `git diff --check`: sem erros.

Nenhum teste chama Asaas, Auth, e-mail ou banco real; os GETs e a consulta de
objetos descritos acima foram leituras separadas. Sem build/restart compartilhado,
sem commit/push, sem escrita em LP, QA, produção, Meta ou documentos de 03/04.
Etapa 02 permanece procedimento manual jurídico/fiscal, sem conclusão inferida.
