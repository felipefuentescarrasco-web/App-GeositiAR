"""Capas del parque desde OpenStreetMap (Overpass) → assets/geo/osm_*.geojson + imagen de control.

Senderos y caminos peatonales, ciclovías y rutas de bicicleta, cursos y cuerpos de agua, infraestructura
(baños, agua potable, estacionamientos, miradores, refugios, juegos, piscinas, teleférico/funicular) y el
límite del parque. Se corre en GitHub Actions (.github/workflows/osm.yml) porque necesita internet.
Uso: python tools/osm_capas.py
"""
import json, time, urllib.request, urllib.parse
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAL = RAIZ / 'assets' / 'geo'
# caja del cerro San Cristóbal y alrededores (sur, oeste, norte, este)
CAJA = (-33.4380, -70.6460, -33.4000, -70.5960)
UA = {'User-Agent': 'GeoParquemet-Geotours/1.0 (Sernageomin; app de geositios)'}
SERVIDORES = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

CONSULTAS = {
    'senderos': 'way["highway"~"^(path|footway|track|steps|bridleway|pedestrian)$"]',
    'ciclovias': 'way["highway"="cycleway"];way["bicycle"~"^(designated|yes)$"]["highway"~"^(path|track)$"];way["mtb:scale"]',
    'caminos': 'way["highway"~"^(service|unclassified|tertiary|residential|living_street)$"]',
    'agua': 'way["waterway"];way["natural"="water"];way["water"];way["man_made"="canal"]',
    'infraestructura': ('node["amenity"~"^(toilets|drinking_water|parking|shelter|restaurant|cafe|fountain)$"];'
                        'way["amenity"~"^(toilets|parking)$"];'
                        'node["tourism"~"^(viewpoint|information|picnic_site|attraction)$"];'
                        'way["leisure"~"^(swimming_pool|playground)$"];node["leisure"="playground"];'
                        'way["aerialway"];way["railway"="funicular"];node["aerialway"="station"]'),
    'limite': 'way["leisure"="park"]["name"~"Metropolitano"];relation["leisure"="park"]["name"~"Metropolitano"]',
}


def overpass(cuerpo):
    s, o, n, e = CAJA
    q = f'[out:json][timeout:90][bbox:{s},{o},{n},{e}];({cuerpo};);out tags geom;'
    for url in SERVIDORES:
        for intento in range(3):
            try:
                req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers=UA)
                with urllib.request.urlopen(req, timeout=120) as r:
                    return json.loads(r.read().decode())
            except Exception as ex:
                print('  reintento', url.split('/')[2], ex); time.sleep(5 + 10 * intento)
    raise SystemExit('Overpass no respondió')


def a_geojson(datos):
    feats = []
    for el in datos['elements']:
        tags = el.get('tags', {})
        props = {k: v for k, v in tags.items() if k in ('name', 'highway', 'surface', 'bicycle', 'mtb:scale', 'waterway',
                 'natural', 'amenity', 'tourism', 'leisure', 'aerialway', 'railway', 'access', 'intermittent', 'sac_scale')}
        props['osm'] = f"{el['type']}/{el['id']}"
        if el['type'] == 'node':
            g = {'type': 'Point', 'coordinates': [round(el['lon'], 6), round(el['lat'], 6)]}
        elif el['type'] == 'way' and el.get('geometry'):
            c = [[round(p['lon'], 6), round(p['lat'], 6)] for p in el['geometry']]
            cerrado = len(c) > 3 and c[0] == c[-1] and (tags.get('natural') == 'water' or 'leisure' in tags or tags.get('amenity') == 'parking')
            g = {'type': 'Polygon', 'coordinates': [c]} if cerrado else {'type': 'LineString', 'coordinates': c}
        elif el['type'] == 'relation':
            anillos = [[[round(p['lon'], 6), round(p['lat'], 6)] for p in m['geometry']]
                       for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
            if not anillos: continue
            g = {'type': 'MultiLineString', 'coordinates': anillos}
        else:
            continue
        feats.append({'type': 'Feature', 'properties': props, 'geometry': g})
    return {'type': 'FeatureCollection', 'features': feats}


def main():
    SAL.mkdir(parents=True, exist_ok=True)
    capas = {}
    for nombre, cuerpo in CONSULTAS.items():
        gj = a_geojson(overpass(cuerpo))
        gj['properties'] = {'fuente': '© colaboradores de OpenStreetMap (ODbL)', 'capa': nombre}
        (SAL / f'osm_{nombre}.geojson').write_text(json.dumps(gj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        capas[nombre] = gj
        print(nombre, len(gj['features']), 'elementos'); time.sleep(3)
    # imagen de control
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    estilo = {'caminos': ('#bbbbbb', 1.2), 'senderos': ('#8a5a2b', .9), 'ciclovias': ('#1f6fd1', 1.6), 'agua': ('#2aa0c8', 1.4),
              'limite': ('#2f6f5e', 2.2), 'infraestructura': ('#c1622f', 1)}
    fig, ax = plt.subplots(figsize=(10, 10), dpi=130)
    for nombre in ('caminos', 'limite', 'agua', 'senderos', 'ciclovias', 'infraestructura'):
        col, lw = estilo[nombre]
        for f in capas[nombre]['features']:
            g = f['geometry']
            if g['type'] == 'Point': ax.plot(*g['coordinates'], 'o', ms=3, color=col)
            else:
                lineas = g['coordinates'] if g['type'] in ('MultiLineString', 'Polygon') else [g['coordinates']]
                for l in lineas: ax.plot([p[0] for p in l], [p[1] for p in l], color=col, lw=lw)
    s, o, n, e = CAJA
    ax.set_xlim(o, e); ax.set_ylim(s, n); ax.set_aspect(1 / .834)
    ax.set_title('Capas de OpenStreetMap: senderos (café), ciclovías (azul), agua (celeste), infraestructura (naranjo)')
    d = RAIZ / 'tools' / '_osm'; d.mkdir(exist_ok=True); fig.savefig(d / 'control.png', bbox_inches='tight')


if __name__ == '__main__':
    main()
