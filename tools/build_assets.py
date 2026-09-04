# -*- coding: utf-8 -*-
"""
Pipeline de assets para la app GeoParquemet Geotours.

Toma el material original del proyecto y produce assets livianos, aptos para
telefono:

  * fotos 2D (pares "escala" / "interpretada")  -> assets/fotos/*.jpg  (+ thumb)
  * panoramicas 360                             -> assets/360/*.jpg
  * mallas fotogrametricas Pix4D (.obj + .jpg)  -> assets/3d/*.glb

Las mallas se deciman por agrupamiento espacial (vertex clustering) y se
exportan como glTF binario con la textura embebida.

Uso:   python tools/build_assets.py [--solo fotos|360|3d]
"""
import io
import json
import os
import struct
import sys
import time

import numpy as np
from PIL import Image, ImageFile

Image.MAX_IMAGE_PIXELS = None
# varios originales del proyecto vienen con el flujo JPEG cortado al final
ImageFile.LOAD_TRUNCATED_IMAGES = True

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_FOTOS = os.path.join(APP, "assets", "fotos")
OUT_360 = os.path.join(APP, "assets", "360")
OUT_3D = os.path.join(APP, "assets", "3d")

ANCHO_FOTO = 1600
ANCHO_THUMB = 560
ANCHO_360 = 4096
ANCHO_TEXTURA = 2048
CARAS_OBJETIVO = 60000


def log(*a):
    print(*a, flush=True)


# --------------------------------------------------------------------------
# Fotos
# --------------------------------------------------------------------------

FOTOS = {}   # nombre destino -> ruta origen relativa a la raiz del proyecto

PARES = {
    1: [("GST1_escala.jpg", "GST1_interpretada.jpg")],
    2: [("GST2_1_escala.jpg", "GST2_1_interpretada.jpg"),
        ("GST2_2_escala.jpg", "GST2_2_interpretada.jpg")],
    3: [("GST3_1_escala.jpg", "GST3_1_interpretada.jpg"),
        ("GST3_2_escala.jpg", "GST3_2_interpretada.jpg")],
    4: [("GST4_1_escala.jpg", "GST4_1_interpretada.jpg"),
        ("GST4_2.jpg", "GST4_2_interpretada.jpg"),
        ("GST4_3.jpg", "GST4_3_interpretada.jpg"),
        ("GST4_4.jpg", "GST4_4_interpretada.jpg"),
        ("GST4_5_escala.jpg", "GST4_5_interpretada.jpg"),
        ("GST4_6_escala.jpg", "GST4_6_interpretada.jpg"),
        ("GST4_7_escala.jpg", "GST4_7_interpretada.jpg"),
        ("GST4_8_escala.jpg", "GST4_8_interpretada.jpg")],
    5: [("GST5_1_escala.jpg", "GST5_1_interpretada.jpg"),
        ("GST5_2_escala.jpg", "GST5_2_interpretada.jpg")],
    6: [("GST6_1_escala.jpg", "GST6_1_interpretada.jpg"),
        ("GST6_2_escala.jpg", "GST6_2_interpretada.jpg"),
        ("GST6_3_escala.jpg", "GST6_3_interpretada.jpg")],
    7: [("GST7_1_escala.jpg", "GST7_1_interpretada.jpg"),
        ("GST7_2.jpg", "GST7_2_interpretada.jpg")],
    8: [("GST8_1_escala.jpg", "GST8_1_interpretada.jpg"),
        ("GST8_2_escala.jpg", "GST8_2_interpretada.jpg"),
        ("GST8_3_escala.jpg", "GST8_3_interpretada.jpg"),
        ("GST8_MuestraMano.jpg", "GST8_MuestraMano_interpretada.jpg")],
}

for _gst, _pares in PARES.items():
    for _base, _interp in _pares:
        FOTOS[_base.replace("_escala", "")] = "2D/" + _base
        FOTOS[_interp] = "2D/" + _interp

