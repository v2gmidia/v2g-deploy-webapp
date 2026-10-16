# Multiconta — menu e entrada, 16/10/2026

## 0. Ainda depende de decisão ou prova

- As mudanças são locais. Victor ainda precisa publicá-las pelo fluxo habitual; não houve commit, push ou deploy neste bloco.
- Falta ensaio autenticado da versão publicada: escolha de cada negócio, inclusive o ativo, entrada com outro e-mail, primeiro acesso e saída. A prévia local não envia escolhas reais.
- `/inicio` mantém seus encaminhamentos de onboarding e agenda para estados ainda pendentes. Uma escolha sempre pede `/inicio`, mas esses portões podem levar à etapa exigida. Se o produto precisar exibir o painel mesmo nesses casos, a regra de apresentação do Início precisará ser revista em bloco próprio.

## Mudanças locais

- A lista de negócios no desktop é uma seção da barra lateral; não usa borda, sombra ou largura que invada o conteúdo. Enquanto está aberta, a navegação da barra se recolhe para a lista caber sem cruzar o painel. Nomes e CNPJs quebram linha; a lista não tem rolagem horizontal.
- “Adicionar negócio” no menu e na seleção inicial aponta para `/entrar?adicionar=1`. O proxy permite a entrada nesse caso mesmo com sessão ativa. A tela mantém as abas existentes “Entrar” e “Primeiro acesso”. A rota antiga `/adicionar-negocio` redireciona para a mesma entrada, sem renderizar uma página de opções.
- A action de escolha continua a verificar sessão, lista de negócios liberados e propriedade da empresa antes de gravar a preferência. Após isso, envia sempre a `/inicio`.

## Verificação

- Prévia local `/exemplo/inicio?multiconta=1`, com três empresas fictícias: menu aberto inspecionado no Chrome desktop. A lista ficou dentro da barra, sem cobrir a trilha “Preparar”; o nome, o CNPJ e a indicação do negócio ativo ficaram visíveis. Na janela de 1518 × 695 px, a borda direita do menu estava em 238 px e o conteúdo começava em 264 px; o menu coube na altura visível.
- Na mesma prévia, “Adicionar negócio” abriu `/entrar?adicionar=1`; a aba “Primeiro acesso” manteve o contexto na URL. A URL antiga `/adicionar-negocio` redirecionou para a entrada.
- `pnpm typecheck`, `pnpm conferir:multiconta` (28/28), `pnpm conferir:inicio` (39/39) e `pnpm conferir:portao` (8/8) passaram. `git diff --check` saiu sem erro de whitespace. Ainda não há prova de troca autenticada com o novo código nem da exceção do proxy para uma sessão ativa.
