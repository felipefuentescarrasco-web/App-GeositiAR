"""Agrega a la RA de la maqueta un sector hecho con una foto real tomada desde arriba (otra luz u otro día).

La foto se endereza al marco de la ortofoto (SIFT + homografía), se corta el rectángulo mayor que cubre y se
agrega a ar/maqueta.json con su rectángulo en coordenadas del modelo, igual que los sectores de ra_objetivos.py.
Solo sirve con fotos casi cenitales: con tomas oblicuas MindAR no reconoce igual.
Uso: python tools/maqueta/ra_foto.py foto.jpg [nombre]   → después: node tools/maqueta/compilar_ra.mjs"""
import json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps
sys.path.insert(0, str(Path(__file__).parent))
import glb
from ra_objetivos import ANCHO, LADO, RAIZ


def rect_mayor(m):
    """Rectángulo de área máxima dentro de la máscara (histograma por filas)."""
    h, w = m.shape; alt = np.zeros(w, int); mejor = (0, 0, 0, 0, 0)
    for y in range(h):
        alt = np.where(m[y], alt + 1, 0); pila = []
        for x in range(w + 1):
            a = alt[x] if x < w else 0; ini = x
            while pila and pila[-1][1] >= a:
                ini, ah = pila.pop()
                if ah * (x - ini) > mejor[0]: mejor = (ah * (x - ini), ini, y - ah + 1, x, y + 1)
            pila.append((ini, a))
    return mejor[1:]


def main(foto, nombre=None):
    _, pos, uv, idx, tex = glb.leer(RAIZ / 'assets' / '3d' / 'maqueta.glb')
    img, _, (xmin, zmin, esc) = glb.cenital(pos, uv, idx, tex, ANCHO)
    orto = cv2.imread(str(Path(__file__).parent / '_ortofoto.jpg'))
    H0, W0 = orto.shape[:2]
    cl = cv2.createCLAHE(3, (8, 8)); s = cv2.SIFT_create(20000)
    ko, do = s.detectAndCompute(cl.apply(cv2.cvtColor(orto, cv2.COLOR_BGR2GRAY)), None)
    f = cv2.cvtColor(np.array(ImageOps.exif_transpose(Image.open(foto)).convert('RGB')), cv2.COLOR_RGB2BGR)
    k = 1600 / max(f.shape[:2]); fp = cv2.resize(f, None, fx=k, fy=k)
    kf, df = s.detectAndCompute(cl.apply(cv2.cvtColor(fp, cv2.COLOR_BGR2GRAY)), None)
    m = [a for a, b in cv2.BFMatcher().knnMatch(df, do, k=2) if a.distance < 0.8 * b.distance]
    H, mk = cv2.findHomography(np.float32([kf[a.queryIdx].pt for a in m]), np.float32([ko[a.trainIdx].pt for a in m]), cv2.RANSAC, 10)
    n = int(mk.sum()) if mk is not None else 0
    if n < 60: sys.exit(f'{foto}: solo {n} puntos en común con la ortofoto; no sirve')
    H = H @ np.diag([k, k, 1])   # desde la foto a resolución completa
    der = cv2.warpPerspective(f, H, (W0, H0), flags=cv2.INTER_AREA)
    mas = cv2.warpPerspective(np.full(f.shape[:2], 255, np.uint8), H, (W0, H0), flags=cv2.INTER_NEAREST)
    r = 8; peq = cv2.erode(mas, np.ones((15, 15), np.uint8))[::r, ::r] > 0
    x0, y0, x1, y1 = [v * r for v in rect_mayor(peq)]
    conf = json.loads((RAIZ / 'ar' / 'maqueta.json').read_text())
    nombre = nombre or f'maqueta_{len(conf["objetivos"])}'
    rec = Image.fromarray(cv2.cvtColor(der[y0:y1, x0:x1], cv2.COLOR_BGR2RGB)); rec.thumbnail((LADO, LADO))
    ImageOps.autocontrast(rec.convert('L'), cutoff=1).convert('RGB').save(RAIZ / 'ar' / f'{nombre}.jpg', quality=88)
    a = lambda X, Y: (round(xmin + X / esc, 4), round(zmin + Y / esc, 4))
    (ax, az), (bx, bz) = a(x0, y0), a(x1, y1)
    conf['objetivos'] = [o for o in conf['objetivos'] if o['img'] != f'ar/{nombre}.jpg']
    conf['objetivos'].append({'img': f'ar/{nombre}.jpg', 'x0': ax, 'z0': az, 'x1': bx, 'z1': bz, 'origen': Path(foto).name})
    (RAIZ / 'ar' / 'maqueta.json').write_text(json.dumps(conf, indent=1))
    print(f'{Path(foto).name} → ar/{nombre}.jpg · {n} puntos · rectángulo {x1 - x0}×{y1 - y0} px de la ortofoto')


if __name__ == '__main__':
    main(*sys.argv[1:])
