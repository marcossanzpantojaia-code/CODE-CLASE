import json,sys,math
d=json.load(open(sys.argv[1])); out={}
for v,r in d.items():
    s=r['serie']; fps=30
    hy=[p['heroe']['y'] for p in s]; hx=[p['heroe']['x'] for p in s]; op=[p['heroe']['op'] for p in s]; py=[p['plato']['y'] for p in s]
    vy=[(hy[i+1]-hy[i])*fps for i in range(len(s)-1)]; vp=[(py[i+1]-py[i])*fps for i in range(len(s)-1)]
    vh=[math.hypot(hx[i+1]-hx[i],hy[i+1]-hy[i])*fps for i in range(len(s)-1)]
    # fotograma del relevo: primer fotograma con opacidad < 0.5
    sw=next(i for i,o in enumerate(op) if o<0.5)
    # fotogramas con DOBLE imagen: héroe semitransparente (0.05<op<0.95) y su nido separado del del plato > 2 px
    dobles=[i for i,p in enumerate(s) if 0.05<p['heroe']['op']<0.95]
    sep=[round(math.hypot(s[i]['heroe']['x']-s[i]['plato']['x'],s[i]['heroe']['y']-s[i]['plato']['y']),1) for i in dobles]
    vis=[i for i in range(len(vh)) if op[i]>0.5]
    pico=max(vis,key=lambda i:vh[i])
    antic=min(vy[:20])
    # en el relevo: posición del nido del héroe frente al del plato
    gap=math.hypot(s[sw]['heroe']['x']-s[sw]['plato']['x'],s[sw]['heroe']['y']-s[sw]['plato']['y'])
    # continuidad: velocidad vertical del héroe en el último fotograma visible y del plato en el primero tras el relevo
    out[v]={'fotogramas':len(s),'relevo_fotograma':sw,'pico_velocidad_heroe_fotograma':pico,'pico_px_s':round(vh[pico]),
      'vel_heroe_antes_relevo_px_s':round(vy[sw-2]),'vel_plato_tras_relevo_px_s':round(vp[sw]),'vel_plato_antes_relevo_px_s':round(vp[sw-2]),
      'anticipacion_vel_min_px_s':round(antic),'fotogramas_doble_imagen':len(dobles),'separacion_nidos_en_doble_px':sep[:8],
      'desajuste_nidos_al_relevo_px':round(gap,1)}
print(json.dumps(out,indent=1,ensure_ascii=False)); json.dump(out,open(sys.argv[2],'w'),indent=1,ensure_ascii=False)
