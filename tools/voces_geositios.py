"""Sintetiza con edge-tts (mismas voces que la app de Carlos Venegas) los guiones de
tools/_voces/guiones.json en assets/audio/<idioma>/gN.mp3.  Uso: node tools/voces_geositios.mjs && python tools/voces_geositios.py"""
import asyncio, json, re
from pathlib import Path
import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
VOZ = {'es': 'es-CL-CatalinaNeural', 'en': 'en-US-AvaMultilingualNeural', 'pt': 'pt-BR-FranciscaNeural'}
ARREGLOS = {'es': [(r'\b([Gg])eositio', r'\1eo sitio'), (r'\bAv\.', 'Avenida')],
            'en': [(r'\bAv\.', 'Avenida')], 'pt': [(r'\bAv\.', 'Avenida')]}


async def main():
    guiones = json.loads((RAIZ / 'tools' / '_voces' / 'guiones.json').read_text(encoding='utf-8'))
    for clave, texto in guiones.items():
        lang = clave.split('/')[0]
        for a, b in ARREGLOS[lang]:
            texto = re.sub(a, b, texto)
        destino = RAIZ / 'assets' / 'audio' / (clave + '.mp3')
        destino.parent.mkdir(parents=True, exist_ok=True)
        await edge_tts.Communicate(texto, VOZ[lang], rate='-5%').save(str(destino))
        print(clave, destino.stat().st_size)

asyncio.run(main())
