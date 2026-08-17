import sys,os
src=sys.argv[sys.argv.index('--')+1];out=sys.argv[sys.argv.index('--')+2]
code=open(src).read().replace('SHOP_EXACT_','SHOP_HYBRID_').replace('SHOP_EXACT_RECONSTRUCTION@1.0.0','SHOP_HYBRID_REFERENCE_LOCKED@1.0.0')
sys.argv=['hybrid', '--', out]
exec(compile(code,'hybrid-reconstruction.py','exec'),globals(),globals())
