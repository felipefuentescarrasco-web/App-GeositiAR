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

  /* Las rutas propias llevan ?v=8, igual que en index.html, para que la copia
     guardada corresponda exactamente a la que pide la página. */
  const ARCHIVOS_BASE = [
    'index.html', 'manifest.webmanifest', 'css/app.css?v=8',
    'js/datos.js?v=8', 'js/util.js?v=8', 'js/cortina.js?v=8', 'js/visor3d.js?v=8',
    'js/pano.js?v=8', 'js/mapa.js?v=8', 'js/corte.js?v=8', 'js/escaner.js?v=8',
    'js/vistas.js?v=8', 'js/app.js?v=8',
    'js/vendor/three.min.js', 'js/vendor/GLTFLoader.js', 'js/vendor/OrbitControls.js',
    'js/vendor/jsqr.js',
    'assets/icons/icono-192.png', 'assets/icons/icono-512.png'
  ];

  function listaCompleta() {
    const lista = ARCHIVOS_BASE.slice();
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
    return Array.from(new Set(lista));
  }

  function descargarTodo(alAvanzar) {
    if (!('caches' in window)) {
      U.aviso('Este navegador no permite guardar contenido sin conexión');
      alAvanzar(100);
      return;
    }
    const lista = listaCompleta();
    let hechos = 0;
    caches.open('geoparquemet-contenido').then(cache => {
      /* de a tres para no ahogar la conexión del cerro */
      const cola = lista.slice();
      const trabajador = () => {
        const url = cola.shift();
        if (!url) return Promise.resolve();
        return cache.add(url)
          .catch(() => {})
          .then(() => {
            hechos++;
            alAvanzar(hechos / lista.length * 100);
            return trabajador();
          });
      };
      return Promise.all([trabajador(), trabajador(), trabajador()]);
    }).then(() => alAvanzar(100));
  }

  /* ------------------------------------------------------------- arranque */

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

    pintar();
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  return { ir, descargarTodo, listaCompleta, pintar };
})();
