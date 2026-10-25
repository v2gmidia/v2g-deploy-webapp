# E28-03-B / E28-04-B — piloto de agência com dois negócios, regressão local

**Data:** 22/10/2026  
**Atualização de prova:** 25/10/2026  
**Ambiente:** LOCAL para os testes dirigidos de 22/10; QA autenticado para a navegação de 25/10.  
**Estado:** isolamento visual/autenticado entre os dois negócios aprovado no percurso testado; limites abaixo permanecem fora da prova; sem alteração de produto neste registro.

## PROVA AUTENTICADA EM QA — 25/10/2026

### V2G QA Multiconta B — FICTÍCIA

- `/onboarding` retomou em 1/9 sem misturar respostas de outro negócio;
- com respostas explicitamente fictícias, o fluxo chegou a 9/9;
- a opção “Ainda não sei” exigiu confirmação e virou pendência honesta para o gestor;
- `/onboarding/contas` aceitou três pendências numéricas sem exigir valores inventados;
- `/onboarding/marca` permitiu continuar sem arquivo, sem site e com cores pendentes;
- `/onboarding/concluido` mostrou reunião de 25 minutos e o CNPJ correto, sem declarar que existia reserva confirmada;
- não houve agendamento no Google nem envio de arquivo.

### Troca autenticada para v2g teste

- a troca foi feita pelo menu autenticado;
- `/onboarding` mostrou o CNPJ terminado em `0434` e as respostas antigas próprias desse negócio: “Cabeleleiro”, “Corte de cabelo feminino” e “Mulheres de 55 anos que moram em Copacabana”;
- nenhuma resposta fictícia de **V2G QA Multiconta B — FICTÍCIA** apareceu em **v2g teste**;
- veredito para este percurso: **PASSA — isolamento visual/autenticado entre os dois negócios**.

### Limites desta prova

- não foram testados: duas abas simultâneas, upload, agenda real, Meta e produção;
- o rótulo de CNPJ pertence ao bloco 01/02 de CPF/CNPJ e não foi usado como veredito do isolamento;
- `/inicio` ainda falha ao carregar resultados; o problema pertence à integração de dados e não invalida a prova de isolamento do onboarding;
- esta navegação comprova somente o percurso autenticado descrito acima; não comprova todos os caminhos multiconta.

## FUNCIONA HOJE

- uma sessão autorizada pode selecionar entre dois negócios sem transformar a preferência em autorização;
- pedido, perfil ou ID alheio não libera um terceiro usuário;
- ações de abas antigas de onboarding, contas e marca são negadas depois da troca de negócio;
- retomada preserva respostas, contas, procedência e blocos do negócio correto;
- reunião permanece pendente por negócio até confirmação externa verificável;
- e-mail, calendário, CNPJ e vínculo incompatíveis não confirmam reserva de outro negócio.

## FALTA PARA O CLIENTE

1. Identificar a agência/responsável e provar quem pode representar o primeiro anunciante.
2. Identificar anunciante, contratante e pagador sem presumir que são a mesma pessoa/empresa.
3. Reconciliar conta WebApp e `business_id` com a contratação histórica.
4. Inventariar portfólio, conta de anúncios, Página e ativos opcionais com ID, proprietário e uso.
5. Confirmar quem será o gestor V2G; a intenção de Cauã operar não prova vínculo ou permissão.

O segundo negócio aguarda o aceite do primeiro. A mesma conta de anúncios não é associada automaticamente aos dois.

## PRÓXIMO ATO

Victor preenche a ficha mínima da seção 15 de `docs/recebimento-cliente-meta.md` para **um** negócio. Com os campos conferidos, a próxima sessão testa apenas o acesso manual. API de leitura e API de publicação permanecem aceites separados.

## RESPONSÁVEL

- Victor: escolher o primeiro negócio e fornecer identidades/fontes mínimas por canal seguro.
- Responsável da agência/cliente: demonstrar autoridade e propriedade dos ativos.
- Gestor V2G: executar a passagem manual depois da autorização.
- 01/02: reconciliar contratação histórica e vínculo pedido/acesso quando necessário.
- 07/08: leitura e métricas somente depois do inventário/owner autorizado.

## AÇÃO MÍNIMA DE VICTOR

Informar nome cadastral da agência, pessoa autorizada, primeiro anunciante/CNPJ, contratante/pagador e fonte da contratação, conta/e-mail WebApp, gestor V2G e IDs/proprietários dos ativos efetivamente usados. Não enviar senha, token, 2FA, chave ou cartão.

## PROVA E AMBIENTE

Foram executados 22 testes dirigidos, todos aprovados:

- multiconta/elegibilidade: 5;
- sessão multiconta: 3;
- preservação do onboarding: 6;
- pendência onboarding/Início: 4;
- conciliação de reunião: 4.

Os testes locais usaram `node --test` com filtros de nome sobre os conferidores existentes. Rede foi proibida pelo próprio teste de sessão; nessa etapa local não houve banco, fixture remota, Meta, Google, n8n, QA, produção, build, deploy ou migração.

Em 25/10 houve também a navegação autenticada em QA registrada acima. Ela não incluiu escrita na Meta, agenda real, upload, produção, build, deploy ou migração. A suíte completa não foi repetida nesta atualização porque o bloco alterou somente documentação e não introduziu risco novo de runtime.

Arquivos de código permanecem inalterados por esta atualização de 25/10. Foi modificado somente este checkpoint; alterações simultâneas de outras frentes no checkout foram preservadas.
