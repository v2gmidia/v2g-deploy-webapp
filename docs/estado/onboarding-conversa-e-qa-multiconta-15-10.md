# Conversa guiada e ensaio multiconta, 15/10/2026

## 0. Ainda pendente

- Victor faz commit e publicação do código quando quiser testar o onboarding no QA. O código deste bloco está somente local.
- A voz depende de `V2G_VOICE_TRANSCRIPTION_ENABLED` e `OPENAI_API_KEY`; a transcrição real em português não foi testada neste bloco.
- A agenda dentro do WebApp depende de OAuth Google corporativo, quatro variáveis de ambiente, flag, publicação e ensaio com convite real. No QA atual, a tela ainda abre a página pública do Google, que aceita reservas repetidas. Não declarar a etapa de reunião concluída.
- Ensaio de upload autenticado no QA, isolamento em duas abas e perda de acesso no multiconta continuam pendentes. A fixture é apenas para teste e não corresponde a compra real.
- O teste de seleção de uma imagem sintética de 500 × 500 no Chrome foi interrompido antes do envio: a extensão do navegador não tem acesso a URLs de arquivo. Não alteramos essa permissão; build e conferidores não substituem o ensaio de arquivo real.

## Implementação local

- Primeiro bloco substituído por conversa guiada, mantendo as nove perguntas e a action de gravação existente. Abertura informa três etapas e cerca de 15 minutos; o progresso acompanha respostas salvas. Enter envia e Shift+Enter quebra linha. Respostas antigas continuam legíveis e corrigíveis.
- A atividade apresenta a busca e “Outros” no mesmo campo, com lista que se abre dentro da tela. Exemplo por nicho e indicação de família de atividade alimentam a preparação do gestor, sem mapear automaticamente o cadastro a um nicho técnico.
- Microfone compacto usa a rota já existente de transcrição quando as duas configurações estão presentes. O áudio não é salvo pela V2G; a pessoa revisa o texto antes de enviá-lo como resposta.
- A conversa também permite anexar imagens durante as respostas; elas entram no acervo privado da etapa visual, sem substituir a resposta textual. A etapa visual aceita várias imagens (24 adicionais, até 12 por envio) e apresenta um controle compacto de anexar/enviar. PNG, JPEG, WebP e AVIF decodificáveis pelo navegador entram; HEIC depende do navegador. O cliente ajusta ou confirma as cores propostas ao enviá-las nessa etapa. O upload de PDF foi retirado da interface, sem apagar PDFs anteriores.
- Arquivos com lado menor que 512 pixels são ampliados no navegador antes da validação do servidor. Isso permite uma imagem de 500 × 500 como referência; não acrescenta nitidez real ao anúncio.
- Agenda própria já existente recebeu escolha visual de horários, confirmação na tela e retorno ao Início. Resposta ambígua do Google mantém a reserva pendente em vez de convidar o cliente a tentar outro horário.

## Verificações

- Build de produção local passou em 15/10/2026, incluindo TypeScript e rotas.
- `pnpm conferir:onboarding-preservacao`: 72/72; `pnpm conferir:identidade` passou; `pnpm conferir:multiconta`: 28/28.
- Visual local: abertura da conversa, pergunta, autocomplete, “Outros” no mesmo campo e tela da marca inspecionados no Chrome. O teste de arquivo real autenticado ainda falta.
- QA HTTPS, mesmo login: a lista exibiu `v2g teste` e `V2G QA Multiconta B — FICTÍCIA`; clicar no segundo abriu `/inicio` com o segundo como negócio ativo. O menu listou ambos e o clique no primeiro voltou a `/inicio` com `v2g teste` ativo. A troca é comprovada nesse fluxo; não há prova de isolamento em duas abas nem da compra real. A fixture está descrita em `multiconta-fixture-qa-15-10.md`.

Não houve commit, push, deploy, migration, cobrança real nem escrita na Meta neste bloco.
