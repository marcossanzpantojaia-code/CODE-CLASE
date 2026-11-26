import json,math,sys,numpy as np
from PIL import Image
S=sys.argv[1]; d=json.load(open(f'{S}/serie.json')); out={}
for v in ['base','cine']:
    s=d[v]['serie']; n=len(s); fps=30
    x=np.array([p['heroe']['x'] for p in s]); y=np.array([p['heroe']['y'] for p in s]); w=np.array([p['heroe']['w'] for p in s]); op=np.array([p['heroe']['op'] for p in s])
    py=np.array([p['plato']['y'] for p in s]); cam=np.array([p['cam'] for p in s])
    vx=np.diff(x)*fps; vy=np.diff(y)*fps; sp=np.hypot(vx,vy); ac=np.diff(sp)*fps
    ang=np.degrees(np.arctan2(vy,vx)); dw=np.diff(w)/w[:-1]*100
    # diferencia de píxeles entre fotogramas consecutivos (media absoluta, 0-255), global y por fotograma
    diffs=[]; prev=None
    for i in range(n):
        im=np.asarray(Image.open(f'{S}/{v}/f{i:04d}.png').convert('L'),dtype=np.float32)
        if prev is not None: diffs.append(float(np.abs(im-prev).mean()))
        prev=im
    diffs=np.array(diffs); sw=int(np.argmax(op<0.5))
    med=float(np.median(diffs[diffs>0.05])) if (diffs>0.05).any() else 0
    out[v]={'n':n,'relevo':sw,
     'velocidad_px_s':[round(float(a)) for a in sp],'aceleracion_px_s2':[round(float(a)) for a in ac],
     'direccion_grados':[round(float(a)) for a in ang],'espaciado_px_por_fotograma':[round(float(a/fps),1) for a in sp],
     'cambio_escala_pct_por_fotograma':[round(float(a),2) for a in dw],
     'diferencia_pixeles_por_fotograma':[round(float(a),2) for a in diffs],
     'diferencia_en_relevo':round(float(diffs[sw-1]),2),'mediana_diferencia_en_movimiento':round(med,2),'ratio_relevo_mediana':round(float(diffs[sw-1])/med,1) if med else None,
     'top5_diferencias':[(int(i)+1,round(float(diffs[i]),2)) for i in np.argsort(-diffs)[:5]],
     'espaciado_max_px':round(float(sp.max()/fps),1),'vel_plato_px_s':[round(float(a)) for a in np.diff(py)*fps],
     'antes_relevo':{'vel':round(float(sp[sw-2])),'dir':round(float(ang[sw-2])),'vx':round(float(vx[sw-2])),'vy':round(float(vy[sw-2]))},
     'ancho_nido_en_relevo':[round(float(w[sw-1]),1),round(float(w[sw]),1)]}
json.dump(out,open(sys.argv[2],'w'),indent=1)
for v,o in out.items(): print(v,{k:o[k] for k in ['relevo','diferencia_en_relevo','mediana_diferencia_en_movimiento','ratio_relevo_mediana','top5_diferencias','espaciado_max_px','antes_relevo','ancho_nido_en_relevo']})
print('cine espaciado', out['cine']['espaciado_px_por_fotograma'])
print('cine dir', out['cine']['direccion_grados'])
print('cine acel', out['cine']['aceleracion_px_s2'][:40])
print('cine escala%', out['cine']['cambio_escala_pct_por_fotograma'][15:36])
