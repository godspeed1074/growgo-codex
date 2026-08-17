import bpy,sys,os,math
from mathutils import Vector
src=os.path.join(os.path.dirname(__file__),'steam-deck-calibrated-full-shop.py')
exec(compile(open(src).read(),src,'exec'),globals(),globals())
plant_out=out
for o in list(bpy.context.scene.objects):
 if o.get('componentId') in {'SHRUB','PLANTER'} or 'FOLIAGE_' in o.name or 'PLANTER_' in o.name: o.hide_render=True
def mat(n,c):
 m=bpy.data.materials.get(n) or bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
g=[mat('PLANT3D_GREEN_DARK',(.06,.16,.03)),mat('PLANT3D_GREEN_MID',(.12,.30,.05)),mat('PLANT3D_GREEN_LIGHT',(.24,.44,.08))];wood=mat('PLANT3D_PLANTER',(.08,.20,.045));soil=mat('PLANT3D_SOIL',(.08,.05,.02));yellow=mat('PLANT3D_FLOWER',(.85,.55,.08));created=[]
def cube(n,l,d,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o['moduleId']='GG-VEG-PLANTER-SHRUB-001';o['moduleVersion']='2.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;created.append(o)
def leaf(i,l,s,r,m):
 w,h,d=s;v=[(-w/2,0,0),(w/2,0,0),(0,h,0),(0,h*.48,d),(0,h*.82,d*.6),(0,0,d*.2)];f=[(0,1,3),(0,3,5),(1,2,4),(1,4,3),(2,0,5),(2,5,4),(3,4,5),(0,2,1)];me=bpy.data.meshes.new('PLANT3D_LEAF_MESH');me.from_pydata(v,[],f);o=bpy.data.objects.new('PLANT3D_LEAF_%03d'%i,me);bpy.context.collection.objects.link(o);o.location=l;o.rotation_euler=r;o.data.materials.append(m);o['moduleId']='GG-VEG-LEAF-SHRUB-BROAD-001';o['moduleVersion']='1.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;created.append(o)
def mass(k,l):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.19,location=l);o=bpy.context.object;o.name='PLANT3D_FOLIAGE_MASS_%02d'%k;o.scale=(1.25,.8,1.35);o.data.materials.append(g[(k+1)%3]);o['moduleId']='GG-VEG-SHRUB-FOLIAGE-CLUSTER-001';o['moduleVersion']='1.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;created.append(o)
def flower(i,l):
 for p in range(5):
  a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.055,location=(l[0]+math.cos(a)*.045,l[1]+math.sin(a)*.045,l[2]));o=bpy.context.object;o.name='PLANT3D_FLOWER_%d_%d'%(i,p);o.scale=(1,.55,.25);o.rotation_euler[2]=a;o.data.materials.append(yellow);o['moduleId']='GG-VEG-FLOWER-ACCENT-001';o['moduleVersion']='1.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;created.append(o)
pos=(2.05,-.34,.0);cube('PLANT3D_PLANTER_BODY',(2.05,-.34,.22),(.95,.55,.42),wood);cube('PLANT3D_PLANTER_RIM',(2.05,-.35,.45),(1.05,.62,.10),wood);cube('PLANT3D_SOIL',(2.05,-.34,.49),(.82,.42,.025),soil)
clusters=[(1.77,-.32,.62),(2.10,-.26,.78),(2.35,-.32,.70),(1.93,-.44,1.02),(2.23,-.42,1.14),(1.67,-.38,.92),(2.45,-.37,.95)];i=0
for k,(x,y,z) in enumerate(clusters):
 mass(k,(x,y,z+.03))
 for j in range(4): leaf(i,(x+(j-1.5)*.07,y+j*.03,z+j*.1),(.25,.42,.045),(0,(j-1.5)*.25,(j-1.5)*.25),g[(k+j)%3]);i+=1
for fi,l in enumerate(((1.77,-.36,.94),(2.29,-.36,1.18),(2.07,-.36,1.34))): flower(fi,l)
s=bpy.context.scene
def rr(n,loc=(0,-18,2.8),scale=6.6): cam.location=loc;cam.rotation_euler=((Vector((0,0,1.85))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;s.render.filepath=os.path.join(plant_out,n+'.png');bpy.ops.render.render(write_still=True)
blend=os.path.join(plant_out,'SHOP_WITH_3D_PLANT.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);rr('SHOP_WITH_3D_PLANT_FRONT');rr('SHOP_WITH_3D_PLANT_GAMEPLAY');rr('SHOP_WITH_3D_PLANT_LEFT',(-18,0,2.8));rr('SHOP_WITH_3D_PLANT_RIGHT',(18,0,2.8));rr('SHOP_WITH_3D_PLANT_HERO',(0,-15,2.8),5.8)
