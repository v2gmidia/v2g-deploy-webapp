# Execução V2G até o evento de 28/10 — espelho do plano v4

Atualizado em 20/10/2026 por autorização direta de Victor neste chat. Este arquivo espelha a coordenação; o [FigJam](https://www.figma.com/board/sQrIlGhDDaqHUtV2WacWSg) é o mapa de jornada/aceite e a [planilha](https://docs.google.com/spreadsheets/d/1xPtwgyMkgwNKVDB8L61jEmf0UDaofKhwPfT1JU4Dpk8) é o acompanhamento diário. Não certifica produção.

## Encerramento da coordenação noturna — 21/10, 03:49

Após duas rodadas sem mudança e sem próximo recorte local útil, a automação foi **PAUSADA**, conforme combinado. Os quatro chats encerraram seus blocos locais e aguardam revisão/portões externos. Relatório completo: `docs/handoffs/fechamento-noite-21-10.md`. Não significa conclusão do aplicativo nem QA/produção. Figma principal continua com atualização noturna pendente; planilha e este espelho registram os retornos.

## Atualização noturna — 21/10, rodada 04 (após 02:49)

E28-05-B agora está **preparado localmente**: “Ver números” foi ligado à ficha interna, com carteira conferida e flag OFF. Foram relatados 13 testes de consumidor/SSR, tipos e navegação DEV desktop/celular com fixtures fictícias; Central conferiu checkpoint, wrapper, ligação da página e mensagens. Não houve login/backend/HTTPS reais. Fonte: `docs/estado/e28-05-consumidor-leitura-local-21-10.md`.

Planilha: 8 células de estado/prova/próximo passo/dependência atualizadas e relidas; E28-05-B mudou de Planejado para Preparado localmente, sem declarar QA concluído. Figma principal NÃO RELIDO/ATUALIZADO; indisponibilidade anterior sem mudança.

Todos os recortes locais autorizados desta noite encerraram. Não foi enviado novo bloco: próximas ações requerem revisão/autorização QA, configuração, sessões/ativos ou decisões humanas. Contagem de rodadas sem progresso reiniciada em zero pela entrega nova; o acompanhamento observará os retornos antes de encerrar por esgotamento.

## Atualização noturna — 21/10, rodada 02 (após 01:49)

- **01/02:** ponte assistida Asaas implementada LOCALMENTE, preservando origem/lead/legado; confirmação de pagamento separada da recorrência. 62 testes, SQL efêmero e tipos relatados. Nova migration individual e flag OFF; QA real NÃO homologado. Agora aguarda revisão e autorizações específicas. Fonte: `docs/estado/e28-01-ponte-assistida-asaas-21-10.md`.
- **05/06:** migration de intenção reforçada e testada em PostgreSQL efêmero; adaptador e28-07-v1 por carteira pronto, sem incompatibilidade reportada ao backend. 60 testes dirigidos e tipos; sem UI consumindo nessa entrega. Central iniciou consumidor mínimo LOCAL na mesa interna, sem reabrir visual do upload/IA. Fonte: `docs/estado/e28-05-06-envio-e-handoff-21-10.md`.
- **03/04 e 07/08:** entregas anteriores preservadas, sem novo despacho; não há correção independente nova para justificar repetição.
- **Planilha:** mais 14 células de evidência/próximo passo/conferência atualizadas e relidas. Estados de QA não foram promovidos. Figma principal continua pendente de atualização; não foi tentado novamente sem mudança no ambiente.
- **Portões:** banco externo/publicação/configuração/email e piloto autenticado requerem revisão/autorização; nenhum ato desses foi executado. Ainda há trabalho local útil em 05/06.

## Atualização noturna — 21/10, rodada 01

O histórico v4 de 20/10 abaixo permanece como referência. Esta atualização posterior registra retornos locais novos; não certifica QA ou produção.

- **01/02:** prontidão de alertas/outbox, diagnóstico, conciliação controlada e pacote individual QA preparados; 9 testes dirigidos + SQL efêmero + tipos no relatório. Achado: pedido assistido ainda `direct_pix` e webhook rejeita essa origem Asaas. Central iniciou ponte LOCAL preservando origem/lead e separação entre pagamento confirmado e recorrência. Fonte: `docs/estado/e28-01-02-prontidao-local-21-10.md`.
- **03/04:** multiconta/onboarding preservados. Frente adicional de recebimento Meta documentada em `docs/recebimento-cliente-meta.md` e [novo FigJam](https://www.figma.com/board/DGGCCnjlOlmy5vzsa11yoW). Sem mudança de ativos, credenciais ou submissão. Próximo piloto exige ativos/autorização reais; frente aguarda, sem retrabalho.
- **05/06:** refinamento visual de “Já tenho um criativo” concluído localmente; 27 testes e navegação da bancada, sem homologação Auth/Storage. Central encaminhou ensaio SQL efêmero, pacote individual QA e adaptador de leitura local com a fixture canônica de 07/08. Não abrir caminhos IA 2/3. Fonte: `docs/estado/criativos-refino-visual-envio-21-10.md`.
- **07/08:** contrato `e28-07-v1` e nove fixtures entregues; ausência, zero e origem inconsistente diferenciados. Relatório: 70 focados, 2790 unitários/9 ignorados, Ruff/mypy. Sem chamada externa nesta rodada. Handoff enviado a 05/06; backend aguarda incompatibilidade concreta. Fonte: backend `docs/estado/e28-07-08-contrato-handoff-21-10.md`.
- **Fontes:** 22 células de prova/próximo passo na planilha foram atualizadas e relidas; status de QA e metas preservados. Figma principal **não relido/atualizado nesta rodada**: conector limitado e tentativa Chrome retornou timeout CDP. Atualização do quadro fica pendente, sem alegar sincronização.
- **Limites:** nenhuma alteração de produto pelo Central; sem commit/push/deploy/migration externa/envio/cobrança. Coordenação ativa até 08:00. Checkpoint detalhado em `docs/handoffs/noite-21-10-central.md`.

## Estado confirmado e próximos blocos — revisão v4

Conferência em 20/10/2026: últimas respostas e relatórios dos quatro chats lidos; todos encerraram o bloco local. Esta atualização organiza o próximo trabalho e não inicia outra implementação. A [aba Resumo 01-08](https://docs.google.com/spreadsheets/d/1xPtwgyMkgwNKVDB8L61jEmf0UDaofKhwPfT1JU4Dpk8/edit#gid=20261022) traz a visão por etapa; `Plano diário 20-31` mantém os 31 IDs e suas metas.

### Próximo bloco 01 — 01 e 02

- **Estado:** Preparado localmente; QA anterior preservado.
- **Feito/prova:** Venda direta sem lead fictício, CNPJ validado e confirmação bancária obrigatória. 49 testes locais + tipos. Pix semestral, cartão anual e primeira mensalidade já têm provas anteriores no Sandbox.
- **Sequência:**
  1. Revisar e integrar o diff de compra/acesso sem repetir cobranças.
  2. Publicar em QA na janela autorizada.
  3. Testar em HTTPS operador e cliente: origem direta/LP, CNPJ inválido, comprovante sem acesso e negócio correto.
  4. Registrar evidência e passar o acesso/onboarding para 03/04.
- **Aceite:** Correções novas percorridas no QA com pessoa/negócio certos; QA anterior não é prova da nova bifurcação.
- **Ação humana:** Autorizar publicação/ensaio QA quando o pacote estiver revisado. Sem nova cobrança real.
- **Meta:** 21/10. Datas são metas, não certificação antecipada.
- **Fonte:** docs/estado/e28-01-02-procedimento-assistido-20-10.md.

### Próximo bloco 02 — 01 e 02 + Victor

- **Estado:** Procedimento local pronto; uso real pendente.
- **Feito/prova:** Checklist por compra, responsáveis e evidências definidos; trava impede uso da minuta V2 de teste. Nenhum contrato enviado/assinado ou NFS-e emitida nesta rodada.
- **Sequência:**
  1. Identificar arquivo/versão final aprovada e parâmetros fiscais restantes.
  2. Definir registro auditável no app para assinatura manual e nota autorizada: /pedidos hoje só consulta esses estados.
  3. Ensaiar o procedimento com dados fictícios, sem assinatura/emissão real.
  4. Na contratação real autorizada, conferir assinaturas, autorização fiscal e referências do pedido/negócio.
- **Aceite:** Pagamento, contrato assinado e nota autorizada separados; nenhuma minuta de teste ou nota agendada vira concluída.
- **Ação humana:** Fornecer instrumento final aprovado; confirmar canal fiscal, competência/mês parcial e retenção/município com a contabilidade.
- **Meta:** 21/10 procedimento; automação 30/10. Datas são metas, não certificação antecipada.
- **Fonte:** docs/estado/e28-01-02-procedimento-assistido-20-10.md.

### Próximo bloco 03 — 03 e 04

- **Estado:** Concluído no recorte; regressão local aprovada.
- **Feito/prova:** Multiconta preservada. 152 testes conjuntos de 03/04 + tipos passaram; corrigido apenas conferidor desatualizado. Nenhuma reconstrução do produto.
- **Sequência:**
  1. Preservar implementação e o limite do recorte aprovado.
  2. No QA integrado, abrir duas sessões/negócios e alternar contas.
  3. Conferir isolamento de respostas, arquivos, pedidos e negação de negócio não autorizado.
  4. Guardar evidência de tela/servidor após integrar as outras frentes.
- **Aceite:** 152 testes locais são prova local; duas sessões autenticadas no ambiente publicado continuam pendentes.
- **Ação humana:** Somente autorizar/fornecer sessões de QA se não estiverem disponíveis.
- **Meta:** 24/10 regressão publicada. Datas são metas, não certificação antecipada.
- **Fonte:** docs/estado/continuidade-onboarding-regressao-20-10.md.

### Próximo bloco 04 — 03 e 04

- **Estado:** Onboarding concluído; agenda externa conferida.
- **Feito/prova:** Início mantém reunião pendente por negócio; carteira orienta confirmar no Google. Agenda pública lida sem reservar: 25 min, São Paulo, CNPJ obrigatório. 152 testes conjuntos passaram.
- **Sequência:**
  1. Preservar saída do onboarding para agenda/Início sem loop.
  2. Ensaiar uma reserva real de QA autorizada, confirmação, remarcação e cancelamento pelo e-mail.
  3. Conferir que clique/retorno ao app não confirma reunião sem evidência.
  4. Manter conferência humana; conciliação automática e reserva única por negócio ficam em P1.
- **Aceite:** Cliente orientado e pendência encontrável. Reserva única/remarcação sincronizada ainda não comprovadas no app.
- **Ação humana:** Autorizar reserva de teste e disponibilizar caixa/calendário do ensaio.
- **Meta:** 22/10 continuidade; 24/10 QA. Datas são metas, não certificação antecipada.
- **Fonte:** docs/estado/continuidade-onboarding-regressao-20-10.md.

### Próximo bloco 05 — 05 e 06

- **Estado:** Base local existente; integração pendente.
- **Feito/prova:** Carteira/fila e mesa de demonstração anteriores preservadas. O último bloco não concluiu E28-05-A/B. Demonstração sintética não é mesa integrada com clientes reais.
- **Sequência:**
  1. Conectar pedido com imagem/versão aprovada à fila existente.
  2. Mostrar responsável, pendência, decisão e próximo passo; provar isolamento gestor/cliente.
  3. Consumir o contrato de leitura do backend em servidor autorizado.
  4. Ensaiar revisão → publicação manual → evidência de veiculação → aviso; ampliar mesa depois.
- **Aceite:** Fila durável, peça exata e dados do negócio correto; sem endpoint interno ou papel global exposto ao cliente.
- **Ação humana:** Confirmar gestor/sessões autorizadas para o ensaio. A publicação real exige autorização própria.
- **Meta:** 24–25/10. Datas são metas, não certificação antecipada.
- **Fonte:** docs/estado/e28-06-pedido-duravel-e-gerador-20-10.md.

### Próximo bloco 06 — 05 e 06

- **Estado:** Pedido preparado localmente; imagem ainda não gerada.
- **Feito/prova:** Formulário/action/adaptador do pedido por negócio; proteção contra replay/alteração. 15 testes com banco simulado + tipos. Migration preparada, não aplicada; flag desligada.
- **Sequência:**
  1. Adaptar gerador existente para pedido/versão, reserva atômica, consumo e falha ambígua sem repetição paga.
  2. Preparar documento/ângulo de barbearia e testar com mock/arquivo fictício.
  3. Com autorização, aplicar somente a migration revisada em QA e provar persistência/isolamento.
  4. Executar piloto autorizado: proposta de 1 imagem feed fictícia, teto total US$ 2.
  5. Guardar arquivo privado/versão, recuperar após recarga e ligar aprovação da versão exata à fila.
- **Aceite:** Imagem real recuperável após logout/recarga; falha/replay não duplica custo; pedido salvo sozinho não fecha a entrega.
- **Ação humana:** Autorizar migration QA específica e piloto/material/teto; revisar documento de barbearia. Nenhum gasto autorizado por esta atualização.
- **Meta:** 23/10 imagem; 24–25/10 aprovação/operação. Datas são metas, não certificação antecipada.
- **Fonte:** docs/estado/e28-06-pedido-duravel-e-gerador-20-10.md.

### Próximo bloco 07 — 07 e 08 + 05 e 06

- **Estado:** Leitura própria real; contratos implementados localmente.
- **Feito/prova:** Meta própria respondeu HTTP 200. Vínculo manual por IDs e metadados implementados. 30 testes focados; suíte 2780 passou/9 ignorados; Ruff/mypy. Linhas com entrega zero não provam veiculação paga.
- **Sequência:**
  1. 05/06 consome contrato_de_leitura pelo servidor; 07/08 fecha lacunas locais de medição.
  2. Publicar backend/WebApp em QA autorizado e comparar período/fonte/conta preservando desconhecidos.
  3. Victor indica conta externa; administrador comprova ativos atribuídos ao usuário de sistema V2G.
  4. Executar leitura externa e validar visualização com cliente comum, sem liberar operador.
  5. Conferir vínculo de campanha publicada manualmente e números com a fonte; receita/conversas não são inferidas.
- **Aceite:** Conta própria ≠ conta externa. Fuso/atribuição/completude/conversas indisponíveis continuam desconhecidos.
- **Ação humana:** Nomear cliente/conta externa autorizada, IDs e confirmar atribuição dos ativos. Autorizar publicação QA.
- **Meta:** 21–23/10 integração; 26/10 prova. Datas são metas, não certificação antecipada.
- **Fonte:** backend_v2g/docs/estado/e28-07-08-resultado-20-10.md.

### Próximo bloco 08 — 07 e 08 + Central + Victor

- **Estado:** Roteiro pronto; ensaio ainda não executado.
- **Feito/prova:** Runbook com transições, donos, evidências e contingências entregue. Planejamento central atualizado. Não houve ensaio integrado nem captura de interessado do evento nesta rodada.
- **Sequência:**
  1. Alinhar IDs: E28-08-B é captura; E28-08-C é ensaio. Preparar negócio/material fictício e roteiro demonstrável.
  2. Confirmar formulário/WhatsApp de captura, origem, responsável e próximo contato.
  3. 26/10: executar jornada HTTPS/celular com os blocos integrados, registrar falhas e evidências.
  4. 27/10: corrigir bloqueios e congelar roteiro; 28/10: demonstrar somente o comprovado.
  5. 29–31/10: retorno aos interessados e revisão de novembro pelos gargalos observados.
- **Aceite:** Roteiro pronto não é ensaio aprovado; exemplos fictícios identificados e contingência manual explícita.
- **Ação humana:** Confirmar canal/pitch, contas e participação no ensaio de 26/10; priorizar correções e roteiro.
- **Meta:** 22/10 roteiro; 26 ensaio; 27 congelamento; 28 evento. Datas são metas, não certificação antecipada.
- **Fonte:** backend_v2g/docs/estado/e28-08-runbook-evento-20-10.md.

**Ordem crítica:** 06 gerador/arquivo e 07 contrato de leitura em paralelo → 05 revisão/consumo autorizado → QA integrado → ensaio 26/10 → correções 27/10 → evento 28/10. 01/02 e 03/04 entram na regressão sem reconstruir o concluído. E28-08-B é captura; E28-08-C é ensaio, apesar da troca de rótulo no primeiro relatório backend.

## Direção aprovada

1. Direção de Victor em 20/10: buscar o melhor e priorizar primeiro o que funciona e permite vender/entregar até 28/10.
2. Geração e armazenamento de imagens e resultados confiáveis são P0. O primeiro piloto é estreito, utilizável e rastreável.
3. Vendas iniciais assistidas pelo WhatsApp. Automação Asaas/contrato/NFS-e é P1; pagamento, assinatura e emissão reais continuam sendo tratados corretamente.
4. Onboarding e multiconta permanecem concluídos no recorte aprovado. Conciliação Google é ampliação; continuidade manual acompanhada é aceitável.
5. Reunião inicial de 25 minutos termina buscando acessos testados, hipótese e primeira peça; impedimento guarda responsável e próximo passo.
6. Cliente aprova a versão exata no app. Equipe revisa e gestor publica manualmente. Revisado/aprovado/publicado/em análise/no ar são estados distintos.
7. Meta Developers não concede acesso a contas de clientes. Publicação manual pode usar o Gerenciador, com acesso autorizado. Integração da API precisa de permissão própria.
8. Arquivamento de arquivo não pausa anúncio. Campanha → conjunto → anúncio → criativo associado; uma peça pode ser reutilizada.
9. Métricas precisam de negócio/conta/objeto/período/fuso/fonte/coleta. Conversa, lead, venda relatada e receita confirmada são distintos.
10. Semáforo inclui sem dados; benchmark só com objetivo, fonte, amostra e meta aplicáveis. Nenhuma pausa automática por benchmark ou simples passagem de três dias.
11. Meta interna de atender revisão em menos de 24h precisa ser medida e ter janela definida; não é SLA contratual ou automação comprovada.
12. Avisos: hipótese de resumo no Início, não decisão de excluir a aba. Preservar atual caixa de ação; mudanças só para fechar a jornada.
13. Conta deve reaproveitar respostas do onboarding e permitir correção; novas perguntas apenas se houver lacuna demonstrada, sem onboarding extenso adicional.
14. Agências: mesa mínima e escopo por negócio têm valor. Delegação externa completa e benchmark amplo são evolução; nunca dar operador global como atalho.
15. Jev, CRM WhatsApp, previsão, importação Instagram e app nas lojas ficam depois do núcleo. Nenhum deles é caminho crítico do evento.
16. Datas são metas de execução; depender de permissões/QA/gasto exige registrar bloqueio e alternativa honesta, sem declarar pronto por preparação local.
17. Autonomia autorizada para mapear, implementar e testar blocos locais úteis. Sem commit/push/merge/deploy, publicação de campanha, cobrança ou escrita em produção por esta coordenação.
18. Segredos não entram em prompts, logs ou documentos. Testes usam dados fictícios; materiais reais/chamadas pagas só nos pilotos e limites explicitamente autorizados.
19. Figma rege jornada/aceite; Planilha rege execução diária. Ambos usam E28-*. Código, resposta do provedor e QA sustentam o estado técnico, nunca cor do quadro.
20. Cada chat mantém evidência no próprio relatório. Central escreve os dois quadros; evita que agentes concorrentes mudem datas, status e arquivos compartilhados sem coordenação.

## Etapas e corte do evento

### 01 — Entrada, venda assistida e acesso

- Responsável: 01 e 02.
- Prioridade: P0 no acesso • P1 no checkout.
- Meta: 21/10.
- Estado confirmado em 20/10: Preparado localmente; QA anterior preservado. Venda direta sem lead fictício, CNPJ validado e confirmação bancária obrigatória. 49 testes locais + tipos. Pix semestral, cartão anual e primeira mensalidade já têm provas anteriores no Sandbox.
- Mínimo: LP → formulário → conversa no WhatsApp → contratação e pagamento conferidos → acesso ao negócio certo.
- Bastidor manual: Victor conduz venda e conferência. Compra direta pública pode esperar.
- Depois: Checkout em produção, 3DS e recorrência novos; preservar provas já obtidas.
- Aceite: Pedido pendente não libera acesso; confirmação vincula e-mail/CNPJ corretos; origem da LP não se perde.

### 02 — Contrato e nota fiscal

- Responsável: 01 e 02 + Victor.
- Prioridade: P1 automação • obrigatório operar.
- Meta: 21/10 procedimento.
- Estado confirmado em 20/10: Procedimento local pronto; uso real pendente. Checklist por compra, responsáveis e evidências definidos; trava impede uso da minuta V2 de teste. Nenhum contrato enviado/assinado ou NFS-e emitida nesta rodada.
- Mínimo: Procedimento manual rastreável por contratação: contrato aprovado, signatário, confirmação e nota conforme orientação fiscal.
- Bastidor manual: Victor faz envio/assinatura e emissão com os instrumentos autorizados.
- Depois: Automação com provedor, webhook, competência fiscal e entrega de PDFs.
- Aceite: Responsável e próximo passo definidos; não exibir assinado/emitido sem confirmação nem reabrir questões jurídicas por suposição.

### 03 — Acesso multiconta

- Responsável: 03 e 04.
- Prioridade: Preservar entrega concluída.
- Meta: 24/10 regressão.
- Estado confirmado em 20/10: Concluído no recorte; regressão local aprovada. Multiconta preservada. 152 testes conjuntos de 03/04 + tipos passaram; corrigido apenas conferidor desatualizado. Nenhuma reconstrução do produto.
- Mínimo: Um login alterna entre negócios autorizados mantendo dados, imagens e respostas separados.
- Bastidor manual: Não exige operação manual nova.
- Depois: Delegação de equipes/agências exige escopo próprio; operador global não é atalho.
- Aceite: Duas contas isoladas e tentativa de acesso indevido negada; alterações das outras frentes não causam regressão.

### 04 — Onboarding e reunião inicial

- Responsável: 03 e 04.
- Prioridade: P0 continuidade • P1 agenda integrada.
- Meta: 22/10 mínimo • 24/10 regressão.
- Estado confirmado em 20/10: Onboarding concluído; agenda externa conferida. Início mantém reunião pendente por negócio; carteira orienta confirmar no Google. Agenda pública lida sem reservar: 25 min, São Paulo, CNPJ obrigatório. 152 testes conjuntos passaram.
- Mínimo: Concluir salva respostas, orienta o próximo passo e deixa conclusão/pendência encontrável pelo responsável.
- Bastidor manual: Google agenda; se não houver reserva confirmada, equipe contata e marca. Conferir cancelamento pelo e-mail.
- Depois: Reserva/remarcação/cancelamento conciliados no app e limite de uma reserva ativa por negócio.
- Aceite: Cliente não fica preso; reserva não é confirmada por clique; testar confirmação/cancelamento, horários e mitigação de reservas abusivas.

### 05 — Mesa mínima do supergestor

- Responsável: 05 e 06.
- Prioridade: P0 operação • P1 mesa completa.
- Meta: 24/10 mínimo • 25/10 leitura.
- Estado confirmado em 20/10: Base local existente; integração pendente. Carteira/fila e mesa de demonstração anteriores preservadas. O último bloco não concluiu E28-05-A/B. Demonstração sintética não é mesa integrada com clientes reais.
- Mínimo: Ver seus negócios, onboarding, pendências e pedidos de criativos; abrir arquivo exato e encaminhar decisão.
- Bastidor manual: Gestor usa o Gerenciador de Anúncios para publicar e resolver exceções.
- Depois: Mesa completa, todos os benchmarks e delegação externa de agência.
- Aceite: Cliente e outro gestor não acessam a carteira; aviso/pedido não se perde; desconhecido nunca aparece verde; meta interna <24h a medir, sem SLA automático.

### 06 — Criar, guardar, aprovar e publicar

- Responsável: 05 e 06.
- Prioridade: P0 principal diferencial.
- Meta: 23/10 geração • 24/10 revisão • 25/10 vínculo.
- Estado confirmado em 20/10: Pedido preparado localmente; imagem ainda não gerada. Formulário/action/adaptador do pedido por negócio; proteção contra replay/alteração. 15 testes com banco simulado + tipos. Migration preparada, não aplicada; flag desligada.
- Mínimo: Oferta/contexto → imagem real → arquivo privado durável → biblioteca → aprovação explícita da versão → fila do gestor → publicação manual com IDs.
- Bastidor manual: Equipe revisa; gestor publica após condições cumpridas. Texto ao cliente: peça em revisão pela equipe.
- Depois: Importar Instagram, geração ampla, substituição/publicação autônomas.
- Aceite: Imagem reaparece após logout; erro/replay não duplica custo; até 3 refações conforme regra; conta/versão corretas; 'no ar' só com evidência da Meta.

### 07 — Resultados confiáveis e dados

- Responsável: 07 e 08 (backend) + 05 e 06 (telas).
- Prioridade: P0 leitura • P2 inteligência.
- Meta: 21/10 viabilidade • 23/10 contrato • 25/10 tela.
- Estado confirmado em 20/10: Leitura própria real; contratos implementados localmente. Meta própria respondeu HTTP 200. Vínculo manual por IDs e metadados implementados. 30 testes focados; suíte 2780 passou/9 ignorados; Ruff/mypy. Linhas com entrega zero não provam veiculação paga.
- Mínimo: Provar conta V2G e conta externa autorizada; ligar campanha manual → negócio → período → gasto/cliques/impressões/conversas.
- Bastidor manual: Receita e vendas declaradas ficam identificadas; reconciliação com gestor pode ser manual e datada.
- Depois: CRM WhatsApp, previsão, Jev em volume e decisões automáticas.
- Aceite: Sem credencial no navegador; usuário comum sem papel no app Meta; fonte/fuso/atribuição/coleta explícitos; erro ≠ zero; não inventar vínculo por criativo.

### 08 — Ensaio, demonstração e retorno

- Responsável: 07 e 08 + Victor.
- Prioridade: P0 ensaio • P1 expansão operacional.
- Meta: 26/10 ensaio • 27/10 congelar • 28/10 evento.
- Estado confirmado em 20/10: Roteiro pronto; ensaio ainda não executado. Runbook com transições, donos, evidências e contingências entregue. Planejamento central atualizado. Não houve ensaio integrado nem captura de interessado do evento nesta rodada.
- Mínimo: Roteiro celular/desktop, evidência por transição, captura de interessados e próximo contato; plano manual se integração faltar.
- Bastidor manual: Victor vende, demonstra, decide gastos e disponibilidade; gestor opera.
- Depois: 29/10 retornos; 30/10 priorização; 31/10 fechamento.
- Aceite: Demonstração só usa funções comprovadas; amostra fictícia marcada; nenhuma cobrança/campanha/reserva fictícia aparece como real.

## Dia a dia — metas, não garantias externas

| Dia | Objetivo | Entrega | Dono | Evidência esperada |
|---|---|---|---|---|
| 20/10 | Alinhar e iniciar os blocos | Publicar plano v3 no FigJam/Sheets; repassar contexto e iniciar 01/02, 03/04, 05/06 e 07/08. | Central | Planejamento atualizado; execução técnica em início. |
| 21/10 | Fechar acessos e contratos de integração | 07/08 prova caminho Meta e campanhas manuais; 05/06 mapeia gerador existente e propõe piloto/custo; 01/02 fecha procedimento assistido; 03/04 confere agenda. | Todos | Relatório com lacunas exatas, contrato compartilhado e pedido humano mínimo. |
| 22/10 | Ligar os caminhos locais | 05/06 integra pedido/geração/armazenamento; 07/08 prepara leitura e vínculo; 03/04 implementa continuidade e testa cancelamento/orientação. | 05/06 • 07/08 • 03/04 | Percurso local utilizável, falhas visíveis e testes sintéticos; migration/produção não presumidas. |
| 23/10 | Provar geração e entrega à revisão | Imagem real com custo autorizado; biblioteca e refação; fila mínima do gestor; contrato de métricas pronto para consumo. | 05/06 • 07/08 | Arquivo e versão recuperáveis; prova real depende de piloto, acesso e teto aprovado. |
| 24/10 | Provar aprovação e isolamento | Cliente aprova versão exata; gestor revisa; regressão duas contas/onboarding; testar permissões e ausência de vazamento. | 05/06 • 03/04 | Sessões cliente/gestor, negócio correto e falhas/reenvios documentados. |
| 25/10 | Fechar resultados e operação manual | Telas consomem dados autorizados; vincular campanha manual; validar início/anúncios e estados da fonte; confirmar dono da operação. | 05/06 • 07/08 • Victor | Comparação com a Meta no mesmo período; sem dado não é zero/verde; manual claramente operante. |
| 26/10 | Ensaiar jornada estável | Percorrer acesso → onboarding → agenda → imagem → aprovação → gestor → publicação e resultado; celular e HTTPS. | Todos • Victor | Matriz de evidência e lista curta de bloqueios. Publicação e mídia exigem conta/teto/autorização. |
| 27/10 | Corrigir bloqueios e congelar | Corrigir P0, repetir somente testes afetados, confirmar versão/ambiente, roteiro e contingência; fechar pacote para o evento. | Todos • Victor | Sem função nova; versão da demo identificada e decisões de seguir/reduzir registradas. |
| 28/10 | Demonstrar e vender | Apresentar funções comprovadas, captar origem/contato e registrar próximo passo; fechamento assistido pelo WhatsApp. | Victor | Evento realizado é relato a registrar; este calendário não confirma resultados ou presença. |
| 29/10 | Retomar interessados | Revisar contatos do evento, priorizar dores e executar próximo contato autorizado. | Victor • apoio operacional | Cada interessado com origem, contexto e próximo passo; sem envio autônomo. |
| 30/10 | Escolher o próximo bloco | Comparar aprendizado e falhas; reavaliar checkout, automações, agência e CRM; atualizar prioridades de novembro. | Victor • Central | Próxima entrega definida por evidência, sem tratar backlog como função pronta. |
| 31/10 | Fechar outubro | Consolidar entregas, limites, pendências e responsabilidades; preservar evidências e preparar início de novembro. | Victor • Central | Resumo de outubro com concluído/local/QA/produção separados. |

## Tarefas E28 — mesmos IDs do Figma e da planilha

### E28-01-A — Fechar caminho de venda assistida até acesso

- Etapa / dono / prioridade: 01 / 01 e 02 / P0.
- Janela: 2026-10-20 a 2026-10-21.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: Pagamento conferido, pessoa/negócio corretos e próximo passo documentados.
- Dependências: nenhuma dependência de tarefa adicional.
- Depende de Victor/externo: Autorizar publicação/ensaio QA quando o pacote estiver revisado. Sem nova cobrança real.
- Evidência atual: Venda direta sem lead fictício, CNPJ validado e confirmação bancária obrigatória. 49 testes locais + tipos. Pix semestral, cartão anual e primeira mensalidade já têm provas anteriores no Sandbox. Fonte: docs/estado/e28-01-02-procedimento-assistido-20-10.md
- Próximo passo: Revisar e integrar o diff de compra/acesso sem repetir cobranças. → Publicar em QA na janela autorizada. → Testar em HTTPS operador e cliente: origem direta/LP, CNPJ inválido, comprovante sem acesso e negócio correto. → Registrar evidência e passar o acesso/onboarding para 03/04.

### E28-01-B — Preservar vínculo LP → pedido e controles de acesso

- Etapa / dono / prioridade: 01 / 01 e 02 / P0.
- Janela: 2026-10-20 a 2026-10-21.
- Estado após conferência de 20/10: Comprovado em QA.
- Aceite: Reutilizar provas de concorrência, negação e vínculo; localizar lacuna de publicação real.
- Dependências: E28-01-A.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Provas anteriores de vínculo LP/pedido, concorrência e negação preservadas. Nova bifurcação WhatsApp/LP testada apenas localmente. Fonte: e28-01-02-procedimento-assistido-20-10.md.
- Próximo passo: 1) Preservar QA anterior. 2) No novo QA, testar LP e atendimento direto. 3) Não repetir Pix/cartão já comprovados sem motivo concreto.

