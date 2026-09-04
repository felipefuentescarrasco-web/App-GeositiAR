/* Visor de panorámicas 360°, con la interpretación como capa que se funde
   sobre la foto original. Sirve para reconocer el afloramiento completo desde
   el punto exacto donde se tomó la fotografía. */

const Pano = (() => {

  const activos = [];

  function bloque(pano) {
    const estado = U.el('div', { clase: 'cargando' }, [
      U.el('div', { clase: 'pequeno tenue', texto: 'Panorámica esférica del punto de observación' })
    ]);
    const lienzo = U.el('div', { clase: 'visor', style: 'aspect-ratio:1/1' }, [estado]);
    const controles = U.el('div', { clase: 'controles-3d', hidden: true });

    const btn = U.el('button', {
      clase: 'boton ancho', type: 'button',
      onclick: () => { btn.remove(); iniciar(); }
    }, [U.icono('esfera'), 'Abrir panorámica 360° (3 MB aprox.)']);

    function iniciar() {
      estado.innerHTML = '';
      estado.appendChild(U.el('div', { clase: 'aro' }));
      estado.appendChild(U.el('div', { texto: 'Cargando la panorámica…' }));
      Visor3D.cargarLibrerias()
        .then(() => montar(lienzo, estado, controles, pano))
        .catch(err => {
          estado.innerHTML = '';
          estado.appendChild(U.el('div', { texto: 'No se pudo abrir: ' + err.message }));
        });
    }

    return U.el('div', {}, [
      pano.titulo ? U.el('div', { clase: 'titulo-medio' }, [U.el('h3', { texto: pano.titulo })]) : null,
      lienzo, btn, controles,
      pano.leyenda ? U.el('p', { clase: 'leyenda-foto', texto: pano.leyenda }) : null
    ]);
  }

  function montar(lienzo, estado, controles, pano) {
    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camara.position.set(0, 0, 0.01);

    const render = new THREE.WebGLRenderer({ antialias: true });
    render.setPixelRatio(Math.min(devicePixelRatio, 2));
    render.outputEncoding = THREE.sRGBEncoding;
    lienzo.appendChild(render.domElement);

    const control = new THREE.OrbitControls(camara, render.domElement);
    control.enableZoom = true;
    control.enablePan = false;
    control.enableDamping = true;
    control.dampingFactor = 0.1;
    control.rotateSpeed = -0.32;      // negativo: arrastrar "empuja" el paisaje
    control.minDistance = 0.01;
    control.maxDistance = 0.02;

    /* Esfera invertida: la textura se ve desde adentro. */
    const geo = new THREE.SphereGeometry(50, 60, 40);
    geo.scale(-1, 1, 1);

    const cargador = new THREE.TextureLoader();
    let capaInterp = null;

    cargador.load('assets/360/' + pano.base, tex => {
      tex.encoding = THREE.sRGBEncoding;
      escena.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })));
      estado.hidden = true;
      controles.hidden = false;
      dimensionar();

      if (pano.interp) {
        cargador.load('assets/360/' + pano.interp, t2 => {
          t2.encoding = THREE.sRGBEncoding;
          const geo2 = new THREE.SphereGeometry(49.5, 60, 40);
          geo2.scale(-1, 1, 1);
          const mat = new THREE.MeshBasicMaterial({ map: t2, transparent: true, opacity: 0 });
          capaInterp = new THREE.Mesh(geo2, mat);
          escena.add(capaInterp);
          armarControles();
        });
      } else {
        armarControles();
      }
    }, undefined, () => {
      estado.innerHTML = '';
      estado.appendChild(U.el('div', { texto: 'No se pudo cargar la panorámica.' }));
    });

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

    function armarControles() {
      controles.innerHTML = '';
      if (capaInterp) {
        const rango = U.el('input', {
          type: 'range', min: '0', max: '100', value: '0',
          'aria-label': 'Opacidad de la interpretación'
        });
        rango.addEventListener('input', () => {
          capaInterp.material.opacity = rango.value / 100;
        });
        controles.appendChild(U.el('div', { clase: 'control-corte' }, [
          U.el('span', { clase: 'pequeno tenue', texto: 'Interpretación' }), rango
        ]));
      }

      /* En terreno lo natural es mover el teléfono, no el dedo. */
      if (window.DeviceOrientationEvent) {
        const btnGiro = U.el('button', {
          clase: 'chip', type: 'button', 'aria-pressed': 'false', texto: 'Mover con el teléfono'
        });
        let sensor = null;
        btnGiro.addEventListener('click', () => {
          if (sensor) {
            window.removeEventListener('deviceorientation', sensor);
            sensor = null;
            control.enabled = true;
            btnGiro.setAttribute('aria-pressed', 'false');
            return;
          }
          const activar = () => {
            control.enabled = false;
            btnGiro.setAttribute('aria-pressed', 'true');
            sensor = ev => {
              if (ev.alpha === null) return;
              const g = Math.PI / 180;
              camara.rotation.set(0, 0, 0, 'YXZ');
              camara.rotateY(-ev.alpha * g);
              camara.rotateX((ev.beta - 90) * g);
              camara.rotateZ(-ev.gamma * g);
            };
            window.addEventListener('deviceorientation', sensor);
          };
          if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then(r => { if (r === 'granted') activar(); else U.aviso('Permiso denegado'); })
              .catch(() => U.aviso('No se pudo usar el sensor'));
          } else {
            activar();
          }
        });
        controles.appendChild(btnGiro);
      }
    }

    const destruir = () => {
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
    };
    activos.push(destruir);
    return destruir;
  }

  function limpiar() {
    while (activos.length) activos.pop()();
  }

  return { bloque, limpiar };
})();
