/** Inventario executavel LOCAL, somente leitura. Nao aplica SQL nem publica.
 * node scripts/manifesto-qa-01-02.mjs
 * Estado externo abaixo e snapshot de 23/10, NAO consulta live. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');
// A versao remota pode ter nome/timestamp diferente: nunca aplicar de novo so
// porque o timestamp do arquivo local nao consta no ledger.
const migrations=[
  ['0026_contratacao_multiconta.sql','20261008225606',[], 'existente_QA_nome_qa_0026_contratacao_multiconta'],
  ['0029_pix_assistido.sql','20261008225618',['0026_contratacao_multiconta.sql'],'existente_QA_nome_qa_0029_pix_assistido'],
  ['0034_checkout_self_service.sql','20261008225620',['0029_pix_assistido.sql'],'existente_QA'],
  ['20261008223000_checkout_transparente_sandbox.sql','20261009010911',['0034_checkout_self_service.sql'],'existente_QA'],
  ['20261009015000_checkout_cartao_retentativa_qa.sql','20261009013753',['20261008223000_checkout_transparente_sandbox.sql'],'existente_QA'],
  ['20261009042000_gestor_responsaveis_tarefas.sql','20261009041246',[],'existente_QA_nome_qa_gestor_responsaveis_tarefas; conferir_grants'],
  ['20261011140000_eventos_financeiros_sandbox.sql','20261011141908',['20261008223000_checkout_transparente_sandbox.sql'],'existente_QA'],
  ['20261013031434_qa_registrar_falha_desafio_3ds.sql','20261013031434',['20261011140000_eventos_financeiros_sandbox.sql'],'existente_QA'],
  ['20261018130000_ligar_lead_lp_pedido.sql','20261020010727',['0029_pix_assistido.sql'],'existente_QA; prerequisitos_leads_20261020010719_e_20261020010724'],
  ['20261018133000_checkout_security_controls.sql','20261020010734',[],'existente_QA'],
  ['20261020021942_qa_cartao_mensal_3ds.sql','20261020023349',['20261013031434_qa_registrar_falha_desafio_3ds.sql'],'existente_QA'],
  ['20261021033313_commercial_payment_email_outbox.sql','20261021134245',[],'existente_QA'],
  ['20261021042254_assisted_asaas_orders.sql','20261021203643',['20261020021942_qa_cartao_mensal_3ds.sql','20261018130000_ligar_lead_lp_pedido.sql'],'existente_QA; variante_server_authorization; conferir_definicoes'],
  ['20261022152629_asaas_estados_processamento.sql',null,['20261021042254_assisted_asaas_orders.sql'],'NAO_APLICADA; autorizacao_individual_apos_backup'],
  ['20261022200400_manual_contract_evidence.sql',null,['20261009042000_gestor_responsaveis_tarefas.sql','20261011140000_eventos_financeiros_sandbox.sql'],'NAO_APLICADA; independente_da_nova_migration_financeira'],
].map(([file,qaVersion,dependencies,state])=>({file,sha256:sha('supabase/migrations/'+file),observedQaVersion:qaVersion,dependencies,state}));
const files=[
  'app/api/webhooks/asaas-payment/route.ts','lib/contratacao/confirmacao-canonica.ts',
  'lib/contratacao/evento-financeiro.ts','lib/contratacao/estado-pagamento-publico.ts','lib/contratacao/assinatura-apos-3ds.ts',
  'app/(protected)/pedidos/page.tsx','app/(protected)/pedidos/ConferenciasManuais.tsx','app/(protected)/pedidos/EvidenciaForm.tsx',
  'app/(protected)/pedidos/evidencias-actions.ts','app/(protected)/pedidos/evidencia.module.css',
  'lib/contratacao/evidencia-manual.ts','lib/contratacao/evidencia-manual-servidor.ts','supabase/objetos.ts',
  'app/(public)/redefinir/Form.tsx','app/(public)/redefinir/actions.ts','app/(public)/redefinir/concluido/page.tsx',
  'components/ui/IconeVisibilidadeSenha.tsx','components/seguranca/Turnstile.tsx','app/(public)/entrar/page.tsx',
  'scripts/conferir-422-versao-publicada.mjs','scripts/sql/qa-01-02-preflight.sql',
];
console.log(JSON.stringify({schema:'e28-01-02-qa-v1',externalSnapshotDate:'2026-10-23',
  qa:{project:'prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn',database:'zskpijnqgkqwxksqmzmf',url:'https://v2g-webapp-qa.vercel.app',
    observedDeployment:'dpl_6QmuUHG8SZ2kDGyvoeTCEiC4crZS',observedCommit:'fbf00ee3af7fb3cc8c06931138011a49bcd85236'},
  localHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),
  releaseCommit:'A_FIXAR_POR_VICTOR; HEAD e hashes nao incluem automaticamente arquivos nao commitados',
  migrations,files:files.map(file=>({file,sha256:sha(file)})),
  gates:['preflight SELECT no QA exato + comparar ledger/definicoes',
    'backup protegido de dados comerciais, funcoes, constraints e ACL com hash/horario',
    'autorizacao de CADA unidade; aplicar pendentes em transacao sem db push geral',
    'verificar objetos/ACL/ledger; publicar commit revisado somente no QA',
    'prova autenticada com manifesto de fixtures e limpeza autorizados; sem nova cobranca por deducao',
    'replay remoto/retomada de fila somente depois de log causal, versao e autorizacao propria'],
  recovery:'Falha SQL: rollback transacional e conferir zero parcial. Apos aplicar: preservar evidencias; rollback de codigo QA revisado com autorizacao, sem apagar tabela/ledger ou desfazer direitos globalmente.'},null,2));
