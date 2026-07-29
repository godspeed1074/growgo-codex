"""
Manual Blender-internal generator for TREE_EUCALYPTUS_001.

This script is intended to be run manually inside Blender 4.2 LTS. Codex does
not execute Blender for this asset. The script builds a deterministic papercut
2.5D eucalyptus tree, prepares three LOD roots, and leaves the user to inspect
the result and save the final blend manually.
"""

from __future__ import annotations

import math
import sys

import bpy


ASSET_ID = "TREE_EUCALYPTUS_001"
SOURCE_RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
REGISTRY_RECIPE_ID = "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"
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
    "close": f"{ASSET_ID}_CLOSE_ROOT",
    "gameplay": f"{ASSET_ID}_GAMEPLAY_ROOT",
    "map": f"{ASSET_ID}_MAP_ROOT",
}

MATERIAL_SPECS = (
    ("MAT_TREE_EUCALYPTUS_TRUNK_001", "trunk", (0.56, 0.47, 0.36, 1.0), 0.84),
    ("MAT_TREE_EUCALYPTUS_BRANCH_001", "branch", (0.49, 0.41, 0.31, 1.0), 0.86),
    (
        "MAT_TREE_EUCALYPTUS_CANOPY_LIGHT_001",
        "canopy light",
        (0.61, 0.72, 0.56, 1.0),
        0.72,
    ),
    (
        "MAT_TREE_EUCALYPTUS_CANOPY_MID_001",
        "canopy mid",
        (0.44, 0.59, 0.43, 1.0),
        0.74,
    ),
    (
        "MAT_TREE_EUCALYPTUS_CANOPY_DARK_001",
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


def emit(marker):
    print(marker)
    sys.stdout.flush()


def fail(message):
    raise RuntimeError(message)


def ensure_blender_version():
    if bpy.app.version[:2] != (4, 2):
        fail(f"Expected Blender 4.2.x, found {bpy.app.version!r}.")


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

    asset_collection["asset_id"] = ASSET_ID
    asset_collection["source_recipe_id"] = SOURCE_RECIPE_ID
    asset_collection["registry_recipe_id"] = REGISTRY_RECIPE_ID
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
    obj.scale = scale
    assign_material(obj, material)
    return obj


def assign_material(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)


def link_close_lod(root, collections, materials):
    objects = []

    trunk = create_cylinder(
        "TREE_EUCALYPTUS_TRUNK_001",
        (0.0, 0.0, 1.65),
        (0.03, 0.06, 0.02),
        (0.22, 0.18, 3.3),
        10,
        materials["trunk"],
    )
    objects.append(trunk)

    branch_specs = (
        ("TREE_BRANCH_LARGE_001_A", (0.0, 0.02, 2.45), (0.0, 0.45, 0.58), (0.10, 0.09, 1.5)),
        ("TREE_BRANCH_LARGE_001_B", (0.0, -0.04, 2.72), (0.0, -0.42, -0.58), (0.09, 0.08, 1.3)),
        ("TREE_BRANCH_SMALL_001_A", (0.0, 0.03, 2.05), (0.16, -0.66, -0.42), (0.06, 0.05, 0.92)),
        ("TREE_BRANCH_SMALL_001_B", (0.0, 0.0, 2.88), (-0.18, 0.74, 0.24), (0.05, 0.05, 0.76)),
    )
    for name, location, rotation, scale in branch_specs:
        objects.append(create_cylinder(name, location, rotation, scale, 8, materials["branch"]))

    canopy_specs = (
        (
            "TREE_CANOPY_EUCALYPTUS_001_A",
            (-0.38, 0.06, 4.05),
            (0.0, 0.12, 0.2),
            (0.86, 0.46, 0.94),
            1,
            materials["canopy light"],
        ),
        (
            "TREE_CANOPY_EUCALYPTUS_001_B",
            (0.44, 0.14, 3.92),
            (0.0, -0.18, -0.1),
            (0.80, 0.42, 0.88),
            1,
            materials["canopy mid"],
        ),
        (
            "TREE_CANOPY_EUCALYPTUS_001_C",
            (-0.08, -0.34, 4.22),
            (0.0, 0.02, -0.26),
            (0.92, 0.48, 0.98),
            1,
            materials["canopy dark"],
        ),
        (
            "TREE_CANOPY_EUCALYPTUS_001_D",
            (0.22, -0.42, 3.64),
            (0.0, 0.08, 0.38),
            (0.66, 0.34, 0.72),
            1,
            materials["canopy mid"],
        ),
        (
            "TREE_CANOPY_EUCALYPTUS_001_E",
            (-0.56, -0.16, 3.72),
            (0.0, -0.12, -0.14),
            (0.74, 0.38, 0.78),
            1,
            materials["canopy dark"],
        ),
    )
    for name, location, rotation, scale, subdivisions, material in canopy_specs:
        objects.append(create_canopy_mass(name, location, rotation, scale, subdivisions, material))

    for obj in objects:
        parent_to_root(obj, root)
        move_object_to_collection(obj, collections["LOD_CLOSE"])

    return objects


def duplicate_for_lod(source_objects, root, collection, keep_names):
    clones = []
    source_lookup = {obj.name: obj for obj in source_objects}
    for name in keep_names:
        source = source_lookup[name]
        clone = source.copy()
        clone.data = source.data.copy()
        clone.name = f"{source.name}_{collection.name}"
        collection.objects.link(clone)
        parent_to_root(clone, root)
        clones.append(clone)
    return clones


def build_other_lods(source_objects, collections, materials):
    gameplay_root = add_empty(ROOT_NAMES["gameplay"], collection=collections["LOD_GAMEPLAY"])
    map_root = add_empty(ROOT_NAMES["map"], collection=collections["LOD_MAP"])

    gameplay_keep = (
        "TREE_EUCALYPTUS_TRUNK_001",
        "TREE_BRANCH_LARGE_001_A",
        "TREE_BRANCH_LARGE_001_B",
        "TREE_CANOPY_EUCALYPTUS_001_A",
        "TREE_CANOPY_EUCALYPTUS_001_B",
        "TREE_CANOPY_EUCALYPTUS_001_C",
    )
    map_keep = (
        "TREE_EUCALYPTUS_TRUNK_001",
        "TREE_CANOPY_EUCALYPTUS_001_A",
        "TREE_CANOPY_EUCALYPTUS_001_C",
    )

    gameplay_objects = duplicate_for_lod(source_objects, gameplay_root, collections["LOD_GAMEPLAY"], gameplay_keep)
    map_objects = duplicate_for_lod(source_objects, map_root, collections["LOD_MAP"], map_keep)

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
        "TREE_EUCALYPTUS_GROUND_SOCKET_001",
        location=(0.0, 0.0, 0.0),
        collection=collections["SOCKETS"],
    )
    landscape_socket = add_empty(
        "TREE_EUCALYPTUS_LANDSCAPE_SOCKET_001",
        location=(0.0, 0.0, 0.0),
        collection=collections["SOCKETS"],
    )
    ground_socket["socket_type"] = "ground"
    landscape_socket["socket_type"] = "landscape"


def write_metadata_texts(collections):
    manifest_text = bpy.data.texts.get("TREE_EUCALYPTUS_001_MANIFEST")
    if manifest_text is None:
        manifest_text = bpy.data.texts.new("TREE_EUCALYPTUS_001_MANIFEST")
    manifest_text.clear()
    manifest_text.write(
        "\n".join(
            (
                f"asset_id={ASSET_ID}",
                f"source_recipe_id={SOURCE_RECIPE_ID}",
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
                "palette_slots=trunk,branch,canopy light,canopy mid,canopy dark",
                "forbidden_palette=" + ", ".join(FORBIDDEN_PALETTE_DESCRIPTIONS),
            )
        )
    )

    metadata_collection = collections["EXPORT_METADATA"]
    metadata_collection["asset_id"] = ASSET_ID
    metadata_collection["source_recipe_id"] = SOURCE_RECIPE_ID
    metadata_collection["registry_recipe_id"] = REGISTRY_RECIPE_ID


def main():
    emit(GENERATION_MARKER_START)
    ensure_blender_version()
    reset_scene()
    _asset_collection, collections = create_root_structure()
    materials = create_materials()
    close_root = add_empty(ROOT_NAMES["close"], collection=collections["LOD_CLOSE"])
    close_objects = link_close_lod(close_root, collections, materials)
    build_other_lods(close_objects, collections, materials)
    build_sockets(collections)
    write_metadata_texts(collections)

    bpy.context.scene["asset_id"] = ASSET_ID
    bpy.context.scene["source_recipe_id"] = SOURCE_RECIPE_ID
    bpy.context.scene["registry_recipe_id"] = REGISTRY_RECIPE_ID
    bpy.context.scene["approved_palette_slots"] = ",".join(
        slot_name for _name, slot_name, _color, _roughness in MATERIAL_SPECS
    )

    emit(GENERATION_MARKER_READY)
    emit(GENERATION_MARKER_COMPLETE)


if __name__ == "__main__":
    main()
