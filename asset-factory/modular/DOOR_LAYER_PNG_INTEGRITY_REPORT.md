# Door Transparent Layer PNG Integrity Repair

Status: **PASS**

Root cause identified: **YES** — Shared PNG decoder ignored PNG filter types and assumed RGBA-only input; authoritative crop is non-interlaced RGB8.

- Shared utility affected: YES
- Source crop checksum preserved: `1d628c720fc81921ce4421d37b13193db14938fbf5b68328a14b92db87f6c6ab`
- Masks regenerated: NO; stored mask semantics preserved
- Blender run: NO
- Permanent door version: NO
- Full-source backplate used: NO

## Gates

- PNG encode/decode roundtrip: **PASS**
- 2D layer-only reassembly: **PASS**
- Full crop reconstruction: **PASS**
- Noise/corruption remaining: **NO**
- SOURCE_LAYER_PIPELINE_READY: **YES**

All eight layers were checked for dimensions, RGBA8 buffer length, channel order, straight alpha, outside-mask alpha, and exact decoded-pixel equality.
