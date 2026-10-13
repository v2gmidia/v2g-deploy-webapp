# Etapa 03 — leitura multiconta em lotes, 13/10/2026

## Estado

Correção **local**. A sessão HTTPS de QA com dois negócios, respostas distintas e retomada já havia sido observada em `qa-onboarding-https-11-10.md`; esta alteração de volume ainda não foi publicada nem exercitada no QA. A etapa 03 completa também pede troca em duas abas, revogação e ações antigas sob sessão autenticada.

## Falha e correção

`negocioAtivoDaSessao` e `/escolher-negocio` paginavam os pedidos, mas enviavam **todos** os IDs dos negócios em um único filtro `in`. Com muitas contas do mesmo login, a consulta podia exceder limites de URL ou servidor. A primeira protege o acesso; a segunda identifica o CNPJ do seletor. Ambas agora consultam lotes de no máximo 100 IDs, paginando dentro de cada lote. Falha em qualquer lote ou página invalida o conjunto: não há liberação ou identificação baseada em resposta parcial.

A reivindicação da compra aprovada no primeiro acesso (`vincularComprasAprovadasComCliente`) ainda tinha uma leitura implícita de até 1.000 pedidos e filtros `in` sem lote. Agora lê páginas ordenadas, atualiza no máximo 100 negócios por consulta, reconfirma a propriedade de todos os lotes e grava pedidos em lotes de até 100, sempre vinculados ao ID do negócio conferido. Erro ao ler página posterior impede qualquer reivindicação. Gravação parcial pode ocorrer se um lote posterior falhar, mas a operação é repetível: a próxima entrada reconfere propriedade e conclui apenas vínculos ainda nulos. Isso não amplia acesso por si só; o seletor continua exigindo pedido aprovado e e-mail verificado.

Na gravação final do vínculo, o `UPDATE` reconfere no próprio banco o e-mail do comprador e `payment_approved`, além de negócio e perfil ainda não vinculado. Se o pedido mudar entre a leitura e a gravação, ele fica sem vínculo e poderá ser reavaliado na próxima entrada. A checagem inicial sozinha não bastava para essa corrida.

Depois da leitura em lotes, `negociosLiberados` passou a agrupar pedidos pelo ID do negócio uma vez, em vez de varrer todos os pedidos para cada empresa. Os critérios de aprovação, e-mail verificado e legado não mudaram; o caso de pedidos pendentes/aprovados de CNPJs diferentes foi acrescentado à suíte. O ganho de tempo não foi medido em QA.

## Verificação e limite

`node --test scripts/conferir-multiconta.mjs`: 21/21, incluindo 205 negócios em três lotes, 1.001 pedidos em duas páginas com gravações de 100, 101 negócios em filtros separados e erro na página posterior. `pnpm typecheck` e `pnpm build` passaram; o servidor de desenvolvimento foi parado para o build e reiniciado na porta 3000. Não houve leitura ou escrita em Supabase, compra, alteração de acesso, commit, push ou deploy.

Auditoria local adicional de duas abas: as ações de onboarding (negócio, contas e marca), `/meu-negocio`, verba, identidade visual, criativos e troca de página conferem o negócio esperado na hora de salvar. A suíte de preservação já contém cenários de aba antiga para onboarding e contas. Isso reduz a chance de gravar no CNPJ trocado em outra aba, mas ainda não substitui o teste autenticado de duas abas no QA. O FigJam da etapa 03 foi atualizado em 13/10 para retirar o rótulo obsoleto "QA pausado" e separar a prova anterior do código local desta noite.

Tentativa de prova HTTPS em 13/10 às 02h27 (Brasília): a sessão autenticada atualmente aberta no Chrome mostrou apenas **V2G QA Empresa 4 Fictícia** no `/inicio`. Essa sessão de um único negócio não permite provar troca de duas abas. A aba criada só para inspeção foi fechada; nenhuma resposta foi gravada, nenhum vínculo ou sessão foi alterado. A prova continua pendente em uma conta QA com dois negócios liberados.
