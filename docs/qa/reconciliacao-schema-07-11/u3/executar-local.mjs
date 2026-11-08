// Captura erros SQL sem despejar o bundle do motor ou queries extensas.
try{await import('./'+(process.argv[2]??'ensaio-u3.mjs'));}
catch(e){console.error(JSON.stringify({ok:false,message:e.message,code:e.code,detail:e.detail,where:e.where,stack:e.code?undefined:e.stack?.split('\n').slice(0,6)}));process.exitCode=1;}
