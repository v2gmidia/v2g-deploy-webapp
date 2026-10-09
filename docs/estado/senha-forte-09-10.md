# Primeiro acesso: confirmação e senha forte — 09/10/2026

## Entrega local

- O primeiro acesso agora pede `Crie uma senha` e `Repita a senha`. A action verifica igualdade antes de chamar o Supabase.
- Primeiro acesso e redefinição usam a mesma regra no servidor: mínimo de 15 caracteres, frases com espaços aceitas, senhas previsíveis e repetições curtas recusadas. A senha `123456` fornecida para o ensaio é recusada.
- A interface explica o mínimo e recomenda uma frase longa e única. Nenhuma senha é salva no código, nos testes ou neste registro.
- O QA publicado ainda está no commit anterior. **A nova regra não foi publicada nem testada no QA**; o ensaio de e-mail/login de `qa-primeiro-acesso-09-10.md` permanece pendente. Victor precisa criar a senha de teste na interface quando a versão nova estiver disponível.

## Verificação

- `corepack pnpm conferir:senha`: 4 testes passaram; cobrem senha curta, previsível, divergência e frase longa.
- `corepack pnpm conferir:acesso`: 5 testes passaram.
- `scripts/conferir-auth-email.mjs`: passou.
- `corepack pnpm typecheck` e `corepack pnpm build`: passaram com o servidor dev parado.
- Navegador local: `/entrar?modo=cadastro` exibiu ambos os campos, orientação de 15 caracteres e botão de cadastro. Nenhum formulário foi submetido.

O WebApp valida as ações que ele expõe. A configuração de senha do próprio Supabase Auth ainda precisa ser alinhada para impedir cadastros diretamente na API pública com regra mais fraca. Isso é uma configuração separada, não comprovada por este build.
