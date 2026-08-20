"""V8 only recomposes the locked V7 volume recipe into five reference-style canopy masses."""
import os
here=os.path.dirname(os.path.abspath(__file__));src=open(os.path.join(here,'eucalyptus_hybrid_v7_worker.py'),encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.6.0","TREE_EUCALYPTUS_001@3.7.0").replace("'version':'3.6.0'","'version':'3.7.0'")
src=src.replace("masses=[(-2.25,4.35,1.45,1.45,0),(-1.15,5.65,1.55,1.65,1),(.25,6.15,1.65,1.72,2),(1.75,5.15,1.55,1.55,3),(2.50,3.92,1.22,1.28,4),(-.55,4.35,1.42,1.42,5),(1.05,4.08,1.35,1.38,6)]", "masses=[(-1.42,5.25,2.10,1.85,0),(.08,6.18,1.55,1.72,1),(1.55,5.12,1.95,1.55,2),(-1.85,4.00,1.35,1.16,3),(1.45,3.92,1.55,1.25,4)]")
src=src.replace("i not in (0,2,3,4,6)","i not in (0,1,2,4)")
exec(compile(src,here+' [V8 transformed]','exec'),globals(),globals())
