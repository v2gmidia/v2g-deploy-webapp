# Ligar o app no n8n — o lote 6, em 25/08

**Este documento foi escrito ANTES do disparo, de propósito.** Ele é a
camada 1 da marcação da execução de teste: o registro que diz, por escrito e
com antecedência, qual execução é descartável e por quê. Marcar depois seria
marcar quando já não dá para provar a intenção.

A §7 será completada com o resultado quando a execução parar.

O fio que faltava é uma variável de ambiente: `avisarN8n()` está em
`lib/pipeline/disparar.ts` desde o lote E, escrita e desligada, esperando
`V2G_N8N_WEBHOOK_URL`.

---

## 0. Comece por aqui: o que depende de você

**O lote fechou: o pipeline rodou ponta a ponta em 25/08 às 21:42 UTC, 133
segundos, US$ 0,141 de piso medido.** O que sobra é decisão, não trabalho
pendente deste lote.

1. **NÃO FAÇA DEPLOY DO BACKEND ATÉ RESPONDER DE ONDE O EASYPANEL BUILDA.**
   Produção roda 36 operações; o `main` do repo gera 34. As duas a mais —
   `POST /execucoes/{id}/decidindo-canal` e `/aguardar-tagueamento` — **nunca
   existiram em commit nenhum**, e o pipeline que rodou hoje passou pela
   primeira delas. Um deploy a partir do `main` apaga a rota e quebra o
   caminho do webhook com 404, sem ninguém tocar no n8n. A resposta está na
   aba **Source** do serviço no Easypanel. Ver §9.3.

2. **O gate de 0,60 promete bloquear e não bloqueia — e agora há prova de
   comportamento.** Confiança final 0,25, `requer_revisao = true`, o próprio
   `gerar-copy` escrevendo "revisão obrigatória", e a execução avançou até o
   fim. Em produção isso é copy com `{SERVIÇO}` no meio chegando ao cliente.
   **A proposta de conserto está na §9.2, com os dois caminhos e o custo de
   cada um.** A recomendação é fazer o caminho B agora (um parágrafo) e
   decidir o A depois. Não decidir é a única opção ruim.

3. **O `{SERVIÇO}` é buraco de onboarding, e o conserto é no lote 3.** Depois
   de doze campos, o `construir-oferta` não sabe o que o negócio vende. A call
   precisa capturar "o que você vende" de forma utilizável em copy. Aumentar o
   `min_length` da `descricao_livre` não resolve. Ver §9.1.

4. **O `LLM_MODELO` efetivo em produção continua não medido, e é acesso seu.**
   `GET /saude` não expõe. A conta da §3 e o piso da §7.1 usam o default do
   repo (`claude-opus-5`). Dentro da geração 5 é só reprecificar; noutra
   geração os tokens precisam ser **recontados** (§3.3).

5. **O custo real por agente está no log do container do Easypanel.** O piso
   medido é US$ 0,141; o real está entre ele e o teto de US$ 0,491. Quando
   você trouxer o log, a comparação fecha (§7.2).

6. **Rotacionar os segredos que passaram por chat em 25/08** —
   `V2G_BACKEND_TOKEN`, `ANTHROPIC_API_KEY`, o token do webhook, e a `anon` e
   a `service_role` do projeto `pirhqekfyirijakmdnxy`. O token do webhook
   segue em uso com o valor exposto, por decisão sua (§7.0).

---

## 1. O que estava errado no plano do dia, e virou medição

O briefing do lote 6 trazia três premissas. As três caíram, e nenhuma caiu
por opinião — caiu contra o JSON do workflow, o código do backend e o
`openapi.json` do ar.

| premissa do plano | o que a medição diz |
|---|---|
| "ela para lá, porque o portão é um formulário que alguém precisa abrir" | **Não há portão no caminho do webhook.** `Veio do formulario?` manda o ramo do webhook para `Resposta` e acaba; `Validar texto` está só no ramo do formulário. |
| "o `gerar_copy` de 600s fica depois do portão" | Fica **antes**. É o passo 7, roda desatendido. |
| "o lote 6 depende do lote 5 estar commitado" | Não depende. Os três campos do `RespostaExecucao` (`nome_negocio`, `criado_em`, `atualizado_em`) já estavam no ar antes da sessão começar. |

E uma quarta, que o briefing dava como fato: *"fechado com Header Auth,
testado nos dois casos negativos"*. O JSON **commitado** do nó `Webhook` tem
`credentials: None` e `options: {}`, e zero ocorrências de `X-V2G-Webhook`
nos dois arquivos. A contradição se resolveu na instância viva, medida pelo
Victor em 23/08: `authentication: headerAuth`, credencial "V2G webhook 2",
rascunho igual à versão publicada, 403 sem header e 403 com header errado.

**Ou seja: o JSON versionado está atrás da instância.** Vale como aviso para
a próxima sessão que for medir o workflow pelo arquivo.

