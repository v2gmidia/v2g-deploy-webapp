# Central V2G — coordenação 26→27/10/2026

Victor autorizou nesta conversa coordenar os quatro chats enquanto descansa, receber os retornos e avançar blocos locais úteis para o ensaio do evento de 28/10. Esta autorização não cobre commit, push, deploy, migration externa, mudança de ambiente/flag, publicação de campanha, envio a cliente ou chamada paga de geração. Avisar Victor somente se uma decisão dele for necessária.

## Destinos

- 01/02 `01a14514-ec1d-75a1-8384-8e21d734a619`: acesso/compra para o ensaio, sem repetir pagamento.
- 03/04 `01a14512-228b-7480-a516-5dffed95cdb6`: origem/hash da marca e aviso de autorização separada para IA.
- 05/06 `01a14518-055f-7de3-a904-f05147067fb4`: WebApp, pedido v2 com referência e contexto de duas fontes.
- 07/08 `01a15bcc-35d0-7a93-aa09-129cb42d5eaf`: backend, identidade/contexto/dispatcher durável.

## Estado ao iniciar, 26/10 ~22h45 BRT

- Repositório WebApp tinha modificações em `lib/criativos/geracao/triangulo-contexto.ts` e novo `lib/criativos/geracao/contexto-referencia-publica.ts`, de 05/06. Preservar.
- 05/06 e 07/08 ativos. 07/08 encontrou duas incompatibilidades: backend calculava hash sem `referenciaId` e exigia bytes de anúncio terceiro. Está adaptando para ID + direção abstrata revisada, mantendo apenas logo autorizado como imagem.
- 03/04 concluiu mapeamento: business/cores/logo tipado existem; hash/proveniência dos uploads e autorização IA persistida faltam. O chat parou antes da edição e recebeu autorização de coordenação para a menor correção LOCAL proposta.
- 01/02 recebeu um recorte de conferência de acesso/versão QA para o ensaio; sem novos pagamentos.
- Decisão humana mais recente: **identidade visual autorizada + referência Meta selecionada**. Pinterest está fora da geração inicial. Jev 80% classifica pertinência do nicho, não vendas. Dez links de barbearia no catálogo piloto, ainda sem prova comercial/revisão integral. Link público não licencia reprodução de imagem/marca/texto.
- O WebApp guarda `referenciaId` no pedido v2 e o bloqueia na submissão até backend realmente usar a referência. Migration local `20261026193000_referencia_publica_pedido_criativo.sql` não aplicada. Flag do catálogo default OFF. Nenhuma imagem real desse fluxo foi gerada.

## Método para cada rodada

1. Conferir mensagens humanas novas e `wait_threads` dos quatro, lendo apenas mensagens novas/finais relevantes. Chat ativo não recebe repetição.
2. Ao fim de um bloco, confrontar checkpoint, diff e testes relatados. Não promover teste local a QA ou geração simulada a imagem real.
3. Repasse técnico entre 03/04, 05/06 e 07/08 apenas após contrato confirmado. Evitar edição simultânea de arquivo compartilhado.
4. Só novo bloco LOCAL necessário e não repetido, com dono, aceite e teste. Se restar apenas piloto pago/QA/migration/deploy ou decisão de Victor, registrar a menor ação e parar aquela frente.
5. Não ativar flags, aplicar migration, mudar ambiente ou realizar chamada paga com autorização genérica. A autorização para um piloto deve nomear negócio/material/provedor/teto e estratégia de reconciliação.
6. Até 27/10 08h BRT, ou antes se as frentes terminarem e restarem portões humanos, pausar automação e resumir em linguagem simples: pronto localmente, pronto em QA, falta para um criativo real e menor ação do Victor. Não manter chats ocupados artificialmente.

## Últimos despachos desta conversa

- 05/06: implementar bloco local WebApp, contexto de duas fontes, pedido/identidade/referência verificáveis, sem retirar veto v2 antes do backend.
- 07/08: backend local para pedido v2, hash com ID, direção abstrata, consentimento/marca, fail closed, provedor fake.
- 03/04: menor correção local de aviso ao cliente, proveniência/hash de novos materiais, mantendo autorização IA separada.
- 01/02: percurso atual de acesso e versão QA para o ensaio, sem pagamento novo.

## Atualização ~22h54 BRT

