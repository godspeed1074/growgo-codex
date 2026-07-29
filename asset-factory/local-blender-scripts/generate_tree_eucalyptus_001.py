"""
Manual Blender-internal generator for TREE_EUCALYPTUS_001.

This script is intended to be run manually inside Blender 4.2 LTS. Codex does
not execute Blender for this asset. The script builds a deterministic papercut
2.5D eucalyptus tree, prepares three LOD roots, and leaves the user to inspect
the result and save the final blend manually.
"""

from __future__ import annotations

import math
import json
import importlib.util
import sys
from pathlib import Path

import bpy


ASSET_ID = "TREE_EUCALYPTUS_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
ASSET_VERSION = "v001"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_NATIVE_GREEN_001"
LOD_PROFILE = "NATURE_STANDARD_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS"
DEPENDENCY_IDS = ("MOD_TREE_LEAF_CLUSTER_001",)
REGISTRY_RECIPE_ID = "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"
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
    "generate_tree_eucalyptus_001.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import create_identity_anchor, write_identity_properties

WORKSPACE_ROOT = (REPO_ROOT / "asset-factory-workspace").resolve()
EXPECTED_OUTPUT_DIR = (
    WORKSPACE_ROOT / "production" / "COASTAL_NATURE_FAMILY_001" / "export"
).resolve()
GENERATION_MARKER_START = "S184_TREE_EUCALYPTUS_GENERATION_START"
GENERATION_MARKER_READY = "S184_TREE_EUCALYPTUS_GENERATION_READY_FOR_SAVE"
GENERATION_MARKER_COMPLETE = "S184_TREE_EUCALYPTUS_GENERATION_COMPLETE"

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
    (f"{ASSET_ID}_MATERIAL_TRUNK", "trunk", (0.56, 0.47, 0.36, 1.0), 0.84),
    (f"{ASSET_ID}_MATERIAL_BRANCH", "branch", (0.49, 0.41, 0.31, 1.0), 0.86),
    (
        f"{ASSET_ID}_MATERIAL_CANOPY_LIGHT",
        "canopy light",
        (0.61, 0.72, 0.56, 1.0),
        0.72,
    ),
    (
        f"{ASSET_ID}_MATERIAL_CANOPY_MID",
        "canopy mid",
        (0.44, 0.59, 0.43, 1.0),
        0.74,
    ),
    (
        f"{ASSET_ID}_MATERIAL_CANOPY_DARK",
        "canopy dark",
        (0.30, 0.43, 0.31, 1.0),
        0.78,
    ),
)

FORBIDDEN_PALETTE_DESCRIPTIONS = (
    "bright pink",
    "neon blue",
    "pure black foliage",
    "unrealistic random palettes",
)

