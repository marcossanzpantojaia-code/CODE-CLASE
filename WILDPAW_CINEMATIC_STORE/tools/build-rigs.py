# Genera js/data/rigs.js: una malla por pose, recortada a la silueta, con los
# pesos de cada hueso (piel de un esqueleto 2D). Lo usa js/rig.js para deformar
# las fotos (patas, cola, cabeza, orejas) sin generar píxeles nuevos.
#
# Uso, desde la carpeta WILDPAW_CINEMATIC_STORE (necesita numpy, scipy y Pillow):
#   python3 tools/build-rigs.py            -> escribe js/data/rigs.js
#   python3 tools/build-rigs.py <carpeta>  -> además, mapas de pesos para revisar
import base64, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
DEF = json.load(open(P + 'tools/rig-def.json', encoding='utf-8'))
DEBUG = sys.argv[1] if len(sys.argv) > 1 else None
CELLS = 72          # celdas en el lado mayor de la imagen
BAND = 0.18         # fusión entre huesos de una cadena (fracción de hueso)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def chain_coord(px, py, chain, radii):
    """Coordenada a lo largo de la cadena (u) y distancia normalizada al radio (e)."""
    best_e = np.full(px.shape, np.inf)
    best_u = np.zeros(px.shape)
    n = len(chain) - 1
    for j in range(n):
        ax, ay = chain[j]; bx, by = chain[j + 1]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        t_raw = ((px - ax) * dx + (py - ay) * dy) / L2
        lo = -np.inf if j == 0 else 0.0
        hi = np.inf if j == n - 1 else 1.0
        t_u = np.clip(t_raw, lo, hi)                 # u puede salir por los extremos
        t = np.clip(t_raw, 0, 1)
        qx, qy = ax + t * dx, ay + t * dy
        d = np.hypot(px - qx, py - qy)
        r = radii[j] + (radii[j + 1] - radii[j]) * t
        e = d / r
        better = e < best_e
        best_e = np.where(better, e, best_e)
        best_u = np.where(better, j + t_u, best_u)
    return best_u, best_e


