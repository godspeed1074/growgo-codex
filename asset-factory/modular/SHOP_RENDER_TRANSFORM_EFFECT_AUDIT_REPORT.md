# Rendered Transform Effect Audit

Status: **PASS (diagnostic)**

The isolated Blender audit proves root-equivalent scaling changes rendered pixels: the temporary 2× door and window tests visibly change their bounds. No production transform or asset was persisted.

Primary finding: the current worker applies dimensions directly to flat artwork planes and applies transforms before saving; it does not retain a named parent/root hierarchy. Shell opening planes are fixed separately, so they do not automatically resize with a larger door. This is classified as **TRANSFORM_PIPELINE_PASS**, **VISIBLE_ART_BOUNDS_MISMATCH** risk, and **OPENING_NOT_RESPONSIVE_TO_MODULE_SCALE**.
