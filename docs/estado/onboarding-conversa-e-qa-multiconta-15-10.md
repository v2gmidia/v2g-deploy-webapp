# Conversa guiada e ensaio multiconta, 15/10/2026

## Ajuste visual e feedback local de 15/10

- Victor aprovou a segunda imagem conceitual, baseada nas referências de conversa minimalista, para desktop. O primeiro bloco agora tem conversa centralizada, pergunta em destaque, respostas à direita e compositor fixo na base, sem avatar, seletor de modelo ou painel lateral. O mobile ainda não foi redesenhado neste ajuste.
- Ao enviar, a resposta aparece imediatamente como pendente; o estado mostra envio e “Escrevendo…” até a próxima pergunta. Uma falha mantém o texto no campo e não marca resposta como salva. A transcrição continua sujeita à configuração existente.
- A navegação interna mostra uma barra de progresso imediata; as rotas de fluxo e do app ganharam telas de carregamento, e o onboarding tem esqueleto próprio. Isso comunica espera, sem alterar o tempo de resposta do servidor.
- Verificações locais: `pnpm typecheck`, `pnpm conferir:onboarding-preservacao` (72/72), `pnpm build` e inspeção visual desktop no Chrome passaram. O indicador de envio ainda não foi observado em um envio real neste ajuste; testar no QA após publicação. Sem commit, push ou deploy.

## 0. Ainda pendente

- Victor faz commit e publicação do código quando quiser testar o onboarding no QA. O código deste bloco está somente local.
- A voz depende de `OPENAI_API_KEY`; `V2G_VOICE_TRANSCRIPTION_ENABLED=false` a bloqueia explicitamente. A sessão ao vivo conectou no Chrome local e entregou texto final de um trecho ambiente após parar; a exibição de deltas durante fala contínua ainda precisa de teste falado pelo usuário. Não se confirmou a configuração publicada no QA.
- A agenda dentro do WebApp depende de OAuth Google corporativo, quatro variáveis de ambiente, flag, publicação e ensaio com convite real. No QA atual, a tela ainda abre a página pública do Google, que aceita reservas repetidas. Não declarar a etapa de reunião concluída.
- Ensaio de upload autenticado no QA, isolamento em duas abas e perda de acesso no multiconta continuam pendentes. A fixture é apenas para teste e não corresponde a compra real.
- O teste de seleção de uma imagem sintética de 500 × 500 no Chrome foi interrompido antes do envio: a extensão do navegador não tem acesso a URLs de arquivo. Não alteramos essa permissão; build e conferidores não substituem o ensaio de arquivo real.

## Implementação local

- Primeiro bloco substituído por conversa guiada, mantendo as nove perguntas e a action de gravação existente. Abertura informa três etapas e cerca de 15 minutos; o progresso acompanha respostas salvas. Enter envia e Shift+Enter quebra linha. Respostas antigas continuam legíveis e corrigíveis.
- A atividade apresenta a busca e “Outros” no mesmo campo, com lista que se abre dentro da tela. Exemplo por nicho e indicação de família de atividade alimentam a preparação do gestor, sem mapear automaticamente o cadastro a um nicho técnico.
- Microfone compacto aparece nas nove perguntas quando a chave de transcrição está configurada. Nas respostas abertas, preenche o compositor; no nicho, preenche a atividade editável; na localização, a escolha falada pede confirmação e os dados locais obrigatórios. O áudio não é salvo pela V2G; a pessoa revisa o texto antes de enviá-lo como resposta.
- Correção local posterior: transcrição parcial da sessão ao vivo passa a preencher a resposta durante a gravação, sem envio automático. A rolagem agora ocorre no histórico interno da conversa. A página não cria mais altura excedente por rótulos ocultos; em Chrome local, `documentElement.scrollHeight` e viewport mediram 695 px após a correção.
- Ajuste local de voz após novo teste: removidos o player de áudio e a segunda tentativa de transcrição. Ao parar, a tela aguarda até 1,2 segundo pelo resultado final e preserva o texto parcial para revisão; se não houver fala, apenas retorna ao microfone, sem aviso. Digitação e troca de pergunta limpam o estado de voz. A sessão temporária é preparada uma vez por pergunta, sem abrir o microfone antes do clique. Em Chrome local, o tempo medido entre clique e microfone pronto caiu de aproximadamente 5,5 para 3,5 segundos; ainda depende da conexão de voz e precisa ser avaliado no QA.
- A conversa também permite anexar imagens durante as respostas; elas entram no acervo privado da etapa visual, sem substituir a resposta textual. A etapa visual aceita várias imagens (24 adicionais, até 12 por envio) e apresenta um controle compacto de anexar/enviar. PNG, JPEG, WebP e AVIF decodificáveis pelo navegador entram; HEIC depende do navegador. O cliente ajusta ou confirma as cores propostas ao enviá-las nessa etapa. O upload de PDF foi retirado da interface, sem apagar PDFs anteriores.
- Arquivos com lado menor que 512 pixels são ampliados no navegador antes da validação do servidor. Isso permite uma imagem de 500 × 500 como referência; não acrescenta nitidez real ao anúncio.
- Agenda própria já existente recebeu escolha visual de horários, confirmação na tela e retorno ao Início. Resposta ambígua do Google mantém a reserva pendente em vez de convidar o cliente a tentar outro horário.

## Verificações

- Build de produção local passou em 15/10/2026, incluindo TypeScript e rotas.
- `pnpm conferir:onboarding-preservacao`: 72/72; `pnpm conferir:identidade` passou; `pnpm conferir:multiconta`: 28/28.
- Visual local: abertura da conversa, pergunta, autocomplete, “Outros” no mesmo campo e tela da marca inspecionados no Chrome. O teste de arquivo real autenticado ainda falta.
- QA HTTPS, mesmo login: a lista exibiu `v2g teste` e `V2G QA Multiconta B — FICTÍCIA`; clicar no segundo abriu `/inicio` com o segundo como negócio ativo. O menu listou ambos e o clique no primeiro voltou a `/inicio` com `v2g teste` ativo. A troca é comprovada nesse fluxo; não há prova de isolamento em duas abas nem da compra real. A fixture está descrita em `multiconta-fixture-qa-15-10.md`.

Não houve commit, push, deploy, migration, cobrança real nem escrita na Meta neste bloco.