# Geositio 9 (georuta 2)
for _n in ("6710", "6858", "6860"):
    FOTOS["PM43_IMG_%s.jpg" % _n] = "2D/Fotos_Gesoitio9_georuta2/2D/PM43_IMG_%s.JPG" % _n
    FOTOS["PM43_IMG_%s_interpretada.jpg" % _n] = \
        "2D/Fotos_Gesoitio9_georuta2/2D/PM_43_IMG_%s_escala.JPG" % _n
FOTOS["PM_B_11.jpg"] = "2D/Fotos_Gesoitio9_georuta2/2D/PM_B_11.jpg"

PANORAMAS = {
    "GST7_360.jpg": "360/GST7_360.jpg",
    "GST7_360_interpretada.jpg": "360/GST7_360_interpretada.jpg",
    "GST9_360.jpg": "2D/Fotos_Gesoitio9_georuta2/360/360_0082.JPG",
    "GST9_360_interpretada.jpg": "2D/Fotos_Gesoitio9_georuta2/360/360_0082_interpretado.jpg",
}


def redimensionar(origen, destino, ancho_max, calidad=78):
    im = Image.open(origen).convert("RGB")
    if im.width > ancho_max:
        alto = round(im.height * ancho_max / im.width)
        im = im.resize((ancho_max, alto), Image.LANCZOS)
    im.save(destino, "JPEG", quality=calidad, optimize=True, progressive=True)
    return im.size, os.path.getsize(destino)


