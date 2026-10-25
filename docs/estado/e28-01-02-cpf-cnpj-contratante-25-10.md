# E28 01/02 — CPF ou CNPJ do contratante V0, 25/10/2026

## 0. Estado e próximo portão

**Implementação local concluída; migration NÃO aplicada.** A decisão humana de
25/10, transmitida pelo Central com autorização para este bloco, substitui a
qualificação histórica exclusiva por CNPJ. Nenhuma publicação, escrita remota,
operação financeira, conta real, e-mail, contrato, nota ou Meta neste bloco.

Próximo portão: revisão humana do pacote e do backup/preflight do QA, autorização
individual da migration e publicação coordenada do código. Antes disso, conferir
as dependências da cadeia comercial, agenda e evidência manual. O app aceita CPF
localmente; o banco remoto antigo ainda pode recusá-lo. Não publicar como pronto
nem ativar CPF em produção por inferência destes testes.

A pendência de controle de acesso após estorno permanece independente; este
bloco não concede/revoga direitos nem altera o critério financeiro de acesso.
O checkpoint `e28-01-02-retomada-asaas-23-10.md`, já modificado no início deste
bloco, foi preservado e não foi reescrito.

## 1. Mapeamento e contradições resolvidas

| Ponto anterior | Ajuste local |
|---|---|
| `qualificacao.ts`, `pedido-assistido.ts`, signup e evidência validavam só CNPJ | Validador compartilhado de CPF/CNPJ; normalização de máscara apenas para comparação/armazenamento, sem retirar letras silenciosamente |
| Primeiro acesso tinha pattern e limite exclusivo de 14 dígitos | Campo CPF/CNPJ com máscara opcional, limite de 18 caracteres; validação no servidor permanece obrigatória |
| Compra/expectativas/operador declaravam CNPJ obrigatório | Texto passa a CPF ou CNPJ do contratante; nome ou razão social; WhatsApp continua condição vigente |
| Menu, seletor e onboarding rotulavam tudo como CNPJ | Identificação compartilhada com tipo e formatação; Conta passou a selecionar o documento explicitamente |
| Agenda conferia exatamente 14 dígitos e índice único global de CNPJ | CPF/CNPJ com checksum, mesma identidade e pedido; unicidade por negócio, horário e evento Google preservada |
| RPCs Pix, self-service e Pix com lead reutilizavam business_id por e-mail/CNPJ | Nova referência cria outro negócio; reenvio da mesma referência ou lead explícito continua idempotente |
| Índices de pedido aberto agrupavam e-mail/CNPJ | Retirados na proposta SQL; índice de busca não único; referências de pedido e lead continuam únicas |
| Evidência manual e três tabelas exigiam formato de 14 dígitos | Proposta aceita 11/14 e acrescenta tipo explícito, preservando todos os nomes técnicos e dados |

O titular do cartão já tinha CPF/CNPJ próprio. O algoritmo foi unificado, mas o
campo `holderDocument` continua separado: customer.cpfCnpj vem do contratante;
creditCardHolderInfo.cpfCnpj vem do titular. O teste percorre a função real de
início de pagamento com documentos distintos, usando somente portas em memória.

## 2. Modelo e limites da identidade

- `lerDocumentoContratante` retorna `{ numero, tipo: cpf|cnpj }` apenas após
  verificar tamanho e dígitos verificadores; rejeita repetição e caracteres
  estranhos. Não consulta Receita, cadastro, propriedade ou situação fiscal.
- Os campos técnicos `cnpj`, `claimed_cnpj`, `p_cnpj`, `declares_cnpj` e props
  históricas são mantidos por compatibilidade. Representam documento do
  contratante, não documento exclusivo de pessoa jurídica. Novas compras e
  pedidos assistidos também carregam tipo explícito no resultado da validação.
- `contractor_document_type` é gerado e armazenado nas três tabelas comerciais:
  tipo acompanha o número sem um segundo campo editável que possa divergir.
  A apresentação pode mostrar um documento legado sem alegar sua validade.
