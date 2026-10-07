/* Mapa con Leaflet (js/vendor/leaflet/), como en la app de Carlos Venegas.

   Fondos: satélite (Esri World Imagery), calles (OpenStreetMap) y topográfico
   (OpenTopoMap), con selector. Capas: georutas y unidades geológicas.
   Las teselas que se ven quedan guardadas por el service worker, y
   App.descargarTodo() baja las del recorrido para usarlas sin señal.

   Georutas:
     - Georuta 1: trazado real (assets/geo/georuta1.geojson, de la capa
       Georuta1_v2 de ArcGIS Online de la Unidad de Geopatrimonio).
     - Georuta 2: no hay trazado oficial todavía. La primera vez que hay red se
       calcula a pie por los caminos de OpenStreetMap entre sus geositios
       (servicio OSRM de routing.openstreetmap.de) y se guarda en el teléfono;
       mientras tanto se dibuja punteada uniendo los geositios. Cuando exista el
       trazado oficial basta con dejarlo como assets/geo/georuta2.geojson. */

const Mapa = (() => {

  const FONDOS = {
    satelite: {
      nombre: 'Satélite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      opciones: { maxNativeZoom: 19, attribution: 'Imagen © Esri, Maxar, Earthstar Geographics' }
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

  const COLOR_GEOL = { volcanica: '#8d6a52', intrusiva: '#5d7a86' };

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
    Object.keys(FONDOS).forEach(k => {
      fondos[FONDOS[k].nombre] = L.tileLayer(FONDOS[k].url, Object.assign({ maxZoom: 20, crossOrigin: true }, FONDOS[k].opciones));
      fondos[FONDOS[k].nombre]._clave = k;
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

    /* unidades geológicas (los polígonos de la app de Carlos) */
    const capaGeol = L.layerGroup();
    fetch('assets/geo/geologia.geojson').then(r => r.json()).then(gj => {
      L.geoJSON(gj, {
        style: f => ({ color: COLOR_GEOL[f.properties.tipo] || '#999', weight: 1, fillOpacity: .35 }),
        onEachFeature: (f, capa) => {
          const p = f.properties;
          capa.bindPopup(U.el('div', { clase: 'popup-geol' }, [
            U.el('b', { texto: p.nombre + (p.codigo ? ' (' + p.codigo + ')' : '') }),
            U.el('div', { clase: 'pequeno', texto: p.edad || '' })
          ]));
        }
      }).addTo(capaGeol);
    }).catch(() => { /* sin la capa, el mapa sigue funcionando */ });

    L.control.layers(fondos, { 'Georutas': capaRutas, 'Geología': capaGeol }, { position: 'topright', collapsed: true }).addTo(mapa);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(mapa);

    /* geositios y otros puntos */
    const marcadores = [];
    let seleccionado = null;
    function icono(p, sel) {
      const esG = p.tipo === 'geositio', esP = p.tipo === 'parada';
      const color = esG ? (U.visitado(p.dato.id) ? '#4f9d7e' : '#c1622f') : esP ? '#7b6bb0' : '#d8c08a';
      const tam = sel ? 34 : esG || esP ? 28 : 18;
      return L.divIcon({
        className: 'marca-mapa' + (sel ? ' sel' : ''),
        html: '<span style="background:' + color + ';width:' + tam + 'px;height:' + tam + 'px">' + (esG ? p.dato.num : esP ? '3D' : '') + '</span>',
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
