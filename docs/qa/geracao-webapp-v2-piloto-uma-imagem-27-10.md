# Pacote revisável — WebApp / piloto de uma imagem v2 — 27/10/2026

**Preparado na noite de 26→27/10. Não aplicado. NÃO LIBERADO para execução paga.**

Objetivo do ensaio: uma pessoa autenticada confirmar um pedido v2, escolher uma referência, gerar **uma imagem original** com logo/cores próprios autorizados e recuperar a mesma imagem na biblioteca após novo login, sem acesso cruzado entre negócios.

Não se comprovou ainda uma imagem real criada pelo agente V2G. Este pacote não é autorização de migration, configuração, publicação ou gasto. Pinterest e tela de pesquisa por nicho ficam fora.

## 1. Portão atual: consumidor v2 fake integrado; submissão real fechada

O WebApp preserva o veto de **submissão real** do pedido v2. A passagem local fake agora percorre action → aprovações persistidas → API/loader/fila/worker Python → arquivo privado → biblioteca. Consulta e arquivo conferem `context_proof` contra fontes vigentes relidas sob sessão. No bloco anterior, o montador já tinha passado a conferir os formatos de 07/08 e a proveniência do 03/04, sem `RegistroRevisado` alternativo.

Teste de compatibilidade com o **carregador persistente real** do backend, offline, com SQL instrumentado e registros fictícios:

```text
node --test --test-name-pattern="manifesto atravessa" scripts/conferir-contexto-referencia-publica.mjs
```

**PASSOU.** O manifesto coincide campo a campo com o produzido por `ContextoPersistenteV2`, incluindo cinco provas obrigatórias:

- `autorizado_por`
- `contexto_revisado_por`
- `marca_revisada_por`
- `referencia_revisada_por`
- `aprovacoes_sha256`

O contrato também inclui versão/hash/revisor/hash do registro de catálogo. O catálogo compartilhado não contém mídia nem consentimento de cliente; a autorização de referência por negócio/pedido é separada. As três aprovações são conferidas com validade/revogação e hashes, inclusive normalização UTC e precisão do JSON canônico Python/TypeScript.

**Limite:** igualdade e passagem pelo consumidor foram testadas com registros sintéticos em PostgreSQL efêmero; não criam a fonte persistida em QA. Não preencher consentimentos fictícios no produto para liberar a action. Proof de formulário não autoriza; ausência/revogação/divergência negam arquivo. A submissão real v2 continua recusada mesmo com flags ON no teste isolado.

## 2. Artefatos do WebApp a revisar

| Artefato | Papel | Situação |
|---|---|---|
| `supabase/migrations/20261026193000_referencia_publica_pedido_criativo.sql` | Permite referência pública por ID em pedido de criação e envio de peça pronta, preservando v1 | Local, não aplicada por este bloco. SHA-256 abaixo. |
| `lib/criativos/pedido-imagem.ts` | Hash v2 inclui `referenciaId`; replay alterado exige outro pedido | Testes locais verdes. |
| `lib/criativos/pedidos-da-sessao.ts` | Sessão/RLS e recarga de pedido, sem confiar no negócio informado pelo formulário | Testes locais verdes. |
| `lib/jev/catalogo-barbearia.ts` / `catalogo-da-sessao.ts` | Dez IDs públicos; porta pelo negócio ativo e ramo barbearia | Links não provam resultado ou autorização de reprodução. |
| `app/(protected)/criativos/ReferenciasDoNicho.tsx` | Escolha inline, com link para a origem e aviso de desempenho não verificado | Sem tela nova por nicho. Conferência visual autenticada QA ainda necessária. |
| `lib/criativos/geracao/contexto-referencia-publica.ts` | Conferência server-only dos mesmos registros de 07/08 e das duas fontes | Compatibilidade local verde; não conectado à execução. |
| `lib/jev/referencias-aprovadas-da-sessao.ts` | Leitura SELECT-only do catálogo persistido compartilhado, com revisão/validade/hash e sessão/negócio | Preparada e testada com fonte instrumentada; não substitui ainda a lista estática exibida e não cria aprovação. |
| `app/(protected)/criativos/geracao-actions.ts` | Guardar pedido; submit fake/poll/cancel sob sessão | v2 exige fontes/proof; submit real continua fechado. Pedido não relido não faz fallback. |
| `lib/criativos/geracao/prova-v2-da-sessao.ts` | Expectativa SELECT-only ligada a pedido, usuário, negócio, aprovações, catálogo e logo vigentes | Integrada ao consumidor; não concede autorização de execução nem grava consentimento. |
| `lib/criativos/geracao/backend-da-sessao.ts` | Identidade humana + token de máquina no servidor; DTO de fila | Conexão publicada/autenticada de geração não comprovada. |
| `lib/criativos/geracao/imagem-privada.ts` e rota `imagem-gerada/[requestId]` | Bytes privados, autoria, negócio, metadata, hash e PNG | v2 não abre arquivo legado. Declaração de posse revisada e teste de identidade 6/6. |
| `app/(protected)/criativos/page.tsx` | Galeria persistida independente do estado transitório da geração | Não trocar fonte por estado do polling; imagem deve reaparecer no novo login. |

