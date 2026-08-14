# Door Shallow-Layer Blender Fidelity Proof

Status: **NEEDS_CORRECTION**

This is one isolated temporary proof for `GG-BLD-DOOR-SHOP-002`. It uses the eight calibrated transparent layer files exactly and does not use the full source crop as an asset surface.

- Worker: Steam Deck (10.0.0.4)
- Blender: 5.2.0 LTS via `flatpak run org.blender.Blender`
- Fidelity render: generated
- Papercut render: generated
- Gameplay/close-up and four-side outputs: generated
- Component-ID output: generated
- Anonymous geometry: 0
- Mobile budget: PASS
- Permanent door version: NO
- Layer B assembly: NO

## Golden Reference comparison

Mean RGB difference: 0.382

- Exact mismatch pixels (threshold >10): 280 (0.267%)
- >2 RGB difference: 0.286%
- >5 RGB difference: 0.282%
- >10 RGB difference: 0.267%
- Alpha difference: 0 pixels
- Alignment: locked same-pixel grid, offset [0, 0]

The calibrated layer files are preserved byte-for-byte in the proof input package. Visual inspection found that the locked calibrated PNG inputs are corrupted before Blender use, so the fidelity gate is **NEEDS_CORRECTION**. The resulting render is not promoted automatically; operator review remains required.
