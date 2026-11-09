# N26 — M1/M2 / entrega para publicação manual somente no QA — 08/11/2026

## Resultado entregue

Pacote de revisão e roteiro de aceite consolidados, sem nova auditoria ou publicação. A prova local atual é de **179 testes aprovados**, não de funcionamento autenticado do piloto. Não houve edição de runtime neste fechamento.

**Documento de conferência e manifesto de 16 arquivos:** `C:/Users/victo/v2g-deploy/webapp/docs/estado/n26-m1-m2-consumidor-qa-piloto-08-11.md`, seções 1–5. Contém comando executado, comparação publicado/local, limitações do conector e SHA-256 dos bytes locais capturados em 08/11 às 23:04 BRT. Esses hashes identificam o recorte conferido; não constituem um pacote autônomo com todo o grafo de imports.

**Próximo ato é de Victor/Central:** publicar manualmente uma candidata coerente no projeto QA, registrando sua versão. Não publicar uma seleção avulsa dos 16 arquivos nem assumir que alterações concorrentes já pertencem à candidata. O manifesto permite conferir a inclusão das correções desta frente, sem refazer a auditoria inteira.

## 1. Alvo e versões, sem inferência

| Item | Estado medido na conferência encerrada |
| --- | --- |
| Workspace | `C:/Users/victo/v2g-deploy/webapp` |
| Projeto Vercel autorizado para este roteiro | **v2g-webapp-qa** — `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn` |
| Equipe medida | V2G — `team_sEnWVgpk9PlXLZwMQmd4sv3O` |
| Alias QA | `https://v2g-webapp-qa.vercel.app` |
| Deployment observado | `dpl_H1N2U8Ye8JB3y5Wn6ucRRLPpbZCJ`, READY, origem CLI |
| URL imutável observada | `https://v2g-webapp-di3ona559-v2-g.vercel.app` |
| Pronto desde | 06/11/2026 11:35:01 BRT |
| Banco QA conferido | `zskpijnqgkqwxksqmzmf` |
| Branch/SHA publicados | **Não fornecidos pelo deployment CLI**; `meta={}`, sem gitSource. Não associar SHA de outro checkpoint a essa versão. |
| Branch/SHA candidatos | **Não medidos neste bloco**: sem operações Git. Candidata identificada pelos caminhos/hashes locais no manifesto, ainda sem novo deployment. |

`target=production` desse deployment designa o ambiente do **projeto QA isolado**; não autoriza selecionar o projeto de produção do produto. A versão realmente publicada manualmente deve ganhar seu próprio registro de branch/SHA, quando houver, e deployment/alias. Não usar o HEAD ou alias de outra frente por dedução.

## 2. Diferença concreta e recorte mínimo de código

### M1 — leitura Meta independente de execução

**Publicado:** pasta de Anúncios retornada pelo conector contém `PainelDeAnuncios.tsx`, `loading.tsx` e `page.tsx`; imports da página são os legados. A ficha publicada `components/gestor/leitura/LeituraDaConta.tsx` chama `lerMetricasDaCarteira` e renderiza `DadosDaConta`, com props `desde/ate`.

**Candidato local:** página de Anúncios e ficha da mesa usam a mesma coleção autenticada Meta, sem exigir execução do gerador. Conta/período/negócio são validados; ausência não vira zero; fuso/cobertura contraditórios são recusados; retorno de login preserva o recorte.

Entradas e dependências a incluir de forma coerente na candidata:

- `app/(protected)/anuncios/page.tsx`
- `app/(protected)/anuncios/AnunciosMeta.tsx`
- `app/(protected)/anuncios/anuncios-meta.module.css`
- `app/(protected)/anuncios/AtualizacaoDaConsulta.tsx`
- `components/gestor/leitura/LeituraDaConta.tsx`
- `app/(protected)/gestor/page.tsx` — chamador precisa acompanhar as novas props da ficha.
- `lib/anuncios/contrato-meta.ts`
- `lib/anuncios/retorno-login.ts`
- `lib/backend/anuncios-do-negocio.ts`
- `lib/backend/cliente.ts` — transporte humano existente.
- `lib/backend/index.ts` — export correspondente.
- `proxy.ts` — preservação do destino/recorte no login.

