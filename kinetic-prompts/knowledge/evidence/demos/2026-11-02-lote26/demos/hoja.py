import sys
from PIL import Image, ImageDraw
# hoja de estados GSAP: filas = recetas, columnas = p
def hoja(ancho, out, pref='gsap'):
    rows = []
    for r in 'ABC':
        ims = [Image.open(f'ev26/{r}/{ancho}/{pref}_{i}.png').convert('RGB') for i in range(5)]
        th = 260 if ancho == '1440' else 400; tw = int(th * ims[0].width / ims[0].height)
        rows.append([im.resize((tw, th)) for im in ims])
    tw, th = rows[0][0].size; img = Image.new('RGB', (5 * (tw + 6) + 6, 3 * (th + 24) + 6), 'white'); g = ImageDraw.Draw(img)
    for j, row in enumerate(rows):
        for i, t in enumerate(row):
            x, y = 6 + i * (tw + 6), 6 + j * (th + 24); img.paste(t, (x, y + 18)); g.text((x, y + 2), f"Receta {'ABC'[j]} · GSAP 3.15.0 · p = {[0, .25, .5, .75, 1][i]}", fill='black')
    img.save(out)
hoja('1440', 'ev26/hoja_estados_gsap_1440.png'); hoja('375', 'ev26/hoja_estados_gsap_375.png')
