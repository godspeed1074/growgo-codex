# Eucalyptus Hybrid V3 Targeted Correction

Candidate: `TREE_EUCALYPTUS_001@3.2.0` — `REVIEW_CANDIDATE`.

| Problem | Change | Result |
|---|---|---|
| White straight carcass | 15 shorter connected, rounded tapered segments; darker warm-grey bark | Colour and taper improved, but segmented construction remains visually apparent. |
| Weak bark identity | Pale grey-brown bark plus restrained warm patches | Improved; readable as stylised bark rather than pure white. |
| Alpha flecks | Revalidated cleaned RGBA atlas | No opaque rectangular card backgrounds; small isolated flecks remain. |
| Card integration | Preserved rear/middle/front architecture and crop-safe UVs | Foliage method remains valid, though edge cleanup needs a more targeted art pass. |

## Decision

`PARTIAL`: The successful illustrated-card foliage method is preserved, alpha/GLB preflight passes, and the carcass has improved. The required self-check **“white construction beams: NO”** does not yet pass strongly enough for a success claim. Do not approve or populate.