---

## 2. O alvo, e por que não há alternativa

| | |
|---|---|
| negócio | `a85c37a9-df57-4829-985b-41bc306f8537` — "V2G" |
| execução | `98447192-3968-4fb1-8062-b14d6a8751ae` |
| nascida em | 19/08/2026 23:31:51 UTC, pelo primeiro disparo real do lote E |
| estado | `cadastro_completo` desde então — **seis dias parada** |
| `deve_varrer_site` | `false` (decisão, §4.1) |

**Reaproveitamos a execução órfã em vez de criar uma sexta.** O nó
`Execucao ja existe?` bifurca por `id_execucao` não vazio e reaproveita;
mandar vazio faria o n8n criar outra, que é o desfecho que a idempotência de
três camadas do lote E existe para impedir.

**Não há alvo alternativo hoje**, e isso não é preferência:

- dos 4 negócios do banco, só o `a85c37a9` tem cadastro completo;
- o `a0328fb8` ("Padaria Dona Zilda (FICTICIO)") tem `dados_ficticios = true`
  e é recusado no passo 2 do disparo — e "padaria" não tem slug no
  `knowledge/` de qualquer forma;
- os outros dois não têm nenhum dos seis campos obrigatórios.

### 2.1 O conteúdo vai sair genérico, e isso é sabido antes

A `descricao_livre` do alvo é:

> "Assinatura mensal que cuida do trafego pago de pequenos negocios com IA,
> no lugar da agencia."

É a V2G descrevendo a si mesma. Nenhum dos 10 slugs publicados
(`academia`, `barbearia`, `clinica-estetica`, `clinica-odontologica`,
`consultorio-medico`, `manicure`, `oficina-mecanica`, `petshop`,
`restaurante`, `salao-de-beleza`) serve. O desfecho provável é
`nicho = generico` com `requer_revisao = true`
(`classificar_nicho/agente.py:52-67`).

**O disparo prova o encanamento, não a qualidade do texto para um nicho
real.** Dito antes de gastar, para não virar decepção depois.

O `generico.md` tem 5 ângulos criativos, então o `gerar-copy` roda — a
armadilha do `manicure` (0 ângulos, 409 sem chamar o LLM) não pega aqui.

### 2.2 O nicho da coluna é inerte — e não existe escolha silenciosa

O alvo tem `businesses.niche = "Clínica / Consultório"`: um rótulo antigo,
que não é identificador da lista viva e que a validação do lote 4 recusaria
hoje. A pergunta era se esse valor sujo chega ao pipeline. **Não chega, por
caminho nenhum**, e foi medido dos dois lados:

| lado | medição |
|---|---|
| webapp | `lib/cadastro/montar.ts` não tem uma ocorrência de `niche` — `CadastroCompleto` não carrega nicho, o corpo do webhook também não. O `openapi.json` do ar confirma: 22 campos, nenhum de nicho. |
| backend | `grep -rn "niche"` sobre `src/` e `n8n/` devolve **zero**. E é estrutural: `src/db/negocio.py` é write-only sobre `businesses` (15 colunas no `MAPA`, `niche` fora), e não existe um único `select` sobre a tabela no backend inteiro. |

A `Entrada` do `classificar-nicho` tem exatamente dois campos,
`descricao_livre` e `nome_negocio`. **Não existe campo para receber nicho** —
não é convenção, é o schema. Quem escreve `execucoes.nicho` é só esse agente,
e ele sobrescreve o que estivesse lá.

**E um valor fora da lista não escolhe documento errado em silêncio.**
`knowledge/loader.py:49-55` faz lookup por arquivo e levanta
`NichoDesconhecidoError`, que vira **404** em quatro rotas
(`rotas.py:435, 465, 479, 872`), com a lista de disponíveis no corpo.
`"Clínica / Consultório"` procuraria `knowledge/Clínica / Consultório.md`,
não acharia, e falharia alto. O pior caso é ruidoso, que era exatamente a
garantia que o Victor pediu.

São dois comportamentos distintos, e confundi-los custa caro:

- nicho inválido **saindo** do `classificar-nicho` → o agente troca por
  `generico`, preserva o inventado em `candidatos_alternativos`, marca
  revisão, e o pipeline **segue**;
- nicho inválido **entrando** num agente seguinte → 404, e **para ali**.

O fallback existe e é publicado: `/saude` responde `nichos_carregados: 11` e
`/nichos` publica 10. A diferença é o `generico.md`.

---

---

## 3. O custo, medido

Prompts montados pelo código real e contados com `count_tokens`, modelo
`claude-opus-5`, slug `generico`, corpo de usuário com os dados reais do
negócio. Não é estimativa de tamanho de arquivo.

