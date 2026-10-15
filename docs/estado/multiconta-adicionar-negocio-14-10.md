# Etapa 03 — adicionar outro negócio, 14/10/2026

## 0. Aberto

- Conferir no QA publicado a nova escolha: contratar outro CNPJ com o e-mail da sessão, ou sair e entrar com outro e-mail na tela já existente. Confirmar o comportamento com pedido aprovado e sessão real.
- Em produção, o checkout público continua fechado; a primeira opção leva ao pré-cadastro. Interesse cadastrado não libera acesso nem cria pedido.
- Ainda faltam os ensaios autenticados de troca em duas abas, ação antiga após a troca, perda de acesso e várias contas de anúncios por CNPJ.

## Trabalho local

- O menu e a tela de escolha agora apontam “Adicionar negócio” para uma etapa curta com dois caminhos explícitos. A contratação usa o checkout existente no QA; a entrada com outro e-mail usa o login e primeiro acesso existentes após sair da sessão atual.
- Na compra de teste, o e-mail da sessão autenticada aparece preenchido e não pode ser alterado no formulário. A action confere novamente esse vínculo antes de registrar o pedido, inclusive se o formulário for modificado fora da interface.
- Sair também limpa a preferência do negócio ativo. Uma preferência da sessão anterior não é reaproveitada no próximo e-mail.

## Conferências

- `pnpm typecheck`: passou.
- `pnpm conferir:multiconta`: 28/28 passaram.
- `pnpm conferir:checkout`: 8/8 passaram.
- `pnpm conferir:checkout-api`: 7/7 passaram.
- `pnpm build`: passou e incluiu `/adicionar-negocio` como rota dinâmica.
- `git diff --check`: passou; somente avisos de finais de linha.

Sem commit, push, deploy, migração, cobrança ou escrita na Meta neste bloco.
