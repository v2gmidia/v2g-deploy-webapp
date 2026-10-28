# Primeiro acesso — confirmação visível (27/10/2026)

## 0. Revisão humana e limites

Implementado e testado **somente localmente**, conforme pedido de correção transmitido pelo Central. Victor precisa revisar antes de publicar. Nenhum commit, push, deploy, alteração de Auth/Supabase/Vercel, envio de e-mail, conta real ou dado de produção neste bloco. A confirmação de entrega de e-mail e o acesso após abrir o link não foram ensaiados aqui.

Prévia em `http://127.0.0.1:3000/exemplo/cadastro`, com a mesma interface da rota real e ações simuladas. O servidor local foi iniciado após conferir que a porta 3000 estava livre; nenhum dev compartilhado foi encerrado. Não houve build de produção nem execução da suíte completa.

## 1. Causa e correção

**Fato anterior:** `app/(public)/entrar/page.tsx` renderizava `signUpState.message` antes de um formulário longo, mas mantinha os campos e o botão após o retorno neutro. Era possível permanecer vendo o fim do formulário sem perceber a resposta.

**Implementação:** `app/(public)/entrar/TelaEntrada.tsx:45` mantém `useActionState`, recusa repetição enfileirada depois de um retorno com mensagem e sem erro, e usa uma trava síncrona de submissão além de desabilitar o botão durante o envio. Em `:63`, o foco e a rolagem levam a pessoa à confirmação ou ao erro. Em `:82`, o retorno neutro substitui formulário/navegação de primeiro acesso por círculo com check, orientação de caixa de entrada/spam, próximo passo e link de login que conserva `next` e `adicionar`. Erros preservam os seis valores controlados.

**Limite semântico preservado:** `actions.ts` e `lib/auth-errors.ts` não foram alterados. Ausência de pedido aprovado, conta existente e cadastro aguardando confirmação continuam indistinguíveis. A mensagem é a mesma devolvida pela action: não afirma conta criada ou e-mail entregue. O check marca a conclusão da solicitação na interface, não prova entrega, aprovação comercial ou acesso. Não há botão de reenvio inventado.

## 2. Arquivos do bloco

- `app/(public)/entrar/page.tsx`: conserva Suspense, parâmetros e Server Actions; delega a interface.
- `app/(public)/entrar/TelaEntrada.tsx`: interface extraída sem alterar campos/validações, com conclusão, foco e bloqueio de repetição.
- `app/entrada-editorial.css:122`: estilos escopados da confirmação, usando cores e tipografia existentes.
- `app/exemplo/cadastro/page.tsx`: import dinâmico dev-only e `notFound()` em produção.
- `app/exemplo/_cadastro/Previa.tsx`: controles de resposta simulada e contador, sem importar ações reais para execução ou persistir dados.
- `scripts/conferir-cadastro-interface.mjs`: nove testes isolados da interface e dos retornos reais da action com portas fictícias.
- Este registro. Outros fluxos, conteúdo legal, credenciais e regras de liberação não foram alterados.

## 3. Provas locais

- `pnpm typecheck`: passou.
- `node --test scripts/conferir-cadastro-interface.mjs`: **9/9**. Cobrem substituição do formulário, foco/rolagem, erro/campos preservados, pending, dez submits no mesmo render (nove bloqueados), ação enfileirada, login, igualdade dos três retornos neutros e isolamento da bancada.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-documento-contratante.mjs scripts/conferir-senha.mjs scripts/conferir-redefinicao-turnstile.mjs`: **24/24**, sem rede, com fixtures.
- Chrome local, desktop e viewport mobile **390 × 844**: duplo clique seguido de Enter produziu apenas **um** envio pendente; CTA desabilitado; falha retornou ao erro com foco, manteve todos os campos e permitiu tentar de novo.
- Confirmação: zero formulários restantes, foco no título, Tab segue para “Ir para entrar”, nenhuma rolagem horizontal. No celular, bloco completo entre y=187,7 e y=719,3 dentro da altura de 844 px. Nenhum aviso/erro no console da aba ao final.
- Região `aria-live="polite"` persistente, `aria-atomic`, `aria-busy`, título focável com descrição e erro com `role="alert"`. Navegação por teclado conferida; leitor de tela real não foi utilizado.
- Detector Impeccable: **7 avisos preexistentes** na folha compartilhada (tamanhos 36/54/42/13/22 e cor #EEF4FF), fora das linhas acrescentadas; nenhum achado no novo componente. Não se declara detector global limpo.
- A barreira dev-only foi verificada em código/teste, não por build de produção neste bloco.

Capturas locais, somente com cenário fictício, em `C:/Users/victo/.codex/visualizations/2026/10/27/cadastro-confirmacao/`: `confirmacao-desktop.png`, `confirmacao-mobile.png`, `erro-mobile.png`. A captura full-page mobile falhou uma vez; a captura de viewport funcionou. A barra de simulação não faz parte da rota real.

## 4. Decisões de implementação

O componente real recebe as ações por props para permitir ensaiar sucesso/erro/espera sem chamar o provedor. A rota continua fornecendo as ações existentes. Mantida a mensagem neutra integral para não introduzir nova política de enumeração de usuários. A skill Impeccable orientou preservação da identidade, foco, estados e contraste; a revisão React manteve estado derivado e ref para a trava transitória, sem biblioteca nova.

Bloco encerrado para revisão de Victor. Não equivale à validação ponta a ponta do cadastro publicado.
