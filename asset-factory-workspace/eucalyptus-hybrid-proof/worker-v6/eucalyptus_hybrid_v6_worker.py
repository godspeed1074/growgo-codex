import os
here=os.path.dirname(os.path.abspath(__file__));src=open(os.path.join(here,'eucalyptus_hybrid_v5_worker.py'),encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.4.0","TREE_EUCALYPTUS_001@3.5.0").replace("'version':'3.4.0'","'version':'3.5.0'")
# Keep V5 UV/material path, but add restrained yawed companions for real side support.
src=src.replace("card(xx,yy,zz,w*scale,h*scale,UV[(island+depth*3+n)%len(UV)],foliage,'GG_EUC_%s_ISLAND_%02d_CLUSTER_%02d'%(('REAR','BODY','FRONT')[depth],island,n),('REAR','MID','FRONT')[depth],sign*(3+depth*3))", "card(xx,yy,zz,w*scale,h*scale,UV[(island+depth*3+n)%len(UV)],foliage,'GG_EUC_%s_ISLAND_%02d_CLUSTER_%02d'%(('REAR','BODY','FRONT')[depth],island,n),('REAR','MID','FRONT')[depth],sign*(3+depth*3));\n                if level!='MAP' and depth==1 and island in (0,2,4,6): card(xx+.10,yy+.18,zz+.04,w*.92,h*.92,UV[(island+5)%len(UV)],foliage,'GG_EUC_COMPANION_%02d'%island,'MID',sign*(29+island*5))")
exec(compile(src,here+' [V6 transformed]','exec'),globals(),globals())
