import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const dir=new URL('./',import.meta.url),candidate='C:/Users/victo/v2g-deploy/webapp-piligrin-producao/';
const qa='C:/Users/victo/v2g-deploy/webapp/';
const sha=x=>createHash('sha256').update(x).digest('hex');
const action='app/(fluxo)/conectar/escolher/actions.ts';
const files=[action,'lib/contratacao/conta-acesso-contratado.ts','scripts/conferir-conta-acesso-contratado.mjs'];
const old=readFileSync(qa+action,'utf8'),current=readFileSync(candidate+action,'utf8');
const imports='import { acessosContratadosDoPerfil } from "@/lib/contratacao/acesso-contratado";\nimport { parametrosContaAcessoContratado } from "@/lib/contratacao/conta-acesso-contratado";\n';
const normalized=current.replaceAll('\r\n','\n');
const block=normalized.match(/  \/\/ Contratação histórica já conferida[\s\S]*?(?=  \/\/ O piloto QA)/)?.[0];
assert(block,'exact new action block');
assert.equal(normalized.replace(imports,'').replace(block,''),old.replaceAll('\r\n','\n'),'preserve all prior action content');
for(const file of files){const target=new URL('webapp/'+file,dir);mkdirSync(dirname(target.pathname.replace(/^\/C:/,'C:')),{recursive:true});copyFileSync(candidate+file,target);}
const remove=old.replaceAll('\r\n','\n').trimEnd().split('\n').map(l=>'-'+l).join('\n');
const add=current.replaceAll('\r\n','\n').trimEnd().split('\n').map(l=>'+'+l).join('\n');
let patch='*** Begin Patch\n*** Update File: '+action+'\n@@\n'+remove+'\n'+add+'\n';
for(const file of files.slice(1)){patch+='*** Add File: '+file+'\n'+readFileSync(candidate+file,'utf8').trimEnd().split(/\r?\n/).map(l=>'+'+l).join('\n')+'\n';}
patch+='*** End Patch\n';writeFileSync(new URL('webapp-complemento.patch',dir),patch);
const records=files.map(file=>({arquivo:file,sha256:sha(readFileSync(candidate+file))}));
const seal={estado:'Complemento local testado; sem aplicação/publicação',geradoEm:new Date().toISOString(),basePacote:'../piligrin-duu-12-11/manifesto.json',baseWebApp:'13f8943471b391bd22e9dd8362f5748653ad9c5b',candidata:candidate,antesActionSha256:sha(readFileSync(qa+action)),arquivos:records,sqlSha256:sha(readFileSync(new URL('registrar-conta-acesso-contratado.sql',dir))),funcaoOriginalProducaoSha256:sha(readFileSync(new URL('funcao-original-producao.sql',dir))),patchSha256:sha(patch),validacao:{sqlESeletor:57,acaoReal:6,regressaoAcessoAgencia:33,typecheck:true},limites:['SQL não aplicado','concessão e aceite reais não emitidos','OAuth e seleção produtivos não concluídos','sem permissão Meta nova','sem commit/push/deploy','não substituir o pacote anterior por QA inteira']};
writeFileSync(new URL('manifesto-complemento.json',dir),JSON.stringify(seal,null,2)+'\n');console.log(JSON.stringify({files:records.length,sqlSha256:seal.sqlSha256,patchSha256:seal.patchSha256,published:false}));
