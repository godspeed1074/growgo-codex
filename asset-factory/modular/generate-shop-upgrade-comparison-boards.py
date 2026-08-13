from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

root=Path('.'); out=root/'test-output/shop-layer-a-upgrade'; ref=Path('/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-ebd1feb7-85bc-478b-a01c-93ce973da8fb.png')
ids=['GG-BLD-FASCIA-SHOP-NAVY-001','GG-BLD-AWNING-SHOP-FABRIC-001','GG-BLD-WINDOW-SHOP-LARGE-002','GG-BLD-DOOR-SHOP-002','GG-VEG-PLANTER-SHRUB-001']
font=ImageFont.load_default()
def fit(im,size):
 im=im.convert('RGB'); im.thumbnail(size); box=Image.new('RGB',size,(235,235,235)); box.paste(im,((size[0]-im.width)//2,(size[1]-im.height)//2)); return box
def board(mid):
 w,h=1500,760; b=Image.new('RGB',(w,h),(244,241,234)); d=ImageDraw.Draw(b); d.text((30,20),mid+' — Upgrade Comparison',fill=(38,54,74),font=font)
 cards=[('REFERENCE TARGET',ref),('@1.0.0 BASELINE',out.parent/'shop-layer-a-real'/mid/'FRONT.png'),('@1.1.0 UPGRADE CANDIDATE',out/(mid+'@1.1.0')/'FRONT.png')]
 for i,(label,p) in enumerate(cards):
  x=25+i*490; d.rectangle((x,55,x+465,380),fill='white',outline=(190,185,175),width=2); b.paste(fit(Image.open(p),(445,285)),(x+10,65)); d.text((x+150,355),label,fill=(38,54,74),font=font)
 for i,label in enumerate(['FRONT','BACK','LEFT','RIGHT']):
  x=25+i*365; p=out/(mid+'@1.1.0')/(label+'.png'); d.rectangle((x,415,x+340,700),fill=(245,245,245),outline=(190,185,175)); b.paste(fit(Image.open(p),(320,240)),(x+10,425)); d.text((x+150,675),label,fill=(38,54,74),font=font)
 b.save(out/(mid+'@1.1.0')/'MODULE_UPGRADE_COMPARISON_BOARD.png')
for mid in ids: board(mid)
thumbs=[]
for mid in ids:
 im=Image.open(out/(mid+'@1.1.0')/'MODULE_UPGRADE_COMPARISON_BOARD.png').convert('RGB'); im.thumbnail((720,360)); thumbs.append((mid,im.copy()))
cw,ch=760,400; complete=Image.new('RGB',(cw*2,ch*3),(238,234,226)); d=ImageDraw.Draw(complete)
for i,(mid,im) in enumerate(thumbs): x=(i%2)*cw+20; y=(i//2)*ch+30; complete.paste(im,(x,y)); d.text((x,10+y),mid+' — REVIEW REQUIRED',fill=(38,54,74),font=font)
complete.save(out/'SHOP_LAYER_A_UPGRADE_COMPLETE_BOARD.png')
