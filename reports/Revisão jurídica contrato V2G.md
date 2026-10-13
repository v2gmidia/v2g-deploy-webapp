# Revisão bloqueia assinatura e organiza decisão

**Conclusão principal:** a minuta `minuta-interna-2026-10-09-v1` é uma base útil, mas não está pronta para assinatura: declara que não foi aprovada, conserva decisões materiais em aberto e contradiz a oferta atual ao excluir o plano semestral de R$ 2.850,00 por conta. O texto consolidado deste relatório corrige os fatos já definidos — três planos, preço por conta, verba separada, segregação por CNPJ e sequência real de acesso, assinatura e publicação —, mas mantém cada escolha jurídica, comercial ou fiscal ainda não tomada como **`[DECISÃO PENDENTE — ...]`**. **Fato verificado:** checkout, pagamento, acesso ao WebApp, contrato e publicação são eventos diferentes; a primeira publicação é manual e depende de assinatura concluída e das demais conferências. **Interpretação jurídica:** pagamento e conduta no checkout podem produzir efeitos antes da assinatura, e cobrar integralmente meses restantes pode funcionar como cláusula penal, sujeita a controle de proporcionalidade. **Recomendação:** liberar assinatura somente depois que um advogado responsável selecionar todos os módulos, identificar arquivo, versão, hash, data e escopo de aprovação; liberar automação apenas após prova ponta a ponta do provedor, PDF final, trilha, entrega da cópia e bloqueio efetivo de publicação. Esta revisão por IA, concluída em **13/10/2026**, não é parecer jurídico nem aprovação para assinatura.

## 1. Quinze bloqueios impedem a minuta atual de seguir à assinatura

As referências “texto atual” abaixo correspondem à [minuta `minuta-interna-2026-10-09-v1`](../docs/contrato-v2g-minuta-parametrica.md). **Fato verificado** descreve o texto e a operação documentada; **interpretação jurídica** aponta o risco; **recomendação** propõe redação ou decisão, sem escolher pelos responsáveis. A boa-fé, a coerência entre oferta e execução e a clareza de contratos de adesão decorrem, conforme o enquadramento concreto, dos arts. 113, 421–424 do Código Civil e dos arts. 30, 46, 47, 51 e 54 do CDC ([Código Civil](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm); [CDC](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm), fontes consultadas em 13/10/2026).

