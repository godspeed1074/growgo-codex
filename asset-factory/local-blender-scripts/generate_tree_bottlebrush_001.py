"""
Manual Blender-internal generator for TREE_BOTTLEBRUSH_001.

This script is intended to be run manually inside Blender 4.2 LTS. Codex does
not execute Blender for this asset. The script builds a deterministic papercut
2.5D bottlebrush tree, prepares three LOD roots, writes setup metadata, and
leaves the user to inspect the result and save the final blend manually.
"""

from __future__ import annotations

import importlib.util
import json
import math
import sys
from pathlib import Path

import bpy


ASSET_ID = "TREE_BOTTLEBRUSH_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "TREE_BOTTLEBRUSH_RECIPE_001"
REGISTRY_RECIPE_ID = "RECIPE_NATURE_ROADSIDE_NATIVE_STANDARD_001"
PREVIOUS_REGISTERED_VERSION = "v001"
ASSET_VERSION = "v002"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_BOTTLEBRUSH_NATIVE_001"
LOD_PROFILE = "NATURE_STANDARD_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
DEPENDENCY_IDS = (
    "MOD_TREE_TRUNK_BOTTLEBRUSH_001",
    "MOD_TREE_BRANCH_BOTTLEBRUSH_001",
    "MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001",
    "MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001",
    "MOD_TREE_GROUND_SOCKET_001",
)
REPO_ROOT = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex"
).resolve()
BOOTSTRAP_PATH = (
    REPO_ROOT / "asset-factory" / "local-blender-scripts" / "growgo_blender_bootstrap.py"
).resolve()

if not BOOTSTRAP_PATH.is_file():
    raise RuntimeError(
        f"GrowGo Blender bootstrap helper was missing: {BOOTSTRAP_PATH}"
    )

bootstrap_spec = importlib.util.spec_from_file_location(
    "growgo_blender_bootstrap", BOOTSTRAP_PATH
)
if bootstrap_spec is None or bootstrap_spec.loader is None:
    raise RuntimeError(
        f"Could not load GrowGo Blender bootstrap helper: {BOOTSTRAP_PATH}"
    )
