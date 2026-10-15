# Etapa 03 — identificação das contas no menu, 14/10/2026

## 0. Aberto

- Publicar manualmente no QA e verificar com sessão autorizada que dois CNPJs com o mesmo nome comercial aparecem separados no menu do computador e do celular; a troca precisa abrir o negócio certo em um clique.
- Conferir troca em duas abas, perda de acesso e múltiplas contas de anúncios no mesmo CNPJ. O ensaio local não prova esses cenários no QA.
- A entrada de outro CNPJ pelo checkout público ainda depende da liberação da compra; em produção, “Adicionar negócio” leva ao pré-cadastro publicado.

## Trabalho local

- O menu mostra o CNPJ do pedido aprovado quando ele pertence ao e-mail verificado e ao perfil atual. Negócio liberado sem esse vínculo usa um código curto do cadastro como identificador, inclusive em falha da consulta auxiliar.
- A leitura do CNPJ foi centralizada para o menu e para a tela de escolha. A busca recebe somente IDs de negócios liberados pela checagem de acesso; pedidos alheios e pendentes não fornecem identificação.
- Nome e identificador aparecem em duas linhas nas opções de troca, também no menu compacto do celular. A troca em si continua usando a action existente, que valida novamente o acesso.

## Conferências

- `pnpm typecheck`: passou.
- `node --test scripts/conferir-multiconta.mjs`: 21/21 passaram, incluindo vínculo por e-mail verificado e rejeição de pedido alheio.
- `git diff --check`: passou; somente avisos de finais de linha.

Sem commit, push, deploy, migração ou escrita na Meta neste bloco.
