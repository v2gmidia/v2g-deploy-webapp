# Comercial 01/02 — proposta mínima para Cliente direto e Agência

Data: 15/11/2026. Estado: PROPOSTA PARA REVISÃO; sem implementação.

## 1. Resultado e limites deste bloco

Um checkout, duas entradas: formulário/atendimento ou compra direta. O tipo de contratação define quem paga e quais unidades serão atendidas; quantidade de contas não cria pessoas, senhas ou logins adicionais.

Esta rodada leu fontes e relatórios e criou somente este documento. Não criou pedido, conta, vínculo, cobrança, contrato, nota ou mensagem; não alterou código, banco, configuração ou publicação. Nenhum ensaio anterior foi repetido. A Central recolhe o checkpoint por leitura deste chat/documento.

Fonte de código produtivo indicada pela Central: `C:/Users/victo/v2g-deploy/webapp-conversas-producao`, commit informado `190f434bed9a79ed44fcbdff1f29736c00ab56ec`. As referências P abaixo são relativas a essa raiz. Sua publicação foi informada pela Central, não verificada no painel nesta rodada. Referências W são relativas a `C:/Users/victo/v2g-deploy/webapp`; L, a `C:/Users/victo/v2g-deploy/lp`. A cópia local da LP não certifica a LP publicada. Datas históricas não representam configuração remota medida em 15/11.

## 2. EXISTENTE / LOCAL / A IMPLEMENTAR / A APROVAR

| Frente | Classificação e evidência | Lacuna concreta |
|---|---|---|
| Checkout único sem login obrigatório | EXISTENTE na fonte produtiva indicada. P `app/contratar/actions.ts:24-28`, `:53-58`; `lib/contratacao/qualificacao.ts:20-49` | Não recebe tipo Cliente direto/Agência, nomes por unidade, contexto de pré-cadastro ou origem `compra_direta`. Hoje aceita 1–100 contas para qualquer comprador. |
| Referência e repetição | EXISTENTE. P `app/contratar/actions.ts:62-67`; `supabase/migrations/20261025215302_cpf_cnpj_contratante_v0.sql:84-90`, `:125-128` | Referência da mesma tentativa é reaproveitável; abrir outra referência não representa automaticamente a mesma venda. Documento não deduplica negócios. |
| Lead e atendimento | EXISTENTE no caminho assistido; LOCAL examinado na LP. P `lib/contratacao/pedido-assistido.ts:33-51`; `supabase/migrations/20261018130000_ligar_lead_lp_pedido.sql:35-36`; L `api/pre-cadastro.js:153-175` | Vínculo assistido exige dados exatos e não preenche automaticamente o checkout público. Não remover vínculo quando houver correção nem buscar por semelhança. |
| Pagamento Asaas | EXISTENTE. P `lib/contratacao/iniciar-pagamento.ts:119-150`, `:169-174`; `lib/contratacao/webhook-pagamento.ts:42-64` | Liberação produtiva e ensaio de comprador em produção não são provados pelo código ou pela configuração. |
| E-mail para comprador | EXISTENTE e condicionado a flags. P `lib/contratacao/processar-email-pagamento.ts:14-28`, `:47-68`; `lib/contratacao/email-pagamento.ts:27-35` | Contém link textual para entrar/criar conta. Não há botão HTML nesse payload. Pagamento confirmado não confirma o e-mail humano. |
| Alerta interno de compra/pagamento | A IMPLEMENTAR no fluxo examinado. P `lib/contratacao/processar-email-pagamento.ts:53-58`; `lib/contratacao/email-pagamento.ts:27` | Não foi localizada cópia V2G, destinatário interno ou outbox interna nesse percurso. O alerta de lead da LP é outro evento. Não assumir cópia do Resend nem avisos do painel Asaas. |
| Conta e vínculo | EXISTENTE. P `app/(public)/entrar/actions.ts:80-108`, `:144-152`; `lib/contratacao/vincular-core.ts:26-59`; `lib/contratacao/acesso.ts:22-56` | Cadastro por compra verifica e-mail/documento e direito; acesso novo exige e-mail confirmado e negócio correto. Não cria senha no pagamento. |
| Agência/anunciante | Relações EXISTENTES: P `lib/agencia/vinculos.ts:3-23`; `lib/cadastro/montar.ts:587-607`. Checkout específico A IMPLEMENTAR | Os campos do checkout ainda não descrevem agência pagadora e anunciantes nominais por unidade. Não tratar o negócio criado com nome do contratante como anunciante confirmado. |
| Pix externo | EXISTENTE como aprovação assistida humana. P `app/(protected)/pedidos/actions.ts:79-126`; `lib/contratacao/pedido-assistido.ts:69-72`; `supabase/migrations/0029_pix_assistido.sql:128-149` | Não é evento Asaas. Tela de evidência documental não concede acesso: P `lib/contratacao/evidencia-manual.ts:34-40`. O envio atual de confirmação é específico de cobrança Asaas. |
| Contrato | LOCAL/documental; template final A APROVAR. W `docs/contrato-v2g-minuta-parametrica.md:3-9`; `docs/contrato-v2g-minuta-teste-2026-10-13-v2.md:3-5`; P `lib/contratacao/preparo-assinatura.ts:22-38` | As duas minutas examinadas proíbem envio para assinatura. Não localizei aprovação jurídica identificada dessas versões. Não afirmar que um contrato real já está pronto. |
| Fiscal | A APROVAR / A IMPLEMENTAR. P `app/(protected)/pedidos/page.tsx:97-100`, `:133-139`; W `docs/estado/fiscal-contrato-07-10.md:13-17` | Exibir registro não agenda nem emite NFS-e; faltam validação contábil e prova de autorização. Não transformar orientação histórica em parâmetros fiscais vigentes. |
| Evento sem pedido | Correção LOCAL, separada. P `lib/contratacao/webhook-pagamento.ts:58-61` ainda devolve 503 | Candidata histórica não equivale a mudança publicada. Não ignorar qualquer evento sem vínculo. Ver seção 8. |

