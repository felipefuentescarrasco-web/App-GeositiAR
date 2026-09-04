/* Lector de códigos QR.

   Primero intenta el detector nativo del navegador (rápido y sin descargar
   nada). Si no existe —Safari, Firefox—, carga jsQR y analiza los cuadros de
   video a mano. También hay entrada manual: si el QR está rayado o el teléfono
   no tiene permiso de cámara, el geotour no se interrumpe. */

const Escaner = (() => {

  let jsqrListo = null;

  function cargarJsQR() {
    if (window.jsQR) return Promise.resolve();
    if (jsqrListo) return jsqrListo;
    jsqrListo = new Promise((ok, fallo) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/jsqr.js';
      s.onload = ok;
      s.onerror = () => fallo(new Error('no se pudo cargar el lector'));
      document.head.appendChild(s);
    });
    return jsqrListo;
  }

  /* Acepta la URL completa del QR, el código del geositio o solo el número. */
  function interpretar(texto) {
    if (!texto) return null;
    const t = String(texto).trim();

    let m = t.match(/[#/]g\/([A-Za-z0-9]+)/);
    if (m) {
      const g = GEOSITIOS.find(x => x.id.toUpperCase() === m[1].toUpperCase());
      if (g) return g;
    }
    m = t.match(/\b(GPM\s?-?0?(\d{1,2}))\b/i);
    if (m) {
      const g = GEOSITIOS.find(x => x.num === parseInt(m[2], 10));
      if (g) return g;
    }
    m = t.match(/\bGST0*(\d{1,5})\b/i);
    if (m) {
      const g = GEOSITIOS.find(x => x.codigo.toUpperCase() === ('GST' + m[1].padStart(5, '0')));
      if (g) return g;
    }
    if (/^\d{1,2}$/.test(t)) {
      const g = GEOSITIOS.find(x => x.num === parseInt(t, 10));
      if (g) return g;
    }
    return null;
  }

  /* Abre la cámara a pantalla completa. alEncontrar recibe el geositio. */
  function abrir(alEncontrar, alCerrar) {
    const video = U.el('video', { playsinline: true, muted: true, autoplay: true });
    const instruccion = U.el('p', { clase: 'instruccion',
      texto: 'Apunta al código QR del cartel del geositio' });

    const capa = U.el('div', { clase: 'escaner' }, [
      video,
      U.el('div', { clase: 'marco' }, [U.el('div', { clase: 'ventana' }, [U.el('i')])]),
      instruccion,
      U.el('button', { clase: 'cerrar', type: 'button', 'aria-label': 'Cerrar el escáner',
        onclick: () => cerrar() }, [U.icono('cerrar')]),
      U.el('div', { clase: 'pie' }, [
        U.el('button', { clase: 'boton secundario', type: 'button',
          onclick: () => { cerrar(); pedirCodigo(alEncontrar); } },
          ['Escribir el número del geositio'])
      ])
    ]);
    document.body.appendChild(capa);

    let flujo = null, detector = null, vivo = true, lienzo = null, ctx = null;

    function cerrar() {
      vivo = false;
      if (flujo) flujo.getTracks().forEach(t => t.stop());
      capa.remove();
      if (alCerrar) alCerrar();
    }

    function encontrado(texto) {
      const g = interpretar(texto);
      if (!g) {
        instruccion.textContent = 'Ese código no corresponde a un geositio de GeoParquemet';
        return false;
      }
      U.vibrar(60);
      cerrar();
      alEncontrar(g);
      return true;
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
    }).then(f => {
      flujo = f;
      video.srcObject = f;
      return video.play();
    }).then(() => {
      if ('BarcodeDetector' in window) {
        return BarcodeDetector.getSupportedFormats().then(fmts => {
          if (fmts.includes('qr_code')) {
            detector = new BarcodeDetector({ formats: ['qr_code'] });
            bucleNativo();
          } else {
            return bucleJsQR();
          }
        });
      }
      return bucleJsQR();
    }).catch(err => {
      cerrar();
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        U.aviso('Sin permiso de cámara. Escribe el número del geositio.', 3600);
      } else {
        U.aviso('No se pudo abrir la cámara en este dispositivo.', 3600);
      }
      pedirCodigo(alEncontrar);
    });

    function bucleNativo() {
      if (!vivo) return;
      detector.detect(video)
        .then(codigos => {
          if (codigos.length && encontrado(codigos[0].rawValue)) return;
          if (vivo) setTimeout(bucleNativo, 220);
        })
        .catch(() => { if (vivo) setTimeout(bucleNativo, 400); });
    }

    function bucleJsQR() {
      return cargarJsQR().then(() => {
        lienzo = document.createElement('canvas');
        ctx = lienzo.getContext('2d', { willReadFrequently: true });
        (function ciclo() {
          if (!vivo) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            /* se analiza a resolución reducida: en un teléfono modesto,
               procesar 1280 px por cuadro deja la imagen a tirones */
            const escala = 480 / Math.max(video.videoWidth, 1);
            lienzo.width = Math.round(video.videoWidth * escala);
            lienzo.height = Math.round(video.videoHeight * escala);
            ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
            const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
            const r = window.jsQR(datos.data, datos.width, datos.height,
              { inversionAttempts: 'dontInvert' });
            if (r && r.data && encontrado(r.data)) return;
          }
          setTimeout(ciclo, 180);
        })();
      }).catch(() => {
        instruccion.textContent = 'No se pudo iniciar el lector. Usa el número del geositio.';
      });
    }

    return cerrar;
  }

  /* Alternativa sin cámara: elegir el geositio de una lista corta. */
  function pedirCodigo(alEncontrar) {
    const campo = U.el('input', {
      clase: 'buscador', type: 'number', inputmode: 'numeric', min: '1', max: '12',
      placeholder: 'Número del geositio (1 a 12)', 'aria-label': 'Número del geositio'
    });
    const lista = U.el('div', { style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px' },
      GEOSITIOS.map(g => U.el('button', {
        clase: 'chip', type: 'button', style: 'text-align:center',
        onclick: () => { cerrar(); alEncontrar(g); }, texto: String(g.num)
      })));
    const cerrar = U.modal(U.el('div', { clase: 'caja' }, [
      U.el('h2', { texto: 'Ir a un geositio' }),
      U.el('p', { clase: 'pequeno tenue',
        texto: 'El número está impreso en el cartel, junto al código QR.' }),
      campo,
      lista
    ]));
    campo.addEventListener('change', () => {
      const g = interpretar(campo.value);
      if (g) { cerrar(); alEncontrar(g); }
      else U.aviso('No existe un geositio con ese número');
    });
    setTimeout(() => campo.focus(), 120);
  }

  return { abrir, interpretar, pedirCodigo };
})();
