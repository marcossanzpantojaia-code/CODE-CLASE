# Mide por fotograma: (a) movimiento global de la "cámara" del reel en la zona del teclado/mesa,
# (b) desplazamiento vertical del contenido de la pantalla del portátil, (c) diferencia media de la pantalla.
import cv2, numpy as np, json, sys
V=sys.argv[1]; out=sys.argv[2]
cap=cv2.VideoCapture(V); fps=cap.get(cv2.CAP_PROP_FPS)
prev=None; rows=[]; i=0
while True:
    ok,f=cap.read()
    if not ok: break
    g=cv2.cvtColor(f,cv2.COLOR_BGR2GRAY).astype(np.float32)
    if prev is not None:
        kb_a=prev[460:600,10:320]; kb_b=g[460:600,10:320]
        (dx,dy),r=cv2.phaseCorrelate(kb_a*np.hanning(kb_a.shape[1])[None,:]*np.hanning(kb_a.shape[0])[:,None], kb_b*np.hanning(kb_a.shape[1])[None,:]*np.hanning(kb_a.shape[0])[:,None])
        sc_a=prev[230:420,30:310]; sc_b=g[230:420,30:310]
        w=np.hanning(sc_a.shape[1])[None,:]*np.hanning(sc_a.shape[0])[:,None]
        (sx,sy),sr=cv2.phaseCorrelate(sc_a*w, sc_b*w)
        diff=float(np.mean(np.abs(sc_b-sc_a)))
        rows.append(dict(t=round(i/fps,3),cam_dx=round(dx,2),cam_dy=round(dy,2),cam_r=round(r,2),scr_dx=round(sx,2),scr_dy=round(sy,2),scr_r=round(sr,2),scr_diff=round(diff,2)))
    prev=g; i+=1
json.dump(dict(fps=fps,frames=i,rows=rows),open(out,'w'))
print(fps,i)
