# N26 — M1/M2 / versão QA, leitura Meta e fila do piloto — 08/11/2026

## 0. Resultado e menor impedimento

**Conferência atual concluída às 23:04 BRT de 08/11 (02:04 UTC de 09/11).** O QA publicado está atrasado em relação aos consumidores locais M1/M2. Nenhuma tela foi reconstruída e nenhum runtime foi editado.

- **M1, números:** a entrada publicada de Anúncios continua no caminho legado; a ficha publicada da mesa também chama o leitor legado. O código local já usa a coleção autenticada Meta. Há, portanto, **impedimento concreto de implantação do WebApp**, independentemente do resultado da conferência paralela do backend pelo 07/08.
- **M2, peça/decisão:** o formulário de envio está visível no QA para a sessão V2G; schema de revisão, intenção e bucket privado existem. A versão publicada da revisão não é a local corrigida. A Piligrin tem **zero pedidos de revisão** neste instante: não há percurso desse piloto a certificar por leitura.
- **179 testes locais atuais PASS.** Não confundir com Auth/HTTP/Storage reais. A sessão disponível não é a identidade nominal proprietária da Piligrin nem a de Cauã.
- **Menor próximo ato:** Central revisar e liberar uma versão QA identificável contendo os consumidores existentes e suas dependências; depois ensaiar leitura e peça/decisão com as identidades próprias já autorizadas. Sem nova compra, ampliação de papel, nova escolha de piloto ou pedido recorrente de prints.

Não houve edição de configuração, publicação/deploy, Git, escrita em banco/Storage/Meta, upload, geração, gasto ou login como outra pessoa. Somente este documento foi criado; sem índice ou planilha. Não alterei as duas páginas de Auth/Pedidos reservadas ao 03/04, nem o pacote U6 do 01/02.

## 1. Evidência da versão publicada

Inspeção por plugin Vercel do alias `v2g-webapp-qa.vercel.app`:

| Item | Medido nesta rodada |
| --- | --- |
| Projeto | `v2g-webapp-qa`, `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn` |
| Deployment | `dpl_H1N2U8Ye8JB3y5Wn6ucRRLPpbZCJ` |
| URL da versão | `v2g-webapp-di3ona559-v2-g.vercel.app` |
| Estado/origem | READY / CLI |
| Criado | 06/11/2026 14:33:54.725 UTC, 11:33:54.725 BRT |
| Pronto | 06/11/2026 14:35:01.302 UTC, 11:35:01.302 BRT |
| Alias | `v2g-webapp-qa.vercel.app` e alias da equipe |
| SHA Git | **Não fornecido:** `meta={}`, sem gitSource no retorno mesmo solicitando informação Git. Não atribuir SHA histórico a este deployment por semelhança. |

`target=production` é o ambiente do **projeto isolado QA**, não prova de produção do produto.

Comparação de fontes publicadas pelo plugin, sem .env:

1. Pasta publicada `src/app/(protected)/anuncios`: a listagem desse ramo contém somente `PainelDeAnuncios.tsx`, `loading.tsx` e `page.tsx`. Não contém `AnunciosMeta.tsx` nem `AtualizacaoDaConsulta.tsx`, usados pela página local.
2. Prefixo do `page.tsx` publicado: imports terminam no seletor legado, metadata na linha 20. A página local importa `anunciosDoNegocioSelecionado`, `InventarioDeAnunciosMeta` e `AtualizacaoDaConsulta` em `app/(protected)/anuncios/page.tsx:19`, `:20`, `:21`.
3. **Fonte completa** publicada de `components/gestor/leitura/LeituraDaConta.tsx`, UID `1d8d4443c0a98b709b0d2af0b86578e5626576dd`: importa `lerMetricasDaCarteira` na linha 2, recebe `desde/ate` e renderiza `DadosDaConta`. A local importa `anunciosDoGestorAtribuido` na linha 2, recebe `intervalo/contaId` e renderiza o inventário compartilhado em `:17`.
4. Prefixo publicado da action de revisão, UID `ec1de93b219c9047fb15471f43c626382637e6eb`: `getUser` sem captura de erro (`:17`) e imports anteriores à revisão de integridade. A local captura `erroSessao` e o nega (`app/(protected)/gestor/criativos/actions.ts:17`); possui verificação de arquivo/tamanho/MIME/hash em `:47`. Prefixo publicado da página da fila também não captura erro Auth; a local já o faz.

**Limite do conector:** a árvore global retornou truncamento (191 itens omitidos) e os conteúdos longos vieram em base64 truncado. Não certifiquei ausência global de `lib/anuncios`, hash integral dos arquivos publicados longos ou todos os seus caminhos internos. A constatação usa o ramo de Anúncios retornado, os imports completos da página e a ficha da mesa obtida integralmente; não depende de tratar o restante omitido como ausente. A frase inicial de progresso sobre “arquivos não publicados” deve ser lida nesse escopo demonstrado, não como inventário completo da lib.

