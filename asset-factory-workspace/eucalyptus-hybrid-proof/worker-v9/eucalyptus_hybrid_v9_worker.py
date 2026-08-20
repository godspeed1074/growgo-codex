"""V9 widens the front-to-back envelopes of the locked five V8 canopy masses."""
import os
here=os.path.dirname(os.path.abspath(__file__));src=open(os.path.join(here,'eucalyptus_hybrid_v8_worker.py'),encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.7.0","TREE_EUCALYPTUS_001@3.8.0").replace("'version':'3.7.0'","'version':'3.8.0'")
src=src.replace("recipe={'CLOSE':[('.62',0,0,1.04,0, 'REAR'),('.12',.02,.03,1.0,12,'MID'),('-.38',-.05,-.04,.90,-10,'FRONT'),('.34',.16,.02,.83,38,'MID'),('-.08',-.12,.14,.63,-28,'MID')], 'GAMEPLAY':[('.55',0,0,1.02,0,'REAR'),('.05',.02,.03,1.0,10,'MID'),('-.34',-.05,-.04,.88,-10,'FRONT'),('.30',.14,.02,.78,35,'MID')], 'MAP':[('.10',0,0,1.0,4,'MID')] }[level]", "recipe={'CLOSE':[('.95',0,0,1.05,0,'REAR'),('.30',.02,.05,1.0,14,'MID'),('-.55',-.08,-.06,.91,-12,'FRONT'),('.58',.18,.04,.84,43,'MID'),('-.16',-.14,.17,.62,-37,'MID')], 'GAMEPLAY':[('.78',0,0,1.03,0,'REAR'),('.16',.02,.04,1.0,13,'MID'),('-.47',-.07,-.05,.89,-12,'FRONT'),('.49',.16,.03,.79,40,'MID')], 'MAP':[('.10',0,0,1.0,4,'MID')] }[level]")
exec(compile(src,here+' [V9 transformed]','exec'),globals(),globals())
