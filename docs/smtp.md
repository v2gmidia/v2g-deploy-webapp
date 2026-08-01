# SMTP de produção — Resend + `v2gmidia.com.br`

Passo a passo para o e-mail de autenticação sair de um remetente próprio.
Nada aqui foi executado por mim: é tudo painel e DNS.

## Por que precisa

O SMTP embutido do Supabase é explicitamente de desenvolvimento — poucos
envios por hora, e só para os endereços da própria equipe do projeto. Já
estourou nos testes: o cadastro devolveu `over_email_send_rate_limit` (HTTP
429) e a conta simplesmente não foi criada. Em produção, sem SMTP próprio,
os e-mails de confirmação e de recuperação de senha **não saem**.

## Estado atual do DNS (verificado)

Consultei `v2gmidia.com.br` no resolver local e no `8.8.8.8`:

| Registro | Estado hoje |
|---|---|
| `NS` | `b.sec.dns.br`, `c.sec.dns.br` — **DNS hospedado no Registro.br** |
| `A` | `216.198.79.1` (Vercel) |
| `MX` | **nenhum** |
| `TXT` na raiz | **nenhum** — não existe SPF |
| `TXT _dmarc` | **nenhum** |
| `TXT resend._domainkey` | nenhum |
| `send.v2gmidia.com.br` | nada |

**Conclusão sobre conflito: não há nenhum.** É o cenário mais limpo
possível — nenhum registro de e-mail existe para ser sobrescrito.

Dois pontos que decorrem disso e que valem saber antes de começar:

1. **Você vai mexer no painel do Registro.br**, não na Vercel nem na
   Cloudflare. Os nameservers `sec.dns.br` indicam zona hospedada lá, com
   DNSSEC ligado. Só use o editor de zona do Registro.br — mudar
   nameserver quebraria o apontamento do site.
2. **O domínio hoje não recebe e-mail** (zero MX). Se em algum momento
   alguém for criar caixa de entrada `@v2gmidia.com.br` (Google Workspace,
   Zoho, etc.), aí sim vai existir MX na raiz — e o MX que o Resend pede é
   num **subdomínio** (`send.`), então mesmo nesse futuro não haverá
   conflito. Só não vá apagar um pelo outro.

## Parte 1 — Conta no Resend

1. Crie a conta em `https://resend.com/signup`.
2. Menu **Domains** → **Add Domain**.
3. Domínio: digite `send.v2gmidia.com.br` (subdomínio, não a raiz).
   - Por que subdomínio: isola a reputação de envio transacional do
     domínio principal. Se algo der errado com entregabilidade, não
     contamina o `v2gmidia.com.br` que você usa para o resto.
4. Região: escolha **`sa-east-1` (São Paulo)** se estiver disponível na sua
   conta; senão `us-east-1`. O projeto Supabase `V2G-SITE` está em
   `sa-east-1`, então São Paulo reduz latência de envio.
5. O Resend mostra uma tela com **3 a 4 registros DNS**. Deixe essa aba
   aberta — você vai copiar de lá, não daqui.

## Parte 2 — DNS no Registro.br

Acesse `https://registro.br` → entre na conta → domínio `v2gmidia.com.br`
→ **DNS** → **Editar Zona**.

> **Importante sobre o formato:** o Registro.br pede o nome do registro
> **sem** o domínio no fim. Se o Resend mostrar
> `resend._domainkey.send.v2gmidia.com.br`, você digita apenas
> `resend._domainkey.send`. Colar o nome completo cria
> `...send.v2gmidia.com.br.v2gmidia.com.br`, que não resolve — é o erro
> mais comum nesse painel.

Os registros que o Resend vai pedir seguem este padrão. **Use sempre os
valores da tela do Resend**, não os de exemplo abaixo:

| Tipo | Nome (no Registro.br) | Valor | Observação |
|---|---|---|---|
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | SPF do subdomínio |
| `MX` | `send` | `feedback-smtp.sa-east-1.amazonses.com` prioridade `10` | bounces; a região precisa bater com a escolhida no passo 4 |
| `TXT` | `resend._domainkey.send` | `p=MIGfMA0GCSq...` (chave longa) | DKIM — copie inteiro, sem quebrar linha |

