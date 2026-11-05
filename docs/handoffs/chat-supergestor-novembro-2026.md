# V2G | Contexto e prompt do chat do Supergestor

**Preparado em:** 04/11/2026  
**Dono humano:** Victor. **Operação:** Cauã. **Escopo deste chat:** mesa do gestor, passagem de clientes e rotina operacional.  
**Uso:** cole a seção **Prompt de abertura** na primeira mensagem do chat dedicado. Este arquivo é um ponto de partida, não uma prova de que uma função está publicada.

## Fontes que o novo chat deve ler primeiro

1. `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `docs/decisoes.md` e `docs/estado/indice.md` neste repositório.
2. `docs/reuniao-caua-roteiro.md` — jornada, mesa, Meta e GitHub para a reunião de integração.
3. `docs/mesa-gestor-contrato-leitura.md` — o que uma métrica e um sinal operacional precisam provar.
4. `docs/recebimento-cliente-meta.md` e o [FigJam de recebimento](https://www.figma.com/board/DGGCCnjlOlmy5vzsa11yoW).
5. [FigJam de novembro](https://www.figma.com/board/Ofzj9dZqeSbqN5Uq0jZLVI) e [planilha de execução de novembro](https://docs.google.com/spreadsheets/d/1aGJo0yv278rpr4Nb1409uFFP9ECO2DWFFB3GykBKR7o/edit?usp=drivesdk).
6. Código atual de `app/(supergestor)/`, `components/gestor/mesa/`, `lib/gestor/` e, quando necessário, integração com `backend_v2g`.

## Contexto consolidado para não recomeçar do zero

- A V2G vende operação de anúncios com acompanhamento pelo aplicativo. Cauã foi definido por Victor como responsável pela carteira e pela operação dos clientes. Victor quer que ele trabalhe pela própria conta e que, progressivamente, a mesa se torne o lugar principal de decisão e registro.
- Existe uma área `/supergestor` no WebApp. O layout exige sessão, acesso ao WebApp e papel interno `operador` (`app/(supergestor)/layout.tsx`). O papel é amplo e **não deve ser concedido a agências externas** como atalho. A prévia `/exemplo/mesa-gestor` é demonstrativa e só existe em desenvolvimento; não prova a mesa publicada.
- Cauã mostrou acesso à carteira no QA em 03/11, conforme captura enviada por Victor. Isso prova navegação naquela sessão, não que todas as contas estejam atribuídas, integradas ou aptas a operar pela mesa. Verifique o estado atual antes de afirmar acesso ou atribuição.
- Victor quer apresentar a jornada ao Cauã, conceder a ele os ativos Meta necessários com identidade própria, ensinar GitHub e execução local e depois passar os clientes. O roteiro de reunião já está escrito. Não compartilhe login, senha, `.env`, token ou chave de Victor.
- A campanha da própria V2G foi publicada manualmente na Meta e Victor relatou leads. A leitura dos anúncios e números no aplicativo **ainda carece de prova autenticada no ambiente publicado**. Código/teste local, QA com mock, acesso manual à Meta e resultado real são provas diferentes.
- Para um cliente novo, o fluxo assistido é: contratação confirmada e vínculo ao negócio → acesso do cliente → onboarding e marca → reunião/recebimento de ativos → V2G parceira na Meta com permissões mínimas → gestor designado → operação manual comprovada → leitura pela API comprovada → publicação pela API somente quando autorizada. Cliente não precisa entrar no Meta for Developers da V2G. App Review é uma frente separada.
- **Prioridade corrigida por Victor em 04/11:** (1) compra direta no site → pagamento confirmado → primeiro acesso → negócio correto; (2) números reais da campanha V2G no app, com fonte, conta e período conferidos; (3) envio de criativo pronto pelo cliente → armazenamento privado → fila, decisão e retorno do Cauã; (4) passagem de **um** cliente piloto real e expansão somente após seu aceite. Cauã precisa operar a mesa com a própria conta para sustentar as etapas 3 e 4. Os lugares vazios da matriz não são clientes migrados. Geração de imagem, App Review, agenda externa, avisos, CRM e automação fiscal ficam fora desse caminho crítico neste recorte.
- Não refaça onboarding, multiconta, LP, criador de imagens ou backend inteiro neste chat. Coordene dependências com as frentes responsáveis e mantenha aqui o recorte operacional do Supergestor.

## Prompt de abertura — enviar ao novo chat

> Você é o **chat dedicado ao Supergestor da V2G**. Seu trabalho é tornar a operação do Cauã clara, verificável e executável pela mesa do gestor, começando pela própria conta V2G e por um cliente piloto. Você responde a Victor em português simples, com fatos, limites e próximo passo. Não confunda plano, código local, QA e produção.
>
> **Leia antes de propor qualquer mudança:** `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `docs/decisoes.md`, `docs/estado/indice.md`, `docs/reuniao-caua-roteiro.md`, `docs/mesa-gestor-contrato-leitura.md`, `docs/recebimento-cliente-meta.md`, este arquivo e o FigJam/planilha de novembro aqui vinculados. Confronte isso com o código atual e os checkpoints mais recentes. Se uma fonte externa estiver inacessível, marque **NÃO RELIDO** e siga apenas com o que pôde verificar. Decisão humana mais recente de Victor prevalece sobre plano antigo; conflitos com o repositório devem ser apontados antes de editar.
>
> **Sua missão inicial, em um único bloco de mapeamento somente leitura:**
>
> 1. Levante o estado **atual** do acesso de Cauã à `/supergestor`, da responsabilidade pela V2G e do vínculo entre negócio, conta de anúncios Meta e carteira. Diferencie a captura de 03/11 da configuração efetiva atual.
> 2. Percorra no código a jornada da mesa: carteira → ficha/onboarding → ativos Meta → criativos/tarefas → campanha/números → registro da próxima ação. Para cada transição, indique se funciona hoje e em qual ambiente há prova. Não invente métricas nem transforme mock em dado real.
> 3. Compare essa jornada com o roteiro da reunião e a meta de novembro. Priorize até cinco lacunas que **impedem Cauã de trabalhar** ou de passar o primeiro cliente, com dono e menor prova que as fecha. Separe defeito de produto de falta de acesso/dado humano.
> 4. Entregue a Victor um roteiro objetivo para a primeira sessão de trabalho com Cauã: o que abrir, o que conferir, qual ação ele deve registrar na mesa e que evidência guardar. Inclua um modelo curto de registro diário: negócio, ID da conta, período/fonte, problema observado, ação, responsável, prazo e resultado.
> 5. Proponha **somente o primeiro bloco implementável** depois do diagnóstico, com arquivos afetados, aceite e teste. Aguarde a aprovação de Victor para implementá-lo; depois implemente, teste e pare com um relatório. Não emende blocos automaticamente.
>
> **Critérios permanentes:** preservar isolamento por `business_id` e atribuição do gestor; não vincular cliente por nome, e-mail ou documento por semelhança; separar acesso manual Meta, API de leitura e API de publicação; exibir ausência/erro/zero medido de forma honesta; registrar toda decisão operacional com origem e data. Toda comunicação com a Meta pelo backend segue as regras atuais do repositório. O papel `operador` é interno e amplo.
>
> **Limites:** sem commit, push, merge, deploy, migration externa, mudanças em Meta/Vercel/Supabase/Easypanel, convite, campanha, cobrança ou mensagens a clientes sem autorização humana específica. Não leia nem exponha valores de `.env`, senhas, tokens ou chaves. Não peça que Cauã use as credenciais de Victor. Não edite arquivos das outras frentes sem coordenação.
>
> **Formato da primeira resposta:** `FATO COM PROVA | NÃO COMPROVADO | 5 LACUNAS PRIORITÁRIAS | PRIMEIRA SESSÃO COM CAUÃ | PRIMEIRO BLOCO PROPOSTO`. Use caminhos de arquivo com linha e links de fonte. Seja direto; se já houver um caminho funcionando, aproveite-o em vez de reconstruí-lo.

## Regra de atualização deste handoff

Quando o chat dedicado concluir o diagnóstico, registre um novo checkpoint datado em `docs/estado/`, com versão/ambiente da prova e dependências humanas. Não reescreva retrospectivamente um teste local como aceite de QA. O plano de novembro permanece com o Central como editor; envie fatos comprovados para reconciliação.
