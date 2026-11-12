# Compra existente com acesso autenticado comprovado na QA — 10/11/2026

## 0. Resultado e próximo ato

**Encerrada a prova de acesso da compra Sandbox existente de 27/10 na QA atual.** Victor entrou privadamente, a identidade correta foi observada, o negócio exato da compra foi oferecido no seletor e abriu o Início. Nenhuma nova cobrança, confirmação de Auth, grant ou alteração de proprietário foi feita pela Central.

O próximo bloqueio comercial está na abertura de produção, não no retorno do Cauã. Pacote concreto do próximo ato: `docs/qa/comercial-retomada-10-11/ABERTURA-DOMINIO.md`, para vincular apenas o subdomínio do aplicativo ao projeto produtivo, mantendo pagamentos desligados. Nenhuma ação desse pacote foi executada; depende de autorização nominal porque altera projeto/DNS produtivos.

## 1. Prova da sessão legítima

Após Victor responder **entrei** ao handoff:

- Aba QA `https://v2g-webapp-qa.vercel.app/inicio` abriu na conta V2G.
- Em **Conta**, o perfil visível era `v2g.midia@gmail.com`, o comprador da compra conferida anteriormente. A seção de plano mostrava pagamento confirmado pelo provedor, uma conta mensal e R$ 500. Contrato não assinado continuou indicado separadamente; nenhuma assinatura de contrato foi presumida.
- A consulta somente leitura ao QA mostrou que esse perfil tem um único negócio: `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, nome V2G, ligado ao pedido `01da0460-f12a-4c24-b1dc-ab03ed41a68f`.
- Em `/escolher-negocio`, apareceu somente esse negócio. O `value` DOM do botão público de seleção conferiu com o ID exato. A seleção normal pelo botão abriu `/inicio`, com nome V2G e conteúdo carregado.
- Não houve extração de cookie, token ou senha, inspeção de estado interno do framework, criação de sessão artificial, mudança de papel ou aprovação em nome de Victor. A única mudança normal de navegação foi a preferência de negócio pelo formulário existente.

Leituras complementares, somente QA, impediram um aceite pelo motivo errado: `operador=false`; nenhum marco de legado; zero acessos históricos ativos e zero grants de piloto ativos nesse negócio/perfil. O negócio nasceu em 27/10. A entrada não dependeu de bypass de operador, legado ou piloto.

Isso comprova a continuidade da compra já existente até o acesso no negócio correto. **Não é uma nova compra, novo cadastro ou teste financeiro ponta a ponta executado hoje**, nem prova de captura recorrente futura ou de 3DS bancário em produção. Pagamento, webhook e e-mail recebido são as provas conciliadas no checkpoint anterior; não foram repetidos para gerar outro pagamento/e-mail.

## 2. Negativas de acesso e limite da prova

Executados os oito testes dirigidos de `scripts/conferir-acesso-pos-estorno.mjs`, após a nova prova de sessão legítima:

- compra estornada deixa de autorizar o próprio negócio;
- negócio B válido permanece acessível quando A é estornado, sem cookie A conceder direito;
- pendente, estorno parcial, falha e leitura incompleta negam;
- vínculo e direitos independentes são preservados;
- sessão existente é reavaliada sem logout global ou perda de propriedade.

**8/8 PASS.** São testes offline dos módulos reais com fronteiras controladas. Não houve estorno real, injeção de evento, adulteração de sessão, alteração de pedido ou nova negativa financeira autenticada no banco QA. Não promover esses oito casos a prova bancária/HTTP/RLS real. Não foram repetidos build ou suíte completa; código do produto não mudou.

## 3. Próxima abertura, preparada em leitura

- Produção atual: `main 13f8943471b391bd22e9dd8362f5748653ad9c5b`, deployment `dpl_7wSVHtkzLzmDsdqp4foZ27Gj5zir`, READY, no projeto produtivo exato. Apenas leitura dos metadados Vercel.
- `app.v2gmidia.com.br` não resolveu no DNS nesta consulta. Vercel informou DNS externo, NS `b.sec.dns.br`/`c.sec.dns.br`, ausência de CNAME/A e `misconfigured=true`.
- Destino preferido retornado para o projeto: CNAME app → `dd78efba83f6f629.vercel-dns-017.com.`. Ainda não criado; revalidar antes do ato. Sem alteração de raiz/LP/nameservers/e-mail ou compra de domínio.
- Nenhuma consulta ao banco produtivo, configuração, segredo, DNS, alias, migration ou publicação foi feita.

O fechamento produtivo ainda exigirá conferir a base e configuração comercial, além de ensaio financeiro real especificamente autorizado. Abertura de domínio não autoriza ligar pagamentos ou expor contratação na LP.

## 4. Plano e evidência

Sete células existentes reconciliadas: Visão geral `C6:D6`, `F6`; Novembro — execução `I2:L2`. Prova QA registrada como concluída no recorte correto; comercial inteiro continua Em andamento pela abertura produtiva pendente. Notas anteriores, formatos, validações, demais prioridades e estados preservados. Não reabrir o piloto operacional neste bloco.

Evidência privada: `C:/Users/victo/.codex/private-backups/v2g/comercial-acesso-validado-20261110/comprador-no-negocio.png`; backup das células anteriores em `plano-antes.json`. O Início mostra dados da própria V2G; não confundir com outra conta/anunciante ou nova conferência de paridade Meta. Aba do resultado preservada para Victor.

Arquivos documentais anteriores mantidos. Sem nova cobrança, e-mail, conta, senha, permissão, dado de anunciante, Meta, n8n, produção, commit, push ou deploy. Parada antes do ato produtivo do domínio.
