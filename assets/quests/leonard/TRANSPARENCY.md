# Transparent quest art

Created with built-in image generation background extraction. Originals retained.

- eggs-transparent-v2.png: Extract the gold egg map marker as a transparent background cutout. Erase the opaque checkerboard outside the golden marker, including below its tip. Output RGBA with zero alpha outside the pin. Preserve egg, leaves, blue disk, white ring and gold teardrop pin. No redesign.
- leonard-worried-transparent-v2.png: Remove only the gray checkerboard surrounding worried Leonard. Produce real transparent alpha PNG, not a drawn checkerboard or solid backdrop. Preserve worried face, pose, wing, feathers, cream palette and silhouette.

Both PNGs verified to have an alpha channel. Egg output includes a soft golden halo. Client uses versioned paths to avoid cached originals. No backend or quest progress changes.

## Sticks

sticks-transparent-v2.png uses the owner-approved local cutout method after two generated attempts lacked alpha. Border-connected neutral checkerboard is removed with a softly antialiased edge. RGB channels are verified identical to the original; corner alpha is zero and the interior opaque. Verified composited over navy. Reproducible using scripts/cutout-sticks.py. Original retained; no live publication.
