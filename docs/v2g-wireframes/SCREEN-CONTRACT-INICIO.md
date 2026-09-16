# Contrato da tela — Início

Escrito antes de tocar em código, na sessão longa de 15–16/09/2026. Descreve
o Início **como ele é hoje** e o que a tela canônica precisa responder.

Todo número aqui vem com o comando que o produziu. O que não deu para medir
está marcado como **não medido**, com o motivo.

---

## 1. Usuário e situação de uso

Dono de PME brasileira, 30–50 anos, no balcão do próprio negócio, no
celular, entre um cliente e outro. Pouca familiaridade digital, quase nenhuma
com tráfego pago. Está com pressa e quase sempre abre o app por uma de duas
razões: **"cadê meu anúncio?"** ou **"isso está me dando dinheiro?"**.

Ele paga R$ 490/mês. Isso muda o tom: a tela não pode soar como ferramenta
gratuita que o faz trabalhar. Quando a bola é nossa, a tela diz isso.

## 2. A pergunta principal

**"Em que pé está o meu anúncio, e o que depende de mim agora?"**

## 3. A ação primária — UMA

**A ação da etapa aberta mais antiga da cadeia** (`proximo.acao`), renderizada
no cartão `.proximo` do topo.

Ela é única por construção: `montarEtapas()` devolve uma sequência, a tela
pega a primeira não concluída, e o botão só existe quando a bola é do cliente
(`frases.ts:101` — "Nulo quando a bola não é do cliente"). Quando a bola é
nossa ou do Facebook, o lugar do botão vira uma frase que diz de quem é a vez.

**Candidata rejeitada:** o card da pergunta do dia (`PerguntaDoDia`). Ele pede
ação e aparece nas duas variantes da tela. Não é a primária porque é
**recorrente e opcional** — o anúncio não trava sem ele —, enquanto a etapa
aberta é o que bloqueia o produto inteiro. Quando as duas coexistem, a etapa
fica no topo e a pergunta vem logo abaixo.

## 4. Conteúdo em ordem de prioridade

| # | Bloco | Peso visual | Por quê |
|---|---|---|---|
| 1 | Onde você está + o que fazer agora (`.inicio-topo`) | dominante, duas superfícies lado a lado ≥900px, empilhadas abaixo | responde a pergunta principal de relance |
| 2 | Os números, quando existem (`.sinais-bloco`) | alto, quatro valores grandes | é a segunda razão de abrir o app |
| 3 | A pergunta do dia (`PerguntaDoDia`) | médio, cartão próprio | é de onde sai "quanto voltou" |
| 4 | O mapa do caminho (`TrilhaDaExecucao`) | baixo, lista | orientação, não ação |
| 5 | O que o dono respondeu | baixo | só aparece se ele respondeu |
| 6 | "Enquanto isso, se você quiser" (`Melhoras`) | baixo, lista de links | ajuda e não trava |
| 7 | Comando (verba, falar com gente) | baixo, coluna lateral | controle e saída |

## 5. Todos os estados

O estado real é o produto de três eixos independentes, e **não** uma lista de
cinco casos: `veiculacao` (4 valores, `lib/veiculacao/estado.ts:116`) ×
`temNumero` (bool) × `conexaoAtiva` (bool). A tela hoje ramifica só por
`temNumero` (`TelaDoInicio.tsx:258`).

| Estado | Pergunta do dono | Ação | Aparece | Some |
|---|---|---|---|---|
| **Preparando** (`nunca_foi_ao_ar`, sem número) | "cadê meu anúncio?" | a etapa aberta | topo + trilha + melhoras | números, "o que você me contou" |
| **No ar** (`no_ar`) | "está rodando?" | nenhuma, ou a pergunta do dia | manchete no presente, números | — |
| **Pausado** (`ja_foi_ao_ar`) | "por que parou?" | **hoje: nenhuma** — ver §10 | manchete no passado, números do que rodou | — |
| **Sem conexão com a Meta** (`conexaoAtiva = false`) | "o que eu preciso ligar?" | "Conectar minha conta" (`/conectar`) | faixa de reconexão + etapa `conexao` no topo | números (não há de onde vir) |
| **Sem dado medido** (no ar, `temNumero = false`) | "por que não tem número?" | nenhuma; explica o aprendizado do Facebook | topo com etapa `numeros`, bloco "o que não fazer agora" | `.sinais-bloco` |
| **Não sabemos** (`nao_sabemos`) | "e aí?" | nenhuma | frase que admite a falha de leitura | qualquer afirmação sobre o ar |

**Pausado é o estado mais importante desta entrega**, porque é o da única
conta real: `veiculacao: "ja_foi_ao_ar"` com R$ 10,25 gastos.

## 6. Origem real de cada dado

