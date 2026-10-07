/* Mapa con Leaflet (js/vendor/leaflet/), como en la app de Carlos Venegas.

   Fondos: satélite (Esri World Imagery), satélite 2020 (SkySat 1 m de la carpeta SIG, teselas
   propias en assets/teselas/skysat, sobre Esri), calles (OpenStreetMap) y topográfico (OpenTopoMap).
   Capas: georutas, geología (Geologia_Parquemet.shp, Sernageomin), senderos, ciclovías, agua e
   infraestructura (OpenStreetMap, recortadas al parque) y las zonas del plan de manejo del acta de
   Restauración Ladera (24.09.2026), digitalizadas de sus láminas (tools/sig/acta_capas.py).
   Las teselas que se ven quedan guardadas por el service worker, y
   App.descargarTodo() baja las del recorrido para usarlas sin señal.

   Georutas:
     - Georuta 1: trazado real (assets/geo/georuta1.geojson, de la capa
       Georuta1_v2 de ArcGIS Online de la Unidad de Geopatrimonio).
     - Georuta 2: trazado oficial (Georuta2.shp de la carpeta SIG). Si faltara el archivo,
       se calcula a pie por los caminos de OpenStreetMap (OSRM) y si no, punteada. */

const Mapa = (() => {

  const FONDOS = {
    satelite: {
      nombre: 'Satélite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      opciones: { maxNativeZoom: 19, attribution: 'Imagen © Esri, Maxar, Earthstar Geographics' }
    },
    skysat: {
      nombre: 'Satélite 2020 (SkySat)',
      url: 'assets/teselas/skysat/{z}/{x}/{y}.jpg',
      sobre: 'satelite',   // fuera del parque se ve el satélite de Esri
      opciones: { minNativeZoom: 13, maxNativeZoom: 17, bounds: [[-33.434, -70.645], [-33.359, -70.593]],
        attribution: 'Imagen SkySat 22-05-2020 (Planet) · Sernageomin' }
    },
    calles: {
      nombre: 'Calles',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      opciones: { maxNativeZoom: 19, attribution: '© colaboradores de OpenStreetMap' }
    },
    topo: {
      nombre: 'Topográfico',
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      opciones: { maxNativeZoom: 17, attribution: '© OpenStreetMap · estilo © OpenTopoMap (CC-BY-SA)' }
    }
  };
  const CLAVE_FONDO = 'geoparquemet:mapa-fondo';
  const CLAVE_RUTA2 = 'geoparquemet:georuta2-osm';

  /* Geología: color por familia del código de la unidad */
  function colorGeol(codigo) {
    const c = (codigo || '').replace(/\s/g, '');
    if (/^OlMa/i.test(c)) return /UcC|UcB/.test(c) ? '#a0603f' : '#c98a5a';   // Fm. Abanico: lavas / piroclastos
    if (/^Mh/.test(c)) return '#c0504d';                                         // intrusivo porfídico
    if (/^Plamo|Mapocho/.test(c)) return '#d9cf8e';                             // río y depósitos del Mapocho
    if (/^Hf|^Plfa/.test(c)) return '#e8d9a6';                                   // fluviales
    if (/^PlH[cl]/.test(c)) return '#e3b36b';                                    // coluviales
    if (/^PlHrm/.test(c)) return '#d98c5f';                                      // remoción en masa
    if (/^Ha|^PlHm/i.test(c)) return '#b3b3b3';                                  // antrópicos
    return '#999';
  }

  /* Capas temáticas: archivo, estilo y texto del popup */
  const C_ACTA = { 'Alto valor ecológico (bosque esclerófilo)': '#e0242a', 'Especies en categoría de conservación': '#2476be',
    'Árboles patrimoniales': '#28aa46', 'Protección de suelos, canteras y cursos de agua': '#f2e27a', 'Zona de recreación': '#1f9b46',
    'Infraestructura gris': '#8c8c8c', 'Naturalización': '#4be1d2', 'Enriquecimiento': '#965252', 'Revegetación': '#e6c31e',
    'Núcleo de restauración nativa': '#e0242a', 'Bosque esclerófilo nativo': '#249c3c', 'Bosque exótico': '#e22022', 'Bosque mixto': '#f0e68c' };
  const ACTA = [
    ['Plan Parquemet: tipos de bosque', 'acta_bosque'],
    ['Plan Parquemet: conservación', 'acta_conservacion'],
    ['Plan Parquemet: protección', 'acta_proteccion'],
    ['Plan Parquemet: recreación e infraestructura', 'acta_recreacion'],
    ['Plan Parquemet: rehabilitación ambiental', 'acta_manejo'],
    ['Plan Parquemet: núcleos de restauración', 'acta_nucleos']
  ];
  const INFRA = { toilets: 'Baños', drinking_water: 'Agua potable', parking: 'Estacionamiento', shelter: 'Refugio',
    restaurant: 'Restaurante', cafe: 'Café', fountain: 'Pileta', viewpoint: 'Mirador', information: 'Información',
    picnic_site: 'Zona de picnic', attraction: 'Atractivo', playground: 'Juegos infantiles', swimming_pool: 'Piscina',
    station: 'Estación', funicular: 'Funicular' };

  function capaGeoJSON(archivo, opciones) {
    const grupo = L.layerGroup();
    let cargada = false;
    grupo.on('add', () => {
      if (cargada) return;
      cargada = true;
      fetch(archivo).then(r => r.json()).then(gj => L.geoJSON(gj, opciones).addTo(grupo))
        .catch(() => { cargada = false; });
    });
    return grupo;
  }

  const popup = (titulo, lineas) => U.el('div', { clase: 'popup-geol' },
    [U.el('b', { texto: titulo })].concat(lineas.filter(Boolean).map(t => U.el('div', { clase: 'pequeno', texto: t }))));

  /* ---------------------------------------------------- georutas */

  const rutaEnOrden = id => U.geositiosDeRuta(id).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));

  /* Trazado de una georuta: [[lat, lon], ...] y si es oficial. Promesa. */
  function trazado(r) {
    const archivo = r.id === 'r1' ? 'assets/geo/georuta1.geojson' : 'assets/geo/georuta2.geojson';
    return fetch(archivo)
      .then(res => { if (!res.ok) throw new Error('sin archivo'); return res.json(); })
      .then(gj => {
        /* el trazado calculado por tools/georuta2.py lo dice en "fuente": se rotula como tal */
        const f = gj.features ? gj.features[0] : gj;
        const calculado = /OpenStreetMap/.test((f.properties && f.properties.fuente) || '');
        return { puntos: lineaDe(gj), oficial: !calculado };
      })
      .catch(() => r.id === 'r2' ? trazadoOSM(r) : null)
      .then(t => t || { puntos: rutaEnOrden(r.id).map(g => [g.lat, g.lon]), oficial: false, recta: true });
  }

  function lineaDe(gj) {
    const f = gj.features ? gj.features[0] : gj;
    const g = f.geometry || f;
    const c = g.type === 'MultiLineString' ? [].concat(...g.coordinates) : g.coordinates;
    return c.map(p => [p[1], p[0]]);
  }

  /* Ruta a pie por los caminos de OpenStreetMap, guardada en el teléfono. */
  function trazadoOSM(r) {
    const geos = rutaEnOrden(r.id);
    const firma = geos.map(g => g.id).join(',');
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_RUTA2));
      if (g && g.firma === firma && g.puntos && g.puntos.length > 1) return Promise.resolve({ puntos: g.puntos, oficial: false });
    } catch (e) { /* se vuelve a calcular */ }
    if (!navigator.onLine) return Promise.resolve(null);
    const pts = geos.map(g => g.lon.toFixed(6) + ',' + g.lat.toFixed(6)).join(';');
    const url = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/' + pts + '?overview=full&geometries=geojson';
    return fetch(url)
      .then(res => res.json())
      .then(d => {
        if (!d.routes || !d.routes[0]) return null;
        const puntos = d.routes[0].geometry.coordinates.map(p => [+p[1].toFixed(6), +p[0].toFixed(6)]);
        try { localStorage.setItem(CLAVE_RUTA2, JSON.stringify({ firma, puntos })); } catch (e) { /* sin espacio */ }
        return { puntos, oficial: false };
      })
      .catch(() => null);
  }

  /* -------------------------------------------------------- mapa */

  function crear(contenedor, opciones) {
    opciones = opciones || {};
    const div = U.el('div', { clase: 'lienzo-mapa' });
    contenedor.appendChild(div);

    const mapa = L.map(div, { zoomControl: false, attributionControl: true, maxZoom: 20, minZoom: 12 });
    mapa.attributionControl.setPrefix(false);

    let elegido = 'satelite';
    try { const f = JSON.parse(localStorage.getItem(CLAVE_FONDO)); if (FONDOS[f]) elegido = f; } catch (e) { /* por defecto */ }
    const fondos = {};
    const teselas = k => L.tileLayer(FONDOS[k].url, Object.assign({ maxZoom: 20, crossOrigin: true }, FONDOS[k].opciones));
    Object.keys(FONDOS).forEach(k => {
      const capa = FONDOS[k].sobre ? L.layerGroup([teselas(FONDOS[k].sobre), teselas(k)]) : teselas(k);
      capa._clave = k;
      fondos[FONDOS[k].nombre] = capa;
    });
    fondos[FONDOS[elegido].nombre].addTo(mapa);
    mapa.on('baselayerchange', e => { try { localStorage.setItem(CLAVE_FONDO, JSON.stringify(e.layer._clave)); } catch (er) { /* nada */ } });

    /* georutas */
    const capaRutas = L.layerGroup().addTo(mapa);
    RUTAS.forEach(r => {
      trazado(r).then(t => {
        if (!t || t.puntos.length < 2) return;
        L.polyline(t.puntos, { color: '#000', weight: 8, opacity: .35, interactive: false }).addTo(capaRutas);
        L.polyline(t.puntos, {
          color: r.color, weight: 5, opacity: .95, dashArray: t.recta ? '8 10' : null, lineJoin: 'round'
        }).bindTooltip(r.nombre + (t.oficial ? '' : t.recta ? ' · trazado aproximado' : ' · trazado por caminos de OpenStreetMap'), { sticky: true })
          .addTo(capaRutas);
      });
    });

    /* unidades geológicas (Geologia_Parquemet.shp, Sernageomin) */
    const capaGeol = capaGeoJSON('assets/geo/geologia_sernageomin.geojson', {
      style: f => ({ color: '#5a4636', weight: .8, fillColor: colorGeol(f.properties.codigo), fillOpacity: .5 }),
      onEachFeature: (f, c) => c.bindPopup(popup(f.properties.unidad, [f.properties.codigo, 'Fuente: Sernageomin']))
    });

    /* OpenStreetMap, recortado al parque */
    const tip = (a, b) => U.el('div', {}, [U.el('b', { texto: a }), U.el('div', { clase: 'pequeno', texto: b || 'OpenStreetMap' })]);
    const capaSenderos = capaGeoJSON('assets/geo/osm_senderos.geojson', {
      style: f => ({ color: '#7a4a1e', weight: 2, opacity: .9, dashArray: f.properties.highway === 'steps' ? '2 4' : '5 4' }),
      onEachFeature: (f, c) => c.bindTooltip(tip(f.properties.name || 'Sendero'), { sticky: true })
    });
    const capaCiclo = capaGeoJSON('assets/geo/osm_ciclovias.geojson', {
      style: { color: '#1f6fd1', weight: 3, opacity: .9 },
      onEachFeature: (f, c) => c.bindTooltip(tip(f.properties.name || 'Ciclovía / ruta de bicicleta'), { sticky: true })
    });
    const capaAgua = capaGeoJSON('assets/geo/osm_agua.geojson', {
      style: { color: '#2aa0c8', weight: 2, fillColor: '#7fd0ea', fillOpacity: .6 },
      onEachFeature: (f, c) => c.bindTooltip(tip(f.properties.name || 'Curso o cuerpo de agua'), { sticky: true })
    });
    const capaInfra = capaGeoJSON('assets/geo/osm_infraestructura.geojson', {
      pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 5, color: '#fff', weight: 1.5, fillColor: '#c1622f', fillOpacity: 1 }),
      style: { color: '#c1622f', weight: 2, fillOpacity: .25 },
      onEachFeature: (f, c) => {
        const p = f.properties;
        const tipo = INFRA[p.amenity || p.tourism || p.leisure || p.aerialway || p.railway] || 'Infraestructura';
        c.bindTooltip(p.name ? tip(p.name, tipo) : tip(tipo));
      }
    });
    const capaLimite = capaGeoJSON('assets/geo/acta_parque.geojson', {
      style: { color: '#2f6f5e', weight: 2.5, fill: false, dashArray: '6 4' }, interactive: false
    });

    /* plan de manejo (acta de Restauración Ladera) */
    const capasActa = {};
    ACTA.forEach(([nombre, archivo]) => {
      capasActa[nombre] = capaGeoJSON('assets/geo/' + archivo + '.geojson', {
        style: f => ({ color: '#333', weight: .6, fillColor: C_ACTA[f.properties.clase] || '#999', fillOpacity: .6 }),
        onEachFeature: (f, c) => c.bindPopup(popup(f.properties.clase, [f.properties.ha ? f.properties.ha + ' ha' : '',
          'Acta Participación Ciudadana – Restauración Ladera (24.09.2026)', 'Digitalizado de la lámina: aproximado.']))
      });
    });

    L.control.layers(fondos, Object.assign({
      'Georutas': capaRutas, 'Límite del parque': capaLimite, 'Geología': capaGeol, 'Senderos': capaSenderos,
      'Ciclovías': capaCiclo, 'Agua': capaAgua, 'Infraestructura': capaInfra
    }, capasActa), { position: 'topright', collapsed: true }).addTo(mapa);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(mapa);

    /* geositios y otros puntos */
    const marcadores = [];
    let seleccionado = null;
    function icono(p, sel) {
      const esG = p.tipo === 'geositio', esP = p.tipo === 'parada', esM = p.tipo === 'mirador';
      const color = esG ? (U.visitado(p.dato.id) ? '#4f9d7e' : '#c1622f') : esP ? '#7b6bb0' : esM ? '#2f7fb5' : '#d8c08a';
      const tam = sel ? 34 : esG || esP ? 28 : esM ? 24 : 18;
      return L.divIcon({
        className: 'marca-mapa' + (sel ? ' sel' : ''),
        html: '<span style="background:' + color + ';width:' + tam + 'px;height:' + tam + 'px">' + (esG ? p.dato.num : esP ? '3D' : esM ? '&#9673;' : '') + '</span>',
        iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2]
      });
    }
    function seleccionar(p) {
      seleccionado = p;
      marcadores.forEach(m => m.setIcon(icono(m._punto, m._punto === p)));
      if (opciones.alSeleccionar) opciones.alSeleccionar(p);
    }
    mapa.on('click', () => { if (seleccionado) seleccionar(null); });

    /* posición del teléfono */
    let marcaPos = null, circuloPos = null;

    /* Leaflet necesita saber cuándo cambia el tamaño del contenedor. La vista se monta antes de
       insertarse en la página: el encuadre pedido se aplica cuando el mapa ya tiene tamaño. */
    let encuadrePendiente = null;
    function aplicarEncuadre(lista) {
      const b = L.latLngBounds(lista.map(g => [g.lat, g.lon]));
      mapa.fitBounds(b.pad(.15), { maxZoom: 17, animate: false });
    }
    const observador = new ResizeObserver(() => {
      mapa.invalidateSize();
      if (encuadrePendiente && div.clientWidth && div.clientHeight) { aplicarEncuadre(encuadrePendiente); encuadrePendiente = null; }
    });
    observador.observe(contenedor);

    return {
      agregar(lat, lon, tipo, dato) {
        const p = { lat, lon, tipo, dato };
        const m = L.marker([lat, lon], { icon: icono(p, false), keyboard: true, title: dato.nombre || '' });
        m._punto = p;
        m.on('click', ev => { L.DomEvent.stopPropagation(ev); seleccionar(p); });
        m.addTo(mapa);
        marcadores.push(m);
      },
      encuadrar(lista) {
        if (!lista || !lista.length) return;
        if (div.clientWidth && div.clientHeight) aplicarEncuadre(lista);
        else { encuadrePendiente = lista; mapa.setView([lista[0].lat, lista[0].lon], 15); }
      },
      centrarEn(lat, lon, zoom) { mapa.setView([lat, lon], zoom || mapa.getZoom()); },
      posicion(p) {
        if (!p) return;
        const ll = [p.lat, p.lon];
        if (!marcaPos) {
          circuloPos = L.circle(ll, { radius: p.precision || 20, color: '#4aa3ff', weight: 1, fillOpacity: .15, interactive: false }).addTo(mapa);
          marcaPos = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#4aa3ff', fillOpacity: 1, interactive: false }).addTo(mapa);
        } else {
          marcaPos.setLatLng(ll); circuloPos.setLatLng(ll).setRadius(p.precision || 20);
        }
      },
      seleccionar(dato) { seleccionar(marcadores.map(m => m._punto).find(p => p.dato === dato) || null); },
      destruir() { observador.disconnect(); mapa.remove(); }
    };
  }

  /* Teselas del recorrido para usar el mapa sin señal (fondos satélite y calles, zoom 14 a 18).
     Devuelve la lista de URL; App.descargarTodo las guarda. */
  function teselasRecorrido() {
    const lats = GEOSITIOS.map(g => g.lat).concat(PUNTOS.map(p => p.lat));
    const lons = GEOSITIOS.map(g => g.lon).concat(PUNTOS.map(p => p.lon));
    const m = .004;   // ~400 m de margen
    const n = Math.max(...lats) + m, s = Math.min(...lats) - m, e = Math.max(...lons) + m, o = Math.min(...lons) - m;
    const tx = (lon, z) => Math.floor((lon + 180) / 360 * Math.pow(2, z));
    const ty = (lat, z) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z)); };
    const urls = [];
    for (let z = 14; z <= 18; z++) {
      for (let x = tx(o, z); x <= tx(e, z); x++) {
        for (let y = ty(n, z); y <= ty(s, z); y++) {
          urls.push(FONDOS.satelite.url.replace('{z}', z).replace('{x}', x).replace('{y}', y));
          if (z <= 17) urls.push(FONDOS.calles.url.replace('{z}', z).replace('{x}', x).replace('{y}', y));
        }
      }
    }
    return urls;
  }

  return { crear, teselasRecorrido, trazadoOSM: () => trazadoOSM(RUTAS.find(r => r.id === 'r2')) };
})();
