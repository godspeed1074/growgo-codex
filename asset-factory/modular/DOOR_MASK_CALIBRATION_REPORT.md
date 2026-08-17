# Door Transparent Mask Calibration

Status: **PASS — context-aware 2D gate**

The door crop was split into a reusable door scope and excluded reference context. The scope is fully covered, with no omitted pixels. The full crop reassembly plus context matches the source exactly in this deterministic control: 0% mismatch and 0 mean RGB difference. Blender was not run, as required.

This pass establishes the mask/context contract. The opening-shadow layer is a scope base layer, while feature layers are composited above it in explicit order. No permanent door version was created and no Layer B assembly occurred.