## 3. Percurso mínimo proposto

### Entrada A — LP → equipe → WhatsApp → mesmo checkout

1. Formulário registra manifestação de interesse, ID do lead, dados declarados, origem, UTMs e consentimento com data/versão. Não cria direito de acesso nem contratação.
2. Equipe seleciona o lead exato e prepara um rascunho comercial interno, com ID próprio e versão. Se o atendimento for de outra pessoa/empresa, corrigir explicitamente o contexto; não inferir identidade por telefone, nome ou documento.
3. Comprador abre o endereço limpo `/contratar`. Não colocar nome, e-mail, telefone, CPF/CNPJ nem token de acesso na URL. Referência interna é localizador, não credencial.
4. Para continuar no mesmo navegador, uma passagem por POST pode estabelecer uma sessão temporária de retomada no servidor. Para continuar por WhatsApp/outro navegador, usar referência informada por POST e comprovação do e-mail destinatário antes de exibir dados pessoais. Conhecer a referência, o telefone ou o CNPJ não autoriza ler o rascunho. O mecanismo de verificação será implementado e revisado depois; não existe hoje.
5. Sessão de retomada: curta, vinculada ao destinatário e à versão, limitada ao rascunho, com expiração/revogação e consumo atômico ao gerar o pedido. Cookie de retomada do aplicativo restrito ao host, HttpOnly/Secure; não compartilhar cookie de autenticação com a LP. Dados do navegador são revalidados pelo servidor.
6. Checkout mostra os dados reaproveitados para confirmação/correção. Preservar snapshot original do lead e registrar diferenças, autor, data e versão confirmada. Mudança de destinatário exige nova verificação antes de revelar/atribuir dados. Pedido passa a guardar os dados finais confirmados, sem reescrever a fonte histórica.
7. Confirmação da versão cria ou retoma um único pedido, associado explicitamente ao contexto/lead. O operador não precisa montar uma segunda venda. Pagamento segue o percurso comum abaixo.

A verificação para exibir dados do lead não concede acesso ao WebApp. Não é obrigatório criar uma conta Auth pré-pagamento para esse fim. Se não houver contexto autorizado, oferecer formulário vazio; nunca revelar dados encontrados por busca de documento/e-mail.

### Entrada B — LP Comprar → mesmo checkout

Sem formulário prévio obrigatório. Checkout coleta os mesmos dados essenciais, registra origem `compra_direta`, canal/página e UTMs disponíveis com procedência; quando ausentes, manter desconhecidas. Não fabricar lead prévio, consentimento ou atribuição de campanha. Acesso direto ao checkout sem prova de passagem pela LP não deve ser atribuído a uma campanha da LP.

### Identidades comuns às duas entradas

