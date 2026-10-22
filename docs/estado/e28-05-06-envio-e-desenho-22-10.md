# 05/06 — envio pronto e desenho do gerador — noite de 21 para 22/10

Checkpoint fechado em 21/10/2026, 23h12 America/Sao_Paulo (22/10, 02h12 UTC). Nome datado pelo ciclo noturno de 22/10. Um bloco local; não habilita novas rodadas nem automação.

## Feito nesta rodada, com evidência

### 1. Versão publicada do formulário, somente leitura

- Conector Vercel confirmou `v2g-webapp-qa.vercel.app` **READY**, deployment `dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS`, commit `fbf00ee3af7fb3cc8c06931138011a49bcd85236`.
- O rótulo `target: production` é do projeto isolado de QA, não comprova publicação no produto de produção. Nenhum deploy foi feito nesta rodada.
- Último commit que alterou `app/(protected)/criativos/PedirRevisao.tsx` ou `PedirRevisao.module.css` corresponde ao SHA publicado. Comparação desses dois arquivos entre esse commit e o HEAD local não retornou diferenças. Assim, não há refino local pendente nesses arquivos nesta conferência; isso não certifica todas as áreas do HEAD no QA.
- Navegador abriu `/criativos` no QA e foi redirecionado para `/entrar?next=%2Fcriativos`, com formulário vazio: **sem sessão QA autenticada disponível**. Nenhum login, upload ou novo usuário foi realizado. Aba temporária fechada; abas anteriores preservadas.
- A prova histórica de 17 verificações HTTPS/Auth/Storage permanece em [ensaio anterior](./e28-qa-publicado-e-ensaio-https-21-10.md). Não reexecutei seu script: ele cria quatro atores e testa decisão de gestor, fora do recorte atual. Prova de action HTTP não substitui percurso completo por cliques.

### 2. Ensaio de UI preparado, não executado

[Manifesto revisável](../qa/envio-pronto-ui-manifesto-22-10.json): dois usuários/negócios fictícios, emails `.invalid`, IDs ainda nulos, um arquivo público do repositório para uso de teste. Nada foi criado no QA. O PNG é a marca pública existente, não uma foto de cliente nem imagem gerada por IA: `public/marca.png`, 12.084 bytes, SHA-256 `718e7afe3615ab1059b06c9f8bbe53b5db0c284306ee22a530fc3aa24f5def41`.

Seis casos preparados: seleção/substituição/teclado; WhatsApp sem promoção e ida/volta da conferência; Instagram com data inválida e válida; galeria após recarga/novo login; isolamento entre A/B; responsividade e teclado na bancada. **Todos pendentes.** No máximo dois pedidos/objetos válidos, um por ator usando o mesmo arquivo. Falhas artificiais ficam locais, sem manipular Storage/configuração remota.

O manifesto identifica exatamente recursos, limites e regra de vínculo para Auth/profiles, businesses, grant comercial QA, fila, objetos e eventual tarefa auxiliar. IDs reais devem ser inventariados antes da limpeza; não remover por prefixo, nome ou negócio em lote. Vínculo/hash inesperado ou dependente não inventariado bloqueia limpeza, em vez de apagar por cascata.

**Dependência de acesso explicitada:** o executor histórico criou `webapp_legacy_access` para os atores QA. Esse mecanismo não equivale a compra; qualquer uso no novo ensaio precisa estar expressamente incluído na autorização. Nenhum grant foi criado e não foi proposto acesso de operador/agência. Efeito auxiliar já existente de tarefa não implica testar/aprovar o item de gestor.

### 3. Desenho da criação reconciliado com o que existe

Complementado o [mesmo documento de arquitetura](../criativos-arquitetura-dados-documentos-n8n.md), sem novo documento concorrente nem implementação do gerador:

- Confronto com `PedidoCriativo`/`ImagemGerada`, seleção de ângulo de nicho, substituição e retries/custo do client no backend. Formatos padrão feed + stories podem produzir mais de uma imagem; não tratar automaticamente cada clique como uma imagem/custo único.
- Campos atuais não fornecem toda a cadeia job/snapshot/reserva/cobrança. Valor calculado por tabela e fallback zero não são prova de custo faturado. Não alterei o backend.
- Consulta atual ao n8n confirmou piloto `3kfUlXxPnKRDMB60` **inativo**. Nós de Data Table, filtro barbearia, deduplicação e porta de autorização observados; não são um gerador funcional. Nenhum workflow executado, ativado, criado ou editado.
- Quatro exemplos fictícios de contrato: declaração do app; mensagem mínima backend→n8n; bloqueio por documento ausente; registro interno de arquivo disponível com cobrança desconhecida. Não são rotas existentes nem schemas implantados.
- Estados/retomadas propostos, incluindo timeout com reconciliação e `storage_pending` condicionado a bytes duravelmente recuperáveis. Reserva financeira e efeito de retries precisam ser implementados/testados em bloco próprio.
- Matriz de 12 critérios do futuro bloco com fakes locais. Não foram apresentados como testes executados.

