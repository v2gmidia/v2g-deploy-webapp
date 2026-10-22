# E28 01 Fechamento das lacunas do ensaio

Bloco de leitura externa e verificação local solicitado pelo Central na noite
de 21 para 22/10/2026. Conferência externa por volta de 23h04–23h10 de 21/10,
horário de Brasília. Sem nova operação financeira, deploy, migration ou mudança
de configuração. A etapa 01 continua aberta; etapa 02 permanece adiada.

## O que depende de Victor ou de novo portão

1. Publicação QA do pacote já versionado, após revisão do commit exato. O HEAD
   local não é o commit do endereço fixo. Este bloco não publica por dedução.
2. Sessão Asaas Sandbox para ler Integrações → Logs de Webhooks e obter o evento,
   horário, HTTP e resposta correspondentes ao estorno. Sem reenviar ou reativar
   fila neste escopo. Não foi solicitado outro reset ou nova cobrança.
3. Decisão mínima de acesso: impedir novas liberações a partir de compra
   integralmente estornada, preservando conta Auth e negócios anteriores?
   Proposta ainda não ativada. Compras já vinculadas exigem tratamento por
   negócio, sem suspensão global nem remoção automática de direitos existentes.
4. Quando houver versão QA correta, sessão QA04 identificada para percorrer a
   navegação. A sessão aberta nesta rodada não certifica QA04. Não usar a compra
   já estornada para certificar compra ativa e liberação nova.

## Publicação medida

