"""Arma el PDF para imprimir con el marcador de RA (ar/hoja-ra.pdf): una página A4 por geositio con RA.

Lo que sigue la cámara es el patrón (ar/marcador.png), igual en todas las hojas. El QR solo abre la RA
del geositio con el escáner de la app; si se pasa una dirección base (python tools/hoja_impresa.py
https://mi-sitio/), el QR lleva la URL completa y también sirve con la cámara normal del teléfono.
"""
import sys
from pathlib import Path
import qrcode
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
DPI = 200
MM = DPI / 25.4
A4 = (int(210 * MM), int(297 * MM))
NOMBRES = {1: 'Caída de bloques de roca volcánica', 2: 'Dique en rocas volcánicas',
           3: 'Vegetación, roca y suelo', 6: 'Contacto de roca volcánica con roca intrusiva'}


def fuente(t, negrita=False):
    try:
        return ImageFont.truetype('DejaVuSans-Bold.ttf' if negrita else 'DejaVuSans.ttf', t)
    except OSError:
        return ImageFont.load_default()


def pagina(n, base, marca):
    im = Image.new('RGB', A4, 'white')
    d = ImageDraw.Draw(im)
    lado = int(190 * MM)
    x0 = (A4[0] - lado) // 2
    y0 = int(12 * MM)
    im.paste(marca.resize((lado, lado), Image.LANCZOS), (x0, y0))
    texto = f'{base}ar.html?g={n}&m=1' if base else f'GEOPARQUEMET-RA-G{n}'
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    q.add_data(texto); q.make()
    tq = int(42 * MM)
    qr = q.make_image(fill_color='#1c2b26', back_color='white').convert('RGB').resize((tq, tq), Image.NEAREST)
    yq = y0 + lado + int(8 * MM)
    im.paste(qr, (x0, yq))
    tx = x0 + tq + int(6 * MM)
    d.text((tx, yq), f'GEOSITIO {n} · Realidad aumentada', fill='#c1622f', font=fuente(int(5.2 * MM), True))
    d.text((tx, yq + int(8 * MM)), NOMBRES.get(n, ''), fill='#1c2b26', font=fuente(int(4 * MM), True))
    lineas = [
        '1. Pega la hoja PLANA sobre la cara de la roca (sin arrugas).',
        '2. Escanea el QR con la cámara del teléfono o con la app (Escanear).',
        '3. Acércate hasta que la hoja ocupe 1/4 de la pantalla.',
        '4. La primera vez: Calibrar, ajustar la capa a la roca y Guardar.',
    ]
    for i, l in enumerate(lineas):
        d.text((tx, yq + int((16 + i * 6) * MM)), l, fill='#333333', font=fuente(int(3.1 * MM)))
    d.text((x0, A4[1] - int(8 * MM)), 'Imprimir al 100 % (sin "ajustar a página"), en papel mate. GeoParquemet · Sernageomin',
           fill='#777777', font=fuente(int(2.8 * MM)))
    return im


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else ''
    if base and not base.endswith('/'): base += '/'
    marca = Image.open(RAIZ / 'ar' / 'marcador.png').convert('RGB')
    paginas = [pagina(n, base, marca) for n in (1, 2, 3, 6)]
    sal = RAIZ / 'ar' / 'hoja-ra.pdf'
    paginas[0].save(sal, save_all=True, append_images=paginas[1:], resolution=DPI)
    print('guardado', sal)


if __name__ == '__main__':
    main()
