# O visual da tela de Resultados — 11/09/2026

Etapa "Resultados" do `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md`, feita pela
sessão V3. Só visual: nenhuma linha de `lib/resultado`, `lib/dia-seguinte` ou
`lib/backend` foi tocada.

---

## §0 — O que depende de decisão humana

**1. A campanha `98447192` não lê "sem dado". Lê "Ainda não foi ao ar".**
O aceite pedia "sem dado". O que produção devolve para ela é
`status: "aguardando_fotos"` e `tem_dado_da_plataforma: false`. Como
`aguardando_fotos` não está em `STATUS_COM_CAMPANHA`
(`["estrutura_pronta","gerado"]`), `do-negocio.ts` classifica `sem-campanha`.
O backend, na mesma resposta, chama de `"nivel": "sem_dado"` — ou seja, a
inferência do front e o nível do backend **discordam sobre a mesma execução**.
A regra que importa está garantida: ela nunca aparece como zero. Mudar a
classificação é mexer em `lib/resultado/do-negocio.ts`. Decidido em 11/09:
fica como está, registrado aqui.

**2. O aceite do plano diz que `98447192` sai `—` em TODO campo. É falso
contra produção.** `GET /execucoes/98447192-…/consolidado` devolve
`vendas: 22` e `voltou_centavos: 120000`. Não são dados da plataforma — são as
confirmações que o próprio dono deu nos dias 31/08 e 01/09. A tela mostra os
dois, com o rótulo dizendo de quem é o número ("Vendas que você confirmou").

A confusão do plano tem origem: a fixture citada no aceite
(`scripts/fixtures/consolidado-negocio-producao.json`) é a do **negócio**, e as
linhas de `por_execucao` dela não carregam `vendas` nem `voltou` — carregam só
`investiu_centavos`, `cliques`, `impressoes`, `pessoas_que_chegaram` e o nível.
Quem tem esses dois campos é a rota da **execução**, que é de onde a tela lê.

Consequência visual a decidir: o card de `98447192` diz "Ainda não foi ao ar" e
logo abaixo "Voltou em vendas — 1.200,00". É verdade e está rotulado, mas a
justaposição é estranha. Se incomodar, o conserto é de produto, não de código.

E há um fato mais fundo, apontado pela sessão V1 ao corrigir o plano: o lado do
dono veio **inteiro** da `98447192`, enquanto a `aed42ce7` — a única com dado de
plataforma — tem `vendas` e `voltou` nulos. Ou seja, **o lado da plataforma e o
lado do dono estão ausentes por motivos diferentes e podem estar em campanhas
diferentes.** Uma tela que tratasse "ausente" como uma coisa só apagaria essa
distinção. É por isso que cada card carrega os seis números com o rótulo dizendo
de quem é cada um, em vez de um totalizador.

**3. `voltou` de `98447192` sai sem símbolo de moeda.** `"moeda": null` naquela
execução, e `dinheiroDaMoeda` se recusa a chutar `R$` — comportamento correto e
já documentado. Na tela lê-se `1.200,00`, seco.

**4. `retorno_por_real` não entrou.** O §3.1 lista o campo, e ele existe em
produção (`"117.07"`). Mas `ResultadoParaTela` não o expõe, e expor exigiria
mexer em `lib/resultado/tipos.ts` + `ler.ts`. Fora do combinado desta sessão.

**5. `/anuncios/[idExecucao]` saiu do v0 — decidido, não pendente.** O §3.2 do
plano desenha a rota e ela exigiria afrouxar a trava
`conferir:campanha-da-sessao` §3, que proíbe `params`/`searchParams` em arquivo
que chame `resultadoDoNegocio()`. Decisão do Victor em 11/09: **a rota não
entra no v0 e a trava não muda.** A ficha por campanha dentro da `/anuncios`
basta.

Vale registrar o efeito colateral bom: a trava §3 continua sendo o que impede
um `params.id` de virar argumento de função de `lib/backend`. Ela existe porque
`GET /execucoes/{id}` não confere dono — quem tem o `X-V2G-Token` lê a execução
de qualquer cliente. Enquanto não houver rota com id na URL, esse risco não tem
por onde entrar. Ver `docs/superficie-do-token.md`.

---

## §1 — O que foi feito

| arquivo | o quê |
|---|---|
| `app/(protected)/anuncios/page.tsx` | `Numero` e `Campanha` refeitos; `BackendNaoRespondeu` novo; ícones da grade |
| `app/(protected)/anuncios/loading.tsx` | **novo** — o primeiro `loading.tsx` do `app/` |
| `app/globals.css` | seção `RESULTADOS` no fim do arquivo. Só acrescenta; nenhum token existente mudou |

