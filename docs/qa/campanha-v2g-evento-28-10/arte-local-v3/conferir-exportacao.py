"""Converte capturas locais para PNG e reconcilia dimensoes/hashes do manifesto."""
from pathlib import Path
from hashlib import sha256
import json
from PIL import Image

root = Path(__file__).resolve().parent
for name in ('v2g-negocio-anuncios-v3', 'previa-mobile'):
    target = root / f'{name}.png'
    with Image.open(target) as source:
        original_format = source.format
        pixels = source.convert('RGB')
    if original_format != 'PNG':
        capture = root / f'{name}-captura.jpg'
        if capture.exists():
            raise RuntimeError(f'Captura original ja existe: {capture.name}')
        target.rename(capture)
        pixels.save(target, format='PNG', optimize=True)

manifest_path = root / 'manifesto.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
final = root / manifest['png']['arquivo']
with Image.open(final) as image:
    assert image.format == 'PNG' and image.size == (1080, 1080)
manifest['png']['size_bytes'] = final.stat().st_size
manifest['png']['sha256'] = sha256(final.read_bytes()).hexdigest()
manifest['verificacao_local']['prova_mobile_sha256'] = sha256((root / 'previa-mobile.png').read_bytes()).hexdigest()
manifest['verificacao_local']['renderizacao'] = 'Navegador 1080x1080; captura original JPEG preservada; conversao local de formato para PNG sem redimensionamento'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'png': manifest['png'], 'mobile_sha256': manifest['verificacao_local']['prova_mobile_sha256']}, ensure_ascii=False))
