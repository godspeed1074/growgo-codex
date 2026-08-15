import os,sys
source=os.path.join(os.path.dirname(__file__),'steam-deck-calibrated-full-shop.py');text=open(source,encoding='utf-8').read()
text=text.replace("MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.34,.16,.09));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.40,.21,.12));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.25,.11,.065));", "MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.27,.115,.060));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.34,.165,.085));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.19,.070,.035));")
# Retain winning B transition/contact/foliage relationships.
for a,b in [("(0,-.20,3.06),(3.35,.06,.07)","(0,-.28,3.06),(3.35,.08,.09)"),("(0,-.56,2.48),(3.10,.035,.06)","(0,-.64,2.48),(3.10,.045,.08)"),("(2.05,-.30,.80),(.60,.24,.30)","(2.05,-.38,.80),(.60,.36,.30)"),("(2.05,-.26,1.00),(.48,.20,.28)","(2.05,-.30,1.00),(.48,.28,.28)"),("(2.05,-.22,1.18),(.34,.14,.20)","(2.05,-.22,1.18),(.34,.20,.20)")]: text=text.replace(a,b)
v=os.environ.get('GROWGO_VARIANT','D')
if v=='D':
  for a,b in [("(1.28,.18,2.25)","(1.28,.22,2.25)"),("(1.08,.18,2.25)","(1.08,.22,2.25)"),("(2.78,.18,2.25)","(2.78,.22,2.25)"),("(1.48,.16,.42)","(1.48,.20,.42)"),("(1.88,.16,.42)","(1.88,.20,.42)")]: text=text.replace(a,b)
elif v=='E':
  for a,b in [("(1.28,.18,2.25)","(1.28,.28,2.25)"),("(1.08,.18,2.25)","(1.08,.28,2.25)"),("(2.78,.18,2.25)","(2.78,.28,2.25)"),("(1.48,.16,.42)","(1.48,.24,.42)"),("(1.88,.16,.42)","(1.88,.24,.42)")]: text=text.replace(a,b)
elif v=='F':
  text=text.replace("(0,-.64,2.48),(3.10,.045,.08)","(0,-.70,2.48),(3.10,.055,.10)")
exec(compile(text,source,'exec'),globals(),globals())
