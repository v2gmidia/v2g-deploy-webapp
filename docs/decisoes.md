# Decisões — o canal humano → sessões

Decisões de produto e arquitetura tomadas **fora do Claude Code** (no chat, em
conversa entre os sócios, ou sozinho). Toda sessão lê este arquivo antes de
começar um lote.

**Precedência:** este arquivo vence qualquer briefing colado num prompt. Se um
prompt contradiz uma decisão registrada aqui, diga a contradição antes de
escrever código.

**Formato:** uma entrada por decisão, mais nova em cima. Registre o que foi
decidido, quem decidiu, e — quando houver — o que foi descartado e por quê.
Decisão sem data não vale; decisão sem motivo é ordem, não decisão.

---

## Em aberto — dependem de decisão humana

<!--
Sessões: quando esbarrarem numa decisão que não é de vocês, acrescentem aqui
em vez de escolher sozinhas. Removam a linha quando a decisão for registrada
na seção de baixo.
-->

- [ ] **Saída antes do prazo e antecipação:** Victor definiu cobrar os meses restantes se houver saída antes dos seis meses, sujeito à revisão jurídica da minuta e dos efeitos do pagamento antecipado. O anual à vista tem desconto de 12%; a execução financeira e jurídica ainda depende do contrato aprovado. — 06/10/2026
- [ ] **Conciliação do Pix assistido:** Victor escolheu chave Pix direta e disse que o comprovante do comprador basta para conferência manual. Comprovante enviado não é evidência bancária de liquidação; falta definir responsável, registro e tratamento de contestação antes de converter isso em acesso automático. Cartão assistido usa link manual do Asaas enquanto a conta está em aprovação. — 06/10/2026
- [ ] **Entrada no WebApp após pagamento:** A trava no cadastro, no proxy e nos layouts exige pedido aprovado vinculado ao perfil e e-mail confirmado; os dez perfis legados conservam acesso. `/pedidos` agora registra e aprova manualmente a venda Pix assistida a partir das declarações e do comprovante. Falta verificação autenticada ponta a ponta, comunicação ao comprador, conciliação externa e caminho self-service/cartão. Não tratar o funil comercial como completo. — 06/10/2026
- [ ] **Troca e renovação de contas contratadas:** A escolha de uma conta nova ocupa transacionalmente uma unidade de pedido aprovado (migration 0030) e a API autenticada não grava diretamente em `ad_accounts`. Falta definir como substituir conta já ocupada sem cobrar outra unidade, como renovar a mesma unidade mensalmente e como reconciliar contas legadas com compras adicionais. — 07/10/2026
- [ ] **Contrato e nota fiscal:** Acesso após pagamento aprovado; assinatura eletrônica na jornada seguinte e envio automático da cópia concluída ao cliente. A campanha só deve ser publicada após assinatura comprovada. Assina pela V2G Victor; pelo cliente, ao menos um sócio ou dono com poderes de representação. Dois contratos anteriores enviados em 06/10 são referência histórica, mas preveem ausência de fidelidade, primeira cobrança na assinatura e app indisponível, em conflito com a oferta atual; ver `estado/contratos-legados-comparacao-06-10.md`. Falta minuta jurídica revisada, ferramenta de assinatura, regime tributário/código de serviço para NFS-e e configuração fiscal do Asaas. A NFS-e de exemplo enviada em 06/10 informa Curitiba/PR e inscrição municipal 13448418, mas não prova regime nem enquadramento tributário aplicável a futuras notas. Nenhuma assinatura ou emissão deve ser afirmada sem retorno do respectivo provedor. — 06/10/2026
- [ ] **Atraso da mensalidade:** Victor sugeriu pausar a campanha após 24 ou 48 horas sem pagar, sem prazo final decidido. Definir carência, avisos, contestação, responsabilidade operacional e condição de retomada antes de qualquer pausa; esta proposta não autoriza escrita na Meta. — 06/10/2026
- [ ] **Mensagem da oferta tecnológica:** Victor quer vender a tecnologia e espera reduzir erros operacionais. “A máquina não erra” foi uma expectativa expressa na conversa, sem medição que sustente promessa pública de erro zero. Definir benefícios demonstráveis e limites antes de usar essa frase em LP ou checkout. — 06/10/2026
- [ ] **Qualificação e aviso sobre Instagram:** CNPJ e venda por WhatsApp continuam travas de entrada por declaração do interessado; Victor dispensou prova externa nesta fase. Instagram fraco não impede a compra. Falta definir o registro do diagnóstico do gestor e o canal de aviso ao cliente, sem prometer campanha pronta quando houver pendência. — 06/10/2026
- [ ] **Operação da agenda:** reunião de 25 minutos, remarcação até 25 minutos antes; cliente pode avisar ausência a qualquer momento. Valem cinco dias úteis, 10h–18h, 30 minutos de antecedência e 15 minutos de intervalo. Victor escolheu `victor.cabral@v2gmidia.com.br` para o piloto. A página Google foi salva com antecedência mínima de uma hora, pois o editor não aceitou 30 minutos. Faltam conciliação da reserva com o WebApp, limite de remarcação, tratamento de ausência de vaga e canal de acompanhamento sem reserva. — 06/10/2026
- [ ] **Agenda e avisos:** A página Google “Reunião inicial V2G” está criada na agenda de Victor, com Meet, formulário que exige CNPJ e quatro lembretes por e-mail. O WebApp oferece o link ao concluir o onboarding, mas ainda não identifica evento reservado; não deve exibir “marcada” sem conciliação. Rodízio e avisos por WhatsApp exigem integração própria. — 06/10/2026

- [ ] **O card só pergunta sobre ONTEM — dia pulado é dia perdido.** Medido
      em 01/09: `diaDeOntemEmSaoPaulo` é fixo, e o componente recebe UM dia.
      Se o dono ficar três dias sem abrir o app, os dias 1 e 2 nunca são
      perguntados — não há tela que os alcance, e o backend não guarda
      pergunta não respondida ("só existe resposta"). Não apareceu no teste
      porque foi tudo no mesmo dia; aparece no primeiro fim de semana.
      Saídas: (a) o card pergunta o dia mais antigo em aberto, e aí falta
      decidir até onde voltar; (b) o disparador cobre, e a tela continua só
      de ontem — mas o furo dura enquanto ele não existir. — levantado em 01/09

- [ ] **Não existe marca de "conta de anúncio escolhida" no schema.** A
      única marca é `campaigns.ad_account_id`, e `campaigns` tem zero
      linhas — enquanto o negócio conectado tem TRÊS contas ativas (medido
      em 15/09). A regra de EXIBIÇÃO está decidida (abaixo, 15/09); o que
      continua aberto é se a escolha deve virar registro próprio, gravado
      quando o cliente escolhe na `/conectar/escolher`, em vez de só nascer
      junto da campanha. — levantado em 15/09
- [ ] **Cartão branco dentro de `.auth-card` branco.** Nas telas do
      `(fluxo)`, o cartão de dentro só se separa pela borda. É decisão de
      layout, não de borda; vira item próprio. A lista das telas está em
      `docs/estado/visual-controles-2-15-09.md` §0.1. — 15/09
- [ ] **Escala de espaço (4/8/12/16/24/32).** Proposta em `docs/tokens.md`.
      Mexe em 340 de 469 valores e vira lote próprio, depois do 2b. — 15/09
- [ ] **`tema-opcao` como variação "escolha-cartão".** Fora do 2b. — 15/09

- [ ] **Trava de completude do cadastro: 6 campos ou 11?** O app conta 6, o
      backend exige 11 no modo `gerar`. Subir para 11 pode barrar cliente que
      hoje passa. — levantado em 22/08
