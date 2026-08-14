import sys,os
src=sys.argv[sys.argv.index('--')+1];out=sys.argv[sys.argv.index('--')+2];script=os.path.join(os.path.dirname(__file__),'steam-deck-door-direct-reference.py')
code=open(script).read().replace('DOOR_DIRECT_REFERENCE_','DOOR_LAYERED_')
sys.argv=['layered','--',src,out]
exec(compile(code,'layered-door.py','exec'),globals(),globals())
