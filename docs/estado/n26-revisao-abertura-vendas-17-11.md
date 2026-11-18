# Revisão de abertura comercial e entregáveis B2B2B — 17/11/2026

## Resultado e limite

**Revisão preparada; vendas não liberadas.** Nesta passagem foram relidos os checkpoints e a fonte publicada, consultados metadados atuais não secretos das opções comerciais e reconciliado o plano existente. Não houve cobrança, envio, alteração de configuração, banco, permissão, anúncio, commit ou publicação. Testes encerrados não foram repetidos.

Victor confirmou neste turno: **a agência acessa a carteira; os clientes dela não acessam a plataforma.** A operação V2G usa a Mesa do Gestor. A agência é contratante/pagadora; cada unidade cobre um anunciante e a conta contratada, não um novo login. Isso confirma a regra já escrita no e-mail publicado, sem conceder novos acessos.

## O que está pronto e o que não está provado

| Parte | Evidência | Limite / pendência |
|---|---|---|
| Banco, LP e WebApp oficiais | Publicação fechada em 17/11; backup e recuperação local do escopo; 52 tabelas anteriores preservadas e isolamento revisto. | Recuperação não é backup integral de Auth/credenciais. Readiness não libera vendas. |
| Cadastro comercial | Contratante, comprador humano, origem, pedido e unidades nominais separados; compra direta não inventa lead anterior. | A passagem assinada LP→WebApp em produção ainda não foi exercitada com os valores privados reais. |
| Pagamento e recorrência | Caminho implementado e ensaiado localmente; pagamento canônico, reserva contra duplicação e assinatura mensal após primeira mensalidade. | Provedores dos ensaios substituídos. Sem novo pagamento, desafio 3DS ou assinatura real. |
| Conexões | Chave Asaas salva habilitada/sem saques; aprovação escrita de 3DS/tokenização localizada; webhook correto, desligado; domínio de e-mail verificado; Auth oficial. | Credenciais não lidas/comparadas; configuração não prova autenticação externa nem entrega em caixa. |
| Mensagens | Fonte publicada prepara confirmação ao comprador e aviso a victor.cabral@v2gmidia.com.br, separados e deduplicados. | Conteúdo atual é texto com link oficial. Não prometer botão HTML. Accepted não comprova recebimento. |
| Acesso | Piligrin→Dúú→carteira já conferido em produção; ensaios de cobertura nominal e negação de outro anunciante registrados. | Prova histórica não substitui a entrada de novo comprador após a primeira compra válida. |
| Contrato e fiscal | Estados e tarefas separados de pagamento/acesso. Há minuta interna de teste e orientação contábil histórica. | Minuta final aprovada e procedimento fiscal concreto precisam de responsáveis/aceite; não afirmar assinatura ou NFS-e automáticas. |

Conferência atual de configuração: todas as opções de compra, processamento financeiro, recorrência, cobertura nominal e preparação/envio comercial do WebApp continuam `false`; as duas opções comerciais da LP continuam `0`. Segredos foram tratados apenas por nome/tipo/ambiente. O SMTP de recuperação de identidade existente não foi desligado nem usado nesta revisão.

Os IDs READY registrados no fechamento anterior são WebApp `dpl_GXAYGCNRdAmcptRNz7m4qCydeAzw` e LP `dpl_35LuEFqrqJ29rMWxxkvabfR6x5XD`. A árvore remota anterior do WebApp era parcial (353/663 fontes visíveis); não declarar auditoria remota integral. A publicação foi por pacote: antes de uma próxima publicação por Git, reconciliar a composição e os consumidores de acesso com a branch de destino.

## Plano em ordem — proposta, sem ativação

