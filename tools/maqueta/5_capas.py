"""Capas de información para pegar sobre el modelo 3D de la maqueta → assets/3d/maqueta_capas/*.png.

Cada capa es una imagen con transparencia en el marco de la vista cenital del GLB (x de -1 a 1, z de
-zmax a zmax, igual que la dibuja el visor). La posición de cada elemento sale de la georreferencia
(tools/maqueta/georref.py → georref.json). Los colores son los mismos del mapa (js/mapa.js).
Uso: python tools/maqueta/5_capas.py
"""
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pyproj import Transformer
sys.path.insert(0, str(Path(__file__).parent))
import glb

RAIZ = Path(__file__).resolve().parent.parent.parent
GEO = RAIZ / 'assets' / 'geo'
SAL = RAIZ / 'assets' / '3d' / 'maqueta_capas'
ANCHO = 2048


def color_geol(c):
    c = re.sub(r'\s', '', c or '')
    if c.startswith('OlMa'): return '#a0603f' if re.search('UcC|UcB', c) else '#c98a5a'
    if c.startswith('Mh'): return '#c0504d'
    if c.startswith('Plamo') or 'Mapocho' in c: return '#d9cf8e'
    if c.startswith(('Hf', 'Plfa')): return '#e8d9a6'
    if re.match('PlH[cl]', c): return '#e3b36b'
    if c.startswith('PlHrm'): return '#d98c5f'
    if re.match('(?i)Ha|PlHm', c): return '#b3b3b3'
    return '#999999'


C_ACTA = {'Alto valor ecológico (bosque esclerófilo)': '#e0242a', 'Especies en categoría de conservación': '#2476be',
          'Árboles patrimoniales': '#28aa46', 'Naturalización': '#4be1d2', 'Enriquecimiento': '#965252',
          'Revegetación': '#e6c31e', 'Bosque esclerófilo nativo': '#249c3c', 'Bosque exótico': '#e22022', 'Bosque mixto': '#f0e68c'}


def rgba(h, a):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (int(a * 255),)


