# V2G — mapa de execução do plano outubro–dezembro de 2026

Leitura de trabalho em 05/10/2026. Fonte: `C:/Users/victo/Downloads/V2G_Plano_de_Execucao_Outubro_Dezembro_2026.pdf`, 8 páginas, datado de 03/10. O PDF reúne objetivos dos founders e também **critérios e datas intermediárias propostos**; suas frases não são autorização para fazer deploy, cobrar, migrar dados ou publicar campanhas. Decisões diretas de Victor e Gabriel e evidência atual têm precedência. Preço continua indefinido.

## Como manter este mapa

Para cada item, registrar **dono, prazo, estado, evidência, próximo passo e bloqueio**. “Há código” não significa “funciona em produção”. Estados usados aqui: **parcial no código**, **não localizado no código consultado**, **fora deste repositório**, **decisão pendente**, **não verificado ao vivo**. Só chamar “concluído” depois do teste do critério de aceite no ambiente pertinente. Reavaliar este retrato quando LP, backend, banco, Vercel ou Finance mudarem.

Recortes locais consultados: WebApp `main` em `6c10d4a`, inicialmente limpo e um commit à frente de `origin/main`; LP `main` em `0fecac2`, com alterações locais preexistentes; backend `main` em `41ecfa8`, limpo; Finance `main` limpo. Nenhum painel ou banco de produção foi consultado nesta passagem. A LP com alterações locais não foi editada. Uma leitura HTTP pública de `https://v2gmidia.com.br/` em 05/10 respondeu 200 e mostrou apenas formulário de pré-cadastro (`action="/api/pre-cadastro"`); isso não valida persistência do lead.

## Marco de 28/10 — jornada e produto (PDF pp. 1–3)

| ID | Entrega e dono no PDF | Estado local e evidência | Próximo passo verificável |
|---|---|---|---|
| J01 | Dados 1P — Vitor | **Parcial.** A ficha do gestor lista dados de perfil, inclusive a resposta original da marca (`lib/perfil/ficha-operador.ts`); o Início coleta respostas diárias de vendas/receita (`app/(protected)/inicio/actions.ts:158`). Não equivale a cadastro histórico de faturamento, leads e conversões. | Inventariar fontes, identidade do cliente/conta, consentimento, período e definição de cada métrica; conferir amostra real autorizada. Proposta de vínculo e prova em `docs/mapa-identidade-dados-1p-proposta.md`. |
| J02 | Compra self service na LP — Vitor | **Não localizada nos repositórios consultados.** A LP local pede pré-cadastro (`lp/index.html:241,250,370`); a página pública consultada em 05/10 também mostrou apenas esse formulário. O WebApp declara não ter assinatura nem integração de pagamento (`app/(protected)/conta/page.tsx:30`). O Finance tem recebimento manual (`v2g-finance/lib/actions/recebimentos.ts:53`). | Decidir preço, oferta, contrato, provedor e fonte da verdade; desenhar confirmação por webhook, idempotência e passagem segura LP → conta → onboarding. |
| J03 | Onboarding automático — Vitor/Gabriel | **Parcial.** O WebApp grava respostas e conclusão `agendamento_pendente` (`app/(fluxo)/onboarding/marca/actions.ts:132`). O contrato de envio requer seis campos (`lib/cadastro/montar.ts:147`), e a decisão “seis ou onze” permanece aberta (`docs/decisoes.md:54`). “Não sei” não preenche o campo técnico. | Fechar o significado de “concluiu o onboarding” e o tratamento das pendências; testar sessão, retomada, RLS e dados reais sem disparar cadastro por acidente. |
| J04 | Agendamento automático — Vitor | **Estado apenas.** A tela afirma que nenhum horário foi reservado (`app/(fluxo)/onboarding/concluido/page.tsx:16`). `entrevistas` registra reunião **realizada**, não um slot reservado (`supabase/migrations/0010_perfil_empresa.sql:118-131`); aplicação da migration não foi conferida. | Fechar disponibilidade, gestor, duração, fuso, provedor, confirmação e remarcação; implementar reserva idempotente. Contrato inicial em `docs/estado/onboarding-reuniao-05-10.md:24`. |
| J05 | Acessos à Meta — gestor | **Contrato parcial no backend.** `POST /onboarding/call` aceita informações incompletas da reunião e exige vínculo/dono ou declaração de fluxo do gestor (`backend_v2g/src/api/rotas.py:481-527`). Isso não prova checklist ou registro operacional da reunião. | Mapear quais permissões são necessárias, onde ficam registradas e como o gestor confirma cada uma sem copiar segredo. Validar contra o backend e a conta real apenas com autorização apropriada. |
| J06 | Primeira campanha manual — gestor | **Peças separadas.** O backend expõe criação (`backend_v2g/src/api/rotas.py:3175`); o WebApp tem fila de ativação de campanha já criada (`app/(protected)/ativar-campanha/page.tsx:9`). A tela `/aprovar` ainda mostra botões desabilitados (`app/(fluxo)/aprovar/page.tsx:140-164`). O novo onboarding retém disparo automático até a reunião (`lib/pipeline/disparar.ts:550`). | Desenhar o fluxo do gestor após a reunião: execução com dono, pré-voo, criação pausada, revisão, publicação manual e evidência de veiculação. Não confundir ativar objeto existente com criar a primeira campanha. |
| J07 | Pedido e publicação de criativo — gestor; fluxo a definir | **Parcial.** A ação atual envia imagem para análise **somente quando já existe uma execução** (`app/(protected)/criativos/actions.ts:25-58`); portanto não resolve o primeiro criativo tratado na reunião. O bloco “Criar peça nova” é só apresentação (`app/(protected)/criativos/CriarPeca.tsx:5`). | Definir pedido, arquivo, destino, notificação ao gestor, decisão, publicação manual, retorno ao cliente e estados de falha/duplicidade. |
| J08 | Pós-veiculação — gestor | **Parcial técnico, processo não medido.** Existem coleta/estado de veiculação e leitura do dashboard (`lib/veiculacao/estado.ts`, `backend_v2g/src/metricas/`). | Escrever checklist por dia/semana, gatilhos e responsável; validar com campanha real e métricas disponíveis. |
| J09 | Suporte — gestor | **Canal sem registro verificado.** O casco oferece “Falar com uma pessoa” por WhatsApp (`components/ui/Casco.tsx:157,205`). | Definir canal oficial, registro, prioridade, prazo, dono, resolução e medição. |
| J10 | Geração de imagem até o G4 — análise, dono a definir | **Decisão pendente no PDF p. 2.** Há backend de imagem, mas não há fluxo de geração disponível ao cliente nesta jornada (`app/(protected)/criativos/CriarPeca.tsx:5`). | Decidir viabilidade e escopo para 28/10; separar demonstração de produção e medir custo/qualidade antes de prometer. |