- Git começou limpo, HEAD `3d85890520f32271fd0ae147dd63c2e906dec5ee`.
- `get_deployment(v2g-webapp-qa.vercel.app)` retornou READY,
  `dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS`, projeto `v2g-webapp-qa`,
  `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, com alias fixo.
- Commit efetivamente publicado: `fbf00ee3af7fb3cc8c06931138011a49bcd85236`.
- O diff desse commit para HEAD contém as correções de Turnstile, primeira
  parcela da assinatura, `/redefinir/concluido` e replay após estorno. Não estão
  provadas no QA fixo. Campo target=production pertence ao projeto QA, não ao
  projeto de produção da V2G.

Não foi feita publicação, merge ou push. O plano de coordenação ainda dizia v4
quando lido; o Central mantém sozinho sua atualização e os quadros externos.

## Estorno e webhook

GETs do Sandbox pelo script específico do ensaio, sem flags de limpeza:

- `pay_j8ec6x5ibbhxk38a`: REFUNDED, R$ 500, refund DONE.
- `sub_6cv3fxk3b5z3424p`: INACTIVE/deleted.
- `pay_4uug2r61qjq5vxsa`: PENDING/deleted, nunca paga; referência corresponde
  ao pedido. Nenhum POST/DELETE financeiro foi executado neste bloco.
- Webhook `e341cd5c-5749-4115-9575-2977cc11f7fc`: ativo, interrupted=false,
  SEQUENTIALLY, destino QA exato, inclui PAYMENT_REFUNDED. Outro webhook da conta
  está interrompido, mas não tem esse destino nem inscrição de estorno; não foi
  tratado como causa do problema do QA e não foi alterado.

SELECT no QA `zskpijnqgkqwxksqmzmf` ainda mostra somente PAYMENT_CREATED e
PAYMENT_CONFIRMED para `6ae800e5-b4a2-4f12-a6bd-882a5a6cfcaf`.
IDs originais registrados:

- `evt_05b708f961d739ea7eba7e4db318f621&23026389`.
- `evt_15e444ff9b9ab9ec29294aa1abe68025&23026390`.

O pedido conserva status histórico payment_approved e provider_subscription_id
nulo. Não foi escrito um evento de estorno artificial. Não foi usado replay
externo para produzir aprovação.

A Vercel recusou a janela de três horas por retenção do plano; consulta posterior
de 30 minutos não encontrou logs do caminho. Isso não prova que não houve
requisição. Os logs Asaas são disponíveis na interface web, não no endpoint de
configuração de webhooks. A tentativa de acesso ao painel chegou ao login sem
sessão; nenhum campo de senha foi lido/preenchido e nenhuma recuperação foi
solicitada. Referência: [Logs de Webhooks](https://docs.asaas.com/docs/logs-de-webhooks).

Hipótese que permanece aberta: confirmação antiga com erro de conciliação 503
retém o fluxo sequencial; depois do estorno a versão publicada rejeita a consulta
canônica cujo status já mudou. O defeito de tratamento de replay está coberto no
código local, mas, sem os logs do evento, não é causa remota comprovada. A
publicação/revisão desse pacote vem antes de qualquer pedido de reenvio.

## Política implementada de vínculo e acesso

FATOS de código:

- `lib/contratacao/vincular-core.ts:27` consulta pedidos por e-mail verificado e
  payment_approved. Não consulta commercial_payment_events. Só reivindica linha
  órfã com claim_email exato; relê propriedade antes de vincular o pedido.
- `lib/contratacao/acesso.ts:21` permite entrada pelo pedido histórico aprovado,
  perfil, e-mail verificado e negócio próprio; legado e operador têm seus
  caminhos separados. Não consulta estorno.
- `lib/multiconta/elegibilidade.ts:41` resolve cada negócio pelo pedido aprovado
  ou marco legado; cookie não concede permissão. Não consulta estorno.
- `lib/contratacao/estado-pagamento-publico.ts:20` já mostra refunded quando o
  ledger recebe PAYMENT_REFUNDED. Esse estado visual não é revogação de acesso.

FATO externo: o pedido e o negócio do ensaio agora têm o mesmo proprietário,
correspondente ao e-mail QA04. O vínculo foi observado após o estorno confirmado;
o timestamp exato da reivindicação não foi medido. O código atual permite esse
vínculo enquanto o pedido conservar a aprovação histórica. Não se conclui daqui
que houve entrada pela interface nem uma compra ativa homologada.

Os três negócios exibidos na aba `/escolher-negocio` após reload pertencem a
outro perfil, conforme comparação SQL por IDs. Portanto aquela aba não foi
aceita como evidência de sessão QA04. Não houve troca de dono, login, exclusão,
convite, reset nem tentativa de capturar credenciais.

INTERPRETAÇÃO: receber o estorno no ledger sozinho não fecha a política de
liberação. Tratar conta Auth, acesso a cada negócio e permissão de operação
separadamente; não cancelar o login inteiro por estorno de um pedido. Preservar
os negócios anteriores pagos. A menor decisão proposta está no portão 3.

## Testes e arquivos deste bloco

- Novo `scripts/conferir-webhook-estorno-handler.mjs`: cinco testes do handler
  real com portas em memória. Replay registrado estornado dá 200 sem e-mail ou
  recorrência; evento desconhecido/falha do ledger não recebe aceite histórico;
  estorno original e replay alcançam a RPC correta; conciliação incompleta não
  finge sucesso; token inválido bloqueia antes do banco.
- Novo `scripts/conferir-politica-pos-estorno.mjs`: quatro testes de
  CARACTERIZAÇÃO, não de homologação de revogação. Demonstram o descompasso entre
  estado financeiro e aprovação histórica, preservação do negócio antigo,
  rejeição de outro perfil/e-mail e claim atual sem leitura do ledger.
- `scripts/conferir-jornada-comercial-portas.mjs`: dois testes passaram sem
  alteração. A expectativa antiga de alerta LP está satisfeita pelo código atual
  com portas simuladas; não prova entrega real do alerta nem publicação da LP.
- `pnpm typecheck`: passou. Não se repetiram os 84 testes anteriores nem a prova
  HTTPS de 17 casos de criativo; não há código de runtime novo neste bloco.

Os nove testes novos não fizeram rede e não substituem teste da RPC PostgreSQL,
Auth real, evento externo ou comportamento do commit publicado. Não foi iniciado
build nem reiniciado o dev compartilhado. Alterações concorrentes de 03/04 em
`docs/recebimento-cliente-meta.md` e seu checkpoint foram preservadas.

## Impedimentos reais para fechar 01

Em QA: publicar pacote revisado; obter logs e conciliar estorno original; decidir
política e testar seu comportamento por negócio; provar navegação/isolamento com
identidade QA04; validar alertas da LP no ambiente publicado. A prova financeira
e de e-mail já feita continua válida no seu recorte, sem necessidade de repeti-la
por conveniência.

Em produção: configuração, aprovação de 3DS/tokenização, webhook, página de
compra pública, contato/alerta LP e teste controlado de acesso continuam portões
separados. Sandbox sem desafio bancário não certifica 3DS real. Este bloco não
abre produção nem habilita cobrança real.

Etapa 02: procedimento manual preservado; contrato final, poderes do signatário,
assinatura e parâmetros fiscais continuam pendentes. Sem automação fiscal,
assinatura, alteração legal ou emissão esta noite.

Apoio ao 07/08: `e28-qa-schema-apoio-01-02-22-10.md`. Nada foi aplicado no banco
nem editado no backend. O Central faz a passagem, sem mensagens a outros chats.