- 03/04 concluiu correção LOCAL: aviso de upload sem autorização IA; proveniência, SHA-256, data/finalidade para novos logo/fotos/guia; variações agora só versões de logo. Testes dirigidos e tipos passaram. Materiais antigos não receberam hash/consentimento inventado. `conferir:identidade` 5/6 por rota nova de 05/06 ainda fora da lista de segurança; 05/06 recebeu o reparo dirigido.
- 05/06 concluiu bloco LOCAL de contexto marca autorizada + referência Meta escolhida, com 43 testes/tipos. Submissão paga continua bloqueada; autorização e versões persistidas ainda não foram conectadas ao backend. Recebeu o achado do conferidor.
- 07/08 ainda ativo: caminho v2 com hash que inclui referenceId e direção visual abstrata chegou a fila/arquivo privado no banco descartável; dispatcher real foi testado com provedor substituído. Fechando revogação/expiração/custo e regressão. Recebeu o contrato de proveniência 03/04; upload não autoriza IA.
- 01/02 conferiu que correção de senha está no QA e 24 testes locais passaram; QA04 ligado ao negócio B conhecido. O navegador Chrome falhou, portanto a passagem autenticada atual permanece NÃO VERIFICADA. Negócio com compra estornada ainda pode acessar, bloqueio separado. Pediu-se só uma alternativa de navegação sem alterar dados.
- Veredito: a fatia local do dia 26 avançou significativamente, mas o ensaio integrado/publicado de uma imagem ainda não ocorreu. Não rotular 26/10 inteiro como concluído enquanto faltar contexto/autorização persistidos, pacote QA, piloto de uma imagem e prova autenticada.

## Direção humana adicional, ~22h59 BRT

Victor quer priorizar a imagem real e adiantar o trabalho de 27/10 durante a noite. Repassados quatro direcionamentos específicos aos chats: 05/06 termina segurança e prepara pacote QA WebApp; 07/08 termina backend v2 e prepara pacote QA backend; 03/04 entrega campos exatos de proveniência e identifica lacuna de autorização persistida; 01/02 fecha tentativa única de acesso e roteiro do piloto. Todos devem concluir bloco atual antes do dependente. Nenhuma dessas mensagens autoriza migration/deploy/configuração/flags/chamada paga; antes de uma imagem real é necessário pacote concreto com negócio, material próprio, provedor, teto e reconciliação, e aprovação específica. Não registrar dia 26 completo só pelo código local.

Fontes: `docs/execucao-evento-28-10.md`, `docs/decisoes.md`, `docs/estado/criativos-marca-biblioteca-barbearia-26-10.md`, checkpoints próprios das frentes. O espelho do evento é v7 de 23/10 e pode estar desatualizado; não tratar suas datas como provas. Figma/planilha não foram relidos nesta rodada.

## Correção humana ~23h03 BRT: armazenamento e trabalho ativo

- Victor quer execução noturna concreta, não apenas monitoramento, e questionou onde ficam as imagens que o Jev teria trazido.
- Conferência no código: logo/fotos/guias próprios da identidade ficam no bucket privado `v2g-midia`, prefixo `identidade/{business_id}/`, e em `creatives` (`storage_path`, `business_id`, `uso`, `copy`). O catálogo piloto de barbearia em `lib/jev/catalogo-barbearia.ts` contém 10 IDs públicos e datas de início observado, com link para a Biblioteca de Anúncios; não contém bytes de imagens. Jev classificou registros/metadados do piloto, não entregou uma biblioteca de imagens de terceiros ao produto.
- A proposta local não aplicada do backend `docs/qa/geracao/proposta-fontes-persistentes-v2-26-10.sql` tem aprovação de marca, referência e contexto por negócio/pedido, com `public_reference_id` e manifest hash; ainda é preciso distinguir catálogo reutilizável de metadados da aprovação específica e confirmar contrato com 05/06. Não duplicar arquivo de anúncio de concorrente no bucket da marca.
- Enviados direcionamentos novos a 05/06 e 07/08: concluir blocos atuais e depois menor bloco local para catálogo persistente auditável de ID/URL, anunciante, data observada, nicho, classificação Jev, direção abstrata revisada, origem e estado; alinhar as cinco provas obrigatórias do pedido v2 e testar. Sem aplicação externa ou chamada paga.
- Automação existente renomeada para execução ativa até 08h BRT; deve despachar trabalho local sequencial útil, sem remandar tarefas repetidas, e parar nos portões externos. A meta de uma imagem real hoje continua condicionada a pacote específico de negócio, material próprio autorizado, provedor/destino, teto, migrations/configuração/deploy QA e ensaio com evidência; nenhuma dessas provas foi declarada concluída por este checkpoint.

## Decisão humana seguinte: geração real prioritária com referência como entrega segura

- Victor quer perseguir a geração de imagem para 28/10. Caso ela não passe no ensaio integrado, a escolha e visualização honesta das referências públicas já agregam valor e devem ser demonstráveis, sem alegar que anúncios concorrentes venderam.
- 05/06 recebeu ordem de fechar contrato das cinco provas, integrar o caminho local e tornar a referência escolhida útil por si só; 07/08 recebeu ordem de avançar implementação local do serviço isolado/worker e apresentar veredito GO/NO-GO da imagem real, com portões exatos.
- Provas atuais: backend v2 passou localmente com provedor substituído, não com chamada paga; WebApp tem 44 testes locais, mas teste de contrato do contexto v2 ainda vermelho. Pacotes QA estão documentados, não aplicados. Não marcar imagem real concluída até pedido, chamada única, arquivo privado e recuperação após novo login no QA.

