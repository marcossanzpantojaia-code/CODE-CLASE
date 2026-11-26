#!/usr/bin/env python3
"""Inspecciona y prepara recursos de imagen (p. ej., generados con IA) para una escena 2,5D por scroll (lote 27, REC-003).

Uso:
  python3 preparar_recursos.py inspeccionar <imagen> [--json salida.json]
  python3 preparar_recursos.py preparar <contrato.json> <carpeta_entrada> <carpeta_salida>

Sin dependencias nuevas: Pillow (WebP y AVIF), NumPy, SciPy y OpenCV ya instalados.

INSPECCIONAR mide lo que se puede medir automáticamente. Las decisiones creativas y C1/C3 las revisa una persona con la hoja.
  - Tamaño y canal alfa.
  - Si no hay alfa: color y uniformidad del fondo (¿se puede recortar con una llave por diferencia?).
  - Caja del objeto, márgenes y área cubierta.
  - Borde: halo claro u oscuro y contaminación del color del fondo en la franja 0 < alfa < 1.
  - Dirección de la luz: vector desde el centroide del objeto al centroide del 5 % de píxeles más luminosos.
  - Perspectiva de un objeto circular (plato): elipse ajustada al contorno → b/a → elevación de cámara ≈ asin(b/a).
  - Color: media L*a*b* y zonas altas de luminancia y saturación (percentil 99,9, Xue et al. 2012).
  - Memoria decodificada: ancho × alto × 4 bytes.

PREPARAR, por cada recurso del contrato:
  - recorte por llave de diferencia si no hay alfa (solo fondos lisos);
  - DESCONTAMINACIÓN del borde: el RGB de los píxeles semitransparentes se sustituye por el del píxel opaco más cercano
    (elimina el halo del fondo original);
  - capa DELANTERA de oclusión (media luna inferior del plato a partir de la elipse ajustada);
  - SOMBRA de contacto horneada como RGBA normal (sin mix-blend-mode, que fue el cuello de botella medido en el lote 27);
  - sombras y desenfoque por plano horneados en los ingredientes (sin filtros CSS);
  - exportación a WebP y AVIF en los anchos pedidos, con manifest.json, informe.json y hoja_inspeccion.png.
"""
import sys, json, os, math, argparse
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage
import cv2

def cargar(p):
    im = Image.open(p); im.load()
    return im.convert('RGBA') if im.mode != 'RGBA' else im

def fondo_de_bordes(rgb):
    b = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3), rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)]).astype(np.float32)
    return b.mean(0), b.std(0).mean()

def llave_diferencia(im, umbral_bajo=18, umbral_alto=60):
    """Alfa por distancia al color del fondo liso (rampa suave entre dos umbrales). Solo válido con fondos uniformes."""
    rgb = np.asarray(im.convert('RGB')).astype(np.float32); bg, _ = fondo_de_bordes(rgb)
    d = np.sqrt(((rgb - bg) ** 2).sum(2)); a = np.clip((d - umbral_bajo) / (umbral_alto - umbral_bajo), 0, 1)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    lab, n = ndimage.label(a > .5)                                   # conserva solo el componente mayor (el objeto)
    if n > 1: mayor = 1 + np.argmax(ndimage.sum(np.ones_like(a), lab, range(1, n + 1))); a = a * ndimage.binary_dilation(lab == mayor, iterations=3)
    return Image.fromarray(np.dstack([rgb.astype(np.uint8), (a * 255).astype(np.uint8)]), 'RGBA')

def descontaminar(im):
    """RGB de la franja semitransparente ← RGB del píxel casi opaco más cercano (elimina el color del fondo original)."""
    arr = np.asarray(im).copy(); a = arr[..., 3]; opaco = a >= 242
    if opaco.sum() == 0: return im, 0
    idx = ndimage.distance_transform_edt(~opaco, return_distances=False, return_indices=True)
    franja = (a > 0) & ~opaco
    for c in range(3): arr[..., c][franja] = arr[..., c][idx[0][franja], idx[1][franja]]
    arr[..., :3][a == 0] = 0
    return Image.fromarray(arr, 'RGBA'), int(franja.sum())