def construir_fotos():
    os.makedirs(OUT_FOTOS, exist_ok=True)
    faltantes = []
    for dest, rel in sorted(FOTOS.items()):
        origen = os.path.join(RAIZ, rel.replace("/", os.sep))
        if not os.path.exists(origen):
            faltantes.append(rel)
            continue
        salida = os.path.join(OUT_FOTOS, dest)
        if os.path.exists(salida):
            continue
        try:
            tam, peso = redimensionar(origen, salida, ANCHO_FOTO)
            redimensionar(origen, os.path.join(OUT_FOTOS, "t_" + dest), ANCHO_THUMB, 70)
        except OSError as e:
            log("  [error] %s: %s" % (dest, e))
            for f in (salida, os.path.join(OUT_FOTOS, "t_" + dest)):
                if os.path.exists(f):
                    os.remove(f)
            faltantes.append(rel)
            continue
        log("  foto %-36s %sx%s  %d KB" % (dest, tam[0], tam[1], peso // 1024))
    if faltantes:
        log("  [aviso] no encontradas: " + ", ".join(faltantes))


def construir_360():
    os.makedirs(OUT_360, exist_ok=True)
    for dest, rel in PANORAMAS.items():
        origen = os.path.join(RAIZ, rel.replace("/", os.sep))
        if not os.path.exists(origen):
            log("  [aviso] falta panorama " + rel)
            continue
        salida = os.path.join(OUT_360, dest)
        if os.path.exists(salida):
            continue
        tam, peso = redimensionar(origen, salida, ANCHO_360, 80)
        log("  360  %-32s %sx%s  %d KB" % (dest, tam[0], tam[1], peso // 1024))


# --------------------------------------------------------------------------
# Mallas 3D
# --------------------------------------------------------------------------

MALLAS = {
    "gst1": "3D/Modelos del compu/Caida 1/Caida1_PM1_simplified_3d_mesh.obj",
    "gst2": "3D/GST2_3D/Dique2_PM2/2_densification/3d_mesh/Dique2_PM2_simplified_3d_mesh.obj",
    "gst3": "3D/GST3_3D/Raices1_PMI03/2_densification/3d_mesh/3d_mesh/Raices1_PMI03_simplified_3d_mesh.obj",
    "gst4": "3D/GST4_3D/Piroxeno1_PM4/2_densification/3d_mesh/3d_mesh/Piroxeno1_PM4_simplified_3d_mesh.obj",
    "gst5": "3D/GST5_3D/Meteo2_PM5/2_densification/3d_mesh/3d_mesh/Meteo2_PM5_simplified_3d_mesh.obj",
    "gst6": "3D/GST6_3D/Contacto1/2_densification/3d_mesh/Contacto1_simplified_3d_mesh.obj",
    "gst7": "3D/GST7_3D/Fiamme1_PM19-PMC04/2_densification/3d_mesh/Fiamme1_PM19-PMC04_simplified_3d_mesh.obj",
    "gst9": "3D/Columnas Mesh/Columnas_3_PM43_PMB11_simplified_3d_mesh.obj",
    "gst10": "3D/Estrias/3d_mesh/Estrias_2_simplified_3d_mesh.obj",
}


# Cajas de recorte en las coordenadas locales de cada malla, para dejar fuera
# la periferia mal reconstruida (vegetacion suelta, huecos, bordes deshilachados)
# y que el presupuesto de caras se gaste en la roca. Se obtienen mirando la malla
# con tools/vista_malla.py. Solo se indican los limites que hacen falta.
RECORTES = {
    "gst1": {"x_min": -60.0},                       # franja de arboles al oeste
    "gst9": {"x_min": -145.0, "z_min": -55.0},      # zona oscura y borde inferior
}


def leer_obj(ruta):
    """Lee un OBJ triangulado de Pix4D: v, vt y caras f v/vt."""
    pos, uv, caras = [], [], []
    with open(ruta, "r", errors="ignore") as fh:
        for linea in fh:
            if linea.startswith("v "):
                p = linea.split()
                pos.append((float(p[1]), float(p[2]), float(p[3])))
            elif linea.startswith("vt "):
                p = linea.split()
                uv.append((float(p[1]), float(p[2])))
            elif linea.startswith("f "):
                p = linea.split()[1:]
                if len(p) < 3:
                    continue
                tri = []
                for c in p[:3]:
                    a = c.split("/")
                    ti = int(a[1]) - 1 if len(a) > 1 and a[1] else -1
                    tri.append((int(a[0]) - 1, ti))
                caras.append(tri)
    return (np.asarray(pos, dtype=np.float64),
            np.asarray(uv, dtype=np.float64) if uv else np.zeros((1, 2)),
            np.asarray(caras, dtype=np.int64))


def textura_de_mtl(ruta_obj):
    mtl = os.path.splitext(ruta_obj)[0] + ".mtl"
    carpeta = os.path.dirname(ruta_obj)
    if os.path.exists(mtl):
        for linea in open(mtl, errors="ignore"):
            if linea.strip().lower().startswith("map_kd"):
                cand = os.path.join(carpeta, linea.split(None, 1)[1].strip())
                if os.path.exists(cand):
                    return cand
    for f in sorted(os.listdir(carpeta)):
        if f.lower().endswith((".jpg", ".png")) and "texture" in f.lower():
            return os.path.join(carpeta, f)
    return None


def recortar_caja(pos, caras, caja):
    """Deja solo los triangulos con sus tres vertices dentro de la caja dada."""
    limites = {"x": 0, "y": 1, "z": 2}
    dentro = np.ones(len(pos), dtype=bool)
    for clave, valor in caja.items():
        eje, extremo = clave.split("_")
        col = pos[:, limites[eje]]
        dentro &= (col >= valor) if extremo == "min" else (col <= valor)
    vi = caras[:, :, 0]
    quedan = caras[dentro[vi].all(axis=1)]
    log("    recorte por caja: %d de %d caras conservadas" % (len(quedan), len(caras)))
    return quedan


def recortar(pos, caras, percentil=1.5):
    """Descarta la periferia dispersa que Pix4D deja alrededor del afloramiento.

    Las mallas traen fondo lejano (cerros, cielo reconstruido) que infla la caja
    envolvente y, con ella, el tamano de celda del decimado.
    """
    lo = np.percentile(pos, percentil, axis=0)
    hi = np.percentile(pos, 100 - percentil, axis=0)
    margen = (hi - lo) * 0.10
    lo, hi = lo - margen, hi + margen
    dentro = np.all((pos >= lo) & (pos <= hi), axis=1)
    if dentro.all():
        return pos, caras
    vi = caras[:, :, 0]
    total = len(caras)
    caras = caras[dentro[vi].all(axis=1)]
    log("    recorte: %d de %d caras conservadas" % (len(caras), total))
    return pos, caras


def _codigos_celda(pos, lado):
    c = np.floor((pos - pos.min(0)) / lado).astype(np.int64)
    n = c.max(0) + 2
    return c[:, 0] + n[0] * (c[:, 1] + n[1] * c[:, 2])


def decimar(pos, uv, caras, caras_objetivo):
    """Agrupamiento espacial: fusiona los vertices que caen en una misma celda.

    La clave incluye una celda gruesa de UV para no soldar islas distintas del
    atlas de textura, lo que produciria manchas al pintar la malla.
    """
    usados = np.unique(caras[:, :, 0])
    pos_util = pos[usados]
    diag = float(np.linalg.norm(pos_util.max(0) - pos_util.min(0)))
    verts_objetivo = max(1000, caras_objetivo // 2)
    lado = diag / 200.0
    for _ in range(12):
        n = len(np.unique(_codigos_celda(pos_util, lado)))
        if abs(n - verts_objetivo) / verts_objetivo < 0.12:
            break
        lado *= (n / verts_objetivo) ** 0.5
    log("    grilla: lado %.4f m  (diagonal %.2f m)" % (lado, diag))

    cod_pos = _codigos_celda(pos, lado)
    vi = caras[:, :, 0].ravel()
    ti = caras[:, :, 1].ravel()
    ti_ok = np.where(ti >= 0, ti, 0)

    uvq = np.floor(np.clip(uv[ti_ok], 0, 0.999) * 16).astype(np.int64)
    clave = np.stack([cod_pos[vi], uvq[:, 0] * 16 + uvq[:, 1]], axis=1)
    _, inverso = np.unique(clave, axis=0, return_inverse=True)
    inverso = inverso.ravel()
    n_nuevos = int(inverso.max()) + 1

    def promedio(valores):
        s = np.zeros((n_nuevos, valores.shape[1]))
        for k in range(valores.shape[1]):
            s[:, k] = np.bincount(inverso, weights=valores[:, k], minlength=n_nuevos)
        cnt = np.bincount(inverso, minlength=n_nuevos).clip(1)
        return s / cnt[:, None]

    npos = promedio(pos[vi])
    nuv = promedio(uv[ti_ok])

    idx = inverso.reshape(-1, 3)
    val = ((idx[:, 0] != idx[:, 1]) & (idx[:, 1] != idx[:, 2]) & (idx[:, 0] != idx[:, 2]))
    idx = idx[val]

    usados, idx = np.unique(idx, return_inverse=True)
    idx = idx.reshape(-1, 3)
    return npos[usados], nuv[usados], idx


def _alinear(b, relleno=b"\x00"):
    return b + relleno * ((-len(b)) % 4)


def escribir_glb(destino, pos, uv, idx, jpeg_bytes):
    # Pix4D entrega la malla con Z hacia arriba (X este, Y norte, Z altitud) y
    # glTF espera Y hacia arriba. Sin este giro el afloramiento se ve acostado.
    pos = np.stack([pos[:, 0], pos[:, 2], -pos[:, 1]], axis=1)
    pos = pos.astype(np.float32)
    # glTF pone el origen UV arriba-izquierda; OBJ lo pone abajo-izquierda.
    uv = np.stack([uv[:, 0], 1.0 - uv[:, 1]], axis=1).astype(np.float32)
    idx = idx.astype(np.uint32)

    crudos = [pos.tobytes(), uv.tobytes(), idx.tobytes(), jpeg_bytes]
    objetivos = [34962, 34962, 34963, None]
    partes, vistas, offset = [], [], 0
    for datos, objetivo in zip(crudos, objetivos):
        vista = {"buffer": 0, "byteOffset": offset, "byteLength": len(datos)}
        if objetivo:
            vista["target"] = objetivo
        vistas.append(vista)
        relleno = _alinear(datos)
        partes.append(relleno)
        offset += len(relleno)
    binario = b"".join(partes)

    gltf = {
        "asset": {"version": "2.0", "generator": "GeoParquemet build_assets.py"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{
            "attributes": {"POSITION": 0, "TEXCOORD_0": 1},
            "indices": 2, "material": 0}]}],
        "materials": [{
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicFactor": 0.0, "roughnessFactor": 0.95},
            "doubleSided": True}],
        "textures": [{"sampler": 0, "source": 0}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987,
                      "wrapS": 33071, "wrapT": 33071}],
        "images": [{"bufferView": 3, "mimeType": "image/jpeg"}],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(pos), "type": "VEC3",
             "min": pos.min(0).tolist(), "max": pos.max(0).tolist()},
            {"bufferView": 1, "componentType": 5126, "count": len(uv), "type": "VEC2"},
            {"bufferView": 2, "componentType": 5125, "count": idx.size, "type": "SCALAR"},
        ],
        "bufferViews": vistas,
        "buffers": [{"byteLength": len(binario)}],
    }

    json_bytes = _alinear(json.dumps(gltf, separators=(",", ":")).encode("utf-8"), b" ")
    total = 12 + 8 + len(json_bytes) + 8 + len(binario)
    with open(destino, "wb") as fh:
        fh.write(struct.pack("<III", 0x46546C67, 2, total))
        fh.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        fh.write(json_bytes)
        fh.write(struct.pack("<II", len(binario), 0x004E4942))
        fh.write(binario)