- **Contratante:** Cliente direto ou Agência; nome/razão social e CPF/CNPJ conforme regras vigentes. Agência é a contratante pagadora. Documento concilia dados da pessoa jurídica quando aplicável, mas não prova representação, propriedade Meta, pessoa humana ou autorização para fundir negócios.
- **Contato humano / comprador:** nome, e-mail e WhatsApp. Conta Auth pode já existir; no caso novo, o cadastro continua após a compra elegível. Pagamento não cria senha e não substitui confirmação do próprio e-mail.
- **Pedido:** ID, referência idempotente, versão, contratante, contato, origem, condições, unidades e pagamentos identificados.
- **Unidade contratada:** ID próprio e ordinal; nome declarado do anunciante; depois ID do negócio anunciante confirmado e conta Meta conferida. Nome é descrição, não chave de identidade. Mesmo anunciante pode ter mais de uma conta quando explicitamente contratado. Documento do anunciante é separado do documento do contratante e do titular do cartão.
- **Acesso:** perfil humano verificado, função e escopo explícitos; uma conta da agência pode operar N unidades. Não gerar seis logins nem convites para anunciantes por comprar seis contas. Agência não recebe briefing de campanha própria por ser pagadora.

Cliente direto: uma conta nesta oferta inicial. Agência: N unidades nominais, sem quantidade implicar logins. Esta é a nova direção de 15/11; precisa de validação no servidor e na tela, pois o código atual aceita 1–100 indistintamente. Condição atual de venda pelo WhatsApp também precisa ser apresentada no contexto do anunciante atendido, sem exigir campanha própria da agência.

### Conclusão comum e compras adicionais

Pedido pendente → pagamento confirmado por sua fonte → confirmação de pagamento por e-mail → entrar/criar/recuperar conta → verificar e-mail quando necessário → selecionar negócio/unidades elegíveis.

Com agência já autenticada, preservar a sessão e o e-mail; comprar unidades adicionais não exige cadastrar outra pessoa. O servidor deve exigir seleção do contratante/agência que a sessão pode representar. Expansão gera somente as novas unidades e uma referência nova de adição; não recria negócio raiz, não recontrata unidades já pagas e não muda assinatura existente automaticamente.

Um lead convertido já possui unicidade de origem no modelo atual. Para adições, preservar a conversão inicial e referenciar separadamente a aquisição/contratação anterior; não reutilizar cegamente `source_lead_id` único em todos os pedidos nem remover sua proteção. Novo desenho de relações e eventual migration exigem revisão própria.

Direito deve ser avaliado por unidade coberta e período, com vínculo explícito ao anunciante, além do direito da agência à carteira. O predicado atual por pedido/negócio não basta para assumir que uma conta paga libera toda uma carteira parcialmente paga. Contrato e aprovação de campanha continuam portões separados.

## 4. E-mail e alerta interno: resposta precisa

**Ao comprador:** existe envio automático disparado no processamento da confirmação financeira, com consulta ao Asaas. Não exige `email_confirmed_at` para enviar a confirmação de pagamento; exige o destinatário nominal do pedido e pagamento compatível. A confirmação da identidade humana vem em outra etapa, antes do novo acesso.

Flags e condições na fonte: `V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED`, `V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY`, `V2G_PRODUCTION_PAYMENT_EMAIL_FROM`, processamento produtivo seguro e schema pronto; no QA, `V2G_PAYMENT_EMAIL_ENABLED`, credenciais/remetente QA e destino fixo `V2G_PAYMENT_EMAIL_QA_TO`. Ver P `lib/contratacao/processar-email-pagamento.ts:14-28`. A URL usa `NEXT_PUBLIC_SITE_URL`, limitada aos hosts conhecidos em P `lib/contratacao/email-pagamento.ts:21-25`. Não lemos valores nem conferimos flags remotas nesta rodada.

O texto existente oferece entrar/criar acesso e pede o mesmo e-mail da compra (P `lib/contratacao/email-pagamento.ts:30-34`). Pode ser aprimorado com CTA visual, resumo do contratante e das unidades; isso é mudança futura. Login existente deve oferecer recuperação oficial sem senha enviada por e-mail.

**Prova:** documento de 21/10 registra e-mail recebido no QA (W `docs/estado/e28-01-3ds-email-ensaio-final-21-10.md:14-20`); a Central também reconciliou mensagem recebida de 27/10 no bloco anterior. Não é prova de envio/recebimento produtivo hoje. `accepted` significa aceite do serviço, não entrega na caixa. Não repetir os ensaios para produzir outra prova igual.

