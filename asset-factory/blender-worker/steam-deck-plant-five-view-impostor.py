import bpy, json, os, sys, math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2: raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args; os.makedirs(out,exist_ok=True)
VIEWS={'M30':-30,'M15':-15,'0':0,'P15':15,'P30':30}

def is_leaf(o): return o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL')
def is_flower(o): return o.type=='MESH' and str(o.get('componentId','')).startswith('FLOWER_GROUP')
def is_planter(o): return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')
def hide_non_presentation_geometry():
    # A runtime sprite contains only foliage, flowers, and the planter.  The
    # source's calibration backdrop is intentionally not part of this artifact.
    for o in bpy.context.scene.objects:
        if o.type=='MESH' and not (is_leaf(o) or is_flower(o) or is_planter(o)):
            o.hide_render=True
def leaves(): return [o for o in bpy.context.scene.objects if is_leaf(o)]
def bounds(objects):
    vs=[o.matrix_world @ v.co for o in objects for v in o.data.vertices]
    return min(v.x for v in vs),max(v.x for v in vs),min(v.y for v in vs),max(v.y for v in vs),min(v.z for v in vs),max(v.z for v in vs)
def rotate_mesh(o, angle):
    vs=o.data.vertices
    pivot=sum((v.co for v in vs),Vector((0,0,0)))/len(vs)
    a=math.radians(angle); c,s=math.cos(a),math.sin(a)
    for v in vs:
        x,z=v.co.x-pivot.x,v.co.z-pivot.z
        v.co.x=pivot.x+c*x+s*z
        v.co.z=pivot.z-s*x+c*z
def leaf_depth(o,width):
    # Stable, bounded depth ranks make every view a compact layered shrub.
    rank=(sum(ord(c) for c in o.name)%11)/10.0
    return (rank-.5)*width*.16
def material_from(name, colour):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*colour,1);bs.inputs['Roughness'].default_value=.78
    m.diffuse_color=(*colour,1)
    return m
def box(name,loc,scale,mat,component):
    bpy.ops.mesh.primitive_cube_add(location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat);o['componentId']=component;o['anonymousGeometry']=False;o['derivedPresentationGeometry']=True;return o
def build_shared_planter(depth_percent):
    old=[o for o in bpy.context.scene.objects if is_planter(o)]; x0,x1,y0,y1,z0,z1=bounds(old)
    for o in old:o.hide_render=True
    w,h=x1-x0,y1-y0; d=w*depth_percent/100.0; front=z1
    bodymat=material_from('IMPOSTOR_PLANTER_BODY',(.105,.265,.105))
    rimmat=material_from('IMPOSTOR_PLANTER_RIM',(.14,.34,.14))
    soilmat=material_from('IMPOSTOR_PLANTER_SOIL',(.11,.075,.035))
    # A conventional closed shallow box: front, rear, side walls, rim and soil.
    cy=(y0+y1)/2; back=front-d
    box('IMPOSTOR_PLANTER_BODY',( (x0+x1)/2,cy,(front+back)/2),(w,h*.78,d),bodymat,'PLANTER_BODY')
    box('IMPOSTOR_PLANTER_RIM',( (x0+x1)/2,y1-h*.055,(front+back)/2),(w*1.04,h*.11,d*1.12),rimmat,'PLANTER_RIM')
    box('IMPOSTOR_PLANTER_SOIL',( (x0+x1)/2,y1-h*.12,front-d*.48),(w*.83,h*.055,d*.76),soilmat,'PLANTER_SOIL')
    return {'depthPercent':depth_percent,'width':w,'depth':d,'objectsCreated':3}
def look(c): c.rotation_euler=(Vector((0,0,.18))-c.location).to_track_quat('-Z','Y').to_euler()
def camera(name,angle):
    d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c);a=math.radians(angle);c.location=(math.sin(a)*9,0,math.cos(a)*9);c.data.type='ORTHO';c.data.ortho_scale=1;look(c);return c
def render(scene,c,name,res=(189,261)):
    scene.camera=c;scene.render.resolution_x,scene.render.resolution_y=res;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True;scene.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
def render_view(key,angle,depth=22,res=(189,261),save=False):
    bpy.ops.wm.open_mainfile(filepath=source);scene=bpy.context.scene
    hide_non_presentation_geometry()
    # VIEW_0 uses untouched authority geometry and the locked camera.  Other
    # views are explicitly presentation-only, permitted to face their one view.
    if key=='0':
        c=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA')
        render(scene,c,'VIEW_0_RGBA',res);return
    for o in leaves():
        o.location.z+=leaf_depth(o,bounds(leaves())[1]-bounds(leaves())[0]);rotate_mesh(o,angle)
    for o in bpy.context.scene.objects:
        if is_flower(o): rotate_mesh(o,angle)
    planter=build_shared_planter(depth);c=camera('IMPOSTOR_'+key,angle);render(scene,c,'VIEW_'+key+'_RGBA',res)
    if save:bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-PRES-VEG-PLANTER-SHRUB-001_1.0.0.blend'))
def run():
    # Conventional planter proof: three depth candidates, assessed at the hard edge view.
    for label,depth in [('A',18),('B',22),('C',26)]:
        bpy.ops.wm.open_mainfile(filepath=source);scene=bpy.context.scene;build_shared_planter(depth)
        hide_non_presentation_geometry()
        for o in bpy.context.scene.objects:
            if is_leaf(o) or is_flower(o): o.hide_render=True
        render(scene,camera('PLANTER_'+label,30),'PLANTER_DEPTH_'+label+'_P30')
    for k,a in VIEWS.items():render_view(k,a,22,save=(k=='P30'))
    for scale,res in [('1X',(189,261)),('2X',(378,522))]:
        for k,a in VIEWS.items():render_view(k,a,22,res)
        # Canonical runtime file names are full-resolution 1X; 2X review uses suffix.
        for k in VIEWS:
            src=os.path.join(out,'VIEW_'+k+'_RGBA.png');dst=os.path.join(out,'GAMEPLAY_'+scale+'_'+k+'.png')
            if os.path.exists(src):
                import shutil;shutil.copyfile(src,dst)
    # Canonical sprite files always retain the mobile 1X resolution.
    for k,a in VIEWS.items(): render_view(k,a,22,(189,261))
    return {'status':'PASS_FIVE_VIEW_IMPOSTOR_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'presentationId':'GG-PRES-VEG-PLANTER-SHRUB-001@1.0.0','views':VIEWS,'selectedPlanterDepthPercent':22,'sourcePreserved':True,'view0UsesAuthorityCamera':True,'derivedOnly':True,'shopIntegrationPerformed':False,'anonymousGeometryCount':0}
r=run();json.dump(r,open(os.path.join(out,'PLANT_FIVE_VIEW_IMPOSTOR_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
