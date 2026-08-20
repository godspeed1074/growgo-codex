"""V3 is an isolated source-preserving refinement of the V2 real-worker proof."""
import os, re

here=os.path.dirname(os.path.abspath(__file__))
v2=os.path.join(here,'eucalyptus_hybrid_v2_worker.py')
src=open(v2,encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.1.0", "TREE_EUCALYPTUS_001@3.2.0")
src=src.replace("'version':'3.1.0'", "'version':'3.2.0'")
# A darker warm-grey eucalyptus palette replaces V2's construction-white carcass.
src=src.replace("(.63,.50,.30,1)", "(.22,.19,.13,1)").replace("(.66,.60,.46,1)", "(.22,.19,.13,1)").replace("(.34,.18,.09,1)", "(.28,.13,.055,1)")
src=src.replace("vertices=7, radius1=r, radius2=r*.56", "vertices=16, radius1=r, radius2=r*.34")
# Short connected tapered segments form gentle, asymmetric branch curves instead of long beams.
branches="""BRANCHES=[((-.10,0,0),(-.12,.02,1.18),.27),((-.12,.02,1.18),(.10,.04,2.45),.20),((.10,.04,2.45),(-.32,.08,3.35),.16),((-.32,.08,3.35),(-1.28,.13,4.38),.115),((.10,.04,2.50),(.62,-.06,3.38),.17),((.62,-.06,3.38),(1.55,-.12,4.55),.12),((-.32,.08,3.35),(-1.30,.10,3.85),.10),((-1.30,.10,3.85),(-2.28,.17,4.08),.065),((.62,-.06,3.38),(1.62,-.05,3.68),.105),((1.62,-.05,3.68),(2.54,-.10,3.92),.065),((-.12,.02,2.72),(-.52,.04,4.22),.095),((-.52,.04,4.22),(-1.12,.10,5.55),.060),((.62,-.06,3.72),(.38,-.03,4.85),.09),((.38,-.03,4.85),(.28,-.02,5.95),.055),((1.54,-.11,4.48),(1.92,.03,5.28),.06)]
"""
src=re.sub(r"BRANCHES=\[.*?\]\n\n",branches,src,count=1,flags=re.S)
src=src.replace("('EUCALYPTUS_CLOSE_CANOPY.png',-.25,True,None)", "('EUCALYPTUS_CLOSE_CANOPY.png',-.25,True,None),('EUCALYPTUS_CLOSE_TRUNK.png',-.25,True,'CARCASS')")
src=src.replace("'previousVersion':'3.0.0'", "'previousVersion':'3.1.0'")
src=src.replace("'previousStatus':'VISUALLY_REJECTED_STRUCTURAL_METHOD_EVIDENCE_ONLY'", "'previousStatus':'NEEDS_TARGETED_CORRECTION'")
src=src.replace("'atlasChanged':False", "'atlasChanged':False,'v3Corrections':['tapered-curved-carcass','warm-grey-bark','clean-atlas-revalidated','canopy-placement-preserved']")
exec(compile(src, v2+' [V3 transformed]', 'exec'), globals(), globals())
