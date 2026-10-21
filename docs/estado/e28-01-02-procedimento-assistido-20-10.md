# E28-01/02 — venda assistida, acesso e procedimento administrativo

Data: 20/10/2026, America/Sao_Paulo. Bloco LOCAL autorizado pelo plano do evento.

## 0. Decisão/ação humana mínima

- Victor coordena a venda e a conferência financeira; só operador V2G já autorizado usa `/pedidos`. Não criar papel global de operador para cliente ou agência.
- Para usar as correções abaixo no ambiente publicado: Victor faz commit/push pelo GitHub Desktop e confirma o ambiente. Deploy e novo ensaio HTTPS dependem da janela/autorização própria; não realizados neste bloco. Antes de qualquer Pix real, conferir conta recebedora, instrumento jurídico aprovado, condições comerciais e ambiente real de acesso. QA/Sandbox não recebe venda real.
- Contrato: indicar o arquivo final aprovado pelo advogado e a evidência de aprovação daquela versão; confirmar representantes/poderes e disponibilidade do canal manual de assinatura Google já escolhido. Não reenviar as perguntas comerciais respondidas em 13/10.
- Nota: obter da Contabilizei a parametrização da operação concreta ainda não confirmada (competência/início/mês parcial, valor de cada competência antecipada, ISS/retenção/município e procedimento de correção). Emissão real e assinatura exigem autorização específica. O procedimento está preparado; essas aprovações NÃO foram fabricadas.

## 1. Estado para o Central atualizar

| ID | Resultado deste bloco | Ambiente/limite |
|---|---|---|
| E28-01-A | Procedimento utilizável definido; corrigidos bloqueio do atendimento sem LP e CNPJ inválido; aprovação exige declaração de conferência bancária e retorno positivo da RPC. | Preparado e testado LOCALMENTE. Não declarar percurso publicado novo ou venda real concluída. |
| E28-01-B | Provas anteriores de vínculo exato, concorrência, negação e acesso preservadas; caminho LP continua na RPC com unicidade. | Comprovado em QA nos recibos citados; nova bifurcação direta/LP ainda não publicada. Produção não certificada por esses recibos. |
| E28-01-C | Checklist 3DS/recorrência preservado; não expandido. | P1, reavaliar em 30/10. Sem nova cobrança/habilitação. |
| E28-02-A | Checklist manual por compra, dono e evidências definidos; bloqueio do identificador V2 de teste corrigido. | Procedimento LOCAL pronto. Uso real bloqueado por documento jurídico aprovado e parâmetros fiscais finais; não marcar contrato assinado/nota emitida. |
| E28-02-B | Próximo recorte de automação explicitado na seção 8. | P1, reavaliar em 30/10; sem envio, emissão ou migration. |

## 2. Procedimento de venda assistida até acesso

### Antes de registrar

Responsável: Victor, ou operador V2G autorizado por ele. Confirmar com a pessoa: e-mail que ela controla, CNPJ da empresa, razão social, quantidade de contas, plano e valor. A validação de dígitos do CNPJ não prova situação cadastral nem poderes de representação.

Verificar se já existe pedido para a compra; não abrir outra compra para resolver e-mail incorreto, timeout ou pedido invisível. Atender pelo WhatsApp não comprova origem LP nem pagamento. Registrar apenas a referência necessária do atendimento, no processo privado já usado pela equipe; não criar CRM ou banco financeiro paralelo.

### Registrar pedido pendente em `/pedidos`

1. Escolher a origem explicitamente quando `V2G_LEAD_ORDER_LINK_ENABLED` estiver ativa:
   - **Pré-cadastro da LP:** informar ID exato, CNPJ, e-mail e WhatsApp do lead. O servidor confere na RPC existente; divergência não vira aproximação/fallback. O mesmo lead mantém um único pedido, UTMs/consentimento e evento comercial.
   - **Atendimento direto, sem pré-cadastro:** não inventar lead nem reaproveitar o ID de outra pessoa. O pedido usa a RPC assistida existente e permanece sem vínculo LP. Se houver dados de lead no envio, esse caminho é recusado.