| agente | tokens entrada | teto saída | $ entrada | $ saída (teto) | **$ total** |
|---|---:|---:|---:|---:|---:|
| 3. classificar-nicho | 1.208 | 2.048 | 0,0060 | 0,0512 | **0,057** |
| 4. diagnosticar-orçamento | 1.473 | 3.072 | 0,0074 | 0,0768 | **0,084** |
| 6. construir-oferta | 4.495 | 4.096 | 0,0279 | 0,1024 | **0,130** |
| 7. gerar-copy | 2.240 | 8.192 | 0,0140 | 0,2048 | **0,219** |
| **total** | **9.416** | **17.408** | **0,055** | **0,435** | **0,491** |

Com `claude-sonnet-5` o teto cai para **US$ 0,29**.

**Teto não é previsão.** `max_tokens` é ceiling; a única medição real de
saída que existe no banco (outro agente, extração de perfil, 18/08) deu 2.455
e 3.361 tokens contra teto maior. Com saída em 50% do teto: **US$ 0,27**. Em
25%: **US$ 0,16**.

O custo é quase todo saída — o `gerar-copy` sozinho é 45% do total, por causa
do `max_tokens` de 8.192. **Quem manda é `max_tokens`, não o tamanho do
prompt.**

### 3.1 O cache encarece, não barateia

`construir-oferta` e `gerar-copy` pedem `cachear_sistema=True`. Numa execução
única é tudo **escrita** de cache, a 1,25× a entrada; o desconto de 0,10×
só aparece da segunda execução em diante, dentro da janela. Os 9.416 tokens
de entrada viram 11.058 tok-equivalente.

### 3.2 Thinking é pago e não é visto

`claude-opus-5` tem thinking ligado por padrão, e o `max_tokens` limita
thinking + resposta juntos (`src/llm/anthropic_client.py:11`). Parte do teto
de saída é raciocínio que se paga e não aparece no resultado. É por isso que
a medição de saída da §7 é **piso**, não exato.

### 3.3 O tokenizer muda entre gerações — não só o preço

Medido na mesma passada, mesmo texto:

```
claude-opus-5        4.376 tokens
claude-sonnet-5      4.376 tokens     (idêntico — mesma geração)
claude-opus-4-5-…    3.403 tokens     (29% menos)
```

Consequência para a §0 item 2: se produção estiver com um modelo de outra
geração, a tabela da §3 não vale — **a contagem precisa ser refeita**, não só
o preço. Dentro da geração 5, vale para os dois sem recontar.

---

## 4. As decisões tomadas nesta sessão

### 4.1 `deve_varrer_site: false`

A execução `98447192` tem `tem_site` e `site_url` **nulos**, apesar de o
negócio ter site e de o payload de 19/08 tê-los mandado — o backend não
persistiu os dois. Varrer o que a execução não guardou não produziria nada, e
economiza um agente.

O contrato avisa que `deve_varrer_site` ausente vira `false` em silêncio; aqui
é `false` **por decisão**, o que é diferente de `false` por omissão.

### 4.2 O ensaio a seco e o disparo moram no mesmo arquivo

`scripts/ensaio-webhook.ts` monta o corpo e, com `--enviar`, manda. Os dois
modos compartilham a montagem de propósito: um script de disparo separado
poderia mandar corpo diferente do que foi conferido, e a conferência
deixaria de valer no exato momento em que ela importa.

### 4.3 A marcação da execução — em duas camadas, e a segunda é exceção

**Não há onde pendurar uma marca de teste.** Medido dos dois lados:
`CadastroCompleto` tem 22 campos e nenhum de teste (varridos por
`test`/`ficticio`/`mock`/`sandbox`); `execucoes` tem 39 colunas e nenhuma
flag; `dados_ficticios` é de `businesses` e bloquearia o disparo antes de
sair.

O candidato natural era `execucoes.nome_negocio`, que é texto livre e aparece
na tela de operador. **Marcar antes seria erro**, e a medição é o motivo:
`nome_negocio` é lido por `classificar_nicho` e `construir_oferta` — a marca
entraria no prompt de dois dos quatro agentes e contaminaria o texto que o
teste existe para produzir.

Então:

1. **antes** — este documento, com o id, o alvo, a data, o custo e o motivo;
2. **depois** que o pipeline parar — a marca em `execucoes.nome_negocio`.

> ### EXCEÇÃO REGISTRADA À `disparo-pipeline.md` §7.2
>
> A §7.2 diz que **`business_id` é a única coluna de `execucoes` que o webapp
> escreve**, e a regra é boa: ela impede que alguém "corrija" um campo do
> backend e crie um segundo dono da verdade.
>
> A escrita de `nome_negocio` da camada 2 **quebra essa regra**, e tem
> autorização explícita do Victor em 25/08 para este caso.
>
> **Por que não vira precedente:** não é o webapp escrevendo, é um operador à
> mão, uma vez, numa execução que já terminou e que existe para ser
> descartada. O que a §7.2 protege — código de produto decidindo sozinho o
> que uma coluna do backend significa — continua valendo inteiro.
>
> Se aparecer uma segunda necessidade dessas, o certo é uma coluna nossa, não
> uma segunda exceção.

