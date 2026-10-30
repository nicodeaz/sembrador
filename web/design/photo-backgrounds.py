"""Foto del hero, preparada a partir de la foto real del campo (assets/photos/campo.webp).

Solo se recorta (menos cielo, para que el caballo y la vaca queden arriba del huevo) y se
comprime en dos tamaños. No se retoca ni se agrega nada. Los fondos de las etapas usan las
fotos de assets/photos/ tal cual, encuadradas desde index.html.

Uso, desde web/:  python3 design/photo-backgrounds.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'photos' / 'campo.webp'
OUTPUT = ROOT / 'assets' / 'hero'

if __name__ == '__main__':
    photo = Image.open(SOURCE).convert('RGB')
    width, height = photo.size
    crop = photo.crop((0, round(height * 0.17), width, round(height * 0.97)))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for size in (1086, 700):
        image = crop if size == crop.width else crop.resize((size, round(crop.height * size / crop.width)), Image.LANCZOS)
        target = OUTPUT / f'campo-{size}.webp'
        image.save(target, 'WEBP', quality=78, method=6)
        print(f'{target.relative_to(ROOT)}  {image.size[0]}x{image.size[1]}')
