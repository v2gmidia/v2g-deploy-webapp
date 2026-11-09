# Onboarding operacional — implementação candidata QA — 09/11/2026

## Escopo autorizado

Victor autorizou implementar o novo onboarding no WebApp, backend e automações, preservar os dados, testar e deixar pronto para seu commit e push somente na QA. Não inclui publicação, importação/ativação de workflow, aplicação de SQL ou alteração em produção.

Proposta aprovada: [decisão e perguntas](n26-onboarding-operacional-b2b2b-proposta-09-11.md). Contrato integrado: [cadastro operacional V2](n26-onboarding-operacional-contrato-qa.md).

## Base e responsabilidades

- WebApp: `C:/Users/victo/v2g-deploy/webapp`, branch `QA`, base `24340c32007073b63778f29a47d0548d445d8061`; implementação 03/04.
- Backend/automações: `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio`, branch `codex/qa-inicio-serie-diaria`, base `646ab181d30255cf6a592d98b0bb994ce454c704`; implementação 07/08.
- UI/UX: revisão independente de conteúdo, identidade e estados, após snapshot estável.
- Central: integração, revisão, validação local e registro. Prova independente TypeScript → Pydantic pelo montador e modelo reais, sem API externa.

As alterações documentais anteriores e arquivos ainda não versionados foram encontrados antes da implementação e serão preservados. Não representam alterações novas de produto neste bloco.

## Critérios de encerramento

1. Custo e lucro ausentes da entrada inicial; preço opcional com unidade/fonte/certeza, separado de ticket.
2. B2B direto e agência/anunciante tratados explicitamente, sem criar acesso ao anunciante nem inferir identidade por nomes.
3. Respostas, arquivos e procedência legados preservados; omissão, desconhecido, null e zero não confundidos.
4. Cadastro operacional, conexão, peça, autorização e diagnóstico separados; concluir cadastro não cria execução nem dispara criação/publicação.
5. Frontend e backend aceitam o mesmo contrato real, com falhas representadas sem afirmar sucesso indevido.
6. Workflows e consumidores locais sem fórmula retirada ou preenchimento artificial; guardas de conta, idempotência e aprovação preservadas.
7. Testes relevantes, tipos, build e revisão independente concluídos; limitações externas declaradas.

## Resultado

**Candidata local pronta para o commit/push manual de Victor nos dois destinos QA abaixo. Nenhuma publicação foi feita neste bloco.**

- Entrada operacional sem custo/lucro/ticket obrigatórios. Fluxo direto e agência/anunciante separados; respostas do anunciante não sobrescrevem as colunas canônicas da agência.
- Preço opcional utilizável em `/onboarding/contas`, inclusive por links antigos: faixa/unidade/certeza/fonte/data, histórico preservado e opção de continuar sem informar. Não converte fardo em ticket nem calcula preço unitário.
- Persistência pelos blocos já aceitos na RPC existente, com chaves reservadas dentro de `respostas`. Nenhuma migration nova é necessária para esta candidata.
- Conferência `cadastro_operacional.v2` no backend, autenticada entre servidores e sem execução/pipeline. Versão, negócio e guardas da resposta são conferidos no WebApp. Falha de conferência não desfaz a informação já salva.
- Custo/lucro legados preservados; diagnóstico sem fórmula, alvos financeiros e previsões derivados ficam nulos. Preparação/criação exige seu próprio plano revisado; não se pede economia para contornar uma pendência.
- Identidade de `/verba` alinhada à V2G mídia; teto salvo descrito como planejamento, sem promessa de alterar a Meta. Região ausente não vira 15 km; agência usa a praça explicitamente declarada para o anunciante.
- Revisão de acessibilidade concluída: título da conversa disponível na retomada, sem `main` aninhado; contratante não é apresentado automaticamente como operador; avanço do preço bloqueado durante gravação.

## Validação medida

