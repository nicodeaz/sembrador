"""Fondos realistas de la web, preparados a partir de fotos reales de la granja.

- Hero: la foto del campo con el caballo y la vaca (assets/photos/campo.webp), recortada y
  comprimida en dos tamaños. No se altera su contenido.
- Etapas del ciclo: recortes de fotos del archivo familiar, ampliados, con la misma gradación
  de color y un desenfoque de profundidad de campo (nítido abajo, donde apoya el personaje, y
  cada vez más suave hacia arriba), como una foto en modo retrato.

No se dibujan ni se inventan objetos o instalaciones. Para la gallina se usa, como suelo, el
pasto que está delante del mismo galpón en la misma foto, espejado para cubrir el ancho; la
unión queda detrás de la gallina y dentro del desenfoque. Las fotos originales no se modifican.

Uso, desde web/:  python3 design/photo-backgrounds.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'photos'
STAGES_OUTPUT = ROOT / 'assets' / 'stages'
HERO_OUTPUT = ROOT / 'assets' / 'hero'
SIZE = 900

# box: recorte (izquierda, arriba, derecha, abajo) en fracciones de la foto original.
# focus: altura (0 arriba, 1 abajo) a partir de la cual la imagen queda nítida.
# ground: franja de suelo de la misma foto que se agrega abajo (box, proporción final).
STAGES = {
    'egg': dict(source='pollitos.webp', box=(0.0, 0.6, 0.46, 0.945), focus=0.8, far=7, warmth=0.05, saturation=0.92, brightness=1.0,
                clone=((120, 880, 215, 1015), (295, 880))),
    'hatch': dict(source='pollitas-recria.webp', box=(0.0, 0.02, 1.0, 0.77), focus=0.95, far=11, warmth=0.07, saturation=0.85, brightness=0.86),
    'chick': dict(source='pollitos.webp', box=(0.0, 0.0, 0.7, 0.525), focus=0.92, far=8, warmth=0.03, saturation=0.92, brightness=0.98),
    'pullet': dict(source='el-tata.webp', box=(0.08, 0.3, 0.92, 0.93), focus=0.92, far=9, warmth=0.03, saturation=0.9, brightness=1.0),
    'hen': dict(source='granja-vaca.webp', box=(0.0, 0.07, 0.52, 0.405), focus=0.86, far=10, warmth=0.06, saturation=0.88, brightness=0.98,
                ground=dict(box=(0.0, 0.445, 0.26, 0.56), share=0.27)),
}


def pixels(box, size):
    width, height = size
    return tuple(round(value * total) for value, total in zip(box, (width, height, width, height)))


def with_ground(photo, top, ground):
    strip = photo.crop(pixels(ground['box'], photo.size))
    strip = Image.fromarray(np.hstack([np.asarray(strip), np.asarray(strip)[:, ::-1]]))
    width = top.width
    ground_height = round(width * ground['share'])
    strip = strip.resize((width, ground_height), Image.LANCZOS)
    overlap = round(width * 0.06)
    height = width
    canvas = Image.new('RGB', (width, height))
    upper = height - ground_height + overlap
    canvas.paste(top.crop((0, top.height - upper, width, top.height)), (0, 0))
    fade = np.clip(np.linspace(0, 1, overlap), 0, 1)[:, None]
    mask = np.vstack([fade, np.ones((ground_height - overlap, 1))]) * np.ones((1, width))
    canvas.paste(strip, (0, height - ground_height), Image.fromarray((mask * 255).astype(np.uint8)))
    return canvas


def clone_patch(photo, source_box, target):
    """Classic clone-stamp retouch: covers a dark speck with clean bedding from the same photo."""
    patch = photo.crop(source_box)
    mask = Image.new('L', patch.size, 0)
    inset = (patch.width // 6, patch.height // 6, patch.width * 5 // 6, patch.height * 5 // 6)
    mask.paste(255, inset)
    photo.paste(patch, target, mask.filter(ImageFilter.GaussianBlur(patch.width // 8)))
    return photo


def prepare(name, source, box, focus, far, warmth, saturation, brightness, near=0.6, ground=None, clone=None):
    photo = Image.open(SOURCE / source).convert('RGB')
    if clone:
        photo = clone_patch(photo, *clone)
    crop = photo.crop(pixels(box, photo.size))
    if ground:
        crop = with_ground(photo, crop, ground)
    image = crop.resize((SIZE, SIZE), Image.LANCZOS)
    sharp = np.asarray(image.filter(ImageFilter.GaussianBlur(near)), dtype=np.float64)
    blurred = np.asarray(image.filter(ImageFilter.GaussianBlur(far)), dtype=np.float64)
    rows = np.linspace(0, 1, SIZE)[:, None, None]
    depth = np.clip((focus - rows) / focus, 0, 1) ** 0.75
    mixed = sharp * (1 - depth) + blurred * depth
    mixed[..., 0] *= 1 + warmth
    mixed[..., 2] *= 1 - warmth
    graded = Image.fromarray(np.clip(mixed, 0, 255).astype(np.uint8))
    graded = ImageEnhance.Color(graded).enhance(saturation)
    graded = ImageEnhance.Brightness(graded).enhance(brightness)
    # A little grain keeps the enlarged crops from looking smooth or artificial.
    grain = np.random.default_rng(7).normal(0, 2.2, (SIZE, SIZE, 1))
    final = np.clip(np.asarray(graded, dtype=np.float64) + grain, 0, 255).astype(np.uint8)
    STAGES_OUTPUT.mkdir(parents=True, exist_ok=True)
    target = STAGES_OUTPUT / f'{name}.webp'
    Image.fromarray(final).save(target, 'WEBP', quality=80, method=6)
    print(f'{target.relative_to(ROOT)}  {crop.size[0]}x{crop.size[1]} -> {SIZE}x{SIZE}  {target.stat().st_size // 1024} KB')


def hero():
    photo = Image.open(SOURCE / 'campo.webp').convert('RGB')
    # Less sky, so the horse and the cow sit high and the egg can rest on the fence line below them.
    crop = photo.crop(pixels((0.0, 0.17, 1.0, 0.97), photo.size))
    HERO_OUTPUT.mkdir(parents=True, exist_ok=True)
    for width in (1086, 700):
        image = crop if width == crop.width else crop.resize((width, round(crop.height * width / crop.width)), Image.LANCZOS)
        target = HERO_OUTPUT / f'campo-{width}.webp'
        image.save(target, 'WEBP', quality=78, method=6)
        print(f'{target.relative_to(ROOT)}  {image.size[0]}x{image.size[1]}  {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    hero()
    for stage, settings in STAGES.items():
        prepare(stage, **settings)
