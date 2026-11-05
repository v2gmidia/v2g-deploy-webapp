# N26-P1b — elegibilidade por pedido após estorno — 05/11/2026

## 0. Estado e próximo ato

**LOCAL concluído. QA/produção não atualizados nem homologados neste bloco.**
Direção de Victor distribuída pelo Central: fechar elegibilidade nas portas
existentes, preservar direitos independentes A/B, sem migration/deploy/cobrança.
Base: `n26-p1-compra-acesso-04-11.md` e N26-05 de contratação histórica.

01/02/Central revisam o conjunto local antes da publicação autorizada no QA.
Próxima prova: usuário comum com A estornado e B válido; conferir seleção,
cookie antigo, rotas protegidas e tentativa de novo vínculo, sem repetir compra.
Escolher fixtures já autorizadas compatíveis ou preparar o roteiro exato para
autorização de dados fictícios. Não criar conta/grant para produzir verde.
Somente depois da revisão e da autorização específica, publicar e executar.

LP e checkout de produção continuam bloqueados conforme N26-P1; guard
QA/Sandbox preservado. Não há nova cobrança, mensagem ou liberação remota.

## 1. Regra aplicada e prova de causa

Antes da edição, o conferidor novo exercitou os módulos reais com portas de
banco/Auth fictícias: **4/6 cenários falharam**. A conta já vinculada a A ainda
ganhava acesso após `PAYMENT_REFUNDED`; o seletor mostrava A/B e a rotina de
vínculo atribuía A apesar do estorno. Outros cenários com direito independente
já passavam. Não foi feito estorno real para reproduzir isso.

Depois, a mesma conferência financeira por cobrança inicial é exigida para
cada pedido. A regra foi centralizada em
`lib/contratacao/direito-por-pedido.ts:9`:

- Status diferente de `payment_approved` não autoriza.
- Pix direto já aprovado manualmente mantém seu caminho existente.
- Asaas Pix/cartão exige projeção `payment_approved` da cobrança inicial do
  pedido. Estorno, parcial/em processamento, contestação, falha, ausência de
  cobrança, consulta parcial ou indisponível não autorizam por esse pedido.
- Erro de uma compra não invalida outra compra válida independente.
- Acesso legado, operador e liberação histórica aceita/não revogada continuam
  fontes independentes. Aprovação estornada não se transforma em direito por
  nome, e-mail ou documento.

Não há nova política global de cancelamento/inadimplência. Foram reutilizados
os estados conservadores da projeção do N26-P1. Outros ciclos de recorrência
não são confundidos com a cobrança inicial; situação contratual mensal e
direitos futuros permanecem decisão separada.

## 2. Diff deste recorte

| Arquivo | Mudança local |
|---|---|
| `lib/contratacao/direito-por-pedido.ts` | Novo predicado e filtro compartilhados por pedido; exceção/falha nega só essa fonte. |
| `lib/contratacao/acesso.ts:31` | Seleciona ID/status/método/cobrança, filtra direito financeiro antes de conferir propriedade. Consulta administrativa do ledger só para candidatos Asaas lidos sob sessão/RLS. |
| `lib/contratacao/vincular-core.ts:30` | Candidatos já restritos ao comprador são filtrados financeiramente antes de escrever `profile_id` ou `buyer_profile_id`. Propriedade continua relida. |
| `lib/multiconta/ativo.ts:57` | Consulta todos os campos usados; calcula `direitoFinanceiro` por pedido sem remover pedidos pendentes/negados da lista de avaliação de legado. |
| `lib/multiconta/elegibilidade.ts:47` | Aprovação por compra exige o marcador financeiro calculado no servidor. Cookie ou propriedade isolada não substituem isso. |
| `lib/contratacao/cadastro-por-compra.ts:22` | Primeiro cadastro passa a reutilizar o mesmo predicado; mantém retorno de verificação incompleta do N26-P1. |
| `scripts/conferir-acesso-pos-estorno.mjs` | Novo teste comportamental das três portas reais, com banco e Auth fictícios, sem rede. |
| `scripts/conferir-acesso.mjs`, `conferir-multiconta.mjs`, `conferir-multiconta-sessao.mjs`, `conferir-documento-contratante.mjs` | Fixtures antigas agora declaram Pix manual/status/método ou confirmação financeira sintética conforme o teste; loader offline permite os novos módulos reais. Não permite rede. |
| `package.json` | Comando `conferir:acesso-pos-estorno`. |

