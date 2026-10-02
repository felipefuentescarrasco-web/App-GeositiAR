/* Vistas de la app. Cada función devuelve el nodo de la vista y, si necesita
   limpiar algo al salir, lo registra en Vistas.alSalir. */

const Vistas = (() => {

  let tareasDeSalida = [];
  const alSalir = fn => tareasDeSalida.push(fn);
  function limpiar() {
    tareasDeSalida.forEach(f => { try { f(); } catch (e) {} });
    tareasDeSalida = [];
    Visor3D.limpiar();
    Pano.limpiar();
    U.detenerVoz();
  }

  /* ------------------------------------------------------------- piezas */

  function tarjetaGeositio(g, mostrarDistancia) {
    const mini = U.miniatura(g);
    const cont = U.el('a', {
      clase: 'tarjeta tarjeta-geositio', href: '#/g/' + g.id
    }, [
      U.el('div', {
        clase: 'miniatura',
        style: mini ? 'background-image:url(' + mini + ')' : ''
      }, [U.el('span', { clase: 'num', texto: String(g.num) })]),
      U.el('div', { clase: 'texto' }, [
        U.el('h3', { texto: g.nombre }),
        U.el('p', { clase: 'pequeno tenue', style: 'margin:0',
                    texto: g.subtitulo || g.interes }),
        U.el('div', { clase: 'meta' }, [
          U.el('span', { clase: 'etiqueta unidad-' + g.unidad, texto: UNIDADES[g.unidad].nombre }),
          U.visitado(g.id) ? U.el('span', { clase: 'visitado-check', texto: '✓ visitado' }) : null,
          mostrarDistancia ? U.el('span', { clase: 'pequeno tenue', 'data-distancia': g.id }) : null
        ])
      ])
    ]);
    return cont;
  }

  function bloqueProgreso() {
    const total = GEOSITIOS.length;
    const hechos = GEOSITIOS.filter(g => U.visitado(g.id)).length;
    return U.el('div', { clase: 'tarjeta' }, [
      U.el('div', { clase: 'tarjeta-cuerpo' }, [
        U.el('div', { clase: 'fila-sep', style: 'margin-bottom:10px' }, [
          U.el('b', { texto: 'Tu geotour' }),
          U.el('span', { clase: 'pequeno tenue', texto: hechos + ' de ' + total + ' geositios' })
        ]),
        U.el('div', { clase: 'progreso-barra' }, [
          U.el('i', { style: 'width:' + (hechos / total * 100) + '%' })
        ]),
        hechos === total
          ? U.el('p', { clase: 'pequeno', style: 'margin:10px 0 0;color:var(--musgo)',
              texto: '¡Recorriste los doce geositios del parque!' })
          : U.el('p', { clase: 'pequeno tenue', style: 'margin:10px 0 0',
              texto: 'Cada geositio se marca solo al escanear su código QR.' })
      ])
    ]);
  }

  function tarjetaRuta(r) {
    const geos = U.geositiosDeRuta(r.id);
    const hechos = geos.filter(g => U.visitado(g.id)).length;
    return U.el('a', { clase: 'tarjeta', href: '#/ruta/' + r.id,
                       style: 'display:block;text-decoration:none;color:inherit' }, [
      U.el('div', { style: 'height:6px;background:' + r.color }),
      U.el('div', { clase: 'tarjeta-cuerpo' }, [
        U.el('h3', { texto: r.nombre }),
        U.el('p', { clase: 'pequeno tenue', texto: r.descripcion }),
        U.el('div', { clase: 'fila', style: 'flex-wrap:wrap;gap:6px' }, [
          U.el('span', { clase: 'etiqueta', texto: geos.length + ' geositios' }),
          U.el('span', { clase: 'etiqueta', texto: r.distancia }),
          U.el('span', { clase: 'etiqueta', texto: r.duracion }),
          hechos ? U.el('span', { clase: 'etiqueta musgo', texto: hechos + ' visitados' }) : null
        ])
      ])
    ]);
  }

  /* -------------------------------------------------------------- inicio */

  /* Selector de idioma (js/i18n.js). Cambiar de idioma recarga la app. */
  function selectorIdioma(compacto) {
    return U.el('div', { clase: 'controles-3d', 'data-sin-traducir': true,
      role: 'group', 'aria-label': 'Idioma' },
      Object.keys(I18N.IDIOMAS).map(k => {
        const i = I18N.IDIOMAS[k];
        return U.el('button', {
          clase: 'chip', type: 'button', lang: k, 'aria-pressed': String(k === I18N.idioma),
          'aria-label': i.nombre, onclick: () => { if (k !== I18N.idioma) I18N.cambiar(k); }
        }, [compacto ? i.bandera + ' ' + k.toUpperCase() : i.bandera + ' ' + i.nombre]);
      }));
  }

  function inicio() {
    const cercano = U.el('div');

    const vista = U.el('div', {}, [
      U.el('section', { clase: 'portada' }, [
        U.el('h1', { texto: 'GeoParquemet' }),
        U.el('p', { clase: 'lema',
          texto: 'Geotours por el cerro San Cristóbal. Escanea el código QR del ' +
                 'geositio y mira la geología que tienes delante.' }),
        selectorIdioma(true)
      ]),
      U.el('div', { clase: 'contenido' }, [
        U.el('div', { clase: 'acciones-inicio' }, [
          U.el('a', { clase: 'boton ancho', href: '#/escanear' },
            [U.icono('qr'), 'Escanear el QR del geositio']),
          U.el('a', { clase: 'boton secundario ancho', href: '#/mapa' },
            [U.icono('mapa'), 'Ver el mapa de geositios'])
        ]),
        cercano,
        U.el('h2', { style: 'margin-top:22px', texto: 'Georutas' }),
        U.el('div', {}, RUTAS.map(tarjetaRuta)),
        bloqueProgreso(),
        U.el('h2', { style: 'margin-top:22px', texto: 'Antes de partir' }),
        U.el('a', { clase: 'tarjeta', href: '#/historia',
                    style: 'display:block;text-decoration:none;color:inherit' }, [
          U.el('div', { clase: 'tarjeta-cuerpo' }, [
            U.el('h3', { texto: 'La historia geológica en cinco actos' }),
            U.el('p', { clase: 'pequeno tenue', style: 'margin:0',
              texto: 'De los volcanes de hace 34 millones de años al bloque que se ' +
                     'suelta hoy de un talud.' })
          ])
        ]),
        U.el('a', { clase: 'tarjeta', href: '#/corte',
                    style: 'display:block;text-decoration:none;color:inherit' }, [
          U.el('div', { clase: 'tarjeta-cuerpo' }, [
            U.el('h3', { texto: 'Corte geológico del cerro' }),
            U.el('p', { clase: 'pequeno tenue', style: 'margin:0',
              texto: 'Qué hay bajo tus pies y por qué la cumbre está donde está.' })
          ])
        ]),
        U.el('p', { clase: 'pequeno tenue centrado', style: 'margin-top:24px',
          texto: 'Unidad de Geopatrimonio · SERNAGEOMIN · Parque Metropolitano de Santiago' })
      ])
    ]);

    /* geositio más cercano: solo aparece si el GPS responde */
    const parar = U.seguirPosicion(pos => {
      if (!pos) return;
      let mejor = null, mejorD = Infinity;
      GEOSITIOS.forEach(g => {
        const d = U.distancia(pos, g);
        if (d < mejorD) { mejorD = d; mejor = g; }
      });
      if (!mejor) return;
      cercano.innerHTML = '';
      cercano.appendChild(U.el('div', { clase: 'tarjeta' }, [
        U.el('div', { clase: 'tarjeta-cuerpo' }, [
          U.el('div', { clase: 'pequeno tenue', texto: 'Lo más cercano a ti' }),
          U.el('h3', { style: 'margin:4px 0 6px', texto: 'Geositio ' + mejor.num + ': ' + mejor.nombre }),
          U.el('p', { clase: 'pequeno', style: 'margin:0 0 12px',
            texto: 'A ' + U.formatoDistancia(mejorD) + ' hacia el ' +
                   U.cardinal(U.rumbo(pos, mejor)) + '.' }),
          U.el('a', { clase: 'boton ancho', href: '#/g/' + mejor.id, texto: 'Abrir su ficha' })
        ])
      ]));
    });
    alSalir(parar);

    return vista;
  }

  /* --------------------------------------------------------------- rutas */

  function rutas() {
    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Georutas' }),
      U.el('p', { clase: 'tenue',
        texto: 'Dos recorridos con sentido: cada uno cuenta una parte distinta de la ' +
               'historia del cerro. Puedes hacerlos completos o visitar geositios sueltos.' }),
      U.el('div', {}, RUTAS.map(tarjetaRuta)),
      U.el('hr', { clase: 'sep' }),
      U.el('h2', { texto: 'Todos los geositios' }),
      U.el('div', {}, GEOSITIOS.map(g => tarjetaGeositio(g)))
    ]);
  }

  function ruta(id) {
    const r = U.ruta(id);
    if (!r) return noEncontrado();
    const geos = U.geositiosDeRuta(id);

    return U.el('div', { clase: 'contenido' }, [
      U.el('span', { clase: 'etiqueta lava', texto: 'Georuta ' + (RUTAS.indexOf(r) + 1) }),
      U.el('h1', { style: 'margin-top:10px', texto: r.corta }),
      U.el('p', { texto: r.descripcion }),
      U.el('div', { clase: 'tarjeta' }, [
        U.el('div', { clase: 'tarjeta-cuerpo' }, [
          U.el('dl', { clase: 'lista-datos' }, [
            U.el('dt', { texto: 'Inicio' }), U.el('dd', { texto: r.inicio }),
            U.el('dt', { texto: 'Término' }), U.el('dd', { texto: r.fin }),
            U.el('dt', { texto: 'Distancia' }), U.el('dd', { texto: r.distancia }),
            U.el('dt', { texto: 'Desnivel' }), U.el('dd', { texto: r.desnivel }),
            U.el('dt', { texto: 'Duración' }), U.el('dd', { texto: r.duracion }),
            U.el('dt', { texto: 'Dificultad' }), U.el('dd', { texto: r.dificultad })
          ])
        ])
      ]),
      U.el('div', { clase: 'aviso-caja' }, [
        U.el('p', { clase: 'pequeno', style: 'margin:0',
          texto: 'Lleva agua y gorro: la ladera tiene poca sombra. No te salgas de los ' +
                 'senderos ni golpees las rocas de los geositios: son patrimonio de todos.' })
      ]),
      U.el('h2', { style: 'margin-top:20px', texto: 'Paradas' }),
      U.el('div', {}, geos.map(g => tarjetaGeositio(g))),
      U.el('a', { clase: 'boton ancho', href: '#/mapa?ruta=' + r.id },
        [U.icono('mapa'), 'Ver la ruta en el mapa'])
    ]);
  }

  /* ------------------------------------------------------------ geositio */

  function geositio(id) {
    const g = U.geositio(id);
    if (!g) return noEncontrado();

    const foto = U.portada(g);
    const unidad = UNIDADES[g.unidad];

    /* --- cabecera --- */
    const cabecera = U.el('header', {
      clase: 'cabecera-geositio',
      style: foto ? 'background-image:url(' + foto + ')' : ''
    }, [
      U.el('div', { clase: 'titulo' }, [
        U.el('span', { clase: 'numero', texto: 'Geositio ' + g.num }),
        U.el('h1', { texto: g.nombre }),
        g.subtitulo ? U.el('p', { clase: 'sub', style: 'margin:4px 0 0', texto: g.subtitulo }) : null
      ])
    ]);

    /* --- acciones --- */
    const btnVisita = U.el('button', { clase: 'chip', type: 'button' });
    function pintarVisita() {
      const v = U.visitado(g.id);
      btnVisita.setAttribute('aria-pressed', String(v));
      btnVisita.textContent = v ? '✓ Visitado' : 'Marcar como visitado';
    }
    btnVisita.addEventListener('click', () => {
      U.marcarVisitado(g.id, !U.visitado(g.id));
      pintarVisita();
      U.aviso(U.visitado(g.id) ? 'Geositio marcado como visitado' : 'Marca quitada');
    });
    pintarVisita();

    const btnVoz = U.el('button', { clase: 'chip', type: 'button' }, ['Escuchar']);
    btnVoz.addEventListener('click', () => {
      if (U.hablando()) { U.detenerVoz(); btnVoz.textContent = 'Escuchar'; return; }
      const texto = [
        I18N.t('Geositio ' + g.num) + '. ' + g.nombre + '.',
        g.gancho,
        I18N.t('Qué observar.') + ' ' + (g.claves || []).join(' '),
        g.observa || ''
      ].join(' ');
      U.leerEnVoz(texto);
      btnVoz.textContent = 'Detener';
      const revisar = setInterval(() => {
        if (!U.hablando()) { btnVoz.textContent = 'Escuchar'; clearInterval(revisar); }
      }, 700);
      alSalir(() => clearInterval(revisar));
    });

    const btnLlegar = U.el('a', {
      clase: 'chip',
      href: 'https://www.google.com/maps/dir/?api=1&destination=' + g.lat + ',' + g.lon,
      target: '_blank', rel: 'noopener', texto: 'Cómo llegar'
    });

    const distancia = U.el('span', { clase: 'pequeno tenue' });
    alSalir(U.seguirPosicion(pos => {
      if (!pos) return;
      const d = U.distancia(pos, g);
      distancia.textContent = 'Estás a ' + U.formatoDistancia(d) + ' · ' +
        (d < 40 ? 'ya llegaste' : 'hacia el ' + U.cardinal(U.rumbo(pos, g)));
    }));

    /* --- pestañas --- */
    const secciones = [];

    secciones.push({ id: 'terreno', titulo: 'En terreno', crear: () => panelTerreno(g) });
    if (g.fotos && g.fotos.length)
      secciones.push({ id: 'fotos', titulo: 'Fotos interpretadas', crear: () => panelFotos(g) });
    if (g.modelo)
      secciones.push({ id: 'modelo', titulo: 'Modelo 3D', crear: () => panelModelo(g) });
    if (g.pano)
      secciones.push({ id: 'pano', titulo: '360°', crear: () => panelPano(g) });
    if (g.muestra)
      secciones.push({ id: 'muestra', titulo: 'Muestra de mano', crear: () => panelMuestra(g) });
    secciones.push({ id: 'ficha', titulo: 'Ficha geológica', crear: () => panelFicha(g) });

    const barraPestanas = U.el('div', { clase: 'pestanas', role: 'tablist' });
    const contenedorPaneles = U.el('div', { clase: 'contenido' });
    const paneles = {};

    secciones.forEach((s, i) => {
      const boton = U.el('button', {
        clase: 'pestana', role: 'tab', type: 'button',
        'aria-selected': String(i === 0), 'aria-controls': 'panel-' + s.id,
        texto: s.titulo
      });
      boton.addEventListener('click', () => elegir(s.id));
      barraPestanas.appendChild(boton);
      s.boton = boton;
    });

    function elegir(idSeccion) {
      secciones.forEach(s => {
        const activo = s.id === idSeccion;
        s.boton.setAttribute('aria-selected', String(activo));
        if (activo && !paneles[s.id]) {
          paneles[s.id] = U.el('div', { clase: 'panel', id: 'panel-' + s.id, role: 'tabpanel' },
            [s.crear()]);
          contenedorPaneles.appendChild(paneles[s.id]);
        }
        if (paneles[s.id]) paneles[s.id].hidden = !activo;
      });
    }

    const otros = vecinos(g);

    const vista = U.el('div', {}, [
      cabecera,
      U.el('div', { clase: 'contenido', style: 'padding-bottom:0' }, [
        U.el('p', { clase: 'gancho', texto: g.gancho }),
        U.el('div', { clase: 'controles-3d' }, [btnVisita, btnVoz, btnLlegar]),
        distancia,
        bloqueRA(g)
      ]),
      barraPestanas,
      contenedorPaneles,
      U.el('div', { clase: 'contenido' }, [
        U.el('hr', { clase: 'sep' }),
        U.el('div', { clase: 'grid-2' }, [
          otros.anterior
            ? U.el('a', { clase: 'boton secundario', href: '#/g/' + otros.anterior.id,
                texto: '← Geositio ' + otros.anterior.num })
            : U.el('span'),
          otros.siguiente
            ? U.el('a', { clase: 'boton secundario', href: '#/g/' + otros.siguiente.id,
                texto: 'Geositio ' + otros.siguiente.num + ' →' })
            : U.el('span')
        ])
      ])
    ]);

    elegir(secciones[0].id);
    return vista;
  }

  /* Realidad aumentada (ar.html): la interpretación dibujada sobre la roca, con la cámara.
     "Sobre la roca" reconoce el afloramiento con las fotos de terreno; "Con hoja impresa"
     sigue la hoja de ar/hoja-ra.pdf pegada en la roca, que se sostiene más firme. */
  const GEOSITIOS_RA = [1, 2, 3, 6];
  function bloqueRA(g) {
    if (!GEOSITIOS_RA.includes(g.num)) return null;
    return U.el('div', { style: 'margin-top:14px' }, [
      U.el('div', { clase: 'grid-2' }, [
        U.el('a', { clase: 'boton', href: 'ar.html?g=' + g.num, texto: '📷 RA sobre la roca' }),
        U.el('a', { clase: 'boton secundario', href: 'ar.html?g=' + g.num + '&m=1',
          texto: '📄 RA con hoja impresa' })
      ]),
      U.el('p', { clase: 'pequeno tenue', style: 'margin:6px 0 0' }, [
        'La hoja impresa se ancla mejor. ',
        U.el('a', { href: 'ar/hoja-ra.pdf', target: '_blank', rel: 'noopener', texto: 'Descargar la hoja (PDF)' })
      ])
    ]);
  }

  function vecinos(g) {
    const r = U.ruta(g.ruta);
    if (!r) return {};
    const lista = r.geositios;
    const i = lista.indexOf(g.id);
    return {
      anterior: i > 0 ? U.geositio(lista[i - 1]) : null,
      siguiente: i >= 0 && i < lista.length - 1 ? U.geositio(lista[i + 1]) : null
    };
  }

  /* ---------------------------------------------------- paneles del geositio */

  function panelTerreno(g) {
    return U.el('div', {}, [
      U.el('h2', { texto: 'Qué mirar aquí' }),
      U.el('ul', { clase: 'claves' }, (g.claves || []).map(c =>
        U.el('li', {}, [U.conGlosario(c, g.glosario)]))),
      g.observa ? U.el('div', { clase: 'aviso-caja' }, [
        U.el('div', { clase: 'pequeno tenue', texto: 'Pista de campo' }),
        U.el('p', { style: 'margin:4px 0 0', texto: g.observa })
      ]) : null,
      g.fotos && g.fotos.length ? U.el('div', { style: 'margin-top:18px' }, [
        Cortina.bloque(g.fotos[0], 'assets/fotos/', true)
      ]) : null,
      U.el('div', { clase: 'tarjeta', style: 'margin-top:6px' }, [
        U.el('div', { clase: 'tarjeta-cuerpo' }, [
          U.el('div', { clase: 'fila', style: 'gap:8px;flex-wrap:wrap' }, [
            U.el('span', { clase: 'etiqueta unidad-' + g.unidad, texto: UNIDADES[g.unidad].nombre }),
            U.el('span', { clase: 'etiqueta', texto: g.litologia })
          ]),
          U.el('p', { clase: 'pequeno tenue', style: 'margin:10px 0 0',
            texto: UNIDADES[g.unidad].resumen })
        ])
      ])
    ]);
  }

  function panelFotos(g) {
    return U.el('div', {}, [
      U.el('p', { clase: 'pequeno tenue',
        texto: 'Desliza el control sobre cada fotografía: a la izquierda queda la foto tal ' +
               'cual, a la derecha la interpretación geológica dibujada sobre ella.' }),
      ...g.fotos.map((f, i) => Cortina.bloque(f, 'assets/fotos/', i === 0))
    ]);
  }

  function panelModelo(g) {
    return U.el('div', {}, [
      U.el('p', { clase: 'pequeno tenue',
        texto: 'Modelo construido con fotogrametría en terreno. Gíralo con un dedo, acércalo ' +
               'con dos y usa el corte transparente para mirar el interior de la roca.' }),
      Visor3D.bloque(g.modelo)
    ]);
  }

  function panelPano(g) {
    return U.el('div', {}, [
      U.el('p', { clase: 'pequeno tenue',
        texto: 'Panorámica esférica tomada en el punto de observación. Mueve la vista y sube ' +
               'la interpretación para reconocer las estructuras.' }),
      Pano.bloque(g.pano)
    ]);
  }

  function panelMuestra(g) {
    return U.el('div', {}, [
      U.el('p', { clase: 'pequeno tenue',
        texto: 'Muestra de mano recogida en el geositio, fotografiada en laboratorio.' }),
      Cortina.bloque(g.muestra, 'assets/fotos/', true)
    ]);
  }

  function panelFicha(g) {
    const filas = [
      ['Código del inventario', g.codigo],
      ['Unidad geológica', UNIDADES[g.unidad].nombre + ' (' + g.unidad + ')'],
      ['Edad', UNIDADES[g.unidad].edad],
      ['Litología', g.litologia],
      ['Clase de roca', g.clase],
      ['Interés geocientífico', g.interes],
      ['Valor principal', g.valor],
      ['Estado de conservación', g.conservacion],
      ['Figura de protección', g.proteccion || 'Parque urbano'],
      ['Altitud', g.alt + ' m s.n.m.'],
      ['Coordenadas', g.lat.toFixed(4) + '°, ' + g.lon.toFixed(4) + '° (WGS84)']
    ];

    const parrafos = String(g.descripcion).split('\n\n').map(p =>
      U.el('p', {}, [U.conGlosario(p, g.glosario)]));

    return U.el('div', {}, [
      U.el('h2', { texto: 'Descripción' }),
      ...parrafos,
      g.estructura ? U.el('div', {}, [
        U.el('h3', { texto: 'Estructuras' }),
        U.el('p', {}, [U.conGlosario(g.estructura, g.glosario)])
      ]) : null,
      g.alteracion ? U.el('div', {}, [
        U.el('h3', { texto: 'Alteración' }),
        U.el('p', {}, [U.conGlosario(g.alteracion, g.glosario)])
      ]) : null,
      g.geotecnia ? U.el('div', {}, [
        U.el('h3', { texto: 'Comportamiento geotécnico' }),
        U.el('p', {}, [U.conGlosario(g.geotecnia, g.glosario)])
      ]) : null,
      U.el('h3', { style: 'margin-top:18px', texto: 'Datos del inventario' }),
      U.el('dl', { clase: 'lista-datos' }, filas.flatMap(([k, v]) =>
        [U.el('dt', { texto: k }), U.el('dd', { texto: String(v) })])),
      U.el('p', { clase: 'pequeno tenue', style: 'margin-top:16px',
        texto: 'Fuente: Inventario Nacional de Geositios, SERNAGEOMIN. ' +
               'Unidad de Geopatrimonio, proyecto GEOPARQUEMET.' })
    ]);
  }

  /* ---------------------------------------------------------------- mapa */

  function mapa(parametros) {
    const contenedor = U.el('div', { clase: 'envoltura-mapa' });
    const ficha = U.el('div');
    const vista = U.el('div', {}, [contenedor, ficha]);

    /* Se monta de inmediato: el mapa mide su contenedor con un ResizeObserver,
       así que no importa que todavía no esté insertado en la página. */
    (function montar() {
      const m = Mapa.crear(contenedor, {
        alSeleccionar: p => {
          ficha.innerHTML = '';
          if (!p) return;
          if (p.tipo === 'geositio') {
            const g = p.dato;
            ficha.appendChild(U.el('div', { clase: 'mapa-ficha' }, [
              U.el('div', { clase: 'pequeno tenue', texto: 'Geositio ' + g.num }),
              U.el('h3', { style: 'margin:2px 0 8px', texto: g.nombre }),
              U.el('a', { clase: 'boton ancho', href: '#/g/' + g.id, texto: 'Abrir ficha' })
            ]));
          } else {
            ficha.appendChild(U.el('div', { clase: 'mapa-ficha' }, [
              U.el('h3', { style: 'margin:0 0 6px', texto: p.dato.nombre }),
              U.el('p', { clase: 'pequeno tenue', style: 'margin:0', texto: p.dato.texto })
            ]));
          }
        }
      });

      GEOSITIOS.forEach(g => m.agregar(g.lat, g.lon, 'geositio', g));
      PUNTOS.forEach(p => m.agregar(p.lat, p.lon, p.tipo, p));

      const idRuta = parametros && parametros.ruta;
      const foco = idRuta ? U.geositiosDeRuta(idRuta) : GEOSITIOS;
      m.encuadrar(foco.length ? foco : GEOSITIOS);

      contenedor.appendChild(U.el('div', { clase: 'mapa-leyenda' }, [
        U.el('div', {}, [U.el('i', { style: 'background:#c1622f' }), 'Geositio por visitar']),
        U.el('div', {}, [U.el('i', { style: 'background:#4f9d7e' }), 'Geositio visitado']),
        U.el('div', {}, [U.el('i', { style: 'background:#d8c08a' }), 'Mirador / cantera'])
      ]));

      const btnUbicar = U.el('button', {
        clase: 'mapa-boton', type: 'button', 'aria-label': 'Centrar en mi posición'
      }, [U.icono('brujula')]);
      const btnTodo = U.el('button', {
        clase: 'mapa-boton', type: 'button', 'aria-label': 'Ver todos los geositios',
        onclick: () => m.encuadrar(GEOSITIOS)
      }, [U.icono('mapa')]);
      contenedor.appendChild(U.el('div', { clase: 'mapa-controles' }, [btnTodo, btnUbicar]));

      let ultima = null;
      alSalir(U.seguirPosicion((pos, err) => {
        if (err) { U.aviso('Sin señal de GPS por ahora'); return; }
        if (!pos) return;
        ultima = pos;
        m.posicion(pos);
      }));
      btnUbicar.addEventListener('click', () => {
        if (ultima) m.centrarEn(ultima.lat, ultima.lon, 17);
        else U.aviso('Buscando tu posición…');
      });

      alSalir(() => m.destruir());
    })();

    return vista;
  }

  /* ------------------------------------------------------------ historia */

  function historia() {
    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Historia geológica' }),
      U.el('p', { clase: 'tenue',
        texto: 'El cerro San Cristóbal es un cerro isla en medio de Santiago. Esta es, en ' +
               'cinco actos, la historia que cuentan sus rocas.' }),
      U.el('ol', { clase: 'tiempo' }, HISTORIA.map(h => U.el('li', {}, [
        U.el('div', { clase: 'cuando', texto: h.t }),
        U.el('h3', { style: 'margin:4px 0 4px', texto: h.titulo }),
        U.el('p', { clase: 'pequeno', style: 'margin:0' }, [U.conGlosario(h.texto, Object.keys(GLOSARIO))]),
        h.unidad ? U.el('span', { clase: 'etiqueta unidad-' + h.unidad,
          style: 'margin-top:8px', texto: UNIDADES[h.unidad].nombre }) : null
      ]))),
      U.el('a', { clase: 'boton ancho', style: 'margin-top:18px', href: '#/corte',
        texto: 'Ver el corte geológico' })
    ]);
  }

  function corteGeologico() {
    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Corte geológico' }),
      U.el('p', { clase: 'tenue',
        texto: 'Perfil oeste–este del cerro. El cuerpo intrusivo, más duro, forma el núcleo ' +
               'de la cumbre; la Formación Abanico lo envuelve en los dos flancos. Toca un ' +
               'geositio para abrir su ficha.' }),
      Corte.dibujar({}),
      Corte.leyenda(),
      U.el('p', { clase: 'pequeno tenue', style: 'margin-top:16px',
        texto: 'Esquema didáctico construido con las cotas y unidades de los doce geositios. ' +
               'No sustituye a la carta geológica del área.' })
    ]);
  }

  /* ------------------------------------------------------------ glosario */

  function glosario() {
    const lista = U.el('div');
    const campo = U.el('input', {
      clase: 'buscador', type: 'search', placeholder: 'Buscar un término…',
      'aria-label': 'Buscar en el glosario'
    });

    function pintar(filtro) {
      lista.innerHTML = '';
      const f = U.normaliza(filtro || '');
      Object.keys(GLOSARIO)
        .sort((a, b) => U.tituloTermino(a).localeCompare(U.tituloTermino(b), I18N.idioma))
        .forEach(k => {
        if (f && U.normaliza(U.tituloTermino(k)).indexOf(f) < 0 && U.normaliza(k).indexOf(f) < 0 &&
            U.normaliza(GLOSARIO[k]).indexOf(f) < 0) return;
        lista.appendChild(U.el('div', { clase: 'glosario-item' }, [
          U.el('b', { texto: U.tituloTermino(k) }),
          U.el('span', { clase: 'pequeno', texto: GLOSARIO[k] })
        ]));
      });
      if (!lista.children.length)
        lista.appendChild(U.el('p', { clase: 'tenue', texto: 'Sin resultados.' }));
    }

    campo.addEventListener('input', () => pintar(campo.value));
    pintar('');

    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Glosario' }),
      campo, lista
    ]);
  }

  /* ----------------------------------------------------------------- más */

  function mas() {
    const enlace = (href, titulo, texto) => U.el('a', {
      clase: 'tarjeta', href: href, style: 'display:block;text-decoration:none;color:inherit'
    }, [U.el('div', { clase: 'tarjeta-cuerpo' }, [
      U.el('h3', { texto: titulo }),
      U.el('p', { clase: 'pequeno tenue', style: 'margin:0', texto: texto })
    ])]);

    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Más' }),
      enlace('#/historia', 'Historia geológica', 'Los cinco actos que formaron el cerro.'),
      enlace('#/corte', 'Corte geológico', 'Qué hay bajo tus pies.'),
      enlace('#/glosario', 'Glosario', 'Toba, fiamme, disyunción y el resto del vocabulario.'),
      enlace('#/unidades', 'Unidades geológicas', 'Las tres unidades que verás en el parque.'),
      enlace('#/ajustes', 'Ajustes y accesibilidad', 'Tamaño del texto, contraste y datos guardados.'),
      enlace('qr.html', 'Generar los carteles QR', 'Para el equipo del parque: códigos listos para imprimir.'),
      U.el('hr', { clase: 'sep' }),
      U.el('h2', { texto: 'Sobre esta app' }),
      U.el('p', { clase: 'pequeno tenue',
        texto: 'GeoParquemet Geotours reúne el material del proyecto GEOPARQUEMET de la ' +
               'Unidad de Geopatrimonio de SERNAGEOMIN: el inventario de geositios, las ' +
               'fotografías interpretadas, los modelos fotogramétricos y las panorámicas 360°, ' +
               'preparados para consultarse en terreno desde el teléfono.' }),
      U.el('p', { clase: 'pequeno tenue',
        texto: 'Sitio del proyecto: geoparquemet.sernageomin.cl' })
    ]);
  }

  function unidades() {
    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Unidades geológicas' }),
      ...Object.keys(UNIDADES).map(k => {
        const u = UNIDADES[k];
        const geos = GEOSITIOS.filter(g => g.unidad === k);
        return U.el('div', { clase: 'tarjeta' }, [
          U.el('div', { style: 'height:6px;background:' + u.color }),
          U.el('div', { clase: 'tarjeta-cuerpo' }, [
            U.el('h3', { texto: u.nombre + ' (' + u.sigla + ')' }),
            U.el('div', { clase: 'pequeno', style: 'color:var(--arena);margin-bottom:6px',
              texto: u.edad }),
            U.el('p', { clase: 'pequeno', style: 'margin:0 0 10px', texto: u.resumen }),
            geos.length ? U.el('div', { clase: 'fila', style: 'flex-wrap:wrap;gap:6px' },
              geos.map(g => U.el('a', { clase: 'etiqueta', href: '#/g/' + g.id,
                style: 'text-decoration:none', texto: 'Geositio ' + g.num }))) : null
          ])
        ]);
      })
    ]);
  }

  function ajustes() {
    const e = U.leerEstado();

    const escala = U.el('input', {
      type: 'range', min: '85', max: '145', step: '5',
      value: String(Math.round((e.ajustes.escala || 1) * 100)),
      'aria-label': 'Tamaño del texto'
    });
    escala.addEventListener('input', () => {
      e.ajustes.escala = escala.value / 100;
      document.documentElement.style.setProperty('--escala', e.ajustes.escala);
      U.guardarEstado();
    });

    const contraste = U.el('button', {
      clase: 'chip', type: 'button', 'aria-pressed': String(!!e.ajustes.contraste),
      texto: 'Alto contraste'
    });
    contraste.addEventListener('click', () => {
      e.ajustes.contraste = !e.ajustes.contraste;
      document.body.classList.toggle('contraste', e.ajustes.contraste);
      contraste.setAttribute('aria-pressed', String(e.ajustes.contraste));
      U.guardarEstado();
    });

    const estadoDescarga = U.el('p', { clase: 'pequeno tenue', style: 'margin:8px 0 0' });
    const btnDescarga = U.el('button', { clase: 'boton ancho', type: 'button' },
      [U.icono('descarga'), 'Descargar todo para usar sin conexión']);
    btnDescarga.addEventListener('click', () => {
      btnDescarga.disabled = true;
      App.descargarTodo(p => {
        estadoDescarga.textContent = 'Descargando… ' + Math.round(p) + ' %';
        if (p >= 100) {
          estadoDescarga.textContent = 'Listo: la app funciona completa sin conexión.';
          btnDescarga.disabled = false;
        }
      });
    });

    return U.el('div', { clase: 'contenido' }, [
      U.el('h1', { texto: 'Ajustes' }),

      U.el('h2', { style: 'margin-top:18px', texto: 'Idioma' }),
      selectorIdioma(false),

      U.el('h2', { style: 'margin-top:18px', texto: 'Accesibilidad' }),
      U.el('div', { clase: 'control-corte' }, [
        U.el('span', { clase: 'pequeno tenue', texto: 'Texto' }), escala
      ]),
      U.el('div', { clase: 'controles-3d' }, [contraste]),

      U.el('h2', { style: 'margin-top:22px', texto: 'Uso sin conexión' }),
      U.el('p', { clase: 'pequeno tenue',
        texto: 'En el cerro la señal es irregular. Descarga el contenido antes de salir: ' +
               'ocupa unos 120 MB con fotos, modelos 3D y panorámicas.' }),
      btnDescarga, estadoDescarga,

      U.el('h2', { style: 'margin-top:22px', texto: 'Tu recorrido' }),
      U.el('p', { clase: 'pequeno tenue',
        texto: 'Los geositios visitados se guardan solo en este teléfono. Nada se envía a ' +
               'ningún servidor.' }),
      U.el('button', {
        clase: 'boton secundario ancho', type: 'button', texto: 'Borrar mi progreso',
        onclick: () => {
          const cerrar = U.modal(U.el('div', { clase: 'caja' }, [
            U.el('h2', { texto: '¿Borrar el progreso?' }),
            U.el('p', { clase: 'pequeno tenue',
              texto: 'Se quitarán las marcas de los geositios visitados. No se puede deshacer.' }),
            U.el('div', { clase: 'grid-2' }, [
              U.el('button', { clase: 'boton secundario', type: 'button', texto: 'Cancelar',
                onclick: () => cerrar() }),
              U.el('button', { clase: 'boton', type: 'button', texto: 'Borrar',
                onclick: () => {
                  const est = U.leerEstado();
                  est.visitados = {};
                  U.guardarEstado();
                  cerrar();
                  U.aviso('Progreso borrado');
                  App.ir('#/ajustes', true);
                } })
            ])
          ]));
        }
      })
    ]);
  }

  function noEncontrado() {
    return U.el('div', { clase: 'contenido centrado' }, [
      U.el('h1', { texto: 'No encontramos eso' }),
      U.el('p', { clase: 'tenue', texto: 'El geositio o la ruta que buscas no existe en la app.' }),
      U.el('a', { clase: 'boton', href: '#/', texto: 'Volver al inicio' })
    ]);
  }

  return {
    inicio, rutas, ruta, geositio, mapa, historia, corteGeologico,
    glosario, mas, unidades, ajustes, noEncontrado,
    limpiar, alSalir
  };
})();
