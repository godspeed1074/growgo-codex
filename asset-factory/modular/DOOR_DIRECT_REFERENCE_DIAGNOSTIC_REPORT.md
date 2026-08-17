# Door Fidelity Diagnostic — Direct Reference Plane

Status: **FAIL — DOOR_RENDER_FILTER_FAIL / COLOR_MANAGEMENT_DIFFERENCE**

This was a temporary diagnostic only. No permanent door version was created and no shop or other hero module was modified.

Source and render dimensions both match at 300×350. UV coverage is full-image, once. The camera is orthographic with exact framing. The material is unlit emission and Blender was configured with Standard view transform, None look, exposure 0, gamma 1 and sRGB output.

Measured comparison:

- Pixel mismatch: 43.2714%
- Mean absolute RGB difference: 4.5888
- Alpha difference: 0
- Dimension/framing match: PASS
- Strict direct reproduction: FAIL

The failure is not a geometry or UV coverage failure. The source can be framed exactly, but the rendered pixels still differ beyond the strict diagnostic threshold. The next action is to isolate Blender image interpolation/color-management behavior before attempting reference-layer decomposition.

Permanent door version created: **NO**.
