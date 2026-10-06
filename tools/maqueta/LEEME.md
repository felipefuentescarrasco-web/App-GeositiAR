# Modelo 3D de la maqueta (fotogrametría)

Modelo `assets/3d/maqueta.glb` hecho el 6-oct-2026 con los videos y fotos de la carpeta de Drive de
`carpeta-drive.txt`. Todo corre sin tarjeta gráfica (COLMAP 3.9 de Ubuntu y OpenMVS v2.3.0 compilado).

1. **Cuadros**: `.github/workflows/maqueta.yml` baja la carpeta de Drive y `cuadros.py` deja los cuadros
   nítidos (uno por medio segundo, 2000 px) en la rama `datos-maqueta`. Se usaron los 283 de los videos.
2. **Cámaras y nube** (`1_colmap.sh <carpeta>` con las imágenes en `<carpeta>/img`): SIFT 4096 puntos por
   imagen, emparejado secuencial (es un video) y mapeo. Resultado: 283/283 imágenes, ~200 mil puntos,
   0,47 px de error.
3. **Denso** (OpenMVS; compilar con `-D_FORTIFY_SOURCE=0`, si no `DensifyPointCloud` aborta):
   `colmap image_undistorter --max_image_size 1600` → `InterfaceCOLMAP` → `DensifyPointCloud
   --resolution-level 1` → `ReconstructMesh` (≈4 M de caras).
4. **Recorte** (`2_arriba.py`, `3_recortar.py <carpeta> -2.45 80000`): el plano de las cámaras da el
   "arriba"; se deja lo que está sobre la cota del borde de la maqueta, la pieza más grande, y se simplifica
   a 80 mil caras.
5. **Textura**: `TextureMesh escena_dense.mvs -m maqueta.ply --export-type obj --max-texture-size 4096
   --global-seam-leveling 0 --local-seam-leveling 0` (con la nivelación de costuras se cae; con 8192 también).
6. **GLB** (`4_glb.py <carpeta> salida.glb 2048`): une las texturas en una, junta vértices repetidos,
   endereza (Y arriba, lado largo en X, 2 unidades) y escribe el mismo formato liviano que
   `tools/build_assets.py`. ~3,6 MB.
