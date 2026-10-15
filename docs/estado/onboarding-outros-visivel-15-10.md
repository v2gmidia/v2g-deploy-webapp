# Etapa 04 — opção Outros sempre acessível no tipo de negócio

## 0. Aberto

- Falta conferir o seletor com cliente autenticado no QA, em tela pequena e com teclado. A alteração está somente no código local.

## Achado

A busca mostra até oito atividades antes de “Outros”. Com a altura máxima do menu, “Outros” ficava abaixo da área visível e exigia rolagem. Isso atrapalhava justamente quem não encontrava seu tipo de negócio.

## Ajuste local

- As sugestões rolam dentro do menu; “Outros — escrever minha atividade” permanece visível no rodapé.
- Ao navegar pelas sugestões com as setas do teclado, a opção ativa entra na área visível.

## Conferência

- `pnpm typecheck` passou.
- `git diff --check` passou; somente avisos existentes de conversão LF/CRLF.

Sem commit, push, deploy ou alteração no banco.