def main():
    _, pos, *_ = glb.leer(RAIZ / 'assets' / '3d' / 'maqueta.glb')
    zmax = float(np.abs(pos[:, 2]).max())
    alto = round(ANCHO * zmax)
    A = np.array(json.loads((Path(__file__).parent / 'georref.json').read_text())['modelo_a_utm'])
    B = np.linalg.inv(np.vstack([A, [0, 0, 1]]))
    T = Transformer.from_crs('EPSG:4326', 'EPSG:31979', always_xy=True)

    def px(c):
        c = np.asarray(c, float)[:, :2]
        E, N = T.transform(c[:, 0], c[:, 1])
        x = B[0, 0] * E + B[0, 1] * N + B[0, 2]; z = B[1, 0] * E + B[1, 1] * N + B[1, 2]
        return list(zip(((x + 1) / 2 * (ANCHO - 1)).tolist(), ((z + zmax) / (2 * zmax) * (alto - 1)).tolist()))

    def geojson(n): return json.loads((GEO / f'{n}.geojson').read_text(encoding='utf-8'))['features']

    def anillos(g):
        t = g['type']; c = g['coordinates']
        if t == 'Polygon': return [c]
        if t == 'MultiPolygon': return c
        return []

    def lineas(g):
        t = g['type']; c = g['coordinates']
        if t == 'LineString': return [c]
        if t in ('MultiLineString', 'Polygon'): return c
        if t == 'MultiPolygon': return [r for p in c for r in p]
        if t == 'GeometryCollection': return [l for x in g['geometries'] for l in lineas(x)]
        return []

    def nueva(): return Image.new('RGBA', (ANCHO, alto), (0, 0, 0, 0))

    def poligonos(d, feats, color, a=.62, borde=(40, 30, 25, 200)):
        for f in feats:
            col = color(f)
            for pol in anillos(f['geometry']):
                capa = nueva(); dc = ImageDraw.Draw(capa)
                dc.polygon(px(pol[0]), fill=rgba(col, a))
                for h in pol[1:]: dc.polygon(px(h), fill=(0, 0, 0, 0))
                d['img'].alpha_composite(capa)
                for r in pol: ImageDraw.Draw(d['img']).line(px(r) + [px(r)[0]], fill=borde, width=2)

    # solo sobre el relieve: el marco y los rótulos del borde quedan limpios (INTERIOR de georref.py, en 1200 px)
    from georref import INTERIOR
    k = ANCHO / 1200
    marco = Image.new('L', (ANCHO, alto), 0)
    ImageDraw.Draw(marco).rectangle((INTERIOR[2] * k, INTERIOR[0] * k, INTERIOR[3] * k, INTERIOR[1] * k), fill=255)

    def guardar(nombre, img):
        SAL.mkdir(parents=True, exist_ok=True)
        a = np.asarray(img.getchannel('A'), np.uint16) * np.asarray(marco, np.uint16) // 255
        img.putalpha(Image.fromarray(a.astype(np.uint8)))
        img.save(SAL / f'{nombre}.png', optimize=True)
        print(nombre, round((SAL / f'{nombre}.png').stat().st_size / 1024), 'KB')

    fuente = None
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'):
        if Path(f).exists(): fuente = ImageFont.truetype(f, 22); break
    fuente = fuente or ImageFont.load_default()

    # geología
    d = {'img': nueva()}
    poligonos(d, geojson('geologia_sernageomin'), lambda f: color_geol(f['properties']['codigo']), .6)
    guardar('geologia', d['img'])

    # georutas, geositios y paradas
    img = nueva(); dr = ImageDraw.Draw(img)
    for n, col in (('georuta1', '#c1622f'), ('georuta2', '#2f6f5e')):
        for f in geojson(n):
            for l in lineas(f['geometry']):
                dr.line(px(l), fill=(255, 255, 255, 230), width=11, joint='curve')
                dr.line(px(l), fill=rgba(col, 1), width=7, joint='curve')
    puntos = json.loads((Path(__file__).parent / '_puntos_app.json').read_text(encoding='utf-8'))
    for p in puntos:
        (x, y), = px([[p['lon'], p['lat']]])
        r = 15 if p['tipo'] == 'geositio' else 12
        col = {'geositio': '#c1622f', 'mirador': '#2f7fb5', 'maqueta': '#7b6bb0'}.get(p['tipo'], '#d8c08a')
        dr.ellipse((x - r, y - r, x + r, y + r), fill=rgba(col, 1), outline=(255, 255, 255, 255), width=3)
        if p.get('rotulo'): dr.text((x, y), p['rotulo'], font=fuente, fill='white', anchor='mm')
    guardar('georutas', img)

    # límite del parque
    img = nueva(); dr = ImageDraw.Draw(img)
    for f in geojson('acta_parque'):
        for l in lineas(f['geometry']): dr.line(px(l) + [px(l)[0]], fill=(255, 255, 255, 240), width=9)
        for l in lineas(f['geometry']): dr.line(px(l) + [px(l)[0]], fill=rgba('#2f6f5e', 1), width=5)
    guardar('limite', img)

    # senderos, ciclovías y agua
    img = nueva(); dr = ImageDraw.Draw(img)
    for n, col, w in (('osm_agua', '#2aa0c8', 5), ('osm_senderos', '#7a4a1e', 3), ('osm_ciclovias', '#1f6fd1', 5)):
        for f in geojson(n):
            g = f['geometry']
            if g['type'] in ('Point', 'MultiPoint'): continue
            if g['type'] in ('Polygon', 'MultiPolygon') and n == 'osm_agua':
                for pol in anillos(g): dr.polygon(px(pol[0]), fill=rgba('#7fd0ea', .8))
            for l in lineas(g):
                if len(l) > 1: dr.line(px(l), fill=rgba(col, .95), width=w, joint='curve')
    guardar('senderos', img)

    # plan de manejo del acta
    for nombre, archivo in (('bosques', 'acta_bosque'), ('conservacion', 'acta_conservacion'), ('rehabilitacion', 'acta_manejo')):
        d = {'img': nueva()}
        poligonos(d, geojson(archivo), lambda f: C_ACTA.get(f['properties']['clase'], '#999999'), .62, (30, 30, 30, 160))
        guardar(nombre, d['img'])


if __name__ == '__main__':
    main()
