# Controles desabilitados de propósito — 14/09/2026

**Só relatório.** A decisão sobre cada um é do Victor. Nenhum código mudou
por causa deste arquivo.

## Quantos são

O pedido falava em 5. A contagem do JSX real deu 8 com `disabled` fixo no
código: 6 botões e 2 campos.
```
$ node extrair-controles-v2.cjs botoes|campos → filtro disabled === "sempre"
disabled fixo: 8
disabled condicional: 34
```
Uma leitura possível do "5": em `docs/botoes.md` §1.2 aparecem como
desabilitados o B9 (3 botões) e o B10 (2). O `aprovar/page.tsx:151` também é
desabilitado, mas foi agrupado no B8 porque tem a mesma aparência do
`cta ghost` habilitado. Os 2 campos não entram naquela tabela de botões.

Ficam fora deste relatório:

- **Os 34 `disabled` condicionais**, como `disabled={enviando}`. Eles só
  ficam parados enquanto algo está em andamento.
- **Os 6 `aria-disabled="true"` de `app/(protected)/saude-meta/page.tsx`**
  (linhas 159, 369, 380, 390, 399 e 410). São `<div class="acct-row">` numa
  tela de operador, não controles.
  ```
  $ grep -rnE "aria-disabled" app components --include=*.tsx
  ```

Os números de linha abaixo são do código de hoje, que já inclui o commit
`0f1d23a`.

## Os 8

| # | Arquivo:linha | Controle | O que faria | Há texto na tela explicando por que está parado? |
|---:|---|---|---|---|
| 1 | `app/(fluxo)/aprovar/page.tsx:148` | botão "Pode ir ao ar" | Aprovar a peça para subir. Não tem `onClick` nem `form`. | **Sim.** Logo acima, a caixa `.trust` (linhas 132–145) diz: "A aprovação ainda não está ligada. Falta a parte que guarda a sua resposta e coloca a peça na fila." Oferece o WhatsApp como alternativa. |
| 2 | `app/(fluxo)/aprovar/page.tsx:151` | botão "Quero mudar alguma coisa" | Pedir mudança na peça. Não tem `onClick` nem `form`. | **Sim**, o mesmo texto do item 1, que vale para os dois botões. |
| 3 | `app/(fluxo)/onboarding/contas/Contas.tsx:401` | botão "Continuar para o visual da marca" | Seguir para o passo 2 do onboarding. Não tem `onClick`. | **Sim.** O `<p class="form-notice">` logo acima diz que "o passo 2 (o visual da sua marca) ainda não está disponível — assim que estiver, é daqui que ele continua". |
| 4 | `app/(fluxo)/verba/page.tsx:126` | botão "Cadastrar cartão" | Cadastrar o cartão de pagamento. Não tem `onClick`. | **Sim, duas vezes.** O `.hint` acima diz que "o cadastro do cartão ainda não está ligado aqui". O `.empty-note` abaixo diz "Desabilitado de propósito: preferimos um botão parado com o motivo escrito a um formulário que pede o número do seu cartão sem ter para onde mandar". |
| 5 | `app/(protected)/conta/page.tsx:372` | linha-botão "Pausar os anúncios" | Pausar a campanha. Não tem `onClick`. | **Sim, dentro do próprio botão:** "Disponível quando houver campanha no ar." Abaixo, a `.foot-line` diz que as duas opções "ficam aqui desde já … para você saber onde procurar no dia em que precisar". |
| 6 | `app/(protected)/conta/page.tsx:379` | linha-botão "Cancelar assinatura" | Cancelar a assinatura. Não tem `onClick`. | **Sim, dentro do próprio botão:** "Disponível quando houver assinatura ativa. Serão 2 toques, sem ligação." A mesma `.foot-line` do item 5 vale aqui. |
| 7 | `app/(protected)/conta/Formularios.tsx:54` | campo "E-mail" | Editar o e-mail da conta. | **Sim.** A `.note` logo abaixo diz: "Para trocar o e-mail, fale com a gente — o fluxo de confirmação ainda não está no app." |
| 8 | `app/(protected)/conta/Formularios.tsx:62` | campo "Senha" (mostra `••••••••`) | Editar a senha. | **Não há texto dizendo por quê.** A `.note` abaixo tem só o link "Trocar minha senha", que leva para `/recuperar`. |

"Não tem `onClick`" foi conferido no JSX de cada linha. Nenhum desses 8 tem
handler nem fica dentro de um `<form>` com `action` que o use.

## Fatos que tocam regra escrita

- **Cancelar em 2 toques.** O `CLAUDE.md` diz: "A porta de saída fica
  visível: cancelar em 2 toques." O item 6 está visível, mas desabilitado, e
  o texto dele condiciona o uso a haver assinatura ativa. Se hoje existe
  cliente com assinatura ativa **não foi medido**: exige consulta ao banco,
  fora do escopo deste relatório.
- **O item 4 fala com o cliente em primeira pessoa sobre a decisão de
  produto** ("preferimos um botão parado…"). O texto aparece na tela, não é
  comentário de código.