**Ausência ganhou tom.** Era `investido — ainda não sabemos`, numa linha corrida
do tamanho do texto de apoio. Virou o padrão do wireframe
`resultados-nao-medidos`: travessão cinza no mesmo tamanho do número que
existiria, e o motivo embaixo. O `valor.texto` continua vindo da camada de
leitura — a tela não reescreve a frase, só a reposiciona. A distinção continua
saindo de `valor.ausente`, nunca de comparar o texto.

**Dois números que existiam e nenhuma tela mostrava:** `vendas` e `voltou`, já
em `BlocoDeMoeda`. O wireframe pede os dois. Entraram prontos, sem conta nova.

**A `Pill` foi usada pela primeira vez.** Existia desde a Decisão 8 e nenhuma
tela a consumia. Tom `off` nos três estados — ver §2.

---

## §2 — O que o wireframe pedia e não entrou

Todos por falta de fonte. A v0 **omite**; não desabilita, não mostra vazio, não
escreve "em breve" — botão morto ensina que a função existe e está a um clique.

> **Correção de 11/09, depois da entrega.** A primeira linha desta tabela
> estava errada, e o erro custou um selo. Ver §5.

| pedido | por quê não |
|---|---|
| selo "CAMPANHA NO AR", pílula verde "No ar" | não existe veiculação **por campanha** — mas existe por NEGÓCIO, e eu omiti demais. Ver §5 |
| "R$ 14,42 por conversa" | derivado. Proibido pelo contrato e por `conferir:resultado` §10 |
| "↑ +34% vs. 30 dias anteriores" (4 cartões) | não há período anterior em rota nenhuma. Seriam quatro números inventados |
| setas verde/vermelha | semáforo — opinião fingindo ser medida, sem CPL-alvo |
| gráfico "Como o resultado evoluiu" (conversas/dia) | "conversas" não é campo medido; `dias[]` tem os dois lados em 2 dias de 13 |
| "Pessoas alcançadas 12,4 mil" | `impressoes` conta APARIÇÕES, não pessoas. Virou "O anúncio apareceu" |
| miniatura do criativo no card | `creatives.campaign_id` aponta para outro espaço de id. Não há chave |
| "1 DECISÃO PARA VOCÊ" / fadiga | não há detecção nem rota |
| sino, "Falar com a IA da V2G" | não existem |
| seletor "Últimos 30 dias" | a janela é o default do backend, decidido em um lugar só de propósito |
| "Última atualização: hoje, 09:40" | nada registra esse instante |

Na tela de falha, a palavra "erro" não aparece: o dono não cometeu erro nenhum
e não tem o que consertar. E não há promessa de prazo — o "em até 48 horas" que
já custou caro nasceu de uma frase gentil do mesmo formato.

---

## §3 — O que quase passou

`pnpm conferir:cascata` reprovou o primeiro corte: o `@media (max-width: 560px)`
que empilha o ícone no celular tinha sido escrito **antes** da regra-base
`.res-num`, e `@media` não soma especificidade — o `gap` de 9px perdia para o
de 11px da base. `flex-direction: column` funcionava (não tinha concorrente) e
o defeito era invisível na captura. Movido para depois da base; a folha voltou
de 4 regras inertes para as 3 já conhecidas.

É o mesmo defeito da `docs/regra-inerte.md`, em outra linguagem: a regra existe,
parece aplicada, e não faz nada.

**O raio fora da escala.** `.res-ficha` e `.res-falha` nasceram com
`border-radius: 16px`, tirado da aparência dos wireframes. O §2 do plano fixa a
escala em 12/10/8/6/4/999, e o HEAD não tinha **nenhum** `border-radius: 16px` —
os dois eram meus. Apontado pela sessão V2 e corrigido para 12px. Os raios que
este lote introduz são hoje 5× 12px e 1× 6px, todos dentro da escala.

Fica o achado para quem fechar a escala na Etapa 1: **o HEAD tem 3 ocorrências
de `border-radius: 14px`, também fora do §2, e anteriores a este lote.** A
distribuição no HEAD é 19× 10px, 16× 12px, 12× 8px, 8× 4px, 6× 999px, 6× 6px,
3× 14px, 1× 3px. E cuidado ao varrer: "16px" aparece 33 vezes no HEAD como
`padding`, `gap` e `margin` — só como raio é que era zero.

---

## §4 — Como foi conferido

Leitura pura contra produção, nenhum POST. `GET /negocios/a85c37a9-…/consolidado`
mais as duas rotas de execução. Os números da tela batem com o cru:
`BRL`, `investiu_centavos: 1025` → `R$ 10,25`, `cliques: 64`,
`impressoes: 1657`, e a `nivel_frase` de `sem_alvo` inteira.

As capturas (390px e 1280px, claro e escuro) saíram de um harness estático —
a mesma folha de estilo e a mesma marcação dos componentes, alimentada com os
valores de produção. **Não** foi a tela autenticada: entrar exigiria criar
sessão, e o combinado desta sessão era só GET. O harness não ficou no
repositório.