- O documento igual não funde negócios nem pedidos. Pertencimento continua
  ligado a business_id/pedido/perfil e e-mail verificado de uma compra aprovada;
  não há busca global nem união por nome, telefone ou documento. A vinculação
  preexistente de compras aprovadas ao mesmo perfil não foi ampliada.
- Agenda com dois candidatos do mesmo e-mail/documento continua em revisão;
  não escolhe um negócio por aproximação. Registro/revisão de evidência exige
  negócio e pedido exatos e continua sem efeito de liberação.

## 3. Migration revisável

Arquivo: `supabase/migrations/20261025215302_cpf_cnpj_contratante_v0.sql`.
Criado com `supabase migration new`; nenhuma conexão remota para criá-lo.
SHA256: `C686B72BAC8ECE5F33318CEC1E20482595E1377EEC06169EFBA30C2EE75D46F3`.

Transação explícita, com:

1. Validador SQL de CPF/CNPJ e trigger para inserts ou mudanças de documento.
2. Alteração apenas dos checks documentais de commercial_orders,
   onboarding_meetings e commercial_manual_evidence, aceitando 11 ou 14 dígitos.
3. Tipo gerado STORED nas três tabelas; comentários de compatibilidade.
4. Ajustes estreitos nas cinco RPCs existentes por `pg_get_functiondef`, sem
   substituir variantes inteiras ou ampliar ACL. Precondição desconhecida aborta.
5. Retirada dos três índices únicos de contato/documento de pedido aberto e do
   índice global de documento da agenda. Sem exclusão/rename de tabela, coluna,
   pedido ou número. Índice de busca não único; travas de referência, lead,
   negócio/horário e evento Google permanecem.
6. Lock da referência antes da procura do retry em Pix direto e self-service.

Dependências explícitas: cadeia comercial até assisted_asaas_orders, reserva da
agenda e manual_contract_evidence. Não aplicá-las automaticamente. Não altera
leads_lp, Auth, backend, contratos, status financeiro, policies ou acesso real.

**Legado:** CNPJs e IDs anteriores permanecem. O antigo banco validava apenas
formato; linhas históricas com checksum inválido não são apagadas nem corrigidas
automaticamente. Atualização não documental dessas linhas continua possível.
Novos documentos ou mudanças precisam passar pelo checksum. Há teste explícito
dessas duas situações.

**Riscos para revisão:** adicionar coluna gerada/check pode bloquear/reprocessar
tabela; medir volume e janela no preflight. Retirar unicidade por contato permite
pedidos realmente distintos com mesmo documento: não retornar à deduplicação por
contato como solução de duplo clique; usar a referência estável e o lead explícito.
Não aceitar reescrita de RPC cuja definição/constraint tenha divergido.

**Rollback:** em erro durante o lote, ROLLBACK integral; caso exercitado no
Postgres local. Antes de aplicação remota, guardar backup protegido de dados,
funções, constraints, índices e grants. Após aplicação confirmada, preservar
novos CPFs e referências; correção preferencial é aditiva. Restaurar o modelo
CNPJ-only exige primeiro conferir ausência de CPF e de duplicatas de contato
que colidiriam com índices antigos, suspender novas entradas e obter autorização
para restaurar as definições do backup exato. Não fornecer down destrutivo que
apague CPF ou una negócios para permitir rollback. O código antigo também pode
recusar CPF; não fazer rollback de app sem essa conferência.

## 4. Arquivos do bloco

- Validação: `lib/contratacao/documento-contratante.ts`, `qualificacao.ts`,
  `pedido-assistido.ts`, `evidencia-manual.ts`, `dados-cartao.ts`;
  `lib/comercial/oferta.ts`, `lib/auth-errors.ts`.
- Compra/entrada: `app/contratar/{FormularioContratar.tsx,actions.ts,page.tsx}`,
  `app/contratar/retorno/page.tsx`, `app/(public)/entrar/{actions.ts,page.tsx}`.
- Multiconta/apresentação: `app/(public)/escolher-negocio/{Formulario.tsx,page.tsx}`,
  `components/ui/Casco.tsx`, `lib/multiconta/identificacao.ts`,
  `app/(protected)/conta/page.tsx`, `app/(protected)/inicio/InicioAposReserva.tsx`
  (somente texto sobre troca de negócio).
