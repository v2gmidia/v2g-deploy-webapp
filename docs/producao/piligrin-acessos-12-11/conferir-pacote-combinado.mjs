import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
const dir=new URL('./',import.meta.url);
const base=JSON.parse(readFileSync(new URL('../piligrin-duu-12-11/manifesto.json',dir),'utf8'));
const complemento=JSON.parse(readFileSync(new URL('manifesto-complemento.json',dir),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
function verify(root,files){
 return files.map(f=>{const path=resolve(root,f.arquivo);assert(path.startsWith(resolve(root)+'\\'),'path outside candidate');assert(!basename(path).startsWith('.env'),'environment is not source');assert.equal(sha(readFileSync(path)),f.sha256,'source changed: '+f.arquivo);return f;});
}
const sourceMap=new Map(base.webapp.arquivos.map(f=>[f.arquivo,f]));
for(const f of complemento.arquivos)sourceMap.set(f.arquivo,f);
const webFiles=verify(complemento.candidata,[...sourceMap.values()]);
const backFiles=verify(base.backend.candidata,base.backend.arquivos);
const result={estado:'Código conferido nas candidatas; ainda sem commit/publicação',geradoEm:new Date().toISOString(),webapp:{candidata:complemento.candidata,branch:'codex/piligrin-agencia-producao',base:base.webapp.base,arquivos:webFiles,buildIsolado:'passou; Next 16.2.12 Turbopack',buildPath:'C:/Users/victo/AppData/Local/Temp/v2g-post-push-producao-candidata-m7gnQx'},backend:{candidata:base.backend.candidata,branch:'codex/piligrin-leitura-producao',base:base.backend.base,arquivos:backFiles,validacaoAnteriorPreservada:true},qa:{push:'1a11974536d935dc059c04db7ad9b3e07877939c',pushContinhaCodigoAtivo:false,correcaoAnexosLocal:true,buildIsolado:'passou; Next 16.2.12 Turbopack',buildPath:'C:/Users/victo/AppData/Local/Temp/v2g-post-push-qa-MOdjIE'},limites:['Nenhum commit/push/merge/deploy realizado pelo agente','Builds sem arquivos .env e sem credenciais herdadas; raiz de resolução ajustada somente nas cópias temporárias','Aprovação publicada, OAuth e aceite do cliente permanecem pendentes']};
writeFileSync(new URL('pacote-combinado-conferido.json',dir),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({webappFiles:webFiles.length,backendFiles:backFiles.length,hashes:'conferem',qaBuild:'passou',candidateBuild:'passou',published:false}));
