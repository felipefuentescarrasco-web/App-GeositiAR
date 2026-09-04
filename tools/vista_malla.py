# -*- coding: utf-8 -*-
"""
Dibuja una vista ortografica de una malla OBJ texturizada, para ubicar a ojo
donde esta el afloramiento dentro de un levantamiento grande.

No pretende ser un render bonito: pinta cada triangulo con el color promedio de
su textura, de atras hacia adelante, y superpone una grilla de coordenadas
locales para poder leer la caja de recorte.

Uso:
    python tools/vista_malla.py <archivo.obj> [--eje z|x|y] [--px 1400] [--salida img.png]

--eje z  mira desde arriba (planta)      --eje x  mira desde el este
                                          --eje y  mira desde el norte
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFile

sys.path.insert(0, os.path.dirname(__file__))
import build_assets as B

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True

EJES = {  # eje de vista -> (eje horizontal, eje vertical, eje de profundidad)
    "z": (0, 1, 2),
    "x": (1, 2, 0),
    "y": (0, 2, 1),
}
NOMBRES = ["X (este)", "Y (norte)", "Z (altitud)"]


def colores_de_triangulos(uv, caras, ruta_textura, muestreo=6):
    """Color promedio de cada triangulo, muestreando la textura en sus vertices."""
    if not ruta_textura or not os.path.exists(ruta_textura):
        return np.full((len(caras), 3), 150, dtype=np.uint8)
    tex = Image.open(ruta_textura).convert("RGB")
    tex.thumbnail((tex.width // muestreo, tex.height // muestreo), Image.BILINEAR)
    px = np.asarray(tex)
    alto, ancho = px.shape[:2]
    ti = np.clip(caras[:, :, 1], 0, len(uv) - 1)
    u = np.clip(uv[ti, 0], 0, 0.9999)
    v = np.clip(1.0 - uv[ti, 1], 0, 0.9999)
    cols = px[(v * alto).astype(int), (u * ancho).astype(int)]
    return cols.mean(axis=1).astype(np.uint8)


def dibujar(ruta_obj, eje="z", px=1400, salida=None, marca=None):
    pos, uv, caras = B.leer_obj(ruta_obj)
    h, v, d = EJES[eje]

    tri = pos[caras[:, :, 0]]
    colores = colores_de_triangulos(uv, caras, B.textura_de_mtl(ruta_obj))

    usados = np.unique(caras[:, :, 0])
    p = pos[usados]
    lo, hi = p.min(0), p.max(0)
    anchoM = max(hi[h] - lo[h], 1e-6)
    altoM = max(hi[v] - lo[v], 1e-6)
    escala = px / anchoM
    alto_px = max(int(altoM * escala), 10)

    im = Image.new("RGB", (px, alto_px), (16, 22, 20))
    dib = ImageDraw.Draw(im)

    def a_pantalla(punto):
        return ((punto[..., h] - lo[h]) * escala,
                (hi[v] - punto[..., v]) * escala)

    xs, ys = a_pantalla(tri)
    orden = np.argsort(tri[:, :, d].mean(axis=1))   # pintor: lo lejano primero
    if eje == "z":
        orden = orden                                # desde arriba: mayor Z al final
    xs, ys, colores = xs[orden], ys[orden], colores[orden]

    for i in range(len(xs)):
        c = colores[i]
        dib.polygon([(xs[i, 0], ys[i, 0]), (xs[i, 1], ys[i, 1]), (xs[i, 2], ys[i, 2])],
                    fill=(int(c[0]), int(c[1]), int(c[2])))

    # grilla de coordenadas locales cada 10 o 25 metros, segun el tamano
    paso = 10 if anchoM < 120 else 25 if anchoM < 400 else 50
    inicio_h = np.ceil(lo[h] / paso) * paso
    inicio_v = np.ceil(lo[v] / paso) * paso
    for x in np.arange(inicio_h, hi[h], paso):
        sx = (x - lo[h]) * escala
        dib.line([(sx, 0), (sx, alto_px)], fill=(255, 90, 40), width=1)
        dib.text((sx + 3, 4), "%d" % x, fill=(255, 190, 120))
    for y in np.arange(inicio_v, hi[v], paso):
        sy = (hi[v] - y) * escala
        dib.line([(0, sy), (px, sy)], fill=(255, 90, 40), width=1)
        dib.text((4, sy + 3), "%d" % y, fill=(255, 190, 120))

    if marca is not None:
        mx = (marca[h] - lo[h]) * escala
        my = (hi[v] - marca[v]) * escala
        r = 14
        dib.ellipse([mx - r, my - r, mx + r, my + r], outline=(0, 255, 200), width=4)
        dib.line([(mx - r * 2, my), (mx + r * 2, my)], fill=(0, 255, 200), width=2)
        dib.line([(mx, my - r * 2), (mx, my + r * 2)], fill=(0, 255, 200), width=2)

    dib.text((6, alto_px - 16),
             "horizontal: %s   vertical: %s   grilla cada %d m" % (NOMBRES[h], NOMBRES[v], paso),
             fill=(255, 255, 255))

    salida = salida or (os.path.splitext(os.path.basename(ruta_obj))[0] + "_" + eje + ".png")
    im.save(salida, "PNG")
    print("%s  (%d x %d px, %.0f x %.0f m)" % (salida, px, alto_px, anchoM, altoM))
    return salida


if __name__ == "__main__":
    args = sys.argv[1:]
    ruta = args[0]
    eje = args[args.index("--eje") + 1] if "--eje" in args else "z"
    px = int(args[args.index("--px") + 1]) if "--px" in args else 1400
    salida = args[args.index("--salida") + 1] if "--salida" in args else None
    marca = None
    if "--marca" in args:
        marca = np.array([float(v) for v in args[args.index("--marca") + 1].split(",")])
    dibujar(ruta, eje, px, salida, marca)
