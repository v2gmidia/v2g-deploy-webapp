# Revisão cláusula por cláusula e minuta consolidada V2G

Consulta realizada em 13/10/2026. Estas notas separam: **fato verificado** (texto da minuta/schema ou contexto confirmado pelo usuário), **interpretação jurídica** (leitura de risco a ser decidida pelo advogado) e **recomendação** (redação/controle sugerido). Não constituem parecer nem aprovação para assinatura.

## 1. Quais cláusulas são ambíguas, contraditórias, incompletas ou inseguras?

### Takeaway

A minuta é uma boa base de mapeamento, mas não é uma versão assinável: contém bloqueios expressos em 15 temas, não contempla o plano semestral e mistura cláusulas destinadas às partes com controles internos de automação. Antes de liberar, o advogado deve escolher os módulos pendentes e identificar uma versão final imutável.

### Cited Findings

Fonte primária da comparação: [minuta V2G `minuta-interna-2026-10-09-v1`](../../docs/contrato-v2g-minuta-parametrica.md). Fonte estrutural: [JSON Schema atual](../../docs/contrato-v2g.schema.json). O CDC exige informação clara e vincula a oferta quando aplicável à relação concreta, além de invalidar cláusulas abusivas; a incidência do CDC sobre um cliente pessoa jurídica depende da posição concreta de destinatário final e vulnerabilidade e deve ser decidida pelo advogado, não presumida pelo template — [Lei 8.078/1990, arts. 2º, 6º, 30, 46, 47 e 51](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm). A boa-fé objetiva e a força obrigatória/alocação de riscos nos contratos civis e empresariais exigem redação coerente e inteligível — [Código Civil, arts. 421, 421-A e 422](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm).

