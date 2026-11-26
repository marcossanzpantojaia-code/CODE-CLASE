import sys
from PIL import Image, ImageDraw
A,B,out=sys.argv[1],sys.argv[2],sys.argv[3]; idx=[int(x) for x in sys.argv[4].split(',')]
W,H=320,180; im=Image.new('RGB',(W*len(idx),2*(H+18)),'white'); d=ImageDraw.Draw(im)
for r,(D,lab) in enumerate([(A,'A lote30'),(B,'B lote31')]):
    for k,i in enumerate(idx):
        f=Image.open(f'{D}/f{i:04d}.png').resize((W,H)); im.paste(f,(k*W,r*(H+18)+18)); d.text((k*W+4,r*(H+18)+3),f'{lab} f{i} t={i/30:.2f}s',fill='black')
im.save(out)
