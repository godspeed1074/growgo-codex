import sys
src=sys.argv[sys.argv.index('--')+1];out=sys.argv[sys.argv.index('--')+2]
code=open(src).read().replace('SHOP_EXACT_','SHOP_REFBAKE_').replace('SHOP_EXACT_RECONSTRUCTION@1.0.0','SHOP_REFBAKE_RECONSTRUCTION@1.0.0')
sys.argv=['refbake','--',out]
exec(compile(code,'refbake-reconstruction.py','exec'),globals(),globals())
