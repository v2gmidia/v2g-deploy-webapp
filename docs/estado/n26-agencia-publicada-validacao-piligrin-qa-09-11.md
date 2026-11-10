# Quatro telas publicadas — Piligrin/Dúú, QA, 09/11/2026

## 0. Resultado e pendências

**Publicação confirmada e quatro telas percorridas pela sessão autenticada da Piligrin.** Números, gráfico diário, imagem, revisão, filtros e retornos funcionaram no WebApp QA. Esta rodada não alterou o aplicativo, dados, configuração remota ou produção; apenas este registro local foi acrescentado.

Permanecem pendências distintas da publicação das quatro telas:

1. **Nome do responsável:** a atribuição do gestor existe, mas `profiles.full_name` está nulo na QA. Por isso o aplicativo mostra “A conferir”; não foi preenchido nem inferido por nome de WhatsApp.
2. **Publicação da arte:** a peça está aprovada, ainda sem confirmação de publicação registrada. A validação não publicou anúncio nem criou confirmação fictícia.
3. **Histórico antigo de rodadas em Anúncios:** o painel separado mostrou indisponibilidade; os logs do deployment registraram `GET /negocios/<business_id>/consolidado` com HTTP 404. A consulta Meta da mesma página e os números do novo Início funcionaram. Causa da ausência no consolidado não foi determinada nesta rodada.
4. A pendência de material/visual da marca continua visível no cadastro; não foi marcada como concluída pelo teste.

## 1. Publicação medida

| Campo | Evidência |
| --- | --- |
| Projeto | `v2g-webapp-qa`, ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn` |
| Branch / commit | `QA` / `b70a0506d1a90128c7d6f9421c064751b57961e2` |
| Deployment | `dpl_8zYVoCYQ9ui3XUmHoRkSo688dGC5`, estado **READY** |
| URL imutável | `https://v2g-webapp-ltkrtcatc-v2-g.vercel.app` |
| Alias conferido | `https://v2g-webapp-qa.vercel.app` associado ao mesmo deployment |
| Sessão usada | WebApp QA, Victor, negócio ativo Piligrin; detalhe declarado Dúú Gomes |

No início, o build estava em andamento e o alias ainda servia a versão anterior. A validação nova começou somente após **READY**, associação do alias e recarga da página. Nenhum comando de deploy, promoção ou alteração de alias foi executado.

A Vercel descreve o destino principal desse **projeto QA separado** como `target=production`. Isso não identifica o projeto real de produção: o projeto medido acima e sua branch são os da QA. Nenhum painel ou projeto de produção foi alterado.

## 2. Percurso das quatro telas

| Tela | Conferência na sessão publicada | Resultado |
| --- | --- | --- |
| Agência · Início | Piligrin como agência, carteira com Dúú, busca “Dúú”, filtro de pendências, abertura do cliente | Passou. Só o contexto comprovado aparece; nenhum cliente de ensaio. |
| Dúú · Início | Identificação agência/anunciante, troca pelo calendário de 01–09 para 01–07/11, números, linha e tabela diária, teto e região | Passou. R$ 3.000 e todo o estado do Rio de Janeiro mantidos. Conversas continuam “Não medido”. |
| Agência · Criativos | Imagem, aprovação, busca “Dúú”, filtro do cliente e etapa “Peça aprovada”, abrir no cliente | Passou. Uma peça real, imagem carregada em 1254×1254; nenhum envio realizado. |
| Dúú · Criativos | Peça exata, ampliação/fechamento, Biblioteca, Em revisão vazia, aprovação datada e publicação separada | Passou. Formulário de envio disponível, sem selecionar arquivo ou enviar. |

### Retornos e autorização

- Início do Dúú → **Voltar à carteira** retornou à Piligrin com busca “Dúú” e pendências marcadas.
- Peça do Dúú → **Voltar aos criativos da agência** preservou busca, cliente filtrado e etapa aprovada.
- Início/Criativos do menu exibiram o ID exato do contexto do Dúú quando dentro do detalhe; ao voltar, o topo retornou à agência.
- IDs de cliente de ensaio, sem vínculo com o contexto ativo, foram recusados tanto em Início como em Criativos. A tela recusada de Criativos mostrou zero imagens.
- Isso prova a recusa de um parâmetro não autorizado pela sessão atual. Não foi feita troca de login para outro titular, criação de cliente ou ensaio de escrita entre tenants; não equivale a uma auditoria completa de RLS.