### E28-01-C — Reavaliar checkout público, 3DS e recorrência

- Etapa / dono / prioridade: 01 / 01 e 02 / P1.
- Janela: 2026-10-29 a 2026-10-30.
- Estado após conferência de 20/10: Adiado pós-evento.
- Aceite: Checklist real de produção e pendências Asaas atualizado; reusar ensaios aprovados.
- Dependências: E28-01-A.
- Depende de Victor/externo: Habilitação Asaas, 2FA e autorização financeira específica.
- Evidência atual: Novo 3DS preparado localmente e schema QA; não comprovado ponta a ponta.
- Próximo passo: Preservar trabalho existente sem puxar o caminho crítico.

### E28-02-A — Procedimento manual de contrato e nota por compra

- Etapa / dono / prioridade: 02 / 01 e 02 + Victor / P0.
- Janela: 2026-10-20 a 2026-10-21.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: Dono, dados, instrumento aprovado e evidência de assinatura/emissão definidos.
- Dependências: E28-01-A.
- Depende de Victor/externo: Fornecer instrumento final aprovado; confirmar canal fiscal, competência/mês parcial e retenção/município com a contabilidade.
- Evidência atual: Checklist por compra, responsáveis e evidências definidos; trava impede uso da minuta V2 de teste. Nenhum contrato enviado/assinado ou NFS-e emitida nesta rodada. Fonte: docs/estado/e28-01-02-procedimento-assistido-20-10.md
- Próximo passo: Identificar arquivo/versão final aprovada e parâmetros fiscais restantes. → Definir registro auditável no app para assinatura manual e nota autorizada: /pedidos hoje só consulta esses estados. → Ensaiar o procedimento com dados fictícios, sem assinatura/emissão real. → Na contratação real autorizada, conferir assinaturas, autorização fiscal e referências do pedido/negócio.

