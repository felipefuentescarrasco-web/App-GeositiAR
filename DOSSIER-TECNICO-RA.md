# GeoParquemet · dossier técnico

Documento para equipos que quieran reutilizar el material del proyecto GEOPARQUEMET
—en particular para una aplicación de **realidad aumentada** sobre los geositios del
Parque Metropolitano de Santiago.

Contenido: Unidad de Geopatrimonio, SERNAGEOMIN · proyecto GEOPARQUEMET (2020).

---

## 1. Qué existe hoy

Una aplicación web instalable (PWA) que funciona sin conexión y se abre al escanear el
código QR del cartel de cada geositio.

| | |
|---|---|
| App en producción | https://geoparquemet-geotours.netlify.app |
| Generador de carteles QR | https://geoparquemet-geotours.netlify.app/qr.html |
| Repositorio | https://github.com/felipefuentescarrasco-web/App-GeositiAR |
| Sitio del proyecto | https://geoparquemet.sernageomin.cl |

Cubre **12 geositios** y **2 georutas** (Pío Nono – Tupahue, Cumbre – Tupahue), con
fotografías interpretadas, 9 modelos fotogramétricos, 2 panorámicas 360°, corte
geológico y glosario.

---

## 2. Los geositios

Coordenadas del Inventario Nacional de Geositios. Datum **SIRGAS-Chile**, proyección
**UTM 19 Sur** (EPSG:32719); las lat/lon son WGS84 y están redondeadas a 4 decimales
en el inventario, es decir unos **±11 m**. Para trabajo fino usar las UTM.

| # | ID app | Código | Nombre | Lat | Lon | UTM E | UTM N | Alt (m) | Unidad | 3D | 360 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | GPM01 | GST00001 | Caída de bloques de roca volcánica | −33,4286 | −70,6374 | 347776 | 6300003 | 590 | OlMa | ✔ | |
| 2 | GPM02 | GST00002 | Dique en rocas volcánicas | −33,4265 | −70,6376 | 347757 | 6300230 | 620 | Mh | ✔ | |
| 3 | GPM03 | GST00003 | Vegetación, roca y suelo | −33,4207 | −70,6377 | 347732 | 6300868 | 655 | OlMa | ✔ | |
| 4 | GPM04 | GST00004 | Cristales de piroxeno en roca intrusiva | −33,4203 | −70,6379 | 347716 | 6300914 | 650 | Mh | ✔ | |
| 5 | GPM05 | GST00005 | Descomposición de la roca en capas | −33,4202 | −70,6378 | 347725 | 6300927 | 651 | Mh | ✔ | |
| 6 | GPM06 | GST00006 | Contacto roca volcánica / intrusiva | −33,4174 | −70,6275 | 348673 | 6301254 | 710 | Mh | ✔ | |
| 7 | GPM07 | GST00007 | Toba soldada | −33,4171 | −70,6254 | 348877 | 6301288 | 716 | OlMa | ✔ | ✔ |
| 8 | GPM08 | GST00008 | Roca de la piscina Tupahue | −33,4159 | −70,6238 | 349020 | 6301427 | 700 | OlMa | | |
| 9 | GPM09 | GST00009 | Columnas de roca intrusiva, Av. Pedro Bannen | −33,4183 | −70,6282 | 348613 | 6301156 | 762 | Mh | ✔ | ✔ |
| 10 | GPM10 | GST00010 | Marcas de movimiento en fracturas | −33,4180 | −70,6269 | 348735 | 6301190 | 761 | OlMa | ✔ | |
| 11 | GPM11 | GST00011 | Columnas de roca, Casa de las Arañas | −33,4227 | −70,6324 | 348227 | 6300661 | 828 | OlMa | | |
| 12 | GPM12 | GST00012 | Rocas intrusivas en la cumbre | −33,4255 | −70,6332 | 348163 | 6300344 | 847 | Mh | | |

Dos puntos de interés adicionales, sin ficha geológica propia: **Mirador El Hundimiento**
(−33,4232, −70,6243, 783 m) y **Cantera El Hundimiento** (−33,4219, −70,6239, 771 m).

**Unidades geológicas:** `OlMa` = Formación Abanico, rocas volcánicas del Oligoceno–Mioceno
temprano (~34–20 Ma). `Mh` = intrusivos hipabisales, microdiorita del Mioceno (~20–15 Ma).
El intrusivo forma el núcleo de la cumbre y la Formación Abanico lo envuelve en los flancos.

---

## 3. Modelos 3D

Nueve mallas en `assets/3d/*.glb`. Son **glTF 2.0 binario**, derivadas de levantamientos
fotogramétricos Pix4D del proyecto.

