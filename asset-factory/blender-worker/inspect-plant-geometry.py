import bpy,json,sys
args=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=args[0])
def kind(o):
 if str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL': return 'leaf'
 if str(o.get('componentId','')).startswith('FLOWER_GROUP'): return 'flower'
 if str(o.get('componentId','')).startswith('PLANTER'): return 'planter'
 return None
def ext(o):
 vs=[o.matrix_world@v.co for v in o.data.vertices]
 return {'x':round(max(v.x for v in vs)-min(v.x for v in vs),6),'y':round(max(v.y for v in vs)-min(v.y for v in vs),6),'z':round(max(v.z for v in vs)-min(v.z for v in vs),6)}
items=[{'name':o.name,'kind':kind(o),'componentId':o.get('componentId'),'leafId':o.get('leafId'),'vertices':len(o.data.vertices),'extent':ext(o)} for o in bpy.context.scene.objects if o.type=='MESH' and kind(o)]
r={'blender':bpy.app.version_string,'counts':{k:sum(x['kind']==k for x in items) for k in ['leaf','flower','planter']},'items':items}
print(json.dumps(r,indent=2))