- [ ] **`origem_criativo` está cravado em `lib/cadastro/montar.ts`.** Trocar por
      valor vindo do payload exige acrescentar pergunta ao onboarding, o que é
      mudança de produto. — levantado em 22/08

---

## Decididas

### 2026-10-06 — Sem comparações de marca na comunicação
**Correção direta do Victor.** A comunicação da V2G não deve usar o nome de outra empresa como analogia, slogan, referência estética ou argumento de venda. Nomes de plataformas e provedores podem aparecer quando identificam uma integração necessária ao cliente. Esta regra vale para telas e materiais públicos; referências técnicas internas não são copy para publicação. A comparação antiga que aparecia na abertura de `AGENTS.md` e `CLAUDE.md` foi removida.

### 2026-10-06 — Anual à vista, saída antecipada e signatários
**Decisões diretas do Victor, posteriores aos registros abaixo.** Mensalidade vigente de R$ 500 por conta de anúncios. No plano anual pago à vista, aplicar desconto de 12% sobre doze mensalidades: R$ 5.280 por conta, economia de R$ 720 frente a R$ 6.000. Não há desconto aprovado para seis meses antecipados nem para parcelamento. Se o cliente sair antes dos seis meses mínimos, a proposta é cobrar os meses restantes, sujeita à revisão jurídica antes da assinatura. Victor assina pela V2G; pelo cliente assina ao menos um sócio ou dono com poderes de representação. Victor autorizou criar e aplicar migration para compras, assinaturas, notas e multiconta, com verificação do banco compartilhado antes da aplicação. Regime tributário e código de serviço permanecem pendentes de confirmação com o contador.

### 2026-10-06 — Correção do preço para R$ 500
**Correção direta do Victor, posterior à decisão de R$ 495 abaixo.** Manter R$ 500 mensais por conta de anúncios porque já existem clientes pagando esse valor. A unidade de cobrança e a permanência mínima de seis meses permanecem. Qualquer minuta nova e cálculo local devem usar R$ 500; a passagem anterior de R$ 495 fica apenas como histórico, não como preço vigente.

### 2026-10-06 — Conta inicial do Google e exemplo de NFS-e
**Decisões e evidências novas.** Victor autorizou o piloto da agenda em `victor.cabral@v2gmidia.com.br` e enviou uma NFS-e anterior da V2G como exemplo. A nota registra inscrição municipal 13448418 em Curitiba/PR. A alíquota daquela operação não foi aprovada como regra geral de emissão. O contrato parametrizado está em [`estado/contrato-parametrico-outubro-06-10.json`](./estado/contrato-parametrico-outubro-06-10.json), ainda para revisão jurídica.

### 2026-10-06 — Assinatura sem aprovação manual e cartão recorrente como evolução
**Decisões diretas do Victor.** O contrato padronizado deve ser preenchido e enviado à assinatura eletrônica automaticamente; quando todos os signatários necessários concluírem, a cópia assinada deve chegar ao cliente e ficar registrada para a V2G, sem aprovação manual de cada contrato. O cliente tem acesso ao WebApp após pagamento aprovado e pode preencher o cadastro e marcar a reunião, mas a primeira campanha não deve ser publicada enquanto a assinatura estiver pendente. Na reunião, o gestor pode lembrar o cliente de assinar. Victor também quer, além do link de cartão manual inicial, cobrança mensal automática em cartão quando a integração com Asaas estiver pronta; falha de cobrança não é pagamento confirmado. A minuta e as consequências da saída antes de seis meses continuam sem decisão jurídica.

### 2026-10-06 — Valor, unidade de cobrança e execução assistida
**Decisões diretas do Victor.** A oferta inicial é R$ 495 por mês **por conta de anúncios**, com permanência mínima de seis meses. Pagamento antecipado de seis ou doze meses pode existir, sem desconto definido até cálculo financeiro. O provedor é Asaas, cuja conta ainda está em aprovação. Na venda assistida, Pix direto por chave é o caminho inicial, com envio de comprovante e conferência manual; cartão usa um link Asaas criado manualmente por Victor. Victor considera o comprovante suficiente, mas a implementação deve distinguir comprovante recebido de liquidação bancária confirmada para não afirmar fato que a fonte não demonstra. Pagamento confirmado libera o WebApp; a assinatura contratual vem depois do acesso. Um contrato padrão preenchido por dados do comprador e assinado digitalmente é o objetivo, sujeito à minuta aprovada e ao provedor de assinatura. NFS-e pelo Asaas é a primeira opção a validar, sem tratar emissão solicitada como autorizada.

### 2026-10-06 — Reunião de 25 minutos e avisos inicialmente manuais
**Decisões diretas do Victor.** A reunião dura 25 minutos. O cliente pode remarcar até 25 minutos antes e avisar a qualquer tempo que não poderá comparecer. Os avisos serão manuais no início, mas a automação por e-mail e WhatsApp deve ser preparada. Google Calendar é a preferência para agenda; ainda falta identificar gestor e calendário autorizados e testar disponibilidade/reserva. O cliente deve resolver a maior parte do cadastro; somente os campos que não souber chegam como pendência ao gestor.

### 2026-10-06 — Recorte até outubro, multiconta e lacunas assumidas
**Decisões diretas do Victor.** A execução pedida agora cobre as entregas até outubro, não as metas de dezembro. Um e-mail pode administrar vários CNPJs/negócios, inclusive agência, franquia e empresas do mesmo dono; o acesso individual vem do e-mail informado na compra depois da confirmação do pagamento. A qualificação de CNPJ e venda pelo WhatsApp depende da declaração do interessado nesta fase, sem consulta externa obrigatória. Todo “não sei” no onboarding deve receber uma segunda pergunta clara de confirmação, sem forçar dado inventado; o gestor vê e aprofunda as lacunas. Acessos que faltarem após a reunião continuam como pendência acompanhada por WhatsApp, sem afirmar campanha pronta. Contrato e NFS-e fazem parte do recorte de outubro, com o máximo de automação compatível com prova real de assinatura e emissão. A mensalidade não inclui desconto para pagamento parcelado; eventual desconto é apenas para antecipação à vista, após cálculo e decisão do percentual.

### 2026-10-06 — Instagram fraco não bloqueia a compra; atendimento das 10h às 18h
**Correção direta do Victor.** O negócio pode comprar pelo self-service ou com o time de vendas mesmo que seu Instagram esteja fraco. Esta decisão substitui a trava de Instagram registrada mais abaixo para os primeiros 50 clientes: a V2G aceita o risco de orientar o cliente após a compra para viabilizar a entrada inicial. Antes da reunião de acessos, o gestor dedica cerca de dez minutos ao diagnóstico da presença digital. Se a estrutura estiver fraca, comunica o problema e orienta o cliente; no caminho assistido, o vendedor também pode antecipar o aviso. Isso não converte diagnóstico em campanha pronta nem autoriza afirmar resultado. CNPJ e venda por WhatsApp continuam requisitos para comprar. Reuniões em dias úteis, das 10h às 18h, no horário de São Paulo.

### 2026-10-06 — Mensalidade, janela de cinco dias úteis e análise prévia do Instagram
**Esclarecimentos diretos do Victor.** A cobrança da oferta é mensal; o valor exato permanece em aberto. O cliente pode escolher reunião nos cinco dias úteis seguintes, sem sábados e domingos. Se não marcar, a V2G continua o acompanhamento até a marcação; isso não autoriza declarar uma reserva inexistente nem envio de mensagens sem definir canal e cadência. Antes da reunião em que recolhe os acessos, o gestor dedica cerca de dez minutos para olhar a presença digital e decide se o Instagram está minimamente apresentado. A consequência dessa avaliação foi esclarecida na decisão mais nova acima.