2. Conferir declarações, CNPJ, razão social, e-mail e quantidade; registrar pedido pendente. A tela não cobra nem envia chave Pix.
3. Guardar o **ID do pedido e `business_id`** exibidos. Nome, telefone ou semelhança de e-mail não substituem esses IDs.
4. Períodos atualmente suportados pelo **Pix assistido**: mensal R$ 500 por conta ou anual à vista R$ 5.280 por conta. O semestral de R$ 2.850 já tem prova no checkout Sandbox, mas a RPC assistida não o aceita. Não registrar semestral como anual/mensal nem alterar preço direto no banco. Mensal assistido não cria débito automático; cada ciclo exige conferência humana.

Somente depois de conferir o pedido, Victor fornece no atendimento autorizado os dados da conta real recebedora já aprovada pela empresa. Este documento não contém nem inventa chave Pix. Nenhum dado Sandbox pode ser enviado como instrução de pagamento real.

### Receber prova e conferir o crédito

Responsável: Victor/financeiro designado; o operador registra.

1. Localizar a entrada na conta recebedora por fonte bancária própria: valor, data, identificador da transferência e ausência de mera programação/agendamento. Se o pagador divergir do comprador, esclarecer e registrar a conciliação; não liberar por semelhança.
2. Ligar a evidência ao pedido correto. Guardar comprovante e referência da conferência em local privado já autorizado para a compra. Não colar extrato completo, chave, senha ou dado de cartão no produto/chat.
3. Em **Registrar comprovante**, informar localizador estável (ex.: referência privada do documento/transferência e data). Receber imagem isolada pode registrar `proof_received`, mas NÃO comprova crédito nem abre acesso. Antes de aprovar, a referência precisa permitir localizar também a conferência bancária. Se ela estiver incompleta/incorreta, interromper a aprovação e reconciliar; não criar outro pedido nem improvisar UPDATE.
4. Em `proof_received`, reler e-mail/CNPJ, valor e IDs do pedido/negócio. Marcar **Conferi o crédito efetivo...** somente após a conferência. Essa marca é declaração humana, não consulta automática ao banco.
5. Confirmar pagamento e liberar primeiro acesso. A action exige operador e declaração; a RPC exige comprovante e negócio e registra ator/hora/evento. A action agora rejeita resposta `false`/nula, mesmo sem erro de transporte.
6. Recarregar: exigir `payment_approved` no mesmo pedido/negócio, não apenas aviso na URL. Em timeout/falha, reler e conciliar antes de repetir; as RPCs existentes têm replays idempotentes. Não interpretar erro HTTP como prova de que nada aconteceu.

### Orientar o comprador — sem transmitir credenciais

Responsável: Victor/atendimento autorizado. Mensagem ao cliente só após autorização própria, não enviada por este bloco.

- Conta existente: `/entrar`, com o e-mail exato da compra e a senha do próprio comprador. O login relê compras aprovadas e só vincula negócio autorizado.
- Primeiro acesso: na mesma entrada, escolher primeiro acesso, informar e-mail da compra/CNPJ e criar a própria senha. Confirmar o link recebido; ausência de e-mail exige recuperação/atendimento, não mudança de e-mail ou aprovação manual do Auth.
- No seletor, abrir o negócio correto. O destino atual é `/inicio`, onde permanece o próximo passo do onboarding. Não usar o redirecionamento histórico direto a `/onboarding` como exigência vigente.
- Confirmar pessoa e negócio certos; acesso de outro CNPJ não serve como prova. Se faltar negócio, conferir `buyer_profile_id`, `businesses.profile_id`, e-mail confirmado e `business_id` do pedido. Nenhum papel interno é necessário ao cliente.
- Contrato e nota seguem trilhas separadas. Pagamento aprovado permite acesso/onboarding, não publicação. Estorno é ocorrência para conciliação humana; não existe aqui revogação automática de acesso/campanha.

## 3. Contrato de passagem para 03/04