def construir_3d():
    os.makedirs(OUT_3D, exist_ok=True)
    for nombre, rel in MALLAS.items():
        destino = os.path.join(OUT_3D, nombre + ".glb")
        if os.path.exists(destino):
            log("  3D   %s ya existe, se omite" % nombre)
            continue
        origen = os.path.join(RAIZ, rel.replace("/", os.sep))
        if not os.path.exists(origen):
            log("  [aviso] falta malla " + rel)
            continue
        t0 = time.time()
        log("  3D   %s  <- %s" % (nombre, os.path.basename(origen)))
        pos, uv, caras = leer_obj(origen)
        log("    original: %d vertices, %d caras" % (len(pos), len(caras)))
        if nombre in RECORTES:
            caras = recortar_caja(pos, caras, RECORTES[nombre])
        else:
            pos, caras = recortar(pos, caras)
        usados = np.unique(caras[:, :, 0])
        pos_util = pos[usados]
        log("    caja util: %.2f m de diagonal" % np.linalg.norm(pos_util.max(0) - pos_util.min(0)))
        npos, nuv, idx = decimar(pos, uv, caras, CARAS_OBJETIVO)
        log("    decimado: %d vertices, %d caras" % (len(npos), len(idx)))

        ruta_tex = textura_de_mtl(origen)
        buf = io.BytesIO()
        if ruta_tex:
            im = Image.open(ruta_tex).convert("RGB")
            if im.width > ANCHO_TEXTURA:
                im = im.resize((ANCHO_TEXTURA,
                                round(im.height * ANCHO_TEXTURA / im.width)), Image.LANCZOS)
            im.save(buf, "JPEG", quality=82, optimize=True)
        else:
            log("    [aviso] sin textura, se usa un relleno gris")
            Image.new("RGB", (4, 4), (150, 145, 138)).save(buf, "JPEG")

        # centrar en el origen para que el visor lo encuadre sin sorpresas
        npos = npos - (npos.min(0) + npos.max(0)) / 2.0
        escribir_glb(destino, npos, nuv, idx, buf.getvalue())
        log("    -> %s  %.1f MB  (%.0f s)" % (os.path.basename(destino),
                                              os.path.getsize(destino) / 1e6,
                                              time.time() - t0))


if __name__ == "__main__":
    solo = None
    if "--solo" in sys.argv:
        solo = sys.argv[sys.argv.index("--solo") + 1]
    if solo in (None, "fotos"):
        log("== Fotos 2D ==")
        construir_fotos()
    if solo in (None, "360"):
        log("== Panoramicas 360 ==")
        construir_360()
    if solo in (None, "3d"):
        log("== Mallas 3D ==")
        construir_3d()
    log("Listo.")
