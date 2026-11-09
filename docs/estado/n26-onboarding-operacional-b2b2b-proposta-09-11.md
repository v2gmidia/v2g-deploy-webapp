# Onboarding operacional — decisão de produto e proposta — 09/11/2026

## 0. Decisão e estado

**Atualização posterior:** Victor autorizou a implementação desta proposta; a candidata local foi implementada e testada, pronta para commit/push manual somente nos destinos QA. Ver [registro de implementação e limites](n26-onboarding-operacional-implementacao-qa-09-11.md). O texto abaixo preserva o estado do bloco de proposta; não é a declaração de estado atual do produto publicado.

Victor determinou rever o onboarding: **custo direto e lucro desejado ficam fora da entrada inicial**. Não manter essas perguntas como etapa opcional escondida, nem exigir a mesma conta financeira com outra redação. Desconhecimento não vira zero, estimativa automática ou motivo para impedir cadastro operacional/leitura de campanhas.

**Este bloco é mapeamento e proposta. Nenhum código de produto, banco, pipeline, configuração ou ambiente foi alterado.** Teto de R$ 3 mil já salvo na QA e validação dos números/gráfico permanecem preservados. O sistema publicado ainda possui as exigências antigas; a decisão não foi confundida com sua implementação.

## Contexto confirmado por Victor

- **B2B2B deste piloto:** V2G atende a agência Piligrin; Piligrin atende/opera o anunciante Dúú Gomes. Os dados da operação anunciada são do Dúú. O acesso atual é da agência; não se cria usuário do Dúú por consequência. CRM é possibilidade futura, fora deste escopo.
- **Produto:** Dúú Gomes é indústria de chope de vinho. Foco em empresas, bares e pontos de venda; há vendas ocasionais a consumidor final.
- **Preço relatado:** aproximadamente R$ 69–70 por fardo. Possivelmente seis bebidas, mas a quantidade não foi confirmada. É relato de referência de produto, **não ticket médio de pedido confirmado**, nem base para calcular preço unitário.
- **Custo e lucro:** desconhecidos, sem obrigação de descoberta para entrar no produto. Teto de mídia: **R$ 3.000/mês**, confirmado e salvo somente na QA.
- Este modelo não transforma todo cliente em agência. O onboarding também precisa servir ao anunciante que contrata diretamente a V2G.

## Proposta de entrada

| Etapa | Pergunta ou ação | Regra |
|---|---|---|
| 1. Operação e anunciante | Quem opera e qual negócio será anunciado? | Separar contratante, anunciante e usuário com acesso. Aproveitar informações já confirmadas. |
| 2. Produto e comprador | O que você quer divulgar e quem quer alcançar? | Texto/áudio e confirmação de resumo; público prioritário pode diferir de quem também compra. |
| 3. Atendimento | Em quais cidades/regiões atende e como o interessado fala com a equipe? | Capturar atendimento/destino. Não perguntar custo da entrega. |
| 4. Oferta e materiais | Quais produtos/ofertas e materiais aprovados podemos usar? | Preço é opcional, com unidade, fonte e certeza; ausência não trava. Reusar a peça do piloto. |
| 5. Campanha e acesso | Já possui campanha ou vai preparar a primeira? Conectar/selecionar os ativos necessários. | Leitura de campanha existente não exige criar execução ou refazer anúncio. |
| 6. Teto e confirmação | Quanto pode investir por mês? Confira o resumo e os próximos passos. | Reusar o teto salvo; confirmar conta, materiais e autorizações para a próxima ação. |

O número de perguntas deve diminuir conforme o que já se sabe: no Dúú, agência/anunciante, produto, comprador prioritário, peça, conta e teto já têm fontes. O usuário confere um resumo em vez de repetir o cadastro. Região e destino do atendimento só são solicitados se não houver uma fonte válida para reaproveitar.

### O que sai e o que fica separado

