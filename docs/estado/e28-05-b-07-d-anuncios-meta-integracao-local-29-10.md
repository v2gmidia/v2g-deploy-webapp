# E28-05-B / E28-07-D — `/anuncios` integrada à descoberta Meta, local — 29/10/2026

## §0. Entrega e menor portão

**A aba real `/anuncios` está ligada no código local à coleção do contrato `e28-meta-ads-read-v1`.** Descobre pela conta ativa vinculada ao negócio selecionado, sem exigir execução ou ID de campanha. Não é prova de anúncios reais visíveis no QA/produção.

Próximo portão: **Central/Victor autorizam publicação coordenada e ativação somente no QA**, seguindo o checkpoint do backend; depois um ensaio de leitura real com sessão QA, negócio/conta/período nomeados e negativos A/B. O 07/08 informou no checkpoint que a rota ainda não está no QA e a flag é default OFF. Esta frente não consultou/alterou o ambiente remoto para conferir ou mudar esse estado.

Não falta ID de campanha para o frontend. Não criar execução/vínculo artificial ou backfill para alimentar esta tela. `/inicio` permanece para outro bloco.

## Contrato conferido antes de implementar

Lidos integralmente:

- `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/docs/contratos/e28-meta-ads-read-v1.md`.
- `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/docs/estado/e28-07-descoberta-meta-sem-execucao-29-10.md`.

Coleção: `GET /negocios/{business_id}/meta/campanhas?desde=YYYY-MM-DD&ate=YYYY-MM-DD&conta_id=act_...`. `conta_id` é opcional no backend; o frontend o envia explicitamente depois de resolver exatamente uma conta autorizada. O GET usa **Bearer da sessão Supabase**, server-only e no-store, sem credencial Meta, service role, token de máquina ou `profile_id` na URL. Janela inclusiva de 1–31 dias. Retorna `campanhas → conjuntos → anuncios`; inventário e métricas são estados independentes.

Mudança importante contra o candidato do bloco anterior: a descoberta retorna **array `campanhas`**, e `entrega_observada_no_periodo` é true com gasto OU impressões positivos, false somente com ambos explicitamente zero. Parser e testes foram atualizados para esse contrato concluído. O parser de detalhe foi mantido como adaptação da mesma regra; a tela usa somente a coleção.

## Caminho e segurança implementados

1. `lib/backend/anuncios-do-negocio.ts:21`: obtém JWT no servidor e o valida com `auth.getUser(token)`. Resolve `negocioAtivoDaSessao`, reconfirma negócio e proprietário sob RLS (`:43`). **Não aceita business_id, perfil ou execução do formulário/URL.** Mantém o escopo já existente da aba de cliente: negócio próprio liberado/selecionado pelo app. A visão de operadores atribuídos a negócios de terceiros é responsabilidade da mesa do gestor, não uma ampliação implícita deste seletor de cliente.
2. `:47`: lê explicitamente `business_id, external_id, is_active, status` de `ad_accounts` sob o mesmo negócio. Confere linha por linha, estado ativo/ok e duplicidade. Sem conta, informa falta do vínculo; não afirma que não existem anúncios na Meta. Uma conta é selecionada automaticamente. Múltiplas exigem escolha; conta adulterada/inativa/de outro negócio é negada antes do HTTP.
3. `lib/backend/cliente.ts:220`: novo GET dedicado `obterAnunciosComSessao`. Reusa timeout/no-store/normalização de transporte, mas **não exige nem envia `X-V2G-Token`** neste caminho. JWT só em Authorization. Chamadas legadas continuam com a credencial de máquina existente. Não há retry/polling automático.
4. `lib/anuncios/contrato-meta.ts`: confere versão, fonte, negócio/conta/período esperados e árvore inteira; recusa filhos/IDs divergentes, duplicação, valor/data inválidos, moeda desconhecida com gasto e estados contraditórios. Nenhum valor ausente vira zero; não soma campanha/conjunto/anúncio, nem inventa moeda/fuso/conversa.
5. `app/(protected)/anuncios/page.tsx:102`: leitura nova e legado independentes em paralelo. O estado `sem-execucao` já não manda o cliente para “seu primeiro anúncio ainda não existe”; a coleção é renderizada também nesse caso (`:126`). A leitura legada existente permanece (`:193`) como **histórico do negócio sem filtro por conta**, explicitamente separado e sem soma com a nova consulta.
6. `AnunciosMeta.tsx:19`: apresenta coleção, seleção por GET com período preservado, vazio consultado, falhas normalizadas e estados por objeto. Status ACTIVE é “Ativado na Meta”, nunca prova de “no ar”. Conversas atuais do backend ficam “Não medido”. Sem métricas, campanha/conjunto/anúncio continuam visíveis. Erros não expõem resposta/stack remota; 424 pede conferência da integração V2G, não papel Meta do cliente.

## Arquivos deste delta