| Fato confirmado | Fonte/condição | Consumidor/próximo passo |
|---|---|---|
| Pagamento aprovado | `commercial_orders.status = payment_approved`, negócio não nulo; no Pix direto, comprovante, aprovador e hora; não `proof_received`. | Porta comercial do WebApp. |
| Pessoa autorizada | Auth com e-mail confirmado; `buyer_profile_id = user.id`, e-mail exato da compra; `businesses.profile_id = user.id`. Legados/operadores têm exceções próprias já existentes. | `temAcessoWebApp` e vínculo comercial, sem conceder papel de operador. |
| Negócio escolhido | `business_id` autorizado sob sessão/RLS e lista de negócios liberados. | `/escolher-negocio` -> `/inicio`; 03/04 conserva retomada/onboarding. |
| Contrato assinado | Documento da versão aprovada e comprovação de todas as assinaturas/poderes. Pagamento não substitui isso. | Portão separado da primeira publicação. |

Não editar lógica do onboarding. Não levar imagem de comprovante, contrato em rascunho, nota agendada ou clique em reunião como fato concluído. Referências técnicas: `lib/contratacao/acesso.ts`, `vincular-core.ts`, actions de `/entrar` e `/escolher-negocio`.

## 4. Checklist manual de contrato por compra — E28-02-A

**Dono:** Victor coordena; advogado aprova instrumento; representantes assinam; operador só registra evidência conferida. Piloto escolhido nos registros: Google Workspace manual. Disponibilidade/execução real do serviço de assinatura ainda precisa de prova; se indisponível, não declarar envelope enviado nem substituir por aprovação no WhatsApp.

Antes de enviar:

- Pedido/negócio, CNPJ/razão social, quantidade/contas, plano/preço e e-mail correspondem à compra aprovada. Mídia é separada do preço V2G.
- Arquivo jurídico final, versão, hash SHA-256 e referência de aprovação do advogado identificados. O conjunto `docs/contrato-v2g-minuta-teste-2026-10-13-v2.md` + schema + exemplo é **teste interno**, NÃO instrumento aprovado. Decisões comerciais de Victor em 13/10 não equivalem a aprovação jurídica.
- Nome, e-mail, qualificação, quantidade de signatários e evidência de poderes conferidos para V2G e cliente. Não coletar documento pessoal extra sem necessidade/processo seguro.
- Marco de início, condições do plano e compatibilidade com a aprovação de peças no app conciliados com a redação aprovada. Não prometer regra de restituição/mês parcial da minuta de teste como cláusula final.

Depois de envio manual autorizado:

- Guardar referência do pedido/envelope, versão/hash exatos, destinatários autorizados, data e responsável. Enviado não é assinado.
- Exigir arquivo final e evidência/certificado de conclusão de **todos** os signatários. Arquivar a versão assinada e trilha no processo privado da compra; documento assinado não é sobrescrito.
- `contract_documents.status = signed` só com esse fato confirmado e mecanismo de registro autorizado. `/pedidos` lê esse estado, mas NÃO oferece envio/assinatura nem formulário para gravar a conclusão. Se o documento está externo sem registro no WebApp, manter as duas informações explícitas e reconciliar antes de usar qualquer portão que consulta o banco. Não usar SQL manual improvisado.
- Primeira publicação continua bloqueada até contrato e demais condições operacionais comprovados. A tela mostrar "sem assinatura registrada" não prova que não existe documento externo; exige conciliação.

## 5. Checklist manual de NFS-e por compra/competência — E28-02-A

**Dono:** Victor coordena; Contabilizei confirma tratamento e parâmetros; responsável fiscal autorizado emite no canal real confirmado por eles. Automação não é requisito deste procedimento, mas emissão legítima e evidência continuam necessárias.

