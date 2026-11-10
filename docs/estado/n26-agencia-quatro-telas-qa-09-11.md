# Quatro telas de agência e cliente — candidata QA, 09/11/2026

## 0. Entrega e próximo passo

**Implementação local concluída na branch `QA`, pronta para revisão, commit e push manual do Victor. Não foi publicada nesta rodada.** O build final e a suíte `pnpm conferir` passaram; os 22 testes novos de agência integram a suíte. Não houve migração, alteração de dados, publicação de anúncios ou mudança em produção.

Depois do push somente da QA, conferir o deployment correto e percorrer as quatro telas pela sessão da Piligrin. Essa validação autenticada da versão publicada ainda não aconteceu; os testes visuais desta rodada usaram componentes reais com dados explicitamente fictícios em bancada local.

## 1. O que foi implementado

| Tela | Comportamento |
| --- | --- |
| Agência · Início | Carteira com busca, filtro de pendências das peças, dez linhas por página e próxima ação. Só aparecem contextos comprovados. |
| Agência · Criativos | Fila com imagem ampliável, cliente, responsável, busca e filtros por cliente/etapa. Aprovação da peça e confirmação de publicação separadas. |
| Dúú · Início | Mesma fonte autorizada de Anúncios; período e conta, métricas, gráfico diário, próxima ação, teto e cadastro. Ausência de medição continua desconhecida; zero real permanece zero e a linha não atravessa lacunas. |
| Dúú · Criativos | Biblioteca, seleção exata de peça, prévia ampliável e acompanhamento. Envio, criação e análise existentes preservados no contexto autorizado. |

Rotas de agência: `/inicio` e `/criativos`. O detalhe usa `?cliente=<id exato do negócio ativo>`; a biblioteca também aceita `peca=<id exato do item>`. Abrir e voltar preserva busca, etapa, cliente filtrado e página pelos parâmetros internos permitidos. Início e Criativos do menu mantêm o contexto autorizado.

## 2. Limite do modelo atual

O cadastro existente tem **Piligrin como negócio contratante e Dúú como anunciante declarado no onboarding**. Esta entrega constrói uma ponte de apresentação para esse contexto: não cria uma segunda empresa, novo login para Dúú, vínculo de agência ou relação de cinquenta clientes no banco.

A leitura QA confirmou o nome Dúú Gomes, contratante Piligrin, teto mensal de R$ 3.000 e região **todo o estado do Rio de Janeiro**. Havia um pedido de revisão aprovado e nenhuma confirmação de publicação. Nenhum desses valores foi regravado nesta rodada. A aprovação existente não foi promovida a publicação confirmada.

A carteira real recebe somente esse contexto comprovado. O ensaio de cinquenta clientes existe apenas na bancada e nos testes. Uma carteira real com vários anunciantes exige um bloco posterior de modelo de dados e vínculos explícitos; não se infere relação por nome, telefone ou propriedade de outros negócios.

## 3. Preservação e isolamento

- O portão existente exige `V2G_QA_PILOT_ACCESS_ENABLED` e o host Supabase QA exato. Nenhuma configuração remota foi alterada. Fora desse portão, as páginas conservam o percurso anterior.
- `lib/agencia/da-sessao.ts:15` verifica o portão; `:24` seleciona explicitamente as colunas usadas e exige titular e negócio ativo antes da leitura mínima do responsável.
- `app/(protected)/inicio/page.tsx:81` e `app/(protected)/criativos/page.tsx:97` recusam cliente estrangeiro ou repetido antes das consultas específicas. O negócio retornado pelo estado também precisa coincidir.
- URLs e filtros são apresentação, não autorização. Imagens de revisão conservam vínculo exato de pedido/versão/hash; arquivos legados na visão de agência exigem namespace do negócio antes da assinatura.
- Uma peça solicitada inválida não escolhe outra silenciosamente. Consulta incompleta, fila limitada, arquivo não comprovado e falha de publicação ficam identificados.
- Nenhuma alteração em `supabase/migrations/`, nos CSS editoriais globais ou na marca. A migração de publicação anterior conserva SHA-256 `612f47455cc6b7b82a60325d4bf45b7287bc53f79b0dbca2d27d49a23bb430e3`.