## Rodada 23h15 BRT — progresso sem portão humano novo

- 01/02 encerrou roteiro para amanhã: entrar com QA04 existente, selecionar negócio fictício B, conferir Conta/Início. Versão QA medida `2ad1785`. Navegação autenticada ainda não verificada por falha no navegador; não repetir compra.
- 03/04 encerrou handoff técnico sem nova edição: proveniência `creatives.copy.origemMaterial` encaixa no loader backend. Consentimento IA persiste como lacuna distinta. Apontou checkpoint antigo 05/06 com Pinterest/três materiais, agora superado; 05/06 recebeu aviso de reconciliar somente a documentação.
- 05/06 segue ativo no contrato das cinco provas e na leitura do catálogo persistido, mantendo referência pública como orientação utilizável. Sem bloqueio novo reportado.
- 07/08 segue ativo: conferiu que piloto Jev gerou 23 classificações ID/metadados, preparou 23 rascunhos locais todos pendentes de revisão; sem bytes de anúncios. Caminho de resultado é compatível entre WebApp/backend (`geracao/{business_id}/{job_id}/{attempt_id}.png`) no bucket privado existente `v2g-midia`; ainda é plano local, não configuração QA.
- Nenhum próximo bloco útil independente para 01/02 ou 03/04 nesta rodada. Não manter chats ocupados artificialmente. Aguardar fechamento dos dois blocos ativos antes de novo despacho.

## Rodada 23h45 BRT — backend fechado, consumidor v2 despachado

- 07/08 encerrou backend local com `context_proof`, catálogo separado de aprovações, 23 rascunhos Jev (10 acima do corte textual de 80%, nenhum aprovado para geração), entrada QA isolada default OFF, worker reaproveitado e bucket privado existente. Reportou 2.914 testes Python, 9 ignorados, Ruff/mypy limpos. Veredito: **NO-GO agora** para imagem IA no evento; não houve geração real nem QA externo. Checkpoint `backend_v2g/docs/estado/e28-07-08-contexto-v2-marca-biblioteca-26-10.md`. Backend parou nos portões externos/humanos; não reabrir por tarefa artificial.
- 05/06 encerrou bloco local de igualdade das cinco provas com o loader Python e leitura segura de catálogo: 19 testes dirigidos + typecheck. Referências prontas apenas localmente; submissão v2 ainda bloqueada, catálogo ainda não conectado à lista estática nem a QA. Checkpoint `docs/estado/e28-05-06-contrato-catalogo-alinhados-27-10.md`.
- Enviado a 05/06 um único próximo bloco LOCAL `E28-06-V2-CONSUMIDOR`: consumir `context_proof` do backend no bridge/arquivo/galeria e ensaiar pedido v2 → fila → arquivo privado → biblioteca com fake, idempotência e isolamento, mantendo a submissão real fechada. Aceite/teste e limite de arquivos foram especificados. 01/02 e 03/04 seguem parados.

## Fechamento antecipado 00h15 BRT — limite local atingido

- 05/06 entregou `E28-06-V2-CONSUMIDOR`: pedido v2 → aprovações fictícias persistidas no banco descartável → backend/fila/worker fake → PNG privado → rota e biblioteca WebApp. Replay, recarga, nova sessão simulada e isolamento passaram; 44 testes relevantes, typecheck, identidade 6/6. Arquivo `docs/estado/e28-06-v2-consumidor-local-27-10.md`. Submissão real v2 segue bloqueada.
- 07/08 já havia encerrado backend local e entrada QA default OFF. 01/02 e 03/04 também encerrados. Não há novo bloco LOCAL necessário e independente nesta janela; repetir auditorias ou fabricar tarefas contrariaria a direção humana.
- Estado para Victor: **referências utilizáveis localmente**, geração v2 fake ponta a ponta local, **imagem real IA no QA ainda NÃO COMPROVADA**. Os próximos atos são externos/humanos: revisar e autorizar schema/serviço QA isolado, publicação/configuração, escolher negócio fictício e logo próprio novo com proveniência, revisar referência, registrar aprovação separada do pedido e limite nominal de uma chamada ao provedor; executar ensaio HTTPS e conferir biblioteca após novo login. Sem essas provas, veredito atual do backend é NO-GO para anunciar geração real no evento.
- A coordenação pode parar agora, preservando entregas e sem despachar novos blocos. Ao retomar, começar pela revisão dos dois pacotes QA e manifesto, não repetir testes locais já verdes.
