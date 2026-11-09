# Piloto Dúú/Piligrin — ficha para a primeira rodada assistida — 08/11/2026

## 0. Estado e próximo ato

**Preparação documental, sem execução da rodada.** Dúú Gomes é o primeiro anunciante atendido pela Piligrin no piloto QA, com Victor e Cauã juntos na primeira rodada. FamFire vem depois. Não pedir outra escolha de piloto, criar compra ou pedir novos prints da Mesa. Fonte: `docs/decisoes.md:26-30`; `docs/estado/piloto-piligrin-caua-05-11.md:127-132`.

**Próximo ato operacional concreto:** Victor e Cauã fazem um pré-voo do Dúú, cada um em sua sessão. A campanha, o conjunto e dois anúncios ligados já foram identificados na Meta pela Central; na sessão, Cauã escolhe com Victor **qual anúncio/peça** entra na primeira revisão, e os dois registram a fonte de aprovação da peça, o teto de verba e os limites da atuação. Cauã abre Piligrin na Mesa QA e a CA Dúú na Meta; Victor confere o vínculo Piligrin → CA/Página no QA. Se faltar qualquer aprovação ou se os IDs divergirem, a saída é uma pendência com dono, sem editar/publicar campanha. O pré-voo prova identidade, fonte e escopo documentados antes de uma decisão operacional. **Não prova métricas no app, decisão persistida nem anúncio novo no ar.**

## 1. Comprovado e limite da prova

| Item | Prova disponível | Limite |
| --- | --- | --- |
| Piloto e papéis | Victor escolheu Piligrin titular, Dúú primeiro anunciante, Cauã gestor V2G e primeira rodada conjunta (`docs/estado/piloto-piligrin-caua-05-11.md:7-10,74-75`). | Dúú não ganhou login ou cobrança própria no QA. Não fundir agência e anunciante por nome. |
| Carteira QA | `manager_accounts` atribuiu Piligrin `9cb85308-02cc-4ce7-bacf-15be77f9ba5e` a Cauã; print da sessão dele mostrou Piligrin e “Gestor responsável: você” (`piloto-piligrin-caua-05-11.md:75,120`). | Print anterior à conexão Meta; ficha e operação após o vínculo não foram aceitas só por ele. |
| Ativos Meta | Parceria V2G Midia ↔ BM - Vinho Dúúgomes `1588304845510483`; CA - Dúú Gomes `act_1165478988908157`, Página Chopp de Vinho DúúGomes `206296256098753` e Instagram `@duugomesoficial` recebidos (`piloto-piligrin-caua-05-11.md:35-37`). Victor decidiu manter acesso total **entre portfólios**, enquanto a pessoa de Cauã recebeu tarefas parciais de campanhas/desempenho, anúncios/insights (`:43-44`). | Política desta parceria é decisão específica de Victor; não deduzir que seja o padrão para outros clientes. Página/Instagram não foram mostrados separadamente na sessão de Cauã. |
| Leitura humana | Prints do navegador de Cauã mostram a CA e campanhas na Meta em 05/11 (`piloto-piligrin-caua-05-11.md:46`). Em 08/11 a Central conferiu diretamente a campanha, o conjunto e os anúncios na interface Meta, em leitura. | A leitura da Central é posterior à dos prints, mas não prova edição pelo Cauã, API, aprovação da peça nem números no WebApp. |
| Vínculo no produto | Em 06/11, QA mostrou `ad_accounts` com CA Dúú ativa sob Piligrin, `meta_connections.connected` com a Página, e `manager_accounts` de Cauã no mesmo negócio (`piloto-piligrin-caua-05-11.md:117-118`). | Conexão não comprova leitura de números nem publicação. |
| Números no app | Em 06/11, `/anuncios` falhou e a Mesa mostrou “Leitura indisponível” (`piloto-piligrin-caua-05-11.md:119,127`). A visão de 08/11 mantém o aceite de números Dúú pendente e sob a frente 05/06 + 07/08 (`docs/estado/n26-visao-geral-piloto-08-11.md:18-22`). | Não repetir diagnóstico nesta frente; aguardar o aceite próprio com fonte, conta, período, moeda e fuso. |
| Criativo/decisão | Percurso local de envio → fila de Cauã → decisão → retorno passou em 70 testes; a versão revisada e o percurso autenticado atual em QA estavam pendentes no checkpoint (`docs/estado/n26-p3-criativo-pronto-fila-caua-04-11.md:3-9`). | Não há peça Dúú, pedido de revisão ou decisão do Cauã comprovados por esse teste local. |
| GitHub | `CauaV2G` tinha leitura no WebApp e LP, sem acesso aos repositórios backend e v2gapp na consulta registrada (`piloto-piligrin-caua-05-11.md:47`). | Gestão manual não depende do backend no GitHub; desenvolvimento autônomo desses repos não está liberado. |

**Conferência limitada de 08/11 no WhatsApp Web, antes do contato novo da Central:** a busca do grupo `🎯 03 | Operação — Gestores` ainda mostrava como última mensagem a orientação enviada em 06/11 às 17:22, para não pedir mais prints e aguardar a rodada conjunta. A conversa direta `Cauã Carlos | PILIGRIN` mostrou apenas “Sim” às 12:59 de 08/11 no trecho carregado, sem contexto suficiente para provar peça, aprovação, verba ou rodada. Não foram auditados todos os grupos de clientes ou toda a conversa direta; portanto, **não afirmar inexistência global** desses itens.

