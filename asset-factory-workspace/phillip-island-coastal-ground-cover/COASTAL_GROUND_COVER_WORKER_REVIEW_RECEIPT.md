# Coastal Ground Cover — Steam Deck Worker Review Receipt

- Worker: `deck@10.0.0.4`
- Runtime: `flatpak run org.blender.Blender`
- Blender: **5.2.0 LTS**
- Render engine compatibility: **BLENDER_EEVEE**
- Worker process exit: **0 (clean)**
- Approval: **not performed; human visual review required**
- Tree exclusion: **PASS**

## Candidate validation

| Candidate | LOD triangle counts | Materials | Package budget | State |
| --- | --- | ---: | --- | --- |
| GG-VEG-GRASS-COASTAL-TUFT-001 | CLOSE: 308 tris<br>GAMEPLAY: 172 tris<br>MAP: 92 tris | 2 | PASS | REVIEW_CANDIDATE |
| GG-VEG-GRASS-COASTAL-TUFT-002 | CLOSE: 420 tris<br>GAMEPLAY: 228 tris<br>MAP: 148 tris | 2 | PASS | REVIEW_CANDIDATE |
| GG-VEG-GRASS-COASTAL-DENSE-001 | CLOSE: 156 tris<br>GAMEPLAY: 100 tris<br>MAP: 60 tris | 2 | PASS | REVIEW_CANDIDATE |
| GG-VEG-GRASS-COASTAL-DUNE-001 | CLOSE: 268 tris<br>GAMEPLAY: 124 tris<br>MAP: 100 tris | 2 | PASS | REVIEW_CANDIDATE |
| GG-VEG-GROUND-COVER-CREEPING-001 | CLOSE: 1068 tris<br>GAMEPLAY: 588 tris<br>MAP: 348 tris | 2 | FAIL — close LOD exceeds cap | REVIEW_CANDIDATE_BUDGET_EXCEPTION |
| GG-VEG-GROUND-COVER-SUCCULENT-001 | CLOSE: 972 tris<br>GAMEPLAY: 540 tris<br>MAP: 348 tris | 2 | FAIL — close LOD exceeds cap | REVIEW_CANDIDATE_BUDGET_EXCEPTION |

The technical exceptions are `GG-VEG-GROUND-COVER-CREEPING-001` CLOSE LOD (**1,068 triangles**) and `GG-VEG-GROUND-COVER-SUCCULENT-001` CLOSE LOD (**972 triangles**); each exceeds the controlled package cap of **900**. Neither result has been altered or waived. All returned candidates retain the state `REVIEW_CANDIDATE` / `REVIEW_CANDIDATE_BUDGET_EXCEPTION` pending operator review.

## Review evidence

Each candidate directory contains the real worker-produced Blender file, three GLBs, front/back/left/right/gameplay renders, and a locked-reference comparison board. No assets were registered, approved, or populated into Atlas.
