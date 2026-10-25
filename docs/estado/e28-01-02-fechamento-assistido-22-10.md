# E28 01 e 02 Conferência da contratação assistida

22/10/2026, fechamento local após 17h15 de Brasília. Frente 01/02.
Um bloco concluído. Sem publicação, migration externa, e-mail, cobrança,
estorno, replay remoto, convite, dado real ou concessão de acesso.

## Funciona hoje

O fluxo existente de `/pedidos` registra Pix, referência do comprovante e
aprovação manual separada. Aprovar o Pix pelo fluxo antigo abre o primeiro
acesso; não é a operação usada para importar clientes históricos neste bloco.
Fonte: `app/(protected)/pedidos/actions.ts:86`, `:116` e
`supabase/migrations/0029_pix_assistido.sql`.

Acrescentada LOCALMENTE uma seção recolhível em Pedidos, **Conferir contratação
de cliente atual** (`app/(protected)/pedidos/page.tsx:101`). Ela abre somente um
negócio já existente, com atribuição do operador em `manager_accounts`. Não cria
negócio/conta/carteira nem força outra compra para clientes antigos.

O registro guarda negócio, pedido existente opcional, perfil proposto opcional,
e-mail/CNPJ declarados, origem Pix/contratação histórica, referência localizável,
data da fonte e autor/data do registro. Nas decisões, guarda responsável, data e
motivo. Estados: **pendente**, **conferida pela equipe** e **recusada**. Conferida
é uma decisão documental, não aprovação Asaas, assinatura jurídica, NF ou direito
de uso aplicado.

Sem conta do cliente, o perfil fica vazio e o e-mail continua uma indicação.
Havendo perfil, a action consulta seu ID no Auth, exige e-mail confirmado e
coincidência exata. Pedido, pessoa e negócio divergentes são negados; não há
associação por semelhança. Um negócio já pertencente a outra pessoa não é
transferido. Fontes: `lib/contratacao/evidencia-manual-servidor.ts:5`, `:13`;
`app/(protected)/pedidos/evidencias-actions.ts:9`, `:19`, `:37`.

A RPC volta a conferir carteira, negócio e pedido, com locks. A referência tem
unicidade por origem, insensível a caixa; repetição idêntica reutiliza o registro,
enquanto mudança de identidade ou negócio é recusada. Decisão terminal não é
sobrescrita por outro estado. Uma mesma transferência consolidada para vários
negócios exige reconciliação/alocação explícita futura, não várias provas ativas
da mesma referência. Não alterar o identificador para contornar a deduplicação.

Pedido cancelado ou ocorrência financeira adversa na MESMA cobrança inicial
impede nova conferência positiva. Se o evento chegar depois, a projeção deixa
de mostrar a evidência como ativa. Renovação de outra cobrança não se mistura
à prova inicial. Nenhum desses estados revoga direitos de outros negócios.
Fontes: `supabase/migrations/20261022200400_manual_contract_evidence.sql:78`;
`lib/contratacao/evidencia-manual.ts:35`.

## Falta para o cliente

1. **Aplicação/publicação QA desta fatia**, com backup, atribuição já aprovada e
   conferência autenticada desktop/celular. Depende da revisão do pacote abaixo.
2. **Identificar UM piloto real**: negócio, pessoa/e-mail, CNPJ, fonte da contratação
   e responsável. Sem perfil/negócio existente, a criação apropriada tem portão
   próprio; não é resolvida inventando pedido ou pagamento.
3. **Decidir e implementar a concessão por negócio** depois da conferência. A
   evidência está preparada, mas não foi ligada a `temAcessoWebApp`, vínculo de
   compra, `webapp_legacy_access` ou propriedade. Direitos anteriores não mudam.
4. **Pendências de QA financeiro/LP anteriores**: publicar o pacote de estados,
   reconciliar o estorno e provar alerta/WhatsApp e acesso no negócio correto.
   Sem repetir cobranças já comprovadas. Logs de refund não relidos neste bloco:
   nenhuma sessão Sandbox disponível foi demonstrada; não tentei novo login.
5. **Etapa 02 manual**: instrumento/assinatura e situação fiscal com os respectivos
   responsáveis. Registro documental não inventa contrato assinado nem nota.