Depois de salvar, o Registro.br leva de alguns minutos a algumas horas para
propagar. Volte na tela de domínios do Resend e clique em **Verify DNS
Records** até os três ficarem verdes.

### DMARC (recomendado, não obrigatório)

Como não existe DMARC hoje, vale criar um em modo observação:

| Tipo | Nome | Valor |
|---|---|---|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:v2g.midia@gmail.com` |

`p=none` só coleta relatórios, não rejeita nada. Depois de algumas semanas
recebendo os relatórios sem surpresa, dá para endurecer para `p=quarantine`.

## Parte 3 — Chave de API no Resend

1. Resend → **API Keys** → **Create API Key**.
2. Nome: `supabase-v2g-site`.
3. Permissão: **Sending access** (só envio — não precisa de acesso total).
4. Domínio: restrinja a `send.v2gmidia.com.br`.
5. Copie a chave (`re_...`). **Ela aparece uma única vez.** Se perder, gere
   outra e apague a antiga.

## Parte 4 — Colar no Supabase

Painel do Supabase → projeto **`V2G-SITE`** (ref `ushccxpoxjikzqnwhgfd`) →
**Authentication** → **Emails** → aba **SMTP Settings** → ligue
**Enable Custom SMTP**.

Preencha exatamente assim:

| Campo | Valor |
|---|---|
| Sender email | `nao-responda@send.v2gmidia.com.br` |
| Sender name | `V2G` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a chave `re_...` da Parte 3 |
| Minimum interval between emails | `10` (segundos) |

Três observações sobre esses campos:

- **Username é literalmente a palavra `resend`**, não seu e-mail. É assim
  mesmo, é o padrão deles.
- **A senha é a API key**, não a senha da conta Resend.
- **Sender email precisa estar no domínio verificado** (`send.…`). Se você
  colocar `@v2gmidia.com.br` sem o `send.`, o envio falha na autenticação
  DKIM porque foi o subdomínio que você verificou.

Salve. O Supabase manda um e-mail de teste ao salvar — confira se chegou.

## Parte 5 — Ajustar os templates

Ainda em **Authentication** → **Emails**, aba **Templates**. Os textos
padrão são em inglês. Vale traduzir ao menos estes dois:

- **Confirm signup** — usado no cadastro
- **Reset password** — usado por `/recuperar`

Não mexa nas variáveis (`{{ .ConfirmationURL }}`, `{{ .Token }}`) — só no
texto ao redor.

## Parte 6 — Conferir a URL de retorno

**Authentication** → **URL Configuration**:

- **Site URL:** a URL de produção do app na Vercel.
- **Redirect URLs:** adicione `http://localhost:3000/**` (para desenvolver)
  e a URL de produção com `/**`.

Isso precisa bater com a variável `NEXT_PUBLIC_SITE_URL` do app — é ela que
monta o link de `/auth/confirmar` no e-mail de recuperação de senha (ver
`app/(public)/recuperar/actions.ts`). Se divergir, o link do e-mail leva
para o lugar errado e o Supabase recusa o redirect.

## Checklist

- [ ] Conta Resend criada
- [ ] Domínio `send.v2gmidia.com.br` adicionado, região `sa-east-1`
- [ ] 3 registros criados no Registro.br **sem o domínio no fim do nome**
- [ ] Resend mostrando os 3 verificados (verde)
- [ ] DMARC `p=none` criado (opcional)
- [ ] API key criada com escopo só de envio
- [ ] Custom SMTP ligado no Supabase e e-mail de teste recebido
- [ ] Templates de cadastro e de recuperação traduzidos
- [ ] Site URL e Redirect URLs conferidas contra `NEXT_PUBLIC_SITE_URL`
- [ ] Teste real: pedir recuperação de senha em `/recuperar` e receber o e-mail

## Quando isto estiver pronto

Me avise. O teste de cadastro pela interface ficou pendente no lote 2
exatamente por causa do rate limit do SMTP de desenvolvimento — com o
Resend no ar, dá para fechar essa verificação de ponta a ponta.