| Ordem | Ação | Responsável | Aceite | Esforço / dependência |
|---|---|---|---|---|
| 1 · P0 | Fechar ficha da primeira venda: contratante, representante, e-mail, anunciante, conta/unidade, período, preço e condições. Definir versão contratual utilizável e responsável fiscal. | Victor; Central prepara; advogado/contabilidade validam seus recortes. | Uma venda válida identificada; condições conhecidas pelo comprador, sem documento de teste enviado. | Depende de dados e decisões humanas; duração não medida. Não há nova chave/SMS pendente. |
| 2 · P0 | Revisar matriz de ativação e rotina de falha/cancelamento/estorno; conferir a composição publicada antes de qualquer nova implantação. | Central + Victor, responsável financeiro até designação expressa de outra pessoa. | Aprovação do conjunto concreto de controles e ordem abaixo, com retorno que preserva direitos já pagos. | Mapeamento concluído nesta revisão. Aplicação não autorizada por este documento. |
| 3 · P0 | Após autorização separada, preparar processamento/webhook, cobertura e mensagens antes de permitir nova compra; conferir entrada LP e proteção no domínio oficial. | Central acompanha; Victor autoriza e conclui atos privados/financeiros. | Processamento e webhook disponíveis antes do pagamento; ligação real e proteção verificadas; CTAs públicos de compra ainda ocultos durante a preparação. | Ativação e prova externa pendentes. URL sem CTA não é restrição exclusiva a um comprador. |
| 4 · P0 | Acompanhar a primeira contratação válida, realizada pelo comprador. | Comprador + Victor + Central. | Cobrança canônica e valor/período corretos; duas mensagens recebidas; identidade confirmada; agência acessa só a unidade paga; repetição não duplica; mensal seguinte não recobra o primeiro ciclo. | Depende da disponibilidade e do pagamento voluntário do comprador. Sem cobrança artificial. |
| 5 · P0 | Revisar evidências e, só depois de aceite, abrir a compra pública na LP. | Victor decide; Central apresenta resultado e exceções. | Duas entradas funcionais, links oficiais, operação financeira com dono e nenhuma falha crítica aberta. | Não há data de abertura prometida. Retenção, contrato/fiscal e recorrência não devem ser tratados como provados por um único pagamento. |

Não há estimativa confiável de calendário até as decisões da venda e a disponibilidade do comprador. Os ensaios locais já concluídos não serão repetidos apenas para preencher tempo. Defeito novo exige correção dirigida/teste; falha externa exige diagnóstico da etapa afetada, não refazer todo o projeto.

### Matriz técnica para a futura autorização

**Estado atual de todos os controles abaixo: desligado.** A lista descreve dependências do código publicado, não instrução para ligá-los agora.

1. Identidade oficial: projeto/banco/domínio/ambiente devem continuar exatos. Confirmar URL e aprovação 3DS com as evidências existentes; não reabrir pedidos de suporte já resolvidos.
2. Entrada: `V2G_COMMERCIAL_PRODUCTION_ENTRY_V1_ENABLED` no WebApp (`true`) e LP (`1`) permite o contexto comercial; a compra pública da LP tem controle próprio, mantido `0` durante a preparação. Validar ponte antes de oferecer pagamento. Handshake positivo pode gravar lead/contexto real: execução precisa fazer parte da próxima autorização, sem envio real de formulário nesta revisão.
3. Processamento: `V2G_COMMERCIAL_FINANCIAL_V1_ENABLED`, `V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED`, `V2G_PRODUCTION_URL_CONFIRMED`; webhook e fila Asaas habilitados na ordem aprovada. Conferir filas/histórico antes de reprocessar: a conta Asaas pode ter cobranças externas; não converter evento sem pedido em compra V2G.
4. Mensagens: `V2G_COMMERCIAL_BUYER_PREPARE_ENABLED`, `V2G_COMMERCIAL_INTERNAL_NOTICE_ENABLED`, `V2G_COMMERCIAL_EMAIL_DISPATCH_V1_ENABLED`, `V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED`. Filas antigas/resultado incerto exigem conciliação antes de qualquer reenvio. Alerta interno mantém o destino já confirmado.
5. Direitos e mensal: `V2G_NOMINAL_COVERAGE_V1_ENABLED` e, para mensal, `V2G_COMMERCIAL_RECURRING_V1_ENABLED`. Direito pago não depende da autorização para novas compras. Conferir impacto sobre clientes históricos; não conceder cobertura pelo CNPJ ou pelo número de nomes na carteira.
6. Checkout, por último antes da contratação: `V2G_COMMERCIAL_CHECKOUT_V1_ENABLED`, `V2G_PRODUCTION_CHECKOUT_ENABLED`, `V2G_CHECKOUT_API_ENABLED`, `V2G_CHECKOUT_SECURITY_ENABLED`, `V2G_CHECKOUT_3DS_SCHEMA_ENABLED`, `V2G_CHECKOUT_3DS_ENABLED`, `V2G_PRODUCTION_3DS_CONFIRMED`; conferir Turnstile e identidade em execução. Controles legados `V2G_CHECKOUT_ENABLED`, `V2G_PAYMENT_EMAIL_ENABLED` e caminhos Sandbox/assistidos não são ligados por associação.
7. Após evidência e aceite: `V2G_COMMERCIAL_PUBLIC_PURCHASE_ENABLED=1` na LP. Os controles do servidor prevalecem sobre ocultar botões.

