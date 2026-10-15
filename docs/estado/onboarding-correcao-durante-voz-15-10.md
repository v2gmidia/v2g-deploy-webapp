# Onboarding: correção durante transcrição de voz — 15/10/2026

## 0. Aberto

- A transcrição por provedor continua desativada até configuração e ensaio com áudio real no QA. Esta correção local não prova a qualidade da transcrição.

## Problema e ajuste

- No bloco de perguntas, a troca para outra resposta já era bloqueada enquanto o áudio estava em gravação ou transcrição, mas **Cancelar correção** continuava acionável. Ao cancelar, o texto retornado poderia ser acrescentado à pergunta seguinte.
- `app/(fluxo)/onboarding/Chat.tsx` agora desabilita e confere novamente a ação de cancelar enquanto há gravação, transcrição, salvamento ou estado de gravação incerta. O cancelamento volta a funcionar quando a operação termina.

## Verificação

- `pnpm typecheck`: passou.
- Não foi enviado áudio, nem alterado QA, banco ou configuração externa.