| Cláusula exata | Texto atual resumido | Problema ou ambiguidade | Consequência prática | Prioridade | Proposta de redação/encaminhamento |
|---|---|---|---|---|---|
| Cabeçalho e metadados | “MINUTA INTERNA... NÃO ENVIAR”; versão `minuta-interna-2026-10-09-v1` | Correto para revisão, mas incompatível com envio/assinatura. Falta campo de data e ato de aprovação jurídica e identificador da versão liberada. | Automação pode usar arquivo íntegro, porém juridicamente não liberado. | Bloqueante | Manter aviso apenas na versão de revisão. Criar registro externo `{{contrato.template_id}}`, `{{contrato.versao_minuta}}`, `{{contrato.aprovado_por}}`, `{{contrato.aprovado_em}}`; documento de assinatura deve conter a versão aprovada, sem rótulo “minuta”. |
| Partes | Representante do cliente “declara possuir poderes”; V2G não infere poderes | “Poderes comprovados” no contexto é mais forte que mera declaração. Não há critério, documento ou aprovação da evidência. | Contrato pode ser assinado por pessoa sem poderes, com risco de contestação. | Bloqueante | “A assinatura depende da conferência, pelo procedimento `{{signatario.tipo_evidencia_poderes}}`, de que `{{signatario.nome}}` possui poderes... A declaração não substitui a evidência exigida.” Deixar o critério para decisão jurídica. |
| 1.1–1.2 Objeto | Gestão de tráfego; lista aberta com “poderá compreender” | “Poderá” não define entregas mínimas; plataforma e quantidade só aparecem no anexo; “acompanhamento” não tem frequência. | Expectativas divergentes sobre o que os R$ 500/2.850/5.280 compram. | Bloqueante | Vincular objeto ao Quadro-Resumo e definir catálogo mínimo aprovado: “serviços descritos nos itens `{{escopo.itens_incluidos}}`, para `{{pedido.quantidade_de_contas}}` conta(s), na(s) plataforma(s) `{{pedido.plataformas}}`”. O que não for decidido deve ficar fora da versão assinável. |
| 1.3 e 4.5–4.6 Primeira publicação | Manual pelo gestor após condições cumulativas | Bom alinhamento geral, mas 4.5 inclui pagamento/assinatura/acessos/conta/materiais/conferências sem definir “conferências” ou registrar a aprovação final. | Pode haver disputa sobre atraso ou sobre quem liberou publicação. | Alta | Enumerar checklist versionado: pagamento aprovado, e-mail confirmado, contrato concluído, poderes conferidos, acessos válidos, conta identificada, materiais aprovados e preflight `{{publicacao.checklist_id}}` concluído por `{{publicacao.gestor_id}}`. Não prometer data enquanto houver pendência. |
| 1.4 Exclusões | Lista de exclusões e ausência de garantia | “Salvo contratação expressa” não define forma; ausência de garantia aparece dentro de exclusões e também na cláusula 3. | Adicionais podem ser alegados por mensagens; repetição dificulta leitura. | Média | Remeter adicionais a pedido/aditivo assinado. Mover toda ausência de garantia à cláusula 3; manter em 1.4 apenas exclusões objetivas. |
| 2.1–2.3 Unidade/CNPJ | Cobrança por conta; contrato separado por CNPJ | Alinhado ao contexto, mas faltam regra de associação pedido–CNPJ–unidade e tratamento de grupo econômico/mesmo login. | Mistura de cobrança, verba, ativos ou encerramento entre empresas. | Alta | “Cada `{{pedido.id}}` vincula-se exclusivamente ao CNPJ `{{contratante.cnpj}}`; login multiempresa é apenas credencial de acesso e não consolida contratos, saldos, verbas ou dados.” |
| 2.4 Substituição de conta | Depende de “procedimento operacional aprovado” | Procedimento não existe no contrato e cobrança/gratuidade ficam abertas. | Troca de conta vira decisão casuística. | Bloqueante | Advogado/Victor devem escolher: substituição gratuita limitada; nova unidade; ou análise caso a caso por aditivo. A versão assinável precisa de uma regra ou excluir a possibilidade. |
| 3.1–3.4 Obrigação de meio | Sem garantia de resultado | Correto, mas “diligência técnica” e “referências” não afastam dever de prestar o serviço nem oferta/publicidade vinculante quando CDC for aplicável. | Linguagem pode ser lida como exoneração ampla. | Alta | Acrescentar: “A ausência de garantia de resultado não afasta o dever de executar as atividades contratadas, prestar informações verdadeiras e responder nos limites da lei por falha imputável.” [CDC, arts. 20 e 30](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm). |
| 4.1 Acesso | Acesso após pagamento aprovado | Contexto confirmado exige também e-mail confirmado; a minuta omite isso. | Conta pode ser liberada a e-mail não confirmado. | Bloqueante de produto | “O acesso poderá ser liberado somente após `{{pedido.pagamento_aprovado_em}}` e `{{contratante.email_confirmado_em}}`; isso não prova assinatura nem autoriza publicação.” |
| 4.2 Pix assistido | Detalha comprovante e aprovação humana | Pode ficar obsoleto ou conflitar com checkout Asaas; é regra operacional específica, não essencial ao contrato. | Documento jurídico congela fluxo de pagamento não consolidado. | Média | Generalizar: “Pagamento aprovado é o estado confirmado no pedido por evento verificável do provedor ou procedimento interno autorizado”; detalhes ficam na política operacional versionada. |
| 4.3–4.4 Onboarding/reunião | Podem ocorrer antes da assinatura | Alinhado. Falta dizer se a reunião integra preço, se é única/opcional e se gera início da prestação. | Discussão sobre prestação iniciada antes da assinatura e marco de vigência. | Bloqueante | Vincular ao marco escolhido: “Onboarding e agendamento são atos preparatórios e não iniciam, isoladamente, a vigência nem a gestão, salvo opção jurídica expressa.” Definir quantidade/natureza da reunião em escopo. |
| 5.1(c), 7.2 e 7.5 Aprovações | Toda peça submetida; nenhum anúncio sem aprovação; canais pendentes | Pode inviabilizar ajustes rotineiros e não distingue primeira peça de variações/otimizações. Canal/identidade/prazo pendentes. | Campanha para ou publica sem prova suficiente. | Bloqueante | Criar matriz: quais atos exigem aprovação prévia (oferta, peça, texto, orçamento, primeira publicação) e quais ajustes ficam autorizados dentro do escopo. Definir canal, aprovadores e silêncio nunca como aprovação, salvo escolha expressa do advogado. |
| 5.2 Suporte/relatórios/reuniões | Tudo pendente | Entrega essencial da oferta não está definida. | Impossível medir adimplemento ou informar corretamente no checkout. | Bloqueante | Preencher campos: `{{suporte.canal}}`, `{{suporte.janela}}`, `{{suporte.prazo_resposta}}`, `{{relatorio.periodicidade}}`, `{{reuniao.quantidade}}`. Se não houver reunião recorrente, dizer expressamente. |
| 6 Obrigações do cliente | Dados, acessos, verba, materiais, aprovação e atendimento | Não há prazo de correção, mecanismo de notificação nem efeito da pendência sobre prazos, preço e período mínimo. | Cliente pode pagar durante paralisação sem regra clara; V2G pode ficar indefinidamente impedida. | Alta | Definir “Pendência da Contratante” com comunicação verificável, suspensão apenas dos prazos afetados e efeitos financeiros escolhidos pelo advogado. Não presumir extensão automática do prazo mínimo. |
| 7.1 IA | IA como apoio a textos, imagens e análises | Falta delimitar dados que podem ser enviados, revisão humana, direitos/licenças e que resultado de IA não elimina dever de conferência. | Risco de confidencialidade, LGPD, propriedade intelectual e conteúdo incorreto. | Alta | “A IA será ferramenta auxiliar; uso de dados pessoais/confidenciais, fornecedores, retenção e transferências seguem Anexo de Dados; conteúdo será revisado antes de envio para aprovação.” Não prometer originalidade/exclusividade. |
| 8.2–8.4 Verba | Cliente paga à plataforma; V2G pode reduzir/redistribuir/pausar dentro do orçamento | “Dentro do orçamento” não define período, teto por conta, plataforma, tolerância nem necessidade de aprovação. | Gasto ou redistribuição contestados; confusão entre preço do serviço e mídia. | Bloqueante | Quadro-Resumo com `{{verba.moeda}}`, `{{verba.teto_periodo}}`, `{{verba.periodicidade}}`, `{{verba.conta_id}}`; aumento só com aprovação verificável. Definir se redistribuição entre campanhas da mesma conta é autorizada e proibir transferência entre CNPJs. |
| 9.1–9.4 Preço | Apenas mensal R$500 e anual R$5.280; exclui desconto semestral | Diverge do contexto: semestral à vista R$2.850. Também usa “periodicidade” para planos que combinam duração e forma de cobrança. | Checkout e contrato podem cobrar/exibir planos diferentes. | Bloqueante | Três enums: `mensal_com_permanencia_minima_6m`, `semestral_antecipado_6m`, `anual_antecipado_12m`; unitários R$500/mês, R$2.850/semestre e R$5.280/ano por conta. Só a opção selecionada aparece no documento final. |
| 9.5–9.7 Cobrança/NFS-e | Vencimento no anexo; inadimplência pendente; NFS-e genérica | Não trata mês parcial, cancelamento/estorno, antecipados nem emissão mensal por serviço prestado. | Divergência financeira/contábil e documento fiscal desalinhado da competência. | Bloqueante | Incluir módulo aprovado de vencimento, pró-rata ou não, estorno e inadimplência. Redação fiscal provisória: “A NFS-e acompanhará cada mês de serviço efetivamente prestado, inclusive nos planos antecipados, conforme orientação contábil e regras fiscais aplicáveis”; contabilidade deve confirmar competência, valores e município. |
| 10.1–10.4 Vigência | Início placeholder; mínimo 6 meses; marco e pós-mínimo pendentes | A cláusula afirma seis meses, mas não define quando começam/terminam; não diferencia vigência anual e compromisso mínimo. | Não se sabe quando cobrar, renovar ou permitir saída. | Bloqueante | Quadro-Resumo com `{{contrato.marco_inicio}}`, `{{contrato.data_inicio}}`, `{{contrato.data_fim_periodo_minimo}}`, `{{contrato.data_fim_plano}}`; escolher renovação automática, continuidade indeterminada ou nova contratação. |
| 11 Encerramento | Expõe “intenção comercial” de cobrar meses restantes, mas nega obrigação | Não deve integrar contrato enviado: é nota interna e não cria regra exigível. Não trata rescisão por falha, aviso, procedimento ou cálculo. | Confusão e alto risco de cobrança contestada. | Bloqueante | Remover notas internas. Inserir somente módulo escolhido pelo advogado: (A) vencimento antecipado limitado; (B) multa compensatória proporcional; ou (C) sem cobrança futura; com hipóteses de rescisão por inadimplemento da V2G, força maior e eventual CDC. |
| 12.1–12.4 Ativos/IP | Cliente é titular de contas, públicos e históricos; V2G mantém tecnologia; criação pendente | “Públicos” e “conjuntos de dados” podem ter regras da plataforma/terceiros; peças criadas não têm licença definida. | Dificuldade de uso após término e disputa sobre arquivos editáveis. | Alta | Separar ativos preexistentes, ativos da plataforma, materiais do cliente, entregáveis finais e ferramentas V2G. Definir licença/cessão, território, prazo, arquivos-fonte e condicionamento ao pagamento. |
| 13 Plataformas de terceiros | Sem garantia de aprovação; responsabilidade conforme origem | “Conforme origem e legislação” é vago; falta procedimento para bloqueio/indisponibilidade e gasto já incorrido. | Responsabilidade e continuidade incertas. | Alta | Definir aviso, cooperação, pausa quando tecnicamente possível e que políticas de terceiros não exoneram falha própria. Não prometer reversão ou prazo de análise. |
| 14 LGPD | Papéis condicionais; vários temas pendentes | Correto não fixar papel universal, mas a versão assinável precisa de finalidades, categorias, instruções, suboperadores, segurança, incidentes, retenção e direitos. Papéis decorrem dos fatos, não apenas do rótulo contratual. | Contrato incompleto para tratamento de leads, contatos, acessos e dados de assinatura. | Bloqueante | Anexo de Tratamento de Dados com matriz por finalidade. Operador segue instruções documentadas do controlador [LGPD, arts. 5º VI–VII e 39](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm); ANPD recomenda definir contratualmente papéis/suboperadores e incidentes [Guia de agentes](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/Segunda_Versao_do_Guia_de_Agentes_de_Tratamento_retificada.pdf), [comunicação de incidente](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis). |
| 15 Confidencialidade | Princípio geral; prazo/exceções/devolução pendentes | Sem prazo, grau de cuidado, autorizados e medidas após término. | Proteção insuficiente e difícil de executar. | Alta | Definir pessoas autorizadas, padrão de cuidado, exceções comprováveis, divulgação legal, devolução/eliminação e sobrevivência. Compatibilizar com backups/retenção legal/LGPD. |
| 16 Responsabilidade | Regra genérica; limite e indenização pendentes | Não há alocação concreta; eventual limitação ampla pode ser inválida conforme relação e conduta. | Exposição imprevisível para ambas as partes. | Bloqueante | Advogado escolhe limite e carve-outs. Nunca excluir dolo, obrigações inderrogáveis ou direitos legais aplicáveis; alinhar com danos por dados, PI e verba de mídia. |
| 17 Nome/marca/case | Proíbe sem autorização; forma pendente | Base correta. Autorização embutida pode não ser livre/segregada; resultados podem não provar causalidade. | Uso reputacional sem consentimento verificável ou claims enganosos. | Média | Autorização separada, opcional, específica, revogável para usos futuros e sem condicionar o serviço. Case deve indicar fonte/período/limitações. |
| 18 Comunicações | Contatos no Anexo; canais pendentes | Sem canal formal, recebimento, atualização, prazo e ato autorizado por cada pessoa. | Aprovação/cancelamento não comprovados. | Bloqueante | Matriz por ato: operacional, orçamento, peças, rescisão e notificação jurídica; registrar identidade, conteúdo, data e confirmação. |
| 19 Assinatura eletrônica | Provedor pendente; autoria/integridade; todos devem concluir | Estrutura correta, mas não distingue validade do negócio, valor probatório e executividade. Falta provedor/documento/envelope/hash/PDF/trilha na estrutura. | Estado “signed” pode ser marcado sem evidência final suficiente. | Bloqueante técnico/jurídico | Exigir provedor aprovado, identidade, hash do conteúdo enviado, eventos autenticados e PDF/trilha final. MP 2.200-2 aceita outros meios se admitidos pelas partes [art. 10, §2º](https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm); a Lei 14.063 define níveis de assinatura [art. 4º](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm); o CPC admite dispensa de testemunhas em título eletrônico quando a integridade é conferida por provedor, mas certeza/liquidez/exigibilidade ainda importam [CPC, arts. 783 e 784, III e §4º](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilada.htm). |
| 20 Versionamento | Nova versão antes; assinado imutável; idempotência | Bom controle, porém idempotência e snapshot são controles de sistema, não obrigação central do cliente. “Para sempre” no Anexo D pode conflitar com retenção/legalidade. | Documento fica longo e retenção pode ser excessiva. | Alta | Manter no contrato apenas integridade, substituição pré-assinatura e aditivo pós-assinatura. Mover idempotência/estados/retenção ao protocolo técnico; definir período de guarda juridicamente validado. |
| 21 Gerais | Sem vínculo, tolerância, nulidade, cessão pendente | Cessão não resolvida; falta ordem de prevalência entre contrato, anexos, pedido e oferta. | Conflito documental e transferência incerta. | Alta | Definir prevalência: versão assinada + Quadro-Resumo + anexos; material comercial integra apenas nos limites legais. Escolher regra de cessão e mudança de controle. |
| 22 Lei/foro | Brasil; foro/mediação pendentes | Documento não pode ser assinado sem mecanismo definido. Foro eleito pode ser questionado se abusivo/CDC aplicável. | Discussão processual e custo. | Bloqueante | Advogado escolhe negociação prévia e foro competente considerando domicílios, natureza B2B/consumo e regras inderrogáveis. Não importar foro legado. |
| Assinaturas/Anexo A | Um signatário por parte; plano, total, vencimento | “Ao menos um” pode exigir mais de um conforme representação conjunta. Não há e-mail/CPF do signatário no quadro nem evidência de poderes. | Envelope pode concluir com assinaturas insuficientes. | Bloqueante | `{{signatarios_contratante[]}}` e `{{signatarios_v2g[]}}`, cada qual com papel, regra (individual/conjunta), evidência, status e horário. Estado final apenas quando a regra de assinatura for satisfeita. |
| Anexos D/E | Fluxo técnico e checklist dentro do contrato | São documentos internos, não obrigações negociais; podem expor arquitetura e criar compromisso técnico desnecessário. | Mudança do sistema pode exigir aditivo sem mudança da relação. | Média | Remover da cópia do cliente e manter como especificação interna versionada ligada ao template aprovado. |

