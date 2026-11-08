# N26-P2 — coerência da medição Meta e retorno do login — 05/11/2026

## 0. Resultado e próximo portão

**Concluído somente o bloco LOCAL aprovado por Victor no Central:** parser recusa medição declarada completa com cobertura/fuso insuficientes; Anúncios e mesa preservam conta, período e destino no login normal. **130/130 testes dirigidos passaram; `pnpm typecheck` passou.**

Não houve publicação, ativação, autenticação real ou consulta externa. Estes ajustes não publicam a rota ausente no backend QA nem comprovam números da campanha V2G. Victor seguirá os portões de ambiente/leitura no chat responsável. Google Ads aguarda o contrato definitivo do 07/08; nenhum endpoint, tela ou número Google foi inventado. Criativos não foram tocados.

**Entrega revisável:** [diff do recorte](../qa/n26-p2-meta-guardas-retorno-05-11/alteracoes-locais.patch) e [manifesto de dez arquivos/hashes](../qa/n26-p2-meta-guardas-retorno-05-11/arquivos-e-hashes.json). São evidência local, não pacote implantado. O diff exclui alterações concorrentes de contratação e decisões.

## 1. Autorização, fontes e versões

- Mapeamento somente leitura apresentado primeiro. Central transmitiu a resposta de Victor **“Faça isso, o resto vou seguir com eles”**, nomeando os dois defeitos, testes A/B e parada ao final. Não foi deduzida autorização externa dessa resposta.
- Regras e decisões do repositório relidas; contrato vigente `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/docs/contratos/e28-meta-ads-read-v1.md`; implementação de cobertura/fuso em `src/meta/leitura_anuncios.py:248` consultada somente para comparação. Nenhum arquivo do backend foi editado.
- Fonte de integração: `docs/estado/e28-05-b-07-d-anuncios-meta-integracao-local-29-10.md`; prontidão/backend: `docs/estado/n26-p2-publicacao-qa-leitura-meta-04-11.md` no backend. Não repetir suas provas históricas como leitura atual desta rodada.

| Camada | Evidência que se pode afirmar |
| --- | --- |
| Código local WebApp | HEAD **`cb87775b29d2b8710586a83ca3144ff6a7777815` + diff deste bloco**, ainda não commitado/publicado por esta frente. |
| WebApp QA publicado | **`959e78ea4e528ed2caaed182d7b281b1ba26dc6f`**, última confirmação da Central em 05/11 e metadados históricos de 04/11. Não consultei Vercel nesta rodada. Não inclui este diff. |
| Backend QA | Última reconferência da Central em 05/11: **`544f72341949`**, sem as novas rotas Meta. Não consultei saúde/OpenAPI remotamente nesta rodada. Fingerprint não é SHA Git. |
| Leitura real comparada com Meta | **NÃO COMPROVADA por este bloco.** Nenhuma sessão/conta/insight real foi consultado. |

## 2. Defeito de medição: reproduzido e corrigido

**FATO antes da correção:** reprodução local mostrou `zero_medido` aceito para um período de dois dias com apenas um dia devolvido; o mesmo estado era aceito com fuso null. A resposta do backend e o contrato exigem `parcial` nesses casos. O parser também aceitava `observado` com essas lacunas.

Foram acrescentados testes antes de mudar o runtime: **oito testes falharam**, cobrindo cobertura incompleta e fuso null/vazio/inválido para ambos os estados. Depois da correção, todos passaram.

**Agora:** `lib/anuncios/contrato-meta.ts:76` calcula a quantidade inclusiva de dias e confirma o fuso; `:99` exige cobertura completa/fuso válido para `zero_medido` e `observado`. A lista já valida datas únicas e dentro do intervalo. A ordem dos dias não importa. Fuso válido diferente de Brasília continua aceito.

Uma resposta contraditória é recusada como lote inconsistente; a tela não transforma ausência em zero nem inventa `parcial` para salvar números inválidos. Uma resposta corretamente declarada `parcial` preserva seus valores medidos/null, inclusive zero parcial com fuso desconhecido. `sem_dados`, vazio consultado e falha continuam distintos. Não foi criada regra de expiração/frescor arbitrária.

## 3. Defeito de retorno: conta, período e mesa

**Antes:** o link “Entrar novamente” sempre usava `next=/anuncios`; o proxy colocava somente `pathname` no `next`, deixando datas/conta fora do destino que a página de login utiliza.

**Agora:**

