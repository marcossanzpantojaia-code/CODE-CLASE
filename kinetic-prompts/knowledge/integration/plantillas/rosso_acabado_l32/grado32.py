# Grado común + "match" del protagonista (Marriott rdi0bPWqYyI 0:40–2:53 y 17:10–23:30), horneado en los recursos:
# en la web NO se aplica un filtro por fotograma (coste medido en AIIMG-001); se hornea igual en TODAS las capas.
import sys, json, numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
def curva(x, pts):  # x en 0..1, interpolación monótona por tramos
    xs, ys = zip(*pts); return np.interp(x, xs, ys)
def grado(im):
    a = np.asarray(im).astype(np.float32) / 255; rgb, al = a[..., :3], a[..., 3:]
    r = curva(rgb[..., 0], [(0, 0), (.25, .23), (.75, .80), (1, 1)])        # rojo: +calidez en altas, −en sombras
    g = curva(rgb[..., 1], [(0, 0), (.25, .21), (.75, .76), (1, 1)])        # verde fuera de las sombras
    b = curva(rgb[..., 2], [(0, .05), (.25, .27), (.75, .70), (1, .94)])    # azul: sube en sombras, baja en altas
    out = np.concatenate([np.stack([r, g, b], -1), al], -1)
    return Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8), 'RGBA')
def match(im, sat=-.12, luz=-.10):          # protagonista: −12 % saturación, −10 % luminosidad (valores del vídeo)
    a = np.asarray(im).astype(np.float32) / 255; rgb = a[..., :3]; Y = (rgb @ [.299, .587, .114])[..., None]
    rgb = Y + (rgb - Y) * (1 + sat); rgb = rgb * (1 + luz)
    return Image.fromarray((np.clip(np.concatenate([rgb, a[..., 3:]], -1), 0, 1) * 255 + .5).astype(np.uint8), 'RGBA')
nombres = ['heroe-540', 'producto-709', 'producto_delantero-709', 'producto_sombra-709'] + [f'ing_{n}_p1-128' for n in ['tomate', 'albahaca', 'parmesano', 'guindilla']]
for n in nombres:
    im = Image.open(f'{src}/{n}.webp').convert('RGBA')
    if n.startswith('heroe'): im = match(im)
    g = grado(im); g.save(f'{dst}/{n}.webp', quality=92)
    if n == 'producto-709':                  # foco: versiones desenfocadas PRERENDERIZADAS para el "focus breathing"
        for rad in (3, 6): g.filter(ImageFilter.GaussianBlur(rad)).save(f'{dst}/producto-709-blur{rad}.webp', quality=92)
print('ok', len(nombres))