### Especificaciones

| | |
|---|---|
| Formato | glTF 2.0 binario (`.glb`), textura embebida |
| Geometría | ~60.000 triángulos por modelo (57.420 – 68.802) |
| Atributos | `POSITION` (float32) y `TEXCOORD_0` (float32) |
| Índices | `UNSIGNED_INT` (uint32) |
| Normales | **no incluidas** — ver advertencia abajo |
| Textura | JPEG 2048 px de ancho, calidad 82, embebida en el buffer |
| Material | `doubleSided: true`, `metallicFactor: 0`, `roughnessFactor: 0.95` |
| Origen | centrados en (0,0,0) |
| Eje vertical | **Y** (ya rotados desde el Z-up de Pix4D) |
| Peso | 2,2 – 3,0 MB por modelo |

### ⚠ Sin normales

Los `.glb` **no traen el atributo `NORMAL`**. Según la especificación glTF, el cliente
debe calcular normales planas cuando faltan; three.js lo resuelve activando
`flatShading`, que además queda bien para roca decimada. Otros motores no lo hacen
solos: **Unity, Unreal y varios visores muestran el modelo negro o sin iluminar**.

Si tu visor no ilumina el modelo, es esto. Se resuelve recalculando normales al
importar (`Recalculate Normals` en Unity, `computeVertexNormals()` en three.js) o
regenerando los `.glb` con normales desde `tools/build_assets.py`.

Vale la pena tenerlo presente: es la causa más probable de un modelo en negro.

### Dimensiones y escala

Las dimensiones son las de la caja envolvente ya rotada a Y arriba.

| Modelo | Geositio | X × Y × Z | Triángulos | Peso | Unidades |
|---|---|---|---|---|---|
| `gst1.glb` | 1 · talud | 147,6 × 88,0 × 120,3 | 65.834 | 2,7 MB | **arbitrarias** |
| `gst2.glb` | 2 · dique | 1,5 × 3,9 × 4,4 | 68.199 | 2,8 MB | metros |
| `gst3.glb` | 3 · raíces | 20,6 × 12,1 × 19,6 | 66.248 | 2,6 MB | metros |
| `gst4.glb` | 4 · piroxeno | 3,6 × 1,4 × 2,9 | 65.083 | 2,3 MB | metros |
| `gst5.glb` | 5 · exfoliación | 28,6 × 30,1 × 27,9 | 68.371 | 2,8 MB | metros |
| `gst6.glb` | 6 · contacto | 22,6 × 16,0 × 15,6 | 68.802 | 3,0 MB | metros |
| `gst7.glb` | 7 · fiamme | 10,2 × 19,6 × 19,6 | 61.004 | 2,2 MB | metros |
| `gst9.glb` | 9 · columnas | 183,9 × 288,3 × 73,2 | 57.420 | 2,2 MB | **arbitrarias** |
| `gst10.glb` | 10 · estrías | 0,5 × 0,2 × 0,6 | 65.947 | 2,7 MB | metros |

### ⚠ Dos modelos no están a escala

`gst1` y `gst9` provienen de proyectos Pix4D **sin archivo de georreferenciación**, así
que están en el sistema local arbitrario de Pix4D: sus unidades no son metros.

La evidencia es consistente: los modelos con desplazamiento UTM conocido dan dimensiones
plausibles (el afloramiento de estrías mide 0,6 en el modelo y es un primer plano
decimétrico real), mientras que `gst1` marca 147 unidades para un talud que en terreno
tiene **4 m de altura**, y `gst9` marca 288 para una pared con columnas de **5 a 6 m de
largo y 0,3 m de diámetro**.

Esos valores del inventario sirven para calibrar el factor de escala midiendo el rasgo
correspondiente dentro del modelo. No lo dejo calculado aquí porque habría que medirlo
sobre la malla, no estimarlo.

### Georreferenciación

Los `.glb` están **centrados en el origen**, de modo que la posición absoluta se pierde
en la conversión. Para recuperarla hay que volver al `.obj` original y a su archivo de
desplazamiento:

```
posición UTM = coordenada del OBJ + offset     (EPSG:32719, Z = altitud en m)
```

Los desplazamientos están en `<proyecto>/1_initial/params/<nombre>_offset.xyz`. Los que
localicé:

