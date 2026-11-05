# N26-P1c — preparação da compra pública — 05/11/2026

## 0. Resultado: diff zero de implementação

Usada a alternativa explicitamente autorizada pelo Central: **nenhuma mudança
de código, teste persistente, configuração, CTA ou página legal** em LP/WebApp.
Único arquivo criado neste bloco: este checkpoint/pacote de decisão.

Motivo técnico: falta o contrato seguro do **modo de produção**. O cliente
Asaas atual tem BASE Sandbox fixa; página, ações, webhook e e-mail exigem QA.
Um link/flag na LP não prepara produção. Não foi criado um destino fictício,
uma flag sem implementação nem uma exceção no guard existente.

O gate novo para LP **não foi implementado nem configurado**. O estado atual
continua fechado por ausência de link e pelos guards existentes. Não confundir
esta preparação documental com um gate novo já testado/ativável.

**Menor decisão para o próximo bloco local, dono Victor/Central:** confirmar
o destino canônico de compra e autorizar preparar um modo de produção próprio,
desligado por padrão, separado de QA/Sandbox em todas as portas. Candidato
derivado do host que a LP já usa para login:
`https://v2g-deploy-webapp.vercel.app/contratar` — hoje 404, não destino de compra
operacional. Confirmar esse host ou informar o canônico pretendido; não presumir
subdomínio novo, provedor externo ou link direto do Asaas.

Essa decisão não autoriza aplicar migration, configurar chave, publicar, ativar
flag, enviar mensagem ou cobrar. A abertura pública permanece portão posterior.

## 1. Regras e estado dos dois repositórios

- WebApp: lidos `AGENTS.md`, `CLAUDE.md`, `docs/decisoes.md` e checkpoint P1b.
  Alterações locais P1/P1b/N26-05 e de outras frentes foram preservadas.
- LP: não existem `AGENTS.md`/`CLAUDE.md` na raiz nem outros desses nomes
  encontrados no repositório; também não foram encontrados nos ancestrais
  pesquisados até `C:/`. Lidos `README.md` e `vercel.json` como instruções
  existentes. A LP é estática, sem build, com funções Vercel para contato.
  Textos legais exigem revisão; assets versionados têm cache imutável de um ano.
- `git status --short` da LP estava e terminou vazio. Nenhum arquivo da LP
  foi alterado. O WebApp já estava sujo; não houve limpeza/reversão desses dados.
- Oferta/copy/legal e mecanismos de contato existentes foram preservados.

## 2. Fatos que impedem apenas ligar uma flag

| Fonte | Fato |
|---|---|
| `lib/contratacao/asaas-sandbox.ts:4` | BASE fixa `api-sandbox.asaas.com`; nome `ASAAS_API_KEY` não seleciona o ambiente. Não colocar credencial de produção neste cliente. |
| `lib/contratacao/ambiente-checkout.ts:18` | Flag ausente é falso; somente ambiente Sandbox/banco isolado. Build HTTPS exige projeto/host QA exatos. |
| `app/contratar/page.tsx:14` | `/contratar` depende desse guard, não de um gate público novo. |
| `app/api/webhooks/asaas-payment/route.ts:25` | Webhook atual também depende do guard Sandbox antes de validar o token. |
| `lib/contratacao/processar-email-pagamento.ts:11` | E-mail de pagamento exige Sandbox seguro e tem destinatário QA específico. |
| `lp/index.html:41`, `:133` | Login usa o WebApp atual; CTA comercial leva a `#pre-cadastro`. Não há link de compra. |
| `lp/README.md` | Configuração atual documenta contato/Supabase. Não documenta um contrato de checkout público. |

Por isso, mudar só `ASAAS_ENVIRONMENT` ou adicionar URL não cria pagamento
real suportado. O trabalho de produção precisa abranger criação, consulta,
confirmação/webhook, referência ao pedido, recorrência se usada, e-mail e acesso.
Não basta flexibilizar a tela inicial.

## 3. Provas desta rodada

Leituras Vercel somente de deployment e GETs públicos sem sessão:

| Superfície | Versão / implantação READY | GET observado |
|---|---|---|
| LP pública | `78e942984c43a5e20d9d89a09a24e6d4a8894080`, `dpl_2u4cGSYMVnKggwnbaJQwuta2uUpF` | `https://v2gmidia.com.br/`: 200; sem link `/contratar` e sem link Sandbox/QA. |
| WebApp produção | `959e78ea4e528ed2caaed182d7b281b1ba26dc6f`, `dpl_4rpY5iEieFUvjB5dKu6NuYAxcZ3w` | `/contratar`: 404. |
| WebApp QA | `959e78ea4e528ed2caaed182d7b281b1ba26dc6f`, `dpl_2XUw4sXQyG7jVxudZsvRVonaWqYC` | `/contratar`: 200. |

Testes dirigidos executados sem chamadas de pagamento/e-mail:

- LP `node scripts/conferir-jornada.cjs`: **OK**; oferta mensal/anual,
  âncoras/assets, campos, links sem dados pessoais, WhatsApp, falha/simulação
  e envio duplicado. Usa portas/VM fictícias; não envia formulário real.
- WebApp, filtro `sandbox jamais|build HTTPS` em
  `scripts/conferir-checkout-self-service.mjs`: **2/2**. Banco real/projeto
  errado/ambiente produção são recusados, mesmo com a flag ligada; QA isolado
  continua aceito. Não é um ensaio financeiro completo no QA.
- Chamada isolada ao guard real com `{}`: **false**, configuração ausente OFF.
- Inspeção executável de `lp/index.html` + `assets/jornada.v6.js`: **PASS**,
  sem href de compra ou destino Sandbox/QA e com atendimento preservado.

Não foram repetidos os 82 testes de P1b como se provassem este lançamento.
GET 200/READY não demonstra pagamento, webhook, entrega de e-mail ou entrada
de um cliente real. Não foi consultado valor de variável/segredo/painel.

## 4. Especificação proposta para o gate futuro — não instalada

Se Victor confirmar o próximo bloco, preparar as duas condições independentes:

1. **WebApp:** modo de produção explícito, OFF por padrão; combina projeto,
   host canônico, banco e adaptador Asaas corretos. O browser não escolhe
   ambiente por query, formulário ou parâmetro de retorno. QA preserva seu
   guard/cliente próprios. Funções de produção não chamam cliente Sandbox.
2. **LP:** autorização de exposição separada e também OFF por padrão. Sem
   flag estritamente verdadeira + URL exata aprovada + modo público validado,
   atendimento atual permanece. Não apontar para host QA, preview, localhost,
   URL arbitrária, pagamento hospedado de terceiro ou ambiente Sandbox.

Um nome possível para essa futura configuração de LP é
`V2G_PUBLIC_CHECKOUT_ENABLED`, acompanhado de destino exato aprovado; **é
proposta de contrato**, não variável já lida pelo código. Não configurá-la
agora esperando efeito. Os nomes/implementação finais pertencem ao bloco aprovado.

O contrato de ligação deve ainda garantir: falha de carregamento não muda CTA,
sem dado pessoal propagado na URL, retorno canônico seguro, sem preço/plano
controlado pela query, e reversão para atendimento ao desligar exposição.
Cache deve permitir efetivar desligamento: HTML/configuração pública não podem
guardar uma autorização antiga nos assets imutáveis. Manter o CSP existente;
não enfraquecê-lo para viabilizar uma integração ainda não preparada.

## 5. Oferta: dados já aprovados, sem nova escolha de preço

`docs/decisoes.md` de 21/10, `qualificacao.ts` e formulário atual estabelecem:

| Plano | Unidade / valor | Método atual no código |
|---|---|---|
| Mensal | R$ 500 por conta de anúncios; permanência mínima de 6 meses | Cartão; recorrência. |
| Semestral à vista | R$ 2.850 por conta, 5% | Pix ou cartão à vista. |
| Anual à vista | R$ 5.280 por conta, 12% | Pix ou cartão à vista. |

Verba de mídia separada. Nada foi alterado nesta oferta. A abertura precisa
conferir paridade entre LP, servidor, cálculo e cobrança; não aceitar valor do
cliente como total confiável. CPF/CNPJ tem direção aprovada de 25/10 no WebApp;
a LP ainda usa CNPJ na copy/validação atual. Alinhar essa diferença em recorte
de copy/contrato de dados autorizado; não presumir que a migration/copy já mudou.

## 6. Configurações a revisar antes de qualquer abertura

Lista de **nomes**, sem leitura de valores e sem declaração de que estão
configurados. Alguns exigirão adaptação para produção; não copiar o QA.

