"""
Manual Blender 4.2 LTS generator for SHRUB_COASTAL_LOW_001_v001.

Run this script inside Blender. It creates deterministic, mobile-first
papercut 2.5D geometry and three identity-anchored LOD roots. It does not
export GLBs, register, publish, or activate the asset.
"""

from __future__ import annotations

import importlib.util
import json
import math
import sys
from pathlib import Path

import bpy


ASSET_ID = "SHRUB_COASTAL_LOW_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "SHRUB_COASTAL_LOW_RECIPE_001"
ASSET_VERSION = "v001"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_COASTAL_SHRUB_NATIVE_001"
LOD_PROFILE = "NATURE_STANDARD_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
DEPENDENCY_IDS = (
    "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001",
    "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001",
    "MOD_SHRUB_FLOWER_CLUSTER_COASTAL_001",
    "MOD_SHRUB_GROUND_SOCKET_COASTAL_001",
)
REPO_ROOT = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex"
).resolve()
BOOTSTRAP_PATH = (
    REPO_ROOT / "asset-factory" / "local-blender-scripts" / "growgo_blender_bootstrap.py"
).resolve()

if not BOOTSTRAP_PATH.is_file():
    raise RuntimeError(f"GrowGo Blender bootstrap helper was missing: {BOOTSTRAP_PATH}")
bootstrap_spec = importlib.util.spec_from_file_location(
    "growgo_blender_bootstrap", BOOTSTRAP_PATH
)
if bootstrap_spec is None or bootstrap_spec.loader is None:
    raise RuntimeError(f"Could not load GrowGo Blender bootstrap: {BOOTSTRAP_PATH}")