`pnpm conferir` e `pnpm build`, exit 0. Nada commitado — git é do Victor.

**O verde não é só deste lote, e isso limita o que ele prova.** Quando a Etapa 1
(fundação, sessão V2) entrou no mesmo `app/globals.css`, `pnpm conferir` passou
a atestar o conjunto das três sessões. Enquanto o Victor não commitar, **nenhuma
delas consegue medir só o que fez.** Registrado também em
`docs/estado/visual-fundacao-11-09.md`, para o aviso não depender de um
documento só.

Efeito prático já observado: uma rodada de `pnpm conferir` saiu com exit 2 —
não por regra quebrada (as 15 conferências individuais passaram e `typecheck`
também), mas porque a V2 estava escrevendo `app/globals.css` no exato momento em
que os conferidores de folha o liam. Rodada seguinte, exit 0. **Suíte verde em
árvore compartilhada não é reproduzível enquanto outra sessão escreve** — antes
de concluir que algo quebrou, confira se alguém está com o arquivo na mão.

Depois que a fundação tokenizou os raios deste bloco (`12px` → `--raio-card`,
`6px` → `--raio-selo`, valores idênticos), a tela foi recapturada em 390px: sem
diferença de pixel. `pnpm conferir` e `pnpm build`, exit 0.

**Aviso de branch.** Esta sessão abriu em `main` (441e70e, árvore limpa) e
terminou em `visual-v0`, com as alterações junto. A branch apareceu no meio da
sessão e não foi criada por aqui — nem pela V1, que disse que não criaria. As
sessões V2 (fundação) e V3 (esta) estão na mesma branch e na mesma árvore suja
ao mesmo tempo. Enquanto ninguém commitar, o combinado é não escrever no mesmo
arquivo em paralelo; `app/globals.css` foi entregue à V2 ao fim deste lote.

---

## §5 — O selo que eu apaguei apoiado numa premissa falsa

Registrado depois da entrega, quando a sessão `webapp-8f` mediu e eu confirmei.

O CONFLITO 1 do `IMPLEMENTATION-PLAN` afirma que `status_na_plataforma` "NÃO
existe em nenhuma rota (medi hoje: 0 ocorrências no `openapi.json` de
produção)". Eu aceitei e omiti o selo de veiculação da tela inteira. **A
afirmação é falsa.** Leitura pura contra produção, 11/09/2026:

```
GET /negocios/a85c37a9-…/execucao?profile_id=…   → 200
{
  "status": "cadastro_completo",
  "andamento": "Seu anúncio já rodou e está pausado no momento.
                Seu gestor pode retomar quando fizer sentido.",
  "pede_acao": false,
  "status_na_plataforma": "PAUSED",
  "veiculacao": "ja_foi_ao_ar",
  "publicada_em": null
}
```

O que é verdade é um recorte mais estreito, e ele precisa ficar escrito senão
alguém constrói o selo no lugar errado: **não existe veiculação POR CAMPANHA.**
Nem `RespostaConsolidado` nem `LinhaDoNegocioPorExecucao` trazem o campo, e essa
rota devolve **uma** execução só, a mais recente. Selo no nível do NEGÓCIO era
construível o tempo todo; selo por campanha, não.

Então a ficha por campanha continua certa em não afirmar — ela desenha uma
campanha por vez e não tem a informação. O que faltou foi a faixa de negócio.
O comentário do componente em `app/(protected)/anuncios/page.tsx` foi corrigido
para dar o motivo certo, e o arquivo passou para a `webapp-8f`.

**A lição de processo, que é maior que o selo:** "não existe no `openapi.json`" e
"o servidor não devolve" não são a mesma afirmação, e eu tratei como se fossem.
Todo CONFLITO medido contra o documento merece uma remedição contra o
**endpoint** antes de virar `OMITIR` no plano. A regra "quando o wireframe mostra
algo sem fonte, a v0 OMITE" só é boa enquanto "sem fonte" for medido direito —
senão ela apaga funcionalidade que existia.

De brinde, o campo `andamento`: frase pronta, escrita pelo backend, no tom do
produto, resolvendo "no ar vs. pausada" sem tradução local. É a mesma regra do
`nivel_frase`, e está de graça para quem for construir a faixa.

**O que muda no lote, e é de outra sessão.** A `webapp-8f` vai tirar
"Vendas que você confirmou" e "Voltou em vendas" do card por campanha (o B2
dela). Concordo, e o §0 item 2 deste documento é o argumento: o lado do dono
veio inteiro da `98447192` enquanto a `aed42ce7` tem os dois nulos — a
atribuição por campanha é artefato de a qual execução a pergunta do dia estava
pendurada, não medição.