def build(name, spec):
    im = Image.open(P + 'assets/img/cast/' + name + '.webp').convert('RGBA')
    W, H = im.size
    alpha = np.asarray(im, dtype=np.float32)[..., 3] / 255.0
    cell = max(W, H) / CELLS
    nx, ny = int(np.ceil(W / cell)), int(np.ceil(H / cell))

    # Celdas con algo de silueta (máximo de alfa) + una celda de margen. Si la
    # pose tiene versión desenfocada, la malla cubre también su halo (si no, el
    # borde borroso se recortaría en escalera)
    cover = alpha
    b2 = P + 'assets/img/cast/' + name + '-b2.webp'
    if os.path.exists(b2) and 'walk' not in name:
        ab = np.asarray(Image.open(b2).convert('RGBA').resize((W, H), Image.BILINEAR), dtype=np.float32)[..., 3] / 255.0
        cover = np.maximum(alpha, ab)
    occ = np.zeros((ny, nx), bool)
    for j in range(ny):
        for i in range(nx):
            blk = cover[int(j * cell):int((j + 1) * cell) + 1, int(i * cell):int((i + 1) * cell) + 1]
            occ[j, i] = blk.size and blk.max() > 0.015
    occ = ndimage.binary_dilation(occ, iterations=1)

    # Vértices: esquinas de las celdas ocupadas
    vid = -np.ones((ny + 1, nx + 1), int)
    verts = []
    for j in range(ny):
        for i in range(nx):
            if not occ[j, i]:
                continue
            for (a, b) in ((j, i), (j, i + 1), (j + 1, i), (j + 1, i + 1)):
                if vid[a, b] < 0:
                    vid[a, b] = len(verts); verts.append((b, a))
    verts = np.array(verts, np.int32)
    vx = np.minimum(verts[:, 0] * cell, W); vy = np.minimum(verts[:, 1] * cell, H)
    nv = len(verts)

    # Huesos: raíz + una cadena por parte
    bones = [{'n': 'root', 'p': [spec['root'][0] * W, spec['root'][1] * H], 'parent': -1}]
    part_bones = {}
    for part in spec['parts']:
        chain = [(x * W, y * H) for x, y in part['chain']]
        parent = 0 if part['parent'] == 'root' else part_bones[part['parent']][-1]
        ids = []
        for k in range(len(chain) - 1):
            ids.append(len(bones))
            bones.append({'n': part['name'] + (str(k) if len(chain) > 2 else ''), 'p': list(chain[k]),
                          'q': list(chain[k + 1]), 'parent': parent if k == 0 else ids[k - 1]})
        part_bones[part['name']] = ids
    nb = len(bones)

    # Pesos: se recorre la jerarquía; cada parte toma sus vértices (los
    # hermanos compiten por distancia) y se funde con lo que ya había.
    Wt = np.zeros((nv, nb)); Wt[:, 0] = 1
    owner = np.full(nv, -1)
    levels = [[p for p in spec['parts'] if p['parent'] == 'root'], [p for p in spec['parts'] if p['parent'] != 'root']]
    for level in levels:
        info = []
        for part in level:
            chain = [(x * W, y * H) for x, y in part['chain']]
            u, e = chain_coord(vx, vy, chain, part['r'])
            info.append((part, chain, u, e))
        if not info:
            continue
        E = np.stack([i[3] for i in info])
        win = np.argmin(E, axis=0)
        # Vistas de frente o de espaldas: las patas se tocan, así que la
        # frontera entre hermanas se reparte (si no, se corta en seco al moverse)
        soft = spec.get('soft', 0)
        if soft:
            S = np.exp(-(E - E.min(axis=0)) / soft); S /= S.sum(axis=0)
        for k, (part, chain, u, e) in enumerate(info):
            n = len(chain) - 1
            m = (1 - smooth(0.85, 1.3, e)) * (S[k] if soft else (win == k))
            a = smooth(0.0, part['attach'], u)
            loc = np.zeros((nv, n))
            taus = [smooth(j - BAND, j + BAND, u) for j in range(1, n)] + [np.zeros(nv)]
            loc[:, 0] = 1 - taus[0] if n > 1 else 1
            for j in range(1, n):
                loc[:, j] = taus[j - 1] - taus[j]
            f = (m * a)[:, None]
            Wt *= (1 - f)
            ids = part_bones[part['name']]
            Wt[:, ids] += f * loc
            owner = np.where(m * a > 0.5, ids[0], owner)

    # El borde de pelo semitransparente se mueve con la parte opaca más cercana
    # (si no, se queda quieto mientras la pata se mueve y se estira en dientes de sierra)
    rad = max(1, int(cell * .45))
    amax = ndimage.maximum_filter(alpha, size=2 * rad + 1)
    cov = amax[np.minimum(vy.astype(int), H - 1), np.minimum(vx.astype(int), W - 1)]
    solid = cov >= 0.55
    gridsolid = np.zeros((ny + 1, nx + 1), bool)
    gridsolid[verts[solid, 1], verts[solid, 0]] = True
    dist, (iy, ix) = ndimage.distance_transform_edt(~gridsolid, return_indices=True)
    for v in np.where(~solid)[0]:
        gx, gy = verts[v]
        if dist[gy, gx] <= 8:
            src = vid[iy[gy, gx], ix[gy, gx]]
            if src >= 0:
                Wt[v] = Wt[src]

    # Triángulos; se quitan los que unen dos partes hermanas a través de un
    # hueco transparente (si no, la piel se estiraría entre dos patas)
    dom = np.argmax(Wt, axis=1)
    top_part = np.zeros(nb, int)
    for pname, ids in part_bones.items():
        for b in ids:
            top_part[b] = ids[0]
    lab = top_part[dom]
    tris, gaps = [], []
    def a_at(x, y):
        return alpha[min(H - 1, int(y)), min(W - 1, int(x))]
    for j in range(ny):
        for i in range(nx):
            if not occ[j, i]:
                continue
            q = [vid[j, i], vid[j, i + 1], vid[j + 1, i + 1], vid[j + 1, i]]
            pair = ((q[0], q[1], q[2]), (q[0], q[2], q[3])) if (i + j) % 2 == 0 else ((q[0], q[1], q[3]), (q[1], q[2], q[3]))
            for t in pair:
                labs = {int(lab[v]) for v in t}
                if len(labs) > 1 and 0 not in labs:
                    cx = vx[list(t)].mean(); cy = vy[list(t)].mean()
                    s = [a_at(cx, cy)] + [a_at((vx[t[k]] + vx[t[(k + 1) % 3]]) / 2, (vy[t[k]] + vy[t[(k + 1) % 3]]) / 2) for k in range(3)]
                    if np.mean(s) < 0.22:
                        gaps.append(t)       # solo se dibujan con la foto desenfocada
                        continue
                tris.append(t)
    # Orden de dibujo: lo que está detrás del cuerpo primero (z = −1), lo de delante al final
    zb = np.zeros(nb)
    for part in spec['parts']:
        for b in part_bones[part['name']]:
            zb[b] = part.get('z', 0)
    tz = [np.median([zb[top_part[dom[v]]] if top_part[dom[v]] else 0 for v in t]) for t in tris]
    tris = [tris[i] for i in np.argsort(np.array(tz), kind='stable')]
    nt_sharp = len(tris)
    tris = np.array(tris + gaps, np.uint16).reshape(-1, 3)

    # Hasta 4 huesos por vértice, cuantizados a 0..255
    order = np.argsort(-Wt, axis=1)[:, :4]
    ww = np.take_along_axis(Wt, order, axis=1)
    ww = ww / np.maximum(ww.sum(1, keepdims=True), 1e-6)
    wq = np.round(ww * 255).astype(np.int32)
    wq[:, 0] += 255 - wq.sum(1)
    b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    out = {
        'w': W, 'h': H, 'cell': round(cell, 4), 'nv': nv, 'nt': nt_sharp, 'ntAll': len(tris),
        'bones': [{k: (round(v, 2) if isinstance(v, float) else ([round(c, 2) for c in v] if isinstance(v, list) else v)) for k, v in b.items()} for b in bones],
        'parts': part_bones,
        'v': b64(verts.astype(np.uint16)), 't': b64(tris), 'bi': b64(order.astype(np.uint8)), 'bw': b64(wq.astype(np.uint8))
    }
    if DEBUG:
        os.makedirs(DEBUG, exist_ok=True)
        rng = np.random.RandomState(3)
        cols = (rng.rand(nb, 3) * 200 + 40).astype(int); cols[0] = (200, 200, 200)
        bg = Image.new('RGBA', (W, H), (255, 255, 255, 255)); bg.alpha_composite(im)
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        for t in tris[:nt_sharp]:
            c = np.zeros(3)
            for v in t:
                c += sum(Wt[v, b] * cols[b] for b in range(nb))
            c = (c / 3).astype(int)
            d.polygon([(vx[v], vy[v]) for v in t], fill=tuple(c) + (120,), outline=(0, 0, 0, 40))
        for b in bones[1:]:
            d.line([tuple(b['p']), tuple(b['q'])], fill=(0, 0, 0, 255), width=4)
            d.ellipse([b['p'][0] - 7, b['p'][1] - 7, b['p'][0] + 7, b['p'][1] + 7], fill=(255, 0, 80, 255))
        bg.alpha_composite(ov)
        bg.convert('RGB').save(os.path.join(DEBUG, 'w_' + name + '.jpg'), quality=85)
    print(f'{name}: {nv} vértices, {nt_sharp} triángulos (+{len(gaps)} de huecos), {nb} huesos, celda {cell:.1f} px')
    return out


rigs = {name: build(name, spec) for name, spec in DEF.items() if not name.startswith('_')}
js = ('/* Generado por tools/build-rigs.py a partir de tools/rig-def.json. No editar a mano.\n'
      '   Malla y pesos de piel de cada pose (base64: Uint16 vértices en celdas, Uint16 triángulos,\n'
      '   Uint8 índices y pesos de 4 huesos por vértice). */\n'
      'window.WILDPAW = window.WILDPAW || {};\nWILDPAW.rigs = ' + json.dumps(rigs, separators=(',', ':')) + ';\n')
open(P + 'js/data/rigs.js', 'w', encoding='utf-8').write(js)
print('js/data/rigs.js', round(len(js) / 1024), 'KB')
