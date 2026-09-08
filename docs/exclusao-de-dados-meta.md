# Desautorização e exclusão de dados — os dois callbacks da Meta

A Meta não publica app sem duas URLs, e sem app publicado não dá para
atuar em conta de cliente. Este documento é o que elas fazem, o que
"excluir os dados" significa aqui, e o que **não** é apagado.

Escrito em 04/09/2026, com o schema medido no banco real antes de cada
afirmação.

**A migration `0021` não foi aplicada por esta sessão.** Ver
`docs/migration-no-repo-nao-e-migration-aplicada.md`.

---

## 0. Comece por aqui: a regra que governa as duas rotas

**Endpoint que devolve 200 e não faz nada é conformidade declarada, não
conformidade.** A promessa existe, o efeito não, e de fora os dois são
indistinguíveis.

É a versão jurídica do padrão que o backend catalogou no `CLAUDE.md` §11.1
— **ausência de medição e ausência de dado saindo iguais**. Lá, "não medi"
e "medi e deu zero" chegam à tela como o mesmo silêncio. Aqui, "apagamos" e
"não apagamos" saem pela mesma porta com o mesmo 200.

O que quebra o empate nos dois casos é a mesma coisa: **fazer o resultado
ser lido**. `apagar_dados_da_meta` devolve a contagem do que saiu, a
contagem fica na `exclusoes_de_dados`, e a página do código mostra. Se
apagou zero, a página diz zero — em vez de fingir trabalho.

---

## 1. As três rotas

| rota | quem chama | o que faz |
|---|---|---|
| `POST /auth/meta/desautorizar` | a Meta, sem sessão | tira o acesso |
| `POST /auth/meta/exclusao-de-dados` | a Meta, sem sessão | apaga e registra |
| `GET /exclusao-de-dados/<codigo>` | uma pessoa, no navegador | mostra o que saiu |

As duas primeiras moram sob `app/auth/meta/` porque é onde o protocolo da
Meta já vive (`iniciar`, `callback`), e porque **`/auth` não está em
`PROTECTED_PREFIXES`** — obrigatório, já que a Meta chama sem sessão.

**Cuidado ao preencher o painel da Meta:** já existe
`v2gmidia.com.br/exclusao-de-dados.html`, estático, no repositório `lp`.
Ele **não serve** — não recebe `POST` e não apaga nada. A URL do painel é
a do webapp. As duas coexistem: a do `lp` explica a política, a do webapp
executa.

---

## 2. Desautorizar ≠ excluir

**Desautorizar** é "tirei o app do meu Facebook". Some o ACESSO: o token
sai do Vault, a conexão vira `revoked`, as contas de anúncio ficam
marcadas, e a faixa de reconexão aparece. **Os dados ficam.**

**Excluir** é "apaga o que você pegou de lá".

Tratar as duas como a mesma coisa destruiria o histórico de um cliente
ativo porque ele mexeu numa configuração do Facebook.

---

## 3. O que "excluir os dados" significa — medido

### O que sai

| onde | o que veio da Meta | linhas em 04/09 |
|---|---|---|
| `vault.secrets` | o access token, `meta_token_<business_id>` | 1 |
| `meta_connections` | a linha inteira: page id, instagram id, meta user id, scopes, expiração | 1 |
| `ad_accounts` | as linhas — a lista veio da Graph API | 3 |
| `metrics_daily` | as linhas — impressões, cliques, gasto, conversões, receita | 0 |
| `campaigns` | `external_campaign_id`, `meta_status` | 0 preenchidos |
| `creatives` | `external_adset_id`, `external_creative_id`, `external_ad_id`, `meta_status` | 0 preenchidos |

**Hoje o conjunto é pequeno porque nada foi publicado e o coletor está
desligado.** Isso muda no dia da primeira publicação, e aí `metrics_daily`
vira o volume — o que também é o gatilho para a rota virar fila (§6).

`campaigns.published_at` **fica**, de propósito: é o carimbo da nossa
própria ação, não um dado que a Meta nos deu. Apagá-lo deixaria
`status = 'published'` sem data, que é pior que a verdade.

### O que fica

E é muita coisa — por isso a página de status diz em voz alta:

- **`businesses` inteiro** — nome, nicho, verba, WhatsApp, oferta
- `entrevistas`, `narrativa_negocio`, `pessoas_do_negocio`,
  `propostas_de_perfil`, `itens_da_proposta`, `divergencias_de_cadastro`
