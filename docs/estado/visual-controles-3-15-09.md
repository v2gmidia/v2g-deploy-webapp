# Lote 2b, fechamento — 15/09/2026

Continuação de `visual-controles-2-15-09.md`, que já tinha sido commitado
(`0b0bbb2`) e por isso não foi reescrito. As respostas do Victor estão em
`docs/decisoes.md`, 15/09, "fechamento".

Nada foi commitado. O único `.tsx` tocado foi `SeletorDeNicho.tsx`, e só em
duas strings de placeholder. Essa é a exceção autorizada, a mesma da rodada
anterior. As outras três strings estão em `perguntas.ts`, que não é `.tsx`.

---

## 0. O que depende de decisão humana

1. **O diff do botão "Falar com uma pessoa"** (§1). Precisa de aprovação,
   porque toca `.tsx`. Há também uma pergunta de formato: linha igual aos
   itens de navegação, com ícone, ou link de texto igual ao "Sair"?
2. **Quatro placeholders ainda passam do espaço** (§2). As larguras estão lá,
   para cortar mais.

---

## 1. "Falar com uma pessoa" sai do cartão — NÃO aplicado, diff para aprovar

**Não dá só em CSS.** O cartão é um `<div className="side-support">` com
título, parágrafo e o botão dentro. CSS consegue esconder o título e o
parágrafo e vestir o botão de linha, mas o cartão continuaria existindo, só
invisível. E um item de linha da barra tem ícone, que o botão não tem no
markup.

**Uma contradição com o pedido: a barra NÃO tem item "Ajuda".**
- Os itens de linha são os cinco `NavItem`: Início, Criativos, Anúncios,
  Avisos e Conta.
- O fim da barra é o `.side-account`: avatar, nome do negócio e "Sair", que
  é um `link-btn`, link de texto, e não item de linha.
- "Ajuda" e "Sair" como linhas existem só no desenho de desktop
  (`docs/desenho/v2g-amostra-desktop-v2.html`).

**Formato proposto:** o mesmo dos itens de navegação (`.nav-item`, com
ícone), logo acima do bloco da conta. Se a intenção for o formato do
"Sair", o diff muda.

### O que seria mudado

`app/(protected)/layout.tsx`:
```diff
+const IcoConversa = () => (
+  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
+    <path d="M10 3a7 7 0 0 0-6 10.6L3 17l3.5-1A7 7 0 1 0 10 3z" />
+  </svg>
+);
 …
         <div className="side-spacer" />

-        <div className="side-support">
-          <b>Fala com gente de verdade</b>
-          <p>Sem robô. Resposta em até 2 horas úteis, no WhatsApp.</p>
-          <a className="cta ghost" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
-            Falar com uma pessoa
-          </a>
-        </div>
+        <a className="nav-item side-falar" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
+          <IcoConversa />
+          <span>Falar com uma pessoa</span>
+        </a>

         <div className="side-account">
```
O ícone segue o traço dos outros cinco (`viewBox 0 0 20 20`, `strokeWidth
1.7`). O desenho é o balão do `.topbar-help`, em contorno.

`app/globals.css`:
```
$ grep -nE "side-support" app/globals.css
996   .side-support :focus-visible { … }                → sai (o anel do .nav-item já é o da barra)
1024  .side-support .cta.ghost { … lima … }             → sai
1033  .side-support .cta.ghost:hover { … }              → sai
1089  .side-support,  (lista do @media max-width 900px) → vira .side-falar,
2034  .side-support { … }                               → sai
2041  .side-support b / 2042 p / 2043 .cta              → saem
```

**O que o CSS precisa garantir:**
- **Abaixo de 900px o link some.** Ali a barra vira a barra inferior de
  cinco células, e um sexto item quebra o teto (`layout.tsx`, comentário
  "CINCO ITENS, E CINCO É TETO"). No celular, o canal continua sendo o
  `.topbar-help` do topo, como hoje.
- **Nada muda de cor:** o `.nav-item` já mede 9,74:1 sobre a placa
  (`globals.css:212`).

**O que isto inverte:** o item 2 da decisão de 11/09, "o `.side-support`
vira card claro", e a medição de contraste do anel de foco dele
(`docs/contraste.md` §9.2, item e). Registrado em `decisoes.md`.

---

## 2. Placeholders encurtados

