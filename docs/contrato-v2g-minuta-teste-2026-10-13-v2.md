# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE GESTÃO DE ANÚNCIOS

> **MINUTA DE TESTE INTERNO — VERSÃO `teste-interno-2026-10-13-v2` — NÃO APROVADA PARA ASSINATURA.**
>
> Este arquivo serve para validar preenchimento, cálculo, versionamento e fluxo do produto. Não deve ser enviado a cliente, assinado, usado para cobrança, emissão de NFS-e ou publicação de campanha. A liberação exige aprovação jurídica identificada da versão exata e confirmação fiscal da Contabilizei.

**Template:** `{{contrato.template_id}}`  
**Versão do documento:** `{{contrato.versao_documento}}`  
**Documento:** `{{contrato.id}}`  
**Pedido:** `{{pedido.id}}`  
**Gerado em:** `{{contrato.gerado_em}}`  
**Hash SHA-256:** `{{contrato.hash_conteudo}}`

## QUADRO-RESUMO

| Campo | Valor |
|---|---|
| Contratante | `{{contratante.razao_social}}` |
| CNPJ | `{{contratante.cnpj}}` |
| Pedido | `{{pedido.id}}` |
| Quantidade de contas | `{{pedido.quantidade_de_contas}}` |
| Plano | `{{pedido.plano}}` |
| Valor unitário do plano | `{{pedido.valor_unitario_formatado}}` |
| Valor total | `{{pedido.valor_total_formatado}}` |
| Forma de pagamento | `{{pedido.forma_pagamento}}` |
| Início contratual | Data da última assinatura exigida, ressalvada indisponibilidade da V2G |
| Fim do período mínimo | `{{contrato.data_fim_periodo_minimo}}` |
| Fim do plano antecipado | `{{contrato.data_fim_plano}}` |
| Verba de mídia | Não incluída; definida por conta no Anexo I |
| Plataforma(s) | Anexo I |

**CONTRATADA:** `{{prestador.razao_social}}`, CNPJ `{{prestador.cnpj}}`, com sede em `{{prestador.endereco}}`, representada por `{{prestador.signatario.nome}}`, na qualidade de `{{prestador.signatario.qualificacao}}`, doravante **V2G**.

**CONTRATANTE:** `{{contratante.razao_social}}`, CNPJ `{{contratante.cnpj}}`, com sede em `{{contratante.endereco}}`, e-mail contratual `{{contratante.email_contratual}}`, representada pelos signatários do Anexo II, doravante **CONTRATANTE**.

V2G e CONTRATANTE, em conjunto, “Partes”, celebram este Contrato.

## 1. OBJETO E ESCOPO

**1.1.** A V2G prestará serviços de gestão das contas de anúncios individualizadas no Anexo I, utilizando tecnologia e acompanhamento humano.

**1.2.** O escopo compreende diagnóstico e organização das informações do negócio, orientação de oferta, textos, criação ou apoio à criação de peças estáticas quando aplicável, configuração, primeira publicação manual, acompanhamento e otimizações.

**1.3.** Não estão incluídos: verba de mídia, atendimento comercial da CONTRATANTE, produção ou edição de vídeos, site, landing page, CRM, gestão orgânica e plataformas não identificadas no pedido.

**1.4.** Não há quantidade fixa mensal de peças ou campanhas. As entregas seguem a estratégia, a necessidade da conta e a capacidade operacional dentro do escopo. Isso não significa produção ilimitada.

**1.5.** Serviços adicionais dependem de novo pedido, aditivo ou contrato assinado.

## 2. EMPRESAS, PEDIDOS E CONTAS

**2.1.** Cada conta de anúncios é uma unidade de contratação e preço. Este Contrato abrange `{{pedido.quantidade_de_contas}}` conta(s), vinculadas exclusivamente ao pedido `{{pedido.id}}` e ao CNPJ `{{contratante.cnpj}}`.

**2.2.** Um login poderá acessar mais de um CNPJ, mas não unificará contratos, pedidos, cobranças, verbas, campanhas, dados, documentos fiscais ou encerramentos.

**2.3.** A plataforma de cada unidade será indicada no Anexo I. A operação inicial é voltada a Meta Ads; outra plataforma somente integra o escopo quando expressamente indicada no pedido.

**2.4.** Conta ainda não identificada não receberá identificador fictício e não poderá ter campanha publicada.

