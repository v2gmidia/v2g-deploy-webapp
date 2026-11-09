# N26 — Início / correções da revisão independente — 09/11/2026

## 0. Novo snapshot estável

**Batch de revisão concluído às 01:12 BRT: 157 testes PASS, zero falhas/skips; typecheck PASS. Parei de editar.** A Central pode confirmar a bancada por HMR no dev que ela iniciou em 3001 e seguir a revisão/build final. Não fiz reload/navegação nas abas da Central, nem iniciei build/dev.

Este documento complementa o checkpoint fechado `n26-inicio-meta-local-09-11.md`; não o reescreve. Corrige o bloqueio real de bundling da bancada, três condições de dados reproduzidas pelo revisor e a sincronização do seletor de datas. Não houve redesign, mudança de Casco/tema/global, backend, banco, Git, deploy, configuração, token ou sessão real.

## 1. Correções aplicadas

### Fronteira de servidor/cliente da bancada

`app/exemplo/_inicio_meta/Previa.tsx` era client e importava `Casco`, alcançando `PreferenciaDeTema`/`next/headers`. Typecheck e testes isolados anteriores não detectavam a restrição do bundler Next; a prova visual da Central encontrou o BuildError real.

**Agora:** somente `app/exemplo/inicio-meta/page.tsx`, componente de servidor, importa/renderiza Casco. A prévia cliente retorna o conteúdo interativo e o resumo real. O guard dev-only da importação dinâmica e a sentinela fictícia permanecem. Casco e tema global não foram alterados.

Novo `scripts/conferir-inicio-meta-client-boundary.mjs` percorre a cadeia transitiva de imports/exports/dynamic imports de runtime por AST TypeScript, resolvendo caminhos reais e recusando `next/headers`, `server-only` e módulos Node. Ignora imports type-only/comentários/strings. Seu controle negativo reinjeta o import real de Casco e precisa encontrar a dependência de servidor; não é busca textual por nome de componente.

### Conta implícita e retenção após falha

`leituraAnteriorPermitida` agora exige que a conta da memória seja a **contaSelecionada atual** e esteja na **lista autorizada atual**, além do mesmo perfil/negócio/período/conta solicitada. Falha transitória antes dessa confirmação não reaproveita números.

Uma resposta atual apontando implicitamente a B, enquanto a memória é A, não mostra dados, link ou hidden da A. O componente limpa a memória incompatível. O seletor pode sugerir a conta selecionada atual B, sem usar o valor antigo. Os testes executam helper e componente real com hooks substituídos para verificar esse percurso.

### Soma dos dias observados, inclusive com lacunas

Antes, a igualdade com total era exigida só quando todos os dias do calendário tinham valor. **Agora**, quando todos os pontos efetivamente observados de um campo são conhecidos e o total é numérico, a soma precisa igualar esse total mesmo com dias de cobertura ausentes.

Caso reproduzido: dias 01 e 03 com gasto 100+200, sem ponto no dia 02, total 400 → série inconsistente/gráfico indisponível; total 300 → série válida, dia 02 null. Totais válidos do inventário continuam preservados diante de inconsistência da série.

### Overflow de um agregado desconhecido não apaga outros campos

Se o total do campo é null, valores diários individualmente seguros podem permanecer úteis mesmo que a soma desse campo exceda a precisão segura. Não se usa essa soma como total. A checagem de soma segura/divergência continua obrigatória quando há total numérico.

Caso reproduzido: gasto 1+1, total 2; impressões MAX_SAFE_INTEGER+1 em duas linhas individualmente seguras, total null; cliques 1+1, total 2 → preserva dias/gráfico de gasto e cliques, impressões agregadas continuam desconhecidas. Não invalida o investimento válido por causa de outro agregado null.

### Calendário após navegação

Somente `SeletorDePeriodo` recebe chave derivada de desde/até, para que os inputs `defaultValue` acompanhem o rótulo novo em back/forward. O resumo não ganha chave por período; sua memória não é descartada por esse ajuste. Teste inspeciona os elementos React reais em dois períodos e verifica nova chave/props do calendário sem chave nova na raiz do resumo.

## 2. Verificação deste batch

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-inicio-meta.mjs scripts/conferir-inicio-meta-client-boundary.mjs scripts/conferir-anuncios-meta.mjs scripts/conferir-anuncios-meta-integracao.mjs scripts/conferir-recepcao-inicio.mjs scripts/conferir-carregamento-inicio.mjs
pnpm exec tsc --noEmit --incremental false
```

**157/157 PASS**, zero falhas/skips. Typecheck terminou exit 0. O batch inclui as regressões anteriores e as reproduções acima. Não executei novamente as 70 conferências estáticas do snapshot anterior, pois seus arquivos/contratos não foram alterados neste batch.

Testes são locais/fictícios; o teste de fronteira cobre imports do caminho cliente, não substitui bundling Next. **BuildError resolvido por inspeção/teste de fronteira, ainda aguardando confirmação visual/build da Central.** Não fiz nova consulta Dúú nem repeti homologação QA.

## 3. Hashes substitutos deste snapshot

Somente os hashes abaixo substituem os correspondentes do checkpoint anterior; o script de fronteira é novo. Nenhum outro arquivo daquele snapshot foi editado neste batch.

| Arquivo | SHA-256 às 01:12 BRT |
| --- | --- |
| `app/exemplo/inicio-meta/page.tsx` | `028b2adf3203f12c8331ff820ae8d8717d39d7f710854bf9a1c5951642a1c869` |
| `app/exemplo/_inicio_meta/Previa.tsx` | `20aa1e19cd2914b838246b79903d7f7a0c857b190f0325bf2bb07ac1892190b6` |
| `app/(protected)/inicio/ResumoMetaDoInicio.tsx` | `cc8beaa75ffaf2c91637db98d9810038a2bd959ffc827c7f8c79fe75fca69164` |
| `lib/inicio/serie-meta.ts` | `0f7b4a9521706f91357da4132938b260f7b58e5936e9aa54f2c4471eab204102` |
| `lib/inicio/resumo-meta.ts` | `a398156e1ed7814067854ae938d13a4b746ee124b09f64406379f976988b731c` |
| `scripts/conferir-inicio-meta.mjs` | `1ae3901678067528760021c84c9513fd9d05efc3b618a22805a9ce7b5ecbcd5d` |
| `scripts/conferir-inicio-meta-client-boundary.mjs` | `5a8a935cda7b65004bccdcd7a558bf6d98f7e34ff25c2e10b0a3abf600cc63dc` |

Além desses sete arquivos, somente este checkpoint novo. **Parada no snapshot estável; Central assume confirmação/revisão final.** Sem nova rodada de polish, publicação ou ato externo por consequência.
