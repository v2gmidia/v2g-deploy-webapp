# E28-06 — uma geração nominal própria V2G — 28/10/2026

## §0. Entrega e veredito

Pacote em [`../qa/campanha-v2g-evento-28-10/geracao-unica/LEIA-ANTES.md`](../qa/campanha-v2g-evento-28-10/geracao-unica/LEIA-ANTES.md): JSON nominal, prompt, negativo, integridade e prova após novo login. **NO-GO para gerar agora.** Uma imagem, uma tentativa, zero refações, sem referência pública; OpenAI/gpt-image-2 pelo adaptador existente e teto **proposto**, ainda não autorizado, de US$ 0,50 separado da mídia. Estimativa completa/cobrança continuam desconhecidas.

Não executado: provedor, worker, upload, escrita em QA, migração, configuração, deploy, Meta, commit/push. Não foi usada a ferramenta de geração deste chat para produzir um substituto e chamá-lo de agente.

## Evidência nova, somente leitura

- Negócio nominal `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, proprietário observado `ca842864-295c-48c5-bf5c-6ac744de81c0`, atividade **Marketing de performance**.
- Cores confirmadas em `2026-10-27T23:44:41.951Z`: `#051020`, `#E9FE64`, `#0D41D9`, `#001C67`.
- Um logo vigente do negócio: `1f1d88e7-6028-4ddf-b738-cb2f535b2c5d`, origem `upload_cliente`, SHA registrado `be351545b432a2a7b022bf8138adb84ac99f518cb14de61bb87f8e8a4beb9248`. Caminho privado e datas no pacote. Não baixados bytes, não recalculado hash do logo nesta rodada e nenhuma autorização de IA inferida do upload.
- Bucket `v2g-midia` observado privado. As sete tabelas `public` exigidas de pedidos/jobs/dispatch/aprovações/catálogo foram ausentes por SELECT em catálogo e `to_regclass`; não podem ser descritas como fila vazia/pronta.

## Menor bloqueio mapeado no código

`prova-v2-da-sessao.ts`, `geracao_contexto_v2.py` e `geracao_contrato.py` mantêm v2 restrito a barbearia e referência pública. V1 também exige referência em arquivo; não comporta a proposta “V2G própria, nenhuma referência”. `geracao-actions.ts` ainda bloqueia submit real v2 mesmo com flags. A política de QA exige serviço isolado e recusa reutilizar o backend GET-only de métricas. Não se removeu nenhuma trava.

Próximo bloco proposto: contrato nominal próprio V2G sem referência, com documentos/material/custo persistidos e prova equivalente, reusando o dispatcher/Storage; revisar conjuntamente antes de schema/serviço. Não liberar todos os nichos, mudar a atividade para barbearia ou inserir referência/consentimento fictício. Ainda não há request_id, job_id, tentativa ou artefato deste pacote.

## Verificação e fontes

- Prompt e negativo têm SHA-256 em `integridade.json`. Manifesto é explicitamente não executável, com autorizações não concedidas (campos `false` ou ausentes), estimativa null e estado `nao_criada/nao_gerado`.
- Documento central de trabalho identificado por hash; não promovido a prompt aprovado. Negativo entra na instrução compilada, não num parâmetro `negative_prompt` inventado.
- Documentação oficial OpenAI consultada confirma gpt-image-2/edits e custo composto por texto/entrada/saída. Não se chamou API paga nem se apresentou estimativa derivada local como cobrança/teto garantido. Links no pacote.
- JSON, hashes e coerência dos limites conferidos localmente. Não repetida suíte verde sem alteração de produto. Este bloco é preparo de autorização, não passagem ponta a ponta.

Contingência: revisar a peça PNG V1 existente, sem alegar geração pelo agente e sem chamá-la de nova direção V2. Publicação permanece manual com Victor e autorizações próprias. Novas provas de sessão/biblioteca/métricas não foram feitas por este bloco. Código/backend/arquivos de outras frentes preservados; entrega para coordenação pelo checkpoint, sem mensagem a outro chat.
