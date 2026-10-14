# Onboarding — teste de Victor em QA, 13/10/2026

## 0. O que ainda depende de decisão ou integração

- **Alcance Brasil inteiro:** Victor pediu a opção. A bancada V3 já a desenhou, mas `docs/estado/onboarding-v3-21-09.md` registra que o backend só aceita raio. Não converter Brasil em raio ou afirmar segmentação nacional sem contrato do backend.
- **Instagram:** Victor questionou se a ausência deveria impedir a compra. `docs/decisoes.md` permite comprar com presença fraca e mantém CNPJ e venda por WhatsApp como travas. Não criar uma nova trava de Instagram nesta correção.
- **Materiais da marca:** substituir a pergunta livre de cores por envio de logo e guia visual exige armazenamento, isolamento por negócio, revisão de arquivos e extração de cores com confirmação humana. Nada disso está comprovado na rota atual.
- **Agenda e tutorial:** a conclusão já oferece a agenda Google, mas abrir o link não prova reserva. Um tour no Início precisa respeitar esse estado; não pode dizer que a reunião foi marcada.

## 1. Observado por Victor no QA

Victor percorreu convite, seis perguntas, três contas e marca. Relatou espaço excessivo no convite, ações próximas, gravações de 2 a 5 segundos, transcrição de voz com erros, lista de ramos indisponível, valores claros sobre branco, desvio para a tela antiga de verba e conclusão da marca sem navegação. A captura anexada ao chat mostra os três valores das contas com contraste baixo.

Antes deste teste, a migration `20261013070000_corrigir_mescla_contas_onboarding.sql` foi aplicada somente no QA e a Empresa 4 teve as respostas reiniciadas com autorização de Victor. O banco confirmou a correção da função, o onboarding vazio e um pedido aprovado preservado; a tela HTTPS mostrou o convite inicial. O relato atual confirma a navegação até a marca, mas a persistência das três contas após nova leitura não foi revalidada neste bloco.

Os tempos são **relato do teste**, não medição de rede ou servidor. A transcrição ruim foi relatada com um exemplo; não há amostra de áudio preservada para comparar palavra por palavra.

## 2. Correção local deste bloco

- Convite mais compacto, com ações separadas e explicação do valor das respostas: `Chat.tsx` e `OnboardingNovo.module.css`.
- Valores e rótulos das contas usam tinta escura explícita no tema claro: `onboarding-editorial.css`.
- A pendência de verba permanece visível, mas seu atalho para a página antiga deixa de disputar a sequência de onboarding: `contas/Contas.tsx`.
- Após a primeira gravação concluída da marca, a tela segue para `/onboarding/concluido`, que oferece a agenda: `marca/Marca.tsx`. O clique na agenda continua sem equivaler a reserva.
- Campo livre de ticket rejeita intervalos como `500-600`, `500 a 600` e `R$ 500 / R$ 600`; pede um único valor ou uma opção de faixa: `contas/regras.ts`, `contas/actions.ts`.

`pnpm typecheck` e `pnpm conferir:onboarding-preservacao` passaram (61 testes). O convite foi visto no navegador local. O QA publicado ainda usa a versão anterior até publicação de Victor; este bloco não fez deploy nem escreveu nas respostas do cliente.

## 3. Próximos blocos técnicos

1. **Voz:** a rota publicada usa `SpeechRecognition` do navegador (`Chat.tsx`, `lib/onboarding/fala-ao-vivo.ts`). A rota OpenAI `gpt-4o-mini-transcribe` existe só na bancada `/exemplo/api-transcrever`; portar com autenticação, limite de duração/tamanho, tratamento de falha, revisão do texto antes de salvar e teste de áudio em português. Cotação consultada em 13/10: OpenAI estima US$ 0,003/minuto e Gemini 3.5 Transcribe cerca de US$ 0,005/minuto. Confirmar preços e disponibilidade antes de ativar.
2. **Alcance e tipo de negócio:** integrar Brasil inteiro ao modelo de segmentação antes de oferecer a opção; diagnosticar falha do `GET /nichos` no QA e manter “Outro” honesto, sem inventar catálogo. Perguntar “Qual é o tipo do seu negócio?” na revisão da tela.
3. **Contas:** avaliar faixas menores no ticket com impacto no cálculo `ticketEscalar`; rever a linguagem de custo e lucro sem transformar intenção do cliente em margem contábil certa. Não trocar regras por rótulos sem validar leitura do backend.
4. **Marca:** especificar e implementar envio de arquivos de marca, extração assistida de cores, confirmação pelo cliente e continuidade à agenda.
5. **Verba e visita ao produto:** atualizar `/verba` para a identidade vigente e separar claramente teto de mídia de meio de pagamento tratado na reunião; depois desenhar orientação opcional no Início, sem fingir integração com Meta ou reserva.
6. **Performance:** medir navegação e tempo das ações no QA, com causa identificada antes de otimizar. O relato de 2 a 5 segundos não identifica se a espera é rede, RPC, renderização ou backend.