### 2026-10-06 — Entrada: dois caminhos, qualificação antes de pagar e acesso só após pagamento
**Decisão direta do Victor, com a restrição de Instagram substituída acima.** Haverá compra direta e fechamento assistido. Ambos passam pela qualificação antes da compra; o WebApp é liberado somente depois de pagamento confirmado. Sem CNPJ ou sem venda por WhatsApp, o interessado não pode comprar nesta fase. Victor inicialmente restringiu a carteira de até 50 clientes a negócios com Instagram bem estruturado; a decisão mais nova acima retirou essa trava. Branding e processo comercial forte caracterizam o perfil ideal. Processo comercial ainda fraco não é veto automático: pode receber orientação consultiva. A prova de CNPJ e o mecanismo de liberação ainda precisam de contrato operacional. A venda direta não deve ser exposta sem aplicar as mesmas travas do atendimento humano.

### 2026-10-06 — Onboarding e reunião: não sei aceito, equipe compartilha disponibilidade
**Decisão direta do Victor.** O cliente pode concluir o questionário com “não sei”; antes de aceitar essa resposta, a pergunta deve ajudá-lo a estimar ou pensar de outra forma, sem forçar chute. O gestor vê todas as lacunas e as aprofunda na reunião. Os horários vêm da disponibilidade compartilhada da equipe. O cliente escolhe um horário e recebe o nome do gestor designado; no começo haverá um gestor, com rodízio automático quando a equipe crescer. Duração pretendida de 25 minutos; só dias úteis. Enviar convite de calendário com link de reunião e avisos por e-mail e WhatsApp. Lembretes pretendidos: um dia, duas horas, 30 minutos e cinco minutos antes. Cliente deve poder remarcar e cancelar sozinho; atendimento automatizado no WhatsApp é uma alternativa futura. Limite da janela e regras técnicas constam em aberto acima.

### 2026-10-06 — Primeira campanha e criativos posteriores continuam com o gestor
**Decisão direta do Victor.** O mesmo gestor que trata acessos na reunião prepara e publica manualmente a primeira campanha. Depois, o cliente envia novo criativo pela aba do WebApp; o gestor recebe uma pendência, analisa, publica manualmente e o cliente é avisado após confirmação. A publicação direta pelo cliente é direção futura, dependente da aprovação e dos controles necessários; não está liberada nesta fase.

### 2026-10-05 — Onboarding termina com reunião pendente; primeiro criativo e campanha são conduzidos pelo gestor
**Decisão direta do Victor nesta entrega.** Ao concluir as respostas, o próximo passo do cliente é escolher data e horário da reunião com o gestor. Os acessos e o primeiro criativo são tratados na reunião; o gestor publica a primeira campanha manualmente. A conclusão do questionário não marca reunião, pagamento ou campanha no ar. Google Calendar é preferência, mas provedor e origem dos horários continuam em aberto. O WebApp guarda `onboarding.conclusao.proximoPasso = agendamento_pendente` e retém o disparo automático do pipeline desta jornada até existir um estado de reunião confirmado. Contrato proposto em [`estado/onboarding-reuniao-05-10.md`](./estado/onboarding-reuniao-05-10.md).

### 2026-09-15 — `pages_manage_ads` entra no login; a `/aprovar` passa a disparar a criação da campanha
**Duas decisões trazidas pelo Victor no chat. A segunda é do Gabriel.**

**1. `pages_manage_ads` entra na lista de escopos** (`lib/meta/oauth.ts`),
sem remover nenhum dos cinco que já estavam, e vai junto no pedido de App
Review. Os seis pedidos passam a ser: `ads_read`, `ads_management`,
`business_management`, `pages_show_list`, `pages_read_engagement` e
`pages_manage_ads`. (`public_profile` continua vindo por padrão, sem ser
pedido.)

*O que isso faz com quem já conectou, e é imediato:* escopo novo não é
concedido retroativamente. A `/conectar` compara concedidos × pedidos
(`conectar/page.tsx:40-42`), então a única conexão existente — o negócio
V2G, `a85c37a9` — passa a cair em `precisaReconectar` e vê o pedido de
refazer a conexão. Nada quebra enquanto ele não refizer: nenhuma linha do
código exerce o escopo novo, e o token atual continua válido.

**2. A `/aprovar` dispara a criação da campanha — decisão do Gabriel.**
Isto **substitui** a regra "o webapp lê estado, não o empurra", que está
escrita em dois lugares e passa a valer como histórico:
`docs/o-que-o-webapp-consome.md` §2, que classifica `POST /campanhas`
entre as 26 rotas "de outro cliente — n8n e scripts", e
`docs/disparo-pipeline.md` §1 ("Uma rota. Uma.").

*Registro não é implementação, e três coisas continuam de pé antes de ela
existir:* (a) `POST /campanhas` exige execução em `estrutura_pronta`, e as
8 nesse estado têm `business_id` **e** `cliente_id` nulos — sem vínculo não
há dono para conferir antes de gastar dinheiro de terceiro
(`backend-integracao.md` §1); (b) `TIMEOUTS.campanha` é 300.000 ms, e
`backend-integracao.md` §4 diz que nenhum acima de `rapido` cabe num
request de navegador — o padrão prescrito é dispara-e-consulta; (c)
`/saude` responde `mocks: {meta: false}`, então a chamada é escrita real na
Meta e exige autorização humana explícita (`CLAUDE.md`).
Medições em [`estado/pre-voo-no-aprovar-15-09.md`](./estado/pre-voo-no-aprovar-15-09.md).

### 2026-09-15 — A conta de anúncio não se adivinha; o pré-voo entra na `/aprovar`
**Decisões do Victor, no chat, sobre o escopo mínimo do App Review da Meta.**

Registro do lote em [`estado/pre-voo-no-aprovar-15-09.md`](./estado/pre-voo-no-aprovar-15-09.md).

**1. Dos três itens, só o item 2 entra agora.** A `/aprovar` passa a mostrar
a Página conectada, as contas de anúncio e os requisitos de subida, lidos de
`GET /campanhas/pre-requisitos`. Só leitura.

**2. O item 1 está PARADO — nada de `UPDATE` em `execucoes` nem de
`POST /campanhas`.** O Victor está investigando no backend por que as
execuções nascem sem `business_id`.
*Por que isso trava o item 1, e não é preciosismo:* a rota exige execução em
`estrutura_pronta`, e as 8 nesse estado têm `business_id` **e** `cliente_id`
nulos. Sem vínculo não há dono para conferir, e `backend-integracao.md` §1 é
explícito: "não existe rede de segurança do outro lado". Somado a isso,
`/saude` responde `mocks: {meta: false}` — a chamada é escrita real na Meta.

**3. Conta de anúncio: só com marca de verdade.** Mostra "V2G CONTA"
(`act_2818009911919726`) **se** houver marca de conta escolhida; se não
houver, mostra as três e diz que "a conta é escolhida na criação".
*Palavras dele:* "Não invente regra de 'a mais recente'."
*Por quê:* `updated_at` mais novo é ordem de gravação, não registro de
escolha — a tela afirmaria uma decisão que ninguém tomou. A única marca no
schema é `campaigns.ad_account_id`, e `campaigns` está vazia. O
`verba/actions.ts` já havia chegado à mesma conclusão por outro caminho: ele
pega o MENOR piso entre as contas porque "qual conta a campanha vai usar só
se decide quando a campanha existe".