| Proyecto Pix4D | Modelo | Offset E, N, Z |
|---|---|---|
| `GST1_3D/GST1` | (variante no usada en la app) | 347773, 6300112, 267 |
| `GST2_3D/Dique2_PM2` | `gst2` | 347799, 6300333, 0 |
| `GST3_3D/Raices1_PMI03` | `gst3` | 347904, 6301193, 0 |
| `GST3_3D/Raices2_PMI03` | (no usada) | 347924, 6301213, 0 |
| `GST4_3D/GST4b` | (variante) | 347965, 6301166, 3 |
| `GST5_3D/Meteo1_PM5` | (variante) | 347838, 6301031, 2 |
| `GST6_3D/Contacto1` | `gst6` | 348671, 6301250, 542 |
| `GST7_3D/Fiamme1_PM19-PMC04` | `gst7` | 349237, 6301011, 0 |

**Verificación:** comprobé el convenio de ejes solo en `GST1`, donde las coordenadas del
geositio 1 caen efectivamente dentro de la malla con el mapeo X = este, Y = norte,
Z = altitud. Los demás desplazamientos los leí de los archivos pero **no los validé**
contra la posición del geositio, y en algunos casos el centro del proyecto queda a
varios cientos de metros del geositio, lo que puede ser normal —el vuelo cubre más que
el afloramiento— o puede indicar que el proyecto corresponde a otro punto. Conviene
verificarlo antes de anclar nada por coordenadas.

### ⚠ Convenio de ejes del material original

Pix4D entrega las mallas con **Z hacia arriba** (X este, Y norte, Z altitud). glTF y la
mayoría de los motores usan **Y hacia arriba**. El pipeline aplica el giro
`(x, y, z) → (x, z, −y)` al exportar, así que los `.glb` ya vienen corregidos; si
trabajas directamente desde los `.obj` originales, hay que aplicarlo.

---

## 4. Otro material disponible

Todo está en la carpeta del proyecto, junto a la app:

| Carpeta | Contenido | Utilidad para RA |
|---|---|---|
| `3D/` | Mallas Pix4D completas: `.obj` de 30–70 MB, texturas de 9–15 MB, `.fbx`, nubes de puntos, DSM y ortomosaicos | Fuente para regenerar modelos con más detalle, o para *model targets* |
| `2D/` | Pares de fotografías original / interpretada, 8–22 MB cada una | *Image targets*; la capa interpretada como superposición |
| `360/` | Panorámicas equirectangulares (geositios 7 y 9), original e interpretada | Skybox, vistas inmersivas |
| `SIG/` | Shapefiles, KMZ, rásteres, CSV del inventario | Geometría de senderos y cartografía geológica 1:20.000 |
| `Pelis/` | Vídeos de los afloramientos | Material de apoyo |

En la app, esas fotos y panorámicas ya están optimizadas: `assets/fotos/` a 1600 px
(más miniaturas `t_*.jpg` a 560 px) y `assets/360/` a 4096 px.

**Nomenclatura de las fotos:** `GST<n>_<i>.jpg` es la original y
`GST<n>_<i>_interpretada.jpg` la misma toma con la interpretación geológica dibujada
encima. Están alineadas píxel a píxel, que es lo que permite el comparador de cortina
de la app — y lo que permitiría superponer la interpretación sobre la foto en RA.

---

## 5. Integración con la app existente

### Enlaces profundos

Cada geositio tiene una URL estable:

```
https://geoparquemet-geotours.netlify.app/index.html#/g/GPM09
```

Añadiendo `?qr=1` el geositio además queda marcado como visitado:

```
https://geoparquemet-geotours.netlify.app/index.html#/g/GPM09?qr=1
```

Los IDs son `GPM01` … `GPM12`. Otras rutas: `#/mapa`, `#/corte`, `#/glosario`,
`#/historia`, `#/ruta/r1`, `#/ruta/r2`, `#/escanear`.

Desde una app de RA se puede abrir esa URL para entregar la ficha completa sin
reimplementar el contenido.

### Códigos QR de los carteles

Los carteles físicos codifican esa misma URL con `?qr=1`. El lector de la app acepta
además el código del inventario (`GST00009`), el ID (`GPM09`) o el número suelto (`9`),
lo que facilita que un escáner de otra aplicación derive al geositio correcto.

Un QR impreso de tamaño conocido sirve como marcador de anclaje con pose de 6 grados de
libertad, que es bastante más preciso que el GPS en este terreno (ver §7).

### Datos

Todo el contenido vive en un único archivo sin dependencias:
[`js/datos.js`](js/datos.js). Exporta `GEOSITIOS`, `RUTAS`, `PUNTOS`, `UNIDADES`,
`GLOSARIO` e `HISTORIA` como objetos JavaScript planos, fáciles de convertir a JSON.

Estructura de un geositio:

