# Multiconta — troca e isolamento entre abas, 15/10/2026

## 0. Ainda depende de decisão ou prova

- Victor publica pelo fluxo habitual os ajustes locais do menu. Não houve commit, push nem deploy neste bloco.
- A migration `20261015011547_proteger_pagina_compartilhada_multiconta.sql` continua local. O `AGENTS.md` exige autorização específica antes de aplicá-la, mesmo no QA. A revisão de compatibilidade **alterou seu conteúdo** depois da primeira pergunta de autorização; é necessária aprovação da versão atual. Depois é preciso ensaiar duas contas de anúncios do mesmo CNPJ e a concorrência de troca de Página, sem escrita na Meta.
- A perda real de acesso a um dos negócios ainda precisa de ensaio no QA. Não revogamos o vínculo da fixture para obter essa prova.
- A contratação pública de outro CNPJ continua dependente do checkout real. A segunda empresa usada aqui possui aprovação de pagamento **simulada**, sem cobrança.

## Correções locais deste bloco

- O menu do negócio ativo abre uma lista com nome e CNPJ legíveis, inclusive quando o nome é longo. No desktop, a lista pode ultrapassar a largura da barra lateral.
- A troca continua em um clique. Durante a ação, a lista é desabilitada e mostra “Abrindo negócio…”; falhas aparecem no próprio menu.
- O primeiro bloco do onboarding deixou de oferecer “+” em cada pergunta. Aquele controle guardava qualquer imagem como variação de marca, sem associá-la à pergunta. O envio permanece na etapa visual e os arquivos anteriores são preservados.
- A migração local agora completa `ownership`/`status` de `ad_accounts` quando ausentes e retira escrita direta de `anon`/`authenticated` antes de criar a RPC. Esses itens existiam em migrations anteriores do repositório, mas faltavam no QA. O manifesto local foi alinhado.

## Ensaio autenticado no QA HTTPS

- O mesmo login exibiu `v2g teste` (CNPJ final **0434**) e `V2G QA Multiconta B — FICTÍCIA` (final **0604**). Escolher B abriu `/inicio` com B ativo; escolher A no menu abriu `/onboarding/concluido` com A ativo. Cada negócio retomou a própria etapa.
- Em uma segunda aba, um campo de `/meu-negocio` de B foi alterado **sem salvar**. A primeira aba trocou para A; a tentativa de salvar a aba antiga exibiu “Você trocou de negócio em outra aba. Atualize esta página antes de salvar.” Ao voltar para B e recarregar, o texto de teste não estava gravado.
- A rota `/adicionar-negocio` apresentou os dois caminhos: outro CNPJ no e-mail atual pela contratação existente e entrada com outro e-mail via saída. Não iniciamos compra nem trocamos credenciais.

## Verificação local

- O menu corrigido foi inspecionado no Chrome local com três negócios; nome e CNPJ ficaram inteiros. O clique abriu `QA Empresa 1 — FICTÍCIA — Resposta A` e mostrou o carregamento antes da navegação. Em seguida, `V2g teste` foi restaurado como negócio ativo.
- O compositor de uma pergunta do onboarding foi inspecionado no Chrome local: microfone presente e “+” ausente.
- `pnpm typecheck` passou; `pnpm conferir:multiconta` passou 28/28; `git diff --check` não apontou erro de whitespace (apenas aviso de fim de linha).
- Consulta somente de leitura no Supabase `v2g-webapp-qa` (`zskpijnqgkqwxksqmzmf`) confirmou PostgreSQL 17.11, ausência de `registrar_conta_contratada`, das duas colunas e do trigger de proteção; a tabela ainda concedia INSERT/UPDATE/DELETE a `anon` e `authenticated`. O ledger remoto não contém esta migration. A revisão local foi feita com base nesses fatos; ainda não há prova de execução SQL.

O ensaio de duas abas comprova a ação de edição testada, não todas as ações antigas. A fixture de QA não comprova pagamento nem vínculo com a Meta.
