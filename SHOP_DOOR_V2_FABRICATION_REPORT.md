# Clean V2 Door Fabrication — Build B

**Status: BLOCKED.** The isolated V2 build is technically valid but does not pass direct visual comparison.

## Technical evidence

- Steam Deck Blender 5.2.0 LTS: PASS
- Shared-guide audit: PASS, maximum error **0 px-equivalent**
- Transom centre: exact
- Rendered component visibility: PASS, **20/20** meaningful visible components
- Budget: PASS — **532 triangles**, **344 vertices**, **5 materials**, **0 textures**, **0 anonymous geometry**
- One targeted correction used: D15 reveal became a four-band border so D14 and D15 both render visibly.

## Vision decision

The V2 slab, main glass, surround, casing, hardware, and transom are proportionally coherent. The complete candidate still fails same-door vision: the threshold/base reads oversized and bright, the lower panel and head/separator lack the reference’s crafted hierarchy, and the total result remains a generic blockout.

`FIRST_PASS_STANDARD_REGRESSION = YES`: the V2 2D preflight measured bounds and axes, but did not validate the entry-step ownership/context, depth hierarchy, or complete silhouette that appear in Blender.

No front authority was created, no side/back QA was run, and no shop, Atlas, Golden Reference, or eucalyptus asset changed.
