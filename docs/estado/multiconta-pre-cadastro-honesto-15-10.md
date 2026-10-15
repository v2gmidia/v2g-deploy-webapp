# Multiconta: caminho público para outro CNPJ — 15/10/2026

## 0. Aberto

- O checkout público segue fechado. Para concluir a compra de outro CNPJ pelo mesmo e-mail, ainda é necessário liberar e ensaiar o fluxo público de contratação; o pré-cadastro sozinho não vincula um negócio.
- A publicação e o ensaio autenticado no QA continuam pendentes.

## Ajuste local

- Em `app/(public)/adicionar-negocio/page.tsx`, a opção de outro CNPJ continua levando ao checkout existente quando o checkout de QA está habilitado.
- Fora dessa condição, o destino continua sendo o pré-cadastro público. O botão agora diz **Ir para o pré-cadastro** e a página explica que preencher esse formulário não adiciona imediatamente um negócio. A aparição na lista depende de compra aprovada e vínculo pelo mesmo e-mail.
- A opção de entrar com outro e-mail e a ação Sair permanecem na mesma página.

## Verificação

- `pnpm typecheck`: passou.
- Nenhuma compra, cadastro externo, configuração, publicação ou migração foi executada.
