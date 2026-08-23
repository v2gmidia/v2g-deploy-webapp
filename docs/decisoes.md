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

### 2026-08-22 — A reserva de nicho sai; sobra o texto livre
**Decisão:** com o `GET /nichos` fora, a tela não mostra chip nenhum. Só o
campo de texto, mais uma linha dizendo que a lista não carregou.
**Motivo (Victor):** *"quando o catálogo está fora, a verdade é que não
sabemos o nicho. Gravar a frase da pessoa como confirmado é honesto; gravar
um dos cinco chips fixos é palpite com cara de escolha do cliente."* É o
mesmo princípio do `padaria` não achar nada: não inventamos o vizinho mais
próximo, admitimos que não temos.
**Descartado:** manter a reserva marcando a escolha como `aproximacao` — a
decisão de algumas horas antes, revertida abaixo. E travar a pergunta com
um recado de indisponível, que seria hostil: trava o onboarding por causa
de um endpoint de catálogo.
**A linha na tela é parte da decisão, não enfeite:** "escreva do seu jeito"
sozinho parece que nunca houve lista, e a pessoa conclui que o produto é
assim. Dizer que a lista não carregou é a diferença entre uma falha nossa e
uma limitação nossa.
**Registro:** `lib/nichos/escolha.ts`, o comentário da pergunta `ramo` em
`perguntas.ts`, e o estado degradado em `Chat.tsx`. Conferências em
`conferir:nichos` §8 — inclusive uma que impede a pergunta `ramo` de voltar
a ter opção fixa.

### 2026-08-22 — `aproximacao`: REVERTIDA no mesmo dia
**Decisão original:** marcar como `aproximacao` a escolha feita nos chips de
reserva, com a migration `0021` alargando o domínio de procedência.
**Revertida** pela decisão acima, algumas horas depois: sem reserva, não há
o que marcar. A migration `0021` foi apagada antes de ser aplicada, e o
parâmetro `p_origem` saiu do `lib/cadastro/procedencia.ts`.
**Fica registrado porque a ideia era boa e pode voltar:** se um dia existir
uma fonte de nicho que seja palpite legítimo — extração de site, por
exemplo — o desenho está descrito aqui. E fica a observação que valia:
`aproximacao` ficaria **abaixo** de `confirmado` sem ninguém programar isso,
porque as travas da `0013` e da `0019` comparam com o literal `'confirmado'`.
**O que sobrou dela:** nada no código. `confirmar_campo_do_cliente` continua
com a assinatura de cinco argumentos da `0016`.

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
