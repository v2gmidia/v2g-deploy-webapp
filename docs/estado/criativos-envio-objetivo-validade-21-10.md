# Criativos — 1. Já tenho um criativo — 21/10/2026

## Escopo e autorização

Victor aprovou implementar somente o envio de imagem pronta: objetivo fechado em WhatsApp ou Instagram, promoção opcional com validade e conferência antes do envio. Perguntas de produto/oferta/ação pertencem ao fluxo de criação, não a este formulário. Os blocos 2 e 3 não foram iniciados nesta rodada.

Status: **implementação local e prévia verificadas; NÃO homologado com conta autenticada/banco/Storage reais.** Sem commit, push, deploy, aplicação de migration, configuração externa, publicação ou chamada paga.

## Feito, com evidência

- Formulário de duas etapas no componente real: imagem → objetivo → promoção opcional → resumo com prévia/objetivo/prazo → confirmação explícita → revisão. Não pergunta produto/oferta nem repete a ação desejada. `app/(protected)/criativos/PedirRevisao.tsx:16` e `app/(protected)/criativos/TelaDeCriativos.tsx:23`.
- Voltar para ajustar preserva o input de arquivo montado e os dados. Interrupção de conexão preserva o mesmo identificador para tentar confirmar o envio, sem afirmar sucesso. URL local da prévia é revogada ao trocar/remover arquivo. Limites JPG/PNG e 9 MB preservados.
- Action confere intenção também no servidor, autentica sessão/negócio ativo e persiste objetivo, fim da promoção e horário de confirmação gerado no servidor. Mesmo ID só retoma o mesmo arquivo/hash, autor, negócio, objetivo e prazo; não troca a confirmação original. `app/(protected)/criativos/revisao-actions.ts:48`, `:72`, `:96` e `:117`.
- Galeria do cliente e fila do gestor leem explicitamente a nova coluna e apresentam objetivo/validade, sem inferir campos antigos. `app/(protected)/criativos/page.tsx:96`, `:151`; `app/(protected)/gestor/criativos/page.tsx:52`, `:114`.
- Prazo inclusivo no dia de São Paulo. Datas impossíveis/vencidas não entram em novos pedidos. Promoção vencida não recebe aprovação interna, mas pode receber solicitação de ajustes/recusa. O histórico permanece legível. `lib/criativos/intencao-envio.ts:15`, `:32`, `:64`, `:75`; `app/(protected)/gestor/criativos/actions.ts:30`, `:37`.
- Migration criada pela CLI oficial, **somente arquivo local**: `supabase/migrations/20261021032617_creative_review_upload_intent.sql:3`. Acrescenta JSONB nullable com CHECK de formato/chaves/objetivo/data; preserva legado NULL. Não modifica bucket, RLS ou grants. Manifesto atualizado em `supabase/objetos.ts`.
- Prévia usa o mesmo formulário, com interrupção explícita antes de qualquer action. `http://localhost:3000/exemplo/criativos#subir-criativo`. Não cria pedido, não envia imagem, não analisa e não publica.

## Provas e testes

- `pnpm typecheck`: passou.
- `pnpm conferir:intencao-envio`: **16/16**. Inclui helpers e actions reais com sessão/banco/Storage substituídos por portas em memória e rede proibida; não é teste SQL/RLS real.
- `node --experimental-strip-types scripts/conferir-revisao-criativos.mjs`: **11/11**.
- `pnpm conferir:criativos`: **30/30**.
- `pnpm conferir:tarefas-gestor`: **5/5**.
- `pnpm conferir:portao`: **8/8**, análise estática; não substitui prova de 404 no build.
- `git diff --check`: passou, apenas avisos de conversão futura LF/CRLF.
- Detector Impeccable executado uma vez: dois avisos de tamanho de fonte fora da escala; substituídos pelos tokens existentes. Revisão React: sessão validada nas actions, imports diretos, sem bibliotecas novas, labels/fieldset nativos, foco no resumo, cleanup de object URL e dados do input preservados.
- Navegador: 1280×900, 840×900 e 390×844; sem transbordamento horizontal nos dois tamanhos menores. WhatsApp com promoção até 28/10 chegou ao resumo; Instagram sem promoção chegou ao resumo. Confirmação por teclado habilitou o botão. Clique final retornou apenas a mensagem de simulação. Temas claro/escuro e retorno para ajustes conferidos; nenhum erro/aviso no console capturado. Tema claro e viewport padrão restaurados.
- Material de teste: apenas `public/marca.png`, arquivo público da aplicação. Nenhuma imagem privada de cliente.
- Capturas: `.impeccable/review/envio-criativo-desktop.png`, `envio-criativo-conferencia-desktop.png`, `envio-criativo-mobile.png`, `envio-criativo-mobile-escuro.png`. A captura de conferência desktop antecede a última correção de aparência dos botões; a captura `envio-criativo-desktop.png` mostra o formulário final.

### Conferência de banco: resultado NÃO verde

`pnpm conferir:migrations` foi executado em modo somente leitura. A primeira tentativa foi bloqueada por rede; a repetição autorizada terminou com **20 falhas de objetos ausentes**, incluindo a nova coluna `creative_review_requests.upload_intent`. O manifesto correspondeu aos 52 arquivos presentes naquele momento, mas havia outras ausências de objetos de trabalho anterior/concorrente, fora deste recorte. Isso não comprova o ledger de migrations: o projeto não está linkado e essa camada do conferidor ficou desligada. Nenhum desses problemas foi corrigido aplicando SQL.

## Falta / depende de Victor

1. Autorizar o ambiente de QA e a aplicação **desta migration específica**, depois de reconciliar ledger/schema. Não executar `db push` em lote: há outras migrations pendentes de outros chats.
2. Ensaiar CHECK, legado NULL e acesso por dono/gestor no SQL de QA; autenticar conta de teste e demonstrar formulário → action → linha persistida → arquivo privado → galeria recarregada → fila do gestor → decisão. Testar também outra conta/agência e falhas parciais reais. Não afirmar conclusão ponta a ponta antes disso.
3. Build de produção e 404 da bancada ainda não repetidos: servidor compartilhado em execução; não foi derrubado para construir.
4. Central incorporar este checkpoint ao índice/plano/quadros, se autorizado. Esses documentos compartilhados não foram sobrescritos nesta rodada.

## Limites importantes

- Validade é contexto e trava de aprovação interna; **não agenda publicação nem pausa automática na Meta**. Publicação continua manual e precisa conferir novamente prazo/objetivo na execução.
- Aprovação interna, análise automática e publicação são estados diferentes. Nenhuma mensagem nova afirma “no ar”. O piloto de análise existente foi preservado, sem ativar configuração nem executar chamada paga.
- A nova coluna é requisito do novo código. Se ela faltar, o envio retorna erro e a biblioteca informa falha; não há fallback que descarte silenciosamente o objetivo/prazo.
- Datas desconhecidas de envios antigos continuam desconhecidas. Não houve migração de conteúdo, inferência de objetivo ou alteração de estado desses envios.
- O fluxo novo não foi disponibilizado em produção. Os blocos de criação por IA e base de contexto ficam para aprovação/rodada posteriores.
