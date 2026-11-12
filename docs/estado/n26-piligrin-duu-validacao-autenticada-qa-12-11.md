# Piligrin → Dúú — validação autenticada concluída na QA

## 0. Resultado e próxima ação

12/11/2026. Victor concluiu o login privado da QA e autorizou conferir Piligrin, abrir o aplicativo do Dúú e validar números, gráfico, criativos e volta à carteira, sem produção.

**Roteiro positivo concluído na sessão legítima publicada.** Piligrin abre como agência, Dúú permanece identificado como anunciante e as quatro telas conferidas funcionam no recorte abaixo. A pendência de login deste bloco está resolvida. Nenhuma correção de código foi necessária; não existe novo push de produto exigido por esta validação.

O aplicativo do Dúú ficou aberto no navegador interno da QA, no período conferido, para o aceite visual de Victor. A produção permanece fora do bloco. O aceite do piloto inteiro e a confirmação humana de publicação da arte não são inferidos por esta validação.

## 1. Ambiente, identidade e preservação

- Alias: `https://v2g-webapp-qa.vercel.app`.
- Projeto: `v2g-webapp-qa`, `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- Deployment: `dpl_3ATyTy9fVYRUUTfunu9rPCqyE6qF`, READY, branch QA.
- Commit publicado: `60b4114404495147d80c2df679b9cac02da7338d`.
- Victor autenticou o acesso. No seletor oficial foi escolhido **Piligrin**, cadastro `9cb85308`, sem impersonação, token criado, alteração de papel ou ampliação de acesso.
- Dois negócios comparados antes/depois por fingerprint da linha inteira: **2/2 idênticos**. Revisões do Dúú: **1 → 1**; confirmações de publicação: **0 → 0**. As consultas administrativas foram somente leitura na QA.

Resultado estruturado: [`../qa/agencia-entrada-minima-11-11/piligrin-autenticado-12-11.json`](../qa/agencia-entrada-minima-11-11/piligrin-autenticado-12-11.json).

## 2. Roteiro publicado executado

| Passo | Resultado observado |
|---|---|
| Selecionar Piligrin | Abre Início da carteira, com cabeçalho **Piligrin · Agência** |
| Abrir `/onboarding` na entrada administrativa | Retorna ao Início da carteira, sem pedir respostas ou criar cadastro |
| Buscar Dúú e marcar pendências | Busca **Dúú** e filtro **Somente com pendências** mostram a linha do Dúú e permanecem no retorno |
| **Abrir aplicativo** | Abre o detalhe com cabeçalho **Piligrin / Dúú Gomes**, conta Meta e dados operacionais próprios |
| Trocar período pelo formulário real | 01–07/11/2026 aplicado, mantendo cliente, busca e pendências |
| Início e gráfico | Totais conferidos com a soma dos sete dias; tabela diária acessível; cobertura parcial explícita |
| Anúncios | Mesma conta, cliente e período; campanha observada confere com Início. Link de retorno ao resumo mantém período/conta/filtros |
| Histórico | Mensagem correta de ausência de rodadas da V2G coexistindo com campanhas e resultados Meta |
| Criativos do Dúú | Uma peça aprovada, imagem carregada e ampliação correta, responsável Cauã Carlos e publicação ainda em conferência |
| Criativos da agência | Peça identificada como Dúú na fila da carteira; **Abrir no cliente** abre a revisão exata solicitada |
| Volta à carteira | Breadcrumb **Piligrin** retorna com `busca=Dúú` e `pendentes=1`; os controles continuam preenchidos e há uma linha no filtro |
| Atualizar a carteira | Retomada preserva busca, pendências e contexto da agência; Dúú pode ser reaberto |

## 3. Conferência dos números e do gráfico

Conta `act_1165478988908157`, período **01–07/11/2026**, moeda BRL, fuso America/Sao_Paulo. A interface informa Meta Marketing API como fonte, via backend. Consultas observadas às 12:56–12:57 de 12/11/2026, Brasília.

| Medida | Início | Campanha em Anúncios | Soma dos dias do gráfico |
|---|---:|---:|---:|
| Investido | R$ 281,80 | R$ 281,80 | R$ 281,80 |
| Impressões | 26.129 | 26.129 | 26.129 |
| Cliques totais | 466 | 466 | 466 |

| Dia | Investido | Impressões | Cliques |
|---|---:|---:|---:|
| 01/11 | R$ 45,14 | 4.454 | 88 |
| 02/11 | R$ 29,37 | 4.161 | 54 |
| 03/11 | R$ 56,56 | 3.538 | 49 |
| 04/11 | R$ 66,87 | 5.696 | 112 |
| 05/11 | R$ 28,76 | 2.654 | 61 |
| 06/11 | R$ 29,18 | 3.188 | 47 |
| 07/11 | R$ 25,92 | 2.438 | 55 |

Campanha com medição: **[E - ABO - WHATSAPP] ESCALA 22/06/2026**, ID `52570261860675`. O conjunto apresenta o mesmo total; não é somado novamente ao resumo. No nível dos anúncios, AD 01 `52570262604075` mostra R$ 265,96 / 25.025 / 444 e AD 02 `52598499207075` mostra R$ 15,84 / 1.104 / 22. Os dois anúncios fecham no total da campanha sem misturar os níveis.

**Limite da prova:** leitura parcial, uma de dez campanhas com observação. Conversas continuam **Não medido**. A conferência prova consistência entre as telas e os dados diários apresentados; não é auditoria independente da BM, medição de vendas ou confirmação de entrega atual. Todos os sete dias deste recorte têm observação; os testes de lacunas não foram repetidos sem nova falha.

## 4. Criativo, dados operacionais e publicação

- Arquivo: `WhatsApp Image 2026-11-09 at 10.23.29.jpeg`.
- Prévia carregada, dimensão natural **1254 × 1254**. A ampliação mostrou a arte do Dúú enviada por Victor, sem novo upload.
- Revisão aberta pela fila: `0b22f424-f70b-457f-845e-c37bb50ddb5f`, selecionada explicitamente por `peca=revisao-...`; não foi substituída por outra imagem.
- Tela mantém agência **Piligrin**, anunciante **Dúú Gomes**, responsável **Cauã Carlos**, teto mensal **R$ 3.000** e atendimento **Todo o estado do Rio de Janeiro**.
- Estado preservado: peça aprovada pelo gestor, **publicação em conferência / ainda sem confirmação de publicação**. Não foi registrada confirmação em nome do gestor nem alterado esse estado com base apenas nos números de AD 01.
- A pendência preexistente de conferência da reunião continua conforme os dados salvos. Não foi agendado ou confirmado evento neste bloco.

Captura da sessão autenticada, sem credenciais ou URL de arquivo assinada: `C:/Users/victo/.codex/private-backups/v2g/agencia-entrada-qa-20261111/piligrin-duu-inicio-autenticado-12-11.jpg`.

## 5. Fechamento

Entrada administrativa, carteira, detalhe, números, gráfico, anúncios, criativos e retorno **validados na QA publicada**. As negativas de isolamento entre titulares foram comprovadas no acompanhamento anterior da mesma revisão; não foram repetidas sem mudança.

Nada de produção, banco, migração, senha, permissão, credencial, verba Meta, cobrança, envio/revisão nova, geração de peça, anúncio, backend, commit, push ou deploy foi alterado. Apenas seleção/navegação e filtros da própria sessão autorizada. Este bloco não promove produção nem encerra automaticamente M3/M4 ou a etapa comercial.
