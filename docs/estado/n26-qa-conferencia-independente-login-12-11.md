# QA — conferência independente do login — 12/11/2026

## 0. Resultado e limite

> RESOLVIDO depois desta rodada, em 12/11/2026: login da Piligrin concluído por Victor e roteiro positivo validado na QA. Ver `n26-piligrin-duu-validacao-autenticada-qa-12-11.md`. O restante preserva o estado observado antes do login.

Victor informou que iria dormir e pediu para avançar no que fosse possível sem sua participação. A sugestão de ciclos de 30 minutos foi tratada como opcional. **Não foi criada nem reativada recorrência para repetir uma dependência de login.** A pendência humana fica adiada, sem novo pedido nesta rodada.

Foi concluída uma prova nova da revisão publicada: **regressão B2B na sessão legítima disponível**, negócio V2G, comparando Início, gráfico e Anúncios no mesmo período. Isso não substitui a conferência Piligrin → Dúú, cuja sessão continua indisponível. Não foi alterado acesso ou dado para contornar essa ausência.

**Próxima ação, quando houver acesso legítimo:** executar uma única vez o roteiro positivo da Piligrin no manifesto `docs/qa/agencia-entrada-minima-11-11/ARQUIVOS.md`. Não repetir publicação, suíte local, negativas de isolamento ou consultas encerradas sem mudança de código ou evidência nova.

## 1. Estado confirmado

- Alias QA `https://v2g-webapp-qa.vercel.app`: READY, deployment `dpl_3ATyTy9fVYRUUTfunu9rPCqyE6qF`.
- Projeto isolado `v2g-webapp-qa`, ID `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`.
- Branch QA e commit `60b4114404495147d80c2df679b9cac02da7338d` permanecem os mesmos do pacote aprovado.
- Checkout no começo desta rodada: somente o índice e o checkpoint posterior ao push estavam pendentes; nenhuma mudança de produto. Preservados.

## 2. Prova nova: percurso B2B da sessão já disponível

Navegação real na QA, às 01:34–01:35 de 12/11/2026, horário de Brasília. **Negócio V2G, não Dúú**, conta `act_2818009911919726`, período 01–07/11/2026.

| Informação | Início | Anúncios |
|---|---|---|
| Investido | R$ 26,49 | R$ 26,49 na campanha observada |
| Impressões | 1.493 | 1.493 na campanha observada |
| Cliques totais | 22 | 22 na campanha observada |
| Cobertura | 1 de 10 campanhas; resumo parcial explícito | Demais campanhas sem medição no período; não entram como zero |

- A tabela diária do gráfico mostra 01/11 com R$ 26,49, 1.493 impressões e 22 cliques. De 02 a 07/11, os campos aparecem como **Não medido**, sem preenchimento fictício.
- O link **Ver anúncios** preservou período e conta. A campanha observada, o conjunto e o anúncio apresentam seus próprios valores; o Início não soma esses três níveis.
- Conversas no WhatsApp permanecem **Não medido**. Configuração ativa não foi interpretada como entrega atual comprovada.
- A tela de Anúncios apresentou a mensagem de ausência de rodadas da V2G junto da consulta Meta, sem tratá-la como falha ou ausência de campanhas.
- Nenhum botão de criação, revisão, geração, agendamento, cobrança ou publicação foi acionado. A aba temporária de conferência foi fechada; a aba de login QA permanece disponível para retomada futura.

Limite: prova do recorte exibido para a conta disponível, não auditoria de todas as campanhas, nova verificação direta da BM ou validação da carteira da Piligrin.

## 3. Observabilidade e login

Foi feita uma consulta delimitada de logs de erro do deployment QA. A janela de 12 horas foi recusada pela retenção do plano; a consulta foi corrigida uma vez para 30 minutos.

Na janela retornada, 01:04–01:34 de 12/11/2026 (Brasília), houve um registro em `/entrar`: tentativa às 01:32 com código `invalid_credentials`, HTTP 400. O retorno confirma credenciais recusadas; **não identifica qual campo está incorreto nem prova defeito do novo fluxo de agência**. Não foram lidos senha, token ou conteúdo privado de sessão, nem feita nova tentativa ou recuperação automática.

A limitação de retenção impede declarar ausência de outros erros em toda a noite. Não trocar essa limitação por um estado verde genérico de produção.

## 4. Encerramento sem repetição

| Frente | Estado | Retomada |
|---|---|---|
| Publicação QA | Encerrada, revisão correta READY | Apenas se houver novo push ou falha concreta |
| Suíte/build/SQL locais | Encerrados no bloco anterior; código preservado | Não repetir sem mudança |
| Isolamento publicado | Negativas em Início/Criativos/Anúncios já encerradas no checkpoint de 11/11 | Não repetir nesta espera |
| Regressão B2B publicada | Encerrada nesta rodada: números, gráfico, período e histórico conferidos | Não confundir com prova do Dúú |
| Piligrin → Dúú | Pendente de sessão legítima | Victor entrar quando puder; Central executar roteiro restante |
| Recorrência noturna | Não criada/reativada | Não há trabalho independente aberto que justifique repetir a cada 30 minutos |

Sem correção de código necessária nesta rodada. Sem alteração de produção, banco, migração, permissão, credencial, pagamentos, verba Meta, anúncio, n8n, commit, push, merge ou deploy.
