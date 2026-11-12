# Piligrin e Dúú em produção — pacote para revisão

**12/11/2026. Preparado localmente. Nada aplicado, publicado, commitado ou enviado.**

**Revisão 2 — marca e período:** a apresentação da Piligrin no cadastro compartilhado usa a inicial **P**, preservando a imagem do Dúú no anunciante. Agências com marca própria e cadastros separados continuam usando sua própria imagem. O resumo exibe as datas completas em destaque e o rótulo **“Investido no período”**, com calendário, valores, gráfico e links no mesmo intervalo. Correção na branch QA local, sem publicação no alias QA. A revisão 1 foi preservada como cópia privada de arquivos; não é backup do banco.

## O que você verá depois da implantação aprovada

| Lugar | Mudança proposta | O que será preservado |
|---|---|---|
| Entrada da Piligrin | Abre a carteira da agência, sem exigir campanha ou onboarding da própria Piligrin | Login existente escolhido por Victor |
| Carteira | Dúú aparece como anunciante da Piligrin, com pendências e acesso ao aplicativo | Agência e anunciante têm cadastros distintos |
| Início do Dúú | Números e gráfico diários da mesma fonte de Anúncios, com conta/período, origem e cobertura | Valor desconhecido continua não medido; sem duplicar campanha, conjunto e anúncio |
| Criativos | Prévia da imagem, revisão e publicação como estados separados | Versão/hash e autoria da decisão; aprovação não vira anúncio publicado |
| Navegação | Abrir Dúú e voltar à carteira mantendo busca e filtros | Identidade visual já validada na QA |

FamFire não entra neste lote. Não há novo login direto para Dúú, nova cobrança ou anúncio publicado.

## Cadastros propostos

- **Piligrin:** aproveitar o primeiro negócio vazio do titular produtivo; mudar somente o nome `Meu negócio` para `Piligrin`. Manter seu onboarding vazio, sem verba ou briefing do Dúú.
- **Dúú:** criar um registro distinto do anunciante, pertencente ao mesmo titular, e o vínculo explícito com a agência.
- Levar somente as respostas confirmadas: indústria de chope de vinho, público de bares/pontos de venda, todo o estado do Rio de Janeiro, destino WhatsApp, campanha existente, teto de mídia de **R$ 3.000/mês**, ausência de site e marca confirmada.
- Cores: `#2B1B3F`, `#E9B7F9`, `#BACC9E`. Referência aproximada de R$ 69–70 por fardo preservada como referência, sem virar ticket médio ou mensalidade da V2G.
- Preservar as datas e a origem das declarações da QA. Não copiar reunião, aceite de produção, execução, autenticação, pedido, token ou publicação como se fossem fatos novos.

Detalhe: [dados propostos](dados-propostos.json) e [proposta SQL do cadastro](20-cadastro-proposto.sql).

## Pacotes de código separados da QA inteira

| Componente | Base produtiva conferida | Candidata local |
|---|---|---|
| WebApp | `13f8943471b391bd22e9dd8362f5748653ad9c5b`; deployment `dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW` | `C:/Users/victo/v2g-deploy/webapp-piligrin-producao`, branch `codex/piligrin-agencia-producao` |
| Backend | `1bfe3b5c03c1a2a3c25b09ca41cb77613fb20543`; fingerprint local dessa base e produção **`dbf2611f3b1e`** | `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-piligrin-producao`, branch `codex/piligrin-leitura-producao` |

O backend candidato acrescenta as duas consultas GET de campanhas/conta e a série diária; corrige o histórico vazio somente com titular comprovado. **Nenhum caminho/contrato HTTP anterior foi removido ou alterado** na comparação local do OpenAPI com o publicado. O fingerprint candidato é `677db34772e8`.

A leitura Meta da QA depende de uma cerca exclusiva do banco QA. A candidata produtiva usa um opt-in próprio, com banco produtivo exato, validação real da sessão, titular/atribuição e conta vinculada. Não transplanta a exceção de piloto QA nem modifica as fábricas de mutação, jobs ou n8n. POST e rotas legadas continuam exigindo o token de máquina existente. Token de máquina não substitui a sessão do cliente nas novas consultas.

No WebApp, a apresentação de agência tem um opt-in próprio e exige vínculo explícito em produção. O novo resumo do Início fica limitado ao anunciante vinculado da agência. Cadastros legados mantêm o leitor e as pendências anteriores; a entrada operacional V2 do Dúú dispensa custo/margem desconhecidos. A preferência da carteira não concede acesso a outro negócio.

As correções comerciais/OAuth de outra candidata continuam separadas. Páginas legais, preços, checkout, pagamentos e automações não compõem este pacote de código.

## Banco: proposta, não execução

As sete dependências existentes foram copiadas como propostas revisáveis, fora da pasta de migrações automáticas, com um oitavo arquivo de privilégios explícitos. Elas criariam **oito tabelas**:

1. `agency_advertisers`: relação agência/anunciante, titular comum por FK, leitura própria e vínculo ativo.
2. `manager_accounts` e `manager_tasks`: carteira e tarefas da mesa existente; nenhuma atribuição preenchida automaticamente.
3. `commercial_manual_evidence`: evidência documental do atendimento anterior, sem criar pagamento.
4. `historical_contract_access` e `historical_contract_access_events`: emissão, aceite autenticado e revogação auditáveis do acesso contratado.
5. `creative_review_requests`: revisão humana e armazenamento privado.
6. `creative_publication_confirmations`: mecanismo separado de confirmação, inicialmente vazio.

Também haveria índices, RLS, funções e um ajuste guardado no gatilho de cadastro para impedir reivindicação automática por e-mail no fluxo de contrato histórico. O gatilho existente só pode ser ajustado se sua definição conhecida continuar presente; o hash observado foi `52d5d94496184172e501db3d14debcda`.

A proposta de evidência manual reutiliza a versão com CNPJ de 14 dígitos. O validador produtivo de documento já existe. Não aplicar a migração ampla de CPF/CNPJ nem alterar o financeiro por consequência deste lote. Se o documento real exigir outro caminho, parar e revisar essa unidade.

Não executar os arquivos em lote. Reconciliar o estado de cada dependência, registrar o hash aplicado e conferir cada privilégio. Uma tabela já existente ou uma definição divergente exige replanejamento, não `IF NOT EXISTS` para esconder divergência.

## O que precisa estar resolvido antes de ativar

| Dependência | Estado observado | Ação legítima / responsável |
|---|---|---|
| Titular da Piligrin | Usuário existente confirmado; acesso legado preservado | Manter esse titular; Victor usa sua própria sessão |
| Acesso ao novo Dúú | Ser dono do registro e ter relação com a agência não concede automaticamente a operação contratada | Registrar documento e evidência reais, revisão por operador autorizado e aceite do titular no fluxo existente; Victor / operação |
| Meta em produção | Nenhum token ou vínculo QA foi copiado | Conferir conexão produtiva legítima e a conta `act_1165478988908157` para o novo Dúú; operação / titular |
| Nome/revisão do Cauã | A decisão original existe na QA; não foi encontrado perfil produtivo correspondente | Resolver a identidade produtiva por confirmação explícita e sessão legítima, antes de atribuir/importar sua decisão; Cauã / Victor |
| Arte | Arquivo local confere exatamente com o hash da revisão QA | Importar no namespace privado do novo anunciante depois das conferências de ator e versão; operação |
| Publicação da arte | QA possui zero confirmações persistidas | Manter sem confirmação. A declaração recebida no grupo não equivale a uma nova confirmação registrada pelo gestor |

O recebimento da resposta do Cauã não é uma pendência de WhatsApp ainda aberta. Não reenviar a pergunta. Falta preservar a autoria e usar o fluxo legítimo no destino, sem converter UUID, papel ou sessão QA em produção.

**Sem essas conferências, o pacote é revisável, mas a conta completa ainda não está pronta para ativação.** Isso evita entregar carteira vazia ou números quebrados depois de um deploy aparentemente bem-sucedido.

## Arquivos e preservação

- As duas imagens estão em `assets/`, intactas. A arte aprovada tem SHA-256 `0c0d48fdc3e3515f730226b6988d8b363ac854423bbb4c6bbb1c53a3ef24901c`, 484.499 bytes; o logo tem `08cedcfb312278a3f65a72eb908ea722cee8b2774139f27f4e1c1db2fe5a4dae`, 60.023 bytes.
- Logo deverá ser importado no bucket privado existente `v2g-midia`, com metadados de origem e caminho do novo Dúú. A arte usará o bucket privado `creative-review` e o ID do novo anunciante. URLs assinadas da QA não são dados de migração.
- A proposta SQL recusa destino/pacote não confirmados, titular divergente, raiz preenchida ou alteração posterior do anunciante. Repetição idêntica não duplica nem sobrescreve o cadastro.
- Não há seed de cobrança, concessão aceita, atribuição de gestor, conta Meta, revisão aprovada ou publicação confirmada.
- Os sete negócios de produção continuaram com **os mesmos fingerprints** na conferência final. Zero pedidos comerciais; estrutura de agência ainda ausente. Não foram encontrados outros cadastros produtivos V2 no recorte consultado.
- As evidências atuais são metadados de preservação, **não um backup integral de recuperação**. Antes de qualquer aplicação autorizada: capturar backup privado real do escopo, catálogo, ACL, funções e objetos, verificar que pode ser lido/restaurado e registrar localização/hash sem expor segredos.

## Testes e limites

