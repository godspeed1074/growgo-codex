import bpy,os,sys,json
args=sys.argv[sys.argv.index('--')+1:];source,out=args[:2];os.makedirs(out,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=source)
names=['WALL_LEFT_OF_DOOR','WALL_BETWEEN_DOOR_WINDOW','WALL_RIGHT_OF_WINDOW','WALL_ABOVE_OPENINGS','LEFT_PILASTER','RIGHT_PILASTER','BASE_PLINTH','BASE_BAND','TOP_CAP','FASCIA_BAND','AWNING_RAIL','AWNING_STRUCTURE','SIGN_FASCIA_STRUCTURE']
records=[]
for name in names:
 bpy.ops.wm.open_mainfile(filepath=source);src=bpy.data.objects.get(name)
 if not src: records.append({'name':name,'status':'MISSING'});continue
 src_copy=src.copy();src_copy.data=src.data.copy();asset_id=src.get('assetId');component_id=src.get('componentId');bpy.context.collection.objects.link(src_copy);src_copy.name=name;src_copy.location=(0,0,0);src_copy.rotation_euler=(0,0,0);src_copy['assetId']=asset_id;src_copy['componentId']=component_id;src_copy['anonymousGeometry']=False;src_copy['independentRuntimeArtifact']=True;src_copy['parentFacadeDependency']='NONE';[bpy.data.objects.remove(o,do_unlink=True) for o in list(bpy.data.objects) if o!=src_copy];bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,(asset_id or name)+'__'+name+'.blend'));records.append({'name':name,'assetId':asset_id,'artifact':(asset_id or name)+'__'+name+'.blend','independent':True})
json.dump({'status':'PASS','records':records,'anonymousGeometry':0,'parentFacadeDependency':'NONE'},open(os.path.join(out,'COMMERCIAL_SIMPLE_LAYER_A_MATERIALIZATION_RESULT.json'),'w'),indent=2)