### E28-02-B — Planejar próximo recorte da automação contratual/fiscal

- Etapa / dono / prioridade: 02 / 01 e 02 / P1.
- Janela: 2026-10-29 a 2026-10-30.
- Estado após conferência de 20/10: Adiado pós-evento.
- Aceite: Dependências e próximo bloco definidos; emissão e assinatura só com confirmação.
- Dependências: E28-02-A.
- Depende de Victor/externo: Contador/provedor quando necessários.
- Evidência atual: Automação não é pré-requisito da venda assistida.
- Próximo passo: Não reconstruir minuta nem integrar novo provedor antes do P0.

### E28-03-A — Preservar multiconta concluída

- Etapa / dono / prioridade: 03 / 03 e 04 / P0.
- Janela: 2026-10-19 a 2026-10-19.
- Estado após conferência de 20/10: Concluído no recorte.
- Aceite: Dois negócios no mesmo login com contexto isolado.
- Dependências: nenhuma dependência de tarefa adicional.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Multiconta já concluída; preservada e coberta pelos 152 testes locais conjuntos de 03/04 em 20/10.
- Próximo passo: 1) Preservar recorte. 2) Ensaiar duas sessões/negócios no QA integrado. 3) Anexar evidência de isolamento.

### E28-04-A — Preservar onboarding até agenda externa

