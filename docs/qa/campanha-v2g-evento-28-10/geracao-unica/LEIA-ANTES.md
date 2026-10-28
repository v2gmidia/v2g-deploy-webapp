# V2G — pacote nominal de UMA geração real — 28/10/2026

**NO-GO para execução agora.** Pacote pronto para revisão; não é payload aceito pela API, registro de consentimento, job ou arte gerada. Não execute os arquivos como autorização. Nenhum pedido, aprovação, reserva ou chamada paga foi criado.

## Recorte exato

- Negócio próprio nominal: **V2G**, `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, no Supabase QA `zskpijnqgkqwxksqmzmf`.
- Proprietário observado: `ca842864-295c-48c5-bf5c-6ac744de81c0`. É identificador de escopo, não credencial nem prova de novo login.
- Atividade declarada: **Marketing de performance**, não barbearia. Nenhum ID técnico de nicho foi inventado.
- Criar **uma** proposta para Feed, PNG **1088 × 1088**, qualidade `high` conforme o adaptador existente, uma tentativa e **zero refações**. A direção anterior de 1080 × 1080 fica proporcionalmente ajustada ao tamanho real do cliente; não foi produzido arquivo.
- Texto da arte: **“Você cuida do negócio. A V2G cuida dos anúncios.”** Apoio: **“Gestão de anúncios com acompanhamento humano.”** Chamada: **“Converse com a V2G”**.
- Destino comercial: conversa no WhatsApp. Teto de **R$ 500 de mídia** e publicação com Victor continuam decisões independentes; não são autorização de geração.
- Referência pública escolhida para este piloto: **nenhuma**. Usar apenas identidade própria e briefing V2G, sem catálogo de barbearia, Pinterest, pixels, texto ou marca de concorrente.

## Identidade e material candidatos à autorização

SELECT restrito deste negócio confirmou:

| Fonte | Valor observado | O que autoriza |
|---|---|---|
| `businesses.onboarding.marca` | Cores `#051020`, `#E9FE64`, `#0D41D9`, `#001C67`; `aparenciaNaoSei=false`; confirmação em `2026-10-27T23:44:41.951Z` | Confirma a resposta de marca; não libera envio à IA. |
| `creatives`, logo vigente | ID `1f1d88e7-6028-4ddf-b738-cb2f535b2c5d`; `uso=logo`; não arquivado | Identifica um arquivo do mesmo negócio. |
| Proveniência desse logo | `upload_cliente`, finalidade `identidade_visual`; SHA `be351545b432a2a7b022bf8138adb84ac99f518cb14de61bb87f8e8a4beb9248`; registro `2026-10-27T23:41:48.934Z` | Origem/integridade declarada no upload. Não é consentimento para provedor externo. |
| Storage | Bucket `v2g-midia` observado privado; caminho nominal do logo no JSON | Permite preparar o alvo. Não comprova download autenticado ou hash dos bytes nesta rodada. |

**Material máximo proposto ao provedor: um único PNG do logo acima.** Não usar outras fotos, rostos, fachada, conversas, onboarding bruto ou material de outro negócio. Nenhum byte do logo privado foi baixado ou transmitido neste bloco. Antes de executar: reler logo vigente e bytes no servidor, recalcular hash, verificar formato/dimensões e consentimento específico para este arquivo, pedido, finalidade e provedor. Troca do logo/cores invalida o pacote e pede revisão; não retificar proveniência antiga para contornar ausência de aprovação.

A paleta efetivamente confirmada substitui as cores aproximadas do esboço V2. Branco é apenas neutro de contraste. O azul-claro do esboço não foi apresentado como cor confirmada do cadastro.

## Prompt, negativo e documentos

- [`prompt.txt`](prompt.txt): direção/identidade/textos exatos e limites editoriais.
- [`negativo.txt`](negativo.txt): restrições a integrar à mesma instrução; **não** é parâmetro nativo `negative_prompt` nem segunda chamada.
- [`integridade.json`](integridade.json): SHA-256 dos dois arquivos locais; não constitui aprovação de execução.
- Documento central candidato: `docs/criativos-base-central.md`, hash `c27821c694e50f7f2ff62538b709154e2ca05857c933d1c0ea5d6e5aae1ae2bd`. O próprio documento declara que é direção de trabalho, não prompt de produção. `docs/criativos-modelo-nicho.md` é modelo, não regra de Marketing de performance aprovada.