growgo_blender_bootstrap = importlib.util.module_from_spec(bootstrap_spec)
bootstrap_spec.loader.exec_module(growgo_blender_bootstrap)
BOOTSTRAP_STATE = growgo_blender_bootstrap.bootstrap_local_blender_scripts(
    "generate_tree_bottlebrush_001.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import create_identity_anchor, write_identity_properties

WORKSPACE_ROOT = (REPO_ROOT / "asset-factory-workspace").resolve()
EXPECTED_OUTPUT_DIR = (
    WORKSPACE_ROOT / "production" / "COASTAL_NATURE_FAMILY_001" / "export"
).resolve()
GENERATION_MARKER_START = "S187_TREE_BOTTLEBRUSH_GENERATION_START"
GENERATION_MARKER_READY = "S187_TREE_BOTTLEBRUSH_GENERATION_READY_FOR_SAVE"
GENERATION_MARKER_COMPLETE = "S187_TREE_BOTTLEBRUSH_GENERATION_COMPLETE"
VERSIONED_ASSET_STEM = f"{ASSET_ID}_{ASSET_VERSION}"
EXPECTED_BLEND_FILENAME = f"{VERSIONED_ASSET_STEM}.blend"

COLLECTION_NAMES = (
    "GEOMETRY",
    "MATERIALS",
    "SOCKETS",
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP",
    "EXPORT_METADATA",
)

ROOT_NAMES = {
    "close": f"{ASSET_ID}_LOD_CLOSE_ROOT",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY_ROOT",
    "map": f"{ASSET_ID}_LOD_MAP_ROOT",
}

MATERIAL_SPECS = (
    (f"{ASSET_ID}_MATERIAL_TRUNK", "trunk", (0.49, 0.39, 0.29, 1.0), 0.86),
    (f"{ASSET_ID}_MATERIAL_BRANCH", "branch", (0.43, 0.33, 0.25, 1.0), 0.84),
    (
        f"{ASSET_ID}_MATERIAL_LEAF_LIGHT",
        "leaf light",
        (0.45, 0.69, 0.43, 1.0),
        0.72,
    ),
    (
        f"{ASSET_ID}_MATERIAL_LEAF_MID",
        "leaf mid",
        (0.31, 0.55, 0.35, 1.0),
        0.75,
    ),
    (
        f"{ASSET_ID}_MATERIAL_FLOWER_RED",
        "flower red",
        (0.82, 0.20, 0.24, 1.0),
        0.62,
    ),
    (
        f"{ASSET_ID}_MATERIAL_FLOWER_PINK",
        "flower pink",
        (0.88, 0.35, 0.42, 1.0),
        0.60,
    ),
)

FORBIDDEN_PALETTE_DESCRIPTIONS = (
    "neon magenta flowers",
    "electric blue leaves",
    "pure black foliage",
    "random unrealistic native palette",
)

METADATA_FILENAMES = {
    "manifest": f"tree-bottlebrush-{ASSET_VERSION}-manifest.json",
    "metadata": f"tree-bottlebrush-{ASSET_VERSION}-metadata.json",
    "validation": f"tree-bottlebrush-{ASSET_VERSION}-validation.json",
}

# Canopy and flower layout is intentionally asymmetric and slightly non-planar so
# the bottlebrush reads with lightweight depth from front, side, and 3/4 views.
CLOSE_LEAF_SPECS = (
    (
        f"{ASSET_ID}_LEAF_CLUSTER_MAIN_001",
        (-0.32, 0.18, 3.46),
        (0.04, 0.16, 0.20),
        (0.66, 0.27, 0.84),
        "leaf light",
    ),
    (
        f"{ASSET_ID}_LEAF_CLUSTER_MAIN_002",
        (0.34, 0.22, 3.34),
        (-0.03, -0.18, -0.12),
        (0.62, 0.26, 0.78),
        "leaf mid",
    ),
    (
        f"{ASSET_ID}_LEAF_CLUSTER_MAIN_003",
        (0.04, -0.34, 3.64),
        (0.02, 0.10, -0.28),
        (0.74, 0.29, 0.90),
        "leaf mid",
    ),
    (
        f"{ASSET_ID}_LEAF_CLUSTER_MAIN_004",
        (-0.18, -0.22, 3.20),
        (-0.02, 0.28, -0.42),
        (0.54, 0.23, 0.70),
        "leaf light",
    ),
    (
        f"{ASSET_ID}_LEAF_CLUSTER_MAIN_005",
        (0.22, 0.36, 3.12),
        (0.03, -0.24, 0.34),
        (0.50, 0.22, 0.66),
        "leaf mid",
    ),
)

CLOSE_FLOWER_SPECS = (
    (
        f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_001",
        (-0.38, 0.22, 3.66),
        (math.radians(90), 0.12, 0.22),
        (0.08, 0.08, 0.42),
        "flower red",
    ),
    (
        f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_002",
        (0.38, 0.26, 3.50),
        (math.radians(90), -0.12, -0.04),
        (0.08, 0.08, 0.38),
        "flower pink",
    ),
    (
        f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_003",
        (0.10, -0.30, 3.88),
        (math.radians(90), 0.08, -0.26),
        (0.09, 0.09, 0.46),
        "flower red",
    ),
    (
        f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_004",
        (-0.06, 0.40, 3.56),
        (math.radians(90), -0.04, 0.34),
        (0.08, 0.08, 0.36),
        "flower pink",
    ),
    (
        f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_005",
        (0.26, -0.14, 3.34),
        (math.radians(90), 0.02, -0.38),
        (0.07, 0.07, 0.34),
        "flower red",
    ),
)

GAMEPLAY_KEEP = (
    f"{ASSET_ID}_TRUNK_MAIN_001",
    f"{ASSET_ID}_BRANCH_PRIMARY_001",
    f"{ASSET_ID}_BRANCH_SECONDARY_001",
    f"{ASSET_ID}_LEAF_CLUSTER_MAIN_001",
    f"{ASSET_ID}_LEAF_CLUSTER_MAIN_003",
    f"{ASSET_ID}_LEAF_CLUSTER_MAIN_004",
    f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_001",
    f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_003",
    f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_004",
)

MAP_KEEP = (
    f"{ASSET_ID}_TRUNK_MAIN_001",
    f"{ASSET_ID}_LEAF_CLUSTER_MAIN_001",
    f"{ASSET_ID}_LEAF_CLUSTER_MAIN_003",
    f"{ASSET_ID}_LEAF_CLUSTER_MAIN_005",
    f"{ASSET_ID}_FLOWER_CLUSTER_MAIN_003",
)

IDENTITY_CONTRACT_V2 = {
    "assetId": ASSET_ID,
    "category": ASSET_CATEGORY,
    "recipeId": SOURCE_RECIPE_ID,
    "version": ASSET_VERSION,
    "variantId": VARIANT_ID,
    "paletteId": PALETTE_ID,
    "lodProfile": LOD_PROFILE,
    "source": {
        "generator": "Asset Factory",
        "authoringTool": "Blender",
    },
    "dependencies": [
        {
            "dependencyId": dependency_id,
            "category": "module",
            "identityPolicy": "DEPENDENCY_DECLARED_ONLY",
        }
        for dependency_id in DEPENDENCY_IDS
    ],
    "identityPolicy": IDENTITY_POLICY,
    "identityAnchor": {
        "componentRole": "IDENTITY_ANCHOR",
        "required": True,
    },
    "anchorRequired": True,
    "anchorValidation": "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
    "exportedIdentitySource": "identity_anchor",
}


def emit(marker):
    print(marker)
    sys.stdout.flush()


def fail(message):
    raise RuntimeError(message)


def ensure_blender_version():
    if bpy.app.version[:2] != (4, 2):
        fail(f"Expected Blender 4.2.x, found {bpy.app.version!r}.")


def ensure_output_directory():
    output_dir = EXPECTED_OUTPUT_DIR.resolve()
    repo_root = REPO_ROOT.resolve()

    print(f"Resolved bottlebrush output directory: {output_dir}")
    sys.stdout.flush()

    if str(output_dir).startswith("/Applications"):
        fail(f"Refusing to write inside /Applications: {output_dir}")

    try:
        output_dir.relative_to(repo_root)
    except ValueError:
        fail(
            "Refusing to write outside the GrowGo repository workspace: "
            f"{output_dir}"
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def ensure_final_output_targets_safe(output_dir):
    final_blend_path = output_dir / EXPECTED_BLEND_FILENAME
    if final_blend_path.exists():
        fail(
            "Refusing to continue because the final blend already exists. "
            "Use a fresh Blender file and inspect before deciding whether to replace it: "
            f"{final_blend_path}"
        )


def write_json(output_path, payload):
    if output_path.exists():
        print(f"Refreshing existing metadata file: {output_path.name}")
    output_path.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


def apply_identity_properties(
    target,
    component_role,
    lod_label=None,
    dependency_id=None,
    exported_identity_source="metadata",
    is_anchor=False,
):
    write_identity_properties(
        target,
        IDENTITY_CONTRACT_V2,
        component_role=component_role,
        lod_label=lod_label,
        dependency_id=dependency_id,
        exported_identity_source=exported_identity_source,
        is_anchor=is_anchor,
    )


def write_repository_metadata(output_dir):
    write_json(
        output_dir / METADATA_FILENAMES["manifest"],
        {
            "assetId": ASSET_ID,
            "recipeReference": SOURCE_RECIPE_ID,
            "manifestVersion": "1.0.0",
            "category": ASSET_CATEGORY,
            "identityContractSchemaId": "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
            "variantId": VARIANT_ID,
            "paletteId": PALETTE_ID,
            "lodProfile": LOD_PROFILE,
            "identityPolicy": IDENTITY_POLICY,
            "dependencies": list(DEPENDENCY_IDS),
            "workspaceRoot": str(WORKSPACE_ROOT),
            "previousRegisteredVersion": PREVIOUS_REGISTERED_VERSION,
            "targetRevisionVersion": ASSET_VERSION,
            "expectedBlendFilename": EXPECTED_BLEND_FILENAME,
            "expectedFinalOutputs": [
                f"{VERSIONED_ASSET_STEM}_LOD_CLOSE.glb",
                f"{VERSIONED_ASSET_STEM}_LOD_GAMEPLAY.glb",
                f"{VERSIONED_ASSET_STEM}_LOD_MAP.glb",
            ],
        },
    )
    write_json(
        output_dir / METADATA_FILENAMES["metadata"],
        {
            "assetId": ASSET_ID,
            "assetFamilyId": "COASTAL_NATURE_FAMILY_001",
            "recipeReference": SOURCE_RECIPE_ID,
            "registryRecipeId": REGISTRY_RECIPE_ID,
            "identityContractV2": IDENTITY_CONTRACT_V2,
            "outputDirectory": str(output_dir),
            "previousRegisteredVersion": PREVIOUS_REGISTERED_VERSION,
            "targetRevisionVersion": ASSET_VERSION,
            "paletteSlots": [
                "trunk",
                "branch",
                "leaf light",
                "leaf mid",
                "flower red",
                "flower pink",
            ],
            "lodRoots": ROOT_NAMES,
            "deterministicConstruction": True,
            "manualBlenderExecutionRequired": True,
        },
    )
    write_json(
        output_dir / METADATA_FILENAMES["validation"],
        {
            "assetId": ASSET_ID,
            "readyForManualGeneration": True,
            "previousRegisteredVersion": PREVIOUS_REGISTERED_VERSION,
            "targetRevisionVersion": ASSET_VERSION,
            "outputDirectoryInsideRepo": True,
            "applicationsWriteBlocked": True,
            "deterministicPathConstruction": True,
            "identityContractSchemaId": "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
            "identityMetadataReady": True,
            "finalBlendExistsBeforeManualSave": False,
            "finalGlbsGenerated": False,
        },
    )


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for collection in list(bpy.data.collections):
        if collection.users == 0:
            bpy.data.collections.remove(collection)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)
    for curve in list(bpy.data.curves):
        if curve.users == 0:
            bpy.data.curves.remove(curve)


def ensure_collection(parent_collection, name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if collection.name not in parent_collection.children.keys():
        parent_collection.children.link(collection)
    return collection


def create_root_structure():
    scene_root = bpy.context.scene.collection
    asset_collection = bpy.data.collections.new(ASSET_ID)
    scene_root.children.link(asset_collection)

    collections = {}
    for name in COLLECTION_NAMES:
        collections[name] = ensure_collection(asset_collection, name)
        if name.startswith("LOD_"):
            apply_identity_properties(collections[name], name, lod_label=name)
            collections[name]["growgo_lod_label"] = name
        else:
            apply_identity_properties(collections[name], name)

    asset_collection["asset_id"] = ASSET_ID
    asset_collection["source_recipe_id"] = SOURCE_RECIPE_ID
    asset_collection["registry_recipe_id"] = REGISTRY_RECIPE_ID
    apply_identity_properties(asset_collection, "ROOT_COLLECTION")
    return asset_collection, collections


def create_materials():
    materials = {}
    for material_name, slot_name, base_color, roughness in MATERIAL_SPECS:
        material = bpy.data.materials.get(material_name)
        if material is None:
            material = bpy.data.materials.new(material_name)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is None:
            fail(f"Missing Principled BSDF for {material_name}.")
        principled.inputs["Base Color"].default_value = base_color
        principled.inputs["Roughness"].default_value = roughness
        material["palette_slot"] = slot_name
        apply_identity_properties(
            material,
            f"MATERIAL_{slot_name.upper().replace(' ', '_')}",
            exported_identity_source="metadata",
        )
        materials[slot_name] = material

    validate_palette(materials)
    return materials


def validate_palette(materials):
    flower_red = materials["flower red"].node_tree.nodes["Principled BSDF"].inputs[
        "Base Color"
    ].default_value
    leaf_mid = materials["leaf mid"].node_tree.nodes["Principled BSDF"].inputs[
        "Base Color"
    ].default_value
    if flower_red[0] < flower_red[1]:
        fail("Bottlebrush flower red should remain warmer than foliage green.")
    if leaf_mid[1] < leaf_mid[2]:
        fail("Bottlebrush leaf mid should not drift into electric blue leaves.")
    if max(leaf_mid[0], leaf_mid[1], leaf_mid[2]) < 0.08:
        fail("Bottlebrush foliage should not become pure black foliage.")
    if flower_red[0] > 0.95 and flower_red[2] > 0.7:
        fail("Bottlebrush flowers should not drift into neon magenta flowers.")


def add_empty(name, location=(0.0, 0.0, 0.0), collection=None):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.location = location
    if collection is not None:
        collection.objects.link(empty)
    else:
        bpy.context.scene.collection.objects.link(empty)
    return empty


def parent_to_root(obj, root):
    obj.parent = root
    obj.matrix_parent_inverse = root.matrix_world.inverted()


def move_object_to_collection(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def create_cylinder(name, location, rotation, scale, vertices, material):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=1.0,
        depth=1.0,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    obj.scale = scale
    assign_material(obj, material)
    return obj


def create_leaf_cluster(name, location, rotation, scale, material):
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=1,
        radius=1.0,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{DEPENDENCY_IDS[2]}_{name.split(ASSET_ID + '_', 1)[-1]}_MESH"
    obj.scale = scale
    assign_material(obj, material)
    return obj


def create_flower_cluster(name, location, rotation, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=12,
        ring_count=8,
        radius=1.0,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{DEPENDENCY_IDS[3]}_{name.split(ASSET_ID + '_', 1)[-1]}_MESH"
    obj.scale = scale
    assign_material(obj, material)
    return obj


def assign_material(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)
    if obj.data is not None:
        if "_FLOWER_" in obj.name:
            apply_identity_properties(
                obj.data,
                "FLOWER_CLUSTER_MESH",
                dependency_id=DEPENDENCY_IDS[3],
                exported_identity_source="metadata",
            )
        elif "_LEAF_" in obj.name:
            apply_identity_properties(
                obj.data,
                "LEAF_CLUSTER_MESH",
                dependency_id=DEPENDENCY_IDS[2],
                exported_identity_source="metadata",
            )
        elif "_BRANCH_" in obj.name:
            apply_identity_properties(
                obj.data,
                "BRANCH_MESH",
                dependency_id=DEPENDENCY_IDS[1],
                exported_identity_source="metadata",
            )
        elif "_TRUNK_" in obj.name:
            apply_identity_properties(
                obj.data,
                "TRUNK_MESH",
                dependency_id=DEPENDENCY_IDS[0],
                exported_identity_source="metadata",
            )
        else:
            apply_identity_properties(obj.data, "MESH")


def link_close_lod(root, collections, materials):
    objects = []

    trunk_component = add_empty(f"{ASSET_ID}_TRUNK", collection=collections["LOD_CLOSE"])
    branch_component = add_empty(f"{ASSET_ID}_BRANCH", collection=collections["LOD_CLOSE"])
    leaf_component = add_empty(f"{ASSET_ID}_LEAF_CLUSTER", collection=collections["LOD_CLOSE"])
    flower_component = add_empty(f"{ASSET_ID}_FLOWER_CLUSTER", collection=collections["LOD_CLOSE"])
    socket_component = add_empty(f"{ASSET_ID}_GROUND_SOCKET", collection=collections["LOD_CLOSE"])
    apply_identity_properties(
        trunk_component,
        "TRUNK",
        lod_label="LOD_CLOSE",
        dependency_id=DEPENDENCY_IDS[0],
    )
    apply_identity_properties(
        branch_component,
        "BRANCH",
        lod_label="LOD_CLOSE",
        dependency_id=DEPENDENCY_IDS[1],
    )
    apply_identity_properties(
        leaf_component,
        "LEAF_CLUSTER",
        lod_label="LOD_CLOSE",
        dependency_id=DEPENDENCY_IDS[2],
    )
    apply_identity_properties(
        flower_component,
        "FLOWER_CLUSTER",
        lod_label="LOD_CLOSE",
        dependency_id=DEPENDENCY_IDS[3],
    )
    apply_identity_properties(
        socket_component,
        "GROUND_SOCKET",
        lod_label="LOD_CLOSE",
        dependency_id=DEPENDENCY_IDS[4],
    )
    for component in (
        trunk_component,
        branch_component,
        leaf_component,
        flower_component,
        socket_component,
    ):
        parent_to_root(component, root)

    trunk = create_cylinder(
        f"{ASSET_ID}_TRUNK_MAIN_001",
        (0.0, 0.0, 1.55),
        (0.02, 0.04, 0.01),
        (0.18, 0.15, 3.1),
        10,
        materials["trunk"],
    )
    objects.append(trunk)
    parent_to_root(trunk, trunk_component)
    apply_identity_properties(
        trunk, "TRUNK", lod_label="LOD_CLOSE", dependency_id=DEPENDENCY_IDS[0]
    )

    branch_specs = (
        (
            f"{ASSET_ID}_BRANCH_PRIMARY_001",
            (0.0, 0.02, 2.16),
            (0.0, 0.34, 0.44),
            (0.08, 0.07, 1.1),
        ),
        (
            f"{ASSET_ID}_BRANCH_SECONDARY_001",
            (0.0, -0.03, 2.42),
            (0.0, -0.42, -0.38),
            (0.07, 0.06, 0.95),
        ),
        (
            f"{ASSET_ID}_BRANCH_SIDE_001",
            (0.0, 0.05, 2.55),
            (0.10, 0.52, 0.82),
            (0.05, 0.05, 0.74),
        ),
    )
    for name, location, rotation, scale in branch_specs:
        branch = create_cylinder(name, location, rotation, scale, 8, materials["branch"])
        apply_identity_properties(
            branch,
            "BRANCH",
            lod_label="LOD_CLOSE",
            dependency_id=DEPENDENCY_IDS[1],
        )
        parent_to_root(branch, branch_component)
        objects.append(branch)

    for name, location, rotation, scale, material_slot in CLOSE_LEAF_SPECS:
        leaf = create_leaf_cluster(
            name, location, rotation, scale, materials[material_slot]
        )
        apply_identity_properties(
            leaf,
            "LEAF_CLUSTER",
            lod_label="LOD_CLOSE",
            dependency_id=DEPENDENCY_IDS[2],
        )
        parent_to_root(leaf, leaf_component)
        objects.append(leaf)

    for name, location, rotation, scale, material_slot in CLOSE_FLOWER_SPECS:
        flower = create_flower_cluster(
            name, location, rotation, scale, materials[material_slot]
        )
        apply_identity_properties(
            flower,
            "FLOWER_CLUSTER",
            lod_label="LOD_CLOSE",
            dependency_id=DEPENDENCY_IDS[3],
        )
        parent_to_root(flower, flower_component)
        objects.append(flower)

    ground_socket = create_cylinder(
        f"{ASSET_ID}_GROUND_SOCKET_001",
        (0.0, 0.0, 0.12),
        (0.0, 0.0, 0.0),
        (0.24, 0.24, 0.18),
        8,
        materials["branch"],
    )
    ground_socket.display_type = "WIRE"
    apply_identity_properties(
        ground_socket,
        "GROUND_SOCKET",
        lod_label="LOD_CLOSE",
        dependency_id=DEPENDENCY_IDS[4],
    )
    parent_to_root(ground_socket, socket_component)
    objects.append(ground_socket)

    for obj in objects:
        move_object_to_collection(obj, collections["LOD_CLOSE"])

    create_identity_anchor(
        collections["LOD_CLOSE"],
        root,
        IDENTITY_CONTRACT_V2,
        "LOD_CLOSE",
    )

    return objects


def duplicate_for_lod(source_objects, root, collection, keep_names, lod_label):
    clones = []
    source_lookup = {obj.name: obj for obj in source_objects}
    for name in keep_names:
        source = source_lookup[name]
        clone = source.copy()
        clone.data = source.data.copy()
        clone.name = f"{source.name}_{collection.name}"
        if clone.data is not None:
            clone.data.name = f"{clone.name}_MESH"
        collection.objects.link(clone)
        parent_to_root(clone, root)
        if "_FLOWER_" in clone.name:
            apply_identity_properties(
                clone,
                "FLOWER_CLUSTER",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[3],
            )
            apply_identity_properties(
                clone.data,
                "FLOWER_CLUSTER_MESH",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[3],
                exported_identity_source="metadata",
            )
        elif "_LEAF_" in clone.name:
            apply_identity_properties(
                clone,
                "LEAF_CLUSTER",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[2],
            )
            apply_identity_properties(
                clone.data,
                "LEAF_CLUSTER_MESH",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[2],
                exported_identity_source="metadata",
            )
        elif "_BRANCH_" in clone.name:
            apply_identity_properties(
                clone,
                "BRANCH",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[1],
            )
            apply_identity_properties(
                clone.data,
                "BRANCH_MESH",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[1],
                exported_identity_source="metadata",
            )
        elif "_TRUNK_" in clone.name:
            apply_identity_properties(
                clone,
                "TRUNK",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[0],
            )
            apply_identity_properties(
                clone.data,
                "TRUNK_MESH",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[0],
                exported_identity_source="metadata",
            )
        else:
            apply_identity_properties(
                clone,
                "GROUND_SOCKET",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[4],
            )
            apply_identity_properties(
                clone.data,
                "GROUND_SOCKET_MESH",
                lod_label=lod_label,
                dependency_id=DEPENDENCY_IDS[4],
                exported_identity_source="metadata",
            )
        clones.append(clone)
    return clones


def build_other_lods(source_objects, collections):
    gameplay_root = add_empty(ROOT_NAMES["gameplay"], collection=collections["LOD_GAMEPLAY"])
    map_root = add_empty(ROOT_NAMES["map"], collection=collections["LOD_MAP"])
    apply_identity_properties(gameplay_root, "ROOT", lod_label="LOD_GAMEPLAY")
    apply_identity_properties(map_root, "ROOT", lod_label="LOD_MAP")

    duplicate_for_lod(
        source_objects,
        gameplay_root,
        collections["LOD_GAMEPLAY"],
        GAMEPLAY_KEEP,
        "LOD_GAMEPLAY",
    )
    duplicate_for_lod(
        source_objects,
        map_root,
        collections["LOD_MAP"],
        MAP_KEEP,
        "LOD_MAP",
    )

    create_identity_anchor(
        collections["LOD_GAMEPLAY"],
        gameplay_root,
        IDENTITY_CONTRACT_V2,
        "LOD_GAMEPLAY",
    )
    create_identity_anchor(
        collections["LOD_MAP"],
        map_root,
        IDENTITY_CONTRACT_V2,
        "LOD_MAP",
    )

    return gameplay_root, map_root


def create_export_metadata_objects(collections):
    export_metadata = add_empty(
        f"{ASSET_ID}_EXPORT_METADATA",
        collection=collections["EXPORT_METADATA"],
    )
    apply_identity_properties(export_metadata, "EXPORT_METADATA")
    export_metadata["growgo_reference_pipeline"] = "GROWGO_ASSET_FACTORY_REFERENCE_PIPELINE"
    export_metadata["growgo_visual_targets"] = json.dumps(
        [
            "GrowGo papercut 2.5D style",
            "lightweight mobile geometry",
            "Australian native vegetation identity",
            "road/trail placement suitability",
        ],
        sort_keys=True,
    )


def main():
    emit(GENERATION_MARKER_START)
    ensure_blender_version()
    output_dir = ensure_output_directory()
    ensure_final_output_targets_safe(output_dir)
    write_repository_metadata(output_dir)

    reset_scene()
    asset_collection, collections = create_root_structure()
    materials = create_materials()

    close_root = add_empty(ROOT_NAMES["close"], collection=collections["LOD_CLOSE"])
    apply_identity_properties(close_root, "ROOT", lod_label="LOD_CLOSE")
    close_objects = link_close_lod(close_root, collections, materials)
    build_other_lods(close_objects, collections)
    create_export_metadata_objects(collections)

    bpy.context.scene["growgo_asset_id"] = ASSET_ID
    bpy.context.scene["growgo_source_recipe_id"] = SOURCE_RECIPE_ID
    bpy.context.scene["growgo_registry_recipe_id"] = REGISTRY_RECIPE_ID
    bpy.context.scene["growgo_reference_pipeline"] = "GROWGO_ASSET_FACTORY_REFERENCE_PIPELINE"
    bpy.context.scene["growgo_bootstrap_state"] = json.dumps(BOOTSTRAP_STATE, sort_keys=True)
    bpy.context.scene["growgo_identity_contract_v2"] = json.dumps(
        IDENTITY_CONTRACT_V2, sort_keys=True
    )
    bpy.context.scene["growgo_manual_authoring_ready"] = True
    asset_collection["growgo_manual_authoring_ready"] = True

    emit(GENERATION_MARKER_READY)
    emit(GENERATION_MARKER_COMPLETE)


if __name__ == "__main__":
    main()