def medir_borde(arr):
    """Halo: luminancia de la franja 0,1 < alfa < 0,9 frente al interior inmediato (a ≥ 0,95 a ≤ 4 px)."""
    a = arr[..., 3].astype(np.float32) / 255; L = (0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]).astype(np.float32)
    franja = (a > .1) & (a < .9); interior = (a >= .95) & ndimage.binary_dilation(franja, iterations=4)
    if franja.sum() < 20 or interior.sum() < 20: return {'franja_px': int(franja.sum())}
    dif = float(L[franja].mean() - L[interior].mean())
    return {'franja_px': int(franja.sum()), 'luminancia_franja_menos_interior': round(dif, 1),
            'veredicto': 'halo OSCURO' if dif < -25 else 'halo CLARO' if dif > 25 else 'sin halo apreciable'}

def elipse(alpha):
    m = (alpha > 127).astype(np.uint8); cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs: return None
    c = max(cs, key=cv2.contourArea)
    if len(c) < 5: return None
    (cx, cy), (w, h), ang = cv2.fitEllipse(c); a_, b_ = max(w, h) / 2, min(w, h) / 2
    return {'cx': round(cx, 1), 'cy': round(cy, 1), 'semieje_mayor': round(a_, 1), 'semieje_menor': round(b_, 1), 'angulo': round(ang, 1),
            'b_sobre_a': round(b_ / a_, 3), 'elevacion_camara_grados': round(math.degrees(math.asin(min(1, b_ / a_))), 1)}

def luz(arr):
    a = arr[..., 3] > 200; L = (0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]).astype(np.float32)
    if a.sum() < 100: return None
    ys, xs = np.nonzero(a); cy, cx = ys.mean(), xs.mean(); t = np.percentile(L[a], 95); yb, xb = np.nonzero(a & (L >= t))
    vx, vy = xb.mean() - cx, yb.mean() - cy; n = math.hypot(vx, vy) or 1
    ang = math.degrees(math.atan2(-vy, vx))                         # 0° = derecha, 90° = arriba (convención de pantalla)
    return {'vector': [round(vx / n, 2), round(vy / n, 2)], 'angulo_grados': round(ang, 1),
            'lado': ('arriba' if vy < -0.3 * n else 'abajo' if vy > 0.3 * n else '') + ('-izquierda' if vx < -0.3 * n else '-derecha' if vx > 0.3 * n else '')}

def color(arr):
    a = arr[..., 3] > 200
    if a.sum() < 100: return None
    lab = cv2.cvtColor(arr[..., :3], cv2.COLOR_RGB2LAB).astype(np.float32); hsv = cv2.cvtColor(arr[..., :3], cv2.COLOR_RGB2HSV).astype(np.float32)
    L = lab[..., 0][a] * 100 / 255; S = hsv[..., 1][a] / 255
    return {'L_media': round(float(L.mean()), 1), 'a_media': round(float(lab[..., 1][a].mean() - 128), 1), 'b_media': round(float(lab[..., 2][a].mean() - 128), 1),
            'L_zona_alta_p99_9': round(float(np.percentile(L, 99.9)), 1), 'saturacion_zona_alta_p99_9': round(float(np.percentile(S, 99.9)), 3)}

