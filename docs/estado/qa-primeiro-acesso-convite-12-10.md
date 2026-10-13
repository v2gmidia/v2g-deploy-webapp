# Primeiro acesso novo e convite ao onboarding — QA, 12/10/2026

## 0. Pendente

- A mudança de navegação e o texto neutro do cadastro estão **somente no código local**. Não houve commit, push ou deploy. Depois de publicar no projeto QA, repetir a escolha do negócio fictício novo em HTTPS e confirmar o convite, **Começar onboarding** e **Fazer depois**. A interface publicada ainda leva ao início.
- O fluxo de onboarding completo, reserva da reunião, assinatura, NFS-e e publicação da campanha não foram testados nesta rodada.
- A primeira tentativa de Pix ficou presa após o Asaas recusar um telefone fictício inválido. Foi conciliada manualmente no mesmo pedido, sem duplicar cobrança; o tratamento automático dessa falha segue pendente.

## Prova do primeiro acesso

- Um pedido de teste novo (`29b24411-a5bd-47a6-b624-e8e62f6ea3e5`) recebeu Pix Sandbox de R$ 2.850 (`pay_5pkt66fdbw96ukh8`). Antes da simulação, Asaas retornou `PENDING`, o pedido estava `awaiting_payment` e não havia usuário Auth para o e-mail da compra.
- A simulação oficial do Sandbox retornou `RECEIVED`; o webhook em QA gravou `payment_approved`. A tela HTTPS mostrou “Pagamento confirmado pelo Asaas”. Nenhum pagamento bancário real foi feito.
- Victor criou a conta com o e-mail da compra e confirmou o link recebido na caixa principal. Consulta ao Supabase QA verificou `email_confirmed_at` presente, pedido aprovado com `buyer_profile_id` igual ao usuário, negócio do pedido com `profile_id` igual ao mesmo usuário e **um único negócio** para esse perfil. A tela de escolha mostrou só o CNPJ fictício correspondente; Victor informou que **Abrir negócio** levou a `/inicio`.
- A mensagem após cadastro parecia uma recusa, embora a conta tivesse sido criada. `signUpAction` usa o mesmo retorno neutro para sucesso, conta existente e compra não elegível, para não revelar quais e-mails existem. O texto local foi reescrito para orientar a verificar caixa de entrada e spam sem afirmar que o envio sempre ocorreu.

## Ajuste local do próximo passo

- `escolherNegocioAction` agora lê `onboarding` junto do ID do negócio autorizado. Se não há respostas nem outros blocos iniciados, a seleção leva a `/onboarding`; negócios já iniciados continuam em `/inicio`.
- A abertura já existente do onboarding passou a convidar o cliente a começar e oferece **Fazer depois**, sem gravar resposta. Não foi adicionada estimativa de 15 minutos: `Trilha.tsx` registra a decisão anterior de retirar números de duração sem medição.
- `pnpm typecheck`, `pnpm conferir:multiconta` (22 testes), `pnpm conferir:onboarding-preservacao` (60 testes), `pnpm build` com o dev parado e `git diff --check` passaram. O dev foi reiniciado na porta 3000. A interface nova e a retomada via navegador ainda não foram verificadas em HTTPS.
