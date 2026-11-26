"""Plato procedural con volumen (lote 26) para la Receta C. NO es fotorrealista: sustituye a producto_ok.png (plano)
para probar sombra de contacto, luz coherente (clave arriba-izquierda) y bordes con alfa premultiplicado.
Salida: producto_c.png (900×900 RGBA). Uso: python3 genera_plato.py"""
import numpy as np
from PIL import Image
S = 2; N = 900 * S
y, x = np.mgrid[0:N, 0:N].astype(np.float32) / S
cx, cy, RX, RY = 450, 440, 330, 140
u, v = (x - cx) / RX, (y - cy) / RY; r = np.sqrt(u * u + v * v)       # r = 1 en el borde del plato
L = np.array([-0.55, -0.75]); L /= np.linalg.norm(L)                  # luz clave arriba-izquierda (en el plano de la imagen)
def lamb(nx, ny, amb=.35):                                            # sombreado difuso con normal 2D + componente z
    nz = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1)); return amb + (1 - amb) * np.clip((nx * L[0] + ny * L[1]) * .8 + nz * .45, 0, 1)
img = np.zeros((N, N, 3), np.float32); a = np.zeros((N, N), np.float32)
# 1) plato: ala (0,62 < r < 1) inclinada hacia fuera, fondo (r < 0,62) plano y algo más oscuro
plato = r < 1; base = np.array([.93, .91, .87])
ala = (r >= .62) & plato; t = np.clip((r - .62) / .38, 0, 1)
nx, ny = u / (r + 1e-6) * .55 * np.sin(np.pi * t), v / (r + 1e-6) * .55 * np.sin(np.pi * t) * 2.2
sh = np.where(ala, lamb(np.clip(nx, -.9, .9), np.clip(ny, -.9, .9), .55), .78 + .1 * (1 - r / .62))
img[plato] = (base * sh[..., None])[plato]
spec = ala & (np.abs(t - .45) < .12) & ((u * L[0] + v * L[1]) / (r + 1e-6) > .55)      # reflejo especular en el ala
img[spec] = np.minimum(1, img[spec] + .12 * (1 - np.abs(t[spec] - .45) / .12)[:, None])
borde = plato & (r > .965); img[borde] *= .82                                            # canto con oclusión
a[plato] = 1
# 2) salsa: elipse interior con degradado y brillo
rs = np.sqrt(((x - cx) / 205) ** 2 + ((y - cy + 4) / 84) ** 2); salsa = rs < 1
col = np.array([.70, .17, .09]) * (lamb(-(x - cx) / 205 * .35, -(y - cy) / 84 * .35, .5))[..., None]
img[salsa] = col[salsa] * (1 - .25 * rs[salsa] ** 4)[:, None]
gl = salsa & (((x - cx + 95) / 50) ** 2 + ((y - cy + 38) / 12) ** 2 < 1); img[gl] = np.minimum(1, img[gl] + .25)
# 3) nido de pasta: 26 bucles con sombreado propio, oclusión en la base y brillo
rng = np.random.default_rng(7); ao = np.zeros((N, N), np.float32)
for k in range(26):
    ang = k / 26 * 2 * np.pi + rng.normal(0, .08); R0 = rng.uniform(.55, .95)
    bx, by = cx + np.cos(ang) * 120 * R0, cy + np.sin(ang) * 48 * R0 - 6
    rr = np.sqrt(((x - bx) / rng.uniform(26, 34)) ** 2 + ((y - by) / rng.uniform(12, 16)) ** 2)
    m = rr < 1; nxx, nyy = (x - bx) / 30, (y - by) / 14
    sc = lamb(np.clip(nxx * .8, -.9, .9), np.clip(nyy * .8, -.9, .9), .4)
    pasta = np.array([.95, .78, .45]) * sc[..., None]
    img[m] = pasta[m]; ao = np.maximum(ao, np.where((rr >= 1) & (rr < 1.35), (1.35 - rr) / .35, 0) * (~m))
    hl = m & (((x - bx + 9) / 9) ** 2 + ((y - by + 5) / 3.2) ** 2 < 1); img[hl] = np.minimum(1, img[hl] + .2)
img *= (1 - .35 * ao[..., None] * (salsa | ala)[..., None])
rgba = np.dstack([np.clip(img, 0, 1), a]); im = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
im = im.convert('RGBa').resize((900, 900), Image.LANCZOS).convert('RGBA')                 # reescalado PREMULTIPLICADO
im.save('producto_c.png', optimize=True); print(im.size, im.getchannel('A').getbbox())