### Inferences

- A versão atual deve continuar bloqueada para assinatura porque o próprio texto declara inexistência de aprovação e contém módulos essenciais sem solução.
- A maneira mais segura de “deixar o contrato pronto” sem inventar decisões é produzir uma **versão consolidada para decisão**, com alternativas destacadas fora do texto final, e só depois gerar a versão assinável contendo uma única alternativa em cada tema.
- O preço mensal com permanência mínima precisa ser apresentado com especial clareza: “mensal” descreve cobrança, não necessariamente liberdade de cancelamento mensal.

### Gaps

- Não foi fornecida decisão sobre marco inicial, pró-rata, renovação, saída antecipada, inadimplência, suporte, relatórios, propriedade intelectual, responsabilidade, dados e foro.
- Não há prova nesta tarefa de qual linguagem está hoje no checkout; a contradição com o checkout deve ser confirmada por inspeção do produto.
- Não há provedor de assinatura selecionado nem requisitos de identidade/testemunhas definidos.

## 2. Como integrar os três planos, a permanência mínima e a verba separada?

### Takeaway

O contrato deve separar: (i) unidade de preço = conta de anúncios; (ii) duração do plano; (iii) forma/momento da cobrança; e (iv) compromisso mínimo. O Quadro-Resumo deve exibir apenas o plano escolhido e calcular totais por quantidade, sem esconder que a verba de mídia é adicional.

