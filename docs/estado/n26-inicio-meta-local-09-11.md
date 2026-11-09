# N26 — Início / fonte Meta e série diária — 09/11/2026

## 0. Entrega local estável para revisão da Central

**Implementação e testes dirigidos concluídos às 01:06 BRT.** Início passa a consultar o mesmo inventário autenticado de Anúncios, sem exigir execução legada ou onboarding concluído para apresentar campanhas e resultados. Cadastro continua uma pendência independente; não foi marcado concluído por métricas ou existência de campanha.

**149 testes Node PASS, zero falhas/skips; 70/70 conferências do Início PASS; typecheck sem incremental PASS.** Isso é prova local com portas fictícias, não leitura nova do Dúú, release ou homologação de produção.

**Próximo dono: Central**, para revisão independente, interop com a fixture do backend, suíte/build final e prova visual desktop/mobile na porta livre coordenada 3001. Não executei build/dev, não toquei no serviço Docker da porta 3000 e não usei BM/WhatsApp ou sessão QA nesta implementação. A bancada está em `/exemplo/inicio-meta`, dev-only.

Sem Git, commit, push, deploy, migração, banco/Storage, `.env`, token, chamada paga, mudança de papel/permissão ou publicação de anúncio. Não há novo ato externo implícito nesta entrega. Arquivos de outros donos não foram alterados; a extensão mínima do parser compartilhado é identificada abaixo.

## 1. Mapa e mudanças

- `app/(protected)/inicio/page.tsx`: lê conta/período e chama `anunciosDoNegocioSelecionado`, a mesma porta autenticada de Anúncios. Não envia negócio recebido da URL; o leitor existente resolve propriedade e conta da sessão. Erro de Auth com objeto user também é negado. Período inválido produz erro de período sem chamar a fonte. Saíram as consultas extras mensais/período ao consolidado antigo feitas pela própria página.
- `TelaDoInicio.tsx`: recebe leitura/escopo explicitamente e usa o novo resumo antes dos ramos de preparação legados. Não altera `estado.etapas` nem prova de veiculação. As fixtures antigas sem essa prop conservam seu caminho; conclusão dispensável comprovada, pergunta diária já autorizada e atualizações existentes continuam disponíveis pelo complemento. Limite mensal não recebe gasto do período selecionado como se fosse gasto mensal: continua não medido nesse complemento.
- `ResumoMetaDoInicio.tsx` + CSS Module: composição editorial existente, fonte/conta/período/moeda/fuso/data, valores e cobertura; pendência cadastral separada. Frases são “Houve entrega neste período”, “Campanhas encontradas” ou ausência na consulta — nunca “está no ar” por status configurado ou entrega histórica. Controles de conta e link para Anúncios conservam conta/datas. Nenhuma venda, conversa, ROI ou semáforo foi inventado.
- `lib/inicio/resumo-meta.ts`: agrega **somente campanhas com observação**, sem somar filhos. Campanhas `sem_dados` não entram como zero nem apagam a campanha medida. Campo null de campanha COM observação deixa aquele agregado null; não é descartado da soma. Cobertura textual mostra quantas campanhas foram observadas do total retornado. Se houver overflow, a métrica fica desconhecida.
- `lib/inicio/serie-meta.ts`: valida array opcional, calendário/ordem/duplicação/tipos/inteiros seguros e correspondência com os dias observados. Dias ausentes são slots null no calendário completo. Quando o total existe, soma conhecida não pode superá-lo e soma integral precisa conferir; total null permite conservar pontos diários conhecidos e lacunas, sem inferir valor total.
- **Mudança compartilhada mínima:** `lib/anuncios/contrato-meta.ts` acrescenta `metricas.serieDiaria` opcional no modelo e chama esse leitor para `metricas.serie_diaria` do wire. Totais passam pelas validações anteriores. Série malformada presente recusa o gráfico, preserva totais válidos e fornece estado inconsistente explícito; série ausente em backend antigo não quebra o inventário. Componentes/fluxo de Anúncios não foram redesenhados.
- `lib/inicio/periodo.ts`: 31 dias inclusivos aceitos; 32 ou mais, repetição de parâmetros e atalhos antigos grandes são recusados com aviso. Não há encolhimento silencioso do período; a página não consulta a fonte quando existe esse erro. As funções históricas de calendário continuam existindo, mas sua saída passa pela validação antes de consulta Meta.

## 2. Contrato e semântica do gráfico

Contrato negociado com 07/08 via Central: permanece `e28-meta-ads-read-v1`, campo opcional por entidade:

