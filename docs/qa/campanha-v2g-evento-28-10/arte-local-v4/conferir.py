"""Verifica arte local, copy, integridade e preservacao V3. Nao usa rede."""
from pathlib import Path
from hashlib import sha256
import json
from PIL import Image

root = Path(__file__).resolve().parent
repo = root.parents[3]
phrase = 'Gestão de tráfego sem gestor de tráfego.'
source = (root / 'arte.html').read_text(encoding='utf-8-sig')
copy = (root / 'copy.txt').read_text(encoding='utf-8-sig')
assert phrase in source and phrase in copy
assert 'Gestão de anúncios com' in source and 'acompanhamento humano.' in source
assert '#b0e9fd' in source and 'Converse com a V2G' in source
png = root / 'v2g-gestao-sem-gestor-v4.png'
mobile = root / 'leitura-mobile-358.png'
for file, size in ((png, (1080,1080)), (mobile, (358,358))):
    assert file.read_bytes()[:8] == b'\x89PNG\r\n\x1a\n'
    with Image.open(file) as image:
        assert image.format == 'PNG' and image.size == size
v3 = root.parent / 'arte-local-v3/v2g-negocio-anuncios-v3.png'
assert sha256(v3.read_bytes()).hexdigest() == '219fc8cb11324a5850b89fdbe37ebfa9c1b1fce80ed90d0e0ba08768dfff0cd9'

def contrast(a,b):
    def luminance(h):
        rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
        linear=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
        return sum(c*w for c,w in zip(linear,(.2126,.7152,.0722)))
    light,dark=sorted((luminance(a),luminance(b)),reverse=True)
    return round((light+.05)/(dark+.05),2)

ratios={c:contrast(c,'051020') for c in ('ffffff','b0e9fd','e9fe64')}
assert min(ratios.values()) >= 4.5
hashes={name:sha256((root/name).read_bytes()).hexdigest() for name in ('arte.html','archivo-latin.woff2','copy.txt','v2g-gestao-sem-gestor-v4.png','leitura-mobile-358.png')}
manifest={
    'versao':4, 'data':'2026-10-28', 'estado':'candidata_pendente_revisao_victor',
    'origem':'design_local_deterministico', 'gerado_pelo_agente_v2g':False,
    'chamadas_pagas':0, 'publicado':False, 'v3_preservada':True,
    'png':{'arquivo':png.name,'mime_type':'image/png','largura':1080,'altura':1080,'bytes':png.stat().st_size,'sha256':hashes[png.name]},
    'conteudo':{'headline_exata':phrase,'apoio':'Gestão de anúncios com acompanhamento humano.','cta':'Converse com a V2G','texto_anuncio':'copy.txt'},
    'proveniencia':{'fonte':'arte.html','simbolo':'public/marca-editorial.svg','simbolo_sha256':sha256((repo/'public/marca-editorial.svg').read_bytes()).hexdigest(),'fonte_tipografica':'Archivo local, mesma WOFF2 da V3','cores':['#051020','#FFFFFF','#B0E9FD','#E9FE64'],'midia_terceiros':False,'imagem_privada_cliente':False,'downloads':False,'referencia_frase':'../lp/index.html:44','referencia_hierarquia':'instrucao de Victor transmitida pela Central; print original nao inspecionado neste chat'},
    'verificacao':{'fonte_carregada_no_browser':True,'headline_dom_exata':True,'desktop':{'viewport':[1080,1080],'conteudo_sem_overflow':True,'inspecionado':True},'mobile_dom':{'viewport':[390,844],'imagem_css_px':358,'sem_overflow_horizontal':True},'mobile_visual':{'arquivo':mobile.name,'metodo':'reducao local do PNG final a 358px; nao e screenshot de navegador','inspecionado':True},'limite':'Captura movel do navegador divergiu do DOM e nao foi usada como prova de leitura. Nao houve previa na Meta.','contraste_sobre_marinho':ratios,'exportacao':'Captura JPEG original preservada; conversao local para PNG sem redimensionamento da arte final; nao recupera compressao JPEG.'},
    'campanha':{'objetivo':'Leads','conversao':'conversas_whatsapp','destino':'whatsapp_da_pagina_v2g','numero_final':'2928','url_completa':None,'regiao':'Brasil','teto_total_centavos_BRL':50000,'publico_exato':'pendente','periodo':None,'publicar_com_victor':True,'autorizacao_publicar_agora':False},
    'hashes_sha256':hashes,
}
(root/'manifesto.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'resultado':'OK','png':manifest['png'],'contraste':ratios,'v3_preservada':True},ensure_ascii=False))