**Retorno proposto:** fechar novas compras e o CTA público primeiro; preservar pedidos, pagamentos, cobertura válida e evidências. Não desligar indiscriminadamente o recebimento/consulta de pagamentos em trânsito. Falha de e-mail não repete cobrança; timeout exige conciliação, não nova assinatura. Cancelamento não equivale a estorno. Comandos financeiros e eventos `SUBSCRIPTION_*` permanecem assistidos.

## Primeira venda de referência — sem emissão

Plano nominal já escolhido por Victor: Nota 360→Brotherhood Barbershop, R$ 500/mês por uma conta. A implantação individual foi adiada em 16/11; este documento não desfaz o adiamento nem gera cobrança. Se mantida como primeira venda, conferir contato/representação da Nota, período de início, condições mensais e ID do anunciante/conta. Versan Logistic já pago conforme relato deve ser conciliado/preservado, sem recobrança. Os outros quatro anunciantes não ficam cobertos por uma compra de R$ 500. A agência acessa a carteira; não gerar convites para os clientes dela.

## Entregáveis B2B2B — catálogo atual com limites

O cliente contratante é a agência. Seu cliente anunciante recebe os resultados e materiais pelo relacionamento da agência; não há login direto para ele neste modelo. A plataforma é meio de acompanhamento e operação, não substitui a entrega do serviço.

| Entrega | O que a agência recebe / acompanha | Evidência e limite |
|---|---|---|
| Gestão de mídia Meta e Google | Estruturação, acompanhamento e ajustes das campanhas nos canais contratados. | Serviço confirmado por Victor neste pedido e Google aparece como Agora na LP. A prova atual do painel Dúú é Meta; não prova automação ou painel Google integrado. |
| Planejamento de campanha | Objetivo, oferta/mensagem, público/região, canal e uso da verba definidos para orientar a execução. | Documento mestre descreve negócio→oferta→criativo→campanha; escopo operacional prevê estratégia. Não foi localizada uma cadência fixa de documento por cliente. |
| Criativos estáticos e textos de anúncio | Peças estáticas e mensagens para campanhas, com revisão e aprovação conforme o escopo contratado. | Geração estática confirmada por Victor; LP descreve oferta/texto/criativos e revisão humana. Quantidade, formatos e revisões não estão fixados por esta revisão. Peça aprovada não comprova publicação. |
| Implantação e conferência dos acessos | Checklist de contas, Página/perfis, anunciante, permissões e pendências para começar corretamente. | Roteiro de recebimento Meta e escopo de Media Intelligence. Ativos continuam do cliente; compra não equivale a conexão Meta. |
| Relatórios de desempenho | Investimento, entregas, resultados disponíveis e interpretação por conta/período, para a agência prestar contas ao anunciante. | Relatórios confirmados por Victor. Cadência, formato, envio e personalização da marca ainda precisam de definição; não afirmar PDF/WhatsApp automáticos. |
| Dados de mídia organizados | Fonte, conta, período, gasto, impressões, cliques, conversas/conversões disponíveis e sua evolução. | Prova produtiva Dúú com gráfico/tabela diária e conversas Meta. Google exige fonte própria; lacuna não vira zero. Conversa não equivale a contato único, venda ou faturamento. |
| Análise e próximo passo | Leitura do que aconteceu e recomendação de manter, ajustar ou testar, com pendências e responsáveis. | Documento mestre e escopo operacional. Recomendação/histórico não são garantia de resultado ou prova de execução automática. |
| Acompanhamento operacional | Status das campanhas e peças, aprovações, pendências, publicação quando confirmada e histórico de decisões registradas. | Percurso Piligrin/Dúú e revisão de criativos já documentados; operação assistida por gestor. Não prometer que toda ação feita fora do sistema é importada automaticamente. |
| Suporte da operação | Canal para a agência alinhar prioridades e resolver pendências com a V2G. | Escopo operacional prevê atendimento/suporte. SLA, dias/horários e quantidade de reuniões ainda não fechados como padrão. |
| Carteira da agência | Acompanhamento centralizado dos anunciantes contratados, acesso ao detalhe e retorno à carteira. | Confirmado novamente por Victor e conferido com Piligrin em produção. Compra de uma unidade não libera toda a carteira. |
| Mensuração no site, quando aplicável | Conferência/configuração de Pixel, GTM e GA4 e identificação de problemas de coleta, havendo site, acessos e escopo. | Previsto no escopo de Media Intelligence; não comprovado em todos os clientes. Dúú declarou não ter site. Não incluir automaticamente implantação avançada/CAPI/CRM no pacote-base. |

