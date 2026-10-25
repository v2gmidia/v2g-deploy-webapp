# 05/06 — prova autenticada do envio pronto no QA — 25/10/2026

## §0 — resultado e limite

**PASS neste percurso:** envio de um criativo pronto pelo navegador, confirmação explícita, persistência visível após recarga e isolamento ao trocar entre os dois negócios identificados abaixo. A imagem foi recebida para revisão, **não publicada**. Não conclui geração por IA, aprovação completa, mesa do gestor, publicação ou as etapas 05/06 inteiras.

**Fonte:** passagem do Central recebida neste chat em 25/10/2026, informando teste no Chrome autorizado por Victor com material seguro. Este registro atribui a execução ao Central; a frente 05/06 apenas registrou o relato e o comparou com o manifesto existente. Não reabriu navegador, sessão, upload, consultas remotas ou testes. Não recebeu capturas, IDs técnicos do pedido/objeto/negócios, SHA publicado ou hash dos bytes remotos nesta passagem; não os inferir por nome ou por evidência de outro dia.

O arquivo enviado **permanece no negócio “v2g teste”**. Sem autorização específica, não apagar, reenviar ou executar limpeza. Identificar os IDs/caminho exatos e seus vínculos antes de qualquer limpeza futura; nome de arquivo/negócio não autoriza exclusão.

## Percurso e observações transmitidos pelo Central

| Campo | Evidência relatada em 25/10 |
| --- | --- |
| Ambiente | `https://v2g-webapp-qa.vercel.app`, rota `/criativos`; QA, não produção. |
| Negócio de envio | “v2g teste”; biblioteca inicialmente vazia. |
| Material | `public/marca.png` do próprio repositório, aproximadamente 12 KB; sem material de cliente. Não é imagem gerada por IA. |
| Objetivo | “Receber mensagens no WhatsApp”. |
| Promoção com prazo | Não. |
| Conferência | Tela exibiu arquivo, objetivo e promoção; exigiu confirmação explícita antes do envio. |
| Retorno | “Peça recebida para revisão do gestor. Ela ainda não foi publicada.” |
| Após recarga | “Em revisão” = 1; card `marca.png` reapareceu com “Sem anúncio” e “Recebido para revisão do gestor”; sem promoção e sem associação a anúncio. |
| Troca de negócio autenticada | Ao selecionar “V2G QA Multiconta B — FICTÍCIA” e abrir `/criativos`, todos os filtros ficaram em 0 e a biblioteca vazia. |

**Interpretação restrita:** o arquivo não desapareceu após recarregar e não foi exibido no segundo negócio nesse percurso autenticado. Isso não prova nova sessão, outro usuário, negação por requisição adulterada, acesso após revogação, hash remoto ou todos os estados possíveis da fila. A confirmação de envio não é aprovação da peça para publicação.

## Comparação com o manifesto de 22/10

Fonte: [`docs/qa/envio-pronto-ui-manifesto-22-10.json`](../qa/envio-pronto-ui-manifesto-22-10.json), casos UI-01 a UI-06. O manifesto planejava **dois atores separados**, novos negócios/IDs próprios e eventual limpeza restrita. Seus atores continuam com IDs nulos; não foram associados por dedução aos negócios usados em 25/10. O arquivo JSON permanece como plano histórico, sem marcar uma execução integral que não ocorreu.

| Caso planejado | Cobertura nova em 25/10 | O que ainda falta nesse caso |
| --- | --- | --- |
| UI-01 — seleção, substituição, teclado, nome/tamanho/prévia | **Parcial:** PNG selecionado/enviado e identificado no percurso de conferência. | Substituir arquivo, teclado completo e conferência detalhada da prévia/tamanho na interface não foram relatados como executados. |
| UI-02 — WhatsApp sem promoção, conferir/voltar/conferir/enviar | **PASS no caminho direto; parcial no caso completo:** objetivo/ausência de promoção, conferência explícita, envio e retorno coerente. | Ida e volta da conferência preservando arquivo/dados não executadas. Contagem direta de pedidos/objetos e duplicidade não foram medidas nesta passagem. |
| UI-03 — Instagram, promoção, data passada/futura | **Não executado.** | Todo esse caso permanece pendente. |
| UI-04 — recarga e novo login | **Recarga PASS; parcial no caso completo:** mesmo card/estado reapareceu. | Novo login e renovação/expiração efetiva de URL privada não executados neste percurso. |
| UI-05 — separação A/B com sessões de clientes distintos | **Troca entre os dois negócios PASS; parcial no caso completo.** | Segundo usuário/sessão independente e isolamento entre donos não executados nesta rodada. Não confundir troca de negócio no mesmo acesso com dois atores do manifesto. |
| UI-06 — desktop/celular/teclado | **Não concluído:** Chrome usado no percurso, sem auditoria completa de layout. | Celular, teclado completo, foco e responsividade/estados extremos não executados. |

Portanto, a frase histórica “todos os seis casos pendentes” do checkpoint de 22/10 não descreve mais a cobertura parcial atual. Porém **não há evidência para marcar os seis casos completos como aprovados**. Preservar separadamente o PASS do caminho WhatsApp direto, da recarga e da troca entre os dois negócios.

## Provas anteriores preservadas

O [ensaio HTTPS de 21/10](./e28-qa-publicado-e-ensaio-https-21-10.md:31) já registra **17 verificações** com Auth, banco/Storage/hash, privacidade, novo login e isolamento em seus próprios atores/recorte. Não foi reexecutado aqui. A prova de 25/10 acrescenta percurso pela interface no Chrome; não soma uma nova suíte de 17 nem transfere seu novo login/hash/limpeza para o teste atual.

As fixtures de 21/10 foram limpas naquele ensaio. **O upload de 25/10 não foi limpo** e não é um residual da rodada antiga. A versão `fbf00ee` foi confirmada em uma leitura anterior, não reconfirmada para esta passagem; SHA/deployment de 25/10 não informado. Os checkpoints de [envio/desenho de 22/10](./e28-05-06-envio-e-desenho-22-10.md) e [adapters locais](./e28-05-06-adapters-geracao-local-22-10.md) permanecem históricos, com seus próprios ambientes e limites.

## Limites e encerramento

- Não houve, segundo a passagem: novo login, segundo usuário, celular, teclado completo, promoção/data, Instagram, arquivo inválido, duplicidade, exclusão, decisão do gestor ou publicação. Nenhum anúncio foi criado/publicado; produção não foi testada.
- Esta prova não mede geração, qualidade ou custo de IA, dispatcher, execução de campanha ou integração de métricas. Não amplia o aceite para esses itens.
- A frente 05/06 criou somente este registro documental; não modificou código, manifesto JSON, índices/decisões, Figma/planilha ou configuração. Alterações de outras frentes presentes no working tree foram preservadas.
- Nenhum upload, exclusão, teste remoto/local do produto, chamada paga, migração, build/restart, commit/push/deploy ou mensagem a outro chat/pessoa foi feito por esta frente nesta rodada.

**Parado após o registro solicitado.** Completar casos pendentes ou limpar o upload depende de direção específica do Central/Victor; não foi iniciado outro bloco.
