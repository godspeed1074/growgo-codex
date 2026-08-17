import os,sys
source=os.path.join(os.path.dirname(__file__),'steam-deck-calibrated-full-shop.py')
text=open(source,encoding='utf-8').read()
# Keep the retained darker wall palette in every candidate.
text=text.replace("MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.34,.16,.09));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.40,.21,.12));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.25,.11,.065));", "MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.27,.115,.060));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.34,.165,.085));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.19,.070,.035));")
v=os.environ.get('GROWGO_VARIANT','A')
variants={
 'A': ("(0,-.20,3.06),(3.35,.06,.07)","(0,-.56,2.48),(3.10,.035,.06)","(2.05,-.30,.80),(.60,.24,.30)","(2.05,-.26,1.00),(.48,.20,.28)","(2.05,-.22,1.18),(.34,.14,.20)"),
 'B': ("(0,-.28,3.06),(3.35,.08,.09)","(0,-.64,2.48),(3.10,.045,.08)","(2.05,-.38,.80),(.60,.36,.30)","(2.05,-.30,1.00),(.48,.28,.28)","(2.05,-.22,1.18),(.34,.20,.20)"),
 'C': ("(0,-.24,3.06),(3.35,.07,.08)","(0,-.60,2.48),(3.10,.040,.07)","(2.05,-.34,.80),(.60,.30,.30)","(2.05,-.28,1.00),(.48,.24,.28)","(2.05,-.22,1.18),(.34,.18,.20)")}
old=("(0,-.20,3.06),(3.35,.06,.07)","(0,-.56,2.48),(3.10,.035,.06)","(2.05,-.30,.80),(.60,.24,.30)","(2.05,-.26,1.00),(.48,.20,.28)","(2.05,-.22,1.18),(.34,.14,.20)")
for a,b in zip(old,variants.get(v,variants['A'])): text=text.replace(a,b)
exec(compile(text,source,'exec'),globals(),globals())