Não anunciar como entrega atual automática: vendas/faturamento/ROI atribuídos ponta a ponta, CRM completo, integração universal de WhatsApp, relatório recorrente por e-mail/WhatsApp, contrato assinado ou NFS-e, vídeo, social media completo ou material ilimitado. Pesquisa de nicho/referências e inteligência interna apoiam a operação, mas não são um relatório avulso garantido sem combinar o escopo.

### Decisões comerciais ainda necessárias

- Definir a apresentação padrão dos relatórios: formato, periodicidade e se há reunião de análise; volume/formatos/revisões de estáticos e escopo de suporte. Sem criar promessa de entrega ilimitada ou SLA não aprovado.
- Confirmar como Meta e Google entram na unidade vendida: oferta registrada é por **conta de anúncios**, não promessa de duas plataformas ilimitadas por uma unidade. Não alterar o preço corrente de R$ 500/mês nem presumir desconto multicontas.
- Definir versão contratual utilizável, condições de permanência/saída e procedimento fiscal com os responsáveis apropriados. Não reutilizar automaticamente cláusulas de minuta de teste.
- Escolher a próxima contratação real e seus dados/condições; depois autorizar o pacote concreto de ativação. Não há necessidade de enviar segredo por chat.

## Fontes verificadas

- [Fechamento oficial e limites](./n26-conexoes-oficiais-configuradas-off-17-11.md); [pacote publicado](./n26-comercial-oficial-publicado-fechado-17-11.md); [rotina financeira proposta](../qa/conexoes-oficiais-off-17-11/rotina-financeira-proposta.md).
- Fonte publicada em cópia privada: `lib/contratacao/ambiente-comercial-oficial-v1.ts:6-25`, `ambiente-producao.ts:8-44`, `checkout-contexto-v1.ts:45-105`, `entrega-contexto-v1.ts:7-14`, `mensagens-contexto-v1.ts:13-31`. Raiz: `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-comercial-oficial-producao/source-webapp`. Nenhum arquivo de segredo foi lido.
- [Documento mestre de posicionamento, 22/10](https://docs.google.com/document/d/1vlWi-_zPYYYTA6L8tWqENUqrOlUrjpeX8n04CA1UrfY/edit), especialmente seções 6, 7, 13 e 14. É fonte de escopo/intenção; prioridades e prova atual prevalecem sobre sua narrativa histórica.
- [Escopo de Media Intelligence, cópia 27/10](https://docs.google.com/document/d/1WomPqaN4AVOVWUeXW-FM7gFs-Fp7vdbkwPMe9kHDZZo/edit), seções Estratégia, Dados e Operacional. É definição de responsabilidade, não prova de serviço executado em todas as contas.
- LP local `C:/Users/victo/v2g-deploy/lp/index.html:98` e `:119` para descrição de serviço/canais; não foi enviada alteração à LP nesta revisão.
- [Proposta nominal anterior e dependências contratuais/fiscais](./n26-comercial-proposta-01-02-15-11.md), seções 5 e 6. Suas lacunas técnicas históricas devem ser lidas junto ao fechamento de 17/11, que as atualiza.
- Resposta de Victor nesta conversa: agência acessa carteira; clientes dela não acessam. Pedido atual confirma relatórios, gestão Meta/Google e geração estática como serviço vigente.

Planilha existente reconciliada em 19 células de Visão geral, Próximos passos e Novembro — execução. Leitura de retorno confirmou valores, notas anteriores, formatos e validações preservados. A prova externa foi colocada junto à primeira contratação válida, sem repetir os ensaios encerrados. Renderização nativa da planilha não reavaliada; conferência estrutural e de formatos por metadados. Evidência sanitizada: [revisao-final-abertura.json](../qa/conexoes-oficiais-off-17-11/revisao-final-abertura.json).

Próxima ação: Victor revisa condições da oferta e primeira contratação; Central apresenta o pacote concreto de ativação após essas definições. **Parar antes de abrir, cobrar ou enviar.**
