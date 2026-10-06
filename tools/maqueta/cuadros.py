"""Saca de los videos de la maqueta los cuadros nítidos para la fotogrametría.

Recorre los .mp4 de la carpeta de entrada, toma ~3 cuadros por segundo, se queda con el más nítido de cada
tramo de medio segundo (varianza del laplaciano) y los guarda reducidos a 2000 px de lado mayor. Copia
también las fotos .jpg. Uso: python tools/maqueta/cuadros.py <carpeta_entrada> <carpeta_salida>
"""
import sys, subprocess, json
from pathlib import Path
import cv2

ent, sal = Path(sys.argv[1]), Path(sys.argv[2])
sal.mkdir(parents=True, exist_ok=True)
LADO = 2000
resumen = []
for v in sorted(ent.rglob('*.mp4')):
    cap = cv2.VideoCapture(str(v))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    paso = max(1, round(fps / 6))          # se evalúan 6 cuadros por segundo...
    tramo = max(1, round(fps / 2))         # ...y se guarda el mejor de cada medio segundo
    mejor, i, n = None, 0, 0
    while True:
        ok = cap.grab()
        if not ok: break
        if i % paso == 0:
            ok, f = cap.retrieve()
            if ok:
                g = cv2.cvtColor(cv2.resize(f, None, fx=.25, fy=.25), cv2.COLOR_BGR2GRAY)
                nit = cv2.Laplacian(g, cv2.CV_64F).var()
                if mejor is None or nit > mejor[0]: mejor = (nit, f, i)
        if (i + 1) % tramo == 0 and mejor is not None:
            f = mejor[1]; h, w = f.shape[:2]; k = LADO / max(h, w)
            if k < 1: f = cv2.resize(f, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(sal / f'{v.stem}_{mejor[2]:06d}.jpg'), f, [cv2.IMWRITE_JPEG_QUALITY, 92])
            n += 1; mejor = None
        i += 1
    resumen.append({'video': v.name, 'fps': fps, 'cuadros_video': i, 'guardados': n})
    print(resumen[-1], flush=True)
for f in sorted(ent.rglob('*.jpg')):
    im = cv2.imread(str(f)); h, w = im.shape[:2]; k = LADO / max(h, w)
    if k < 1: im = cv2.resize(im, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(sal / ('foto_' + f.name)), im, [cv2.IMWRITE_JPEG_QUALITY, 92])
(sal / 'resumen.json').write_text(json.dumps(resumen, indent=1))
