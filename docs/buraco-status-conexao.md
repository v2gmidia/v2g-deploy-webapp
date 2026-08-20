# Buraco — a `/conta` compara `status` com um valor que o banco não escreve

**Medição de 20/08/2026.** Documento de medição: não se atualiza. Se o
defeito for consertado, o conserto é registrado abaixo da linha, sem apagar
o que está aqui.

Encontrado ao medir o lote QA-2 (`estado-do-cliente.md` §0.6). **Não é D3 nem
D4, e não foi consertado lá.** Está separado porque é bug vivo, de outra
família.

---

## 1. O que foi medido

No banco, a única linha de `meta_connections`:

```
business_id = a85c37a9-df57-4829-985b-41bc306f8537
status      = 'connected'
meta_page_id= '847147288492237'
last_error  = null
```

No código, dois lugares comparam esse campo, com valores diferentes:

| arquivo | comparação | resultado hoje |
|---|---|---|
| `app/(fluxo)/conectar/page.tsx:31` | `conexao?.status === "connected"` | **verdadeiro** |
| `app/(protected)/conta/page.tsx:81` | `conexao?.status === "active"` | **falso** |

Não há nenhum lugar no repositório que escreva `'active'` em
`meta_connections.status` — conferido por grep em `app/` e `lib/`.

**E não pode haver.** A `0005_oauth_meta_conexao.sql:46` fecha o domínio da
coluna por check constraint:

```sql
check (status in ('disconnected', 'connected', 'expiring', 'expired', 'revoked'))
```

`'active'` não está na lista. O banco **recusaria** a gravação. Então não é
"hoje está com outro valor" — a comparação da `/conta` é **provadamente
morta**: ela nunca foi verdadeira e nunca vai ser.

---

## 2. A consequência

O bloco da `/conta` que lista as páginas do Facebook está dentro de
`if (conexao?.status === "active")`. Com o banco escrevendo `'connected'`, a
chamada a `listarPaginas` nunca acontece, `paginas` fica `[]`, e a seção
inteira — *"De qual página seus anúncios saem"* — **não é renderizada**
(`conta/page.tsx:172`, guardada por `paginas.length > 0`).

Ou seja: **a tela de trocar de página nunca aparece para ninguém.** O único
caminho que sobra para o cliente que precisa trocar a página é refazer o
OAuth inteiro — que é exatamente o que aquele bloco foi escrito para evitar,
e o comentário no arquivo diz isso com todas as letras:

> "Antes, o único caminho era reconectar tudo — desproporcional para mudar um
> campo, e cada passagem pelo Facebook é uma chance de o cliente recusar ou
> cair num erro."

O defeito não produz erro em lugar nenhum. A tela renderiza, não quebra, não
loga. Ela só é menor do que devia — que é a forma de falha mais difícil de
notar, porque nada acontece.

---

## 3. A classe do defeito

É um `if` sobre um valor de domínio que existe em dois lugares como **string
solta**. Nenhum dos dois lados está errado sozinho: `/conectar` está certo,
`/conta` está errado, e o TypeScript não tem como saber — `status` é `text`
no banco e `string` no tipo gerado.

É a mesma família do que este projeto já registrou: partes certas isoladas,
sem dono da regra inteira. O conserto barato é trocar `"active"` por
`"connected"`; o conserto que não volta é um só lugar que saiba quais são os
estados de conexão, do jeito que `montarCadastro` é o único lugar que sabe o
que é cadastro completo.

Vale notar que a `FaixaReconectar` lê o mesmo campo e não cai no buraco: ela
usa um mapa de estados (`expired`, `revoked`, `expiring`) e trata ausência
como "nada a dizer". Ela é o precedente do formato certo.

---

## 4. O que NÃO foi verificado

- Se `listarPaginas` funciona com o token de hoje. O caminho nunca executou,
  então o erro seguinte — se houver — está escondido atrás deste.
- Quais são todos os valores que `status` pode assumir. Foram vistos
  `'connected'` no banco e `expired`/`revoked`/`expiring` no código da
  faixa; não foi feito o levantamento de quem escreve cada um.

Quem for consertar precisa dos dois, e o segundo antes do primeiro.
