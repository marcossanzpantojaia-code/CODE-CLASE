import json,numpy as np,sys
from PIL import Image
D=sys.argv[1]
E=json.load(open(D+'/estados.json')); out=[]
L=lambda p: np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)
for e in E:
    f=e['f']; st=e['st']; ref=np.mean([L(f'{D}/sub_f{f}_{k}.png') for k in range(16)],axis=0)
    Image.fromarray(ref.astype(np.uint8)).save(f'{D}/ref_f{f}.png')
    cx,cy=int(st['x']),int(st['y']); r=150; y0,y1=max(0,cy-r),min(720,cy+r); x0,x1=max(0,cx-r),min(1280,cx+r)
    B=L(f'{D}/blur_f{f}.png')[y0:y1,x0:x1]; S=L(f'{D}/sin_f{f}.png')[y0:y1,x0:x1]; R=ref[y0:y1,x0:x1]
    m=np.abs(S-R).max(axis=2)>3
    out.append({'f':f,'blur_px':st['blur_px'],'muestras':st['muestras'],'error_acumulacion':round(float(np.abs(B-R).mean()),2),'error_sin_blur':round(float(np.abs(S-R).mean()),2),
                'pixeles_afectados_por_movimiento':int(m.sum()),'error_acumulacion_en_bordes':round(float(np.abs(B-R).max(axis=2)[m].mean()),2) if m.any() else None,'error_sin_blur_en_bordes':round(float(np.abs(S-R).max(axis=2)[m].mean()),2) if m.any() else None})
    if f==21:
        im=Image.new('RGB',(3*(x1-x0),y1-y0),'white')
        for k,arr in enumerate([S,B,R]): im.paste(Image.fromarray(arr.astype(np.uint8)),(k*(x1-x0),0))
        im.save(D+'/comparacion_blur_f21.png')
print(json.dumps(out)); json.dump(out,open(D+'/errores_blur.json','w'),indent=1)