São os 12 arquivos M1 registrados no manifesto. Helpers/componentes importados e alterações concorrentes continuam na árvore coerente da candidata; esta lista não autoriza sobrescrever arquivos compartilhados ou recriar a aplicação a partir de recortes. Sem novo componente ou funcionalidade a desenhar.

**Bloqueio observado:** sessão V2G no QA mostra falha de leitura; logs atuais registram 403 em `/execucao` e 404 em `/consolidado` do negócio V2G. Fonte publicada da mesa confirma o consumidor antigo. Não é resposta da rota nova nem prova API do Dúú. Liberar somente backend/schema não substitui esse consumidor publicado.

### M2 — criativo pronto → fila atribuída → decisão → retorno

Entradas do fluxo a preservar na mesma candidata:

- `app/(protected)/criativos/revisao-actions.ts`
- `app/(protected)/criativos/page.tsx`
- `app/(protected)/gestor/criativos/actions.ts`
- `app/(protected)/gestor/criativos/page.tsx`

Esses quatro completam os 16 arquivos do manifesto. A revisão usa os helpers existentes de arquivo/intenção/paginação/tarefa; não os substituir por versões antigas. A galeria, formulários e CSS pertencem à árvore candidata, sem reconstrução visual solicitada por este ato.

**Diferença observada:** os prefixos publicados da página/action da fila ainda usam a guarda Auth anterior. As versões locais conferidas recusam erro de sessão; a carteira é exigida com tarefas ON/OFF; a decisão verifica hash/tamanho/MIME dos bytes e preserva a primeira decisão. Os conteúdos longos publicados vieram truncados; não se declarou comparação integral de seu corpo ou hash.

**O fluxo local já está pronto neste recorte.** O formulário de envio aparece no QA; tabela de revisão, `upload_intent`, tarefas e bucket privado existem. A Piligrin tem zero pedidos de revisão. Falta a candidata revisada e a prova autenticada, não mais uma tela.

## 3. Configuração a conferir pelo responsável — nomes apenas

Nenhum valor foi lido de `.env`, extraído do navegador ou alterado por esta frente. Este quadro identifica dependências, sem presumir os estados remotos atuais:

| Nome | Papel no aceite |
| --- | --- |
| `V2G_QA_PILOT_ACCESS_ENABLED` | Caminho nominal do piloto QA existente |
| `NEXT_PUBLIC_SUPABASE_URL` | Trava do piloto confere o host QA esperado |
| `V2G_BACKEND_URL` | Destino do transporte de leitura, no backend QA correto |
| `V2G_MANAGER_WORK_ENABLED` | Porta da consulta de gestor e tarefa auxiliar |
| `V2G_MANAGER_METRICS_READ_ENABLED` | Exibição/leitura dos números na ficha da mesa |
| `V2G_CREATIVE_REVIEW_ENABLED` | Envio e fila de revisão |
| `V2G_CREATIVE_AUTO_ANALYSIS_ENABLED` | Não incluir análise paga no ensaio M2 |

As duas primeiras e a URL do backend são configuração de ambiente, não todas flags booleanas. Geração/provedor/publicação ficam fora do ensaio. Se faltar configuração, a Central registra o bloqueio e solicita o ato nominal necessário; este roteiro não autoriza mudar painel/configuração ou credenciais.

## 4. Aceite após a publicação manual

### M1 — menor prova de números do piloto

1. Registrar deployment/alias/candidata efetivamente publicados e confirmar projeto/banco QA. Não tratar push como publicação ou READY como aceite funcional.
2. Abrir com a **identidade nominal proprietária da Piligrin já autorizada**, negócio `9cb85308-02cc-4ce7-bacf-15be77f9ba5e`, conta `act_1165478988908157`. Não conceder operador a Victor e não criar nova compra.
3. O 07/08 confere resposta autenticada da coleção nova e seu contrato para o mesmo negócio/conta/período. Esta frente confere Anúncios e mesa com as identidades próprias, sem reutilizar API V2G como prova Dúú.
4. Comparar campanha/conjunto/anúncios, período, moeda, fuso, cobertura, valores/null e estado. A sessão do Cauã deve mostrar o mesmo recorte pela carteira dele; não impersonar.
5. Reentrar a partir do link de recuperação da leitura e conferir preservação de conta/período. Erro não deve exibir zero/sucesso e conta externa deve continuar negada.