**2.5.** A substituição de conta depende de análise e aditivo. Não há troca gratuita ou cobrança automática de nova unidade por presunção.

## 3. PREÇO, PLANO E VERBA DE MÍDIA

**3.1.** O documento preenchido exibirá somente o plano comprado:

- **mensal:** R$ 500,00 por conta por ciclo mensal, com permanência mínima inicial de seis ciclos;
- **semestral antecipado:** R$ 2.850,00 por conta por seis meses;
- **anual antecipado:** R$ 5.280,00 por conta por doze meses.

**3.2.** O total é a quantidade de contas multiplicada pelo valor unitário do plano. O sistema não aceitará preço livre incompatível com o pedido validado.

**3.3.** A verba de mídia não integra o preço da V2G. Será paga à plataforma de anúncios e terá teto registrado separadamente para cada conta.

**3.4.** Dentro da mesma conta, da estratégia e do teto aprovado, a V2G poderá pausar anúncio com desempenho ruim, redistribuir verba entre campanhas e ajustar segmentação, registrando ações relevantes.

**3.5.** Novo texto, criativo ou anúncio e qualquer aumento do teto exigem aprovação expressa. É proibida a transferência de verba entre CNPJs.

**3.6.** Em possível gasto incorreto, bloqueio, material irregular ou acesso comprometido, a V2G poderá reduzir ou pausar preventivamente os gastos, registrando motivo, data, responsável e comunicação. A retomada exige desaparecimento do risco e conferência humana.

## 4. PEDIDO, PAGAMENTO, ASSINATURA E INÍCIO

**4.1.** O checkout constitui pedido sujeito à assinatura. A oferta e as informações apresentadas vinculam a V2G nos termos aplicáveis.

**4.2.** Antes da assinatura concluída existem deveres de informação, proteção de dados e restituição, quando cabível, mas a gestão não produz todos os seus efeitos e nenhuma campanha poderá ser publicada.

**4.3.** Após pagamento aprovado e e-mail confirmado, a CONTRATANTE poderá acessar área limitada do WebApp, realizar onboarding e acompanhar o pedido. Pagamento, acesso, reunião e assinatura são eventos distintos.

**4.4.** O documento ficará disponível para assinatura por sete dias corridos após o envio, com lembretes. Se não for concluído, o pedido será cancelado, o acesso limitado será encerrado e a V2G iniciará restituição integral pelo meio original, sem retenção de custos internos. Prazo do processador de pagamento não é controlado pela V2G.

**4.5.** O contrato produz seus efeitos completos quando todos os signatários exigidos concluírem a assinatura.

**4.6.** O período mínimo começa na data da última assinatura exigida, desde que a V2G esteja disponível para iniciar. Se a indisponibilidade for da V2G, será registrada a data posterior em que ficou apta.

**4.7.** Os ciclos mensais são contados individualmente a partir desse marco, sem pró-rata para data fixa. O primeiro pagamento corresponde ao primeiro ciclo, e cobranças seguintes devem respeitar o aniversário contratual.

## 5. PRIMEIRA PUBLICAÇÃO

**5.1.** A primeira campanha somente será publicada após, cumulativamente: pagamento aprovado; contrato concluído; poderes conferidos; acessos válidos; conta identificada; materiais disponíveis; oferta, textos e peças aprovados; verba configurada; e checklist operacional concluído.

**5.2.** A primeira publicação será manual, realizada pelo gestor responsável. Nenhuma etapa anterior autoriza publicação automática.

## 6. SUPORTE, PAINEL E REUNIÕES

**6.1.** O suporte ocorrerá pelo WhatsApp da V2G indicado na jornada, de segunda a sexta-feira, das 10h às 18h, horário de Brasília, excluídos feriados nacionais e os feriados aplicáveis ao local de operação da V2G.

**6.2.** A primeira resposta é esperada em até um dia útil dentro da janela de atendimento. Esse prazo não garante solução ou restabelecimento no mesmo período.

**6.3.** Não há atendimento emergencial contratado fora da janela. Possível gasto incorreto, acesso comprometido, bloqueio ou material irregular terá prioridade dentro do horário.

**6.4.** O acompanhamento será disponibilizado pelo painel do WebApp, limitado aos indicadores efetivamente apresentados. Não há relatório periódico separado.

**6.5.** A jornada inclui reunião inicial de 25 minutos para acessos e primeiro criativo. Reuniões adicionais poderão ocorrer conforme necessidade e disponibilidade, sem periodicidade garantida.

