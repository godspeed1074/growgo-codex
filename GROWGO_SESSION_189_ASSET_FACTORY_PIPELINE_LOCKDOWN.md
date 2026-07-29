# GrowGo Session 189 - Asset Factory Pipeline Lockdown

Date: 2026-07-29
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Formalise and lock the Asset Factory v1 production workflow so future assets can be created repeatedly with predictable results, without creating new assets or changing approved asset records.

## Locked scope

- Create an official Asset Factory v1 workflow specification.
- Create a standard asset production template.
- Define the mandatory lifecycle and preflight requirements.
- Register the proven golden regression baselines.
- Add focused validation tests.

## Protected scope

This phase does not:

- modify `TREE_EUCALYPTUS_001`
- modify `TREE_BOTTLEBRUSH_001`
- modify approved GLBs
- modify registrations
- modify promotion records
- launch Blender
- activate runtime
- publish assets

## Notes

The lockdown specification treats the golden set as a regression registry. Two golden assets already have production registration records (`TREE_EUCALYPTUS_001_v001`, `TREE_BOTTLEBRUSH_001_v002` lineage through the registered asset and promoted revision), while `SHRUB_COASTAL_LOW_001_v001` is locked as a verified exporter baseline without inventing a production registration record that does not yet exist in the repository.
