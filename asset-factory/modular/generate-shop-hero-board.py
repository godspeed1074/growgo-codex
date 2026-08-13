from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path('.');new=root/'test-output/shop-hero-upgrade';ref=Path('/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-ebd1feb7-85bc-478b-a01c-93ce973da8fb.png');ids=['GG-BLD-WALL-SHOP-BROWN-001','GG-BLD-FASCIA-SHOP-NAVY-001','GG-BLD-AWNING-SHOP-FABRIC-001','GG-BLD-WINDOW-SHOP-LARGE-002','GG-BLD-DOOR-SHOP-002','GG-BLD-FOUNDATION-SHOP-002','GG-VEG-PLANTER-SHRUB-001'];f=ImageFont.load_default()
def fit(im,s):
 im=im.convert('RGB');im.thumbnail(s);b=Image.new('RGB',s,(235,235,235));b.paste(im,((s[0]-im.width)//2,(s[1]-im.height)//2));return b
thumb=[]
for mid in ids:
 d=new/(mid+'@2.0.0');parent=root/'test-output/shop-layer-a-detail-expansion'/(mid+'@1.3.0')/'FRONT.png'
 if not parent.exists():parent=root/'test-output/shop-layer-a-real'/mid/'FRONT.png'
 b=Image.new('RGB',(1000,520),(244,241,234));g=ImageDraw.Draw(b)
 for i,(lab,p) in enumerate([('REFERENCE',ref),('PREVIOUS',parent),('@2.0.0',d/'FRONT.png')]):
  x=15+i*325;b.paste(fit(Image.open(p),(300,190)),(x,35));g.text((x+110,235),lab,fill=(38,54,74),font=f)
 for i,lab in enumerate(['FRONT','BACK','LEFT','RIGHT']):
  x=15+i*245;b.paste(fit(Image.open(d/(lab+'.png')),(220,150)),(x,280));g.text((x+90,440),lab,fill=(38,54,74),font=f)
 b.save(d/'MODULE_HERO_REVIEW_BOARD.png');thumb.append(b)
out=Image.new('RGB',(1000,((len(thumb)+1)//2)*270),(238,234,226))
for i,im in enumerate(thumb):im.thumbnail((480,250));out.paste(im,(i%2*500,i//2*270))
out.save(new/'SHOP_HERO_MODULE_UPGRADE_BOARD.png')
