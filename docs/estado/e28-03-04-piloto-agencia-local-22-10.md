# E28-03-B / E28-04-B — piloto de agência com dois negócios, regressão local

**Data:** 22/10/2026  
**Ambiente:** LOCAL, testes offline com dados fictícios.  
**Estado:** cenário coberto; nenhum defeito novo encontrado; sem alteração de código.

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

Os testes usaram `node --test` com filtros de nome sobre os conferidores existentes. Rede foi proibida pelo próprio teste de sessão; não houve banco, fixture remota, Meta, Google, n8n, QA, produção, build, deploy ou migração. A suíte completa não foi repetida porque não houve mudança de código nem risco novo de runtime.

Arquivos de código permanecem inalterados por este bloco. Foram modificados somente o delta operacional do playbook e este checkpoint. Alterações simultâneas de outras frentes no checkout foram preservadas.