## 2. Conferência da sessão existente e do piloto

Navegador Chrome, perfil existente, nova aba de leitura do QA. Sem ler cookies/tokens, sair da conta, preencher credenciais ou assumir a sessão de Cauã:

- `/anuncios` abriu autenticado como Victor, negócio **V2G**. Depois do carregamento, mostrou “Não conseguimos atualizar seus resultados agora”, sem números. Período visível: **01/11/2026–08/11/2026**.
- Seletor “Negócios disponíveis” listou **somente V2G**. Não tentei fabricar escolha da Piligrin por URL/cookie nem mudar propriedade.
- Abertura de `/gestor/criativos` foi redirecionada a `/inicio`, sem mostrar fila de gestor à sessão de cliente. Isso é um controle negativo observado; não comprova a carteira/decisão da sessão de Cauã.
- `/criativos` mostrou biblioteca vazia da V2G e formulário “Já tenho um criativo”, seleção JPG/PNG, dois objetivos, prazo promocional e conferência desabilitada até preencher. **Nenhum arquivo foi selecionado ou enviado**. Visibilidade do formulário demonstra esse caminho habilitado para essa sessão, não que todas as flags remotas foram lidas/certificadas.

Leituras pontuais somente no Supabase QA `zskpijnqgkqwxksqmzmf`:

| Verificação | Resultado atual |
| --- | --- |
| Piligrin / negócio do piloto | `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`, proprietário `09e25ab4-b55b-48d1-bfde-181e41192bb6` |
| Negócio V2G desta conferência | `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, proprietário `ca842864-295c-48c5-bf5c-6ac744de81c0` |
| Grant piloto Piligrin | Não revogado, válido até **05/12/2026 14:27:52.255381 UTC**; ligado ao proprietário acima |
| Conta autorizada Piligrin | `act_1165478988908157`, ativa, status `ok` |
| Página no grant | `206296256098753` |
| Atribuição operacional | 1 atribuição Piligrin; consulta com join Auth confirmou 1 atribuição a papel operador. Não autenticou Cauã nem inspecionou credenciais. |
| Pedidos comerciais / execuções Piligrin | **0 / 0**. Não é motivo para criar compra/execução só para consultar anúncios manuais. |
| Revisão/intenções/tarefas | `creative_review_requests`, coluna `upload_intent` e `manager_tasks` presentes |
| Storage revisão | Bucket `creative-review` presente e privado |
| Pedidos de revisão Piligrin | **0** |

O grant ativo da Piligrin está ligado a **outro perfil** em relação ao proprietário V2G. Portanto, o seletor dessa sessão não é prova de vínculo perdido, grant expirado ou falta de escolha do piloto. O histórico operacional em `docs/estado/piloto-piligrin-caua-05-11.md:115` continua sendo fonte da atribuição nominal e do consentimento já concluídos. Não verifiquei validade atual do token Meta, OAuth ou todos os escopos; status de conta/grant não substitui essa prova.

## 3. Logs atuais: qual falha foi realmente observada

Plugin Vercel, projeto/deployment acima, janela 01:48:48–02:03:48 UTC de 09/11, filtro backend. A amostra retornada registra:

- `GET /criativos`, 02:01:51.395 UTC: `GET /negocios/4406fcdb-9737-48d9-8cef-8aabb4eaf3ad/execucao`, **403**, categoria `nao_autorizado`.
- `GET /criativos`, 02:01:52.415 UTC: `GET /negocios/4406fcdb-9737-48d9-8cef-8aabb4eaf3ad/consolidado`, **404**, categoria `nao_encontrado`.

São chamadas do **negócio V2G e do caminho legado**, acionadas pela navegação dessa sessão. Não são respostas da coleção nova `/meta/campanhas`, nem HTTP do piloto Dúú, nem prova de ausência de anúncios na Meta. A saída de logs é uma amostra, não auditoria integral de requests. Não recuperei headers ou corpo autenticado.

**Interpretação:** liberar apenas schema ou backend não troca o consumidor WebApp já implantado. O bloqueio WebApp é verificável agora; eventuais bloqueios adicionais de rota/JWT/fonte/configuração do backend serão combinados pela Central com a conferência 07/08. Não declarei que a causa única é configuração ou que a rota nova já funciona com Dúú.

## 4. Código local e validação atual

Comando executado nesta rodada, sem rede/serviço de teste:

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-anuncios-meta.mjs scripts/conferir-anuncios-meta-integracao.mjs scripts/conferir-retorno-leitura-meta.mjs scripts/conferir-percurso-criativo-pronto.mjs scripts/conferir-revisao-criativos.mjs scripts/conferir-intencao-envio.mjs scripts/conferir-portas-gestor-interno.mjs scripts/conferir-tarefas-gestor.mjs
```

