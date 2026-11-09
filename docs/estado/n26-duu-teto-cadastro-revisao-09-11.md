# Dúú — teto salvo e conferência do cadastro automático QA — 09/11/2026

## 0. Resultado e dependência atual

> DECISÃO POSTERIOR DE PRODUTO — 09/11/2026: Victor esclareceu o B2B2B Piligrin → Dúú Gomes e determinou retirar custo/lucro do onboarding inicial. Produto, público e referência aproximada de preço foram informados; preço do fardo não confirma ticket médio. O próximo bloqueio é adequar o contrato/fluxo antigo, não continuar cobrando esses dois dados do Cauã. Ele foi avisado da correção às 12:37. A QA ainda não recebeu a implementação. Ver [proposta operacional e mapa](./n26-onboarding-operacional-b2b2b-proposta-09-11.md). As quatro pendências de código descritas abaixo são a medição anterior à decisão, preservada como histórico.

**Teto de R$ 3.000/mês salvo no aplicativo QA**, pela sessão nominal Victor/Piligrin. Uma submissão de `/verba`; confirmação exibida e valor recuperado após recarregar a página. Banco QA `zskpijnqgkqwxksqmzmf`, nome live `v2g-webapp-qa`: `monthly_budget=3000`, procedência **confirmado**. O Início recuperou **“Seu teto do mês é R$ 3.000,00”**, sem perder os números ou gráfico reais do Dúú.

**Cadastro automático ainda não iniciou; não é um aceite positivo do pipeline.** Antes e depois: `cadastro_estado=null`, `cadastro_iniciado_em=null`, **zero execuções vinculadas** ao negócio/cliente. Ainda faltam descrição, ticket médio, custo direto médio e lucro desejado por cliente. Não foram inventados ou completados com o texto da peça por inferência. O teste real desta rodada comprova salvar/recuperar o teto e ausência de execução com cadastro incompleto; o percurso positivo permanece dependente desses dados confirmados.

**Revisão da peça ainda pendente de Cauã.** Pedido real `0b22f424-f70b-457f-845e-c37bb50ddb5f`, mesmo negócio/hash do envio anterior: `awaiting_review`, `review_note=null`. Conferência de banco às **11:27:43 BRT** (14:27:43 UTC), sem decisão posterior registrada. A galeria cliente recuperou o mesmo pedido como recebido para revisão, sem associação a anúncio. Não se usou a aprovação por WhatsApp como substituta de uma decisão no aplicativo.

## 1. Autorização e alvo

Victor autorizou expressamente salvar o teto e validar o cadastro automático **só na QA**, além de continuar a revisão com Cauã. Não houve nova solicitação de autorização para o ato já aprovado.

| Elemento | Alvo conferido |
|---|---|
| Aplicativo | `https://v2g-webapp-qa.vercel.app/verba` |
| Negócio | Piligrin, `9cb85308-02cc-4ce7-bacf-15be77f9ba5e` |
| Sessão | Victor/Piligrin, identificada também pela navegação de Criativos/Início |
| Banco | `v2g-webapp-qa`, `zskpijnqgkqwxksqmzmf`, ACTIVE_HEALTHY |
| Backend consultado pelo conferidor de contrato | `https://ia-backend-qa.5hue9s.easypanel.host/openapi.json` |
| Peça | `0b22f424-f70b-457f-845e-c37bb50ddb5f`, JPEG Cauã, SHA-256 `0c0d48fdc3e3515f730226b6988d8b363ac854423bbb4c6bbb1c53a3ef24901c` |

Nenhum SQL de escrita foi executado pelo conector. A gravação autorizada ocorreu pela action normal da aplicação. Todas as consultas SQL desta rodada usaram somente o projeto QA acima, filtradas pelo negócio/pedido nominal. Sem produção, alteração de orçamento/campanha na Meta, cobrança, migração, deploy ou novo commit/push.

## 2. Antes e depois

| Medida no QA | Antes | Depois |
|---|---|---|
| `monthly_budget` | null | **3000** |
| Procedência do teto | Não consultada antes | **confirmado** |
| Estado/início do cadastro | null / null | null / null |
| Execuções ligadas por `business_id` ou `cliente_id` | 0 | 0 |
| Descrição preenchida (mínimo 10 caracteres) | Não | Não |
| Ticket mínimo/máximo preenchidos | Não / Não | Não / Não |
| Custo direto e lucro desejado preenchidos | Não / Não | Não / Não |
| Chaves `respostas` / `contas` no onboarding | Não consultadas antes | false / false |

O valor aproximado **R$ 100/dia** da tela é o cálculo de R$ 3.000/30, não leitura nem alteração do `daily_budget` da Meta. O orçamento da campanha não foi modificado.

Fonte da procedência posterior: leitura de `public.procedencia_do_campo('businesses', business_id, 'monthly_budget')`, retorno `confirmado`. A porta de gravação está em `lib/cadastro/procedencia.ts`; usa a RPC `confirmar_campo_do_cliente` para valor/procedência na mesma transação. Não se executou essa RPC diretamente pelo conector.

## 3. Cadastro automático — o que foi e não foi provado

