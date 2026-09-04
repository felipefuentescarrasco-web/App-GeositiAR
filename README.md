# GeoParquemet · Geotours

App para teléfono que acompaña los geotours del Parque Metropolitano de Santiago.
En cada geositio hay un cartel con un código QR: al escanearlo se abre la ficha del
lugar con la geología de lo que la persona tiene al frente.

No se instala desde una tienda ni necesita conexión: se abre en el navegador, se
agrega a la pantalla de inicio y el contenido se descarga antes de subir al cerro.

**Probar sin instalar nada:** abre la app en el teléfono, entra a *Escanear* y usa
la página [`qr.html`](qr.html) en otra pantalla para tener un código a mano.

---

## Qué hace

- **Escanea el QR del cartel** y abre la ficha del geositio, que además queda marcado
  como visitado.
- **Fotografías con cortina:** se arrastra un control y la foto se convierte en la
  interpretación geológica dibujada encima.
- **Modelos 3D** de los afloramientos, con corte transparente para mirar dentro de la
  roca.
- **Panorámicas 360°** desde el punto de observación, con la interpretación como capa.
- **Mapa** con las dos georutas y la posición por GPS, que funciona sin señal.
- **Corte geológico** del cerro, historia geológica, glosario y lectura en voz alta.

Cubre los 12 geositios del inventario y las 2 georutas: Pío Nono – Tupahue y
Cumbre – Tupahue.

## De dónde sale el contenido

Del proyecto GEOPARQUEMET de la Unidad de Geopatrimonio de SERNAGEOMIN: el inventario
de geositios, las fotografías interpretadas, los modelos fotogramétricos y las
panorámicas, preparados para consultarse en terreno desde el teléfono.

## Para desarrolladores

La documentación técnica —estructura, generación de assets, carteles QR, despliegue—
está en [LEEME.md](LEEME.md).

Para levantarla en local:

```bash
python -m http.server 8777
```

La cámara, el GPS y el service worker necesitan `localhost` o HTTPS; abriendo el
archivo directamente no funcionan.

---

Contenido: Unidad de Geopatrimonio, SERNAGEOMIN · proyecto GEOPARQUEMET.
Cartografía base del mapa: © colaboradores de OpenStreetMap.
