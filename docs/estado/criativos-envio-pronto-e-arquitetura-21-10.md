# Criativos — envio pronto e desenho da geração — 21/10/2026

## 0. Escopo e resultado

Victor aprovou começar com prioridade no envio da imagem pronta e somente desenhar a criação por IA. Aprovação/refações, trabalho do gestor e publicação (itens 3/4/5 da conversa) continuam adiados nesta rodada. Sem mudança visual ou no produto, sem execução de geração/n8n e sem escrita externa.

**Correção de estado importante:** minha resposta anterior usava os checkpoints antigos, que ainda diziam faltar migration e ensaio autenticado. O checkpoint mais recente `e28-qa-publicado-e-ensaio-https-21-10.md` já registra aplicação individual autorizada no QA e **17 verificações HTTPS** com Auth, Storage, biblioteca, novo login e isolamento. A prova histórica foi consultada e seu executor inspecionado; não executei novamente o script, que cria/exclui fixtures reais. Não confundir essa leitura com nova execução dos 17 passos.

O caminho principal do item 1 tem prova em QA; não está certificado em produção nem integralmente por cliques no navegador. Esta rodada acrescentou verificação atual do schema em leitura e quatro provas locais de recuperação/concorrência. A arquitetura está em `../criativos-arquitetura-dados-documentos-n8n.md` — desenho, não gerador implementado.

## QA conferido agora, sem escrita

Projeto confirmado pelo conector: **v2g-webapp-qa**, `zskpijnqgkqwxksqmzmf`, ACTIVE_HEALTHY. Consultas restritas a catálogo/schema/policies/ledger/bucket/contagem; não leram conteúdo de clientes, chaves ou `.env`.

- Existem `creative_review_requests`, `manager_accounts`, `businesses`, `profiles` e ledger. `upload_intent` é JSONB nullable.
- Bucket `creative-review` está privado, máximo **9.437.184 bytes**, formatos JPEG/PNG. Contagem da fila na conferência: **0**; isso não é prova de perda nem de falha, pois as fixtures do ensaio anterior foram limpas.
- RLS da fila habilitada; policy SELECT por dono via `businesses.profile_id = auth.uid()`; authenticated só possui SELECT na tabela. Escritas seguem a action de servidor; nenhum grant/policy foi alterado.
- Ledger QA tem `20261009034914/qa_fila_revisao_criativos`, `20261009041246/qa_gestor_responsaveis_tarefas` e `20261021133718/qa_creative_review_upload_intent`. Não são os timestamps dos arquivos locais. A primeira busca pelos IDs locais retornou vazio; a busca pelos nomes confirmou a aplicação individual, compatível com o checkpoint. Não tratar isso como autorização para reaplicar.
- Lida a expressão do CHECK remoto `creative_review_upload_intent_valida` e avaliada por SELECT sobre oito amostras sintéticas, sem INSERT: SQL NULL legado, WhatsApp e Instagram/promoção aceitos; objetivo desconhecido, carimbo sem UTC, chave extra, lista e JSON null rejeitados. **8/8 expectativas atendidas.** Não é escrita de pedido nem teste de JWT/Storage.
- `scripts/sql/prechecar-qa-envio-criativo.sql` agora reconhece também os nomes QA já aplicados. Continua somente leitura e exige comparar definição/ACL/policies; não corrige ledger nem executa DDL.

## Quatro novos testes locais, sem alterar a action

`scripts/conferir-intencao-envio.mjs` executa a action real com Auth/banco/Storage em memória e rede proibida. Foram acrescentados pontos de falha e barreiras determinísticas exclusivamente no mock:

1. Duas chamadas veem o mesmo pedido ausente ao mesmo tempo: somente uma inserção, uma linha e um arquivo. Uma chamada pode falhar por disputa; isso não é apresentado como duas entregas bem-sucedidas.
2. Segunda chamada enquanto o Storage da primeira está pendente é recusada sem iniciar outro upload.
3. Banco confirmou `awaiting_review`, mas a resposta se perdeu: replay devolve o registro existente sem reenviar bytes e preserva intenção/confirmação/hash.
4. Arquivo foi guardado, mas a confirmação no banco falhou: não retoma enquanto `uploading` está recente; após a janela, repete somente o caminho/conteúdo originais e mantém uma linha/um objeto.

Essas provas não simulam concorrência entre processos reais nem injeção de falha no Storage remoto. Nenhuma fragilidade concreta exigiu alteração de `revisao-actions.ts`, TSX/CSS ou limites de formato/tamanho.

## Desenho da criação por IA

Novo documento técnico do repositório: `docs/criativos-arquitetura-dados-documentos-n8n.md`.

- Separa o caminho já existente de imagem pronta (sem n8n/IA) do futuro pedido de criação.
- Mapeia reutilização de negócios, marca, materiais privados e pedido existente; distingue tabelas atuais/migration preparada de catálogo, snapshot, job e reservas ainda propostos.
- Indica onde entram central/nicho versionados, seleção de referências admissíveis e dados confirmados do cliente; nicho por ID técnico, sem misturar barbearia com salão/manicure/fornecedor.
- Define autoridade no backend para permissão, custo e execução única; n8n orquestra IDs e estados, sem duplicar MDs em nós ou autorizar gasto. Timeout ambíguo exige reconciliação; falha de armazenamento não refaz imagem paga.
- Preserva a exigência de foto real da fachada e de autorização específica para enviar material privado ao provedor.
- A skill de documentação foi aplicada respeitando o formato técnico já estabelecido no repositório; não foi criado documento externo concorrente. A escrita segue as preferências diretas de Victor, sem alegar exemplos recuperados de outro aplicativo.

Inventário n8n em leitura: cinco workflows V2G retornados. O piloto `3kfUlXxPnKRDMB60` está inativo; seus nós foram lidos sem expor parâmetros/credenciais. Ele contém Data Table → filtro barbearia → remoção de IDs repetidos → autorização/porta → pronto ou aguardar. É referência de curadoria, não integração ativa de geração. Nenhum workflow foi executado, alterado, criado ou ativado.

## Validação e limites

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-intencao-envio.mjs`: **20/20** (16 anteriores + 4 novos).
- `node --test scripts/conferir-intencao-envio-sql.mjs`: **12/12** em PostgreSQL descartável, repetidos porque a pré-checagem SQL foi alterada para reconhecer o ledger QA. Nenhuma conexão externa nesse teste.
- `pnpm typecheck`: passou no final do código de testes. Não houve edição de interface.
- `git diff --check` do teste e pré-checagem SQL: limpo, avisos existentes de normalização CRLF.
- A checagem atual de Supabase usou o checklist de isolamento da skill, sem mudar acesso. Changelog e documentação oficial de bucket privado consultados; nenhuma troca de SDK necessária.
- Não houve login novo, convite, upload ou exclusão no QA, chamada paga, flag externa, banco escrito, deploy/commit/push/merge, build/restart, alteração em backend/n8n ou teste de produção.

## Próximo passo e dependências

Não refazer o que já foi comprovado. Para fechar homologação manual completa do item 1, falta percorrer a UI publicada com usuário/material fictícios autorizados, incluindo interrupção/recuperação remota e limites que o checkpoint HTTPS não mediu. Janela/fixtures/acessos e qualquer escrita externa devem ser autorizados especificamente; não reutilizar usuário de outra frente ou promover agência como atalho. Expiração de URL e concorrência real continuam não medidas.

O fluxo principal de envio está comprovado no recorte QA registrado. A criação por IA está desenhada; implementar contexto/job/n8n ou executar piloto pago exige o próximo bloco próprio. Itens 3/4/5 não foram reabertos.