- Etapa / dono / prioridade: 04 / 03 e 04 / P0.
- Janela: 2026-10-19 a 2026-10-19.
- Estado após conferência de 20/10: Concluído no recorte.
- Aceite: Respostas/retomada preservadas e conclusão orienta agenda.
- Dependências: nenhuma dependência de tarefa adicional.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Onboarding/retomada/saída para agenda já concluídos; 152 testes conjuntos de 03/04 em 20/10.
- Próximo passo: 1) Preservar fluxo. 2) No QA, concluir e voltar ao Início. 3) Manter reunião pendente sem fonte de confirmação.

### E28-04-B — Conferir agenda e continuidade após onboarding

- Etapa / dono / prioridade: 04 / 03 e 04 / P0.
- Janela: 2026-10-20 a 2026-10-22.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: Cancelar/reagendar/orientar pelo Google; conclusão fica acompanhável e ninguém fica preso.
- Dependências: E28-04-A.
- Depende de Victor/externo: Autorizar reserva de teste e disponibilizar caixa/calendário do ensaio.
- Evidência atual: Início mantém reunião pendente por negócio; carteira orienta confirmar no Google. Agenda pública lida sem reservar: 25 min, São Paulo, CNPJ obrigatório. 152 testes conjuntos passaram. Fonte: docs/estado/continuidade-onboarding-regressao-20-10.md
- Próximo passo: Preservar saída do onboarding para agenda/Início sem loop. → Ensaiar uma reserva real de QA autorizada, confirmação, remarcação e cancelamento pelo e-mail. → Conferir que clique/retorno ao app não confirma reunião sem evidência. → Manter conferência humana; conciliação automática e reserva única por negócio ficam em P1.

