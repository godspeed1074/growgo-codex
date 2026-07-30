"""
Manual Blender 4.2 LTS generator for COASTAL_ROCK_CLUSTER_001_v001.

Run this script inside Blender. It creates deterministic, lightweight
papercut 2.5D-compatible coastal rock-cluster geometry with CLOSE, GAMEPLAY,
and MAP LOD roots plus identity anchors. It does not export GLBs, register,
publish, or activate runtime usage.
"""

from __future__ import annotations

import importlib.util
import json
import math
import sys
from pathlib import Path

import bpy


ASSET_ID = "COASTAL_ROCK_CLUSTER_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "COASTAL_ROCK_CLUSTER_RECIPE_001"
ASSET_VERSION = "v001"
VERSIONED_ASSET_STEM = f"{ASSET_ID}_{ASSET_VERSION}"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_COASTAL_ROCK_001"
LOD_PROFILE = "NATURE_LIGHTWEIGHT_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
DEPENDENCY_IDS = (
    "MOD_ROCK_CLUSTER_CORE_COASTAL_001",
    "MOD_ROCK_CLUSTER_DETAIL_COASTAL_001",
    "MOD_ROCK_CLUSTER_GROUND_SOCKET_COASTAL_001",
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
    "generate_coastal_rock_cluster_001.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import create_identity_anchor, write_identity_properties


WORKSPACE_ROOT = (REPO_ROOT / "asset-factory-workspace").resolve()
EXPECTED_SOURCE_DIR = (
    WORKSPACE_ROOT / "production" / "COASTAL_NATURE_FAMILY_001" / "source"
).resolve()
EXPECTED_BLEND_FILENAME = f"{VERSIONED_ASSET_STEM}.blend"
GENERATION_START = "S196_2_COASTAL_ROCK_CLUSTER_GENERATION_START"
GENERATION_READY = "S196_2_COASTAL_ROCK_CLUSTER_READY_FOR_MANUAL_SAVE"

ROOT_NAMES = {
    "close": f"{ASSET_ID}_LOD_CLOSE_ROOT",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY_ROOT",
    "map": f"{ASSET_ID}_LOD_MAP_ROOT",
}
IDENTITY_ANCHOR_NAMES = {
    "close": "COASTAL_ROCK_CLUSTER_001_LOD_CLOSE_IDENTITY_ANCHOR",
    "gameplay": "COASTAL_ROCK_CLUSTER_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
    "map": "COASTAL_ROCK_CLUSTER_001_LOD_MAP_IDENTITY_ANCHOR",
}

MATERIAL_SPECS = (
    (f"{ASSET_ID}_MATERIAL_STONE", "stone", (0.58, 0.57, 0.56, 1.0)),
    (f"{ASSET_ID}_MATERIAL_EDGE", "edge", (0.70, 0.68, 0.62, 1.0)),
)

# Offset clustered rock layouts keep the generator deterministic while building
# natural silhouettes that repeat well for procedural scattering without an
# obvious tile-like footprint.
CLOSE_CORE_SPECS = (
    ("CORE_001", (-0.46, 0.12, 0.22), math.radians(-18), (0.30, 0.22, 0.24)),
    ("CORE_002", (-0.12, -0.14, 0.30), math.radians(-8), (0.36, 0.24, 0.32)),
    ("CORE_003", (0.22, 0.10, 0.34), math.radians(9), (0.32, 0.22, 0.30)),
    ("CORE_004", (0.54, -0.04, 0.22), math.radians(20), (0.24, 0.18, 0.22)),
)
GAMEPLAY_CORE_SPECS = (
    CLOSE_CORE_SPECS[0],
    CLOSE_CORE_SPECS[1],
    CLOSE_CORE_SPECS[2],
)
MAP_CORE_SPECS = (
    ("CORE_MAP_001", (-0.18, 0.04, 0.24), math.radians(-8), (0.34, 0.20, 0.24)),
    ("CORE_MAP_002", (0.22, -0.02, 0.22), math.radians(10), (0.28, 0.18, 0.22)),
)
DETAIL_SPECS = {
    "close": (
        ("DETAIL_001", (-0.26, 0.24, 0.18), (0.14, 0.10, 0.11)),
        ("DETAIL_002", (0.06, -0.22, 0.18), (0.16, 0.10, 0.12)),
        ("DETAIL_003", (0.38, 0.18, 0.16), (0.12, 0.10, 0.10)),
    ),
    "gameplay": (
        ("DETAIL_001", (-0.18, 0.16, 0.16), (0.12, 0.09, 0.09)),
        ("DETAIL_002", (0.26, -0.14, 0.16), (0.12, 0.09, 0.09)),
    ),
    "map": (
        ("DETAIL_001", (0.00, 0.08, 0.14), (0.12, 0.08, 0.08)),
    ),
}

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


def ensure_source_directory():
    source_dir = EXPECTED_SOURCE_DIR.resolve()
    try:
        source_dir.relative_to(REPO_ROOT)
    except ValueError as error:
        raise RuntimeError(f"Source directory is outside GrowGo: {source_dir}") from error
    source_dir.mkdir(parents=True, exist_ok=True)
    return source_dir


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
        material.roughness = 0.92
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


def add_ground_socket(collection, root, lod_label, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.34, depth=0.08)
    obj = bpy.context.object
    obj.name = f"{ASSET_ID}_{lod_label}_GROUND_SOCKET"
    obj.location = (0.0, 0.0, 0.05)
    obj.data.name = f"{obj.name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "GROUND_SOCKET", lod_label, DEPENDENCY_IDS[2])
    return obj


def add_rock_core(name, location, lean_y, scale, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = (math.radians(10), lean_y, math.radians(6))
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    obj["growgo_papercut_2_5d"] = True
    obj["growgo_mobile_first"] = True
    apply_component_identity(obj, "ROCK_CORE", lod_label, DEPENDENCY_IDS[0])
    return obj


def add_rock_detail(name, location, scale, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18)
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
    apply_component_identity(obj, "ROCK_DETAIL", lod_label, DEPENDENCY_IDS[1])
    return obj


def build_lod(key, lod_label, core_specs, collections, materials):
    collection = collections[key]
    root = add_empty(ROOT_NAMES[key], collection)
    write_identity_properties(
        root,
        IDENTITY_CONTRACT_V2,
        component_role="ROOT",
        lod_label=lod_label,
        exported_identity_source="metadata",
    )
    add_ground_socket(collection, root, lod_label, materials["edge"])
    for suffix, location, lean_y, scale in core_specs:
        add_rock_core(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            lean_y,
            scale,
            materials["stone"],
            collection,
            root,
            lod_label,
        )
    for suffix, location, scale in DETAIL_SPECS[key]:
        add_rock_detail(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            scale,
            materials["edge"],
            collection,
            root,
            lod_label,
        )
    anchor = create_identity_anchor(collection, root, IDENTITY_CONTRACT_V2, lod_label)
    if anchor.name != IDENTITY_ANCHOR_NAMES[key]:
        raise RuntimeError(
            f"Unexpected identity anchor {anchor.name}; expected {IDENTITY_ANCHOR_NAMES[key]}."
        )
    return root


def write_setup_metadata(source_dir):
    manifest = {
        "assetId": ASSET_ID,
        "recipeReference": SOURCE_RECIPE_ID,
        "familyId": "COASTAL_NATURE_FAMILY_001",
        "version": ASSET_VERSION,
        "targetRevisionVersion": ASSET_VERSION,
        "expectedBlendFilename": EXPECTED_BLEND_FILENAME,
        "expectedFinalOutputs": [
            f"{ASSET_ID}_LOD_CLOSE.glb",
            f"{ASSET_ID}_LOD_GAMEPLAY.glb",
            f"{ASSET_ID}_LOD_MAP.glb",
        ],
        "manualBlenderExecutionRequired": True,
        "finalGlbsGenerated": False,
        "sourceExportContract": {
            "blendSourceFolder": "source",
            "glbExportFolder": "export",
        },
    }
    (source_dir / "coastal-rock-cluster-authoring-manifest.json").write_text(
        f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8"
    )


def main():
    emit(GENERATION_START)
    ensure_blender_version()
    source_dir = ensure_source_directory()
    final_blend = source_dir / EXPECTED_BLEND_FILENAME
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
    build_lod("close", "LOD_CLOSE", CLOSE_CORE_SPECS, collections, materials)
    build_lod("gameplay", "LOD_GAMEPLAY", GAMEPLAY_CORE_SPECS, collections, materials)
    build_lod("map", "LOD_MAP", MAP_CORE_SPECS, collections, materials)

    asset_collection["growgo_identity_contract_v2"] = json.dumps(
        IDENTITY_CONTRACT_V2, sort_keys=True
    )
    asset_collection["growgo_reference_pipeline"] = (
        "TREE_EUCALYPTUS_001,TREE_BOTTLEBRUSH_001,SHRUB_COASTAL_LOW_001,COASTAL_GROUND_COVER_001"
    )
    asset_collection["growgo_repeated_placement_ready"] = True
    asset_collection["growgo_procedural_scattering_ready"] = True
    asset_collection["growgo_no_obvious_tile_appearance"] = True
    bpy.context.scene["growgo_asset_id"] = ASSET_ID
    bpy.context.scene["growgo_recipe_id"] = SOURCE_RECIPE_ID
    bpy.context.scene["growgo_bootstrap_state"] = json.dumps(
        BOOTSTRAP_STATE, sort_keys=True
    )
    bpy.context.scene["growgo_mobile_first_geometry"] = True
    bpy.context.scene["growgo_papercut_2_5d_compatible"] = True
    write_setup_metadata(source_dir)
    emit(GENERATION_READY)


if __name__ == "__main__":
    main()
