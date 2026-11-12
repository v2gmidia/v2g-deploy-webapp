/** Somente arquivos locais. Não usa rede, .env, painel, SQL remoto ou Git write. */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const pasta=dirname(fileURLToPath(import.meta.url)),qa=resolve(pasta,'../../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const arquivos=[
 ['docs/qa/agencia-anunciante-piligrin/supabase/migrations/20261110193942_agency_advertisers_qa.sql','01-agencia.sql'],
 ['supabase/migrations/20261009042000_gestor_responsaveis_tarefas.sql','02-mesa-responsaveis.sql'],
 ['supabase/migrations/20261022200400_manual_contract_evidence.sql','03-evidencia-contratual.sql'],
 ['supabase/migrations/20261104040711_historical_contract_access.sql','04-acesso-contratado.sql'],
 ['supabase/migrations/20261009034500_fila_revisao_criativos.sql','05-revisao-criativos.sql'],
 ['supabase/migrations/20261021032617_creative_review_upload_intent.sql','06-intencao-envio.sql'],
 ['supabase/migrations/20261109223232_creative_publication_confirmation.sql','07-publicacao-confirmada.sql'],
];
mkdirSync(join(pasta,'banco'),{recursive:true});mkdirSync(join(pasta,'assets'),{recursive:true});
const dependencias=arquivos.map(([origem,nome])=>{
 const bytes=readFileSync(join(qa,origem));copyFileSync(join(qa,origem),join(pasta,'banco',nome));
 return {origem,proposta:'banco/'+nome,sha256:hash(bytes),aplicado:false};
});
const assets=[
 ['C:/Users/victo/Downloads/631815908_18523853398068030_8008343400869412334_n.jpg','logo-duu.jpg',null],
 ['C:/Users/victo/Downloads/WhatsApp Image 2026-11-09 at 10.23.29.jpeg','arte-duu.jpeg','0c0d48fdc3e3515f730226b6988d8b363ac854423bbb4c6bbb1c53a3ef24901c'],
].map(([origem,nome,esperado])=>{
 const bytes=readFileSync(origem),sha256=hash(bytes);
 if(esperado&&sha256!==esperado)throw Error('Arte local não corresponde à revisão QA: parar.');
 copyFileSync(origem,join(pasta,'assets',nome));
 return {arquivo:'assets/'+nome,sha256,bytes:bytes.length,origem:'Arquivo fornecido por Victor; cópia local intacta',enviadoProducao:false};
});
writeFileSync(join(pasta,'dependencias.json'),JSON.stringify({status:'Revisão local; nada aplicado',dependencias,assets,
 observacoes:['04 exige documento e evidência reais; não contém concessão/aceite pré-preenchidos.',
 '03 é a versão CNPJ de 14 dígitos; não ampliar para CPF silenciosamente.',
 'A revisão do Cauã fica como evidência de origem até existir mapeamento legítimo do ator produtivo.',
 '07 instala somente o mecanismo; não contém confirmação da publicação da arte.',
 'Ordem e hashes não são autorização para executar o lote.']},null,2));
console.log(JSON.stringify({dependencias:dependencias.length,assets:assets.map(a=>({arquivo:a.arquivo,bytes:a.bytes,sha256:a.sha256}))}));