A skill de arquitetura de agentes orientou responsabilidades e durabilidade, mantendo a stack estabelecida; não instalou framework nem gerou chamadas. A documentação técnica continua no repositório, no desenho já existente.

## Validação local desta rodada

- `node scripts/qa/conferir-desenho-envio-22-10.mjs`: passou nas duas famílias de asserções estáticas. Conferiu alvo QA isolado, manifesto ainda planejado, dois atores não criados, hash/tamanho/magic PNG, seis casos pendentes e quatro exemplos JSON válidos. Conferiu separação de custo desconhecido e de critérios não executados.
- Esse conferidor apenas lê arquivos locais; não executa Auth, banco, rede, upload ou geração. Não é teste funcional do produto.
- As provas locais anteriores **20/20** de intenção/recuperação e **12/12** de SQL não foram repetidas, pois não houve alteração de código do produto/schema nem desses testes. Evidência em [checkpoint anterior](./criativos-envio-pronto-e-arquitetura-21-10.md).
- Conferência de whitespace dos artefatos do bloco realizada separadamente; não usar sucesso estático para afirmar homologação autenticada.

## Falta / depende de Victor

| Item | Responsável / próximo portão |
| --- | --- |
| Ensaio UI autenticado no QA | Autorização humana específica pendente para atores, acesso comercial QA, uploads e limpeza exata do manifesto. Não repetir o pedido já enviado; preparar não é executar. |
| Interrupção remota, expiração de URL e concorrência entre processos reais | Não medidos; não injetar falhas remotas nesta rodada. Definir outro recorte antes de afirmar certificação completa. |
| Contexto/snapshot/job + integração n8n | Desenho pronto para revisão. Implementação exige novo bloco aprovado, começando com fakes locais e sem gasto. |
| Documentos finais de nicho e referências admissíveis | Victor/time define conteúdo e condições de uso; software versionará/selecionará. Não fabricar documento de mercado ou permissão. |
| Geração real, qualidade e custo-benefício | Ainda não comprovados no app. Piloto exige novo bloco, provedor/destino, materiais e teto financeiro especificamente autorizados; estimativas fictícias do desenho não são orçamento. |

**Itens 3/4/5 — aprovação/refações, operação do gestor e publicação — continuam adiados.** Não declarar as etapas 05/06 inteiras concluídas. O avanço desta rodada é pacote local de ensaio + arquitetura, não geração real nem prova ponta a ponta em produção.

## Limites respeitados / coordenação

Sem alterações de TSX/CSS/action, `.env`, grants, dados remotos, flags, migrations, material privado de cliente, chamada paga, Meta, publicação, build/restart, commit/push/merge/deploy ou nova automação. Sem mudanças no índice, decisões, plano mestre, Figma, planilha ou package.json: consolidação fica com a Central.

Alterações de outras frentes vistas no início (`docs/recebimento-cliente-meta.md`, checkpoint 03/04 e conferidores de estorno) foram preservadas e não atribuídas a este trabalho. Bloco encerrado; próximos itens não iniciados.

## Adendo de passagem 07/08 — avaliação documental do contrato novo

Acrescentado em 21/10, 23h49 America/Sao_Paulo (22/10, 02h49 UTC), por solicitação específica da Central. Preserva o registro fechado acima; não retoma manifesto de upload, seis casos UI ou 17 provas HTTPS. **Nenhuma implementação de página/guard/flag/fixture foi autorizada ou feita neste adendo.**

### §0 — decisão recomendada e portões humanos

**Compatível com a porta e os componentes existentes, mas não integralmente com os gates atuais: recomendar revisão do desenho antes de autorizar implementação.** Duas complementações concretas: conservar `V2G_MANAGER_WORK_ENABLED` e fixar identidade do projeto WebApp QA no servidor, além das URLs de banco/backend. O desenho de uma página separada é viável sem remover o filtro de fictícios da carteira. Não é necessário criar parser, fetch administrativo alternativo ou componente visual novo.