| Conferência | Resultado local |
|---|---|
| WebApp `pnpm typecheck` | Passou. |
| WebApp `pnpm build` | Passou após a última correção de produto; 54 páginas geradas. Build local não é deploy. |
| 46 rotinas WebApp da suíte, incluindo extras de interface/criativos/envio/gestor | 46/46 passaram em execução offline, sem carregar arquivo de ambiente e com fetch externo bloqueado. |
| Referência de preço | 8/8 testes passaram: parser, omissão, zero, fonte/unidade, isolamento, preservação, falha e avanço durante envio. Incluídos na rodada acima. |
| Contexto/região de `/verba` | 3/3 testes adicionais passaram após a última correção: ausência/invalidade, B2B2B e cliente direto. |
| Contrato legado | Conferidor passou contra OpenAPI LOCAL exportado da candidata backend real; nenhuma consulta de schema em produção. |
| Prova cruzada independente | 32 verificações, zero falhas; 18/18 entradas reais TS→Pydantic e quatro respostas backend→adapter TS. Preço gerado pelo helper real; transporte controlado e rede bloqueada. |
| Preservação B2B2B | Dois casos independentes das actions reais passaram: perfil da agência intacto e limpeza/retomada dos contatos do anunciante. Suíte de preservação completa: 79/79. |
| Backend Ruff/mypy | Limpos; mypy conferiu 178 fontes. |
| Backend unitários | 3.066 passaram, 10 ignorados. Após edição exclusiva da integração, 66 unitários focados também passaram. |
| Backend integração mock | 17 passaram, 21 fora da seleção pelo marcador. Workflow A incluído; oito cenários próprios já passaram. |
| Automação n8n local | Três workflows passaram na análise offline; expressões reais Set/IF/HTTP alteradas executadas em Node VM com fixtures. Sem importação/ativação. |
| Formatação do diff | `git diff --check` passou; somente avisos de normalização LF/CRLF. |

As 46 rotinas não incluem a consulta SQL live de migrations, pois não houve mudança de schema nem homologação no banco. O conferidor de cadastro foi executado separadamente com o OpenAPI local. O novo teste `conferir:verba-contexto` foi acrescentado à suíte depois dessa rodada e passou separadamente (3/3); não se anuncia a execução integral literal de `pnpm conferir` com banco/rede.

Duas expectativas antigas de `conferir:qa-interface` foram corrigidas: intervalo de 90 dias deixou de ser usado como se fosse aceito pelo limite vigente de 31 dias; a busca textual da conclusão passou a distinguir ramo Meta de ramo legado. O requisito de isolamento/período e a ordem dos sinais foram preservados. Quatro falhas antigas da integração backend foram reproduzidas na base `646ab18` e corrigidas somente nos testes de catálogo, sem adicionar nichos ou mudar o produto: [registro backend](C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio/docs/estado/n26-onboarding-operacional-backend-local-09-11.md).

## Conferência visual e evidências

Componentes e páginas reais foram renderizados em prévia estática local com dependências externas substituídas, sem envio de formulário. Desktop 1440×900 e celular 390×844: preço e verba legíveis, sem rolagem horizontal; marca V2G mídia e ressalva do teto visíveis. Esta prova não inclui hidratação, sessão real, fonte final do bundle ou persistência SQL. O build confere a compilação dos componentes finais.

Evidências privadas em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/onboarding-qa-09-11/`: `suite-local-resultados.json`, logs por rotina, `referencia-preco-desktop.png`, `referencia-preco-mobile.png`, `verba-desktop.png`, `verba-mobile.png` e `snapshot-final.json`. Prévia local encerrada e viewport temporário restaurado.

## Commit/push manual e próxima prova

| Repositório | Branch candidata correta | Estado |
|---|---|---|
| `C:/Users/victo/v2g-deploy/webapp` | `QA` → `origin/QA` | Alterações locais testadas; incluir também os arquivos novos. |
| `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio` | `codex/qa-inicio-serie-diaria` → branch remota de mesmo nome | Pacote backend/n8n isolado da main; snapshot backend de 31 arquivos. |

Depois do commit/push de Victor: publicar o backend nominalmente no serviço QA, conferir o WebApp QA, e homologar com sessão Piligrin os estados, os dados/gráfico já aceitos e o novo fluxo. Importação de automação deve ocorrer apenas em ambiente QA identificado; o workflow local não deve ser importado sobre produção por consequência. Registro e decisão da peça por Cauã continuam sendo uma etapa própria, fora da conclusão técnica do onboarding.

## Limite de ambiente

Não houve commit, push, deploy, importação de workflow, migration, POST real de cadastro, webhook real, escrita em banco, envio de mensagem ao cliente ou alteração em provedores. Os valores reais de preço não foram gravados no negócio Dúú/Piligrin neste bloco; exemplos dos testes são sintéticos. Produção não foi alterada. Publicação e homologação autenticada da versão nova na QA são etapas posteriores ao commit/push de Victor.
