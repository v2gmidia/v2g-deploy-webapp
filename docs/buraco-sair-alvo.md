# O alvo de 21 × 12 do "Sair" na sidebar

**Medido em 20/08/2026**, na verificação do lote QA-1
([`navegacao-mobile.md`](./navegacao-mobile.md) §17). Não é desenho: é
registro de um achado que **não** foi consertado, porque o lote era
navegação de celular e no celular esse botão não aparece mais.

---

## 1. O buraco, em uma frase

**O "Sair" da sidebar é um alvo de 21 × 12 pixels** — o `.link-btn`
dentro do `.side-account`, no rodapé da coluna cobalto.

## 2. O que foi medido

Na `/conta`, com sessão real, dev server local:

| largura | `.side-account` "Sair" | "Sair desta conta" na `/conta` |
|---|---|---|
| 700px | 0 × 0 (oculto — é barra inferior) | 153,3 × 45,6 |
| 901px | **21 × 12** | 153,3 × 45,6 |
| 1280px | **21 × 12** | 153,3 × 45,6 |

12px de altura não passa em critério nenhum: nem os 44 do iOS, nem os 48
do Android, nem os 24 × 24 do mínimo da WCAG 2.5.8, que é o único que
vale também para mouse.

## 3. Por que nunca travou ninguém

Porque é alvo de **mouse**, e mouse tolera. O botão sempre foi assim, em
toda a vida do projeto — não é regressão do QA-1. O que o QA-1 mudou é
que ele deixou de ser a **única** saída: abaixo de 900px ele não existe, e
em toda largura a `/conta` tem a sua própria, com 153,3 × 45,6.

## 4. O conserto, quando alguém mandar

Não é aumentar o alvo. Agora que a `/conta` tem a porta de saída própria,
**o da sidebar pode virar link discreto sem perda nenhuma** — ele deixou
de ser a saída e passou a ser o atalho. Um atalho de mouse com aparência
de link é honesto; um botão de 12px de altura fingindo ser botão, não.

Duas formas, e a escolha é de quem mexer:

1. Manter como está e aceitar que é atalho — só registrar no CSS que a
   saída canônica é a da `/conta`, para ninguém "consertar" o alvo aqui
   achando que é a única.
2. Dar a ele área clicável de linha inteira dentro do `.side-account`
   (o bloco já tem 220px de largura na sidebar de 252px), o que resolve
   sem mudar o desenho — o texto continua do mesmo tamanho, só a caixa
   cresce.

## 5. O que este buraco NÃO é

Não é o do contraste do modo escuro (QA-4) nem o desalinho de 4px
([`buraco-topbar-canvas.md`](./buraco-topbar-canvas.md)). É alvo de
toque/clique, e só.
