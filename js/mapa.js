/* Mapa propio sobre canvas: proyección Web Mercator, teselas de OpenStreetMap
   cuando hay red y, si no la hay, un esquema con las georutas y los geositios.

   Se evita una librería de mapas a propósito: la app debe funcionar completa
   sin conexión y sin descargar megabytes al llegar al cerro. */

const Mapa = (() => {

  const TAM_TESELA = 256;
  const URL_TESELAS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const Z_MIN = 13, Z_MAX = 18;

  /* ------------------------------------------------------ proyección */

  const lonAX = lon => (lon + 180) / 360;
  function latAY(lat) {
    const s = Math.sin(lat * Math.PI / 180);
    return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  }
  const xALon = x => x * 360 - 180;
  const yALat = y => 90 - 360 * Math.atan(Math.exp((y - 0.5) * 2 * Math.PI)) / Math.PI;

  function crear(contenedor, opciones) {
    const lienzo = U.el('canvas', { clase: 'lienzo-mapa' });
    contenedor.appendChild(lienzo);
    const ctx = lienzo.getContext('2d');

    const vista = { centroX: 0, centroY: 0, zoom: 15.4 };
    let ancho = 0, alto = 0, dpr = Math.min(devicePixelRatio || 1, 2);
    let posicion = null;
    let seleccionado = null;
    let hayTeselas = navigator.onLine;

    const puntos = [];   // {lat, lon, tipo, dato}
    const teselas = new Map();

    /* ------------------------------------------------------ geometría */

    const escala = () => Math.pow(2, vista.zoom) * TAM_TESELA;

    function aPantalla(lat, lon) {
      const e = escala();
      return {
        x: (lonAX(lon) - vista.centroX) * e + ancho / 2,
        y: (latAY(lat) - vista.centroY) * e + alto / 2
      };
    }

    function aCoordenadas(px, py) {
      const e = escala();
      return {
        lat: yALat((py - alto / 2) / e + vista.centroY),
        lon: xALon((px - ancho / 2) / e + vista.centroX)
      };
    }

    let ultimoEncuadre = null;

    function encuadrar(lista, margen) {
      if (!lista.length) return;
      ultimoEncuadre = { lista: lista, margen: margen };
      /* sin tamaño conocido todavía no se puede calcular el zoom: se recalcula
         solo en cuanto el contenedor entra en la página */
      if (!ancho || !alto) return;
      let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
      lista.forEach(p => {
        const x = lonAX(p.lon), y = latAY(p.lat);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      });
      vista.centroX = (x0 + x1) / 2;
      vista.centroY = (y0 + y1) / 2;
      const m = margen || 70;
      const zx = Math.log2(Math.max(1, (ancho - m * 2)) / Math.max(1e-9, (x1 - x0)) / TAM_TESELA);
      const zy = Math.log2(Math.max(1, (alto - m * 2)) / Math.max(1e-9, (y1 - y0)) / TAM_TESELA);
      vista.zoom = Math.max(Z_MIN, Math.min(Z_MAX, Math.min(zx, zy)));
      pintar();
    }

    /* -------------------------------------------------------- teselas */

    function pedirTesela(z, x, y) {
      const clave = z + '/' + x + '/' + y;
      if (teselas.has(clave)) return teselas.get(clave);
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { im.listo = true; pintar(); };
      im.onerror = () => { im.fallo = true; };
      im.src = URL_TESELAS.replace('{z}', z).replace('{x}', x).replace('{y}', y);
      teselas.set(clave, im);
      if (teselas.size > 260) {                 // no dejar crecer la memoria
        const viejas = Array.from(teselas.keys()).slice(0, 60);
        viejas.forEach(k => teselas.delete(k));
      }
      return im;
    }

    function pintarTeselas() {
      const z = Math.max(Z_MIN, Math.min(Z_MAX, Math.round(vista.zoom)));
      const e = Math.pow(2, z) * TAM_TESELA;
      const factor = escala() / e;
      const izq = vista.centroX * e - ancho / 2 / factor;
      const arr = vista.centroY * e - alto / 2 / factor;
      const x0 = Math.floor(izq / TAM_TESELA), y0 = Math.floor(arr / TAM_TESELA);
      const x1 = Math.floor((izq + ancho / factor) / TAM_TESELA);
      const y1 = Math.floor((arr + alto / factor) / TAM_TESELA);
      const n = Math.pow(2, z);
      let dibujadas = 0;

      ctx.save();
      ctx.globalAlpha = 0.82;
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          if (y < 0 || y >= n) continue;
          const im = pedirTesela(z, ((x % n) + n) % n, y);
          if (!im.listo) continue;
          const px = (x * TAM_TESELA - izq) * factor;
          const py = (y * TAM_TESELA - arr) * factor;
          const t = TAM_TESELA * factor;
          ctx.drawImage(im, px, py, t + 1, t + 1);
          dibujadas++;
        }
      }
      ctx.restore();
      hayTeselas = dibujadas > 0;
      return dibujadas > 0;
    }

    /* -------------------------------------------------------- dibujo */

    function fondoEsquematico() {
      ctx.fillStyle = '#16211d';
      ctx.fillRect(0, 0, ancho, alto);
      /* curvas de nivel insinuadas alrededor de la cumbre del San Cristóbal */
      const c = aPantalla(-33.4255, -70.6332);
      ctx.strokeStyle = 'rgba(120,150,135,.16)';
      ctx.lineWidth = 1;
      for (let r = 60; r < Math.max(ancho, alto) * 1.4; r += 46) {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, r * 1.25, r * 0.85, -0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function pintarRutas() {
      RUTAS.forEach(r => {
        const pts = U.geositiosDeRuta(r.id)
          .slice()
          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
          .map(g => aPantalla(g.lat, g.lon));
        if (pts.length < 2) return;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        /* trazo suavizado: el camino real no es una poligonal recta */
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          ctx.quadraticCurveTo((a.x + b.x) / 2 + (b.y - a.y) * 0.12,
                               (a.y + b.y) / 2 - (b.x - a.x) * 0.12, b.x, b.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }

    function pintarPuntos() {
      puntos.forEach(p => {
        const s = aPantalla(p.lat, p.lon);
        if (s.x < -40 || s.x > ancho + 40 || s.y < -40 || s.y > alto + 40) return;
        const esGeositio = p.tipo === 'geositio';
        const sel = seleccionado && seleccionado.dato === p.dato;
        const r = sel ? 16 : esGeositio ? 13 : 9;

        ctx.beginPath();
        ctx.arc(s.x, s.y, r + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = esGeositio
          ? (U.visitado(p.dato.id) ? '#4f9d7e' : '#c1622f')
          : '#d8c08a';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f4f1ea';
        ctx.stroke();

        if (esGeositio) {
          ctx.fillStyle = '#fff';
          ctx.font = '700 ' + (sel ? 15 : 12) + 'px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(p.dato.num), s.x, s.y + 0.5);
        }
      });
    }

    function pintarPosicion() {
      if (!posicion) return;
      const s = aPantalla(posicion.lat, posicion.lon);
      const metrosPorPixel = 156543.03392 * Math.cos(posicion.lat * Math.PI / 180) / Math.pow(2, vista.zoom);
      if (posicion.precision) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.min(140, posicion.precision / metrosPorPixel), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90,170,255,.16)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#4aa3ff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    function pintarEscala() {
      const lat = aCoordenadas(ancho / 2, alto / 2).lat;
      const mpp = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, vista.zoom);
      let metros = 100;
      const objetivo = 90;
      const opciones = [20, 50, 100, 200, 500, 1000];
      metros = opciones.reduce((a, b) =>
        Math.abs(b / mpp - objetivo) < Math.abs(a / mpp - objetivo) ? b : a);
      const px = metros / mpp;
      const x = 14, y = alto - 20;
      ctx.strokeStyle = 'rgba(244,241,234,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 5); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(244,241,234,.85)';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(metros >= 1000 ? (metros / 1000) + ' km' : metros + ' m', x, y - 7);

      if (hayTeselas) {
        ctx.textAlign = 'right';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(244,241,234,.6)';
        ctx.fillText('© OpenStreetMap', ancho - 12, alto - 8);
      }
    }

    function pintarNorte() {
      const x = ancho - 30, y = 34;
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = 'rgba(244,241,234,.8)';
      ctx.fillStyle = 'rgba(244,241,234,.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(5, 8); ctx.lineTo(0, 3); ctx.lineTo(-5, 8);
      ctx.closePath();
      ctx.fill();
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', 0, 21);
      ctx.restore();
    }

    let pendiente = false;
    function pintar() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        /* el contenedor puede haber cambiado de tamaño —o recién haberse
           insertado en la página— desde el último cuadro */
        dimensionar();
        if (!ancho) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fondoEsquematico();
        if (navigator.onLine) pintarTeselas();
        pintarRutas();
        pintarPuntos();
        pintarPosicion();
        pintarEscala();
        pintarNorte();
      });
    }

    /* --------------------------------------------------- interacción */

    function dimensionar() {
      const r = contenedor.getBoundingClientRect();
      if (r.width === ancho && r.height === alto) return false;
      const estabaSinTamano = !ancho || !alto;
      ancho = r.width; alto = r.height;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      if (estabaSinTamano && ancho && ultimoEncuadre) {
        encuadrar(ultimoEncuadre.lista, ultimoEncuadre.margen);
      }
      return true;
    }

    const punteros = new Map();
    let distanciaPrevia = 0, movido = 0;

    lienzo.addEventListener('pointerdown', ev => {
      lienzo.setPointerCapture(ev.pointerId);
      punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      movido = 0;
    });

    lienzo.addEventListener('pointermove', ev => {
      const p = punteros.get(ev.pointerId);
      if (!p) return;
      const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
      p.x = ev.clientX; p.y = ev.clientY;
      movido += Math.abs(dx) + Math.abs(dy);

      if (punteros.size === 1) {
        const e = escala();
        vista.centroX -= dx / e;
        vista.centroY -= dy / e;
        pintar();
      } else if (punteros.size === 2) {
        const [a, b] = Array.from(punteros.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (distanciaPrevia) {
          vista.zoom = Math.max(Z_MIN, Math.min(Z_MAX, vista.zoom + Math.log2(d / distanciaPrevia)));
          pintar();
        }
        distanciaPrevia = d;
      }
    });

    function terminar(ev) {
      punteros.delete(ev.pointerId);
      if (punteros.size < 2) distanciaPrevia = 0;
      if (!punteros.size && movido < 8) tocar(ev);
    }
    lienzo.addEventListener('pointerup', terminar);
    lienzo.addEventListener('pointercancel', ev => punteros.delete(ev.pointerId));

    lienzo.addEventListener('wheel', ev => {
      ev.preventDefault();
      vista.zoom = Math.max(Z_MIN, Math.min(Z_MAX, vista.zoom - Math.sign(ev.deltaY) * 0.4));
      pintar();
    }, { passive: false });

    function tocar(ev) {
      const r = lienzo.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      let mejor = null, mejorD = 34;
      puntos.forEach(p => {
        const s = aPantalla(p.lat, p.lon);
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < mejorD) { mejorD = d; mejor = p; }
      });
      seleccionado = mejor;
      pintar();
      if (opciones && opciones.alSeleccionar) opciones.alSeleccionar(mejor);
    }

    const observador = new ResizeObserver(() => { if (dimensionar()) pintar(); });
    observador.observe(contenedor);
    const alRedimensionar = () => { if (dimensionar()) pintar(); };
    window.addEventListener('resize', alRedimensionar);
    window.addEventListener('orientationchange', alRedimensionar);
    dimensionar();
    /* si el mapa se creó antes de insertarse en la página, aquí ya tiene tamaño */
    setTimeout(() => { dimensionar(); pintar(); }, 0);

    return {
      agregar(lat, lon, tipo, dato) { puntos.push({ lat, lon, tipo, dato }); pintar(); },
      encuadrar,
      centrarEn(lat, lon, zoom) {
        vista.centroX = lonAX(lon);
        vista.centroY = latAY(lat);
        if (zoom) vista.zoom = zoom;
        pintar();
      },
      posicion(p) { posicion = p; pintar(); },
      seleccionar(dato) {
        seleccionado = puntos.find(p => p.dato === dato) || null;
        pintar();
      },
      pintar,
      destruir() {
        observador.disconnect();
        window.removeEventListener('resize', alRedimensionar);
        window.removeEventListener('orientationchange', alRedimensionar);
        teselas.clear();
      }
    };
  }

  return { crear };
})();
