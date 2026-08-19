import bpy, json, os, sys
args=sys.argv[sys.argv.index('--')+1:]; root,out=args[:2]; os.makedirs(out,exist_ok=True)
files={
 'COMMERCIAL_LAYER_A_NATIVE':'test-output/commercial-simple-native-v1/COMMERCIAL_SIMPLE_LAYER_A_NATIVE_GROW_GOODS_V1.blend',
 'SWAPPED_FACADE':'test-output/commercial-simple-swapped-v2/GG-BLD-FACADE-SIMPLE-SHOP-MIRRORED-001_V2.blend',
 'COMPLETE_SHELL':'test-output/simple-shop-complete-v1/GG-BLD-SHOP-SIMPLE-GROW-GOODS-001_V1_CANDIDATE.blend',
 'ROOF':'test-output/simple-shop-roof-v1/GG-BLD-ROOF-SIMPLE-SHOP-001_V1.blend',
 'WALL_LEFT':'test-output/commercial-simple-layer-a-materialization/GG-FAC-WALL-BAY-SIMPLE-001__WALL_LEFT_OF_DOOR.blend',
 'WALL_RIGHT':'test-output/commercial-simple-layer-a-materialization/GG-FAC-WALL-BAY-SIMPLE-001__WALL_RIGHT_OF_WINDOW.blend',
 'WALL_BETWEEN':'test-output/commercial-simple-layer-a-materialization/GG-FAC-WALL-PANEL-SIMPLE-001__WALL_BETWEEN_DOOR_WINDOW.blend',
 'WALL_ABOVE':'test-output/commercial-simple-layer-a-materialization/GG-FAC-WALL-PANEL-SIMPLE-001__WALL_ABOVE_OPENINGS.blend',
 'AWNING_STRUCTURE':'test-output/commercial-simple-layer-a-materialization/GG-BLD-AWNING-COMMERCIAL-001__AWNING_STRUCTURE.blend',
}
outcome={}
for key,rel in files.items():
 file=os.path.join(root,rel)
 try:
  with bpy.data.libraries.load(file,link=True) as (fr,to): names=list(fr.objects)
  outcome[key]={'path':rel,'exists':os.path.exists(file),'objects':names}
 except Exception as e: outcome[key]={'path':rel,'exists':os.path.exists(file),'error':str(e)}
json.dump({'status':'PASS','sources':outcome,'blenderVersion':bpy.app.version_string},open(os.path.join(out,'COMMERCIAL_SIMPLE_RUNTIME_SOURCE_INVENTORY.json'),'w'),indent=2)