| Cláusula exata | Texto atual | Problema ou ambiguidade | Consequência prática | Prioridade | Proposta de redação |
|---|---|---|---|---|---|
| Cabeçalho/metadados | “MINUTA INTERNA PARA REVISÃO JURÍDICA — NÃO ENVIAR PARA ASSINATURA”; versão `minuta-interna-2026-10-09-v1`; “aprovação jurídica: inexistente” | **Fato:** o rótulo impede uso como versão final. Faltam aprovador, data, hash e escopo da aprovação. | Um arquivo tecnicamente íntegro pode ser enviado por engano sem estar juridicamente liberado. | **Bloqueante** | Na revisão, manter o aviso. Na versão liberada, registrar `{{contrato.template_id}}`, `{{contrato.versao_minuta}}`, `{{contrato.hash_template}}`, `{{contrato.aprovado_por}}` e `{{contrato.aprovado_em}}`; remover “minuta” só após aprovação real. |
| Partes | O representante “declara possuir poderes”; e-mail, pagamento ou acesso não provam poderes. | **Fato:** o contexto exige poderes comprovados, não mera declaração. Falta definir evidência e regra individual/conjunta. | Assinatura pode ser insuficiente ou contestada. | **Bloqueante** | Condicionar envio/conclusão à conferência de `{{signatario.tipo_evidencia_poderes}}`, `{{signatario.regra_assinatura}}` e `{{signatario.evidencia_conferida_em}}`. |
| 1.1–1.2 — Objeto | A gestão “poderá compreender” coleta, análise, oferta, textos, peças, configuração, publicação, acompanhamento e ajustes. | “Poderá” não define entrega mínima, volume, plataforma ou frequência. | Não é possível medir adimplemento nem alinhar checkout. | **Bloqueante** | “A V2G prestará exclusivamente `{{escopo.itens_incluidos}}` para as unidades do Anexo I; excluem-se `{{escopo.itens_excluidos_aprovados}}`.” |
| 1.3 e 4.5–4.6 — Primeira publicação | Primeira campanha manual após pagamento, assinatura, acessos, conta, materiais e conferências. | “Conferências” não estão enumeradas nem há identificador de checklist/responsável. | Discussão sobre atraso ou liberação indevida. | Alta | Enumerar os requisitos e registrar `{{publicacao.checklist_id}}`, conclusão, data e `{{publicacao.gestor_responsavel}}`. |
| 1.4 — Exclusões | Exclui mídia, atendimento comercial, orgânico, vídeo, sites/CRM, plataformas não listadas e garantias, “salvo contratação expressa”. | Não define forma válida de contratar adicional; mistura exclusão de escopo com ausência de garantia. | Mensagens informais podem ampliar escopo. | Média | Adicional somente por novo pedido/aditivo/contrato assinado; concentrar ausência de garantia na cláusula própria. |
| 2.1–2.3 — Unidade/CNPJ | Preço por conta; um contrato/pedido por CNPJ; segregação de titularidade, preço, mídia, campanhas, fiscal e encerramento. | Falta dizer que login multiempresa não consolida relações e vincular pedido–CNPJ–unidade. | Mistura entre empresas do mesmo comprador. | Alta | “`{{pedido.id}}` vincula-se exclusivamente a `{{contratante.cnpj}}`; login comum não consolida contratos, saldos, verbas ou dados.” |
| 2.4 — Substituição de conta | Depende de “procedimento operacional aprovado”. | A regra não existe; custo, limite e efeito no prazo estão abertos. | Decisão casuística e disputa de preço. | **Bloqueante** | `{{conta.regra_substituicao_aprovada}}`; escolher troca limitada, nova unidade ou aditivo antes da assinatura. |
| 3.1–3.4 — Obrigação de meio | Não garante contatos, vendas, faturamento, CPL/ROI, aprovação ou data. | Correto, mas não pode funcionar como exoneração por falha própria. | Cláusula pode parecer abusivamente ampla. | Alta | Acrescentar que a ausência de garantia não afasta execução diligente, informação verdadeira e responsabilidade legal por falha imputável. O CDC, se incidente, disciplina vício, informação e oferta ([CDC, arts. 14, 20 e 30](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm), consulta em 13/10/2026). |
| 4.1 — Acesso | WebApp após pagamento aprovado. | Omite e-mail confirmado e vínculo correto com o negócio, ambos exigidos na operação descrita. | Acesso indevido ou texto divergente do produto. | **Bloqueante de produto** | “O acesso poderá ser liberado após `{{pedido.pagamento_aprovado_em}}` e `{{contratante.email_confirmado_em}}`; acesso não prova assinatura nem autoriza publicação.” |
| 4.2 — Confirmação de pagamento | Detalha Pix/comprovante/aprovação humana. | Pode congelar fluxo específico e conflitar com eventos futuros do Asaas. | Contrato fica obsoleto sem mudança material da oferta. | Média | Definir pagamento aprovado como estado confirmado por evento verificável do provedor ou procedimento interno autorizado; manter detalhes no protocolo operacional. |
| 4.3–4.4 — Onboarding/reunião | Podem ocorrer antes da assinatura. | Não diz se iniciam vigência nem quantas reuniões integram o preço. | Discussão sobre início da prestação e entrega incluída. | **Bloqueante** | “São atos preparatórios e, isoladamente, `{{contrato.efeito_dos_atos_preparatorios_sobre_vigencia}}`”; definir `{{reuniao.regra_aprovada}}`. |
| 5.1(c), 7.2 e 7.5 — Aprovações | Toda peça submetida; nada publicado sem aprovação; canal/identidade/prazo pendentes. | Não distingue primeira campanha, peças, orçamento e otimizações rotineiras; silêncio não está regulado. | Operação trava ou publica sem prova. | **Bloqueante** | Matriz com `{{aprovacao.atos}}`, `{{aprovacao.canais}}`, `{{aprovacao.pessoas_autorizadas}}`, prazo e `{{aprovacao.efeito_do_silencio_aprovado}}`. |
| 5.2 — Suporte, relatórios e reuniões | Todos constam como decisões pendentes. | Entregas essenciais não foram definidas. | Promessa comercial não mensurável. | **Bloqueante** | Preencher canal, janela, resposta, conteúdo/periodicidade de relatório e quantidade/natureza das reuniões; declarar quando não houver recorrência. |
| 6 — Obrigações da contratante | Dados, acessos, verba, materiais, aprovações e atendimento; pendências atrasam. | Falta aviso, cura e efeito sobre prazo, preço e período mínimo. | Cliente pode pagar durante paralisação sem regra clara. | Alta | Definir “Pendência da Contratante”, comunicação verificável e `{{pendencias.efeitos_aprovados}}`; não presumir extensão automática do mínimo. |
| 7.1 — IA | IA auxilia textos, imagens e análises. | Não delimita dados enviados, fornecedores, retenção, revisão humana ou direitos. | Riscos de confidencialidade, LGPD, PI e erro factual. | Alta | Tornar IA auxiliar, sujeita a revisão humana, Anexo de Dados e aprovação; não prometer originalidade, exclusividade ou conformidade automática. |
| 8.2–8.4 — Verba | Cliente paga a plataforma; V2G pode reduzir, redistribuir ou pausar dentro do orçamento. | Não define moeda, período, teto por conta nem aprovação de redistribuição. | Gasto contestado e mistura entre CNPJs. | **Bloqueante** | Quadro-Resumo com `{{verba.moeda}}`, `{{verba.teto_aprovado}}`, `{{verba.periodo}}`, `{{verba.conta_id}}`; aumento somente com aprovação; vedar transferência entre CNPJs. |
| 9.1–9.4 — Preço | R$ 500 mensal e R$ 5.280 anual; “não há desconto semestral”. | **Divergência objetiva:** a oferta confirmada e o checkout incluem semestral à vista por R$ 2.850/conta. | Contrato cobra/exibe produto diferente do comprado; oferta precisa e publicidade podem vincular quando o CDC incidir ([CDC, arts. 30 e 35](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm), consulta em 13/10/2026). | **Bloqueante** | Três modalidades: `mensal_minimo_6m` = R$ 500/mês; `semestral_antecipado` = R$ 2.850/6 meses; `anual_antecipado` = R$ 5.280/12 meses, sempre por conta e exibindo só a escolhida. |
| 9.5–9.7 — Cobrança/NFS-e | Vencimento no anexo; inadimplência pendente; NFS-e genérica. | Não trata mês parcial, estorno, planos antecipados nem competência mensal. | Divergência fiscal/financeira e falta de previsibilidade. | **Bloqueante** | “A NFS-e acompanhará cada mês de serviço prestado, inclusive em antecipados, conforme `{{fiscal.regra_confirmada_contabilidade}}`”; decidir vencimento, pró-rata, estorno e atraso. |
| 10.1–10.4 — Vigência | Início variável, mínimo de seis meses; marco inicial, pós-mínimo e anual pendentes. | Não define começo/fim nem separa duração do plano e mínimo. | Não se sabe quando cobrar, renovar ou encerrar. | **Bloqueante** | Preencher `{{contrato.marco_inicio_aprovado}}`, datas de início/fim do mínimo/fim do plano, continuidade e reajuste. |
| 11 — Encerramento | Expõe intenção de cobrar meses restantes, mas afirma que não cria obrigação; antecipados pendentes. | Nota interna não deve ir ao cliente; fórmula, limites, exceções e causas não existem. | Cobrança contestada e retenção potencialmente excessiva. | **Bloqueante** | Remover intenção interna e usar somente `{{encerramento.regra_saida_antecipada_aprovada}}`, `{{encerramento.regra_planos_antecipados_aprovada}}` e hipóteses/efeitos aprovados. Cláusula penal é limitada e pode ser reduzida ([CC, arts. 408–413](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm), consulta em 13/10/2026). |
| 12.1–12.4 — Ativos/PI | Ativos do cliente permanecem dele; tecnologia da V2G permanece dela; peças pendentes. | Não separa materiais preexistentes, ativos da plataforma, entregáveis e arquivos-fonte. | Disputa de uso após encerramento. | Alta | `{{propriedade_intelectual.regra_aprovada}}` deve indicar licença/cessão, prazo, território, fontes e condicionamento ao pagamento. |
| 13 — Terceiros | Plataformas têm regras próprias e não há garantia de aprovação/continuidade. | “Conforme origem e legislação” é vago; terceiro não pode excluir falha própria da V2G. | Responsabilidade e resposta a bloqueios ficam incertas. | Alta | Definir aviso, cooperação, pausa tecnicamente possível e preservação da responsabilidade por falha própria. |
| 14 — Dados pessoais | LGPD genérica; papéis, bases, suboperadores, transferências, retenção e incidentes pendentes. | Papéis decorrem dos fatos, não do rótulo; falta anexo operacional. | Tratamento de leads, acessos e dados de assinatura sem alocação suficiente. | **Bloqueante** | Anexo por finalidade com papéis, bases, categorias, instruções, suboperadores, transferências, segurança, incidentes, direitos e retenção. A LGPD exige registro, instruções lícitas e segurança ([LGPD, arts. 37, 39 e 46–49](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), consulta em 13/10/2026). |
| 15 — Confidencialidade | Obrigação geral; prazo, exceções, devolução e eliminação pendentes. | Não há padrão de cuidado, pessoas autorizadas ou sobrevivência. | Proteção difícil de executar e conflito com retenção. | Alta | Preencher `{{confidencialidade.regra_aprovada}}`, conciliada com backups, defesa de direitos, obrigações legais e LGPD. |
| 16 — Responsabilidade | Regra genérica; limites, danos, indenização e exceções pendentes. | Alocação material inexistente; limite amplo pode ser inválido conforme o caso. | Exposição imprevisível. | **Bloqueante** | `{{responsabilidade.regra_aprovada}}`, preservando normas inderrogáveis e exceções decididas para dolo, dados, confidencialidade, PI e verba. |
| 17 — Marca/case | Proíbe uso sem autorização; forma/revogação pendentes. | Consentimento embutido pode não ser livre; resultado não prova causalidade. | Claim reputacional indevido. | Média | Autorização separada, opcional, específica e verificável; recusa sem impacto no serviço. |
| 18 — Comunicações | Contatos no anexo; efeitos jurídicos pendentes. | Sem canal, identidade, recebimento e ato autorizado. | Aprovação, cancelamento e notificação não comprovados. | **Bloqueante** | Anexo por ato, com canal, pessoas autorizadas, prova, prazo e atualização. |
| 19 — Assinatura eletrônica | Provedor pendente; exige autoria/integridade, todas as assinaturas, final e auditoria; testemunhas pendentes. | Não há provedor selecionado nem campos suficientes para PDF/trilha. Validade, prova e executividade são camadas distintas. | `signed` pode ser marcado sem evidência bastante. | **Bloqueante técnico/jurídico** | Exigir provedor, envelope, identidade, hash enviado, eventos autenticados, PDF e trilha final. Outros meios podem provar autoria/integridade ([MP 2.200-2, art. 10, §2º](https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm)); eventual título executivo eletrônico depende também dos arts. 783 e 784, §4º do [CPC](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilada.htm) (consulta em 13/10/2026). |
| 20 — Versionamento | Correção pré-assinatura gera nova versão; assinado é imutável; idempotência por pedido/versões. | Controle correto, mas esquema atual não prova snapshot/hash/PDF/trilha; “para sempre” conflita com retenção pendente. | Automação pode concluir versão errada e reter excessivamente. | **Bloqueante para automação** | No contrato, manter integridade, substituição e aditivo; no protocolo, idempotência e eventos; prazo de guarda em `{{assinatura.prazo_guarda_aprovado}}`. |
| 21 — Gerais | Sem vínculo/sociedade/exclusividade; cessão pendente. | Falta ordem de prevalência e regra de cessão. | Conflito entre checkout, contrato, anexos e publicidade. | Alta | Preencher `{{contrato.ordem_prevalencia_aprovada}}` e `{{contrato.regra_cessao_aprovada}}`, sem afastar efeito legal da oferta. |
| 22 — Lei/foro | Lei brasileira; negociação/mediação/foro pendentes. | Foro não pode ser importado de legado e deve ter pertinência; consumo pode alterar competência. | Ineficácia e custo processual. | **Bloqueante** | `{{conflitos.regra_aprovada}}`; o CPC exige pertinência com parte ou obrigação e preserva proteção consumerista ([CPC, art. 63](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilada.htm), consulta em 13/10/2026). |
| Assinaturas/Anexo A | Um signatário por parte; campos de plano, total, pagamento, início e unidades. | Representação pode ser conjunta; faltam semestral e evidência de poderes. | Envelope pode concluir com assinatura insuficiente. | **Bloqueante** | Usar arrays de signatários, regra individual/conjunta, evidência e status; conclusão só quando a regra estiver satisfeita. |
| Anexos D/E | Fluxo técnico e checklist integram a minuta. | São controles internos, não obrigações negociais; podem expor arquitetura e ficar obsoletos. | Alteração técnica pode aparentar exigir aditivo. | Média | Remover da cópia do cliente e manter protocolo interno versionado ligado ao template. |