As pendências 2 e 3 são distintas: identificar a pessoa não autoriza conceder
acesso. O cliente histórico não deve pagar outra vez para satisfazer a importação.

## Próximo ato e responsável

Victor/Central revisa o pacote e escolhe o alvo/commit QA; 01/02 aplica somente
quando houver autorização específica. Victor identifica o piloto com 03/04.
Responsável da carteira registra e confere a fonte apenas no negócio atribuído.
Política/concessão de acesso permanece decisão humana, seguida de bloco próprio.

**Ação mínima de Victor:** indicar um primeiro cliente-piloto e a fonte verificável
da contratação; depois autorizar o pacote QA exato apresentado pelo Central. Não
enviar senha, código, token ou cartão. A lista dos dez não é exigida agora.

## Manifesto de publicação QA não executado

Árvore compartilhada com trabalho não commitado. O commit de entrega ainda deve
ser fixado por Victor; hashes SQL abaixo identificam o conteúdo revisável, não
uma versão aplicada. Projeto QA `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`, Supabase QA
`zskpijnqgkqwxksqmzmf`, endereço `https://v2g-webapp-qa.vercel.app`.
Nenhum alvo de produção autorizado neste bloco.

| Pacote | Arquivos e dependências | Ordem e aceite |
|---|---|---|
| Conferência histórica nova | `app/(protected)/pedidos/{page.tsx,ConferenciasManuais.tsx,EvidenciaForm.tsx,evidencias-actions.ts,evidencia.module.css}`; `lib/contratacao/evidencia-manual{,-servidor}.ts`; manifesto `supabase/objetos.ts`; suites `scripts/conferir-evidencia-manual{,-sql}.mjs` | Migration individual antes de usar a seção. Carteira e negócio exatos, papel autorizado, identidade e fonte conferidos. Zero concessão de acesso. |
| SQL documental novo | `20261022200400_manual_contract_evidence.sql`, SHA256 `B66218D8F34CB6795C99C90937B5DA61B517E061969D163EF77A44376550E4DA` | Depende de `commercial_orders`, `commercial_payment_events`, `manager_accounts`, `businesses` e `profiles` existentes. **Não depende da nova migration financeira, ponte assistida Asaas ou ativação 3DS.** |
| Estados financeiros já preparados | `lib/contratacao/{evento-financeiro,estado-pagamento-publico,assinatura-apos-3ds}.ts`; `app/api/webhooks/asaas-payment/route.ts`; quatro suites e nova SQL descritas no checkpoint anterior | Pacote separado. Não precisa reabrir checkout público para registrar contratação histórica. Flags e configuração externa não serão habilitadas por dedução. |
| SQL financeiro anterior | `20261022152629_asaas_estados_processamento.sql`, SHA256 `F2E6A009626F68CAE310546B4510EC789C30FFEC8F1B5C527A3BD5AFCF6B7F15` | Exige confirmar dependências anteriores, inclusive RPCs comerciais de `20261021042254_assisted_asaas_orders.sql`. Se alguma faltar, parar e apresentar unidade própria; não aplicar cadeia ampla. Precondições divergentes abortam a transação. |

Sequência do próximo bloco autorizado:

1. Fixar commit/arquivos e conferir alvo QA; consultar ledger e definições/grants,
   sem inferir aplicação pelo arquivo local. Não executar `db push` geral.
2. Fazer backup/snapshot protegido das tabelas comerciais/carteira envolvidas,
   constraints, funções e ACL. Guardar caminho/horário/hash, nunca chaves no relatório.
3. Aplicar cada SQL aprovado individualmente, em transação, com parada e conferência
   do ledger/objetos entre unidades. São autorizações distintas da unidade 1 do backend.
4. Conferir RLS sem policies públicas, zero acesso anon/authenticated, EXECUTE só
   service_role e privilégios de coluna: fonte/identidade imutáveis; apenas revisão
   atualizável. Publicar o código aprovado somente no projeto QA e verificar commit.
5. Com usuários/fixtures especificamente autorizados, provar carteira, negócio,
   pessoa, replay e estorno; conferir foco, feedback e responsividade na UI.
   Não publicar nem certificar produção a partir deste teste.