### E28-03-B — Regressão multiconta, onboarding e saída para início

- Etapa / dono / prioridade: 03/04 / 03 e 04 / P0.
- Janela: 2026-10-23 a 2026-10-24.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: Duas sessões/contas e negação fora do escopo; salvar/recarregar/trocar negócio corretos.
- Dependências: E28-03-A; E28-04-B.
- Depende de Victor/externo: Somente autorizar/fornecer sessões de QA se não estiverem disponíveis.
- Evidência atual: 152/152 testes conjuntos: multiconta/sessão/onboarding/agenda/gestor; tipos e diff passaram. Apenas teste desatualizado corrigido. Fonte: docs/estado/continuidade-onboarding-regressao-20-10.md
- Próximo passo: Preservar implementação e o limite do recorte aprovado. → No QA integrado, abrir duas sessões/negócios e alternar contas. → Conferir isolamento de respostas, arquivos, pedidos e negação de negócio não autorizado. → Guardar evidência de tela/servidor após integrar as outras frentes.

### E28-04-C — Planejar reserva conciliada e proteção por negócio

- Etapa / dono / prioridade: 04 / 03 e 04 / P1.
- Janela: 2026-10-29 a 2026-10-30.
- Estado após conferência de 20/10: Adiado pós-evento.
- Aceite: Contrato de uma reserva ativa, remarcação/cancelamento e idempotência revisados.
- Dependências: E28-04-B.
- Depende de Victor/externo: Acesso de calendário se a integração for aprovada.
- Evidência atual: Meta pós-evento; sem garantia de evitar todo abuso hoje.
- Próximo passo: Não construir calendário próprio antes do núcleo.

### E28-05-A — Ligar a fila mínima de revisão do gestor

- Etapa / dono / prioridade: 05 / 05 e 06 / P0.
- Janela: 2026-10-21 a 2026-10-24.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: Pedido durável com negócio/arquivo/versão, responsável e decisão; outro gestor/cliente barrados.
- Dependências: E28-06-C.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Base anterior de fila/Storage preservada. Último bloco só preparou pedido sem imagem; não concluiu nova integração da revisão.
- Próximo passo: 1) Receber imagem privada/versionada de E28-06-B/C. 2) Vincular pedido à fila existente. 3) Conferir gestor responsável/isolamento. 4) Testar decisão e próximo passo em QA.

### E28-05-B — Mesa mínima consome leitura autorizada

- Etapa / dono / prioridade: 05 / 05 e 06 / P0.
- Janela: 2026-10-23 a 2026-10-25.
- Estado após conferência de 20/10: Planejado.
- Aceite: Carteira correta e sinais fundamentados; sem fonte/amostra/metas não há verde.
- Dependências: E28-07-B; E28-07-C.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Contrato de leitura entregue pelo backend; ainda não consumido pela mesa/Início/Anúncios nesta rodada.
- Próximo passo: 1) 05/06 adaptar leitura pelo servidor usando contrato do 07/08. 2) Exibir fonte/período/coleta e desconhecidos. 3) Provar carteira/cliente e números em QA.

### E28-05-C — Definir ampliação de agência e benchmarks

