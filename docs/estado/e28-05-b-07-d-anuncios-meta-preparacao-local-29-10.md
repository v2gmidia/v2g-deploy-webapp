# E28-05-B / E28-07-D — Anúncios Meta: preparação local — 29/10/2026

## §0. Menor próximo passo / dependência

> RESOLVIDO em 29/10/2026: contrato final entregue pelo 07/08 e ligação local feita em `e28-05-b-07-d-anuncios-meta-integracao-local-29-10.md`. O registro abaixo preserva o estado da preparação; QA/produção continuam pendentes no checkpoint novo.

**Ainda não conectado à rota real `/anuncios`.** O 07/08 está construindo a leitura de campanha manual; na última consulta desta rodada não havia checkpoint/contrato final desse bloco no backend. Encerrar a parte independente, conforme escopo recebido, sem inventar descoberta de campanha ou endpoint.

Próximo dono técnico: 07/08 entrega contrato estável e sua prova local. Depois esta frente reconfirma a forma exata, liga o carregador autenticado ao negócio selecionado e testa acesso/período/resposta. A fonte do ID da campanha precisa ser definida: a rota em construção exige um ID, não lista todas as campanhas. **Não gravar o ID da V2G globalmente e não usar `campaigns`, que é tabela morta.**

Após isso, falta QA autenticado e configuração/publicação coordenadas autorizadas. **Nenhuma decisão de Victor é necessária para revisar os arquivos locais deste bloco.** Não ativar flags para transformar esta preparação em prova real.

## Mapeamento factual

- `app/(protected)/anuncios/page.tsx:96`: chama `resultadoDoNegocio` com negócio do estado/sessão e perfil autenticado. Em `:106`, `sem-execucao` cai no vazio; em `:119`, cada item da lista nasce de uma execução. Logo uma campanha manual sem execução não entra nessa lista atual.
- `lib/resultado/do-negocio.ts:149`: primeiro consulta consolidado do negócio autorizado. Em `:162`, a lista é `porExecucao`; em `:180`, lê ficha e consolidado de cada execução. Essa segurança não deve ser retirada para encaixar campanha manual.
- `lib/backend/cliente.ts`: transporte é server-only, com cache `no-store`, normalização de erros e opção `tokenDaSessao`. Não foi modificado.
- Fonte backend inspecionada somente para mapeamento: `src/api/anuncios_leitura.py`, `src/api/anuncios_leitura_policy.py`, `src/db/acesso_anuncios.py`, `src/meta/leitura_anuncios.py`. A rota em construção é por negócio e ID de campanha, usa Bearer validado e conta ativa vinculada, e distingue status configurado/efetivo das métricas. Modelo em construção: `e28-meta-ads-read-v1`. **Código observado não equivale a contrato final, deploy, flag ligada ou medição real.**

IDs reais recebidos para um futuro teste nominal: conta `act_2818009911919726`, negócio QA `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, campanha `120252216516550234`. Não foram inseridos no runtime; não foram consultados nesta rodada. “Preparando” foi o último relato recebido; não é leitura nova desta frente.

## Arquivos criados — parte independente

| Arquivo | Entrega |
|---|---|
| `lib/anuncios/contrato-meta.ts` | Modelo de tela e parser **candidato local** do modelo em construção. Exige negócio/conta/campanha/período esperados, recusa árvore divergente ou ID duplicado, preserva null/zero, moeda e parcial. Revalidar contra o contrato final antes de ligar. Sem conta fixa, sessão, rede ou fallback. |
| `app/(protected)/anuncios/AnunciosMeta.tsx` | Componente pronto para receber resultado validado: campanha → conjuntos expansíveis → anúncios, nome/ID, período/fonte/fuso, status efetivo/configurado, gasto, impressões, cliques e conversas apenas quando presentes. Erro não usa caminho de vazio/zero. Reusa `Pill` e rótulo de período existentes. |
| `app/(protected)/anuncios/anuncios-meta.module.css` | Estilos limitados ao novo componente, com tokens existentes; quatro colunas desktop/duas mobile, quebra de IDs/nomes longos e disclosure nativo. |
| `scripts/conferir-anuncios-meta.mjs` | Conferidor offline de parser/identidade/estados/renderização. Dados explicitamente fictícios. |
| `scripts/previa-anuncios-meta.mjs` | Bancada SSR estática do componente real, CSS existente, sem abrir o app, sessão ou APIs; allowlist somente em loopback `127.0.0.1:3192`. Aviso ostensivo de dados fictícios. |
| `docs/qa/anuncios-meta-29-10/` | HTML da bancada e capturas desktop/mobile. São provas visuais de fixture local, não anúncios reais nem sessão autenticada. |

**Arquivos de runtime existentes preservados:** `/anuncios/page.tsx`, `PainelDeAnuncios`, `resultado/do-negocio.ts`, todo `lib/backend`, backend Python e configurações. Sem mudanças alheias sobrescritas.

## Verificação desta rodada

- **28/28 testes locais passaram.** Campanha sem execução; zero medido vs não medido; medição parcial; versão/origem divergentes; moeda/valores/datas inválidos; negócio/conta/campanha/conjunto/anúncio trocados; IDs duplicados; renderização de hierarquia; escape de nomes; status desconhecido; erro fora do caminho de zero. Esses controles protegem o parser; **não comprovam isolamento de sessão/backend ponta a ponta**.
- **`pnpm typecheck` passou.** Sem erro TypeScript. Não houve build nem alteração/reinício do Next.
- Conferência visual em **1280 × 1000** e **390 × 844**, sem overflow horizontal. A grade passou de quatro para duas colunas. Expandir/recolher conjunto funcionou no navegador. Capturas em `docs/qa/anuncios-meta-29-10/desktop.jpg` e `mobile.jpg`.
- Primeiro ensaio da bancada ocupou a coluna lateral do Casco; corrigido **somente no invólucro da bancada** com `grid-column: 1/-1`. Confirmação desktop/mobile concluída. O erro inicial do harness JSX foi corrigido para usar o runtime React real; não foi atribuído ao componente de produção.
- `git diff --check` sem erro de whitespace. Sem repetição de suítes históricas verdes.

## Critérios e limites

Status `ACTIVE` é apresentado como “Ativado na Meta”, jamais como “no ar”. `IN_PROCESS` é “Preparando”. Entrega observada histórica não vira situação atual; não se copiam os números da campanha para conjuntos/anúncios, nem se somam os três níveis. Sem moeda, não se inventa R$. Conversas não confirmadas permanecem “Não medido”. Nenhum resultado de fixture é tratado como dado do cliente.

O cliente não precisa papel Meta: a futura consulta deve ser autenticada no app, autorizada pelo vínculo do negócio e realizada pelo backend. Esta frente ainda não testou isso autenticada e **não implementou exigência de operador/Meta no componente**.

Sem rede para Meta/QA, escrita no banco, migração, flags/credenciais, chamadas pagas, publicação, commit, push ou deploy. Bloco encerrado na dependência prevista; a aba real permanece como estava até contrato final e integração autorizada.
