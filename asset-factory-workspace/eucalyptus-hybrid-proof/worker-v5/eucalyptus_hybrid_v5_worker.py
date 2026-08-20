"""V5 keeps the accepted V4 carcass and replaces all foliage with authored transparent GrowGo cards."""
import os
here=os.path.dirname(os.path.abspath(__file__));src=open(os.path.join(here,'eucalyptus_hybrid_v4_worker.py'),encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.3.0","TREE_EUCALYPTUS_001@3.4.0").replace("'version':'3.3.0'","'version':'3.4.0'")
# V5's authored atlas is an explicit 4x2 grid.  V4's curated-atlas UVs describe a
# different packing layout and were the source of the apparent opaque rectangles.
src=src.replace("UV=[(.0043,.595,.151,.991),(.175,.564,.302,.987),(.312,.487,.444,.986),(.504,.737,.720,.986),(.754,.811,.848,.999),(.891,.904,.910,.987),(.004,.020,.236,.361),(.254,.014,.326,.343)]", "UV=[(0,.5,.25,1),(.25,.5,.5,1),(.5,.5,.75,1),(.75,.5,1,1),(0,0,.25,.5),(.25,0,.5,.5),(.5,0,.75,.5),(.75,0,1,.5)]")
src=src.replace("counts={'CLOSE':(3,3,3),'GAMEPLAY':(1,2,1),'MAP':(0,1,0)}[level]","counts={'CLOSE':(1,1,1),'GAMEPLAY':(0,1,1),'MAP':(0,1,0)}[level]")
src=src.replace("'atlasChanged':False","'atlasChanged':True,'v5AuthoredCards':True,'rejectedRealisticAtlasUsed':False")
exec(compile(src,here+' [V5 transformed]','exec'),globals(),globals())