O runtime atual monta a instrução a partir de central + documento específico + payload + cores (`backend_v2g/src/imagem/geracao_contrato.py:219`). Estes arquivos são proposta para revisar/compilar nesse snapshot confiável, não um prompt livre recebido por HTTP. A instrução final compilada precisa ter hash, versões/revisores e aprovação persistida antes do provedor. O pacote não cria documento de nicho falso, não altera arquivo do backend e não reutiliza uma regra de barbearia para V2G.

## Provedor, dados enviados e limite proposto

**Candidato nominal:** adaptador existente `ProvedorOpenAIJob`, modelo contratual `gpt-image-2`, destino `https://api.openai.com/v1/images/edits`; entrada: instrução aprovada + um logo próprio autorizado. A [documentação oficial do modelo](https://developers.openai.com/api/docs/models/gpt-image-2) confirma suporte a edição de imagem; acesso/cota do projeto e versão de modelo efetivamente resolvida não foram comprovados nesta rodada. Não trocar por outro modelo ou ferramenta para chamar a saída de agente V2G.

| Item | Proposta para autorização futura |
|---|---|
| Quantidade | 1 imagem, formato Feed, 1 tentativa |
| Refação/retry pago | 0; após início do provedor, nunca repetir automaticamente |
| Teto total de geração | **US$ 0,50**, apenas proposto; não aprovado |
| Reserva proposta | **US$ 0,50**, somente após autorização; nenhuma reserva feita |
| Estimativa completa | **Pendente**, não preencher `0` nem reutilizar o valor de saída como custo total |
| Cobrança conciliada | **Não existe**; `billed_usd=null`, não significa custo zero |

Segundo o [guia oficial](https://developers.openai.com/api/docs/guides/image-generation#calculating-costs), custo total soma texto, imagem de entrada e saída. O `openai_client.py:70` contém estimativa derivada de US$ 0,141 para 1088; ela não é medição nem limite superior publicado. Recalcular o pedido completo com os parâmetros/bytes aprovados, a tabela/calculadora atuais e margem explícita. Não converter automaticamente este teto para reais, nem descontá-lo dos R$ 500 de mídia.

**Condição de bloqueio:** se não houver estimativa completa e limite superior confiável dentro de US$ 0,50, **não chamar o provedor**. O campo de reserva do nosso banco não é um parâmetro de teto monetário imposto pela Images API. Não prometer que uma reserva isolada impede cobrança maior. Autorização do provedor, material e valor exige `autorizacao_custo_id`, responsável e validade próprios; todos permanecem ausentes neste pacote.

## Menor bloqueio concreto no código e ambiente atuais

1. **Falta schema de geração no alvo.** SELECT em `information_schema` e confirmação por `to_regclass` devolveram ausência das sete tabelas `public.creative_generation_requests`, `creative_generation_jobs`, `creative_generation_real_dispatch`, `creative_generation_brand_approvals`, `creative_generation_reference_approvals`, `creative_generation_context_approvals`, `creative_reference_catalog`. Não é “fila vazia”: o schema requerido não está instalado ali. Nenhum DDL foi executado.
2. **V2G sem referência não cabe em nenhum dos contratos atuais.** `prova-v2-da-sessao.ts:31/:66` e `backend_v2g/src/imagem/geracao_contexto_v2.py:69` restringem v2 a barbearia. `geracao_contrato.py:172–175` exige arquivo de referência no contexto v1 e referência pública aprovada no v2. Logo, omitir a referência pelo formulário/v1 não resolve o contexto da execução.
3. **Submit real v2 continua vetado.** `app/(protected)/criativos/geracao-actions.ts:56–58` recusa submissão real v2 independentemente das flags. Uma alteração de variável ou teste fake verde não abre esse recorte.
4. **Serviço de geração separado não foi comprovado.** O código tem factory/entrada QA preparada, não prova de um endpoint pago já utilizável. `backend_v2g/src/api/geracao_ambiente.py` exige domínio HTTPS isolado, IDs/custo/validade nominais e recusa reutilizar `ia-backend-qa.5hue9s.easypanel.host`. Não ampliar o serviço GET-only de métricas para executar a imagem.

**Próximo bloco local mínimo proposto a 07/08 e WebApp, antes de qualquer publicação/configuração:** definir um modo nominal de criação própria V2G, sem referência, com política/documento específico e aprovações persistidas de marca/contexto/custo. Reutilizar fila/dispatcher/Storage atuais. Não remover requisitos do piloto de barbearia nem liberar qualquer nicho por padrão. A escolha “nenhuma referência” deve ser um estado explícito revisado, com prova correspondente, não falta tolerada de um campo v2. Versão/schema desse contrato ainda precisam de revisão conjunta; este pacote não os inventa como se já existissem.

Depois, testar offline ausência/revogação de autorização, outro usuário/negócio, logo/hash trocados, replay, orçamento acima do teto, referência ausente nos modos que a exigem e resultado incerto. Só então apresentar manifesto/schema/serviço isolado e liberar o recorte exato sob autorização específica. **Não mudar a atividade de V2G para barbearia, inventar referência/ID/consentimento ou criar UUID fictício de pedido aprovado para fazer a rota passar.**

## Fila, artefato e comprovação depois do novo login

**Estado agora:** pedido/job/tentativa/provedor/arquivo/creative inexistentes no pacote; IDs e hashes de saída `null`. Abaixo é roteiro futuro, não evidência de execução:

| Momento | Aceite requerido |
|---|---|
| Antes da chamada | Login do proprietário; negócio V2G ativo; pedido persistido legítimo; documentos/material/custo aprovados e vigentes; bytes do logo/hashes relidos; contexto congelado no backend. |
| Submissão | Um POST autorizado gera um job/outbox. Replay retorna o mesmo job. POST/poll não executam o provedor; worker só por tick explícito. |
| Provedor | Um marcador `provider_started_at` antes da chamada e uma tentativa. Usar o caminho `gerar_uma_vez`, sem retry do cliente legado. Resposta incerta/crash após início → `reconciliation_required`, não tentar outra imagem. |
| Storage | `storage_pending` retoma apenas persistência dos mesmos bytes. Resultado em bucket privado `v2g-midia`, padrão `geracao/{business_id}/{job_id}/{attempt_id}.png`. Nunca publicar em `public/`. |
| Entrega | Somente `artifact_available` + `simulated=false`, provedor/contexto/material/hash/metadados/autoria corretos e PNG medido podem apresentar imagem criada. Revisar logo/textos; erro editorial reprova a peça, sem refação automática. |
| Novo login | Sair e entrar com o proprietário; selecionar V2G; `/criativos` recupera o mesmo request/job/creative/SHA do banco, não só do estado da tela. Rota privada `/criativos/imagem-gerada/{request_id}?negocio={business_id}` entrega os mesmos bytes sob autorização vigente. |
| Isolamento | Sem sessão, outro usuário e outro negócio não obtêm card/bytes; voltar a V2G recupera a mesma peça. Não alterar papel real para fabricar teste negativo. |
| Custo | Preservar estimativa, reserva, uso e ID do provedor; conciliar cobrança separadamente. Não declarar R$ 0, “grátis” ou preço medido enquanto a cobrança for desconhecida. |

Não salvar token, JWT, chave ou URL assinada durável nas provas. Screenshots da biblioteca só complementam os IDs/hash/arquivo; um card, uma animação ou HTTP 202 não comprovam geração. Aprovar/gerar a imagem também não autoriza publicação na Meta.

## Contingência para o evento

Peça pronta existente: `public/criativos/v2g-clareza-feed-v1.png`, hash `c89622c2035efdc2251fd42a277e1242bee2c9c0a1c3a61495d98eab6186615a`. É imagem própria disponível, **não foi criada pelo agente neste bloco**, não tem o texto novo e continua sem aprovação de anúncio. Victor pode revisar seu uso como contingência ou pedir produção da V2 por designer; depois segue upload/revisão/publicação manual autorizados e vínculo de métricas. Não reaproveitar o pedido “ajustes solicitados” da fixture como aprovação V2G.

**Próximo ato:** revisar este pacote e decidir o recorte local de contrato próprio. A autorização paga só deve ser solicitada quando houver rota nominal, ambiente pronto, instrução compilada e estimativa verificáveis. O pacote não pede para Victor aprovar um gasto que ainda não pode ser executado com essas garantias.