- Operador: `app/(protected)/pedidos/{Formularios.tsx,EvidenciaForm.tsx,
  ConferenciasManuais.tsx,page.tsx,actions.ts}`;
  `app/(protected)/gestor/compras/page.tsx`, `lib/gestor/compras.ts`.
- Onboarding/agenda: `app/(fluxo)/expectativas/passos.tsx`,
  `app/(fluxo)/onboarding/page.tsx`,
  `app/(fluxo)/onboarding/concluido/{Conclusao.tsx,agenda-actions.ts}`;
  `lib/agenda/{conciliacao.ts,descricao-reuniao.ts}`.
- SQL/inventário: migration acima e `supabase/objetos.ts`.
- Testes: `scripts/conferir-documento-contratante{,-sql}.mjs`,
  `scripts/conferir-conciliacao-agenda.mjs`, `scripts/conferir-oferta-outubro.mjs`,
  `scripts/test-utils/ts-isolado.mjs` (apenas URLSearchParams padrão no contexto
  isolado para renderizar a entrada real), dois comandos em `package.json`.
- Registro: `docs/decisoes.md`, este checkpoint e `docs/estado/indice.md`.

## 5. Provas e limites

- Suíte dirigida final de compra/cartão, acesso/multiconta, agenda, evidência,
  operador, oferta, vínculo, 3DS, estorno e órfão histórico: **206/206**. Inclui
  a última versão do teste HTML e do contexto isolado, além da migration final.
- Novas suítes finais: 15 testes de fluxo/apresentação e 10 SQL (incluindo o
  agrupador). Ambas incluídas na rodada final de 206 testes.
- Postgres efêmero PGlite usando instalação existente de v2g-finance, sem
  modificar aquele repositório. Cadeia real de migrations aplicada duas vezes;
  checksum, tipo, CNPJs antigos, RPCs, repetição, separação inclusive de negócio
  anteriormente aprovado, agenda, evidência divergente, RLS/ACL e rollback.
- Actions reais isoladas para compra e primeiro acesso por ambos os documentos;
  início de pagamento real com contratante e titular distintos, sem rede.
- HTML real de entrada, compra e seletor renderizado em teste; não exige só 14
  dígitos e mostra CPF/CNPJ corretamente. Hooks/serviços externos são portas de
  teste. Isso não é interação de navegador, autenticação real ou medição mobile.
- `pnpm typecheck` passou; `git diff --check` sem erros de whitespace. Revisão
  React preservou hooks incondicionais, estado derivado, labels, autocomplete,
  validação no servidor e nenhuma leitura nova de coluna ausente do select.
- Build e servidor dev compartilhado não foram acionados. Não foi rodada suíte
  global que leia `.env` ou acesse banco/Meta. QA autenticado, visual responsivo
  e integração remota continuam pendentes da publicação autorizada.

## 6. Dependências fora deste bloco

**LP:** formulário, qualificação, textos, armazenamento/validação do lead e alerta
precisam acompanhar CPF/CNPJ em lote próprio. A RPC por lead só aceita o mesmo
documento da linha original e o ID explícito; não contorna um pré-cadastro
CNPJ-only nem fabrica lead para permitir CPF. Compra/atendimento direto têm
suporte local; a jornada de lead CPF depende desse trabalho na LP.

**Contrato/jurídico:** revisar identificação de pessoa física/jurídica, nome ou
razão social, representação, assinatura e documento correto do contratante.
Aceitação técnica de CPF não confirma adequação de uma minuta só para PJ, não
altera páginas legais nem emite NFS-e. Fiscal/contabilidade confirma emissão ao
tomador CPF/CNPJ e tratamento aplicável em bloco próprio.

**Backend:** nenhuma alteração; qualquer consumidor fora do WebApp que trate
o campo legado como exclusivamente CNPJ deve ser inventariado antes de uso real.
Não foi certificado suporte remoto desses consumidores.

Referência da escolha de tipo armazenado:
[colunas geradas no PostgreSQL](https://www.postgresql.org/docs/current/ddl-generated-columns.html).
