import bpy,sys,json
args=sys.argv[sys.argv.index('--')+1:];source,out=args
bpy.ops.wm.open_mainfile(filepath=source)
def rounded(v): return [round(x,6) for x in v]
objects=[]
for o in sorted(bpy.data.objects,key=lambda x:x.name):
 item={'name':o.name,'type':o.type,'location':rounded(o.location),'rotation':rounded(o.rotation_euler),'scale':rounded(o.scale),'dimensions':rounded(o.dimensions),'parent':o.parent.name if o.parent else None,'custom':{k:o[k] for k in sorted(o.keys()) if k not in {'_RNA_UI'}}}
 if o.type=='MESH': item['mesh']={'vertices':len(o.data.vertices),'triangles':sum(max(0,len(p.vertices)-2) for p in o.data.polygons),'materials':[m.name if m else None for m in o.data.materials]}
 objects.append(item)
materials=[]
for m in sorted(bpy.data.materials,key=lambda x:x.name): materials.append({'name':m.name,'diffuse':rounded(m.diffuse_color),'nodes':m.use_nodes})
s=bpy.context.scene;data={'objects':objects,'objectCount':len(objects),'materials':materials,'camera':s.camera.name if s.camera else None,'render':{'engine':s.render.engine,'resolution':[s.render.resolution_x,s.render.resolution_y,s.render.resolution_percentage],'camera':s.camera.name if s.camera else None}}
json.dump(data,open(out,'w'),sort_keys=True,separators=(',',':'))
