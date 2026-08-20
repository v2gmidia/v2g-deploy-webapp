# Buraco — `opacity` decorativa comendo o contraste

**Achado no lote QA-4, medido, e deixado sem conserto de propósito.**
Registrado em 20/08/2026, contra o `app/globals.css` do commit `6834136`.

---

## O que é

```css
.rev-item.decidido { opacity: 0.72; }
```

Na `/revisar-proposta`, um campo que o cliente já decidiu fica apagado. A
opacidade multiplica tinta e fundo juntos, e derruba o contraste de tudo
que está dentro:

| elemento | fora do `.decidido` | dentro |
|---|---:|---:|
| `.rev-etiqueta`, `.rev-dica`, `.rev-quem`, `.rev-coluna` (claro) | 5,18 | **3,07** |
| os mesmos, escuro | 5,35 | **3,41** |
| `blockquote` (claro) | 7,06 | **3,55** |
| `.pill.ok` (claro) | 4,86 | **2,99** |
| `.pill.crit` (claro) | 4,89 | **3,14** |
| `.pill.crit` (escuro) | 5,99 | **3,80** |
| `.pill.info` (claro) | 6,64 | **3,88** |
| `.pill.off` (claro) | 4,52 | **2,90** |
| `.btn-linha.fraco` (claro) | 4,52 | **3,10** |
| `.btn-linha.forte` (claro) | 15,41 | **4,13** |

São **30 elementos no tema claro e 24 no escuro** — e, depois do QA-4,
são os **únicos** que restam abaixo do mínimo no app inteiro. Conferido
elemento a elemento com `el.closest('.rev-item.decidido')`: a lista dos
que falham fora dessa condição veio vazia, nos dois temas.

## Por que não foi consertado no QA-4

Três motivos, e o terceiro é o que decide.

1. **A fronteira do lote era cor.** `opacity` não é troca de token: é
   composição. Trocar `--ink-mute` conserta 200 elementos sem mexer em
   nada estrutural; mexer em `opacity` muda como um bloco inteiro se
   compõe com o que está atrás dele.

2. **A WCAG não é clara aqui.** A norma isenta *componente inativo*. Um
   campo já decidido continua sendo conteúdo que a pessoa pode querer
   reler — não é um botão desligado. Isento pela letra, provavelmente;
   ilegível pelo uso, com certeza.

3. **O apagado está dizendo alguma coisa.** `opacity` ali é sinal de
   estado: "isto já foi resolvido, não precisa da sua atenção". Consertar
   o contraste subindo a opacidade apaga o sinal. O conserto certo troca o
   **meio** de dizer "já resolvido" — e isso é decisão de desenho, não de
   cor.

## O que seria o conserto

Não é "subir para 0.85". Isso melhora o número e mantém o defeito de
classe: continua sendo opacidade global sobre conteúdo legível.

O caminho é dizer "já decidido" por outro meio, e devolver o contraste
cheio ao texto. Alguns que cabem no sistema como ele é hoje:

- um selo `.pill.ok` "decidido" no item, com o texto em tinta normal;
- a régua lateral do `.rev-plinha`, que já existe, num tom neutro;
- fundo levemente tingido no item, em vez de tinta apagada.

Qualquer um dos três é decisão de desenho da `/revisar-proposta`, e a tela
tem documento próprio: `revisao-perfil-cliente.md`.

## Como reproduzir a medição

A bancada do QA-4 está descrita em `contraste.md` §1. O caso aparece
sozinho: depois do QA-4, **toda** falha de contraste que sobra no app está
dentro deste seletor.

## Onde isto encosta

- `contraste.md` §4 (causa 6) e §14.2 — a medição completa.
- `revisao-perfil-cliente.md` — a tela, e por que o estado "decidido"
  existe.