## 2. Oferta e operação já divergem do rascunho de 09/10

| Divergência | Minuta atual | Oferta, checkout ou operação confirmada | Impacto |
|---|---|---|---|
| Plano semestral | Cláusula 9.4 diz que não existe desconto semestral; schema aceita apenas mensal/anual. | Checkout/oferta incluem **R$ 2.850,00 à vista por conta por seis meses**. | Bloqueia contratos semestrais e cria disparidade de preço. |
| Acesso ao WebApp | Cláusula 4.1 menciona pagamento aprovado. | Acesso exige também **e-mail confirmado**; pagamento, acesso e reunião não equivalem a assinatura. | Texto omite condição real e pode confundir estados. |
| Formação/marco inicial | Assinatura e vigência aparecem separadas, mas o efeito do checkout/pagamento não está definido. | Compra e acesso podem ocorrer antes da assinatura. | **Interpretação jurídica:** oferta/aceite e conduta podem produzir efeitos; é preciso definir pedido condicionado, contrato preliminar ou formação no checkout. O Decreto do comércio eletrônico exige resumo, correção, confirmação e cópia conservável quando aplicável ([Decreto 7.962/2013, arts. 2º e 4º](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm), consulta em 13/10/2026). |
| Primeira publicação | Manual e condicionada, mas “conferências” são genéricas. | Assinatura concluída, poderes, acessos, conta identificada, materiais, verba e checklist são condições cumulativas. | Falta prova objetiva de liberação. |
| Segregação multiempresa | Minuta separa CNPJs, mas anexos não explicitam login compartilhado. | Um login pode administrar CNPJs distintos, sem misturar pedido, contrato, cobrança, verba e operação. | Precisa frase expressa e controles de isolamento. |
| NFS-e | Texto genérico. | Uma NFS-e deve acompanhar **cada mês de serviço prestado**, inclusive em planos antecipados, com detalhes ainda dependentes da contabilidade. | Valor/competência não podem ser automatizados por inferência. |
| Assinatura | Descreve fluxo futuro e provedor pendente. | Nenhum provedor foi escolhido; gerar/enviar/parcialmente assinar não conclui o contrato. | Não se pode prometer assinatura automática nem liberar publicação por status incompleto. |
| Persistência documental | Minuta exige snapshot, hash, PDF final e trilha. | A capacidade integral ainda não foi comprovada no fluxo. | Obrigação pode exceder o produto atual; automação deve ficar bloqueada. |
| Prova do bloqueio | WebApp prevê pré-voo. | O backend é quem publica na plataforma e precisa também impedir publicação sem contrato concluído. | Trava só de interface é insuficiente. |
| Suporte/relatórios/reuniões | Cláusula 5.2 deixa tudo pendente. | O cliente pode escolher uma reunião, mas recorrência, SLA e relatório não estão definidos. | Comercial não pode prometer frequência/canal. |
| Ajustes de verba/peças | Cláusulas permitem gestão e exigem aprovação, sem matriz. | Primeira publicação é humana; autonomia posterior não foi delimitada. | Risco de gasto não autorizado ou operação travada. |
| CNPJ | Não afirma consulta pública automática. | A operação valida declaração/formato; não há prova de consulta cadastral ativa. | Não prometer “CNPJ validado pela Receita”. |

**Fato verificado:** a minuta acerta ausência de garantia, verba separada, primeira publicação manual e separação por CNPJ. **Interpretação jurídica:** CNPJ não afasta automaticamente o CDC; pessoa jurídica pode ser destinatária final ou demonstrar vulnerabilidade, conforme o caso ([STJ, consumidor pessoa jurídica](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2024/08092024-Consumidor-pessoa-juridica-quando-as-empresas-podem-ter-a-protecao-do-CDC.aspx), consulta em 13/10/2026). **Recomendação:** usar núcleo transparente compatível com ambos os cenários e deixar o advogado decidir se haverá modelos distintos para anunciante final e agência/revendedor.

## 3. Três responsáveis precisam fechar vinte decisões antes da versão final

