"""Recorta la malla densa de OpenMVS de un afloramiento grabado en video y la simplifica.

Uso: python tools/afloramiento/recortar.py <carpeta mvs> <modelo COLMAP en TXT> <caras>
Deja <mvs>/afloramiento.ply y <mvs>/arriba.npy (centro y vertical, para tools/afloramiento/glb.py).
- La vertical es el promedio del "arriba" de las cámaras: el teléfono se sostiene derecho al grabar.
- Se deja solo lo que está a menos de ~2,5 veces la distancia típica cámara–roca (fuera queda el
  fondo lejano mal reconstruido) y la pieza conectada más grande.
"""
import sys
from pathlib import Path
import numpy as np, trimesh, fast_simplification


def camaras(txt):
    C, U, Z = [], [], []
    lineas = [l for l in open(Path(txt) / 'images.txt') if not l.startswith('#')]
    for l in lineas[::2]:
        p = l.split()
        if len(p) < 10: continue
        qw, qx, qy, qz, tx, ty, tz = map(float, p[1:8])
        R = np.array([[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
                      [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
                      [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]])
        C.append(-R.T @ [tx, ty, tz]); U.append(-R.T @ [0, 1, 0]); Z.append(R.T @ [0, 0, 1])
    return np.array(C), np.array(U), np.array(Z)


def main(mvs, txt, caras):
    mvs = Path(mvs)
    C, U, Z = camaras(txt)
    arriba = U.mean(0); arriba /= np.linalg.norm(arriba)
    malla = trimesh.load(mvs / 'escena_dense_mesh.ply', process=False)
    cen = malla.triangles_center
    # distancia típica cámara–roca: mediana de lo que hay frente a cada cámara
    muestra = cen[::max(1, len(cen) // 20000)]
    d = np.linalg.norm(muestra[:, None] - C[None], axis=2).min(1)
    tipico = np.median(d)
    dmin = np.full(len(cen), np.inf)
    for i in range(0, len(C), 8):
        dmin = np.minimum(dmin, np.linalg.norm(cen[:, None] - C[None, i:i + 8], axis=2).min(1))
    m = malla.submesh([np.where(dmin < 2.5 * tipico)[0]], append=True)
    partes = sorted(m.split(only_watertight=False), key=lambda p: len(p.faces), reverse=True)
    print('caras', len(malla.faces), '→ cerca', len(m.faces), 'partes', [len(p.faces) for p in partes[:4]])
    m = partes[0]
    v, f = fast_simplification.simplify(np.asarray(m.vertices, dtype=np.float32), np.asarray(m.faces), target_count=caras)
    m2 = trimesh.Trimesh(v, f, process=True)
    m2.export(mvs / 'afloramiento.ply')
    np.save(mvs / 'arriba.npy', np.concatenate([m2.vertices.mean(0), arriba]))
    print('simplificada', len(m2.faces), 'caras; extensión', np.ptp(m2.vertices, 0).round(2), 'distancia típica', round(tipico, 2))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]))
