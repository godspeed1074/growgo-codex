# Simple Shop roof/top-cap V1

Status: **BLOCKED**.

The shared-grid 2D preflight passes, and the real Steam Deck Blender build passes geometry, identity, and mobile budget checks. The first isolated beauty render is visually insufficient: it reads as a pale generic strip rather than the navy reference roof/top relationship. The required approved façade `.blend` is not present in the normal checkout because build outputs are ignored, so protected-facade attachment could not be visually audited.

One targeted correction was used to reduce materials from four to three without changing geometry. No further Blender iteration was performed. No approved façade, Door, Window, Atlas, Golden Reference, complete shop, or eucalyptus asset was changed.

Recovery audit: the approved facade was regenerated through its existing Steam Deck pipeline, but its front checksum (`7980e7bafb9bed1ae46aac3b94f8e807f5d9404d91d3e7abac79cd0e80d14a2e`) does not match the locked approved checksum (`c21ffefb1bce1e2341816d4e695dcec3644c9deb511430523b65a8e484f745c3`). The recovery contract therefore prohibits attachment, hybrid art application, and any promotion.

`SIMPLE_SHOP_ROOF_FRONT_AUTHORITY_V1` was **not created**. The roof records remain draft, and operator review is not ready.
