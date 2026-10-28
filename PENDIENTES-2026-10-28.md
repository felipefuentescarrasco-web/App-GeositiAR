# GeoParquemet · estado y pendientes (28-10-2026)

Pedido de Felipe del 27-10-2026. Qué quedó hecho y publicado, y qué sigue.

## Contexto que hay que saber antes de tocar nada

- El código vivo está en GitHub: `felipefuentescarrasco-web/App-GeositiAR`, rama `main`, publicado
  con GitHub Pages (https://felipefuentescarrasco-web.github.io/App-GeositiAR/). Netlify quedó en una
  versión vieja (v8) y no se usa.
- La copia local de OneDrive estaba atrasada (septiembre); el 27-10 se adelantó a `origin/main`.
  **Antes de trabajar: `git pull`.**
- La app de Carlos Venegas está copiada en `geoparquemet/docs/`. La app principal es la de la raíz.
- Después de cambiar `css/` o `js/`: `python tools/version.py`.

## Hecho y publicado

- [x] Portada con la imagen de identidad GeoParquemet y la barra de logos Sernageomin / Parquemet
      (de la app de Carlos), más una franja con la panorámica del dron del 27-10.
- [x] Banner para instalar la app: abre las instrucciones (Android: ⋮ → Instalar aplicación, con
      botón directo cuando el navegador lo permite; iPhone: Compartir → Agregar a inicio).
- [x] Botón en el mapa para prender y apagar la geología (se acuerda de la elección).
- [x] Audios de cada geositio en español, inglés y portugués, con selector de idioma y barra de
      avance. 1 a 8: los de Carlos. 9 a 12: generados con las mismas voces neurales
      (`node tools/voces_geositios.mjs && python tools/voces_geositios.py`).
- [x] Vibración al llegar a 35 m de un geositio o de la maqueta, con aviso "Abrir". Solo funciona si
      ya se dio permiso de ubicación; se apaga en Ajustes.
- [x] El escáner ya no pide escribir el número del geositio: ofrece "Ver los geositios" y
      "Menú principal".
- [x] RA: botón grande redondo "📌 Fijar" a la derecha mientras se ve la capa.
- [x] RA Geositio 1: 7 objetivos nuevos (g1_12 … g1_18) con las fotos del 27-10. Prueba con fotos
      no usadas: el g1.mind nuevo reconoce 3/3; el anterior, 0/3. El service worker borra el
      g1.mind viejo de los teléfonos.
- [x] RA sobre la maqueta (capas, rótulos y fichas sobre el relieve): estaba en una rama sin unir;
      se unió a `main`. Se abre desde la ficha "Maqueta táctil Parquemet".
- [x] Panorámicas de Drive ("Fusionadas") guardadas en
      `Parquemet/Fotos Geotour 2026/Panoramicas Drive (Fusionadas)`.

## Pendiente

1. **Fotos de la mañana (Felipe va a terreno el 28-10).** Por cada geositio con RA (1, 2, 3, 6):
   ```bash
   python tools/objetivos_terreno.py 1 "<carpeta de fotos>" foto1.jpg foto2.jpg ...
   PLAYWRIGHT=<ruta a playwright-core> CHROMIUM="C:/Program Files/Google/Chrome/Application/chrome.exe" node tools/compilar_marcador.mjs --rocas 1
   PLAYWRIGHT=... CHROMIUM=... node tools/compilar_marcador.mjs 1        # la versión con hoja impresa
   python tools/version.py
   ```
   Agregar los archivos nuevos a `ARCHIVOS_RA` en `js/app.js` y el `.mind` a `RENOVAR` en `sw.js`.
   Probar con fotos que no se usaron: `node tools/probar_rocas.mjs ar/g1.mind <mind anterior>`
   (las fotos de prueba van en `tools/_prueba_rocas/` + `casos.json`).
   playwright-core se instala con `npm i playwright-core@1.48.2` en una carpeta temporal.
2. **Contraluz.** Las 4 fotos de las 14:02 con el sol dentro del lente no calzan con nada, ni se
   reconocen. Consejo para el uso: apuntar a la roca sin el sol en cuadro (taparlo con la mano).
3. **Fotos dudosas del 27-10** (sin GPS): 14:41 (¿geositio 2?), 15:16 (muestra de mano), 15:19
   (columnas, ¿9?), 15:28 (¿6 o 10?). Confirmar con Felipe a qué geositio corresponde cada grupo
   para usarlas en la RA de 2 y 6 o en las fichas. Los videos `.mp4` no se revisaron.
4. **Panorámica 360 navegable.** Las de Drive son "planetitas" y ojos de pez, no equirectangulares.
   Los cuadros crudos del dron (`Terreno 27_10_26/Drone/Panoramas/102_09xx`) podrían unirse en una
   esfera para el visor 360 de la app.