| Responsável | Decisão | Alternativas sem escolha prévia | Efeito de cada alternativa |
|---|---|---|---|
| Victor + produto | Escopo mínimo | Catálogo fechado; pacote por plano; escopo individual no pedido | Catálogo facilita padrão; pacote diferencia planos; individual aumenta flexibilidade e revisão. |
| Victor | Suporte | Assíncrono; horário útil com SLA; canal dedicado | Muda capacidade, custo e expectativa. |
| Victor | Relatórios/reuniões | Relatório no WebApp; envio periódico; reunião inicial; recorrente | Cada promessa exige conteúdo, frequência e operação comprovada. |
| Victor + produto | Aprovações | Tudo previamente; oferta/peça/orçamento; otimizações delimitadas autorizadas | Mais aprovação reduz risco, mas aumenta latência; autonomia exige limites e prova. |
| Victor | Substituição de conta | Uma troca gratuita; nova unidade paga; aditivo caso a caso | Afeta abuso, preço e continuidade. |
| Victor + advogado | Formação do vínculo | Checkout; pagamento; assinatura; pedido condicionado até assinatura | Define quando surgem obrigações, restituição e evidências. |
| Victor + advogado | Marco inicial da prestação | Assinatura; checklist; acessos completos; primeira publicação | Define vigência, mínimo, competência fiscal e atraso. |
| Victor + advogado | Mês parcial | Pró-rata diário; ciclo integral a partir do marco; data fixa | Pró-rata é granular; ciclo integral simplifica; data fixa exige regra clara para o intervalo. |
| Victor + advogado | Pós-prazo | Término; prazo indeterminado; renovação expressa; automática transparente | Afeta continuidade, aviso, cobrança e eventual arrependimento/abusividade. |
| Advogado | Saída antes de seis meses | Saldo integral; multa proporcional limitada; perda de desconto/custos comprovados; sem cobrança futura | Saldo protege receita, mas aumenta risco de redução/abusividade; alternativas proporcionais reduzem risco e recuperação. |
| Advogado + Victor | Antecipados | Sem restituição; restituição pró-rata pelo pago; recálculo pelo preço cheio; retenção limitada; crédito | Impacta caixa, incentivo e contestação; deve variar por causa do encerramento e eventual direito de arrependimento. |
| Advogado + financeiro | Inadimplência | Cura + aviso; suspensão; resolução; encargos legais/convencionais | Deve definir prazo, campanha ativa, retomada e comunicação; o CC disciplina mora e resolução ([CC, arts. 389, 395 e 474–476](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm), consulta em 13/10/2026). |
| Advogado + financeiro | Cancelamento/estorno/chargeback | Canal e prazo; estorno antes da assinatura; regra após início; tratamento de chargeback | Precisa coincidir com checkout, Asaas e eventual art. 49 do CDC. |
| Advogado + Victor | Reajuste | Índice/data; renegociação; sem reajuste no primeiro ciclo | Afeta continuidade após seis/doze meses. |
| Advogado | Responsabilidade | Sem teto; teto pelos valores pagos; teto com exceções | Limite traz previsibilidade, mas precisa compatibilidade com CDC e exceções inderrogáveis. |
| Advogado | Propriedade intelectual | Licença; cessão de peças finais; fontes incluídas/excluídas | Define uso após término e valor dos entregáveis. |
| Advogado + privacidade | LGPD | Matriz controlador/operador por finalidade, suboperadores, transferência, incidentes e retenção | Sem matriz, rótulo genérico não acompanha a operação real. Incidente relevante tem disciplina própria da ANPD ([ANPD, comunicação de incidente](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis), consulta em 13/10/2026). |
| Advogado | Assinatura/prova | Simples, avançada ou qualificada; testemunhas; identidade e poderes | Afeta prova, fraude e eventual executividade; assinatura avançada exige associação, controle e detecção de alteração ([Lei 14.063/2020, art. 4º](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm), consulta em 13/10/2026). |
| Advogado | Foro/resolução | Negociação; mediação; foro da V2G; domicílio do réu/cliente | Deve guardar pertinência e respeitar competência inderrogável. |
| Contabilidade | NFS-e | Valor por competência mensal; adiantamento; município, código e momento da emissão | A regra confirmada é uma NFS-e por mês prestado; os detalhes tributários não podem ser inferidos. |
| Contabilidade + financeiro | Receita antecipada | Reconhecimento proporcional; conta de adiantamento; conciliação por competência | Afeta contabilidade e estorno, não deve ser resolvido apenas pela cláusula. |

## 4. A minuta consolidada incorpora fatos e expõe cada escolha faltante

O texto abaixo é o **contrato completo para decisão do advogado**, não uma versão aprovada. As etiquetas **`[ALTERADO]`** e **`[NOVO]`** identificam mudanças em relação à minuta de 09/10; todas as etiquetas **`[DECISÃO PENDENTE — ...]`** são bloqueios literais e não podem chegar ao documento de assinatura. O gerador deve exibir somente o plano comprado, sem alternativas concorrentes.

---

# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE GESTÃO DE ANÚNCIOS

**STATUS: VERSÃO CONSOLIDADA PARA DECISÃO JURÍDICA — NÃO APROVADA PARA ASSINATURA.**

**Template:** `{{contrato.template_id}}`  
**Versão da minuta:** `{{contrato.versao_minuta}}`  
**Versão do documento:** `{{contrato.versao_documento}}`  
**Documento:** `{{contrato.id}}`  
**Pedido:** `{{pedido.id}}`  
**Gerado em:** `{{contrato.gerado_em}}`  
**Hash do arquivo gerado/enviado:** `{{contrato.hash_envio}}`  
**Aprovação jurídica desta versão:** `[DECISÃO PENDENTE — identificar advogado responsável, inscrição profissional, data, escopo e hash aprovados]`

### QUADRO-RESUMO

| Campo | Valor |
|---|---|
| Contratante | `{{contratante.razao_social}}` |
| CNPJ | `{{contratante.cnpj}}` |
| Pedido | `{{pedido.id}}` |
| Quantidade de contas de anúncios | `{{pedido.quantidade_de_contas}}` |
| Plano escolhido | `{{pedido.plano}}` |
| Preço unitário por conta | `{{pedido.valor_unitario_formatado}}` |
| Preço total do pedido | `{{pedido.valor_total_formatado}}` |
| Forma de cobrança | `{{pedido.forma_cobranca}}` |
| Vencimento/pagamento | `{{pedido.regra_vencimento}}` |
| Período mínimo proposto | 6 (seis) meses |
| Marco inicial | `{{contrato.marco_inicio_aprovado}}` |
| Data de início | `{{contrato.data_inicio}}` |
| Fim do período mínimo | `{{contrato.data_fim_periodo_minimo}}` |
| Fim do plano, se determinado | `{{contrato.data_fim_plano}}` |
| Verba de mídia | Não incluída; `{{verba.regra_aprovada}}` |
| Contas e plataformas | Anexo I |
| Signatários exigidos | Anexo II |

**CONTRATADA:** `{{prestador.razao_social}}`, CNPJ `{{prestador.cnpj}}`, com endereço em `{{prestador.endereco}}`, representada por `{{prestador.signatario.nome}}`, `{{prestador.signatario.qualificacao_e_poderes}}`, doravante **V2G**.

**CONTRATANTE:** `{{contratante.razao_social}}`, nome fantasia `{{contratante.nome_fantasia}}`, CNPJ `{{contratante.cnpj}}`, com endereço em `{{contratante.endereco}}`, e-mail contratual `{{contratante.email_contratual}}`, representada pelo(s) signatário(s) do Anexo II, doravante **CONTRATANTE**.

V2G e CONTRATANTE, em conjunto, “Partes”, celebram este Contrato, sujeito às cláusulas seguintes.

### 1. OBJETO E ESCOPO

**1.1. [ALTERADO]** A V2G prestará serviços de gestão de anúncios para as contas individualizadas no Anexo I, utilizando tecnologia e acompanhamento humano, conforme `{{escopo.itens_incluidos}}`.

**1.2. [ALTERADO]** Integram o escopo somente as atividades expressas no Quadro-Resumo e no Anexo I. Ficam excluídos `{{escopo.itens_excluidos_aprovados}}`. Qualquer serviço adicional depende de novo pedido, aditivo ou contrato assinado.