- WebApp: **107 testes locais na branch QA** para agência/isolamento, marca, período, gráfico e histórico; **125 testes locais na candidata do pacote**, incluindo os sete novos testes de marca/período e os anteriores de acesso e elegibilidade. Cadastros antigos compartilhados e agência com marca própria foram cobertos, sem mutar os registros ou arquivos.
- Banco: **111 verificações locais da revisão 1**, preservadas porque esta revisão não muda SQL, funções, dados ou privilégios. Os schemas de dependência são fixtures focadas; o validador de documento dessa prova é estrutural e não comprova um CNPJ real.
- Backend: **2.864 testes passaram na revisão 1, 9 ignorados**, 9 avisos de depreciação; Ruff `src tests` e mypy limpos em 160 arquivos-fonte. Arquivos e patch backend devem permanecer idênticos nesta revisão; não repetir a suíte sem mudança. O varrimento adicional da raiz encontrou 11 alertas anteriores em `produto-site`, fora do comando de lint do backend e deste pacote; esses arquivos não foram alterados.
- Backend: exportação local de contrato confirmou somente as duas novas rotas GET e a série diária, sem alteração/remoção de rotas anteriores.
- A prova autenticada do produto permanece a QA de 12/11, registrada em `docs/estado/n26-piligrin-duu-validacao-autenticada-qa-12-11.md`. Ela não prova conexão, concessão ou importação em produção.
- Não foi construído nem iniciado um contêiner produtivo. Os testes Python usaram o ambiente virtual local existente, na candidata sem `.env`.
- Build WebApp final e selagem dos diffs: ver `manifesto.json` e `validacao.json` deste pacote.
- Prévia visual local isolada: computador a 1536 px e celular a 390 px, sem rolagem horizontal; inicial P e intervalo completos conferidos, inclusive mudança de 01–07/11 para 08–09/11 junto ao resumo/gráfico/links. Números da prévia são fictícios e a tela avisa isso. Nenhuma consulta Meta real foi repetida. Evidências em `C:/Users/victo/.codex/private-backups/v2g/qa-marca-periodo-20261112/`.
- A revisão de arquivos é **2**. O SQL permanece a unidade original **`piligrin-duu-12-11-revisao-1`**, com hashes preservados; a mudança de apresentação não renomeia nem reaplica uma unidade de banco.

## Ordem proposta após uma aprovação específica

1. Reconfirmar as bases publicadas, preservar alterações alheias e capturar/verificar o backup privado real.
2. Aplicar somente dependências ausentes revisadas, unidade por unidade; conferir RLS/ACL e catálogo após cada uma. Sem executar o diretório geral de migrações.
3. Preparar os dois registros e a relação conforme os dados propostos. Conferir fingerprints dos demais negócios e ausência de novos pedidos.
4. Resolver o acesso contratado no fluxo legítimo, as identidades da operação e a conexão Meta do novo anunciante. Documento e credenciais são inseridos privadamente, não no chat.
5. Importar logo/arte intactos e a revisão somente com mapeamento legítimo do autor. Não registrar publicação sem conferência explícita no fluxo do gestor.
6. Victor revisa/commita/envia os dois pacotes exatos; a publicação de produção e a ativação dos opt-ins exigem a aprovação deste bloco. Não promover a branch QA inteira.
7. Conferir saúde, versão e modo fechado primeiro. Só depois habilitar a apresentação e leitura aprovadas e validar com a sessão real da Piligrin: carteira → Dúú → Início/Anúncios no mesmo recorte → gráfico → Criativos → volta à carteira.
8. Reprovar a liberação se houver divergência de total/série, conta/cliente errado, imagem de outra versão, falta de autoria, leitura além do titular ou alteração em outro negócio. Registrar o limite da prova, sem chamar isso de venda ou publicação de anúncio concluída.

### Controles previstos, sem alterar valores agora

`V2G_AGENCY_PORTFOLIO_ENABLED` (novo, WebApp), `V2G_META_ADS_PRODUCTION_READ_ENABLED` (novo, backend), `V2G_HISTORICAL_ACCESS_ENABLED`, `V2G_CREATIVE_REVIEW_ENABLED`. Os opt-ins novos nascem desligados. Os controles da mesa e da confirmação manual de publicação exigem revisão separada de identidade/atribuição; não ligar todos os controles por conveniência. Nenhum controle financeiro ou QA é reaproveitado para liberar a produção.

### Retorno seguro

Desligar os opt-ins interrompe os percursos novos. O retorno completo de comportamento usa o deployment WebApp anterior e a versão backend `dbf2611f3b1e`, depois de verificar a imagem/artefato de retorno; o fonte conhecido não prova que a imagem anterior foi preservada. Não apagar novas tabelas ou registros após uso. Preservar o cadastro novo, a relação e a auditoria para revisão; revogação deve usar o fluxo próprio, sem apagar evidências ou alterar o legado. Restaurar dados somente a partir do backup verificado e de uma decisão específica.

**Próxima decisão de Victor:** revisar este pacote e aprovar ou ajustar o que entrará em produção. Nenhuma etapa de aplicação está autorizada por este documento.