- Vincular pedido, tomador (CNPJ/razão social/endereço e demais dados efetivamente exigidos), mês de serviço, valor aprovado da competência e conta(s). Usar o registro privado existente, não criar outro ledger de cobrança.
- Reaproveitar o que foi informado pela Contabilizei nos registros de 07/10 e 12/10: Simples, item/código de serviço e orientação de uma nota por mês de serviço. São informações atribuídas, não cadastro fiscal validado neste bloco. Não emitir uma nota total de plano antecipado só porque foi recebido à vista.
- Não transformar R$ 475/R$ 440 em política fiscal automática. Exigir distribuição por competência confirmada, início e tratamento de mês parcial. Alíquotas/retenções e município devem ser confirmados para a operação, não copiados do exemplo antigo.
- Emitir somente com aprovação/parametrização fiscal no canal autorizado, guardando identificador/número, competência, valor, PDF/XML/consulta de autenticidade, data e responsável.
- Agendamento, RPS ou solicitação enviada não são NFS-e autorizada. `fiscal_documents.status = authorized` requer autorização/autenticidade confirmada e caminho de registro autorizado; a tela atual apenas consulta. A tabela legada não representa adequadamente cada competência; não reutilizar uma nota antiga para declarar todas emitidas.
- Estorno de pagamento não cancela a nota nem o contrato automaticamente. Rejeição, cancelamento, substituição, mês parcial e reembolso vão à Contabilizei com IDs/competência; não repetir emissão por timeout sem consultar a anterior.

**Perguntas realmente abertas, para Victor encaminhar quando necessário:**

1. Qual canal manual de emissão será usado e quem é o responsável por emitir/conferir a autorização?
2. Como registrar início do serviço, primeira competência/mês parcial e valores por competência dos planos antecipados nesta operação?
3. Quais parâmetros de ISS/retenção/localidade devem ser usados para este tomador, com distinção entre imposto da nota e DAS? A orientação anterior para tomador fora do município precisa ser conciliada antes de parametrizar.
4. Que dados do tomador faltam e qual evidência de nota autorizada/captura a Contabilizei quer receber?
5. Em rejeição, pagamento estornado ou correção após emissão, qual fluxo e responsável devem ser acionados antes de cancelar/substituir?

Estas são perguntas operacionais, não recomendação tributária nem nova aprovação jurídica.

## 6. Provas reaproveitadas — não repetir cobranças

- `qa-compra-acesso-12-10.md`: Pix semestral Sandbox, pagamento confirmado por webhook, acesso no negócio correto e replay sem segunda aprovação.
- `qa-primeiro-acesso-convite-12-10.md` e `qa-primeiro-acesso-09-10.md`: primeiro acesso, recebimento/confirmacão do e-mail e vínculo; considerar decisões posteriores de destino `/inicio`.
- `etapa-01-qa-vinculo-seguranca-financeiro-19-10.md`: LP -> pedido concorrente, ID/CNPJ/e-mail/WhatsApp divergentes recusados, origens/UTMs/consentimento visíveis, cliente/anônimo negados; primeira mensalidade, cancelamento e estorno confirmados.
- `etapa-01-estorno-publico-renovacao-19-10.md`: ciclo seguinte antecipado com token e estornos; NÃO prova calendário natural. `etapa-01-3ds-integrado-preparo-19-10.md` registra publicação posterior da correção de estorno e migration 3DS QA.
- Cartão anual/Pix e recusas no histórico de checkout permanecem provas do recorte Sandbox já aceito; não voltam ao backlog como novos ensaios pagos por rotina.

São provas históricas de QA identificadas e relidas neste bloco, não novas certificações em produção. Último recibo de publicação lido: QA `4cb5c955`, deployment `dpl_BPr2XruXumQsrPVzvKoQSVxfciva`. Não foi consultado deployment novo neste bloco. A lacuna de publicação é objetiva: as correções de hoje estão apenas no checkout local; o vínculo existente tem prova no QA, não de uma compra assistida real no ambiente de produção.

## 7. Implementação e verificação deste bloco

Arquivos próprios alterados:

- `lib/contratacao/pedido-assistido.ts`: validação pura de origem, dados e conferência; CNPJ usa a mesma regra do primeiro acesso; limite 1–100; nenhum campo LP é descartado.
- `app/(protected)/pedidos/actions.ts`: mantém autorização em cada action; escolhe RPC por origem explícita; não faz fallback após erro LP; exige retorno da operação; evita payload bruto nos logs.
- `app/(protected)/pedidos/Formularios.tsx`: origem explícita, campos LP condicionais, declaração de crédito bancário e ato de aprovação descrito corretamente.
- `app/(protected)/pedidos/page.tsx`: exibe IDs do pedido/negócio e próximo passo correto, com `business_id` incluído no select. Estado aprovado não é descrito como prova de contrato/nota.
- `lib/contratacao/preparo-assinatura.ts`: recusa também `teste-interno-*` (ID real V2) e `contrato-v2g-teste-*`, inclusive variação de caixa/espaços. Preserva exigências de versão/hash/poderes.
- `scripts/conferir-pedido-assistido.mjs` e `scripts/conferir-preparo-assinatura.mjs`: regras reais, actions com adaptadores falsos e renderização dos componentes reais, sem rede/.env.