def inspeccionar(ruta):
    im = Image.open(ruta); im.load(); w, h = im.size; tiene_alfa = im.mode in ('RGBA', 'LA', 'PA') or 'transparency' in im.info
    rgba = im.convert('RGBA'); arr = np.asarray(rgba); R = {'archivo': os.path.basename(ruta), 'ancho': w, 'alto': h, 'modo': im.mode, 'tiene_alfa': bool(tiene_alfa),
        'memoria_decodificada_MB': round(w * h * 4 / 2 ** 20, 1), 'peso_KB': round(os.path.getsize(ruta) / 1024, 1)}
    if tiene_alfa and (arr[..., 3] < 250).mean() > .01:
        R['alfa_util'] = True
    else:
        bg, std = fondo_de_bordes(arr[..., :3].astype(np.float32)); R['alfa_util'] = False
        R['fondo'] = {'color_medio': [int(x) for x in bg], 'desviacion': round(float(std), 1), 'apto_para_llave': bool(std < 6)}
        arr = np.asarray(llave_diferencia(rgba)); R['nota'] = 'medidas sobre un recorte provisional por llave de diferencia'
    a = arr[..., 3] > 127
    if a.any():
        ys, xs = np.nonzero(a); R['caja'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
        R['margenes_px'] = {'izq': int(xs.min()), 'der': int(w - 1 - xs.max()), 'arr': int(ys.min()), 'aba': int(h - 1 - ys.max())}
        R['objeto_toca_el_borde'] = bool(min(R['margenes_px'].values()) <= 2)
        R['area_objeto_pct'] = round(100 * float(a.mean()), 1)
    R['borde'] = medir_borde(arr); R['luz'] = luz(arr); R['color'] = color(arr); R['elipse'] = elipse(arr[..., 3])
    return R

def sombra_contacto(alpha, caja, cfg):
    """Sombra horneada RGBA (marrón cálido + alfa) del tamaño del recurso: penumbra amplia + oclusión estrecha en la base."""
    h, w = alpha.shape; x0, y0, x1, y1 = (float(v) for v in caja); bw = x1 - x0; base = y1 - cfg.get('subir_px', .02 * (y1 - y0))
    capa = Image.new('L', (w, h), 0); g = ImageDraw.Draw(capa)
    g.ellipse([x0 + .06 * bw, base - .07 * (y1 - y0), x1 - .06 * bw, base + .07 * (y1 - y0)], fill=int(255 * cfg.get('penumbra', .45)))
    pen = capa.filter(ImageFilter.GaussianBlur(cfg.get('blur_penumbra', .035 * bw)))
    capa2 = Image.new('L', (w, h), 0); ImageDraw.Draw(capa2).ellipse([x0 + .14 * bw, base - .025 * (y1 - y0), x1 - .14 * bw, base + .03 * (y1 - y0)], fill=int(255 * cfg.get('oclusion', .6)))
    occ = capa2.filter(ImageFilter.GaussianBlur(cfg.get('blur_oclusion', .01 * bw)))
    A = np.maximum(np.asarray(pen), np.asarray(occ)); col = cfg.get('color', [40, 22, 12])
    return Image.fromarray(np.dstack([np.full((h, w, 3), col, np.uint8), A.astype(np.uint8)]), 'RGBA')

def mascara_delantera(alpha, el, frac):
    """Media luna delantera del plato: dentro del objeto, por debajo del centro y fuera de la elipse interior (frac del tamaño)."""
    h, w = alpha.shape; yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = math.radians(el['angulo']); a_, b_ = el['semieje_mayor'], el['semieje_menor']
    # cv2.fitEllipse: el ángulo es el del primer eje; se proyecta con el eje mayor horizontal (platos casi horizontales)
    dx, dy = xx - el['cx'], yy - el['cy']; u = dx; v = dy
    dentro_interior = (u / (a_ * frac)) ** 2 + (v / (b_ * frac)) ** 2 <= 1
    m = (alpha > 0) & (yy > el['cy']) & ~dentro_interior
    m = ndimage.binary_opening(m, iterations=2)
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)

