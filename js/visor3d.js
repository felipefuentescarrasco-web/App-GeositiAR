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
        .then(() => montar(lienzo, estado, controles, ruta, p => {
          txt.textContent = 'Cargando ' + Math.round(p) + ' %';
        }))
        .catch(err => {
          estado.innerHTML = '';
          estado.appendChild(U.el('div', { texto: 'No se pudo mostrar el modelo. ' + err.message }));
        });
    }

    return cont;
  }

  function montar(lienzo, estado, controles, ruta, alAvanzar) {
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
    (function animar() {
      if (!vivo) return;
      requestAnimationFrame(animar);
      control.update();
      render.render(escena, camara);
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
      inicioCamara = frente
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
