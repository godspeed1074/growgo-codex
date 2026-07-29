"""Shared Blender-side export utilities for GrowGo Asset Factory assets."""

from __future__ import annotations

import json
from hashlib import sha256
from pathlib import Path


SUPPORTED_LODS = ("LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP")


def _is_blender_object(value):
    return (
        value is not None
        and hasattr(value, "type")
        and hasattr(value, "name")
        and not isinstance(value, type)
    )


def normalize_export_objects(value):
    """Return a deterministic, de-duplicated list of Blender objects.

    Accepts individual bpy objects, lists, tuples (including the shared
    ``(objects, anchor)`` helper result), sets, Blender collections, and
    collection-like object containers.
    """

    normalized = []
    visited_containers = set()

    def append(candidate):
        if candidate is None:
            return
        if _is_blender_object(candidate):
            normalized.append(candidate)
            for child in getattr(candidate, "children", ()):
                append(child)
            return
        if isinstance(candidate, dict):
            for key in sorted(candidate):
                append(candidate[key])
            return
        if isinstance(candidate, (list, tuple)):
            for nested in candidate:
                append(nested)
            return
        if isinstance(candidate, (set, frozenset)):
            for nested in sorted(candidate, key=lambda item: getattr(item, "name", repr(item))):
                append(nested)
            return

        container_id = id(candidate)
        if container_id in visited_containers:
            return
        visited_containers.add(container_id)

        all_objects = getattr(candidate, "all_objects", None)
        if all_objects is not None:
            append(list(all_objects))
            return
        objects = getattr(candidate, "objects", None)
        if objects is not None:
            append(list(objects))
            return
        try:
            append(list(candidate))
        except TypeError as error:
            raise TypeError(
                f"Unsupported export object container: {type(candidate).__name__}"
            ) from error

    append(value)
    unique = {}
    for obj in normalized:
        unique.setdefault(getattr(obj, "name", str(id(obj))), obj)
    return [unique[name] for name in sorted(unique)]


def discover_lod_roots(object_source, asset_id, lod_labels=SUPPORTED_LODS):
    """Discover exact CLOSE, GAMEPLAY, and MAP roots from bpy data or object sets."""

    roots = {}
    getter = getattr(object_source, "get", None)
    candidates = None
    for lod_label in lod_labels:
        expected_name = f"{asset_id}_{lod_label}_ROOT"
        root = getter(expected_name) if callable(getter) else None
        if root is None:
            if candidates is None:
                candidates = normalize_export_objects(object_source)
            root = next(
                (candidate for candidate in candidates if candidate.name == expected_name),
                None,
            )
        if root is None:
            raise RuntimeError(f"Missing required LOD root '{expected_name}'.")
        roots[lod_label] = root
    return roots


def count_export_metrics(export_source):
    """Count meshes, triangulated polygon faces, and shared material identities."""

    objects = normalize_export_objects(export_source)
    mesh_objects = [
        obj
        for obj in objects
        if getattr(obj, "type", None) == "MESH" and getattr(obj, "data", None) is not None
    ]
    triangle_count = 0
    material_names = set()
    for obj in mesh_objects:
        polygons = getattr(obj.data, "polygons", ())
        for polygon in polygons:
            vertices = getattr(polygon, "vertices", ())
            triangle_count += max(len(vertices) - 2, 0)
        for material in getattr(obj.data, "materials", ()):
            if material is not None:
                material_names.add(material.name)
    return {
        "meshCount": len(mesh_objects),
        "triangleCount": triangle_count,
        "materialCount": len(material_names),
        "materials": sorted(material_names),
    }


def validate_export_identity(
    export_source,
    *,
    asset_id,
    recipe_id,
    dependency_ids,
    lod_label,
    anchor_finder,
    root_object,
):
    """Validate shared asset, recipe, dependency, and identity-anchor evidence."""

    objects = normalize_export_objects(export_source)
    anchor = anchor_finder(root_object, asset_id, lod_label)
    if anchor is None:
        raise RuntimeError(
            f"Missing identity anchor '{asset_id}_{lod_label}_IDENTITY_ANCHOR'."
        )
    strings = []
    for obj in objects:
        strings.append(obj.name)
        for target in (obj, getattr(obj, "data", None)):
            if target is None:
                continue
            keys = getattr(target, "keys", None)
            if not callable(keys):
                continue
            for key in keys():
                value = target[key]
                if isinstance(value, str):
                    strings.append(value)
        data = getattr(obj, "data", None)
        for material in getattr(data, "materials", ()) if data is not None else ():
            if material is None:
                continue
            strings.append(material.name)
            for key in material.keys():
                value = material[key]
                if isinstance(value, str):
                    strings.append(value)
    evidence = "\n".join(strings)
    missing = []
    if asset_id not in evidence:
        missing.append("asset_identity")
    if recipe_id not in evidence:
        missing.append("recipe_identity")
    for dependency_id in dependency_ids:
        if dependency_id not in evidence:
            missing.append(f"dependency_identity:{dependency_id}")
    if anchor.name not in [obj.name for obj in objects]:
        missing.append(f"identity_anchor:{anchor.name}")
    if missing:
        raise RuntimeError(
            f"Shared export identity validation failed for {lod_label}: "
            + "; ".join(missing)
        )
    return {
        "assetIdentityPreserved": True,
        "recipeIdentityPreserved": True,
        "dependencyIdentityPreserved": True,
        "anchorIdentityPreserved": True,
        "anchorName": anchor.name,
        "objectCount": len(objects),
    }


def validate_lod_metric_order(metrics_by_lod):
    close = metrics_by_lod["close"]
    gameplay = metrics_by_lod["gameplay"]
    map_metrics = metrics_by_lod["map"]
    if not (
        close["triangleCount"]
        > gameplay["triangleCount"]
        > map_metrics["triangleCount"]
    ):
        raise RuntimeError(
            "LOD triangle complexity did not decrease from close to gameplay to map."
        )
    return True


def build_export_manifest(
    *,
    asset_id,
    recipe_id,
    version,
    dependency_ids,
    outputs,
):
    safe_outputs = {
        lod_key: {
            key: value
            for key, value in output.items()
            if key
            in {
                "filename",
                "sizeBytes",
                "sha256",
                "meshCount",
                "triangleCount",
                "materialCount",
                "primitiveCount",
                "hasExternalDependencies",
            }
        }
        for lod_key, output in outputs.items()
    }
    payload = {
        "schemaId": "ASSET_FACTORY_UNIVERSAL_EXPORT_MANIFEST_001",
        "assetId": asset_id,
        "recipeId": recipe_id,
        "version": version,
        "dependencies": list(dependency_ids),
        "lodOrder": ["close", "gameplay", "map"],
        "outputs": safe_outputs,
        "identityValidationRequired": True,
        "externalDependenciesAllowed": False,
    }
    payload["deterministicFingerprint"] = sha256(
        json.dumps(payload, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return payload


def write_export_manifest(filepath, **manifest_options):
    filepath = Path(filepath)
    payload = build_export_manifest(**manifest_options)
    filepath.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")
    return payload