**4. `nao_verificados` entra junto de `bloqueios`.** O validador de
`lib/backend/pre-requisitos.ts` lia só uma das duas listas do `Prevoo`.
*Por quê:* o `ok` da rota conta as duas, então quem lê só `bloqueios` pode
receber `ok: false` com a lista vazia e dizer na tela que está tudo certo. O
backend escreve o motivo no próprio docstring: "seguir para a subida sem
saber se um requisito esta cumprido e a mesma aposta que seguir sabendo que
nao esta, com dinheiro de terceiro e conta que pode ser banida".

**5. O Bloco E não existe, e não se constrói agora.** Confirmado: nenhuma
das 51 rotas do backend lista post publicado da Página, e nenhuma das 26
telas faz isso. Construir começa no backend, não no webapp.
### 2026-09-15 — "Falar com uma pessoa" vira item da barra; DESFAZ o item 2 de 11/09
**Decisão do Victor, no chat, aprovando o diff de
`docs/estado/visual-controles-3-15-09.md` §1.**

**O que muda.** O cartão `.side-support` sai da barra lateral. "Falar com
uma pessoa" vira item de linha no fim da barra, logo acima do bloco da
conta, **no formato dos itens de navegação** (ícone + rótulo).

**Por que o formato dos itens, e não o do "Sair".** "Falar com uma pessoa"
é **destino**, igual aos outros cinco. "Sair" é **encerramento**, e por
isso é o único link de texto da barra.

