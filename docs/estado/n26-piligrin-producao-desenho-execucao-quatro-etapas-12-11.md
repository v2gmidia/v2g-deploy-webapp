# Piligrin/Dúú — condução das quatro etapas produtivas

## 0. Objetivo e estado comprovado

> RESOLVIDO em 12/11/2026 às 15:55 de Brasília: etapa 1 de banco/cadastro executada após autorização explícita, backup privado e restauração. Ver `n26-piligrin-duu-estrutura-aplicada-producao-12-11.md`. O pré-voo abaixo fica preservado como estado anterior; etapas 2–4 não foram executadas por consequência deste bloco.

12/11/2026. Victor pediu o desenho para a Central resolver banco/cadastro, acessos, publicação e aceite final. Resultado-alvo: entrar com o titular existente na Piligrin produtiva, administrar a carteira e abrir o Dúú com números, gráfico e imagem próprios, retornando à carteira. A Central conduz a execução técnica, preservação, testes e registro; Victor participa apenas nos pontos privados/humanos e no Git conforme a regra do projeto.

Conferência atual em leitura:

- QA `916d8df0b5c05956c890bc7432ed5fa26c576930`, deployment `dpl_9ePJCBtj6Fc1P4MSbYUeGKEMdrWR`, READY.
- Produção WebApp ainda em `13f8943471b391bd22e9dd8362f5748653ad9c5b`, deployment `dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW`, READY.
- Sete negócios e zero pedidos comerciais; nenhuma das oito tabelas do pacote existe no destino consultado.
- Raiz da Piligrin continua `Meu negócio`, vazia, titular correto, verba nula e fingerprint `8d1de1f3264bb35c4b850ebfbb20f7b3`. Novo ID proposto do Dúú ainda não existe.
- Titular confirmado e operador produtivo conhecido confirmado. O UUID do revisor da QA não existe no destino; isso não autoriza criar/mapear alguém por semelhança de nome.
- Bucket privado de revisão ainda ausente. Definição do gatilho preserva hash esperado `52d5d94496184172e501db3d14debcda`.

Evidência privada: `C:/Users/victo/.codex/private-backups/v2g/piligrin-promocao-producao-20261112/preflight-desenho-quatro-etapas.json`. É pré-voo de metadados, não backup integral. Nenhuma migração, carga de dados ou publicação ocorreu nesta rodada.

## 1. Banco e cadastros preservados

Central: reconfirmar o destino e diferenças desde o pré-voo; capturar backup privado real do escopo de dados/DDL/funções/ACL/Storage que será alterado e identificar os artefatos efetivos de retorno dos serviços, sem exportar credenciais. Restaurar o escopo em ambiente descartável e provar leitura/consistência antes de aplicar.

Aplicar apenas as dependências revisadas ausentes, por unidade, com RLS/ACL conferidas individualmente. Preservar históricos de migração e não executar o diretório geral. Aproveitar a raiz vazia para a Piligrin administrativa; criar o Dúú como anunciante separado, mesmo titular e vínculo explícito. Levar só os dados confirmados. Sem FamFire neste lote.

Saída exigida: backup/restauração conferidos, raiz sem onboarding de anúncios, Dúú distinto, relação correta, demais negócios com fingerprints preservados e zero pedidos/cobranças novos. Falha em qualquer guarda aborta a unidade; não contornar a validação por `IF NOT EXISTS`, datas retroativas ou pedido fictício.

## 2. Acessos e materiais legítimos

Central: preparar a referência real da contratação já existente e o destinatário correto, usando o fluxo nativo de evidência → revisão de operador autorizado → emissão → aceite do titular. Acesso à carteira não exige contratar campanha própria da Piligrin; a operação do Dúú é uma unidade separada. Não recobrar nem inventar comprovante.

Fatos de código: `app/(protected)/pedidos/evidencias-actions.ts:13` registra a evidência sob sessão e atribuição reais; `app/(protected)/pedidos/acesso-contratado/actions.ts:7` exige operador autenticado e confirmação; `docs/producao/piligrin-duu-12-11/banco/04-acesso-contratado.sql:57` repete papel/carteira/evidência e não aceita uma identidade QA como operador produtivo. O aceite usa a sessão própria do destinatário, não uma chamada administrativa fingindo ser o cliente.

