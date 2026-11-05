# E28 — recebimento Meta e continuidade após 03/04

**Data:** 21/10/2026  
**Estado:** documentação e FigJam implementados; nenhuma alteração operacional externa.

## Decisão

As etapas 03 e 04 continuam concluídas dentro do escopo já validado. O recebimento de clientes na Meta e o App Review formam uma frente nova; não reabrem 03/04.

## Feito neste bloco

- criado `docs/recebimento-cliente-meta.md`;
- separado acesso ao app, parceria empresarial e credencial de API;
- definido playbook operacional de dez etapas;
- criada matriz de acesso mínimo e caminhos de exceção;
- documentado contrato WebApp → backend/n8n com negação por divergência;
- registrado o desalinhamento Graph API `v25.0`/`v23.0`;
- estruturado checklist de dez etapas para o App Review;
- criado cenário fictício e handoff mínimo para preparação de acesso/vídeo.
- criado novo FigJam com o fluxo operacional e o checklist visual das dez etapas do App Review.

## Não feito e não alegado

- nenhum código foi alterado;
- nenhum token ou segredo foi lido ou modificado;
- nenhum workflow n8n foi alterado;
- nenhum acesso, ativo ou configuração da Meta foi modificado;
- nenhuma submissão foi reenviada;
- o conteúdo do workflow n8n ao vivo não foi certificado;
- nenhuma publicação real foi executada.

## Bloqueios reais

1. decidir e implementar uma única arquitetura de credencial por operação;
2. eliminar IDs livres entre WebApp, n8n e backend;
3. alinhar a versão da Graph API;
4. montar um ambiente de teste reprodutível para o revisor;
5. cumprir o requisito de uso legítimo do Marketing API Access Tier;
6. refazer evidências e vídeos ponta a ponta.

## Próximo checkpoint

Pilotar o playbook com ativos de teste e registrar, etapa por etapa, evidência, tempo gasto, exceção e responsável. Mudanças de código, n8n, Meta ou submissão exigem nova autorização explícita.

## Artefatos

- `docs/recebimento-cliente-meta.md`
- FigJam `V2G | Recebimento de cliente | Meta`: https://www.figma.com/board/DGGCCnjlOlmy5vzsa11yoW

## Atualização 04/11/2026 — entrega operacional ao Cauã

Este roteiro é um checkpoint de passagem; não declara cliente real transferido. O FigJam de novembro e a planilha de novembro são o plano vigente de 04/11. Os artefatos de outubro permanecem históricos.

### Pacote por negócio

1. **Proprietário — Victor:** registrar o nome jurídico/operacional do negócio, o e-mail autorizado e quem pode aprovar. Prova manual: conferir a pessoa e o negócio na BM e guardar a tela com data; relato ou nome parecido não basta.
2. **Página — Cauã confere, Victor libera quando necessário:** registrar nome e ID da Página. Prova manual: abrir a Página a partir da BM correta e confirmar que o ID coincide com o pacote.
3. **Instagram — Cauã confere:** registrar `@perfil` e ID do Instagram. Prova manual: verificar propriedade/vínculo na BM e abrir o perfil; presença no anúncio não substitui a conferência do ativo.
4. **Conta de anúncios — Cauã confere:** registrar nome, `act_...`, BM proprietária e moeda/fuso. Prova manual: abrir a conta pelo seletor e conferir o ID visível antes de qualquer operação.
5. **Autorização — Victor aprova o escopo:** anotar separadamente quem pode ler, preparar, publicar e administrar acessos. Prova manual: matriz de pessoas/usuários do sistema e ativos atribuídos; acesso total não é presumido.
6. **IDs — Cauã entrega o mapa; Victor revisa divergências:** `business_id`, `page_id`, `instagram_id`, `ad_account_id`, negócio interno e referência do pedido. Nenhum ID entra por semelhança de nome.
7. **Aceite de leitura — Cauã executa, Victor valida:** consulta somente leitura da conta e do período combinados, com comparação manual na mesma fonte/data. Este aceite não autoriza criar, editar, pausar ou publicar.
8. **Aceite de publicação — Victor autoriza em ato separado:** campanha, conjunto, anúncio, orçamento, destino e peça exata precisam de revisão própria. Somente evidência da Meta depois da ação permite registrar “publicado” ou “no ar”.

### Prova mínima de entrega

- checklist preenchido com proprietário, Página, Instagram, conta de anúncios, autorização e IDs;
- capturas manuais da BM/ativos e do seletor da conta, com data;
- resultado do aceite de leitura separado do aceite de publicação;
- pendências, responsável e próxima verificação explícitos;
- estado final permitido antes dos dois aceites: **“pacote preparado, transferência não comprovada”**.

### Fontes de novembro

- FigJam: https://www.figma.com/board/Ofzj9dZqeSbqN5Uq0jZLVI
- Planilha: https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o

### Fechamento local do bloco de agenda — 04/11

**Defeito comprovado:** `/onboarding/concluido` conciliava evento, cancelamento e mudança de horário com o Google; `/inicio` confiava diretamente na linha local `confirmed`. Assim, o Início podia manter confirmação antiga depois de cancelamento/mudança externa, e uma reserva externa nova só era descoberta após revisitar a conclusão.

**Correção local:** o Início agora pede `carregarAgendaAction` para o negócio ativo e só remove a pendência quando essa leitura devolve `confirmada`. `legado`, `livre`, `pendente`, clique no link e linha local isolada não confirmam reserva. Falha do Google mantém a reunião pendente e mostra estado a conferir. Negócios A e B não compartilham a confirmação.

**Provas locais:**

- `pnpm typecheck --pretty false`: verde;
- agenda externa + conciliação + pendência: 27/27 verdes;
- `pnpm conferir:inicio`: 70/70 verdes;
- `pnpm conferir:onboarding-preservacao`: 77/77 verdes;
- teste focado da recepção: os três casos novos (A confirmado, B pendente e sem confirmação/falha) passaram; permanecem quatro falhas históricas já presentes no baseline, ligadas à renderização antiga da recepção/copy e ao link de período;
- `pnpm conferir:multiconta`: 21 testes passaram e o arquivo `conferir-multiconta-sessao.mjs` parou antes dos testes por import novo fora da allowlist (`lib/contratacao/acesso-contratado.ts`), preexistente e fora deste bloco;
- `git diff --check`: verde; apenas avisos de fim de linha em arquivos de contratação não alterados aqui.

**QA:** não executado; nenhuma reserva, conta ou sessão autenticada foi usada.

**Produção:** não alterada; sem deploy, migration, Supabase remoto, Google real, Meta, mensagem, commit ou push.

**Próximo ato:** Victor publica pelo fluxo habitual quando revisar o lote. Depois, Cauã testa no QA autenticado dois negócios autorizados: A com evento Google confirmado e B sem evento. A prova mínima é A mostrar o horário conciliado, B continuar com “Conferir reunião”, e cancelamento/mudança no Google aparecer no Início após atualizar sem oferecer uma segunda reserva como padrão.