App Review da Meta foi lembrado por Victor; requer verificação separada do painel Developers, sem inferir situação pelo tempo decorrido.

## 4. Segunda passagem pelo QA e correção local

Victor confirmou que o QA publicado ainda não mostrava “Brasil inteiro” nem o catálogo de ramos, permitia resposta curta “UI”, mantinha contas difíceis de preencher e perguntava pelas cores em texto livre. A página hospedada da agenda aceitou letras no CNPJ e permitiu mais de uma reserva. Essas são observações do teste de Victor, não prova de uma nova publicação.

No código local, a praça agora oferece “Brasil inteiro” como **intenção registrada**, sem inventar raio para o backend. A cidade aparece depois de escolher alcance local. O ramo usa o catálogo vivo quando disponível; texto livre com menos de quatro caracteres é recusado no cliente e no servidor. O QA publicado não tinha `V2G_BACKEND_URL` e `V2G_BACKEND_TOKEN` na última conferência dos nomes de variáveis, portanto o catálogo não deve ser anunciado como corrigido lá até configurar e retestar.

As três contas permitem valor digitado com prévia em reais, além das opções; custo e valor a manter exigem confirmação explícita antes de virar dado de perfil. A tela ganhou contraste em tema claro, largura mais contida e menos avisos repetidos. A marca agora recebe logo PNG e guia PDF privado, ambos limitados a 4 MB antes do envio para caber no teto de 4,5 MB da Vercel; propõe cores extraídas do logo para confirmação e deixa a descrição como nota opcional. O fluxo salvo segue para a agenda sem mensagem transitória.

O bucket privado `v2g-midia` não existia no QA na checagem inicial de 13/10. Victor autorizou aplicar somente `20261014010000_bucket_identidade_qa.sql` no QA. A migration remota foi registrada como `20261014013627_qa_bucket_identidade_20261014`; consulta posterior confirmou `public=false`, limite de 10 MB, PNG/JPEG/PDF e nenhuma policy para esse bucket em `storage.objects`. O upload pelo WebApp ainda depende da versão nova publicada e de teste HTTPS; criar o bucket não prova o fluxo visual.

**Agenda permanece aberta:** a página do Google não valida o campo personalizado CNPJ nem limita uma reserva por empresa. O WebApp não recebe o evento confirmado, logo não pode mostrar horário marcado, impedir outra reserva ou iniciar tutorial condicionado a ela. `lib/agenda/conciliacao.ts` valida a identidade de eventos em memória, mas falta integração autenticada com a agenda e persistência idempotente por negócio. Clique no link e relato do cliente não substituem essa prova.

**Voz preparada localmente:** a pergunta aberta passou a usar gravação do navegador e transcrição por `gpt-4o-mini-transcribe` por uma rota autenticada; o texto volta para revisão antes de salvar, e o áudio não é gravado pela V2G. A rota só aparece quando `V2G_VOICE_TRANSCRIPTION_ENABLED=true` e `OPENAI_API_KEY` estão configuradas. Sem isso, o cliente escreve. Ainda faltam chave/configuração no QA, teste real de áudio em português e controle operacional de uso antes de qualquer ativação pública.

**Ainda pendentes:** medição das demoras de 2–5 segundos, revisão da verba antiga e tutorial no Início após conciliação da reunião. Depois da preparação da voz, `pnpm typecheck`, `pnpm conferir:onboarding-preservacao` (65 casos) e `git diff --check` passaram localmente. A suíte geral segue com falhas de migrations anteriores não reconciliadas e exceções do gestor não declaradas, fora deste bloco.
