/* Visor de modelos 3D (glTF binario) con corte transparente.

   Los modelos vienen de la fotogrametría del proyecto, decimados por
   tools/build_assets.py. Cada uno pesa unos 2,5 MB, así que solo se descargan
   cuando la persona los pide. */

const Visor3D = (() => {

  let libreriasListas = null;
  const activos = [];   // funciones de limpieza de los visores montados

  function cargarLibrerias() {
    if (libreriasListas) return libreriasListas;
    libreriasListas = new Promise((resolver, rechazar) => {
      const archivos = ['js/vendor/three.min.js', 'js/vendor/GLTFLoader.js', 'js/vendor/OrbitControls.js'];
      (function siguiente(i) {
        if (i >= archivos.length) return resolver();
        const s = document.createElement('script');
        s.src = archivos[i];
        s.onload = () => siguiente(i + 1);
        s.onerror = () => rechazar(new Error('No se pudo cargar ' + archivos[i]));
        document.head.appendChild(s);
      })(0);
    });
    return libreriasListas;
  }

  /* Devuelve el bloque completo: lienzo, controles y estado de carga. */
  function bloque(modelo) {
    const ruta = 'assets/3d/' + modelo.archivo;

    const estado = U.el('div', { clase: 'cargando' }, [
      U.el('div', { clase: 'aro' }),
      U.el('div', { texto: 'Preparando el modelo…' })
    ]);
    const lienzo = U.el('div', { clase: 'visor' }, [estado]);

    const btnCargar = U.el('button', {
      clase: 'boton ancho', type: 'button',
      onclick: () => { btnCargar.remove(); iniciar(); }
    }, [U.icono('cubo'), 'Cargar modelo 3D (2,5 MB aprox.)']);

    const controles = U.el('div', { clase: 'controles-3d', hidden: true });
    const cont = U.el('div', {}, [
      modelo.titulo ? U.el('div', { clase: 'titulo-medio' }, [
        U.el('h3', { texto: modelo.titulo })
      ]) : null,
      lienzo, btnCargar, controles,
      modelo.nota ? U.el('p', { clase: 'leyenda-foto', texto: modelo.nota }) : null
    ]);

    /* El modelo no se descarga hasta que la persona lo pide: en el cerro
       la conexión es escasa y los datos se pagan. */
    estado.innerHTML = '';
    estado.appendChild(U.el('div', { clase: 'pequeno tenue',
      texto: 'Modelo fotogramétrico del afloramiento' }));

    function iniciar() {
      estado.innerHTML = '';
      estado.appendChild(U.el('div', { clase: 'aro' }));
      const txt = U.el('div', { texto: 'Cargando 0 %' });
      estado.appendChild(txt);
      estado.hidden = false;

      cargarLibrerias()
        .then(() => montar(lienzo, estado, controles, ruta, modelo.capas, p => {
          txt.textContent = 'Cargando ' + Math.round(p) + ' %';
        }))
        .catch(err => {
          estado.innerHTML = '';
          estado.appendChild(U.el('div', { texto: 'No se pudo mostrar el modelo. ' + err.message }));
        });
    }

    return cont;
  }

  function montar(lienzo, estado, controles, ruta, capas, alAvanzar) {
    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0x10171a);

    const camara = new THREE.PerspectiveCamera(50, 4 / 3, 0.01, 5000);
    const render = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    render.setPixelRatio(Math.min(devicePixelRatio, 2));
    render.outputEncoding = THREE.sRGBEncoding;
    render.localClippingEnabled = true;
    lienzo.appendChild(render.domElement);

    escena.add(new THREE.HemisphereLight(0xffffff, 0x40484a, 1.05));
    const sol = new THREE.DirectionalLight(0xfff3e0, 0.9);
    sol.position.set(1, 1.4, 0.8);
    escena.add(sol);
    const relleno = new THREE.DirectionalLight(0xbfd4e0, 0.35);
    relleno.position.set(-1, -0.4, -0.8);
    escena.add(relleno);

    const control = new THREE.OrbitControls(camara, render.domElement);
    control.enableDamping = true;
    control.dampingFactor = 0.08;
    control.rotateSpeed = 0.7;
    control.zoomSpeed = 0.9;

    const plano = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    let cortando = false;
    let malla = null;
    let radio = 1;
    let inicioCamara = null;

    function dimensionar() {
      const r = lienzo.getBoundingClientRect();
      if (!r.width) return;
      camara.aspect = r.width / r.height;
      camara.updateProjectionMatrix();
      render.setSize(r.width, r.height, false);
    }

    const observador = new ResizeObserver(dimensionar);
    observador.observe(lienzo);

    let vivo = true;
    let alCuadro = null;   // rótulos de las capas de la maqueta
    (function animar() {
      if (!vivo) return;
      requestAnimationFrame(animar);
      control.update();
      render.render(escena, camara);
      if (alCuadro) alCuadro();
    })();

    const cargador = new THREE.GLTFLoader();
    cargador.load(ruta, gltf => {
      malla = gltf.scene;
      const caja = new THREE.Box3().setFromObject(malla);
      const centro = caja.getCenter(new THREE.Vector3());
      const esfera = caja.getBoundingSphere(new THREE.Sphere());
      radio = esfera.radius;
      malla.position.sub(centro);

      malla.traverse(o => {
        if (!o.isMesh) return;
        o.material.side = THREE.DoubleSide;
        o.material.clippingPlanes = [];
        o.material.transparent = false;
        if (o.material.map) o.material.map.encoding = THREE.sRGBEncoding;
      });
      escena.add(malla);

      const frente = direccionDeVista(malla);
      inicioCamara = capas && capas.length
        ? new THREE.Vector3(0, radio * 1.4, radio * 0.55)   // maqueta: casi desde arriba, como se mira la mesa
        : frente
        ? frente.clone().multiplyScalar(radio * 1.9).add(new THREE.Vector3(0, radio * 0.3, 0))
        : new THREE.Vector3(radio * 1.1, radio * 0.65, radio * 1.5);

      camara.near = radio / 200;
      camara.far = radio * 40;
      camara.position.copy(inicioCamara);
      camara.updateProjectionMatrix();
      control.target.set(0, 0, 0);
      control.minDistance = radio * 0.05;
      control.maxDistance = radio * 12;
      control.update();

      dimensionar();
      estado.hidden = true;
      controles.hidden = false;
      armarControles();
      alAvanzar(100);
    }, ev => {
      if (ev.lengthComputable) alAvanzar(ev.loaded / ev.total * 100);
    }, err => {
      estado.innerHTML = '';
      estado.appendChild(U.el('div', { texto: 'No se pudo descargar el modelo.' }));
      console.error(err);
    });

    /* Estas mallas son casi siempre una pared de roca, no un objeto cerrado.
       Mirándolas desde su normal media se ve la cara fotografiada; con una
       posición fija se corre el riesgo de empezar por detrás del afloramiento. */
    function direccionDeVista(objeto) {
      const suma = new THREE.Vector3();
      let area = 0;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
      objeto.traverse(o => {
        if (!o.isMesh || !o.geometry.index) return;
        const pos = o.geometry.attributes.position, idx = o.geometry.index.array;
        const paso = Math.max(1, Math.floor(idx.length / 3 / 20000)) * 3;  // basta una muestra
        for (let i = 0; i + 2 < idx.length; i += paso) {
          a.fromBufferAttribute(pos, idx[i]);
          b.fromBufferAttribute(pos, idx[i + 1]);
          c.fromBufferAttribute(pos, idx[i + 2]);
          ab.subVectors(b, a); ac.subVectors(c, a);
          n.crossVectors(ab, ac);
          const s = n.length() / 2;
          if (!s) continue;
          suma.addScaledVector(n.normalize(), s);
          area += s;
        }
      });
      if (!area || suma.length() / area < 0.25) return null;   // objeto cerrado
      suma.normalize();
      /* El sentido de las caras depende de cómo exportó Pix4D cada proyecto: si la
         normal media apunta hacia abajo, se invierte. Y nunca se mira desde el
         subsuelo, así que se le exige algo de altura. */
      if (suma.y < 0) suma.negate();
      suma.y = Math.max(suma.y, 0.18);
      return suma.normalize();
    }

    function paraCadaMaterial(fn) {
      if (!malla) return;
      malla.traverse(o => { if (o.isMesh) fn(o.material, o); });
    }

    function armarControles() {
      controles.innerHTML = '';

      const btnGiro = U.el('button', {
        clase: 'chip', type: 'button', 'aria-pressed': 'false',
        onclick: () => {
          control.autoRotate = !control.autoRotate;
          control.autoRotateSpeed = 1.1;
          btnGiro.setAttribute('aria-pressed', String(control.autoRotate));
        }, texto: 'Girar solo'
      });

      const btnCorte = U.el('button', {
        clase: 'chip', type: 'button', 'aria-pressed': 'false', texto: 'Corte transparente'
      });

      const btnReiniciar = U.el('button', {
        clase: 'chip', type: 'button', texto: 'Reencuadrar',
        onclick: () => {
          camara.position.copy(inicioCamara);
          control.target.set(0, 0, 0);
          control.update();
        }
      });

      const rango = U.el('input', {
        type: 'range', min: '0', max: '100', value: '50',
        'aria-label': 'Posición del corte'
      });
      const transparencia = U.el('input', {
        type: 'range', min: '0', max: '80', value: '0',
        'aria-label': 'Transparencia de la roca'
      });

      const filaCorte = U.el('div', { clase: 'control-corte', hidden: true }, [
        U.el('span', { clase: 'pequeno tenue', texto: 'Corte' }), rango
      ]);
      const filaTrans = U.el('div', { clase: 'control-corte', hidden: true }, [
        U.el('span', { clase: 'pequeno tenue', texto: 'Roca' }), transparencia
      ]);

      rango.addEventListener('input', () => {
        plano.constant = (rango.value / 100 - 0.5) * radio * 2.2;
      });

      transparencia.addEventListener('input', () => {
        const t = transparencia.value / 100;
        paraCadaMaterial(m => {
          m.transparent = t > 0;
          m.opacity = 1 - t;
          m.depthWrite = t === 0;
          m.needsUpdate = true;
        });
      });

      btnCorte.addEventListener('click', () => {
        cortando = !cortando;
        btnCorte.setAttribute('aria-pressed', String(cortando));
        filaCorte.hidden = !cortando;
        filaTrans.hidden = !cortando;
        paraCadaMaterial(m => {
          m.clippingPlanes = cortando ? [plano] : [];
          m.needsUpdate = true;
        });
        if (cortando) {
          plano.constant = (rango.value / 100 - 0.5) * radio * 2.2;
          U.aviso('Mueve el control para cortar la roca y mirar dentro');
        } else {
          transparencia.value = 0;
          paraCadaMaterial(m => { m.transparent = false; m.opacity = 1; m.depthWrite = true; });
        }
      });

      const btnPantalla = U.el('button', {
        clase: 'chip', type: 'button', texto: 'Pantalla completa',
        onclick: () => {
          const destino = lienzo;
          if (document.fullscreenElement) document.exitFullscreen();
          else if (destino.requestFullscreen) destino.requestFullscreen();
          else U.aviso('Este navegador no permite pantalla completa');
          setTimeout(dimensionar, 300);
        }
      });

      controles.appendChild(btnGiro);
      controles.appendChild(btnCorte);
      controles.appendChild(btnReiniciar);
      controles.appendChild(btnPantalla);
      controles.appendChild(filaCorte);
      controles.appendChild(filaTrans);
      if (capas && capas.length) armarCapas();
    }

    /* Capas de información pegadas sobre el relieve (maqueta): una copia de la malla que comparte la
       geometría, con coordenadas de textura sacadas de la vista cenital (x, z) del modelo.
       Sin leyenda (idea de Carlos Venegas): cada clase lleva un rótulo flotante con una flecha que apunta
       a su polígono, y al tocar un polígono o un punto se abre su ficha. Los rótulos y polígonos vienen
       del .json de cada capa (tools/maqueta/5_capas.py), en coordenadas del modelo. */
    function armarCapas() {
      const cargadorTex = new THREE.TextureLoader();
      const piel = [];        // mallas superpuestas, una por malla del modelo
      let base = null;        // malla principal: rótulos y toques se calculan sobre ella
      let opacidad = 0.85;
      malla.traverse(o => {
        if (!o.isMesh || o.userData.capa) return;
        const g = o.geometry;
        g.computeBoundingBox();
        const b = g.boundingBox;
        const zmax = Math.max(Math.abs(b.min.z), Math.abs(b.max.z));
        const p = g.attributes.position, uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
          uv[2 * i] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x);
          uv[2 * i + 1] = 1 - (p.getZ(i) + zmax) / (2 * zmax);
        }
        const g2 = new THREE.BufferGeometry();
        g2.setAttribute('position', p);
        if (g.attributes.normal) g2.setAttribute('normal', g.attributes.normal);
        g2.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        g2.setIndex(g.index);
        const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: opacidad,
          polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
        const capa = new THREE.Mesh(g2, m);
        capa.userData.capa = true;
        capa.visible = false;
        o.add(capa);
        piel.push(capa);
        if (!base || p.count > base.geometry.attributes.position.count) base = o;
      });

      /* capa de rótulos (HTML sobre el lienzo) y ficha al tocar */
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'flechas-3d');
      const rotulos = U.el('div', { clase: 'rotulos-3d' });
      const ficha = U.el('div', { clase: 'ficha-3d', hidden: true });
      lienzo.appendChild(svg); lienzo.appendChild(rotulos); lienzo.appendChild(ficha);

      const texturas = {}, datos = {};
      let activa = null, etiquetas = [];
      const ray = new THREE.Raycaster();
      const abajo = new THREE.Vector3(0, -1, 0);

      /* altura de la superficie en (x, z) del modelo, para que la flecha toque el relieve */
      function sobreRelieve(x, z) {
        base.updateMatrixWorld();
        const caja = base.geometry.boundingBox;
        const o = base.localToWorld(new THREE.Vector3(x, caja.max.y + 1, z));
        ray.set(o, abajo);
        const hit = ray.intersectObject(base, false)[0];
        return hit ? hit.point : base.localToWorld(new THREE.Vector3(x, caja.max.y, z));
      }

      function ponerRotulos(d) {
        rotulos.innerHTML = ''; svg.innerHTML = ''; etiquetas = [];
        /* en pantallas chicas, solo las unidades más grandes (vienen ordenadas por superficie) */
        const max = lienzo.clientWidth < 500 ? 5 : 9;
        (d.etiquetas || []).slice(0, max).forEach(e => {
          const div = U.el('div', { clase: 'rotulo-3d' }, [U.el('i', { style: 'background:' + e.color }), U.el('span', { texto: e.texto })]);
          const linea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          const punta = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          punta.setAttribute('r', '3.5');
          rotulos.appendChild(div); svg.appendChild(linea); svg.appendChild(punta);
          etiquetas.push({ div, linea, punta, mundo: sobreRelieve(e.x, e.z) });
        });
      }

      const v = new THREE.Vector3();
      function moverRotulos() {
        if (!etiquetas.length) return;
        const r = lienzo.getBoundingClientRect();
        const W = r.width, H = r.height, ocupados = [];
        const lista = etiquetas.map(e => {
          v.copy(e.mundo).project(camara);
          return { e, x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, visible: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 };
        }).sort((a, b) => a.y - b.y);
        lista.forEach(({ e, x, y, visible }) => {
          e.div.hidden = !visible; e.linea.style.display = e.punta.style.display = visible ? '' : 'none';
          if (!visible) return;
          const w = e.div.offsetWidth || 80, h = e.div.offsetHeight || 22;
          let lx = Math.min(Math.max(x - w / 2, 4), W - w - 4), ly = Math.max(y - 44 - h, 4);
          /* si choca con otro rótulo, se sube (o se baja si no cabe) */
          for (let n = 0; n < 8; n++) {
            const choca = ocupados.find(o => lx < o.x + o.w + 4 && lx + w + 4 > o.x && ly < o.y + o.h + 3 && ly + h + 3 > o.y);
            if (!choca) break;
            ly = choca.y - h - 4;
            if (ly < 4) ly = choca.y + choca.h + 4;
          }
          ocupados.push({ x: lx, y: ly, w, h });
          e.div.style.transform = 'translate(' + lx + 'px,' + ly + 'px)';
          e.linea.setAttribute('x1', lx + w / 2); e.linea.setAttribute('y1', ly + h);
          e.linea.setAttribute('x2', x); e.linea.setAttribute('y2', y);
          e.punta.setAttribute('cx', x); e.punta.setAttribute('cy', y);
        });
      }
      alCuadro = moverRotulos;

      /* tocar: polígono que contiene el punto o punto más cercano */
      function dentro(px, pz, anillo) {
        let c = false;
        for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
          const [xi, zi] = anillo[i], [xj, zj] = anillo[j];
          if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) c = !c;
        }
        return c;
      }
      function buscar(d, x, z) {
        let mejor = null, dist = 0.03;
        (d.puntos || []).forEach(p => { const dd = Math.hypot(p.x - x, p.z - z); if (dd < dist) { dist = dd; mejor = p; } });
        if (mejor) return mejor;
        return (d.poligonos || []).find(p => dentro(x, z, p.anillos[0]) && !p.anillos.slice(1).some(h => dentro(x, z, h))) || null;
      }
      function mostrarFicha(f) {
        ficha.innerHTML = '';
        if (!f) { ficha.hidden = true; return; }
        ficha.appendChild(U.el('button', { clase: 'cerrar', type: 'button', 'aria-label': 'Cerrar', texto: '×',
          onclick: () => { ficha.hidden = true; } }));
        if (f.color) ficha.appendChild(U.el('i', { style: 'background:' + f.color }));
        ficha.appendChild(U.el('b', { texto: f.clase }));
        (f.info || []).forEach(t => ficha.appendChild(U.el('div', { clase: 'pequeno', texto: t })));
        if (f.enlace) ficha.appendChild(U.el('a', { clase: 'boton', href: f.enlace, texto: 'Abrir ficha' }));
        ficha.hidden = false;
      }
      let inicioToque = null;
      render.domElement.addEventListener('pointerdown', ev => { inicioToque = [ev.clientX, ev.clientY]; });
      render.domElement.addEventListener('pointerup', ev => {
        if (!activa || !inicioToque || Math.hypot(ev.clientX - inicioToque[0], ev.clientY - inicioToque[1]) > 8) return;
        const d = datos[activa.fichas];
        if (!d) return;
        const r = render.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1), camara);
        const hit = ray.intersectObject(base, false)[0];
        if (!hit) return mostrarFicha(null);
        const l = base.worldToLocal(hit.point.clone());
        mostrarFicha(buscar(d, l.x, l.z));
      });

      const fila = U.el('div', { clase: 'capas-3d' });
      const rangoOp = U.el('input', { type: 'range', min: '20', max: '100', value: String(opacidad * 100),
        'aria-label': 'Opacidad de la capa' });
      const filaOp = U.el('div', { clase: 'control-corte', hidden: true }, [U.el('span', { clase: 'pequeno tenue', texto: 'Capa' }), rangoOp]);
      const ayuda = U.el('p', { clase: 'pequeno tenue', hidden: true, style: 'margin:4px 0 0;width:100%',
        texto: 'Toca un color de la maqueta para ver qué es.' });
      rangoOp.addEventListener('input', () => {
        opacidad = rangoOp.value / 100;
        piel.forEach(c => { c.material.opacity = opacidad; });
      });

      function mostrar(c, chip) {
        activa = activa === c ? null : c;
        fila.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
        mostrarFicha(null);
        ponerRotulos({});
        filaOp.hidden = ayuda.hidden = !activa;
        if (!activa) { piel.forEach(m => { m.visible = false; }); return; }
        chip.setAttribute('aria-pressed', 'true');
        const poner = tex => {
          if (activa !== c) return;
          piel.forEach(m => { m.material.map = tex; m.material.needsUpdate = true; m.visible = true; });
        };
        if (texturas[c.archivo]) poner(texturas[c.archivo]);
        else cargadorTex.load('assets/3d/' + c.archivo, tex => {
          tex.encoding = THREE.sRGBEncoding;
          tex.anisotropy = render.capabilities.getMaxAnisotropy();
          texturas[c.archivo] = tex;
          poner(tex);
        }, undefined, () => U.aviso('No se pudo cargar la capa'));
        if (!c.fichas) { ayuda.hidden = true; return; }
        (datos[c.fichas] ? Promise.resolve(datos[c.fichas]) : fetch('assets/3d/' + c.fichas).then(r => r.json()))
          .then(d => { datos[c.fichas] = d; if (activa === c) ponerRotulos(d); })
          .catch(() => { ayuda.hidden = true; });
      }

      capas.forEach(c => {
        const chip = U.el('button', { clase: 'chip', type: 'button', 'aria-pressed': 'false', texto: c.nombre });
        chip.addEventListener('click', () => mostrar(c, chip));
        fila.appendChild(chip);
      });
      controles.appendChild(U.el('div', { clase: 'titulo-capas pequeno tenue', texto: 'Capas sobre la maqueta' }));
      controles.appendChild(fila);
      controles.appendChild(ayuda);
      controles.appendChild(filaOp);
    }

    /* Al abandonar la vista hay que soltar la GPU: si no, el teléfono se calienta. */
    const destruir = function () {
      vivo = false;
      observador.disconnect();
      control.dispose();
      escena.traverse(o => {
        if (o.isMesh) {
          o.geometry.dispose();
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      render.dispose();
      if (render.domElement.parentNode) render.domElement.parentNode.removeChild(render.domElement);
    };
    activos.push(destruir);
    return destruir;
  }

  function limpiar() {
    while (activos.length) activos.pop()();
  }

  return { bloque, cargarLibrerias, limpiar };
})();