### Cited Findings

- O schema atual só aceita `monthly` e `annual_upfront`, valores unitários de 50.000 ou 528.000 centavos e descontos 0% ou 12%; portanto não consegue representar o semestral de R$ 2.850 — [schema atual](../../docs/contrato-v2g.schema.json).
- O texto atual afirma expressamente que “não há desconto semestral”, em divergência direta com o contexto confirmado — [cláusula 9.4 da minuta](../../docs/contrato-v2g-minuta-parametrica.md).
- Quando o CDC for aplicável, quantidade, características e preço exigem informação adequada e clara, e a oferta vincula o fornecedor — [CDC, arts. 6º, III, e 30](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm).

### Inferences

Modelo de dados recomendado:

| Campo | Valores | Regra |
|---|---|---|
| `{{pedido.unidade_cobranca}}` | `conta_de_anuncios` | Uma unidade por conta, sempre vinculada a um CNPJ. |
| `{{pedido.plano}}` | `mensal_minimo_6m`, `semestral_antecipado`, `anual_antecipado` | Não usar apenas “periodicidade”. |
| `{{pedido.quantidade_de_contas}}` | inteiro ≥1 | Deve igualar unidades individualizadas. |
| `{{pedido.valor_unitario}}` | 500,00 / 2.850,00 / 5.280,00 | Por conta. |
| `{{pedido.valor_total}}` | quantidade × unitário | Derivado, nunca livre. |
| `{{pedido.forma_cobranca}}` | mensal recorrente / antecipada única | Separada da duração. |
| `{{contrato.periodo_minimo_meses}}` | 6 | Confirmado como proposta; efeitos da saída dependem do advogado. |
| `{{verba.incluida_no_preco}}` | `false` | Texto destacado no Quadro-Resumo. |
| `{{verba.teto_aprovado}}` | valor/moeda/período/conta | Não confundir com preço V2G. |

Redação-base recomendada:

> “A unidade contratada é cada conta de anúncios indicada no Quadro-Resumo. Para `{{pedido.quantidade_de_contas}}` unidade(s), a CONTRATANTE escolheu o plano `{{pedido.plano}}`, ao preço unitário de `{{pedido.valor_unitario_formatado}}` por conta, totalizando `{{pedido.valor_total_formatado}}`. O documento final exibirá somente uma das seguintes modalidades: (a) mensal: R$ 500,00 por conta por mês, sujeito ao período mínimo de seis meses e aos efeitos de saída aprovados na Cláusula `{{clausula_saida}}`; (b) semestral antecipado: R$ 2.850,00 por conta pelos seis meses; ou (c) anual antecipado: R$ 5.280,00 por conta pelos doze meses. A verba de mídia não integra esses preços e será paga pela CONTRATANTE diretamente à plataforma, vinculada à respectiva empresa e conta.”

O texto acima ainda depende das decisões de restituição/saída e não deve ser enviado isoladamente como versão final.

### Gaps

- O percentual de desconto semestral não foi informado e não deve ser inventado; basta apresentar o valor final de R$ 2.850,00, salvo decisão de marketing/jurídico sobre exibir comparação.
- Mês parcial, vencimento e datas de competência permanecem pendentes.
- Falta confirmar com a contabilidade a redação e a operação de NFS-e mensal nos planos antecipados.

## 3. Qual minuta consolidada pode ser levada à decisão do advogado?

### Takeaway

Abaixo está uma versão integral **pronta para revisão e seleção dos módulos**, não aprovada para assinatura. Campos variáveis estão explícitos; opções jurídicas permanecem fora da escolha automática e devem ser resolvidas antes de retirar os marcadores.

### Cited Findings

A redação incorpora os fatos do contexto confirmado e corrige a [minuta atual](../../docs/contrato-v2g-minuta-parametrica.md). Os módulos de assinatura observam a admissibilidade de meios eletrônicos com autoria e integridade [MP 2.200-2/2001, art. 10](https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm) e a disciplina probatória/executiva [CPC, arts. 783 e 784](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilada.htm).

#### CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE GESTÃO DE ANÚNCIOS — VERSÃO CONSOLIDADA PARA DECISÃO JURÍDICA

**Status:** NÃO APROVADO PARA ASSINATURA. Remover esta linha somente após aprovação registrada da versão `{{contrato.versao_minuta}}`.

**Documento:** `{{contrato.id}}` · **versão:** `{{contrato.versao_documento}}` · **pedido:** `{{pedido.id}}` · **gerado em:** `{{contrato.gerado_em}}` · **hash do arquivo enviado:** `{{contrato.hash_envio}}`

### QUADRO-RESUMO

| Campo | Valor |
|---|---|
| Contratante/CNPJ | `{{contratante.razao_social}}` / `{{contratante.cnpj}}` |
| Pedido | `{{pedido.id}}` |
| Quantidade de contas | `{{pedido.quantidade_de_contas}}` |
| Plano escolhido | `{{pedido.plano}}` |
| Preço unitário por conta | `{{pedido.valor_unitario_formatado}}` |
| Preço total do pedido | `{{pedido.valor_total_formatado}}` |
| Forma de cobrança | `{{pedido.forma_cobranca}}` |
| Vencimento/pagamento | `{{pedido.regra_vencimento}}` |
| Período mínimo | 6 meses |
| Marco inicial | `{{contrato.marco_inicio_aprovado}}` |
| Data de início | `{{contrato.data_inicio}}` |
| Fim do período mínimo | `{{contrato.data_fim_periodo_minimo}}` |
| Fim do plano, se determinado | `{{contrato.data_fim_plano}}` |
| Verba de mídia | Não incluída; `{{verba.regra_aprovada}}` |
| Contas/plataformas | Anexo I |
| Signatários exigidos | Anexo II |

**CONTRATADA:** `{{prestador.razao_social}}`, CNPJ `{{prestador.cnpj}}`, com endereço em `{{prestador.endereco}}`, representada por `{{prestador.signatario.nome}}`, `{{prestador.signatario.qualificacao_e_poderes}}`, doravante **V2G**.

**CONTRATANTE:** `{{contratante.razao_social}}`, nome fantasia `{{contratante.nome_fantasia}}`, CNPJ `{{contratante.cnpj}}`, com endereço em `{{contratante.endereco}}`, e-mail contratual `{{contratante.email_contratual}}`, representada pelo(s) signatário(s) do Anexo II, doravante **CONTRATANTE**.

### 1. OBJETO E ESCOPO

