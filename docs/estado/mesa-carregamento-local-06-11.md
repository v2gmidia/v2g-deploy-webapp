# Mesa do Gestor — carregamentos locais em 06/11/2026

## 0. Decisões e provas pendentes

- Este bloco foi autorizado **somente no código local** da Mesa. Não houve commit, push, deploy, escrita em banco nem alteração de permissão.
- Uma sessão local de operador é necessária para cronometrar e revisar a rota real `/supergestor` com dados, filtros e falhas. A visita sem sessão redirecionou para `/entrar?next=%2Fsupergestor`; duração real da carteira: **não medida**.
- Ficha, tarefas, fila de criativos e decisões vivem em rotas compartilhadas fora de `app/(supergestor)/**`. A camada local só dá feedback à saída da carteira; carregamento, persistência e retentativa dentro dessas rotas exigem trabalho no domínio de seus donos.
- O `GestorPage` compartilhado captura a própria falha de consulta e devolve “Carteira indisponível” (`app/(protected)/gestor/page.tsx:287-291`). O novo `error.tsx` cobre exceções que escapem da página, não substitui esse estado interno. O retry desse caso compartilhado ainda depende da página de origem.

## Mapa do comportamento

| Operação | Estado atual e implementação local | Duração no localhost | Limite |
|---|---|---|---|
| Entrada da carteira | `/supergestor` reaproveita `GestorPage` dentro de um `Suspense` local (`app/(supergestor)/supergestor/page.tsx`). `CarteiraLoading.tsx` mostra a estrutura real de cabeçalho, resumo, filtros e registros, sem números inventados. | **Não medida** com operador. | O redirecionamento de login impediu ver o esqueleto na rota real. |
| Filtro da carteira | O formulário GET fica na página compartilhada (`app/(protected)/gestor/page.tsx:198-210`). O componente local intercepta somente esse formulário, mantém parâmetros no endereço via navegação do Next, desativa o botão durante a espera e bloqueia a repetição da mesma consulta. | **Não medida** com dados reais. | A preservação visual do conteúdo anterior durante a consulta depende do `Suspense` da rota e ainda não foi vista com filtro autenticado; o estado de mais de 15 s também não foi observado. |
| Ficha, tarefas e outras saídas | Links internos da carteira recebem aviso contextual após 2 s, sem substituir conteúdo nem piscar em navegações rápidas. O segundo acionamento da mesma URL é bloqueado por até 15 s. Após 10 s, o texto informa a demora; após 15 s, permite tentar de novo. | Simulações de latência de **5 s** e **18 s** na prévia local; não são medições da API real. | A tela de destino é de outro domínio do repositório e precisa tratar suas próprias cargas e escritas. |
| Números | “Ver números” abre leitura em `Suspense` com indicador localizado já existente (`app/(protected)/gestor/page.tsx:157-160,273-275`). A camada local informa a navegação; não muda métricas nem interpreta falha como zero. | **Não medida** com conta real. | A leitura e suas falhas pertencem ao componente compartilhado e ao backend. |
| Falha inesperada da rota | `error.tsx` novo oferece **Tentar novamente** via `reset()`, mantendo caminho e filtros da URL. | **Não medida** em sessão autenticada. | Não foi forçada uma exceção em cliente real; falha capturada dentro de `GestorPage` não chega a esse limite de erro. |

## Verificação feita

- `pnpm typecheck` passou após a implementação e novamente depois de restringir o esqueleto à página da carteira. A rota `/supergestor` respondeu 307 para `/entrar` sem sessão, como esperado. Nenhum build foi rodado: já havia um `next dev` ativo em `localhost:3000`, e build e dev compartilham `.next` neste repositório.
- Na prévia de demonstração em `localhost:3000/exemplo/mesa-gestor`, um link interno rápido chegou à rota com `?leitura=contrato`. A prévia usa dados fictícios e não valida a carteira autenticada.
- Com latência simulada de 5 s, o aviso contextual apareceu, o conteúdo anterior permaneceu visível e o aviso saiu quando a rota terminou. Com latência simulada de 18 s, o texto de demora estava visível na observação após cerca de 10,8 s. O estado de retry aos 15 s **não foi isolado visualmente**: a navegação já havia concluído na observação seguinte. A simulação foi removida e a rede do navegador voltou ao normal.
- A navegação por link também aciona o indicador global “Carregando tela…” (`components/ui/NavegacaoCarregando.tsx:35`). Em latência simulada, ele e o aviso contextual da Mesa ficaram visíveis ao mesmo tempo. Depois dessa observação, o aviso da Mesa passou a esperar 2 s nos links; essa versão final não foi recapturada no navegador. A eventual duplicação em esperas longas deve ser revista no domínio do indicador global; ele não foi alterado neste bloco.
- A prévia no viewport de 390 × 844 mostrou o casco da Mesa responsivo. Havia rolagem horizontal no conteúdo da demonstração, fora das mudanças deste bloco. O esqueleto novo não foi renderizado em sessão autenticada nesse viewport; sua grade passa a uma coluna até 900 px (`app/(supergestor)/Mesa.module.css`).
- O aviso usa `role="status"` e o erro usa `role="alert"`; o esqueleto esconde formas decorativas da árvore de acessibilidade. Não foi executado leitor de tela. Os novos estados não usam animação, portanto `prefers-reduced-motion` não altera seu comportamento.
- A verificação estática do Impeccable retornou zero achados após trocar a cor literal de sombra por token do tema.

## Arquivos locais deste bloco

- `app/(supergestor)/supergestor/CarteiraLoading.tsx` e `page.tsx`: esqueleto só da carteira, dentro de `Suspense`, sem aplicá-lo à homologação.
- `app/(supergestor)/supergestor/error.tsx`: falha inesperada e retry.
- `app/(supergestor)/FeedbackDeNavegacao.tsx`: feedback e prevenção de repetição em links internos e filtros GET.
- `app/(supergestor)/MesaShell.tsx` e `Mesa.module.css`: montagem e apresentação dentro da Mesa.

**Próxima prova:** usar uma sessão local de operador para observar a primeira carga, aplicar filtro, abrir ficha e tarefa, simular erro recuperável e conferir a aparência do esqueleto em desktop e mobile. O estado de sucesso de decisões deve ser testado no domínio da fila de criativos após a persistência, sem afirmar publicação na Meta.