**1.3.** A primeira campanha será preparada e publicada manualmente por gestor da V2G apenas após o cumprimento cumulativo da Cláusula 5.

**1.4. [DECISÃO PENDENTE — escopo]** Volume de peças, plataformas incluídas, frequência de análise/ajustes, entregáveis e limites por conta: `{{escopo.limites_aprovados}}`.

### 2. EMPRESAS, PEDIDOS E CONTAS

**2.1. [ALTERADO]** Cada conta de anúncios constitui uma unidade de contratação e preço. Este Contrato abrange `{{pedido.quantidade_de_contas}}` unidade(s), todas vinculadas ao CNPJ `{{contratante.cnpj}}` e ao pedido `{{pedido.id}}`.

**2.2. [NOVO]** Um login pode permitir acesso a mais de um CNPJ, mas não unifica pedidos, contratos, cobrança, verba, campanhas, dados, responsabilidades fiscais ou encerramento. Cada CNPJ terá pedido e contrato próprios.

**2.3.** As contas abrangidas são somente as individualizadas no Anexo I. Conta ainda não identificada não receberá identificador fictício e não poderá ser publicada.

**2.4. [DECISÃO PENDENTE — substituição de conta]** A substituição de conta seguirá `{{conta.regra_substituicao_aprovada}}`, incluindo quantidade permitida, preço, efeito no prazo e necessidade de aditivo.

### 3. PREÇO, PLANO E VERBA DE MÍDIA

**3.1. [ALTERADO]** A unidade de preço é cada conta de anúncios. O plano comprado é `{{pedido.plano}}`, para `{{pedido.quantidade_de_contas}}` conta(s). O documento final exibirá **somente uma** das modalidades abaixo, de acordo com o pedido validado:

**a) Plano mensal com permanência mínima proposta de seis meses:** R$ 500,00 (quinhentos reais) por conta por mês, total mensal de `{{pedido.valor_total_formatado}}`;

**b) Plano semestral pago à vista:** R$ 2.850,00 (dois mil oitocentos e cinquenta reais) por conta pelos seis meses, total de `{{pedido.valor_total_formatado}}`;

**c) Plano anual pago à vista:** R$ 5.280,00 (cinco mil duzentos e oitenta reais) por conta pelos doze meses, total de `{{pedido.valor_total_formatado}}`.

**3.2.** O total será calculado pela multiplicação da quantidade de contas pelo valor unitário do plano selecionado. O gerador não poderá aceitar valor livre nem combinação incompatível com o plano.

**3.3. [ALTERADO]** A verba de mídia é separada e não integra a remuneração da V2G. Será paga pela CONTRATANTE diretamente à plataforma, por meio vinculado ao CNPJ e à conta correspondentes, conforme teto `{{verba.teto_aprovado}}`, moeda `{{verba.moeda}}` e período `{{verba.periodo}}`.

**3.4.** A V2G não aumentará o teto sem aprovação verificável. A autorização para reduzir, redistribuir ou pausar verba dentro da mesma conta será `{{verba.regra_ajustes_aprovada}}`. É vedada a transferência de verba entre CNPJs sem instrumento próprio.

**3.5. [DECISÃO PENDENTE — vencimento e mês parcial]** Vencimento, cobrança inicial e tratamento do mês parcial: `{{financeiro.regra_vencimento_e_mes_parcial_aprovada}}`.

**3.6. [ALTERADO — fiscal]** A NFS-e acompanhará cada mês de serviço efetivamente prestado, inclusive nos planos antecipados, conforme `{{fiscal.regra_confirmada_contabilidade}}` e as regras fiscais aplicáveis. **[DECISÃO PENDENTE — contabilidade: confirmar competência, valor mensal por plano, município, código do serviço, momento de emissão, cancelamento e estorno.]**

### 4. PAGAMENTO, ACESSO E ATOS PREPARATÓRIOS

**4.1. [ALTERADO]** O acesso ao WebApp poderá ser liberado depois do pagamento aprovado em `{{pedido.pagamento_aprovado_em}}` e da confirmação do e-mail em `{{contratante.email_confirmado_em}}`, observada a vinculação do pedido ao CNPJ correto.

**4.2.** Pagamento aprovado será o estado confirmado no pedido por evento verificável do provedor de pagamento ou procedimento interno autorizado. Comprovante isolado não será tratado automaticamente como liquidação.

**4.3.** Pagamento, acesso, onboarding, envio de informações e agendamento ou realização de reunião são eventos distintos. Nenhum deles, isoladamente, prova assinatura concluída ou autoriza publicação de campanha.

**4.4. [DECISÃO PENDENTE — formação e marco inicial]** Os atos preparatórios `{{contrato.efeito_dos_atos_preparatorios_sobre_formacao_e_vigencia}}`. O vínculo contratual forma-se em `{{contrato.evento_formacao_aprovado}}`, e a prestação inicia-se em `{{contrato.marco_inicio_aprovado}}`.

**4.5. [DECISÃO PENDENTE — pagamento sem assinatura]** Se o pagamento for aprovado e o contrato não for concluído, aplicar-se-á `{{financeiro.regra_pagamento_sem_assinatura_aprovada}}`, sem prejuízo de norma inderrogável aplicável.

### 5. CONDIÇÕES PARA A PRIMEIRA PUBLICAÇÃO

**5.1. [ALTERADO]** A primeira campanha somente será publicada após: (a) pagamento aprovado; (b) contrato concluído por todos os signatários exigidos; (c) poderes de representação conferidos; (d) acessos válidos; (e) conta de anúncios identificada; (f) materiais, oferta e aprovações exigidas disponíveis; (g) verba configurada; e (h) checklist `{{publicacao.checklist_id}}` concluído.

**5.2.** A primeira publicação será manual, realizada por `{{publicacao.gestor_responsavel}}`. Nenhuma etapa anterior autoriza publicação automática.

**5.3.** Pendências serão comunicadas pelo canal `{{comunicacao.canal_pendencias}}`. A V2G não promete data de publicação independente da resolução de pendências da CONTRATANTE ou de decisões de terceiros.

**5.4. [DECISÃO PENDENTE — efeitos das pendências]** As pendências produzirão `{{pendencias.efeitos_aprovados}}` sobre prazos, cobrança e período mínimo; não haverá prorrogação ou cobrança automática não expressamente aprovada.

### 6. OBRIGAÇÕES DA V2G

**6.1.** A V2G executará o escopo com diligência; usará os acessos apenas na contratação correspondente; respeitará orçamento e aprovações; registrará atos relevantes; e comunicará pendências ou ocorrências relevantes conhecidas.

**6.2. [DECISÃO PENDENTE — suporte]** Canal `{{suporte.canal}}`; janela `{{suporte.janela}}`; prazo de resposta `{{suporte.prazo_resposta}}`.

**6.3. [DECISÃO PENDENTE — relatórios]** Conteúdo, fonte, periodicidade e canal: `{{relatorio.conteudo_e_periodicidade}}`.

**6.4. [DECISÃO PENDENTE — reuniões]** Reuniões incluídas: `{{reuniao.regra_aprovada}}`. O simples acesso a link externo não comprova reserva.

### 7. OBRIGAÇÕES DA CONTRATANTE

**7.1.** A CONTRATANTE fornecerá dados verdadeiros e atualizados; comprovará poderes de seus signatários; concederá acessos; manterá verba e meio de pagamento da plataforma; entregará materiais; e aprovará ou reprovará oferta, texto, peças e orçamento nos canais definidos.

