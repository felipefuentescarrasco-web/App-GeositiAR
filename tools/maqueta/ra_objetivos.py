"""Blancos de realidad aumentada de la maqueta → ar/maqueta_<k>.jpg y ar/maqueta.json.

La imagen es la ortofoto de 6_ortofoto.py (fotos reales enderezadas; si no está, la vista cenital del GLB). Como la maqueta es
grande y desde la mesa casi nunca se ve entera, además de la vista completa se cortan sectores con
traslape; cada uno lleva su rectángulo en coordenadas del modelo (x, z) para poner las capas en su lugar.
Uso: python tools/maqueta/ra_objetivos.py [columnas filas]"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
sys.path.insert(0, str(Path(__file__).parent))
import glb

RAIZ = Path(__file__).resolve().parent.parent.parent
ANCHO = 2400
LADO = 640   # lado mayor de cada sector (480 pesa casi lo mismo y reconoce menos)


def main(cols=3, filas=2):
    cols, filas = int(cols), int(filas)
    _, pos, uv, idx, tex = glb.leer(RAIZ / 'assets' / '3d' / 'maqueta.glb')
    img, z, (xmin, zmin, esc) = glb.cenital(pos, uv, idx, tex, ANCHO)
    im = Image.fromarray(img)
    orto = Path(__file__).parent / '_ortofoto.jpg'   # 6_ortofoto.py: fotos reales, mismo marco y tamaño
    if orto.exists(): im = Image.open(orto).convert('RGB'); print('blancos desde la ortofoto')
    H, W = img.shape[:2]
    a_modelo = lambda X, Y: (xmin + X / esc, zmin + Y / esc)
    objetivos = []

    def agregar(nombre, x0, y0, x1, y1, lado=1100):
        rec = im.crop((x0, y0, x1, y1))
        rec.thumbnail((lado, lado))
        rec = ImageOps.autocontrast(rec.convert('L'), cutoff=1).convert('RGB')   # aluminio: realzar el relieve
        rec.save(RAIZ / 'ar' / f'{nombre}.jpg', quality=88)
        (ax, az), (bx, bz) = a_modelo(x0, y0), a_modelo(x1, y1)
        objetivos.append({'img': f'ar/{nombre}.jpg', 'x0': round(ax, 4), 'z0': round(az, 4), 'x1': round(bx, 4), 'z1': round(bz, 4)})

    # la vista completa no sirve: desde la mesa nunca se ve entera (se probó con los cuadros del video)
    tw, th = W / (cols - (cols - 1) * .3), H / (filas - (filas - 1) * .3)     # 30 % de traslape
    k = 0
    for j in range(filas):
        for i in range(cols):
            x0 = round(i * tw * .7); y0 = round(j * th * .7)
            agregar(f'maqueta_{k}', x0, y0, min(W, round(x0 + tw)), min(H, round(y0 + th)), LADO); k += 1
    # altura de la base: la de la ciudad plana dentro del marco (mediana del interior), para apoyar la capa
    h, w = z.shape
    interior = z[int(h * .15):int(h * .85), int(w * .1):int(w * .9)]
    base = float(np.nanmedian(interior[np.isfinite(interior)]))
    (RAIZ / 'ar' / 'maqueta.json').write_text(json.dumps({'objetivos': objetivos, 'base_y': round(base, 4)}, indent=1))
    print(len(objetivos), 'objetivos · base', round(base, 4))


if __name__ == '__main__':
    main(*sys.argv[1:])
