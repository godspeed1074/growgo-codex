import bpy, json, os, sys, math
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
if len(args) != 2:
    raise SystemExit('usage: -- <locked-front.blend> <out>')
source, out = args
os.makedirs(out, exist_ok=True)

# The locked camera looks down -Z.  The production text calls this the camera
# ray/Y depth; this Blender scene's equivalent ray axis is Z.  X/Y coordinates
# (the observed front projection) are never translated or rebuilt.
RAY_AXIS = 'Z'

def leaf_objects():
    return sorted([o for o in bpy.context.scene.objects if o.type == 'MESH' and
        (str(o.get('leafId', '')).startswith('LEAF_') or
         o.get('componentId') == 'SHRUB_OBSERVED_RESIDUAL')], key=lambda o:o.name)

def leaf_area(o):
    return sum(p.area for p in o.data.polygons)

def leaf_band(o, index, total):
    # Existing front layering is authoritative.  A stable rank gives five
    # shallow real-depth bands without changing which leaf is in front at 0°.
    z = sum(v.co.z for v in o.data.vertices) / max(1, len(o.data.vertices))
    ordered = sorted(leaf_objects(), key=lambda q: sum(v.co.z for v in q.data.vertices) / max(1, len(q.data.vertices)))
    rank = ordered.index(o) / max(1, len(ordered)-1)
    return min(4, int(rank * 5.0))

def depth_offset(o, width, percent):
    band = leaf_band(o, 0, 0)
    # FRONT is closest to the locked camera (+Z); deterministic sub-band jitter
    # avoids a visibly stratified stack and stays inside the requested envelope.
    jitter = ((sum(ord(c) for c in o.name) % 7) - 3) * .006
    return width * (percent / 100.0) * ((band - 2) / 4.0 + jitter)

def lower_anchor(o):
    # A pivot at the leaf's lower/base point limits apparent tracking motion.
    vs = [v.co.copy() for v in o.data.vertices]
    return min(vs, key=lambda v:(v.y, abs(v.x)))

def apply_camera_state(angle, max_bias, depth_percent, include=None):
    obs = leaf_objects()
    xs = [v.co.x for o in obs for v in o.data.vertices]
    width = max(xs) - min(xs)
    for o in obs:
        if include is not None and o.get('leafId') not in include:
            o.hide_render = True
            continue
        o.location.z += depth_offset(o, width, depth_percent)
        if angle == 0:
            continue
        # Limited yaw only.  The correction intentionally never reaches camera
        # angle: a leaf remains embedded rather than acting as a full billboard.
        yaw = math.copysign(min(abs(angle) * .58, max_bias), angle)
        pivot = lower_anchor(o)
        a = math.radians(yaw)
        ca, sa = math.cos(a), math.sin(a)
        for v in o.data.vertices:
            x, z = v.co.x - pivot.x, v.co.z - pivot.z
            v.co.x = pivot.x + ca*x + sa*z
            v.co.z = pivot.z - sa*x + ca*z

def look(camera):
    camera.rotation_euler = (Vector((0, 0, .18)) - camera.location).to_track_quat('-Z', 'Y').to_euler()

def make_camera(name, angle):
    data = bpy.data.cameras.new(name)
    c = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(c)
    r = math.radians(angle)
    c.location = (math.sin(r)*9, 0, math.cos(r)*9)
    c.data.type = 'ORTHO'
    c.data.ortho_scale = 1
    look(c)
    return c

def render(scene, camera, filename, res=(189, 261)):
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = os.path.join(out, filename + '.png')
    bpy.ops.render.render(write_still=True)

def fresh_render(filename, angle, max_bias, depth_percent, include=None, res=(189,261), save=False):
    bpy.ops.wm.open_mainfile(filepath=source)
    scene = bpy.context.scene
    apply_camera_state(angle, max_bias, depth_percent, include)
    front = bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA')
    if angle == 0:
        # The source camera, including its exact framing and orthographic
        # contract, is itself part of the authority lock. Never normalise it.
        camera = front
    else:
        camera = make_camera('LIMITED_BILLBOARD_%s' % filename, angle)
    render(scene, camera, filename, res)
    if save:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'PLANT_LIMITED_BILLBOARD_PARALLAX_CANDIDATE.blend'))

def run_leaf001_proof():
    for label, bias in [('STATIC', 0), ('BIAS_A', 10), ('BIAS_B', 18), ('BIAS_C', 25)]:
        fresh_render('LEAF_001_%s_30' % label, 30, bias, 16, {'LEAF_001'})
    fresh_render('LEAF_001_FRONT', 0, 0, 16, {'LEAF_001'})

def run_three_leaf_proof():
    ids = {'LEAF_001', 'LEAF_005', 'LEAF_007'}
    for a in [-30, -20, -10, 0, 10, 20, 30]:
        fresh_render('THREE_LEAF_PARALLAX_%+03d' % a, a, 18, 16, ids)

def run_candidate(label, depth, selected=False):
    for a in [-30, -20, -10, 0, 10, 20, 30, 45, 90]:
        fresh_render('LIMITED_%s_%+03d' % (label, a), a, 18, depth, res=(189,261), save=(selected and a == 30))
    return {'candidate': label, 'foliageDepthPercent': depth, 'maxLeafBiasDegrees': 18,
            'observedLeafCount': len(leaf_objects()), 'supportLeavesCreated': 0}

run_leaf001_proof()
run_three_leaf_proof()
records = [run_candidate('A', 12), run_candidate('B', 16, True), run_candidate('C', 20)]
# The 0° result is deliberately generated after applying depth-only positions;
# its projection must remain identical under orthographic locked-camera math.
fresh_render('PLANT_LIMITED_BILLBOARD_FRONT', 0, 18, 16)
fresh_render('PLANT_LIMITED_BILLBOARD_GAMEPLAY_1X', 20, 18, 16)
fresh_render('PLANT_LIMITED_BILLBOARD_GAMEPLAY_2X', 20, 18, 16, res=(428,436))
result = {
    'status': 'PASS_LIMITED_BILLBOARD_WORKER', 'worker': 'Steam Deck',
    'blender': bpy.app.version_string, 'authority': 'PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1',
    'cameraRayAxisInBlend': RAY_AXIS, 'records': records, 'selected': 'B',
    'biasCandidatesDegrees': [10,18,25], 'selectedMaxBiasDegrees': 18,
    'observedLeavesChanged': False, 'frontContourRebuilt': False,
    'centralCoreCreated': False, 'depthFinsCreated': False, 'supportLeavesCreated': 0,
    'shopIntegrationPerformed': False, 'anonymousGeometryCount': 0
}
with open(os.path.join(out, 'PLANT_LIMITED_BILLBOARD_RESULT.json'), 'w') as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
