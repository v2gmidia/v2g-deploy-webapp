# Retorno local após autenticação — 09/10/2026

## Correção local

- O formulário de login e primeiro acesso aceitava qualquer valor `next` iniciado por `/`, exceto `//`. Um caminho iniciado por barra e contrabarra ou contendo caracteres de controle ainda podia ser entregue ao redirecionamento. O callback do e-mail já tinha validação mais forte, mas as duas entradas não partilhavam a mesma regra.
- Login, cadastro e confirmação de e-mail agora usam `destinoLocalSeguro`. A regra aceita somente caminho da própria aplicação, preserva query e âncora, rejeita barra invertida, controles, destino externo e retorno à própria tela `/entrar`. O fallback do cadastro/login é `/inicio`; o de recuperação é `/redefinir`.
- A mudança não altera a trava de pagamento, o vínculo de CNPJ ou o conteúdo dos e-mails.

## Verificação e limite

- `pnpm conferir:acesso`: 5/5, incluindo caminhos locais válidos e tentativas de redirecionamento externo.
- `pnpm typecheck` e `pnpm build`: passaram, sem servidor dev na porta 3000 durante o build.
- Não foi percorrido um link real de confirmação por e-mail nesta rodada. A entrega de SMTP e a URL pública de QA seguem como provas separadas.
