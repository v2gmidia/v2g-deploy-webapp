# Sessão das páginas de contratação — 08/11/2026

## 0. Resultado e limite

Correção local concluída para a ressalva R1 da U5. As páginas pública de acesso contratado e interna de Pedidos agora recusam erro de Auth antes de criar o cliente administrativo ou iniciar leitura sensível. Não houve banco, Auth, e-mail, aceite, cobrança, produção, ambiente, Git, deploy, Meta, build ou servidor.

O ensaio usa as páginas reais com fronteiras substituídas em memória. Portanto comprova ordem das guardas e chamadas locais; não comprova cookies, JWT, RLS, HTTP ou comportamento do provedor real.

## 1. Alterações

- `app/(public)/acesso-contratado/[id]/page.tsx:15`: passa a ler `error` de `getUser`. Uma resposta com usuário residual e erro é tratada como desconectada antes do resumo e do cliente administrativo. Usuário íntegro porém não confirmado continua vendo a orientação existente; usuário confirmado e sem erro mantém o fluxo positivo.
- `app/(protected)/pedidos/page.tsx:36`: erro, usuário ausente, e-mail não confirmado ou papel diferente de `app_metadata.papel = operador` chamam `notFound()` antes de `createAdminClient` e da carteira de pedidos.
- `scripts/conferir-sessao-paginas-contratacao.mjs`: cinco casos importam as duas páginas reais e medem criação do admin e consultas, sem depender de busca textual.

Flags, permissões de operador, carteira, selects, formulários, mensagens e fluxo de aceite não foram alterados. A action de aceite já recusava erro de Auth e permaneceu intacta.

## 2. Reprodução e verificação

Antes da correção, o teste novo reproduziu **2/5 PASS e 3/5 FAIL**:

- página pública criou admin e consultou o resumo com `user + error`;
- Pedidos aceitou `operador + error`;
- Pedidos aceitou operador sem e-mail confirmado.

Depois da correção:

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-sessao-paginas-contratacao.mjs
5/5 PASS

node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-acesso-contratado.mjs scripts/conferir-sessao-paginas-contratacao.mjs
13/13 PASS
```

Cobertura negativa: `user + error`, sessão ausente, e-mail não confirmado e papel ausente não alcançam admin/leitura. Cobertura positiva: destinatário confirmado consulta exatamente um resumo; operador confirmado consulta exatamente uma vez a carteira existente.

O typecheck consolidado ficou com a Central para evitar concorrência no arquivo incremental, conforme coordenação desta rodada. Nenhum processo alheio foi interrompido.

Bloco encerrado.