## Marco de 28/10 — operação, canais e comercial (PDF pp. 3–4)

| ID | Frente | Mapeamento que falta |
|---|---|---|
| O01 | Media Intelligence — Gabriel | Especificar documento de saída, campos 1P/3P, fontes, frequência, revisão humana e critério de qualidade. O código de métricas existente não define sozinho o produto que o gestor entregará. |
| O02 | Supergestor — Vitor | Descrever fila, atribuição de carteiras, capacidade, prioridades, tarefas e exceções para até 50 contas. A ficha e a fila de ativação cobrem apenas recortes desse trabalho. Medir tempo por conta antes de afirmar capacidade. |
| O03 | Pagamento, cadastro, contrato, Drive — dono a definir | Inventariar o que cada sistema guarda, quem é fonte da verdade, eventos e falhas. A especificação do Finance prevê banco separado do produto (`v2g-finance/V2G_FINANCE_SPEC.md:38`); conexão efetiva e sincronização não foram verificadas. O mapa de identidades e dos IDs que faltam está em `docs/mapa-identidade-dados-1p-proposta.md`. |
| O04 | Nota fiscal e contabilidade — dono a definir | O Finance calcula uma lista de NFs pendentes (`v2g-finance/lib/nfs.ts:1`) e permite marcar emissão manual (`v2g-finance/lib/actions/recebimentos.ts:89`). Automatização fiscal não foi demonstrada. Mapear emissor, gatilhos e conciliação antes de integrar. |
| O05 | Gestor contratado | O PDF propõe fechar com Cauê ou contratar outro gestor. É decisão operacional fora do código: confirmar pessoa, disponibilidade, treinamento e acesso autorizado antes de agendar clientes. |
| O06 | Setup digital e demo | LP local e página pública lida em 05/10 são de pré-cadastro; a árvore local tem alterações não commitadas. No navegador, o formulário público coube em 390 px de largura sem rolagem horizontal medida e exibiu o botão “Enviar pré-cadastro”; nenhum envio foi feito. A LP pública anuncia lançamento em **09/11**, enquanto o PDF pede produto pronto para demonstrar no G4 em **28/10** — alinhar o significado das duas datas na comunicação. A FAQ pública explica que pessoas da V2G acompanham as contas nesta fase, compatível com a operação manual prevista. Instagram, LinkedIn e WhatsApp Business não foram auditados. Conferir páginas/proposta/compra/links, conteúdos dos canais e WhatsApp Business; testar jornada e demo no celular com evidência por etapa. App Store/Play Store estão fora do marco de 28/10 no PDF. |
| C01 | Pitch para o G4 — Vitor e Gabriel | Escrever e ensaiar a explicação curta ligada à demonstração e ao público que vende por conversa. Confirmar que cada afirmação aparece na jornada testada; resultados, preço e data pública precisam de fonte/decisão. |
| C02 | Processo comercial — dono a definir | Definir qualificação, etapas, registro de lead único, reunião, proposta, fechamento, seguimento, dono e prazo. A LP local guarda pré-cadastro, mas sua função SQL não devolve `lead_id` à interface nem deduplica por pessoa (`lp/supabase/leads_lp.sql:114-151`). |
| C03 | SDR escolhido até 14/10 — dono a definir | Registrar pessoa, capacidade e treinamento antes do G4. A meta posterior de 100 leads/dia exige regra de contagem e medição, não apenas uma contratação. |
| C04 | Continuidade pós-G4 — dono a definir | Preparar captura de origem, prioridade, consentimento, responsável e próxima ação; reservar 29–31/10 para organizar leads/aprendizados e iniciar contatos. |
| C05 | Eventos e presença de mercado — dono a definir | Levantar datas, locais, público, custo e objetivo. O PDF cita São Paulo (Vitor) e Rio (Gabriel) em novembro, e Rio em dezembro com representantes a definir. Não há participação confirmada neste levantamento. |
| C06 | Sebrae e VC — dono a definir | Pesquisar programas, apoios, requisitos, contrapartidas, prazos e contatos; estudar critérios de VC e efeitos societários. O PDF propõe aprendizado e relacionamento, não confirma recurso nem decisão de captar. |

