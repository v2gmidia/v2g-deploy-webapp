# E28 — etapa 5: ligação local ao dispatcher real — 26/10/2026

**Entregue neste bloco:** WebApp consome o contrato durável real final de 07/08, preserva pedido/retomada/arquivo/biblioteca e distingue resultado real de simulação. O adaptador de contexto exige identidade + referência Pinterest + anúncio do nicho, com origem, direitos e versão. **Não houve imagem criada por IA nesta rodada.** A execução ponta a ponta foi testada com o dispatcher real e o provider explicitamente substituído por função de pixels/contador, sem rede paga. A fonte persistente do contexto, a identidade humana e o ambiente de execução ainda não estão ligados no app.

## 0. O que falta, dono e menor prova

| Pendência concreta | Dono | Próxima prova necessária |
|---|---|---|
| Fonte persistente confiável dos MDs, três materiais e autorizações por negócio/pedido/hash | 05/06 + curadoria/Victor; composição Python em coordenação com 07/08 | Loader real preenchido pela porta `DependenciasGeracao.criar_contexto(sql, profile_id)`, retornando `ContextoAprovado` só para o pedido autorizado e `None` nos demais. Hoje o loader padrão continua `None`. O montador novo não é esse loader. |
| Identidade humana verificável do servidor entre WebApp e backend | 05/06 + 07/08, contrato conjunto | `verificar_identidade(Request)` reconhece sessão autêntica e recusa outra pessoa/negócio. `getUser`, `profile_id` e token entre máquinas não completam essa ponte sozinhos. Nenhum header fictício foi promovido a autenticação, nem protocolo JWT novo foi inventado neste bloco. |
| Ambiente gravável isolado para geração: schema/outbox, bucket e executor | Central + 07/08, sob autorizações específicas | Aplicação nominal das propostas de geração, bucket privado correspondente, factory/serviço e tick separados do HTTP. A proposta real não é unidade 2 de métricas. A factory continua laboratório local, sem entrypoint global publicado. |
| Prova autenticada em app → fila → worker → Storage → biblioteca do dono | 05/06 + 07/08 + Central | Mesmo pedido em reload/concorrência, resultado recuperável, outro negócio negado. Os testes locais com portas substituídas não dão esse aceite. |
| Piloto pago nominal de **uma imagem**, negócio fictício e materiais admissíveis, provedor e teto aprovados | Victor, após pacote técnico/material revisável | Autorização própria do piloto + uma chamada medida e procedimento para resultado/cobrança incertos. Saldo antigo do Jev ou sinal verde para programar não aprovam esse gasto. |

**Não falta somente ligar uma flag ou depositar saldo.** Para o piloto no app, fechar primeiro fonte/identidade/ambiente e apresentar um único pacote: negócio fictício + pedido, logo e duas referências autorizadas + versões dos MDs, provedor/configuração, exatamente uma imagem, teto e procedimento de reconciliação. A aprovação humana desse pacote é o último portão financeiro, não substitui os demais. Não se pediu aprovação repetida ao Victor nesta rodada.

## Fontes e precedência nesta rodada

- Repositório WebApp iniciou limpo. AGENTS/CLAUDE, decisões, índice e checkpoints 25/10 relidos; memória usada somente para preservar a diferença entre teste local e prova autenticada.
- A leitura inicial encontrou o adaptador real de 25/10 executando dentro do POST. **Isso foi superado durante o trabalho** pela entrega final de 07/08: `backend_v2g/docs/estado/e28-07-08-qa-readiness-dispatcher-local-26-10.md`, seção “Delta local”. A conclusão abaixo já usa essa entrega final; não registrar despacho síncrono como pendência atual.
- Contratos finais conferidos em `src/api/geracao_dispatcher_real.py`, `src/api/geracao_app.py` e `src/imagem/geracao_contrato.py`. Nenhum arquivo desses foi editado por este chat. A porta de contexto nova está em `DependenciasGeracao.criar_contexto`; o loader padrão `src/imagem/geracao_contexto_existente.py:65` continua negando por falta de fontes aprovadas.
- O diagnóstico de QA 502/schema do documento de 07/08 **não foi repetido nem medido independentemente neste chat**. Homologação/QA2ad1785 foram informados pela Central; não são prova de que este código local esteja publicado.

## Implementação concreta no WebApp

