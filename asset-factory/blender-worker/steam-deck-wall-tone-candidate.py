import os,sys
source=os.path.join(os.path.dirname(__file__),'steam-deck-calibrated-full-shop.py')
text=open(source,encoding='utf-8').read()
text=text.replace("MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.34,.16,.09));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.40,.21,.12));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.25,.11,.065));", "MAT_WALL=solid('GG_MAT_WALL_WARM_BROWN_001',(.27,.115,.060));MAT_WALL_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.34,.165,.085));MAT_WALL_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.19,.070,.035));")
exec(compile(text,source,'exec'),globals(),globals())
