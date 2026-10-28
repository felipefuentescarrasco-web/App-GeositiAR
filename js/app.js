/* Arranque, enrutador y tareas de la aplicación. */

const App = (() => {

  const contenedor = U.$('#app');
  const barraSup = U.$('#barraSup');
  const titulo = U.$('#tituloBarra');
  const btnAtras = U.$('#btnAtras');
  const barraInf = U.$('#barraInf');

  let rutaPrevia = '#/';
  let rutaActual = '';

  /* ------------------------------------------------------------- rutas */

  function partes(hash) {
    const limpio = (hash || '#/').replace(/^#/, '');
    const [camino, consulta] = limpio.split('?');
    const parametros = {};
    (consulta || '').split('&').filter(Boolean).forEach(p => {
      const [k, v] = p.split('=');
      parametros[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { segmentos: camino.split('/').filter(Boolean), parametros: parametros };
  }

  function resolver(hash) {
    const { segmentos, parametros } = partes(hash);
    const s0 = segmentos[0] || '';

    switch (s0) {
      case '':
        return { vista: Vistas.inicio(), titulo: 'GeoParquemet', raiz: true, nav: 'inicio' };

      case 'rutas':
        return { vista: Vistas.rutas(), titulo: 'Georutas', raiz: true, nav: 'rutas' };

      case 'ruta': {
        const r = U.ruta(segmentos[1]);
        return { vista: Vistas.ruta(segmentos[1]), titulo: r ? r.corta : 'Georuta', nav: 'rutas' };
      }

      case 'g': {
        const g = U.geositio(segmentos[1]);
        if (g && parametros.qr === '1' && !U.visitado(g.id)) {
          U.marcarVisitado(g.id);
          setTimeout(() => U.aviso('Geositio ' + g.num + ' marcado como visitado'), 500);
        }
        return {
          vista: Vistas.geositio(segmentos[1]),
          titulo: g ? 'Geositio ' + g.num : 'Geositio',
          transparente: true, nav: null
        };
      }

      case 'p': {
        const p = U.parada(segmentos[1]);
        return { vista: Vistas.parada(segmentos[1]), titulo: p ? 'Parada' : 'Parada', transparente: true, nav: null };
      }

      case 'mapa':
        return { vista: Vistas.mapa(parametros), titulo: 'Mapa', raiz: true, nav: 'mapa',
                 sinDesplazamiento: true };

      case 'historia':
        return { vista: Vistas.historia(), titulo: 'Historia geológica', nav: 'mas' };

      case 'corte':
        return { vista: Vistas.corteGeologico(), titulo: 'Corte geológico', nav: 'mas' };

      case 'glosario':
        return { vista: Vistas.glosario(), titulo: 'Glosario', nav: 'mas' };

      case 'unidades':
        return { vista: Vistas.unidades(), titulo: 'Unidades geológicas', nav: 'mas' };

      case 'ajustes':
        return { vista: Vistas.ajustes(), titulo: 'Ajustes', nav: 'mas' };

      case 'mas':
        return { vista: Vistas.mas(), titulo: 'Más', raiz: true, nav: 'mas' };

      default:
        return { vista: Vistas.noEncontrado(), titulo: 'No encontrado' };
    }
  }

  function pintar() {
    const hash = location.hash || '#/';
    /* un cuadro abierto (glosario, instalar…) no debe quedar encima de la vista nueva */
    const cm = U.$('#capaModal');
    if (!cm.hidden) { cm.hidden = true; cm.innerHTML = ''; document.body.style.overflow = ''; }

    /* El escáner es una capa, no una vista: se abre y devuelve a donde estabas. */
    if (hash.indexOf('#/escanear') === 0) {
      marcarNav('escanear');
      Escaner.abrir(
        g => { location.hash = '#/g/' + g.id + '?qr=1'; },
        () => { if (location.hash.indexOf('#/escanear') === 0) location.hash = rutaPrevia || '#/'; }
      );
      return;
    }

    if (rutaActual && rutaActual.indexOf('#/escanear') !== 0) rutaPrevia = rutaActual;
    rutaActual = hash;

    Vistas.limpiar();
    const r = resolver(hash);

    contenedor.innerHTML = '';
    contenedor.appendChild(r.vista);
    contenedor.classList.toggle('sin-barras', false);

    titulo.textContent = r.titulo;
    btnAtras.hidden = !!r.raiz;
    barraSup.classList.toggle('transparente', !!r.transparente);
    marcarNav(r.nav);

    if (!r.sinDesplazamiento) window.scrollTo(0, 0);
    document.title = r.titulo === 'GeoParquemet'
      ? 'GeoParquemet · Geotours'
      : r.titulo + ' · GeoParquemet';
  }

  function marcarNav(nombre) {
    U.$$('[data-nav]').forEach(a =>
      a.classList.toggle('activo', a.dataset.nav === nombre));
  }

  function ir(hash, reemplazar) {
    if (reemplazar) {
      history.replaceState(null, '', hash);
      pintar();
    } else {
      location.hash = hash;
    }
  }

  /* ------------------------------------------------- descarga sin conexión */

  /* Las rutas propias llevan ?v=21, igual que en index.html, para que la copia
     guardada corresponda exactamente a la que pide la página. */
  const ARCHIVOS_BASE = [
    'index.html', 'manifest.webmanifest', 'css/app.css?v=21',
    'js/datos.js?v=21', 'js/i18n-datos.js?v=21', 'js/i18n.js?v=21', 'js/util.js?v=21', 'js/cortina.js?v=21', 'js/visor3d.js?v=21',
    'js/pano.js?v=21', 'js/mapa.js?v=21', 'js/corte.js?v=21', 'js/escaner.js?v=21',
    'js/vistas.js?v=21', 'js/app.js?v=21',
    'js/vendor/three.min.js', 'js/vendor/GLTFLoader.js', 'js/vendor/OrbitControls.js',
    'js/vendor/jsqr.js',
    'assets/icons/icono-192.png', 'assets/icons/icono-512.png',
    'assets/img/portada.webp', 'assets/img/sernageomin.webp', 'assets/img/parquemet.webp',
    'ar.html', 'ar-maqueta.html', 'ar/maqueta.mind', 'ar/maqueta.json', 'js/vendor/mindar/mindar-image-three.prod.js',
    'js/vendor/mindar/controller-mGt1s8dJ.js', 'js/vendor/mindar/ui-fBadYuor.js',
    'js/vendor/three-mod/three.module.min.js',
    'js/vendor/three-mod/addons/renderers/CSS3DRenderer.js',
    'ar/objetivos.json', 'ar/carteles.json', 'ar/calibracion.json', 'ar/marcador.mind',
    'js/vendor/leaflet/leaflet.js', 'js/vendor/leaflet/leaflet.css',
    'assets/geo/georuta1.geojson', 'assets/geo/georuta2.geojson', 'assets/geo/geologia_sernageomin.geojson',
    'assets/geo/acta_parque.geojson', 'assets/geo/acta_bosque.geojson', 'assets/geo/acta_conservacion.geojson',
    'assets/geo/acta_proteccion.geojson', 'assets/geo/acta_recreacion.geojson', 'assets/geo/acta_manejo.geojson',
    'assets/geo/acta_nucleos.geojson', 'assets/geo/osm_senderos.geojson', 'assets/geo/osm_ciclovias.geojson',
    'assets/geo/osm_agua.geojson', 'assets/geo/osm_infraestructura.geojson'
  ];

  /* Realidad aumentada: objetivos, capas y audios de los carteles en los tres idiomas. */
  const ARCHIVOS_AUDIO = ['es', 'en', 'pt'].reduce((l, i) =>
    l.concat(['intro'].concat(GEOSITIOS.map(g => 'g' + g.num)).map(n => 'assets/audio/' + i + '/' + n + '.mp3')), []);
  const ARCHIVOS_RA = ["ar/audio/en/g1_amarillo.mp3", "ar/audio/en/g1_caida.mp3", "ar/audio/en/g1_cuna.mp3", "ar/audio/en/g1_grietas.mp3", "ar/audio/en/g1_roca.mp3", "ar/audio/en/g2_contacto.mp3", "ar/audio/en/g2_dique.mp3", "ar/audio/en/g2_volcanica.mp3", "ar/audio/en/g3_fracturas.mp3", "ar/audio/en/g3_raices.mp3", "ar/audio/en/g3_relleno.mp3", "ar/audio/en/g3_roca.mp3", "ar/audio/en/g3_suelo.mp3", "ar/audio/en/g6_contacto.mp3", "ar/audio/en/g6_intrusiva.mp3", "ar/audio/en/g6_volcanica.mp3", "ar/audio/es/g1_amarillo.mp3", "ar/audio/es/g1_caida.mp3", "ar/audio/es/g1_cuna.mp3", "ar/audio/es/g1_grietas.mp3", "ar/audio/es/g1_roca.mp3", "ar/audio/es/g2_contacto.mp3", "ar/audio/es/g2_dique.mp3", "ar/audio/es/g2_volcanica.mp3", "ar/audio/es/g3_fracturas.mp3", "ar/audio/es/g3_raices.mp3", "ar/audio/es/g3_relleno.mp3", "ar/audio/es/g3_roca.mp3", "ar/audio/es/g3_suelo.mp3", "ar/audio/es/g6_contacto.mp3", "ar/audio/es/g6_intrusiva.mp3", "ar/audio/es/g6_volcanica.mp3", "ar/audio/pt/g1_amarillo.mp3", "ar/audio/pt/g1_caida.mp3", "ar/audio/pt/g1_cuna.mp3", "ar/audio/pt/g1_grietas.mp3", "ar/audio/pt/g1_roca.mp3", "ar/audio/pt/g2_contacto.mp3", "ar/audio/pt/g2_dique.mp3", "ar/audio/pt/g2_volcanica.mp3", "ar/audio/pt/g3_fracturas.mp3", "ar/audio/pt/g3_raices.mp3", "ar/audio/pt/g3_relleno.mp3", "ar/audio/pt/g3_roca.mp3", "ar/audio/pt/g3_suelo.mp3", "ar/audio/pt/g6_contacto.mp3", "ar/audio/pt/g6_intrusiva.mp3", "ar/audio/pt/g6_volcanica.mp3", "ar/g1.mind", "ar/g1_10_capa.webp", "ar/g1_10_obj.jpg", "ar/g1_11_capa.webp", "ar/g1_11_obj.jpg", "ar/g1_1_capa.webp", "ar/g1_1_obj.jpg", "ar/g1_2_capa.webp", "ar/g1_2_obj.jpg", "ar/g1_3_capa.webp", "ar/g1_3_obj.jpg", "ar/g1_4_capa.webp", "ar/g1_4_obj.jpg", "ar/g1_5_capa.webp", "ar/g1_5_obj.jpg", "ar/g1_6_capa.webp", "ar/g1_6_obj.jpg", "ar/g1_7_capa.webp", "ar/g1_7_obj.jpg", "ar/g1_8_capa.webp", "ar/g1_8_obj.jpg", "ar/g1_9_capa.webp", "ar/g1_9_obj.jpg", "ar/g1_hoja.mind", "ar/g2.mind", "ar/g2_1_capa.webp", "ar/g2_1_obj.jpg", "ar/g2_2_capa.webp", "ar/g2_2_obj.jpg", "ar/g2_3_capa.webp", "ar/g2_3_obj.jpg", "ar/g2_4_capa.webp", "ar/g2_4_obj.jpg", "ar/g2_hoja.mind", "ar/g3.mind", "ar/g3_1_capa.webp", "ar/g3_1_obj.jpg", "ar/g3_2_capa.webp", "ar/g3_2_obj.jpg", "ar/g3_3_capa.webp", "ar/g3_3_obj.jpg", "ar/g3_4_capa.webp", "ar/g3_4_obj.jpg", "ar/g3_5_capa.webp", "ar/g3_5_obj.jpg", "ar/g3_6_capa.webp", "ar/g3_6_obj.jpg", "ar/g3_hoja.mind", "ar/g6.mind", "ar/g6_1_capa.webp", "ar/g6_1_obj.jpg", "ar/g6_2_capa.webp", "ar/g6_2_obj.jpg", "ar/g6_3_capa.webp", "ar/g6_3_obj.jpg", "ar/g6_hoja.mind"];

  function listaCompleta() {
    const lista = ARCHIVOS_BASE.concat(ARCHIVOS_RA, ARCHIVOS_AUDIO);
    GEOSITIOS.forEach(g => {
      (g.fotos || []).forEach(f => {
        lista.push('assets/fotos/' + f.base, 'assets/fotos/' + f.interp,
                   'assets/fotos/t_' + f.interp);
      });
      if (g.muestra) lista.push('assets/fotos/' + g.muestra.base,
                                'assets/fotos/' + g.muestra.interp,
                                'assets/fotos/t_' + g.muestra.interp);
      if (g.modelo) lista.push('assets/3d/' + g.modelo.archivo);
      if (g.pano) lista.push('assets/360/' + g.pano.base, 'assets/360/' + g.pano.interp);
    });
    PARADAS.forEach(p => {
      p.fotos.forEach(f => lista.push('assets/fotos/' + f.archivo, 'assets/fotos/t_' + f.archivo));
      if (p.modelo) lista.push('assets/3d/' + p.modelo.archivo);
      if (p.modelo && p.modelo.capas) p.modelo.capas.forEach(c => { lista.push('assets/3d/' + c.archivo); if (c.fichas) lista.push('assets/3d/' + c.fichas); });
    });
    return Array.from(new Set(lista));
  }

  function descargarTodo(alAvanzar) {
    if (!('caches' in window)) {
      U.aviso('Este navegador no permite guardar contenido sin conexión');
      alAvanzar(100);
      return;
    }
    /* contenido de la app y, aparte, las teselas del mapa del recorrido (satélite, calles y SkySat) */
    const lista = listaCompleta();
    let teselas = Mapa.teselasRecorrido(), total = lista.length + teselas.length, hechos = 0;
    function bajar(nombreCache, urls) {
      return caches.open(nombreCache).then(cache => {
        /* de a tres para no ahogar la conexión del cerro */
        const cola = urls.slice();
        const trabajador = () => {
          const url = cola.shift();
          if (!url) return Promise.resolve();
          return cache.match(url)
            .then(ya => ya || cache.add(url))
            .catch(() => {})
            .then(() => {
              hechos++;
              alAvanzar(Math.min(99, hechos / total * 100));
              return trabajador();
            });
        };
        return Promise.all([trabajador(), trabajador(), trabajador()]);
      });
    }
    bajar('geoparquemet-contenido', lista)
      .then(() => fetch('assets/teselas/skysat/lista.json').then(r => r.json()).catch(() => []))
      .then(sky => {
        const propias = sky.map(t => 'assets/teselas/skysat/' + t + '.jpg');
        teselas = teselas.concat(propias); total += propias.length;
        return bajar('geoparquemet-teselas-ruta', teselas);
      })
      .then(() => alAvanzar(100));
  }

  /* ------------------------------------------------------------- arranque */

  /* ------------------------------------------------------ instalar la app */

  let pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; });
  window.addEventListener('appinstalled', () => {
    pedidoInstalar = null;
    U.$$('.banner-instalar').forEach(b => b.remove());
    U.aviso('GeoParquemet quedó instalada en tu pantalla de inicio', 4000);
  });
  const instalada = () => ['standalone', 'fullscreen'].some(m => matchMedia('(display-mode: ' + m + ')').matches) ||
    navigator.standalone === true;
  const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function ensenarInstalar() {
    const pasos = esIOS()
      ? [['1', 'Abre esta página en Safari.'],
         ['2', 'Toca el botón Compartir (el cuadrado con la flecha hacia arriba).'],
         ['3', 'Elige «Agregar a inicio» y luego «Agregar».']]
      : [['1', 'Toca el menú del navegador (los tres puntos ⋮ arriba a la derecha).'],
         ['2', 'Elige «Instalar aplicación» o «Agregar a la pantalla principal».'],
         ['3', 'Confirma con «Instalar». El ícono de GeoParquemet queda junto a tus apps.']];
    const contenido = U.el('div', { clase: 'caja' }, [
      U.el('h2', { texto: 'Cómo instalar GeoParquemet' }),
      U.el('p', { clase: 'pequeno tenue', texto: 'Instalada se abre a pantalla completa y, después de ' +
        '«Descargar todo» en Ajustes, funciona sin señal en el cerro.' }),
      pedidoInstalar ? U.el('button', { clase: 'boton ancho', type: 'button', onclick: () => {
        const p = pedidoInstalar; pedidoInstalar = null; cerrar();
        p.prompt();
      } }, ['📲 Instalar ahora']) : null,
      U.el('ol', { clase: 'pasos-instalar' }, pasos.map(([n, t]) =>
        U.el('li', {}, [U.el('span', { clase: 'paso-num', texto: n }), U.el('span', { texto: t })])))
    ]);
    const cerrar = U.modal(contenido);
  }

  /* -------------------------------------- aviso al llegar a un geositio */

  /* Como en la app de Carlos Venegas: al quedar a 35 m o menos de un geositio (o de una parada
     especial) el teléfono vibra y aparece un aviso para abrir su ficha. Una vez por geositio y
     visita. Solo se enciende si la persona ya dio permiso de ubicación: no lo pide al abrir. */
  const RADIO_LLEGADA = 35;
  const avisados = new Set();
  function vigilarCercania(pos) {
    if (!pos || (pos.precision && pos.precision > 80)) return;
    if (U.leerEstado().ajustes.vibrar === false) return;
    const puntos = GEOSITIOS.map(g => ({ id: g.id, lat: g.lat, lon: g.lon, href: '#/g/' + g.id,
      nombre: I18N.t('Geositio ' + g.num) + ': ' + g.nombre }))
      .concat((typeof PARADAS !== 'undefined' ? PARADAS : []).map(p => ({ id: p.id, lat: p.lat, lon: p.lon,
        href: '#/p/' + p.id, nombre: p.nombre })));
    const margen = Math.min(pos.precision || 0, 25);
    puntos.forEach(p => {
      if (avisados.has(p.id) || !isFinite(p.lat)) return;
      if (U.distancia(pos, p) - margen > RADIO_LLEGADA) return;
      avisados.add(p.id);
      U.vibrar([180, 80, 180]);
      if (location.hash.indexOf(p.href) === 0) return;
      U.aviso(I18N.t('Llegaste a') + ' ' + p.nombre, 9000, { texto: I18N.t('Abrir'), href: p.href });
    });
  }
  function iniciarCercania() {
    if (!navigator.geolocation) return;
    let activo = false;
    const encender = () => { if (!activo) { activo = true; U.seguirPosicion(vigilarCercania); } };
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(st => {
        if (st.state === 'granted') encender();
        st.onchange = () => { if (st.state === 'granted') encender(); };
      }).catch(() => {});
    }
  }

  function aplicarAjustes() {
    const a = U.leerEstado().ajustes;
    document.documentElement.style.setProperty('--escala', a.escala || 1);
    document.body.classList.toggle('contraste', !!a.contraste);
  }

  function iniciar() {
    aplicarAjustes();

    btnAtras.addEventListener('click', () => {
      if (history.length > 1) history.back();
      else ir('#/');
    });

    U.$('#btnAjustes').addEventListener('click', () => ir('#/ajustes'));

    window.addEventListener('hashchange', pintar);

    /* La app se instala como PWA; el service worker guarda el esqueleto. */
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }

    window.addEventListener('offline', () => U.aviso('Sin conexión: sigues viendo lo descargado'));

    /* Las voces del sintetizador llegan tarde en algunos navegadores. */
    if ('speechSynthesis' in window) speechSynthesis.getVoices();

    iniciarCercania();
    pintar();
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  return { ir, descargarTodo, listaCompleta, pintar, instalada, ensenarInstalar };
})();
