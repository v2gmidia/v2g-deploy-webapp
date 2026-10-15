# Etapa 04 — retorno ao Início após reservar

## 0. Aberto

- A agenda própria continua desativada até configuração e teste autenticado no QA. O fluxo público antigo não devolve confirmação ao WebApp e continua levando à página de conclusão.
- Conferir visualmente no QA o guia de quatro passos, inclusive no celular, e o retorno depois de cancelar ou mover a reunião no Google. Os links de Conta, Anúncios e Avisos ficam destacados enquanto seus passos são exibidos; ainda falta confirmar o posicionamento real do destaque no menu lateral e na barra inferior.

## Achado

Mesmo com uma reunião confirmada na agenda própria, `/inicio` redirecionava sempre para `/onboarding/concluido`. Depois de reservar, o cliente não conseguia chegar ao painel. Liberar a cadeia antiga sem cuidado também poderia mostrar tarefas de publicação antes da reunião.

## Ajuste local

- A reserva confirmada leva ao Início; a página de conclusão mantém o link para voltar ao painel e consultar a reunião.
- O Início confere se há registro confirmado para o negócio ativo, somente quando a agenda própria estiver configurada. Reserva pendente, ausente ou falha de leitura continuam na página de conclusão.
- Antes de existir execução ou campanha no ar, o Início apresenta um guia de quatro passos com reunião, Conta, Anúncios e Avisos, com Anterior e Próximo. Cada passo do menu destaca o link correspondente; Fechar guia recolhe o cartão, e Abrir guia o restaura. O destaque é removido ao trocar de passo, fechar o guia ou sair da página. A cadeia de campanha anterior não é mostrada nesse estado. Quando há execução ou campanha no ar, a tela normal do produto volta a prevalecer.
- O registro local pode ficar desatualizado se um evento for cancelado fora do WebApp até a conciliação da página da reunião; o ensaio real deve cobrir isso.

## Conferência

- `pnpm build`: passou após o ajuste do guia, 42 páginas estáticas geradas.
- `pnpm typecheck`: passou após o ajuste final.
- `pnpm conferir:inicio`: 39/39; `pnpm conferir:onboarding-preservacao`: 72/72.
- Sem teste visual autenticado, reserva real, envio externo, commit, push ou deploy.
