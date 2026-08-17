import bpy,os,sys
base=os.path.join(os.path.dirname(__file__),'steam-deck-plant-target-reconstruction.py');src=open(base).read()
start=src.index(' positions=');end=src.index('\n for i,',start)
extra=[(-.48,.69,-.58,.02),(-.37,.67,-.42,-.02),(-.27,.66,-.28,.03),(-.12,.65,-.12,-.04),(.06,.65,.10,.03),(.22,.66,.26,-.02),(.36,.67,.42,.04),(.49,.64,.58,-.03),(-.43,.55,-.53,.02),(-.30,.54,-.36,-.03),(-.17,.56,-.20,.02),(.00,.55,.02,-.02),(.16,.55,.20,.04),(.31,.54,.37,-.02),(.44,.52,.52,.03),(-.35,.43,-.40,.01),(-.15,.42,-.18,-.03),(.17,.42,.22,.02)]
original=src[start:end]
new=original[:-1]+','+','.join(str(x) for x in extra)+']'
src=src[:start]+new+src[end:]
src=src.replace("z=.50+z*.62+(j%2)*.018","z=.42+z*.72+(j%2)*.012").replace("(x+(j-1)*.065,yy,zz)","(x*1.10+(j-1)*.060,yy,zz)")
exec(compile(src,base,'exec'),globals(),globals())
