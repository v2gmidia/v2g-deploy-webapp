# Piligrin → Dúú/FamFire aplicada e validada somente na QA

Data: 10/11/2026. Bloco autorizado por Victor após informar commit/push somente QA. Aplicação às 17:23–17:24 BRT; validação publicada na sequência.

## 0. Resultado e próxima decisão

**Bloco técnico encerrado:** código publicado no projeto isolado QA, backup privado verificado, schema e preparo Piligrin aplicados, carteira com dois anunciantes e isolamento conferidos. Não há próximo pacote de banco autorizado por consequência deste resultado.

| Marco do plano | Estado atual | Responsável / próximo ato |
|---|---|---|
| M1 · Dados na tela | Comprovado na QA; leitura parcial preservada | Não reabrir a prova encerrada sem mudança ou falha concreta. |
| M2 · Peça e decisão | Envio, decisão de Cauã e retorno à Piligrin comprovados | Aprovação continua separada de confirmação da publicação. |
| M3 · Rodada assistida | Não concluído; correção de retorno agora publicada e validada | Cauã + Victor: confirmar data/origem desta versão da arte no AD 01, material de marca e limites da rodada; realizar a rodada assistida com os atos especificamente autorizados. O teto mensal de R$ 3 mil já está confirmado; não foi reaberto. |
| M4 · Aceite do piloto | Não concluído | Victor + Cauã: registrar aceite ou bloqueio concreto após a rodada. |
| M5 | Não definido no plano atual | Não inventar um quinto marco nem declarar expansão concluída. |

FamFire: base criada; faltam informações operacionais, marca, conta Meta/Página, teto e atribuição de gestor próprios. A entrada dos demais oito anunciantes não foi executada. A preparação de carteira não equivale a aceite do piloto nem liberação de produção.

## 1. Publicação verificada

- Branch local/remota `QA`, sem divergência e sem alterações locais no início deste bloco.
- Commit `24e2ca1041554f198637a37e78f080d143eda6ac`, informado por Victor e conferido localmente e na Vercel.
- Projeto `v2g-webapp-qa`, ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- Deployment `dpl_7MBTwRG9T42TFdp8QY7pL58uhySM`: READY, alias `v2g-webapp-qa.vercel.app`, branch QA e SHA exato. A primeira leitura por alias trouxe o deployment anterior; a consulta do deployment novo confirmou READY e a associação dos aliases. Nenhum novo deploy foi disparado.
- `target=production` neste registro da Vercel é o ambiente estável do projeto QA isolado. Não é publicação no projeto real de produção.

## 2. Backup anterior à aplicação

Destino local privado, fora do repositório:

`C:/Users/victo/.codex/private-backups/v2g/agencia-piligrin-qa-20261110-202016/`

- `antes.json`, capturado às `2026-11-10T20:20:16.398058Z`; existência, leitura/parse, projeto, ID Piligrin e 51 entradas do histórico verificados antes do DDL.
- SHA256 do backup anterior: `2F0EEE504561268FC3CFB3AC343FF1663E452536700F9E4806816E4048370BD0`.
- Snapshot: metadados pertinentes, histórico de migrations, linha Piligrin, registros operacionais relacionados, objetos Storage e fingerprints dos 25 negócios anteriores. Sem valores de variáveis de ambiente, tokens, senhas, Vault, usuários Auth ou credenciais de execução.
- Cópias byte a byte dos dois SQL aprovados; hashes conferidos antes da aplicação.
- Posteriormente acrescentados `depois.json`, `verificacao.json`, screenshots e `manifesto.json` com tamanhos e SHA256.
- ACL da pasta e herança dos arquivos verificadas: apenas usuário local Victor e SYSTEM.

Hashes dos SQL preservados:

| Arquivo | SHA256 |
|---|---|
| Schema `20261110193942_agency_advertisers_qa.sql` | `FBF1FE200B6ACDF2AD8640A5A466FB37649BF99381EA5E9CDD1619EF8B426E7F` |
| `preparar-piligrin.sql` | `AA3FDC5551E955F10D129FAA781ADF7A2D16C2CC610CFC0FDB37875969287BAA` |

## 3. Aplicação delimitada

Projeto Supabase confirmado pelo catálogo e por SQL: **`zskpijnqgkqwxksqmzmf`**, `v2g-webapp-qa`, ACTIVE_HEALTHY. Não houve SQL no projeto de produção.

1. Uma chamada `apply_migration`, nome `agency_advertisers_qa`, retorno `success=true`.
2. Versão registrada pelo serviço: **`20261110202356`**. Histórico **51 → 52**, todos os pares anteriores preservados.
3. ACL/RLS conferidos antes do preparo dos dados.
4. Preparo executado em transação com marca de destino QA e verificações de pai/titular. A marca é declaração do implantador; a identidade do projeto foi verificada independentemente.

| Agência | Anunciante | business_id | Preservação |
|---|---|---|---|
| Piligrin | Dúú Gomes | `9cb85308-02cc-4ce7-bacf-15be77f9ba5e` | ID histórico mantido; vínculo `piligrin-duu`, ponte legada explícita. |
| Piligrin | FamFire | `b93ce126-2ea8-4ab3-9051-4d7f3a44caf6` | ID gerado pelo banco; vínculo `piligrin-famfire`, cadastro próprio. |

Titular comum conferido, sem troca de dono ou criação de usuário. Dúú permanece no business histórico compartilhado com a identidade legada Piligrin; isto é uma ponte de preservação explícita, **não uma migração física completa do legado**.

