"""Shapefiles de la carpeta SIG del proyecto (Shp.rar) → GeoJSON en WGS84 para el mapa.

Uso: python tools/sig/shp_a_geojson.py <carpeta Shp descomprimida>
Escribe assets/geo/geologia_sernageomin.geojson, georuta1_oficial.geojson, georuta2_oficial.geojson
y tools/sig/_puntos_shp.json (puntos de las georutas del 21-01-2020, para revisar los geositios).
"""
import sys, json, re, unicodedata
from pathlib import Path
import shapefile
from pyproj import CRS, Transformer

RAIZ = Path(__file__).resolve().parents[2]
ENT = Path(sys.argv[1])


def transformador(shp):
    prj = Path(str(shp)[:-4] + '.prj')
    crs = CRS.from_wkt(prj.read_text()) if prj.exists() else CRS.from_epsg(31979)   # SIRGAS 2000 / UTM 19S
    return Transformer.from_crs(crs, 4326, always_xy=True)


def leer(shp, enc='utf-8'):
    return shapefile.Reader(str(shp), encoding=enc, encodingErrors='replace')


def pares(r):
    """(forma, registro) uno a uno, saltando las formas vacías (Geologia_Parquemet trae una)."""
    for i in range(len(r)):
        try:
            sh = r.shape(i)
        except shapefile.ShapefileException:
            print('  forma vacía, se omite:', i); continue
        if sh.points: yield sh, r.record(i)


def geom(sh, tr):
    pts = [tr.transform(x, y) for x, y in sh.points]
    pts = [[round(x, 6), round(y, 6)] for x, y in pts]
    partes = list(sh.parts) + [len(pts)]
    anillos = [pts[partes[i]:partes[i + 1]] for i in range(len(partes) - 1)]
    t = sh.shapeTypeName
    if t.startswith('POLYGON'):
        return {'type': 'Polygon', 'coordinates': anillos} if len(anillos) == 1 else {'type': 'MultiPolygon', 'coordinates': [[a] for a in anillos]}
    if t.startswith('POLYLINE'):
        return {'type': 'LineString', 'coordinates': anillos[0]} if len(anillos) == 1 else {'type': 'MultiLineString', 'coordinates': anillos}
    return {'type': 'Point', 'coordinates': pts[0]}


def limpio(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()


def escribir(nombre, feats, props=None):
    gj = {'type': 'FeatureCollection', 'properties': props or {}, 'features': feats}
    (RAIZ / 'assets' / 'geo' / nombre).write_text(json.dumps(gj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(nombre, len(feats))


# geología
r = leer(ENT / 'Geologia_Parquemet.shp'); tr = transformador(ENT / 'Geologia_Parquemet.shp')
campos = [f[0] for f in r.fields[1:]]
feats = []
for sh, rec in pares(r):
    d = dict(zip(campos, rec))
    feats.append({'type': 'Feature', 'properties': {'codigo': limpio(d.get('Codigo')), 'unidad': limpio(d.get('Descripcio'))}, 'geometry': geom(sh, tr)})
escribir('geologia_sernageomin.geojson', feats, {'fuente': 'Geologia_Parquemet.shp, proyecto GEOPARQUEMET, Sernageomin (2020)'})

# georutas oficiales (trazados KML convertidos a shp, en WGS84)
for n in (1, 2):
    shp = ENT / f'Georuta{n}.shp'; r = leer(shp); tr = transformador(shp)
    feats = [{'type': 'Feature', 'properties': {'ruta': f'r{n}', 'fuente': f'Georuta{n}.shp (Georuta {n}.kml), proyecto GEOPARQUEMET'},
              'geometry': geom(sh, tr)} for sh, _ in pares(r)]
    escribir(f'georuta{n}_oficial.geojson', feats)

# puntos de las georutas (versión 21-01-2020)
puntos = []
for nombre in ('PioNono-Tupahue-21012020', 'Cumbre-Tupahue-21012020'):
    shp = ENT / f'{nombre}.shp'; r = leer(shp); tr = transformador(shp)
    campos = [f[0] for f in r.fields[1:]]
    for sh, rec in pares(r):
        d = dict(zip(campos, rec)); lon, lat = tr.transform(*sh.points[0])
        puntos.append({'capa': nombre, 'categoria': limpio(d.get('CATEGORIA')), 'nombre': limpio(d.get('NOMBRE')),
                       'id_punto': limpio(d.get('ID_PUNTO')), 'lat': round(lat, 6), 'lon': round(lon, 6),
                       'elev': round(float(d.get('ELEVACION') or 0), 1), 'desc': limpio(d.get('DESCRIPCIO', ''))[:200]})
(RAIZ / 'tools' / 'sig' / '_puntos_shp.json').write_text(json.dumps(puntos, ensure_ascii=False, indent=1), encoding='utf-8')
print('puntos', len(puntos))