- Saem do onboarding inicial as perguntas de custo por venda e lucro mínimo desejado.
- Referência de preço/unidade pode ajudar a explicar a oferta, sem obrigação de informar ticket médio.
- Cadastro operacional concluído, conexão pronta, peça revisada e autorização para publicar são estados distintos.
- Sem dados econômicos suficientes, não calcular lucratividade, retorno, CAC ou CPL-alvo por fórmula. Um eventual diagnóstico econômico futuro é outra etapa, sob demanda e com dados confiáveis; não reintroduz as perguntas na entrada.
- Gasto, impressões, cliques e demais métricas observadas permanecem disponíveis com fonte/período/cobertura. Conversas e vendas não são inferidas dos cliques.

## Divergência técnica comprovada

A documentação backend **já registrava em 17/09/2026 a retirada das duas fórmulas de CPL e das perguntas de custo/lucro**: `backend_v2g-qa-inicio/CLAUDE.md:515`; contexto em `knowledge/_central.md:78` e `src/knowledge/schema.py:148`.

O código ainda está divergente:

| Ponto | Efeito atual | Mudança que o pacote precisa cobrir |
|---|---|---|
| WebApp `lib/cadastro/montar.ts:444` e `lib/pipeline/disparar.ts:557` | Dados econômicos entram na completude e no disparo. | Separar cadastro operacional de prontidão para ações. |
| Backend `src/api/modelos.py:305` | Ticket, custo e lucro são obrigatórios no POST atual. | Contrato operacional versionado e compatível; não preencher com zero. |
| Backend `src/db/execucao.py:163` | Campos econômicos participam da completude. | Avaliar prontidão por ação, preservando os estados e dados existentes. |
| Diagnóstico `src/agentes/diagnosticar_orcamento/agente.py:38` | Taxa de conversão e fórmula antiga continuam sendo usadas. | Remover dependência da entrada operacional e impedir cálculo sem base. |
| n8n e consumidores de criação | Pipeline antigo consome a saída econômica. | Evoluir consumidores antes de encaminhar a nova entrada. Concluir cadastro não dispara criação automaticamente. |

Campos omitidos devem preservar dados existentes. `null` não é um comando implícito para apagar valores antigos; zero só representa zero informado/confirmado. Não usar origem de backfill ou mudança de status como contorno.

## Distribuição e pacote revisável

- **03 e 04:** mapa das perguntas/contas/conclusão/reunião/Início e proposta de cadastro progressivo B2B e B2B2B.
- **07 e 08:** contrato backend, completude, diagnóstico, n8n e consumidores; análise concluída na candidata QA limpa `646ab18`, sem mudanças.
- **UI/UX — Início da V2G:** identidade de `/verba` e proposta visual coerente com o novo conteúdo, sem duplicar a frente de contrato.
- **Central:** consolidar contrato, perguntas, migração dos estados antigos e testes antes do bloco de implementação. O preço do fardo permanece apenas relato com unidade/certeza; não foi gravado no ticket médio.

Critérios de aceite do pacote: cadastro sem custo/lucro; “não sei” sem zero; referência de produto distinta de ticket; preservação de respostas/arquivos/procedência; agência/anunciante/usuário isolados; leitura existente sem nova execução; criação e publicação com suas próprias guardas; backend e n8n aceitando os estados novos sem recorrer à fórmula retirada.

## Comunicação e controle

Cauã recebeu uma correção da solicitação anterior no grupo **03 | Operação — Gestores**, às **12:37 BRT**: não precisa levantar custo/lucro nem preencher zero para avançar; a trava do aplicativo ainda será corrigida. Teto e revisão da peça continuam separados. Estado observado na conferência final: **Entregue**; isso não comprova leitura nem decisão dele.

Planilha atualizada nas abas **Visão geral** e **Novembro — execução**: releitura de **13/13 campos** conferida, com **14 células vizinhas** preservadas e histórico mantido nas notas. Conferência visual no navegador a 100% concluída, com proposta, bloqueio atual, responsáveis e próximo passo legíveis.

Evidências locais em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/piloto-duu-registro-09-11/`: `caua-onboarding-sem-custo-lucro.png`, `planilha-onboarding-proposta-visao.png` e `planilha-onboarding-proposta-execucao.png`.

Não houve nova rodada de perguntas financeiras ao cliente, mudança de verba Meta, acesso direto do Dúú, CRM, produção, commit/push ou deploy. Mapeamento não é homologação do novo onboarding.
