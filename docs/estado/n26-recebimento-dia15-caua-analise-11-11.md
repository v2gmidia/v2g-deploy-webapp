# Receber clientes em 15/11 — análise integrada ao comercial

## 0. Conclusão e próximo passo

> DIREÇÃO MAIS RECENTE de Victor em 11/11: a preparação da Nota fica no radar dele; a frente imediata é abrir a conta da **Piligrin em produção** para sua inspeção. Aberto o domínio oficial `/inicio`, que redirecionou para login; sessão legítima pendente do usuário. Não transformar este pedido de navegação em cadastro, migração, publicação ou liberação de permissões. A prioridade anterior abaixo permanece histórica.

> ATUALIZAÇÃO de Victor em 11/11: começar pela **Nota 360**, com pagamentos a partir de 15/11. Informou que “já pagou um”; ainda não está definido se se refere a uma mensalidade de toda a agência ou ao pagamento de um anunciante, nem o período coberto. Não usar essa frase para liberar todos os seis ou descontar/cobrar valores por suposição. Os registros de 10/11 confirmam os seis nomes, mas deixam IDs/ativos/acessos e implantação individual pendentes. Recomendação apresentada: preparar a entrada assistida da Nota e seus vínculos antes do convite; reaproveitar a cadeia comercial e conferir a cobertura do pagamento já realizado. Nenhum cadastro, permissão ou cobrança foi criado nesta atualização.

11/11/2026, Brasília. Pedido de Victor: ler a resposta do Cauã no WhatsApp e avaliar usar os pagamentos habituais de 15/11 para trazer clientes atuais à plataforma, preservando o fluxo comercial em andamento.

**Faz sentido usar a primeira mensalidade real na plataforma como entrada assistida dos clientes atuais.** Isso aproveita o pagamento comercial legítimo e a primeira sessão, conforme a dispensa anterior de compra de teste. A entrada de clientes atuais precisa vincular os negócios/contratos existentes ao pedido correto; o checkout público de nova compra não resolve essa ligação automaticamente.

Próxima frente recomendada: fechar o mapa pagador → agência/anunciantes → negócio existente → cobrança do ciclo de novembro → acesso autorizado. Central prepara o vínculo e os casos de transição; Victor/financeiro confere condições e cobrança já emitida. Não gerar uma segunda cobrança só para conceder acesso.

Somente análise e leitura neste bloco; não implementar alteração de banco/pagamento, publicar, enviar mensagem ou registrar publicação de anúncio por consequência.

## 1. Resposta do Cauã — fonte verificada no grupo

Fonte: WhatsApp Web, **🎯 03 | Operação — Gestores**, V2G TEAM. Leitura do grupo correto, sem abrir o privado para buscar esta resposta e sem enviar mensagem.

- 11/11, **12h18**: em resposta citada à pergunta sobre a versão “Tenha Dúú Gomes no seu estabelecimento”, AD 01 `52570262604075`, Cauã escreveu: **“Na campanha atual é 22 de junho mesmo”**. A resposta confirma dia/mês por declaração do gestor; a captura posterior mostra campanha com `22/06/2026` no nome. Não converter isso em data comprovada de primeira impressão, nem gravar confirmação no aplicativo em nome dele.
- **12h21**, duas capturas: uma mostra Dúú operado por Piligrin, com o texto de reunião a confirmar; a outra mostra campanha/conjunto e um **AD 03** pausado, investimento/impressões/cliques e conversas ainda não medidas. Essa segunda captura não é comprovação visual autônoma da versão do AD 01.
- **12h22**, áudio de aproximadamente 27 s: já consegue acessar Dúú pela Piligrin dentro da V2G; pede **CTR, CPM, resultado e custo por resultado** para analisar desempenho dentro do aplicativo. Considera insuficientes investimento, impressões e cliques para concentrar sua análise ali.
- **12h23**, áudio de aproximadamente 38 s: ao abrir números de um cliente, os dados aparecem acima da carteira com os outros negócios abaixo; prefere visualização separada/mais organizada para cada cliente.

Os áudios foram baixados pela interface, associados às mensagens/horários do grupo e transcritos **localmente**, com modelo Whisper small já disponível, sem upload ou geração de chave. Transcrição automática, com pequenos erros de reconhecimento em nomes; os pedidos acima são paráfrases. Fontes privadas: `C:/Users/victo/Downloads/WhatsApp Ptt 2026-11-11 at 12.22.31.ogg` e `...12.23.40.ogg`; segmentos/transcrições em `C:/Users/victo/.codex/private-backups/v2g/caua-grupo-20261111/`.

## 2. Como isso se encaixa no fluxo existente

**Caminho compartilhado:** pedido/cobrança corretamente vinculados → pagamento efetivamente confirmado → comunicação ao comprador → sessão legítima → negócio/carteira autorizados.

| Origem | Entrada necessária | O que preservar |
|---|---|---|
| Cliente novo | Contratação pública e criação de negócio | Preço/oferta vigente, identificação e confirmação de pagamento |
| Cliente atual | Entrada assistida de seu contrato/negócio e cobrança do ciclo atual | Negócio, dados, acessos, anunciante/agência, preço acordado, vencimento e pagamento existente |