## 7. OBRIGAÇÕES DA CONTRATANTE E PENDÊNCIAS

**7.1.** A CONTRATANTE fornecerá dados verdadeiros, comprovará poderes, concederá acessos, manterá verba e meio de pagamento da plataforma, entregará materiais e realizará aprovações.

**7.2.** A CONTRATANTE declara possuir direitos ou autorização para usar os materiais, marcas, imagens, ofertas e dados que fornecer.

**7.3.** A CONTRATANTE é responsável pelo atendimento e fechamento dos contatos. Contato não equivale a venda ou faturamento.

**7.4.** Pendência de acesso, material ou aprovação será comunicada por e-mail, com identificação do item faltante e prazo de cinco dias úteis para regularização.

**7.5.** Os prazos de entrega efetivamente afetados serão prorrogados pelo período do atraso. Após o início contratual, a cobrança continuará somente enquanto a V2G permanecer disponível para cumprir sua parte. Se a V2G também tiver causado o atraso, prazo e cobrança serão ajustados proporcionalmente.

## 8. APROVAÇÕES

**8.1.** Oferta, texto, peça, primeira publicação, novo anúncio e aumento do teto exigem aprovação expressa pelo e-mail confirmado do signatário ou de pessoa indicada no Anexo III.

**8.2.** A aprovação registrará versão do material, autor, data e escopo. Silêncio não significa aprovação.

**8.3.** WhatsApp é canal de suporte e lembretes, não substitui a aprovação formal. O WebApp somente poderá assumir essa função depois que identidade, poderes e trilha forem implementados e comprovados.

## 9. INTELIGÊNCIA ARTIFICIAL E RESULTADOS

**9.1.** A V2G poderá utilizar inteligência artificial como ferramenta auxiliar, com revisão humana antes de apresentar conteúdo para aprovação.

**9.2.** Não há promessa de erro zero, originalidade absoluta, exclusividade, ausência de similaridade ou conformidade jurídica automática.

**9.3.** A obrigação da V2G é de meio. Não há garantia de contatos, vendas, faturamento, retorno financeiro, custo por resultado, aprovação por plataforma ou data de publicação independente das pendências e decisões de terceiros.

**9.4.** A ausência de garantia não afasta o dever de cumprir o escopo, atuar com diligência e responder por falhas imputáveis à V2G.

## 10. PRAZO, CONTINUIDADE E REAJUSTE

**10.1.** O plano mensal terá permanência mínima de seis ciclos. Depois, continuará por prazo indeterminado, sem novo mínimo. O cancelamento será efetivo ao final do ciclo já pago, sem cobrança de ciclos futuros.

**10.2.** Os planos semestral e anual encerram-se ao final de seis e doze meses, respectivamente. Novo plano antecipado ou conversão ao mensal exige aceite expresso, com preço e data informados. Não haverá renovação automática semestral ou anual.

**10.3.** Não haverá reajuste nos primeiros doze meses. Depois, o preço poderá ser reajustado pelo IPCA a cada doze meses, mediante aviso com trinta dias de antecedência. Novo antecipado usará o preço informado antes do aceite.

## 11. CANCELAMENTO E RESTITUIÇÃO

**11.1.** Pedidos de cancelamento serão enviados a `v2g.midia@gmail.com`. A V2G confirmará recebimento e data final.

**11.2.** Antes de qualquer prestação efetiva, haverá restituição integral, sem desconto de custos internos, preservado direito legal mais favorável aplicável.

**11.3.** Na saída imotivada antes de completar seis meses, a proposta desta versão de teste é multa de 20% do valor dos períodos restantes, limitada a uma mensalidade equivalente por conta: R$ 500,00 no mensal, R$ 475,00 no semestral e R$ 440,00 no anual. Não haverá recomposição cumulativa do desconto.

**11.4.** A multa não será aplicada por falha da V2G, impossibilidade não atribuível à CONTRATANTE ou exercício de direito legal.

**11.5.** Em antecipados, o período não prestado será restituído proporcionalmente aos dias restantes, pelo preço efetivamente pago. Se a saída imotivada ocorrer dentro dos seis meses, somente a multa válida da cláusula 11.3 poderá ser descontada.

**11.6.** Esta fórmula permanece sujeita à aprovação jurídica e não será executada automaticamente no teste.

## 12. INADIMPLÊNCIA

**12.1.** A V2G enviará aviso no vencimento e nova comunicação após cinco dias úteis.