| Área | Configuração/objeto existente a conferir | Prova requerida |
|---|---|---|
| Identidade do ambiente | `VERCEL_PROJECT_ID`, `VERCEL_PROJECT_PRODUCTION_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Host/projeto/banco exatos aprovados; service key só servidor; isolamento QA/produção. |
| Checkout | `V2G_CHECKOUT_ENABLED`, `V2G_CHECKOUT_API_ENABLED` | Modo público próprio implementado e OFF inicialmente; falta de configuração/falha mantém fechado. |
| Sandbox preservado | `ASAAS_ENVIRONMENT`, `V2G_CHECKOUT_SANDBOX_DB_REF`, `V2G_CHECKOUT_QA_DEPLOY_ENABLED` | Não usá-los para forçar produção no cliente Sandbox; ensaio negativo contra mistura de ambientes. |
| Provedor real | `ASAAS_API_KEY`, adaptador/origem do provedor | Origem oficial e conta de produção explicitamente aprovadas; cliente ainda não existe neste recorte. Nenhuma credencial real em teste. |
| Webhook | `ASAAS_WEBHOOK_TOKEN`, endpoint de confirmação | Segredo server-only, endpoint/métodos de produção corretos; identidade/cobrança/valor/pedido e replay validados. |
| Segurança | `V2G_CHECKOUT_SECURITY_ENABLED`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `V2G_TURNSTILE_ALLOWED_HOSTNAMES`, `V2G_CHECKOUT_SECURITY_HASH_SECRET` | Host real aceito; falha/limite/segurança negam escrita; sem vazamento de IP/cartão/segredo. |
| Cartão/recorrência | `V2G_CHECKOUT_3DS_ENABLED`, `V2G_CHECKOUT_3DS_SCHEMA_ENABLED`, objetos SQL correspondentes | Funcionalidade e schema homologados no ambiente correto; nenhuma assinatura duplicada; limpeza/estorno só em ensaio autorizado. |
| E-mail | `V2G_PAYMENT_EMAIL_ENABLED`, `V2G_PAYMENT_EMAIL_FROM`, `V2G_PAYMENT_EMAIL_RESEND_API_KEY`, `V2G_PAYMENT_EMAIL_QA_TO` | Remetente/domínio e destinatário correto; remover restrição QA apenas em implementação apropriada. Aceite não equivale a entrega. |
| Retorno hospedado legado | `V2G_CHECKOUT_RETURN_BASE_URL` se esse ramo for mantido | Retorno HTTPS canônico aprovado; não reativar hospedado como atalho nem aceitar redirect arbitrário. |
| Banco e acesso | Migrations comerciais/CPF-CNPJ/ledger/outbox; P1/P1b | Backup e aplicação individual autorizada; tipos/RPCs/RLS/ACL conferidos. Regressão usuário comum A/B após publicação. |
| LP futura | Destino canônico e contrato do gate de exposição ainda a aprovar | Default OFF e teste contra QA/preview/Sandbox/URL inválida; desligamento efetivo com cache real. |

## 7. Portão de publicação/ativação e donos

1. **Victor/Central:** confirmar URL canônica e autorizar o recorte local do
   modo de produção separado, sem mudar preços ou ativar pagamentos.
2. **01/02:** preparar diff revisável dos dois modos, gate de exposição e testes
   fictícios de todos os endpoints; preservar QA e incorporar P1/P1b.
3. **01/02 + Victor:** apresentar backup/migrations/configuração/publicação
   exatos por ambiente. Victor autoriza cada ato externo necessário.
4. **01/02:** publicar/homologar primeiro no ambiente de testes autorizado;
   medir Pix/cartão confirmado, pendente/falha/estorno, replay e A/B, incluindo
   conta já criada. Comparar código, objetos SQL e versão publicada.
5. **Victor:** autorizar ensaio financeiro real somente depois de apresentados
   conta, método, valor, recorrência, destinatário e plano de limpeza aplicáveis.
   Permissões antigas de cobranças fictícias não autorizam esse ensaio real.
6. **01/02 + Victor:** provar confirmação, recebimento do e-mail e acesso ao
   negócio correto, com falhas/estorno negados; jurídico/fiscal seguem manual
   separado. Só então autorizar ativação pública na LP.
7. **01/02:** verificar em HTTP/navegador a ativação e o desligamento, com
   versão/horário. Manter alternativa de atendimento e dono de incidentes.

Encerra-se este bloco com **diff zero de implementação**, LP limpa e este
pacote pronto para decisão. Não foi criada uma abertura parcialmente funcional.
