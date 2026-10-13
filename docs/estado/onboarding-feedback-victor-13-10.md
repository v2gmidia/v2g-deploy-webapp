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