**Para nós:** o percurso examinado não possui alerta interno específico de pedido ou pagamento; `to` é do comprador em produção e é substituído pelo destino fixo no QA. Não há cópia V2G nesse payload. P `lib/contratacao/processar-email-pagamento.ts:53-58`. O alerta da LP, L `api/_alerta-lead.js:4-6`, `:16-28`, é aviso de contato salvo, não aviso de compra ou liquidação.

**Proposta de alerta interno:** fila própria ligada a `order_id`, tipo do fato e identificação da cobrança/ciclo quando houver. Tipos mínimos: pedido registrado, pagamento confirmado, ocorrência que exige conciliação. `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` da mesma cobrança representam uma única confirmação para esse aviso. Renovação usa outra cobrança/ciclo; duplicata do webhook não gera outro aviso.

Reservar o aviso junto à persistência do fato ou por coleta durável reconciliável do ledger; envio posterior por worker, separado da resposta financeira. Destinatário interno fixo aprovado em configuração, não fornecido pelo formulário. No conteúdo: pedido, contratante, unidades, origem, fonte, valor/período e estado factual, com link interno autenticado. Não enviar credenciais, dados de cartão, documentos ou token de acesso.

Chave única semântica, reserva atômica e idempotência no serviço de e-mail; `queued/sending/accepted/review`, com identificação da tentativa. Timeout ambíguo exige conciliação, não disparo cego. Falha de aviso não desfaz pagamento nem dispara nova cobrança. Operador vê pendência. Registro de recebimento/entrega é separado de aceite. Implementação e configuração de envio exigem próximo bloco aprovado; nenhum aviso será enviado por esta proposta.

Pix externo precisa de mensagem própria, somente após crédito conferido por operador: não usar o texto atual “O Asaas confirmou” nem inserir cobrança fictícia para reaproveitar a fila.

## 5. Nota — implantação controlada proposta, sem gravação

Origem humana: orientação da Central de 15/11, complementada por confirmação direta de Victor transmitida pela Central no mesmo dia. A unidade já paga é **Versan Logistic**; o primeiro anunciante a implantar pela compra da plataforma é **Brotherhood Barbershop**. **Fleetlink, Sfinge Mobilidade Elétrica, Curi Arborismo e Navegue Seguros** são os quatro restantes para o Pix externo conciliado conforme o plano. A alocação nominal está confirmada; os nomes não substituem IDs/documentos, evidência bancária ou identificação do período coberto. O pagamento de Versan foi informado por Victor, não verificado no banco nesta rodada.

Com R$ 500 por conta e mesmas condições confirmadas, cinco novas unidades somam R$ 2.500. Preço corrente na fonte: P `lib/contratacao/preco.ts:3-5`. A proposta de separação é:

| Cobertura | Quantidade | Fonte/valor proposto | Tratamento |
|---|---:|---|---|
| Versan Logistic — já paga, conforme Victor | 1 | Pagamento anterior, valor/período/evidência a conferir | Preservar e conciliar registro e direito válidos; não cobrar novamente nem criar prova Asaas. |
| Brotherhood Barbershop — primeira implantação pela plataforma | 1 | Checkout/Asaas R$ 500 | Primeiro pedido de uma unidade, somente quando autorizado; liberação depende da confirmação financeira e do acesso conferido. |
| Fleetlink, Sfinge Mobilidade Elétrica, Curi Arborismo e Navegue Seguros | 4 | Pix externo total R$ 2.000, se condições aprovadas | Pedido assistido de quatro unidades nominais com fonte `direct_pix`, comprovante e crédito bancário conferidos por operador; nenhuma confirmação Asaas. |

Usar o mesmo contratante Nota e a mesma conta humana existente, com seis unidades de cobertura explicitamente identificadas, vinculadas aos respectivos pedidos/fontes. A compra de R$ 500 de Brotherhood cobre somente sua unidade: ter seis nomes na carteira não libera os seis anunciantes. Não fazer pedido Asaas de seis unidades e aprová-lo com R$ 500, nem cobrar Versan novamente. Não criar assinatura de R$ 2.500 além do Pix de R$ 2.000 para o mesmo período. Alocação deve garantir soma em centavos por recebimento e por unidade/período; recebimento externo não pode cobrir duas vendas por engano.

O modelo atual não apresenta alocação financeira mista de um pedido entre seis anunciantes. Por isso o mínimo proposto preserva fontes em pedidos separados e adiciona vínculo de unidade→anunciante/cobertura, em vez de inventar aprovação parcial de pedido inteiro. Havendo liberação histórica independente, preservar sua evidência e não convertê-la artificialmente em nova venda. A função de evidência documental, sozinha, não libera as outras cinco contas.

