"""
Reusable Blender-side identity anchor helpers for Asset Factory assets.

These helpers create a tiny export-safe mesh anchor with deterministic metadata
so GLB exports preserve asset identity even when Blender omits EMPTY roots.
"""

from __future__ import annotations

import json

import bpy


IDENTITY_ANCHOR_COMPONENT_ROLE = "IDENTITY_ANCHOR"
IDENTITY_ANCHOR_MESH_ROLE = "IDENTITY_ANCHOR_MESH"
IDENTITY_ANCHOR_OBJECT_TYPE = "growgo_identity_anchor"
IDENTITY_ANCHOR_TRIANGLE_SCALE = 0.000001


def build_identity_anchor_name(asset_id, lod_label=None):
    if lod_label:
        return f"{asset_id}_{lod_label}_{IDENTITY_ANCHOR_COMPONENT_ROLE}"
    return f"{asset_id}_{IDENTITY_ANCHOR_COMPONENT_ROLE}"


def build_identity_anchor_mesh_name(asset_id, lod_label=None):
    if lod_label:
        return f"{asset_id}_{lod_label}_{IDENTITY_ANCHOR_MESH_ROLE}"
    return f"{asset_id}_{IDENTITY_ANCHOR_MESH_ROLE}"


def write_identity_properties(
    target,
    contract,
    component_role,
    lod_label=None,
    dependency_id=None,
    exported_identity_source="metadata",
    is_anchor=False,
):
    target["growgo_schema_id"] = "ASSET_IDENTITY_CONTRACT_PHASE_001_1"
    target["growgo_asset_id"] = contract["assetId"]
    target["growgo_category"] = contract["category"]
    target["growgo_recipe_id"] = contract["recipeId"]
    target["growgo_version"] = contract["version"]
    target["growgo_variant_id"] = contract["variantId"]
    target["growgo_palette_id"] = contract["paletteId"]
    target["growgo_lod_profile"] = contract["lodProfile"]
    target["growgo_identity_policy"] = contract["identityPolicy"]
    target["growgo_component_role"] = component_role
    target["growgo_identity_contract_v2"] = json.dumps(contract, sort_keys=True)
    target["growgo_dependencies"] = ",".join(
        dependency["dependencyId"] for dependency in contract.get("dependencies", [])
    )
    target["growgo_exported_identity_source"] = exported_identity_source
    if lod_label is not None:
        target["growgo_lod_label"] = lod_label
    if dependency_id is not None:
        target["growgo_dependency_id"] = dependency_id
        target["growgo_name_identity_owner"] = dependency_id
    if is_anchor:
        target["growgo_identity_anchor"] = True


def create_identity_anchor(collection, parent_object, contract, lod_label):
    asset_id = contract["assetId"]
    anchor_name = build_identity_anchor_name(asset_id, lod_label)
    mesh_name = build_identity_anchor_mesh_name(asset_id, lod_label)

    mesh = bpy.data.meshes.new(mesh_name)
    mesh.from_pydata(
        [
            (0.0, 0.0, 0.0),
            (IDENTITY_ANCHOR_TRIANGLE_SCALE, 0.0, 0.0),
            (0.0, IDENTITY_ANCHOR_TRIANGLE_SCALE, 0.0),
        ],
        [],
        [(0, 1, 2)],
    )
    mesh.update()
    write_identity_properties(
        mesh,
        contract,
        component_role=IDENTITY_ANCHOR_MESH_ROLE,
        lod_label=lod_label,
        exported_identity_source="identity_anchor",
        is_anchor=True,
    )

    anchor_object = bpy.data.objects.new(anchor_name, mesh)
    anchor_object.hide_render = False
    anchor_object.show_name = False
    write_identity_properties(
        anchor_object,
        contract,
        component_role=IDENTITY_ANCHOR_COMPONENT_ROLE,
        lod_label=lod_label,
        exported_identity_source="identity_anchor",
        is_anchor=True,
    )
    collection.objects.link(anchor_object)
    anchor_object.parent = parent_object
    anchor_object.matrix_parent_inverse = parent_object.matrix_world.inverted()
    return anchor_object


def find_identity_anchor(root_object, asset_id, lod_label):
    expected_name = build_identity_anchor_name(asset_id, lod_label)
    stack = [root_object]
    while stack:
        current = stack.pop()
        if current.name == expected_name and current.get("growgo_identity_anchor"):
            return current
        stack.extend(list(current.children))
    return None


def iter_export_tree(root_object):
    stack = [root_object]
    visited = set()
    while stack:
        current = stack.pop()
        object_name = getattr(current, "name", None)
        if object_name in visited:
            continue
        visited.add(object_name)
        yield current
        stack.extend(list(current.children))


def build_export_object_set(root_object, asset_id, lod_label):
    export_objects = list(iter_export_tree(root_object))
    anchor_object = find_identity_anchor(root_object, asset_id, lod_label)
    if anchor_object is None:
        raise RuntimeError(
            f"Missing identity anchor '{build_identity_anchor_name(asset_id, lod_label)}'."
        )
    export_names = [obj.name for obj in export_objects]
    if anchor_object.name not in export_names:
        raise RuntimeError(
            f"Identity anchor '{anchor_object.name}' was not part of the LOD export tree."
        )
    return export_objects, anchor_object


def select_export_object_set(root_object, asset_id, lod_label):
    bpy.ops.object.select_all(action="DESELECT")
    export_objects, anchor_object = build_export_object_set(
        root_object, asset_id, lod_label
    )
    for obj in export_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root_object
    return export_objects, anchor_object