## Pós-G4 até 23/12 (PDF pp. 5–8)

| ID | Frente | Próxima definição ou medição |
|---|---|
| E01 | “JEV” em decisões | Confirmar o nome e a ferramenta exatos; mapear decisões candidatas e pontos de revisão humana antes de integrar. |
| E02 | Criativos com referências | Definir origem, direitos de uso, rotulagem, avaliação e retorno de desempenho por criativo. Separar geração de publicação. |
| E03 | Dados 3P | Definir fontes permitidas, licença, atualização, ligação com nicho/oferta e qualidade. Não usar números externos sem procedência. |
| E04 | 50 clientes, gestor e SDR | Fixar regra de cliente ativo e de lead único; medir horas, pendências, qualidade e custo por conta. Metas não são capacidade medida. |
| E05 | Indicadores e processos | Definir apuração semanal de leads, conversão, tempo de venda, CAC, custo de entrega, jornada, receita/recebimentos e capacidade; registrar exceções e dono de cada processo. |
| E06 | Plano 2027–2029 | Validar o significado financeiro da meta de R$ 1 milhão, preço e base real; construir orçamento, caixa, time e cenários. A reunião de 18/12 é proposta no PDF, ainda não confirmada. |

## Janelas de acompanhamento do PDF (p. 8)

| Janela | Entrega a conferir | Natureza no documento |
|---|---|---|
| 03–09/10 | Atribuir donos pendentes, encaminhar gestor e decidir imagem para o G4 | Sugestão de organização. |
| Até 14/10 | Escolher SDR para pós-evento | Derivada de “duas semanas antes”. |
| 15–27/10 | Integrações, rotinas, jornada completa, demonstração, pitch e canais | Sugestão de execução e teste. |
| 28/10 | G4: produto, operação, setup digital e comercial | Prazo definido pelo objetivo dos founders no PDF. |
| 29–31/10 | Leads e aprendizados do G4, continuidade comercial | Transição pós-evento. |
| 02–06/11 | Começar método e construção do plano 2027 | Sugestão de início. |
| 18/12 | Reunião dos founders para consolidar 2027–2029 | Data proposta, ainda a confirmar. |
| 23/12 | Meta de 50 clientes, processos e plano 2027 | Prazo final adotado no PDF; capacidade e base ainda não medidas. |

## Sequência de execução sugerida

