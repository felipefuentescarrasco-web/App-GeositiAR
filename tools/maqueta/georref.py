"""Georreferencia la maqueta 3D calzando su relieve contra el DEM ALOS PALSAR de la carpeta SIG.

La vista cenital del GLB da una "altura por pixel"; se busca el giro, la escala y la posición que mejor
correlacionan con el DEM (correlación normalizada, así que no importa la exageración vertical de la
maqueta) y se guarda la afín modelo (x, z) → UTM 19S SIRGAS en tools/maqueta/georref.json.
Uso: python tools/maqueta/georref.py <dem.tif> ['[geotransform GDAL del dem en JSON]']
(por defecto, el de la vista previa de DEM_Alos_Palsar_Parquemet_SIRGAS19S.tif de la rama datos-sig)."""
import json, sys
from pathlib import Path
import cv2, numpy as np
sys.path.insert(0, str(Path(__file__).parent))
import glb

RAIZ = Path(__file__).resolve().parent.parent.parent
INTERIOR = (75, 525, 80, 1120)   # filas / columnas del relieve en la vista de 1200 px (sin el marco)


def main(ruta_dem, gt_txt=None):
    _, pos, uv, idx, tex = glb.leer(RAIZ / 'assets' / '3d' / 'maqueta.glb')
    _, z, (xmin, zmin, esc) = glb.cenital(pos, uv, idx, tex, 1200)
    y0, y1, x0, x1 = INTERIOR
    m = z[y0:y1, x0:x1].astype(np.float32); m[~np.isfinite(m)] = np.nanmin(m[np.isfinite(m)])
    dem = cv2.imread(str(ruta_dem), cv2.IMREAD_UNCHANGED).astype(np.float32)
    gt = json.loads(gt_txt) if gt_txt else (346131.969, 4.328125, 0, 6308049.25, 0, -4.32853717)

    def buscar(f, escalas, giros):
        t = cv2.resize(m, None, fx=1 / f, fy=1 / f, interpolation=cv2.INTER_AREA)
        mejor = None
        for mpx in escalas:
            k = gt[1] / mpx
            dd = cv2.resize(dem, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
            h, w = dd.shape; c = (w / 2, h / 2); L = int(np.hypot(h, w)) + 2
            for th in giros:
                M = cv2.getRotationMatrix2D(c, float(th), 1.0); M[:, 2] += (L / 2 - c[0], L / 2 - c[1])
                r = cv2.warpAffine(dd, M, (L, L), borderValue=float(dem.min()))
                _, v, _, loc = cv2.minMaxLoc(cv2.matchTemplate(r, t, cv2.TM_CCOEFF_NORMED))
                if mejor is None or v > mejor[0]: mejor = (v, mpx, th, loc, M, k, f)
        return mejor

    g = buscar(4, np.arange(18, 40, 1.5), range(0, 360, 3))                       # búsqueda gruesa
    v, mpx, th, loc, M, k, f = buscar(2, np.arange(g[1] / 2 - 1, g[1] / 2 + 1.01, .25),
                                      np.arange(g[2] - 4, g[2] + 4.1, .5))          # fina
    print(f'correlación {v:.3f} · {2 * mpx / f * esc:.0f} m de ancho de modelo · giro {th}°')
    Minv = cv2.invertAffineTransform(M)
    P, Q = [], []
    for X in np.linspace(0, 1199, 7):
        for Y in np.linspace(0, z.shape[0] - 1, 5):
            u = (X - x0 - (f - 1) / 2) / f + loc[0]; w = (Y - y0 - (f - 1) / 2) / f + loc[1]
            di = (Minv[0, 0] * u + Minv[0, 1] * w + Minv[0, 2]) / k; dj = (Minv[1, 0] * u + Minv[1, 1] * w + Minv[1, 2]) / k
            P.append([xmin + X / esc, zmin + Y / esc, 1]); Q.append([gt[0] + (di + .5) * gt[1], gt[3] + (dj + .5) * gt[5]])
    A, *_ = np.linalg.lstsq(np.array(P), np.array(Q), rcond=None)
    sal = Path(__file__).parent / 'georref.json'
    sal.write_text(json.dumps({'modelo_a_utm': [[round(x, 4) for x in fila] for fila in A.T.tolist()], 'epsg': 31979,
                               'correlacion_dem': round(float(v), 3), 'dem': 'DEM_Alos_Palsar_Parquemet_SIRGAS19S.tif'}, indent=1))
    print('→', sal)


if __name__ == '__main__':
    main(*sys.argv[1:])
