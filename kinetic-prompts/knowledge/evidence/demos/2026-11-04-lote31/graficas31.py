import json,sys,matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
a=json.load(open('audit/A_l30_original.json')); b=json.load(open('audit/B_l31.json'))
fig,ax=plt.subplots(2,2,figsize=(13,7.5),dpi=110)
for d,lab,c in [(a,'A · lote 30',"#b3261e"),(b,'B · lote 31','#1f5f8b')]:
    s=d['series']; t=[(i+1)/30 for i in range(len(s['espaciado']))]
    ax[0,0].plot(t,s['espaciado'],label=lab,color=c); ax[0,0].axvline(d['relevo_fotograma']/30,color=c,ls='--',lw=.8)
    ax[0,1].plot(t,s['dif'],label=lab,color=c)
    ax[1,0].plot(s['x'],s['y'],'.-',ms=3,label=lab,color=c)
    ax[1,1].plot([i/30 for i in range(len(s['opacidad']))],s['opacidad'],label=lab+' opacidad',color=c); ax[1,1].plot([i/30 for i in range(len(s['blur']))],[v/20 for v in s['blur']],':',color=c,label=lab+' blur px/20')
ax[0,0].set_title('Espaciado del nido del héroe (px por fotograma) · línea discontinua = relevo'); ax[0,0].set_xlabel('s')
ax[0,1].set_title('Diferencia media de píxeles entre fotogramas (0–255)'); ax[0,1].set_xlabel('s')
ax[1,0].set_title('Trayectoria del nido (px de pantalla)'); ax[1,0].invert_yaxis(); ax[1,0].set_aspect('equal')
ax[1,1].set_title('Opacidad del héroe y longitud del motion blur'); ax[1,1].set_xlabel('s')
for x in ax.flat: x.legend(fontsize=8); x.grid(alpha=.3)
fig.suptitle('ROSSO aterrizaje · A (lote 30) frente a B (lote 31) · mismos fixtures, 1280×720, 2,5 s, 30 fps — solo movimiento (C2)'); fig.tight_layout(); fig.savefig('ev/curvas_AB.png')