def hornear_ingrediente(im, plano, cfg):
    """Sombra proyectada (luz arriba-izquierda → sombra abajo-derecha) y desenfoque por plano, horneados en un lienzo con margen."""
    off = cfg['planos'][plano]; pad = int(max(im.size) * .35); W, H = im.width + 2 * pad, im.height + 2 * pad
    base = Image.new('RGBA', (W, H), (0, 0, 0, 0)); a = im.getchannel('A')
    sh = Image.new('RGBA', (W, H), tuple(cfg.get('color_sombra', [40, 20, 10])) + (0,)); sa = Image.new('L', (W, H), 0)
    sa.paste(a.point(lambda v: int(v * off['opacidad_sombra'])), (pad + int(off['dx'] * im.width), pad + int(off['dy'] * im.height)))
    sh.putalpha(sa.filter(ImageFilter.GaussianBlur(off['blur_sombra'] * im.width))); base.alpha_composite(sh); base.alpha_composite(im, (pad, pad))
    if off.get('desenfoque', 0) > 0:                                  # desenfoque de profundidad en PREMULTIPLICADO (sin halo oscuro)
        base = base.convert('RGBa').filter(ImageFilter.GaussianBlur(off['desenfoque'] * im.width)).convert('RGBA')
    return base

def exportar(im, nombre, anchos, salida, calidad):
    out = {}
    anchos = sorted({wd for wd in anchos if wd <= im.width} or {im.width}, reverse=True)   # nunca se amplía; si todos superan el original, se exporta a su ancho
    for wd in anchos:
        r = im if wd == im.width else im.convert('RGBa').resize((wd, round(im.height * wd / im.width)), Image.LANCZOS).convert('RGBA')
        for fmt, kw in (('webp', dict(quality=calidad['webp'], method=6, exact=False)), ('avif', dict(quality=calidad['avif']))):
            p = os.path.join(salida, f'{nombre}-{wd}.{fmt}'); r.save(p, **kw); out.setdefault(fmt, []).append({'archivo': os.path.basename(p), 'ancho': wd, 'alto': r.height, 'KB': round(os.path.getsize(p) / 1024, 1)})
    return out

