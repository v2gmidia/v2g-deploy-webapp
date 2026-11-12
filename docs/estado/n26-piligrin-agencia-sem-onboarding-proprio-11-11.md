# Piligrin — acesso confirmado; agência separada do anunciante

## 0. Estado atual e próximo bloco

11/11/2026. Victor confirmou o acesso legítimo à produção com o usuário existente escolhido por ele. A aba produtiva foi conferida após a confirmação: `/onboarding`, zero de nove respostas, primeira pergunta sobre o negócio. Nenhuma resposta foi enviada pelo agente.

**A conta ainda não está pronta como carteira de agência.** A entrada produtiva trata este primeiro negócio como anunciante. O próximo pacote precisa separar a entrada administrativa da agência do onboarding operacional dos anunciantes. Preparar esse pacote não equivale a publicar a carteira em produção.

O preparo anterior que colocaria respostas do Dúú no negócio da Piligrin foi superado e bloqueado localmente antes de qualquer aplicação. Não o reutilizar. Nenhuma alteração remota de dados, schema, papel ou elegibilidade foi executada neste bloco pelo agente.

## 1. Decisão de produto de Victor

| Entidade | Finalidade | Onboarding de anúncios |
|---|---|---|
| Piligrin — agência | Acesso administrativo e gestão da carteira de clientes delegados à V2G | Não exigido para a própria agência acessar a carteira |
| Dúú Gomes — anunciante da Piligrin | Briefing, marca, região, verba, conta de anúncios, peças e resultados próprios | Pertence ao Dúú; preservar dados confirmados |
| Piligrin como anunciante, se futuramente contratado | Operação opcional de anúncios da própria agência pela V2G | Somente se a agência decidir contratar essa operação |

A Piligrin continua sendo a cliente/contratante no modelo B2B2B. O Dúú é o anunciante atendido e não ganha acesso direto por essa separação. A agência pode pagar pelas unidades de operação dos seus clientes; não é preciso vender uma campanha para a própria agência para liberar a gestão da carteira.

Victor observou que a agência já pode ter gestor próprio para seus anúncios. Nenhuma contratação dessa operação foi solicitada. Esta decisão também não estabelece gratuidade geral, novo preço, concessão financeira ou mudança contratual.

## 2. Diagnóstico conferido

- A aba produtiva autenticada abre o questionário de anunciante. Prova: observação CUA da aba `706644098`, título “Sobre o seu negócio — V2G”, `/onboarding`, zero de nove respostas.
- A base de código da revisão produtiva `13f8943471b391bd22e9dd8362f5748653ad9c5b` chama `carregarEstadoAction` diretamente em `app/(fluxo)/onboarding/page.tsx:33`, sem entrada administrativa de agência nessa página.
- O Início dessa revisão encaminha ausência de negócio para `/onboarding` em `app/(protected)/inicio/page.tsx:136`. Criar um registro no banco não entrega, por si só, uma carteira de agência.
- Na QA, `lib/agencia/da-sessao.ts:17` limita o contexto de agência ao piloto QA; `lib/agencia/da-sessao.ts:50` ainda exige que o negócio selecionado esteja entre os anunciantes. Essa hipótese deve ser revista para uma agência sem campanha própria, sem simplesmente retirar a proteção QA.
- A aplicação criou automaticamente um primeiro negócio vazio para o titular após o login. Preservar esse registro e conferir seu estado antes de qualquer preparo posterior; não criar outra raiz por suposição.

## 3. Pacote proposto para revisão

1. Entrada da agência: carteira dos clientes e pendências de cada anunciante, com cadastro administrativo próprio. Nenhum questionário de oferta, público, verba ou marca da agência é exigido para essa finalidade.
2. Detalhe do anunciante: Dúú identificado explicitamente; briefing e operação separados da agência. Manter volta à carteira e identidade visual vigente.
3. Relação explícita entre titular, agência e anunciante. Não inferir autorização pelo nome, e-mail parecido ou pelo preenchimento de respostas. Não usar cookie de seleção como permissão.
4. Acesso administrativo à carteira e autorização para a operação contratada permanecem verificações distintas. Não fabricar pedido pago, recuar datas, promover a operador ou ampliar concessões legadas para fazer o fluxo passar.
5. Validar primeiro em ambiente local/QA: agência sem campanha própria chega à carteira; Dúú abre no recorte correto; outro titular não consegue ler nem selecionar; cliente direto mantém seu percurso; falha de consulta não aparece como carteira vazia; eventual operação própria da agência permanece opcional.

Este documento é o diagnóstico e a especificação do próximo bloco, **não implementação, teste aprovado, migração ou publicação concluídos**. Há uma worktree isolada baseada na revisão produtiva (`webapp-piligrin-producao`, branch `codex/piligrin-agencia-producao`) sem alterações de produto neste bloco. A candidata comercial separada e as alterações de outros chats foram preservadas.

## 4. Resposta do Cauã

A resposta já foi recebida no grupo de gestores e consta do checkpoint `n26-recebimento-dia15-caua-analise-11-11.md`. O recebimento da resposta deixou de ser o bloqueio. A declaração de data não substitui registro legítimo da publicação, nem comprova rodada/revisão/retorno final completos.

Sem cobrança, anúncio publicado, cópia de credenciais, migração remota, commit, push, merge ou deploy neste bloco.