### 4.4 O script mentia no código de saída — e isso não é detalhe

Achado ao verificar o próprio instrumento antes de confiar nele: o
`ensaio-webhook.ts` imprimia **"VEREDITO: o corpo tem os seis campos"** e saía
com **código 127**.

O `process.exit()` derrubava o processo no Windows com
`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` do libuv — o
`supabase-js` deixa o socket de keep-alive do undici aberto, e matar o
processo por cima dele estoura a assertion depois do texto já ter sido
impresso.

Texto dizendo uma coisa e `$?` dizendo outra é a forma mais silenciosa de
mentir: quem lê acredita no texto, quem automatiza acredita no código de
saída, e os dois discordam sem nenhum erro aparecer. **É a família do gate de
0,60 da §6**, na escala de um script.

Corrigido nos três scripts desta sessão: `main()` que devolve o código,
`process.exitCode = await main()` no fim, e nenhum `process.exit()` em
caminho nenhum. Conferido nos dois sentidos — sucesso sai 0, negócio
inexistente sai 1.

---

---

## 5. Auditoria do segredo

O valor do token nunca passou por chat. Pedido e recusado, com o motivo do
Victor registrado: seis chaves já vazaram numa imagem no mesmo dia.

Conferido que a leitura é só de ambiente:

```
scripts/ensaio-webhook.ts:147   const token = process.env.V2G_N8N_WEBHOOK_TOKEN;
lib/pipeline/disparar.ts:247    const token = process.env.V2G_N8N_WEBHOOK_TOKEN;
```

Nenhuma outra ocorrência, nenhuma atribuição a literal, nenhuma string de 20+
caracteres no script que não seja nome de campo. O `.env.example` tem a chave
**vazia**, documentada — antes desta sessão ele nem mencionava a variável,
embora o código já a lesse.

O `.env.local` está no `.gitignore` e não foi commitado.

---

## 6. ACHADO — o gate de 0,60 é regra inerte

**Medido nesta sessão, não consertado.** O Victor decidiu registrar e não
mexer, porque o conserto é escolha dele: ou o código passa a bloquear, ou o
documento para de prometer.

O `CLAUDE.md` do backend, seção 10, item 3, está escrito como regra dura:

> Gate de confiança 0.60 em agente de texto → **força revisão humana**, mesmo
> com "confio na IA" marcado.

**Não força.** A evidência, dos dois lados do sistema:

**No backend** — `src/db/execucao.py`, `transicionar()`: a tabela
`TRANSICOES_VALIDAS` é indexada **só pelo status atual**, e `requer_revisao`
não aparece nela em lugar nenhum. `PIPELINE_TEXTO_RODANDO → AGUARDANDO_FOTOS`
é transição válida sem condição, então `POST /execucoes/{id}/aguardar-fotos`
responde 200 com `requer_revisao = true` sem reclamar.

Os usos de `requer_revisao` no backend inteiro são três, e nenhum é gate:

| categoria | onde |
|---|---|
| agentes marcando | `classificar_nicho/agente.py:61`, `gerar_copy/agente.py:111,117,123` |
| persistindo | `execucao.py:351` → `marcar_revisao()`, que só seta a flag e acrescenta o motivo |
| listando | `repositorio.py:103` e `:177` — o `.eq("requer_revisao", True)` do `GET /execucoes-em-revisao` |

**Zero ocorrências em condicional de fluxo.**

**No n8n** — o IF `Requer revisao humana?` tem o ramo verdadeiro indo para um
nó chamado `Fila de revisao humana` que é um **noOp**, e esse noOp cai direto
em `9. Aguardar fotos`.

**Conclusão: o backend grava, o n8n não age, e nada para.** É etiqueta dos
dois lados — uma fila que ninguém é obrigado a olhar antes de avançar.

É a mesma classe de defeito do [`regra-inerte.md`](../regra-inerte.md): regra
que parece agir e não age. E é pior que a do CSS, porque esta promete
supervisão humana sobre texto que vai para anúncio pago.

**Como isso quase passou:** a primeira medição viu `requer_revisao = True`
sendo escrito em `agente.py:52-67` e *inferiu* comportamento de fluxo. A
diferença entre "o código escreve X" e "o sistema faz Y" só apareceu quando
as duas medições — a do código do backend e a do JSON do n8n — foram postas
lado a lado e discordaram.

---

## 7. O disparo

### 7.0 As duas tentativas que não chegaram aos agentes

Registradas porque **as duas custaram zero e as duas ensinaram**, e porque um
registro que só conta a tentativa que deu certo é um registro que mente por
omissão.

