# Mesa do gestor — contrato de leitura para a próxima integração

Referência de implementação: `lib/gestor/painel.ts` e `components/gestor/mesa/`. Em 20/10 a interface nova está somente na demonstração local; este documento não afirma existência de uma API para esses dados.

## Identidade e escopo

O futuro carregador obtém o usuário no servidor, resolve os IDs de negócios/contas autorizados e limita as consultas antes de buscar os detalhes. `id` na view é chave estável; não é autorização. O vínculo real precisa preservar `business_id`, conta de anúncios, campanha e anúncio/criativo, sem união por nome. O papel global `operador` atual não pode ser concedido a agências como atalho.

## Entrada necessária por conta

| Bloco | Informação e origem a conferir |
|---|---|
| Identidade | Negócio, conta de anúncios, responsável atribuído e canal. IDs internos e externos explicitamente vinculados. |
| Recorte | Início/fim, fuso da conta, moeda, atualização da fonte e completude/paginação. Comparativo com janela consecutiva de igual duração. |
| Métricas diárias | Gasto em centavos, impressões, cliques **no link** e contagem de um resultado definido para o objetivo. Toda leitura Meta pelo `backend_v2g`. |
| Resultado | Nome do evento, objetivo e janela de atribuição. Conversa, lead e compra são tipos diferentes. Não somar resultados heterogêneos. |
| Frequência | Frequência agregada da fonte para a janela selecionada. Não somar alcance diário nem calcular média simples de frequências. |
| Orçamento | Teto aprovado por conta e competência, origem da aprovação e gasto do mês completo até a data de referência. Período de sete dias não substitui o mês. |
| Cobrança | Modalidade real pré/pós-paga e data da consulta. Saldo disponível e valor em aberto são campos diferentes; ausente continua desconhecido. |
| Criativos | Vínculo anúncio–peça–campanha–conta–negócio, status da fonte, miniatura permitida e métricas no mesmo recorte. |
| Metas | Custo máximo por tipo de resultado, CTR/frequência aplicáveis e amostra mínima, com origem, versão e responsável pela definição. As metas do fixture são ilustrativas. |

O tipo atual é restrito a BRL e imagens no destino WhatsApp da demonstração. Não renomear uma moeda estrangeira como BRL nem adaptar outros objetivos apenas trocando o rótulo.

## Regras que a interface já exercita

- CPC, CPM, CTR e custo por resultado são razões dos totais, não médias das taxas diárias.
- Denominador zero, receita sem fonte e base anterior zero resultam em desconhecido, sem custo/ROAS/variação fictícios.
- Leitura indisponível, antiga ou com dias duplicados/ausentes não permite avaliação verde.
- Gasto, restante e ritmo mensal exigem cobertura de todos os dias do mês até a referência.
- O ritmo linear com tolerância de 20% e cobertura de saldo por dois dias são regras demonstrativas para visualizar o mecanismo, não políticas aprovadas de gestão.
- Cada sinal informa o motivo e o próximo passo para investigação. A interface não executa a sugestão.
- O ranking não classifica uma peça como saudável sem custo, meta e amostra suficientes.

## Aceite da ligação com dados reais

1. Escolher um piloto interno autorizado e mapear o que o backend realmente devolve; registrar lacunas sem inventar endpoints ou campos.
2. Carregar somente as contas liberadas para o usuário. Validar duas contas e negação fora da carteira, inclusive actions/arquivos, antes de acesso externo.
3. Conferir gasto, resultado, tipo de clique, frequência e atribuição no mesmo recorte da fonte; medir atualização e paginação.
4. Confirmar orçamento e modalidade de cobrança separadamente. Falha parcial permanece visível.
5. Percorrer carteira → análise → criativo com sessão real e conferir IDs, período preservado e valores.
6. Só depois ligar o componente à rota autenticada. Relatórios, agenda, WhatsApp e execução de campanhas pertencem a blocos posteriores.