growgo_blender_bootstrap = importlib.util.module_from_spec(bootstrap_spec)
bootstrap_spec.loader.exec_module(growgo_blender_bootstrap)
BOOTSTRAP_STATE = growgo_blender_bootstrap.bootstrap_local_blender_scripts(
    "generate_shrub_coastal_low_001.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import create_identity_anchor, write_identity_properties


WORKSPACE_ROOT = (REPO_ROOT / "asset-factory-workspace").resolve()
EXPECTED_OUTPUT_DIR = (
    WORKSPACE_ROOT / "production" / "COASTAL_SHRUB_FAMILY_001" / "export"
).resolve()
EXPECTED_BLEND_FILENAME = f"{ASSET_ID}_{ASSET_VERSION}.blend"
GENERATION_START = "S188_1_SHRUB_COASTAL_LOW_GENERATION_START"
GENERATION_READY = "S188_1_SHRUB_COASTAL_LOW_READY_FOR_MANUAL_SAVE"

ROOT_NAMES = {
    "close": f"{ASSET_ID}_LOD_CLOSE_ROOT",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY_ROOT",
    "map": f"{ASSET_ID}_LOD_MAP_ROOT",
}
IDENTITY_ANCHOR_NAMES = {
    "close": "SHRUB_COASTAL_LOW_001_LOD_CLOSE_IDENTITY_ANCHOR",
    "gameplay": "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
    "map": "SHRUB_COASTAL_LOW_001_LOD_MAP_IDENTITY_ANCHOR",
}

# Shared materials are intentionally few, matte, and reused across every LOD.
MATERIAL_SPECS = (
    (f"{ASSET_ID}_MATERIAL_BRANCH", "branch", (0.34, 0.27, 0.19, 1.0)),
    (f"{ASSET_ID}_MATERIAL_LEAF_LIGHT", "leaf light", (0.48, 0.62, 0.37, 1.0)),
    (f"{ASSET_ID}_MATERIAL_LEAF_MID", "leaf mid", (0.30, 0.47, 0.28, 1.0)),
    (f"{ASSET_ID}_MATERIAL_FLOWER", "flower", (0.82, 0.60, 0.43, 1.0)),
)

# Explicit layouts avoid randomness. Shallow Y offsets retain papercut depth.
CLOSE_CLUSTER_SPECS = (
    ("CLUSTER_001", (-0.62, 0.04, 0.62), (0.72, 0.24, 0.48), "leaf mid"),
    ("CLUSTER_002", (-0.24, -0.10, 0.82), (0.82, 0.26, 0.56), "leaf light"),
    ("CLUSTER_003", (0.18, 0.08, 0.76), (0.86, 0.25, 0.54), "leaf mid"),
    ("CLUSTER_004", (0.58, -0.05, 0.58), (0.68, 0.23, 0.44), "leaf light"),
    ("CLUSTER_005", (0.00, -0.16, 0.48), (0.94, 0.27, 0.46), "leaf mid"),
    ("CLUSTER_006", (0.38, 0.14, 0.94), (0.58, 0.20, 0.40), "leaf light"),
)
GAMEPLAY_CLUSTER_SPECS = (
    CLOSE_CLUSTER_SPECS[0],
    CLOSE_CLUSTER_SPECS[1],
    CLOSE_CLUSTER_SPECS[2],
    CLOSE_CLUSTER_SPECS[3],
)
MAP_CLUSTER_SPECS = (
    ("CLUSTER_MAP_001", (-0.36, 0.0, 0.66), (0.96, 0.22, 0.58), "leaf mid"),
    ("CLUSTER_MAP_002", (0.38, 0.0, 0.68), (0.94, 0.22, 0.56), "leaf light"),
)

IDENTITY_CONTRACT_V2 = {
    "assetId": ASSET_ID,
    "category": ASSET_CATEGORY,
    "recipeId": SOURCE_RECIPE_ID,
    "version": ASSET_VERSION,
    "variantId": VARIANT_ID,
    "paletteId": PALETTE_ID,
    "lodProfile": LOD_PROFILE,
    "source": {"generator": "Asset Factory", "authoringTool": "Blender"},
    "dependencies": [
        {
            "dependencyId": dependency_id,
            "category": "module",
            "identityPolicy": "DEPENDENCY_DECLARED_ONLY",
        }
        for dependency_id in DEPENDENCY_IDS
    ],
    "identityPolicy": IDENTITY_POLICY,
    "identityAnchor": {"componentRole": "IDENTITY_ANCHOR", "required": True},
    "anchorRequired": True,
    "anchorValidation": "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
    "exportedIdentitySource": "identity_anchor",
}


def emit(marker):
    print(marker)
    sys.stdout.flush()


def ensure_blender_version():
    if bpy.app.version[:2] != (4, 2):
        raise RuntimeError(f"Expected Blender 4.2.x, found {bpy.app.version!r}.")


def ensure_output_directory():
    output_dir = EXPECTED_OUTPUT_DIR.resolve()
    if str(output_dir).startswith("/Applications"):
        raise RuntimeError(f"Refusing to write inside /Applications: {output_dir}")
    try:
        output_dir.relative_to(REPO_ROOT)
    except ValueError as error:
        raise RuntimeError(f"Output directory is outside GrowGo: {output_dir}") from error
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def create_collection(name, parent=None):
    collection = bpy.data.collections.new(name)
    (parent.children if parent else bpy.context.scene.collection.children).link(collection)
    return collection


def create_materials():
    materials = {}
    for name, slot, color in MATERIAL_SPECS:
        material = bpy.data.materials.new(name)
        material.diffuse_color = color
        material.roughness = 0.82
        material.use_nodes = False
        material["growgo_palette_id"] = PALETTE_ID
        material["growgo_palette_slot"] = slot
        material["growgo_shared_material"] = True
        write_identity_properties(
            material,
            IDENTITY_CONTRACT_V2,
            component_role="SHARED_MATERIAL",
            dependency_id=DEPENDENCY_IDS[1],
            exported_identity_source="metadata",
        )
        materials[slot] = material
    return materials


def move_to_collection(obj, collection):
    for source in list(obj.users_collection):
        source.objects.unlink(obj)
    collection.objects.link(obj)


def add_empty(name, collection):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    return obj


def apply_component_identity(obj, role, lod_label, dependency_id):
    write_identity_properties(
        obj,
        IDENTITY_CONTRACT_V2,
        component_role=role,
        lod_label=lod_label,
        dependency_id=dependency_id,
        exported_identity_source="metadata",
    )
    if obj.data is not None:
        write_identity_properties(
            obj.data,
            IDENTITY_CONTRACT_V2,
            component_role=f"{role}_MESH",
            lod_label=lod_label,
            dependency_id=dependency_id,
            exported_identity_source="metadata",
        )


def add_branch(name, location, scale, rotation_y, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.08, depth=1.0)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = (0.0, rotation_y, 0.0)
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "BRANCH_CLUSTER", lod_label, DEPENDENCY_IDS[0])
    return obj


def add_cluster(name, location, scale, material, collection, root, lod_label, segments):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    obj["growgo_papercut_2_5d"] = True
    obj["growgo_mobile_first"] = True
    obj["growgo_segment_budget"] = segments
    apply_component_identity(obj, "FOLIAGE_CLUSTER", lod_label, DEPENDENCY_IDS[1])
    return obj


def add_flower(name, location, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.11)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = (1.0, 0.45, 0.7)
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "FLOWER_CLUSTER", lod_label, DEPENDENCY_IDS[2])
    return obj


