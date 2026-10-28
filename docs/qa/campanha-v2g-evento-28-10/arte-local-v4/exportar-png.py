"""Conversao de formato de capturas locais, sem redimensionamento ou geracao."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
for capture, output, size in (
    ('v4-captura-original.jpg', 'v2g-gestao-sem-gestor-v4.png', (1080, 1080)),
):
    source = root / capture
    if not source.exists():
        continue
    with Image.open(source) as image:
        assert image.size == size, (capture, image.size)
        image.convert('RGB').save(root / output, format='PNG', optimize=True)
    with Image.open(root / output) as image:
        assert image.format == 'PNG' and image.size == size
    print(f'{output}: PNG {size[0]}x{size[1]}')

# A captura de viewport movel do navegador divergiu do DOM nesta rodada.
# Conferir a leitura nos mesmos pixels finais, reduzidos deterministicamente.
with Image.open(root / 'v2g-gestao-sem-gestor-v4.png') as final:
    final.resize((358, 358), Image.Resampling.LANCZOS).save(root / 'leitura-mobile-358.png', format='PNG', optimize=True)
print('leitura-mobile-358.png: reducao local 358x358 do PNG final')
