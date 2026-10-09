# Primeiro acesso e multiconta no QA — 09/10/2026

## Estado atual

- O projeto de teste é `zskpijnqgkqwxksqmzmf`; o WebApp de teste está em `https://v2g-webapp-qa.vercel.app`.
- Antes deste ensaio, não havia usuário Auth nem pedido aprovado para `victor.cabral@v2gmidia.com.br` no QA.
- Foram criados dois negócios **fictícios** no QA, identificados por `dados_ficticios = true`, e dois pedidos fictícios com `external_ref` `qa-auth-victor-0910-1` e `qa-auth-victor-0910-2`. Ambos têm estado `payment_approved` **somente como fixture**; não representam cobrança nem evento do Asaas. Seus CNPJs de teste são `00000000000001` e `00000000000002`.
- A tela `https://v2g-webapp-qa.vercel.app/entrar?modo=cadastro` foi aberta. A criação da senha de teste e o envio do formulário foram entregues a Victor; e-mail, link, login e seleção de dois negócios ainda não foram verificados.
- O quadro FigJam de outubro foi atualizado na etapa 01 para separar os pagamentos já comprovados no Sandbox das provas de e-mail, login, multiconta e webhook HTTPS ainda pendentes.

## Próxima prova

1. Victor preenche o primeiro acesso com seu e-mail, o CNPJ fictício `00000000000001` e uma senha de teste que não deve ser compartilhada no chat.
2. Confirmar que chegou exatamente um e-mail e verificar o destino visível do link antes de abri-lo.
3. Abrir o link, conferir sessão autenticada e verificar no QA que os dois pedidos foram vinculados ao mesmo perfil, que os dois negócios pertencem a esse perfil e que a seleção mostra os dois CNPJs.
4. Trocar entre os negócios e verificar que a tela do cliente não mistura respostas ou dados.
5. Ao encerrar, remover **apenas** as duas fixtures identificadas acima, em ordem compatível com as chaves estrangeiras; preservar os demais pedidos do QA, inclusive os que têm eventos reais do Asaas Sandbox. A remoção da conta Auth de teste depende de Victor confirmar que não a quer manter para os demais ensaios.

O estado `payment_approved` das fixtures não é prova de pagamento. Nada foi cobrado, assinado, emitido ou publicado neste ensaio.
