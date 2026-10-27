# 05/06 — Contrato de aprovação e catálogo persistido alinhados (26→27/10)

> RESOLVIDO em bloco posterior de 27/10: a passagem v2 pelo consumidor/fila/arquivo/biblioteca foi demonstrada **localmente com fake**. Ver [E28-06-V2-CONSUMIDOR](./e28-06-v2-consumidor-local-27-10.md). A submissão v2 real segue bloqueada; QA/IA real não foram comprovados. O relato abaixo preserva as pendências do momento original.

## §0. Resultado e menor próximo passo

**A divergência local das cinco provas foi resolvida.** O WebApp passou a conferir os formatos de aprovação já definidos por 07/08 e o catálogo compartilhado de metadados, sem criar uma segunda forma de consentimento. O teste compara a saída completa com o carregador Python real `ContextoPersistenteV2`, usando SQL instrumentado e registros fictícios.

**Nenhuma imagem real foi gerada.** O veto de pedido v2 no submit/poll/arquivo continua ativo. O carregador de catálogo foi preparado, mas não foi conectado à lista estática exibida nem a um banco remoto nesta rodada.

**Menor próximo bloco técnico:** levar a prova do snapshot v2 até o contrato consumido de submit/poll/arquivo e ensaiar pedido v2 → aprovação persistida → backend → arquivo privado → biblioteca com provedor substituído. Hoje a igualdade do contexto está provada; essa passagem completa do v2 pelo consumidor WebApp ainda não está. Não retirar o veto só por um manifesto válido.

**Para uma imagem real no QA depois disso:** ambiente gravável isolado de geração, schema/catálogo/aprovações e worker compatíveis; negócio fictício e logo próprio novo com proveniência; referência exata revisada; autorização nominal de envio à IA e teto/provedor de uma imagem. O [pacote de QA](../qa/geracao-webapp-v2-piloto-uma-imagem-27-10.md) reúne essas condições. Nenhum desses portões externos foi executado aqui.

## Feito localmente

- `lib/criativos/geracao/contexto-referencia-publica.ts`: a entrada anterior `RegistroRevisado` saiu. Agora os dados são os registros `AprovacaoPersistida`/marca/contexto/autorização de referência definidos por 07/08, com aprovador UUID, autorizado, datas, expiração, revogação, versão e hash do manifest.
- As cinco provas `autorizado_por`, `contexto_revisado_por`, `marca_revisada_por`, `referencia_revisada_por` e `aprovacoes_sha256` saem dos mesmos registros. Incluídas também as provas de versão/hash/revisor/hash do registro do catálogo e o ID nominal de autorização de custo.
- JSON canônico usa ordenação por ponto de código, sem depender do locale, e rejeita floats ambíguos. Datas UTC de aprovações são normalizadas como o `model_dump(mode="json")` Python, inclusive microssegundos. Isso permite comparar todos os campos/hash, em vez de apenas contar campos obrigatórios.
- Marca precisa coincidir com logo vigente, `creatives.copy.origemMaterial` v1 do 03/04, SHA-256 dos bytes, hash da proveniência e objeto vigente de cores confirmadas. Upload continua sem valer como autorização IA.
- `lib/jev/referencias-aprovadas-da-sessao.ts`: leitura SELECT-only de `creative_reference_catalog`, tabela proposta por 07/08. Exige flag, sessão/negócio ativo e dono conferido sob RLS antes de usar admin, pois a proposta não concede SELECT direto ao cliente. Retorna só metadados úteis, sem revisor, aprovação privada ou arquivo.
- O catálogo compartilhado não tem negócio nem consentimento de cliente. Precisa de revisão humana vigente, origem/URL/ID, anunciante, data, mídia imagem/ativo, classificação de barbearia com corte 80%, hashes de coleta/Jev e direção abstrata. A autorização de usar essa versão no pedido do cliente fica em registro separado.
- Leitura falha retorna `indisponivel`, sem fallback para uma lista aparentemente aprovada. Versão mais nova revogada/expirada não ressuscita versão anterior. O corte de 40 registros vem sinalizado como parcial.
- `ReferenciasDoNicho.tsx`: o seletor público existente informa que escolher guarda uma preferência e que geração depende da identidade autorizada e revisão da referência. Links/radios identificam o anúncio para leitores de tela. Nenhuma tela de busca por nicho foi criada.

