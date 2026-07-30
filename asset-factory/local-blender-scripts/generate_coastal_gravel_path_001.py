"""
Manual Blender 4.2 LTS generator for COASTAL_GRAVEL_PATH_001_v001.

Run this script inside Blender. It creates deterministic, lightweight
papercut 2.5D-compatible coastal gravel path geometry with CLOSE, GAMEPLAY,
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


ASSET_ID = "COASTAL_GRAVEL_PATH_001"
ASSET_CATEGORY = "environment_navigation_terrain"
SOURCE_RECIPE_ID = "COASTAL_GRAVEL_PATH_RECIPE_001"
ASSET_VERSION = "v001"
VERSIONED_ASSET_STEM = f"{ASSET_ID}_{ASSET_VERSION}"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_COASTAL_GRAVEL_PATH_001"
LOD_PROFILE = "PATHWAY_LIGHTWEIGHT_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
DEPENDENCY_IDS = (
    "MOD_PATH_STRAIGHT_SEGMENT_001",
    "MOD_PATH_EDGE_BLEND_001",
    "MOD_PATH_GROUND_SOCKET_COASTAL_001",
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
    "generate_coastal_gravel_path_001.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import create_identity_anchor, write_identity_properties


WORKSPACE_ROOT = (REPO_ROOT / "asset-factory-workspace").resolve()
EXPECTED_SOURCE_DIR = (
    WORKSPACE_ROOT / "production" / "COASTAL_PATHWAY_FAMILY_001" / "source"
).resolve()
EXPECTED_BLEND_FILENAME = f"{VERSIONED_ASSET_STEM}.blend"
GENERATION_START = "S198_2_COASTAL_GRAVEL_PATH_GENERATION_START"
GENERATION_READY = "S198_2_COASTAL_GRAVEL_PATH_READY_FOR_MANUAL_SAVE"

ROOT_NAMES = {
    "close": f"{ASSET_ID}_LOD_CLOSE_ROOT",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY_ROOT",
    "map": f"{ASSET_ID}_LOD_MAP_ROOT",
}
IDENTITY_ANCHOR_NAMES = {
    "close": "COASTAL_GRAVEL_PATH_001_LOD_CLOSE_IDENTITY_ANCHOR",
    "gameplay": "COASTAL_GRAVEL_PATH_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
    "map": "COASTAL_GRAVEL_PATH_001_LOD_MAP_IDENTITY_ANCHOR",
}

MATERIAL_SPECS = (
    (f"{ASSET_ID}_MATERIAL_GRAVEL", "gravel", (0.67, 0.65, 0.58, 1.0)),
    (f"{ASSET_ID}_MATERIAL_EDGE_BLEND", "edge_blend", (0.58, 0.62, 0.46, 1.0)),
)

# Deterministic module layout keeps the path snap-compatible, repeat-ready,
# and readable as a coastal walking surface without dense terrain sculpting.
# growgo_papercut_2_5d
# growgo_mobile_first
# growgo_repeat_ready
# growgo_deterministic_placement_compatible
CLOSE_PATH_SPECS = (
    ("STRAIGHT_A", (-0.54, 0.00, 0.05), (0.28, 0.16, 0.03), 0.0),
    ("STRAIGHT_B", (-0.18, 0.02, 0.05), (0.30, 0.16, 0.03), math.radians(1)),
    ("STRAIGHT_C", (0.18, -0.02, 0.05), (0.30, 0.16, 0.03), math.radians(-1)),
    ("STRAIGHT_D", (0.54, 0.01, 0.05), (0.26, 0.16, 0.03), 0.0),
)
GAMEPLAY_PATH_SPECS = (
    ("STRAIGHT_A", (-0.40, 0.00, 0.05), (0.34, 0.15, 0.03), 0.0),
    ("STRAIGHT_B", (0.00, 0.01, 0.05), (0.34, 0.15, 0.03), 0.0),
    ("STRAIGHT_C", (0.40, -0.01, 0.05), (0.30, 0.15, 0.03), 0.0),
)
MAP_PATH_SPECS = (
    ("STRAIGHT_MAP_A", (-0.22, 0.00, 0.04), (0.34, 0.12, 0.02), 0.0),
    ("STRAIGHT_MAP_B", (0.24, 0.00, 0.04), (0.34, 0.12, 0.02), 0.0),
)
EDGE_BLEND_SPECS = {
    "close": (
        ("EDGE_LEFT_A", (-0.34, 0.19, 0.04), (0.22, 0.05, 0.02), math.radians(6)),
        ("EDGE_RIGHT_A", (0.06, -0.19, 0.04), (0.24, 0.05, 0.02), math.radians(-5)),
        ("EDGE_LEFT_B", (0.44, 0.19, 0.04), (0.18, 0.05, 0.02), math.radians(7)),
    ),
    "gameplay": (
        ("EDGE_LEFT_A", (-0.18, 0.18, 0.04), (0.24, 0.05, 0.02), math.radians(5)),
        ("EDGE_RIGHT_A", (0.22, -0.18, 0.04), (0.24, 0.05, 0.02), math.radians(-5)),
    ),
    "map": (
        ("EDGE_LEFT_A", (-0.02, 0.15, 0.03), (0.22, 0.04, 0.02), 0.0),
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
            dependency_id=DEPENDENCY_IDS[1 if slot == "edge_blend" else 0],
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
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.object
    obj.name = f"{ASSET_ID}_{lod_label}_GROUND_SOCKET"
    obj.location = (0.0, 0.0, 0.02)
    obj.scale = (0.72, 0.28, 0.015)
    obj.data.name = f"{obj.name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "GROUND_SOCKET", lod_label, DEPENDENCY_IDS[2])
    return obj


def add_path_module(name, location, scale, yaw, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = (0.0, 0.0, yaw)
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "PATH_SEGMENT", lod_label, DEPENDENCY_IDS[0])
    return obj


def add_edge_module(name, location, scale, yaw, material, collection, root, lod_label):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = (0.0, 0.0, yaw)
    obj.data.name = f"{name}_MESH"
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    obj.parent = root
    apply_component_identity(obj, "EDGE_BLEND", lod_label, DEPENDENCY_IDS[1])
    return obj


def add_snap_markers(collection, root, lod_label):
    markers = []
    for side, location in (("SNAP_IN", (-0.72, 0.0, 0.06)), ("SNAP_OUT", (0.72, 0.0, 0.06))):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.04, location=location)
        obj = bpy.context.object
        obj.name = f"{ASSET_ID}_{lod_label}_{side}"
        obj.data.name = f"{obj.name}_MESH"
        move_to_collection(obj, collection)
        obj.parent = root
        apply_component_identity(obj, side, lod_label, DEPENDENCY_IDS[0])
        markers.append(obj)
    return markers


def create_lod(collection, lod_key, lod_label, root_name, anchor_name, materials):
    root = add_empty(root_name, collection)
    root.location = (0.0, 0.0, 0.0)
    write_identity_properties(
        root,
        IDENTITY_CONTRACT_V2,
        component_role="ROOT",
        lod_label=lod_label,
        exported_identity_source="metadata",
    )

    anchor = create_identity_anchor(collection, root, IDENTITY_CONTRACT_V2, lod_label)
    if anchor.name != anchor_name:
        raise RuntimeError(
            f"Unexpected identity anchor {anchor.name}; expected {anchor_name}."
        )

    path_specs = {
        "close": CLOSE_PATH_SPECS,
        "gameplay": GAMEPLAY_PATH_SPECS,
        "map": MAP_PATH_SPECS,
    }[lod_key]
    for suffix, location, scale, yaw in path_specs:
        add_path_module(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            scale,
            yaw,
            materials["gravel"],
            collection,
            root,
            lod_label,
        )

    for suffix, location, scale, yaw in EDGE_BLEND_SPECS[lod_key]:
        add_edge_module(
            f"{ASSET_ID}_{lod_label}_{suffix}",
            location,
            scale,
            yaw,
            materials["edge_blend"],
            collection,
            root,
            lod_label,
        )

    add_ground_socket(collection, root, lod_label, materials["edge_blend"])
    add_snap_markers(collection, root, lod_label)
    return root


def write_authoring_manifest(source_dir: Path):
    manifest = {
        "schemaId": "ASSET_FACTORY_V1_AUTHORING_SETUP_RECORD_001",
        "assetId": ASSET_ID,
        "recipeId": SOURCE_RECIPE_ID,
        "version": ASSET_VERSION,
        "variantId": VARIANT_ID,
        "paletteId": PALETTE_ID,
        "lodProfile": LOD_PROFILE,
        "expectedBlendFilename": EXPECTED_BLEND_FILENAME,
        "expectedBlendLocation": "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/COASTAL_GRAVEL_PATH_001_v001.blend",
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
        "modularPathAsset": True,
        "papercutStyle": True,
        "mobileLightweight": True,
    }
    validation_dir = source_dir.parent / "validation"
    validation_dir.mkdir(parents=True, exist_ok=True)
    (validation_dir / "coastal-gravel-path-authoring-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf8",
    )


def main():
    emit(GENERATION_START)
    ensure_blender_version()
    source_dir = ensure_source_directory()
    reset_scene()
    root_collection = create_collection(VERSIONED_ASSET_STEM)
    materials = create_materials()
    create_lod(
        root_collection,
        "close",
        "LOD_CLOSE",
        ROOT_NAMES["close"],
        IDENTITY_ANCHOR_NAMES["close"],
        materials,
    )
    create_lod(
        root_collection,
        "gameplay",
        "LOD_GAMEPLAY",
        ROOT_NAMES["gameplay"],
        IDENTITY_ANCHOR_NAMES["gameplay"],
        materials,
    )
    create_lod(
        root_collection,
        "map",
        "LOD_MAP",
        ROOT_NAMES["map"],
        IDENTITY_ANCHOR_NAMES["map"],
        materials,
    )
    write_authoring_manifest(source_dir)
    emit(GENERATION_READY)


if __name__ == "__main__":
    main()