**7.2.** A CONTRATANTE declara possuir ou estar autorizada a usar os materiais, marcas, imagens, alegações, ofertas e dados fornecidos, respondendo por sua veracidade e legitimidade, sem afastar o dever da V2G de recusar conteúdo manifestamente contrário à lei ou às políticas aplicáveis.

**7.3.** A CONTRATANTE é responsável pelo atendimento e fechamento dos contatos recebidos. Contato ou conversa não equivale a venda, faturamento ou receita atribuída.

**7.4. [DECISÃO PENDENTE — correção de pendências]** Prazo, canal e efeito de não correção: `{{pendencias.procedimento_aprovado}}`.

### 8. APROVAÇÕES E INTELIGÊNCIA ARTIFICIAL

**8.1. [DECISÃO PENDENTE — matriz de aprovação]** Atos que exigem aprovação: `{{aprovacao.atos}}`; canais: `{{aprovacao.canais}}`; pessoas autorizadas: `{{aprovacao.pessoas_autorizadas}}`; prazo: `{{aprovacao.prazo}}`; efeito do silêncio: `{{aprovacao.efeito_do_silencio_aprovado}}`.

**8.2.** A V2G poderá usar inteligência artificial como ferramenta auxiliar, com revisão humana antes de apresentar conteúdo para aprovação. O uso de dados pessoais ou confidenciais, fornecedores, retenção e transferências seguirá o Anexo de Tratamento de Dados.

**8.3.** Não há promessa de erro zero, originalidade ou exclusividade absoluta, ausência de similaridade, nem conformidade jurídica automática de resultado produzido com auxílio de IA.

### 9. NATUREZA DA OBRIGAÇÃO E RESULTADOS

**9.1.** A obrigação da V2G é de meio. Não há garantia de quantidade de contatos, vendas, faturamento, retorno financeiro, custo por resultado, aprovação por plataforma ou data de publicação independente de pendências da CONTRATANTE ou de terceiros.

**9.2.** A ausência de garantia não afasta o dever de cumprir o escopo, atuar com diligência, prestar informações verdadeiras e responder, nos limites da lei e deste Contrato, por falhas imputáveis à V2G.

### 10. VIGÊNCIA, PERMANÊNCIA, CONTINUIDADE E REAJUSTE

**10.1. [ALTERADO]** A vigência começa no evento `{{contrato.marco_inicio_aprovado}}`, ocorrido em `{{contrato.data_inicio}}`. O período mínimo proposto de seis meses termina em `{{contrato.data_fim_periodo_minimo}}`. O plano termina, se tiver prazo determinado, em `{{contrato.data_fim_plano}}`.

**10.2. [DECISÃO PENDENTE — prazo e renovação]** Após o período mínimo ou o fim do plano, aplicar-se-á `{{contrato.regra_renovacao_ou_continuidade_aprovada}}`, incluindo aviso e forma de manifestação.

**10.3. [DECISÃO PENDENTE — reajuste]** Índice, periodicidade, data-base, aviso e hipótese de não aplicação: `{{financeiro.regra_reajuste_aprovada}}`.

### 11. CANCELAMENTO, RESCISÃO E PLANOS ANTECIPADOS

**11.1. [DECISÃO PENDENTE — procedimento]** Canal, forma, antecedência, confirmação e data efetiva do cancelamento: `{{encerramento.procedimento_aprovado}}`.

**11.2. [DECISÃO PENDENTE — saída antes de seis meses]** Regra, fórmula, base, teto, proporcionalidade e exceções: `{{encerramento.regra_saida_antecipada_aprovada}}`. Nenhum saldo remanescente será cobrado por inferência ou por este marcador vazio.

**11.3. [DECISÃO PENDENTE — antecipados]** Restituição, retenção ou crédito nos planos semestral e anual, diferenciada por causa do encerramento e período já prestado: `{{encerramento.regra_planos_antecipados_aprovada}}`.

**11.4. [DECISÃO PENDENTE — hipóteses e efeitos]** Rescisão por inadimplemento da V2G, inadimplemento da CONTRATANTE, impossibilidade técnica, decisão de plataforma, força maior e eventual direito legal de arrependimento: `{{encerramento.hipoteses_e_efeitos_aprovados}}`.

**11.5.** Encerrado o Contrato, a V2G registrará a situação das campanhas, retirará acessos conforme `{{encerramento.procedimento_acessos}}` e entregará `{{encerramento.entregaveis}}`. O encerramento de um CNPJ não encerra contrato de outro CNPJ.

### 12. INADIMPLÊNCIA, SUSPENSÃO, RETOMADA E ESTORNO

**12.1. [DECISÃO PENDENTE — inadimplência]** Prazo de cura, aviso, encargos, suspensão, situação das campanhas, retomada e resolução: `{{inadimplencia.regra_aprovada}}`.

**12.2. [DECISÃO PENDENTE — estorno e chargeback]** Procedimento, efeitos sobre acesso/prestação, conciliação e comunicação: `{{financeiro.regra_estorno_chargeback_aprovada}}`.

**12.3.** Não haverá suspensão automática, exclusão de ativos ou retomada sem condição e comunicação expressamente definidas nas regras aprovadas.

### 13. TITULARIDADE E PROPRIEDADE INTELECTUAL

**13.1.** Contas, marcas, materiais e ativos preexistentes da CONTRATANTE permanecem de sua titularidade ou de seus respectivos titulares. A V2G atua mediante acesso autorizado.

**13.2.** Tecnologia, métodos, templates, software e materiais preexistentes da V2G permanecem de sua titularidade.

**13.3. [DECISÃO PENDENTE — entregáveis]** Titularidade ou licença de peças finais, textos, imagens, arquivos-fonte, território, prazo, uso após término e condicionamento ao pagamento: `{{propriedade_intelectual.regra_aprovada}}`, respeitados direitos de terceiros e regras de plataformas.

### 14. PLATAFORMAS E OUTROS TERCEIROS

**14.1.** Plataformas de mídia, pagamento, assinatura, hospedagem e mensageria são terceiros com regras e decisões próprias. A V2G não garante aprovação ou continuidade por terceiro nem prazo de reversão.

**14.2.** A V2G comunicará ocorrências relevantes conhecidas e adotará as medidas contratadas. A atuação de terceiro não exclui responsabilidade por falha própria da V2G.

**14.3. [DECISÃO PENDENTE — indisponibilidade]** Aviso, pausa, cooperação, gasto já incorrido e efeito na vigência em caso de bloqueio ou indisponibilidade: `{{terceiros.regra_indisponibilidade_aprovada}}`.

### 15. DADOS PESSOAIS

**15.1. [DECISÃO PENDENTE — anexo de dados]** Papéis por finalidade, categorias, titulares, bases legais, instruções, suboperadores, transferências internacionais, segurança, atendimento a direitos, incidentes, retenção, devolução e eliminação constarão do Anexo de Tratamento de Dados `{{dados.anexo_versao}}`.

**15.2.** Os papéis serão definidos pelas atividades efetivamente desempenhadas. Quando atuar como operadora, a V2G seguirá instruções lícitas e documentadas da controladora e não usará os dados para finalidade própria incompatível.

**15.3. [DECISÃO PENDENTE — incidentes e retenção]** Prazos de aviso entre as Partes, cooperação, guarda e descarte: `{{dados.regra_incidentes_retencao_aprovada}}`.

### 16. CONFIDENCIALIDADE

