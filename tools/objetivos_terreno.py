"""Agrega a la RA objetivos nuevos hechos con fotos de terreno (otra hora, otra luz).

Cada foto nueva se calza por SIFT + homografía (RANSAC) contra el objetivo existente del mismo
geositio con el que más coincide; con esa homografía se lleva su capa interpretada (ar/gN_k_capa.webp)
y la posición de sus carteles a la foto nueva. Sirve porque el afloramiento, visto de frente, es casi
plano a la escala de la toma; se descartan los calces con pocos inliers.

Uso: python tools/objetivos_terreno.py N carpeta foto1.jpg foto2.jpg ...
     después: node tools/compilar_rocas.mjs N   y   python tools/version.py
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
AR = RAIZ / 'ar'
W, H = 750, 1000
MIN_INLIERS = 40


def cargar_foto(ruta):
    im = ImageOps.exif_transpose(Image.open(ruta)).convert('RGB')
    if im.width > im.height:                      # los objetivos son verticales 3:4
        im = im.rotate(90, expand=True)
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


def gris(im):
    g = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2GRAY)
    return cv2.createCLAHE(2.0, (8, 8)).apply(g)   # iguala un poco la luz para el calce


def main():
    n, carpeta, fotos = sys.argv[1], Path(sys.argv[2]), sys.argv[3:]
    objetivos = json.loads((AR / 'objetivos.json').read_text(encoding='utf-8'))
    pares = objetivos[n]['pares']
    sift = cv2.SIFT_create(4000)
    ref = []
    for p in pares:
        im = Image.open(RAIZ / p['obj']).convert('RGB')
        kp, de = sift.detectAndCompute(gris(im), None)
        ref.append((p, kp, de))
    bf = cv2.BFMatcher()
    k = max(p['k'] for p in pares)
    for f in fotos:
        im = cargar_foto(carpeta / f)
        kp, de = sift.detectAndCompute(gris(im), None)
        mejor = None
        for p, kr, dr in ref:
            m = [a for a, b in bf.knnMatch(de, dr, k=2) if a.distance < .75 * b.distance]
            if len(m) < 12:
                continue
            src = np.float32([kr[a.trainIdx].pt for a in m]); dst = np.float32([kp[a.queryIdx].pt for a in m])
            Hm, mask = cv2.findHomography(src, dst, cv2.RANSAC, 6.0)
            if Hm is None:
                continue
            inl = int(mask.sum())
            if not mejor or inl > mejor[0]:
                mejor = (inl, p, Hm)
        if not mejor or mejor[0] < MIN_INLIERS:
            print(f, 'sin calce suficiente', mejor[0] if mejor else 0); continue
        inl, p, Hm = mejor
        k += 1
        capa = cv2.imread(str(RAIZ / p['capa']), cv2.IMREAD_UNCHANGED)
        e = capa.shape[1] / p['w']                 # la capa va a más resolución que la foto (1050 vs 750)
        S = np.diag([e, e, 1.0])
        nueva = cv2.warpPerspective(capa, S @ Hm @ np.linalg.inv(S), (round(W * e), round(H * e)),
                                    flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
        base = f'ar/g{n}_{k}'
        im.save(RAIZ / (base + '_obj.jpg'), quality=88)
        cv2.imwrite(str(RAIZ / (base + '_capa.webp')), nueva, [cv2.IMWRITE_WEBP_QUALITY, 85])
        carteles = {}
        for c, (x, y) in p.get('carteles', {}).items():
            q = cv2.perspectiveTransform(np.float32([[[x * p['w'], y * p['h']]]]), Hm)[0, 0]
            if 0 <= q[0] < W and 0 <= q[1] < H:
                carteles[c] = [round(float(q[0]) / W, 4), round(float(q[1]) / H, 4)]
        cob = round(float((nueva[:, :, 3] > 20).mean()), 3) if nueva.shape[2] == 4 else p.get('cobertura')
        pares.append({'k': k, 'obj': base + '_obj.jpg', 'capa': base + '_capa.webp', 'w': W, 'h': H,
                      'cobertura': cob, 'carteles': carteles, 'origen': f'{f} (calce con g{n}_{p["k"]}, {inl} inliers)'})
        print(f, '→', base, 'desde', p['obj'], inl, 'inliers', 'carteles', list(carteles))
    (AR / 'objetivos.json').write_text(json.dumps(objetivos, ensure_ascii=False, indent=1), encoding='utf-8')


main()
