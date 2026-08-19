"""Runtime-only direct import filter. Never writes approved source blends."""
import bpy, json, os
RETIRED={'SIGN_PRESENTATION','AWNING_PRESENTATION','WINDOW_PRESENTATION','Camera','Area'}
def import_filtered(source_path, collection, allowed=None):
    with bpy.data.libraries.load(source_path,link=True) as (src,dst):
        dst.objects=[name for name in src.objects if name not in RETIRED and (allowed is None or name in allowed)]
    imported=[]
    for obj in dst.objects:
        if obj:
            collection.objects.link(obj);obj['runtimeImportMode']='DIRECT_APPROVED_BLEND_IMPORT';obj['retiredPresentationSuppressed']=False;imported.append(obj.name)
    return imported
def assert_exclusive(scene, bindings):
    for slot,asset_id in bindings.items():
        active=[o for o in scene.objects if o.get('presentationSlot')==slot and not o.hide_render]
        if len(active)!=1 or active[0].get('assetId')!=asset_id: raise RuntimeError('EXCLUSIVE_SLOT_VIOLATION:'+slot)
    forbidden=[o.name for o in scene.objects if o.get('fallbackCard') is True and not o.hide_render]
    if forbidden: raise RuntimeError('FALLBACK_CARD_FORBIDDEN:'+','.join(forbidden))
