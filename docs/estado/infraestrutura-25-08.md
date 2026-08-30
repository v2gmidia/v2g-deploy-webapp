# O inventário da infraestrutura — medido em 25/08

**Este documento não registra uma sessão de código.** Ele registra o
**lote 1 do plano do dia**: os valores de infraestrutura que as páginas
legais afirmam e que estavam em branco. Nada aqui foi decidido — tudo foi
lido em painel, em varredura de repositório ou em resposta de rota.

Nenhuma ação proibida foi executada para produzir isto: nenhuma escrita em
painel, nenhuma migration, nenhum `POST /cadastro`, nenhuma chamada à Meta.
As medições que envolveram painel foram feitas pelo Victor; as que
envolveram repositório, por sessão de Claude Code.

**Convenção de fonte.** Todo item está marcado `medido`. Quando a tela ou o
comando exato foi registrado, ele aparece na coluna *fonte*. Quando o valor
foi medido em painel mas a tela específica não ficou registrada, a coluna
diz **painel do provedor — tela não registrada**. A distinção existe porque
este documento vai virar insumo de revisão jurídica, e "sei que é assim" e
"sei onde vi" não valem a mesma coisa.

---

## 0. Comece por aqui: o que depende de você

Este documento é insumo do **lote 2** — o e-mail ao advogado. Quatro itens
dele são pergunta para humano, não pendência técnica:

1. **O prazo de retenção de backup não é declarado pelo fornecedor.**
   A janela observada no VPS é de duas cópias semanais com sobrescrita
   automática (§2). Observação não é garantia contratual: a Hostinger pode
   passar a guardar mais cópias sem avisar. A política afirma exclusão em
   30 dias.

2. **Cinco subprocessadores não estão declarados na política** (§4):
   Hostinger, Zoho, ViaCEP, Nominatim, e Amazon SES quando o Resend entrar.

3. **Dois provedores declarados estão inertes** (§5), e é decisão de quem
   escreve a política se um provedor sem código em execução deve constar.

4. **O banco e o storage do Supabase não têm cópia nenhuma** (§2). Não é
   pergunta jurídica; é risco operacional, e está aqui porque foi medido
   junto.

---

## 1. Onde cada coisa roda

| o quê | onde | estado | fonte |
|---|---|---|---|
| backend + n8n | VPS Hostinger `srv1298329`, **"Brazil - Campinas"** | `medido` | painel hPanel da Hostinger |
| webapp | Vercel, região **`gru1`** (São Paulo), alterada em 25/08 | `medido` | painel do provedor — tela não registrada |
| banco, auth, storage | Supabase **V2G-SITE**, **`sa-east-1`**, plano free | `medido` | painel do provedor — tela não registrada |
| e-mail | Zoho, datacenter **EUA** | `medido` | o painel abre em `zoho.com` |

### Não existe Google Cloud

`medido`. A varredura cobriu os **dois** repositórios e deu zero para todos
os marcadores de GCP — `GOOGLE_APPLICATION_CREDENTIALS`, `service_account`,
`storage.googleapis.com`, `gs://`, `google-cloud-`, `google.cloud`,
`bigquery`, `firestore`, `pubsub`, `gcr.io`, `artifactregistry`,
`cloudfunctions`, `appspot`, `compute.googleapis`.

| repositório | commit | arquivos versionados | resultado |
|---|---|---|---|
| `backend_v2g` | `a1d6196` | 185 | zero |
| `webapp` | `90a4103` | 378 | zero fora de `docs/` |

O único hit no `webapp` é `supabase/config.toml:391` — uma linha comentada
do template que o CLI do Supabase gera sozinho (`# Configure one of the
supported backends: postgres, bigquery`). Boilerplate, não uso.

O que existe é **Google Ads API, Tag Manager API e Analytics Data API** —
OAuth de usuário, não credencial de Cloud. Ver §5.

---

## 2. Backup

| alvo | política | fonte |
|---|---|---|
| Supabase — banco | **zero**, plano free | `medido` — painel do provedor, tela não registrada |
| Supabase — storage | **sem cópia em nenhum plano** | `medido` — painel do provedor, tela não registrada |
| VPS Hostinger | **semanal**, sobrescrita automática | `medido` — painel hPanel |
| snapshots manuais | **zero** | `medido` — painel hPanel |

As duas cópias presentes no VPS, `medido` no hPanel:

| cópia | quando | local |
|---|---|---|
| 1 | 2026-08-17 01:07 | Brasil |
| 2 | 2026-08-10 01:03 | Brasil |

E o item que importa para a política: **o prazo de retenção em dias não é
declarado pelo fornecedor.** O painel diz que "backups antigos são
substituídos automaticamente" e não diz em quanto tempo.

---

## 3. Provedores de IA

| provedor | para quê | estado | fonte |
|---|---|---|---|
| Anthropic | texto | em runtime | `medido` — `/saude` confirma `mocks false` |
| OpenAI | imagem, `gpt-image-1` | em runtime | `medido` — `/saude` confirma `mocks false` |

**São dois, não um.** O plano do dia partia da hipótese de que a Anthropic
seria o único provedor de IA em uso.

---

## 4. Subprocessadores não declarados na política

`medido`. Cinco, e nenhum deles consta hoje:

| subprocessador | observação |
|---|---|
| Hostinger | onde backend e n8n rodam (§1) |
| Zoho | MX do domínio, datacenter EUA (§1) |
| ViaCEP | recebe CEP do cliente — sem contrato e sem credencial |
| Nominatim | recebe endereço do cliente — sem contrato e sem credencial |
| Amazon SES | entra quando o Resend entrar |

---

## 5. Declarados, mas inertes

| provedor | estado | fonte |
|---|---|---|
| Pagar.me | variáveis vazias, **zero código** | `medido` |
| Google Ads / GTM / GA4 | **o código existe, as rotas não estão publicadas** até o deploy de 25/08 | `medido` |

---

## 6. Outros achados

1. **O SMTP customizado do Supabase está DESLIGADO.** `medido`. A
   autenticação sai pelo SMTP de desenvolvimento.

2. **O projeto Oregon (`cvwxfalweuplrlchzzeo`) foi apagado em 24/08.**
   `medido`.

3. **`privacidade@v2gmidia.com.br` era publicado sem a caixa existir.**
   `medido`. O alias foi criado em 25/08, apontando para `v2gcentral`.
