/* Cortina: dos fotos superpuestas y un tirador que revela la interpretación.
   Es el gesto central de la app, así que responde a dedo, mouse y teclado. */

const Cortina = (() => {

  function crear(opciones) {
    const rutaBase = opciones.base;
    const rutaInterp = opciones.interp;
    const inicio = opciones.inicio === undefined ? 55 : opciones.inicio;

    const imgInterp = U.el('img', {
      src: rutaInterp, alt: 'Fotografía interpretada: ' + (opciones.alt || ''), loading: 'lazy'
    });
    const imgBase = U.el('img', {
      src: rutaBase, alt: 'Fotografía sin interpretar', loading: 'lazy'
    });
    const capaSup = U.el('div', { clase: 'capa-sup' }, [imgBase]);
    const tirador = U.el('div', { clase: 'tirador' });

    const caja = U.el('div', {
      clase: 'cortina',
      role: 'slider', tabindex: '0',
      'aria-label': 'Comparador: desliza para ver la interpretación geológica',
      'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(inicio)
    }, [
      imgInterp, capaSup, tirador,
      U.el('span', { clase: 'rotulo izq', texto: 'Foto' }),
      U.el('span', { clase: 'rotulo der', texto: 'Interpretada' }),
      U.el('button', {
        clase: 'btn-ampliar', type: 'button', 'aria-label': 'Ver en pantalla completa',
        onclick: ev => { ev.stopPropagation(); ampliar(opciones); }
      }, [U.icono('ampliar')])
    ]);

    let valor = inicio;

    function pintar() {
      capaSup.style.clipPath = 'inset(0 ' + (100 - valor) + '% 0 0)';
      tirador.style.left = valor + '%';
      caja.setAttribute('aria-valuenow', String(Math.round(valor)));
    }

    function desdeEvento(ev) {
      const r = caja.getBoundingClientRect();
      const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      valor = Math.max(0, Math.min(100, (x / r.width) * 100));
      pintar();
    }

    let arrastrando = false;
    const empezar = ev => { arrastrando = true; desdeEvento(ev); };
    const mover = ev => {
      if (!arrastrando) return;
      if (ev.cancelable) ev.preventDefault();
      desdeEvento(ev);
    };
    const soltar = () => { arrastrando = false; };

    caja.addEventListener('pointerdown', ev => {
      if (ev.target.closest('.btn-ampliar')) return;
      caja.setPointerCapture(ev.pointerId);
      empezar(ev);
    });
    caja.addEventListener('pointermove', mover);
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);

    caja.addEventListener('keydown', ev => {
      const paso = ev.shiftKey ? 10 : 4;
      if (ev.key === 'ArrowLeft') { valor = Math.max(0, valor - paso); pintar(); ev.preventDefault(); }
      if (ev.key === 'ArrowRight') { valor = Math.min(100, valor + paso); pintar(); ev.preventDefault(); }
      if (ev.key === 'Home') { valor = 0; pintar(); }
      if (ev.key === 'End') { valor = 100; pintar(); }
    });

    pintar();

    /* Una animación breve la primera vez enseña el gesto sin explicarlo. */
    if (opciones.insinuar) {
      let t = 0;
      const anim = setInterval(() => {
        t += 1;
        valor = inicio + Math.sin(t / 5) * 14 * Math.max(0, 1 - t / 30);
        pintar();
        if (t > 30) { clearInterval(anim); valor = inicio; pintar(); }
      }, 40);
      caja.addEventListener('pointerdown', () => clearInterval(anim), { once: true });
    }

    return caja;
  }

  /* Pantalla completa: la misma cortina, sin la interfaz alrededor. */
  function ampliar(opciones) {
    const caja = crear(Object.assign({}, opciones, { inicio: 50 }));
    caja.style.borderRadius = '0';
    caja.style.border = '0';
    caja.querySelector('.btn-ampliar').remove();
    const cont = U.el('div', { clase: 'visor-imagen' }, [
      U.el('div', { style: 'width:100%' }, [
        caja,
        opciones.leyenda ? U.el('p', {
          clase: 'leyenda-foto', style: 'padding:12px 16px;margin:0', texto: opciones.leyenda
        }) : null
      ])
    ]);
    U.modal(cont);
  }

  /* Bloque completo: título, cortina y leyenda. */
  function bloque(foto, carpeta, insinuar) {
    const base = (carpeta || 'assets/fotos/') + foto.base;
    const interp = (carpeta || 'assets/fotos/') + foto.interp;
    return U.el('div', {}, [
      foto.titulo ? U.el('div', { clase: 'titulo-medio' }, [
        U.el('h3', { texto: foto.titulo }),
        U.el('span', { clase: 'pequeno tenue', texto: 'desliza →' })
      ]) : null,
      crear({ base: base, interp: interp, alt: foto.titulo || '',
              leyenda: foto.leyenda, insinuar: insinuar }),
      foto.leyenda ? U.el('p', { clase: 'leyenda-foto', texto: foto.leyenda }) : null
    ]);
  }

  return { crear, bloque, ampliar };
})();
