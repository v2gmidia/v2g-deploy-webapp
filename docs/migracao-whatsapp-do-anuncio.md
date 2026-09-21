# O WhatsApp do anúncio — a coluna, e o que precisa vir junto

Escrito na madrugada de 20/09/2026. **Nada foi aplicado.**

## 1. O que o onboarding novo pede, e o que já existe

Onze perguntas. Dez já têm onde morar — e duas delas eu tinha registrado
como faltantes por engano:

| pergunta | destino | existe? |
|---|---|---|
| 1. nome da pessoa | `profiles.full_name` | **sim**, `0001_init.sql:51` |
| 2. nome da empresa | `businesses.name` | sim, `0001_init.sql:93` |
| 3. CEP | `businesses.cep` | sim, `0010_perfil_empresa.sql` |
| 3. raio | `businesses.radius_km` | **sim**, `0001_init.sql:56` |
| 4. o que vende | `businesses.description` | sim, `0001_init.sql:96` |
| 5. Instagram | `businesses.instagram_handle` | sim, `0010` |
| 6. site | `businesses.site_url` | sim, `0010` |
| 7. tipo de negócio | `businesses.niche` | sim, `0001_init.sql:94` |
| 8. **WhatsApp que recebe cliente** | `businesses.whatsapp_do_anuncio` | **NÃO** |
| 9. investimento | `businesses.monthly_budget` | sim, `0001_init.sql:102` |
| 10. logo e fotos | Supabase Storage | não é coluna |
| 11. conectar Facebook | `meta_connections` | não é coluna |

**A DUVIDA-ONB-7 estava errada.** Ela dizia que três colunas faltavam;
falta uma. `full_name` e `radius_km` existem desde a migration inicial —
eu olhei o catálogo de extração (`lib/agentes/campos.ts`) em vez do
schema, e o catálogo não lista as duas porque nenhuma delas vem da
conversa com o agente.

## 2. Por que não serve `profiles.whatsapp`

Ela existe (`0001_init.sql:52`) e é **outro fato**: o número da PESSOA que
tem a conta, por onde a V2G fala com ela. O da pergunta 8 é o número do
NEGÓCIO, para onde o anúncio manda quem clicar.

Na maioria dos casos é o mesmo número digitado duas vezes. Mesmo assim:

- o dono troca de celular pessoal e o anúncio não pode mudar junto;
- uma agência que administra o negócio tem o próprio contato, e o anúncio
  continua apontando para o cliente;
- um negócio com dois sócios tem um número de atendimento e dois de
  pessoa.

## 3. O que já está escrito

`supabase/migrations/0022_whatsapp_do_anuncio.sql` — acrescenta a coluna e
o `comment on column`. **Não aplicada.**

Ela foi declarada em `supabase/objetos.ts`, como o
`conferir:migrations` exige. **E é por isso que esse conferidor está
vermelho:** ele lê o schema VIVO, e a coluna não está lá. Ele fica verde
no instante em que alguém rodar `pnpm db:migrate` — é o serviço dele, e
é o que `docs/migration-no-repo-nao-e-migration-aplicada.md` descreve.

## 4. O que NÃO está escrito, e por que não entra sozinho

A coluna existir **não** deixa o cliente editá-la depois. Para isso ela
precisa entrar na lista branca da `confirmar_campo_do_cliente` — e essa
lista não entra sozinha. Ela vem com três peças na mesma leva:

1. **uma migration** que reescreve a função inteira com a coluna nova (a
   0016 explica por que reescrever inteira: não há `ALTER` para um literal
   de array dentro de um corpo plpgsql);
2. **`lib/agentes/campos.ts`**, o catálogo do que a tela mostra — ou, se o
   campo NÃO for de extração,
3. **`scripts/conferir-lista-branca.ts`**, em `EXTRAS_ESPERADOS`, com o
   motivo escrito, como `radius_km` já está.

Sem 2 ou 3, `pnpm conferir:lista-branca` fica vermelho. **Não escrevi
nenhuma das três** porque a rodada da madrugada estava proibida de tocar
código de produção fora de CSS.

### 4.1 Qual dos dois caminhos: catálogo ou extra?

**Recomendo `EXTRAS_ESPERADOS`.** O catálogo é o que o agente de extração
tenta preencher a partir da conversa, e número de telefone ditado numa
ligação é justamente o que a transcrição erra — é o mesmo motivo pelo qual
o onboarding não aceita o WhatsApp por áudio (DUVIDA-ONB-2). O número deve
vir de um campo com máscara, digitado, e não de extração.

`radius_km` já está lá pelo mesmo tipo de razão: vem de formulário, não de
conversa.

### 4.2 A migration que falta, pronta para colar

Ela é cópia mecânica da 0016 com **uma linha** a mais no array de
`businesses`, exatamente como a 0016 foi cópia da 0015:

```sql
-- 0023 — `whatsapp_do_anuncio` entra na lista branca do cliente
--
-- UMA LINHA DE DIFERENÇA para a 0016. A 0022 criou a coluna; esta deixa o
-- cliente corrigi-la pela /meu-negocio. Sem ela o número só é gravável
-- por service_role, o que basta para o onboarding e não basta para
-- "mudar o número depois".
--
-- A função é reescrita INTEIRA, e não remendada — o motivo está no topo
-- da 0016. O `git diff` entre os dois arquivos tem que mostrar só a linha
-- nova e a contagem do comentário.

-- Copie o corpo inteiro de 0016_lucro_desejado_na_lista_branca.sql e, no
-- array de `businesses`, troque o bloco final por:

--    -- e os três que saíram de formulário e não vêm de extração
--    'name', 'radius_km', 'whatsapp_do_anuncio'
```

E, junto, em `scripts/conferir-lista-branca.ts`:

```ts
const EXTRAS_ESPERADOS = ["radius_km", "whatsapp_do_anuncio"];
```

com o motivo no comentário: **vêm de formulário com máscara, não de
extração — número ditado é o que a transcrição mais erra.**

## 5. O formato guardado, e por que não é E.164

A coluna guarda **como o cliente digitou**, com máscara:
`(15) 99876-5432`. Quem precisar de E.164 para a Meta converte na leitura.

Guardar o formato de uma integração dentro da coluna faz a segunda
integração herdar a escolha da primeira — e o cliente que abrir a
`/meu-negocio` veria `+5515998765432`, que não é o que ele digitou. O
mesmo critério vale para o `cep`, que já é guardado como `00000-000`.

## 6. Onde isso está ligado no código

`app/exemplo/_onboarding/destino.ts` — o mapa das onze perguntas para as
colunas, com `colunaExiste` e `naListaBranca` por campo. Ele **não
escreve nada**: diz o que seria escrito. `?destino=1` na bancada mostra a
tabela na tela, e 26 conferências exercitam o mapa fora do navegador e
fora do banco.

Quando a 0022 rodar, é uma linha: `colunaExiste: false` vira `true`.