**Leitura posterior da Central na interface Meta, em 08/11:** a CA `1165478988908157` mostrou a campanha ativa `[E - ABO - WHATSAPP] ESCALA 22/06/2026` (`52570261860675`) e o conjunto `Donos de bares 23-50` (`52570262603875`) com orçamento configurado de **R$ 50/dia, não compartilhado**. No recorte **01–07/11/2026, horário de São Paulo**, a interface mostrou gasto **R$ 281,80**, alcance **18.635** e impressões **26.129**. AD 01 (`52570262604075`, gasto R$ 265,96) e AD 02 (`52598499207075`, gasto R$ 15,84) estavam ligados; AD 03–07 estavam desligados. As prévias observadas são artes de revenda “Tenha DúúGomes no Seu Estabelecimento”: AD 01 com fundo de praia, AD 02 com geladeira e roxo. Fonte: leitura UI reportada no thread Central de 08/11; evidência visual da prévia AD 02 em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-08-11/ad02-previa.jpg`. **Orçamento configurado não é teto mensal aprovado**; a aprovação da peça, os limites do Cauã e a escolha da peça desta rodada seguem sem fonte comprovada.

Às **23:10 de 08/11**, a Central enviou mensagem ao Cauã no grupo de gestores e confirmou a entrega. Comprovante em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-08-11/mensagem-caua-entregue.jpg`. Não reenviar a mesma cobrança.

## 2. Ficha mínima — preencher na sessão, sem supor valores

| Campo | Estado agora | Fonte exigida para fechar |
| --- | --- | --- |
| Titular/atendido/responsável | Piligrin / Dúú Gomes / Cauã, QA | `businesses` + `manager_accounts` do mesmo `business_id`; sessão própria de Cauã. |
| Conta de anúncios | `act_1165478988908157` vinculada à Piligrin em QA | CA aberta na Meta por Cauã, nome/ID/proprietário e vínculo `ad_accounts` no QA. |
| Página | `206296256098753` conectada em QA | `meta_connections` e identidade escolhida na peça; conferir Página/Instagram na sessão dele se usados. |
| Campanha, conjunto e anúncio-alvo | Campanha `52570261860675`, conjunto `52570262603875`, AD 01 `52570262604075` e AD 02 `52598499207075` identificados na Meta; **anúncio-alvo da rodada ainda não escolhido**. | Confirmação na sessão de Cauã, estado e horário atuais; escolha explícita de uma peça para revisão. |
| Peça e versão | Prévia visual de revenda dos AD 01 e 02 vista na Meta; **versão/arquivo-fonte e aprovação desta rodada não comprovados**. | Arquivo ou URL de origem autorizada, pedido/ID e hash ou outra identificação estável; vínculo com Piligrin, Dúú, campanha e destino. |
| Objetivo, destino e período | Campanha nomeada `WHATSAPP`; recorte de leitura da Meta 01–07/11/2026. **Objetivo/destino aprovados para esta rodada não comprovados.** | Briefing/aprovação de Victor ou responsável do anunciante, com versão, data e janela de execução. |
| Verba atual e teto aprovado | Conjunto com R$ 50/dia configurados e gasto R$ 281,80 no recorte 01–07/11/2026 na Meta. **Teto mensal aprovado não verificado**. | Aprovação identificada do teto, moeda, competência e responsável; gasto do mês completo para comparar. Não multiplicar R$ 50/dia por 30 como se fosse autorização de R$ 3.000. |
| Aprovação da peça e da alteração | **Não comprovada** | Autor, canal, data, peça/versão, campanha e escopo exato da aprovação. Decisão interna de revisão não equivale a publicar. |
| Limites do Cauã | **Ainda a combinar com Victor na rodada** | Registrar quais contas, mudanças sem consulta, teto, aprovador de peça/verba/publicação, cadência e gatilhos de escalada; fonte da decisão e data. |
| Medição no app | **Pendente de 05/06 + 07/08** | Mesma CA/campanha, período, fuso, moeda, atribuição, fonte e atualização; ausência/erro não vira zero. |

## 3. Sequência curta da sessão

1. **Cauã**, com login próprio, abre `/supergestor`, localiza Piligrin e a ficha. Conferir o negócio `9cb85308-02cc-4ce7-bacf-15be77f9ba5e` contra a atribuição, sem usar credenciais de Victor.
2. **Victor e Cauã** abrem a CA Dúú na Meta, conferem os IDs acima e escolhem AD 01 ou AD 02 como peça-alvo da revisão, registrando estado e horário atuais. Se Página/Instagram forem usados na peça, Cauã confere esses ativos na sessão própria.
3. **Victor** apresenta a peça/versão, o objetivo/destino, a autorização de verba e quem pode aprovar cada ação. Cauã registra a fonte de cada item; campo sem fonte permanece **não verificado**.
4. **Ambos** decidem uma próxima ação específica: revisar peça, solicitar ajuste, manter campanha sem alteração ou preparar uma mudança. Só executar decisão no produto se o percurso autenticado QA da versão atual estiver aceito. Publicação, edição real e gasto exigem autorização nominal com IDs e limites antes do ato.
5. Fechar com um registro: `business_id`, `act_ID`, campanha/peça/versão, fonte/período, decisão, aprovador, verba/teto, próximo responsável, prazo e estado observado. Conciliar números no WebApp quando a frente 05/06 + 07/08 entregar a prova; não converter leitura humana na Meta em aceite de API.

**Saída mínima mesmo sem peça/aprovação:** ficha preenchida até os campos comprováveis, pendência explícita com dono e um único próximo ato. Isso permite avançar na preparação sem chamar a rotina de autônoma. O aceite final do piloto continua exigindo números na tela, peça/revisão do mesmo negócio, rodada assistida rastreável e limites acordados (`docs/estado/n26-visao-geral-piloto-08-11.md:20-22`).