- `lib/anuncios/retorno-login.ts:2`: helper puro limita destinos a `/anuncios`, `/supergestor`, `/gestor` e parâmetros a `desde`, `ate`, `conta`; na mesa, também `metricas`. Descarta token/identidade declarada/next externos. Parâmetros repetidos ou inválidos não são silenciosamente escolhidos: seguem para os validadores existentes.
- `proxy.ts:174`: sem sessão, guarda o recorte dentro de `next` para essas três rotas. Outros destinos, concessão de acesso, papel e cópia dos cookies renovados permanecem com as regras anteriores.
- `app/(protected)/anuncios/AnunciosMeta.tsx:42`: a recuperação usa a rota certa. Reusa `adicionar=1`, modo de login explícito já existente, para abrir o formulário mesmo se o navegador ainda conservar uma sessão que o backend rejeitou. Isso não concede acesso ou papel.
- `app/(protected)/anuncios/page.tsx:78` e `components/gestor/leitura/LeituraDaConta.tsx:17`: repassam a conta solicitada mesmo quando a falha de Auth acontece antes de carregar os vínculos. Não foi alterado o carregador de autorização; retorno não equivale a permissão.
- O script de prévia recebeu somente a dependência do helper/`URLSearchParams`, para continuar compilando o componente compartilhado. Não foi iniciado, nem reescreveu capturas históricas.

**Limite explícito:** o retorno tratado é o proxy normal e o link da leitura. Os layouts que negam uma sessão entre duas requisições continuam com seus redirects próprios; não houve novo mecanismo de cabeçalho/estado para capturar query em layout. Troca de usuário ou seleção de negócio continua sujeita à nova validação da conta; não restaura seleção de outro dono por URL.

## 4. Testes, diff e revisão

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-anuncios-meta.mjs scripts/conferir-anuncios-meta-integracao.mjs scripts/conferir-retorno-leitura-meta.mjs scripts/conferir-recuperacao-completa.mjs scripts/conferir-acesso.mjs
```

**130 passes, zero falhas/skips** na execução final. Inclui:

- Negócios A/B, conta adulterada/inativa/duplicada, sessão inválida e operador sem atribuição: negados antes da consulta à fonte quando cabível.
- Zero completo, sem dados, parcial e erros normalizados; resposta 200 contraditória não fornece números para a tela. Preservação de moeda diferente de BRL e hierarquia sem somar níveis.
- Link real da tela e componente real da mesa conservam conta/datas/negócio de gestor mesmo sem inventário carregado.
- Proxy → página de login → action reais, com portas de Auth/acesso substituídas: destino e recorte conservados para as três rotas; cookie renovado copiado; usuário sem papel/direito comercial continua negado.
- Destinos externos recusados, parâmetros não permitidos descartados, login explícito com sessão prévia e comportamento de outras rotas preservado.
- Regressão de recuperação de senha e acesso existente passou sem alterar o código da frente 01/02.

Outras verificações: `pnpm typecheck` passou; `node --check scripts/previa-anuncios-meta.mjs` passou; `git diff --check` passou com avisos de normalização LF/CRLF. Revisão React: sem hooks/efeitos/polling ou chamada nova, sem token em props, helper puro com estado local à chamada, links nativos e paralelismo anterior preservados. CSS não mudou.

**Limites dos testes:** Auth, banco/RLS, transporte HTTP e cookies são substituídos em memória. A página de login e a action são reais; o componente de formulário é uma porta de observação no novo teste, não digitação em navegador real. Não prova login HTTPS, permissões remotas, cache de implantação, consulta à Meta ou produção. Não foi rodado build, reiniciado o Next ou aberta sessão de cliente.

## 5. Menor próximo ato externo, fora deste bloco

1. **Victor + 07/08:** seguir o pacote de publicação/ativação QA e obter uma leitura real autorizada; não desligar mocks de mutação nem pressupor credencial por existir campanha manual.
2. **05/06 + 07/08, após esses portões:** conferir o mesmo negócio/conta/campanha/datas/moeda/fuso na API, Anúncios, mesa e fonte. O recorte nominal proposto pelo backend permanece **28/10–01/11**, negócio `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, conta `act_2818009911919726`, ainda sujeito à confirmação/autorização da rodada. Nada foi consultado com esses IDs aqui.
3. No QA publicado, sair/entrar a partir da URL com conta/período e do link de recuperação, usando identidades próprias; guardar versão, recorte e resultado sem cookies/tokens. Não forjar respostas da fonte para testar parser em ambiente remoto.
4. **Google Ads:** aguardar contrato definitivo/fixtures do 07/08 antes de implementar tela; separar `customer_id` anunciante da MCC, unidade de custo, moeda/fuso e estados. Nenhum endpoint foi presumido.

Nenhum commit, push, deploy, configuração, flag, credencial, migration, leitura paga/externa ou escrita de cliente foi feito. Alterações concorrentes de compra pública, piloto e decisões foram preservadas. Bloco encerrado; não emendar outro recorte por autonomia.