| Arquivo | Entrega e proteção |
|---|---|
| `lib/criativos/geracao/contrato-fila.ts:24` | Parser do `creative-generation-queue-v1` real: `simulated=false`, origem `gpt-image-2`, custo `null`, decimais exatos, IDs/chave idempotente, hash, autoria, PNG 1088×1088. Reconciliação real é terminal sem polling; contrato fake conserva sua regra própria. Não mistura fake com real. |
| `lib/criativos/geracao/configuracao-app.ts:6` | Modo default **real_leitura**, que não submete. `fila_ficticia` exige seleção explícita no harness. `real_dispatch` só permite submissão com o segundo portão `V2G_CREATIVE_REAL_SUBMISSION_ENABLED=true`. Nenhuma variável real foi configurada. |
| `lib/criativos/geracao/backend-da-sessao.ts:81` | Submeter ao contrato durável novo, consultar/reconciliar os mesmos IDs, sem worker no clique e sem aumentar timeout. POST real exige envelope durável real; DTO síncrono antigo continua apenas legível. Cancelamento real permanece bloqueado, pois o backend não o oferece. Usa o cliente HTTP e as verificações de sessão/negócio existentes. |
| `app/(protected)/criativos/geracao-actions.ts:39` | Projeta apenas andamento/identificadores e leitura privada; backend informa zero? Não presumir: custo e hashes não vão à tela, `billed_usd=null` continua desconhecido. Criação real só aparece após permissão explícita do servidor, sem aceitar modo/limite/provedor pelo formulário. |
| `app/(protected)/criativos/AndamentoDaImagem.tsx` | Resultado real diz “Imagem criada” e usa alt verdadeiro; resultado fictício conserva sua identificação. Não oferece cancelamento real nem refação/retry pago. Consulta de reconciliação não abre outra tentativa. Simulação explícita do componente permanece compatível com a bancada; um veto do servidor prevalece. |
| `lib/criativos/geracao/imagem-privada.ts` | A mesma leitura privada passa a aceitar saída real validada; relê autoria no pedido pela sessão, metadados, simulação coerente, caminho canônico, bucket privado, bytes/hash/dimensões. Se o envelope traz autoria, também deve coincidir. Sem URL pública, novo acervo ou relaxamento de direito. |
| `lib/criativos/geracao/triangulo-contexto.ts:65` | Montador puro, somente servidor, de entrada compatível com o `ContextoAprovado` existente. Não lê arquivos/segredos, não coleta nem chama modelos; não grava aprovações ou reserva dinheiro. O resultado foi validado pelo modelo Pydantic real do backend, offline. |

### Modos/configurações: código preparado, nada habilitado

- `V2G_CREATIVE_REQUESTS_ENABLED` e `V2G_CREATIVE_BACKEND_ENABLED` continuam necessárias e default OFF.
- `V2G_CREATIVE_APP_MODE` ausente/desconhecido → `real_leitura`: GETs permitidos sob sessão, submissão/cancelamento bloqueados antes de HTTP.
- `fila_ficticia` → contrato fake estrito. Somente o objeto de ambiente dos testes recebeu esse valor explicitamente; nenhum `.env` foi lido/editado.
- `real_dispatch` **e** `V2G_CREATIVE_REAL_SUBMISSION_ENABLED=true` → código preparado para POST 202 ao dispatcher final. Esses valores foram usados somente no ambiente isolado dos testes, não no dev/QA/produção. Ainda dependem do piloto e da implantação corretos.
- Uma flag não é prova de consentimento, autoria, limite ou preço. O backend precisa carregar o contexto aprovado e aplicar suas travas; o WebApp não cria autorização pela UI.

## Triângulo de contexto e fontes honestas

O montador exige exatamente três materiais distintos, dentro do mesmo negócio:

1. **Identidade do cliente:** logo próprio, cores confirmadas e origem datada. Cadastro/upload não implica permissão de enviar à IA.
2. **Pinterest:** uma referência de imagem, fonte HTTPS canônica, nicho exato, revisão e condição de uso.
3. **Anúncio do nicho:** outra referência de imagem, origem da Biblioteca, nicho confirmado e os mesmos registros de revisão/direito. Anúncio ativo não comprova conversão/venda.

Para cada material, autorização nominal liga negócio + pedido + material + hash + finalidade + destino + revisor/data. IDs e hashes duplicados não contam como fontes independentes. Origem, versão e aprovação são preservadas no campo `fonte` do manifesto como JSON canônico, sem acrescentar campos incompatíveis ao contrato Pydantic. O snapshot durável existente preservará esse conteúdo quando o loader real for conectado.

Os MDs central/nicho precisam de conteúdo, versão, revisão, escopo e hashes. Não há fallback para nicho vizinho nem texto genérico criado por este chat. O pedido é conferido pelo hash e autor; prazo promocional é inclusivo em São Paulo. Foto de fachada continua fora deste recorte (`usar_fachada=false`); não se inventa a fachada de ninguém.

Orçamento é comparado em decimal exato, sem float/expoente/conversão de moeda: estimativa positiva ≤ reserva ≤ limite, vinculados ao pedido e a um piloto nominal de uma imagem. Os números `1e-18` representados como strings decimais nos testes são **fixtures de precisão**, não preço/estimativa real.

**O que não existe/provou aqui:** catálogo persistente de referências autorizadas, integração de coleta Pinterest/Biblioteca, scraping liberado, aprovação real de material, provider escolhido por custo medido ou conexão do Jev como coletor. O montador verifica coerência de uma entrada confiável de servidor; não comprova a veracidade/direito de um link por olhar sua URL. A origem persistente e a revisão continuam necessárias, e o backend revalida os bytes/materiais antes de executar.