O caminho `/gestor/homologacao/leitura` e a flag `V2G_QA_MANAGER_METRICS_REHEARSAL_ENABLED` são **propostas do contrato**, não rota/variável implementadas. Backend QA HTTPS, IDs futuros de negócio/operador e período do recorte não foram comprovados/preenchidos; configuração incompleta deve negar, nunca receber domínio nominal/UUID de exemplo como valor válido. Cabe a Victor/Central aprovar ou adiar esse recorte. Mantém-se o adiamento dos itens 3/4/5; este adendo é preparação documental, não autorização de trabalho do gestor.

### Fontes conferidas e compatibilidade

Raiz das referências `backend:` abaixo: `C:\Users\victo\OneDrive\Documentos\GitHub\backend_v2g`. Referências `webapp:` partem deste repositório. Linhas conferidas no código local desta passagem.

| Fonte / fato observado | Consequência para o contrato proposto |
| --- | --- |
| `backend:docs/qa/homologacao-leitura-contrato-webapp-22-10.md`, seções “Menor caminho proposto” e “Matriz” | Propõe reusar `LeituraDaConta`/`DadosDaConta`, sessão verificada, operador fixo, atribuição, negócio fictício e período fixo. Compatível, desde que as complementações abaixo sejam incluídas. |
| `webapp:app/(protected)/gestor/page.tsx:39` mantém `.eq("dados_ficticios", false)` | Fixture corretamente marcada não entra na carteira principal. Preservar filtro; não trocar a marca para false, abrir o portfólio nem injetar fixture na lista. |
| `webapp:app/(protected)/gestor/page.tsx:80` define `trabalhoAtivo`; `:120` define `leituraDisponivel` combinando métricas, trabalho e atribuições disponíveis; `:123` restringe seleção à carteira do operador | O contrato novo exige duas flags, mas omite a de trabalho. Para não abrir entrada de métricas quando a operação está desligada, a página futura deve exigir **também** `V2G_MANAGER_WORK_ENABLED === "true"`. Na página isolada, substituir consulta global/parcial da carteira por atribuição exata; não substituir autorização por nome ou agregado. |
| `webapp:components/gestor/leitura/LeituraDaConta.tsx:6` aceita `{businessId, nome, desde, ate}`; `:9` nega renderização com flag de métricas diferente de `"true"`; `:10` chama `lerMetricasDaCarteira` | Reutilização direta é possível. A flag está no componente chamador, não dentro da porta. O componente sozinho **não** implementa recorte QA, operador fixo, negócio fictício ou 404. |
| `webapp:lib/backend/metricas-da-carteira.ts:27` recebe `{businessId, desde, ate}`; `:28` valida UUID/datas/ordem; `:32` usa `auth.getUser`; `:34` exige `user.app_metadata.papel === "operador"` | Cliente comum, papel só em `user_metadata` e sessão inválida não autorizam. `createAdminClient` vem em `:35`, **após** essa recusa; não mover a consulta privilegiada para antes da autenticação. |
| Mesmo arquivo `:36` seleciona `business_id, operator_profile_id` e filtra ambos; `:41` lê `id, profile_id` do negócio; `:44` usa `obter` | Porta preserva atribuição exata e dono obtido no banco. A página futura deve conferir `dados_ficticios`, nome e operador fixo separadamente; a porta atual não os verifica nem precisa ser enfraquecida para o ensaio. |
| Mesmo arquivo `:44–46`: GET `/negocios/{businessId}/consolidado`, parâmetros `profile_id`, `desde`, `ate`, timeout 5 s; `:50` chama `lerPorExecucaoDaCarteira` | Esse é o contrato HTTP real a reutilizar. Não inventar outro endpoint nem passar dono do browser. A nova whitelist permite esse GET. |
| `webapp:lib/gestor/contrato-metricas.ts:146` valida topo `business_id/desde/ate/por_execucao`; `:58` exige `contrato_de_leitura`; `:37` preserva strings decimais | Contrato de homologação não substitui o DTO `e28-07-v1`. `2.125` pode ser preservado; sem corpo validado a leitura falha. Não usar totais antigos ou contador vizinho como fallback. |
| `webapp:components/gestor/leitura/DadosDaConta.tsx:6` formata decimal sem arredondar; `:48` separa resultados atribuídos de conversas/vendas; `:64–65` distingue ausência e inconsistência; `:94–98` mostra falhas/contrato ausente/lista vazia | Reusar apresentação, inclusive mensagens normalizadas; manter fonte, período, moeda e coleta. Fixture nunca prova venda ou veiculação. Um payload fracionário `"2.125"` deve renderizar `2,125`, não `2,13`. |
| `webapp:lib/backend/cliente.ts:61` só exige base/token e remove barra final; `:132` faz fetch com token de máquina e `cache: no-store` | Não existe allowlist QA nessa porta HTTP. A futura guarda de ambiente deve anteceder seu uso. Nunca passar token/service_role ao cliente, nem usar fetch direto para contornar o consumidor. |
| `backend:src/api/qa_leitura.py:23` valida configuração opt-in; `:51` permite somente GETs públicos e `/negocios/{UUID}/consolidado`; `backend:src/api/main.py:82–85` preserva guardas iniciais, `:119–121` instala middleware QA condicional e autenticação | Código local compatível com a consulta, sem liberar escrita. Não é prova de serviço/configuração publicados nem de autorização humana. A whitelist de caminho não restringe um operador/fixture específico. |
| `backend:src/api/rotas.py:1925` recebe business/datas/profile; `:1954` declara que `profile_id` **não é autenticação**, `:1957` compara dono quando informado | Backend de máquina não substitui JWT humano, papel ou atribuição no WebApp. Guardas humanas devem continuar antes do GET. |

