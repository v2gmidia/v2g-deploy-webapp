# Etapa 01 — compra nova e acesso no QA (12/10/2026)

## 0. Dependência de Victor

- A chave `ASAAS_API_KEY` do Sandbox no ambiente local retorna HTTP 401 `invalid_access_token` para `GET /v3/webhooks`. No painel Sandbox, a chave denominada `V2G WebApp Sandbox` aparece habilitada; isso não valida a cópia configurada no WebApp. Victor precisa gerar/substituir a credencial no projeto `v2g-webapp-qa` da Vercel e no `.env.local` de QA, sem enviá-la pelo chat. A mudança de variável na Vercel exige novo deployment da branch `QA` para entrar no runtime. O teste novo não pode ser retomado automaticamente enquanto a credencial não for verificada. Não alterar o projeto WebApp principal.
- Depois da chave, configurar um webhook **novo** do Sandbox para `https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment`, com `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`, token igual ao `ASAAS_WEBHOOK_TOKEN` do projeto QA e fila ativa. O único webhook visível no painel Sandbox nesta inspeção era `V2G QA checkout temporario`, com fila interrompida e URL de túnel encerrado apontando para `/api/webhooks/asaas-checkout`; não reativá-lo.

## Prova observada

- A rota HTTPS estável `/api/webhooks/asaas-payment` respondeu 401 a POST sem token, em vez de 503. Isso prova a trava de ambiente habilitada e a proteção por token, mas não a entrega de um evento autêntico do Asaas.
- A LP publicada em `https://www.v2gmidia.com.br/` exibiu R$ 500/mês por conta, mínimo de seis meses, anual de R$ 5.280 (12%), CNPJ, consentimento obrigatório, distinção entre interesse e compra, e link de login para o WebApp. Não enviei um lead novo à operação nesta verificação.
- No checkout HTTPS de QA, iniciei um pedido **sintético** semestral Pix de R$ 2.850, com o mesmo e-mail já confirmado no Auth e CNPJ matematicamente válido `00000000000353`. Referência opaca `80ee0b01-f9f2-4722-83ca-7f4d6c10d781`; pedido `82437221-4d55-41d8-a715-1bc36f4f586d`. A tela mostrou `O cadastro do pagador não foi confirmado`.
- Consulta somente leitura no Supabase QA confirmou `awaiting_payment`, negócio criado com reivindicação por e-mail pendente, sem vínculo a perfil, sem pagador/cobrança Asaas e com tentativa reservada. O seletor autenticado continuou exibindo apenas os dois CNPJs fictícios anteriores; o terceiro não apareceu. Nenhuma cobrança ou pagamento foi confirmado.
- `conferir:checkout-api` 6/6 e `conferir:acesso` 6/6 passaram. São testes de regra local, não prova de integração.

## Correção local posterior

- `app/contratar/pagamento/actions.ts` agora libera condicionalmente a reserva da tentativa quando o Asaas devolve HTTP 401 **na criação do pagador**, antes de receber qualquer ID externo. O contador do cartão também volta ao valor anterior nesse caso. Timeout, 400 não classificado e 5xx continuam reservados para conciliação. A mudança responde ao erro de credencial visto neste ensaio; não corrige retroativamente o pedido já reservado e ainda não está publicada no QA.
- A mesma liberação condicional cobre HTTP 401 **na criação da cobrança ou assinatura**, com pagador já vinculado, sem ID de cobrança ou assinatura. O valor anterior do contador do cartão é restaurado somente se a atualização condicional no pedido vencer. Falha ambígua continua bloqueando nova tentativa.
- Após as correções, `conferir:checkout-api` 6/6, `typecheck`, `git diff --check` e `build` passaram. O servidor local foi parado antes do build e reiniciado. Esses testes não executaram a ramificação de HTTP 401 contra o banco e o Asaas; o deployment QA também não contém as correções locais.

## Limite de credencial

- A documentação oficial do Asaas confirma que `401 invalid_access_token` significa chave inválida ou revogada no ambiente usado. O valor da chave não foi lido nem exibido. A política de uso do navegador exige que o titular conclua a criação e a troca da credencial; autorização geral para trabalhar não transfere essa etapa ao agente.
- Não foi criado webhook novo nem feita nova cobrança neste retorno. O pedido reservado permanece sem alteração até haver chave válida e conciliação somente leitura no Asaas.

## Próxima execução

1. Confirmar a chave do Sandbox no QA por chamada autenticada somente leitura, sem mostrar seu valor. Conciliar o pedido já reservado antes de qualquer liberação manual; uma falha ambígua exige conciliação para não duplicar cobrança. Publicar a correção local somente pelo fluxo manual de Victor.
2. Criar/validar o webhook novo com token seguro no mesmo projeto QA. Enviar evento de teste sem aprovação financeira apenas para conferir entrega e resposta; não reutilizar a fila interrompida do checkout hospedado.
3. Fazer **um novo** pedido Sandbox no domínio estável com o e-mail confirmado e outro CNPJ sintético; verificar que fica pendente e invisível no seletor, simular aprovação no Sandbox, conferir `payment_approved`, evento e vínculo à mesma conta. Não alterar o pedido reservado deste ensaio sem conciliação.
4. Depois testar retentativa de recusa conhecida pela action e eventos seguintes/estorno. 3DS de produção e cobrança real não foram verificados.

Não houve commit, push, deploy, migration, pagamento real, nota, assinatura ou publicação de campanha nesta passagem.