Executado: **49 testes PASS** (pedido assistido 11, acesso 6, LP 4, contratação 4, preparo assinatura 7, competências fiscais 4, 3DS preservado 13); `pnpm typecheck` PASS após corrigir estreitamento do tipo da validação; detector Impeccable sem achados nos dois TSX; `git diff --check` do recorte PASS. Validador Python da minuta V2 PASS (schema, exemplo, travas e 7 casos negativos), sem gerar/enviar documento.

Reprodução do recorte, sem rede nem alteração de scripts compartilhados:

```powershell
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-pedido-assistido.mjs scripts/conferir-acesso.mjs scripts/conferir-vinculo-lead-pedido.mjs scripts/conferir-contratacao.mjs scripts/conferir-preparo-assinatura.mjs scripts/conferir-competencias-fiscais.mjs scripts/conferir-cartao-3ds-integrado.mjs
```

O novo conferidor está explícito nesse comando; não foi acrescentado ao `package.json` compartilhado. Central deve incluí-lo na integração coordenada, sem declarar que a suíte geral já o executa.

Ambiente dos novos testes: LOCAL, dados fictícios, mocks de Auth/banco nas actions. Renderização estática não é ensaio autenticado nem inspeção visual em navegador. Não rodado build/dev, não reiniciado servidor compartilhado e não alterada `.next` por build. Suíte completa não executada; os 17 desvios de migrations de outras frentes continuam no recibo anterior, não foram tratados como resolvidos.

Não houve commit/push/deploy, migration, escrita de compra/acesso real, cobrança, assinatura, NFS-e, Meta, mensagem a cliente ou autoagendamento. `package.json`, proxy/layouts/CSS global, índice de estado, Figma e planilha não foram editados por este bloco. Impeccable orientou a preservação da tela e dos estados; React best practices conferidas.

Fontes atuais: decisão de 20/10 em `docs/decisoes.md`, plano `docs/execucao-evento-28-10.md`, planilha original lida pelo Drive (v3, E28) e FigJam lido sem escrita. Uma segunda leitura focal do Figma atingiu limite Starter; não houve tentativa de contornar nem mudança no quadro. O espelho local/decisão e a primeira leitura sustentaram o recorte. Central recebe os IDs acima por este relatório, não por mensagem automática.

## 8. Próximo bloco, sem executar agora

- P0 antes do evento: publicar no QA sob autorização e conferir em HTTPS operador/cliente com fixtures já existentes e sem nova cobrança: origem direta/LP, recusa de CNPJ inválido, conferência obrigatória e negócio correto. Para uma transição financeira nova, pedir autorização específica.
- E28-01-C / 30/10: conferir estado do protocolo Asaas 1835325 (tokenização e 3DS independentes), publicar/ativar somente em QA com autorização, ensaio avulsa -> confirmação canônica -> assinatura mês seguinte, reconciliação de timeout, limpeza e desafio real quando habilitado. Não reivindicar que autorização antiga cobre nova cobrança; calendário natural permanece prova separada. Fluxo local e flags desligadas preservados.
- E28-02-B / 30/10: após procedimento manual real e aprovação do instrumento, escolher apenas um recorte de registro/integração com versão/hash, poderes, evento autêntico e replay. Fiscal usa pedido+competência+tipo/identificador externo, não `order_id` sozinho; migration aditiva já preparada exige revisão/autorização própria. Não implementar nem emitir agora.
- 26/10: entregar ao ensaio E28-08-C a passagem de identidade/acesso da seção 3 e as evidências de contrato/nota disponíveis, sem marcar pendência como sucesso. 27/10: apenas bloqueios.
