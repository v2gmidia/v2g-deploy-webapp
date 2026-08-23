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

### 2026-08-22 — Cartão do herói da LP: marcar como exemplo
**Decisão:** manter os números e o nome, acrescentando a tarja
`EXEMPLO — tela de demonstração, não é resultado de cliente` como primeiro
elemento do cartão.
**Descartado:** remover o cartão (perderia a prova visual) e inventar número
novo (afirmação falsa numa página de vendas no ar).
**Registro:** commit `df19ec0` na LP, detalhe em `lp/docs/prova-social-e-legibilidade.md` §7.1.
