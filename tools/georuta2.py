"""Calcula el trazado de la Georuta 2 por los caminos del parque y lo deja en assets/geo/georuta2.geojson.

No hay trazado oficial de la Georuta 2 (de la 1 sí: Georuta1_v2). Se pide a OSRM (perfil a pie, sobre
OpenStreetMap) la ruta que pasa por sus geositios en orden, y se guarda una imagen de control
(tools/_georuta2/control.png) con los caminos de OpenStreetMap, la ruta y los geositios, para revisar que
no corte por donde no hay camino. Se corre en GitHub Actions (.github/workflows/georuta2.yml) porque
necesita salida a internet. Cuando exista el trazado oficial, se reemplaza el geojson y listo.
Uso: python tools/georuta2.py
"""
import json, re, sys, urllib.request, urllib.parse
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'GeoParquemet-Geotours/1.0 (Sernageomin; app de geositios)'}


def leer(url, datos=None):
    req = urllib.request.Request(url, data=datos, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


def geositios():
    src = (RAIZ / 'js' / 'datos.js').read_text(encoding='utf-8')
    ruta = re.search(r"id: 'r2'.*?geositios: \[([^\]]+)\]", src, re.S).group(1)
    ids = re.findall(r"'(\w+)'", ruta)
    pts = []
    for i in ids:
        m = re.search(r"id: '%s'.*?lat: (-?[\d.]+), lon: (-?[\d.]+)" % i, src, re.S)
        pts.append((i, float(m.group(1)), float(m.group(2))))
    return pts


def main():
    pts = geositios()
    print('Georuta 2:', [p[0] for p in pts])
    coords = ';'.join(f'{lon:.6f},{lat:.6f}' for _, lat, lon in pts)
    servidores = [
        f'https://routing.openstreetmap.de/routed-foot/route/v1/foot/{coords}?overview=full&geometries=geojson&steps=false',
        f'https://router.project-osrm.org/route/v1/foot/{coords}?overview=full&geometries=geojson&steps=false',
    ]
    ruta = None
    for url in servidores:
        try:
            d = leer(url)
            if d.get('routes'):
                ruta = d['routes'][0]; print('ruta de', url.split('/')[2], round(ruta['distance']), 'm'); break
        except Exception as e:
            print('falló', url.split('/')[2], e)
    if not ruta:
        sys.exit('no se pudo calcular la ruta')
    linea = [[round(x, 6), round(y, 6)] for x, y in ruta['geometry']['coordinates']]
    salida = {'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'properties': {
        'ruta': 'r2', 'distancia_m': round(ruta['distance']),
        'fuente': 'Calculada a pie por caminos de OpenStreetMap (OSRM) entre los geositios; no es el trazado oficial'},
        'geometry': {'type': 'LineString', 'coordinates': linea}}]}
    (RAIZ / 'assets' / 'geo' / 'georuta2.geojson').write_text(json.dumps(salida, separators=(',', ':')), encoding='utf-8')

    # imagen de control: caminos de OpenStreetMap del sector, la ruta calculada, la Georuta 1 y los geositios
    lats = [p[1] for p in pts] + [y for x, y in linea]; lons = [p[2] for p in pts] + [x for x, y in linea]
    s, n, o, e = min(lats) - .003, max(lats) + .003, min(lons) - .003, max(lons) + .003
    q = f'[out:json][timeout:60];way["highway"]({s},{o},{n},{e});out geom;'
    try:
        osm = leer('https://overpass-api.de/api/interpreter', urllib.parse.urlencode({'data': q}).encode())
    except Exception as ex:
        print('sin caminos de Overpass:', ex); osm = {'elements': []}
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(9, 9), dpi=130)
    for w in osm['elements']:
        g = w.get('geometry') or []
        tipo = w.get('tags', {}).get('highway', '')
        ancho = 1.6 if tipo in ('tertiary', 'secondary', 'unclassified', 'residential', 'service') else .8
        ax.plot([p['lon'] for p in g], [p['lat'] for p in g], color='#999', lw=ancho, zorder=1)
    r1 = json.loads((RAIZ / 'assets' / 'geo' / 'georuta1.geojson').read_text())['features'][0]['geometry']['coordinates']
    ax.plot([x for x, y in r1], [y for x, y in r1], color='#c1622f', lw=2.5, zorder=2, label='Georuta 1 (oficial)')
    ax.plot([x for x, y in linea], [y for x, y in linea], color='#2f6f5e', lw=3, zorder=3, label='Georuta 2 (calculada)')
    for i, lat, lon in pts:
        ax.scatter([lon], [lat], s=160, color='#2f6f5e', edgecolor='white', zorder=4)
        ax.annotate(i.replace('GPM', ''), (lon, lat), color='white', ha='center', va='center', fontsize=8, weight='bold', zorder=5)
    ax.set_aspect(1 / .834); ax.set_xlim(o, e); ax.set_ylim(s, n); ax.legend(loc='lower left')
    ax.set_title(f'Georuta 2 calculada por caminos de OSM: {round(ruta["distance"])} m')
    d = RAIZ / 'tools' / '_georuta2'; d.mkdir(exist_ok=True)
    fig.savefig(d / 'control.png', bbox_inches='tight')
    print('listo')


if __name__ == '__main__':
    main()
