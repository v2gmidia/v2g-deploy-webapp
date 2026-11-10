# Plano do piloto reconciliado — 10/11/2026

## 0. Resultado

**A Visão geral e a execução de novembro agora refletem as provas já concluídas na QA.** Cadastro operacional, leitura Meta, gráfico, revisão/retorno e histórico não aparecem mais como trabalhos ainda por implementar. Rodada assistida, aceite, marca/material e confirmação da publicação continuam pendentes.

- Planilha: `https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit`.
- Abas: **Visão geral** (`2026110801`) e **Novembro — execução** (`2026110403`).
- **63 células alteradas**, com releitura de **67 alvos**, incluindo quatro valores já iguais ao esperado.
- Preservados: notas anteriores, formatos, estrutura, tabela nativa, restrições, cabeçalhos, datas planejadas, demais frentes e abas históricas.
- Backup privado anterior: `C:/Users/victo/.codex/private-backups/v2g/plano-20261110/celulas-antes.json`.

Sem mudança de produto, testes repetidos, banco, produção, Meta, permissão, commit, push ou publicação nesta execução. O ciclo avançou uma tarefa independente da resposta de Cauã.

## 1. O que foi corrigido

| Área | Atualização |
| --- | --- |
| Visão geral — etapa 3 | Cadastro operacional 9/9 validado na QA; custo/lucro retirados da entrada. Marca/material e reunião continuam separados. |
| Etapas 4 e 7 | Leitura Dúú e números/gráfico disponíveis. Cobertura parcial 1/10 e ausência de rodadas preservadas. |
| Etapas 5 e 6 | Decisão de Cauã e retorno da peça à Piligrin comprovados. Publicação dessa versão ainda exige conferência. Nome e teto preservados. |
| Etapa 8 e marcos | M1/M2 descrevem a prova QA existente; M3/M4 continuam sem aceite. Próxima prova é rodada assistida, com limites e evidência. |
| N26-01 a N26-08 | Dependências, estado, ambiente, fonte e próximo ato atualizados no escopo comprovado. Compra pública continua com prova própria; piloto não precisa refazer compra. |
| Git do backend | Publicação por pacote distinguida do registro Git. Correção do histórico permanece local na candidata até conferência por Victor. |

Na tabela nativa `PlanoNovembro`, Estado aceita: **Planejado, Em andamento, Bloqueado, Local, QA, Produção, Operando, Concluído**. A primeira gravação manteve frases longas no Estado, como já havia na planilha; a inspeção nativa revelou a lista da tabela. Os oito estados de N26-01 a N26-08 foram então ajustados para **QA** ou **Em andamento**, mantendo as explicações em Ambiente/Dependência/Evidência/Próximo ato e nas notas. A releitura final confirmou os valores, e a página recarregada deixou de exibir o aviso de entrada inválida observado no estado intermediário.

## 2. Verificação e limites

As células foram relidas antes da escrita; não havia mudanças concorrentes. Notas mantêm o conteúdo anterior e receberam valor anterior, data e fontes da reconciliação. Após a escrita, foram comparados os 67 valores esperados, notas anteriores e formatos: conferem. O conjunto final contém 63 células diferentes da cópia inicial.

Fontes relidas: `n26-historico-publicado-qa-09-11.md`, `n26-onboarding-duu-validado-piligrin-qa-09-11.md` e `n26-agencia-publicada-validacao-piligrin-qa-09-11.md`. Esta execução atualiza o plano com essas provas; não realiza uma nova auditoria independente da Meta ou do banco.

Apresentação nativa conferida a 100% nas duas abas. Visão geral mantém as sete colunas, textos quebrados e marcos legíveis. Na execução técnica, as dimensões e linhas fixas existentes foram preservadas; textos extensos continuam exigindo a barra de fórmulas/notas e rolagem horizontal. Não se declara uma reformatação integral da aba técnica. Capturas privadas em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/plano-reconciliado-10-11/`.

## 3. Próxima prova do piloto

1. **Cauã:** confirmar data desta versão da arte no AD 01 `52570262604075`. Pedido já entregue; sem nova cobrança nesta execução. Uma data de campanha não comprova a entrada da imagem.
2. **Victor/Cauã:** conferir materiais e cores do Dúú. Não escolher ou aprovar identidade por aproximação nem concluir reunião sem fonte.
3. **Central:** usar somente versão/negócio/conta/data comprovados para preparar o registro; identidade do operador precisa ser a sessão legítima. Não fabricar a declaração do gestor.
4. **Victor + Cauã:** combinar a rodada assistida, seus limites e atos específicos. O teto salvo e a aprovação da peça não autorizam publicação ou gasto por consequência.
5. **Central:** depois do ato autorizado, conferir retorno ao cliente e resultado com fonte/período/cobertura; registrar aceite ou bloqueio com dono. M3/M4 não são concluídos por este checklist.

A recorrência continua útil para as frentes independentes autorizadas. Não há repetição de testes ou consultas já concluídos neste ciclo. Quando duas execuções seguidas não trouxerem mudança verificável, ou o escopo ficar inteiramente dependente de decisão humana, interromper os ciclos conforme a instrução vigente.