1.1. A V2G prestará serviços de gestão de anúncios para as contas individualizadas no Anexo I, utilizando tecnologia e acompanhamento humano, conforme o escopo `{{escopo.itens_incluidos}}`.

1.2. Integram o escopo apenas as atividades expressamente descritas no Quadro-Resumo e no Anexo I. Ficam excluídos `{{escopo.itens_excluidos_aprovados}}`. Serviço adicional depende de novo pedido, aditivo ou contrato assinado.

1.3. A primeira campanha será preparada e publicada manualmente por gestor da V2G apenas depois da conclusão cumulativa da Cláusula 5.

### 2. EMPRESAS, CONTAS E SEGREGAÇÃO

2.1. Cada conta de anúncios é uma unidade de contratação e preço. Este contrato abrange `{{pedido.quantidade_de_contas}}` unidade(s) do CNPJ `{{contratante.cnpj}}`.

2.2. Um login poderá permitir acesso a mais de um CNPJ, sem unificar pedidos, contratos, cobrança, verba, campanhas, dados, responsabilidades ou encerramento. Cada CNPJ terá documento próprio.

2.3. A substituição de conta seguirá `{{conta.regra_substituicao_aprovada}}`. Enquanto esse campo não estiver aprovado e preenchido, a substituição não será presumida gratuita nem cobrada automaticamente.

### 3. PREÇO, PLANO E VERBA

3.1. O plano escolhido é `{{pedido.plano}}`. O gerador exibirá no documento final somente uma modalidade:

- **Mensal:** R$ 500,00 por conta por mês, total mensal `{{pedido.valor_total_formatado}}`, com permanência mínima de seis meses;
- **Semestral antecipado:** R$ 2.850,00 por conta por seis meses, total `{{pedido.valor_total_formatado}}`;
- **Anual antecipado:** R$ 5.280,00 por conta por doze meses, total `{{pedido.valor_total_formatado}}`.

3.2. A verba de mídia é separada e não integra a remuneração da V2G. Será paga pela CONTRATANTE diretamente à plataforma, por meio vinculado à empresa e conta correspondentes, segundo teto `{{verba.teto_aprovado}}`, moeda `{{verba.moeda}}` e período `{{verba.periodo}}`.

3.3. A V2G não aumentará o teto sem aprovação verificável. A autorização para redistribuir ou pausar verba dentro da mesma conta será `{{verba.regra_ajustes_aprovada}}`. É vedada a transferência de verba entre CNPJs sem instrumento próprio.

3.4. Vencimento, mês parcial e inadimplência obedecerão a `{{financeiro.regra_aprovada}}`. Esse campo é bloqueante para assinatura.

3.5. A emissão da NFS-e acompanhará cada mês de serviço efetivamente prestado, inclusive nos planos antecipados, conforme `{{fiscal.regra_confirmada_contabilidade}}` e a legislação fiscal aplicável.

### 4. PAGAMENTO, ACESSO E ATOS PREPARATÓRIOS

4.1. O acesso ao WebApp poderá ser liberado após pagamento aprovado em `{{pedido.pagamento_aprovado_em}}` e confirmação do e-mail em `{{contratante.email_confirmado_em}}`.

4.2. Acesso, onboarding, envio de dados e agendamento/realização de reunião são atos distintos. Isoladamente, não provam assinatura, não autorizam publicação e `{{contrato.efeito_dos_atos_preparatorios_sobre_vigencia}}`.

### 5. CONDIÇÕES PARA A PRIMEIRA PUBLICAÇÃO

5.1. A primeira campanha só será publicada depois de: pagamento aprovado; contrato concluído por todos os signatários exigidos; poderes de representação conferidos; acessos válidos; conta identificada; materiais e oferta aprovados; verba configurada; e checklist operacional `{{publicacao.checklist_id}}` concluído.

5.2. A publicação será manual por `{{publicacao.gestor_responsavel}}`. Nenhuma etapa anterior autoriza publicação automática.

5.3. Pendências do cliente serão comunicadas pelo canal `{{comunicacao.canal_pendencias}}` e produzirão os efeitos `{{pendencias.efeitos_aprovados}}`, sem promessa de data independente de sua resolução.

### 6. OBRIGAÇÕES DA V2G

6.1. A V2G executará o escopo com diligência; utilizará os acessos apenas para a contratação correspondente; respeitará o orçamento aprovado; registrará aprovações e atos relevantes; e comunicará pendências ou ocorrências relevantes conhecidas.

6.2. Suporte: `{{suporte.canal}}`, `{{suporte.janela}}`, prazo de resposta `{{suporte.prazo_resposta}}`. Relatórios: `{{relatorio.conteudo_e_periodicidade}}`. Reuniões incluídas: `{{reuniao.regra_aprovada}}`.

### 7. OBRIGAÇÕES DA CONTRATANTE

7.1. A CONTRATANTE fornecerá dados verdadeiros; manterá contatos e poderes atualizados; concederá acessos; manterá verba/meio de pagamento; entregará materiais; aprovará ou reprovará oferta, texto, peças e orçamento; e garantirá direitos e veracidade dos materiais e condições comerciais fornecidos.

7.2. A CONTRATANTE é responsável pelo atendimento e fechamento dos contatos recebidos. Contato ou conversa não equivale a venda ou receita atribuída.

### 8. APROVAÇÕES E INTELIGÊNCIA ARTIFICIAL

8.1. Atos que exigem aprovação prévia: `{{aprovacao.atos}}`. Canais válidos: `{{aprovacao.canais}}`. Aprovadores: `{{aprovacao.pessoas_autorizadas}}`. O silêncio `{{aprovacao.efeito_do_silencio_aprovado}}`.

8.2. A V2G poderá usar IA como ferramenta auxiliar, sujeita a revisão humana antes da apresentação para aprovação. Dados pessoais/confidenciais, fornecedores e retenção seguirão o Anexo de Tratamento de Dados. Não há promessa de originalidade, exclusividade ou ausência absoluta de similaridade.

### 9. NATUREZA DA OBRIGAÇÃO

9.1. A obrigação é de meio. Não há garantia de contatos, vendas, faturamento, retorno, custo por resultado, aprovação por plataforma ou data de publicação enquanto houver dependência da CONTRATANTE ou de terceiro.

9.2. Isso não afasta a obrigação de executar o escopo, prestar informações verdadeiras e responder, nos limites da lei e deste contrato, por falhas imputáveis à V2G.

### 10. VIGÊNCIA, PERMANÊNCIA E RENOVAÇÃO

10.1. A vigência começa no evento `{{contrato.marco_inicio_aprovado}}`, ocorrido em `{{contrato.data_inicio}}`. O período mínimo termina em `{{contrato.data_fim_periodo_minimo}}`.