**Por que desfaz o item 2 de 11/09** ("o `.side-support` vira card
claro"). O cartão fazia o rótulo quebrar em duas linhas no espaço de
220px, e o botão brigava por espaço com o conteúdo do próprio cartão. A
decisão de 11/09 respondia outra pergunta, qual cartão, vidro ou claro,
e respondeu bem. Esta decide que não há cartão.

**Abaixo de 900px o item some.** Um sexto item quebra a barra inferior de
cinco células, e no celular o acesso continua no topo da tela (o
`.topbar-help`).

### 2026-09-15 — Lote 2b, fechamento: as bordas que ficam, os placeholders, o botão lima
**Decisões do Victor, no chat, sobre `docs/botoes.md` §13.**

**1. Quatro bordas continuam, por exceção DELIBERADA ao cartão sem borda.**
Nelas a borda não é sobra: é o único sinal de alguma coisa. Quem tirar
qualquer uma num lote futuro precisa pôr outro sinal no lugar e registrar
aqui antes.

| Borda | Onde | Por que fica |
|---|---|---|
| **Borda esquerda do `.alert-card`** (cobalto, `.warn`, `.crit`, `.good`) e **do `.diag-lista li`** (`--crit` no `.critica`) | `/alertas`, `/saude-meta`, `/revisar-perfil/[proposta]` | É a **severidade**. Diz, antes de ler, se o aviso é informação, atenção ou bloqueio. No `.diag-lista` ela separa bloqueio de aviso sem repetir o rótulo em cada linha (comentário da regra em `globals.css`). |
| **A cor da borda do `.analise-cartao`** (`.v-bom`, `.v-ajuste`, `.v-fraco`) | `/criativos` | É o **veredito** da checagem da peça. Sem ela, "pode subir" e "precisa de ajuste" ficam com a mesma cara. O `.v-neutro` não carrega veredito e perdeu a borda. |
| **O tracejado da `.casa-desenho`** | `/criativos` | Diz **"isto é um desenho, não clica"**. Borda sólida, ou nenhuma, leria como cartão clicável, e a tela prometeria o que não faz (comentário da regra em `globals.css`). |
| **A borda do `.rev-opcao` e do `.rev-plinha`** | `/revisar-perfil/[proposta]` | Os dois **não têm fundo**. Sem borda, somem sobre a página, e o operador perde o limite entre as duas opções que está comparando. |

**2. Placeholders encurtados, texto do Victor.** Só a string muda.
- `onboarding/perguntas.ts:70` fica "O nome do seu negócio";
- `:112` → "O que seu negócio vende?";
- `:122` → "Ex: bolo e salgado feitos no dia";
- `:144` → "Onde seus clientes estão?";
- `components/ui/SeletorDeNicho.tsx:66` → "O que seu negócio vende?";
- `:63` → "Busque ou escreva".

**3. "Falar com uma pessoa" sai do cartão.** Vira item de linha no fim da
barra lateral, e o cartão `.side-support` deixa de existir. Isto **inverte o
item 2 da decisão de 11/09** ("o `.side-support` vira card claro"). Como
exige tocar `.tsx`, espera a aprovação do diff (em aberto, acima).

### 2026-09-15 — Lote 2b: escala, papéis dos controles, campo, cartão
**Decisões do Victor, no chat, sobre a proposta do lote 2b**
(`docs/estado/visual-controles-15-09.md`).

**1. Escala de texto: seis degraus, 12 · 14 · 16 · 20 · 24 · 30.** A
proposta de cinco foi recusada: juntar título de tela e título de bloco
custava hierarquia, e o teto de cinco era chute. A escala entra primeiro,
com o `DESIGN.md` regerado e o detector passando; os papéis e o campo em
16px vêm depois, lendo dela.

**2. A escala de espaço NÃO entra no 2b.** Mexe em 340 de 469 valores, mais
que tudo o que foi feito até aqui. Vira lote próprio, depois de ele olhar o
2b.

**3. Os papéis:**
- **B6 `btn-linha forte` é principal**, porque é a ação mais forte da
  linha. Em `Campo.tsx:232` ele marca a opção que está valendo, e aí é
  **escolha marcada**. Os dois usos são tratados separados.
- **O mini-send fica em 48px**, a altura do campo ao lado: botão colado em
  campo tem a altura do campo. É uma variação da principal.
- **Os três links viram discreta.** A exceção é o "Entrar" do rodapé do
  `/entrar`: se ele for a única saída da tela, é secundária.
- **O `ec-back` fica como está:** círculo de 30px com área invisível de
  44×44. Não empurra o topo.
- **Escolha:** marcada é cobalto cheio com texto branco. Não marcada é
  fundo cinza claro com texto no tom do corpo, **não navy**. Peso 600,
  14px.
- **B9 entra na principal** (54px, 16px), mas a regra do desabilitado
  **vence** a da principal: fica o fundo e a cor de desabilitado.
- **B10 `acct-row` fica fora.** Anotado como item de produto: é função sem
  fonte de dado aparecendo desabilitada, e isso contraria a regra de omitir
  em vez de desabilitar.
- **B16 e B17 `tema-opcao` ficam fora.** Viram depois a variação
  "escolha-cartão".
- **Discreta aprovada:** `--ink-mute` no claro (5,59:1) e `--sidebar-ink`
  na barra escura (9,77:1).

**4. Campo em 16px: aplicar.** `Contas.tsx:193` encurta para "Valor em
reais". O `redefinir/Form.tsx:17` volta para ele encurtar.

**5. Cartão sem borda: só nos 13 seletores que ficam sobre o fundo cinza.**
Os 16 de branco sobre branco NÃO entram. Antes de aplicar, ele quer a lista
das telas que ficariam com cartão com e sem borda lado a lado. O caso do
`.auth-card`, cartão branco sobre fundo branco, é decisão de layout e não de
borda: vira item próprio.

### 2026-09-15 — Lote 2b, terceira rodada: Guardar, contexto do `.cta`, cartão, placeholder, trava
**Decisões do Victor, no chat, sobre `docs/botoes.md` §12.**

1. **"Guardar" volta para 54px.** O comentário de 01/09 no
   `PerguntaDoDia.tsx` é anterior ao desenho aprovado e falava de respiro, não
   de altura. No desenho, "Guardar resposta" é a principal de largura cheia:
   dela sai o número principal da `/inicio`. Os 5 `.mini-send` colados em
   campo continuam em 48.
2. **As regras de contexto que reduzem um papel se alinham ao papel.** "Se
   seis lugares reduzem a principal, o papel não vale nada." Se alguma
   quebrar o layout ao crescer, para e mostra. *Medido depois:* só três das
   seis eram principal; as outras foram alinhadas ao próprio papel; a
   `.side-support` parou (`botoes.md` §13.2).
3. **Cartão sem borda nas telas de fora do cadastro.** As 5 telas de
   cadastro ficam como estão: lá o cartão está dentro do `.auth-card`, branco
   sobre branco, e isso vira o item "cartão sobre fundo branco", que é de
   layout. *Correção de lista:* a `/expectativas` citada entre as 7 é de
   cadastro e ficou de fora (`botoes.md` §13.3).
4. **Exceção pontual à regra "nenhum `.tsx`": só a string do placeholder.**
   `Contas.tsx:193` → "Valor em reais"; `redefinir/Form.tsx:17` → "8
   caracteres, com letra e número". Os textos de `perguntas.ts` e do
   `SeletorDeNicho.tsx` voltam para ele encurtar.
5. **A escolha do `Campo.tsx:232` precisa de trava na suíte, não de
   comentário.** Feita: `pnpm conferir:escolha-de-campo`.
6. **As duas linhas que passaram a quebrar com a escala nova estão
   aceitas:** o parágrafo da `/recuperar` e o título da `/redefinir`. "Texto
   maior que quebra é melhor que texto pequeno que cabe."

### 2026-09-12 — `Vendas` sai da barra, `Criativos` entra
**Decisão:** trocar o item `/vendas` por `/criativos` na barra de navegação.
Continuam **cinco** itens — Início, Criativos, Anúncios, Avisos, Conta —, que
é o teto do QA-1 (cinco células de 64px na menor tela que a gente atende,
`docs/navegacao-mobile.md`).

**Por quê.** `/vendas` existe para a pergunta do dia, que está **congelada**, e
a pergunta já vive num card do `/inicio`. **Não há CRM atrás dela**: a tela não
mostra cliente, negociação nem histórico de venda, porque nada disso existe no
produto. Um item de barra para uma tela nesse estado gasta uma das cinco
células na coisa que o dono abre uma vez e não volta.

Criativo é o oposto: é o que ele mexe **toda semana**. E a `/criativos` deixou
de ser uma tarefa para virar a casa de três blocos — analisar peça pronta, ver
as peças, criar peça nova. Casa é lugar; lugar é o que merece item de barra.

**`/vendas` NÃO foi apagada.** A rota continua no ar e nenhuma URL quebra: ela
só saiu da barra. Medido em `pnpm build` — 32 rotas, `/vendas` entre elas — e
com `curl`, que devolve `307 -> /entrar?next=%2Fvendas`.

**Descartado:** apagar a rota (quebraria link salvo e o histórico de quem já
abriu) e virar seis itens (a barra inferior não cabe).

**O que isto contradiz, e está corrigido:** o docstring da
`app/(protected)/criativos/page.tsx` dizia *"é uma tarefa, não um lugar de
navegação — por isso não vira item de menu"*. Estava certo enquanto a página
era uma tarefa só. O texto foi reescrito no mesmo commit, não apagado.

**Registro:** `app/(protected)/layout.tsx` (o item e o `IcoCriativos`),
`app/(protected)/criativos/page.tsx` (os três blocos),
`docs/criativos-casa-do-criativo.md` (o que falta no backend e a condição de
remoção do bloco 3).

### 2026-09-11 — Os wireframes do handoff: o que entra no v0 e o que não entra
**Contexto:** o ChatGPT entregou 44 PNGs + 7 documentos descrevendo um destino de
produto. O plano medido está em `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md`, com
**20 conflitos** entre o que a imagem mostra e o que o backend tem. Seis decisões
do Victor no mesmo dia.

**1. Os PNGs não são versionados.** `docs/v2g-wireframes/*.png` entra no
`.gitignore`; os arquivos continuam no disco.
*Por quê:* 61 MB entram no histórico do git para sempre e saem de lá nunca. O que
sobrevive dos wireframes são os `.md` e o plano — a imagem é consulta, e consulta
de uma vez. Nenhum PNG chegou a ser rastreado, então não há `git rm --cached`.

**2. A barra lateral vira escura (`--plate`), e o `.side-support` vira card
claro.** Fecha a pendência aberta em 21/08.
*Por quê o card claro:* **o contraste desse ramo já foi custeado.**
`docs/contraste.md` §9.2 item *e* mediu o anel de foco do `.side-support` sobre
`--ice-soft` e resolveu com `--cobalt-ink` — 1,11 → 6,64. Escolher o card de
vidro sobre cobalto jogaria fora uma medição feita e pediria outra.

**3. A navegação NÃO muda.** Valem os cinco itens atuais — Início, Vendas,
Anúncios, Avisos, Conta — e a decisão do lote QA-1, escrita em
`app/(protected)/layout.tsx:70-108`. Sem "Campanhas", sem "Resultados" como item,
sem "Negócio" na lateral.
*Por quê:* cinco é **teto**, não meta — são cinco células de 64px em 320px, e o
wireframe desenha seis mais um botão central. E "Campanhas" e "Criativos" viraram
"Anúncios" de propósito: o cliente não separa a campanha do criativo. O wireframe
traz de volta um raciocínio de gestor de tráfego que o QA-1 tirou da interface.
**Consequência:** a Etapa 1 do plano vira só CSS — tokens de raio, sidebar
escura, `.side-support` claro. (`/criativos` já está em `PROTECTED_PREFIXES`;
medido, nada a fazer.)

**4. O detalhe por campanha (`/anuncios/[idExecucao]`) vai para "Depois".** A
trava `conferir:campanha-da-sessao` §3 **fica como está**.
*Por quê:* a rota exigiria trocar uma proibição estrutural (`params` e
`searchParams` banidos em arquivo que chame `resultadoDoNegocio()`) por uma regra
condicional. É barato de escrever e caro de manter — e, com uma campanha por
cliente, o detalhe não resolve nada que a ficha dentro da `/anuncios` já não
resolva. **O desenho da regra nova está registrado no §3.2 do plano** para quando
houver mais de uma campanha.

**5. As órfãs ficam como estão.** `7fcfc505` (FLEETLINK, R$ 93,20) e `3de135e4`
(Byond Colour, A$ 113,45) continuam com `business_id: null`.
*Por quê:* **a regra das duas moedas é provada por fixture**, não por dado vivo.
Ligar as duas à mão para ter um caso de AUD na tela seria gastar escrita em banco
real para provar o que `conferir:resultado` §4 já prova. Isto **não** é o
problema resolvido: nenhuma rota da API escreve `business_id` numa execução
existente, e todo cliente que entrar por script vai continuar precisando de
`UPDATE` à mão (`docs/estado/tela-de-resultado-10-09.md` §0.1).

**6. O veredito do criativo nomeia o que é: uma checagem das regras de anúncio.
A tela NUNCA diz que a peça "presta" com base só no gate.**
*Por quê, e é o ponto que só aparece no primeiro uso real:* **uma imagem chapada
passa no gate.** O gate responde "isto viola política da Meta?", não "isto
vende?" — um fundo cinza sem texto, sem produto e sem chamada passa com louvor. O
cliente que subisse essa peça e lesse "aprovado" teria recebido do produto
exatamente a informação errada. O "presta" vem do avaliador do backend, que
depende do banco de referências e não existe. Até lá, **aprovado quer dizer *pode
subir*, não *está bom***.

---

### 2026-09-01 — O merge por campo NÃO é antecipado no front
**Aviso do backend:** o `POST /resposta-do-dono` vai passar a fazer **merge
por campo** — campo ausente preserva o valor do servidor, `null` explícito
apaga. Deixa de ser substituição de linha.

**Decisão da sessão:** o front **continua mandando os dois campos**, e a
mudança só é adotada depois de confirmada no ar.

**Por quê.** Mandar os dois é correto sob as DUAS semânticas: sob merge,
mandar o valor atual dá exatamente o mesmo resultado. Mandar só o campo
mexido é seguro **apenas depois** do merge — e errar essa ordem apaga
receita de cliente, que é o defeito que dois lotes inteiros existiram para
fechar.

**O que a mudança melhora quando chegar,** e é razão para adotá-la: hoje,
se o dono responder de dois aparelhos no mesmo dia, o segundo reenvia o que
leu e sobrescreve o do primeiro. Com merge e envio parcial, só o campo
tocado muda. É estreito, mas é real.

**A troca é de uma linha** em `app/(protected)/inicio/actions.ts` quando o
Victor avisar que subiu.

---

### 2026-09-01 — `respondeu_em(dia)` vai substituir a `jaRespondeu` local
**Aviso do backend:** virá parametrizado por dia, e aí a
`jaRespondeu(consolidado, dia)` daqui fica redundante.

**Até lá, e por decisão do Victor, a local é a AUTORIDADE** e o
`respondeu_hoje` é conferência cruzada. Quando o `respondeu_em` subir, a
ordem se inverte e a local vira a conferência — não se apaga a primeira no
mesmo dia em que a segunda chega.

**O fuso era UTC mesmo.** Confirmado e corrigido no backend em 01/09: eram
**seis** lugares, não três, e o `tzdata` nem era dependência declarada —
vinha por acidente como transitiva do `psycopg`.

---

### 2026-09-01 — A pergunta é sobre ONTEM, no fuso `America/Sao_Paulo`
**Decisão (Victor):** o dono responde sobre o dia que fechou. "Perguntar
sobre hoje às 10h da manhã não faz sentido." Fuso `America/Sao_Paulo`.

**Por que o fuso é regra e não detalhe:** a Vercel roda em UTC. Das 21h à
meia-noite de Brasília o servidor já está no dia seguinte — três horas por
dia em que "ontem" calculado no fuso do servidor é o dia errado.

**O estrago seria concreto:** às 22h o dono abre o app, a tela pergunta
sobre anteontem, e a resposta vai para a chave `(execução, dia)` de
anteontem — **por cima** do que ele já tinha respondido, porque a escrita é
upsert. Um dia inteiro de venda apagado por causa de fuso.

**Registro:** `lib/dia-seguinte/dia.ts`, com aritmética de calendário (e não
`agora - 24h`, que erraria na virada de horário de verão). Conferências em
`conferir:dia-seguinte` §3.3, inclusive o caso das 22h.

**`jaRespondeu(consolidado, dia)` é a AUTORIDADE; `respondeu_hoje` é
conferência cruzada** — até o backend confirmar que conta em São Paulo.

---

### 2026-09-01 — Duas fontes para "quanto investiu": dívida registrada
**Não é para consertar agora, mas é para estar escrito.**

A `/inicio` tinha uma tela de resultado alimentada por `metrics_daily`
(Supabase, local). O acumulado do backend responde a mesma pergunta — e
mais: ele traz o lado do DONO (quantas viraram venda, quanto entrou), que a
`metrics_daily` nunca vai ter.

**Medido em 01/09/2026: `metrics_daily` tem ZERO linhas, e `campaigns`
também.** A tela de resultado era, portanto, **inalcançável** —
`temNumero` era `spend > 0`. O conflito é de desenho, não visível.

**O que foi feito:** `temNumero` passa a considerar o acumulado também, com
`||` — a fonte antiga continua viva em vez de ser arrancada. Se a
`metrics_daily` receber linha um dia, ela conta.

**DECIDIDO em 01/09 (Victor): o backend vence.** É ele quem coleta da Meta
quando o App Review sair, e o mesmo endpoint passa a devolver
`tem_dado_da_plataforma: true` sem mudança de contrato.

**Não arrancar a `metrics_daily` agora** — a `/vendas` ainda lê dela.

**O GATILHO É O COLETOR LIGAR, NÃO UMA DATA.** Registrado assim de
propósito: dívida com data vira dívida vencida que ninguém olha; dívida com
gatilho é acionada pelo evento que a torna urgente. Quando
`tem_dado_da_plataforma` começar a vir `true`, a `metrics_daily` passa a ter
duas fontes disputando a mesma tela, e é aí que ela sai.

---

### 2026-09-01 — O que falta para o loop diário funcionar sozinho: um DISPARADOR
**Decisão (Victor):** `GET /perguntas-pendentes` **não vira tela.**

**O motivo:** ela é a peça que faz a pergunta diária ACONTECER SOZINHA. Se
virar lista que alguém abre, o produto volta a depender de o dono lembrar de
responder — e o loop existe justamente para não depender disso.

**O consumidor certo não é tela nenhuma: é um job diário** que lê a lista,
ordenada pelo maior silêncio, e dispara notificação. **Esse disparador não
existe** — o contrato do backend diz por extenso que push não existe do lado
de lá — e não era trabalho deste lote.

**É esta a peça que falta, e ela tem nome.** Enquanto não houver disparador,
o loop diário está construído e mudo: o cliente só responde se abrir o app
por conta própria.

**Se alguém quiser uma tela de operador enquanto isso, tudo bem — mas como
MULETA DECLARADA, não como o desenho.** Uma muleta que não se declara vira
o desenho por omissão.

**O `nivel` (pergunta → cobrança → oferta de ajuda) é do disparador, não da
tela.** A `/inicio` mostra a pergunta e pronto; ela não precisa saber o
nível, e buscar a lista inteira para descobrir o de um cliente seria errado
já com 300 negócios.

---

### 2026-09-01 — A soma do acumulado: os dois lados se comportam ao contrário
**Achado do backend, registrado aqui porque o front não pode "consertar".**

No mesmo dia, com duas execuções:

- a **métrica da plataforma SOMA** — duas campanhas no ar gastaram as duas;
- a **resposta do dono NÃO SOMA** — ele responde "quantas vendas hoje" uma
  vez por execução, sobre o **mesmo fato do mundo**.

Somar os dois dobraria a receita. E o erro **superestima o retorno**, que é
o lado errado para errar quando o número na tela é "voltou R$ X" — um
retorno inflado faz o cliente manter uma campanha que não está pagando.

**Quem resolve é a rota**, `GET /negocios/{id}/consolidado`: uma resposta por
dia, execução mais recente vence. **O front não refaz essa conta.**

**`dias_com_resposta_de_mais_de_uma_execucao > 0` é defeito de FLUXO, não de
soma** — significa que a varredura perguntou duas vezes ao mesmo dono no
mesmo dia. A soma continua certa; o que está errado é ter perguntado duas
vezes. Vai para diagnóstico (`conferir:dia-seguinte` §4 tem a conferência),
**nunca** para a tela do cliente: ele não tem o que fazer com isso, e o
problema é nosso.

---

### 2026-09-01 — `respondeu_hoje` não decide o card sozinho
**Contexto:** pedido ao backend para resolver "devo mostrar o card de
pergunta para este cliente agora?". Ele existe e chega nas duas rotas de
consolidado.

**Resolve, com duas ressalvas que precisam ser fechadas com o backend:**

1. **"Hoje" é o fuso de quem?** Se o backend contar em UTC, às 21h de
   Brasília já é o dia seguinte lá — e o card reapareceria para um dia que o
   cliente acabou de responder;
2. **a pergunta costuma ser sobre ONTEM.** O contrato diz que `dia` é "o dia
   a que a resposta SE REFERE". Se a tela pergunta "quantas vendas ontem?",
   um booleano preso a "hoje" responde outra pergunta.

**Enquanto isso não estiver pinado, quem decide o card é
`jaRespondeu(consolidado, dia)`** (`lib/dia-seguinte/resposta.ts`), que
pergunta pelo DIA que a tela vai perguntar e lê os campos do dono — não a
presença do dia na lista, que vai deixar de servir quando o coletor da Meta
ligar e dias aparecerem só com investimento.

`respondeu_hoje` fica como **conferência cruzada**. Divergência entre os
dois é sinal, não empate.

---

### 2026-08-25 — O piso da verba sobe de R$ 150 para R$ 750/mês
**Decisão:** `PISO_MENSAL_DA_CASA = 750` (R$ 25/dia).

**A razão mudou, e é isso que importa registrar.** Não foi um número
corrigido; foi outra pergunta sendo respondida.

Em 20/08 a pergunta era **quem a gente consegue atender**. R$ 300 foi
descartado por "excluir quem quer testar com pouco, que é justamente o
nosso público" (`docs/qa3-telas-isoladas.md` §2), e R$ 150 ganhou como
freio contra o impossível e contra o erro de digitação.

Em 25/08 a pergunta virou **quem consegue ter resultado**. Com verba de
R$ 150 e assinatura de R$ 490, a ferramenta é **76% do gasto total** do
cliente: ele veicula R$ 300 em dois meses tendo pago R$ 1.280, não vê
resultado, e cancela. Com R$ 750 a assinatura cai para **40%** do gasto.

Quem entra abaixo disso não é cliente que a gente perdeu — é cliente que ia
cancelar em dois meses achando que o produto não funciona.

**Isto não invalida a decisão de 20/08**, e as duas ficam nos autos: aquela
respondeu bem a pergunta que tinha. O `qa3-telas-isoladas.md` §2 recebeu um
ponteiro para cá, para os dois documentos não se contradizerem em silêncio.

**Registro:** `lib/verba/limites.ts:43` e o bloco de comentário em cima
dele; casos de corte em `scripts/conferir-verba.ts` §2.1, incluindo um caso
novo — R$ 150 **recusado** — que existe para pegar reversão acidental da
constante.

---

### 2026-08-25 — Verba abaixo do piso vinda da entrevista NÃO é defeito
**Registrado para não parecer bug depois.**

Enquanto o roteiro do onboarding não pedir R$ 750 como piso **na conversa**,
o caminho normal da entrevista vai gerar verba abaixo do piso com alguma
frequência. Não é falha do agente nem do extrator: o agente extrai o que o
cliente disse, e **o cliente não sabe do piso** — ninguém contou para ele.

São os dois lados chegando na mesma regra por caminhos diferentes, e em
velocidades diferentes. O webapp já sabe do piso; a conversa ainda não.

**O que acontece, e é o comportamento certo:** o valor é gravado (a resposta
dele não se perde), o cadastro não fecha, e a `/inicio` cobra a diferença
com os dois números — o dele e o nosso.

**O conserto de verdade é do roteiro, não do código:** a conversa passa a
dizer o piso antes de perguntar quanto ele pode investir. Até lá, cada uma
dessas linhas é uma pessoa que precisa ser avisada, não um erro para
investigar.

---

### 2026-08-25 — Dívida conhecida: a regra do piso mora numa camada que nem todo caminho atravessa
**Não é para consertar agora.** É para estar escrito antes de morder.

**Medido em 25/08 contra o `/openapi.json` ao vivo:** o `POST /cadastro` do
backend aceita `orcamento_mensal_disponivel` com `exclusiveMinimum: 0.0` —
qualquer valor acima de zero. O mesmo vale em `DadosDoOnboarding` e na
entrada do `diagnosticar-orcamento`. **O piso de R$ 750 é regra só do
webapp**, e o nome da constante sempre disse isso ("da casa").

Isso vale hoje porque, na prática, só o webapp escreve. Mas **o n8n chama o
backend direto**, e a `escrever_apenas_se_livre` (migration `0019`) não tem
nenhum chamador TypeScript neste repositório — ela é chamada de fora. Ou
seja: a regra de negócio mora numa camada que nem todo caminho atravessa.

**A consequência concreta, medida:** a trava de completude
(`lib/cadastro/montar.ts:402`) confere `verba > 0`, **não o piso**. Uma
verba de R$ 200 escrita por fora fecha o cadastro, e o `dispararSeCompleto()`
manda o pipeline rodar com um valor que a `/verba` teria recusado na cara do
cliente.

**O que foi feito em 25/08, e o que continua aberto.** A trava de
completude passou a conferir o piso (`lib/cadastro/montar.ts`), e ela é a
única camada que fecha o caminho do n8n **sem tocar no backend** — porque o
disparo é nosso. Uma verba abaixo do piso escrita por fora agora impede o
`dispararSeCompleto()`.

Isso **não** impede a escrita, só o disparo. O valor entra no banco e fica
lá até alguém corrigir.

**O piso dentro da função do banco continua como dívida, e não decidi
sozinho.** Ele fecharia o n8n de verdade — seria a única camada que todo
caminho atravessa. Contra: é regra de negócio dentro do SQL, e o número
passaria a viver em dois lugares que precisam concordar (a constante do
TypeScript e o literal do plpgsql), que é exatamente a forma de defeito que
o `lib/verba/limites.ts` existe para não ter. Além de ser migration contra
banco real, que exige autorização humana.

**Medição de 25/08, para dimensionar:** das quatro linhas de `businesses`,
**nenhuma real** cai na faixa afetada. A única entre R$ 150 e R$ 750 é a
`a0328fb8` (Padaria Dona Zilda), que tem `dados_ficticios = true` e é
barrada antes do disparo. A V2G (`a85c37a9`) tem R$ 2.000 e `enviado`. As
outras duas não têm verba.

### 2026-08-23 — `businesses.niche` guarda o identificador, não o rótulo
**Decisão:** a coluna passa a guardar `clinica-odontologica`; "Dentista" fica
para a tela. As duas telas mostram rótulo e validam contra a mesma lista viva.
**Motivo:** o rótulo é do backend e pode mudar — mexer no `nome_exibicao` do
`knowledge/` deixaria toda linha antiga com o texto velho, sem nada contando
que ficou. E é o identificador que escolhe o documento do nicho no pipeline.
**Por que agora:** medido no banco antes de escrever código — **zero linhas
tinham rótulo válido** (as três com valor tinham `Clínica / Consultório`, que
nunca foi nicho, e `padaria`, fictícia). Depois de semanas gravando rótulo, a
mesma inversão custaria uma migration com mapa escrito à mão.
**NÃO houve migração de dado, e não deve haver:** o mapa rótulo→identificador
só existe na lista viva. Cravá-lo numa migration recria a lista paralela que o
lote do seletor existiu para matar. As linhas antigas se consertam quando um
humano tocar no campo pela `/meu-negocio`.
**Registro:** `lib/nichos/gravado.ts`, `conferir:nichos` §§2.1/8/10, e
`docs/estado/nicho-identificador-23-08.md`.

### 2026-08-23 — Nicho não reconhecido não ganha "tá certo"
**Decisão (Victor):** na `/meu-negocio`, valor de ramo que a lista viva não
reconhece continua na lista principal, mostrando o valor, com uma linha
explicando e um único botão — "escolher na lista". O "tá certo" some.
**Motivo:** confirmar carimbaria procedência `confirmado`, o nível mais alto
da escala, num valor que o pipeline não consegue usar. O cliente ficaria com a
sensação de ter resolvido e o dado continuaria mudo.
**Descartado:** mandar o campo para a seção "o que a gente ainda não sabe" —
ela é a seção do campo VAZIO, e dizer que não sabemos sobre um campo
preenchido é impreciso. E manter o "tá certo", pelo motivo acima.
**Não é erro, e a tela não trata como erro:** em `--fs-corpo` e `--ink`, nunca
em `--crit`. Quem tem "Clínica / Consultório" respondeu de boa-fé um
onboarding que oferecia aquilo. Nada mais na tela trava.

### 2026-08-22 — A reserva de nicho sai; sobra o texto livre
**Decisão:** com o `GET /nichos` fora, a tela não mostra chip nenhum. Só o
campo de texto, mais uma linha dizendo que a lista não carregou.
**Motivo (Victor):** *"quando o catálogo está fora, a verdade é que não
sabemos o nicho. Gravar a frase da pessoa como confirmado é honesto; gravar
um dos cinco chips fixos é palpite com cara de escolha do cliente."* É o
mesmo princípio do `padaria` não achar nada: não inventamos o vizinho mais
próximo, admitimos que não temos.
**Descartado:** manter a reserva marcando a escolha como `aproximacao` — a
decisão de algumas horas antes, revertida abaixo. E travar a pergunta com
um recado de indisponível, que seria hostil: trava o onboarding por causa
de um endpoint de catálogo.
**A linha na tela é parte da decisão, não enfeite:** "escreva do seu jeito"
sozinho parece que nunca houve lista, e a pessoa conclui que o produto é
assim. Dizer que a lista não carregou é a diferença entre uma falha nossa e
uma limitação nossa.
**Registro:** `lib/nichos/escolha.ts`, o comentário da pergunta `ramo` em
`perguntas.ts`, e o estado degradado em `Chat.tsx`. Conferências em
`conferir:nichos` §8 — inclusive uma que impede a pergunta `ramo` de voltar
a ter opção fixa.

### 2026-08-22 — `aproximacao`: REVERTIDA no mesmo dia
**Decisão original:** marcar como `aproximacao` a escolha feita nos chips de
reserva, com a migration `0021` alargando o domínio de procedência.
**Revertida** pela decisão acima, algumas horas depois: sem reserva, não há
o que marcar. A migration `0021` foi apagada antes de ser aplicada, e o
parâmetro `p_origem` saiu do `lib/cadastro/procedencia.ts`.
**Fica registrado porque a ideia era boa e pode voltar:** se um dia existir
uma fonte de nicho que seja palpite legítimo — extração de site, por
exemplo — o desenho está descrito aqui. E fica a observação que valia:
`aproximacao` ficaria **abaixo** de `confirmado` sem ninguém programar isso,
porque as travas da `0013` e da `0019` comparam com o literal `'confirmado'`.
**O que sobrou dela:** nada no código. `confirmar_campo_do_cliente` continua
com a assinatura de cinco argumentos da `0016`.

### 2026-08-22 — Cache da lista de nichos: fora de escopo
**Decisão:** não cachear. A medição não justifica.
**A medição:** `GET /nichos` responde em **17 ms de mediana** (60 ms a
frio), 3,8 KB, dez nichos. A busca é feita no servidor e a lista já vai
dentro do HTML: TTFB de **36–50 ms** quente, HTML completo 3 ms depois,
com os dez chips **e** o campo de busca presentes na primeira pintura.
Não há atraso perceptível para cachear.
**O que seria feito se um dia valer:** cache manual em memória com TTL
curto — não `unstable_cache`, para a invalidação ficar uma linha legível.
E a regra que vem junto: **vencido o TTL sem resposta do backend, entra a
reserva, nunca o valor velho** — senão vira o fallback estático que o
handoff §10 proíbe, que é a lista paralela envelhecendo em silêncio.
**Registro:** `lib/backend/nichos.ts`, no ponto onde se implementaria;
medição em `docs/estado/seletor-de-nicho-22-08.md` §2.

### 2026-08-22 — Cartão do herói da LP: marcar como exemplo
**Decisão:** manter os números e o nome, acrescentando a tarja
`EXEMPLO — tela de demonstração, não é resultado de cliente` como primeiro
elemento do cartão.
**Descartado:** remover o cartão (perderia a prova visual) e inventar número
novo (afirmação falsa numa página de vendas no ar).
**Registro:** commit `df19ec0` na LP, detalhe em `lp/docs/prova-social-e-legibilidade.md` §7.1.

### 2026-09-20 — O áudio anda numa direção só: NÃO haverá voz de IA
**Decisão:** o cliente pode responder falando; a máquina **nunca** fala com
ele. A pergunta é texto na tela e continua sendo texto na tela. Só
transcrição (entrada), nunca síntese (saída).
**Descartado:** conversa falada e leitura das perguntas em voz alta.
**O que isso proíbe, por nome:** `speechSynthesis`,
`SpeechSynthesisUtterance`, `/v1/audio/speech`, qualquer serviço de
text-to-speech.
**O que NÃO é proibido:** o `<audio>` que toca de volta a gravação **do
próprio cliente**, para ele conferir o que disse antes de aceitar a
transcrição. Isso é o áudio dele voltando, não a nossa voz falando.
**Registro:** bloco "SÓ ENTRADA. NUNCA SAÍDA." no topo de
`app/exemplo/_onboarding/Onboarding.tsx`. Varredura de 20/09 em 174
arquivos de `app/`, `lib/` e `components/`: zero ocorrências das oito APIs
de síntese, e um `<audio>` só, com `src={ditado.url}`.

### 2026-09-20 — O convite ao áudio só existe nas perguntas ABERTAS
**Decisão:** nas duas perguntas abertas — "o que você vende" e a correção
do resumo — o microfone fica mais convidativo que o teclado, **sem esconder
o teclado**, e ganha duas frases:

- abaixo do campo: *"Prefere falar? É bem mais rápido, e quem fala costuma
  contar mais sobre o negócio."*
- ao lado do microfone: *"Toque e fale, como se estivesse explicando para
  um cliente."*

Nas perguntas curtas (nome, empresa, Instagram, site) microfone e teclado
ficam com o **mesmo peso** e não há frase de incentivo — pedir para alguém
falar um `@` não economiza o tempo de ninguém.
**A regra que vem junto:** nenhuma das frases promete resultado. Nada de
"converte mais" ou "melhores resultados" — a gente não mede isso. O que
elas afirmam é o que dá para observar na hora: falar é mais rápido que
digitar, e quem fala costuma contar mais.
**Como o "mais convidativo" foi feito, e o que ele NÃO é:** altura de botão
principal (54px contra 44px), tinta e borda de cobalto, e fundo tingido a
8%. Continua com borda em vez de fundo cheio — o botão principal da tela
continua sendo o "Continuar". O campo de texto não encolhe e continua
recebendo o foco quando a pergunta abre.
**Sem chave de transcrição, o convite não aparece:** convidar para falar
num microfone desabilitado seria oferecer o que não existe. No lugar dele
fica o motivo escrito, e o teclado.
**Registro:** `CONVITE_ABAIXO_DO_CAMPO` e `CONVITE_NO_MICROFONE` em
`app/exemplo/_onboarding/perguntas.ts`, campo `aberta` no `Passo`.
Capturas em `docs/v2g-wireframes/capturas/onboarding-v2/`, com e sem chave.

