/* Corte geológico esquemático oeste–este del cerro San Cristóbal.

   Se dibuja con las cotas y las unidades reales de los doce geositios: el
   cuerpo intrusivo hipabisal forma el núcleo de la cumbre y la Formación
   Abanico lo envuelve en ambos flancos. La exageración vertical es de unas
   2,5 veces, como en cualquier perfil de divulgación. */

const Corte = (() => {

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const LON_O = -70.6400, LON_E = -70.6225;
  const ALT_MIN = 380, ALT_MAX = 900;
  const ANCHO = 820, ALTO = 330;
  const M_IZQ = 34, M_DER = 14, M_SUP = 26, M_INF = 30;

  const x = lon => M_IZQ + (lon - LON_O) / (LON_E - LON_O) * (ANCHO - M_IZQ - M_DER);
  const y = alt => M_SUP + (ALT_MAX - alt) / (ALT_MAX - ALT_MIN) * (ALTO - M_SUP - M_INF);

  function nodo(etiqueta, atributos, texto) {
    const n = document.createElementNS(SVG_NS, etiqueta);
    for (const k in atributos) n.setAttribute(k, atributos[k]);
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  /* Curva suave (Catmull-Rom convertida a Bézier) a partir de puntos. */
  function curva(pts) {
    if (pts.length < 2) return '';
    let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C ' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ', ' +
           c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ', ' +
           p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* Perfil topográfico: cotas reales de los geositios más los extremos. */
  const TOPOGRAFIA = [
    [-70.6400, 560], [-70.6390, 575], [-70.6379, 650], [-70.6377, 658],
    [-70.6360, 760], [-70.6345, 820], [-70.6332, 847], [-70.6320, 838],
    [-70.6300, 800], [-70.6282, 762], [-70.6269, 761], [-70.6255, 718],
    [-70.6240, 700], [-70.6230, 660], [-70.6225, 620]
  ];

  /* Techo del cuerpo intrusivo: aflora en la cumbre y en los geositios 4, 5 y 9,
     y se hunde bajo la Formación Abanico hacia ambos flancos. */
  const TECHO_INTRUSIVO = [
    [-70.6400, 400], [-70.6390, 470], [-70.6382, 620], [-70.6377, 672],
    [-70.6365, 790], [-70.6345, 870], [-70.6332, 880], [-70.6310, 830],
    [-70.6288, 790], [-70.6275, 715], [-70.6265, 620], [-70.6250, 480],
    [-70.6225, 410]
  ];

  const puntos = lista => lista.map(p => [x(p[0]), y(p[1])]);

  function dibujar(opciones) {
    const svg = nodo('svg', {
      class: 'corte-svg', viewBox: '0 0 ' + ANCHO + ' ' + ALTO,
      role: 'img',
      'aria-label': 'Corte geológico esquemático del cerro San Cristóbal de oeste a este, ' +
        'con el cuerpo intrusivo formando el núcleo de la cumbre y la Formación Abanico en los flancos.'
    });

    const topo = puntos(TOPOGRAFIA);
    const techo = puntos(TECHO_INTRUSIVO);
    const base = ALTO - M_INF;

    /* cielo */
    svg.appendChild(nodo('rect', { x: 0, y: 0, width: ANCHO, height: ALTO, fill: '#17211d' }));

    /* Formación Abanico: entre la topografía y el techo del intrusivo */
    const abanico = curva(topo) + ' L ' + techo[techo.length - 1][0] + ' ' + techo[techo.length - 1][1] +
      ' ' + curva(techo.slice().reverse()).replace(/^M/, 'L') + ' Z';
    svg.appendChild(nodo('path', { d: abanico, fill: UNIDADES.OlMa.color, opacity: '.92' }));

    /* Intrusivo hipabisal: desde su techo hacia abajo */
    const intrusivo = curva(techo) + ' L ' + techo[techo.length - 1][0] + ' ' + base +
      ' L ' + techo[0][0] + ' ' + base + ' Z';
    svg.appendChild(nodo('path', { d: intrusivo, fill: UNIDADES.Mh.color, opacity: '.95' }));

    /* Relleno cuaternario de la cuenca, al pie occidental */
    const qs = 'M ' + x(-70.6400) + ' ' + y(560) + ' L ' + x(-70.6390) + ' ' + y(575) +
      ' L ' + x(-70.6386) + ' ' + base + ' L ' + x(-70.6400) + ' ' + base + ' Z';
    svg.appendChild(nodo('path', { d: qs, fill: UNIDADES.Qs.color, opacity: '.9' }));

    /* trama de la roca intrusiva: cruces finas, como en un mapa geológico */
    const trama = nodo('defs');
    const patron = nodo('pattern', {
      id: 'tramaMh', width: 14, height: 14, patternUnits: 'userSpaceOnUse'
    });
    patron.appendChild(nodo('path', {
      d: 'M4 7h6M7 4v6', stroke: 'rgba(255,255,255,.22)', 'stroke-width': 1, fill: 'none'
    }));
    trama.appendChild(patron);
    svg.appendChild(trama);
    svg.appendChild(nodo('path', { d: intrusivo, fill: 'url(#tramaMh)' }));

    /* contacto y superficie del terreno */
    svg.appendChild(nodo('path', {
      d: curva(techo), fill: 'none', stroke: '#f4f1ea', 'stroke-width': 2,
      'stroke-dasharray': '7 4', opacity: '.75'
    }));
    svg.appendChild(nodo('path', {
      d: curva(topo), fill: 'none', stroke: '#dfe8e2', 'stroke-width': 2.4
    }));

    /* eje de altitudes */
    [400, 500, 600, 700, 800].forEach(a => {
      svg.appendChild(nodo('line', {
        x1: M_IZQ - 5, y1: y(a), x2: ANCHO - M_DER, y2: y(a),
        stroke: 'rgba(255,255,255,.10)', 'stroke-width': 1
      }));
      svg.appendChild(nodo('text', { x: M_IZQ - 8, y: y(a) + 3, class: 'etiq', 'text-anchor': 'end' },
        String(a)));
    });
    svg.appendChild(nodo('text', { x: M_IZQ - 8, y: M_SUP - 10, class: 'etiq', 'text-anchor': 'end' }, 'm s.n.m.'));
    svg.appendChild(nodo('text', { x: M_IZQ, y: ALTO - 8, class: 'etiq-fuerte' }, 'O'));
    svg.appendChild(nodo('text', { x: ANCHO - M_DER, y: ALTO - 8, class: 'etiq-fuerte', 'text-anchor': 'end' }, 'E'));
    svg.appendChild(nodo('text', {
      x: ANCHO / 2, y: ALTO - 8, class: 'etiq', 'text-anchor': 'middle'
    }, 'Exageración vertical ≈ 2,5 ×   ·   corte esquemático'));

    /* rótulos de unidades */
    svg.appendChild(nodo('text', {
      x: x(-70.6335), y: y(560), class: 'etiq-fuerte', 'text-anchor': 'middle'
    }, 'Intrusivos hipabisales (Mh)'));
    svg.appendChild(nodo('text', {
      x: x(-70.6250), y: y(690), class: 'etiq-fuerte', 'text-anchor': 'middle'
    }, 'Formación Abanico (OlMa)'));

    /* geositios proyectados sobre la superficie */
    const g = nodo('g');
    GEOSITIOS.forEach(geo => {
      const px = x(geo.lon), py = y(geo.alt);
      if (px < M_IZQ || px > ANCHO - M_DER) return;
      const grupo = nodo('g', { class: 'pin', style: 'cursor:pointer' });
      grupo.appendChild(nodo('line', {
        x1: px, y1: py, x2: px, y2: py - 22, stroke: '#f4f1ea', 'stroke-width': 1.4, opacity: '.7'
      }));
      grupo.appendChild(nodo('circle', {
        cx: px, cy: py - 29, r: 10,
        fill: U.visitado(geo.id) ? '#4f9d7e' : '#c1622f',
        stroke: '#f4f1ea', 'stroke-width': 1.6
      }));
      grupo.appendChild(nodo('text', {
        x: px, y: py - 25.5, class: 'etiq-fuerte', 'text-anchor': 'middle'
      }, String(geo.num)));
      grupo.appendChild(nodo('title', {}, 'Geositio ' + geo.num + ': ' + geo.nombre));
      grupo.addEventListener('click', () => {
        if (opciones && opciones.alTocar) opciones.alTocar(geo);
        else location.hash = '#/g/' + geo.id;
      });
      g.appendChild(grupo);
    });
    svg.appendChild(g);

    return svg;
  }

  function leyenda() {
    const fila = (u, texto) => U.el('div', { clase: 'fila' }, [
      U.el('i', { style: 'width:16px;height:16px;border-radius:4px;flex:0 0 auto;background:' + u.color }),
      U.el('span', { clase: 'pequeno', texto: texto })
    ]);
    return U.el('div', { style: 'display:grid;gap:8px;margin-top:12px' }, [
      fila(UNIDADES.Mh, UNIDADES.Mh.nombre + ' · ' + UNIDADES.Mh.edad),
      fila(UNIDADES.OlMa, UNIDADES.OlMa.nombre + ' · ' + UNIDADES.OlMa.edad),
      fila(UNIDADES.Qs, UNIDADES.Qs.nombre + ' · ' + UNIDADES.Qs.edad)
    ]);
  }

  return { dibujar, leyenda };
})();