O pagamento de 15/11 pode ser a primeira comprovação produtiva do caminho, sem cobrança de ensaio. Isso é a proposta; não é evento produtivo já observado. A primeira compra real deve ser acompanhada individualmente antes de replicar para a carteira inteira.

O acesso de clientes e a análise completa do gestor são entregas relacionadas, mas com critérios diferentes. Os pedidos de CTR/CPM/resultados e navegação entram no trabalho de experiência/rotina; não precisam paralisar a frente cobrança/acesso, nem permitem prometer substituição completa da BM no dia 15.

## 3. Diferenças concretas ainda a tratar

1. **Negócio existente.** O SQL do pacote aplicado, `docs/comercial/banco-minimo-local-11-11/aplicar-local-revisavel.sql:226`, reaproveita o mesmo pedido somente pela referência exata. Para nova referência, `:240` cria um `businesses` novo e `:243` o vincula ao pedido. `app/contratar/actions.ts:58` chama esse fluxo sem receber um negócio existente explicitamente autorizado. Mesmo e-mail/documento não é um comando seguro de migração.
2. **Condições atuais.** `lib/contratacao/qualificacao.ts:46` restringe o mensal automático ao cartão neste checkout. O preço usa a oferta de R$ 500 por conta. Não foi conferido neste bloco se todos os contratos atuais têm esse valor/método, quantas contas cada um cobre ou se já há assinatura/cobrança emitida para 15/11. Não trocar preço/método por suposição.
3. **Ciclo do dia 15.** `lib/contratacao/iniciar-pagamento.ts:83` usa o dia de criação; `:173` envia essa data como vencimento inicial. A recorrência parte desse vencimento em `lib/contratacao/assinatura-apos-3ds.ts:31`. Enviar um checkout novo para pagamento antecipado não preserva, por si, vencimento fixo no dia 15.
4. **Pagador e carteira.** Piligrin e Nota 360 são os clientes/agências, com seus anunciantes separados. Dúú não deve receber acesso direto nem assumir uma cobrança própria por consequência de migrar a Piligrin. Casi e SS Shop seguem como clientes diretos. FamFire continua fora da ativação atual, conforme decisão anterior. Quantidade de anunciantes não é automaticamente quantidade de cobranças nem contas Meta.
5. **Acesso correto.** `lib/contratacao/vincular-core.ts:14` e `:54` exigem vínculo e propriedade conferidos antes de atribuir pedidos. Uma ponte de migração deve preservar essas garantias; não substituir por correspondência aproximada de nomes/e-mails nem por confirmação financeira manual fictícia.

Documentação primária consultada: [Asaas — eventos de cobrança](https://docs.asaas.com/docs/webhook-para-cobrancas) distingue criação de cobrança, confirmação e recebimento; [FAQ de assinaturas](https://docs.asaas.com/docs/faq-assinaturas) distingue geração recorrente e pagamento, com primeiro vencimento definido na assinatura. A proposta mantém o acesso financeiro amparado em pagamento confirmado, não apenas no link ou assinatura criada.

## 4. Ordem proposta até 15/11

| Ordem | Trabalho | Responsável | Prova de saída |
|---|---|---|---|
| 1 | Conferir quem paga em 15/11, valor/método, período coberto, agência/anunciantes, negócio/usuário autorizado e cobrança/assinatura já existentes | Victor/financeiro + Central | Lista conciliada por pagador, sem dados sensíveis desnecessários |
| 2 | Publicar a correção comercial mínima já preparada, mantendo inicialmente OFF e preservando QA | Fluxo manual de Git + Central na conferência | Revisão/destino exatos; portas/configuração conferidas |
| 3 | Preparar e testar a entrada assistida de clientes atuais reutilizando a mesma cadeia financeira | Central, após fechar a proposta de vínculo | Mesmo negócio, preço/ciclo preservados, sem cobrança dupla, isolamento entre agências/anunciantes |
| 4 | Primeira compra/mensalidade real, com acompanhamento | Pagador + Central | Pagamento canônico, comunicação recebida e sessão no negócio correto |
| 5 | Expandir por pagador conciliado e tratar as melhorias do gestor em seguida | Central + Cauã | Carteira correta e pendências visíveis; métricas com fonte/período/cobertura |

Não declarar garantia de conclusão de toda a carteira até 15/11: falta a conciliação da etapa 1 e a ponte da etapa 3. A meta proposta é usar o recebimento real para implantar cobrança/acesso com os mesmos dados, sem interromper recebimentos atuais caso algum cadastro ainda dependa de ajuste.

## 5. Estado publicado e preservação

Consulta autenticada somente leitura nesta análise: `app.v2gmidia.com.br` continua no deployment `dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW`, READY/production/main, SHA `13f8943471b391bd22e9dd8362f5748653ad9c5b`. A candidata de sete arquivos na branch `codex/comercial-webhook-off` continua sem commit/push. Os 184 testes e build são da candidata local; não incluem uma transição financeira de todos os clientes existentes.

Nenhum acesso ao banco ou valor privado; nenhum envio no WhatsApp, alteração de contrato, cobrança, assinatura, cancelamento, estorno, permissão, Meta, n8n, migração, commit, push ou publicação. Nenhum marco M3/M4 foi marcado concluído pela resposta recebida. As métricas/fotos de terceiros foram tratadas como evidência relatada, não como medição própria da Meta.
