# N26 — M3/M4, FigJam e pacote local QA — 10/11/2026

## 0. Próximo ato e dependências

**O pacote local está pronto para Victor conferir, commitar e enviar somente à QA. Não foi publicado neste bloco. M3 e M4 continuam abertos.**

| Frente | Responsável | Próxima ação | Prova de saída |
|---|---|---|---|
| Retorno entre Início e Anúncios | Victor / Central | Commit/push QA dos cinco arquivos de produto/teste abaixo; conferir versão publicada | Início Dúú → Anúncios → resumo mantém cliente, conta, período e filtros da carteira |
| M3: rodada assistida | Victor + Cauã | Combinar limites e atos; completar marca/material; seguir o roteiro existente | Rodada real autorizada, com fonte, período, decisão e retorno rastreáveis |
| Publicação da arte | Cauã | Responder quando esta versão entrou no AD 01 52570262604075 | Versão, anúncio, data e origem suficientes; confirmação pela sessão legítima do gestor QA |
| M4: aceite do piloto | Victor + Cauã | Avaliar o resultado após a prova publicada e a rodada | Aceite ou bloqueio explícito; nenhum aceite automático |
| Entrada dos demais clientes | Victor | Informar a lista oficial com anunciante e agência responsável | Identidades e ativos exatos, percurso direto ou via agência, dono e pendência por cliente |

Não houve migração, escrita de cadastro, alteração de permissões, confirmação fictícia, publicação de anúncio, alteração de verba, cobrança, commit, push ou deploy. Produção não foi alterada. A recorrência noturna anterior permanece encerrada.

## 1. Pedido e entregas

Victor pediu atualizar o Figma conforme a planilha, conferir resposta do Cauã e avançar M3/M4 para estruturar a entrada dos clientes e liberar seu foco comercial. Foram feitos atualização documental externa, percurso autenticado de leitura na QA e correção local de um defeito concreto desse percurso.

### Figma / FigJam

- Quadro existente: https://www.figma.com/board/Ofzj9dZqeSbqN5Uq0jZLVI
- Atualizados 26 nós de texto/forma editáveis, incluindo novembro e o passo a passo do piloto; três desses nós foram refinados após encontrar o defeito do retorno.
- M1/M2 aparecem comprovados na QA. M3/M4 continuam condicionados à validação publicada, rodada e aceite. Publicação da arte permanece em conferência.
- Histórico de outubro e fluxo comercial separado preservados. Textos e limites visuais conferidos; não foi criado um novo arquivo nem substituído o quadro por uma imagem.
- Backup privado anterior: `C:/Users/victo/.codex/private-backups/v2g/figjam-20261110/quadro-antes.json`.

### Planilha

Plano existente: https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit

- Onze células existentes de Visão geral e Novembro — execução reconciliadas; notas/histórico e formatos anteriores preservados. N26-09 passou de Planejado para Em andamento pela preparação do inventário, não por clientes migrados.
- Criada a aba **Entrada de clientes**, com tabela nativa e etapas: Identificar, Preparar QA, Piloto QA, Aguardar aceite, Aceito QA.
- Vinte e uma células novas verificadas. Dúú/Piligrin está como piloto QA; FamFire/Piligrin está como Identificar, conforme implantação posterior já registrada. Não há cliente novo cadastrado neste bloco.
- Lista oficial dos demais clientes solicitada a Victor. Busca de arquivos e registros de coordenação não forneceu uma relação atual suficiente para cadastrar outros.
- Backup privado: `C:/Users/victo/.codex/private-backups/v2g/plano-20261110/m3-m4-antes.json`.
- Valores, notas, estados e estrutura nativa conferidos após a escrita. Cabeçalho ajustado para contraste legível e apresentação final inspecionada. Nenhuma notificação condicional foi ativada.

## 2. Cauã: leitura atual e limite

Conferência no WhatsApp em 10/11, aproximadamente 15:12–15:17 BRT:

- Grupo de gestores: pedido pertinente de 09/11 às 22:51 continua entregue, sem resposta sobre a data desta versão da arte no anúncio.
- Conversa direta: o “Beleza” de 00:19 pertence ao assunto de assinatura do contrato; não responde à data da arte.
- Nenhum pedido foi reenviado e nenhuma mensagem nova foi enviada neste bloco.

A peça segue aprovada, com retorno à Piligrin, e publicação **não confirmada**. A leitura não permite preencher a data nem registrar publicação em nome do gestor.

## 3. Pré-voo M3 na sessão Piligrin / Dúú

Percurso de leitura na QA publicada, em 10/11:

- Cadastro segue 9/9, teto de R$ 3 mil e todo o estado do Rio de Janeiro; revisão da peça e retorno ao cliente preservados.
- No recorte fechado 01–07/11, Início apresenta R$ 281,80, 26.129 impressões e 466 cliques. Gráfico diário: 45,14; 29,37; 56,56; 66,87; 28,76; 29,18; 25,92. Cobertura parcial 1/10 identificada.
- No recorte corrente 01–10/11, leituras em momentos diferentes evoluíram de R$ 434,60 / 37.350 impressões / 676 cliques para R$ 434,76 / 37.363 / 676. Não é comparação simultânea nem nova conferência independente com a BM; não foi classificado como defeito.
- Marca, na página autenticada de onboarding: logo ausente, cores indefinidas/não confirmadas e nenhum dado de marca salvo. Não houve envio ou confirmação de material.
- Histórico permanece sem rodadas V2G. Não foi criada rodada de ensaio nem campanha fictícia.

Referências do estado publicado anterior: `n26-historico-publicado-qa-09-11.md` e `n26-onboarding-duu-validado-piligrin-qa-09-11.md`. A publicação anteriormente comprovada é WebApp b6334de / backend runtime 90c134b76109; a correção abaixo ainda é local.

### Defeito reproduzido e correção local

**Antes:** no detalhe Dúú, abrir Anúncios e clicar “Ver resumo deste período” voltava à carteira da agência. O link não preservava o cliente selecionado.

**Agora, localmente:** o caminho Início → Anúncios → resumo conserva cliente, conta, período e filtros/página de retorno. “Abrir criativos” também conserva o cliente. Contexto inválido ou divergente é recusado antes de consultar métricas de outro negócio. A alteração da página Anúncios fica sob o controle QA existente; fora dele os links diretos anteriores são preservados. CSS e identidade visual não foram alterados.

Arquivos:

- `lib/agencia/contexto.ts:53`: montagem do link com recorte e conta válida.
- `components/agencia/InicioDoCliente.tsx:31`: link real de Anúncios com contexto do detalhe.
- `app/(protected)/anuncios/page.tsx:89`: conferência do contexto QA e links de retorno.
- `scripts/conferir-historico-vazio.mjs`: testes reais da página e recusas antes de métricas.
- `scripts/conferir-agencia-qa.mjs`: renderização do link real do Início.

Validação concluída após a correção:

| Conferência | Resultado |
|---|---|
| Agência + histórico | 36/36 |
| Início | 70/70 |
| Resultado | 86/86 |
| Tipos | Aprovado |
| Build | Aprovado |
| Diff sem erros de espaço | Aprovado |

Não foi executada a suíte completa do backend inalterado nem alegada prova autenticada da correção ainda não publicada. A validação publicada do novo retorno é o próximo ato após o push de Victor.

## 4. Como chegar à entrada dos clientes

**Fato do código:** `app/(protected)/inicio/page.tsx:90` monta a carteira com um único contexto; `lib/agencia/da-sessao.ts:14` resolve o negócio ativo autenticado; `lib/agencia/resumo-da-sessao.ts:7` aceita somente o negócio conferido. A apresentação de carteira não comprova uma relação persistida entre uma agência e vários anunciantes independentes. A bancada com muitos clientes não é cadastro real.

**Consequência:** não adicionar anunciantes sobrescrevendo os dados da Piligrin nem reutilizar por nome a conta, marca ou imagem do Dúú.

Estrutura proposta para o próximo bloco de preparação, ainda não implementada:

1. Inventariar a lista oficial e classificar cliente direto ou cliente atendido por agência.
2. Para cliente direto, conferir negócio próprio, acesso e ativos pelo percurso existente.
3. Para agência, preparar vínculo explícito agência → anunciante, identidade individual e escopo de conta/peça/marca por anunciante. Preservar o contexto legado até uma transição comprovada.
4. Fechar M3/M4 do piloto com Cauã e Victor; registrar aceite ou bloqueio com responsável.
5. Organizar pequenos lotes com a mesma prova e acompanhamento. Entrada na QA não equivale a migração para produção.

Objetivo operacional: Cauã assumir a rotina dos clientes e Victor acompanhar pendências/decisões, com comercial como foco. Essa passagem ainda depende da prova e do aceite; não foi declarada concluída.

## 5. Evidência e preservação

Pasta privada de evidência:
`C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/m3-m4-10-11/`

- `figjam-novembro.png`: visão geral reconciliada.
- `figjam-m3-m4-final.png`: passo a passo final editável no quadro.
- `entrada-clientes-final.png`: tabela final da planilha, sem aviso sobreposto.

Os registros anteriores e alterações alheias foram preservados. Este documento acrescenta o estado do bloco; não reescreve os checkpoints fechados.