Migration SHA-256:

```text
f955f03ecc1669123b05ae230dca7baab3ce600873dea916c89862dfec160a10
```

Pré-requisitos da migration: tabelas e constraints de `20261021001651_creative_generation_requests.sql` e `20261021032617_creative_review_upload_intent.sql`, mais suas dependências, devem existir no ambiente alvo. Revisar histórico real, backup e autorização antes de aplicar. Não pressupor que estarem no repo significa estarem no QA.

As propostas backend `docs/qa/geracao/proposta-fontes-persistentes-v2-26-10.sql` e `proposta-catalogo-referencias-26-10.sql`, jobs e outbox real pertencem a 07/08. Não copiar para migrations do WebApp nem confundir com as migrations de métricas GET-only. Esse pacote, sozinho, não instala o schema completo de geração.

## 3. Configuração a conferir — somente nomes, sem ativação

Não se leram os valores remotos ou arquivos `.env`. “Fechada” abaixo descreve a postura de liberação, não uma auditoria da configuração implantada.

| Nome | Efeito do código / candidato ao ensaio futuro | Postura até autorização |
|---|---|---|
| `V2G_CREATIVE_REQUESTS_ENABLED` | `true` permite guardar/acompanhar pedidos | Manter fechada; habilitação somente no QA autorizado. |
| `V2G_CREATIVE_REFERENCE_PILOT_ENABLED` | `true` oferece catálogo ao negócio barbearia; servidor reconfere | OFF/ausente até schema e revisão do catálogo. |
| `V2G_CREATIVE_BACKEND_ENABLED` | `true` permite transporte/leitura de geração | OFF/ausente até serviço isolado e identidade verificados. |
| `V2G_CREATIVE_APP_MODE` | Padrão `real_leitura`; futuro submit real exige `real_dispatch` | Não usar `fila_ficticia` como prova de IA. Não trocar para dispatch neste bloco. |
| `V2G_CREATIVE_REAL_SUBMISSION_ENABLED` | Além do modo real, precisa `true` para liberar POST real v1; v2 tem veto próprio | OFF/ausente; retirar veto requer implementação e prova do contrato final, não só flag. |
| `V2G_BACKEND_URL` | Destino servidor do transporte | Deve apontar para o serviço de geração isolado autorizado; o QA de métricas não é esse serviço por inferência. |
| `V2G_BACKEND_TOKEN` | Credencial de máquina, só servidor | Conferir presença por canal seguro; nunca copiar para browser, Doc ou relatório. |

`V2G_CREATIVE_REVIEW_ENABLED` cuida do envio/revisão de peça pronta, não autoriza geração. `V2G_QA_MANAGER_BACKEND_READ_VERIFIED` é prova da mesa/métricas e não pode virar true por um teste de imagem.

**Limite adicional do backend:** 07/08 entregou código LOCAL separado `geracao_qa_app.py`/`geracao_ambiente.py`, com política nominal e readiness; supervisor, dependências e publicação do serviço isolado não estão configurados por este bloco. Não reusar o serviço GET-only de métricas ou inventar flags para contornar a montagem. Exigir Auth do projeto correto, bucket privado `v2g-midia`, timestamps/hashes coerentes e worker separado do HTTP. Ligar flags WebApp não completa esse trabalho nem remove o veto real v2.