def build_lod(key, lod_label, cluster_specs, collections, materials, flower_count):
    collection = collections[key]
    root = add_empty(ROOT_NAMES[key], collection)
    write_identity_properties(
        root,
        IDENTITY_CONTRACT_V2,
        component_role="ROOT",
        lod_label=lod_label,
        exported_identity_source="metadata",
    )
    branch_count = {"close": 5, "gameplay": 3, "map": 1}[key]
    for index in range(branch_count):
        offset = index - ((branch_count - 1) / 2)
        add_branch(
            f"{ASSET_ID}_{lod_label}_BRANCH_{index + 1:03d}",
            (offset * 0.24, 0.0, 0.38 + abs(offset) * 0.05),
            (0.72, 0.72, 0.58 + abs(offset) * 0.10),
            math.radians(offset * 22),
            materials["branch"],
            collection,
            root,
            lod_label,
        )
    for index, (suffix, location, scale, slot) in enumerate(cluster_specs):
        add_cluster(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            scale,
            materials[slot],
            collection,
            root,
            lod_label,
            20 if key == "close" else 12 if key == "gameplay" else 8,
        )
        if index < flower_count:
            add_flower(
                f"{ASSET_ID}_{lod_label}_FLOWER_{index + 1:03d}",
                (location[0], location[1] - 0.03, location[2] + scale[2] * 0.72),
                materials["flower"],
                collection,
                root,
                lod_label,
            )
    anchor = create_identity_anchor(
        collection, root, IDENTITY_CONTRACT_V2, lod_label
    )
    if anchor.name != IDENTITY_ANCHOR_NAMES[key]:
        raise RuntimeError(
            f"Unexpected identity anchor {anchor.name}; expected {IDENTITY_ANCHOR_NAMES[key]}."
        )
    return root


def write_setup_metadata(output_dir):
    manifest = {
        "assetId": ASSET_ID,
        "recipeReference": SOURCE_RECIPE_ID,
        "familyId": "COASTAL_SHRUB_FAMILY_001",
        "version": ASSET_VERSION,
        "expectedBlendFilename": EXPECTED_BLEND_FILENAME,
        "expectedFinalOutputs": [
            f"{ASSET_ID}_LOD_CLOSE.glb",
            f"{ASSET_ID}_LOD_GAMEPLAY.glb",
            f"{ASSET_ID}_LOD_MAP.glb",
        ],
        "manualBlenderExecutionRequired": True,
        "finalGlbsGenerated": False,
    }
    (output_dir / "shrub-coastal-low-authoring-manifest.json").write_text(
        f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8"
    )


def main():
    emit(GENERATION_START)
    ensure_blender_version()
    output_dir = ensure_output_directory()
    final_blend = output_dir / EXPECTED_BLEND_FILENAME
    if final_blend.exists():
        raise RuntimeError(f"Refusing to overwrite existing source: {final_blend}")

    reset_scene()
    asset_collection = create_collection(ASSET_ID)
    collections = {
        "close": create_collection("LOD_CLOSE", asset_collection),
        "gameplay": create_collection("LOD_GAMEPLAY", asset_collection),
        "map": create_collection("LOD_MAP", asset_collection),
    }
    materials = create_materials()
    build_lod("close", "LOD_CLOSE", CLOSE_CLUSTER_SPECS, collections, materials, 4)
    build_lod(
        "gameplay",
        "LOD_GAMEPLAY",
        GAMEPLAY_CLUSTER_SPECS,
        collections,
        materials,
        2,
    )
    build_lod("map", "LOD_MAP", MAP_CLUSTER_SPECS, collections, materials, 0)

    asset_collection["growgo_identity_contract_v2"] = json.dumps(
        IDENTITY_CONTRACT_V2, sort_keys=True
    )
    asset_collection["growgo_reference_pipeline"] = (
        "TREE_EUCALYPTUS_001,TREE_BOTTLEBRUSH_001"
    )
    bpy.context.scene["growgo_asset_id"] = ASSET_ID
    bpy.context.scene["growgo_recipe_id"] = SOURCE_RECIPE_ID
    bpy.context.scene["growgo_bootstrap_state"] = json.dumps(
        BOOTSTRAP_STATE, sort_keys=True
    )
    bpy.context.scene["growgo_mobile_first_geometry"] = True
    bpy.context.scene["growgo_papercut_2_5d_compatible"] = True
    write_setup_metadata(output_dir)
    emit(GENERATION_READY)


if __name__ == "__main__":
    main()
