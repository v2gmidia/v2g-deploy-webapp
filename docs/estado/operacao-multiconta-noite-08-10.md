# Operação e multiconta — noite de 08/10/2026

## Escopo desta passagem

O quadro FigJam de outubro chegou ao limite de chamadas da conexão Figma. A execução seguiu o recorte local em `guia-outubro-08-10.md`, com prioridade para compra, contrato e acesso multiconta. Nenhum item do quadro foi marcado como concluído sem prova na interface.

## Mudanças locais

- `/conta` agora distingue pedido de compra direta confirmado pelo provedor de pedido assistido aprovado pela equipe. O período semestral à vista aparece como semestral, sem ser rotulado como mensal.
- `/conta` passa a usar somente o estado do contrato mais recente de cada pedido. Uma versão antiga assinada não deve fazer a tela afirmar assinatura vigente quando a versão atual está anulada ou pendente; leitura incompleta degrada para estado indisponível.
- `/pedidos` passa a usar o último documento por pedido para contrato e NFS-e; falha ou limite da consulta impede afirmação de assinatura/emissão. O rótulo de período não transforma uma eventual compra semestral em anual.
- `/gestor/compras` é uma fila interna de leitura que inclui pedidos ainda sem `business_id`, ausentes da carteira principal. Mostra origem, estado do pagamento, vínculo de acesso, último estado registrado de contrato e de NFS-e. Busca por empresa, e-mail, CNPJ ou pedido; separa os pendentes, aprovados e cancelados; prioriza comprovantes e tentativas ambíguas. Não consulta saldo bancário, provedor de assinatura nem emissor fiscal ao vivo. A rota e o proxy exigem `app_metadata.papel = operador`; a consulta usa o cliente administrativo só depois dessa checagem. As colunas da tentativa por API só são lidas quando o checkout de QA está habilitado, porque ainda não estão no banco real.
- O bloco de perfil no canto inferior do WebApp abre a lista de negócios liberados e reutiliza a validação de troca existente. O mesmo destino aparece no cabeçalho móvel. A tela de escolha explica que um segundo CNPJ usa o mesmo e-mail e só aparece após compra aprovada. No desenvolvimento há acesso ao checkout de teste; em produção, onde `/contratar` continua bloqueado, há contato assistido.
- A carteira `/gestor` agora abre um preparo de conversa por negócio com o Instagram informado, descrição e diferenciais do cadastro. O link de Instagram só é montado para um identificador de perfil válido; texto livre inválido não vira endereço arbitrário. A avaliação de qualidade continua humana e não é confundida com reserva, campanha ou qualificação impeditiva.

## Verificação nesta passagem

- `corepack pnpm typecheck`: passou após os ajustes.
- `corepack pnpm conferir:contratacao`: 4/4 após a correção do contrato mais recente.
- Após o ajuste de `/pedidos`, `corepack pnpm typecheck`, `conferir:contratacao` (4/4) e `git diff --check` passaram.
- `corepack pnpm conferir:multiconta`: 12/12; `conferir:acesso`: 4/4; `conferir:contratacao`: 4/4.
- `corepack pnpm conferir:onboarding-preservacao`: 31/31; `conferir:ficha-operador`: 15/15.
- `node --import ./scripts/resolvedor-de-imports.mjs --test scripts/conferir-gestor.mjs`: 14/14, incluindo distinção entre comprovante, tentativa ambígua e pagamento, ordenação/filtro da fila e uso do documento mais recente.
- Depois do preparo de conversa, o mesmo conferidor passou 15/15 e `corepack pnpm typecheck` passou. A interface autenticada da carteira ainda não foi vista.
- Sem sessão, `GET /gestor/compras` redirecionou para `/entrar?next=%2Fgestor%2Fcompras`.
- `corepack pnpm build`: passou com o servidor de desenvolvimento parado, após os ajustes de filtro, contrato, pedidos e preparo do gestor; o servidor foi restaurado depois e `/entrar` respondeu HTTP 200.
- Agenda pública Google aberta em navegador na noite de 08/10: mostrou reuniões de 25 minutos com Victor, fuso São Paulo, horários livres em 09, 13, 14 e 15/10, e formulário que exige CNPJ. Um horário de 09/10 às 10h abriu o formulário; ele foi fechado em **Cancelar**, sem reservar. O dia 16/10 não mostrava disponibilidade nessa leitura. Isto prova a página externa, não o botão sob uma sessão de onboarding nem confirmação, remarcação ou cancelamento de evento.
- Interface local `/contratar` em navegador: envio vazio focou o nome obrigatório; CNPJ fictício com dígitos inválidos exibiu “Confira os 14 dígitos”; declaração “Não” para venda pelo WhatsApp exibiu a trava de qualificação. A escolha semestral mostrou Pix e R$ 2.850 por conta; duas contas no anual mostraram R$ 10.560 à vista e 12%. O formulário foi restaurado sem pedido válido, cobrança ou cadastro criado. Isto verifica a interface e as recusas, não o fluxo financeiro.

## Limites ainda abertos

- Não houve ensaio visual autenticado com dois CNPJs nem sessão de operador nesta passagem. O menu, a fila e a troca rápida ainda precisam dessa prova; os conferidores usam dados simulados.
- A minuta não foi aprovada, assinatura e NFS-e não foram integradas, e o link da agenda não comprova reserva. A primeira campanha continua manual e não foi publicada.
- A fila de compras lê no máximo 200 pedidos e 1.000 documentos por tabela; exibe aviso quando alcança esse limite. Uma consulta com erro mostra indisponibilidade, não zero.
- Nenhum commit, push, deploy, migration no banco real, pagamento real ou escrita na Meta foi feito.

## Continuação local — seleção de negócio com CNPJ indisponível (09/10)

- A tela `/escolher-negocio` ignorava erro ao ler `commercial_orders` e, nesse caso, trocava silenciosamente todos os CNPJs pelo prefixo do ID do cadastro. Para negócios de mesmo nome, isso podia levar o cliente a escolher a conta errada. A consulta continua restrita ao perfil autenticado e aos negócios liberados; se ela falhar, agora a tela mostra indisponibilidade e oferece nova tentativa antes da escolha. Negócio legado sem pedido aprovado ainda pode aparecer pelo código quando a consulta funciona.
- `pnpm conferir:multiconta` (12/12), `pnpm typecheck` e `pnpm build` passaram sem servidor dev concorrente. A falha de consulta não foi reproduzida em navegador autenticado nem no banco QA; não afirmar prova de dois CNPJs na interface por estes testes.
