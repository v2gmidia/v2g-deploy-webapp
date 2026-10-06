# Jornada de outubro — contrato de execução em 06/10/2026

Este documento separa decisões diretas, código local e dependências externas. Não confirma produção, assinatura, pagamento, nota, reserva ou campanha. O recorte pedido por Victor termina em outubro; metas e frentes de dezembro ficam fora.

## Decisões recebidas

- Dois caminhos de venda: direto e assistido. Em ambos, o interessado declara CNPJ e venda por WhatsApp antes de comprar. Instagram fraco não bloqueia a compra.
- WebApp só depois de pagamento confirmado. O e-mail informado na compra recebe acesso. Um usuário pode ter vários negócios/CNPJs, inclusive agência e franquia.
- Mensalidade, compromisso inicial de seis meses. Valor escrito como “4,99”, ainda sem interpretação segura. Desconto apenas por pagamento antecipado à vista, com percentual ainda por calcular. Provedor chamado “Azes”, conta em aprovação; nome exato pendente. Pix direto pelo vendedor foi sugerido, com confirmação manual ainda pendente.
- “Não sei” continua resposta válida, mas exige segunda confirmação clara. O gestor aprofunda lacunas. A primeira campanha depende da reunião, dos acessos e de publicação manual pelo gestor.
- Agendamento em até cinco dias úteis, segunda a sexta 10h–18h de São Paulo, antecedência mínima de 30 minutos, intervalo de 15 minutos entre reuniões. Duração de 25 minutos é a regra anterior; Victor também mencionou 20 minutos em 06/10. Limite de cancelamento mencionado: 25 minutos antes; confirmar.
- Contrato com assinatura autônoma e NFS-e enviada por e-mail estão no recorte. Não existe serviço contratado de envio de WhatsApp/e-mail nesta leitura.

## Diferenças no código local

1. `app/(public)/entrar/actions.ts` permite `auth.signUp` por e-mail/senha sem evento de pagamento. `app/(protected)/layout.tsx` e `app/(fluxo)/layout.tsx` exigem sessão, mas não prova de pagamento.
2. `supabase/migrations/0001_init.sql` guarda usuário em `profiles` e negócio em `businesses`, com `profile_id` capaz de relacionar vários negócios. A RLS atual permite `INSERT` de negócio pelo próprio usuário; portanto uma trava apenas na interface não bastaria para impor compra antes do acesso. Não há CNPJ, contrato, cobrança, nota ou reserva no schema do WebApp inspecionado.
3. A maioria das páginas e ações escolhe o primeiro `businesses` do perfil com `.order("created_at").limit(1)`. Exemplo: `lib/estado/cliente.ts:311-323`, `app/(protected)/layout.tsx:54-60` e `app/(fluxo)/onboarding/marca/actions.ts:41-43`. Um seletor visual sem trocar estas leituras misturaria empresas. Leituras de `meta_connections` e `campaigns` sem `business_id` também exigem revisão.
4. O questionário chega a `agendamento_pendente` e não cria reserva: `app/(fluxo)/onboarding/concluido/page.tsx:16-24`. O pipeline está retido para essa jornada. A ficha do gestor mostra dados e procedência, inclusive a descrição original da marca.

## Contrato para implementar e provar

| Passagem | Fato confirmado por | Registro e regra |
|---|---|---|
| Interessado qualificado | Declarações do interessado, com data e versão das perguntas | Sem CNPJ ou sem venda por WhatsApp: checkout indisponível. Declaração não é validação externa. |
| Oferta e contrato | Versão jurídica aprovada e assinatura eletrônica confirmada | Identificar pagador, signatário, negócio(s), preço, vigência, rescisão e evidência; não tratar cadastro no provedor como assinatura. |
| Cobrança paga | Provedor ou conferência bancária feita por operador identificado | Vincular `lead_id`, pagador, cobrança e `business_id`; idempotência por evento/identificador externo. Comprovante enviado pelo cliente não libera acesso. |
| Acesso | Auth + vínculo autorizado do e-mail e negócio | Um usuário pode escolher entre negócios pagos que administra. O servidor valida a posse em toda ação; cookie ou parâmetro nunca concede posse sozinho. |
| Questionário | `businesses.onboarding` e procedência | Cada bloco preserva os outros. “Não sei” permanece distinto de número, campo vazio e confirmação. |
| Reunião | Provedor de calendário e registro local reconciliado | Slot exibido não é reserva. Confirmar gestor, início/fim UTC, fuso, evento externo e convite antes de exibir “marcada”. |
| Acessos e criativo | Checklist do gestor com responsável e horário | Pendência visível se faltar algo; acompanhamento manual sem prometer campanha pronta. |
| Campanha | Ação manual do gestor e leitura posterior da Meta | Criar execução uma vez, com dono e conta escolhidos; “no ar” só com veiculação confirmada. |
| Nota fiscal | Emissor fiscal | Agendamento/solicitação não equivale a NFS-e autorizada. Enviar ao cliente somente após retorno de autorização e documento disponível. |

## Escolhas técnicas propostas, ainda sem integração real

