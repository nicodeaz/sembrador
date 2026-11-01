"""Generate responsive WebP derivatives without changing the original images.

Run with Python 3 and Pillow: python scripts/optimize-images.py
Only photos/characters referenced by index.html are processed. No network is used.
"""
from __future__ import annotations

from hashlib import sha256
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
import json
import re

from PIL import Image, features

ROOT = Path(__file__).resolve().parents[1]
WIDTHS = (480, 800)
QUALITY = 82


class ImageReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths: set[str] = set()

    def handle_starttag(self, tag, attrs):
        if tag not in ('img', 'source'):
            return
        for name, value in attrs:
            if not value or name not in ('src', 'data-src', 'srcset'):
                continue
            candidates = [item.strip().split()[0] for item in value.split(',')] if name == 'srcset' else [value]
            for candidate in candidates:
                match = re.fullmatch(r'assets/(responsive/)?(photos|characters)/([\w-]+)\.webp(?:[?#].*)?', candidate)
                if match:
                    stem = re.sub(r'-(480|800)$', '', match[3]) if match[1] else match[3]
                    self.paths.add(f'assets/{match[2]}/{stem}.webp')


if not features.check('webp'):
    raise SystemExit('Pillow needs WebP support.')
references = ImageReferences()
references.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
if not references.paths:
    raise SystemExit('No referenced photos or characters found.')
report = []
for relative in sorted(references.paths):
    original = ROOT / relative
    original_bytes = original.read_bytes()
    original_digest = sha256(original_bytes).hexdigest()
    with Image.open(BytesIO(original_bytes)) as image:
        if image.format != 'WEBP' or getattr(image, 'n_frames', 1) != 1:
            raise ValueError(f'Expected a still WebP: {relative}')
        image.load()
        alpha = 'A' in image.getbands()
        image = image.convert('RGBA' if alpha else 'RGB')
        for width in WIDTHS:
            if width > image.width:
                raise ValueError(f'Cannot upscale {relative} to {width}px.')
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            resized.save(buffer, format='WEBP', quality=QUALITY, method=6, exact=True)
            encoded = buffer.getvalue()
            destination = ROOT / 'assets' / 'responsive' / original.parent.name / f'{original.stem}-{width}.webp'
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists() or destination.read_bytes() != encoded:
                destination.write_bytes(encoded)
            with Image.open(destination) as check:
                if check.size != (width, height) or ('A' in check.getbands()) != alpha:
                    raise ValueError(f'Dimensions or transparency changed: {destination}')
            report.append({'file': destination.relative_to(ROOT).as_posix(), 'width': width, 'height': height, 'bytes': len(encoded), 'originalBytes': len(original_bytes), 'alpha': alpha})
    if sha256(original.read_bytes()).hexdigest() != original_digest:
        raise ValueError(f'Original was modified: {relative}')
print(json.dumps({'quality': QUALITY, 'originalCount': len(references.paths), 'variants': report}, indent=2))
