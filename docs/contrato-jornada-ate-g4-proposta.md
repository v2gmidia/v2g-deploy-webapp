# Proposta de contrato da jornada até o G4

Rascunho para revisão de Victor e Gabriel em 05/10/2026. Não autoriza cobrança, migration, envio ao backend, escrita na Meta ou deploy. Usa o plano de execução de 03/10 (pp. 1–3), a decisão direta de 05/10 em `docs/decisoes.md:65` e o código local. Os nomes de estado abaixo são **propostos**, não colunas ou endpoints existentes.

## 1. Regra de verdade

Cada tela afirma somente o último fato confirmado na fonte competente. Clique do usuário não confirma pagamento; slot selecionado não confirma reunião; `POST /cadastro` aceito não confirma pipeline; objeto de campanha criado não confirma veiculação. Estado incerto deve ficar visível ao operador e reconciliável antes de repetir a escrita. Cliente, negócio, pagamento, reunião e execução precisam de identificadores ligados sem aceitar `business_id` arbitrário vindo do navegador.

| Passagem | Fonte do fato | Evidência mínima antes de avançar | Falha ou resposta perdida |
|---|---|---|---|
| Interessado → compra iniciada | LP/provedor escolhido | Oferta, preço e versão do contrato aprovados; sessão de cobrança criada no servidor | Manter interessado, sem criar “cliente pagante” |
| Compra iniciada → paga | Webhook verificado do provedor | Evento autenticado, cobrança identificada e status final consultável; chave idempotente | Conciliar por id do provedor antes de gerar outra cobrança/conta |
| Paga → conta criada | Auth e vínculo de negócio | Identidade do comprador vinculada ao business correto; consentimentos registrados | Não enviar token por URL; reconciliar conta existente antes de criar outra |
| Conta criada → onboarding respondido | WebApp/Supabase | Respostas por bloco persistidas com procedência; “não sei” explícito; `onboarding.conclusao` gravado | Retomar bloco sem apagar anteriores; a conclusão não envia `/cadastro` |
| Onboarding respondido → reunião confirmada | Serviço de agenda escolhido | Reserva confirmada pelo provedor, gestor, início/fim UTC, fuso, id externo e instante | `agendamento_pendente` ou confirmação incerta; consultar pelo id/chave antes de repetir |
| Reunião confirmada → realizada | Gestor | Registro de presença e checklist de acessos/primeiro criativo; responsável e horário | Reagendar ou registrar pendência sem fingir acesso concedido |
| Reunião realizada → execução vinculada | Backend + negócio sob RLS | Escolher **uma** porta de criação: `POST /cadastro` ou `POST /onboarding/call`; vínculo `business_id` confirmado e execução única | Reconciliar `business_id`/`cliente_id`; não abrir execução pelas duas portas |
| Execução vinculada → campanha preparada | Backend/Meta | Conta e página escolhidas explicitamente; pré-voo sem desconhecidos; objeto criado pausado | Guardar motivo no operador; não tentar conta ou página por adivinhação |
| Campanha preparada → publicação manual | Gestor/Meta | Ato do gestor, revisão de orçamento real e IDs; resposta da plataforma | Não declarar “no ar” pela resposta de criação/ativação |
| Publicação manual → veiculação confirmada | Leitura da plataforma | Estado efetivo e hora da leitura, conforme `lib/veiculacao/estado.ts` | Mostrar “ainda não confirmado”, com responsável por reconciliação |

## 2. Questões que precisam de decisão

1. **Compra:** preço, oferta, cobrança recorrente, contrato e provedor. O WebApp e a LP atuais não oferecem checkout; o Finance tem recebimentos manuais. O histórico de preços em documentos antigos não é decisão vigente.
2. **Completude:** seis campos exigidos hoje por `lib/cadastro/montar.ts:147-153` ou as onze perguntas da bancada? Quando “não sei” vai à reunião, quem fecha o campo e quando? O PDF pede entrada automática, mas também prevê coleta manual de acessos; são atos diferentes.
3. **Agenda:** quem fornece horários, qual gestor recebe a reunião, duração, antecedência, remarcação e cancelamento. Google Calendar é preferência, ainda não contrato de integração (`docs/estado/onboarding-reuniao-05-10.md:3-8`).
4. **Primeira execução:** o backend tem `POST /cadastro` (`backend_v2g/src/api/rotas.py:273`) e `POST /onboarding/call` (`:481`). Escolher qual abre a execução após a reunião e como migrar dados já respondidos, para não duplicar. A trava do WebApp em `lib/pipeline/disparar.ts:550` só poderá ser liberada quando existir evidência de reunião.
5. **Gestor:** atribuição, acesso às fichas, checklist da reunião e primeira publicação. Definir canal e registro de notificação antes de enviar avisos.

**Inferência para revisão:** `/onboarding/call` nasceu para entrada incompleta e devolve `campos_faltando`; seu fechamento é explícito em `POST /execucoes/{id}/cadastro-completo` (`backend_v2g/src/api/rotas.py:481-527,571-599`). Ele parece mais ajustado a dados completados durante a reunião. `/cadastro` já nasce em `cadastro_completo` (`:273-365`) e hoje é a porta do WebApp. Antes de escolher, verificar como o gestor recupera a execução pelo `business_id`, como os dados persistidos no WebApp entram uma única vez, como se reconcilia timeout e se o fechamento dispara o workflow desejado. Nenhuma das duas portas oferece, por si só, reserva de reunião ou publicação manual comprovada.