## Provas executadas — somente locais, sem API paga

| Teste | Resultado |
|---|---|
| `conferir-dispatch-real-webapp-local.mjs` | **5 passaram**: action → POST 202 → outbox real → tick explícito → provider **substituído** → arquivo privado/biblioteca; default OFF, GET sem gerar, replay/concorrência/resposta perdida/reinício, reconciliação terminal e escopo/cancelamento. |
| `conferir-geracao-real-leitura-local.mjs` | **9 passaram**: DTO real anterior pelo serializer backend real, leitura/projeção/arquivo/autoria/hash, indisponibilidade, precisão e ausência de POST automático. Compatibilidade de leitura, não publicação/geração paga. |
| `conferir-triangulo-contexto-real.mjs` | **7 passaram**: preservação das três fontes/autorizações/versão, modelo Pydantic real offline, omissão/troca de nicho/dono/hash/link/duplicidade negadas, piloto/decimal e prazo São Paulo. |
| `conferir-andamento-real-ui.mjs` | **5 passaram**: render da UI real com estados fixados, texto/alt de resultado real, portão de início, ausência de cancelamento/retry indevidos e simulação explícita. Efeitos/portas substituídos; não é navegador autenticado. |
| `conferir-contrato-fila-geracao.mjs` | **4 passaram**, contrato fictício preservado. |
| `conferir-biblioteca-geracao-off.mjs` | **3 passaram**, biblioteca/listagem real e erro honesto preservados. |
| `conferir-ui-fila-geracao-local.mjs` | **11 passaram**, regressão proporcional após mudar action/parser/harness compartilhados; não repetida a inspeção de bancada verde. |
| `pnpm typecheck` + `git diff --check` | Passaram; somente avisos LF/CRLF no diff. |

**44 testes únicos** nos arquivos acima, mais tipos/whitespace. Não somar as execuções de reparo como testes extras; não somar a ampla 2884/9 relatada por 07/08. Não houve build junto do dev, teste amplo repetido, novo pacote ou novo ensaio visual da bancada/homologação.

### O que o teste integrado novo executou realmente

Reutilizou o harness de 07/08 com `V2G_TEST_REAL_DISPATCH=1`, factory/API FastAPI, dispatcher real novo, SQL/outbox/staging/finalização, PostgreSQL PGlite descartável, codecs e Storage instrumentado. A porta do provider foi substituída pela função pura/contador SQL já existente no harness de 07/08: **não OpenAI, não ferramenta de imagem do Codex, não imagem por IA**. Cabeçalho de sessão fictícia existe só no transporte do teste. O ambiente do processo Python foi limitado a variáveis do ensaio/sistema, sem herdar credenciais de provedor.

- Antes do tick: zero chamadas ao provider substituído, mesmo com GET/replay.
- Depois do tick: uma chamada instrumentada, um job/outbox/arquivo, simulação de protocolo `simulated=false`, fatura **NULL**; a fixture de pixels não é evidência de qualidade de IA.
- Concorrência/resposta perdida/reinício: mesmos request/job, sem segunda chamada ao provider substituído.
- Timeout do provider substituído: `reconciliation_required`, intervalo nulo, nova consulta/replay não geram outra imagem.
- PGlite serializa transações. Não se mediram dois servidores Postgres, crash físico/fsync, API externa, faturamento ou identidade humana.

O modo `simulated=false` desses testes exercita o **protocolo real**, com dados/bytes fictícios explicitamente declarados. Não transformar isso em afirmação de que o agente já criou uma imagem para cliente ou de que custa zero.

## Arquivos e parada

Alterados: `app/(protected)/criativos/{AndamentoDaImagem,PedidoDeImagem}.tsx`, `geracao-actions.ts`; `lib/criativos/geracao/{contrato-fila,backend-da-sessao,imagem-privada}.ts`; `scripts/test-utils/fila-geracao-local.mjs`.

Novos: `lib/criativos/geracao/{configuracao-app,triangulo-contexto}.ts`; `scripts/{conferir-geracao-real-leitura-local,conferir-triangulo-contexto-real,conferir-andamento-real-ui,conferir-dispatch-real-webapp-local}.mjs`; este checkpoint.

Nenhum arquivo de homologação/`carregar-homologacao`/page da homologação, `package.json`, índice ou decisões foi editado. O documento `e28-central-etapas-2-5-26-10.md` apareceu de outra frente e foi preservado. Nenhum arquivo backend foi escrito; a entrega final de 07/08 foi incorporada por leitura/testes. Sem commit/push/merge/deploy, migration externa, ambiente/painel, convite, e-mail, Meta, Jev/gerador pago ou chamada a ferramenta de imagem do Codex. **Bloco fechado; parar antes de implantar/autorizar o piloto.**
