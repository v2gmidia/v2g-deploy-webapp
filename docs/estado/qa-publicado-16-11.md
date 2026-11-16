# QA do site publicado — 16/11/2026

## Publicação conferida

- URL: https://v2g-deploy-webapp.vercel.app
- Alias também associado ao deploy: https://app.v2gmidia.com.br (alias confirmado pela Vercel; navegação testada no domínio vercel.app).
- Produção READY, deployment `dpl_Ac9qujdCQx5R2TAQXoFSEM3V3JQb`.
- Commit publicado: `da737f11fa2cfa97995ec38e116ff04a59c2150e`, branch `main`.
- Navegação autenticada no Chrome, negócio selecionado V2G, visão de cliente. Mesa do gestor e carteira da agência fora deste QA.

## Veredito

Publicação correta e fluxos visuais principais funcionando. QA com ressalvas: quatro achados reproduzidos abaixo. Nenhum código de produto foi alterado neste QA.

## Achados

### 1. Alta — mensagem de ausência de gasto antes da consulta da conta

FATO: ao abrir `/anuncios`, sem `conta` selecionada, a tela diz “Ele saiu do ar e nenhuma verba está sendo gasta agora”. O seletor ainda pede qual conta consultar. Ao consultar a conta vinculada terminada em 9726, o inventário mostra um anúncio “Ativado na Meta”, R$ 26,49 investidos, 22 cliques, 1.493 impressões e 1 conversa no período de 1–16/11. Há aviso de medições parciais.

Isso não comprova entrega ou gasto no instante do teste. Comprova que a afirmação financeira geral aparece antes de consultar o inventário escolhido e que existem fontes com escopos diferentes.

Referências: `app/(protected)/anuncios/page.tsx:208`, `lib/veiculacao/estado.ts:298`.

Recomendação: não afirmar ausência de gasto atual a partir do fallback da rodada. Antes da seleção, pedir apenas a escolha da conta. Depois, mostrar o estado observado e o período da medição.

### 2. Alta — Início não apresenta os resultados que Anúncios consegue consultar

FATO: `/inicio`, em 1–16/11, mostra “Seu negócio está em preparação”, pede reunião e mantém “Publicar: Concluído”, com 3/4 etapas concluídas. Não mostra os quatro indicadores nem o gráfico. Anúncios consegue consultar os dados descritos no achado 1 para uma conta vinculada ao mesmo negócio. Consultar outubro muda o Início para composição de resultados, com métricas de mídia ausentes e vendas informadas presentes.

INTERPRETAÇÃO: a página inicial do cliente combina pendência de cadastro, etapas de execução e uma fonte de resultados diferente do inventário. Falta explicitar/compatibilizar o escopo da conta para que o cliente compreenda o estado do negócio.

Referências: `app/(protected)/inicio/page.tsx:168`, `app/(protected)/inicio/page.tsx:188`, `app/(protected)/inicio/TelaDoInicio.tsx:495`, `app/(protected)/inicio/TelaDoInicio.tsx:529`, `app/(protected)/inicio/TelaDoInicio.tsx:542`.

Recomendação: alinhar a fonte e a seleção de conta entre Início e Anúncios; manter eventual reunião pendente como tarefa secundária, sem esconder resultados medidos.

### 3. Média — calendário ainda bloqueia períodos maiores que 31 dias

FATO: selecionar 01/01/2026–31/03/2026 mostra “Escolha um período de até 31 dias para consultar a Meta”. Selecionar 01/10/2026–31/10/2026 funciona e atualiza a URL.

Referência: `lib/inicio/periodo.ts:12`.

É uma restrição explícita da consulta atual, não um travamento visual. Ainda não atende ao pedido de selecionar janeiro a março. Ampliar exige ajustar a consulta e sua agregação; não basta retirar a validação do campo.

### 4. Média — limite mensal causa rolagem horizontal em largura intermediária

FATO: em viewport de 1080px, o documento tem largura útil de 1065px e `scrollWidth` de 1165px. O link `.limite-link` (“Mudar limite”) alcança a coordenada direita de 1165px. A barra horizontal foi observada e capturada. Em 1440px e 390px, não houve esse transbordamento nos estados testados.

Referências para correção: `app/inicio-editorial.css:1008`, `app/inicio-editorial.css:1043`, `app/(protected)/inicio/TelaDoInicio.tsx:837`.

Recomendação: adaptar o bloco de limite também no estado sem investimento medido, eliminando largura mínima incompatível com o espaço disponível.

## Verificações que passaram

- Início, Criativos, Anúncios e Conta abrem na publicação autenticada.
- Menu tem quatro páginas, sem Avisos; suporte não se repete no cabeçalho.
- Sol/lua funcionam; tema escuro original restaurado ao terminar.
- Criativos tem Biblioteca, Em revisão e Arquivados; abas respondem e não há busca nem faixa laranja nessa tela.
- Seleção local de imagem, prévia e escolha de objetivo funcionam. Confirmação é pequena, centralizada e contém “Subir criativo?”, “Sim” e “Não”.
- “Não” retorna ao formulário preservando a imagem. Fechar encerra o modal. Não houve envio final.
- Modal de envio e confirmação sem rolagem horizontal em 390px; confirmação também conferida em 1440px.
- Consulta de anúncios, filtro Ativos e expansão dos detalhes funcionam. Falta de associação confirmada ao criativo aparece como ausência, sem associação inventada.
- Conta sem sumário lateral; abertura/fechamento de perfil e preferências funciona. Visual conferido em claro no celular e escuro no desktop.
- `/alertas` redireciona para `/inicio`.
- `/exemplo/criativos` mostra 404 em produção, como previsto.
- Console do navegador sem erros/avisos capturados durante os fluxos principais, antes da visita intencional ao 404.
- Consulta à Vercel de logs error/fatal deste deployment, produção, janela recente de 30 minutos, retornou tabela sem registros. Isso não equivale a auditoria de todo o histórico.

## Limites do QA

- Responsividade testada com emulação de viewport no Chrome, não em aparelho físico.
- Biblioteca real desta conta estava vazia nas três abas. Não foi possível validar um detalhe de criativo já armazenado nem um vínculo existente.
- Não enviado criativo para a fila real, não gravadas vendas, não alterados perfil, contrato, investimento ou anúncios. A persistência ponta a ponta do envio segue sem validação neste QA.
- Não foi conferido login de outro usuário nem isolamento entre clientes. Não se conclui nada sobre contas não abertas.
- Gráfico com série real não apareceu nesta conta/período; não foi validado com dados de produção neste QA.

## Evidências locais

- `.impeccable/review/qa-publicado-confirmacao-desktop.jpg`
- `.impeccable/review/qa-publicado-confirmacao-mobile.jpg`
- `.impeccable/review/qa-publicado-anuncios-desktop.jpg`
- `.impeccable/review/qa-publicado-anuncios-mobile.jpg`
- `.impeccable/review/qa-publicado-inicio-mobile.jpg`
- `.impeccable/review/qa-publicado-inicio-1080.jpg`
- `.impeccable/review/qa-publicado-periodo.png`

Prioridade sugerida: corrigir as afirmações e o alinhamento de dados (1 e 2), eliminar o transbordamento (4), então ampliar a consulta por período (3).