def preparar(contrato, entrada, salida):
    C = json.load(open(contrato)); os.makedirs(salida, exist_ok=True); M = {'version_contrato': C.get('version'), 'recursos': {}}; INF = {'recursos': {}, 'avisos': []}
    for r in C['recursos']:
        ruta = os.path.join(entrada, r['archivo'])
        if not os.path.exists(ruta):
            (INF['avisos'].append(f"FALTA {r['id']} ({r['archivo']})") if r.get('imprescindible') else None); continue
        ins = inspeccionar(ruta); INF['recursos'][r['id']] = ins; im = cargar(ruta)
        if not ins['alfa_util']:
            if ins['fondo']['apto_para_llave']: im = llave_diferencia(im); INF['avisos'].append(f"{r['id']}: recortado con llave de diferencia (revisar el borde)")
            elif r.get('necesita_alfa', True): INF['avisos'].append(f"{r['id']}: sin alfa y fondo no uniforme → recortar fuera (generador o editor) y volver a entregar"); continue
        im, n = descontaminar(im); ins['borde_tras_descontaminar'] = medir_borde(np.asarray(im))
        arr = np.asarray(im); ys, xs = np.nonzero(arr[..., 3] > 8); m = r.get('margen_px', 24)
        caja = [max(0, xs.min() - m), max(0, ys.min() - m), min(im.width, xs.max() + m), min(im.height, ys.max() + m)]
        if r.get('recortar', True): im = im.crop(caja)
        for chk, val in (r.get('comprobar') or {}).items():
            if chk == 'luz_lado' and ins['luz'] and val not in ins['luz']['lado']: INF['avisos'].append(f"{r['id']}: luz desde '{ins['luz']['lado']}', el contrato pide '{val}'")
            if chk == 'elevacion' and ins['elipse']:
                e = ins['elipse']['elevacion_camara_grados']
                if not (val[0] <= e <= val[1]): INF['avisos'].append(f"{r['id']}: elevación de cámara estimada {e}°, el contrato pide {val[0]}–{val[1]}°")
            if chk == 'ancho_min' and ins['ancho'] < val: INF['avisos'].append(f"{r['id']}: {ins['ancho']} px de ancho < {val} px exigidos")
        piezas = {r['id']: im}
        if r.get('rol') == 'producto':
            alpha = np.asarray(im.getchannel('A')); el = elipse(alpha); ys, xs = np.nonzero(alpha > 127)
            if el:
                md = mascara_delantera(alpha, el, r.get('fraccion_elipse_interior', .80))
                delt = np.asarray(im).copy(); delt[..., 3] = (delt[..., 3].astype(np.float32) * md).astype(np.uint8); piezas[r['id'] + '_delantero'] = Image.fromarray(delt, 'RGBA')
            piezas[r['id'] + '_sombra'] = sombra_contacto(alpha, [xs.min(), ys.min(), xs.max(), ys.max()], r.get('sombra', {}))
        if r.get('rol') == 'ingrediente':
            for pl in r.get('planos', [1]): piezas[f"{r['id']}_p{pl}"] = hornear_ingrediente(im, str(pl), C['ingredientes'])
        for nombre, pz in piezas.items():
            M['recursos'][nombre] = {'proporcion': round(pz.height / pz.width, 4), 'variantes': exportar(pz, nombre, r.get('anchos', [1640, 1080, 820]), salida, C.get('calidad', {'webp': 86, 'avif': 62}))}
            if nombre == r['id'] and r.get('meta'): M['recursos'][nombre]['meta'] = r['meta']      # p. ej. posición del nido (fracciones de la imagen recortada)
    mem = sum(max(v['ancho'] * v['alto'] for v in x['variantes'].get('webp', [{'ancho': 0, 'alto': 0}])) * 4 for x in M['recursos'].values())
    INF['memoria_decodificada_max_MB'] = round(mem / 2 ** 20, 1)
    json.dump(M, open(os.path.join(salida, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(INF, open(os.path.join(salida, 'informe.json'), 'w'), indent=1, ensure_ascii=False)
    hoja(salida, M); print(json.dumps({'avisos': INF['avisos'], 'piezas': list(M['recursos']), 'memoria_MB': INF['memoria_decodificada_max_MB']}, ensure_ascii=False))

def hoja(salida, M):
    """Hoja de inspección: cada pieza sobre fondo claro, oscuro y damero (para ver halos), a 360 px."""
    filas = []
    for n, x in M['recursos'].items():
        v = x['variantes'].get('webp');
        if not v: continue
        im = Image.open(os.path.join(salida, v[-1]['archivo'])).convert('RGBA'); s = 300 / max(im.size); im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))))
        celdas = []
        for fondo in ('#efe6d6', '#1a120c', 'damero'):
            c = Image.new('RGBA', (320, 320), fondo if fondo != 'damero' else '#ffffff')
            if fondo == 'damero':
                g = ImageDraw.Draw(c); [g.rectangle([i, j, i + 15, j + 15], fill='#cccccc') for i in range(0, 320, 16) for j in range(0, 320, 16) if (i + j) // 16 % 2]
            c.alpha_composite(im, ((320 - im.width) // 2, (320 - im.height) // 2)); celdas.append(c)
        f = Image.new('RGBA', (980, 344), 'white'); ImageDraw.Draw(f).text((6, 2), n, fill='black'); [f.paste(c, (6 + i * 326, 20)) for i, c in enumerate(celdas)]; filas.append(f)
    if filas:
        H = Image.new('RGB', (980, 344 * len(filas)), 'white'); [H.paste(f, (0, i * 344)) for i, f in enumerate(filas)]; H.save(os.path.join(salida, 'hoja_inspeccion.png'))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    a = sp.add_parser('inspeccionar'); a.add_argument('imagen'); a.add_argument('--json')
    b = sp.add_parser('preparar'); b.add_argument('contrato'); b.add_argument('entrada'); b.add_argument('salida')
    x = ap.parse_args()
    if x.cmd == 'inspeccionar':
        R = inspeccionar(x.imagen); print(json.dumps(R, ensure_ascii=False, indent=1))
        if x.json: json.dump(R, open(x.json, 'w'), indent=1, ensure_ascii=False)
    else: preparar(x.contrato, x.entrada, x.salida)