1. **Contrato da jornada (J02–J07).** Uma linha de estado para cada passagem: evento de entrada, sistema fonte, dono, ação permitida, confirmação, erro/reconciliação. Rascunho já preparado em `docs/contrato-jornada-ate-g4-proposta.md`. Fechar primeiro as decisões de preço, completude, agenda e gestor. **Saída:** contrato revisado por Victor e Gabriel, sem código ou cobrança.
2. **Entrada do cliente (J02–J04).** LP/compra → conta → onboarding → reserva confirmada. Validar separadamente dados opcionais e “não sei”. **Saída:** teste completo sem publicação de campanha.
3. **Mesa do gestor (J05–J09).** Acessos, ficha, primeiro criativo e campanha manual, pedido posterior de criativo, suporte e pós-veiculação. **Saída:** tarefas com dono e estados auditáveis; anúncio “no ar” só com evidência da plataforma.
4. **Dados e operação (J01, O01–O04, E04–E05).** Fechar fontes, indicadores e processos antes de prometer capacidade ou inteligência. **Saída:** números com período, origem e regra de contagem.
5. **Demonstração de 28/10.** Percorrer uma jornada em celular e guardar evidência de cada transição. Pendência externa ou manual deve aparecer como tal; não demonstrar reserva, pagamento ou publicação simulada como concluída.

## Decisões que destravam o caminho crítico

| Decisão | Libera | Estado nesta leitura |
|---|---|---|
| Preço, oferta, contrato e provedor de cobrança | Compra na LP, confirmação de pagamento e entrada legítima no app | Em aberto; nenhum preço do código ou de outros documentos foi adotado. |
| Identificador entre lead, conta do produto, conta financeira e pagador | Reenvio seguro, deduplicação, funil e dados 1P | Proposta em `docs/mapa-identidade-dados-1p-proposta.md`; vínculo em produção não verificado. |
| Regra de completude do cadastro e tratamento de “não sei” | Passagem do questionário à reunião e depois ao backend | Seis campos no WebApp versus onze no modo `gerar` do backend; pendência em `docs/decisoes.md`. |
| Origem dos horários, gestor, duração e confirmação | Agendamento real e comunicação honesta ao cliente | Google Calendar é preferência; horários e integração seguem abertos. |
| Porta única da execução e autorização do gestor após reunião | Primeiro criativo e campanha manual sem envio duplicado | Backend oferece `/cadastro` e `/onboarding/call`; escolher e testar uma transição. |
| Escopo do gestor e da geração de imagem | Escala operacional e promessa da demo | Gestor a confirmar; imagem em análise no PDF. |

## Verificações pendentes deste mapa

- Estado **ao vivo** de LP, WebApp, backend, banco, n8n, Meta e Finance; branch e build local não confirmam produção.
- Aplicação efetiva das migrations, RLS e dados reais; não ler `.env` ou executar escrita para conferir.
- Preço, oferta, contrato, provedor de cobrança e calendário; nomes de ferramentas em documentos antigos não são decisão atual.
- Responsáveis “a definir” nas pp. 2–4 e as quatro decisões pendentes da p. 8.
- A trava de reunião em `lib/onboarding/marca.ts:43-46` reconhece documentos com `respostas` ou `contas`; ela também pode reter cadastros anteriores ainda não enviados. Auditar esse conjunto antes de liberar o pipeline.

## Evidência desta passagem local (05/10)

- `node --test scripts/conferir-onboarding-preservacao.mjs`: **20/20**, código de saída 0; cobre retorno, blocos preservados, ausências, “não sei”, gravação falha, repetição e trava da reunião. Usa transporte e sessão simulados, sem banco real.
- `node --test scripts/conferir-ficha-operador.ts`: **14/14**, código de saída 0; inclui descrição visual literal, origem, timestamp, “não sei” e dado malformado.
- `pnpm typecheck`, `pnpm conferir`, `pnpm build`: **código de saída 0** em cada comando. O build compilou `/onboarding/marca`, `/onboarding/concluido` e `/revisar-perfil`; registrou uma leitura de nichos com `categoria=rede`, portanto não é prova de backend disponível.
- Navegador público: LP em `v2gmidia.com.br` com pré-cadastro e mensagem de 09/11; inspeção do formulário em 390 px, sem rolagem horizontal medida. Nenhum dado foi enviado.
- **Não verificado:** navegação autenticada no WebApp, Supabase/RLS e dados reais, agendamento, pagamento, `POST /cadastro`, campanha e publicação na Meta. A ficha do gestor foi coberta por testes puros e build, não por login de operador em navegador.