| | disparo 1 | disparo 2 |
|---|---|---|
| resposta do webhook | `403 Forbidden` | **`200 OK`**, 228 ms |
| corpo | `Authorization data is wrong!` | `{"message":"Workflow was started"}` |
| onde morreu | no nó `Webhook`, na autenticação | no nó `Webhook`, **depois** de responder |
| erro do n8n | — | `Node Webhook does not have access to the credential` |
| duração no n8n | — | **10 ms** |
| agentes que rodaram | nenhum | nenhum |
| custo | US$ 0,00 | US$ 0,00 |
| `execucoes` antes/depois | 5 / 5 | 5 / 5, e a `98447192` não foi tocada |

**Causa do 403:** o valor no `.env.local` não era o da credencial. Ele veio de
um bloco de ambiente de outro projeto — no mesmo bloco vinha um
`NEXT_PUBLIC_SUPABASE_URL` apontando para um terceiro projeto
(`pirhqekfyirijakmdnxy`, nem o V2G-SITE nem o Oregon) e uma `ANTHROPIC_API_KEY`
diferente da em uso. Só o token do webhook foi gravado; o resto foi recusado
justamente por essa divergência, e a recusa evitou que o disparo fosse contra
o banco errado.

**Causa do 200-que-não-rodou:** a credencial pertencia a **outro usuário da
instância compartilhada** do n8n. O nó tinha a credencial referenciada mas
não tinha acesso a ela.

**Correção, em 25/08:** credencial recriada sob a conta do Victor, workflow
republicado.

> ### ACHADO — `200 OK` do webhook NÃO prova que o pipeline começou
>
> É o achado mais importante desta rodada, e ele não é sobre o n8n: é sobre
> **o nosso código**.
>
> O nó tem `responseMode: onReceived`: o n8n responde no **recebimento**, antes
> de executar coisa alguma. O disparo 2 provou isso da pior maneira possível —
> `200 OK` em 228 ms, e o workflow morto 10 ms depois, no primeiro nó, sem que
> nada do nosso lado ficasse sabendo.
>
> `avisarN8n()` (`lib/pipeline/disparar.ts`) confere `resposta.ok` e trata 2xx
> como sucesso. O cabeçalho dela diz, com todas as letras, que *"um 403
> significa PIPELINE QUE NÃO COMEÇOU, e engolir isso calado é o mesmo defeito
> que o cadastro que nasce e não anda"*. **A checagem está certa e é
> insuficiente**: ela pega o 403 e não pega o 200 seguido de morte no primeiro
> nó — que é indistinguível de sucesso, do lado de cá.
>
> Em produção isso apareceria como: cliente completa o cadastro, execução
> nasce, log limpo, `cadastro_estado = 'enviado'`, e o pipeline nunca anda. O
> mesmo silêncio de 19/08 que este lote existe para acabar, com uma causa
> diferente.
>
> **Não consertado neste lote.** O conserto não é trivial e tem pelo menos
> três formas, todas com custo: o n8n mudar para `responseMode: lastNode` (o
> webapp passaria a esperar o pipeline inteiro, o que o §2.1 do
> `disparo-pipeline.md` recusa por bom motivo); um nó de callback no início do
> fluxo que carimbe a execução; ou o relógio da `/saude-meta` da §5.3 do
> `disparo-pipeline.md`, que já existe e pegaria o caso — com 20 minutos de
> atraso.
>
> **O terceiro já está construído e é o que cobre isto hoje.** O que falta é
> saber que ele é a rede, e não um extra: uma execução que fica em
> `cadastro_completo` depois de um 200 é exatamente o que ele detecta.

### 7.1 O disparo que rodou

**25/08/2026, 21:42:08 UTC (18:42:08 local). Sexta tentativa, e a que passou.**

`200 OK` em 169 ms, e desta vez o `200` significou o que diz: cinco segundos
depois a linha saiu de `cadastro_completo`, onde estava desde 19/08.

```
21:42:08  disparo
21:42:13  cadastro_completo -> pipeline_texto_rodando     (+5s)
21:42:23  GRAVOU classificacao                            (+15s)
21:42:43  GRAVOU diagnostico                              (+35s)
21:43:09  GRAVOU oferta / status -> decidindo_canal        (+61s)
21:44:05  GRAVOU copy / status -> aguardando_fotos        (+117s)
```

**Terminou em `aguardando_fotos`, exatamente como a §3.1 previu** — sem
portão, sem formulário, sem nada segurando. Duas execuções não foram criadas:
`execucoes` seguiu com 5 linhas, e a `98447192` foi reaproveitada.

#### O tempo, por agente

| agente | acumulado | levou | saída / teto |
|---|---:|---:|---:|
| 3. classificar-nicho | 31,2 s | 31,2 s | 144 tok · 7% |
| 4. diagnosticar-orcamento | 51,6 s | 20,4 s | 684 tok · 22% |
| 6. construir-oferta | 77,1 s | 25,5 s | 690 tok · 17% |
| *decidir-canal* | ~77 s | — | **não medível — ver §9.3** |
| 7. gerar-copy | 133,3 s | 56,1 s | 1.916 tok · 23% |
| 5. varrer-site | — | não rodou | como decidido na §4.1 |

