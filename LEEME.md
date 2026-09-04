# GeoParquemet · Geotours

Aplicación para teléfono (PWA) que acompaña los geotours del Parque Metropolitano de
Santiago. En cada geositio hay un cartel con un código QR: al escanearlo se abre la
ficha del lugar con la geología de lo que la persona tiene al frente.

No necesita instalarse desde una tienda ni tener conexión: se abre desde el navegador,
se puede añadir a la pantalla de inicio y todo el contenido se puede descargar antes de
subir al cerro.

---

## Qué muestra en cada geositio

| Sección | Contenido |
|---|---|
| **En terreno** | Tres o cuatro claves de observación, una pista de campo y la primera foto interpretada. Es lo que se lee parado frente a la roca. |
| **Fotos interpretadas** | Comparador de cortina: se arrastra el control y la fotografía original se convierte en la interpretación geológica dibujada encima. |
| **Modelo 3D** | Malla fotogramétrica del afloramiento. Se gira, se acerca y tiene **corte transparente**: un plano de corte y un control de transparencia para mirar el interior de la roca. |
| **360°** | Panorámica esférica desde el punto de observación, con la capa interpretada que se funde encima. Se puede mover con el dedo o con el giroscopio del teléfono. |
| **Muestra de mano** | Fotografía de la muestra recogida en el geositio, también con cortina. |
| **Ficha geológica** | Descripción del inventario, estructuras, alteración, geotecnia y datos formales. Los términos técnicos se tocan y abren el glosario. |

Además: mapa con las dos georutas y la posición por GPS, corte geológico del cerro,
historia geológica en cinco actos, glosario, lectura en voz alta, progreso del geotour,
alto contraste y tamaño de texto ajustable.

## Estructura

```
app-geoparquemet/
├── index.html              esqueleto de la app
├── qr.html                 generador de carteles QR (uso interno del parque)
├── manifest.webmanifest    para instalarla en la pantalla de inicio
├── sw.js                   service worker: funcionamiento sin conexión
├── css/app.css
├── js/
│   ├── datos.js            los 12 geositios, 2 georutas, unidades y glosario
│   ├── util.js             utilidades: DOM, almacenamiento, GPS, voz
│   ├── cortina.js          comparador foto / interpretación
│   ├── visor3d.js          visor glTF con corte transparente
│   ├── pano.js             visor de panorámicas 360°
│   ├── mapa.js             mapa propio sobre canvas (teselas OSM + esquema)
│   ├── corte.js            corte geológico O–E dibujado en SVG
│   ├── escaner.js          lector de QR (nativo o jsQR) y entrada manual
│   ├── vistas.js           las pantallas
│   ├── app.js              enrutador y arranque
│   └── vendor/             three.js, GLTFLoader, OrbitControls, jsQR, qrcodejs
├── assets/
│   ├── fotos/              pares foto / interpretada, ya optimizados
│   ├── 360/                panorámicas equirectangulares
│   ├── 3d/                 modelos .glb decimados
│   └── icons/
└── tools/
    ├── build_assets.py     genera assets/ desde el material original del proyecto
    ├── vista_malla.py      vista ortográfica de una malla, para decidir recortes
    └── version.py          sube el número de versión de los archivos
```

## Cómo probarla

Necesita servirse por HTTP (la cámara, el GPS y el service worker no funcionan
abriendo el archivo directamente):

```bash
python -m http.server 8777 --directory app-geoparquemet
```

y abrir `http://localhost:8777`. Para probar la cámara en el teléfono hace falta
**HTTPS** o `localhost`; en la red local conviene publicarla en un servidor con
certificado.

## Los carteles QR

`qr.html` genera un cartel por geositio, listo para imprimir (un cartel por hoja A5
apaisada). Cada código apunta a:

```
<dirección donde está publicada la app>#/g/<id del geositio>?qr=1
```

El `?qr=1` hace que el geositio quede marcado como visitado. Los códigos usan
corrección de errores alta, así que siguen leyéndose con una esquina rayada o sucia.

Antes de imprimir hay que escribir en el campo de la página la dirección definitiva
donde quedará publicada la app.

## Regenerar los assets

`tools/build_assets.py` toma el material original del proyecto (las carpetas `2D`,
`360` y `3D` que están junto a esta) y produce los assets livianos:

```bash
python tools/build_assets.py            # todo
python tools/build_assets.py --solo 3d  # solo las mallas
```

