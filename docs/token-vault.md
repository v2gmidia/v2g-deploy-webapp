# Token do Meta no Vault — fluxo definido

> **Documento de projeto. Nada aqui está implementado ainda** — a
> implementação vem no lote do OAuth. O que existe hoje é só a coluna
> `meta_connections.token_secret_id` (migration `0001`) e a proteção de
> leitura dela (migration `0003`).

## A decisão

**O app escreve, o N8N só lê.**

O app é quem tem o navegador do usuário, e o OAuth do Meta exige um
navegador — o consentimento acontece numa tela do Facebook, com redirect de
volta. O N8N não tem como conduzir esse fluxo. Além disso, concentrar a
escrita num só lugar significa um só ponto onde o token pode ser gravado
errado, e um só ponto para auditar.

## Por que Vault e não uma coluna

`clientes.meta_access_token` era `text` numa tabela. Com um token do Meta em
mãos, qualquer pessoa publica anúncios, gasta o orçamento e lê os dados da
conta do cliente. Uma coluna de tabela vaza por caminhos demais: policy mal
escrita, `service_role` usada onde não devia, dump de backup, um
`select=*` esquecido.

No Vault o valor fica cifrado em repouso com chave gerenciada pelo Supabase,
e não aparece em `select` nenhum — nem para `service_role` — sem passar pela
view `vault.decrypted_secrets`, que exige privilégio próprio.

## O caminho de escrita (app)

### Onde vive

```
app/auth/meta/iniciar/route.ts     ← monta a URL de consentimento e redireciona
app/auth/meta/callback/route.ts    ← recebe o `code`, troca por token, grava
lib/meta/oauth.ts                  ← troca de code por token, refresh, revogação
lib/meta/vault.ts                  ← wrappers de escrita/leitura do Vault
```

O callback é **Route Handler**, não Server Action: o Meta redireciona o
navegador para uma URL nossa com `?code=...&state=...`, e isso é uma
requisição GET vinda de fora. Server Action não atende esse formato.

Ambos ficam **fora** do grupo `(protected)` em termos de pasta, mas a rota
verifica a sessão por conta própria — o `proxy.ts` precisa continuar
deixando `/auth/*` passar para que o redirect do Meta chegue.

### O que o callback faz, em ordem

1. **Valida o `state`** contra o valor guardado em cookie assinado no passo
   `iniciar`. Sem isso, um terceiro consegue induzir o usuário logado a
   ligar a conta de anúncios *dele* ao negócio da vítima (CSRF de OAuth).
2. **Confere a sessão** (`supabase.auth.getUser()`) e resolve qual
   `business_id` está sendo conectado. Rejeita se o usuário não for dono —
   a mesma regra de `private.owns_business()`.
3. **Troca o `code` pelo token** no endpoint do Meta e, em seguida, troca o
   token de curta duração pelo **long-lived** (~60 dias). Guardar o de curta
   duração seria inútil: expira em horas.
4. **Grava no Vault** e recebe de volta o uuid do segredo.
5. **Escreve `meta_connections`** com `token_secret_id`, `meta_page_id`,
   `status = 'connected'`, `connected_at` e `expires_at`.
6. **Cria as `ad_accounts`** que vierem na resposta do Meta.

Os passos 4, 5 e 6 precisam ser **uma transação** — um token no Vault sem
linha em `meta_connections` vira segredo órfão que ninguém sabe que existe,
e uma linha sem token vira conexão que nunca funciona. Como o Vault é
acessível por SQL, isso é uma função no banco, chamada pelo callback:

```sql
-- private.conectar_meta(...) — a criar no lote do OAuth
-- security definer, set search_path = '', chamada só pelo backend
-- 1. vault.create_secret(token, nome_unico, descricao) -> uuid
-- 2. insert/update em public.meta_connections com esse uuid
-- 3. insert em public.ad_accounts
-- tudo numa transação só
```

O app chama essa função com o cliente **`admin`**
(`lib/supabase/admin.ts`, `service_role`) — nunca com a anon key. É o
primeiro uso real daquele arquivo, que hoje existe sem ser importado por
ninguém.

### Como `token_secret_id` é preenchido

`vault.create_secret()` devolve o uuid do segredo criado. Esse uuid — e só
ele — vai para a coluna. A coluna não guarda o token, nem um hash dele, nem
prefixo: guarda um ponteiro que é inútil sem privilégio de Vault.