O relatório `backend:docs/estado/e28-backend-qa-pacote-completo-local-22-10.md:18` registra correção proposta QA para não arredondar `2.125` a `2.13`; `:27` registra 2.809 testes/9 ignorados; `:31` explicita SQL local/ASGI, sem TLS/JWT/RLS gerenciados. **Resultados atribuídos ao relatório 07/08, não reexecutados nesta frente nem promovidos a HTTPS.**

### Ordem mínima recomendada para uma futura página, ainda não implementada

1. **Antes de criar cliente administrativo ou consultar o backend nesta página:** flags server-only de homologação, métricas **e trabalho** estritamente `"true"`; ausência/valor diferente nega com `notFound()`.
2. Conferir ambiente pelo servidor: projeto Vercel QA permitido, host canônico de configuração QA, URL Supabase exata e backend HTTPS com destino exato previamente comprovado/aprovado. Nenhum Host/Origin/query/cookie do browser decide essa allowlist. Uma URL bem formada não prova que o serviço é o QA correto.
3. Exigir recorte server-only completo `{businessId, operatorProfileId, desde, ate}`, UUIDs/datas reais válidos e intervalo ordenado. Sem fixture autorizada e preenchida: `notFound()`. Não criar defaults com IDs fictícios ou período arbitrário.
4. Sessão via `auth.getUser`, sem erro, papel em `app_metadata` e `user.id` igual ao operador fixado. Recusar **antes da primeira consulta administrativa da página**; `user_metadata`, email, `getSession` não verificado e parâmetro enviado não concedem papel.
5. Só então consultar `manager_accounts` por `business_id` **e** `operator_profile_id` exatos, conferindo ambos no retorno. Depois consultar `businesses` por ID exato com `select("id, name, profile_id, dados_ficticios")`; exigir ID igual ao recorte, `dados_ficticios === true` e dono UUID válido. Essa ordem mantém atribuição antes da leitura privilegiada do negócio, como na porta. Falha/ausência/negócio real/atribuição divergente: 404, sem GET.
6. Passar apenas businessId validado, `name` do banco e datas fixadas para o `LeituraDaConta` existente. A porta repete sua própria autenticação/atribuição/dono e faz somente `obter`. Nenhuma mutação ou promoção de papel nessa rota.
7. Aviso externo permanente “Homologação QA — dados fictícios, sem campanha/veiculação comprovada”. Não redesenhar componente ou apresentar verde de desempenho. Consultar via URL explícita, não criar entrada na carteira.

**Produção versus build:** QA publicado também roda build `NODE_ENV=production`; negar apenas por esse nome bloquearia o próprio ensaio, enquanto aceitá-lo não identifica QA. Há precedente de padrão server-side em `webapp:lib/contratacao/ambiente-checkout.ts:21–26`, com `VERCEL_PROJECT_ID`/`VERCEL_PROJECT_PRODUCTION_URL` e URL canônica permitidos; `:34–44` mostra leitura de env, não de headers. O projeto QA já identificado nesse padrão é `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`. Adaptar o **padrão**, não chamar a função de checkout nem habilitar pagamento. Ambiente/projeto fora da allowlist deve continuar 404 **mesmo se flags e banco QA forem copiados por engano ao projeto do produto**. URL futura do backend continua desconhecida: sem ela, negar. Não foi criado nome de configuração nem valor de endpoint para preencher essa lacuna.

