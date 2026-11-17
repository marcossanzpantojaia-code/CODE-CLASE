# Genera js/data/cast-data.js: las fotos de los animales como data: URI.
# Solo se carga al abrir la web con doble clic (file://): ahí el navegador no
# deja que WebGL lea imágenes de archivos locales, pero sí las incrustadas.
# Uso, desde la carpeta WILDPAW_CINEMATIC_STORE:  python3 tools/build-cast-data.py
import base64, json, os
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
CAST = P + 'assets/img/cast/'
data = {}
for pose in ['dog-run', 'dog-back', 'cat-back', 'cat-leap', 'dog-walk', 'cat-walk']:
    layers = ['', '-b1', '-b2'] if 'walk' not in pose else ['']
    for suf in layers:
        name = pose + suf
        b = open(CAST + name + '.webp', 'rb').read()
        data[name] = 'data:image/webp;base64,' + base64.b64encode(b).decode()
js = ('/* Generado por tools/build-cast-data.py. Fotos de los animales como data: URI para\n'
      '   WebGL al abrir la web desde el disco (file://). No editar a mano. */\n'
      'window.WILDPAW_CAST = ' + json.dumps(data, separators=(',', ':')) + ';\n')
open(P + 'js/data/cast-data.js', 'w', encoding='utf-8').write(js)
print('js/data/cast-data.js', round(len(js) / 1024), 'KB')