## 3. Números e gráfico

Recorte fechado **01/11/2026 a 07/11/2026**, conta **`act_1165478988908157`**, BRL, fuso **America/Sao_Paulo**.

| Medida | Início do Dúú | Anúncios, campanha `52570261860675` |
| --- | ---: | ---: |
| Investido | R$ 281,80 | R$ 281,80 |
| Impressões | 26.129 | 26.129 |
| Cliques totais | 466 | 466 |
| Conversas | Não medido | Não medido |

Uma de dez campanhas retornou observação nesse recorte, com indicação explícita de **resultados parciais**. Campanha, conjunto e anúncio não foram somados entre si. A comparação usou as duas telas publicadas e a fonte Meta entregue pelo backend; não foi feita uma nova conferência independente no painel da Meta nesta rodada.

| Dia | Investido | Impressões | Cliques |
| --- | ---: | ---: | ---: |
| 01/11 | R$ 45,14 | 4.454 | 88 |
| 02/11 | R$ 29,37 | 4.161 | 54 |
| 03/11 | R$ 56,56 | 3.538 | 49 |
| 04/11 | R$ 66,87 | 5.696 | 112 |
| 05/11 | R$ 28,76 | 2.654 | 61 |
| 06/11 | R$ 29,18 | 3.188 | 47 |
| 07/11 | R$ 25,92 | 2.438 | 55 |
| **Soma** | **R$ 281,80** | **26.129** | **466** |

Os sete pontos e a tabela correspondem; a soma diária confere com o resumo. Todos os sete dias estavam medidos: lacunas e zeros não foram induzidos no backend real. Esses casos já têm teste local no pacote anterior.

O recorte inicial 01–09/11 também carregou números reais e nove pontos. Como inclui o dia corrente, mudou entre consultas; foi usado o período fechado acima para comparar valores sem confundir atualização com divergência.

## 4. Peça e dados preservados

Pedido real: `0b22f424-f70b-457f-845e-c37bb50ddb5f`, arquivo `WhatsApp Image 2026-11-09 at 10.23.29.jpeg`. O cliente vê **Peça aprovada pelo gestor**, data de revisão **09/11/2026**, e **Ainda sem confirmação de publicação**. A prévia real abriu na fila, no detalhe e no diálogo de ampliação. Fechar devolveu à biblioteca; a aba Em revisão vazia não substituiu a peça aprovada.

A leitura SQL exclusivamente na QA confirmou a atribuição ao perfil `45f996e1-5f2b-4bd3-ab19-5e8b19bc5c67`, com perfil existente e `full_name=null`. Nenhuma gravação foi feita para preencher essa lacuna.

## 5. Evidências e limite da rodada

Capturas e snapshots privados locais em:

`C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/agencia-publicada-qa-09-11/`

- `agencia-inicio.jpg`, `agencia-criativos.jpg`, `duu-inicio-01-07.jpg`, `duu-criativos.jpg`: quatro telas publicadas, com dados reais, sem banner de fixture.
- `duu-grafico-diario.jpg`, `valores-diarios.json`, `duu-inicio-01-07-dom.txt`: linha, tabela, fonte/período e valores observados.
- `carteira-retorno-dom.txt`, `criativos-retorno-dom.txt`: filtros preservados na volta.
- `cliente-invalido-dom.txt`: recusa no Início. Criativos recusado também observado, sem imagens.

Capturas são de viewport, algumas com rolagem; não foram apresentadas como páginas completas. Não houve nova rodada móvel, revisão de contraste ou leitor de tela completo nesta sessão. A prova local de responsividade pertence ao registro da implementação.

Sem alterações em código do aplicativo, banco, Storage, anúncios ou configuração remota. Sem commit/push do agente. Este documento e sua linha no índice são o único acréscimo local após a validação.