**Limite do 404 e das contagens:** o layout protegido já verifica sessão/acesso e pode redirecionar antes da página (`webapp:app/(protected)/layout.tsx:42–55`). Operador tem acesso ao app por regra atual em `lib/contratacao/acesso.ts:9`; isso não autoriza métricas sem atribuição. Preservar layout/proxy, sem bypass. O teste de página deve distinguir `notFound()` nos seus próprios gates de redirect do shell sem sessão; não prometer 404 HTTP para toda navegação anônima nem “zero consultas em todo o app”. Contagens zero abaixo referem-se ao admin/GET **da página/porta do ensaio**, não à verificação de sessão ou a consultas legítimas do layout.

### Matriz proposta para autorizar depois — não executada

| Caso futuro | Resultado esperado | Admin da página / GET do backend |
| --- | --- | --- |
| Qualquer uma das três flags ausente, false ou valor diferente de `"true"` | `notFound`; não renderiza dados | 0 / 0 |
| Projeto de produto com flags true e URLs QA, ou Host/Origin adulterado | Ambiente não autorizado; `notFound` | 0 / 0 |
| URL QA do banco incorreta, backend desconhecido, HTTP ou fora da allowlist | `notFound`, sem usar hostname nominal do painel | 0 / 0 |
| Recorte vazio/parcial/UUID inválido/data inválida ou invertida | `notFound`, sem fabricar fixture | 0 / 0 |
| Sessão ausente/expirada/com erro, cliente/agência ou papel só em `user_metadata` | Recusa da página; shell pode redirecionar antes | 0 / 0 |
| Operador real verificado, mas ID diferente do recorte fixado | `notFound` | 0 / 0 |
| Atribuição ausente, de outro operador ou erro de consulta | `notFound`; não lê negócio após atribuição recusada | Só consulta exata de atribuição / 0 |
| Negócio ausente, dono inválido, `dados_ficticios !== true` | `notFound`, sem mudar a linha | Consultas exatas autorizadas / 0 |
| Browser envia business/owner/operator/período alternativo | Ignorar ou recusar; nunca altera recorte | Nenhuma consulta ao alvo adulterado; se ignorado, somente alvo fixado autorizado |
| Todos os gates corretos; backend retorna contrato válido | Mesmo consumidor/DTO/componente, aviso QA, sem alteração da carteira | Consultas exatas e revalidação da porta / só GET autorizado |
| Backend 401/403/404/409/422/timeout/200 ilegível/DTO ausente | Mensagem normalizada atual, sem totais de fallback ou corpo cru | Só consulta previamente autorizada; nenhum novo GET de fallback |
| Resposta válida com decimal `"2.125"`, campos null, zero observado, sem dados ou origem inconsistente | Decimal preservado, null ≠ zero; inconsistência retira totais; sem inferir conversa/venda | Mesmo GET autorizado; nenhuma escrita |
| Atribuição revogada antes da revalidação da porta | Porta recusa; nenhum GET posterior à recusa | Revalidação necessária / 0 após revogação observada |

Testes futuros devem montar o componente de página real com dependências instrumentadas e contar chamadas, não só testar predicado ou expressão isolada. Incluir o layout no ensaio de navegação para distinguir redirects/404 e depois HTTPS sob autorização específica, com sessões atribuída e não atribuída. Revogação que aconteça **após** a última leitura de atribuição ainda é uma janela de concorrência do desenho atual, não proteção atômica comprovada por esta matriz. Nenhuma suíte, chamada ou fixture foi repetida para escrever este adendo.

### Fechamento desta passagem

Implementação mínima futura: um guard server-only de ambiente/recorte e uma página server-side isolada chamando os componentes atuais, mais testes direcionados da matriz. Sem fetch alternativo, alteração do filtro da carteira, CSS, grants, parser ou endpoint backend novo. Configuração, identidades/período e publicação continuam portões separados; não iniciar sem decisão explícita do recorte. A publicação do runtime QA com sua cerca precisa ser comprovada por 07/08, não inferida da disponibilidade de `/saude`.

**Entregue agora: confronto documental e recomendação condicional.** Apenas este adendo foi escrito; nenhuma implementação ou configuração nova. Sem mudanças de interface, provas remotas, consultas administrativas, segredos, produção ou comunicação a outros chats. Sem novo bloco: parar para revisão da Central/Victor.
