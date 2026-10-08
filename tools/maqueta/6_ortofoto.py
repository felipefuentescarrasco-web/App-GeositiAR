"""Ortofoto de la maqueta con las fotos reales (no la textura del modelo) → tools/maqueta/_ortofoto.jpg.

Cada pixel de la vista cenital del GLB es un punto del relieve (x, altura, z). Se lleva a las coordenadas
de COLMAP deshaciendo el enderezado de 4_glb.py y se proyecta en los cuadros tomados casi desde arriba
(pose y cámara de COLMAP). Se promedian los cuadros, pesando por lo vertical de la toma y la distancia al
borde de la foto. Sirve como blanco de RA: se ve como lo ve el teléfono, con el brillo real del aluminio.
Uso: python tools/maqueta/6_ortofoto.py <carpeta del trabajo de fotogrametría> <modelo COLMAP en TXT> [ángulo máx]"""
import sys
from pathlib import Path
import numpy as np, cv2
sys.path.insert(0, str(Path(__file__).parent))
import glb

RAIZ = Path(__file__).resolve().parent.parent.parent
ANCHO = 2400


def enderezado(M):
    """Repite los pasos de 4_glb.py para recuperar la transformación COLMAP → GLB."""
    V, VT, F, mats, mat = [], [], [], [], None
    for l in open(M + '/mvs/maqueta_tex.obj'):
        if l.startswith('v '): V.append([float(x) for x in l.split()[1:4]])
        elif l.startswith('vt '): VT.append([float(x) for x in l.split()[1:3]])
        elif l.startswith('usemtl'):
            mat = l.split()[1]
            if mat not in mats: mats.append(mat)
        elif l.startswith('f '):
            p = [x.split('/') for x in l.split()[1:4]]
            F.append([int(p[i][0]) - 1 for i in range(3)] + [int(p[i][1]) - 1 for i in range(3)] + [mats.index(mat)])
    V, VT, F = np.array(V), np.array(VT), np.array(F)
    _, vt_inv = np.unique(np.round(VT * 2 ** 16).astype(np.int64), axis=0, return_inverse=True)
    F[:, 3:6] = vt_inv.ravel()[F[:, 3:6]]
    claves = np.concatenate([np.stack([F[:, i], F[:, 3 + i], F[:, 6]], 1) for i in range(3)])
    uniq = np.unique(claves, axis=0)
    pos = V[uniq[:, 0]]
    a = np.load(M + '/arriba.npy'); n = a[3:] / np.linalg.norm(a[3:])
    mu = pos.mean(0); P = pos - mu; Ph = P - np.outer(P @ n, n)
    x = np.linalg.svd(Ph[::7], full_matrices=False)[2][0]; x = x - np.dot(x, n) * n; x /= np.linalg.norm(x)
    R = np.vstack([x, n, np.cross(x, n)])
    Q = P @ R.T
    ymin = Q[:, 1].min(); Q[:, 1] -= ymin
    s = 2 / max(np.ptp(Q[:, 0]), np.ptp(Q[:, 2]))
    Q *= s
    cx, cz = (Q[:, 0].min() + Q[:, 0].max()) / 2, (Q[:, 2].min() + Q[:, 2].max()) / 2
    return lambda q: ((q + [cx, 0, cz]) / s + [0, ymin, 0]) @ R + mu


def main(M, txt, maxang=30):
    maxang = float(maxang)
    _, pos, uv, idx, tex = glb.leer(RAIZ / 'assets' / '3d' / 'maqueta.glb')
    img, zb, (xmin, zmin, esc) = glb.cenital(pos, uv, idx, tex, ANCHO)
    H, W = zb.shape
    ok = np.isfinite(zb)
    Y, X = np.mgrid[0:H, 0:W]
    q = np.c_[xmin + X[ok] / esc, zb[ok], zmin + Y[ok] / esc]
    mundo = enderezado(M)(q)
    cam = [l.split() for l in open(txt + '/cameras.txt') if not l.startswith('#')][0]
    fx, fy, cx, cy, k1, k2, p1, p2 = map(float, cam[4:12]); iw, ih = int(cam[2]), int(cam[3])
    K = np.array([[fx, 0, cx], [0, fy, cy], [0, 0, 1]]); dist = np.array([k1, k2, p1, p2])
    a = np.load(M + '/arriba.npy'); up = a[3:] / np.linalg.norm(a[3:])
    suma = np.zeros((ok.sum(), 3)); peso = np.zeros(ok.sum())
    lineas = [l for l in open(txt + '/images.txt') if not l.startswith('#')][::2]
    usados = 0
    for l in lineas:
        p = l.split(); qw, qx, qy, qz = map(float, p[1:5]); t = np.array(list(map(float, p[5:8]))); nombre = p[9]
        Rc = np.array([[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
                       [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
                       [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]])
        ang = np.degrees(np.arccos(np.clip(-(Rc.T @ [0, 0, 1]) @ up, -1, 1)))
        if ang > maxang: continue
        foto = cv2.imread(f'{M}/sfm/img/{nombre}')
        if foto is None: continue
        pc = mundo @ Rc.T + t
        delante = pc[:, 2] > 0
        uvp, _ = cv2.projectPoints(mundo[delante].reshape(-1, 1, 3), cv2.Rodrigues(Rc)[0], t, K, dist)
        uvp = uvp.reshape(-1, 2)
        dentro = (uvp[:, 0] >= 0) & (uvp[:, 0] < iw - 1) & (uvp[:, 1] >= 0) & (uvp[:, 1] < ih - 1)
        ix = np.where(delante)[0][dentro]; u = uvp[dentro]
        # bilineal a mano (remap no acepta más de 32767 puntos por lado)
        x0 = np.floor(u[:, 0]).astype(int); y0 = np.floor(u[:, 1]).astype(int); fx_, fy_ = (u[:, 0] - x0)[:, None], (u[:, 1] - y0)[:, None]
        f = foto.astype(np.float32)
        col = (f[y0, x0] * (1 - fx_) * (1 - fy_) + f[y0, x0 + 1] * fx_ * (1 - fy_) + f[y0 + 1, x0] * (1 - fx_) * fy_ + f[y0 + 1, x0 + 1] * fx_ * fy_)
        borde = np.minimum.reduce([u[:, 0], iw - u[:, 0], u[:, 1], ih - u[:, 1]]) / (0.15 * min(iw, ih))
        w = np.clip(borde, 0, 1) ** 2 * np.cos(np.radians(ang)) ** 8
        suma[ix] += col * w[:, None]; peso[ix] += w; usados += 1
    sal = np.zeros((H, W, 3), np.uint8)
    hay = peso > 1e-6
    vals = np.zeros((ok.sum(), 3)); vals[hay] = suma[hay] / peso[hay, None]
    sal[ok] = vals.clip(0, 255).astype(np.uint8)
    # donde ninguna foto cenital llega, la textura del modelo (en gris)
    falta = np.zeros((H, W), bool); falta[ok] = ~hay
    gris = cv2.cvtColor(img[:, :, ::-1].copy(), cv2.COLOR_BGR2GRAY)
    sal[falta] = np.stack([gris] * 3, -1)[falta]
    cv2.imwrite(str(Path(__file__).parent / '_ortofoto.jpg'), sal, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(usados, 'cuadros ·', f'{hay.mean() * 100:.0f} % cubierto con fotos')


if __name__ == '__main__':
    main(*sys.argv[1:])
