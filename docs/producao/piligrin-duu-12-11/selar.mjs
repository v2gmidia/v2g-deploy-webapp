/** Sela arquivos locais e confere o diff em reverso; nunca aplica código nem SQL. */
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {dirname,resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const pasta=dirname(fileURLToPath(import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function git(cwd,args){try{return execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:20*1024*1024});}
 catch(e){if(args.includes('--no-index')&&e.status===1)return e.stdout;throw e;}}
function pacote(nome,cwd,base){
 if(git(cwd,['rev-parse','HEAD']).trim()!==base)throw Error('Base divergente: '+nome);
 const modificados=git(cwd,['diff','--name-only','HEAD']).trim().split('\n').filter(Boolean);
 const novos=git(cwd,['ls-files','--others','--exclude-standard']).trim().split('\n').filter(Boolean);
 const arquivos=[...new Set([...modificados,...novos])].sort();
 if(arquivos.some(p=>/^\.env|(?:^|\/)(?:credentials|token).*\.json$/i.test(p)))throw Error('Arquivo privado recusado');
 if(nome==='webapp'&&arquivos.some(p=>/^(app\/(?:\(marketing\)|\(public\))|lib\/(?:contratacao|meta)\/|app\/api\/)/.test(p)))
   throw Error('Mudança fora do pacote de agência');
 let patch=git(cwd,['diff','--binary','--no-ext-diff','HEAD']);
 for(const p of novos)patch+=git(cwd,['diff','--no-index','--binary','--no-ext-diff','--','/dev/null',p]);
 const caminho=join(pasta,nome+'.patch');writeFileSync(caminho,patch);
 git(cwd,['apply','--reverse','--check','--ignore-space-change',caminho]);
 return {base,candidata:cwd,aplicado:false,patch:nome+'.patch',patchSha256:sha(readFileSync(caminho)),
  arquivos:arquivos.map(p=>({arquivo:p,sha256:sha(readFileSync(join(cwd,p)))}))};
}
const webapp=pacote('webapp','C:/Users/victo/v2g-deploy/webapp-piligrin-producao','13f8943471b391bd22e9dd8362f5748653ad9c5b');
const backend=pacote('backend','C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-piligrin-producao','1bfe3b5c03c1a2a3c25b09ca41cb77613fb20543');
const evidencia='C:/Users/victo/.codex/private-backups/v2g/piligrin-promocao-producao-20261112/';
const anterior=JSON.parse(readFileSync(evidencia+'pacote-revisao-1/manifesto.json','utf8'));
if(backend.patchSha256!==anterior.backend.patchSha256
 || backend.arquivos.some(a=>!anterior.backend.arquivos.some(b=>a.arquivo===b.arquivo&&a.sha256===b.sha256)))
 throw Error('Backend mudou fora do escopo de marca/período; preservar e revisar.');
for(const a of anterior.arquivos.filter(a=>a.arquivo.startsWith('banco/')||a.arquivo==='dados-propostos.json'||a.arquivo==='20-cadastro-proposto.sql'))
 if(sha(readFileSync(join(pasta,a.arquivo)))!==a.sha256)throw Error('Banco/dados divergiram nesta revisão: '+a.arquivo);
const qaRoot='C:/Users/victo/v2g-deploy/webapp';
const qaFiles=['app/(protected)/layout.tsx','lib/agencia/da-sessao.ts','lib/agencia/identidade-do-menu.ts',
 'components/agencia/InicioDoCliente.tsx','components/agencia/inicio-cliente.module.css',
 'scripts/conferir-agencia-estrutura.mjs','scripts/conferir-agencia-marca-periodo.mjs'];
const qaNovos=git(qaRoot,['ls-files','--others','--exclude-standard','--',...qaFiles]).trim().split('\n').filter(Boolean);
let qaPatch=git(qaRoot,['diff','--binary','HEAD','--',...qaFiles]);
for(const p of qaNovos)qaPatch+=git(qaRoot,['diff','--no-index','--binary','--','/dev/null',p]);
writeFileSync(join(pasta,'qa-ajustes.patch'),qaPatch);
git(qaRoot,['apply','--reverse','--check','--ignore-space-change',join(pasta,'qa-ajustes.patch')]);
const qa={base:git(qaRoot,['rev-parse','HEAD']).trim(),branch:'QA',publicado:false,patch:'qa-ajustes.patch',
 patchSha256:sha(readFileSync(join(pasta,'qa-ajustes.patch'))),arquivos:qaFiles.map(p=>({arquivo:p,sha256:sha(readFileSync(join(qaRoot,p)))}))};
const antes=JSON.parse(readFileSync(evidencia+'catalogo-producao-antes.json','utf8'))[0].estado;
const depois=JSON.parse(readFileSync(evidencia+'catalogo-producao-depois.json','utf8'))[0].estado;
if(antes.businesses.length!==depois.businesses.length||antes.businesses.some(b=>!depois.businesses.some(d=>d.id===b.id&&d.fingerprint===b.fingerprint))||depois.orders!==0||depois.agency_structure!==false)
 throw Error('Estado produtivo divergente: revisar antes de continuar.');
writeFileSync(join(pasta,'preservacao.json'),JSON.stringify({ambiente:'produção',projeto:'ushccxpoxjikzqnwhgfd',
 negocios:depois.businesses.length,fingerprintsIguais:true,pedidos:depois.orders,estruturaAgenciaAplicada:depois.agency_structure,
 raizAindaVazia:depois.root_empty,backupIntegralCapturado:false,evidenciaPrivada:evidencia,
 reutilizadaDaRevisao:1,novaConsultaProdutivaNestaRevisao:false},null,2));
const contrato=JSON.parse(readFileSync(evidencia+'backend-contrato-candidato.json','utf8'));
const buildPath=process.argv[2];if(!buildPath)throw Error('Informe o diretório do build final.');
const build=JSON.parse(readFileSync(join(buildPath,'build-result.json'),'utf8'));
if(build.code!==0)throw Error('Build final não aprovado.');
const buildMeta=JSON.parse(readFileSync(join(buildPath,'verification-metadata.json'),'utf8'));
for(const [p,hash] of Object.entries(build.fingerprints)){
 if(sha(readFileSync(join(webapp.candidata,p)))!==hash)throw Error('Código divergiu após o build: '+p);
}
const qaBuildPath=process.argv[3];if(!qaBuildPath)throw Error('Informe o build isolado final da QA.');
const qaBuild=JSON.parse(readFileSync(join(qaBuildPath,'build-result.json'),'utf8'));
if(qaBuild.code!==0)throw Error('Build QA não aprovado.');
for(const [p,hash] of Object.entries(qaBuild.fingerprints))
 if(sha(readFileSync(join(qaRoot,p)))!==hash)throw Error('QA mudou após o build: '+p);
const validacao={data:new Date().toISOString(),revisao:2,qa:{testes:107,resultado:'passou',typecheck:'passou',build:'passou',
 buildPath:qaBuildPath,visual:'1536px e 390px, sem overflow; marca, período e troca conferidos em prévia isolada com dados fictícios',publicado:false},
 webapp:{testes:125,resultado:'passou',typecheck:'passou',build:'passou',
 buildPath,envFilesCopied:buildMeta.envFilesCopied,credentialsInherited:buildMeta.credentialsInherited},
 banco:{provas:111,resultado:'passou',reutilizadoDaRevisao:1,sqlInalterado:true,ambiente:'PostgreSQL descartável local',limite:'fixtures focadas; sem aplicação remota'},
 backend:{testesPassaram:2864,ignorados:9,avisos:9,ruffSrcTests:'passou',mypy:'passou; 160 arquivos',contrato,reutilizadoDaRevisao:1,patchInalterado:true},
 producao:{aplicado:false,cobrancasCriadas:0,anunciosPublicados:0,validacaoAutenticadaDoNovoCadastro:false}};
writeFileSync(join(pasta,'validacao.json'),JSON.stringify(validacao,null,2));
writeFileSync(join(pasta,'codigo-origem.json'),JSON.stringify({status:'Revisão local; opt-ins produtivos separados da QA',
 fonteQa:'60b4114404495147d80c2df679b9cac02da7338d',ajustesLocaisQa:qa,webapp,backend},null,2));
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?walk(p):[p];});}
const complemento=join(pasta,'banco/08-privilegios-explicitos.sql');
const deps=JSON.parse(readFileSync(join(pasta,'dependencias.json'),'utf8'));
deps.complementoLocal={proposta:'banco/08-privilegios-explicitos.sql',sha256:sha(readFileSync(complemento)),aplicado:false};
writeFileSync(join(pasta,'dependencias.json'),JSON.stringify(deps,null,2));
const manifesto={pacote:'piligrin-duu-12-11-revisao-2',unidadeBanco:'piligrin-duu-12-11-revisao-1',revisao:2,estado:'Preparado para revisão; não aplicar',geradoEm:new Date().toISOString(),
 qa,webapp,backend,arquivos:walk(pasta).filter(p=>!p.endsWith('manifesto.json')).sort().map(p=>({arquivo:relative(pasta,p).replaceAll('\\','/'),bytes:statSync(p).size,sha256:sha(readFileSync(p))}))};
writeFileSync(join(pasta,'manifesto.json'),JSON.stringify(manifesto,null,2));
console.log(JSON.stringify({webappArquivos:webapp.arquivos.length,backendArquivos:backend.arquivos.length,
 patchesReversosConferidos:true,build:validacao.webapp.build,negociosProdIntactos:depois.businesses.length,
 pacote:'docs/producao/piligrin-duu-12-11',aplicado:false}));