`supabase/objetos.ts` recebeu apenas a descrição da migração de publicação **já existente e aplicada no bloco anterior**, necessária para o conferidor reconhecer os objetos. Não executa, modifica ou reaplica SQL. As provas de aplicação e rollback do ensaio pertencem ao registro anterior, não a esta entrega.

## 4. Testes e provas

| Conferência | Resultado e limite |
| --- | --- |
| `pnpm conferir` | Passou, incluindo typecheck e os 22 novos testes de agência. Rede de nichos e dia seguinte explicitamente pulada; contrato de cadastro conferido contra fixture OpenAPI local da candidata backend QA. |
| Segurança da rodada da suíte | Preload externo recusou destinos remotos além de leituras GET/HEAD do Supabase QA. Simuladores HTTP locais permitidos para os testes de transporte. Nenhuma escrita no banco real. |
| `conferir:agencia` | 22/22: sessão/titular/seleção, QA-only, recusa de IDs, fontes reais, paginação com cinquenta fixtures, retorno de filtros, publicação/versão, gráfico e namespaces privados. |
| `conferir:inicio`, `conferir:inicio-meta`, `conferir:criativos`, `conferir:multiconta` | Respectivamente 70, 40, 30 e 30 conferências aprovadas, também incluídas na suíte. |
| `conferir:revisao-criativos` e `conferir:publicacao-criativo` | 11/11 e 6/6 aprovados, rodados separadamente. |
| Build final | `pnpm build` passou após a última correção visual. Dev foi encerrado antes do build. |
| Exclusão das fixtures | `/exemplo/agencia` e `/exemplo/agencia/arte` responderam 404 no servidor local do build. Sentinela `V2G_AGENCIA_ENSAIO_LOCAL_0911` ausente de `.next/server` e `.next/static`. |
| Interface | Quatro telas em desktop e celular; busca, página 2/5, filtros, abrir/voltar, período, ampliação/fechamento, falha após leitura e lacuna. Sem upload, decisão ou publicação real. |
| Revisão independente | Direção aprovada mantida. Único P2: CTA do cabeçalho largo demais. Corrigido e recapturado nos dois desktops de Criativos; revisor pontuou **resolvido**, disposição **SHIP para candidata QA** no escopo visual. |

O detector executou uma vez. Um aviso de tamanho literal foi resolvido com o token existente. Não houve novo ciclo de redesenho. Contraste calculado e leitor de tela completo não foram medidos; a revisão verificou semântica, labels e foco nas fontes.

Evidências privadas locais: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/agencia-implementacao-qa-09-11/`. São capturas de bancada com números fictícios, não prova de consulta publicada da Piligrin. A arte fornecida foi lida de arquivo privado apenas para o ensaio; não foi copiada ao repositório. Viewports CSS desktop 1440×1080 e celular 390×844; os bytes de captura variam por escala e barra do navegador.

## 5. Conferência após o push da QA

1. Confirmar branch/commit e deployment QA; não promover a produção nem aplicar migração.
2. Entrar com a Piligrin: `/inicio` deve mostrar a carteira e Dúú, sem números do anunciante confundidos com a agência.
3. Abrir Dúú e comparar Início/Anúncios na mesma conta e período. Conferir cada dia do gráfico e identificar campos não medidos.
4. Percorrer Criativos da agência → peça do Dúú → acompanhamento → voltar. Conferir imagem, cliente, responsável e filtros.
5. Manter a peça aprovada enquanto não houver confirmação humana da versão e data da publicação. Não publicar anúncios para concluir a validação.
6. Conferir sessão de outro titular/cliente sem revelar a carteira ou arquivos da Piligrin. A prova local de recusa não substitui essa conferência publicada.

Este bloco termina com o pacote local. Integração de novos anunciantes, nova migração e produção ficam fora dele.
