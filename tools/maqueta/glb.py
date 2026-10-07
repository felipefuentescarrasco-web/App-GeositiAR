"""Lectura del GLB liviano de la maqueta (posiciones, UV, índices y una textura JPEG) y vista cenital."""
import json, struct, io
import numpy as np
from PIL import Image

TIPOS = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}
N = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}


def leer(ruta):
    d = open(ruta, 'rb').read()
    lj = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + lj])
    b0 = 20 + lj + 8
    binario = d[b0:]
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
        o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        n = N[a['type']]
        return np.frombuffer(binario, TIPOS[a['componentType']], a['count'] * n, o).reshape(a['count'], n) if n > 1 else \
            np.frombuffer(binario, TIPOS[a['componentType']], a['count'], o)
    p = j['meshes'][0]['primitives'][0]
    pos, uv, idx = acc(p['attributes']['POSITION']), acc(p['attributes']['TEXCOORD_0']), acc(p['indices'])
    v = j['bufferViews'][j['images'][0]['bufferView']]
    tex = Image.open(io.BytesIO(binario[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']])).convert('RGB')
    return j, pos.astype(np.float64), uv.astype(np.float64), idx.reshape(-1, 3), tex


def cenital(pos, uv, idx, tex, ancho=1600):
    """Vista desde arriba (eje Y hacia arriba; X → derecha, Z → abajo). Devuelve imagen, alto Y por pixel y el
    rectángulo (xmin, zmin, escala) para pasar de pixel a coordenadas del modelo."""
    xmin, zmin = pos[:, 0].min(), pos[:, 2].min()
    esc = (ancho - 1) / (pos[:, 0].max() - xmin)
    alto = int((pos[:, 2].max() - zmin) * esc) + 1
    px = (pos[:, 0] - xmin) * esc; pz = (pos[:, 2] - zmin) * esc
    T = np.asarray(tex, dtype=np.uint8); th, tw, _ = T.shape
    img = np.zeros((alto, ancho, 3), np.uint8); zbuf = np.full((alto, ancho), -np.inf)
    for a, b, c in idx:
        xs = px[[a, b, c]]; ys = pz[[a, b, c]]
        x0, x1 = int(np.floor(xs.min())), int(np.ceil(xs.max())); y0, y1 = int(np.floor(ys.min())), int(np.ceil(ys.max()))
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        den = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(den) < 1e-12: continue
        l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / den
        l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / den
        l2 = 1 - l0 - l1
        m = (l0 >= -1e-6) & (l1 >= -1e-6) & (l2 >= -1e-6) & (gx >= 0) & (gy >= 0) & (gx < ancho) & (gy < alto)
        if not m.any(): continue
        h = l0 * pos[a, 1] + l1 * pos[b, 1] + l2 * pos[c, 1]
        u = l0 * uv[a, 0] + l1 * uv[b, 0] + l2 * uv[c, 0]; v = l0 * uv[a, 1] + l1 * uv[b, 1] + l2 * uv[c, 1]
        gxm, gym, hm = gx[m], gy[m], h[m]
        ok = hm > zbuf[gym, gxm]
        gxm, gym, hm = gxm[ok], gym[ok], hm[ok]
        zbuf[gym, gxm] = hm
        tu = np.clip((u[m][ok] * (tw - 1)).astype(int), 0, tw - 1); tv = np.clip((v[m][ok] * (th - 1)).astype(int), 0, th - 1)
        img[gym, gxm] = T[tv, tu]
    return img, zbuf, (xmin, zmin, esc)
