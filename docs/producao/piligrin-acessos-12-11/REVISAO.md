# Complemento de acessos Piligrin/Dúú — revisão de 12/11

> Aplicação posterior autorizada: em 12/11 às 16:33 de Brasília, somente o complemento SQL foi aplicado e conferido em produção. Registro em `docs/estado/n26-conexao-historica-aplicada-producao-12-11.md`. Este texto e o manifesto preservam a revisão preparada; código, concessão/aceite e OAuth reais permanecem pendentes.

## Resultado para Victor

Um login da Piligrin administra a carteira dos anunciantes explicitamente vinculados e liberados. Dúú tem cadastro e dados separados; não precisa de usuário/senha próprio enquanto o anunciante não for entrar no aplicativo. O acesso de gestor V2G é separado e exige sessão/papel/atribuição legítimos. Login independente futuro do anunciante demanda autorização/membros próprios: o modelo atual mantém agência e anunciante sob o mesmo titular, e não oferece esse compartilhamento multiusuário por simples troca de `profile_id`.

A agência é responsável por conduzir a obtenção dos acessos Meta. Isso não significa poder repassar qualquer ativo: o proprietário autoriza o compartilhamento quando a agência não pode fazê-lo. Senhas de Facebook não devem ser compartilhadas. A conexão do aplicativo é uma autorização específica; ter acesso humano na BM não comprova que o backend produtivo já recebeu uma conexão válida.

## Evidência atual — conferência somente leitura

- A sessão legítima de produção abriu a Piligrin; o menu oferece somente Piligrin. A visão nova continua dependendo do pacote de código preparado, ainda não publicado neste bloco.
- O banco tem raiz Piligrin e Dúú separados, mesmo titular. A liberação legada do titular cobre seu primeiro cadastro; não torna automaticamente o Dúú posterior elegível. Não há concessão aceita ou conexão/conta Meta para o novo Dúú.
- BM Piligrin `728815876428371`: a lista consultada apresentou duas contas da própria agência, CA - Piligrin e CA - Piligrin Build; o Dúú não apareceu nessa lista. Não inferir acesso da agência a todos os ativos dos seus clientes.
- BM V2G `1014960154276237`: **CA - Dúú Gomes `1165478988908157` já compartilhada**, propriedade de BM - Vinho Dúúgomes. V2G Midia e Cauã Carlos com Gerenciar campanhas/Ver desempenho/Central de Criativos; `v2g-qa-leitura` somente Ver desempenho. Nenhuma permissão foi alterada ou token copiado.
- Página **Chopp de Vinho DúúGomes `206296256098753` já compartilhada**, mesmo proprietário; V2G Midia e Cauã Carlos com Anúncios e Insights. Atribuir parceiro está desabilitado nessa visão de parceiro. Não pedir novamente o compartilhamento que já existe nem tentar redistribuir permissões que pertencem ao proprietário.