**Referência humana recebida da Central, não reexecutada por esta frente:** BM da conta `1165478988908157`, campanha `52570261860675`, conjunto `52570262603875`, orçamento informado `50/dia`; período **01–07/11**, gasto `281,80`, alcance `18.635`, impressões `26.129`. Isso serve como referência para alinhar a próxima comparação; **não é prova da API ou do WebApp**. Confirmar moeda, fuso, nível e métrica correspondente antes de comparar/somar. Não converter isso em autorização de gasto ou teto: os R$ 3 mil/mês mencionados antes continuam estimativa.

### M2 — o que falta de prova objetiva

1. Autorizar uma imagem própria/de teste e o único envio do ensaio; não presumir uso de material privado. Cliente entra no negócio correto e envia uma vez com objetivo e prazo, se houver.
2. Registrar **request_id + business_id + autor + hash/tamanho/MIME + intenção**, uma linha e um objeto privado. Conferir retomada sem duplicar, quando oferecida pela interface.
3. Cauã abre a própria fila e vê **a mesma peça/negócio/hash**; registra uma decisão e nota. Conferir autor/data e persistência. Aprovação interna continua publicação manual pendente, nunca “no ar”.
4. Cliente recarrega, depois entra novamente: mesmo pedido/estado/nota. Outro negócio/gestor não recebe a peça ou registra decisão. Não transferir URL assinada para simular identidade.
5. Tarefa auxiliar só entra no aceite se expressamente incluída; falha dessa tarefa não apaga uma decisão persistida. Novos atores A/B ou pedidos adicionais precisam de autorização, sem expandir acessos reais por conveniência.

Matriz completa existente: `C:/Users/victo/v2g-deploy/webapp/docs/qa/n26-p3-criativo-pronto-04-11/MATRIZ-QA.md`. Não foi marcada como executada nem sobrescrita. O percurso local com portas fictícias e nova sessão em memória passou; não equivale a logout/login, RLS ou Storage reais.

## 5. Prova já entregue, donos e parada

- Conferência atual: `C:/Users/victo/v2g-deploy/webapp/docs/estado/n26-m1-m2-consumidor-qa-piloto-08-11.md` — **179 PASS**, comparação publicado/candidato e manifesto de 16 arquivos; relidos ao fim sem mudança nos 16 hashes.
- Recorte original M1: `C:/Users/victo/v2g-deploy/webapp/docs/estado/n26-p2-meta-guardas-retorno-login-05-11.md`.
- Recorte original M2: `C:/Users/victo/v2g-deploy/webapp/docs/estado/n26-p3-criativo-pronto-fila-caua-04-11.md`.
- Vínculo/rotina do piloto: `C:/Users/victo/v2g-deploy/webapp/docs/estado/piloto-piligrin-caua-05-11.md`, atualização de 06/11. Grant/conta/atribuição foram reconferidos em leitura na rodada atual; a sessão disponível V2G é outro perfil, sem acesso à Piligrin no seletor.

**Victor/Central:** publicação manual e identificação da candidata QA/configuração. **07/08:** backend/contrato e prova API Dúú. **05/06:** números e percurso visíveis após release. **Cauã/cliente:** sessões próprias no ensaio coordenado. A Central está responsável por BM/WhatsApp; nenhum envio duplicado foi feito.

Não há nova auditoria ou implementação aberta por esta entrega. O próximo portão é a publicação manual da candidata QA identificável e o ensaio acima. Sem configuração, Git/deploy, banco, cobrança, geração paga, alteração de verba/campanha, produção ou publicação de anúncio por esta frente.
