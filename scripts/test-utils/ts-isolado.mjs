/** Carrega modulos reais com fronteiras explicitas; nao herda .env nem permite fetch real. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,isAbsolute} from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
export function ambienteTs({env={},ports={},fetch=()=>{throw Error('rede nao autorizada no ensaio');}}={}) {
  const cache=new Map(),root=resolve('.');
  const locate=(name,parent=root)=>{
    let path=name.startsWith('@/') ? resolve(root,name.slice(2)) : isAbsolute(name) ? name : resolve(parent,name);
    if(!existsSync(path)) path+=existsSync(path+'.ts')?'.ts':'.tsx';
    return path;
  };
  function load(name,parent=root) {
    if(Object.hasOwn(ports,name)) return ports[name];
    if(name==='server-only') return {};
    if(name.startsWith('node:')) return require(name);
    if(!name.startsWith('.')&&!name.startsWith('@/')&&!isAbsolute(name)) {
      if(name.startsWith('next/')) throw Error('porta Next ausente: '+name);
      return require(name);
    }
    const file=locate(name,parent);
    if(Object.hasOwn(ports,file)) return ports[file];
    if(cache.has(file)) return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,
      target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    vm.runInNewContext(js,{module,exports:module.exports,require:specifier=>load(specifier,dirname(file)),
      process:{env},fetch,Buffer,Headers,Response,FormData,URL,AbortSignal,Intl,Date,console},{filename:file});
    return module.exports;
  }
  return {load:file=>load(resolve(file))};
}
