"""Genera el marcador impreso de la realidad aumentada (ar/marcador.png).

MindAR sigue mucho mejor una hoja impresa que la roca: el contraste es alto, la
superficie es plana y no cambia con la luz ni la estación. El patrón usa formas
de muchos tamaños, sin simetrías ni repeticiones, para que haya esquinas que
detectar a cualquier distancia y la imagen no se confunda con su propia rotación.
Es determinista (semilla fija): volver a correrlo da el mismo marcador, y el
.mind compilado sigue sirviendo con las hojas ya impresas.
Uso: python tools/marcador.py   (después compilar con node tools/compilar_marcador.mjs)
"""
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

LADO = 1200
SAL = Path(__file__).resolve().parent.parent / 'ar' / 'marcador.png'
TINTAS = ['#111111', '#111111', '#1c2b26', '#c1622f', '#3d6b5a', '#8d6a52']


def main():
    rnd = random.Random(20261002)
    im = Image.new('RGB', (LADO, LADO), 'white')
    d = ImageDraw.Draw(im)
    m = 70                                   # margen interior del marco
    for tam, n in ((260, 10), (140, 30), (70, 70), (32, 200), (16, 160)):
        for _ in range(n):
            x, y = rnd.uniform(m, LADO - m), rnd.uniform(m, LADO - m)
            c = rnd.choice(TINTAS)
            forma = rnd.random()
            s = tam * rnd.uniform(.5, 1.1)
            if forma < .4:
                pts = [(x + rnd.uniform(-s, s), y + rnd.uniform(-s, s)) for _ in range(3)]
                d.polygon(pts, fill=c)
            elif forma < .7:
                d.rectangle([x, y, x + s * rnd.uniform(.3, 1), y + s * rnd.uniform(.3, 1)], fill=c)
            elif forma < .85:
                r = s / 2
                d.ellipse([x - r, y - r, x + r, y + r], outline=c, width=max(3, int(s / 8)))
            else:
                d.line([x, y, x + rnd.uniform(-s, s), y + rnd.uniform(-s, s)], fill=c, width=max(3, int(s / 10)))
    # una marca asimétrica en una esquina: deja claro cuál es "arriba"
    d.polygon([(m, m), (m + 190, m), (m, m + 190)], fill='#c1622f')
    try:
        f = ImageFont.truetype('DejaVuSans-Bold.ttf', 52)
    except OSError:
        f = ImageFont.load_default()
    d.rectangle([LADO - 520, LADO - 140, LADO - 50, LADO - 50], fill='white')
    d.text((LADO - 505, LADO - 128), 'GeoParquemet', fill='#111111', font=f)
    # marco grueso: ayuda a encontrar la hoja y a medirla
    d.rectangle([0, 0, LADO - 1, LADO - 1], outline='#111111', width=36)
    SAL.parent.mkdir(exist_ok=True)
    im.save(SAL, optimize=True)
    print('guardado', SAL)


if __name__ == '__main__':
    main()