## 4. Material, provedor, teto e autorização exatos para apresentar ao Victor

| Item | Especificação deste piloto | Ainda falta |
|---|---|---|
| Negócio A | Um negócio **fictício**, pertencente ao usuário QA A, com ramo barbearia e cores confirmadas | Identificar os UUIDs reais autorizados de negócio/perfil; não usar UUIDs de fixture como se fossem cadastro QA. |
| Negócio B | Outro negócio autorizado para o teste de isolamento, sem aprovação/material do A | Identificar usuário(s)/vínculo(s) permitidos; não criar acesso real por inferência. |
| Material enviado ao provedor | **Um logo próprio novo**, sem rosto/dado privado ou marca de cliente, subido pelo fluxo atual e vigente em `creatives` | Escolher o arquivo; registrar ID, caminho privado, SHA-256 dos bytes e `copy.origemMaterial` real. Não completar legado retroativamente. |
| Identidade | Cores confirmadas; hash do objeto vigente `businesses.onboarding.marca`; logo vigente | Revisar identidade e congelar hashes após o novo upload. Troca de logo/cores exige outra revisão. |
| Referência | Candidato já observado: Meta ID `700155112131034`, apenas orientação abstrata original | Confirmar disponibilidade e revisão; registrar classificação real do Jev, versão, 80% mínimo de pertinência, condição de uso e aprovador. Não transportar pixels/texto/marca do anunciante. A escolha final pode ser outra, mas precisa constar no pedido e nas aprovações. |
| Conteúdo | Um pedido v2 com oferta/objetivo/destino e documento central + documento de barbearia revisados | Definir conteúdo do piloto sem inventar promoção/preço/fachada; identificar as versões reais dos documentos. |
| Provedor | Adaptador preparado no backend: `ProvedorOpenAIJob`, destino/modelo contratual `gpt-image-2`, uma tentativa | Autorização nominal do provedor/modelo e acesso técnico pelo canal seguro. Código do adaptador não comprova preço, cota ou disponibilidade real. |
| Quantidade | **Uma imagem**, sem refações neste ensaio | Registrar aprovação específica da quantidade. As três refações do produto futuro não estão liberadas aqui. |
| Teto | `estimativa_usd`, `reserva_usd` e `limite_usd` como decimais exatos, coerentes; `autorizacao_custo_id` único | **Valor nominal não aprovado.** Não transformar a hipótese antiga de R$ 1,50/imagem em preço medido ou autorização de gasto. Revisar parâmetros/preço antes de submeter. |
| Direito de envio à IA | Aprovação separada e explícita do logo exato para pedido, negócio, destino/provedor e finalidade; aprovador, autorizado, data, expiração e revogação | Persistir pelo mecanismo administrativo autorizado. Upload/proveniência/checkbox genérico não substituem esse ato. |

O backend deve revalidar o material aprovado e a proveniência no momento da execução. O pacote não cria aprovações, não insere consentimento e não envia material privado.

## 5. Sequência de prova e critérios de aceite

Executar somente depois de fechar o §1 e obter autorização para ambiente/schema/configuração/material/custo. Registrar horário, versão do código, ambiente, IDs e evidência sem JWT, chave ou URL assinada persistente.

