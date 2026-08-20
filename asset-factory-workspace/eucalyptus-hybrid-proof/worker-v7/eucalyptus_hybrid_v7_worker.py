"""V7: explicit shallow canopy volumes over the accepted V4 carcass and V6 atlas."""
import os,re
here=os.path.dirname(os.path.abspath(__file__)); v4=os.path.join(here,'eucalyptus_hybrid_v4_worker.py');src=open(v4,encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.3.0","TREE_EUCALYPTUS_001@3.6.0").replace("'version':'3.3.0'","'version':'3.6.0'")
src=src.replace("UV=[(.0043,.595,.151,.991),(.175,.564,.302,.987),(.312,.487,.444,.986),(.504,.737,.720,.986),(.754,.811,.848,.999),(.891,.904,.910,.987),(.004,.020,.236,.361),(.254,.014,.326,.343)]", "UV=[(0,.5,.25,1),(.25,.5,.5,1),(.5,.5,.75,1),(.75,.5,1,1),(0,0,.25,.5),(.25,0,.5,.5),(.5,0,.75,.5),(.75,0,1,.5)]")
build=r'''def build(level):
    clear(); scene=bpy.context.scene; engine=set_eevee(scene)
    bark=solid('GG_MAT_EUCALYPTUS_BARK_PALE',(.10,.08,.045,1)); patch=solid('GG_MAT_EUCALYPTUS_BARK_WARM_PATCH',(.25,.11,.035,1)); foliage=foliage_material(); organic_carcass(level,bark,patch)
    # Per-mass volume recipes: rear / mid / front / angled support / restrained internal fill.
    masses=[(-2.25,4.35,1.45,1.45,0),(-1.15,5.65,1.55,1.65,1),(.25,6.15,1.65,1.72,2),(1.75,5.15,1.55,1.55,3),(2.50,3.92,1.22,1.28,4),(-.55,4.35,1.42,1.42,5),(1.05,4.08,1.35,1.38,6)]
    recipe={'CLOSE':[('.62',0,0,1.04,0, 'REAR'),('.12',.02,.03,1.0,12,'MID'),('-.38',-.05,-.04,.90,-10,'FRONT'),('.34',.16,.02,.83,38,'MID'),('-.08',-.12,.14,.63,-28,'MID')], 'GAMEPLAY':[('.55',0,0,1.02,0,'REAR'),('.05',.02,.03,1.0,10,'MID'),('-.34',-.05,-.04,.88,-10,'FRONT'),('.30',.14,.02,.78,35,'MID')], 'MAP':[('.10',0,0,1.0,4,'MID')] }[level]
    for i,(x,z,w,h,u) in enumerate(masses):
        for j,(y,dx,dz,scale,ang,layer) in enumerate(recipe):
            # Only five key masses receive a filler at close; distant LOD avoids it.
            if j==4 and i not in (0,2,3,4,6): continue
            card(x+dx,y,z+dz,w*scale,h*scale,UV[(u+j*2)%8],foliage,'GG_EUC_V7_%s_MASS_%02d_CARD_%02d'%(layer,i,j),layer,ang+(i%3-1)*6)
    return engine
'''
src=re.sub(r'def build\(level\):.*?\n    return engine\n',build,src,count=1,flags=re.S)
exec(compile(src,v4+' [V7 transformed]','exec'),globals(),globals())
# Mandatory rotation evidence from the actual rebuilt CLOSE scene.
build('CLOSE')
for name,angle in [('EUCALYPTUS_V7_0.png',-.32),('EUCALYPTUS_V7_PLUS30.png',-.32+.524),('EUCALYPTUS_V7_MINUS30.png',-.32-.524),('EUCALYPTUS_V7_PLUS60.png',-.32+1.047),('EUCALYPTUS_V7_MINUS60.png',-.32-1.047)]: render(name,angle,False,None)
cam=setup_camera(-.32,False);cam.location.z=8.0;cam.rotation_euler=(Vector((0,0,4.0))-cam.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.render.filepath=os.path.join(out,'EUCALYPTUS_V7_OBLIQUE.png');bpy.ops.render.render(write_still=True);bpy.data.objects.remove(cam,do_unlink=True)