O Git de referência continua contendo alterações locais de N26-05/P1 e outras
frentes. `git diff --stat` contra HEAD não é patch incremental isolado deste
bloco e não inclui arquivos novos não rastreados. A tabela acima descreve o
delta específico; não houve reset/reversão/commit para fabricar isolamento.
Arquivos de anúncios, gestor/criativos, Meta, onboarding e respectivos
checkpoints de outras frentes foram preservados. Índice compartilhado não editado.

## 3. Testes finais locais

| Comando | Resultado |
|---|---|
| `pnpm conferir:acesso-pos-estorno` | **8/8** |
| `pnpm conferir:primeiro-acesso-compra` | **6/6** |
| `pnpm conferir:acesso` | **6/6** |
| `pnpm conferir:multiconta` | **28/28** |
| `pnpm conferir:documento-contratante` | **15/15** |
| `pnpm conferir:acesso-contratado` | **19/19**, incluindo SQL descartável local |
| `pnpm typecheck --pretty false` | Passou |
| `git diff --check` | Sem erro; avisos de normalização LF/CRLF |

**82/82 testes** nos comandos acima, contabilizados uma vez por suíte.
Não são 82 provas remotas nem repetição financeira de compras reais.

O novo teste demonstra:

1. A já aceita/vinculada perde autorização por compra após estorno; vínculo
   persistido não é apagado e a rotina não o reaplica por esse pedido.
2. A estornada + B válida mantém direito ao WebApp via B; lista somente B.
   Cookie A passa a ser inválido, sem seleção automática silenciosa de B.
3. Pendente, estorno parcial, falha e leitura parcial de 100 ocorrências negam.
4. Novo vínculo só atribui B válido; A permanece sem dono/vínculo proposto.
5. Outra compra válida do mesmo negócio preserva o direito; estorno de outro
   ciclo não é atribuído à cobrança inicial.
6. Liberação histórica aceita independente continua válida.
7. Falha financeira isolada em A não derruba B conferido.
8. Sessão/vínculo existentes são reavaliados depois que o evento de estorno
   entra na fixture; não é necessário apagar pedido, conta ou propriedade.

Algumas regressões antigas falharam inicialmente porque forneciam só
`business_id` ou status histórico, sem método/cobrança/resultado financeiro.
Foram completadas as fixtures pertinentes, mantendo os novos testes de Asaas
realmente negativos. Não se fez fallback que autorizasse coluna ausente.

## 4. Limites e segurança da conclusão

- Asas financeiro é lido pelo cliente administrativo somente no servidor;
  `commercial_payment_events` não foi exposto ao cliente nem teve RLS/ACL alterada.
  As consultas continuam por pedido E cobrança inicial, sem chamadas ao Asaas.
- `temAcessoWebApp` devolve elegibilidade, não executa logout. Sessão Auth e
  propriedade já persistida continuam intactas. Outros direitos são preservados.
- O vínculo mantém a rotina existente por compra/e-mail confirmado e IDs
  elegíveis; este bloco não adiciona associação por nome/documento nem funde
  negócios. Não corrige o trigger Auth antigo de reivindicação de órfãos.
- As verificações são leituras por requisição, não transação atômica com o
  evento financeiro e a atribuição. Evento concorrente pode chegar entre a
  conferência e a escrita; requisições seguintes reavaliam a elegibilidade.
  Concorrência real e garantias no banco exigem recorte próprio, não testado aqui.
- Não houve revogação de propriedade, tokens ou políticas RLS. Acessos diretos
  ao banco/Storage fora das portas do WebApp não foram certificados como
  revogados. Não chamar este bloco de revogação universal de dados.
- A leitura financeira administrativa passou a ser necessária para compra
  Asaas nas portas existentes. Credencial ausente/indisponibilidade falha fechada;
  latência e carga reais de proxy/layout/resolvedor não foram medidas.
- Em falha financeira, o pedido não concede acesso. Os retornos gerais de
  acesso pendente/negócio não liberado continuam os existentes; este bloco não
  redesenhou o aviso de indisponibilidade por negócio.
- Nenhum build/restart da `.next` compartilhada; compilação de produção e
  inspeção no navegador continuam pendentes da publicação coordenada.

## 5. Local / QA / produção

- **Local:** código e testes acima concluídos.
- **QA:** não consultado nem atualizado neste bloco; versões/provas de 04/11
  no N26-P1 são históricas. Ensaio autenticado pós-publicação ainda pendente.
- **Produção:** não consultada/alterada/homologada. LP/checkout público continuam
  portões separados. Etapa 02 continua procedimento manual jurídico/fiscal.

O bloco termina aqui. Próximo dono: 01/02/Central para revisão do pacote e
definição da prova QA; Victor autoriza a publicação e qualquer dado/ato externo
necessário quando o roteiro concreto estiver apresentado.
