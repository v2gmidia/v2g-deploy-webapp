# Acessos Piligrin/Dúú — Meta conferida e complemento local

## 0. Estado e limite

> RESOLVIDO em 12/11/2026 às 16:33 de Brasília: complemento SQL aplicado após autorização específica, backup e conferências. Ver `n26-conexao-historica-aplicada-producao-12-11.md`. O relato abaixo preserva o preparo anterior; publicação e acessos reais continuam pendentes.

12/11/2026. Victor autorizou avançar nos acessos e pediu que a agência centralize a operação dos seus anunciantes. **Conferência Meta concluída; acessos do aplicativo ainda não concluídos em produção.** Não houve nova escrita no banco produtivo, alteração de permissões, concessão/aceite, OAuth, credencial, cobrança ou deploy neste bloco.

Já existe compartilhamento da conta e Página do Dúú com a V2G. Foi descoberta e corrigida localmente uma lacuna entre o acesso histórico e a seleção da conta Meta. O complemento novo precisa de revisão/aplicação própria e publicação do código antes da prova real. Evidência, titular e consentimento final continuam legítimos, sem fabricar pedido ou fingir sessão.

Responsável: Central na correção/aplicação/conferência; Victor no Git, campos privados e aceite/consentimento. [Pacote concreto](../producao/piligrin-acessos-12-11/REVISAO.md), com SQL, cópias do código, patch, hashes e testes.

## 1. Como os acessos funcionam

Um login da agência pode gerir seus anunciantes vinculados e liberados. O Dúú precisa de cadastro separado, não de outro usuário/senha neste piloto. O acesso direto futuro de uma pessoa do Dúú depende de um modelo de membros/autorização próprio; não trocar titularidade do cadastro para simular isso. V2G/gestor permanece em sessão interna distinta e com atribuição explícita.

A agência conduz a liberação dos ativos Meta quando possui autoridade; o proprietário precisa autorizar quando ela não pode repassar esses acessos. Acesso humano na BM, conexão do aplicativo e direito de atendimento são verificações diferentes. Nenhuma delas substitui automaticamente as outras.

## 2. Fatos atuais

- A produção abriu legitimamente a Piligrin; o menu apresentou apenas a raiz. A apresentação nova ainda não está publicada. Não foi exigido novo login nem alterada a sessão.
- Titular é dono da raiz e Dúú. O legado de 07/10 permite o primeiro negócio, mas não libera automaticamente o Dúú criado posteriormente. Banco confirmou zero concessões e zero conexões/contas Meta para o novo Dúú.
- BM Piligrin listou CA - Piligrin e CA - Piligrin Build; o Dúú não estava na lista consultada. Isso não prova ausência em todos os perfis/portfólios da agência.
- Na BM V2G, conta **1165478988908157** e Página **206296256098753** já compartilhadas, propriedade **BM - Vinho Dúúgomes**. V2G Midia e Cauã possuem permissões operacionais na conta e Anúncios/Insights na Página. Leitor QA somente Ver desempenho na conta. Não foi feito novo compartilhamento.
- A função produtiva original de registro de conta exige compra aprovada ou negócio anterior ao marco legado. O acesso histórico aceito não está contemplado. Fonte real capturada e bloqueio reproduzido localmente.

Fontes nominais e links de UI estão em `docs/producao/piligrin-acessos-12-11/REVISAO.md`. Fontes de código: `lib/multiconta/elegibilidade.ts` para as regras de elegibilidade; `lib/contratacao/acesso-contratado.ts` para concessões da sessão; `app/(fluxo)/conectar/escolher/actions.ts` da candidata para o encaminhamento novo. O fluxo já aprovado de acesso emitido/aceito continua sendo usado; a agência não ganha acesso ilimitado por nome ou vínculo.

## 3. Correção local, sem aplicação

Candidata: `C:/Users/victo/v2g-deploy/webapp-piligrin-producao`. Alterada a ação de escolha, acrescido seletor de concessão e teste da ação. Conteúdo anterior da ação preservado, conferido pelo selador. A QA não recebeu mudança de produto. O pacote anterior de banco/cadastro permanece aplicado e não foi repetido.

Nova função proposta, SECURITY INVOKER e somente serviço, verifica concessão aceita e evidência histórica, titular, negócio, conexão e limite de uma conta por anunciante. Não altera a função original nem o financeiro. Sem qualquer pedido real pode atender o cadastro histórico; havendo pedido, recusa e conserva o fluxo financeiro. Revogação e cliente errado negam a operação. Nenhuma permissão direta de UPDATE na tabela de concessões foi ampliada para obter travamento.

Provas: **57 verificações PostgreSQL/seletor, 6 testes da ação real, 33 regressões e typecheck passaram.** Dados/identidades dos testes são fixtures locais, não contratações reais ou evidência de integração com a Meta. Não foi executado novo build/deploy; a prova publicada continua pendente.

Os hashes estão no manifesto do complemento. A candidata agora combina o pacote-base e três arquivos novos/alterados; não publicar apenas o patch antigo nem tratar seu selo anterior como selo de toda a candidata atual.

## 4. Próxima ação concreta

Revisar o complemento novo de conexão; aplicar somente seu SQL após o bloco específico de aprovação e backup corrente. Depois compor/publicar o código controladamente, registrar a referência e o documento reais da contratação da Piligrin pela sessão do operador, colher aceite do titular e conectar o Dúú com os ativos já compartilhados. Nenhuma intervenção privada foi pedida antes da tela estar pronta.

Somente depois conferir o percurso produtivo completo. Não concluir acessos por ter uma conta listada na BM, por uma linha de agência no banco ou por testes locais verdes. Não reenviar solicitação de compartilhamento já atendida nem voltar às oito migrações encerradas.