Esses módulos não escrevem aprovações, criam tabela/bucket, buscam pixels, chamam Jev/gerador ou autorizam worker. O backend permanece responsável por reler e validar as fontes durante execução e acesso ao arquivo.

## Armazenamento, sem ambiguidade

| Material/dado | Onde fica | O que esta rodada fez |
|---|---|---|
| Logo/fotos próprios | Bucket privado `v2g-midia`, caminho `identidade/{business_id}/...`, linha em `creatives` | Consome o formato de proveniência; não moveu arquivos nem criou bucket. |
| Referência pública | IDs/links no catálogo estático atual; modelo persistente `creative_reference_catalog` de 07/08 | Preparou leitura de metadados revisados. Não baixou/armazenou imagens de concorrente. |
| Autorização de uso por IA | Propostas separadas de brand/reference/context approvals, ligadas ao negócio/pedido | Conferiu formatos e provas com fixtures; não criou consentimento real. |
| Imagem gerada | Bucket privado existente, caminho `geracao/{business_id}/{job_id}/{attempt_id}.png`, ligada a `creatives` e snapshot/job | Sem nova execução nesta rodada. A rota continua negando v2 sem a prova final. |

## Prova dirigida e limites

`scripts/conferir-contexto-referencia-publica.mjs`: **11 casos** de duas fontes, loader Python real, cinco provas, catálogo, hash/datas, revogação/expiração, outro negócio/pedido, proveniência, mudança de referência, direitos e custo. `scripts/conferir-catalogo-referencias-persistido.mjs`: **8 casos** de leitura sob sessão, OFF, dono/ramo, fonte indisponível, revisão, versão, parcial e renderização do seletor real com dez links e ressalvas.

**19 casos validados.** Na última execução conjunta, o teste de igualdade detectou uma alteração concorrente de 07/08: `autorizacao_custo_id` passou a integrar o manifesto final. A conferência WebApp foi alinhada e **esse teste foi reexecutado e passou**. O teste não foi reduzido para ignorar o campo. `pnpm typecheck` passou após a correção. `git diff --check` não apontou erro de whitespace.

O ensaio de compatibilidade chama somente o carregador Python offline com respostas SQL de fixture; não usa banco real, credenciais ou provedor. O teste do seletor usa renderização estática do componente real, sem prova visual/autenticada nova. A leitura de catálogo usa portas instrumentadas; não mede RLS remota nem existência das tabelas no QA.

## Situações que não devem ser misturadas

| Caminho | Prova existente | Menor portão restante |
|---|---|---|
| Referência pública utilizável no app | Seletor local, dez links, ID persistido/replay testados na preparação anterior; explicação e renderização agora conferidas | Publicação manual autorizada e revisão autenticada no QA. Referência é intenção, sem promessa de desempenho. |
| Geração local fake | Fila/arquivo/biblioteca v1 já testados em bloco anterior; contexto v2 agora coincide com o loader real offline | Integração completa do pedido v2 pelo consumidor, mantendo provedor substituído. Não apresentar esse estado como imagem real. |
| Geração real no QA | **Não comprovada** | Contrato de prova v2 no consumidor + ambiente/schema/worker + aprovações/material/teto nominais de uma imagem. |
| Produção | **Não alterada** | Fora deste bloco. |

## Documentação reconciliada

O pacote de QA foi atualizado para retirar o vermelho já resolvido e preservar os portões verdadeiros. Os checkpoints históricos `e28-05-06-preparo-geracao-real-26-10.md` e `e28-06-ponte-identidade-local-26-10.md` receberam nota acima do texto antigo: Pinterest/três materiais são desenho superado, sem apagar a medição original. O recorte é logo próprio + cores confirmadas + referência Meta como direção abstrata.

Nenhum arquivo de 07/08 foi editado. Sem migration/configuração externa, QA, chamada paga, commit, push, deploy ou publicação. Alterações de outros chats foram preservadas. O índice compartilhado segue sob integração do Central.
