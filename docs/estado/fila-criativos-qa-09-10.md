# Fila de criativos — QA de 09/10/2026

## Implementação local

- `/criativos` mantém a análise automática existente e ganha envio separado para revisão humana, condicionado a `V2G_CREATIVE_REVIEW_ENABLED=true`. A action confere sessão, negócio ativo sob RLS, assinatura JPG/PNG, tamanho, hash e UUID de idempotência; registra a peça antes de responder “recebida”. Falha parcial fica `upload_failed` ou `uploading` para retomada com o mesmo ID e conteúdo.
- Os arquivos vão para bucket privado `creative-review`. A tabela `creative_review_requests` tem estados próprios de revisão; a aprovação interna é `approved_for_manual_publish` e **não** grava publicação na Meta. O cliente lê somente as peças do negócio selecionado.
- `/gestor` mostra a contagem de peças pendentes quando a fila está ativa. `/gestor/criativos` exige `app_metadata.papel=operador`, lê a fila e emite link temporário do arquivo. O gestor pode aprovar para publicação manual, pedir ajustes ou recusar. A decisão exige estado `awaiting_review`, para que dois cliques não apliquem duas decisões. Não há notificação automática ao gestor nem ao cliente.

## Banco e verificação

- Migration local: `supabase/migrations/20261009034500_fila_revisao_criativos.sql`. CLI do Supabase não está instalado neste checkout; o arquivo foi criado manualmente, como já ocorreu com as migrations do checkout. **Não rodar `db:migrate` cegamente**: o ledger do QA usa versões próprias e há outras migrations pendentes no repositório.
- Migration aplicada **somente** ao projeto `v2g-webapp-qa` (`zskpijnqgkqwxksqmzmf`) pelo conector, nome `qa_fila_revisao_criativos`, após confirmar ausência da tabela e do bucket. O banco real não foi alterado. Consulta posterior: tabela vazia, bucket `public=false`, limite 9 MiB, uma política de leitura na tabela e nenhuma política de acesso direto a `storage.objects` no QA.
- Flag acrescentada apenas ao `.env.local` apontado ao QA; isso não publica a função.
- `pnpm typecheck`, `pnpm build` com dev parado e 4 testes da lógica de tipo de arquivo/idempotência passaram. O dev voltou a responder `/entrar` HTTP 200.
- Ensaio de integração `scripts/qa-revisao-criativos.mjs`: criou duas identidades sintéticas e um negócio para cada uma no QA, gravou imagem privada, atualizou estado, emitiu URL assinada e bloqueou ID duplicado. O dono leu sua peça; a outra identidade não leu; usuário comum não alterou a decisão; acesso anônimo não leu; download direto do Storage foi negado. O ensaio removeu usuários, negócios, registro e arquivo; a consulta final encontrou zero fixtures restantes.
- Navegador sem sessão em `/gestor/criativos` foi redirecionado para `/entrar?next=%2Fgestor%2Fcriativos`.
- Os conferidores existentes de criativos (30/30) e envio (48/48) também passaram. `git diff --check` passou; os avisos eram apenas de conversão LF/CRLF no checkout Windows.

## Limites para a próxima prova

- Ainda falta uma sessão cliente e outra de operador percorrer upload pela interface, retomada, decisão e visualização posterior. O banco QA de checkout contém somente a base mínima de compras; faltam colunas da `businesses` que `/criativos` usa em `estadoDoCliente()`, então não serve para provar essa tela sem provisionar um ambiente de QA completo. Os testes de Storage/RLS não provam a action ou a interface autenticada.
- A migration precisa de revisão de segurança, incluindo políticas Storage efetivas do ambiente alvo, antes de qualquer produção. A fila não designa responsável nem envia aviso; o gestor precisa abrir a tela. Retenção/exclusão do arquivo ainda não foi definida.
- A campanha inicial continua publicada manualmente pelo gestor, após as travas de pagamento, contrato, conta e acesso. A aprovação de peça não comprova campanha no ar.
