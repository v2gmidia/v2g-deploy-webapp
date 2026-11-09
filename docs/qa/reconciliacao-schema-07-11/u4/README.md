# U4 — RevOps e pedido de criativo: preparação local

**Não aplicada.** Pacote restrito aos grupos 12/14: oito tabelas e duas RPCs, dez ausências. U1/U2/U3 já aplicadas no QA permanecem preservadas. Não há ativação, ajuste de runtime, env, serviço, flag, conferidor, manifesto principal, dado real ou produção.

## Fontes e delta

- `20261007160925_revops_v0.sql`: sete tabelas RevOps, quatro índices, duas RPCs SECURITY INVOKER, search_path vazio e ACL serviço-only; sem fusão automática de pessoa/empresa ou vínculo por semelhança.
- `20261021001651_creative_generation_requests.sql`: pedido imutável, sete colunas, FK negócio/perfil, dois índices, RLS própria e cliente SELECT + INSERT em cinco colunas.
- Alteração posterior `20261026193000_referencia_publica_pedido_criativo.sql`: incorporado **somente** o CHECK final do payload da tabela nova, preservando V1 e V2 com ID público numérico. Não se toca `creative_review_requests` ou upload_intent, nem se reproduz a migration inteira.

`preparar-fontes.mjs` normaliza CRLF das fontes novas antes de extrair o CHECK e exige extração não vazia com o nome da constraint/referenciaId. Houve uma extração inicial incompleta na montagem local; foi corrigida antes de qualquer ato remoto. O ensaio consulta a constraint no catálogo do PostgreSQL local e insere payload inválido, que deve falhar: não depende apenas do modelo produzido pelo mesmo gerador.

O delta enumera CREATEs novos, sem OR REPLACE ou replay de pais/helpers existentes. As ACLs novas são explícitas: revoga PUBLIC/anon/authenticated/service_role antes dos grants mínimos. RevOps serviço tem CRUD; suas RPCs somente EXECUTE do serviço/owner. Pedido criativo dá ao authenticated apenas SELECT e INSERT(id,business_id,requested_by,content_hash,payload), sem UPDATE/DELETE/TRUNCATE/MAINTAIN. Conforme ajuste nominal da Central, service_role recebe **somente SELECT** no pedido para inspeção/OpenAPI, sem INSERT/UPDATE/DELETE/TRUNCATE/MAINTAIN/grant option; isso não habilita worker/geração. PUBLIC/anon não recebem privilégios. Defaults inesperados de terceiro são detectados, não ignorados.

`modelo-delta.json.after` enumera integralmente colunas, defaults, checks, FKs, índices, policies, ACL/ACL de coluna e atributos/corpos das RPCs. As duas partes são independentes: RevOps é o funil global da V2G; pedido de criativo é uma intenção do cliente no seu negócio e não autoriza gasto, criação de imagem ou publicação.

## Baseline e preservação

`baseline-u3.json` é somente metadata do PÓS privado U3 aprovado, SHA-256 de origem `ef17e97e2f7ec7b6c96b2de78ee47bacb570ee9515648c7c3fef4c8a3be8a574`, versão U3 `20261108113154`, 47 pares version/name. Foi feita uma única consulta indispensável de catálogo QA para os três pais adicionais: profiles, leads_lp, commercial_orders. Resultado em `pais-adicionais-qa.json`; SQL em `capturar-pais.sql`. Nenhuma linha de cliente/Auth/Vault foi consultada; nenhuma escrita remota.

A guarda compara **todos os 47 pares aprovados version/name**, não só contagem/versão U3. Recusa troca de nome ou versão antiga mantendo a contagem. Tolera somente a entrada nominal da própria chamada, que o canal pode registrar antes ou depois do DO na mesma transação. Aplicação: 47→48; retorno: 48→49. Não há reparo/inserção de histórico pelo SQL futuro.

Pais completos efetivamente medidos/reconstruídos e funções U1/U2/U3/helpers são comparados ao baseline. Nove tabelas backend e commercial_order_units usam fixture mínima; **não** são congeladas como esquema QA. O serviço backend mantém SELECT-only, sem MAINTAIN/grant options. Colunas extras legítimas são aceitas nesses objetos e preservadas. Todos os metadados capturados fora do delta, inclusive backend/commercial_order_units, são comparados PRE/PÓS no DO e no comparador.

Ordenação textual de captura/comparação usa `COLLATE "C"`, com canonicalização equivalente em JS reaproveitada da revisão U3. Reordenar ACL equivalente é aceito; grant extra continua recusado. Os 73 arquivos selados anteriores são conferidos antes/depois.

A revisão final corrigiu **somente na U4** o alias da agregação do histórico para `item`, já reconhecido pelo canonicalizador: com alias `e`, ele introduzia COLLATE dentro das chaves JSON version/name, que passavam a ser inexistentes. O gerador e o ensaio recusam esses textos corrompidos em todos os SQLs gerados. A expressão real extraída do SQL de aplicação é executada com histórico embaralhado e precisa devolver os 47 pares ordenados corretamente; adulteração continua distinguida. Não se alterou a biblioteca U3 selada, delta.sql, grants, RPCs ou modelo de negócio para resolver isso.

