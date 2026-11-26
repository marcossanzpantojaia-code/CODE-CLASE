"""Diferencias de píxeles de una carpeta de validar_gsap.mjs (lote 26).
Uso: python3 diferencias.py <carpeta>   → diferencias.json + mapa_diferencias.png
Sin tolerancia oculta: para cada par se informa del % de píxeles con CUALQUIER diferencia (>0 en algún canal),
del % con diferencia visible (suma RGB > 24, el mismo umbral de antialias de lotes anteriores) y del máximo por canal."""
import sys, json, os, numpy as np
from PIL import Image, ImageDraw
d = sys.argv[1]; ld = lambda f: np.asarray(Image.open(os.path.join(d, f)).convert('RGB')).astype(np.int16)
def comp(a, b):
    A, B = ld(a), ld(b)
    if A.shape != B.shape: return {'error': f'tamaños distintos {A.shape} {B.shape}'}
    D = np.abs(A - B); s = D.sum(2)
    return {'a': a, 'b': b, 'pct_cualquier': round(100 * float((s > 0).mean()), 3), 'pct_visible_suma_gt24': round(100 * float((s > 24).mean()), 3), 'max_canal': int(D.max())}
R = {'nativo_vs_gsap': [], 'nativo_vs_gsap_pin': [], 'reversibilidad': {}, 'resize': [], 'scrub': None}
for i in range(5):
    R['nativo_vs_gsap'].append(comp(f'nativo_{i}.png', f'gsap_{i}.png'))
    R['nativo_vs_gsap_pin'].append(comp(f'nativo_{i}.png', f'gsap_pin_{i}.png'))
for m in ['gsap', 'gsap_pin', 'nativo']:
    R['reversibilidad'][m] = [comp(f'rev_{m}_baja_{q}.png', f'rev_{m}_sube_{q}.png') for q in [0, 0.25, 0.5, 0.75, 1]]
for q in ['0.7', '0.5', '0']: R['resize'].append(comp(f'resize_nativo_limpio_{q}.png', f'resize_gsap_tras_{q}.png'))
R['scrub'] = {'gsap_08_asentado_vs_gsap_true': comp('gsap_2.png', 'scrub08_gsap_asentado.png'), 'nativo_08_asentado_vs_nativo_true': comp('nativo_2.png', 'scrub08_nativo_asentado.png')}
json.dump(R, open(os.path.join(d, 'diferencias.json'), 'w'), indent=1)
# mapa: fila 1 nativo, fila 2 GSAP, fila 3 diferencia amplificada ×4 (en rojo)
th = 288; tiles = []
for i in range(5):
    a, b = Image.open(os.path.join(d, f'nativo_{i}.png')).convert('RGB'), Image.open(os.path.join(d, f'gsap_{i}.png')).convert('RGB')
    D = np.clip(np.abs(np.asarray(a, np.int16) - np.asarray(b, np.int16)).sum(2) * 4, 0, 255).astype(np.uint8)
    m = Image.merge('RGB', [Image.fromarray(D), Image.new('L', a.size, 0), Image.new('L', a.size, 0)])
    tw = int(th * a.width / a.height); tiles.append([x.resize((tw, th)) for x in (a, b, m)])
tw = tiles[0][0].width; img = Image.new('RGB', (tw * 5 + 40, th * 3 + 60), 'white'); g = ImageDraw.Draw(img)
for i, col in enumerate(tiles):
    for j, t in enumerate(col): img.paste(t, (8 + i * (tw + 8), 22 + j * (th + 12)))
    g.text((8 + i * (tw + 8), 4), f"p = {[0, .25, .5, .75, 1][i]}  dif. visible {R['nativo_vs_gsap'][i]['pct_visible_suma_gt24']} %", fill='black')
img.save(os.path.join(d, 'mapa_diferencias.png'))
print(json.dumps({k: (v if k != 'reversibilidad' else {m: [x['pct_cualquier'] for x in xs] for m, xs in v.items()}) for k, v in R.items()}, ensure_ascii=False)[:3000])
