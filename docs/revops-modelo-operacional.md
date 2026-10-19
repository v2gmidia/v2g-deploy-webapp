# RevOps V2G — modelo operacional para revisão

Estado: proposta local de 18/10/2026. Este documento não altera o contrato de
dados da V0, não aplica migration e não define automaticamente políticas ainda
abertas.

## 1. Fontes e força de cada afirmação

- **Decisão V2G:** somente o que está registrado em `docs/decisoes.md` ou já
  implementado e descrito em `docs/revops-v0.md`.
- **Princípio da aula:** orientação extraída da transcrição fornecida por Victor
  de [AULA DE REVOPS: O básico bem feito que você deveria estar fazendo](https://youtu.be/aPVP2EizS1Q).
- **Proposta:** aplicação do princípio à V2G que ainda depende de revisão.
- **Pendente:** definição que não pode ser preenchida com exemplo da aula,
  opinião do agente ou média de mercado.

A afirmação da aula de que os SLAs apresentados reduziriam 90% da fricção é uma
fala do autor, não uma meta nem resultado esperado da V2G. A sugestão de vender
fora do ICP em troca de contrato maior ou serviço de ativação também não é uma
decisão da V2G.

## 2. Regra comum para etapas e gatilhos

Uma **etapa** descreve o objetivo que a equipe responsável consegue executar.
Um **status** descreve uma condição que pode depender de outra pessoa. Um
**gatilho de saída** é um fato observável da contraparte ou de uma fonte
competente que aumenta a evidência de avanço.

Exemplos de status que não devem virar etapa: “aguardando resposta”, “proposta
em maturação” e “esperando retorno”. Eles podem aparecer como estado auxiliar,
com próximo passo, responsável e data, sem inflar o funil.

| etapa operacional | objetivo da equipe | gatilho de saída verificável | estado da definição |
|---|---|---|---|
| Captar interesse | preservar origem e criar oportunidade por negócio | `interest_registered` ligado à referência de fonte | decidido e implementado localmente na V0 |
| Fazer descoberta | obter contexto suficiente antes de apresentar solução | critérios de descoberta aceitos pela contraparte | **proposta**; checklist ainda não definido |
| Qualificar oportunidade | conferir requisitos vigentes sem forçar dado ausente | CNPJ e venda por WhatsApp declarados; limites restantes pendentes | decisão parcial |
| Apresentar proposta | relacionar necessidade registrada com a oferta vigente | contraparte demonstra aderência; `proposal_liked` não é compra | evento decidido; critério detalhado pendente |
| Formalizar compra | criar pedido sem transformar relato em receita | pedido vinculado e depois evento competente de pagamento | decidido no contrato atual |
| Liberar acesso | vincular pedido aprovado ao negócio correto | `payment_approved` e vínculo verificável com `businesses.id` | decidido; integração real tem provas próprias |
| Concluir onboarding | recolher declarações, marca, contas e lacunas | conclusão persistida sem inventar respostas | decidido no produto |
| Conduzir ativação | realizar a reunião e preparar a primeira campanha | reunião confirmada, acessos e aprovações verificáveis | parcialmente decidido |
| Colocar campanha no ar | publicar pelo fluxo autorizado e preservar prova | confirmação da plataforma; nunca simples relato | decidido como distinção de evidência |
| Acompanhar sucesso | atuar sobre uso, resultado informado, risco e próxima ação | definição de cliente ativado e caminho de sucesso | **pendente** |
| Fechar financeiro | conciliar pedido, pagamento, negócio e competência | IDs canônicos e evento financeiro conciliado | **pendente**; Finance usa outro banco |

Nenhuma etapa posterior pode ser inferida apenas porque a anterior ocorreu.
Em particular, `proposal_liked`, `purchase_reported`, `payment_approved` e
`campaign_live` continuam eventos distintos.

## 3. Taxonomia comum

| termo | definição vigente ou proposta | situação |
|---|---|---|
| Interessado V2G | oportunidade com `interest_registered` | vigente na V0 |
| Contato de anúncio | contato gerado pela mídia de um cliente | vigente; nunca é venda da V2G |
| Oportunidade | jornada comercial de um negócio prospectivo | vigente na V0 |
| ICP mínimo | negócio com CNPJ e que vende por WhatsApp nesta fase | decisão vigente; baseado em declaração |
| Instagram adequado | diagnóstico operacional | não é requisito de compra; `guidance_needed` gera orientação |
| Limite superior do ICP | demanda que excede o que a V2G consegue entregar bem | **pendente** |
| Segmentos A, B, C e D | faixas comuns para aquisição, produto, CS e suporte | **proposta da aula**; critérios pendentes |
| Cliente oficial | marco único a partir do qual a conta entra na base de clientes | **pendente**; não assumir que relato, pedido e pagamento são equivalentes |
| Cliente ativado | evidência de que o motivo da compra começou a ser atendido | **pendente**; métrica e prazo não definidos |
| Caminho de sucesso | promessa, resultado observável e prazo acordados no handoff | **proposta da aula**; contrato V2G pendente |

MQL, SAL e SQL não entram no vocabulário só porque aparecem na aula. Se a V2G
adotá-los, cada termo precisa de critério, fonte, proprietário e teste de uso;
caso contrário, “interessado” e “oportunidade” continuam mais honestos.

## 4. Contratos entre áreas

Cada SLA precisa registrar: entrada elegível, qualidade mínima, canal de
handoff, prazo, responsável, fonte da medição, exceção e ritual de revisão.

| handoff | já decidido | ainda precisa de decisão |
|---|---|---|
| Marketing → vendas | origem preservada; interessado separado de contato de anúncio; ICP mínimo por declaração | prazo até primeira tentativa, quantidade de tentativas, engajamento mínimo e definição de segmentos |
| Vendas → ativação/CS | compra, pedido e pagamento separados; acesso após pagamento confirmado; reunião inicial de 25 minutos | conteúdo obrigatório da promessa, prazo do primeiro contato, definição de ativação e tempo até valor |
| Ativação/CS → produto | lacunas e fatos devem manter fonte; publicação e pagamento não podem ser classificados por IA | canal de demanda, critério de resposta, prazos por severidade e regra de fechamento de release |
| Receita → financeiro | evento do Asaas é separado de navegação e relato; pedido e negócio têm IDs próprios | ponte canônica com Finance, competência, estorno, NFS-e e reconciliação |

O atendimento contratado já registra primeira resposta em até um dia útil no
horário definido em `docs/decisoes.md`. Esse compromisso não deve ser copiado
automaticamente para conexão comercial, ativação ou suporte de produto.

## 5. Métricas e alertas

As métricas da V0 em `docs/revops-v0.md` permanecem válidas. A aplicação do
método acrescenta uma regra: toda taxa deve expor numerador, denominador,
janela, fonte e cobertura de dados. Sem isso, mostrar contagem e alerta de
qualidade é preferível a publicar uma taxa suave.

Alertas mínimos:

- oportunidade sem responsável, próximo passo ou data;
- reunião realizada com transcrição pendente;
- compra relatada sem pagamento confirmado;
- pedido aprovado sem negócio vinculado;
- conversas de anúncio sem vendas informadas pelo cliente;
- campanha citada sem ID ou confirmação da plataforma;
- cliente considerado ativado sem métrica e prazo aprovados;
- recebimento no Finance sem ID de ponte canônico;
- inferência sem revisão humana.

Dez conversas de anúncio continuam sendo dez conversas, nunca dez vendas. Venda
e receita informadas pelo cliente são outra fonte e devem permanecer separadas
dos eventos da plataforma e da receita da própria V2G.

## 6. Ritual de governança proposto

1. Revisar os handoffs com dados e exceções, não com casos sem fonte.
2. Escolher um problema, responsável e critério de conclusão por ciclo.
3. Registrar a mudança de regra com data e responsável pela decisão.
4. Medir o período seguinte sem reclassificar silenciosamente o histórico.
5. Manter exceções explícitas; não mudar a regra só para fazer o número fechar.

Cadência, participantes e fórum são **pendentes**. A aula recomenda um encontro
obrigatório, mas não fornece uma cadência que possa ser adotada sem considerar o
tamanho atual da equipe V2G.

## 7. Ordem sugerida para os próximos blocos

1. Victor revisar e aprovar a taxonomia mínima e os marcos de cliente oficial e
   cliente ativado.
2. Definir o primeiro SLA mensurável: marketing → vendas, com prazo e tentativas.
3. Preparar um contrato aditivo para eventos pós-pagamento sem aplicar migration.
4. Definir a ponte de ID com Finance antes de qualquer conciliação por nome.
5. Só depois instrumentar painel, metas ou automações sobre essas definições.

Esta ordem é uma proposta. Não autoriza migração, concessão de acesso RevOps,
importação de dados reais ou automação externa.
