# N26-P3 / N26-03 — criativo pronto, fila atribuída e retorno — 04/11/2026

## 0. Resultado e dependências

**Fechado somente o recorte LOCAL autorizado:** corrigido o acesso à fila e à decisão quando a opção de tarefas está desligada; decisão passa a conferir a integridade da versão enviada. O percurso existente não foi recriado. **70 testes dirigidos passaram; `pnpm typecheck` passou.**

**Falta para o aceite N26-03:** publicar a versão revisada no QA, autorizar/identificar os atores e executar o percurso autenticado atual cliente → arquivo privado → fila do Cauã → decisão → novo login do mesmo cliente. Roteiro em `docs/qa/n26-p3-criativo-pronto-04-11/MATRIZ-QA.md`. Nenhum desses atos externos foi executado aqui.

**Depende de Victor/Central:** janela e recursos do ensaio, release QA e sessões próprias do cliente/Cauã. A autorização local não inclui criar usuário, conceder papel, atribuir conta real, subir arquivo externo, escrever na Meta ou publicar. O ensaio pode usar negócios sintéticos corretamente marcados; eles não aparecem na carteira principal, que os exclui. A rota específica de revisão é `/gestor/criativos`.

**Ordem vigente:** prioridade 3, após compra/acesso e leitura Meta. Geração, referências e cosmética ficam fora. Não há conclusão de produção ou passagem de cliente real.

## 1. Fontes e versão