#### O custo — estimativa contra medição

| | |
|---|---:|
| estimativa, teto (§3) | US$ 0,491 |
| **piso medido** | **US$ 0,141** |
| entrada (determinística) | US$ 0,055 |
| saída (o que foi gravado) | US$ 0,086 |

**A saída real ficou entre 7% e 23% do `max_tokens`.** A ressalva de que teto
não é previsão se confirmou com folga — e note que o agente mais caro no teto
(`gerar-copy`, 8.192) foi também o que mais se aproximou em proporção, sem
chegar perto do limite.

Ficou **abaixo dos US$ 0,22 do plano do dia**, mesmo tendo rodado o Workflow A
inteiro em vez de parar num portão que não existe. O real está entre o piso e
o teto, mais perto do piso; a diferença é thinking cobrado e não gravado, e o
`decidir-canal` soma por cima sem ser medível.

#### O que a IA escreveu

`nicho = generico`, confiança **0.83**. A justificativa reconhece o motivo
certo:

> "A descrição — 'assinatura mensal que cuida do tráfego pago de pequenos
> negócios com IA, no lugar da agência' — é um serviço B2B de
> marketing/software, que não corresponde a nenhum dos nichos de negócio local
> disponíveis."

`construir-oferta` devolveu confiança **0.25** e **se recusou a inventar**:
`urgencia` vazia, `prova_de_confianca` vazia. O raciocínio está escrito:

> "disponibilidade = 'MIL PESSOAS DIA' (indica folga, portanto urgencia
> proibida por ser fabricada)"

E auditou os dados de onboarding um a um: diferencial = autoelogio, garantia
"Alegria" = *"nao e garantia verificavel nem acionavel"*, prazo "1 MIM" =
*"ambiguo, nao utilizavel em copy"*.

`gerar-copy` devolveu **5 ângulos** com confiança 0.54, e três vezes escreveu
que não inventou o que faltava — depoimento, garantia, prazo. O texto íntegro
dos cinco ângulos e das cinco observações está em
`acompanhamento-98447192.json` (não versionado) e foi entregue ao Victor no
fechamento do lote.

**A regra do produto apareceu sozinha do outro lado do sistema.** Ninguém
disse aos agentes que "grátis não existe" nem que celebração vem depois da
conquista; eles chegaram em "urgência fabricada é proibida" e "não inventei
garantia" a partir dos próprios dados. É a melhor notícia desta execução, e
não estava no escopo de nada.



*A ser preenchido quando a execução parar. O que entra aqui:*

- *custo real por agente, medido, contra a estimativa da §3*
- *o nicho classificado e a confiança*
- *o que o `construir-oferta` escreveu, inteiro*
- *o que o `gerar-copy` escreveu, os ângulos inteiros*
- *o tempo por agente*
- *qualquer erro ou aviso no caminho, mesmo que não tenha parado nada*

### 7.2 Como o tempo e o custo serão medidos — e por que tem que ser durante

O backend calcula o custo de cada chamada e joga só em `stdout`
(`src/llm/anthropic_client.py:157-159`). **Não existe coluna de token, custo
ou usage em `execucoes` nem em nenhuma tabela do pipeline** — conferido no
`information_schema` por `%custo%|%token%|%usage%|%usd%`. Depois que a
execução termina, não há de onde ler.

`scripts/acompanhar-execucao.ts` reconstrói o que dá, de fora: `execucoes`
tem colunas jsonb que os agentes preenchem uma a uma (`classificacao`,
`diagnostico`, `oferta`, `copy`), e o instante em que cada uma deixa de ser
nula marca o fim daquele agente.

**Os dois limites, ditos antes:**

- o "levou" por agente inclui o nó do n8n e a rede, não só o LLM — é **teto
  por agente**, não o tempo exato do modelo;
- a saída contada a partir do jsonb é **piso**, porque o thinking é cobrado e
  não fica gravado. A diferença entre esse piso e o número do log do
  container é exatamente o raciocínio pago e não visto.

O número exato de custo só existe no log do container (Easypanel) e nos dados
de execução do n8n. Os dois são acesso do Victor.

---

## 8. Como se confere

| trava | estado |
|---|---|
| `pnpm conferir` | verde, 99/99 |
| `pnpm typecheck` | verde, com os três scripts novos |
| segredo em literal | nenhum — §5 |
| código de saída dos scripts | confere com o texto — §4.4 |
| corpo do webhook | ensaiado a seco contra o negócio real: os seis campos que o n8n lê saem preenchidos |
| projeto Supabase efetivo | ref `ushccxpoxjikzqnwhgfd` (V2G-SITE), conferido no ambiente carregado |
| URL do webhook | `/webhook/`, produção — não `-test` |
| execução duplicada | impedida pelo nó `Execucao ja existe?` (§2), confirmada pela contagem de linhas na §7 |