```js
{
  id: 'GPM09', num: 9, codigo: 'GST00009',
  nombre: '…', subtitulo: '…',
  lat: -33.4183, lon: -70.6282, alt: 762,
  ruta: 'r2', orden: 4,
  unidad: 'Mh', litologia: 'Microdiorita', clase: 'Diorítica',
  interes: '…', valor: '…', conservacion: '…',
  gancho: '…',                        // una frase de enganche
  descripcion: '…',                   // texto del inventario
  claves: ['…', '…', '…'],            // qué observar en terreno
  observa: '…',                       // pista de campo
  estructura: '…', alteracion: '…', geotecnia: '…',   // opcionales
  fotos: [{ base, interp, titulo, leyenda }],
  modelo: { archivo: 'gst9.glb', titulo, nota },
  pano:   { base, interp, titulo, leyenda },
  muestra:{ base, interp, titulo, leyenda },
  glosario: ['disyuncion', 'microdiorita', …]   // términos que se vuelven tocables
}
```

---

## 6. Regenerar los modelos

`tools/build_assets.py` produce los assets livianos desde el material original.

```bash
python tools/build_assets.py            # fotos, 360 y mallas
python tools/build_assets.py --solo 3d  # solo las mallas
```

No rehace lo que ya existe: para regenerar un modelo hay que borrarlo antes.

Parámetros que probablemente quieras tocar:

| Constante | Valor actual | Qué controla |
|---|---|---|
| `CARAS_OBJETIVO` | 60000 | Presupuesto de triángulos por malla |
| `ANCHO_TEXTURA` | 2048 | Ancho de la textura embebida |
| `MALLAS` | dict | Qué `.obj` alimenta cada modelo |
| `RECORTES` | dict | Caja de recorte en coordenadas locales |

La decimación es por **agrupamiento espacial** (*vertex clustering*): fusiona los
vértices que caen en una misma celda de una grilla cuyo tamaño se ajusta hasta alcanzar
el presupuesto. La clave de agrupamiento incluye una celda gruesa de UV para no soldar
islas distintas del atlas de textura. Para RA con más detalle, subir `CARAS_OBJETIVO`
es directo: 200.000 caras dan archivos de unos 7 MB.

Para decidir un recorte, `tools/vista_malla.py` dibuja una vista ortográfica texturizada
con una grilla de coordenadas locales encima:

```bash
python tools/vista_malla.py <archivo.obj> --eje z    # planta
python tools/vista_malla.py <archivo.obj> --eje y    # de frente
```

Los números de esa grilla son los que se escriben en `RECORTES`.

---

## 7. Notas para el anclaje en realidad aumentada

Esto es terreno de tu colega, pero hay condicionantes del sitio que conviene saber antes
de elegir una estrategia:

**El GPS no alcanza para superponer.** Los geositios están en ladera, bajo arboleda y con
el cerro bloqueando parte del cielo; la precisión típica ahí es de 5 a 15 m. Sirve para
*saber a qué geositio te acercas* —la app lo usa para eso— pero no para calzar un modelo
sobre el afloramiento real.

**Los geositios 4 y 5 están a 3 metros uno del otro** (347716/6300914 y 347725/6300927).
Ninguna solución basada solo en GPS los va a distinguir.

**El QR del cartel es el ancla más barata.** Ya está previsto instalarlos, el generador
produce códigos con corrección de errores alta, y un QR impreso de tamaño conocido
entrega pose completa. Si se adopta esta vía, conviene fijar e imprimir un tamaño
estándar y registrarlo.

**Las mallas sirven como *model target*** en los geositios 2, 4, 6, 7 y 10, que son
afloramientos acotados y bien reconstruidos. En 1 y 9 hay que resolver antes la escala.

**La roca cambia poco, la vegetación mucho.** Los levantamientos son del verano de 2020:
la geometría de la roca sigue válida, pero el entorno vegetal y la iluminación no. Para
*image tracking* con las fotos originales conviene revisar en terreno.

**Los geositios 8, 11 y 12 no tienen modelo** en el material disponible. El 8 —la roca de
la piscina Tupahue, además Monumento Nacional en categoría Zona Típica— es el de mayor
interés público y no está levantado; podría ser un buen objetivo para una campaña nueva.

---

## 8. Licencia y contacto

El contenido geológico, las fotografías, los modelos y el inventario pertenecen a
**SERNAGEOMIN**, Unidad de Geopatrimonio, proyecto GEOPARQUEMET. Su reutilización debe
acordarse con el Servicio y citar la fuente.

La cartografía base del mapa de la app es de © colaboradores de **OpenStreetMap**
(ODbL). Las bibliotecas incluidas en `js/vendor/` son de terceros: three.js y sus
cargadores (MIT), jsQR (Apache 2.0), qrcodejs (MIT).

Documentación técnica de la app: [`LEEME.md`](LEEME.md).
Presentación general: [`README.md`](README.md).