- Regras relidas: `AGENTS.md`, `CLAUDE.md`, `docs/decisoes.md`, índice, contrato da mesa, checkpoints de envio e handoff de novembro. Working tree compartilhado conferido; outros chats têm alterações em andamento.
- [Plano de novembro](https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit), aba **Novembro — execução**, intervalo A1:N22, relido nesta rodada: **linha 4, N26-03**, meta 07/11, envio/armazenamento/fila Cauã/decisão; mesmo negócio e estado após novo login. Não editei a planilha. FigJam não foi relido nesta rodada; não houve escrita no quadro.
- `docs/handoffs/chat-supergestor-novembro-2026.md:24` registra a prioridade humana. Não foi confundido com comprovação de capacidade publicada.
- Histórico de 21/10: `docs/estado/e28-qa-publicado-e-ensaio-https-21-10.md`, **17 verificações reais HTTPS/Auth/Storage** com atores descartáveis posteriormente removidos. Prova histórica preservada; não foi repetida nem tomada como certificado atual por cliques.
- Metadados Vercel lidos em 04/11 BRT: alias `v2g-webapp-qa.vercel.app`, projeto **v2g-webapp-qa**, deployment **dpl_2XUw4sXQyG7jVxudZsvRVonaWqYC**, **READY**, commit **959e78ea4e528ed2caaed182d7b281b1ba26dc6f**. O `target: production` pertence ao projeto isolado de QA; não comprova produção do produto. Nenhum deploy/configuração foi alterado.
- HEAD local: mesmo SHA acima, **mais alterações não commitadas**, incluindo este bloco e trabalho de outras frentes. O QA citado não contém estas correções locais. Não há SHA de release nova.
- Documentação oficial consultada: [Auth getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [Storage download](https://supabase.com/docs/reference/javascript/storage-from-download) e [changelog](https://supabase.com/changelog). Nenhuma dependência/CLI/schema foi alterada. Conferência de consultas realizada com portas locais substituídas, sem banco externo.

## 2. FATO — o percurso já existente

| Elo | Evidência no código atual | Limite |
| --- | --- | --- |
| Cliente confirma objetivo/validade e envia imagem | `app/(protected)/criativos/revisao-actions.ts:40` valida sessão e negócio ativo; `:76` calcula SHA-256; `:104` grava autor/caminho/intenção; `:112` grava em `creative-review` | Novo envio vincula UUID + hash; replay não troca conteúdo/intenção. Isto é código, não upload atual em QA. |
| Tarefa acompanha a revisão | `lib/gestor/sincronizar-revisao.ts:10` reconcilia a tarefa determinística com negócio/autor/estado | Tarefa auxiliar não substitui a fila; pode falhar independentemente. Nenhuma notificação ao Cauã foi enviada/provada. |
| Fila mostra pendentes e histórico | `app/(protected)/gestor/criativos/page.tsx:55` consulta `creative_review_requests` | Agora sempre limitada à atribuição, independentemente da opção de tarefas. |
| Decisão retorna ao cliente | `app/(protected)/criativos/page.tsx:113` relê pedidos; `:123` filtra o negócio; `:174` apresenta `review_note` | Aprovação interna continua sem equivaler a publicação. Galeria e status já existiam; não foram redesenhados. |

## 3. Defeitos encontrados e correções

### A. Configuração de tarefas abria o escopo da revisão

**Antes:** com `V2G_MANAGER_WORK_ENABLED` diferente de `true`, a fila deixava de filtrar `manager_accounts` e a action pulava a conferência do responsável. Papel `operador` permitia revisão fora da própria carteira nesse modo.

**Agora:** página e action sempre exigem atribuição. A página consulta vínculos do usuário verificado, recusa erro/dados inválidos/truncamento e limita pendentes/histórico antes de assinar arquivos. Confere também o negócio/peça retornados. A action filtra e confere negócio + operador antes de baixar bytes. `getUser` com erro nega, mesmo que venha um objeto de usuário.

Evidências: `app/(protected)/gestor/criativos/page.tsx:38`, `:75`; `app/(protected)/gestor/criativos/actions.ts:18`, `:42`. A flag continua controlando a tarefa auxiliar; não concede carteira global. Sem atribuição/schema disponível, a revisão bloqueia em vez de expor tudo. Não foi alterado o perímetro amplo da carteira principal nem implementado papel de agência.

### B. Existência do arquivo não comprovava a versão decidida

**Antes:** a action conferia caminho e sucesso do download, mas não comparava os bytes com o SHA-256 registrado no envio.

**Agora:** lê explicitamente `sha256`, `size_bytes`, `mime_type`; verifica tamanho e limite, assinatura JPG/PNG e hash do download. Arquivo ausente/diferente ou metadados inconsistentes recusam todas as três decisões. O UPDATE mantém condição de pendência e inclui o hash lido; decisão posterior não sobrescreve a primeira. O retorno usa mensagens normalizadas.

Evidências: `app/(protected)/gestor/criativos/actions.ts:31`, `:51`, `:65`. Colunas já existem em `supabase/migrations/20261009034500_fila_revisao_criativos.sql:14`; **nenhuma migration nova**. Revalida também `/supergestor` após decisão (`actions.ts:80`).

**Limites mantidos:** conferência de atribuição e gravação não formam uma transação única com a tabela de responsáveis; transferência concorrente entre as operações não foi certificada. URLs privadas já emitidas conservam sua validade curta (fila 10 minutos; galeria 15); não foi implementada revogação imediata. Comparação de bytes ocorre na decisão, não a cada imagem desenhada na tela.

## 4. Prova local

Comando executado, sem `.env`, rede, provedor pago ou dados privados:

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-intencao-envio.mjs scripts/conferir-revisao-criativos.mjs scripts/conferir-percurso-criativo-pronto.mjs scripts/conferir-portas-gestor-interno.mjs scripts/conferir-tarefas-gestor.mjs
```

**70/70 passaram**, incluindo:

- Actions reais de envio/revisão, replay, falha parcial, simultaneidade simulada e promoção vencida.
- Operador diferente, sem atribuição, atribuição de outro negócio, consulta com falha, Auth com erro e papel só em metadado editável; tarefas ON/OFF; negação antes do download.
- Arquivo alterado com mesmo tamanho, tamanho divergente, hash ausente, MIME divergente e objeto ausente não registram decisão.
- Novo `scripts/conferir-percurso-criativo-pronto.mjs`: **11 testes** atravessam as actions e os carregadores reais das duas páginas com dois negócios sintéticos. Envio A/B → fila só de A → decisão → nova identidade de sessão fake → galeria de A com retorno; B preservado. Aprovar/ajustar/recusar não viram “no ar”. Resposta fora do filtro é negada antes da assinatura.
- `pnpm typecheck`: passou. `git diff --check`: passou; avisos LF/CRLF em arquivos concorrentes de contratação, sem edição por esta frente.

**O que o harness substitui:** Auth, seleção de negócio, RLS/DB, Storage/assinatura e sincronização da tarefa. A nova sessão é uma troca de identidade em memória, não logout/login HTTPS. A página de cliente real monta os itens; os formulários/componentes de apresentação são substituídos. Não certifica interação por cliques, cookies reais, tarefa remota, expiração efetiva, concorrência entre servidores nem produção.

## 5. Arquivos deste bloco e integridade

| Arquivo | SHA-256 após testes |
| --- | --- |
| `app/(protected)/gestor/criativos/actions.ts` | `f87f4eb33297f8ccb09af36df61c4f231a0041f024bbacdb5cb083fcf0de5b35` |
| `app/(protected)/gestor/criativos/page.tsx` | `854d824d199bf33b157ce7c9d49d8f8cae3112197decb5704349b8618246f6f9` |
| `scripts/conferir-intencao-envio.mjs` | `390aa89a55d4eed542e861997e91e629a477ce61838b09a41a5bbb3593b4ff6a` |
| `scripts/conferir-percurso-criativo-pronto.mjs` | `61099d418f4b11bcb79d6ba5674531e3707249e67c1567dbf710349e73810eda` |

Além destes quatro arquivos: este checkpoint, matriz QA e entrada no índice. Preservados o alinhamento de períodos/conta/moeda de Anúncios e mesa, checkout/acesso, onboarding, backend/API Meta e arquivos de outros chats. Não foram feitos commit, push, merge, deploy, build, reinício, migração, acesso real, upload externo, chamada paga ou comunicação com cliente. A planilha ficou somente leitura.

## 6. Próximo ato e dono

1. **Central/Victor:** revisar e publicar em QA uma versão identificável que contenha as correções; manter produção separada. Registrar versão e flags por nome/estado, sem valores secretos.
2. **05/06 + Cauã, após autorização do ensaio:** executar a matriz autenticada com o mesmo `business_id`, pedido e hash nas duas sessões; guardar provas redigidas e a versão exata. As 17 verificações de outubro continuam históricas.
3. **Central:** reconciliar N26-03 com o resultado observado. Aceite só depois de retorno visível ao cliente após novo login e controles A/B. O bloco local encerra aqui; sem emendar geração ou outra frente.
