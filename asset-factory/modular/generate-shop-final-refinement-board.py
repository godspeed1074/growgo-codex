from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path('.');new=root/'test-output/shop-layer-a-final-refinement';old=root/'test-output/shop-layer-a-upgrade';ref=Path('/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-ebd1feb7-85bc-478b-a01c-93ce973da8fb.png');ids=['GG-BLD-FASCIA-SHOP-NAVY-001','GG-BLD-AWNING-SHOP-FABRIC-001','GG-BLD-WINDOW-SHOP-LARGE-002','GG-BLD-DOOR-SHOP-002','GG-VEG-PLANTER-SHRUB-001'];f=ImageFont.load_default()
def fit(im,s): im=im.convert('RGB');im.thumbnail(s);b=Image.new('RGB',s,(235,235,235));b.paste(im,((s[0]-im.width)//2,(s[1]-im.height)//2));return b
for mid in ids:
 d=new/(mid+'@1.2.0'); b=Image.new('RGB',(1500,760),(244,241,234));g=ImageDraw.Draw(b);g.text((30,20),mid+' — FINAL REFINEMENT REVIEW',fill=(38,54,74),font=f)
 for i,(lab,p) in enumerate([('REFERENCE',ref),('@1.1.0',old/(mid+'@1.1.0')/'FRONT.png'),('@1.2.0',d/'FRONT.png')]):
  x=25+i*490;b.paste(fit(Image.open(p),(445,285)),(x+10,65));g.text((x+175,355),lab,fill=(38,54,74),font=f)
 for i,lab in enumerate(['FRONT','BACK','LEFT','RIGHT']):
  x=25+i*365;b.paste(fit(Image.open(d/(lab+'.png')),(320,240)),(x+10,425));g.text((x+150,675),lab,fill=(38,54,74),font=f)
 b.save(d/'MODULE_FINAL_REFINEMENT_BOARD.png')
thumb=[]
for mid in ids:
 im=Image.open(new/(mid+'@1.2.0')/'MODULE_FINAL_REFINEMENT_BOARD.png').convert('RGB');im.thumbnail((720,360));thumb.append((mid,im.copy()))
out=Image.new('RGB',(1520,1200),(238,234,226));g=ImageDraw.Draw(out)
for i,(mid,im) in enumerate(thumb):
 x=i%2*760+20;y=i//2*400+30;out.paste(im,(x,y));g.text((x,y+370),mid+' — NEEDS_REVIEW',fill=(38,54,74),font=f)
out.save(new/'SHOP_LAYER_A_FINAL_REFINEMENT_BOARD.png')