Para a jornada que **já possui** `businesses.id`, enviar esse `business_id` derivado da sessão/atribuição do gestor; o escape `fluxo_do_gestor: true` do backend foi criado para reunião em que o negócio ainda não existe no WebApp (`backend_v2g/src/api/modelos.py:388-406`). Não usá-lo para contornar falha de vínculo do cliente autenticado.

Na tradução das respostas para `DadosDoOnboarding`, campo ausente, `null`, zero válido **onde o modelo aceita** (por exemplo, custo e lucro) e “não sei” precisam continuar distintos. O modelo declara os campos opcionais justamente para não inventar resposta durante a call, e diferencia ausente de `null` no `PATCH` (`backend_v2g/src/api/modelos.py:371-385,431-434`). A lista `campos_faltando` deve voltar à fila do gestor, sem ser preenchida automaticamente com texto ou número padrão.

O banco já descreve `entrevistas` com `business_id`, `realizada_em` e `conduzida_por` (`supabase/migrations/0010_perfil_empresa.sql:118-131`), e a migration `0025` permite registrar a reunião realizada sem transcrição. Isso serve ao fato **“aconteceu”**, não à disponibilidade ou à reserva futura; nenhuma escrita atual nessa tabela foi localizada (`supabase/migrations/0025_entrevista_sem_transcricao.sql:1-20`). Aplicação efetiva das migrations não foi conferida. Avaliar reuso na etapa do gestor sem apresentar `entrevistas` como agendamento existente.

## 3. Critérios de aceite do primeiro teste integral

- Um comprador de teste gera **uma** cobrança e **um** negócio; refresh, volta e callback repetido não criam duplicata.
- Respostas de todos os blocos sobrevivem a interrupção; campo não informado não vira zero, “não sei” não vira confirmação, e a ficha do gestor mostra a procedência.
- A reunião só aparece como marcada depois de confirmação do provedor, com horário, fuso e gestor; falha é recuperável sem reserva duplicada.
- O gestor vê acessos faltantes e o primeiro criativo, escolhe conta/página, revisa orçamento e publica manualmente. Nenhuma ação de cliente ativa campanha.
- O cliente recebe estado verdadeiro e suporte quando uma etapa falha; “no ar” exige leitura da plataforma.
- O teste guarda IDs de demonstração, horários e evidência de cada transição, sem misturar fixture com cliente real. Nenhuma campanha real é publicada para provar o fluxo sem autorização específica.

## 4. Implementação por blocos independentes

1. Fechar decisões da seção 2 e o esquema de identidade/eventos. Revisar com LP, WebApp, backend e Finance; o recorte dos identificadores e da prova mínima está em `docs/mapa-identidade-dados-1p-proposta.md`.
2. Construir agendamento com leitura de horários e confirmação idempotente; testar com calendário de teste e estados incertos. O WebApp já tem a porta `agendamento_pendente`.
3. Construir checklist e fila do gestor, inclusive primeira execução única e vínculo. Manter publicação como ato manual.
4. Integrar compra confirmada à entrada do app após preço/contrato aprovados. Validar webhook, reenvio e reconciliação antes de ativar cobrança real.
5. Construir pedido de criativo posterior, notificação e retorno ao cliente. Medir pós-veiculação e suporte.
6. Só então executar a jornada de demonstração completa e registrar o que foi efetivamente medido.

## 5. Ramo administrativo pedido pelo plano

O PDF também inclui contrato, organização no Drive, nota fiscal e contabilidade até o G4 (p. 3). São passagens próprias, ligadas à compra, e precisam de fonte de verdade e reconciliação separadas da campanha:

| Fato | Confirmação necessária | Decisão pendente |
|---|---|---|
| Contrato aceito | Versão do documento, identidade do signatário, instante e evidência da assinatura | Ferramenta, quem assina pela V2G, ordem em relação ao pagamento e política para agência com várias contas. |
| Registro organizado no Drive | ID da pasta/documento, vínculo com pagador e negócio, versão e permissões | Qual conta é dona, estrutura, nomes, acesso do gestor e tratamento de falha após contrato/pagamento. |
| Pagamento reconhecido | Evento do provedor verificado e reconciliado com conta e cobrança | Provedor, preço, modelo de assinatura, estorno e inadimplência. Um registro manual no Finance não substitui confirmação de cobrança. |
| Nota fiscal emitida | Identificador e situação consultáveis no emissor, ligados ao recebimento certo | Emissor, gatilho, dados fiscais obrigatórios, cancelamento e conciliação com contabilidade. |

O procedimento de repetição deve consultar pelo identificador externo antes de criar outro contrato, pasta, cobrança ou nota. Cada falha parcial precisa de responsável e fila de correção. Nenhum desses quatro fatos foi demonstrado nesta passagem por tela ou dado real.
