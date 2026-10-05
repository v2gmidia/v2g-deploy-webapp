# Onboarding real e reunião — 05/10/2026

## 0. Decisões necessárias para o agendamento

- Confirmar a origem dos horários disponíveis: agenda do gestor, rodízio entre gestores ou calendário de equipe; fuso de exibição `America/Sao_Paulo` e fuso de cada calendário.
- Definir duração, antecedência mínima, janela máxima, remarcação, cancelamento e quem pode editar a reserva.
- Escolher o provedor e a autenticação. Google Calendar é preferência, sem integração assumida nesta entrega.
- Definir como o gestor recebe a solicitação e como o cliente recebe a confirmação; nenhum canal foi ativado aqui.
- Definir a liberação do pipeline após a reunião e a atribuição do gestor. A trava atual impede a criação automática da execução para o onboarding real; a publicação da primeira campanha permanece manual.

## 1. Divergências verificadas

- O fluxo real tinha cinco perguntas e três contas. A continuação do visual da marca estava desabilitada em `Contas.tsx`; a bancada v4 tinha onze passos, mas só guardava respostas no navegador e incluía transcrição, uploads, conexão e verba que dependem de contratos próprios. A nova etapa usa sessão e `businesses` sob RLS.
- `montarCadastro` exige seis campos para o payload atual. A bancada também pergunta site, Instagram e WhatsApp, mas esses campos não devem virar obrigatórios por inferência. Site e Instagram já têm colunas e lista branca de confirmação; cores da marca dependem da migration `0023` aplicada, ainda não comprovada nesta entrega. Por isso a descrição visual foi guardada como resposta do cliente no JSON, sem afirmar que alimenta o gerador.
- As ações existentes disparam `dispararSeCompleto` após respostas e contas; o mesmo ocorre em verba e meu-negócio. O novo destino de produto exige a reunião antes do primeiro criativo. `lib/pipeline/disparar.ts` agora retém o envio para documentos da jornada real (`respostas` ou `contas`), inclusive quando os seis campos estiverem preenchidos. Registros já `enviando` ainda são reconciliados, e `enviado` continua idempotente. Esta trava também alcança cadastros reais antigos ainda não enviados: revisar antes de liberar qualquer um deles.
- `Não sei` é resposta, não preenchimento do campo obrigatório. Ticket agora também aceita esse estado, e todas as três contas podem ser retomadas por “Agora eu sei”. A conclusão do questionário não equivale a cadastro completo para o backend.

## 2. Estado gravado nesta entrega

`businesses.onboarding.marca = { aparencia, aparenciaNaoSei, siteNaoTenho, em }` e `businesses.onboarding.conclusao = { em, proximoPasso: "agendamento_pendente" }`. Site e Instagram, quando informados, são confirmados em suas colunas com procedência pela função existente; valores em branco não apagam respostas anteriores. A marca de conclusão só é escrita depois de campos válidos e gravação bem-sucedida. Repetir a ação sobre uma conclusão já guardada não grava nem envia novamente.

`agendamento_pendente` significa apenas que o questionário terminou. A tela não oferece horários e declara que nenhuma reunião foi marcada. Ao voltar pelo `/inicio`, o cliente é levado ao estado de conclusão enquanto ele persistir. A consulta de fichas do gestor continua disponível e suas respostas anteriores são preservadas; exibir a nova descrição visual nessa ficha exige adaptação posterior.

## 3. Contrato proposto para a próxima entrega

1. **Disponibilidade:** endpoint autenticado de leitura recebe `business_id` derivado da sessão e uma janela de datas; devolve identificador opaco do slot, início/fim em UTC, fuso e validade. Slot exibido não é reserva.
2. **Reserva:** ação autenticada recebe somente o identificador do slot e uma chave de idempotência por tentativa. O servidor reconfere disponibilidade e propriedade do negócio, cria a reserva no provedor escolhido e só então persiste `status = confirmado`, identificador externo, início/fim UTC, fuso, gestor e instante da confirmação. Resposta perdida é reconciliada pelo identificador ou chave antes de tentar criar outra reserva.
3. **Falhas:** erro, timeout ou confirmação incerta preserva `agendamento_pendente` ou `confirmacao_incerta` com texto seguro e caminho de nova consulta. Não mostrar “marcada” por clique, HTTP aceito ou slot selecionado. Notificações só após estado confirmado.
4. **Operação:** remarcação/cancelamento mantêm histórico e sincronizam o provedor. Após a reunião, um ato explícito do gestor registra acessos e primeiro criativo revisados e autoriza a próxima etapa do pipeline. A criação e publicação da primeira campanha requerem ação manual e evidência da plataforma para declarar “no ar”.

## 4. Verificações e limites

- `node scripts/conferir-onboarding-preservacao.mjs`: 20 testes offline, cobrindo retomada, preservação de blocos, campos ausentes, “não sei”, falhas de colunas/JSON e repetição sem segundo envio.
- `pnpm typecheck`, `pnpm conferir` e `pnpm build`: concluídos com código 0. O build incluiu `/onboarding/marca` e `/onboarding/concluido`. Sem servidor dev concorrente identificado. A ficha do operador passou em 11/11 testes offline.
- Interface: nenhuma navegação autenticada em navegador foi testada; a confirmação de rota veio apenas do build. Supabase real, política RLS ao vivo, aplicação da migration `0023`, POST `/cadastro`, calendário, marcação e publicação: **não verificados**. Nenhuma escrita externa foi executada nesta entrega.
