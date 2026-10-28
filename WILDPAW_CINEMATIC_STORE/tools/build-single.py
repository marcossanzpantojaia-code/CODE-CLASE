# Empaqueta WILDPAW en un solo .html (CSS, JS, fuentes, imágenes y vídeos en data: URIs).
# Uso, desde la carpeta WILDPAW_CINEMATIC_STORE:  python3 tools/build-single.py
import base64, re, os, mimetypes
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
MIME = {'.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2'}
def uri(rel):
    rel = rel.replace('../', '')
    data = open(P + rel, 'rb').read()
    return 'data:%s;base64,%s' % (MIME[os.path.splitext(rel)[1]], base64.b64encode(data).decode())
ASSET = re.compile(r'(?:\.\./)?assets/[A-Za-z0-9_/.-]+\.(?:webp|mp4|woff2)')
html = open(P + 'index.html', encoding='utf-8').read()
def css(m):
    c = open(P + m.group(1), encoding='utf-8').read()
    c = ASSET.sub(lambda a: uri(a.group(0)), c)
    return '<style>\n' + c + '\n</style>'
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css, html)
html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)
fish = {}
for f in sorted(os.listdir(P + 'assets/img/fish')):
    fish[f[:-5]] = uri('assets/img/fish/' + f)
def js(m):
    c = open(P + m.group(1), encoding='utf-8').read()
    if m.group(1).endswith('aquarium.js'):
        c = c.replace("'assets/img/fish/' + sp.key + '.webp'", "window.WILDPAW_FISH[sp.key]")
        pre = 'window.WILDPAW_FISH = {' + ','.join('"%s":"%s"' % kv for kv in fish.items()) + '};\n'
        c = pre + c
    if 'vendor' not in m.group(1):
        c = ASSET.sub(lambda a: uri(a.group(0)), c)
    c = c.replace('</script', '<\\/script')
    return '<script>\n' + c + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
html = ASSET.sub(lambda a: uri(a.group(0)), html)
assert 'assets/' not in re.sub(r'data:[^"\')]+', '', html).replace('assets/</', ''), [x for x in re.findall(r'assets/[^"\' )]+', re.sub(r'data:[^"\')]+', '', html))][:5]
out = P + 'WILDPAW-un-solo-archivo.html'
open(out, 'w', encoding='utf-8').write(html)
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')
