from pathlib import Path
import re

def resolve(path, choices):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    i=iter(choices)
    def pick(m):
        c=next(i)
        return m[1] if c=='ours' else m[2] if c=='theirs' else c(m[1],m[2])
    s=re.sub(r'^<<<<<<< HEAD\n(.*?)^=======\n(.*?)^>>>>>>> origin/main\n',pick,s,flags=re.M|re.S)
    p.write_text(s,encoding='utf-8')

resolve('components/ui/Casco.tsx',[
    lambda a,b:a+b,
    lambda a,b:a+b[b.index('          {contextoAgencia'):],
    lambda a,b:'          </>}\n',
])
resolve('app/(protected)/criativos/GaleriaCriativos.tsx',['ours'])
p=Path('app/(protected)/criativos/GaleriaCriativos.tsx')
s=p.read_text(encoding='utf-8').replace('{item.detalhe ? <p>{item.detalhe}</p> : null}', '{item.detalhe ? <p>{item.detalhe}</p> : null}\n          {item.publicacao && <p>Publicação: {item.publicacao}</p>}')
p.write_text(s,encoding='utf-8')
resolve('app/(protected)/anuncios/page.tsx',['ours','theirs'])
p=Path('app/(protected)/anuncios/page.tsx')
s=p.read_text(encoding='utf-8').replace('import { InventarioCliente }', 'import { InventarioDeAnunciosMeta } from "./AnunciosMeta";\nimport { InventarioCliente }')
s=s.replace('href="/criativos">Ver criativos','href={hrefCriativos}>Ver criativos').replace('href={hrefCriativos}>Abrir criativos','href={hrefCriativos}>Ver criativos')
s=s.replace('href={`/inicio?desde=${intervalo.desde}&ate=${intervalo.ate}`}', 'href={hrefResumo}')
s=re.sub(r'(<InventarioCliente [^\n]+ />)',r'{contexto ? <InventarioDeAnunciosMeta resultado={inventarioMeta} periodo={intervalo} contaSolicitada={contaSolicitada} /> : \1}',s)
s=s.replace('    </div></AtualizacaoDaConsulta>;', '      {resultado?.estado === "sem-execucao" && <HistoricoSemRodadas />}\n    </div></AtualizacaoDaConsulta>;',1)
p.write_text(s,encoding='utf-8')
resolve('app/(protected)/inicio/page.tsx',[
    lambda a,b:b+'  }\n'+a,
    lambda a,b:a+b.replace('      faixa={<FaixaReconectar />}\n',''),
])
p=Path('app/(protected)/inicio/page.tsx')
s=p.read_text(encoding='utf-8')
s='import { consolidadoDoNegocio } from "@/lib/backend";\nimport { resultadosSaoEsperados } from "@/lib/inicio/expectativa-de-resultados";\n'+s
s=s.replace('if (!fixture && esperaResultados && estado.negocioId && user)', 'if (!fixture && !contextoAgencia && esperaResultados && estado.negocioId && user)')
p.write_text(s,encoding='utf-8')
resolve('app/(protected)/criativos/page.tsx',['theirs','theirs'])
p=Path('app/(protected)/criativos/page.tsx')
s=p.read_text(encoding='utf-8').replace('  const busca = await searchParams;', '  const busca = await searchParams;\n  const selecionado = typeof busca.peca === "string" ? busca.peca : "";')
s=s.replace('contextoAgencia: contextoAgencia ?? undefined, retorno:', 'selecionado: contextoAgencia ? undefined : selecionado, incluirAjustes: !contextoAgencia, contextoAgencia: contextoAgencia ?? undefined, retorno:')
s=s.replace('bibliotecaFalhou={Boolean(falhaDaGaleria)}', 'bibliotecaFalhou={Boolean(falhaDaGaleria || falhaPublicacoes)}')
p.write_text(s,encoding='utf-8')