10.2. Após o prazo mínimo/plano, aplicar-se-á `{{contrato.regra_renovacao_ou_continuidade_aprovada}}`. Reajuste: `{{financeiro.regra_reajuste_aprovada}}`.

### 11. CANCELAMENTO, RESCISÃO E PLANOS ANTECIPADOS

11.1. Pedido, canal, antecedência e data efetiva de cancelamento: `{{encerramento.procedimento_aprovado}}`.

11.2. Saída antes dos seis meses: `{{encerramento.regra_saida_antecipada_aprovada}}`, com fórmula, limite e exceções expressos.

11.3. Restituição/retenção nos planos semestral e anual antecipados: `{{encerramento.regra_planos_antecipados_aprovada}}`.

11.4. Rescisão por inadimplemento da V2G, inadimplemento da CONTRATANTE, impossibilidade técnica e força maior: `{{encerramento.hipoteses_e_efeitos_aprovados}}`.

11.5. Encerrado o contrato, a V2G registrará a situação das campanhas, retirará acessos conforme `{{encerramento.procedimento_acessos}}` e entregará `{{encerramento.entregaveis}}`. O encerramento de uma conta/CNPJ não encerra outro contrato.

### 12. INADIMPLÊNCIA E ESTORNO

12.1. Carência, aviso, encargos, suspensão, retomada, chargeback e estorno: `{{inadimplencia.regra_aprovada}}`. Não haverá suspensão automática sem a condição e comunicação definidas nesse campo.

### 13. TITULARIDADE E PROPRIEDADE INTELECTUAL

13.1. Contas e ativos preexistentes da CONTRATANTE permanecem seus. A V2G atua por acesso autorizado.

13.2. Tecnologia, métodos, templates e materiais preexistentes da V2G permanecem seus.

13.3. Titularidade/licença dos entregáveis específicos, arquivos-fonte e uso após término: `{{propriedade_intelectual.regra_aprovada}}`, respeitados direitos de terceiros e regras das plataformas.

### 14. TERCEIROS

14.1. Plataformas de mídia, pagamento, assinatura, hospedagem e mensageria são terceiros sujeitos a regras e decisões próprias. A V2G não garante aprovação ou continuidade por terceiro nem prazo de reversão.

14.2. A V2G comunicará ocorrências relevantes conhecidas e adotará as medidas contratadas, sem que a atuação de terceiro exclua responsabilidade por falha própria.

### 15. DADOS PESSOAIS E CONFIDENCIALIDADE

15.1. Papéis, finalidades, categorias, bases, instruções, suboperadores, transferências, segurança, incidentes, retenção, eliminação e direitos constam do Anexo de Tratamento de Dados `{{dados.anexo_versao}}`.

15.2. Os papéis serão definidos por operação/finalidade e pelos fatos. Quando atuar como operadora, a V2G seguirá instruções documentadas da controladora, sem usar os dados para finalidade própria incompatível.

15.3. Confidencialidade, pessoas autorizadas, exceções, devolução/eliminação e prazo de sobrevivência: `{{confidencialidade.regra_aprovada}}`.

### 16. RESPONSABILIDADE

16.1. Cada parte responde por seus atos, informações, acessos e materiais. Limites, exclusões e indenização: `{{responsabilidade.regra_aprovada}}`, respeitadas normas inderrogáveis e exceções aprovadas.

### 17. USO DE MARCA E CASE

17.1. A V2G não usará nome, marca ou resultado identificável da CONTRATANTE sem autorização separada, específica e verificável `{{case.autorizacao_id}}`. A recusa não altera a prestação.

### 18. COMUNICAÇÕES

18.1. Canais, responsáveis, comprovação de recebimento e atos autorizados constam do Anexo III. Alterações exigem confirmação verificável.

### 19. ASSINATURA ELETRÔNICA, VERSÕES E EVIDÊNCIAS

19.1. A assinatura ocorrerá pelo provedor `{{assinatura.provedor}}`, no documento/envelope `{{assinatura.documento_externo_id}}`, conforme requisitos de identidade `{{assinatura.requisitos_identidade}}` e testemunhas `{{assinatura.regra_testemunhas_aprovada}}`.

19.2. Antes da conclusão, qualquer correção gera nova `{{contrato.versao_documento}}`; a anterior é preservada e marcada como substituída/cancelada. Após a conclusão, o PDF assinado é imutável; alteração exige aditivo ou novo contrato.

19.3. “Gerado”, “enviado” e “parcialmente assinado” não equivalem a contrato concluído. A conclusão exige todas as assinaturas da regra de representação, validação dos eventos, PDF final e trilha de auditoria do mesmo documento/hash.

19.4. A cópia final será entregue em `{{assinatura.copia_entregue_em}}` pelo canal `{{assinatura.canal_entrega}}` e arquivada pelo prazo `{{assinatura.prazo_guarda_aprovado}}`.

### 20. DISPOSIÇÕES GERAIS E CONFLITOS

20.1. Não há vínculo empregatício, sociedade ou exclusividade. Tolerância não implica renúncia; invalidade parcial não afeta o restante nos limites legais.

20.2. Ordem de prevalência: `{{contrato.ordem_prevalencia_aprovada}}`. Cessão: `{{contrato.regra_cessao_aprovada}}`.

20.3. Aplica-se a legislação brasileira. Negociação prévia/mediação/foro: `{{conflitos.regra_aprovada}}`, sem afastar competência inderrogável.

### ANEXO I — UNIDADES

Para cada unidade: `{{unidade.ordinal}}`, `{{unidade.operacao_nome}}`, `{{unidade.conta_id_externo}}`, `{{unidade.plataforma}}`, `{{unidade.titularidade}}`, `{{unidade.estado_identificacao}}`, `{{unidade.verba_aprovada}}`. Conta não identificada não recebe ID fictício e impede publicação; o advogado decidirá se também impede envio à assinatura.

### ANEXO II — SIGNATÁRIOS E REPRESENTAÇÃO

Para cada signatário: `{{signatario.nome}}`, `{{signatario.cpf}}`, `{{signatario.email}}`, `{{signatario.papel}}`, `{{signatario.regra_assinatura_individual_ou_conjunta}}`, `{{signatario.tipo_evidencia_poderes}}`, `{{signatario.evidencia_conferida_em}}`.

### ANEXO III — COMUNICAÇÕES

Tabela por ato: operacional, pendência, aprovação de oferta/peça, alteração de verba, inadimplência, cancelamento, incidente e notificação jurídica; para cada qual `{{comunicacao.canal}}`, `{{comunicacao.pessoas_autorizadas}}`, `{{comunicacao.prova_recebimento}}`, `{{comunicacao.prazo}}`.

### ASSINATURAS

`{{#signatarios_v2g}} {{nome}} — {{qualificacao}} — {{status}} {{/signatarios_v2g}}`

