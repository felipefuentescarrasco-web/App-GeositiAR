"""Capas del acta «Participación Ciudadana – Restauración Ladera» (24.09.2026) → assets/geo/acta_*.geojson.

Las láminas 18–24 son mapas de Parquemet con el norte hacia la derecha y grilla UTM (SIRGAS 19S): líneas
verticales = norte 6.300.000 / 6.302.500 / 6.305.000 / 6.307.500 y horizontales = este 347.500 / 350.000.
Se detecta la grilla, se segmenta cada color de la leyenda dentro del contorno del parque y se vectoriza.
La lámina 15 (tipos de bosque) no tiene grilla: se calza contra el contorno del parque de la lámina 22.
Uso: python tools/sig/acta_capas.py <carpeta con t15-004.jpg … t24-004.jpg (pdfimages -j)> [carpeta control]
"""
import json, sys
from pathlib import Path
import cv2, numpy as np
from pyproj import Transformer

RAIZ = Path(__file__).resolve().parent.parent.parent
A_GEO = Transformer.from_crs('EPSG:31979', 'EPSG:4326', always_xy=True)
FUENTE = 'Acta Participación Ciudadana – Restauración Ladera, 24.09.2026 (Parquemet). Digitalizado de la lámina, precisión aprox. ±15 m'

# capa: (imagen, lámina, [(clase, color RGB, tolerancia, área mínima px)])
LAMINAS = {
    'conservacion': ('t18-004', 18, [('Alto valor ecológico (bosque esclerófilo)', (226, 30, 34), 70, 6),
                                     ('Especies en categoría de conservación', (36, 118, 190), 60, 6),
                                     ('Árboles patrimoniales', (40, 170, 70), 50, 2)]),
    'proteccion': ('t19-004', 19, [('Protección de suelos, canteras y cursos de agua', (254, 253, 195), 30, 4)]),
    'recreacion': ('t20-004', 20, [('Zona de recreación', (30, 155, 70), 55, 6),
                                   ('Infraestructura gris', 'gris', 0, 10)]),
    'manejo': ('t22-004', 22, [('Naturalización', (75, 225, 210), 60, 8),
                               ('Enriquecimiento', (150, 82, 82), 45, 8),
                               ('Revegetación', (230, 195, 30), 70, 3)]),
    'nucleos': ('t23-004', 23, [('Núcleo de restauración nativa', (228, 30, 34), 75, 3)]),
}
BOSQUE = ('t15-004', 15, [('Bosque esclerófilo nativo', (36, 156, 60), 50, 10),
                          ('Bosque exótico', (226, 32, 34), 70, 10),
                          ('Bosque mixto', (254, 253, 192), 22, 10)])
LEYENDA15 = (1480, 180, 1980, 430)
ESCALA15 = 1500 / (529 - 84)  # m/px: barra gráfica de 1.500 m en la lámina 15  # x0, y0, x1, y1 del cuadro de leyenda de la lámina 15


def grilla(g):
    """Columnas/filas de la grilla → (x de 6.300.000, y de 347.500, metros por pixel)."""
    d = g < 110
    def picos(v):
        idx = np.where(v > .55)[0]; gr = []
        for i in idx:
            if gr and i - gr[-1][-1] <= 3: gr[-1].append(i)
            else: gr.append([i])
        return [float(np.mean(x)) for x in gr]
    c, r = picos(d.mean(0)), picos(d.mean(1))
    assert len(c) == 8 and len(r) == 6, (c, r)
    k = 7500 / (c[5] - c[2])
    assert abs((r[3] - r[2]) * k - 2500) < 25, 'grilla no cuadrada'
    return c[2], r[2], k


