# -*- coding: utf-8 -*-
"""
Sube el numero de version de los archivos propios de la app.

Los navegadores y el service worker guardan copias de css/*.css y js/*.js. Para
que una publicacion nueva llegue de verdad al telefono de la gente, cada archivo
se pide con ?v=N y ese N debe cambiar cuando el codigo cambia.

Uso:   python tools/version.py          (sube en uno la version)
       python tools/version.py 7        (fija la version 7)
"""
import os
import re
import sys

APP = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ARCHIVOS = ["index.html", "sw.js", os.path.join("js", "app.js")]


def version_actual():
    texto = open(os.path.join(APP, "index.html"), encoding="utf-8").read()
    encontrados = [int(n) for n in re.findall(r"\?v=(\d+)", texto)]
    return max(encontrados) if encontrados else 0


def fijar(nueva):
    for rel in ARCHIVOS:
        ruta = os.path.join(APP, rel)
        texto = open(ruta, encoding="utf-8").read()
        nuevo = re.sub(r"\?v=\d+", "?v=%d" % nueva, texto)
        if nuevo != texto:
            open(ruta, "w", encoding="utf-8").write(nuevo)

    # el nombre de la cache del esqueleto tambien identifica la version
    ruta_sw = os.path.join(APP, "sw.js")
    texto = open(ruta_sw, encoding="utf-8").read()
    texto = re.sub(r"const VERSION = 'v\d+';", "const VERSION = 'v%d';" % nueva, texto)
    open(ruta_sw, "w", encoding="utf-8").write(texto)


if __name__ == "__main__":
    actual = version_actual()
    nueva = int(sys.argv[1]) if len(sys.argv) > 1 else actual + 1
    fijar(nueva)
    print("version %d -> %d" % (actual, nueva))
