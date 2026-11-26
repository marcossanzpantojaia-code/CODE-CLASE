# python3 auditar31.py <carpeta_fotogramas_con_serie.json> <salida.json> [formato=l31|l30orig]
import json,sys,numpy as np
from PIL import Image
D,OUT=sys.argv[1],sys.argv[2]; fmt=sys.argv[3] if len(sys.argv)>3 else 'l31'
raw=json.load(open(f'{D}/serie.json' if fmt!='l30orig' else f'{D}/../serie.json')); fps=30
if fmt=='l30orig':
    s=raw['cine']['serie']; X=[p['heroe']['x'] for p in s]; Y=[p['heroe']['y'] for p in s]; W=[p['heroe']['w'] for p in s]; OP=[p['heroe']['op'] for p in s]
    PX=[p['plato']['x'] for p in s]; PY=[p['plato']['y'] for p in s]; BL=[0]*len(s)
else:
    s=raw['serie']; X=[p['x'] for p in s]; Y=[p['y'] for p in s]; W=[p['anchoNido'] for p in s]; OP=[p['op'] for p in s]
    PX=[p['nidoPlato']['x'] for p in s]; PY=[p['nidoPlato']['y'] for p in s]; BL=[p.get('blur_px',0) for p in s]
X,Y,W,OP,PX,PY=map(np.array,(X,Y,W,OP,PX,PY)); n=len(X)
vx,vy=np.diff(X)*fps,np.diff(Y)*fps; sp=np.hypot(vx,vy); ang=np.degrees(np.arctan2(vy,vx))
vis=OP[1:]>0.02
dang=[abs((ang[i]-ang[i-1]+180)%360-180) for i in range(1,len(ang)) if sp[i]>60 and sp[i-1]>60 and vis[i]]
acc=np.diff(sp)*fps; jerk=np.diff(acc)*fps
dw=np.abs(np.diff(W))/W[:-1]*100
# fotogramas con doble imagen: héroe visible y semitransparente, y separado del nido del plato
sep=np.hypot(X-PX,Y-PY); semi=(OP>0.05)&(OP<0.95); dobles=[int(i) for i in np.nonzero(semi&(sep>2))[0]]
# salto visible en el relevo: último fotograma con héroe opaco ≥0.5 → primer fotograma con op<0.5
sw=int(np.argmax(OP<0.5)); salto_pos=float(np.hypot(X[sw]-X[sw-1],Y[sw]-Y[sw-1])); salto_ancho=float(abs(W[sw]-W[sw-1])/W[sw-1]*100)
# en el relevo, distancia entre el ÚLTIMO héroe visible y el nido del plato visible en el fotograma siguiente
salto_visible=float(np.hypot(X[sw-1]-PX[sw],Y[sw-1]-PY[sw]))
dif=[];prev=None;roi=[]
for i in range(n):
    im=np.asarray(Image.open(f'{D}/f{i:04d}.png').convert('L'),dtype=np.float32)
    if prev is not None:
        d=np.abs(im-prev); dif.append(float(d.mean()))
        cx,cy=int(X[i]),int(Y[i]); r=180; y0,y1=max(0,cy-r),min(720,cy+r); x0,x1=max(0,cx-r),min(1280,cx+r); roi.append(float(d[y0:y1,x0:x1].mean()))
    prev=im
dif=np.array(dif); roi=np.array(roi); mov=dif[dif>0.05]; med=float(np.median(mov)) if len(mov) else 0
pico=int(np.argmax(dif)); vispk=int(np.argmax(np.where(vis,sp,0)))
res={'fotogramas':n,'relevo_fotograma':sw,'pico_velocidad_fotograma':vispk+1,'velocidad_max_px_s':round(float(sp[vis].max())),'espaciado_max_px':round(float(sp[vis].max()/fps),1),
 'velocidad_antes_relevo_px_s':round(float(sp[sw-2])),'cambio_direccion_max_grados':round(max(dang),1) if dang else 0,
 'aceleracion_max_px_s2':round(float(np.abs(acc[vis[1:]]).max())),'jerk_p95':round(float(np.percentile(np.abs(jerk),95))),
 'cambio_escala_max_pct_fotograma':round(float(dw[vis].max()),2),
 'fotogramas_doble_imagen':len(dobles),'salto_visible_en_relevo_px':round(salto_visible,1),'salto_ancho_relevo_pct':round(salto_ancho,1),
 'separacion_nidos_durante_fundido_max_px':round(float(sep[semi].max()),2) if semi.any() else None,
 'diferencia_pixeles':{'mediana_en_movimiento':round(med,2),'max':round(float(dif.max()),2),'fotograma_max':pico+1,'ratio_max_mediana':round(float(dif.max())/med,1) if med else None,'en_relevo':round(float(dif[sw-1]),2)},
 'blur_px_max':round(float(max(BL)),1),
 'series':{'velocidad':[round(float(a)) for a in sp],'espaciado':[round(float(a)/fps,1) for a in sp],'direccion':[round(float(a)) for a in ang],'opacidad':[round(float(a),3) for a in OP],'dif':[round(float(a),2) for a in dif],'roi':[round(float(a),2) for a in roi],'blur':BL,'x':[round(float(a),1) for a in X],'y':[round(float(a),1) for a in Y]}}
json.dump(res,open(OUT,'w'),indent=1); print(json.dumps({k:v for k,v in res.items() if k!='series'},ensure_ascii=False))