- Etapa / dono / prioridade: 05 / 05 e 06 / P1.
- Janela: 2026-10-29 a 2026-10-30.
- Estado após conferência de 20/10: Adiado pós-evento.
- Aceite: Escopo de agência e parâmetros reais antes de exposição externa.
- Dependências: E28-05-B.
- Depende de Victor/externo: Victor confirma público/contas e metas.
- Evidência atual: Não conceder operador global a agência.
- Próximo passo: Escolher próximo recorte após o evento.

### E28-06-A — Escolher integração mínima da geração reutilizando backend

- Etapa / dono / prioridade: 06 / 05 e 06 / P0.
- Janela: 2026-10-20 a 2026-10-21.
- Estado após conferência de 20/10: Em andamento.
- Aceite: Inspecionar src/imagem, APIs e mocks existentes; definir provedor, piloto e limite.
- Dependências: nenhuma dependência de tarefa adicional.
- Depende de Victor/externo: Autorizar migration QA específica e piloto/material/teto; revisar documento de barbearia. Nenhum gasto autorizado por esta atualização.
- Evidência atual: Gerador backend inspecionado; reutilização escolhida. Contrato/pedido preparados. Faltam chamador idempotente e consumo medido. Fonte: docs/estado/e28-06-pedido-duravel-e-gerador-20-10.md
- Próximo passo: 1) Implementar adaptador por pedido/versão com mock. 2) Reserva atômica e reconciliação após timeout. 3) Documento barbearia. 4) Revisar condições do piloto pago.

### E28-06-B — Gerar imagem e persistir arquivo/versão na biblioteca

- Etapa / dono / prioridade: 06 / 05 e 06 / P0.
- Janela: 2026-10-21 a 2026-10-23.
- Estado após conferência de 20/10: Em andamento.
- Aceite: Imagem real reaparece após recarga/logout; erro/replay não duplica custo/arquivo.
- Dependências: E28-06-A.
- Depende de Victor/externo: Autorizar migration QA específica e piloto/material/teto; revisar documento de barbearia. Nenhum gasto autorizado por esta atualização.
- Evidência atual: Formulário/action/adaptador do pedido por negócio; proteção contra replay/alteração. 15 testes com banco simulado + tipos. Migration preparada, não aplicada; flag desligada. Não há imagem gerada/arquivada. Fonte: docs/estado/e28-06-pedido-duravel-e-gerador-20-10.md
- Próximo passo: Adaptar gerador existente para pedido/versão, reserva atômica, consumo e falha ambígua sem repetição paga. → Preparar documento/ângulo de barbearia e testar com mock/arquivo fictício. → Com autorização, aplicar somente a migration revisada em QA e provar persistência/isolamento. → Executar piloto autorizado: proposta de 1 imagem feed fictícia, teto total US$ 2. → Guardar arquivo privado/versão, recuperar após recarga e ligar aprovação da versão exata à fila.

### E28-06-C — Aprovar versão exata e enviar à revisão

- Etapa / dono / prioridade: 06 / 05 e 06 / P0.
- Janela: 2026-10-22 a 2026-10-24.
- Estado após conferência de 20/10: Planejado.
- Aceite: Identidade, versão, conteúdo e momento aprovados no app; até 3 refações com instrução.
- Dependências: E28-06-B.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Aprovação da nova imagem gerada não integrada; depende de arquivo/versão recuperáveis.
- Próximo passo: 1) Vincular prévia à versão imutável. 2) Registrar aprovação explícita no app. 3) Alteração gera nova versão. 4) Enviar versão aprovada à fila e testar isolamento.

### E28-06-D — Registrar publicação manual e veiculação

- Etapa / dono / prioridade: 06 / 05 e 06 / P0.
- Janela: 2026-10-24 a 2026-10-25.
- Estado após conferência de 20/10: Planejado.
- Aceite: Guardar IDs negócio/conta/campanha/conjunto/anúncio/peça; 'no ar' depende da Meta.
- Dependências: E28-06-C; E28-07-B.
- Depende de Victor/externo: Gestor/conta/material autorizados; campanha e verba reais exigem autorização própria.
- Evidência atual: Vínculo manual backend preparado localmente; interface/publicação/aviso da nova jornada ainda não ensaiados.
- Próximo passo: 1) Conferir contrato, acessos e versão aprovada. 2) Gestor publica manualmente em ação autorizada. 3) Registrar IDs exatos e evidência. 4) Confirmar veiculação e só então avisar cliente.

### E28-06-E — Priorizar importação Instagram e maior autonomia

- Etapa / dono / prioridade: 06 / 05 e 06 / P2.
- Janela: 2026-10-29 a 2026-10-30.
- Estado após conferência de 20/10: Adiado pós-evento.
- Aceite: Avaliar esforço depois do núcleo comprovado; sem prometer API aprovada.
- Dependências: E28-06-D.
- Depende de Victor/externo: Permissões externas se aplicável.
- Evidência atual: Não faz parte do mínimo até 28/10.
- Próximo passo: Registrar backlog sem implementar agora.

### E28-07-A — Provar acesso e origem das métricas Meta

- Etapa / dono / prioridade: 07 / 07 e 08 / P0.
- Janela: 2026-10-20 a 2026-10-21.
- Estado após conferência de 20/10: Em andamento.
- Aceite: Mapear app/permissões sem ler segredos; leitura própria e conta externa autorizada; reportar bloqueio exato.
- Dependências: nenhuma dependência de tarefa adicional.
- Depende de Victor/externo: Nomear cliente/conta externa autorizada, IDs e confirmar atribuição dos ativos. Autorizar publicação QA.
- Evidência atual: Leitura real própria: identidade/permissões/campanhas/insights HTTP 200. Conta externa não testada. Fonte: backend_v2g/docs/estado/e28-07-08-resultado-20-10.md
- Próximo passo: 1) Preservar prova própria. 2) Nomear conta externa e ativos autorizados. 3) Confirmar atribuição ao usuário de sistema. 4) Ler e registrar limites.

### E28-07-B — Ligar campanha manual ao negócio e ao contrato de leitura

- Etapa / dono / prioridade: 07 / 07 e 08 / P0.
- Janela: 2026-10-21 a 2026-10-23.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: IDs exatos, autorização por carteira/cliente, fonte e período; não criar nova campanha.
- Dependências: E28-07-A.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Associação manual Meta por IDs, confirmação, autor/motivo, replay e recusa de substituição implementada no backend; sem escrita real. Fonte: e28-07-contrato-leitura-campanha-20-10.md.
- Próximo passo: 1) WebApp autoriza sessão/carteira e usa somente execução retornada pelo servidor. 2) Integrar chamada interna. 3) Ensaiar outro negócio/cliente negado e vínculo correto em QA.

### E28-07-C — Conferir números, atualização e significado

- Etapa / dono / prioridade: 07 / 07 e 08 / P0.
- Janela: 2026-10-22 a 2026-10-23.
- Estado após conferência de 20/10: Preparado localmente.
- Aceite: Gasto/cliques/impressões/conversas no mesmo período/fuso/atribuição; desconhecido não é zero.
- Dependências: E28-07-B.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Contrato com identidade/fonte/período/moeda/coleta e lacunas. 30 testes focados, 2780 unitários/9 ignorados, Ruff/mypy. Fonte: e28-07-08-resultado-20-10.md.
- Próximo passo: 1) Consumir contrato no WebApp. 2) Preservar null/sem_dados. 3) Reconciliar métricas com a fonte no mesmo período. 4) Persistir metadados ausentes no próximo recorte necessário.

### E28-07-D — Ensaio de resultados V2G e cliente externo

- Etapa / dono / prioridade: 07 / 07 e 08 + 05 e 06 / P0.
- Janela: 2026-10-24 a 2026-10-26.
- Estado após conferência de 20/10: Planejado.
- Aceite: Contrato consumido pelas telas; prova de sessão comum sem papel Meta e negação fora da conta.
- Dependências: E28-07-C; E28-05-B.
- Depende de Victor/externo: Nomear cliente/conta externa autorizada, IDs e confirmar atribuição dos ativos. Autorizar publicação QA.
- Evidência atual: Leitura própria real e contrato local existem; faltam consumo no WebApp e ensaio autenticado externo.
- Próximo passo: 1) Integrar backend/WebApp. 2) Disponibilizar QA autorizado. 3) Comparar dados próprios e externos no mesmo período. 4) Testar cliente comum e isolamento. 5) Registrar lacunas.