FamFire recebeu somente as três respostas de identidade confirmadas: nome, contratante e operação via agência. Teto null; zero contas de anúncio, conexões Meta, criativos, pedidos de revisão e atribuições de gestor. Não copiou dados do Dúú nem ganhou licença financeira/Meta.

## 4. Preservação e segurança medidas

- Os fingerprints dos **25 negócios preexistentes permaneceram iguais**; exatamente um novo negócio, FamFire. Repetição do preparo não duplicou negócio/vínculo nem alterou fingerprints.
- Linha Piligrin/Dúú integral e snapshots de conta de anúncios (1), conexão Meta (1, sem segredos no backup), pedido de revisão (1), atribuição de gestor (1), Storage (1), criativos (0), publicações confirmadas (0), execuções (0), pedidos comerciais (0) e memberships (0) permaneceram iguais antes/depois.
- Nenhuma coluna, policy, grant, índice, constraint ou trigger anterior capturado foi removido. O índice composto novo em businesses e os objetos da estrutura foram acrescentados.
- RLS habilitado; duas FKs de titular comum presentes. `authenticated`: SELECT sim; INSERT/UPDATE/DELETE não. `anon`: SELECT não. `service_role`: SELECT/INSERT/UPDATE/DELETE conferidos separadamente, todos sim.
- Prova SQL transacional de RLS: sujeito titular lê 2 vínculos; sujeito sem vínculo lê 0. São testes de papel/claims locais à transação com ROLLBACK, não sessões reais de outros clientes.
- Revogação FamFire ensaiada **apenas em transação revertida**: titular lê 1 vínculo e 0 FamFire enquanto revogada. Após ROLLBACK, ambos os vínculos novamente ativos; fingerprints idênticos. Nenhuma revogação persistiu.
- Regras de árvore/titular, escrita cruzada, abas antigas e idempotência já tinham 34 verificações locais PostgreSQL e 43 testes de aplicação no bloco anterior. A suíte local não foi repetida sem alteração de código. Não declarar esses testes como novos ensaios autenticados de outro usuário.

## 5. Prova pela sessão real Piligrin, na QA publicada

Sem extrair token/cookie nem alterar sessão, papel ou permissões. A preferência de negócio foi trocada exclusivamente pelos botões legítimos de seleção do aplicativo.

| Percurso | Resultado observado |
|---|---|
| Início da agência | Carteira Piligrin com Dúú e FamFire, dois anunciantes; sem agregação de resultados Meta entre clientes. |
| Dúú Início | Conta `act_1165478988908157`, números e gráfico reais; teto R$ 3 mil, todo o estado do Rio de Janeiro e Cauã Carlos preservados. |
| Dúú Criativos | Uma imagem com prévia, aprovada pelo gestor; publicação ainda sem confirmação; retorno à carteira funcionando. |
| Criativos da agência | Uma peça vinculada ao Dúú; filtro FamFire retorna zero peças. |
| Abrir FamFire | POST legítimo troca preferência e abre o detalhe próprio; biblioteca vazia e formulário nominal FamFire. Sem enviar peça ou gerar revisão. |
| FamFire Início | Sem conta ativa vinculada, sem resultados herdados, teto e região não informados, cadastro incompleto e gestor a conferir. |
| Conta cruzada por URL | FamFire + conta Dúú no parâmetro não revela métricas; continua sem conta vinculada e sem rodadas próprias. |
| Link antigo Dúú após seleção FamFire | `Cliente indisponível`, sem imagem/dados Dúú; exige voltar à carteira e selecionar legitimamente. |
| Retorno a Dúú | Botão legítimo restaura Dúú, números e gráfico. Início → Anúncios → resumo preserva cliente, conta e período 01–10/11. |

Na leitura Dúú observada às 17:28 BRT, Início/Anúncios mostraram R$ 442,29 / 38.101 impressões / 686 cliques; 1/10 campanhas com observação, conversas Não medido. O período inclui o dia corrente: no retorno posterior subiu para R$ 442,31 / 38.109 / 686. Isso não é prova de divergência; não houve comparação simultânea nova diretamente na BM. A prova anterior 01–07/11 não foi reaberta.

Evidências visuais e relatórios técnicos ficam no backup privado, incluindo `carteira-dois-anunciantes-qa.png`, `duu-inicio-qa.png`, `duu-criativos-qa.png`, `famfire-inicio-qa.png`, `famfire-criativos-qa.png`, `famfire-conta-cruzada-bloqueada.png` e `link-antigo-bloqueado.png`.

Limites: não houve novo upload, decisão do gestor, registro de publicação, rodada, campanha, cadastro automático ou teste positivo de escrita pela sessão de outro usuário. A proteção de formulário antigo foi coberta localmente no bloco anterior; nesta sessão foi conferido o GET/link antigo. Não houve contato novo com Cauã nem nova resposta presumida.

## 6. Plano reconciliado e parada

Atualizadas e relidas 12 células em **Visão geral** e **Entrada de clientes**, preservando notas/histórico, formatos, tabela e validações. M3 já não pede publicação da correção encerrada; M4 continua pendente. FamFire registra cadastro/vínculo/isolamento concluídos, com ativos e informações próprias por identificar; estado nativo `Identificar` mantido com esse significado explicado. Os demais anunciantes não foram marcados como implantados. FigJam não foi alterado neste bloco.

Sem alteração de código, backend, n8n, permissões remotas, credenciais, produção, anúncios ou verba Meta. Sem commit, push, merge ou novo deploy pelo agente. Apenas este registro, índice e nota de resolução do pacote ficam para versionamento manual. Encerrar este bloco; a próxima prova útil é humana/assistida, com Cauã e Victor, conforme §0.