| Passo | Ação do ensaio futuro | Prova necessária / reprovação |
|---|---|---|
| 1. Acesso novo | Sair e entrar com usuário QA A; selecionar negócio A | Sessão válida, identidade humana verificada pelo backend. Token de máquina ou UUID no body não bastam. |
| 2. Marca | Upload do logo próprio novo e confirmação de cores | Proveniência/hash reais; logo vigente; revisão e autorização IA correspondentes. Sem autorização, não há job nem chamada. |
| 3. Referência | Selecionar o ID público revisado no formulário de criação | `payload.versao=2`, `referenciaId` exato e hash canônico persistidos após recarga. Escolher outra referência no mesmo request deve ser recusado. |
| 4. Aprovações | Revisar marca, referência e contexto pelo mecanismo autorizado | Registros imutáveis vinculados a negócio, autor/pedido, hashes, versões, expiração, revogação e teto; aprovador identificado. Não criar aprovação pelo formulário comum. |
| 5. Enfileirar | Um clique explícito em criar imagem, somente após autorização | POST 202 cria um job/outbox e retorna o mesmo ID em replay. Nenhuma chamada de geração dentro do POST; não usar URL do browser para executar worker. |
| 6. Acompanhar | Consultar o mesmo pedido | GET/poll nunca geram imagem. Quebra de conexão/resposta perdida pede consulta, sem novo pedido ou retry pago. |
| 7. Worker | Uma execução controlada do worker autorizado | Um marcador de início e uma chamada ao provedor; ID do provedor quando disponível. Resultado incerto fica em reconciliação terminal, sem repetição automática. |
| 8. Arquivo | Abrir a imagem privada concluída | Bytes PNG, dimensões/hash, tentativa, pedido, contexto v2, marca e referência comprovados pelo backend e conferidos no consumidor final. Metadata v1 sozinha reprova. |
| 9. Biblioteca | Recarregar e fazer novo login no A | Mesmos request/job/creative/hash; uma imagem persistida, sem duplicação. Desligar geração não pode transformar biblioteca em vazia; falha da fonte não aparece como zero peças. |
| 10. Isolamento | Selecionar B; tentar abrir URL do A; repetir sem sessão e com outro usuário QA autorizado | Sem card/bytes/dados do A; acesso negado. Voltar ao A recupera a imagem original. |
| 11. Revogação | Em ensaio autorizado e separado, revogar aprovação/trocar versão antes de execução | Nega contexto/arquivo conforme política, sem custo novo. Usar fake no teste destrutivo pré-piloto; não gastar outra imagem para provar o negativo. |
| 12. Custo | Conciliar a única tentativa | Separar estimativa/reserva, usage observado e cobrança. `billed_usd=null` significa não conciliado, jamais “grátis” ou “zero”. Não declarar custo medido sem fonte de cobrança. |

Conquista só depois dos passos de geração e recuperação: um job enfileirado, animação, PNG fictício ou upload de peça pronta não são uma imagem criada pelo agente.

## 6. Interrupção e preservação

Em falha, primeiro impedir novas submissões pelo procedimento autorizado; preservar request/job/snapshot/artefato e evidência para conciliação. Não apagar registros ou reverter constraint para v1 com payloads v2 existentes. Não dar retry após marcador de provedor. Não editar produção para salvar a demonstração.

## 7. Verificação feita nesta preparação

```text
node --test scripts/conferir-pedido-imagem.mjs scripts/conferir-pedidos-da-sessao.mjs scripts/conferir-intencao-envio.mjs scripts/conferir-referencia-publica-sql.mjs
```

**44/44 passaram na preparação anterior**, incluindo v1/v2, referência, replay, sessão/negócio e migration em PostgreSQL descartável, sem alterar ACL/RLS. O teste de compatibilidade de contexto que estava vermelho foi atualizado para comparar registros reais do contrato e a saída completa do carregador backend; passou sem skip ou campo de aprovação inventado. O bloco de alinhamento cobre 11 testes de contexto e oito de catálogo/seletor. Não se repetiu a suíte geral.

O reparo anterior da declaração da rota passou identidade 6/6, quatro testes dirigidos e typecheck, conforme [checkpoint](../estado/e28-05-06-registro-rota-imagem-26-10.md). Esses resultados são locais; nenhum prova QA publicado ou geração paga.

**Consumidor local concluído:** [E28-06-V2-CONSUMIDOR](../estado/e28-06-v2-consumidor-local-27-10.md), com 44 testes relevantes validados, tipos e identidade 6/6. **Menor portão QA:** nomear e autorizar serviço/schema/Storage/dependências/publicação isolados e comprovar login/isolamento gerenciados. Para imagem real, ainda autorizar material/pedido/referência/provedor/teto nominais e uma liberação específica do veto de submissão v2; ele não sai só por 202, fake verde ou deploy. Não publicar/aplicar neste bloco.