### E28-07-E — Escolher primeiro recorte CRM/IA depois da captura

- Etapa / dono / prioridade: 07 / 07 e 08 / P2.
- Janela: 2026-10-29 a 2026-10-30.
- Estado após conferência de 20/10: Adiado pós-evento.
- Aceite: Proposta revisável; classificação fechada pode usar Jev após medir; sem previsão inventada.
- Dependências: E28-07-D.
- Depende de Victor/externo: Victor prioriza.
- Evidência atual: CRM do cliente é distinto do RevOps interno.
- Próximo passo: Documentar sem construir inbox WhatsApp agora.

### E28-08-A — Roteiro de ensaio e contingência

- Etapa / dono / prioridade: 08 / 07 e 08 / P0.
- Janela: 2026-10-20 a 2026-10-22.
- Estado após conferência de 20/10: Concluído no recorte.
- Aceite: Matriz por transição com fonte, ambiente, responsável e caminho manual real.
- Dependências: nenhuma dependência de tarefa adicional.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Runbook com transições, donos, evidências e contingências entregue. Planejamento central atualizado. Não houve ensaio integrado nem captura de interessado do evento nesta rodada. Fonte: backend_v2g/docs/estado/e28-08-runbook-evento-20-10.md
- Próximo passo: 1) Alinhar IDs do roteiro ao plano central. 2) Preparar contas/dados/contingência. 3) Executar E28-08-C em 26/10 e registrar o que realmente passou.

### E28-08-B — Preparar captura de interessados no evento

- Etapa / dono / prioridade: 08 / 07 e 08 + Victor / P1.
- Janela: 2026-10-22 a 2026-10-23.
- Estado após conferência de 20/10: Planejado.
- Aceite: Formulário/WhatsApp existente, origem e próximo contato; nenhum envio sem pedido.
- Dependências: E28-01-A.
- Depende de Victor/externo: Victor confirma canal/pitch; integração com LP depende do responsável dessa frente.
- Evidência atual: Runbook descreve campos mínimos; não houve captura real nem integração nova com a LP.
- Próximo passo: 1) Confirmar canal/formulário existente com responsável da LP. 2) Registrar origem, dor, responsável e retorno. 3) Ensaiar interessado fictício sem envio comercial.

### E28-08-C — Ensaio HTTPS e celular da jornada

- Etapa / dono / prioridade: 08 / Todos + Victor / P0.
- Janela: 2026-10-25 a 2026-10-26.
- Estado após conferência de 20/10: Planejado.
- Aceite: Acesso/onboarding/agenda/imagem/aprovação/fila/publicação/resultado; provas e pendências separadas.
- Dependências: E28-03-B; E28-06-D; E28-07-D; E28-08-A.
- Depende de Victor/externo: Victor confirma participação e contas/sessões autorizadas; reservas/pilotos têm autorização específica.
- Evidência atual: Runbook pronto, sem ensaio integrado executado. IDs corrigidos neste acompanhamento: 08-C é ensaio.
- Próximo passo: 26/10: 1) Conferir ambiente/versões. 2) Percorrer acesso/onboarding/agenda/criativos/revisão/resultados em HTTPS e celular. 3) Registrar prova por transição. 4) Falha vira impedimento e contingência declarada.

### E28-08-D — Corrigir bloqueios e congelar demonstração

- Etapa / dono / prioridade: 08 / Todos + Victor / P0.
- Janela: 2026-10-26 a 2026-10-27.
- Estado após conferência de 20/10: Planejado.
- Aceite: Versão/ambiente identificados; repetir testes afetados; funções sem prova ficam fora da demo real.
- Dependências: E28-08-C.
- Depende de Victor/externo: Victor autoriza publicação de QA quando necessária.
- Evidência atual: 27/10 é meta operacional, não garantia de aprovação externa.
- Próximo passo: 27/10: 1) Classificar falhas do ensaio por bloqueio real. 2) Corrigir o núcleo. 3) Repetir somente o que falhou. 4) Congelar roteiro/versões e contingência.

### E28-08-E — Evento: demonstrar e fechar assistidamente

- Etapa / dono / prioridade: 08 / Victor / P0.
- Janela: 2026-10-28 a 2026-10-28.
- Estado após conferência de 20/10: Planejado.
- Aceite: Funções comprovadas, interessados registrados e próximo contato.
- Dependências: E28-08-D.
- Depende de Victor/externo: Victor conduz demonstração e venda assistida.
- Evidência atual: Evento é marco futuro, não resultado alcançado.
- Próximo passo: 28/10: 1) Usar ambiente/negócio conferidos. 2) Demonstrar somente funções comprovadas. 3) Explicar bastidor manual. 4) Capturar origem/dor/próximo contato.

### E28-08-F — Retornar aos interessados do evento

- Etapa / dono / prioridade: 08 / Victor + apoio / P0.
- Janela: 2026-10-29 a 2026-10-29.
- Estado após conferência de 20/10: Planejado.
- Aceite: Origem, dor, responsável e próximo passo de cada contato.
- Dependências: E28-08-E.
- Depende de Victor/externo: Victor autoriza/executa mensagens.
- Evidência atual: Nenhum lead ou venda do evento foi presumido.
- Próximo passo: Priorizar contatos com interesse real.

### E28-08-G — Repriorizar novembro a partir dos aprendizados

- Etapa / dono / prioridade: 08 / Victor + Central / P1.
- Janela: 2026-10-30 a 2026-10-30.
- Estado após conferência de 20/10: Planejado.
- Aceite: Selecionar automação/CRM/agência pelo gargalo observado.
- Dependências: E28-08-F.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Não tratar tarefas adiadas como abandonadas.
- Próximo passo: Atualizar backlog e contratos de próximo bloco.

### E28-08-H — Fechar outubro e repassar novembro

- Etapa / dono / prioridade: 08 / Victor + Central / P1.
- Janela: 2026-10-31 a 2026-10-31.
- Estado após conferência de 20/10: Planejado.
- Aceite: Resumo com concluído/local/QA/produção, falhas e donos.
- Dependências: E28-08-G.
- Depende de Victor/externo: Bloco local pode avançar
- Evidência atual: Nenhuma previsão financeira sem base.
- Próximo passo: Fechar evidências e responsabilidades.

## Divisão de arquivos e integração

- Central: `docs/decisoes.md`, este espelho, Figma e calendário. Outros chats produzem seus relatórios; não reescrevem o plano central sem coordenação.
- 01/02: contratação, pagamento, acesso comercial e procedimento contratual/fiscal. Preservar todos os ensaios passados. Não editar onboarding, criativos ou métricas.
- 03/04: multiconta, onboarding e agenda; preservar entregas encerradas. Para pendência visível ao gestor, produzir contrato/evento e combinar consumo com 05/06, sem editar a fila dele.
- 05/06: `app/(protected)/criativos`, `app/(supergestor)`, rotas operacionais legadas, `components/gestor`, `lib/criativos`, `lib/gestor`, e os adaptadores de leitura para Início/Anúncios. Pode mapear e, se necessário, adaptar a geração existente em `backend_v2g/src/imagem`; 07/08 não altera essa área.
- 07/08: backend `src/metricas`, coleta, rotas/modelos de leitura e vínculo de campanhas; runbook e matriz de ensaio. Entrega contrato a 05/06; não edita frontend nem `src/imagem` em paralelo.
- Arquivos compartilhados (`package.json`, `proxy.ts`, layouts, CSS global, índice de estado): alterações mínimas; releia antes de editar, preserve mudanças alheias e registre no relatório. Novas migrations são apenas propostas revisáveis, sem aplicação automática.
- Nenhum chat interrompe o dev ou roda build enquanto outro usa a mesma `.next`; avisar/combinar a janela ou usar diretório de saída isolado comprovadamente suportado. Testes puros/typecheck podem avançar com atenção aos arquivos gerados.

