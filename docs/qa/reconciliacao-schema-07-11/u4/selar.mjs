import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('.',import.meta.url),sha=n=>createHash('sha256').update(readFileSync(new URL(n,base))).digest('hex');
const files=readdirSync(base,{withFileTypes:true}).filter(x=>x.isFile()&&x.name!=='SHA256SUMS.txt').map(x=>x.name).sort();
writeFileSync(new URL('SHA256SUMS.txt',base),files.map(n=>sha(n)+'  '+n).join('\n')+'\n');
console.log(JSON.stringify({sealed:files.length,apply:sha('u4-aplicar.sql'),return:sha('u4-retornar.sql'),manifest:sha('SHA256SUMS.txt')}));