Antes de emissão, falta conferir: valor, fonte, evidência e período já coberto de Versan; IDs dos seis anunciantes; dados/representação da contratante e e-mail da conta existente; início e condições das cinco novas unidades; como serão cobrados ciclos seguintes. A escolha nominal de Brotherhood e dos quatro anunciantes do Pix está resolvida. Mensal Asaas atual exige cartão (P `lib/contratacao/qualificacao.ts:46-47`); Pix mensal externo é procedimento assistido, não recorrência automática. Não ativar Pix mensal self-service como atalho. Esta confirmação atualiza somente o planejamento; não autoriza emissão, recebimento, criação de assinatura ou concessão real.

## 6. Contrato e fiscal: automação em ordem verificável

**Contrato examinado:** minuta-base `minuta-interna-2026-10-09-v1`, sem aprovação jurídica declarada, e V2 `teste-interno-2026-10-13-v2`, proibida para assinatura. Ambas identificam contratante CNPJ, enquanto o checkout vigente aceita CPF/CNPJ; o template final precisa contemplar a oferta aprovada, agência pagadora/anunciantes, inclusões posteriores e formas mistas sem redigir cláusulas novas neste bloco. Não aplicar automaticamente multas/prazos propostos no teste.

Procedimento histórico escolhido: assinatura assistida pelo Google após preencher somente versão final aprovada, conferir signatários/poderes e arquivar documento e prova. W `docs/estado/etapa-02-piloto-assinatura-google-13-10.md:3-7`, `:17-24`. Isso registra uma decisão datada, não uma verificação atual de recursos/preços/APIs de terceiros.

Automatizar primeiro a tarefa interna e o preenchimento determinístico de rascunho por pedido/versão aprovada. Bloquear envio com dados/poderes ausentes. Documentos gerados, enviados ou parcialmente assinados não viram `signed`. Preservar versão, PDF/hash, signatários, comprovação e entrega da cópia final. Assinatura assistida validada vem antes de integrar envio automático por provedor escolhido e autorizado. P `lib/contratacao/preparo-assinatura.ts:22-38`; W V2 `:232-240`. Integração nova, contratação de provedor e envio real são blocos posteriores.

**Fiscal:** preparar tarefa interna com pedido, tomador confirmado, prestação/competência e valores conciliados. Para Agência, tomador/contratante e anunciantes são campos separados; a identificação fiscal final depende da contabilidade, não do nome da conta Meta. Contabilidade precisa validar serviço, município, retenções, início/competência, antecipação, Pix externo, ajustes e estorno na situação concreta. Não copiar percentuais/regras de uma nota antiga nem presumir que pagamento equivale a emissão. Emissão automática e envio da nota só depois de configuração aprovada e evidência de autorização no emissor. Nenhuma obrigação/competência real é gravada por este documento.

Estados separados: pagamento confirmado; identidade verificada; acesso à unidade; contrato concluído; nota autorizada. A fonte atual permite acesso após pagamento elegível e confirmação da identidade; campanha nova continua dependente de contrato e preparo operacional, P `lib/campanha/ativacao.ts:320-338`. A extensão para unidades de agência deve conservar esses limites, sem herdar autorização de um anunciante para outro.

## 7. Automação: dono e critério de aceite

