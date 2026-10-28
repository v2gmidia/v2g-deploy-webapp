"""Exportacao local da V5, preservando arte anterior. Sem rede."""
from pathlib import Path
from hashlib import sha256
import json
from PIL import Image

root = Path(__file__).resolve().parent
with Image.open(root/'captura-original.jpg') as image:
    assert image.size == (1080,1080)
    final = image.convert('RGB')
    final.save(root/'v2g-gestao-sem-gestor-v5.png',format='PNG',optimize=True)
    final.resize((358,358),Image.Resampling.LANCZOS).save(root/'leitura-mobile-358.png',format='PNG',optimize=True)
source=(root/'arte.html').read_text(encoding='utf-8-sig')
copy=(root/'copy.txt').read_text(encoding='utf-8-sig')
assert 'Gestão de tráfego sem gestor de tráfego.' in source
assert 'Saiba como funciona' in source
assert 'acompanhamento humano' not in source and 'acompanhamento humano' not in copy
v4=root.parent/'arte-local-v4/v2g-gestao-sem-gestor-v4.png'
assert sha256(v4.read_bytes()).hexdigest()=='4e5f7ed447eacb223d0bb64a597281ca0a30e29a4db67665032620fc8aac8507'
png=root/'v2g-gestao-sem-gestor-v5.png'
with Image.open(png) as image:
    assert image.format=='PNG' and image.size==(1080,1080)
manifest={
    'versao':5,'data':'2026-10-28','origem':'design_local_deterministico',
    'decisao':'Victor pediu diretamente somente headline e CTA, retirando o apoio humano da peca; substitui a direcao V4 neste aspecto.',
    'headline':'Gestão de tráfego sem gestor de tráfego.','cta':'Saiba como funciona','apoio':None,
    'png':{'arquivo':png.name,'largura':1080,'altura':1080,'bytes':png.stat().st_size,'sha256':sha256(png.read_bytes()).hexdigest()},
    'fonte':'arte.html','copy':'copy.txt','preview':'previa.html',
    'verificacao':{'desktop_inspecionado':True,'font_loaded':True,'overflow':False,'mobile':'leitura-mobile-358.png: reducao local do PNG final, nao screenshot de navegador'},
    'exportacao':'Captura JPEG convertida localmente para PNG sem redimensionar; original preservado.',
    'v4_preservada':True,'gerado_pelo_agente_v2g':False,'chamadas_pagas':0,'publicado':False,
    'destino_campanha_preservado':'conversas WhatsApp da Pagina V2G, final 2928; CTA na arte nao altera destino/objetivo',
    'hashes':{name:sha256((root/name).read_bytes()).hexdigest() for name in ('arte.html','copy.txt','archivo-latin.woff2','leitura-mobile-358.png')}
}
(root/'manifesto.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest['png'],ensure_ascii=False))
