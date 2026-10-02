"""Genera js/i18n-datos.js: traducción de los textos de js/datos.js al inglés y al portugués.

tools/i18n/datos_es.json es la lista de textos en español (node tools/i18n/extraer_datos.js
tools/i18n/datos_es.json la vuelve a sacar de js/datos.js); datos_en.json y datos_pt.json traen
las traducciones en el mismo orden. Si se agrega o cambia un texto en datos.js, se vuelve a
extraer la lista y se agrega su traducción en la misma posición; los textos sin traducción se
muestran en español.
Uso: python tools/i18n_datos.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIR = RAIZ / 'tools' / 'i18n'


def main():
    es = json.loads((DIR / 'datos_es.json').read_text(encoding='utf-8'))
    salida = {}
    for idioma in ('en', 'pt'):
        tr = json.loads((DIR / f'datos_{idioma}.json').read_text(encoding='utf-8'))
        if len(tr) != len(es):
            raise SystemExit(f'datos_{idioma}.json tiene {len(tr)} textos y datos_es.json {len(es)}')
        salida[idioma] = {a: b for a, b in zip(es, tr) if b and b != a}
    js = ('/* Generado por tools/i18n_datos.py a partir de tools/i18n/. No editar a mano. */\n'
          'const I18N_DATOS = ' + json.dumps(salida, ensure_ascii=False, indent=1) + ';\n')
    (RAIZ / 'js' / 'i18n-datos.js').write_text(js, encoding='utf-8')
    print('js/i18n-datos.js:', {k: len(v) for k, v in salida.items()}, 'textos')


if __name__ == '__main__':
    main()