`{{#signatarios_contratante}} {{nome}} — {{papel_e_poderes}} — {{status}} {{/signatarios_contratante}}`

### Inferences

- Esta versão não deve ser convertida diretamente em PDF de assinatura: todos os campos `*_aprovado` são travas explícitas, não placeholders a serem preenchidos livremente pelo comprador.
- Na versão final, módulos não escolhidos e avisos internos devem desaparecer; permanecerão apenas regras efetivamente aprovadas.

### Gaps

- Os módulos jurídicos e comerciais indicados no texto precisam de decisão humana identificada.
- Dados fixos do prestador e poderes de Victor precisam ser conferidos documentalmente antes da geração.

## 4. Que decisões cabem a Victor, advogado e contabilidade?

### Takeaway

As decisões devem ser registradas fora do contrato, com responsável e consequência, e só então materializadas numa versão identificada.

### Cited Findings

Os temas abertos estão explicitamente marcados nas cláusulas 5.2, 7.5, 9.6, 10.2, 10.4, 11.2–11.3, 12.3, 14.5, 15.3, 16.2, 17.2, 18.2, 19.6 e 22.2 da [minuta atual](../../docs/contrato-v2g-minuta-parametrica.md). O Código Civil prevê denúncia/resolução e boa-fé, mas a redação concreta depende da natureza e estrutura do contrato — [Código Civil, arts. 422, 473, 474 e 475](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm). Cláusulas que imponham desvantagem exagerada podem ser nulas quando o CDC incidir — [CDC, art. 51](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm).

| Responsável | Decisão | Alternativas sem escolha prévia | Efeito a registrar |
|---|---|---|---|
| Victor + produto | Escopo mínimo | catálogo fechado; pacotes; escopo por pedido | Define entrega e capacidade de medir adimplemento. |
| Victor | Suporte/relatórios/reuniões | assíncrono; SLA em horário útil; reunião inicial apenas; recorrente | Afeta operação, preço e promessa comercial. |
| Victor + produto | Aprovações | toda mudança; apenas oferta/peça/orçamento; autorização para otimizações delimitadas | Afeta velocidade e risco de publicação. |
| Victor | Troca de conta | gratuita limitada; nova unidade; aditivo | Afeta preço e abuso operacional. |
| Victor + advogado | Marco inicial | assinatura; pagamento; acesso; checklist; primeira publicação | Define vigência, mínimo, cobrança e NFS-e. |
| Victor + advogado | Mês parcial | sem pró-rata; pró-rata diário; primeira competência cheia | Afeta cobrança e cancelamento. |
| Victor + advogado | Pós-prazo | prazo indeterminado; renovação automática; nova contratação | Afeta aviso, preço e continuidade. |
| Advogado | Saída antes de 6 meses | mensalidades vincendas; multa proporcional limitada; sem cobrança futura | Deve prever fórmula, teto, exceções e eventual CDC. |
| Advogado + Victor | Antecipados | sem restituição; restituição proporcional; retenção/custo + saldo; crédito | Afeta semestral/anual e caixa. |
| Advogado + financeiro | Inadimplência | prazo de cura; suspensão; resolução; encargos legais/contratuais | Deve definir aviso, quando suspende e como retoma. |
| Advogado + financeiro | Cancelamento/estorno/chargeback | fluxo e prazos por meio de pagamento | Afeta acesso, prestação e conciliação. |
| Advogado + Victor | Reajuste | índice/data; renegociação; sem reajuste no primeiro ciclo | Afeta continuidade após 6/12 meses. |
| Advogado | Responsabilidade | sem limite; limite por valores pagos; limite com exceções | Precisa carve-outs e compatibilidade legal. |
| Advogado + privacidade | LGPD | matriz controlador/operador por finalidade; suboperadores; incidentes/retenção | Necessário antes de tratar dados de leads e assinatura. |
| Advogado | PI | licença; cessão de entregáveis; arquivos-fonte excluídos/incluídos | Define uso pós-contrato. |
| Advogado | Assinatura | simples/avançada/qualificada; testemunhas; evidência de poderes | Afeta prova e executividade. |
| Advogado | Foro | sede V2G; domicílio réu/cliente; mediação + foro | Deve considerar regras inderrogáveis/CDC. |
| Contabilidade | NFS-e | competência e valor mensal nos três planos; adiantamento; município | Deve refletir serviço prestado e regras locais. |
| Contabilidade + financeiro | Receita antecipada | reconhecimento/parcelamento contábil e conciliação | Não deve ser decidido pelo texto jurídico isolado. |

### Inferences

- Nenhuma alternativa deve ser escolhida pelo gerador; ele apenas aplica a regra versionada já aprovada.
- Victor decide oferta/operação; o advogado valida efeitos jurídicos e redação; a contabilidade confirma o tratamento fiscal. Temas mistos exigem concordância registrada.

### Gaps

- Ainda não há ata/registro de decisão nem responsável nominal do advogado/contabilidade.

## 5. Como expressar versionamento e estados de assinatura?

### Takeaway

O estado final deve ser mais forte que `signed`: só “concluído e verificado” quando todas as assinaturas requeridas, o PDF final e a trilha de auditoria forem reconciliados com pedido, versão e hash. Correção pré-conclusão cria nova versão; pós-conclusão exige aditivo ou novo contrato.

### Cited Findings

- O schema atual possui `draft`, `ready_for_review`, `sent`, `partially_signed`, `signed`, `superseded`, `voided`, `failed`, mas não exige no estado `signed` campos de PDF final, hash final, envelope, trilha ou entrega da cópia — [schema atual](../../docs/contrato-v2g.schema.json).
- A MP 2.200-2 admite meio não ICP-Brasil se aceito e capaz de comprovar autoria/integridade [art. 10, §2º](https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm); assinatura avançada pressupõe associação unívoca, controle do signatário e detecção de alteração [Lei 14.063/2020, art. 4º](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm).

### Inferences

Estados recomendados:

| Estado | Critério mínimo | Pode publicar campanha? |
|---|---|---:|
| `generated_for_review` | snapshot + template + versão + hash | Não |
| `ready_to_send` | versão jurídica aprovada, campos validados, poderes conferidos | Não |
| `sent` | envelope/documento externo criado idempotentemente e convites enviados | Não |
| `partially_signed` | parte, mas não todos, assinou o mesmo documento | Não |
| `completed_pending_verification` | provedor declarou concluído; artefatos ainda em reconciliação | Não |
| `completed_verified` | regra de signatários satisfeita + eventos autenticados + PDF final + trilha + hashes reconciliados | Sim, se todas as demais condições da cláusula 5 também estiverem satisfeitas |
| `copy_delivered` | cópia final entregue com evidência | Não muda retroativamente validade; é obrigação de entrega |
| `superseded_before_completion` | nova versão pré-conclusão; convites antigos cancelados | Não |
| `voided` / `failed` | cancelamento/falha registrada | Não |
| `amended` | existe aditivo concluído ligado ao original | Conforme conteúdo do aditivo |

