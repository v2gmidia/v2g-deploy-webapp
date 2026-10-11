# Avisos: pendências fora da lista recente — 11/10/2026

## 0. Ainda pendente

- Ver a tela autenticada com peças recentes e antigas de um mesmo negócio. QA está pausado; a correção existe apenas localmente.
- Entrega por e-mail e WhatsApp continua sem confirmação nesta tela.

## Falha e correção

`/alertas` carregava só 20 revisões recentes. Se uma peça anterior tivesse `changes_requested`, a seção superior podia dizer “Tudo em dia”. Agora uma consulta independente conta todas as peças com ajuste pedido no negócio selecionado. A tela mostra as recentes e aponta quantas pendências ficaram fora da lista; não transforma aprovação da peça em publicação.

A consulta de decisões também pede contagem. Se essa leitura estiver truncada, uma contagem falhar ou duas leituras divergirem enquanto os dados mudam, a tela mostra os itens que conseguiu ler com aviso de parcialidade, sem afirmar que está tudo em dia. Quando ambas as contagens confirmam zero, o estado vazio continua disponível.

## Verificação

- `node --test scripts/conferir-alertas.mjs`: 3/3; inclui ajuste antigo fora das 20 peças, leitura parcial e duas fontes vazias confirmadas.
- `pnpm typecheck` e `pnpm build` com dev parado: passaram.
- Não houve verificação de interface autenticada nem consulta ao QA pausado.
