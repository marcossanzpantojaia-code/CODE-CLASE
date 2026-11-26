import json, glob, os
out = {}; md = ["| Receta · viewport | Errores | GSAP | nativo↔GSAP visible % (máx. canal) | nativo↔GSAP pin visible % (máx.) | Reversib. valores / píxeles | Pin top=0 fijo | Scrub 0,8: p a 50/150/300/500/800 ms | Resize: triggers · reconstr. · dif. visible tras resize | Reduced motion (carga · en caliente) | Desmontaje | Cortes en vídeo |", "|" + "---|" * 12]
for d in sorted(glob.glob('ev26/[ABC]/*')):
    R = json.load(open(d + '/resultados.json')); D = json.load(open(d + '/diferencias.json'))
    cortes = sum(len(json.load(open(f))['cortes']) for f in glob.glob(d + '/*_cortes.json'))
    e = sum(len(v) for v in R['errores'].values())
    vis = lambda L: '/'.join(f"{x['pct_visible_suma_gt24']}" for x in L) + f" ({max(x['max_canal'] for x in L)})"
    rv = max(v['diferencia_max_valores'] for v in R['reversibilidad'].values()); rp = max(x['pct_visible_suma_gt24'] for xs in D['reversibilidad'].values() for x in xs)
    pin = all(m['top'] == 0 and m['position'] == 'fixed' and m['spacer'] for m in R['pin']['muestras'])
    sc = '/'.join(str(s['p']) for s in R['scrub']['gsap'][:5])
    rs = R['resize']['serie']; rz = f"{max(s['triggers'] for s in rs)} · {rs[-1]['construcciones']} · {max(x['pct_visible_suma_gt24'] for x in D['resize'])}"
    rm = R['reduced_motion']; rmt = f"rm={rm['gsap']['rm']} ST={rm['gsap']['triggers']} · " + '→'.join(str(f['triggers']) for f in rm['cambio_en_caliente'])
    de = R['destruir']['despues']; des = f"ST={de['triggers']} spacer={de['spacer']} estilos={len(de['estilos_en_linea'])} ticker={de['ticker_sigue']}"
    k = d.replace('ev26/', '').replace('/', ' · ')
    md.append(f"| {k} | {e} | {R['gsap']['motor']['gsap']} | {vis(D['nativo_vs_gsap'])} | {vis(D['nativo_vs_gsap_pin'])} | {rv} / {rp} | {'sí' if pin else 'NO'} | {sc} | {rz} | {rmt} | {des} | {cortes} |")
    out[k] = {'rendimiento': R['rendimiento']}
md2 = ["| Receta · viewport · motor | Duración recorrido s | Script ms (CDP) | Estilo+layout ms | Otros (pintado, composición, GC) ms | actualizar() p50/p95/máx ms | Fotogramas rAF p50/p95/máx ms | > 33 ms |", "|" + "---|" * 8]
for k, v in out.items():
    for m, r in v['rendimiento'].items():
        a, f = r['actualizar_receta_ms'], r['fotogramas']
        md2.append(f"| {k} · {m} | {r['duracion_s']} | {r['script_ms']} | {round(r['estilo_ms'] + r['layout_ms'], 1)} | {r['otros_ms_pintado_composicion_gc']} | {a['p50']}/{a['p95']}/{a['max']} | {f['p50']}/{f['p95']}/{f['max']} | {f['mayores_33ms']} |")
aud = ["| Receta · ancho | Protagonista ancho mín. | Pasos sin protagonista | Pasos sin línea legible (de 21) | Cobertura lienzo mín. | Oclusión texto máx. | Reversibilidad visual máx. % |", "|" + "---|" * 7]
for f in sorted(glob.glob('ev26/aud/*/*/auditoria.json')):
    r = json.load(open(f))['resumen']; k = f.split('/')[2] + ' · ' + f.split('/')[3]
    aud.append(f"| {k} | {r['protagonista_ancho_min']} | {len(r['pasos_sin_protagonista_claro'])} | {len(r['pasos_sin_ninguna_linea_legible'])} ({', '.join(str(round(x, 2)) for x in r['pasos_sin_ninguna_linea_legible'])}) | {r['lienzo_cobertura_min']} | {r.get('oclusion_texto_max')} | {r['reversibilidad_visual_max_pct']} |")
open('ev26/RESULTADOS.md', 'w').write("## Pruebas nativo / GSAP\n\n" + '\n'.join(md) + "\n\n## Rendimiento (recorrido con rueda, bajada y subida)\n\n" + '\n'.join(md2) + "\n\n## Auditoría visual (AUD-001) de las versiones GSAP corregidas\n\n" + '\n'.join(aud) + '\n')
print(open('ev26/RESULTADOS.md').read())