Só as cinco strings mudaram:
```
$ git diff -U0 "app/(fluxo)/onboarding/perguntas.ts" components/ui/SeletorDeNicho.tsx | grep "^[-+] "
-    fallbackPlaceholder: "Como você descreveria seu negócio em poucas palavras?",
+    fallbackPlaceholder: "O que seu negócio vende?",
-    fallbackPlaceholder: "Ex: bolos e salgados feitos no dia, pra festa e pro dia a dia",
+    fallbackPlaceholder: "Ex: bolo e salgado feitos no dia",
-    fallbackPlaceholder: "Conte com suas palavras onde seus clientes estão",
+    fallbackPlaceholder: "Onde seus clientes estão?",
-  placeholder = "Busque ou escreva do seu jeito",
+  placeholder = "Busque ou escreva",
-  placeholderLivre = "Como você descreveria seu negócio em poucas palavras?",
+  placeholderLivre = "O que seu negócio vende?",
```

Medido no campo montado na cadeia real, em 375px e 16px, com o botão
"Enviar" ao lado. É o rótulo real nos três lugares:
```
$ grep -n "mini-send" -A6 "app/(fluxo)/onboarding/Chat.tsx" components/ui/SeletorDeNicho.tsx
Chat.tsx:261 "Enviar" · SeletorDeNicho.tsx:147 "Enviar" · :239 "Enviar"
javascript_tool → canvas.measureText do texto com a fonte computada do campo, contra clientWidth − padding
```

| Texto | Onde | Largura / espaço | Resultado |
|---|---|---|---|
| "O nome do seu negócio" | `perguntas.ts:70` → `Chat.tsx:240` | 167,6 / 182 | **cabe**, sobram 14,4 |
| "O que seu negócio vende?" | `perguntas.ts:112` → `Chat.tsx:240` | 188,4 / 182 | **passa 6,4** |
| "Ex: bolo e salgado feitos no dia" | `perguntas.ts:122` → `Chat.tsx:240` | 218,1 / 182 | **passa 36,1** |
| "Onde seus clientes estão?" | `perguntas.ts:144` → `Chat.tsx:240` | 187,3 / 182 | **passa 5,3** |
| "O que seu negócio vende?" | `SeletorDeNicho.tsx:66` → `:130` | 188,4 / 183 | **passa 5,4** |
| "Busque ou escreva" | `SeletorDeNicho.tsx:63` → `:220` | 135,7 / 183 | **cabe**, sobram 47,3 |

**Uma correção da minha medição:** na primeira passada usei "Usar" como
rótulo do botão do seletor, que é mais estreito. Ali o "O que seu negócio
vende?" do `SeletorDeNicho.tsx:66` saiu cabendo, com 6,6 de folga. Com o
rótulo real, "Enviar", passa 5,4.

**Para dar referência de corte:** no campo do onboarding cabem, com folga,
os textos até a largura de "O nome do seu negócio" (167,6px de 182).

---

## 3. As quatro bordas com função

Registradas em `docs/decisoes.md` (15/09, "fechamento") como **exceção
deliberada**, com o motivo de cada uma e a regra de que quem tirar precisa
pôr outro sinal no lugar. Nenhum CSS mudou.

---

## 4. Verificação

```
$ pnpm conferir > conferir.log 2>&1; echo "exit=$?"
exit=0
(19 blocos "TUDO CERTO", entre eles "0 inerte(s) na folha" do cascata e "9/9" da trava do Campo.tsx:232)
```

---

## 5. Todas as telas em que a aparência mudou no lote 2b

Soma as três rodadas: este documento, `visual-controles-15-09.md` e
`visual-controles-2-15-09.md`.

**Quatro mudanças valem em toda tela do app** e não se repetem nas linhas:
- **Texto:** a escala de seis degraus (12/14/16/20/24/30), com quase tudo um
  degrau acima, e o texto corrido em Archivo.
- **Raio:** 12px nos controles e 16px nos cartões.
- **Campos:** todo campo de texto em 16px.
- **Botões:** a principal em 54px e 16px, com o desabilitado mantendo fundo
  e cor de desabilitado.

**Os dois temas mudaram igual:** tudo abaixo vale no claro e no escuro.

A contagem de controles por tela saiu do JSX:
```
node extrair-contextos.cjs (CLS = cta, mini-send, btn-linha, chip-opt, botao-leve, link-btn, text-fallback, btn-texto, ec-doubt) + campos.json, agrupados pela page/layout de cada uso
```
Um componente usado em mais de uma tela foi seguido só até o primeiro uso.
É o caso do `FaixaReconectar` (`/inicio`, `/anuncios`, `/vendas`) e do
`<Button>`, que é componente e não entra na busca por classe.

