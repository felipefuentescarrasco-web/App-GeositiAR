"""Arma cuadros de cámara simulados con el marcador pegado sobre la roca (tools/_prueba_marcador/)."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
SAL = RAIZ / 'tools' / '_prueba_marcador'
W, H = 480, 640


def main():
    SAL.mkdir(exist_ok=True)
    marca = Image.open(RAIZ / 'ar' / 'marcador.png').convert('RGB')
    fondo = Image.open(RAIZ / 'assets' / 'fotos' / 'GST1.jpg').convert('RGB')
    fondo = fondo.resize((W, int(fondo.height * W / fondo.width))).crop((0, 0, W, H)).resize((W, H))
    casos = []
    for nombre, ancho, giro, persp, luz, blur in [
        ('cerca', .7, 0, 0, 1, 0), ('medio', .45, 0, 0, 1, 0), ('lejos', .3, 0, 0, 1, 0),
        ('muy_lejos', .2, 0, 0, 1, 0), ('girado', .45, 25, 0, 1, 0), ('inclinado', .45, 0, .25, 1, 0),
        ('sombra', .45, 0, 0, .45, 0), ('desenfoque', .45, 0, 0, 1, 1.6), ('todo', .3, 10, .2, .6, 1)]:
        lado = int(W * ancho)
        m = marca.resize((lado, lado)).rotate(giro, expand=True, fillcolor=(0, 0, 0))
        if persp:
            a = np.asarray(m); h, w = a.shape[:2]
            import cv2
            src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
            dst = np.float32([[w * persp, 0], [w * (1 - persp), h * .08], [w, h], [0, h * .92]])
            mask = cv2.warpPerspective(np.full((h, w), 255, np.uint8), cv2.getPerspectiveTransform(src, dst), (w, h))
            m = Image.fromarray(cv2.warpPerspective(a, cv2.getPerspectiveTransform(src, dst), (w, h)))
            mask = Image.fromarray(mask)
        else:
            mask = Image.new('L', (lado, lado), 255).rotate(giro, expand=True) if giro else None
        im = fondo.copy()
        im.paste(m, ((W - m.width) // 2, (H - m.height) // 2), mask)
        if luz != 1: im = ImageEnhance.Brightness(im).enhance(luz)
        if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
        im.save(SAL / f'{nombre}.jpg', quality=85)
        casos.append({'img': f'{nombre}.jpg', 'debe': True})
    fondo.save(SAL / 'sin_marcador.jpg', quality=85)
    casos.append({'img': 'sin_marcador.jpg', 'debe': False})
    json.dump(casos, open(SAL / 'casos.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
