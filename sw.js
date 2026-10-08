/* Service worker de GeoParquemet Geotours.

   Dos cachés separadas a propósito:
     - "esqueleto": el código de la app. Se renueva en cada versión.
     - "contenido": fotos, modelos y panorámicas. Es lo que la persona descarga
       antes de subir al cerro y no debe borrarse al actualizar la app.

   Las teselas del mapa se guardan aparte, a medida que se navega, para que el
   tramo ya recorrido siga viéndose sin señal. */

const VERSION = 'v19';
const CACHE_ESQUELETO = 'geoparquemet-esqueleto-' + VERSION;
const CACHE_CONTENIDO = 'geoparquemet-contenido';
const CACHE_TESELAS = 'geoparquemet-teselas';
/* Teselas del recorrido bajadas con "Descargar todo": no se recortan. */
const CACHE_TESELAS_RUTA = 'geoparquemet-teselas-ruta';
const MAX_TESELAS = 1500;

const ESQUELETO = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css?v=19',
  './js/datos.js?v=19',
  './js/i18n-datos.js?v=19',
  './js/i18n.js?v=19',
  './js/util.js?v=19',
  './js/cortina.js?v=19',
  './js/visor3d.js?v=19',
  './js/pano.js?v=19',
  './js/mapa.js?v=19',
  './js/corte.js?v=19',
  './js/escaner.js?v=19',
  './js/vistas.js?v=19',
  './js/app.js?v=19',
  './js/vendor/three.min.js',
  './js/vendor/GLTFLoader.js',
  './js/vendor/OrbitControls.js',
  './js/vendor/jsqr.js',
  './js/vendor/leaflet/leaflet.js',
  './js/vendor/leaflet/leaflet.css',
  './ar.html',
  './js/vendor/mindar/mindar-image-three.prod.js',
  './js/vendor/mindar/controller-mGt1s8dJ.js',
  './js/vendor/mindar/ui-fBadYuor.js',
  './js/vendor/three-mod/three.module.min.js',
  './js/vendor/three-mod/addons/renderers/CSS3DRenderer.js',
  './assets/icons/icono-192.png',
  './assets/icons/icono-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE_ESQUELETO)
      .then(c => Promise.all(ESQUELETO.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.map(k => {
        const conservar = k === CACHE_ESQUELETO || k === CACHE_CONTENIDO || k === CACHE_TESELAS ||
          k === CACHE_TESELAS_RUTA;
        return conservar ? null : caches.delete(k);
      })))
      .then(() => self.clients.claim())
  );
});

/* Fondos del mapa: calles (OpenStreetMap), satélite (Esri) y topográfico (OpenTopoMap). */
function esTesela(url) {
  return /(^|\.)tile\.openstreetmap\.org$|^server\.arcgisonline\.com$|(^|\.)tile\.opentopomap\.org$/.test(url.hostname);
}

function esContenido(url) {
  /* Los .json de ar/ quedan fuera: son livianos y conviene que se actualicen. */
  return /\/assets\/(fotos|3d|360)\//.test(url.pathname) ||
    /\/ar\/.+\.(mind|jpg|webp|png|mp3|pdf)$/.test(url.pathname);
}

async function recortarCache(nombre, maximo) {
  const cache = await caches.open(nombre);
  const claves = await cache.keys();
  if (claves.length <= maximo) return;
  await Promise.all(claves.slice(0, claves.length - maximo).map(k => cache.delete(k)));
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Teselas del mapa: primero la caché, y lo que llegue de la red se guarda. */
  if (esTesela(url)) {
    ev.respondWith(
      caches.open(CACHE_TESELAS).then(cache =>
        /* se busca en todas las cachés: también en las teselas del recorrido */
        caches.match(req).then(hit => {
          const red = fetch(req).then(res => {
            if (res && (res.ok || res.type === 'opaque')) {
              cache.put(req, res.clone());
              recortarCache(CACHE_TESELAS, MAX_TESELAS);
            }
            return res;
          }).catch(() => hit);
          return hit || red;
        })
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  /* Fotos, modelos y panorámicas: la caché manda; pesan y no cambian. */
  if (esContenido(url)) {
    ev.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE_CONTENIDO).then(c => c.put(req, copia));
        }
        return res;
      }))
    );
    return;
  }

  /* Navegación: si no hay red, se entrega el esqueleto guardado. Si tampoco
     está en caché hay que responder algo legible: devolver undefined desde
     respondWith deja la pantalla en blanco. */
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req).catch(() =>
        caches.match('./index.html').then(hit => hit || paginaSinConexion())
      )
    );
    return;
  }

  /* Código y estilos: red primero para no quedar con una versión vieja,
     con la caché como respaldo inmediato si no hay señal. */
  ev.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copia = res.clone();
        caches.open(CACHE_ESQUELETO).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() =>
      /* Sin copia guardada conviene un error explícito: si se devuelve
         undefined, el script no carga y la app se queda en negro. */
      caches.match(req).then(hit => hit || Response.error())
    )
  );
});

function paginaSinConexion() {
  return new Response(
    '<!DOCTYPE html><html lang="es"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Sin conexion · GeoParquemet</title>' +
    '<body style="margin:0;display:grid;place-items:center;min-height:100vh;' +
    'background:#1c2b26;color:#f4f1ea;font-family:system-ui,sans-serif;text-align:center">' +
    '<div style="padding:24px;max-width:32ch">' +
    '<h1 style="font-size:1.3rem">Sin conexión</h1>' +
    '<p style="color:#93a49b">Todavía no se alcanzó a guardar la app para usarla sin ' +
    'señal. Conéctate un momento y vuelve a abrirla.</p>' +
    '<button onclick="location.reload()" style="min-height:48px;padding:0 24px;border:0;' +
    'border-radius:999px;background:#c1622f;color:#fff;font:inherit;font-weight:600">' +
    'Reintentar</button></div></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
  );
}
