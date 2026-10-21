# E28-05-B — consumidor mínimo da leitura — 21/10/2026

## 0. Estado e portões

**Concluído no recorte local, não homologado com dados reais.** Retomada do consumidor parcial após direcionamento do Central, dentro da coordenação aprovada em `docs/decisoes.md` e `docs/handoffs/noite-21-10-central.md`. O refino visual do upload já entregue foi preservado, não refeito. Caminhos IA 2/3 continuam fechados.

Não foram alterados `.env`, flags externas, banco ou backend. `V2G_MANAGER_METRICS_READ_ENABLED` fica OFF quando ausente ou diferente de `true`. Na carteira, a entrada também depende de `V2G_MANAGER_WORK_ENABLED` e de atribuições disponíveis e não truncadas. Os nomes estão preparados no código; nenhuma ativação foi feita. Não se leu o valor das variáveis reais.

Próximo portão: Central/Victor precisam autorizar e preparar ambiente de QA com contrato backend compatível, operador e negócio fictício atribuído, configuração de leitura e evidência HTTPS/autenticada. Validar autorização e isolamento reais antes de liberar o recurso. Sem contrato novo, a tela informa integração pendente; não usa agregados antigos. Mesa completa, agência, benchmark, semáforo de desempenho e ações automáticas não pertencem a este recorte.

## Feito, com evidência de código

- `app/(protected)/gestor/page.tsx:121`: seleção `metricas` só alcança um negócio presente na carteira e atribuído ao operador. Erro/truncamento das atribuições fecha a seleção. `:155`: consumidor assíncrono em Suspense; `:272`: entrada “Ver números” na ficha existente, preservando busca/filtro. Nenhum redesenho amplo da carteira.
- `app/(supergestor)/supergestor/page.tsx`: encaminha os parâmetros à mesma página. Não cria uma segunda regra de acesso nem amplia papéis. Layout interno existente permanece intacto.
- `components/gestor/leitura/LeituraDaConta.tsx:6`: wrapper server-only e guarda default OFF antes de qualquer chamada. Usa o adaptador já entregue, que verifica sessão/app_metadata, vínculo exato em `manager_accounts` e proprietário do negócio antes do GET backend. Não houve reimplementação do adaptador; nele só se atualizou o comentário sobre o consumidor.
- `components/gestor/leitura/DadosDaConta.tsx:29`: apresentação pequena com conta/campanha, período, fonte e coleta UTC; seis medições separadas. Ausência não vira zero; clique total não vira clique no link; resultado atribuído não vira conversa/venda. Inconsistência retira valores, inclusive gasto irmão. Gasto só aparece quando fornecido no recorte validado e conserva moeda.
- Motivos/avisos livres do backend não vão para a interface. O DTO técnico os preserva, mas a apresentação usa mensagens próprias e estados estruturados. Janela de atribuição e origem do vínculo só ganham descrição reconhecida; não reproduzem texto livre.
- `app/exemplo/mesa-gestor/page.tsx` mantém bloqueio de produção antes dos imports de prévia e acrescenta o ramo `?leitura=contrato`, sem substituir a demonstração anterior. `PreviaLeitura.tsx` tem guarda de produção própria e lê a fixture canônica local do backend, sem cópia mantida neste repo, sem adaptador de rede e sem fallback fictício no produto.
- Prévia com cinco cenários canônicos (observado, sem dados, zero, parcial/desatualizado e inconsistente), mais contrato ausente. A ausência da própria fixture produz indisponibilidade, não dados de reposição. Formulário GET permite selecionar o cenário. “Dados fictícios” e ausência de integração real estão identificados na tela.

## Arquivos deste recorte

Novos/parciais finalizados:

- `components/gestor/leitura/LeituraDaConta.tsx`
- `components/gestor/leitura/DadosDaConta.tsx`
- `components/gestor/leitura/LeituraDaConta.module.css`
- `app/exemplo/mesa-gestor/PreviaLeitura.tsx`
- `app/exemplo/mesa-gestor/previa-leitura.module.css`
- `scripts/conferir-consumidor-metricas.mjs`

Integrações restritas: `app/(protected)/gestor/page.tsx`, `app/(supergestor)/supergestor/page.tsx`, `app/exemplo/mesa-gestor/page.tsx`, comentário em `lib/backend/metricas-da-carteira.ts`. Este checkpoint e capturas `.impeccable/review/mesa-leitura-*`. Não se editaram índice, decisões, package.json ou handoffs centrais.

## Provas executadas

- **13/13** em `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-consumidor-metricas.mjs`. Executa o consumidor assíncrono REAL, adaptador/parser reais e renderização SSR real. Apenas portas Auth/banco/fetch são em memória; URL/token são fictícios no processo de teste, sem rede ou leitura de `.env`.
- Casos: flag ausente/false não abre sessão/rede; ausência de sessão, cliente, agência e papel em user_metadata são negados; conta não atribuída não chega ao backend; dono é lido do banco; contrato ausente ignora agregados antigos; cinco cenários canônicos; erro e motivos livres não vazam; gasto validado conserva BRL. Verificação adicional de ligação das páginas é estática, não execução autenticada da página inteira.
- `pnpm typecheck`: passou ao final. `pnpm conferir:portao`: **8/8** (scanner de nomes de fixture; não prova sozinho toda a fronteira de produção).
- Detector Impeccable: uma execução sobre os quatro arquivos visuais novos, saída 0 sem achados. O skill orientou continuidade dos tokens, tabela sem números heroicos e foco/controles; não substitui revisão humana.
- Revisão React: server-only/presentação separados, sem efeito ou estado no cliente; Suspense na leitura; nenhuma dependência nova. Checklist Supabase preserva getUser/app_metadata e escopo exato antes da porta administrativa; não houve consulta a Supabase real.
- Navegador localhost: ramo de prévia carregou os dados da fixture canônica. Normal desktop, inconsistente mobile e contrato ausente foram conferidos pela interface. A inconsistência apresentou **0 células observadas**; mobile 390 px retornou largura do documento **390 px**, sem excesso horizontal. Tabela inteira inspecionada no celular. Console consultado sem erros/avisos. Viewport restaurado ao padrão, tema claro preservado.
- Capturas: `mesa-leitura-desktop.png` (final), `mesa-leitura-mobile-inconsistente.png` (primeira captura mobile; fonte foi depois explicitada como múltiplas origens), `mesa-leitura-mobile-indisponivel.png`. Aba de prévia marcada como entrega, upload mantido em sua aba anterior.
- `git diff --check` dos arquivos rastreados tocados: passou. Sem build/restart do dev compartilhado. As 60 provas do bloco técnico anterior não foram repetidas neste recorte.

## Limites e menor próximo passo

Não foram executados: login real na mesa, RLS/Storage reais, backend publicado, autorização de agência, consulta Meta, conta externa ou ensaio HTTPS. As medições da prévia são **fictícias**; a prova SSR é **local com portas em memória**, não ponta a ponta. A fixture não fornece gasto: a prévia normal corretamente diz “Não informado”; a renderização de gasto foi testada somente em memória com valor fictício explícito.

Figma principal **não relido/atualizado**, conforme indisponibilidade relatada pelo Central; espelho/checkpoints locais foram usados. Sem commit/push/merge/deploy, migration externa, convite, alteração de configuração, Meta/n8n, email, pagamento ou chamada paga. Encerrado este bloco, aguardando próximo recorte autorizado do Central/Victor.