```text
metricas.serie_diaria = [
  { dia: "AAAA-MM-DD", gasto_centavos: inteiro|null,
    impressoes: inteiro|null, cliques_totais: inteiro|null }
]
```

Ordem crescente, uma linha por dia observado, zero somente medido, datas correspondentes a `dias_com_observacao`. Backend antigo sem o campo: totais continuam visíveis e gráfico explica indisponibilidade. Não se copiou o total para dias, não se interpolou e não se usou uma série Dúú inventada.

O gráfico de investimento usa **barras independentes**, com ponto no zero medido e lacuna visível no null. Não existe linha ligando dias desconhecidos. O eixo temporal contém todos os dias do recorte, sem comprimir as ausências. A tabela acessível permite conferir investimento/impressões/cliques por dia. Moeda desconhecida não desenha barras monetárias como se a unidade fosse conhecida.

Agregação diária usa o mesmo subconjunto de campanhas observadas dos totais. Se duas campanhas observadas têm calendários diferentes, dia/campo não informado por uma delas permanece null no agregado daquele dia; `sem_dados` é excluído com a cobertura explicitada. Se uma campanha observada não tiver série ou a série for inválida, não se apresenta um gráfico parcial disfarçado de agregado completo.

Caso obrigatório coberto: **uma campanha medida + nove sem_dados** conserva o resumo positivo e o gráfico da campanha medida, com cobertura **1 de 10**, sem transformar as nove em zero. Outro caso: campo total null com um dia 100 e outro null mantém o ponto 100 e a lacuna; o agregado do período permanece “Não medido”.

## 3. Atualização, isolamento e cadastro

O seletor existente conserva o render anterior durante a navegação. Depois de falha transitória, o componente conserva a última leitura confirmada **somente na memória da mesma montagem** e no mesmo perfil/negócio/conta/período. Exibe aviso e a data original; não afirma nova medição. Não usa localStorage, token ou persistência entre sessões.

Troca de perfil/negócio muda a chave da montagem e a chave da memória inclui perfil, negócio, datas e conta solicitada. A resposta de sucesso também precisa corresponder ao escopo antes de ser mostrada. Erros de acesso/escopo/período/ausência de conta não reutilizam os números anteriores; uma negação de acesso limpa a memória. O teste do componente real com hooks substituídos exercitou sucesso → falha transitória → troca de perfil → negação → nova falha.

Pendência vem da leitura existente de onboarding e não é substituída por presença de campanha ou métrica. Inversamente, cadastro incompleto não altera uma campanha em “preparação”. O `estadoDoCliente` ainda fornece fatos operacionais/perguntas/atualizações e pode fazer leituras legadas internas: não foi reescrito neste recorte. A falha desse legado não substitui o inventário Meta recebido pelo novo ramo.

## 4. Bancada para a prova visual da Central

- Rota: `/exemplo/inicio-meta`.
- Guarda: `process.env.NODE_ENV !== "production" ? await import(...) : null`; fora do desenvolvimento chama `notFound()`.
- Módulo fictício separado: `app/exemplo/_inicio_meta/Previa.tsx`.
- Sentinela: `V2G_INICIO_META_FICTICIO_0911`.
- Componente real `ResumoMetaDoInicio` dentro do Casco editorial existente; sem sessão/banco/backend nessa fixture.
- Cenários no seletor: medição + cadastro pendente; backend antigo sem série; lacunas/null/zero; falha após leitura confirmada. Todos os valores e identidades são inteiramente fictícios.

A guarda/sentinela foi conferida localmente por código/teste. **404 e ausência da sentinela no build ainda devem ser provados pela Central**, que coordena `.next`. Não usei ou iniciei localhost:3000/3001 e não tirei capturas desta versão. O CSS limita rolagem horizontal ao gráfico/tabela, mantém foco, tokens de tema e composição mobile; isso ainda depende da inspeção visual coordenada, não de declaração baseada só em CSS.

Skill Impeccable local lida, contexto executado uma vez para o alvo existente, playbooks harden/operate/craft-floor consultados. Preservados PRODUCT/DESIGN, paleta, temas e tipografia editorial; não houve redesign ou atualização da skill. Revisão final independente é a da Central/revisor coordenado, sem novos agentes criados por esta frente.