| Tela | O que mudou além do geral | O que olhar primeiro |
|---|---|---|
| `/` (landing) | **Só** a fonte do texto corrido: 54 elementos passam de Segoe UI para Archivo. Tamanho, botão e raio não mudam, porque o `lp.css` tem valores próprios. | parágrafos e listas da página |
| `/entrar` | "→ Entrar" e "→ Criar conta" deixam de ser link azul e viram botão cinza de 54px, na mesma linha do "Já tenho conta"; o cartão fica com borda | o rodapé do cartão, nos dois modos |
| `/recuperar` | um parágrafo passa de 3 para 4 linhas (aceito) | o parágrafo sob o campo |
| `/redefinir` | o título "Este link não é mais válido." passa para 2 linhas (aceito); placeholder "8 caracteres, com letra e número" | o título e o campo de senha |
| `/exclusao-de-dados/[codigo]` | só o geral | — |
| `/onboarding` | os chips de nicho deixam o contorno cobalto e viram pílula cinza com texto cinza, 600; o escolhido fica cobalto cheio; o "Enviar" ao lado do campo fica em 48px e 16px; "não sei" em cinza 600; "Salvar e continuar depois" perde o padding próprio; placeholders novos, **3 deles passando do campo** | os chips de nicho e o campo de texto livre das perguntas 2 a 4 |
| `/onboarding/contas` | os mesmos chips e o mesmo "Enviar" em 48; placeholder "Valor em reais"; o cartão de resumo mantém borda | os chips de conta e o campo de ajuste de valor |
| `/expectativas` | "Voltar" (`cta quiet`) cinza em 14px; "Ficou alguma dúvida?" deixa de ser azul e fica cinza; o círculo de voltar não muda | a navegação do fim de cada passo |
| `/conectar`, `/sem-instagram`, `/whatsapp-business`, `/reprovado` | só o geral | o botão principal de cada tela |
| `/conectar/escolher` | as opções de conta mantêm borda (dentro do cartão branco) | a lista de opções |
| `/verba` | os três "Pode ir ao ar" desabilitados ficam com 54px; os cartões de cobrança mantêm borda | o botão desabilitado |
| `/aprovar` | "Quero mudar alguma coisa" desabilitado vira secundária cinza de texto cinza | os dois botões do fim |
| `/inicio` | **cartões sem borda** (resumo, próximo passo, sinais, lista, "Você está no comando", pergunta do dia); o botão do próximo passo e o "Guardar" em 54px; "Corrigir", "Voltar para ontem" e "Preencher…" viram pílula cinza; "não sei" em cinza 600; "Falar com uma pessoa" do comando fica discreta; "Reconectar" da faixa em 16px | a tela inteira: é a que mais mudou |
| `/criativos` | o envio e o cartão de análise neutro sem borda; os cartões com veredito e o tracejado da casa mantêm borda; "Escolher outra imagem" vai de 45,6 para 54px; "Tentar de novo" e "Analisar outra imagem" deixam o contorno cobalto e viram cinza de 54px | o fim de uma análise |
| `/anuncios` (e o carregando) | **cartões sem borda** (ficha, números, nível, dicas, listas); "Reconectar" em 16px | a ficha da campanha |
| `/vendas` | "Reconectar" em 16px | a faixa, se a conexão estiver caída |
| `/alertas` | cartões sem borda; o aviso mantém a borda esquerda de severidade | a lista de avisos |
| `/conta` | **12 cartões sem borda**; campos em 16px; o "Trocar arquivo" (`btn-linha fraco`) perde o contorno; a troca de página mantém a borda das opções dentro do cartão; os três cartões de tema ficam com raio 16 | a troca de página do Facebook, com as opções com borda dentro de cartão sem borda |
| `/meu-negocio` | cartões sem borda; "tá certo" e "salvar" passam de navy escuro para cobalto de 54px; "contar agora" e "não é isso" passam de contorno navy para cinza com texto cobalto de 54px; as opções de campo fechado viram pílulas, com a atual em cobalto; "mudar" e "deixa como estava" perdem o contorno; os textos longos crescem 9px | um campo aberto para edição, e um campo de escolha |
| `/revisar-perfil/[proposta]` (operador) | itens sem borda; "aceitar" e "aplicar ao perfil" em cobalto de 54px; "usar este" e "reabrir" em cinza com texto cobalto de 54px; "corrigir" em 48 ao lado do campo; "descartar" sem contorno; as opções comparadas e a prévia mantêm borda | uma divergência com duas opções |
| `/revisar-perfil` (operador) | cartões sem borda | — |
| `/saude-meta` (operador) | cartões sem borda; a lista de diagnóstico mantém a borda esquerda | — |
| Barra lateral, em toda tela do casco, acima de 900px | "Sair" em 14px, peso 600; **o botão lima "Falar com uma pessoa" ficou com 54px e 16px, com o rótulo em duas linhas**, até o diff do §1 ser aprovado | o cartão de suporte |

**Não mudou:** a barra inferior do celular, o topo das telas do casco (a não
ser pela escala), o `/campanhas` (só redireciona) e o seletor de tema, fora o
raio e a escala.