- `app/(fluxo)/verba/actions.ts:94` define a action de gravação; depois de gravar, chama `dispararSeCompleto()` em `:156`.
- `lib/pipeline/disparar.ts:462` lê a sessão e o negócio; `:552` guarda a jornada com reunião pendente; `:557` monta o cadastro e **retorna antes de webhook/trava/POST quando incompleto**. As quatro pendências conferidas são compatíveis com essa guarda; não havia chaves `respostas`/`contas` que acionassem a guarda de reunião antes dela. O valor retornado pela função no request real não é exibido nem foi capturado; não se afirma ter observado diretamente o ramo exato executado.
- `lib/cadastro/montar.ts:442`, `:451`, `:459`, `:466` tratam descrição, ticket, custo e lucro; `:520` recusa montar payload enquanto há pendências.
- Não há execução/pipeline novo para observar. Não se declarou `POST /cadastro`, recebimento de webhook ou transição do n8n como concluídos a partir da confirmação de verba.
- **41/41 conferências de verba passaram** (`pnpm conferir:verba`), sem rede/banco. A linha FALHA do controle negativo é proposital e validada pelo placar, não uma falha remanescente.
- **`pnpm conferir:cadastro` passou**, com `V2G_BACKEND_URL` fixado no host QA apenas no processo do conferidor. O script lê o schema público QA e valida casos sintéticos; não faz POST de cadastro. É prova de contrato/validação, não de uma execução real completa.
- Logs do deployment QA `dpl_Gf8Fng2QNNizjBz5QLgiBUrrQtno`, projeto `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, consulta `pipeline`, janela **11:17–11:29 BRT**: nenhum registro encontrado pelos critérios. Não é prova isolada de execução bem-sucedida, ausência de erro ou chamada do webhook; os fatos positivos permanecem valor/procedência persistidos e a leitura de zero execuções.

Uma busca de workflows com nome/descrição **QA** pelo conector n8n retornou zero visíveis. Isso não demonstra que não existe workflow QA nem identifica a configuração privada usada pelo WebApp. Antes de qualquer ensaio positivo com payload completo, ainda é preciso confirmar que todo o destino do fluxo permanece no QA. Nenhum workflow foi executado ou alterado nesta rodada.

## 4. Cauã e próxima prova

Mensagem única enviada às **11:23 BRT** no grupo **🎯 03 | Operação — Gestores**. Último estado observado: **Entregue**, sem resposta posterior/decisão observada naquele ponto. Informa teto salvo apenas na QA e encaminha à peça exata:

`https://v2g-webapp-qa.vercel.app/gestor/criativos?negocio=9cb85308-02cc-4ce7-bacf-15be77f9ba5e&peca=0b22f424-f70b-457f-845e-c37bb50ddb5f`

Foi pedido que Cauã registre a decisão na própria conta, além de confirmar quais dados do Dúú devem preencher o negócio Piligrin da QA: descrição, valor médio de uma venda, custo direto e lucro desejado por cliente. Não se repetiu login/concessão nem se tomou decisão na identidade dele.

Depois do retorno:

1. Confirmar os quatro dados e o negócio de destino; gravar pela sessão autorizada do cliente, com origem preservada.
2. Confirmar o roteamento integral QA antes do primeiro cadastro positivo. Se a jornada passar a aguardar reunião, registrar esse estado em vez de remover a guarda.
3. Conferir execução única/vínculo e transição real do pipeline, caso o cadastro passe pelas guardas. HTTP 200 de webhook não basta.
4. Após a decisão do Cauã, recuperar **o mesmo pedido e retorno** pela sessão do cliente. Só então aceitar o percurso de revisão completo.

Não há automação de acompanhamento criada, cobranças repetidas ou retentativa de cadastro sem dado novo. A autorização QA segue válida para as próximas etapas necessárias; falta a informação/ação humana, não uma repetição de autorização.

## 5. Evidência e diagnóstico

Planilha no mesmo arquivo atualizada em **15 campos**, com releitura **15/15 correta** e **17 células vizinhas preservadas**. Visão geral: C8, D8, F8, C11, D11, F11, C13, D13, F13 e A23. Novembro — execução: H5, J5, K5, L5 e L4. Notas/histórico e formato preservados; as duas abas foram conferidas no Google Planilhas a 100%. O teto aparece salvo; cadastro positivo e revisão continuam com suas dependências reais, sem marcar o piloto inteiro como concluído.

Pasta `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-registro-09-11/`:

- `teto-qa-salvo.png` / `teto-qa-salvo-dom.txt`: resposta da submissão única.
- `teto-qa-apos-recarregar.png` / `teto-qa-apos-recarregar-dom.txt`: valor persistido, sem depender da mensagem transitória de sucesso.
- `inicio-apos-teto-dom.txt`: Início real, coleta **11:25:22 BRT**, teto R$ 3 mil e R$ 281,80 / 26.129 impressões / 466 cliques; gráfico disponível e cobertura 1/10 preservada.
- `cadastro-schema-qa.log`: conferência de contrato contra schema QA, sem POST.
- `cliente-revisao-apos-teto.png` / `cliente-revisao-apos-teto-dom.txt`: recarga posterior da galeria pelo cliente; mesma imagem e **Em revisão 1 / Recebido para revisão do gestor**, ainda sem retorno.
- `caua-teto-cadastro-entregue.png` / `caua-teto-cadastro-11h23-dom.txt`: encaminhamento único das 11:23 **Entregue**, sem resposta posterior visível na conferência de encerramento.
- `planilha-teto-salvo-visao.png` / `planilha-teto-salvo-execucao.png`: duas abas conferidas, mesma planilha, sem reestruturação.

Encerramento deste ato: teto salvo e recuperado; pendências do cadastro/peça mantidas com seus donos, aguardando dados e decisão de Cauã. Não houve retentativa de cadastro, duplicação de upload ou novo pedido de aprovação a Victor. Sem observação em segundo plano ou monitoramento repetitivo criado.

Sondas auxiliares somente leitura foram corrigidas: coluna de procedência inicialmente suposta não existe; a leitura correta usou a função de procedência existente. Um cast desnecessário para texto em `cliente_id` foi recusado e retirado. Nenhuma dessas consultas falhas gravou dados. Uma aba antiga do Início não respondeu ao foco; foi usada uma nova aba do mesmo navegador/host QA, sem insistência nem nova seleção de navegador.
