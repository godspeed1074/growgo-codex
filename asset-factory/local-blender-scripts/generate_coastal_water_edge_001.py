"""
Manual Blender 4.2 LTS generator for COASTAL_WATER_EDGE_001_v001.

Run this script inside Blender. It creates deterministic, lightweight
papercut 2.5D-compatible shoreline transition geometry with CLOSE, GAMEPLAY,
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


ASSET_ID = "COASTAL_WATER_EDGE_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "COASTAL_WATER_EDGE_RECIPE_001"
ASSET_VERSION = "v001"
VERSIONED_ASSET_STEM = f"{ASSET_ID}_{ASSET_VERSION}"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_COASTAL_WATER_EDGE_001"
LOD_PROFILE = "NATURE_LIGHTWEIGHT_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
DEPENDENCY_IDS = (
    "MOD_WATER_EDGE_SHORE_BAND_001",
    "MOD_WATER_EDGE_WET_MARGIN_001",
    "MOD_WATER_EDGE_GROUND_SOCKET_001",
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
    "generate_coastal_water_edge_001.py",
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
GENERATION_START = "S197_2_COASTAL_WATER_EDGE_GENERATION_START"
GENERATION_READY = "S197_2_COASTAL_WATER_EDGE_READY_FOR_MANUAL_SAVE"

ROOT_NAMES = {
    "close": f"{ASSET_ID}_LOD_CLOSE_ROOT",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY_ROOT",
    "map": f"{ASSET_ID}_LOD_MAP_ROOT",
}
IDENTITY_ANCHOR_NAMES = {
    "close": "COASTAL_WATER_EDGE_001_LOD_CLOSE_IDENTITY_ANCHOR",
    "gameplay": "COASTAL_WATER_EDGE_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
    "map": "COASTAL_WATER_EDGE_001_LOD_MAP_IDENTITY_ANCHOR",
}

MATERIAL_SPECS = (
    (f"{ASSET_ID}_MATERIAL_DRY_BANK", "dry_bank", (0.72, 0.69, 0.52, 1.0)),
    (f"{ASSET_ID}_MATERIAL_WET_MARGIN", "wet_margin", (0.48, 0.63, 0.56, 1.0)),
)

# Offset shoreline strips keep the asset deterministic and repeat-ready while
# giving the water edge enough layered depth to read from front, side, and 45
# degree views without using transparency or simulated water effects.
CLOSE_STRIP_SPECS = (
    ("BANK_001", (-0.56, 0.08, 0.14), math.radians(-12), (0.34, 0.10, 0.10), "dry_bank"),
    ("BANK_002", (-0.20, -0.10, 0.20), math.radians(-5), (0.38, 0.10, 0.12), "dry_bank"),
    ("BANK_003", (0.18, 0.10, 0.18), math.radians(6), (0.34, 0.10, 0.11), "dry_bank"),
    ("BANK_004", (0.54, -0.06, 0.12), math.radians(14), (0.26, 0.10, 0.09), "dry_bank"),
    ("WET_001", (-0.42, -0.02, 0.08), math.radians(-10), (0.28, 0.08, 0.06), "wet_margin"),
    ("WET_002", (-0.02, 0.02, 0.10), math.radians(0), (0.32, 0.08, 0.06), "wet_margin"),
    ("WET_003", (0.36, -0.04, 0.08), math.radians(12), (0.24, 0.08, 0.05), "wet_margin"),
)
GAMEPLAY_STRIP_SPECS = (
    CLOSE_STRIP_SPECS[0],
    CLOSE_STRIP_SPECS[1],
    CLOSE_STRIP_SPECS[2],
    CLOSE_STRIP_SPECS[4],
    CLOSE_STRIP_SPECS[5],
)
MAP_STRIP_SPECS = (
    ("BANK_MAP_001", (-0.18, 0.04, 0.12), math.radians(-6), (0.36, 0.08, 0.08), "dry_bank"),
    ("BANK_MAP_002", (0.22, -0.02, 0.12), math.radians(8), (0.30, 0.08, 0.08), "dry_bank"),
    ("WET_MAP_001", (0.02, 0.00, 0.06), 0.0, (0.26, 0.06, 0.04), "wet_margin"),
)
EDGE_PEBBLE_SPECS = {
    "close": (
        ("PEBBLE_001", (-0.30, 0.18, 0.12), (0.09, 0.06, 0.05)),
        ("PEBBLE_002", (0.02, -0.14, 0.10), (0.10, 0.06, 0.05)),
        ("PEBBLE_003", (0.30, 0.14, 0.10), (0.08, 0.05, 0.05)),
    ),
    "gameplay": (
        ("PEBBLE_001", (-0.14, 0.10, 0.10), (0.08, 0.05, 0.04)),
        ("PEBBLE_002", (0.22, -0.06, 0.10), (0.08, 0.05, 0.04)),
    ),
    "map": (
        ("PEBBLE_001", (0.06, 0.04, 0.08), (0.08, 0.05, 0.04)),
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
        material.roughness = 0.90
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
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.38, depth=0.05)
    obj = bpy.context.object
    obj.name = f"{ASSET_ID}_{lod_label}_GROUND_SOCKET"
    obj.location = (0.0, 0.0, 0.03)
    obj.data.name = f"{obj.name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "GROUND_SOCKET", lod_label, DEPENDENCY_IDS[2])
    return obj


def add_strip(name, location, lean_y, scale, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = (0.0, lean_y, 0.0)
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "SHORE_BAND", lod_label, DEPENDENCY_IDS[0])
    obj["growgo_papercut_2_5d"] = True
    obj["growgo_mobile_first"] = True
    obj["growgo_repeat_ready"] = True
    obj["growgo_deterministic_placement_compatible"] = True
    return obj


def add_pebble(name, location, scale, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "WET_MARGIN_DETAIL", lod_label, DEPENDENCY_IDS[1])
    obj["growgo_papercut_2_5d"] = True
    obj["growgo_mobile_first"] = True
    return obj


def create_asset_structure():
    root_collection = create_collection(ASSET_ID)
    geometry = create_collection("GEOMETRY", root_collection)
    lod_collections = {
        "close": create_collection("LOD_CLOSE", root_collection),
        "gameplay": create_collection("LOD_GAMEPLAY", root_collection),
        "map": create_collection("LOD_MAP", root_collection),
    }
    asset_root = add_empty(ASSET_ID, root_collection)
    write_identity_properties(
        root_collection,
        IDENTITY_CONTRACT_V2,
        component_role="ROOT_COLLECTION",
        exported_identity_source="metadata",
    )
    root_collection["growgo_identity_contract_v2"] = json.dumps(
        IDENTITY_CONTRACT_V2, sort_keys=True
    )
    asset_root["growgo_asset_id"] = ASSET_ID
    asset_root["growgo_recipe_id"] = SOURCE_RECIPE_ID
    asset_root["growgo_version"] = ASSET_VERSION
    return root_collection, geometry, lod_collections, asset_root


def create_lod_root(lod_key, lod_label, lod_collection, geometry_collection, asset_root):
    root = add_empty(ROOT_NAMES[lod_key], geometry_collection)
    root.parent = asset_root
    write_identity_properties(
        root,
        IDENTITY_CONTRACT_V2,
        component_role="LOD_ROOT",
        lod_label=lod_label,
        exported_identity_source="metadata",
    )
    root["growgo_lod_label"] = lod_label
    anchor = create_identity_anchor(lod_collection, root, IDENTITY_CONTRACT_V2, lod_label)
    if anchor.name != IDENTITY_ANCHOR_NAMES[lod_key]:
        raise RuntimeError(
            f"Unexpected identity anchor {anchor.name}; expected {IDENTITY_ANCHOR_NAMES[lod_key]}."
        )
    return root, anchor


def populate_lod(lod_key, lod_label, root, geometry_collection, lod_collection, materials):
    add_ground_socket(lod_collection, root, lod_label, materials["wet_margin"])
    if lod_key == "close":
        strip_specs = CLOSE_STRIP_SPECS
    elif lod_key == "gameplay":
        strip_specs = GAMEPLAY_STRIP_SPECS
    else:
        strip_specs = MAP_STRIP_SPECS

    for suffix, location, lean_y, scale, material_slot in strip_specs:
        add_strip(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            lean_y,
            scale,
            materials[material_slot],
            lod_collection,
            root,
            lod_label,
        )

    for suffix, location, scale in EDGE_PEBBLE_SPECS[lod_key]:
        add_pebble(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            scale,
            materials["wet_margin"],
            geometry_collection,
            root,
            lod_label,
        )


def write_setup_manifest(source_dir):
    payload = {
        "schemaId": "ASSET_FACTORY_V1_AUTHORING_SETUP_RECORD_001",
        "assetId": ASSET_ID,
        "recipeId": SOURCE_RECIPE_ID,
        "version": ASSET_VERSION,
        "variantId": VARIANT_ID,
        "paletteId": PALETTE_ID,
        "lodProfile": LOD_PROFILE,
        "expectedBlendFilename": EXPECTED_BLEND_FILENAME,
        "expectedBlendLocation": str(
            Path("asset-factory-workspace")
            / "production"
            / "COASTAL_NATURE_FAMILY_001"
            / "source"
            / EXPECTED_BLEND_FILENAME
        ),
        "expectedExportOutputs": [
            f"{ASSET_ID}_LOD_CLOSE.glb",
            f"{ASSET_ID}_LOD_GAMEPLAY.glb",
            f"{ASSET_ID}_LOD_MAP.glb",
        ],
        "manualBlenderExecutionRequired": True,
        "blenderLaunched": False,
        "blendGenerated": False,
        "finalGlbsGenerated": False,
        "registered": False,
        "promoted": False,
        "published": False,
        "runtimeActivated": False,
        "targetRevisionVersion": ASSET_VERSION,
        "shorelineTransitionAsset": True,
        "papercutStyle": True,
        "mobileLightweight": True,
    }
    manifest_path = (
        source_dir.parent / "validation" / "coastal-water-edge-authoring-manifest.json"
    )
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


def main():
    emit(GENERATION_START)
    ensure_blender_version()
    source_dir = ensure_source_directory()
    reset_scene()
    root_collection, geometry_collection, lod_collections, asset_root = create_asset_structure()
    materials = create_materials()
    _ = root_collection
    for lod_key, lod_label in (
        ("close", "LOD_CLOSE"),
        ("gameplay", "LOD_GAMEPLAY"),
        ("map", "LOD_MAP"),
    ):
        root, _anchor = create_lod_root(
            lod_key, lod_label, lod_collections[lod_key], geometry_collection, asset_root
        )
        populate_lod(
            lod_key, lod_label, root, geometry_collection, lod_collections[lod_key], materials
        )
    write_setup_manifest(source_dir)
    emit(GENERATION_READY)


if __name__ == "__main__":
    main()