def contorno_parque(im):
    """Interior del parque: todo menos el fondo blanco y la sombra gris neutra que lo rodea (conectadas al exterior)."""
    f = im.astype(int)
    g = f.mean(2)
    neutro = (f.max(2) - f.min(2) < 8) & (g > 45)
    fondo = ((g > 250) | neutro).astype(np.uint8)
    # el marco, la grilla y el contorno negro se cruzan cerrando con un elemento más grande que su grosor
    fondo = cv2.morphologyEx(fondo, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fondo, connectivity=4)
    grandes = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > fondo.size * .01]
    ext = np.isin(lab, grandes).astype(np.uint8)
    ext = cv2.dilate(ext, np.ones((3, 3), np.uint8))  # se come el contorno negro
    dentro = 1 - ext
    n, lab, st, _ = cv2.connectedComponentsWithStats(dentro.astype(np.uint8), connectivity=4)
    ok = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > dentro.size * .0004
          and st[i, cv2.CC_STAT_AREA] > .05 * st[i, cv2.CC_STAT_WIDTH] * st[i, cv2.CC_STAT_HEIGHT]  # no el marco
          and max(st[i, 2], st[i, 3]) < 8 * min(st[i, 2], st[i, 3])]  # ni las barras de la regla del marco
    bn = (g > 235) | (g < 50)  # blanco o negro: la flecha del norte y rótulos, no el parque
    ok = [i for i in ok if bn[lab == i].mean() < .6]
    dentro = np.isin(lab, ok).astype(np.uint8)
    cs, _ = cv2.findContours(dentro, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(dentro, cs, -1, 1, -1)  # sin huecos (laderas en sombra muy oscuras)
    return dentro.astype(bool)


def poligonos(masc, a_mundo, amin):
    masc = cv2.morphologyEx(masc.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    masc = cv2.morphologyEx(masc, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    cs, jer = cv2.findContours(masc, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    if jer is None: return out
    for i, c in enumerate(cs):
        if jer[0][i][3] != -1 or cv2.contourArea(c) < amin: continue
        anillos = [c]
        j = jer[0][i][2]
        while j != -1:
            if cv2.contourArea(cs[j]) >= amin: anillos.append(cs[j])
            j = jer[0][j][0]
        geo = []
        for a in anillos:
            a = cv2.approxPolyDP(a, .8, True)[:, 0, :].astype(float)
            if len(a) < 3: continue
            p = [a_mundo(float(x), float(y)) for x, y in a]; p.append(p[0]); geo.append(p)
        if geo: out.append((geo, cv2.contourArea(c) - sum(cv2.contourArea(h) for h in anillos[1:])))
    return out


def clase_masc(im, rgb, tol):
    if rgb == 'gris':  # gris neutro claro (infraestructura)
        f = im.astype(int)
        return (f.max(2) - f.min(2) < 12) & (f.min(2) > 188) & (f.max(2) < 250)
    bgr = np.array(rgb[::-1], float)
    return np.linalg.norm(im.astype(float) - bgr, axis=2) < tol


def guardar(nombre, lamina, feats):
    gj = {'type': 'FeatureCollection', 'properties': {'fuente': FUENTE, 'lamina': lamina, 'capa': nombre}, 'features': feats}
    (RAIZ / 'assets' / 'geo' / f'acta_{nombre}.geojson').write_text(json.dumps(gj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def procesar(im, clases, a_mundo, m2px, dentro, nombre, lamina, control):
    feats, vis = [], im.copy()
    for clase, rgb, tol, amin in clases:
        m = clase_masc(im, rgb, tol) & dentro
        polys = poligonos(m, a_mundo, amin)
        ha = sum(a for _, a in polys) * m2px / 1e4
        print(f'  {nombre} · {clase}: {len(polys)} polígonos, {ha:.1f} ha')
        for geo, a in polys:
            feats.append({'type': 'Feature', 'properties': {'clase': clase, 'ha': round(a * m2px / 1e4, 2)},
                          'geometry': {'type': 'Polygon', 'coordinates': geo}})
        vis[m] = (255, 0, 255)
    guardar(nombre, lamina, feats)
    if control: cv2.imwrite(str(Path(control) / f'control_{nombre}.jpg'), vis)


def main(carpeta, control=None):
    ref = None
    for nombre, (img, lamina, clases) in LAMINAS.items():
        im = cv2.imread(str(Path(carpeta) / f'{img}.jpg'))
        x0, y0, k = grilla(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY))
        def a_mundo(x, y, x0=x0, y0=y0, k=k):
            lon, lat = A_GEO.transform(347500 + (y - y0) * k, 6300000 + (x - x0) * k)
            return [round(float(lon), 6), round(float(lat), 6)]
        dentro = contorno_parque(im)
        print(f'lámina {lamina}: {k:.2f} m/px, parque {dentro.sum() * k * k / 1e4:.0f} ha')
        procesar(im, clases, a_mundo, k * k, dentro, nombre, lamina, control)
        if nombre == 'manejo':
            ref = (dentro, x0, y0, k)
            polys = poligonos(dentro, a_mundo, 200)
            guardar('parque', lamina, [{'type': 'Feature', 'properties': {'clase': 'Parque Metropolitano de Santiago',
                     'ha': round(a * k * k / 1e4, 1)}, 'geometry': {'type': 'Polygon', 'coordinates': g}} for g, a in polys])
            print(f'  contorno del parque: {len(polys)} polígonos')
    # lámina 15: calce afín del contorno contra la lámina 22 (momentos + ECC)
    img, lamina, clases = BOSQUE
    im = cv2.imread(str(Path(carpeta) / f'{img}.jpg'))
    g15 = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    x0l, y0l, x1l, y1l = LEYENDA15
    dentro15 = np.ones(g15.shape, bool); dentro15[y0l:y1l, x0l:x1l] = False
    # contorno: como en las láminas con grilla, quitando calles y rótulos finos del mapa base
    parque15 = contorno_parque(im) & dentro15
    parque15 = cv2.morphologyEx(parque15.astype(np.uint8), cv2.MORPH_OPEN, np.ones((13, 13), np.uint8))
    dref, x0, y0, k = ref
    parque22 = dref.astype(np.uint8)
    # escala por la barra gráfica (0–1.500 m) y el norte a la derecha como en la 22: solo falta la traslación
    s = ESCALA15 / k
    a = parque15.astype(np.float32); b = parque22.astype(np.float32)
    ma, mb = cv2.moments(a, True), cv2.moments(b, True)
    M = np.array([[s, 0, mb['m10'] / mb['m00'] - s * ma['m10'] / ma['m00']],
                  [0, s, mb['m01'] / mb['m00'] - s * ma['m01'] / ma['m00']]], np.float32)
    bb = cv2.GaussianBlur(b, (0, 0), 6)
    for paso in (6, 2):
        aw = cv2.GaussianBlur(cv2.warpAffine(a, M, (b.shape[1], b.shape[0])), (0, 0), paso)
        mejor = None
        for dy in range(-40, 41, 2):
            for dx in range(-40, 41, 2):
                T = np.float32([[1, 0, dx], [0, 1, dy]])
                v = float((cv2.warpAffine(aw, T, (b.shape[1], b.shape[0])) * bb).sum())
                if mejor is None or v > mejor[0]: mejor = (v, dx, dy)
        M[0, 2] += mejor[1]; M[1, 2] += mejor[2]
    M = M.astype(np.float64)
    al = cv2.warpAffine(a, M.astype(np.float32), (b.shape[1], b.shape[0])) > .5
    iou = (al & dref).sum() / (al | dref).sum()
    print(f'lámina 15 calzada contra la 22: IoU contorno {iou:.3f}')
    def a_mundo15(x, y):
        X = M[0, 0] * x + M[0, 1] * y + M[0, 2]; Y = M[1, 0] * x + M[1, 1] * y + M[1, 2]
        lon, lat = A_GEO.transform(347500 + (Y - y0) * k, 6300000 + (X - x0) * k)
        return [round(float(lon), 6), round(float(lat), 6)]
    m2px = float(abs(np.linalg.det(M[:, :2]))) * k * k
    if control:
        v = np.dstack([parque22 * 255, al.astype(np.uint8) * 255, np.zeros_like(parque22)])
        cv2.imwrite(str(Path(control) / 'calce15.jpg'), v)
    procesar(im, clases, a_mundo15, m2px, dentro15, 'bosque', lamina, control)


if __name__ == '__main__':
    main(*sys.argv[1:])
