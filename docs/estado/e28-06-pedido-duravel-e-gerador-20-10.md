# E28-06 — pedido durável e integração do gerador (20/10/2026)

## §0. Falta / depende de autorização

- **E28-06-A parcialmente avançado:** gerador existente inspecionado e escolha técnica de reutilização registrada. Faltam chamador persistente/idempotente, medição de consumo e aprovação do piloto/material/envelope. Não foi criada outra integração paga no Next.js.
- **E28-06-B iniciado localmente, não concluído:** action, persistência e recuperação do pedido foram implementadas, mas a tabela não foi aplicada; não há imagem gerada/arquivada nesta rodada. Ainda faltam job, reserva atômica, arquivo privado/versão e integração dos pré-voos antes da chamada.
- Pedido humano proposto para o futuro portão pago: marca/material fictícios próprios, uma chamada feed e até US$ 2 para o ensaio inteiro. Não aprovado nem gasto; não é teto técnico comprovado. Não repetir por timeout. Ver contrato e condições em `../criativos-integracao-gerador-evento.md`.
- Migração em QA precisa de autorização específica e ambiente identificado. Flag de pedido permanece desativada por padrão; não foi alterado `.env` ou painel externo.
- Barbearia não consta no catálogo atual `backend_v2g/knowledge/`; precisa de documento/ângulo aprovado antes do fluxo desse nicho. Não foi inventado conteúdo nem trocado para outro nicho.
- **E28-06-C/D e E28-05-A/B não concluídos por este bloco.** Pedido guardado não é imagem, consentimento IA, aprovação, fila de revisão, publicação ou veiculação.

## Fontes e direção

- Entrada vigente de 20/10 em `docs/decisoes.md` e `docs/execucao-evento-28-10.md`: P0 geração/arquivo/revisão/resultados, sem redesenhar a mesa. Handoff `docs/handoffs/evento-28-10-05-06.md`.
- Planilha original relida pelo conector em 20/10; E28-06-A em andamento, E28-06-B planejado e dependência de piloto/teto explícita. Não alterada.
- FigJam: `get_metadata` não suporta board; `get_figjam` foi bloqueado pela cota do plano do conector. Não alegar releitura atual do board nem alterar quadro sem evidência. Espelho local/planilha usados neste recorte. Central continua dono dos quadros e do índice.
- `backend_v2g` consultado somente em leitura. Factory/client/agente/rota/modelos/catalogo conferidos; nenhum arquivo de backend, coleta ou métricas alterado.

## Fatos encontrados

O client existente usa OpenAI `images/edits`, modelo default `gpt-image-2`, qualidade high e até três tentativas internas. A rota legada recebe execução/nicho/ângulo e pode descartar versões no modo substituir. O campo de custo vem de tabela estimada, não do `usage`. Essas características impedem chamar o legado diretamente da action do cliente e afirmar idempotência/limite medido. Fontes e linhas em `docs/criativos-integracao-gerador-evento.md`.

## Feito neste recorte

- `lib/criativos/pedido-imagem.ts`: serviço de registro com sessão injetada, validação servidor, confirmação de declaração, prazo real, hash canônico, ID de idempotência e concorrência sem upsert. Mudança de conteúdo não sobrescreve original.
- `lib/criativos/pedidos-da-sessao.ts`: adaptador Supabase da própria sessão, SELECT/INSERT explicitamente filtrados e colunas enumeradas; carregamento de até 20 pedidos do negócio ativo. Não usa service_role, URL assinada ou arquivo privado.
- `app/(protected)/criativos/geracao-actions.ts`: action integrada, erro amigável e revalidação da biblioteca. Não chama provedor, n8n ou Meta.
- `PedidoDeImagem.tsx` e CSS local: formulário com `useActionState`, confirmação, estado de gravação/erro, recuperação visível e distinção explícita entre pedido e geração. A orientação de interface preservou os tokens V2G, inputs acessíveis e estados de falha.
- `page.tsx` / `TelaDeCriativos.tsx`: integração pequena, apenas sob `V2G_CREATIVE_REQUESTS_ENABLED`. Nenhuma reformulação de Início, Avisos, navegação ou mesa.
- Prévia dev-only em `/exemplo/criativos-pedido-duravel`, sem gravação. Guard de produção antes do import. Continua independente da prévia antiga.
- Migração aditiva criada pela CLI oficial em `20261021001651_creative_generation_requests.sql`; **não aplicada**. RLS por dono, INSERT de colunas e nenhuma permissão cliente de UPDATE/DELETE. Manifesto `supabase/objetos.ts` acrescentado sem remover entradas de outros chats.
- Contrato de integração/piloto documentado para a próxima fatia, reutilizando o backend e separando estimativa, consumo e cobrança.

## Testes realmente executados

- `node scripts/conferir-pedido-imagem.mjs`: **10 passaram**, zero falhas (gravação/recuperação no repositório de teste, replay, concorrência, negócio/sessão, confirmação, datas inválidas, falhas e adulteração).
- `node scripts/conferir-pedidos-da-sessao.mjs`: **5 passaram**, zero falhas, executando action + adaptador + loader com Supabase simulado e rede proibida. Inclui ausência de tabela, aba de outro negócio e status inválido. Não são sessões ou RLS reais.
- `pnpm typecheck`: passou depois da integração da prévia e do formulário.
- `git diff --check`: passou; avisos de normalização CRLF em arquivos existentes, sem erro de whitespace.
- Detector de interface (`scripts/detect.mjs` da skill): execução sem achados impressos. A primeira tentativa usou nome de script inexistente; corrigida, sem mudar arquivos por esse erro.
- Prévia HTTP local 200; formulário preenchido no navegador e retorno de que a prévia não guarda nada observado. Campos mantiveram o texto. O preenchimento automatizado do input de data não se sustentou no navegador; não foi declarado como prova interativa de bloqueio de prazo. A validação de datas está provada somente nos testes servidor desta rodada.
- Capturas desktop 1280 e mobile 390 inspecionadas em `.impeccable/review/pedido-duravel-*.png`; override de viewport restaurado.
- Revisão independente de código: **ship para preparo local**; não certifica banco, navegação autenticada ou produção.
- `pnpm conferir:migrations` não completou: leitura de rede bloqueada por EACCES. Não foi contornado, não aplicou migration e não confirmou objetos do banco. Não há veredito de suíte completa.
- Não foi rodado build neste recorte, pois o dev compartilhado está em uso; o build anterior da mesa não é prova destas mudanças novas. Não interrompi servidor de outro chat.

## Próximo passo concreto

Implementar no backend o chamador de geração por pedido/versão, com reserva e resposta idempotentes, materiais/documentos conferidos e consumo rastreável, reaproveitando a camada de imagem. Testar primeiro com mock/armazenamento de teste. Depois, com autorização específica, aplicar a migração em QA e provar guardar/recarregar/trocar sessão/negócio. Somente após os portões de piloto executar uma imagem real; então avançar para aprovação da versão e fila existente.

Sem commit, push, merge, deploy, migração aplicada, configuração externa, gasto, imagem real, cliente contatado ou escrita na Meta. O trabalho alheio no checkout/onboarding/métricas foi preservado.

Para o Central: atualizar E28-06-A como “em andamento — backend inspecionado/contrato e pedido local preparados; piloto pendente”; E28-06-B como “iniciado localmente — pedido sem imagem, tabela não aplicada”. Não mudar E28-05/06-C/D para concluído. Índice/quadros/planilha não foram editados neste bloco.
