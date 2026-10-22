# Etapa 01 — ensaio final 3DS e e-mail, 21/10/2026

## Escopo e resultado

Ensaio autorizado por Victor: uma cobrança fictícia de R$ 500 no Asaas Sandbox,
cancelamento da recorrência e estorno integral. Nenhuma alteração em produção.

- Pedido QA: `6ae800e5-b4a2-4f12-a6bd-882a5a6cfcaf`.
- Negócio fictício: `3e683d9b-498a-4e07-91b2-8e840c4226ed`.
- Cobrança: `pay_j8ec6x5ibbhxk38a`.
- Assinatura: `sub_6cv3fxk3b5z3424p`.
- Parcela futura não paga: `pay_4uug2r61qjq5vxsa`, vencimento 21/11/2026.

Pagamento confirmado e evento PAYMENT_CONFIRMED recebido no QA. E-mail
`[TESTE QA] V2G | Pagamento confirmado` efetivamente localizado na caixa de
entrada de Victor, com empresa, pedido e valor correspondentes. Mensagem Gmail
`1a160b157afbfab1`; remetente `pagamentos@send.v2gmidia.com.br`.

O fluxo inicial 3DS foi usado, mas o Sandbox não apresentou desafio bancário:
isso não certifica um desafio real nem prontidão em produção.

## Limpeza verificada

Executado o script específico `scripts/qa-3ds-final-20261021.mjs --limpar`.
Nova consulta somente leitura confirmou:

- cobrança inicial REFUNDED, estorno de R$ 500 DONE;
- assinatura INACTIVE e deleted=true;
- parcela futura PENDING e deleted=true, nunca paga.

Na última consulta do QA, o ledger ainda continha apenas PAYMENT_CREATED e
PAYMENT_CONFIRMED. PAYMENT_REFUNDED ainda não observado: conciliar webhook,
sem repetir o estorno nem escrever um evento artificial para produzir sucesso.

## Pendências encontradas no ensaio

1. Turnstile não inicializou corretamente na navegação interna até pagamento.
   Primeira tentativa bloqueada antes de criar cobrança; recarregar permitiu
   continuar, com payment_attempt_count=1. Corrigir ciclo de vida do widget;
   recarregamento não é solução definitiva.
2. Assinatura criada no provedor não foi vinculada ao pedido. O validador em
   `lib/contratacao/assinatura-apos-3ds.ts` exige nextDueDate igual ao primeiro
   vencimento. O provedor gerou a parcela de novembro e avançou nextDueDate
   para dezembro. Conciliar pela primeira parcela verificada, preservando as
   travas de duplicidade; não aceitar qualquer data avançada indiscriminadamente.
3. Acesso do comprador ao negócio novo não comprovado. Victor informou precisar
   recuperar a QA04; solicitação de recuperação enviada pela tela oficial, que
   exibiu confirmação genérica. Entrega do e-mail de recuperação não verificada.
   Redefinição de senha é feita pelo próprio Victor. Como o pedido já foi
   estornado, não usá-lo para certificar liberação de compra ativa: conferir
   também as regras de vínculo e acesso após estorno antes de novo ensaio.

## O que falta para fechar 01

- Correções locais abaixo concluídas; falta publicar e repetir a prova no QA.
- Conciliar o estorno recebido pelo provedor com o ledger/estado do QA.
- Conferir recuperação e acesso por negócio, inclusive bloqueios após estorno.
- Publicar/configurar as mudanças locais da LP e provar formulário → alerta →
  WhatsApp → link direto de compra, sem pedido assistido obrigatório.
- Validar configuração e percurso de produção separadamente, com autorização.

## Correções locais após recuperação da QA04

Victor confirmou que redefiniu a senha e relatou falta de visibilidade dos campos
e tela preta após salvar. A aba seguinte foi encontrada em `/escolher-negocio`,
com três negócios anteriores visíveis e contraste legível. A tela preta não foi
reproduzida; não foi comprovada uma resposta 404 nem sua causa.

Implementado neste bloco autorizado:

- Dois controles independentes e acessíveis para mostrar/ocultar a nova senha e
  a confirmação, reutilizando o ícone da entrada sem revelar a senha de Victor.
- Após salvar e encerrar a sessão, destino público `/redefinir/concluido`, com
  confirmação e link normal para `/entrar?modo=login&adicionar=1`. A confirmação
  é informativa, não concede acesso. Falha ao encerrar a sessão tem aviso próprio.
- Fallback visível no Suspense da entrada, antes vazio. É proteção contra uma
  espera sem conteúdo, não diagnóstico comprovado da tela preta relatada.
- Turnstile com renderização explícita, montagem por componente, `onReady` para
  script já carregado e remoção do widget ao desmontar. Validação do servidor
  permanece obrigatória. Falha ao carregar recebe mensagem visível.
- Reconciliação de assinatura com data avançada somente quando a data é o ciclo
  seguinte e existe uma única primeira parcela, com identidade, referência,
  cliente, valor, vencimento, forma e estado compatíveis. Paginação incompleta
  ou divergência mantém a reserva, sem repetir criação.
- Replay de confirmação após estorno integral só recebe aceite histórico se a
  identidade canônica conferir e aquele evento exato já estiver persistido no
  ledger. Não envia e-mail, não cria recorrência nem inventa evento de estorno.

Verificação: 84 testes direcionados passaram, assim como `pnpm typecheck`.
Na bancada local `/exemplo/redefinir`, os controles foram acionados separadamente
com texto fictício e os tipos dos campos conferidos no DOM. O submit da bancada
é interceptado; nenhuma senha real foi alterada. O percurso local da confirmação
ao login também abriu corretamente. A recuperação real com a nova versão e a
verificação em largura mobile ainda precisam de ensaio. Revisão React preservou
hooks incondicionais, cleanup e separação dos estados de visibilidade.

Consulta somente leitura ao Sandbox confirmou: webhook destinado ao QA ativo,
não interrompido, sequencial e inscrito em PAYMENT_REFUNDED. O estorno segue DONE,
assinatura INACTIVE/deleted, futura excluída. A referência da parcela futura
corresponde ao pedido. Ledger QA ainda sem PAYMENT_REFUNDED na conferência deste
bloco. Falhas repetidas da confirmação são hipótese para atraso da fila, não
causa medida; não foi reativado nem alterado webhook externo.

O checkout corrigido não foi ensaiado financeiramente de novo. Nenhum commit,
push, deploy ou migration foi executado neste bloco. Os 84 testes locais não
certificam o pacote publicado, o acesso da compra nova ou produção. Revisão das
regras de acesso após estorno continua pendente; não foi revogado acesso legado
nem alterada propriedade de negócio para forçar um resultado positivo.

Referências técnicas consultadas: [montagem explícita do Turnstile](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/),
[consulta das parcelas da assinatura](https://docs.asaas.com/reference/listar-cobrancas-de-uma-assinatura)
e [entrega e repetição de webhooks](https://docs.asaas.com/docs/sobre-os-webhooks).

## O que falta para fechar 02

Conforme `e28-01-02-procedimento-assistido-20-10.md`: aprovação final do contrato
pelo advogado, representantes/poderes e evidência da versão assinada; assinatura
manual pelo Google já escolhida. Contabilizei precisa validar a operação fiscal
concreta (competência/início, pagamentos antecipados, ISS/retenções/município e
correções). Emissão real e assinatura exigem autorização. Comprovante de
pagamento não substitui NFS-e. Automação fiscal/assinatura vem depois do processo
manual validado. Etapa 02 permanece adiada por decisão de Victor.