**16.1.** Cada Parte protegerá informação confidencial recebida e a usará somente para executar este Contrato, limitando acesso a pessoas que dela necessitem.

**16.2. [DECISÃO PENDENTE — confidencialidade]** Definição, padrão de cuidado, exceções comprováveis, divulgação obrigatória, devolução/eliminação e prazo de sobrevivência: `{{confidencialidade.regra_aprovada}}`.

### 17. RESPONSABILIDADE

**17.1.** Cada Parte responde por seus atos, informações, acessos e materiais, conforme sua participação e a legislação aplicável.

**17.2. [DECISÃO PENDENTE — responsabilidade]** Danos abrangidos, limites, exclusões, indenização, procedimento e exceções: `{{responsabilidade.regra_aprovada}}`, preservadas normas inderrogáveis.

### 18. USO DE NOME, MARCA E CASE

**18.1.** A V2G não usará nome, marca ou resultado identificável da CONTRATANTE sem autorização separada, específica e verificável `{{case.autorizacao_id}}`. A recusa não altera o serviço.

**18.2. [DECISÃO PENDENTE — autorização]** Usos, canais, prazo, revogação para usos futuros e prova: `{{case.regra_aprovada}}`.

### 19. COMUNICAÇÕES

**19.1. [DECISÃO PENDENTE — canais]** Os canais, pessoas autorizadas, prova de recebimento e prazos por ato constarão do Anexo III. A matriz abrangerá operação, pendência, aprovação de oferta/peça, alteração de verba, inadimplência, cancelamento, incidente e notificação jurídica.

**19.2.** Alteração de contato ou poderes exige confirmação verificável. O recebimento por pessoa não autorizada não será presumido válido.

### 20. ASSINATURA ELETRÔNICA, VERSÕES E EVIDÊNCIAS

**20.1. [DECISÃO PENDENTE — provedor e método]** A assinatura ocorrerá pelo provedor `{{assinatura.provedor}}`, documento/envelope `{{assinatura.documento_externo_id}}`, com requisitos de identidade `{{assinatura.requisitos_identidade}}` e regra de testemunhas `{{assinatura.regra_testemunhas_aprovada}}`.

**20.2.** O envio dependerá de versão jurídica identificada, dados validados, preço compatível com o pedido, poderes conferidos e hash do arquivo registrado.

**20.3. [ALTERADO]** Antes da conclusão, qualquer correção gera nova `{{contrato.versao_documento}}`; a anterior será preservada e marcada como substituída ou cancelada, com seus convites invalidados. Após a conclusão, o PDF assinado e sua trilha não serão alterados; qualquer mudança exigirá aditivo ou novo contrato ligado ao original.

**20.4. [NOVO]** “Gerado”, “enviado”, “aberto” e “parcialmente assinado” não equivalem a contrato concluído. A conclusão exige todos os signatários previstos na regra de representação, eventos verificáveis, PDF final e trilha de auditoria reconciliados com pedido, versão e documento.

**20.5. [DECISÃO PENDENTE — entrega e guarda]** A cópia final será entregue por `{{assinatura.canal_entrega}}`, com evidência em `{{assinatura.copia_entregue_em}}`, e guardada por `{{assinatura.prazo_guarda_aprovado}}`.

### 21. DISPOSIÇÕES GERAIS

**21.1.** Este Contrato não cria vínculo empregatício, sociedade ou exclusividade. Tolerância não implica renúncia; invalidade parcial não afeta o restante nos limites legais.

**21.2. [DECISÃO PENDENTE — prevalência]** Ordem entre Contrato, Quadro-Resumo, anexos, pedido, checkout e outras comunicações: `{{contrato.ordem_prevalencia_aprovada}}`, sem excluir efeitos que a lei atribua à oferta/publicidade.

**21.3. [DECISÃO PENDENTE — cessão]** Cessão do Contrato e mudança de controle: `{{contrato.regra_cessao_aprovada}}`.

### 22. LEI APLICÁVEL E CONFLITOS

**22.1.** Aplica-se a legislação brasileira.

**22.2. [DECISÃO PENDENTE — conflitos e foro]** Negociação prévia, mediação e/ou foro: `{{conflitos.regra_aprovada}}`, sem afastar competência inderrogável nem proteção legal aplicável.

### ANEXO I — UNIDADES CONTRATADAS

Para cada unidade, preencher sem inventar identificadores:

| Ordem | Operação | Conta externa | Plataforma | Titularidade | Estado de identificação | Verba aprovada |
|---|---|---|---|---|---|---|
| `{{unidade.ordinal}}` | `{{unidade.operacao_nome}}` | `{{unidade.conta_id_externo}}` | `{{unidade.plataforma}}` | `{{unidade.titularidade}}` | `{{unidade.estado_identificacao}}` | `{{unidade.verba_aprovada}}` |

Conta não identificada impede publicação. **[DECISÃO PENDENTE — definir se impede também o envio à assinatura.]**

### ANEXO II — SIGNATÁRIOS E REPRESENTAÇÃO

Para cada signatário:

| Parte | Nome | CPF | E-mail | Papel | Regra individual/conjunta | Evidência de poderes | Conferida em |
|---|---|---|---|---|---|---|---|
| `{{signatario.parte}}` | `{{signatario.nome}}` | `{{signatario.cpf}}` | `{{signatario.email}}` | `{{signatario.papel}}` | `{{signatario.regra_assinatura}}` | `{{signatario.tipo_evidencia_poderes}}` | `{{signatario.evidencia_conferida_em}}` |

A V2G será representada por Victor, com qualificação e poderes documentalmente conferidos. Pela CONTRATANTE assinará ao menos um sócio, dono ou representante cuja regra societária e poderes tenham sido comprovados; se a representação for conjunta, todos os signatários exigidos deverão concluir.

### ANEXO III — COMUNICAÇÕES

| Ato | Canal | Pessoas autorizadas | Prova de recebimento | Prazo |
|---|---|---|---|---|
| Operacional | `{{comunicacao.operacional.canal}}` | `{{comunicacao.operacional.autorizados}}` | `{{comunicacao.operacional.prova}}` | `{{comunicacao.operacional.prazo}}` |
| Aprovação de oferta/peça | `{{comunicacao.aprovacao.canal}}` | `{{comunicacao.aprovacao.autorizados}}` | `{{comunicacao.aprovacao.prova}}` | `{{comunicacao.aprovacao.prazo}}` |
| Alteração de verba | `{{comunicacao.verba.canal}}` | `{{comunicacao.verba.autorizados}}` | `{{comunicacao.verba.prova}}` | `{{comunicacao.verba.prazo}}` |
| Inadimplência | `{{comunicacao.inadimplencia.canal}}` | `{{comunicacao.inadimplencia.autorizados}}` | `{{comunicacao.inadimplencia.prova}}` | `{{comunicacao.inadimplencia.prazo}}` |
| Cancelamento | `{{comunicacao.cancelamento.canal}}` | `{{comunicacao.cancelamento.autorizados}}` | `{{comunicacao.cancelamento.prova}}` | `{{comunicacao.cancelamento.prazo}}` |
| Incidente/notificação jurídica | `{{comunicacao.juridica.canal}}` | `{{comunicacao.juridica.autorizados}}` | `{{comunicacao.juridica.prova}}` | `{{comunicacao.juridica.prazo}}` |

### ASSINATURAS

