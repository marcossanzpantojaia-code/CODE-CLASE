"""Detecta cambios bruscos ("cortes") y saltos en un vídeo de recorrido (lote 25).
Uso: python cortes_video.py <video.webm> [--umbral 0.30] [--json salida.json]
Para cada par de fotogramas consecutivos calcula la fracción de píxeles que cambian más de 30 niveles (de 255).
Un pico aislado por encima del umbral, con fotogramas tranquilos alrededor, indica un CORTE (cambio de escena sin puente).
Los cambios grandes pero repartidos en varios fotogramas son transiciones. Umbral provisional (EVAL-001)."""
import sys, json, argparse, cv2, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--umbral", type=float, default=0.30); ap.add_argument("--json")
a = ap.parse_args(); cap = cv2.VideoCapture(a.video); fps = cap.get(cv2.CAP_PROP_FPS) or 25
prev, serie, i = None, [], 0
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (320, int(320 * f.shape[0] / f.shape[1]))), cv2.COLOR_BGR2GRAY).astype(np.int16)
    if prev is not None: serie.append(float((np.abs(g - prev) > 30).mean()))
    prev, i = g, i + 1
s = np.array(serie); picos = []
for k, v in enumerate(s):
    vecinos = np.concatenate([s[max(0, k - 3):k], s[k + 1:k + 4]])
    if v > a.umbral and (vecinos.size == 0 or vecinos.max() < v * 0.35): picos.append({"fotograma": k + 1, "t_s": round((k + 1) / fps, 2), "cambio": round(v, 3)})
R = {"video": a.video, "fotogramas": int(i), "fps": fps, "cambio_max": round(float(s.max()) if s.size else 0, 3),
     "cambio_p95": round(float(np.percentile(s, 95)) if s.size else 0, 3), "cortes": picos}
print(json.dumps({k: v for k, v in R.items() if k != "video"}))
if a.json: json.dump({**R, "serie": [round(x, 4) for x in serie]}, open(a.json, "w"))
