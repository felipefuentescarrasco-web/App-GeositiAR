/* Ficha de un mineral: se abre al tocar un cristal en una foto o en el modelo 3D de la roca.

   Tres miradas, de más lejos a más cerca:
     - "Cristal 3D": el hábito del cristal dibujado con three.js, para girarlo y ver su corte
       transversal (en el piroxeno, ocho caras y dos clivajes casi en ángulo recto).
     - "Lupa": las fotos de lupa del proyecto, con zoom de dos dedos y su interpretación.
     - "Muestra de mano": la roca completa, con la misma cortina de foto / interpretación.
   Los datos están en MINERALES (js/datos.js). */

const Mineral = (() => {

  /* ------------------------------------------------------- cristal en 3D */

  /* Prisma de augita: sección de ocho caras ({100}, {010} y {110}) y terminaciones inclinadas,
     corridas hacia un lado como corresponde a un cristal monoclínico. */
  function geometriaPiroxeno(THREE) {
    const a = 0.50, b = 0.42, c = 0.36, d = 0.30, L = 1.6, h = 0.35, s = 0.18;
    const sec = [[a, 0], [c, d], [0, b], [-c, d], [-a, 0], [-c, -d], [0, -b], [c, -d]];
    const v = [];
    sec.forEach(([x, y]) => v.push([x, y, -L / 2]));
    sec.forEach(([x, y]) => v.push([x, y, L / 2]));
    v.push([s, 0, L / 2 + h]);          // ápice superior, corrido
    v.push([-s, 0, -L / 2 - h]);        // ápice inferior
    const f = [];
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      f.push([i, j, 8 + j], [i, 8 + j, 8 + i]);       // caras del prisma
      f.push([8 + i, 8 + j, 16]);                       // terminación superior
      f.push([j, i, 17]);                               // terminación inferior
    }
    const pos = [];
    f.forEach(t => t.forEach(k => pos.push(...v[k])));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }

  function cristal3D(m) {
    const lienzo = U.el('div', { clase: 'visor visor-cristal' }, [
      U.el('div', { clase: 'cargando' }, [U.el('div', { clase: 'aro' })])
    ]);
    const btnCorte = U.el('button', { clase: 'chip', type: 'button', 'aria-pressed': 'false' }, ['Ver el corte transversal']);
    const btnGirar = U.el('button', { clase: 'chip', type: 'button', 'aria-pressed': 'true' }, ['Girar solo']);
    const cont = U.el('div', {}, [
      lienzo,
      U.el('div', { clase: 'controles-3d' }, [btnGirar, btnCorte]),
      U.el('p', { clase: 'leyenda-foto', texto: m.cristal.nota })
    ]);
    let destruir = () => {};
    Visor3D.cargarLibrerias().then(() => {
      const T = window.THREE;
      lienzo.innerHTML = '';
      const escena = new T.Scene();
      escena.background = new T.Color(0x10171a);
      const camara = new T.PerspectiveCamera(40, 1, 0.01, 50);
      camara.position.set(2.4, 1.3, 2.2);
      const render = new T.WebGLRenderer({ antialias: true });
      render.setPixelRatio(Math.min(devicePixelRatio, 2));
      render.outputEncoding = T.sRGBEncoding;
      lienzo.appendChild(render.domElement);
      escena.add(new T.HemisphereLight(0xffffff, 0x303838, 0.9));
      const sol = new T.DirectionalLight(0xffffff, 1.1); sol.position.set(2, 3, 2); escena.add(sol);
      const brillo = new T.DirectionalLight(0xcfe3ff, 0.6); brillo.position.set(-2, -1, 1.5); escena.add(brillo);

      const geo = geometriaPiroxeno(T);
      const grupo = new T.Group();
      const matCristal = new T.MeshStandardMaterial({
        color: m.cristal.color, roughness: 0.28, metalness: 0.15, flatShading: true, transparent: true });
      grupo.add(new T.Mesh(geo, matCristal));
      grupo.add(new T.LineSegments(new T.EdgesGeometry(geo, 10),
        new T.LineBasicMaterial({ color: 0x6f8a78, transparent: true, opacity: 0.6 })));
      /* clivajes: dos familias de planos a lo largo del prisma, a ~87° entre sí */
      const clivaje = new T.Group();
      const matCliv = new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.35, side: T.DoubleSide });
      const geoCliv = new T.PlaneGeometry(0.62, 1.55);
      [43.5, -43.5].forEach(ang => {
        const familia = new T.Group();
        familia.rotation.z = T.MathUtils.degToRad(ang);       // gira alrededor del eje del prisma
        for (let k = -2; k <= 2; k++) {
          const p = new T.Mesh(geoCliv, matCliv);
          p.rotation.x = Math.PI / 2;                          // plano que contiene el eje del prisma
          p.position.y = k * 0.12;
          familia.add(p);
        }
        clivaje.add(familia);
      });
      clivaje.visible = false;
      grupo.add(clivaje);
      grupo.rotation.x = -Math.PI / 2.6;
      escena.add(grupo);

      const control = new T.OrbitControls(camara, render.domElement);
      control.enableDamping = true;
      control.autoRotate = true; control.autoRotateSpeed = 2.2;
      control.minDistance = 1.2; control.maxDistance = 7;
      const medir = () => {
        const r = lienzo.getBoundingClientRect(); if (!r.width) return;
        camara.aspect = r.width / r.height; camara.updateProjectionMatrix(); render.setSize(r.width, r.height, false);
      };
      const obs = new ResizeObserver(medir); obs.observe(lienzo);
      let vivo = true;
      (function cuadro() { if (!vivo) return; requestAnimationFrame(cuadro); control.update(); render.render(escena, camara); })();

      btnGirar.onclick = () => {
        control.autoRotate = !control.autoRotate;
        btnGirar.setAttribute('aria-pressed', String(control.autoRotate));
      };
      btnCorte.onclick = () => {
        const on = btnCorte.getAttribute('aria-pressed') !== 'true';
        btnCorte.setAttribute('aria-pressed', String(on));
        clivaje.visible = on;
        matCristal.opacity = on ? 0.45 : 1; matCristal.depthWrite = !on;
        if (on) {   // mirar a lo largo del prisma: se ve la sección de ocho caras y los clivajes
          control.autoRotate = false; btnGirar.setAttribute('aria-pressed', 'false');
          const eje = new T.Vector3(0, 0, 1).applyEuler(grupo.rotation).normalize();
          camara.position.copy(eje.multiplyScalar(3.2));
          control.target.set(0, 0, 0);
        }
      };
      destruir = () => { vivo = false; obs.disconnect(); render.dispose(); geo.dispose(); };
    }).catch(() => { lienzo.innerHTML = ''; lienzo.appendChild(U.el('p', { clase: 'pequeno', texto: 'No se pudo dibujar el cristal.' })); });
    return { el: cont, destruir: () => destruir() };
  }

  /* ------------------------------------------------- lupa con zoom de dedos */

  function lupa(foto) {
    const img = U.el('img', { src: 'assets/fotos/' + foto.base, alt: foto.titulo || '', draggable: 'false' });
    const marco = U.el('div', { clase: 'lupa-marco' }, [img]);
    let esc = 1, tx = 0, ty = 0;
    const pintar = () => {
      esc = Math.min(8, Math.max(1, esc));
      const r = marco.getBoundingClientRect(), mx = r.width * (esc - 1) / 2, my = r.height * (esc - 1) / 2;
      tx = Math.min(mx, Math.max(-mx, tx)); ty = Math.min(my, Math.max(-my, ty));
      img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + esc + ')';
    };
    const dedos = new Map(); let inicio = null;
    marco.addEventListener('pointerdown', e => { marco.setPointerCapture(e.pointerId); dedos.set(e.pointerId, [e.clientX, e.clientY]); inicio = null; });
    marco.addEventListener('pointermove', e => {
      if (!dedos.has(e.pointerId)) return;
      const antes = dedos.get(e.pointerId); dedos.set(e.pointerId, [e.clientX, e.clientY]);
      if (dedos.size === 2) {
        const [p, q] = [...dedos.values()], dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (inicio) esc *= dist / inicio;
        inicio = dist;
      } else { tx += e.clientX - antes[0]; ty += e.clientY - antes[1]; }
      pintar();
    });
    const soltar = e => { dedos.delete(e.pointerId); inicio = null; };
    marco.addEventListener('pointerup', soltar); marco.addEventListener('pointercancel', soltar);
    marco.addEventListener('wheel', e => { e.preventDefault(); esc *= e.deltaY < 0 ? 1.15 : 1 / 1.15; pintar(); }, { passive: false });
    marco.addEventListener('dblclick', () => { esc = esc > 1.5 ? 1 : 3; tx = ty = 0; pintar(); });
    const btnInterp = U.el('button', { clase: 'chip', type: 'button', 'aria-pressed': 'false' }, ['Ver interpretación']);
    btnInterp.onclick = () => {
      const on = btnInterp.getAttribute('aria-pressed') !== 'true';
      btnInterp.setAttribute('aria-pressed', String(on));
      img.src = 'assets/fotos/' + (on ? foto.interp : foto.base);
    };
    return U.el('div', { clase: 'lupa' }, [
      marco,
      U.el('div', { clase: 'controles-3d' }, [
        U.el('button', { clase: 'chip', type: 'button', 'aria-label': 'Acercar', onclick: () => { esc *= 1.5; pintar(); } }, ['＋']),
        U.el('button', { clase: 'chip', type: 'button', 'aria-label': 'Alejar', onclick: () => { esc /= 1.5; pintar(); } }, ['－']),
        foto.interp ? btnInterp : null
      ]),
      U.el('p', { clase: 'leyenda-foto', texto: (foto.titulo ? foto.titulo + '. ' : '') + (foto.leyenda || '') })
    ]);
  }

  /* --------------------------------------------------------------- ficha */

  function abrir(id) {
    const m = MINERALES[id];
    if (!m) return;
    U.vibrar(40);
    let limpiarCristal = () => {};
    const panel = U.el('div', { clase: 'mineral-panel' });
    const pestanas = [
      ['cristal', 'Cristal 3D', () => { const c = cristal3D(m); limpiarCristal = c.destruir; return c.el; }],
      ['lupa', 'Lupa', () => U.el('div', {}, [
        U.el('p', { clase: 'pequeno tenue', texto: 'Pellizca con dos dedos o toca dos veces para acercarte.' }),
        ...m.lupa.map(lupa)])],
      ['muestra', 'Muestra de mano', () => U.el('div', {}, m.muestra.map(f => Cortina.bloque(f, 'assets/fotos/')))]
    ].filter(p => p[0] !== 'muestra' || (m.muestra && m.muestra.length));
    const barra = U.el('div', { clase: 'pestanas', role: 'tablist' });
    function elegir(k) {
      limpiarCristal(); limpiarCristal = () => {};
      U.$$('button', barra).forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k)));
      panel.innerHTML = '';
      panel.appendChild(pestanas.find(p => p[0] === k)[2]());
    }
    pestanas.forEach(([k, t]) => barra.appendChild(U.el('button', { clase: 'pestana', role: 'tab', type: 'button', 'data-k': k,
      onclick: () => elegir(k) }, [t])));
    U.modal(U.el('div', { clase: 'caja caja-mineral' }, [
      U.el('div', { clase: 'pequeno tenue', texto: 'Mineral' }),
      U.el('h2', { style: 'margin:2px 0 4px', texto: m.nombre }),
      U.el('p', { clase: 'pequeno', style: 'margin:0 0 10px', texto: m.resumen }),
      barra, panel
    ]), { alCerrar: () => limpiarCristal() });
    elegir('cristal');
  }

  /* Marcas que laten sobre una foto, en cada cristal señalado: tocarlas abre la ficha. */
  function marcas(caja, puntos) {
    caja.classList.add('con-marcas');
    puntos.forEach(p => {
      const b = U.el('button', { clase: 'marca-mineral', type: 'button', 'aria-label': 'Ver el mineral: ' + MINERALES[p.m].nombre,
        style: 'left:' + (p.x * 100) + '%;top:' + (p.y * 100) + '%' });
      ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => b.addEventListener(ev, e => e.stopPropagation()));
      b.addEventListener('click', e => { e.stopPropagation(); abrir(p.m); });
      caja.appendChild(b);
    });
    return caja;
  }

  return { abrir, marcas };
})();
