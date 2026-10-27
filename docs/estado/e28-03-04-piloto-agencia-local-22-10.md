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

## ORIGEM DA MARCA PARA GERAÇÃO — BLOCO LOCAL DE 26/10/2026

### Decisão humana recebida pelo Central

O primeiro contexto de criação combina a identidade própria confirmada do cliente com uma referência pública da Biblioteca de Anúncios. Pinterest fica fora deste contexto inicial. A referência pública orienta composição e linguagem; não transfere direito de copiar ou incorporar a imagem de terceiro.

Esta decisão foi registrada aqui para evitar disputa no `docs/decisoes.md` enquanto 05/06 e 07/08 trabalham no mesmo checkout. O Central precisa reconciliá-la posteriormente no arquivo de decisões. Nenhum arquivo das frentes 05/06 ou 07/08 foi alterado por este bloco.

### Correção local aplicada

- a tela informa antes dos seletores que guardar logo ou foto não autoriza envio para IA; a autorização será pedida separadamente ao solicitar uma peça;
- uploads novos de logo, fotos tipadas, variações de logo e guia PDF passam a gravar em `creatives.copy.origemMaterial`:
  - `versao: 1`;
  - `origem: "upload_cliente"`;
  - `sha256` dos bytes efetivamente recebidos pelo servidor;
  - `registradoEm`;
  - `finalidadeDoUpload: "identidade_visual"`;
- o objeto de proveniência não contém autorização, pessoa autorizadora, destino de modelo ou permissão de gasto;
- arquivos legados continuam legíveis. Ausência de `origemMaterial` não é preenchida por inferência e permanece pendência antes de geração;
- o bloco `variacao_logo` passou a se apresentar somente como outras versões do logo. Fachada, ambiente e produto precisam do fluxo que registra `copy.identidade.tipoFoto`.

### Contrato exato de handoff para 05/06

Paleta confirmada:

```text
businesses.id
businesses.onboarding.marca.coresConfirmadas[]
businesses.onboarding.marca.em
businesses.onboarding.marca.aparenciaNaoSei = false
```

Material próprio elegível:

```text
creatives.id
creatives.business_id = businesses.id
creatives.uso = logo | identidade
creatives.storage_path começa com identidade/{business_id}/
creatives.created_at
creatives.arquivado_em = null
creatives.copy.origemMaterial.versao = 1
creatives.copy.origemMaterial.origem = upload_cliente
creatives.copy.origemMaterial.sha256
creatives.copy.origemMaterial.registradoEm
creatives.copy.origemMaterial.finalidadeDoUpload = identidade_visual
creatives.copy.identidade.tipoFoto = fachada | ambiente | produto, quando uso = identidade
```

`uso=referencia` com `type=variacao_logo` não entra automaticamente como foto própria nem como referência pública da Biblioteca.

Autorização separada exigida antes do gerador:

```text
imagemId
businessId
finalidade = geracao_imagem
autorizadoEm
autorizadoPor
revogadoEm = null
```

O upload não preenche nenhum desses campos. No contrato atual, somente o perfil autenticado dono do negócio pode solicitar a peça; agência ou operador precisam de autorização própria futura, não de inferência por acesso ao painel.

### Handoff para 07/08

07/08 precisa fornecer a fonte persistente e auditável da autorização separada, ligada ao `business_id`, ao ID e SHA-256 do material, à finalidade e ao destino do gerador. Também precisa conferir os bytes privados contra o hash antes do envio. A origem pública deve guardar ID/link canônico da Biblioteca, data observada, revisão e condição de uso; não deve copiar a imagem do anúncio por estar pública.

### Prova e limites

- proveniência e aviso: **4/4**;
- preservação do onboarding: **72/72**;
- tipo declarado de foto: **2/2**;
- seleção segura da marca: **12/12**;
- loader da marca pela sessão: **6/6**;
- `pnpm typecheck`: passou.

`pnpm conferir:identidade` ficou em **5/6** por um achado não declarado em `app/(protected)/criativos/imagem-gerada/[requestId]/route.ts`, arquivo simultâneo da frente 05/06. A falha não aponta para os arquivos alterados neste bloco e não foi corrigida aqui para respeitar o recorte.

Não houve migration, banco, fixture remota, QA, produção, chamada de IA, gasto, Meta, commit, push ou deploy.