## 5. Testes executados

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-inicio-meta.mjs scripts/conferir-anuncios-meta.mjs scripts/conferir-anuncios-meta-integracao.mjs scripts/conferir-recepcao-inicio.mjs scripts/conferir-carregamento-inicio.mjs
```

**149/149 PASS**, zero falhas/skips. Inclui **31 novos testes** em `conferir-inicio-meta.mjs`: série antiga/invalidade, datas/duplicação/ordem, lacunas, zero/null, somas/overflow, 1+9 campanhas, calendários diferentes, campos desconhecidos, isolamento e retenção no componente, HTML real, período 31/32 e página real negando erro Auth/período antes da fonte. A regressão de Anúncios passou com o parser estendido.

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/conferir-inicio.ts`: **70/70 PASS**. A mensagem de falha proposital inicial é seu controle negativo existente, seguida do placar válido.

`pnpm exec tsc --noEmit --incremental false`: **PASS**, sem usar `.next` como saída nem executar build/dev.

Foram ajustados os testes legados do próprio escopo: `conferir-recepcao-inicio.mjs` recebeu porta explícita para o componente novo no ensaio de legado e passou a testar a chamada Meta independente da execução; `conferir-inicio.ts` atualizou expectativas antigas de trimestre/ano livre para o limite da fonte. Não se enfraqueceram autorizações ou validadores para obter verde. A primeira rodada identificou a porta CSS faltante na fixture e expectativa antiga de consulta ao consolidado, corrigidas antes dos passes acima; o teste novo também deixou de exigir rótulo de ausência onde todos os três campos eram medidos.

Os testes substituem Auth/banco/transporte/router; não certificam cookies reais, fonte Meta, RLS/Storage, concorrência de servidores, produção ou latência. A fixture de interop do backend informada pela Central não foi regravada e o script `tmp/n26-inicio-interop.mjs` não foi editado/executado por esta frente.

## 6. Snapshot local para revisão

Hashes capturados às 01:06 BRT. Não são SHA Git ou release publicado.

| Arquivo | SHA-256 |
| --- | --- |
| `app/(protected)/inicio/page.tsx` | `81e9e039f739bf3f5a150c2fd080b45a81a7322102685e273b3890d19b992dcc` |
| `app/(protected)/inicio/TelaDoInicio.tsx` | `708007951189779b2d0d853624886cff38879a2b740bec201dd10c45bfa8d48f` |
| `app/(protected)/inicio/ResumoMetaDoInicio.tsx` | `deca7722dede5d75222069f80fd0c41963592f47a001e0f15927d30c87f33145` |
| `app/(protected)/inicio/ResumoMetaDoInicio.module.css` | `ef29bd97b9405090441f580c769d4e99d2905a1b9096c56ff5ce272c6723ff41` |
| `lib/anuncios/contrato-meta.ts` | `1ef95dff974a7050bf43863b5be83156706df1a070afb5d8188f36697b91b1a0` |
| `lib/inicio/periodo.ts` | `52434e265d4eb75a98ca33d7ff10c445f1fcdc06da0bb4912490d7e7379dc43a` |
| `lib/inicio/serie-meta.ts` | `83528f801cee44fa648fea0dbe3f28785edfebddd4852d6bdc616263c80613f1` |
| `lib/inicio/resumo-meta.ts` | `7ce82753701ea0e5f0d3d0668a00e60c568ffeace179795dffac34630aa525be` |
| `app/exemplo/inicio-meta/page.tsx` | `f132a9ddd44adcb4a77f184373ead15dd43d28e345f964bf5d4cece013355114` |
| `app/exemplo/_inicio_meta/Previa.tsx` | `105483bc5846e8f123d20728fcaed9e46f3d661835ed6d014a81aa5aa03c03a7` |
| `scripts/conferir-inicio-meta.mjs` | `e6f929e5cd67e543293a5b58b6a305a1bcd1f78547cf613506d09e1f88c7ceb0` |
| `scripts/conferir-recepcao-inicio.mjs` | `8d05bc6e322f3065c7661671cb19760927bc9c77a1cc0d606ce5ddead31c70c8` |
| `scripts/conferir-inicio.ts` | `4c310ae99de39657cd85deca81460b1acc155487c02872a26592bf5c0043185c` |

Além dos 13 arquivos acima, somente este checkpoint. Não foi editado `lib/backend`, apesar da propriedade concedida para o bloco: o leitor compartilhado existente bastou. Anúncios recebeu somente a extensão de contrato indicada.

**Parada no snapshot estável.** A Central pode iniciar revisão/interop/build/prova visual; nenhum processo dev/build desta frente está rodando. Qualquer ajuste decorrente dessa revisão deve ser combinado para manter um único dono por arquivo. Publicação e nova consulta real permanecem atos separados.