**179/179 PASS, zero falhas/skips.** A contagem do Node inclui o conferidor estático de portas como um arquivo aprovado; não são 179 transações/usuários reais.

Cobertura útil ao marco:

- M1: transporte com JWT humano, proprietário/carteira/conta exatos, sem token de máquina no GET humano; paridade cliente/gestor; campanha manual sem execução; falhas normalizadas sem zero inventado; parser recusa cobertura/fuso contraditórios; retorno de login preserva conta/período e não concede acesso.
- M2: envio e retomada idempotentes, objetivo/prazo, arquivo privado, carteira com tarefas ON/OFF, integridade de bytes/hash/tamanho/MIME, decisão única, retorno dos três estados após nova **sessão fictícia**, controles negativos A/B.
- **Não cobre:** navegação autenticada real do cliente Piligrin, RLS/Storage/JWT reais, arquivo desse piloto, sessão própria do Cauã, Meta ou deploy. As portas de Auth/banco/Storage/HTTP/router são substituídas. Os testes não certificam valores remotos de flags.

Nenhum defeito novo local foi encontrado que exigisse editar o domínio desta frente. As correções já existentes precisam chegar à versão QA; não reimplementei o que os testes atuais já exercitam. Não rodei build/typecheck global nem reiniciei dev.

## 5. Recorte mínimo revisável para liberação QA — proposta, não execução

### A. M1: consumidor Meta existente + dependências

Revisar o conjunto coerente de `lib/anuncios/*`, `lib/backend/anuncios-do-negocio.ts`, export de `lib/backend/index.ts` e transporte humano em `lib/backend/cliente.ts`; entrada/componentes/CSS de Anúncios; `LeituraDaConta.tsx` e seu chamador `app/(protected)/gestor/page.tsx`. Retorno usa `lib/anuncios/retorno-login.ts` + `proxy.ts`. Não publicar um componente isolado mantendo o contrato antigo do chamador.

O chamador de gestor exige `V2G_MANAGER_WORK_ENABLED` e `V2G_MANAGER_METRICS_READ_ENABLED` em `lib/backend/anuncios-do-negocio.ts:44`; o componente checa a segunda flag em `LeituraDaConta.tsx:11`. **Estados remotos não certificados por esta frente.** O transporte precisa de `V2G_BACKEND_URL` no alvo QA correto; não li seu valor. A aprovação de release/configuração é ato da Central/Victor, não consequência deste relatório.

### B. M2: revisão existente com correções de carteira/integridade

Manter juntos envio, carregador da galeria, página/action de gestor e helpers atuais. As duas peças centrais corrigidas continuam nos mesmos hashes do checkpoint P3: `gestor/criativos/actions.ts` e `page.tsx` (manifesto abaixo). Não habilitar geração, análise paga ou publicação para provar revisão.

Confirmar antes do ensaio `V2G_CREATIVE_REVIEW_ENABLED` e, apenas se a tarefa auxiliar entrar no aceite, `V2G_MANAGER_WORK_ENABLED`. O formulário visível da V2G não certifica o estado completo dessas opções para todas as rotas nem análise automática OFF. A Central deve verificar o estado necessário por canal autorizado, sem expor valores secretos.

### C. Identificar a versão candidata

O manifesto abaixo captura **bytes locais atuais** para revisão; **não é um pacote implantável autônomo**, não cobre todo o grafo de imports nem valida alterações concorrentes de outros donos. Central deve estabilizar a candidata, conciliar arquivos compartilhados e vincular SHA/deployment após seu ato próprio. Sem Git/SHA inventado, sem sobrescrever trabalho alheio.

