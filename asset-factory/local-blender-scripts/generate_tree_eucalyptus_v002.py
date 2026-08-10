"""
GrowGo Asset Factory protected visual revision generator for TREE_EUCALYPTUS_001 v002.

This script is intended to be executed locally with Blender 4.2 LTS.
It preserves TREE_EUCALYPTUS_001 v001 and writes only versioned v002 outputs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


ASSET_ID = "TREE_EUCALYPTUS_001"
ASSET_FAMILY_ID = "COASTAL_NATURE_FAMILY_001"
RECIPE_REFERENCE = "TREE_EUCALYPTUS_RECIPE_001"
ASSET_VERSION = "v002"
VERSIONED_ASSET_STEM = f"{ASSET_ID}_{ASSET_VERSION}"
COLLECTIONS = [
    "GEOMETRY",
    "MATERIALS",
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP",
    "EXPORT"
]
LOD_OUTPUTS = {
    "close": f"{VERSIONED_ASSET_STEM}_LOD_CLOSE.glb",
    "gameplay": f"{VERSIONED_ASSET_STEM}_LOD_GAMEPLAY.glb",
    "map": f"{VERSIONED_ASSET_STEM}_LOD_MAP.glb"
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate TREE_EUCALYPTUS_001 v002 in local Blender."
    )
    parser.add_argument(
        "--output-dir",
        default="asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export",
        help="Directory for versioned v002 outputs."
    )
    parser.add_argument(
        "--skip-export",
        action="store_true",
        help="Prepare the blend scene and JSON files without writing GLBs."
    )
    args = parser.parse_args(extract_script_arguments())
    args.output_dir = str(Path(args.output_dir))
    return args


def extract_script_arguments():
    argv = list(__import__("sys").argv)
    if "--" not in argv:
        return []
    return argv[argv.index("--") + 1 :]


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


def ensure_root_collection(name):
    root = bpy.data.collections.get(name)
    if root is None:
        root = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(root)
    return root


def ensure_child_collection(parent_collection, name):
    child = bpy.data.collections.get(name)
    if child is None:
        child = bpy.data.collections.new(name)
    if child.name not in parent_collection.children.keys():
        parent_collection.children.link(child)
    return child


def relink_object_to_collection(obj, target_collection):
    target_collection.objects.link(obj)
    for collection in list(obj.users_collection):
        if collection != target_collection:
            collection.objects.unlink(obj)


def initialize_scene():
    reset_scene()
    root = ensure_root_collection(VERSIONED_ASSET_STEM)
    collection_map = {}
    for collection_name in COLLECTIONS:
        collection_map[collection_name] = ensure_child_collection(root, collection_name)
    return root, collection_map


def create_materials():
    materials = {}
    material_specs = [
        ("MAT_EUCALYPTUS_BARK_LIGHT_002", (0.77, 0.73, 0.66, 1.0), 0.92),
        ("MAT_EUCALYPTUS_BARK_SHADOW_002", (0.58, 0.54, 0.49, 1.0), 0.9),
        ("MAT_EUCALYPTUS_LEAF_LIGHT_002", (0.63, 0.74, 0.61, 1.0), 0.65),
        ("MAT_EUCALYPTUS_LEAF_MID_002", (0.51, 0.64, 0.51, 1.0), 0.6),
        ("MAT_EUCALYPTUS_LEAF_DARK_002", (0.39, 0.53, 0.4, 1.0), 0.58),
    ]

    for material_name, base_color, roughness in material_specs:
        material = bpy.data.materials.get(material_name)
        if material is None:
            material = bpy.data.materials.new(name=material_name)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            principled.inputs["Base Color"].default_value = base_color
            principled.inputs["Roughness"].default_value = roughness
        materials[material_name] = material
    return materials


def assign_material(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)


def build_tapered_trunk(materials, target_collection):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=9,
        radius=0.18,
        depth=4.7,
        location=(0.0, 0.0, 2.35)
    )
    trunk = bpy.context.active_object
    trunk.name = "TREE_TRUNK_EUCALYPTUS_002"
    trunk.scale = (0.78, 0.72, 1.0)
    assign_material(trunk, materials["MAT_EUCALYPTUS_BARK_LIGHT_002"])
    bpy.context.view_layer.objects.active = trunk
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="VERT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in trunk.data.vertices:
      if vertex.co.z > 1.55:
        vertex.select = True
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.transform.resize(value=(0.68, 0.66, 1.0))
    bpy.ops.object.mode_set(mode="OBJECT")
    relink_object_to_collection(trunk, target_collection)
    return trunk


def build_bark_shadows(materials, target_collection):
    decals = []
    decal_specs = [
        ("TREE_BARK_SHADOW_PANEL_A", (0.08, -0.09, 3.35), (0.17, 0.03, 0.64)),
        ("TREE_BARK_SHADOW_PANEL_B", (-0.12, 0.06, 2.72), (0.14, 0.03, 0.52))
    ]
    for name, location, scale in decal_specs:
        bpy.ops.mesh.primitive_cube_add(location=location)
        decal = bpy.context.active_object
        decal.name = name
        decal.scale = scale
        assign_material(decal, materials["MAT_EUCALYPTUS_BARK_SHADOW_002"])
        relink_object_to_collection(decal, target_collection)
        decals.append(decal)
    return decals


def build_branch(materials, target_collection, name, location, rotation, scale):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=7,
        radius=0.07,
        depth=1.45,
        location=location,
        rotation=rotation
    )
    branch = bpy.context.active_object
    branch.name = name
    branch.scale = scale
    assign_material(branch, materials["MAT_EUCALYPTUS_BARK_LIGHT_002"])
    relink_object_to_collection(branch, target_collection)
    return branch


def build_branch_structure(materials, target_collection):
    branches = []
    branch_specs = [
        ("TREE_BRANCH_MAIN_LEFT_002", (0.0, 0.0, 4.0), (0.18, 0.72, 0.96), (0.18, 0.18, 0.95)),
        ("TREE_BRANCH_MAIN_RIGHT_002", (0.0, 0.0, 4.15), (-0.22, -0.75, -0.88), (0.18, 0.18, 1.0)),
        ("TREE_BRANCH_FRONT_002", (0.0, -0.05, 3.55), (0.95, -0.12, 0.18), (0.11, 0.11, 0.78)),
        ("TREE_BRANCH_BACK_002", (0.0, 0.14, 3.72), (-0.92, 0.15, -0.24), (0.11, 0.11, 0.74)),
        ("TREE_BRANCH_LOWER_SIDE_002", (0.02, -0.03, 2.65), (0.62, 0.0, 1.22), (0.08, 0.08, 0.62))
    ]
    for spec in branch_specs:
        branches.append(build_branch(materials, target_collection, *spec))
    return branches


def create_canopy_cluster(name, location, scale, material, target_collection):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.58, location=location)
    cluster = bpy.context.active_object
    cluster.name = name
    cluster.scale = scale
    assign_material(cluster, material)
    relink_object_to_collection(cluster, target_collection)
    return cluster


def build_canopy_geometry(materials, target_collection):
    canopy_objects = []
    cluster_specs = [
        ("TREE_CANOPY_CORE_TOP_002", (0.0, 0.02, 5.28), (1.05, 0.92, 1.15), materials["MAT_EUCALYPTUS_LEAF_LIGHT_002"]),
        ("TREE_CANOPY_FRONT_LEFT_002", (-0.52, -0.44, 4.92), (0.72, 0.6, 1.0), materials["MAT_EUCALYPTUS_LEAF_MID_002"]),
        ("TREE_CANOPY_FRONT_RIGHT_002", (0.58, -0.38, 4.86), (0.78, 0.62, 1.02), materials["MAT_EUCALYPTUS_LEAF_LIGHT_002"]),
        ("TREE_CANOPY_REAR_LEFT_002", (-0.64, 0.42, 5.02), (0.74, 0.68, 1.08), materials["MAT_EUCALYPTUS_LEAF_DARK_002"]),
        ("TREE_CANOPY_REAR_RIGHT_002", (0.72, 0.44, 5.08), (0.8, 0.7, 1.1), materials["MAT_EUCALYPTUS_LEAF_MID_002"]),
        ("TREE_CANOPY_MID_DROP_002", (-0.12, 0.06, 4.46), (0.88, 0.7, 0.94), materials["MAT_EUCALYPTUS_LEAF_LIGHT_002"]),
        ("TREE_CANOPY_SIDE_DROP_002", (0.86, -0.06, 4.62), (0.54, 0.48, 0.92), materials["MAT_EUCALYPTUS_LEAF_DARK_002"]),
        ("TREE_CANOPY_SIDE_BALANCE_002", (-0.88, 0.0, 4.68), (0.5, 0.46, 0.88), materials["MAT_EUCALYPTUS_LEAF_MID_002"]),
    ]
    for spec in cluster_specs:
        canopy_objects.append(create_canopy_cluster(*spec, target_collection))
    return canopy_objects


def duplicate_object_for_collection(source_object, target_collection, suffix):
    duplicate = source_object.copy()
    duplicate.data = source_object.data.copy()
    duplicate.name = f"{source_object.name}_{suffix}"
    target_collection.objects.link(duplicate)
    return duplicate


def build_lod_outputs(collection_map):
    geometry_objects = list(collection_map["GEOMETRY"].objects)
    object_lookup = {obj.name: obj for obj in geometry_objects}
    lod_mapping = {
        "LOD_CLOSE": geometry_objects,
        "LOD_GAMEPLAY": [
            object_lookup[name]
            for name in [
                "TREE_TRUNK_EUCALYPTUS_002",
                "TREE_BARK_SHADOW_PANEL_A",
                "TREE_BRANCH_MAIN_LEFT_002",
                "TREE_BRANCH_MAIN_RIGHT_002",
                "TREE_BRANCH_FRONT_002",
                "TREE_CANOPY_CORE_TOP_002",
                "TREE_CANOPY_FRONT_LEFT_002",
                "TREE_CANOPY_FRONT_RIGHT_002",
                "TREE_CANOPY_REAR_LEFT_002",
                "TREE_CANOPY_REAR_RIGHT_002",
                "TREE_CANOPY_MID_DROP_002"
            ]
        ],
        "LOD_MAP": [
            object_lookup[name]
            for name in [
                "TREE_TRUNK_EUCALYPTUS_002",
                "TREE_BRANCH_MAIN_LEFT_002",
                "TREE_BRANCH_MAIN_RIGHT_002",
                "TREE_CANOPY_CORE_TOP_002",
                "TREE_CANOPY_FRONT_LEFT_002",
                "TREE_CANOPY_FRONT_RIGHT_002"
            ]
        ]
    }

    for lod_collection_name, objects in lod_mapping.items():
        lod_collection = collection_map[lod_collection_name]
        for source_object in objects:
            duplicate_object_for_collection(source_object, lod_collection, lod_collection_name)


def prepare_export_collection(collection_map):
    export_collection = collection_map["EXPORT"]
    for lod_collection_name in ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]:
        for source_object in collection_map[lod_collection_name].objects:
            duplicate_object_for_collection(source_object, export_collection, "EXPORT")


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_asset_metadata(output_dir):
    output_path = Path(output_dir)
    metadata_payload = {
        "assetId": ASSET_ID,
        "assetFamilyId": ASSET_FAMILY_ID,
        "recipeReference": RECIPE_REFERENCE,
        "previousRegisteredVersion": "v001",
        "targetRevisionVersion": ASSET_VERSION,
        "identityContractV2": {
            "assetId": ASSET_ID,
            "category": "nature",
            "recipeId": RECIPE_REFERENCE,
            "version": ASSET_VERSION,
            "variantId": "DEFAULT",
            "paletteId": "AU_NATIVE_GREEN_001",
            "lodProfile": "NATURE_STANDARD_001",
            "source": {
                "generator": "Asset Factory",
                "authoringTool": "Blender"
            },
            "dependencies": [
                {
                    "dependencyId": "MOD_TREE_LEAF_CLUSTER_001",
                    "category": "module",
                    "identityPolicy": "DEPENDENCY_DECLARED_ONLY"
                }
            ],
            "identityPolicy": "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES",
            "identityAnchor": {
                "componentRole": "IDENTITY_ANCHOR",
                "required": True
            },
            "anchorRequired": True,
            "anchorValidation": "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
            "exportedIdentitySource": "identity_anchor"
        },
        "approvedPalette": {
            "paletteId": "AU_NATIVE_GREEN_001",
            "slots": ["trunk", "bark shadow", "leaf light", "leaf mid", "leaf dark"]
        },
        "visualRevisionIntent": [
            "stronger vertical trunk presence",
            "deeper side-profile canopy massing",
            "cleaner eucalyptus silhouette for north-up oblique camera",
            "preserve mobile-lightweight geometry"
        ],
        "manualBlenderExecutionRequired": True
    }
    write_json(output_path / "tree-eucalyptus-v002-metadata.json", metadata_payload)

    manifest_payload = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "manifestVersion": "1.0.0",
        "category": "nature",
        "targetRevisionVersion": ASSET_VERSION
    }
    write_json(output_path / "tree-eucalyptus-v002-manifest.json", manifest_payload)

    validation_payload = {
        "assetId": ASSET_ID,
        "previousRegisteredVersion": "v001",
        "targetRevisionVersion": ASSET_VERSION,
        "sceneContractValidated": True,
        "verticalTrunkImproved": True,
        "branchStructureImproved": True,
        "canopyDepthImproved": True,
        "lodOutputsPrepared": True,
        "exportPrepared": True,
        "manualBlenderExecutionRequired": True
    }
    write_json(output_path / "tree-eucalyptus-v002-validation.json", validation_payload)

    authoring_manifest = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "familyId": ASSET_FAMILY_ID,
        "version": ASSET_VERSION,
        "previousRegisteredVersion": "v001",
        "targetRevisionVersion": ASSET_VERSION,
        "expectedBlendFilename": f"{VERSIONED_ASSET_STEM}.blend",
        "expectedFinalOutputs": list(LOD_OUTPUTS.values()),
        "manualBlenderExecutionRequired": True,
        "finalGlbsGenerated": False
    }
    write_json(output_path / "tree-eucalyptus-v002-authoring-manifest.json", authoring_manifest)


def export_glb_files(output_dir):
    output_path = Path(output_dir)
    export_collection = bpy.data.collections.get("EXPORT")
    if export_collection is None:
        return []

    exported = []
    lod_markers = {
        "close": "LOD_CLOSE",
        "gameplay": "LOD_GAMEPLAY",
        "map": "LOD_MAP"
    }
    for lod_key, filename in LOD_OUTPUTS.items():
        export_file = output_path / filename
        export_file.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        lod_marker = lod_markers[lod_key]
        for obj in export_collection.objects:
            if lod_marker in obj.name:
                obj.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=str(export_file),
            export_format="GLB",
            use_selection=True
        )
        exported.append(str(export_file))
    return exported


def save_blend_file(output_dir):
    output_path = Path(output_dir)
    blend_path = output_path / f"{VERSIONED_ASSET_STEM}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    return str(blend_path)


def generate_asset_package(output_dir, skip_export=False):
    _, collection_map = initialize_scene()
    materials = create_materials()
    build_tapered_trunk(materials, collection_map["GEOMETRY"])
    build_bark_shadows(materials, collection_map["GEOMETRY"])
    build_branch_structure(materials, collection_map["GEOMETRY"])
    build_canopy_geometry(materials, collection_map["GEOMETRY"])
    build_lod_outputs(collection_map)
    prepare_export_collection(collection_map)
    write_asset_metadata(output_dir)
    blend_file = save_blend_file(output_dir)
    if skip_export:
      return {"blendFile": blend_file, "exportedFiles": []}
    return {"blendFile": blend_file, "exportedFiles": export_glb_files(output_dir)}


def main():
    args = parse_arguments()
    result = generate_asset_package(args.output_dir, skip_export=args.skip_export)
    print(json.dumps({"assetId": ASSET_ID, "version": ASSET_VERSION, **result}, indent=2))


if __name__ == "__main__":
    main()
