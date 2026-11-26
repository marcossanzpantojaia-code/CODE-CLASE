"""Métricas de composición de una captura (lote 20). Uso:
  python composicion_captura.py <imagen> [<imagen> ...] [--recorte x,y,w,h] [--json salida.json]
Mide, sin juzgar calidad:
  - paleta dominante (k-means, 5 colores, en Lab) y su cobertura;
  - 'monocromía': dispersión del tono (hue) ponderada por croma (0 = un solo tono);
  - espacio negativo: % de bloques de 16x16 px casi uniformes (desv. típica de luminancia < 4);
  - foco: % del área ocupado por el mayor componente de bloques 'con detalle' (aprox. objeto protagonista);
  - rango de luminancia (p5–p95) como medida de contraste global.
Sirve para el criterio C1 de EVAL-001 (comparar captura frente a fotograma de referencia o storyboard).
"""
import sys, json, argparse
import numpy as np, cv2

def medir(ruta, recorte=None):
    im = cv2.imread(ruta)
    if im is None: raise SystemExit(f"no se pudo leer {ruta}")
    if recorte:
        x, y, w, h = recorte; im = im[y:y+h, x:x+w]
    h0, w0 = im.shape[:2]
    esc = 480 / max(h0, w0); im = cv2.resize(im, (int(w0*esc), int(h0*esc)), interpolation=cv2.INTER_AREA)
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, et, cen = cv2.kmeans(lab, 5, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    cob = np.bincount(et.ravel(), minlength=5) / et.size
    orden = np.argsort(-cob)
    cen_bgr = cv2.cvtColor(cen[orden].reshape(1, 5, 3).astype(np.uint8), cv2.COLOR_LAB2BGR).reshape(5, 3)
    paleta = [{"hex": "#%02x%02x%02x" % (int(c[2]), int(c[1]), int(c[0])), "cobertura": round(float(cob[i]), 3)} for c, i in zip(cen_bgr, orden)]
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).reshape(-1, 3).astype(np.float32)
    ang = hsv[:, 0] * 2 * np.pi / 180; peso = hsv[:, 1] / 255 * (hsv[:, 2] / 255)
    if peso.sum() > 0:
        R = np.hypot((peso*np.cos(ang)).sum(), (peso*np.sin(ang)).sum()) / peso.sum(); disp = round(float(1 - R), 3)
    else: disp = 0.0
    croma_media = round(float(peso.mean()), 3)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    B = 16; hb, wb = g.shape[0] // B, g.shape[1] // B
    bloques = g[:hb*B, :wb*B].reshape(hb, B, wb, B).std(axis=(1, 3))
    uniformes = bloques < 4
    det = (~uniformes).astype(np.uint8)
    n, lab_cc, stats, _ = cv2.connectedComponentsWithStats(det, connectivity=4)
    foco = float(stats[1:, cv2.CC_STAT_AREA].max() / det.size) if n > 1 else 0.0
    p5, p95 = np.percentile(g, [5, 95])
    return {"imagen": ruta, "recorte": recorte, "paleta": paleta, "dispersion_tono": disp, "croma_media": croma_media,
            "espacio_negativo": round(float(uniformes.mean()), 3), "foco_mayor_componente": round(foco, 3),
            "rango_luminancia_p5_p95": [round(float(p5), 1), round(float(p95), 1)]}

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("imagenes", nargs="+"); ap.add_argument("--recorte"); ap.add_argument("--json")
    a = ap.parse_args(); rc = tuple(int(v) for v in a.recorte.split(",")) if a.recorte else None
    res = [medir(p, rc) for p in a.imagenes]
    for r in res:
        print(f"{r['imagen']}: neg={r['espacio_negativo']:.2f} foco={r['foco_mayor_componente']:.2f} disp_tono={r['dispersion_tono']:.2f} croma={r['croma_media']:.2f} lum={r['rango_luminancia_p5_p95']} paleta={[p['hex'] for p in r['paleta']]}")
    if a.json: json.dump(res, open(a.json, "w"), indent=1)