Já garantido pela migration `0003`: um usuário autenticado que tente ler
`token_secret_id` recebe **HTTP 403**, e `select=*` nessa tabela também
falha. Testado, não presumido.

Nomeação do segredo: `meta_token_<business_id>` — determinístico, para que
reconectar a mesma conta atualize o segredo existente em vez de acumular
lixo no Vault.

## O caminho de leitura (N8N)

O N8N usa `service_role` e lê pela função:

```
POST /rest/v1/rpc/obter_token_meta
{ "p_business_id": "<uuid>" }
```

A função (a criar) é `security definer`, com `set search_path = ''`, e:

1. resolve `token_secret_id` a partir do `business_id`;
2. lê o valor em `vault.decrypted_secrets`;
3. devolve o token em texto;
4. registra o acesso.

**`EXECUTE` revogado de `anon` e `authenticated`.** Só `service_role`
chama. Isso não é detalhe: uma função que devolve token em texto exposta a
`authenticated` seria pior do que a coluna original, porque pareceria
segura.

O N8N deve **buscar o token na hora de usar**, não guardar em variável do
fluxo nem em credencial do N8N. Token revogado precisa parar de funcionar
imediatamente; cópia em cache derrota isso.

## Expiração e revogação

Três formas de o token morrer, com sintomas diferentes:

| Situação | Como se manifesta | Detecção |
|---|---|---|
| Expirou (~60 dias) | Meta responde erro 190, subcódigo 463 | `expires_at` no banco já indica antes de tentar |
| Cliente removeu o app no Facebook | erro 190, subcódigo 458 | só ao usar |
| Cliente trocou a senha do Facebook | erro 190, subcódigo 460 | só ao usar |

Nos três casos o token é irrecuperável: **não existe refresh silencioso no
Meta**. O usuário precisa refazer o consentimento no navegador. Por isso a
detecção precisa gerar um aviso visível, não um retry.

### Como o sistema detecta

**Preventivo:** uma rotina diária (`pg_cron`, já disponível no projeto)
marca `status = 'expiring'` nas conexões com `expires_at` a menos de 7 dias.
Dá margem para avisar antes de quebrar.

**Reativo:** todo ponto que usa o token — app ou N8N — ao receber erro 190
do Meta, atualiza `meta_connections`:

```
status      = 'revoked' | 'expired'
expires_at  = now()
```

O N8N precisa fazer isso também. É o único jeito de o app saber que a
conexão morreu, já que quem descobre primeiro costuma ser o fluxo
automático, não o usuário navegando.

O segredo no Vault **não é apagado** nesse momento — só marcado. Apagar na
hora atrapalha o diagnóstico ("o token estava lá quando parou?"). A limpeza
é uma rotina separada, depois de 30 dias em `revoked`.

### Como o usuário fica sabendo

Nesta ordem de prioridade:

1. **Faixa persistente no topo da tela de campanhas**, quando
   `status != 'connected'`. Não é um toast que some — é um estado do
   sistema e precisa continuar visível até ser resolvido.
2. **Botão "Reconectar conta do Meta"** na faixa, que leva direto para
   `/auth/meta/iniciar`. Sem isso o aviso é só uma reclamação.
3. **E-mail**, uma vez por evento, quando o status muda para `revoked` ou
   `expired`. Depende do SMTP próprio ([`smtp.md`](./smtp.md)) — com o SMTP
   de desenvolvimento esse e-mail não sai.

O texto precisa dizer o que parou de funcionar, não o erro técnico. Algo na
linha de "Sua conta de anúncios foi desconectada. Enquanto isso, suas
campanhas não recebem ajustes automáticos." — a consequência primeiro.

## O que fica pendente para o lote do OAuth

- [ ] App do Meta criado no `developers.facebook.com`, com as permissões
      `ads_management`, `ads_read`, `business_management`
- [ ] `META_APP_ID` e `META_APP_SECRET` no `.env.example` e na Vercel
- [ ] Rotas `/auth/meta/iniciar` e `/auth/meta/callback`
- [ ] Função `private.conectar_meta()` (transação escrita)
- [ ] Função `public.obter_token_meta()` (leitura, só `service_role`)
- [ ] Rotina `pg_cron` de expiração
- [ ] Faixa de reconexão na interface
- [ ] Combinar com o Gabriel o tratamento de erro 190 no fluxo do N8N —
      hoje ele não tem esse passo (ver [`n8n-repontamento.md`](./n8n-repontamento.md) §6)