| Arquivo | Mudança |
|---|---|
| `app/(protected)/anuncios/page.tsx` | Liga coleção, preserva legado e remove o falso vazio causado por falta de execução. Sem alterar `/inicio`. |
| `app/(protected)/anuncios/AnunciosMeta.tsx` | Componente de coleção e seletor de contas; componentes de campanha/fonte compartilhados com a bancada anterior. |
| `app/(protected)/anuncios/anuncios-meta.module.css` | Seletor responsivo com tokens e foco; visual da família preservado. |
| `lib/anuncios/contrato-meta.ts` | Parser final de descoberta e correção da semântica de entrega; detalhe preservado. |
| `lib/backend/anuncios-do-negocio.ts` | Novo carregador de sessão/negócio/conta e normalização local de erros. |
| `lib/backend/cliente.ts`, `index.ts` | Transporte GET humano dedicado e export do carregador; transporte legado preservado. |
| `scripts/conferir-anuncios-meta-integracao.mjs` | 37 testes offline de Auth/RLS/HTTP/contrato/tela real. |
| `scripts/conferir-anuncios-meta.mjs` | 28 testes de parser/renderização, atualizados para a semântica final. |
| `scripts/conferir-campanha-da-sessao.ts` | A trava estrutural aceita a seleção de conta autorizada de 29/10 e continua vedando identidade/execução da URL no legado. |
| `scripts/previa-anuncios-meta.mjs` | `--integracao` adiciona bancada isolada em loopback 3193, com dados fictícios e sem APIs reais. A bancada anterior não foi substituída. |
| `docs/qa/anuncios-meta-integracao-29-10/` | HTML e capturas da interface nova: **fictícios**, sem login/Meta real. |

Os arquivos ainda não rastreados da preparação anterior foram preservados. Nenhum arquivo Python/backend, configuração, migration ou página de outra frente foi editado.

## Verificação executada

- **65 testes focados passaram:** 28 parser/renderização + 37 integração. O carregador e o transporte reais foram exercitados com Auth/seleção/RLS/fetch substituídos, incluindo:
  - cliente comum sem papel Meta; JWT validado; negócio A e B com suas próprias contas;
  - entrada injetada de negócio/perfil/execução ignorada; proprietário diferente, seleção inválida, conta estrangeira/inativa/duplicada e erro RLS bloqueados antes do HTTP;
  - uma conta, múltiplas sem escolha, segunda conta escolhida e seleção adulterada;
  - 401/403/404/409/422/424/502/503, rede, JSON ilegível e configuração ausente; sem detalhe cru nem números aproveitados do erro;
  - coleção vazia/múltipla, inventário sem insights e zero observado atravessando HTTP → parser → UI, sem zerar conversas desconhecidas;
  - `/anuncios` real renderizada sem execução e fallback legado identificado como histórico;
  - só Bearer humano no novo GET, sem token de máquina mesmo se a variável existe; transporte legado mantém seu header/no-store; segredos fora de URL/resultado/HTML.
- **`pnpm typecheck` passou** depois da ligação e da refatoração TSX.
- Regressões direcionadas passaram: `conferir-campanha-da-sessao` **17/17**, `conferir-resultado` verde, `conferir-veiculacao` **117 conferências**, `conferir-qa-interface` **7/7**. Nenhum teste do backend foi contado como execução desta frente.
- Inspeção visual desktop **1280 × 1000** e mobile **390 × 844**: sem overflow horizontal; grade 4 → 2 colunas. Escolha/submit de segunda conta testados na bancada; URL contém somente período/conta e a seleção se mantém. Vazio consultado conferido separado de falha. Capturas `desktop.jpg`, `mobile.jpg` no diretório novo de QA local.
- Revisão React: sem hooks/efeitos de polling adicionados; componentes de leitura ficam no servidor, JWT não vai a props; dependências paralelas, estado mutável limitado à chamada, chaves por ID e controles nativos rotulados. CSS existente e `Pill` reutilizados.
- `git diff --check` limpo. Busca por IDs nominais V2G sem ocorrência nos módulos novos de runtime. Sem build/reinício do Next.

## Limites e próximo ato

**Conexão local concluída; QA autenticado e produção não comprovados.** As provas de navegador são da bancada marcada “DADOS FICTÍCIOS”; o teste da página real usa serviços substituídos. Não houve login real, consulta Meta, leitura/escrita QA, mudança de flag/credencial, commit, push ou deploy.

Publicar/ativar o backend QA e o WebApp exige o ato autorizado da Central/Victor; depois comprovar uma leitura real da conta autorizada com o JWT do dono e controle negativo de outro negócio. O último relato de campanha “Preparando” não foi atualizado por estes testes. Taxonomia de conversas continua pendente no backend; não converter clique/lead/mensagem geral em conversa.

Rollback local: retirar a chamada/renderização de inventário do `/anuncios` e o export novo; o carregador legado não foi alterado. Recuo externo/flags só por ato autorizado. Nenhum dado ou objeto Meta precisa ser desfeito por este bloco.