---

## 9. A fila que este lote abriu

Quatro itens, todos **medidos e não consertados**. Nenhum é do escopo do lote
6; os quatro apareceram porque o pipeline rodou pela primeira vez com dado
real, e nenhum deles apareceria de outra forma.

### 9.1 BURACO DE ONBOARDING — o `{SERVIÇO}` que ninguém preenche

**Depois de ler doze campos, o `construir-oferta` não sabe o que o negócio
vende.** A frase dele, literal:

> "Falta tambem saber QUAL e o negocio/servico entregue."

E o `gerar-copy` teve que compensar com um marcador:

> "o onboarding não informou qual é o serviço vendido. Todos os textos usam o
> marcador {SERVIÇO} onde o nome real precisa entrar antes de subir. **Nenhum
> anúncio pode rodar com o placeholder.**"

Os cinco textos saíram com `{SERVIÇO}` no meio. Não é falha do agente — é
falha da coleta.

**A causa:** `descricao_livre` tem `min_length=10` e nada mais. Dez
caracteres passam na validação e não produzem o que o copy precisa. O campo
foi desenhado para provar que a pessoa escreveu alguma coisa, não para
alimentar um redator.

**Onde isso se conserta, e não é aqui.** É no lote 3 — as perguntas do raio-x
da call de onboarding. A call precisa capturar **"o que você vende"** de forma
utilizável em copy: o substantivo que entra na frase *"Você não acorda
querendo contratar ___"*. Hoje nenhuma pergunta do fluxo produz isso.

**O que NÃO conserta:** aumentar o `min_length`. Cem caracteres de texto vago
passam igual. O que falta é uma pergunta específica, não um campo maior.

### 9.2 O gate de 0,60 — agora com prova de comportamento

A §6 mediu no código que `requer_revisao` não é gate. **Esta execução
provou em produção**, e a prova é mais forte que a leitura:

```
confianca_minima   0.25
requer_revisao     true
motivos_revisao    ["classificar-nicho: confianca 0.83",
                    "construir-oferta: confianca 0.25",
                    "decidir-canal: confianca 1.00",
                    "gerar-copy: confianca 0.54"]
status final       aguardando_fotos
```

O próprio `gerar-copy` escreveu, no corpo da resposta, *"Confiança abaixo de
0.60 e revisão obrigatória"*. **A execução avançou assim mesmo**, até o fim do
Workflow A, sem nada segurá-la.

**O que isso significa em produção:** copy com `{SERVIÇO}` no meio,
autodeclarado como não-publicável pelo agente que o escreveu, chega ao
cliente. O `CLAUDE.md` do backend promete que a confiança abaixo de 0,60
força revisão humana. Não força.

> #### PROPOSTA DE CONSERTO — dois caminhos, com o custo de cada um
>
> **Não implementado. A escolha é de produto, não de código.**
>
> **Caminho A — o código passa a bloquear.**
>
> A transição para `aguardando_fotos` recusa quando
> `confianca_minima < CORTE`, e a execução para num estado de espera de
> revisão. Exige: um estado novo no enum (`aguardando_revisao`, que hoje não
> existe — `EstadoExecucao` tem seis valores e nenhum é de falha ou espera de
> operador), uma transição nova em `TRANSICOES_VALIDAS`, uma rota para o
> operador liberar, e uma tela onde ele lê o que a IA escreveu e decide.
>
> *Custo:* migration no enum, mexer na máquina de estados do backend, uma
> rota, uma tela. É o lote inteiro de outra pessoa.
> *Ganho:* a promessa passa a ser verdade, e nenhum copy com placeholder sobe
> sem alguém ver.
> *Risco:* execuções travadas esperando um operador que pode não existir
> ainda. Precisa de quem olhe a fila — hoje ninguém é obrigado.
>
> **Caminho B — o documento para de prometer.**
>
> A seção 10 item 3 do `CLAUDE.md` do backend é reescrita para descrever o que
> o sistema faz: a confiança baixa **marca** a execução e a coloca na fila de
> `GET /execucoes-em-revisao`, que alguém precisa abrir. Não bloqueia nada.
>
> *Custo:* um parágrafo.
> *Ganho:* ninguém mais lê o documento e acredita numa rede de segurança que
> não existe. O risco deixa de ser invisível.
> *Risco:* o buraco continua aberto — a diferença é que passa a ser um buraco
> conhecido, e não uma proteção imaginária.
>
> **A recomendação desta sessão é fazer B agora e decidir A depois.** O B custa
> um parágrafo e elimina o pior efeito, que é alguém confiar numa proteção
> inexistente. O A é um lote, e enquanto ele não existe, o B é o que impede a
> decisão errada baseada em documentação errada.
>
> **O que não é opção:** deixar como está. Hoje o documento promete e o
> sistema não cumpre, que é a pior das três combinações.