- **Fotos**: se reducen a 1600 px de ancho (más una miniatura de 560 px).
- **Panorámicas**: 4096 px de ancho.
- **Mallas**: los `.obj` de Pix4D (30 a 70 MB cada uno) se deciman por agrupamiento
  espacial hasta unas 60.000 caras y se exportan como `.glb` con la textura embebida,
  de unos 2,5 MB. El script no rehace los archivos que ya existen: para regenerar uno,
  bórralo primero.

Los archivos ya existentes no se rehacen; para regenerar uno, bórralo antes.

### Orientación y escala de las mallas

Pix4D entrega las mallas con **Z hacia arriba** (X este, Y norte, Z altitud) y glTF
espera **Y hacia arriba**: `escribir_glb()` aplica el giro. Sin él los afloramientos se
ven acostados en el visor.

Las unidades **no siempre son metros**. Las mallas de proyectos georreferenciados traen
su desplazamiento UTM en `1_initial/params/*_offset.xyz` y están en metros; las demás
usan el sistema local arbitrario de Pix4D, donde la caja envolvente puede marcar
"325 m" para un afloramiento de unos diez. Conviene no leer esas cifras como distancias
reales.

### Recorte de las mallas

`RECORTES`, en `build_assets.py`, permite acotar una malla con una caja en sus
coordenadas locales, para dejar fuera la periferia mal reconstruida —vegetación suelta,
huecos, bordes deshilachados— y que el presupuesto de caras se gaste en la roca. Está
aplicado en `gst1` y `gst9`.

Para decidir la caja se mira la malla con:

```bash
python tools/vista_malla.py <archivo.obj> --eje z    # planta
python tools/vista_malla.py <archivo.obj> --eje y    # de frente
```

que dibuja una vista ortográfica texturizada con una grilla de coordenadas locales
encima; los números de la grilla son los que se escriben en `RECORTES`.

Las copias de trabajo de las mallas originales están en `../3D/_recortes_originales/`;
el script nunca escribe sobre el material original del proyecto.

## Publicar una versión nueva

El navegador y el service worker guardan copia del código. Después de modificar
cualquier archivo de `css/` o `js/`:

```bash
python tools/version.py
```

Eso sube el `?v=N` en `index.html`, `sw.js` y `js/app.js`, y renombra la caché del
esqueleto, de modo que la próxima visita reciba el código nuevo.

## Uso sin conexión

En **Ajustes → Descargar todo para usar sin conexión** se guardan las fotos, los
modelos y las panorámicas (unos 60 MB). El service worker mantiene tres cachés
separadas: el esqueleto de la app, el contenido descargado y las teselas del mapa que
se han ido viendo, de modo que actualizar la app no borra lo que la persona ya bajó.

El mapa usa teselas de OpenStreetMap cuando hay red. Sin red dibuja el esquema con las
georutas, los geositios y la posición GPS, que es lo que se necesita para orientarse.

## Añadir o editar geositios

Todo el contenido está en `js/datos.js`, en un solo arreglo `GEOSITIOS`. Un geositio
mínimo necesita `id`, `num`, `nombre`, `lat`, `lon`, `alt`, `unidad`, `gancho`,
`descripcion` y `claves`; el resto (`fotos`, `modelo`, `pano`, `muestra`, `estructura`,
`geotecnia`) es opcional y la app solo muestra las pestañas que tienen contenido. Las
palabras listadas en `glosario` se vuelven tocables dentro de los textos.

## Estado y pendientes

Funciona y está probado de punta a punta: cartel QR → lectura → ficha → marcado como
visitado. Quedan tres cosas fuera del alcance de este trabajo:

- **Audioguías**: la carpeta `Audios` del proyecto está vacía. Por ahora la app lee los
  textos con la voz del sistema (`Escuchar`). Si aparecen las grabaciones, conviene
  usarlas en su lugar.
- **Geositios 11 y 12**: no tienen fotografías interpretadas ni modelo en el material
  disponible, así que su ficha es solo texto.
- **Trazado de los senderos**: el mapa une los geositios con una línea suavizada, no con
  el trazado real de los caminos. Está en `SIG/Shp`; convertirlo a GeoJSON y dibujarlo
  mejoraría la orientación.

---

Contenido: Unidad de Geopatrimonio, SERNAGEOMIN · proyecto GEOPARQUEMET.
Cartografía base del mapa: © colaboradores de OpenStreetMap.
