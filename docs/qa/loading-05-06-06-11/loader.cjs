const ts = require('typescript');
module.exports = function (source) {
  if (this.resourcePath.endsWith('.css')) {
    const globais=[];
    let css=source.replace(/:global\(([^)]+)\)/g,(_,seletor)=>{globais.push(seletor);return `__GLOBAL_${globais.length-1}__`;});
    const classes = [...new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]))];
    const prefix='qa_'+require('node:path').basename(this.resourcePath).replace(/\W/g,'_')+'_';
    css=css.replace(/\.([a-zA-Z][\w-]*)/g,(_,nome)=>'.'+prefix+nome).replace(/__GLOBAL_(\d+)__/g,(_,i)=>globais[Number(i)]);
    return `const css=${JSON.stringify(css)}; const el=document.createElement('style');el.textContent=css;document.head.append(el);module.exports=${JSON.stringify(Object.fromEntries(classes.map(c => [c,prefix+c])))};`;
  }
  return ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
};
