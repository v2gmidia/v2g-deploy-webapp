# Primeiro acesso e multiconta no QA — 09/10/2026

## Atualização de 11/10/2026

Os CNPJs originalmente usados nas duas fixtures tinham dígitos verificadores
inválidos. Como o primeiro acesso agora valida esses dígitos no navegador e no
servidor, somente as duas fixtures identificadas abaixo foram atualizadas no
QA: `qa-auth-victor-0910-1` usa `00000000000191` e
`qa-auth-victor-0910-2` usa `00000000000272`. Ambos são números **sintéticos**
com dígitos matematicamente válidos; isso não comprova cadastro ativo nem
representa pagamento. A consulta após a alteração confirmou os dois valores.
Não havia usuário Auth com o e-mail do teste nesse momento.

O envio tentado por Victor em 11/10 ocorreu quando o servidor local estava
parado para o build. Uma consulta posterior ainda encontrou zero usuários Auth
com o e-mail do teste: não há e-mail de confirmação nem vínculo de acesso a
atribuir a essa tentativa. A tela local recebeu validação de dígitos do CNPJ,
filtro de caracteres, controles de visibilidade e indicador de força com
confirmação divergente. Conferidores de senha e acesso, typecheck e build
passaram; no navegador local, letras foram removidas e o CNPJ de dígitos
incorretos mostrou erro. Não se testou o envio de uma nova senha nem o e-mail.
O quadro FigJam não pôde ser atualizado neste bloco: a integração Figma
retornou limite de chamadas do plano Starter. Este registro local permanece
como fonte do estado até o quadro aceitar uma nova edição.

## Prova autenticada de 11/10/2026

Na primeira tentativa após a correção, o formulário devolveu a mensagem
neutra. Victor confirmou que havia digitado o e-mail incorretamente. Com o
e-mail correto, a conta Auth foi criada no QA e a confirmação foi registrada
às 15:02 UTC. A mensagem `Confirme seu e-mail | V2G` apareceu na caixa de
entrada correspondente. Victor abriu o link e chegou ao seletor com os dois
negócios fictícios. Consulta posterior no QA mostrou `email_confirmed_at`
preenchido, dois negócios com `profile_id` desse usuário e dois pedidos
fictícios aprovados com `buyer_profile_id` desse usuário.

Na interface local autenticada, foi possível selecionar a empresa fictícia 1,
abrir `/inicio`, voltar a `Meus negócios`, selecionar a empresa fictícia 2 e
abrir `/inicio` com o nome correto de cada uma. Atualizar `/inicio` preservou
a segunda seleção. `/meu-negocio` mostrou o nome próprio de cada empresa ao
alternar a seleção. O conferidor `conferir:multiconta` passou em 21 casos.
Ambos os negócios ainda não têm dados diferentes de onboarding ou campanha;
portanto esta prova confirma seleção, vínculo e persistência da escolha, mas
não comprova isolamento de respostas preenchidas entre negócios. O teste
usou pedidos com `payment_approved` somente como fixtures: não prova compra
real, webhook ou envio de cobrança. A URL HTTPS estável de QA não foi a
interface usada nesta prova; a interface foi `localhost:3000` com banco QA.

A tela `/conta` chamou inicialmente a fixture de pagamento confirmado pelo
provedor por causa do status simulado. O `select` de `businesses` agora inclui
`dados_ficticios` e a tela identifica essas linhas como pedido de teste com
aprovação simulada e sem pagamento. O texto foi conferido no navegador; o
typecheck e o build passaram após a alteração.

## Estado atual

- O projeto de teste é `zskpijnqgkqwxksqmzmf`; o WebApp de teste está em `https://v2g-webapp-qa.vercel.app`.
- Antes deste ensaio, não havia usuário Auth para `victor.cabral@v2gmidia.com.br` no QA. Agora há um usuário confirmado.
- Foram criados dois negócios **fictícios** no QA, identificados por `dados_ficticios = true`, e dois pedidos fictícios com `external_ref` `qa-auth-victor-0910-1` e `qa-auth-victor-0910-2`. Ambos têm estado `payment_approved` **somente como fixture**; não representam cobrança nem evento do Asaas. Seus CNPJs atuais de teste são `00000000000191` e `00000000000272`.
- A tela local `http://localhost:3000/entrar?modo=cadastro` foi usada para criação de conta e confirmação de e-mail no QA. A seleção dos dois negócios foi verificada nessa interface; o site HTTPS de QA continua sem essa prova.
- O quadro FigJam de outubro foi atualizado na etapa 01 para separar os pagamentos já comprovados no Sandbox das provas de e-mail, login, multiconta e webhook HTTPS ainda pendentes.

## Próxima prova

1. Preencher respostas de teste distintas por negócio e conferir que a troca não mistura respostas ou dados.
2. Verificar o mesmo percurso na URL HTTPS estável de QA quando sua versão e webhook estiverem alinhados.
3. Ao encerrar, remover **apenas** as duas fixtures identificadas acima, em ordem compatível com as chaves estrangeiras; preservar os demais pedidos do QA, inclusive os que têm eventos reais do Asaas Sandbox. A remoção da conta Auth de teste depende de Victor confirmar que não a quer manter para os demais ensaios.

O estado `payment_approved` das fixtures não é prova de pagamento. Nada foi cobrado, assinado, emitido ou publicado neste ensaio.
