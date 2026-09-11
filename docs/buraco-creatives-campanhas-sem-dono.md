# `creatives` e `campaigns` são fonte que ninguém alimenta

Medido em 11/09/2026, no `ushccxpoxjikzqnwhgfd`. A cadeia do
`estadoDoCliente()` fecha duas das seis etapas lendo tabelas **locais** do
Supabase — `peca` por `creatives` com `uso='campanha'` e `copy` escrita,
`no_ar` por `campaigns.published_at` — enquanto quem faz o trabalho é o
backend, que **nunca escreve nessas duas**. `campaigns` tem zero linha na
tabela inteira (quem escreveria é o ciclo de `lib/meta/publicar.ts`, que foi
deployado e nunca executou), então `publicadaEm` é `null` para toda conta e
`no_ar` não fecha para ninguém — não é um caso isolado, é o predicado
inteiro. `creatives` recebe upload de logo e de foto de identidade por
`lib/identidade/armazenar.ts`, mas nada no repositório escreve
`uso='campanha'`: as quatro linhas que existem com esse uso são de um só
negócio (`a0328fb8`) e vieram da importação do Oregon. A conta da V2G
(`a85c37a9`) tem só logos — e, no mesmo dia, `tem_dado_da_plataforma: true`
com `investiu_centavos: 1025` no consolidado do backend, ou seja, a cadeia
local dizia que a peça não ficou pronta e o anúncio não subiu para quem já
tinha gastado R$ 10,25. É por isso que a `/inicio` aplica a regra de
evidência de `concluidasPelaVeiculacao()` em `lib/estado/frases.ts`, aplicada
por dentro de `montarEtapas()` e portanto valendo em toda tela: veiculação
comprovada fecha `peca` e `no_ar`. **A regra é remendo da leitura, não
conserto da fonte** — enquanto ninguém alimentar essas tabelas, toda conta
sem evidência de veiculação continua com as duas etapas presas em aberto, e
`nao_sabemos` (leitura que falhou) não fecha nada, de propósito.

> Corrigido em 11/09/2026, tarde: quando este parágrafo foi escrito a regra
> chamava `concluidasPeloGasto()`, era aplicada só na `/inicio`, e o gasto
> medido era a única prova. Passou a ter dois degraus — o campo `veiculacao`
> de `GET /negocios/{id}/execucao` como autoridade, e o gasto como reserva
> que só prova o PASSADO (`ja_foi_ao_ar`), nunca que está no ar agora. Nada
> disso muda o achado acima: as duas tabelas seguem sem quem as alimente.

O comando que mede, contra o banco de produção:

```sql
select
  (select count(*) from public.campaigns)                        as campaigns_total,
  (select count(*) from public.creatives
     where uso = 'campanha' and arquivado_em is null)            as pecas_de_campanha,
  (select count(*) from public.creatives
     where uso = 'campanha' and arquivado_em is null
       and business_id = 'a85c37a9-df57-4829-985b-41bc306f8537') as pecas_da_v2g;
-- 11/09/2026:  campaigns_total = 0 · pecas_de_campanha = 2 · pecas_da_v2g = 0
```

E o outro lado da contradição, por `GET` (só leitura):

```bash
curl -H "X-V2G-Token: $V2G_BACKEND_TOKEN" \
  "$V2G_BACKEND_URL/negocios/a85c37a9-df57-4829-985b-41bc306f8537/consolidado?profile_id=f5188fd0-b274-46e8-81ff-e8e275450b74"
# tem_dado_da_plataforma: true · investiu_centavos: 1025 · impressoes: 1657
```