**12.2.** Esta minuta de teste propõe multa moratória de 2%, correção pelo IPCA e juros conforme a taxa legal, sujeitos à revisão jurídica e à parametrização financeira antes de uso real.

**12.3.** Após o prazo de regularização, a gestão poderá ser suspensa mediante aviso. Campanha ativa não será pausada silenciosamente nem por automação; responsável humano avaliará o risco, comunicará o cliente e registrará a decisão.

**12.4.** A inadimplência persistente por trinta dias poderá resultar em resolução comunicada. A retomada exige pagamento confirmado e nova conferência operacional.

## 13. PROPRIEDADE INTELECTUAL

**13.1.** A CONTRATANTE recebe licença não exclusiva e por prazo indeterminado para utilizar, em seu negócio, as peças finais aprovadas e pagas.

**13.2.** Arquivos-fonte, métodos, tecnologia, software e templates da V2G não são entregues. Materiais de terceiros permanecem sujeitos às respectivas licenças.

## 14. PLATAFORMAS E TERCEIROS

**14.1.** Plataformas de mídia, pagamento, assinatura, hospedagem e mensageria possuem regras próprias. A V2G não garante aprovação, continuidade ou prazo de reversão de decisão de terceiro.

**14.2.** Bloqueio ou indisponibilidade suspenderá somente a atividade afetada. Se for causado ou mantido pela CONTRATANTE, aplica-se a cláusula 7. Se imputável à V2G, não haverá cobrança pelo período sem prestação correspondente.

**14.3.** Se evento externo permanecer sem solução por trinta dias, qualquer Parte poderá encerrar o serviço afetado sem multa, com restituição do antecipado não prestado. Substituição de conta depende de análise e aditivo.

## 15. DADOS PESSOAIS

**15.1.** A V2G é controladora dos dados usados para cadastro, pedido, contrato, cobrança e suporte. Os papéis relacionados à gestão de anúncios serão definidos por finalidade conforme as decisões efetivamente tomadas por cada Parte.

**15.2.** Quando atuar como operadora, a V2G seguirá instruções lícitas e documentadas da controladora.

**15.3.** A V2G comunicará à CONTRATANTE incidente relevante relacionado aos dados tratados em seu nome em até 24 horas da ciência, com as informações disponíveis e complementação posterior.

**15.4.** O inventário de dados, fornecedores, transferências e prazos de retenção permanece bloqueio para produção. Esta minuta não autoriza tratamento ainda não mapeado.

## 16. CONFIDENCIALIDADE

**16.1.** As Partes protegerão informações confidenciais durante o contrato e por cinco anos após seu término. Segredos comerciais serão protegidos enquanto permanecerem secretos.

**16.2.** Poderá haver retenção restrita quando necessária por lei ou para defesa de direitos. Backups seguirão prazo documentado e não retornarão ao uso operacional.

## 17. RESPONSABILIDADE

**17.1.** Cada Parte responde por seus atos, materiais, informações e acessos, conforme sua participação e a legislação aplicável.

**17.2.** A proposta desta versão de teste limita a responsabilidade ao maior valor entre seis mensalidades da conta afetada e o total pago no pedido nos doze meses anteriores ao fato.

**17.3.** O limite não se aplica a dolo, violação de confidencialidade ou dados pessoais, propriedade intelectual, uso indevido da verba de mídia ou responsabilidade que a lei não permita limitar.

**17.4.** Esta limitação exige aprovação jurídica antes de qualquer uso real.

## 18. MARCA E CASE

**18.1.** A V2G não utilizará nome, marca ou resultado identificável da CONTRATANTE sem autorização separada, específica e verificável. A recusa não altera o serviço.

## 19. COMUNICAÇÕES

**19.1.** Suporte e lembretes ocorrerão pelo WhatsApp indicado na jornada.

**19.2.** Aprovações ocorrerão pelos e-mails autorizados no Anexo III.

**19.3.** Cancelamentos e notificações jurídicas dirigidos à V2G serão enviados a `v2g.midia@gmail.com`. Alteração do contato será comunicada por meio verificável.

**19.4.** Comunicações posteriores somente alteram obrigações mediante aceite formal das Partes.

## 20. ASSINATURA, VERSÃO E EVIDÊNCIAS

**20.1.** O provedor de assinatura permanece não identificado. Para produção, deverá oferecer ao menos assinatura eletrônica avançada, identificação, conferência de poderes, documento íntegro, hash, trilha e API de envio, consulta, eventos e download.

