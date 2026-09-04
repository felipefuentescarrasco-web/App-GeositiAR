/* Service worker de GeoParquemet Geotours.

   Dos cachés separadas a propósito:
     - "esqueleto": el código de la app. Se renueva en cada versión.
     - "contenido": fotos, modelos y panorámicas. Es lo que la persona descarga
       antes de subir al cerro y no debe borrarse al actualizar la app.

   Las teselas del mapa se guardan aparte, a medida que se navega, para que el
   tramo ya recorrido siga viéndose sin señal. */

const VERSION = 'v7';
const CACHE_ESQUELETO = 'geoparquemet-esqueleto-' + VERSION;
const CACHE_CONTENIDO = 'geoparquemet-contenido';
const CACHE_TESELAS = 'geoparquemet-teselas';
const MAX_TESELAS = 400;

const ESQUELETO = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css?v=7',
  './js/datos.js?v=7',
  './js/util.js?v=7',
  './js/cortina.js?v=7',
  './js/visor3d.js?v=7',
  './js/pano.js?v=7',
  './js/mapa.js?v=7',
  './js/corte.js?v=7',
  './js/escaner.js?v=7',
  './js/vistas.js?v=7',
  './js/app.js?v=7',
  './js/vendor/three.min.js',
  './js/vendor/GLTFLoader.js',
  './js/vendor/OrbitControls.js',
  './js/vendor/jsqr.js',
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
        const conservar = k === CACHE_ESQUELETO || k === CACHE_CONTENIDO || k === CACHE_TESELAS;
        return conservar ? null : caches.delete(k);
      })))
      .then(() => self.clients.claim())
  );
});

function esTesela(url) {
  return /tile\.openstreetmap\.org/.test(url.hostname);
}

function esContenido(url) {
  return /\/assets\/(fotos|3d|360)\//.test(url.pathname);
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
        cache.match(req).then(hit => {
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

  /* Navegación: si no hay red, se entrega el esqueleto guardado. */
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
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
    }).catch(() => caches.match(req))
  );
});