| Arquivo local | SHA-256 em 08/11 23:04 BRT |
| --- | --- |
| `lib/anuncios/contrato-meta.ts` | `931b0608774f7a95a4899b2b51fde8576d4c217cd214edd901dec6aeda90b232` |
| `lib/anuncios/retorno-login.ts` | `5808840d44b862bc9a753176fdd3c0ff2591f63031d57814ad483ea2913c2a27` |
| `lib/backend/anuncios-do-negocio.ts` | `796a15bdfef1018cc460477fa8e51a5201d442d2803eb27efa7b58662200260d` |
| `lib/backend/cliente.ts` | `f6cce990d48ef78b5cdf239c9692e98cbc10864532c3229ce089baf6e75ab5e8` |
| `lib/backend/index.ts` | `ef5654638e326235e8a7ca7c7fcef7d6867aaffb069e523ca730a85372831f84` |
| `app/(protected)/anuncios/page.tsx` | `7c8550fdbc06bbd90098984e661bbd18abe66f52c9e3a8f486d491e57d266c18` |
| `app/(protected)/anuncios/AnunciosMeta.tsx` | `21f9e5cde32794d5f8701eebe15e04d597e2da3e9ace77df07ad94dc562c848a` |
| `app/(protected)/anuncios/anuncios-meta.module.css` | `c690092ecacc934a8bd84ef7c1e8a3e796648ef846b81182c5e7d1329fc6ae35` |
| `app/(protected)/anuncios/AtualizacaoDaConsulta.tsx` | `07c1fb8be320597a3c118e5cac283cbc91b3cdad9e7f780fea5423b3cd208b85` |
| `components/gestor/leitura/LeituraDaConta.tsx` | `dbdc5080b4f89c8b1956a0b0f40452097c7be0ab2d1e646e6475efbb3064a7d1` |
| `app/(protected)/gestor/page.tsx` | `36c03ca9543f14fab68cb79832fcaaafbe5543bc5387c05d060b51c9f0882e91` |
| `proxy.ts` | `f951ccc0971fedeeafd7ac4e549bbc1999a1bc97eeaf37b4714b419688718b09` |
| `app/(protected)/criativos/revisao-actions.ts` | `6d2a52f89890d926ec23bf01305b683cfccbfdb49752ba137647d88ad74bf16e` |
| `app/(protected)/criativos/page.tsx` | `33586b9faa274c0b58f7fcac765413226ea62e3a2b110738b2d24ed46c5ecb74` |
| `app/(protected)/gestor/criativos/actions.ts` | `f87f4eb33297f8ccb09af36df61c4f231a0041f024bbacdb5cb083fcf0de5b35` |
| `app/(protected)/gestor/criativos/page.tsx` | `854d824d199bf33b157ce7c9d49d8f8cae3112197decb5704349b8618246f6f9` |

## 6. Provas autenticadas ainda necessárias e menor ação por dono

| Marco | Menor ato depois da candidata QA | Prova para aceitar |
| --- | --- | --- |
| M1 cliente Piligrin | Abrir com a **identidade nominal já proprietária** e seu negócio/conta, sem criar acesso novo; escolher recorte explícito de até 31 dias | Coleção nova e Anúncios com mesmo business/conta/campanhas/período/moeda/fuso, fonte/data da consulta, estados observado/parcial/sem dados honestos. O recorte 28/10–01/11 da prova V2G não é automaticamente recorte aprovado Dúú. |
| M1 Cauã | Cauã usa sua própria sessão/carteira após release | Mesa lê a mesma coleção e o mesmo recorte; paridade com cliente/API/fonte, sem assumir que status ACTIVE comprova entrega agora. Não precisa mandar prints repetidos; a equipe registra diretamente no ensaio. |
| M2 cliente | Autorizar um único arquivo **próprio/de teste** e envio no negócio correto (não material privado por presunção) | request/business/autor/hash/tamanho/MIME/intenção; linha + objeto privado; sem duplicação. Nenhum arquivo foi autorizado/enviado nesta rodada. |
| M2 Cauã | Na própria sessão, conferir mesma peça e registrar uma decisão do roteiro | Mesmo pedido/negócio/hash, autor/data/nota, publicação continua manual. Tarefa auxiliar só se explicitamente incluída. |
| M2 retorno | Cliente recarrega e depois entra novamente com sua identidade | Mesmo pedido e decisão persistidos; outro negócio/gestor não acessa. Sem transferir URL assinada entre identidades. |

A matriz detalhada já existe em `docs/qa/n26-p3-criativo-pronto-04-11/MATRIZ-QA.md`; não foi marcada como executada. Seus atores A/B descartáveis exigem autorização se forem criados. Para o caminho positivo do piloto, **reutilizar as identidades/vínculos já aprovados**, sem pedir nova compra; controles negativos remotos não autorizam criar ou expandir acesso nesta rodada.

**Donos:** Central estabiliza/aprova release e configuração QA; 07/08 confirma backend/contrato e sua prova de Dúú; 05/06 confere consumidor/retorno depois da liberação; Cauã atua na própria sessão durante a rodada assistida. Se for indispensável abrir a identidade nominal do cliente em navegador, usar a sessão própria existente ou handoff pontual de login, preservando a V2G atual — não conceder operador ao Victor ou impersonar Cauã.

**Parada:** nenhum ato externo pendente foi realizado por interpretação de autonomia. M1/M2 seguem sem aceite ponta a ponta do piloto até essas provas; produção, cobrança e publicação de anúncios estão fora.

