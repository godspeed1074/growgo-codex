import os,sys
source=os.path.join(os.path.dirname(__file__),'steam-deck-calibrated-full-shop.py');text=open(source,encoding='utf-8').read();idx=int(os.environ.get('GROWGO_INDEX','1'))
# Retain the current 90-score wall palette.
text=text.replace("MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.34,.16,.09));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.40,.21,.12));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.25,.11,.065));", "MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.27,.115,.060));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.34,.165,.085));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.19,.070,.035));")
# Current winning B transition/contact/shrub baseline.
for a,b in [("(0,-.20,3.06),(3.35,.06,.07)","(0,-.28,3.06),(3.35,.08,.09)"),("(0,-.56,2.48),(3.10,.035,.06)","(0,-.64,2.48),(3.10,.045,.08)"),("(2.05,-.30,.80),(.60,.24,.30)","(2.05,-.38,.80),(.60,.36,.30)"),("(2.05,-.26,1.00),(.48,.20,.28)","(2.05,-.30,1.00),(.48,.28,.28)"),("(2.05,-.22,1.18),(.34,.14,.20)","(2.05,-.22,1.18),(.34,.20,.20)")]: text=text.replace(a,b)
def rep(a,b):
 global text
 text=text.replace(a,b)
if 1<=idx<=10:
 vals=[(-.32,-.64,-.22),(-.36,-.66,-.24),(-.40,-.68,-.26),(-.44,-.70,-.28),(-.48,-.72,-.30),(-.40,-.72,-.30),(-.40,-.76,-.30),(-.36,-.72,-.32),(-.44,-.68,-.24),(-.48,-.76,-.32)][idx-1]
 rep("(0,-.40,3.58)",f"(0,{vals[0]},3.58)");rep("(0,-.72,3.02)",f"(0,{vals[1]},3.02)");rep("(0,-.28,3.06)",f"(0,{vals[2]},3.06)")
elif 11<=idx<=20:
 d=[.20,.22,.24,.26,.28,.30,.32,.26,.28,.30][idx-11]
 for a,b in [("(1.28,.18,2.25)",f"(1.28,{d},2.25)"),("(1.08,.18,2.25)",f"(1.08,{d},2.25)"),("(2.78,.18,2.25)",f"(2.78,{d},2.25)"),("(1.48,.16,.42)",f"(1.48,{d-.04:.2f},.42)"),("(1.88,.16,.42)",f"(1.88,{d-.04:.2f},.42)")]: rep(a,b)
elif 21<=idx<=25:
 vals=[(-.36,-.28,-.20),(-.40,-.30,-.22),(-.44,-.32,-.24),(-.48,-.34,-.24),(-.42,-.30,-.18)][idx-21]
 rep("(0,-.64,2.48)",f"(0,{vals[0]},2.48)");rep("(2.05,-.38,.80)",f"(2.05,{vals[1]},.80)");rep("(2.05,-.30,1.00)",f"(2.05,{vals[2]},1.00)")
exec(compile(text,source,'exec'),globals(),globals())