Identificar a pessoa real do Cauã no destino e conferir sua atribuição antes de importar a revisão. A resposta sobre a arte já foi recebida: não reenviar pedidos antigos nem esperar uma nova resposta de conteúdo como condição. Preservar autor, versão, data e origem. Aprovação da peça e confirmação de publicação permanecem diferentes.

Preparar a conexão produtiva legítima da conta Meta `act_1165478988908157` para o novo Dúú; não copiar tokens da QA. Importar logo e arte intactos em caminhos privados do novo anunciante, sem sobrescrever objetos existentes ou copiar URLs assinadas. A concessão, o OAuth e o aceite que precisarem de tela produtiva disponível são finalizados após a publicação fechada da etapa 3; não criar um segundo caminho por SQL para evitar essa dependência.

Intervenções humanas necessárias quando ocorrerem: documento/identificação ainda ausentes, comprovação e aceite, login/OAuth, credenciais privadas ou confirmação nominal de acesso. Reaproveitar fontes já confirmadas antes de perguntar. Campos privados são preenchidos no próprio painel; nunca no chat.

Saída exigida: o titular acessa apenas a carteira autorizada, o Dúú tem vínculo Meta exato e a revisão mantém autoria verificável. Não declarar concluído por haver apenas uma linha no banco ou um nome na interface.

## 3. Publicação controlada

Central: reconferir os hashes do pacote revisão 2 e sua base, preparar o material para o Git e os destinos exatos de WebApp e backend. Não promover a QA inteira nem a candidata comercial separada. Victor realiza os commits/push/merge necessários no GitHub Desktop conforme a regra do projeto; a Central acompanha build, versão e destino efetivamente publicados dentro do escopo autorizado.

A primeira publicação mantém a apresentação/leitura novas fechadas. Conferir saúde, autenticação e artefato de retorno antes de ativar cada controle estritamente necessário. Finalizar os acessos legítimos da etapa 2 com a interface disponível; só então habilitar o percurso de agência e leitura aprovado. Não ligar controles em bloco, nem alterar flags financeiras, jobs, DNS, legal ou n8n por consequência deste pacote.

Saída exigida: WebApp e backend nos destinos aprovados, versões correspondentes ao manifesto, rotas antigas preservadas e nenhum uso de banco ou concessão QA na produção. Retorno completo usa os artefatos anteriores verificados; desligar uma flag não substitui retorno integral do código.

## 4. Aceite final produtivo

Central acompanha a sessão legítima do titular e confere: entrar → carteira sem onboarding próprio → abrir Dúú → selecionar período → números/gráfico/Anúncios no mesmo cliente/conta/intervalo → Criativos com imagem exata → retorno com filtros. Conferir isolamento entre anunciantes e negativas relevantes sem consultar dados de outro cliente por aproximação.

A prova exige fonte e momento da medição; campos desconhecidos não viram zero. Conferir situação real de cada pendência e não confirmar reunião/publicação de arte automaticamente. A Central registra resultado, limite e próxima ação; Victor faz o aceite visual. Só depois ampliar a implantação para os anunciantes da Nota 360, já identificados em outro checkpoint.

Saída exigida: conta produtiva utilizável e evidência do percurso completo. Fim deste recorte não significa venda aberta, nova cobrança, anúncio publicado ou piloto/rotina inteiros concluídos sem suas próprias provas.

## Condução sem repetição

Cada etapa tem entrada, saída e uma evidência. Não voltar ao desenho das telas já aceitas nem repetir testes/consultas fechados sem mudança ou falha nova. Se faltar ação humana em uma frente, concluir o trabalho independente possível e apresentar uma única lista curta do que falta. Não criar automação de repetição para acompanhar este trabalho específico.

Este documento organiza o pedido atual e registra o pré-voo. O pacote de implantação continua em `docs/producao/piligrin-duu-12-11/REVISAO.md`; suas provas e limites permanecem preservados. Não registra backup real, aplicação ou deploy como se já tivessem ocorrido.
