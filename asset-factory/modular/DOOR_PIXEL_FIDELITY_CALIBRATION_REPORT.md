# Pixel-Exact Blender Reference Rendering Calibration

Status: **FAIL — no winning contract**

Source PNG roundtrip: PASS with zero mismatch, zero mean RGB difference, zero max difference and zero alpha difference. This rules out the controller PNG decoder as the primary cause.

The tested Blender matrix did not reach the strict threshold. Best tested variant was `closest_standard` using Blender EEVEE, centered orthographic alignment, sRGB image, Standard view transform, None look, exposure 0, gamma 1. It measured 60.1086% mismatch and 69.5204 mean RGB difference, with substantial alpha difference. Linear filtering and half-pixel offsets were worse.

The previous Workbench baseline remains recorded separately at 43.2714% mismatch and 4.5888 mean RGB difference. The calibration therefore identifies a render/output-path problem involving texture sampling plus output/alpha/color handling, not UV coverage or source decoding. No configuration passed the strict acceptance target, so no reference texture render contract was generated as PASS.

Permanent asset created: **NO**. Door geometry was not changed. Window, shrub, awning, fascia and shop were not touched.
