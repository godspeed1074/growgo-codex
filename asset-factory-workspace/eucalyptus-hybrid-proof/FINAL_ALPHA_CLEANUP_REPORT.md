# Eucalyptus final alpha cleanup gate

Status: `NEEDS_FINAL_CLEANUP`.

The audit found disconnected alpha components inside individual atlas cells. The final pass removed components under 5,000 alpha-visible pixels per tile, removing confirmed crop debris without changing the trunk, card count, materials, or canopy layout. The rerender still shows several larger disconnected illustrated fragments. They cannot be classified as safe debris by the current component-only rule without risking legitimate leaf shapes.

Result: the source cleanup is real and machine-audited, but the final visual gate remains open. No registration or approval-ready state is assigned.