METADATA_FILENAMES = {
    "manifest": "tree-eucalyptus-manifest.json",
    "metadata": "tree-eucalyptus-metadata.json",
    "validation": "tree-eucalyptus-validation.json",
}

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

    print(f"Resolved eucalyptus output directory: {output_dir}")
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
    final_blend_path = output_dir / f"{ASSET_ID}_v001.blend"
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
            "expectedBlendFilename": f"{ASSET_ID}_v001.blend",
            "expectedFinalOutputs": [
                f"{ASSET_ID}_LOD_CLOSE.glb",
                f"{ASSET_ID}_LOD_GAMEPLAY.glb",
                f"{ASSET_ID}_LOD_MAP.glb",
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
            "paletteSlots": [
                "trunk",
                "branch",
                "canopy light",
                "canopy mid",
                "canopy dark",
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
        if mesh_users_free(material):
            bpy.data.materials.remove(material)
    for curve in list(bpy.data.curves):
        if curve.users == 0:
            bpy.data.curves.remove(curve)


def mesh_users_free(material):
    return material.users == 0


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
    for slot_name in ("canopy light", "canopy mid", "canopy dark"):
        material = materials[slot_name]
        color = material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
        red, green, blue, _alpha = color
        if green < blue:
            fail(f"{slot_name} should not drift into neon blue foliage.")
        if max(red, green, blue) < 0.08:
            fail(f"{slot_name} should not become pure black foliage.")
        if red > 0.8 and blue > 0.6:
            fail(f"{slot_name} should not drift into bright pink foliage.")


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


def create_canopy_mass(name, location, rotation, scale, subdivisions, material):
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions,
        radius=1.0,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = f"{DEPENDENCY_IDS[0]}_{name.split(ASSET_ID + '_', 1)[-1]}_MESH"
    obj.scale = scale
    assign_material(obj, material)
    return obj


def assign_material(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)
    if obj.data is not None:
        if obj.name.startswith(f"{ASSET_ID}_CANOPY"):
            apply_identity_properties(
                obj.data,
                "LEAF_CLUSTER_MESH",
                dependency_id=DEPENDENCY_IDS[0],
                exported_identity_source="metadata",
            )
        else:
            apply_identity_properties(obj.data, "MESH")


def link_close_lod(root, collections, materials):
    objects = []

    trunk_component = add_empty(f"{ASSET_ID}_TRUNK", collection=collections["LOD_CLOSE"])
    branch_component = add_empty(f"{ASSET_ID}_BRANCH", collection=collections["LOD_CLOSE"])
    canopy_component = add_empty(f"{ASSET_ID}_CANOPY", collection=collections["LOD_CLOSE"])
    apply_identity_properties(trunk_component, "TRUNK", lod_label="LOD_CLOSE")
    apply_identity_properties(branch_component, "BRANCH", lod_label="LOD_CLOSE")
    apply_identity_properties(canopy_component, "CANOPY", lod_label="LOD_CLOSE")
    parent_to_root(trunk_component, root)
    parent_to_root(branch_component, root)
    parent_to_root(canopy_component, root)

    trunk = create_cylinder(
        f"{ASSET_ID}_TRUNK_001",
        (0.0, 0.0, 1.65),
        (0.03, 0.06, 0.02),
        (0.22, 0.18, 3.3),
        10,
        materials["trunk"],
    )
    objects.append(trunk)
    parent_to_root(trunk, trunk_component)
    apply_identity_properties(trunk, "TRUNK", lod_label="LOD_CLOSE")
    apply_identity_properties(trunk.data, "MESH", lod_label="LOD_CLOSE")

    branch_specs = (
        (f"{ASSET_ID}_BRANCH_LARGE_001_A", (0.0, 0.02, 2.45), (0.0, 0.45, 0.58), (0.10, 0.09, 1.5)),
        (f"{ASSET_ID}_BRANCH_LARGE_001_B", (0.0, -0.04, 2.72), (0.0, -0.42, -0.58), (0.09, 0.08, 1.3)),
        (f"{ASSET_ID}_BRANCH_SMALL_001_A", (0.0, 0.03, 2.05), (0.16, -0.66, -0.42), (0.06, 0.05, 0.92)),
        (f"{ASSET_ID}_BRANCH_SMALL_001_B", (0.0, 0.0, 2.88), (-0.18, 0.74, 0.24), (0.05, 0.05, 0.76)),
    )
    for name, location, rotation, scale in branch_specs:
        branch = create_cylinder(name, location, rotation, scale, 8, materials["branch"])
        apply_identity_properties(branch, "BRANCH", lod_label="LOD_CLOSE")
        apply_identity_properties(branch.data, "MESH", lod_label="LOD_CLOSE")
        parent_to_root(branch, branch_component)
        objects.append(branch)

    canopy_specs = (
        (
            f"{ASSET_ID}_CANOPY_001_A",
            (-0.38, 0.06, 4.05),
            (0.0, 0.12, 0.2),
            (0.86, 0.46, 0.94),
            1,
            materials["canopy light"],
        ),
        (
            f"{ASSET_ID}_CANOPY_001_B",
            (0.44, 0.14, 3.92),
            (0.0, -0.18, -0.1),
            (0.80, 0.42, 0.88),
            1,
            materials["canopy mid"],
        ),
        (
            f"{ASSET_ID}_CANOPY_001_C",
            (-0.08, -0.34, 4.22),
            (0.0, 0.02, -0.26),
            (0.92, 0.48, 0.98),
            1,
            materials["canopy dark"],
        ),
        (
            f"{ASSET_ID}_CANOPY_001_D",
            (0.22, -0.42, 3.64),
            (0.0, 0.08, 0.38),
            (0.66, 0.34, 0.72),
            1,
            materials["canopy mid"],
        ),
        (
            f"{ASSET_ID}_CANOPY_001_E",
            (-0.56, -0.16, 3.72),
            (0.0, -0.12, -0.14),
            (0.74, 0.38, 0.78),
            1,
            materials["canopy dark"],
        ),
    )
    for name, location, rotation, scale, subdivisions, material in canopy_specs:
        canopy = create_canopy_mass(name, location, rotation, scale, subdivisions, material)
        apply_identity_properties(canopy, "CANOPY", lod_label="LOD_CLOSE")
        apply_identity_properties(
            canopy.data,
            "LEAF_CLUSTER_MESH",
            lod_label="LOD_CLOSE",
            dependency_id=DEPENDENCY_IDS[0],
            exported_identity_source="metadata",
        )
        parent_to_root(canopy, canopy_component)
        objects.append(canopy)

    for obj in objects:
        move_object_to_collection(obj, collections["LOD_CLOSE"])

    create_identity_anchor(
        collections["LOD_CLOSE"],
        root,
        IDENTITY_CONTRACT_V2,
        "LOD_CLOSE",
    )

    return objects, {
        "TRUNK": trunk_component,
        "BRANCH": branch_component,
        "CANOPY": canopy_component,
    }


def duplicate_for_lod(source_objects, root, collection, keep_names, lod_label):
    clones = []
    source_lookup = {obj.name: obj for obj in source_objects}
    for name in keep_names:
        source = source_lookup[name]
        clone = source.copy()
        clone.data = source.data.copy()
        clone.name = f"{source.name}_{collection.name}"
        if clone.data is not None and "CANOPY" not in clone.name:
            clone.data.name = f"{clone.name}_MESH"
        collection.objects.link(clone)
        parent_to_root(clone, root)
        component_role = "CANOPY" if "CANOPY" in clone.name else "BRANCH" if "BRANCH" in clone.name else "TRUNK"
        apply_identity_properties(clone, component_role, lod_label=lod_label)
        if clone.data is not None:
            if "CANOPY" in clone.name:
                apply_identity_properties(
                    clone.data,
                    "LEAF_CLUSTER_MESH",
                    lod_label=lod_label,
                    dependency_id=DEPENDENCY_IDS[0],
                    exported_identity_source="metadata",
                )
            else:
                apply_identity_properties(clone.data, "MESH", lod_label=lod_label)
        clones.append(clone)
    return clones


def build_other_lods(source_objects, collections, materials):
    gameplay_root = add_empty(ROOT_NAMES["gameplay"], collection=collections["LOD_GAMEPLAY"])
    map_root = add_empty(ROOT_NAMES["map"], collection=collections["LOD_MAP"])
    apply_identity_properties(gameplay_root, "ROOT", lod_label="LOD_GAMEPLAY")
    apply_identity_properties(map_root, "ROOT", lod_label="LOD_MAP")

    gameplay_keep = (
        f"{ASSET_ID}_TRUNK_001",
        f"{ASSET_ID}_BRANCH_LARGE_001_A",
        f"{ASSET_ID}_BRANCH_LARGE_001_B",
        f"{ASSET_ID}_CANOPY_001_A",
        f"{ASSET_ID}_CANOPY_001_B",
        f"{ASSET_ID}_CANOPY_001_C",
    )
    map_keep = (
        f"{ASSET_ID}_TRUNK_001",
        f"{ASSET_ID}_CANOPY_001_A",
        f"{ASSET_ID}_CANOPY_001_C",
    )

    gameplay_objects = duplicate_for_lod(
        source_objects,
        gameplay_root,
        collections["LOD_GAMEPLAY"],
        gameplay_keep,
        "LOD_GAMEPLAY",
    )
    map_objects = duplicate_for_lod(
        source_objects,
        map_root,
        collections["LOD_MAP"],
        map_keep,
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

    # Simplify gameplay and map silhouettes in-place while keeping deterministic identity.
    for obj in gameplay_objects:
        if "CANOPY" in obj.name:
            obj.scale.y *= 0.94
        if "BRANCH_SMALL" in obj.name:
            obj.hide_set(True)

    for obj in map_objects:
        if "TRUNK" in obj.name:
            obj.scale.x *= 0.82
            obj.scale.y *= 0.82
            obj.scale.z *= 0.92
            assign_material(obj, materials["trunk"])
        if "CANOPY" in obj.name:
            obj.scale.x *= 1.08
            obj.scale.y *= 0.88
            obj.scale.z *= 0.92
            assign_material(obj, materials["canopy mid"])


def build_sockets(collections):
    ground_socket = add_empty(
        f"{ASSET_ID}_GROUND_SOCKET_001",
        location=(0.0, 0.0, 0.0),
        collection=collections["SOCKETS"],
    )
    landscape_socket = add_empty(
        f"{ASSET_ID}_LANDSCAPE_SOCKET_001",
        location=(0.0, 0.0, 0.0),
        collection=collections["SOCKETS"],
    )
    ground_socket["socket_type"] = "ground"
    landscape_socket["socket_type"] = "landscape"
    apply_identity_properties(ground_socket, "GROUND_SOCKET")
    apply_identity_properties(landscape_socket, "LANDSCAPE_SOCKET")


def write_metadata_texts(collections):
    manifest_text = bpy.data.texts.get("TREE_EUCALYPTUS_001_MANIFEST")
    if manifest_text is None:
        manifest_text = bpy.data.texts.new("TREE_EUCALYPTUS_001_MANIFEST")
    manifest_text.clear()
    manifest_text.write(
        "\n".join(
            (
                f"asset_id={ASSET_ID}",
                f"category={ASSET_CATEGORY}",
                f"source_recipe_id={SOURCE_RECIPE_ID}",
                f"version={ASSET_VERSION}",
                f"variant_id={VARIANT_ID}",
                f"palette_id={PALETTE_ID}",
                f"lod_profile={LOD_PROFILE}",
                f"identity_policy={IDENTITY_POLICY}",
                f"registry_recipe_id={REGISTRY_RECIPE_ID}",
                "lods=LOD_CLOSE,LOD_GAMEPLAY,LOD_MAP",
            )
        )
    )

    note_text = bpy.data.texts.get("TREE_EUCALYPTUS_001_SESSION_184_NOTES")
    if note_text is None:
        note_text = bpy.data.texts.new("TREE_EUCALYPTUS_001_SESSION_184_NOTES")
    note_text.clear()
    note_text.write(
        "\n".join(
            (
                "papercut_style=enabled",
                "interior_geometry=not_applicable",
                f"dependency_ids={','.join(DEPENDENCY_IDS)}",
                "palette_slots=trunk,branch,canopy light,canopy mid,canopy dark",
                "forbidden_palette=" + ", ".join(FORBIDDEN_PALETTE_DESCRIPTIONS),
            )
        )
    )

    metadata_collection = collections["EXPORT_METADATA"]
    metadata_collection["asset_id"] = ASSET_ID
    metadata_collection["source_recipe_id"] = SOURCE_RECIPE_ID
    metadata_collection["registry_recipe_id"] = REGISTRY_RECIPE_ID
    apply_identity_properties(metadata_collection, "EXPORT_METADATA")


def main():
    emit(GENERATION_MARKER_START)
    ensure_blender_version()
    output_dir = ensure_output_directory()
    ensure_final_output_targets_safe(output_dir)
    reset_scene()
    asset_collection, collections = create_root_structure()
    materials = create_materials()
    close_root = add_empty(ROOT_NAMES["close"], collection=collections["LOD_CLOSE"])
    apply_identity_properties(close_root, "ROOT", lod_label="LOD_CLOSE")
    close_objects, _component_roots = link_close_lod(close_root, collections, materials)
    build_other_lods(close_objects, collections, materials)
    build_sockets(collections)
    write_metadata_texts(collections)

    bpy.context.scene["asset_id"] = ASSET_ID
    bpy.context.scene["category"] = ASSET_CATEGORY
    bpy.context.scene["source_recipe_id"] = SOURCE_RECIPE_ID
    bpy.context.scene["registry_recipe_id"] = REGISTRY_RECIPE_ID
    bpy.context.scene["version"] = ASSET_VERSION
    bpy.context.scene["variant_id"] = VARIANT_ID
    bpy.context.scene["palette_id"] = PALETTE_ID
    bpy.context.scene["lod_profile"] = LOD_PROFILE
    bpy.context.scene["identity_policy"] = IDENTITY_POLICY
    bpy.context.scene["approved_palette_slots"] = ",".join(
        slot_name for _name, slot_name, _color, _roughness in MATERIAL_SPECS
    )
    bpy.context.scene["expected_output_dir"] = str(output_dir)
    bpy.context.scene["growgo_identity_contract_v2"] = json.dumps(
        IDENTITY_CONTRACT_V2, sort_keys=True
    )
    apply_identity_properties(bpy.context.scene, "SCENE_ROOT")
    apply_identity_properties(asset_collection, "ROOT_COLLECTION")

    write_repository_metadata(output_dir)

    emit(GENERATION_MARKER_READY)
    emit(GENERATION_MARKER_COMPLETE)


if __name__ == "__main__":
    main()
