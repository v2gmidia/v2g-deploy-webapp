# O `color-scheme` só vale para quem clicou no botão de tema

**Medido em 20/09/2026**, ao capturar a tela de quando a transcrição
falha: o tocador do `<audio>` saía **branco** no meio de uma tela preta.

## O que é

`app/globals.css:500-502` já diz ao navegador em qual tema pintar o que
não é nosso — barra de rolagem, `select`, tocador de áudio, seletor de
arquivo:

```css
/* Diz ao navegador em qual tema pintar barra de rolagem, campos nativos
   e menus de `select`. Sem isto, um `select` no tema escuro abre branco. */
:root[data-tema="escuro"] { color-scheme: dark; }
:root[data-tema="claro"]  { color-scheme: light; }
```

O comentário está certo e o diagnóstico está certo. **Mas as duas regras
dependem do atributo `data-tema`, que só existe depois de a pessoa
escolher um tema no produto.**

Quem nunca clicou — que é todo mundo na primeira visita — cai no outro
caminho, o `@media (prefers-color-scheme: dark)` da linha 367. Esse bloco
troca **os tokens** e não declara `color-scheme` nenhum. Resultado: tokens
escuros, controles nativos claros.

## O que aparece na tela

| controle | no tema escuro por preferência do sistema |
|---|---|
| tocador de `<audio>` | fundo branco, botões pretos |
| `select` aberto | lista branca |
| barra de rolagem | clara |
| seletor de arquivo | claro |

O tocador foi o que me fez notar, porque ele é grande. O `select` é o mais
sério: é o mesmo sintoma que o comentário da linha 498 já descreve, só que
pelo caminho que ninguém conferiu.

## O conserto

Uma linha, dentro do bloco que já existe:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-tema="claro"]) {
    color-scheme: dark;        /* ← esta */
    --offwhite: #050A13;
    ...
```

E, para simetria, o caminho claro não precisa de nada: `light` é o padrão
do navegador.

Uma alternativa mais curta e que cobre os dois de uma vez:

```css
:root { color-scheme: light dark; }
```

com as duas regras de `data-tema` continuando por cima, para a escolha
explícita vencer a do sistema. **Recomendo esta**, porque ela não depende
de alguém lembrar de acrescentar a declaração ao bloco escuro se um dia
outro bloco de tema aparecer.

## O que eu fiz e o que não fiz

**Não toquei em `app/globals.css`.** A rodada da madrugada só autorizava
CSS de produção para o conserto das bordas de cobalto, e isto é outro
assunto.

Na bancada eu pus `color-scheme: light dark` em
`app/exemplo/_onboarding/Onboarding.module.css`, na `.tela`, para as
capturas da tela de falha mostrarem o tocador como ele vai ser quando o
`:root` estiver certo. O comentário lá aponta para este arquivo.

## Como conferir

```bash
grep -n "color-scheme" app/globals.css
```

Enquanto as duas únicas ocorrências forem as de `data-tema`, o buraco está
aberto. Para ver: abrir qualquer tela com `<select>` ou `<audio>` com o
SISTEMA em modo escuro e **sem** ter clicado no botão de tema.