**20.2.** “Gerado”, “enviado”, “aberto” e “parcialmente assinado” não equivalem a contrato concluído.

**20.3.** Antes da conclusão, qualquer correção gera nova versão. A anterior é preservada e invalidada para assinatura.

**20.4.** Após a conclusão, PDF e trilha não serão alterados. Mudanças exigem aditivo ou novo contrato ligado ao original.

**20.5.** A conclusão exige todas as assinaturas requeridas, PDF final, trilha e hashes reconciliados com pedido e versão. A cópia final será entregue aos signatários.

## 21. CESSÃO, PREVALÊNCIA E ALTERAÇÃO SOCIETÁRIA

**21.1.** Dados específicos do Quadro-Resumo e pedido prevalecem sobre cláusulas gerais; depois, aplicam-se Contrato e anexos. A hierarquia não elimina promessa comercial legalmente vinculante.

**21.2.** Reorganização que mantenha a mesma pessoa jurídica e CNPJ exige atualização cadastral e aviso quando relevante. Transferência do contrato para outra pessoa jurídica depende de análise de sucessão, capacidade e eventual consentimento.

**21.3.** Alteração de sócios não será descrita neste contrato. A representação será conferida pelo ato societário vigente na data da assinatura. Contratos anteriores preservam a evidência de quem possuía poderes quando assinou.

## 22. CONFLITOS E FORO

**22.1.** As Partes tentarão negociação por quinze dias, sem impedir medida urgente ou acesso ao Judiciário. Mediação é facultativa.

**22.2.** Fica eleito o foro de Curitiba/PR somente onde a eleição for válida, preservados foro e proteções obrigatórias aplicáveis.

## 23. NFS-e — BLOQUEIO DE AUTOMAÇÃO

**23.1.** A NFS-e abrangerá apenas o serviço de gestão, sem a verba de mídia, e acompanhará cada mês de serviço prestado, inclusive nos antecipados, conforme orientação contábil final.

**23.2.** Município, competência, valor por mês, primeiro ciclo, adiantamento, retenção, restituição, estorno e chargeback dependem de confirmação da Contabilizei e do cadastro efetivo no emissor.

**23.3.** R$ 475,00 e R$ 440,00 são divisões aritméticas dos planos semestral e anual, não parâmetros fiscais aprovados. Nenhuma emissão automática será habilitada por esta minuta.

## ANEXO I — CONTAS CONTRATADAS

| Ordem | Plataforma | Conta externa | Titularidade | Estado | Teto de mídia |
|---|---|---|---|---|---|
| `{{unidade.ordinal}}` | `{{unidade.plataforma}}` | `{{unidade.conta_id_externo}}` | `{{unidade.titularidade}}` | `{{unidade.estado_identificacao}}` | `{{unidade.teto_midia_formatado}}` |

## ANEXO II — SIGNATÁRIOS

| Parte | Nome | E-mail | Papel | Regra | Evidência de poderes | Conferida em |
|---|---|---|---|---|---|---|
| `{{signatario.parte}}` | `{{signatario.nome}}` | `{{signatario.email}}` | `{{signatario.papel}}` | `{{signatario.regra_assinatura}}` | `{{signatario.evidencia_poderes}}` | `{{signatario.evidencia_conferida_em}}` |

Pela V2G, Victor assinará como administrador somente se o ato societário vigente confirmar poderes suficientes e assinatura individual. Pela CONTRATANTE, assinará ao menos um sócio, dono ou representante com poderes comprovados; representação conjunta exige todos os representantes necessários.

## ANEXO III — PESSOAS AUTORIZADAS A APROVAR

| Nome | E-mail confirmado | Papel | Atos autorizados | Vigência da autorização |
|---|---|---|---|---|
| `{{aprovador.nome}}` | `{{aprovador.email}}` | `{{aprovador.papel}}` | `{{aprovador.atos_autorizados}}` | `{{aprovador.vigencia}}` |

## ASSINATURAS

**Não preencher ou assinar esta versão de teste.**

**V2G:** `{{prestador.signatario.nome}}` — `{{prestador.signatario.qualificacao}}`  
**CONTRATANTE:** `{{signatario.nome}}` — `{{signatario.papel}}`  
**Provedor:** pendente de identificação  
**Status permitido nesta versão:** `ready_for_review`
