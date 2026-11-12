import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const digest=url=>createHash('sha256').update(readFileSync(url)).digest('hex');
const current={package:Object.fromEntries(readdirSync(new URL('.',import.meta.url)).filter(name=>name!=='SHA256SUMS.json').sort().map(name=>[name,digest(new URL(name,import.meta.url))])),sources:{}};
const sources=JSON.parse(readFileSync(new URL('fontes.json',import.meta.url),'utf8')).sourceMigrations;
for(const name of sources)current.sources[name]=digest(new URL('../../../supabase/migrations/'+name,import.meta.url));
if(process.argv.includes('--verificar')){
 const recorded=JSON.parse(readFileSync(new URL('SHA256SUMS.json',import.meta.url),'utf8'));
 assert.deepEqual(current,recorded,'Arquivos/fontes divergiram do pacote selado');
 console.log(JSON.stringify({integrity:'pass',files:Object.keys(current.package).length,sources:sources.length,notApplied:true}));
}else{
 writeFileSync(new URL('SHA256SUMS.json',import.meta.url),JSON.stringify(current,null,2)+'\n');
 console.log(JSON.stringify({sealed:true,files:Object.keys(current.package).length,sources:sources.length,notApplied:true}));
}
