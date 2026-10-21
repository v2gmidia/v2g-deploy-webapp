# Mesa do gestor — carteira e análise pelas referências (20/10/2026)

## §0. Falta e depende de integração

- A nova mesa está em `/exemplo/mesa-gestor`, com dados inteiramente sintéticos. `/supergestor` continua com a carteira operacional anterior; esta entrega não liga métricas reais nem conclui a etapa 05.
- Próximo bloco: mapear a resposta real do backend por conta/período e construir o carregador autorizado. Contrato e aceite em `docs/mesa-gestor-contrato-leitura.md`.
- Metas por conta, amostra, regras de saldo e ritmo ainda precisam de definição operacional real. As regras do exemplo não são uma política aprovada de automação.
- Acesso de agência exige os vínculos persistentes e isolamento já documentados. Agenda, relatórios WhatsApp, histórico de decisões e execução de campanhas ainda não foram implementados neste bloco.

## Direção autorizada

Victor rejeitou a primeira prévia por ser simples demais, forneceu dez prints e a transcrição da demonstração e aprovou começar com extrema importância de seguir essas referências. O recorte preserva a identidade V2G e reproduz a estrutura de trabalho mostrada: visão conjunta, abertura da conta, orçamento, análise temporal e detalhamento dos criativos.

## Feito localmente

| Referência do usuário | Recorte navegável |
|---|---|
| Visões tabela/cartões de várias contas | Oito contas fictícias, prioridade, busca por nome/conta/responsável, quatro filtros de situação, ordenação e alternância tabela/cartões. |
| Resultado, custo, saldo e cobrança | Tipo de resultado explícito, custo/variação, CTR/CPC, gasto/teto do mês e distinção pré-pago disponível × pós-pago em aberto. |
| Análise do cliente | Seis indicadores, orçamento mensal/restante/ritmo, fonte/data e sinais expansíveis com motivo e próximo passo. |
| Séries e comparação | Gráficos de resultado, custo por resultado e gasto diário, valores em tabela acessível; 7/14/30 dias e janela anterior equivalente. |
| Ranking das peças | Miniaturas vetoriais ilustrativas, gasto, impressões, CTR, resultados, custo e leitura por peça. |
| Dia da semana e benchmark | Quebra semanal com média por ocorrência, comparativo e 25 indicadores com aplicação/dependência explícitas. |

## Código e limites

- Componentes reutilizáveis em `components/gestor/mesa/`; contrato e cálculos puros em `lib/gestor/painel.ts`. Não há consultas, credenciais ou ações Meta nos componentes.
- Fixtures ficam em `app/exemplo/mesa-gestor/dados-demonstracao.ts`, importados somente depois do guard de desenvolvimento. Nenhum material ou dado real de cliente foi usado.
- Ausência não vira zero ou verde; alcance/frequência não são somados. A receita não medida não é apresentada como ROAS zero.
- A revisão de acabamento encontrou duas quedas indevidas para verde no ranking/orçamento. Corrigidas com `estadoDoCustoMesa` e `estadoDoRitmoMesa`, também usados pelos testes.
- Substituída a prévia antiga e removida somente sua folha `Previa.module.css`, agora sem consumidor. O conteúdo anterior permanece recuperável no histórico do chat; nenhum dado de cliente foi apagado.

## Verificação

- `pnpm typecheck` passou durante o bloco. O build final de produção, incluindo a conferência TypeScript após as correções da revisão, também passou. O build exigiu rede para obter Archivo do Google Fonts; não houve publicação. Servidor de desenvolvimento reiniciado após o build.
- Testes do painel: 10 passaram, zero falhas. Cobrem médias ponderadas, denominadores ausentes, datas, mês incompleto, amostra, cobrança pós-paga, ausência de fonte, soma das peças e os estados de custo/ritmo corrigidos na revisão.
- Navegador: busca com/sem resultado, filtros, cartões, detalhe, retorno, troca de período, três criativos, sete dias da semana, oito comparações e 25 indicadores conferidos.
- Capturas desktop 1440, navegador 1280 e mobile 390 em `.impeccable/review/mesa-*.png`. Tabelas usam rolagem local no celular. A captura mobile foi delimitada ao viewport para excluir a camada lateral de comentários do navegador.
- Em execução do build: `/exemplo/mesa-gestor` retornou 404; `/supergestor` sem sessão retornou 307 para o login. No desenvolvimento, a prévia retorna 200.
- Revisão independente de acabamento: aprovada para entrega e revisão da demonstração local, sem bloqueio material restante nesse recorte. Não certifica integração, autorização real ponta a ponta ou produção.

Sem commit, push, deploy, migração, acesso concedido, chamada paga ou escrita na Meta.
