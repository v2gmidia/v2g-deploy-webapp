# `/entrar` × `tela-01-login-cadastro-desktop.html`

Conferência do que o protótipo tem e a rota atual não tem. **Nada aqui foi
implementado** — é lista de lacunas para você decidir o que entra.

O protótipo tem **4 estados** na mesma tela: `cadastro`, `pagamento`,
`celebracao` e `login`. O `/entrar` atual cobre `cadastro` e `login`.

---

## 1. Lacunas no cadastro

| O que falta | Onde no original | Nota |
|---|---|---|
| **Trilha de 3 passos** (`1 · Criar conta` / `2 · Ativar plano` / `3 · Seu negócio`) com cadeado nos travados | linhas 34-46 | O CSS (`.rail`) já foi portado no lote 3 — está em uso no onboarding. Seria só montar. |
| **Check inline por campo** — um ✓ acende no rótulo quando o campo fica válido | `.field .check`, linhas 52-62 | Feedback progressivo; hoje só há validação no envio. |
| **Nota sob o WhatsApp**: "Usamos só pra avisos da sua conta e dos seus anúncios. Nada de spam, nada de vender sua lista." | linha 58 | Hoje essa promessa só existe no card lateral. |
| **Nota sob o e-mail**: "Só recibos e coisas importantes." | linha 63 | |
| **Aviso de preço abaixo do botão**: "Próximo passo: ativar seu plano de **R$ 490/mês**. A gente mostra tudo antes de cobrar qualquer coisa." | linha 67 | Depende da decisão de preço/pagamento. |
| **Linha da LGPD no rodapé** do card | linha 70 | Hoje a LGPD é mencionada só no card lateral. |
| **Dois cards de prova na lateral**, não um | linhas 76-100 | Ver abaixo. |

### Os dois cards laterais do original

O primeiro se chama **"O mapa inteiro, antes do primeiro campo"** e lista
quatro coisas, nesta ordem:

1. **R$ 490 por mês.** Esse é o preço, e pronto. Sem taxa de adesão.
2. **Sem fidelidade.** Cancele em 2 toques, sem multa e sem ligar pra ninguém.
3. **7 dias de garantia.** Não gostou, devolvemos 100%.
4. **Gente de verdade no WhatsApp.** Sem robô.

O segundo é **"Ficou com dúvida antes de assinar?"**, com link direto de
WhatsApp.

O `/entrar` atual tem **um** card genérico, sobre proteção de dados. Os três
primeiros itens do original dependem de decisões comerciais (preço,
garantia) que ainda não estão fechadas no produto.

### Uma diferença em que o `/entrar` atual está à frente

**O cadastro do protótipo não tem campo de senha.** Ele coleta nome,
WhatsApp e e-mail e vai direto para o pagamento. O `/entrar` atual pede
senha porque o Supabase Auth precisa dela — sem isso não existe login por
e-mail. Não é lacuna: é correção.

---

## 2. Lacunas no login

| O que falta | Nota |
|---|---|
| **"Continuar com Google"** (botão com o logo colorido, acima de tudo) | Login social. Não implementado. |
| **Divisória "ou com seu e-mail"** | Só faz sentido junto com o Google. |
| **Logomark pixelada acima do título** | `PixelMark` já existe como componente desde o lote 3. |
| **"Prefiro receber um código no WhatsApp"** | Login por OTP no WhatsApp. Não implementado. |
| **Copy do "esqueci minha senha"** | O original promete "a gente te manda um código no seu **WhatsApp**". O que existe hoje manda **link por e-mail** (`/recuperar`). São mecanismos diferentes; a copy do original descreve algo que não foi construído. |
| **Login sem coluna lateral** (`.auth-grid.solo`) | No original o login é `.solo`; só o cadastro tem cards ao lado. O `/entrar` atual mostra o card nos dois modos. |

---

## 3. Estados inteiros que não existem

### `pagamento` (linhas 108-246)

Fora de escopo por decisão sua. O que há lá, para dimensionar quando for a
hora:

- Lista do que se destrava ao assinar (4 itens com cadeado)
- Card navy com **R$ 490/mês** e a justificativa ("menos de R$ 17 por dia")
- Escolha entre **cartão** e **Pix**
- Pix com duas opções — 6 meses (R$ 2.646, economiza R$ 294) e 12 meses
  (R$ 4.704, economiza R$ 1.176)
- **Promessa de reembolso proporcional** escrita no card: "se você cancelar
  antes do fim, devolvemos o valor dos meses que não usou. Está escrito aqui
  e vale como contrato."
- Formulário de cartão (número, validade, CVV, nome) com selos de segurança
- Bloco de garantia de 7 dias

> **Atenção para quando isso for implementado:** os dados de cartão nunca
> devem passar pelo nosso servidor. O caminho é um campo hospedado pelo
> provedor de pagamento (Stripe Elements ou equivalente), não os `<input>`
> do protótipo. O selo "a gente nunca vê seu cartão completo" só é verdade
> nesse desenho.

### `celebracao` (linhas 248-260)

Tela navy de "conta criada", entre o pagamento e o onboarding. Depende do
pagamento existir.

---

## 4. Resumo

**Dá para fazer agora, sem depender de decisão nenhuma:**
trilha de 3 passos, notas sob WhatsApp e e-mail, linha da LGPD no rodapé,
check inline por campo, logomark no login, login sem coluna lateral.

**Depende de decisão comercial:** os cards laterais com preço, garantia e
fidelidade; o aviso de preço abaixo do botão.

**Depende de implementação nova:** login com Google, login por código no
WhatsApp, e todo o estado de pagamento.

**Precisa de decisão de produto:** a copy do "esqueci minha senha" promete
código por WhatsApp; o que existe é link por e-mail. Ou se muda a copy, ou
se constrói o WhatsApp.