- `creatives` sem as colunas `external_*`: `file_name`, `storage_path`,
  `vision_description`, `copy` — e os arquivos no Storage
- `identidade_visual`, `offers`, `analysis_runs`, `decisions`
- `profiles` e o usuário em `auth.users`
- no backend: execuções, `respostas_do_dono`, `perguntas_apresentadas`

Nada disso veio da Meta. O cliente digitou ou enviou.

### Por que o escopo é estrito

Decisão do Victor, 04/09/2026: **o endpoint não apaga a conta.**

O `signed_request` prova que quem pediu é o mesmo usuário do Meta — não
prova que ele quer perder a conta que paga R$ 490/mês. Apagar tudo por um
clique dentro do Facebook, sem confirmação e sem desfazer, é destrutivo
demais para uma ação que a pessoa pode ter feito sem entender.

**Prometer menos e cumprir por inteiro é melhor que prometer tudo e ter
que segurar.** A página de status diz o que ficou e como pedir o resto.

---

## 4. A convergência entre a desautorização e o botão da `/conta`

`desautorizar_meta()` é a função que o botão de desconectar da `/conta`
vai chamar quando existir — por negócio em vez de por usuário do Meta. É
o que impede o estado da desautorização automática divergir do estado que
uma pessoa cria à mão.

A promessa desse botão já está registrada em
`app/(fluxo)/conectar/page.tsx`, que documenta que a frase foi corrigida
porque o controle não existia, e que quando existir mora na `/conta`.

**Ao conferir isso, apareceu uma divergência de outro tipo, já corrigida:**
`app/(protected)/conta/page.tsx` comparava `status === "active"`. A CHECK
da 0005 permite cinco valores e `active` não é um deles — a condição era
sempre falsa, e o seletor de página nunca carregava a lista para quem
tinha conexão boa. A tela lia um estado que o banco não escreve.

**Dívida registrada, não consertada:** `/conectar/page.tsx` compara
`=== "connected"` para o mesmo assunto, e nenhuma das duas considera
`expiring` — que tem token válido. São duas telas decidindo sozinhas o
que "a conexão serve" quer dizer. O conserto é extrair o predicado, e ele
não cabe num lote de conformidade com a Meta.

---

## 5. A chave de junção, e por que ela foi consertada primeiro

O callback chega com o `user_id` do Meta. É por ele que se acha o que
apagar — `meta_connections.meta_user_id`.

`lib/meta/oauth.ts` gravava `d.user_id ?? ""`. **Vazio casa com todos os
outros vazios:** o pedido de uma pessoa varreria a conexão de todas as
que também vieram sem id. Com um cliente não morde; com dez, morde uma vez
e não dá para desfazer.

Agora são duas camadas: `TokenSemDono` recusa a conexão no app, e a CHECK
`meta_connections_meta_user_id_nao_vazio` recusa no banco. `null` continua
permitido — são as linhas anteriores à 0005, e barrá-las exigiria backfill
de dado que não existe. O que se barra é o `''`, que é o valor que **mente**:
parece preenchido e não identifica ninguém.

Medido antes de trocar: 1 linha, `meta_user_id` preenchido, zero vazias. A
constraint entra sem backfill.

**N conexões, nunca `maybeSingle`.** Um mesmo usuário do Meta pode ter mais
de um negócio conosco, e não há (nem deve haver) índice único em
`meta_user_id`. As duas funções varrem em laço.

---

## 6. O que ainda não é verdade

**Apaga na hora, não em fila.** Fila daria resposta mais rápida e criaria
um estado — "pedido aceito, nada apagado" — que precisaria de alguém para
drenar, e não há esse alguém no webapp. Enquanto o conjunto for pequeno,
apagar na hora é o desenho honesto. **O gatilho para virar fila é o
coletor da Meta ligar**, não uma data: aí `metrics_daily` cresce e
`concluido_em` nulo passa a ter significado, que hoje ele só tem em caso
de erro.

**A exclusão total é por pedido humano.** A página diz "mande uma mensagem
com esse código". Não existe rota que apague a conta inteira, e enquanto
não existir, quem cumpre é uma pessoa — o mesmo modelo do desconectar de
hoje.

**Nenhuma das duas rotas foi exercitada contra a Meta.** O que está
conferido é a porta: `pnpm conferir:signed-request`, 20 asserções, com os
casos de assinatura trocada, `algorithm: none`, payload adulterado e
`META_APP_SECRET` ausente. O que as funções apagam de fato só o banco
responde, e a 0021 não foi aplicada.
