# Decisões — o canal humano → sessões

Decisões de produto e arquitetura tomadas **fora do Claude Code** (no chat, em
conversa entre os sócios, ou sozinho). Toda sessão lê este arquivo antes de
começar um lote.

**Precedência:** este arquivo vence qualquer briefing colado num prompt. Se um
prompt contradiz uma decisão registrada aqui, diga a contradição antes de
escrever código.

**Formato:** uma entrada por decisão, mais nova em cima. Registre o que foi
decidido, quem decidiu, e — quando houver — o que foi descartado e por quê.
Decisão sem data não vale; decisão sem motivo é ordem, não decisão.

---

## Em aberto — dependem de decisão humana

<!--
Sessões: quando esbarrarem numa decisão que não é de vocês, acrescentem aqui
em vez de escolher sozinhas. Removam a linha quando a decisão for registrada
na seção de baixo.
-->

- [ ] **A reserva de nicho fica ou sai?** Levantado pelo Victor em 22/08 com
      o motivo: *"lista fixa como fallback grava nicho que pode não existir
      mais, e o onboarding é a tela onde dado errado é mais caro."* O motivo
      é sólido e ninguém contestou.

      **Mas ele veio junto com uma premissa que não confere:** de que o
      endpoint fora do ar hoje derruba a página. **Não derruba** — a
      `page.tsx` faz `nichos.ok ? nichos.dados : null` e o `listarNichos()`
      nunca lança; verificado no navegador em 22/08 com as duas linhas
      `V2G_BACKEND_*` desligadas, e os cinco chips de reserva aparecem
      normalmente. Então "deixa como está" preserva exatamente a lista fixa
      que o motivo quer evitar.

      As saídas:

      - **(a) fica como está** — reserva + marcação `aproximacao` (migration
        `0021`). O dado errado entra, mas entra **marcado** como palpite, e
        fica abaixo de `confirmado` para agente poder corrigir. É o que o
        handoff §4 decidiu e o que está construído;
      - **(b) a reserva sai, e sobra o texto livre.** Endpoint fora → sem
        chips, só o campo "escreva do seu jeito". Nunca grava nicho que não
        existe, porque não grava nicho nenhum: grava a frase da pessoa, com
        procedência `confirmado`, que é verdade. Alinha com o motivo do
        Victor e **torna a `0021` desnecessária**;
      - **(c) a reserva sai e a pergunta fica indisponível** com um recado.
        Mais honesto e mais hostil: trava o onboarding por causa de um
        endpoint de catálogo.

      **Isto reverte um DECIDIDO** (handoff §4) e decide o destino da `0021`,
      que já está escrita. Por isso não escolhi sozinho. — levantado em 22/08
- [ ] **Trava de completude do cadastro: 6 campos ou 11?** O app conta 6, o
      backend exige 11 no modo `gerar`. Subir para 11 pode barrar cliente que
      hoje passa. — levantado em 22/08
- [ ] **`origem_criativo` está cravado em `lib/cadastro/montar.ts`.** Trocar por
      valor vindo do payload exige acrescentar pergunta ao onboarding, o que é
      mudança de produto. — levantado em 22/08
- [ ] **`.side-support`: card de vidro sobre cobalto ou card claro?** Muda
      aparência em 9 telas e bloqueia uma linha do `conferir:cascata`. —
      levantado em 21/08

---

## Decididas

### 2026-08-22 — `aproximacao`: a reserva se declara palpite
**Decisão:** fazer, com migration. Escolhida a saída (a) das três que
estavam registradas.
**O problema:** a `registrar_procedencia` (`0011`:41) recusava origem fora
de `('confirmado','manual','extraido')`, e a `confirmar_campo_do_cliente`
(`0016`:238) passava `'confirmado'` como literal, não como parâmetro. O
handoff §8 dizia que este lote não teria migration — as duas instruções não
cabiam juntas assim que o §4 entrou no escopo.
**Descartado:** (b) a reserva não escrever a coluna `niche`, que perde a
resposta como dado consultável; (c) marcar só no jsonb, que o §4 proíbe
explicitamente ("não numa flag nova").
**A parte que vale lembrar:** `aproximacao` fica **abaixo** de `confirmado`
sem ninguém programar isso — as travas da `0013` e da `0019` comparam com o
literal `'confirmado'`, então o palpite pode ser corrigido por proposta de
agente. Não "conserte" essas travas para incluí-lo.
**Registro:** migration `0021_aproximacao_da_reserva.sql` (escrita, **não
aplicada**), `docs/estado/seletor-de-nicho-22-08.md` §0.1.

### 2026-08-22 — Cache da lista de nichos: fora de escopo
**Decisão:** não cachear. A medição não justifica.
**A medição:** `GET /nichos` responde em **17 ms de mediana** (60 ms a
frio), 3,8 KB, dez nichos. A busca é feita no servidor e a lista já vai
dentro do HTML: TTFB de **36–50 ms** quente, HTML completo 3 ms depois,
com os dez chips **e** o campo de busca presentes na primeira pintura.
Não há atraso perceptível para cachear.
**O que seria feito se um dia valer:** cache manual em memória com TTL
curto — não `unstable_cache`, para a invalidação ficar uma linha legível.
E a regra que vem junto: **vencido o TTL sem resposta do backend, entra a
reserva, nunca o valor velho** — senão vira o fallback estático que o
handoff §10 proíbe, que é a lista paralela envelhecendo em silêncio.
**Registro:** `lib/backend/nichos.ts`, no ponto onde se implementaria;
medição em `docs/estado/seletor-de-nicho-22-08.md` §2.

### 2026-08-22 — Cartão do herói da LP: marcar como exemplo
**Decisão:** manter os números e o nome, acrescentando a tarja
`EXEMPLO — tela de demonstração, não é resultado de cliente` como primeiro
elemento do cartão.
**Descartado:** remover o cartão (perderia a prova visual) e inventar número
novo (afirmação falsa numa página de vendas no ar).
**Registro:** commit `df19ec0` na LP, detalhe em `lp/docs/prova-social-e-legibilidade.md` §7.1.