Fontes da sessão: [conta do Dúú na BM V2G](https://business.facebook.com/latest/settings/ad_accounts?business_id=1014960154276237&selected_asset_id=6964482613271&selected_asset_type=ad-account); [Página do Dúú](https://business.facebook.com/latest/settings/pages?business_id=1014960154276237&selected_asset_id=206296256098753&selected_asset_type=page). São provas de acesso humano nessa sessão e nessa data, não de OAuth/token/API do aplicativo.

## Lacuna encontrada e correção local

A função produtiva `registrar_conta_contratada` recusa negócios novos sem pedido aprovado, mesmo que o acesso por contratação histórica tenha sido legitimamente aceito. A candidatura anterior preservava essa mesma chamada. Reproduzido localmente com a definição real capturada em `funcao-original-producao.sql`: `negocio novo sem pedido aprovado`.

Complemento proposto:

1. Adicionar `registrar_conta_acesso_contratado`, SECURITY INVOKER, executável somente por `service_role`. Exige concessão explícita aceita/não revogada, destinatário e titular corretos, evidência histórica conferida, propriedade do negócio e conexão desse negócio. Não concede nem aceita acesso.
2. Limitar este caminho histórico a **uma conta de anúncios por anunciante**, sem criar pedido/unidade/pagamento. Qualquer pedido comercial existente bloqueia o complemento, inclusive cancelado. Troca por outra conta ou Página já definida exige revisão, não sobrescrita silenciosa. A regra atual de compra continua intacta.
3. Na ação de escolha, tentar o complemento somente após a recusa específica do negócio novo, com uma única concessão válida da sessão. Os ativos continuam sendo conferidos pela conexão Meta antes da gravação. Recusas financeiras não acionam esse caminho. A concessão QA permanece separada.

A função original de compra permanece inalterada. Não há tabela nova nem ampliação de privilégios diretos de cliente. A trava de negócio serializa cadastro com aceite/revogação nativos; a concessão é relida depois dela. Não conceder UPDATE na tabela de acessos só para usar uma trava de linha. Sem SECURITY DEFINER novo.

## Arquivos e validação

- `registrar-conta-acesso-contratado.sql`: **SQL proposto, ainda não aplicado em nenhum ambiente**.
- `webapp-complemento.patch` e `webapp/`: três arquivos de complemento. A candidata é `C:/Users/victo/v2g-deploy/webapp-piligrin-producao`. A remoção exata do bloco novo recupera o conteúdo anterior da ação, conferido pelo selador.
- `manifesto-complemento.json`: hashes e base. SQL SHA-256 `d821436c3759aea58cac27c2f0cbd83b1db0136d499ac507956d55345d7a6e3c`; patch SHA-256 `bc5ca20f0c62496b69efc10c443d6f4f1033929eb1765ead8b62bd9814777da0`.
- `conferir-acessos.mjs`: **57 verificações passaram**. PostgreSQL local com os DDL reais do pacote e dependências/identidades locais explicitamente fictícias. Inclui reprodução do bloqueio instalado, caminho válido/idempotente, recusas por titular/cliente/conexão/conta/Página, concessão revogada/não aceita, pedidos existentes e ACL.
- `scripts/conferir-conta-acesso-contratado.mjs` na candidata: **6 testes da ação real passaram** com portas simuladas e sem rede. Confere a ordem das chamadas, contexto do cliente, validação do ativo, seleção da concessão, erros sem texto cru, caminho financeiro e QA preservados.
- **33 testes de regressão** de acesso contratado/agência/marca/período passaram; `pnpm exec tsc --noEmit --incremental false` passou na candidata após a alteração. O build anterior não foi declarado como build deste complemento; não houve novo deploy.

Estas provas são locais. Não comprovam concessão real, OAuth concluído, token produtivo válido, gráfico publicado ou experiência de produção. A checagem final confirmou zero evidências/concessões/pedidos e zero conexões do novo Dúú; a nova função ainda não existe em produção.

## Execução pendente e caminho rápido

1. Revisar/aprovar este complemento adicional de banco. Capturar a ausência/estado anterior da função e o estado corrente do escopo privadamente, aplicar somente a função e conferir ACL, mantendo a interface nova fechada. Não repetir as oito unidades já aplicadas.
2. Compor o pacote-base de `../piligrin-duu-12-11/manifesto.json` com **este complemento**. A candidata foi acrescida de três arquivos; o patch/manifesto antigo sozinho não contém esta correção. Preservar o snapshot anterior como histórico, sem fingir que seus hashes ainda representam a nova candidata completa. Victor conduz o Git; publicação/controles de interface exigem o bloco próprio.
3. Pela interface produtiva disponível e sessão real do operador: registrar a contratação existente da Piligrin para a operação do Dúú, com documento do **contratante Piligrin**, referência verdadeira e atribuição legítima. Não exigir um novo pagamento nem documento do Dúú como se fosse contratante da V2G. Documento/identificação privados são preenchidos por Victor na tela, nunca aqui.
4. O titular Piligrin aceita a liberação específica do Dúú na própria sessão. Nenhuma chamada administrativa imita o aceite; a raiz administrativa não precisa de campanha própria ou onboarding de anunciante.
5. No Dúú selecionado, conduzir a autorização Meta legítima e selecionar exatamente a conta e Página acima. Não copiar tokens QA, não conectar esses ativos à raiz Piligrin e não compartilhar novamente o que já foi concedido. Se Meta pedir ação privada ou consentimento final, Victor a conclui na própria tela.
6. Conferir conexão/período/números/gráfico/criativos/volta à carteira e negativas entre clientes. Publicar anúncio, mexer em verba ou cobrar continuam fora do escopo.

Não há um botão pronto que libere, de uma vez, todos os clientes futuros de uma agência. O mínimo atual reutiliza a mesma sessão e o mesmo acesso Meta quando disponível, com seleção e autorização explícitas por anunciante. Automação em lote, login próprio de clientes e múltiplas contas por contratação histórica são evoluções separadas.