## Contratos obrigatórios entre as frentes

1. Identidade: `business_id`, conta de anúncios, campanha, conjunto, anúncio, peça e versão, cada um com fonte e permissões verificadas. Nome, telefone e e-mail não fazem ligação automática.
2. Métricas: intervalo, fuso, moeda, coleta, completude, objetivo/evento e janela de atribuição; números ausentes/indisponíveis são distintos de zero.
3. Geração: pedido e versão por negócio, materiais autorizados, estado, idempotência, reserva de custo e arquivo privado. Não duplicar gerador já existente no backend.
4. Aprovação/publicação: aprovação explícita da versão no app; revisão operacional; publicação manual; IDs e evidência da Meta. Esses eventos não se substituem.
5. Agenda: conclusão de onboarding e reserva externa são eventos distintos; clique "já marquei" não confirma. Cancelamento/remarcação precisam de fonte ou procedimento humano verificável.
6. Acesso: pagamento pendente não libera; pagamento aprovado e contrato assinado são fatos separados. Agências nunca recebem o operador global como atalho.

## Como reportar

Cada chat deve retornar: IDs E28 tratados; resultado funcional; arquivos; testes realmente executados; local/QA/produção; limite e bloqueio exato; próximo passo e eventual ação humana. Não afirmar pronto com base em fixture, parser, gate ou build isolado. Não enviar mensagens a clientes, cobrar, publicar ou conceder acesso por este plano. Mensagens aos chats citados foram autorizadas diretamente por Victor.

## Fontes atuais conferidas

- `docs/estado/etapa-01-qa-vinculo-seguranca-financeiro-19-10.md` e `etapa-01-3ds-integrado-preparo-19-10.md`.
- `docs/estado/criativos-prevoo-conjunto-20-10.md`, `criativos-porta-geracao-20-10.md` e `criativos-galeria-caminho-revisao-20-10.md`.
- `docs/estado/gestor-carteira-analise-referencias-20-10.md` e `docs/mesa-gestor-contrato-leitura.md`.
- FigJam consultado em 20/10, aba `Leia primeiro` e calendário existente fornecido por Victor, últimas respostas dos chats 01/02, 03/04 e 05/06.

## Despacho e conferência do Central — 20/10/2026

O plano foi publicado no FigJam existente e na planilha original. A aba `Plano diário 20-31` contém 31 tarefas E28, com responsável, prazo, aceite, dependência e evidência. Os calendários de outubro e novembro referenciam essa base. As tarefas históricas foram preservadas e identificadas quando replanejadas.

| Chat | Identificador | Bloco encaminhado | Confirmação nesta rodada |
|---|---|---|---|
| 01 e 02 | `01a14514-ec1d-75a1-8384-8e21d734a619` | Venda assistida, compra/acesso e procedimento manual de contrato/nota | Execução iniciada |
| 03 e 04 | `01a14512-228b-7480-a516-5dffed95cdb6` | Continuidade após onboarding, agenda e regressão sem refazer o concluído | Execução iniciada |
| 05 e 06 | `01a14518-055f-7de3-a904-f05147067fb4` | Geração e arquivo privado, versão aprovada, revisão e publicação manual | Execução iniciada |
| 07 e 08 | `01a15bcc-35d0-7a93-aa09-129cb42d5eaf` | Backend de leitura/métricas e vínculos; roteiro de ensaio e contingência | Chat criado e execução iniciada |

Os prompts completos estão em `docs/handoffs/evento-28-10-01-02.md`, `evento-28-10-03-04.md`, `evento-28-10-05-06.md` e `evento-28-10-07-08.md`. Cada um contém fontes, escopo, metas, aceite, limites, propriedade de arquivos e contratos com as outras frentes.

Conferências realizadas pelo Central:

- FigJam: plano vigente `12:160`, execução diária `99:160` e decisões/contratos `99:212` salvos; inspeção estrutural sem texto fora dessas seções e conferência visual do detalhamento diário.
- Planilha: conteúdo relido após as escritas; fórmulas corrigidas para o separador da localidade; trechos alterados sem erro de fórmula. Tabela nativa, datas, listas de estado, filtros e congelamento preservados/configurados. Conferência visual da nova aba e do calendário de outubro.
- A planilha registra seis tarefas iniciais como `Em andamento` após confirmação de atividade dos chats. Isso confirma o início do bloco, não implementação concluída nem prova de produção.
- O último ajuste opcional de navegação no FigJam foi recusado pelo limite de chamadas MCP do plano Starter. A faixa adicional "Comece aqui" e as alterações daquele último lote não foram aplicadas; os três blocos principais acima já estavam salvos e conferidos.
- Nesta coordenação, o Central editou apenas documentação local e os dois documentos remotos autorizados. Não executou build nem ensaio funcional do produto; esses testes pertencem aos blocos encaminhados. Não fez commit, push, deploy, migration aplicada ou mudança de produção. O trabalho simultâneo dos outros chats foi preservado.

As datas são metas de execução e revisão, não promessa de aprovação de provedores: imagem recuperável em 23/10, ensaio completo em 26/10, correções e congelamento em 27/10, evento em 28/10. A disponibilidade para o evento depende das evidências de cada bloco.

Rechecagem de despacho: o chat 03/04 encerrou sua primeira resposta com uma atualização antiga do FigJam, sem comprovar E28-04-B/E28-03-B. O Central reencaminhou o prompt completo, indicando o desvio de contexto e a execução local ainda necessária. Essa resposta não foi contabilizada como conclusão das tarefas novas. Os demais chats continuavam ativos: 01/02 relatou testes locais do vínculo/isolamento; 05/06 identificou riscos de replay/substituição no gerador existente e iniciou o pedido durável; 07/08 iniciou a conferência de rotas e versão do backend. Esses relatos de progresso não certificam a jornada completa.

## Fechamento da reconciliação v4 — 20/10/2026

- Os retornos finais dos quatro chats foram relidos. Todos encerraram seus recortes locais; a revisão atual não iniciou outro bloco de implementação.
- Os oito cards do FigJam foram atualizados com feito/prova, sequência do próximo bloco, aceite e dependência humana. Multiconta/onboarding continuam concluídos no recorte aprovado; os testes novos são identificados como locais. Geração real, integração e ensaio não foram marcados como concluídos.
- O conector de edição do Figma atingiu a cota Starter. A atualização foi concluída pelo editor aberto no Chrome, com conferência visual dos cards. As três seções principais foram identificadas como v4, e os dias 20–22 foram alinhados aos resultados/integração restantes. Caixas extras criadas durante a interação foram removidas; os objetos originais foram preservados.
- Na planilha original, foi acrescentada a aba `Resumo 01-08` (gid `20261022`), com oito etapas, prova, passos ordenados, aceite, ação humana, meta e relatório. As 31 tarefas do plano diário foram reconciliadas, mantendo datas, tabelas, opções de estado, fórmulas e histórico. Calendário Outubro atualizado; Entregas e Novembro continuam referenciando a base/calendário.
- Leitura final das 31 tarefas: IDs, estados, provas e próximos passos corresponderam ao registro preparado, sem divergências. Foram verificados 111 valores/células dependentes sem erro de fórmula, além da tabela-resumo e da estrutura nativa. Conferência visual do resumo, das etapas finais e do calendário concluída; a largura do cabeçalho da etapa foi corrigida.
- O próximo caminho crítico permanece: gerador/arquivo e contrato de leitura em paralelo; fila/aprovação; QA autenticado; ensaio em 26/10; correções/congelamento em 27/10; evento em 28/10. Essas datas são metas. Não foi executado novo teste funcional do produto nesta revisão de organização.
- Evidências visuais locais estão na pasta de visualizações desta conversa, em `evento-28-10/revisao-v4-figma.jpg` e `evento-28-10/revisao-v4-planilha.jpg`. Não contêm credenciais.
- Nesta revisão, somente este espelho local, o FigJam e a planilha autorizados foram editados. Sem commit, push, deploy, aplicação de migration, chamada paga, mensagem a cliente ou mudança de produção.

