# M3 — recuperação de cores local e pedidos ao Cauã — 10/11/2026

## Resultado

Victor informou que Cauã responde amanhã (11/11) e autorizou avançar nas frentes independentes na QA. O logo já salvo no bloco anterior permanece preservado. Não houve nova consulta em ciclo ao WhatsApp, envio de mensagem ou gravação remota neste bloco.

Defeito observado no upload real anterior: após recarregar `/onboarding/marca`, o logo permanecia, mas as sugestões de cores desapareciam. A tela não oferecia recuperar essas sugestões do arquivo salvo, levando a novo envio ou escolha manual.

**Correção local concluída, ainda não publicada:** na QA habilitada, a etapa passa a oferecer **Sugerir cores do logo salvo** quando ainda não há cores e o cliente não escolheu definir com o gestor. É uma ação explícita; não refaz sugestões que a pessoa removeu sem um novo clique.

- Usa o arquivo já autorizado pela página, sem novo upload, IA, RPC de gravação ou confirmação automática da marca.
- Restrição de origem ao Storage do projeto QA e caminho exato do mesmo negócio; recusa origem externa, produção, outro negócio, tipo inválido e imagem acima do teto.
- Leitura sem cookies, sem redirecionamento ou cache persistente; limite de 10 segundos e cancelamento ao sair/trocar contexto, trocar logo ou editar a paleta.
- Impede clique duplicado e salvamento concorrente antes do novo render. Resultado atrasado não substitui a escolha manual. Falha orienta recarregar ou adicionar cores manualmente.
- Usa estilos existentes, sem mudar CSS ou identidade visual. O portão de flag + host QA é avaliado no servidor; fora dele a opção permanece indisponível.

Arquivos: `app/(fluxo)/onboarding/marca/Marca.tsx`, `page.tsx`, `lib/identidade/cores-do-logo-salvo.ts`, `scripts/conferir-cores-logo-salvo.mjs` e `package.json`. O conferidor novo entra pela conferência de identidade, já presente na suíte principal.

## Verificação e limites

- 12/12 testes específicos: recuperação após remontar, origem/caminho/negócio, erros, teto, ausência real de cores, isolamento QA, confirmação explícita, corrida com edição/salvamento, duplicação, cancelamento e troca de contexto; usam o componente e a página reais com fronteiras offline controladas.
- Regressões: 100/100 no grupo paleta/onboarding/loading/proveniência, incluindo os oito testes específicos iniciais; não somar essa rodada aos 12 como casos únicos.
- Conferidor de identidade: 6/6; tipos e build aprovados. O build final foi repetido somente após acrescentar o cancelamento na troca de contexto, não como consulta em ciclo.
- Sem suíte completa alegada, sem nova prova visual/autenticada da correção publicada e sem instalação de dependência. A recuperação no navegador real fica para depois do commit/push manual QA; a prova do logo já salvo não foi reaberta.

Este bloco não conclui a marca, não informa site por suposição e não fecha M3 ou M4. A próxima validação técnica tem gatilho concreto: publicação manual dessa candidata somente na QA; não repetir os mesmos testes sem alteração, nova evidência ou falha.

## O que pedir ao Cauã em 11/11

### Para fechar M3

1. **Combinar uma janela curta com Victor e fazer a passada operacional na própria sessão QA, em Piligrin/Dúú.** Usar a campanha/peça existentes; verificar se ele consegue acompanhar a conta, as pendências e o próximo passo. Relatar apenas falha nova concreta; não repetir envio/aprovação da mesma peça nem as provas técnicas M1/M2 já encerradas.
2. **Dar a decisão operacional e a razão:** acompanhar como está, solicitar ajuste ou propor outra ação. Registrar o que recomenda, por quê e quando voltar a conferir. Proposta de mudança não autoriza executar publicação ou alterar verba.
3. **Apontar o que impede assumir essa rotina pelo aplicativo.** Dizer onde precisou sair para outra ferramenta, qual informação faltou ou se consegue seguir com a operação no escopo observado. Victor e Cauã usam esse retorno para decidir o aceite M4; não declarar aceite por silêncio.

### Complementos que não devem travar a rodada de acompanhamento

- **Data desta versão no AD 01 `52570262604075`, se souber:** informar data e fonte; se não souber, dizer isso e manter em conferência. O histórico da Meta já mostra a mesma imagem antes/depois da alteração de 16/jul; não usar essa alteração como primeira publicação.
- **Contato/site vigente e eventual manual de marca:** o Instagram e o logo já foram definidos por Victor. O site indicado na Página não resolveu na tentativa feita; confirmar um endereço atual se houver. Não pedir novamente escolha de logo, teto, conta, região ou aprovação da peça.

FamFire e demais anunciantes não são pré-requisito para fechar o piloto Dúú. Sua implantação exige os próprios dados e ativos e deve continuar em frente separada.

## Preservação e parada

Alterações documentais anteriores mantidas. Sem commit, push, deploy, banco, migração, Meta, verba, produção, permissões, credenciais, n8n, envio de mensagem ou criação de rodada. A candidata fica para o commit/push manual de Victor somente na QA. O contato humano de amanhã não foi agendado ou enviado por este bloco.