| Dado | Origem | Onde |
|---|---|---|
| `veiculacao` | **backend V2G** (`GET /negocios/{id}/execucao`) | `lib/veiculacao/estado.ts:196` |
| `andamento` (frase do pipeline) | **backend**, pronta — a tela não traduz | `TelaDoInicio.tsx:180` |
| investido, cliques, impressões | **Meta**, via backend (`/consolidado`) | `lib/estado/cliente.ts:480` |
| conversas | **não medido** — a rota do negócio não manda `pessoas_que_chegaram_medido` | `cliente.ts:483` (`pessoas: null`, sempre) |
| vendas, receita | **resposta do próprio dono** | `acumulado.vendas`, `voltouCentavos` |
| etapas, fases, contador | **calculado** sobre Supabase + backend | `lib/estado/frases.ts:280` |
| conexão, verba, fotos | **Supabase** (`meta_connections`, `businesses`, `creatives`) | `cliente.ts:332` |

A regra de produto "mostrar quem escreveu cada número" já existe no texto:
"do que você respondeu" (`TelaDoInicio.tsx:641`) e "ainda sem o lado da
plataforma" (`:651`).

## 7. O que muda entre 1280, 900 e 375

**A virada real é 900px, não 768.** Medido:

```
$ grep -oE "@media[^{]*" app/globals.css | sort | uniq -c | sort -rn
      6 @media (max-width: 620px)
      5 @media (min-width: 900px)
      5 @media (max-width: 900px)
```

- **≥900px:** barra lateral com cinco itens (`Casco.tsx:125-137`: Início,
  Criativos, Anúncios, Avisos, Conta); `.inicio-topo` em duas colunas;
  `.inicio-cols` em duas colunas.
- **<900px:** a lateral vira barra inferior de cinco células
  (`globals.css:1024`); tudo empilha numa coluna; a ajuda sobe para o topo
  (`globals.css:2000`).
- **375px:** é a largura de projeto. Abaixo de 620px há mais seis ajustes.

## 8. Loading, vazio legítimo, não medido e falha

São **quatro** coisas diferentes, e o produto já paga caro por já tê-las
confundido:

| Situação | Como aparece | Nunca aparece como |
|---|---|---|
| **Carregando** | não existe estado dedicado hoje — a página é servidor e chega pronta. **Não medido**: não há skeleton no Início | — |
| **Vazio legítimo** | "Nenhuma verba foi gasta até aqui." | zero |
| **Não medido** | travessão + linha explicando ("A contagem de quem chega pelo anúncio ainda não está de pé. Não quer dizer que ninguém chegou.") | `0`, `R$ 0,00` |
| **Falha nossa** | "A gente não conseguiu conferir…" + "é uma falha nossa de leitura, não um problema na sua conta" | a palavra "erro" |

## 9. Não negociáveis

1. Nunca nota, estrela, semáforo, custo por clique ou por conversa, promessa
   de prazo, a palavra "erro" dirigida ao dono, nem soma de moedas diferentes.
2. Ausência de dado é **travessão com uma linha explicando**, nunca zero.
3. As frases sobre o momento da campanha vêm prontas do backend
   (`andamento`) ou do banco de frases (`lib/veiculacao/estado.ts`). A tela
   não traduz nem inventa.
4. O que não tem fonte de dado é **omitido**, não desabilitado.

## 10. O que da tela atual NÃO pode sobreviver

**a) As duas trilhas.** Confirmado no código: o topo desenha 4 fases
(`TelaDoInicio.tsx:315`, `fasesDaCadeia`) e três blocos abaixo
`TrilhaDaExecucao` lista as 6 etapas (`:388`). O comentário de `:68-84`
afirma "UM CONTADOR SÓ NA TELA" — eles removeram o segundo *contador*, não a
segunda *trilha*. **Só uma sobrevive.** Ver DUVIDA-2.

**b) O estado visual mentindo.** Com a cadeia fechada, `:554` escreve "Nada
está esperando por você" no mesmo topo em que a manchete diz "Seu anúncio já
rodou e não está no ar agora" (`:509`). Um anúncio parado não é "nada
esperando" — é o estado que mais pede decisão. **A tela canônica trata
`ja_foi_ao_ar` como estado que pede ação**, não como conclusão.

**c) "Seu gestor pode retomar".** Mora em `lib/veiculacao/estado.ts:297`,
não na tela. Ver DUVIDA-1.

**d) Selos verdes de conclusão em cima de campanha parada.** Consequência de
(a)+(b): as fases saem "Concluído" porque `concluidasPelaVeiculacao` fecha
`peca` e `no_ar` quando o anúncio *chegou* a rodar (`frases.ts:359`). Está
correto sobre o passado e errado como impressão geral.

## 11. Critérios de aceite, verificáveis em captura

1. Existe **uma** trilha de progresso na tela, com **um** contador.
2. No estado pausado, a captura não contém "Nada está esperando por você",
   nem selo de conclusão sem qualificação.
3. Nenhuma captura contém `R$ 0,00`, `0 conversas`, nota, estrela, semáforo,
   a palavra "erro", nem promessa de prazo.
4. Conversas aparecem como travessão **com** a linha explicativa ao lado.
5. Em 375px não há vazamento horizontal (`vazaNaHorizontal: false` no
   relatório do driver de captura).
6. A ação primária é única e visualmente dominante; nenhuma outra ação usa a
   mesma aparência de botão cheio.
7. Os cinco itens de navegação estão presentes: lateral ≥900px, inferior
   <900px.
8. Claro e escuro têm a mesma hierarquia, sem bloco que desapareça num tema.
