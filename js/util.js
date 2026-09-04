/* Utilidades compartidas: DOM, almacenamiento local, geolocalización y avisos. */

const U = (() => {

  /* ---------------------------------------------------------------- DOM */

  function el(etiqueta, atributos, hijos) {
    const n = document.createElement(etiqueta);
    if (atributos) {
      for (const k in atributos) {
        const v = atributos[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'clase') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'texto') n.textContent = v;
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
        else if (v === true) n.setAttribute(k, '');
        else n.setAttribute(k, v);
      }
    }
    (Array.isArray(hijos) ? hijos : hijos ? [hijos] : []).forEach(h => {
      if (h === null || h === undefined || h === false) return;
      n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
    });
    return n;
  }

  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

  function svg(d, tam) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (tam) { s.style.width = tam + 'px'; s.style.height = tam + 'px'; }
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  }

  const ICONOS = {
    mapa: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
    brujula: 'M12 21a9 9 0 100-18 9 9 0 000 18zm3.5-12.5l-2 5-5 2 2-5 5-2z',
    cubo: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5L12 12 4 7.5',
    esfera: 'M12 21a9 9 0 100-18 9 9 0 000 18zm-9-9h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z',
    lupa: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35',
    audio: 'M11 5L6 9H3v6h3l5 4V5zm4.5 3a5 5 0 010 8m2.5-11a9 9 0 010 14',
    descarga: 'M12 3v12m0 0l-4-4m4 4l4-4M4 19h16',
    listo: 'M4 12l5 5L20 6',
    marcador: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    reloj: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-14v5l3.5 2',
    ampliar: 'M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5',
    cerrar: 'M6 6l12 12M18 6L6 18',
    corte: 'M3 12h18M7 5l-3 7 3 7M17 5l3 7-3 7',
    libro: 'M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 5.5v15',
    qr: 'M4 8V5a1 1 0 011-1h3m8 0h3a1 1 0 011 1v3m0 8v3a1 1 0 01-1 1h-3m-8 0H5a1 1 0 01-1-1v-3M3 12h18'
  };

  const icono = (nombre, tam) => svg(ICONOS[nombre] || ICONOS.marcador, tam);

  /* -------------------------------------------------------- almacenamiento */

  const CLAVE = 'geoparquemet.v1';
  let estado = null;

  function leerEstado() {
    if (estado) return estado;
    try {
      estado = JSON.parse(localStorage.getItem(CLAVE)) || {};
    } catch (e) {
      estado = {};
    }
    estado.visitados = estado.visitados || {};
    estado.ajustes = estado.ajustes || { escala: 1, contraste: false, voz: true };
    return estado;
  }

  function guardarEstado() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(leerEstado()));
    } catch (e) { /* modo privado: la app sigue funcionando sin persistencia */ }
  }

  const visitado = id => !!leerEstado().visitados[id];

  function marcarVisitado(id, valor) {
    const e = leerEstado();
    if (valor === false) delete e.visitados[id];
    else e.visitados[id] = Date.now();
    guardarEstado();
  }

  const totalVisitados = () => Object.keys(leerEstado().visitados).length;

  /* ------------------------------------------------------------- geografía */

  const R_TIERRA = 6371000;
  const rad = g => g * Math.PI / 180;

  function distancia(a, b) {   // metros, fórmula de haversine
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R_TIERRA * Math.asin(Math.sqrt(s));
  }

  function rumbo(a, b) {       // grados desde el norte
    const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
      Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  const PUNTOS_CARDINALES = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
  const cardinal = grados => PUNTOS_CARDINALES[Math.round(((grados % 360) / 45)) % 8];

  const formatoDistancia = m =>
    m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';

  let vigilanciaId = null;
  const oyentesPos = new Set();
  let ultimaPos = null;

  function seguirPosicion(cb) {
    oyentesPos.add(cb);
    if (ultimaPos) cb(ultimaPos);
    if (vigilanciaId === null && navigator.geolocation) {
      vigilanciaId = navigator.geolocation.watchPosition(p => {
        ultimaPos = { lat: p.coords.latitude, lon: p.coords.longitude,
                      precision: p.coords.accuracy, rumbo: p.coords.heading };
        oyentesPos.forEach(f => f(ultimaPos));
      }, err => {
        oyentesPos.forEach(f => f(null, err));
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    }
    return () => {
      oyentesPos.delete(cb);
      if (!oyentesPos.size && vigilanciaId !== null) {
        navigator.geolocation.clearWatch(vigilanciaId);
        vigilanciaId = null;
      }
    };
  }

  /* ------------------------------------------------------------- interfaz */

  let tiempoAviso = null;
  function aviso(texto, ms) {
    const cont = $('#avisos');
    cont.innerHTML = '';
    cont.appendChild(el('div', { clase: 'aviso', texto: texto }));
    clearTimeout(tiempoAviso);
    tiempoAviso = setTimeout(() => { cont.innerHTML = ''; }, ms || 2600);
  }

  function modal(contenido, opciones) {
    const capa = $('#capaModal');
    capa.innerHTML = '';
    capa.hidden = false;
    document.body.style.overflow = 'hidden';
    const cerrar = () => {
      capa.hidden = true;
      capa.innerHTML = '';
      document.body.style.overflow = '';
      if (opciones && opciones.alCerrar) opciones.alCerrar();
    };
    capa.appendChild(el('button', {
      clase: 'cerrar-modal', 'aria-label': 'Cerrar', onclick: cerrar
    }, [icono('cerrar')]));
    capa.appendChild(contenido);
    capa.onclick = ev => { if (ev.target === capa) cerrar(); };
    return cerrar;
  }

  function vibrar(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms || 30); } catch (e) {} }
  }

  /* ------------------------------------------------------------- contenido */

  const geositio = id => GEOSITIOS.find(g => g.id === id);
  const ruta = id => RUTAS.find(r => r.id === id);

  function geositiosDeRuta(idRuta) {
    const r = ruta(idRuta);
    return r ? r.geositios.map(geositio).filter(Boolean) : [];
  }

  function portada(g) {
    if (g.fotos && g.fotos.length) return 'assets/fotos/' + g.fotos[0].interp;
    if (g.muestra) return 'assets/fotos/' + g.muestra.interp;
    if (g.pano) return 'assets/360/' + g.pano.base;
    return null;
  }

  function miniatura(g) {
    if (g.fotos && g.fotos.length) return 'assets/fotos/t_' + g.fotos[0].interp;
    if (g.muestra) return 'assets/fotos/t_' + g.muestra.interp;
    return null;
  }

  /* Convierte los términos del glosario del texto en palabras pulsables. */
  function conGlosario(texto, terminos) {
    const cont = el('span');
    if (!terminos || !terminos.length) { cont.textContent = texto; return cont; }
    const mapa = {};
    terminos.forEach(t => {
      if (!GLOSARIO[t]) return;
      mapa[normaliza(t)] = t;
    });
    const palabras = texto.split(/(\s+)/);
    let usados = {};
    palabras.forEach(p => {
      const limpio = normaliza(p.replace(/[^\wáéíóúüñÁÉÍÓÚÑ]/gi, ''));
      const clave = mapa[limpio] || mapa[limpio.replace(/s$/, '')];
      if (clave && !usados[clave]) {
        usados[clave] = true;
        const antes = p.match(/^\W*/)[0], despues = p.match(/\W*$/)[0];
        if (antes) cont.appendChild(document.createTextNode(antes));
        cont.appendChild(el('button', {
          clase: 'termino', type: 'button',
          onclick: () => mostrarTermino(clave),
          texto: p.slice(antes.length, p.length - despues.length)
        }));
        if (despues) cont.appendChild(document.createTextNode(despues));
      } else {
        cont.appendChild(document.createTextNode(p));
      }
    });
    return cont;
  }

  const normaliza = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const tituloTermino = clave =>
    (typeof TITULOS_GLOSARIO !== 'undefined' && TITULOS_GLOSARIO[clave]) ||
    clave.charAt(0).toUpperCase() + clave.slice(1);

  function mostrarTermino(clave) {
    modal(el('div', { clase: 'caja' }, [
      el('h2', { texto: tituloTermino(clave) }),
      el('p', { texto: GLOSARIO[clave] }),
      el('a', { clase: 'boton secundario ancho', href: '#/glosario',
                texto: 'Ver todo el glosario', onclick: () => $('#capaModal').click() })
    ]));
  }

  /* --------------------------------------------------------------- audio */

  let vozActual = null;

  function leerEnVoz(texto) {
    if (!('speechSynthesis' in window)) { aviso('Este teléfono no puede leer en voz alta'); return false; }
    detenerVoz();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-CL';
    u.rate = 0.98;
    const voces = speechSynthesis.getVoices();
    const es = voces.find(v => /es[-_]CL/i.test(v.lang)) || voces.find(v => /^es/i.test(v.lang));
    if (es) u.voice = es;
    vozActual = u;
    speechSynthesis.speak(u);
    return u;
  }

  function detenerVoz() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    vozActual = null;
  }

  const hablando = () => 'speechSynthesis' in window && speechSynthesis.speaking;

  return {
    el, $, $$, icono, svg,
    leerEstado, guardarEstado, visitado, marcarVisitado, totalVisitados,
    distancia, rumbo, cardinal, formatoDistancia, seguirPosicion,
    aviso, modal, vibrar,
    geositio, ruta, geositiosDeRuta, portada, miniatura,
    conGlosario, mostrarTermino, tituloTermino, normaliza,
    leerEnVoz, detenerVoz, hablando
  };
})();