**Recuperação:** falha na migration transacional deve deixar zero aplicação
parcial; conferir antes de tentar novamente. Se já aplicada e houver defeito de
runtime, voltar ao commit QA previamente registrado/retirar a entrada da seção
por publicação autorizada, preservando tabela e evidências. Não apagar registros,
forjar ledger, retirar estorno ou reverter concessões globais. Mudanças externas
de recuperação também exigem autorização. Falha da nova seção apresenta
indisponibilidade, nunca lista vazia falsamente certificada.

## Prova e ambiente

- `node scripts/conferir-evidencia-manual.mjs`: **10/10**. Actions reais com portas
  isoladas: papel, carteira, ator da sessão, perfil confirmado, e-mail divergente,
  pedido de outro negócio, falha de RPC, releitura na revisão, estorno tardio e
  renderização estática dos formulários/labels/feedback.
- `scripts/conferir-evidencia-manual-sql.mjs`: **PASS** em PGlite descartável com
  migrations reais. Registro/revisão, identidade, negócio correto, duplicação por
  ID e referência, caixa diferente, transferência da referência a outro negócio
  negada, estados terminais, estorno, preservação dos pedidos e negócios prévios,
  RLS/ACL e execução efetiva sob service_role. Origem não pode ser atualizada e
  service_role não recebeu DELETE. Sem a nova migration financeira na cadeia.
- `pnpm typecheck`: PASS após a fatia e ajuste de independência SQL.
- Detector Impeccable nos três novos alvos de UI: `[]`. Revisão independente
  terminou `ship` **somente no escopo de código local**, sem achado obrigatório.
  Não é certificação visual: faltam screenshots e navegação autenticada.
- `git diff --check`: PASS; avisos LF/CRLF existentes, sem erro de whitespace.
- Banco PGlite carregado da instalação local existente em
  `C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js` via
  `V2G_PGLITE_MODULE`. Sem `.env`, Supabase remoto, Asaas, instalação ou custo.

Não repeti as 52 provas e 25 cenários financeiros anteriores: não houve alteração
nesses arquivos neste bloco. Suíte global/build/dev compartilhado não executados.

## Fontes e reconciliação

- `docs/decisoes.md`, entrada de 22/10, e novo cabeçalho v6 de
  `docs/execucao-evento-28-10.md` relidos. Atualizam compra única de 21/10 para venda
  assistida imediata, sem abandonar o checkout futuro. Espelho passou a v6 durante
  o bloco e foi relido depois da atualização, sem edição desta frente.
- Planilha original, metadata + `Resumo 01-08!A1:I8` e
  `Plano diário 20-31!A1:P11` relidos por conector durante o bloco. Naquele snapshot
  ainda mostravam v5/noturno e IA somente desenho; não prevalecem sobre a decisão
  humana de 22/10 nem certificam o estado atual de outras frentes. Central edita.
- FigJam `sQrIlGhDDaqHUtV2WacWSg`: **NÃO RELIDO**, quota Starter anterior conhecida;
  não houve nova tentativa nem edição. Usado checkpoint conhecido do plano v6,
  sem alegar sincronização do quadro.
- Checkpoint anterior `e28-01-02-asaas-estados-22-10.md` preservado como histórico.
  Seu rascunho não deve ser enviado: Central já respondeu, informou o chamado
  **1895741**, contrato não obrigatório para prosseguir, habilitação necessária
  para reutilizar token em assinatura de produção e 3DS inicial sem extensão às
  mensalidades. Informação desta passagem/Central, não nova leitura do e-mail.
  Não pedi novamente documentos nem enviei outro rascunho.
- A skill de interface orientou a extensão recolhível, campos/feedback acessíveis
  e preservação do visual existente. As skills Supabase orientaram RLS, RPC
  privada security invoker e privilégio mínimo; documentação oficial e changelog
  consultados, sem mudança de versão/configuração.

Alterações alheias em decisões/plano, playbooks, criativos/geração e respectivas
provas foram preservadas. Não toquei onboarding, métricas, dados reais, Figma,
planilha, páginas legais, configurações ou credenciais. Central faz a passagem;
nenhuma mensagem enviada a outro chat. Bloco encerrado; aguarda revisão e portões.
