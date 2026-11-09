import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),root=resolve('.');
const entrada=resolve('app/exemplo/_inicio_meta/Previa.tsx');

function importsDeRuntime(nome,fonte) {
  const ast=ts.createSourceFile(nome,fonte,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),imports=[];
  function visitar(n) {
    if(ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const c=n.importClause;
      const soTipos=c?.isTypeOnly || c && !c.name && c.namedBindings && ts.isNamedImports(c.namedBindings)
        && c.namedBindings.elements.length>0 && c.namedBindings.elements.every(e=>e.isTypeOnly);
      if(!soTipos) imports.push(n.moduleSpecifier.text);
    }
    if(ts.isExportDeclaration(n) && !n.isTypeOnly && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      const soTipos=n.exportClause && ts.isNamedExports(n.exportClause) && n.exportClause.elements.length>0 && n.exportClause.elements.every(e=>e.isTypeOnly);
      if(!soTipos) imports.push(n.moduleSpecifier.text);
    }
    if(ts.isCallExpression(n) && n.arguments.length===1 && ts.isStringLiteral(n.arguments[0])
      && (n.expression.kind===ts.SyntaxKind.ImportKeyword || ts.isIdentifier(n.expression) && n.expression.text==='require')) imports.push(n.arguments[0].text);
    ts.forEachChild(n,visitar);
  }
  visitar(ast);return imports;
}
function conferir(sobrescritas=new Map()) {
  const vistos=new Set();
  function visitar(arquivo,cadeia=[]) {
    if(vistos.has(arquivo)) return;
    vistos.add(arquivo);
    const fonte=sobrescritas.get(arquivo)??readFileSync(arquivo,'utf8');
    for(const nome of importsDeRuntime(arquivo,fonte)) {
      assert.ok(nome!=='server-only' && nome!=='next/headers' && !nome.startsWith('node:'),`Dependência de servidor no cliente: ${[...cadeia,arquivo,nome].join(' → ')}`);
      if(!nome.startsWith('@/')&&!nome.startsWith('.')) continue;
      if(/\.css$/.test(nome)) continue;
      const base=nome.startsWith('@/')?resolve(root,nome.slice(2)):resolve(dirname(arquivo),nome);
      const caminho=[base,base+'.ts',base+'.tsx',base+'.mjs',resolve(base,'index.ts'),resolve(base,'index.tsx')].find(p=>existsSync(p)&&/\.(tsx?|mjs)$/.test(p));
      assert.ok(caminho,'Import local de runtime não resolvido: '+nome);
      visitar(caminho,[...cadeia,arquivo]);
    }
  }
  visitar(entrada);return vistos.size;
}
test('grafo real da prévia cliente não alcança Casco/server-only/next headers',()=>{
  assert.ok(conferir()>3);
});
test('controle negativo recria import Casco e detecta cadeia real até next/headers',()=>{
  const fonte=readFileSync(entrada,'utf8');
  assert.throws(()=>conferir(new Map([[entrada,'import {Casco} from "@/components/ui/Casco";\n'+fonte]])),/Dependência de servidor no cliente/);
});
test('comentários, strings e imports type-only não são dependências de runtime',()=>{
  const fonte=readFileSync(entrada,'utf8');
  const prefixo='// import "next/headers";\nconst texto="next/headers";\nimport type {Casco} from "@/components/ui/Casco";\n';
  assert.equal(conferir(new Map([[entrada,prefixo+fonte]])),conferir());
});