## Autorização e limites funcionais preservados

RevOps depende da autorização nominal assinada `app_metadata.autorizacoes` contendo `revops`, validada pela aplicação antes do cliente administrativo. Papel genérico de operador e user_metadata não autorizam. As RPCs não leem JWT/app_metadata: SECURITY INVOKER + ACL impede chamada por anon/authenticated, e o serviço confiável transporta o ator (FK profile). Não se afirma autenticação nominal validada dentro da RPC. O módulo é global à V2G; não se introduziu fence por business nem se misturaram leads dos anúncios dos clientes.

Idempotência é por source_system/source_external_id: **primeira fonte vence**, replay divergente devolve IDs antigos e ignora os novos dados sem sobrescrever. Não se afirma detecção ou resolução automática de conflito. Pessoas/empresas com nomes, e-mails e telefones iguais e referências distintas continuam separadas. Uma mesma interação pode ser ligada explicitamente a duas oportunidades (N:N), sem duplicar fonte/evento.

Os limites originais dos vínculos comerciais foram medidos, sem hardening silencioso: o CHECK exige campos de prova não nulos, mas **aceita texto vazio**. As FKs garantem existência, **não** coerência entre negócio da oportunidade, pedido e lead. O ensaio demonstra pedido de B vinculado a oportunidade com negócio A. Isso não certifica venda, identidade ou autorização financeira. O serviço tem CRUD administrativo; as RPCs recusam payment_approved/campaign_live manuais, mas não se afirma que um serviço privilegiado não possa escrever diretamente. Esses ajustes exigem decisão/bloco próprio.

Pedido de criativo permanece `awaiting_configuration`. Flags não foram lidas nem alteradas remotamente; o ensaio usa habilitado=false e prova que o contrato real encerra antes de sessão/banco. Isso não comprova o valor de configuração do deployment. O gate de geração/consulta privada de imagem do runtime permanece inalterado. Nenhum worker, provedor, Storage ou geração de imagem foi acionado.

O CHECK de payload é o da fonte final: aceita referência V2 numérica, não verifica catálogo externo, não recalcula SHA e valida **formato**, não calendário/prazo da promoção. Campos extras de JSON não são uma autorização de uso de imagem. O contrato TS real valida catálogo, calendário/prazo, confirmação, hash e idempotência; o ensaio usa esse contrato com transporte SQL local. Um cliente SQL direto ainda pode fornecer hash com formato correto mas conteúdo divergente/data impossível: esse limite é demonstrado, não ocultado. Não há prova de HTTP/JWT real, autorização de agência, implantação, fila/provedor ou acesso a imagem gerada.

## Ensaios e arquivos

```text
node docs/qa/reconciliacao-schema-07-11/u4/executar-local.mjs
```

`resultado-ensaio.json` registra **38 grupos aprovados** e hashes dos consumidores antes/depois. Usa PGlite já instalado em v2g-finance, sem instalar dependências. Auth/Vault são stubs locais; auth.users contém somente UUIDs fictícios. A tabela de histórico local recebe cópia dos pares de metadata aprovados para testar o baseline integral, sem alterar o histórico remoto. São testes sequenciais, sem prova de concorrência multissessão.

Cobertura: identidade nominal; idempotência e procedência; ausência de merge; N:N; revisão de inferência/transcrição; vínculos/FKs e seus limites; RLS/grants por papel/coluna; status/data imutáveis; V1/V2 e payloads inválidos; request key e replay/cross-business usando contrato real; atomicidade e drift de esquema/ACL/histórico; extras legítimos do backend; retorno condicionado; 73 selos e consumidores inalterados.

- `u4-preflight.sql` / `u4-pos.sql`: um SELECT/uma linha receipt JSON somente metadados.
- `u4-aplicar.sql`: único DO, sem BEGIN/COMMIT externos, sem invocar negócio.
- `u4-conferir-pre.sql`: guarda anterior ao ato em transação read only, sem locks/advisory/chamadas de negócio.
- `u4-verificar.sql`: read only, sem corpos das RPCs.
- `u4-retornar.sql`: único DO; oito tabelas vazias e delta exato; DROP RESTRICT, nunca CASCADE.
- `comparar-recibos.mjs`: baseline completo, preservação dos pares históricos e todos os metadados PRE/PÓS fora do delta.
- `ATO.md`: procedimento futuro de backup privado/aplicação/retorno, dependente de autorização nominal.
- Geradores locais reescrevem arquivos: não regenerar durante ato/revisão selados. Mudança exige novo ensaio e hashes.

Nenhum checkpoint ou índice da Central foi alterado. A preparação não libera aplicação, unidades seguintes, push ou produção.