| Entrega | Dono proposto | Critério para aceitar o próximo bloco |
|---|---|---|
| CTAs e entrada formulário/compra | Frente LP + Central | Dois caminhos claros no mesmo checkout; nenhum clique gera compra/conta antes da confirmação. Publicação/ativação separadas. |
| Retomada e origem | 01/02 + frente LP | Dados pessoais só após autorização do destinatário; nenhuma PII/token em URL; correção auditada; origem desconhecida preservada; uma conversão inicial por referência/lead, adições legítimas separadas. |
| Tipo e unidades nominais | 01/02; revisão pela Central | Cliente direto=1; Agência=N; nomes por unidade; pessoa jurídica, humano e anunciante separados; mesmo login; contagem e preço calculados no servidor. |
| Alocação e adições | 01/02; Victor confere identidade/condições | Cada unidade aponta para anunciante e cobertura reais; uma cobrança não libera unidades além das cobertas; expansão não duplica unidade, assinatura ou período. Estorno afeta cobertura correspondente e preserva outras válidas. |
| Pagamento e acesso | 01/02; Victor para autenticação/atos financeiros | Pendente não concede direito; conta existente e nova usam e-mail confirmado; agência vê só escopo conferido; retorno/replay não concede acesso nem gera nova cobrança. Usar provas existentes antes de solicitar ensaio novo. |
| E-mail ao comprador | 01/02; Victor configura/autoriza prova produtiva | Destinatário exato, fonte financeira correta, valor/unidades claros, CTA entrar/criar e recuperação; uma confirmação por cobrança; aceite e recebimento separados. Não atribuir teste QA à produção. |
| Alerta interno | 01/02; Victor aprova destino; Central revisa | Pedido e pagamento distintos; confirmação deduplicada entre eventos equivalentes; fila durável; timeout em revisão; falha de e-mail não repete pagamento; pendência visível e recebimento medido. |
| Contrato | Victor + advogado aprovam; 01/02 prepara | Template exato aprovado, CPF/CNPJ e agência contemplados, signatários/poderes conferidos, PDF/hash e todas as assinaturas comprovadas. Automação de preparo primeiro; envio assistido antes de automação externa. |
| Fiscal | Contabilidade + Victor aprovam; 01/02 prepara integração | Parâmetros e tomador aprovados, chave por obrigação/competência/tipo a revisar, idempotência e conciliação; só autorização real gera estado emitido. Não prometer emissão a partir de pagamento. |

## 8. Pacotes mínimos para revisão, sem execução agora

1. **Modelo comercial e tela:** tipo de contratante, unidade nominal, contexto/lead, origem e confirmação das correções. Desenhar compatibilidade das unidades atuais e direito da agência sem modificar seu cadastro operacional/Meta. Não reconstruir o funil.
2. **Alocação e notificações:** relacionar unidades a coberturas de pedidos separados; preparar alertas internos e confirmação própria para Pix externo. Propor migrations aditivas e retorno conservador somente em próximo bloco autorizado, com revisão de privilégios e isolamento. Nunca preencher grants/contas para obter resultado verde.
3. **Webhook sem pedido, isolado:** revisar exclusivamente `lib/contratacao/evento-sem-pedido.ts`, chamada no webhook e conferidor correspondente da candidata em `C:/Users/victo/.codex/private-backups/v2g/release-comercial-20261111-gVYLAQ/source`. Seu `manifest.json` histórico declara candidata local, base `13f8943…`, e também contém alterações Meta; não promover pacote inteiro por associação. O helper `evento-sem-pedido.ts:18-51` só permite ignorar cobrança externa após consulta canônica compatível, referência sem indício de pedido V2G e zero pedidos associados ao cliente; erro, UUID/referência V2G ou possível corrida preservam retentativa. Revisão contra a base vigente, sem repetir teste/cobrança neste bloco.
4. **Contrato/fiscal:** checklist de dados e tarefas automáticas internas, mantendo bloqueios externos. Não novo template nem orientação tributária.

Sequência: Central/Victor revisam esta proposta → recorte local nominalmente aprovado → implementação/testes dirigidos que cubram as mudanças → relatório e parada → autorizações específicas de banco/publicação/configuração/envio/financeiro conforme pacote concreto. Não usar Sandbox para conceder acesso em produção.

Pendências humanas já concentradas na Central: conciliar evidência e cobertura anterior de Versan, conferir IDs/dados e confirmar condições/ciclos do arranjo misto. Victor já identificou Versan como paga, Brotherhood como primeira compra pela plataforma e os quatro demais como unidades do Pix externo. Não repetir essas perguntas resolvidas nem tratar a confirmação nominal como autorização para emitir ou liberar acesso.

## 9. Evidência por ambiente/data

- **QA histórico, 21/10 e 27/10:** pagamento e e-mail recebido possuem evidência anterior; os resultados não homologam automaticamente as mudanças propostas, recorrência atual, desafio bancário real ou produção.
- **Produção, relatório de 11/11:** banco mínimo aplicado e conexões configuradas OFF. Fontes privadas não secretas já examinadas em 14/11: `C:/Users/victo/.codex/private-backups/v2g/comercial-producao/20261111T150243Z/conclusao.json` e `C:/Users/victo/.codex/private-backups/v2g/conexoes-producao-20261111/resultado-final-off.json`. Estes relatórios não são leitura remota de 15/11 e não comprovam compra/e-mail produtivo recebido.
- **LOCAL, 15/11:** esta proposta e leitura do contrato de código; nenhuma alteração funcional, teste, migration, configuração, ato financeiro, jurídico ou fiscal. Arquivos de terceiros preservados.