**Pela V2G:**  
`{{#signatarios_v2g}}`  
`{{nome}}` — `{{qualificacao_e_poderes}}` — status `{{status}}`  
`{{/signatarios_v2g}}`

**Pela CONTRATANTE:**  
`{{#signatarios_contratante}}`  
`{{nome}}` — `{{papel_e_poderes}}` — status `{{status}}`  
`{{/signatarios_contratante}}`

**Testemunhas:** `{{assinatura.testemunhas}}` **[DECISÃO PENDENTE — advogado definir necessidade e regra.]**

---

## 5. Duas portas separam uma minuta íntegra de uma automação segura

### Porta A — liberar uma versão identificada à assinatura

- [ ] Todos os marcadores `[DECISÃO PENDENTE]`, campos `*_aprovado` e alternativas concorrentes foram resolvidos; nenhum aviso interno permanece.
- [ ] Advogado responsável registrou arquivo, `template_id`, versão, hash, data, escopo e identidade da aprovação; integridade técnica não foi confundida com aprovação jurídica.
- [ ] Dados societários da V2G e poderes de Victor foram conferidos documentalmente.
- [ ] Há um pedido e contrato por CNPJ; quantidade de contas iguala as unidades; nenhum saldo, verba ou operação foi misturado.
- [ ] Razão social, CNPJ, endereço, e-mail, signatários e poderes foram validados; regra individual/conjunta está satisfeita.
- [ ] Plano do documento coincide com checkout/pedido: R$ 500 mensal, R$ 2.850 semestral antecipado ou R$ 5.280 anual antecipado, sempre por conta; total é derivado da quantidade.
- [ ] Verba de mídia aparece separada e destacada.
- [ ] Formação, marco inicial, mês parcial, mínimo, vencimento, término, cancelamento, saída, antecipados, inadimplência, estorno, renovação e reajuste estão preenchidos.
- [ ] Escopo, suporte, relatório, reunião, aprovação, PI, LGPD, confidencialidade, responsabilidade, comunicação e foro estão aprovados.
- [ ] Contabilidade confirmou regra da NFS-e mensal por competência, inclusive nos antecipados, e tratamento de adiantamento/estorno.
- [ ] Provedor, método de assinatura, autenticação, testemunhas, evidência de poderes, entrega e guarda estão definidos.
- [ ] Snapshot, pedido, versão e hash do arquivo a enviar foram registrados e houve revisão humana final dos campos.

### Porta B — liberar automação em produção

- [ ] O schema suporta os três planos e rejeita preço, desconto, quantidade ou CNPJ incompatíveis.
- [ ] Idempotência usa `pedido.id + contrato.versao_minuta + contrato.versao_documento + tipo_instrumento`; repetição não cria envelope duplicado.
- [ ] Correção pré-conclusão gera nova versão, invalida convites anteriores e impede evento tardio de concluir a versão substituída.
- [ ] Eventos do provedor são autenticados, deduplicados por identificador e reconciliados mesmo fora de ordem.
- [ ] A regra de representação confere todos os signatários necessários e seus poderes.
- [ ] Estados são distintos: **gerado** = snapshot/versão/hash; **enviado** = envelope e convites emitidos; **parcialmente assinado** = ainda faltam signatários; **concluído pendente de verificação** = provedor encerrou, mas artefatos não foram reconciliados; **concluído e verificado** = assinaturas, PDF final, trilha e hashes conciliados.
- [ ] `gerado`, `enviado`, `aberto`, `parcialmente assinado`, `expirado`, `recusado`, `falhou` ou `substituído` mantêm publicação bloqueada.
- [ ] PDF final e trilha foram baixados, hasheados, armazenados com controle de acesso e ligados ao pedido/versão corretos.
- [ ] Cópia final foi entregue e há evidência de canal/data; “cópia entregue” não altera retroativamente o estado de conclusão.
- [ ] Documento concluído é imutável; aditivo/novo contrato preserva original e ligação entre instrumentos.
- [ ] O bloqueio de primeira publicação foi testado no serviço efetivamente publicador, não apenas na interface: exige `completed_verified` **e** todos os requisitos da Cláusula 5.
- [ ] Retenção e descarte de CPF, evidências, PDF e logs seguem regra LGPD aprovada; não se coleta IP, dispositivo ou geolocalização sem necessidade, base e transparência.
- [ ] Fluxos de pagamento sem assinatura, assinatura parcial, recusa, expiração, cancelamento, estorno e chargeback foram testados com dados fictícios.
- [ ] Emissão de NFS-e permanece evento separado de pagamento e assinatura; somente autorização do emissor comprova emissão.
- [ ] Aprovação de produção, responsável e evidências dos testes foram registradas.

## 6. Dezesseis promessas permanecem proibidas sem prova operacional

- Não prometer resultado garantido, quantidade de leads/contatos, vendas, faturamento, ROAS, ROI, custo por contato ou prazo de retorno.
- Não prometer publicação em minutos ou em data fixa independentemente de assinatura, poderes, acessos, conta, materiais, verba, aprovações, checklist e decisão da plataforma.
- Não prometer aprovação de anúncio, conta, recurso ou continuidade por Meta ou qualquer terceiro.
- Não prometer gestão “100% automática” ou primeira publicação automática; o fato confirmado é publicação inicial manual por gestor.
- Não prometer “IA sem erro”, originalidade/exclusividade absoluta, ausência de similaridade ou conformidade jurídica automática.
- Não chamar conversa ou contato de venda, receita ou faturamento sem rastreamento verificável.
- Não chamar documento de assinado/concluído quando apenas foi gerado, enviado, aberto ou parcialmente assinado.
- Não prometer força executiva apenas porque há assinatura eletrônica; obrigação precisa ser certa, líquida e exigível e o processo deve atender aos requisitos aplicáveis ([CPC, arts. 783 e 784](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilada.htm), consulta em 13/10/2026).
- Não prometer segurança total, zero vazamento, anonimização absoluta ou “LGPD 100% garantida”.
- Não prometer suporte imediato/24h, SLA, relatórios ou reuniões recorrentes enquanto canal, capacidade e frequência não estiverem aprovados e testados.
- Não anunciar “sem fidelidade” ou “cancele quando quiser” enquanto houver mínimo proposto e efeitos de saída ainda pendentes.
- Não dizer “sem custo além da mensalidade”: verba de mídia e eventuais valores cobrados por plataformas são separados.
- Não dizer que um contrato cobre todas as empresas do comprador; cada CNPJ exige pedido, contrato, cobrança, verba e operação separados.
- Não prometer NFS-e integral na compra nem regime fiscal específico antes da confirmação contábil; o fato definido é documento mensal por serviço prestado.
- Não dizer que o Asaas assina o contrato; ele está aprovado para pagamento, enquanto o provedor de assinatura segue pendente.
- Não afirmar “contrato aprovado por advogado” sem arquivo, versão, hash, responsável, data e escopo verificáveis.

## Conclusão

O problema central deixou de ser redação e passou a ser governança: **a mesma versão precisa unir oferta, checkout, operação, cobrança, fiscal e evidência de assinatura**. A minuta consolidada permite ao advogado decidir sem perder fatos já confirmados, mas seus marcadores impedem que incerteza seja transformada silenciosamente em obrigação do cliente ou direito da V2G.

A automação segura começa depois — não antes — da aprovação identificada. Seu estado decisivo deve ser “concluído e verificado”, e não apenas “assinado”: todas as assinaturas exigidas, PDF final, trilha, hashes e pedido/versão precisam convergir antes de qualquer primeira publicação.