### 9.3 `decidir-canal` — e a deriva repo↔deploy que ele revelou

> #### CORREÇÃO, 25/08 — a conclusão original desta seção estava ERRADA
>
> **O que estava escrito aqui, e não se apaga:** que a lista de oito rotas
> ausentes do lote 5 "estava errada quando foi escrita", porque eu baixei o
> `openapi.json` às 16:52 e de novo depois do disparo e obtive **81.961 bytes
> byte por byte idênticos**, concluindo que não houve deploy no meio.
>
> **O erro de raciocínio, e ele vale mais que o fato:** as minhas duas
> leituras são *ambas posteriores ao evento*. Duas medições idênticas depois
> de uma mudança não dizem nada sobre antes dela. A janela **14:09 → 16:52
> ficou inteira fora**, e é dentro dela que o deploy aconteceu.
>
> A sessão do lote 5 tinha o arquivo salvo da leitura das 14:09, commitado em
> `docs/openapi/2026-08-23.json` (`582a99a`): **55.344 bytes, 25 paths, 26
> operações**, contra os 81.961 bytes e 36 operações do meu. Dez operações
> ganhas, zero perdidas. **A lista dela estava certa quando foi escrita** e
> ficou obsoleta em poucas horas.
>
> É o mesmo defeito que este documento acusa em outros lugares, cometido por
> mim: confundir "o que eu observo agora" com "o que era verdade antes". Um
> `diff` entre duas leituras só mede a janela entre elas.

**O que segue valendo:** hoje as oito rotas estão publicadas, e o
`decidir-canal` rodou de verdade no disparo da §7.1 — confiança 1.00 em
`motivos_revisao`, e o status passou por `decidindo_canal`. Uma rota 404 não
faz isso.

#### O achado grande, e ele é um risco ativo para este lote

A sessão do lote 5 gerou o OpenAPI a partir do `main` real do backend, num
worktree isolado no commit `65881e5`: **34 operações**. Produção tem **36**.
As 34 do repo estão todas no ar; as duas a mais, não estão no repo.

```
POST /execucoes/{id_execucao}/decidindo-canal        em producao, NUNCA em commit nenhum
POST /execucoes/{id_execucao}/aguardar-tagueamento   idem
campo RespostaExecucao.canal_confirmado              idem
```

Conferido independentemente desta sessão, contra o `openapi.json` de
produção: as duas rotas estão publicadas e o campo existe no schema.

**Produção está rodando código que não está no repositório.** Não é "o repo
está atrasado em relação ao deploy" — é o repo **não conter** o que está
rodando. É o cenário do `docs/deriva-repo-deploy.md`, cuja nota de superação
o dava por negado.

> #### O RISCO DIRETO, e é por isso que isto está aqui e não só no doc do lote 5
>
> **O caminho que acabou de funcionar depende dessas rotas.** O pipeline da
> §7.1 passou por `decidindo_canal`, o que significa que o workflow chama
> `POST /execucoes/{id}/decidindo-canal`.
>
> **Um deploy feito a partir do `main` do backend apaga essa rota**, e o
> caminho do webhook quebra com 404 sem que ninguém encoste no n8n. Quem
> fizer esse deploy vai achar que está apenas publicando o lote 5.
>
> Isso transforma o fechamento deste lote em algo frágil: o fio foi ligado,
> mas ele passa por um trecho de código que não existe em lugar nenhum além
> do container que está rodando. Se aquele container for recriado do repo, o
> trecho some.
>
> **A pergunta que resolve está na aba Source do serviço no Easypanel:** de
> onde ele builda. Enquanto ela não for respondida, o backend não deve
> receber deploy — nem o do lote 5.

#### O segundo achado: ele gasta e não grava

O `decidir-canal` **consome tokens e não persiste nada**. `canal_confirmado`
está no `RespostaExecucao` e **não é coluna de `execucoes`** — as 40 foram
conferidas. O único rastro que ele deixa é a string em `motivos_revisao`.

Consequência: o custo dele não entra em nenhuma medição de fora (o
`custo-piso-execucao.ts` não consegue contá-lo), e a decisão que ele tomou
não pode ser lida depois — nem por operador, nem por auditoria.

### 9.4 Resíduo de clínica no `generico.md`

O `diagnosticar-orcamento`, com nicho `generico`, num SaaS B2B de marketing,
escreveu:

> "Vale confirmar com o cliente se esse valor e por **procedimento/servico
> isolado ou por tratamento/pacote completo**."

"Procedimento" e "tratamento" são vocabulário de clínica. O fallback genérico
não está neutro — carrega vocabulário do nicho a partir do qual foi escrito.

É pequeno e é sintoma: o `generico.md` deveria ser o documento que **não**
assume ramo nenhum, e é justamente o que roda quando o negócio não se
encaixa em lugar nenhum — ou seja, exatamente quando um vocabulário emprestado
mais destoa.
