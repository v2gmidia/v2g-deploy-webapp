# Onboarding — confirmação de envio, 27/10/2026

## 0. Próximo passo humano

Revisar a prévia local em `http://127.0.0.1:3000/exemplo/envio-onboarding` e publicar pelo fluxo habitual quando aprovado. Depois validar com sessão autorizada no QA, especialmente a correção da nona resposta e retomada após recarregar. Sem commit, push, deploy ou gravação real neste bloco.

## Inventário e evidência

- Ambiente: checkout local `C:/Users/victo/v2g-deploy/webapp`, servidor já existente em 127.0.0.1:3000. Chrome desktop e viewport 390 × 844. Sem versão publicada conferida neste bloco.
- Referência humana: `C:/Users/victo/AppData/Local/Temp/codex-clipboard-52420a2c-48c8-45a0-9c8c-824182d7f043.png`.
- Reproduzido antes da correção usando o componente real com ação fictícia pendente: texto repetido no campo desabilitado e no histórico; mensagem “Enviando resposta…” junto a “Escrevendo…”. Impacto: ambiguidade entre resposta recebida, salva e próxima pergunta.
- FATO: `app/(fluxo)/onboarding/actions.ts` só devolve `ok/estado` ao concluir suas operações; não entrega progresso intermediário ao cliente. A duração dessas operações no QA não foi medida. “Escrevendo…” e a espera de 280 ms eram locais, não progresso informado pelo servidor.
- FATO: o bloqueio anterior dependia apenas de estado React. O novo teste invoca dez submissões antes do render seguinte para cobrir repetição no mesmo instante.

## Correção local

`app/(fluxo)/onboarding/Chat.tsx`:

- Trava síncrona antes da chamada; mantém bloqueio enquanto a gravação está pendente ou incerta. Libera nova tentativa após falha conhecida.
- Enquanto aguarda, mostra a resposta pendente uma vez no histórico e esvazia visualmente o campo bloqueado. O estado do rascunho permanece em memória; a limpeza definitiva só ocorre depois do retorno confirmado.
- Aviso junto ao campo, status acessível e indicador no botão. Após 8 segundos, informa que ainda aguarda confirmação, sem inventar percentual ou etapa do servidor.
- Remove “Escrevendo…” e atraso artificial. Confirma “Resposta salva.” apenas após `ok` com estado; então avança/foca a próxima pergunta ou conclusão.
- Falha conhecida devolve o rascunho editável e foca o aviso. Falha de rede, retorno sem estado ou `recarregar` mantêm o texto selecionável/copíavel, impedem novo envio e pedem conferência.
- Bloqueia os controles próximos “Vou responder” e “Escrever do meu jeito” durante a operação. Oculta a instrução de digitar por indisponibilidade de voz enquanto o campo está bloqueado. Nenhuma implementação de voz foi alterada.
- O histórico não é mais uma live region inteira; o status e o erro anunciam o estado sem reler todas as respostas. Rolagem para a mensagem pendente sem movimento suave; spinner respeita movimento reduzido.

`ChatConversa.module.css`: estilos locais do status e indicador; botão permanece à direita no celular.

## Arquivos

- Alterados: `app/(fluxo)/onboarding/Chat.tsx`, `app/(fluxo)/onboarding/ChatConversa.module.css`, `scripts/conferir-onboarding-voz.mjs` (expectativas atualizadas para campo vazio somente durante envio).
- Novos: `scripts/conferir-onboarding-envio.mjs`, `app/exemplo/envio-onboarding/page.tsx`, `app/exemplo/_envio-onboarding/Previa.tsx`, `app/exemplo/_envio-onboarding/Previa.module.css` e este relatório.
- A bancada está protegida por import condicional de desenvolvimento e `notFound` em produção; injeta apenas uma Promise local no componente. Sem fetch, usuário ou banco real.
- Nenhuma alteração em actions, contrato/persistência, perguntas, voz, outros blocos, configuração ou telas de outros chats.

## Provas

- `node --test scripts/conferir-onboarding-envio.mjs`: **9/9**. Dez submissões → uma chamada, sucesso, demora, falha recuperável, retorno incerto, ausência de estado, queda de rede, correção da nona resposta, passagem intermediária, foco, rascunho e guarda da bancada.
- `node --test scripts/conferir-onboarding-preservacao.mjs scripts/conferir-onboarding-voz.mjs`: **78/78**. Após ajustes finais de copy, repetidos somente os 9 novos + 6 de voz: **15/15**.
- `pnpm typecheck`: **passou**, após alterações finais TSX.
- Chrome: duplo clique contou uma chamada; demora exibiu aviso; falha restaurou texto e foco; nova tentativa chegou a 9/9 com conclusão focada. Correção da nona resposta conferida. Em 390 × 844, retorno incerto/rede deixou texto copiável e aviso visível/focado, botão bloqueado, sem overflow horizontal.
- Detector Impeccable: **13 avisos preexistentes** no CSS (tipografia, cores e transição de largura); nenhum nas novas regras ou no Chat.tsx. Não é um verde global de design.
- Capturas: `C:/Users/victo/.codex/visualizations/2026/10/27/onboarding-envio/envio-desktop.png`, `envio-mobile.png`, `incerto-mobile.png`.

## Limites e pendências

- Sem ensaio autenticado ou submissão real no QA. Causa e duração de eventual lentidão do servidor continuam sem medição.
- A interface não distingue transporte de processamento interno porque a ação não transmite essas fases. Mantém “aguardando confirmação” até o retorno.
- Rascunho é preservado nesta tela em falha; não foi adicionada persistência de rascunhos entre reloads. Em resultado incerto, o texto permanece copiável antes de recarregar; retomada usa as respostas que o servidor realmente gravou.
- Não há prova de idempotência entre abas ou reloads: a trava cobre esta instância da interface. Nenhum contrato de backend foi alterado.
- Não executado build/suíte completa, preservando o servidor local e o trabalho simultâneo. Build de produção da guarda dev-only continua gate antes de publicação.

## Identificação do código conferido

SHA-256 de `Chat.tsx`: `BF4BEE2C75343F6B26C548850AFE2E6B63A7553FA71B4712AC752220D53F6FCB`.

SHA-256 de `ChatConversa.module.css`: `278A3C081275C1BB08641994A9EC8D6FD1207D83BC5857B30965DCBED4B8E4F9`.

SHA-256 de `actions.ts`, somente lido: `2B372A87CB6CDE69D11C0998A8D5FB26FD250952668F53D97B38D955CC87C445`.