Chave idempotente recomendada: `pedido.id + contrato.versao_minuta + contrato.versao_documento + tipo_instrumento`. Guardar separadamente `hash_arquivo_enviado` e `hash_pdf_final`, porque o provedor pode incorporar assinaturas/certificado ao PDF final. Webhooks exigem autenticação, deduplicação por `provider_event_id`, verificação de envelope/documento/versão e tolerância a eventos fora de ordem.

Campos ausentes no schema atual: `template_approval_id`, `approved_by`, `approved_at`, `provider_document_id`, `provider_envelope_id`, `required_signers[]`, `signature_rule`, `provider_event_ids[]`, `sent_at`, `completed_at`, `final_pdf_storage_ref`, `final_pdf_sha256`, `audit_trail_storage_ref`, `audit_trail_sha256`, `copy_delivered_at`, `copy_delivery_evidence`, `superseded_at`, `void_reason`, `amendment_of_contract_id`.

### Gaps

- Provedor, método de autenticação, SLA de arquivo, política de retenção e testes de sandbox ainda não foram definidos.

## 6. Qual checklist libera assinatura e automação, e quais promessas são vedadas?

### Takeaway

A liberação deve ocorrer em duas portas: primeiro uma versão jurídica identificada pode ser enviada; depois a automação só entra em produção quando geração, assinatura, evidência, entrega e bloqueio de publicação forem testados de ponta a ponta.

### Cited Findings

O documento atual já reconhece que minuta gerada, convite, abertura ou assinatura parcial não equivalem a contrato concluído — [cláusula 19.4](../../docs/contrato-v2g-minuta-parametrica.md). O fornecedor pode responder pela disparidade entre serviço e oferta/publicidade quando o CDC incidir — [CDC, arts. 20 e 30](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm).

#### Checklist para liberar uma versão à assinatura

- [ ] Todos os módulos jurídicos/comerciais/fiscais decididos; nenhum `[DECISÃO PENDENTE]`, `*_aprovado` vazio ou alternativa concorrente.
- [ ] Versão da minuta identificada, conteúdo congelado e aprovação registrada com advogado responsável, data e escopo.
- [ ] Dados do prestador e poderes de Victor conferidos em fonte societária.
- [ ] Um pedido e contrato por CNPJ; unidades e contas reconciliadas; valores calculados para o plano selecionado.
- [ ] Razão social, CNPJ, endereço, signatários e poderes conferidos; regra individual/conjunta satisfeita.
- [ ] Plano exibido coincide com checkout/pedido; verba de mídia aparece separada e destacada.
- [ ] Marco inicial, datas, mínimo, vencimento, cancelamento, saída, antecipados, inadimplência, renovação e reajuste preenchidos.
- [ ] Escopo, suporte, relatórios, reuniões, aprovações, PI, LGPD, confidencialidade, responsabilidade, comunicação e foro aprovados.
- [ ] Provedor/método de assinatura e testemunhas definidos.
- [ ] Snapshot, versão, pedido e hash do arquivo enviados registrados; revisão humana final dos campos.

#### Checklist para liberar automação

- [ ] Schema suporta os três planos e bloqueia combinações/preços inválidos.
- [ ] Estados `generated`, `sent`, `partially_signed` e `completed_verified` não se confundem.
- [ ] Idempotência testada por pedido/versão/tipo; reenvio não duplica envelope.
- [ ] Correção pré-assinatura cria nova versão e cancela/substitui a anterior; versão antiga não conclui por evento tardio.
- [ ] Eventos autenticados, deduplicados e conciliados mesmo fora de ordem.
- [ ] Todos os signatários e regra de representação são verificados.
- [ ] PDF final e trilha são baixados, hasheados, guardados e ligados ao documento correto.
- [ ] Cópia final é entregue e a evidência registrada.
- [ ] Documento concluído é imutável; aditivo/novo contrato preserva ligação e original.
- [ ] Bloqueio de primeira publicação é testado no serviço efetivamente publicador, não só na interface.
- [ ] Falhas, assinatura parcial, expiração e recusa mantêm publicação bloqueada.
- [ ] Retenção, acesso e descarte de CPF, evidências e documentos seguem regra LGPD aprovada.
- [ ] Teste ponta a ponta usa somente dados fictícios; aprovação de produção registrada.

#### Promessas que contrato/checkout/comercial não devem fazer sem prova operacional

- “Resultado garantido”, número de leads, vendas, faturamento, ROAS, custo por lead ou prazo para retorno.
- “Campanha publicada em X minutos/dias” independentemente de assinatura, acessos, materiais, verba, conferências e plataforma.
- “Aprovação garantida” de anúncio, conta ou recurso por Meta/terceiros.
- “Gestão 100% automática” ou publicação automática; a primeira publicação confirmada é manual.
- “IA sem erro”, “conteúdo original/exclusivo”, ausência garantida de similaridade ou conformidade jurídica automática.
- “Receita comprovada” a partir de conversa/contato sem rastreamento de venda.
- “Assinatura válida/concluída” quando apenas gerado, enviado, aberto ou parcialmente assinado.
- “Executividade garantida” apenas por usar assinatura eletrônica; requisitos do CPC e do instrumento concreto precisam ser satisfeitos.
- “Segurança total”, “zero vazamento”, “LGPD 100% garantida” ou anonimização absoluta sem validação.
- “Suporte imediato/24h”, relatórios ou reuniões recorrentes sem capacidade e regra aprovadas.
- “Sem fidelidade/cancele quando quiser” se há permanência mínima e possíveis efeitos de saída.
- “Sem custo além da mensalidade” porque a verba de mídia e eventuais cobranças da plataforma são separadas.
- “Um contrato cobre todas as empresas” ou mistura saldo, verba, ativos e operação entre CNPJs.
- “NFS-e integral na compra” ou tratamento fiscal específico antes da confirmação contábil de competência/adiantamento.
- “Asaas assina o contrato” enquanto o provedor de assinatura estiver pendente.
- “Documento aprovado por advogado” sem versão, responsável e data de aprovação verificáveis.

### Inferences

- A trava deve ser positiva: publicação somente quando `contract_state == completed_verified` **e** os demais requisitos operacionais estiverem satisfeitos; ausência de erro não é autorização.
- O contrato final do cliente não precisa expor detalhes de webhook/idempotência, mas o sistema e o checklist de release precisam.

### Gaps

- Falta teste do checkout e do serviço publicador para comprovar que as travas existem fora da interface.
- Falta revisão jurídica humana de incidência do CDC, redação de saída antecipada e executividade pretendida.