- **Agenda:** usar Google Calendar como fonte de ocupação (`freeBusy`) e como provedor de eventos, com uma camada própria de slots, reserva idempotente, histórico e futura rotação de gestores. A [API tem uso padrão sem custo adicional dentro da cota](https://developers.google.com/workspace/calendar/api/guides/quota) e [permite evento com convite e Meet](https://developers.google.com/workspace/calendar/api/guides/create-events). [Cal.com gratuito é individual; disponibilidade compartilhada e rodízio estão no plano Teams pago](https://cal.com/pricing). É uma comparação de recursos, não teste da conta V2G.
- **Cobrança, se “Azes” for Asaas:** [assinaturas recorrentes](https://docs.asaas.com/docs/assinaturas) e [webhooks](https://central.ajuda.asaas.com/hc/pt-br/articles/55668763565979-O-que-%C3%A9-e-como-funciona-o-Webhook-do-Asaas) existem. [Link de pagamento pode criar cliente duplicado](https://docs.asaas.com/docs/criando-um-link-de-pagamentos); a integração precisará reconciliar por identificador próprio. Confirmar plataforma e aprovação da conta antes de programar contra API real.
- **NFS-e, se Asaas:** [a API agenda nota vinculada a cobrança, mas o agendamento não confirma autorização pela prefeitura](https://docs.asaas.com/reference/agendar-nota-fiscal). [Eventos de nota fiscal](https://docs.asaas.com/docs/notas-fiscais-2) devem fechar o estado; município, regime e serviço precisam de validação contábil. O [preço público padrão é R$ 0,49 por NFS-e, sujeito às condições da conta](https://www.asaas.com/nota-fiscal): a automação anunciada pelo provedor não é gratuita por emissão.
- **Contrato:** o [módulo Base do Asaas informa que não faz assinatura eletrônica](https://central.ajuda.asaas.com/hc/pt-br/articles/41135582136987-Para-que-serve-a-tela-Novo-Contrato-no-Base). A [Autentique limita o plano gratuito via API a 20 documentos/mês](https://docs.autentique.com.br/api/2/precos-para-uso-via-api); não presumir que suporte a meta operacional sem custo. A minuta, forma de assinatura e retenção da evidência exigem revisão jurídica antes da compra real.
- **Avisos:** o [Google Calendar envia convite por e-mail ao convidado](https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events), mas lembretes configurados no evento são específicos do usuário e não provam que o cliente recebeu os quatro avisos. As [notificações do Asaas](https://docs.asaas.com/docs/notificacoes) são do ciclo de cobrança, não da reunião, e têm tarifas. Não usá-las como substituto de mensageria operacional ou CRM.

## Ordem de execução e prova

1. Fechar valor, plataforma, duração, gestor/calendário, minuta e emissor fiscal. Modelar identidade `pagador → negócios → usuários`, vínculo dos sistemas e eventos externos. Nenhuma migração foi criada ou aplicada nesta entrega.
2. Corrigir multiconta de ponta a ponta antes de habilitar a escolha: resolver negócio ativo sob RLS e exigir `business_id` em cada leitura/escrita da jornada. Testar duas empresas no mesmo usuário, troca, URL forjada, sessão expirada e ações antigas.
3. Construir qualificação e pagamento com ambiente de teste do provedor. Testar webhook repetido, fora de ordem e confirmação incerta. Só liberar acesso após fonte competente confirmar pagamento e contrato.
4. Construir agenda com calendário de teste; provar colisão, horário que desaparece, resposta perdida, remarcação e cancelamento. O convite e cada lembrete precisam de estado de entrega; sem serviço WhatsApp, mostrar tarefa humana e não promessa automática.
5. Fechar checklist e fila do gestor, execução única, criativos posteriores, avisos e estados de campanha. Testar sem escrever na Meta real. Fazer jornada de demonstração autenticada com dados de teste e evidência em cada passagem.

## Limites atuais

As respostas pendentes e a aprovação das contas externas impedem afirmar que compra, assinatura, NFS-e, WhatsApp ou agenda estejam funcionando. A restrição desta sessão impede migration aplicada, cobrança real, escrita na Meta e deploy. Trabalho local e testes podem avançar sem representar esses atos como concluídos.

### Isolamento parcial das leituras nesta passagem

Enquanto todas as telas ainda escolhem o primeiro negócio, as consultas dependentes que antes pegavam dados de **todos** os negócios do perfil foram restringidas ao `business_id` desse negócio: conexão e campanhas em `lib/estado/cliente.ts`, peças em `/anuncios`, conexão em `/conectar` e `/verba`, peças em `/aprovar` e `/reprovado`, e última decisão em `/inicio`. Isso evita misturar dados dessas fontes no estado atual, mas **não implementa a troca de empresa**. O seletor só pode ser habilitado quando as ações de escrita e as demais leituras usarem o mesmo negócio ativo verificado no servidor.

Em 06/10, a ação das contas passou a recusar uma chamada antiga que tente regravar uma conta já respondida ou marcada como “não sei”. Para corrigir valor confirmado, o cliente usa `/meu-negocio`; para voltar de “não sei”, usa a reabertura explícita. O teste offline executa as ações reais com sessão e gravação simuladas e comprovou que essas chamadas não fazem escrita nem disparo. `node --test scripts/conferir-onboarding-preservacao.mjs` passou 25/25, além de `pnpm typecheck`, `pnpm conferir` e `pnpm build` sem servidor dev concorrente. Não houve teste autenticado dessa correção.

Após essas alterações, `pnpm typecheck`, `pnpm conferir` e `pnpm build` retornaram código 0. Não havia processo `next dev` ou `next build` concorrente antes do build. A troca entre duas empresas e as políticas RLS em banco real seguem sem teste autenticado.

## Verificação desta passagem

- `pnpm typecheck`: código 0 após a segunda confirmação de “não sei”.
- `pnpm conferir`: código 0, incluindo os conferidores de cadastro, estado e identidade.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-ficha-operador.ts`: 14/14, código 0.
- `pnpm build`: código 0, sem processo `next dev` ou `next build` concorrente encontrado antes da execução.
- Interface autenticada, persistência Supabase real, assinatura, pagamento, calendário, WhatsApp, NFS-e e Meta: não verificados nesta passagem. Nenhum envio externo foi feito.
