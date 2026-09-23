# GrowGo version roadmap

Status: proposed for owner review, 15 September 2026. This is a delivery plan, not a claim that the features below are complete. No dates or live changes are authorized by this document.

## How versions work

- Each 0.x series has one main focus. Ship small tested patches within it: 0.1.0, 0.1.1, 0.1.2.
- Begin the next minor version only after the previous version's exit checklist is reviewed and approved by the owner.
- Existing systems may be developed already; their milestone means finishing, integrating and proving them, not building them twice.
- Experiments such as Atlas asset creation can continue separately, but must not destabilize the current milestone.
- Fix urgent defects in any system immediately; do not wait for that system's milestone.
- Fixes require a new release number. Repeated builds of the same release do not. Keep rollback versions unchanged.
- A blocked gate is not silently waived. Record the issue, player impact and owner decision to fix, defer, disable or remove it from launch scope.

## 0.1 — Stabilize the existing alpha

Goal: trust the current game before adding more dependencies.

Exit checklist before starting 0.2:

- [ ] Publish visible release numbers and include them in bug reports; keep release notes and exact rollback references.
- [ ] Identify and fix the real Leonard start failure reported by Obi-Cal; loading/error feedback alone is not completion.
- [ ] Verify captures, crop growth/harvesting, greying out and inventory awards on Android and iPhone.
- [ ] Verify sign-in, saved stats and achievements survive restart, reconnection and device-session changes.
- [ ] Measure uncached map loading and auto-capture under realistic movement and weak connectivity. Proposed target: 95% of visible-area loads within five seconds on the agreed normal-network test, with honest fallback feedback when sources are unavailable.
- [ ] Daily cost/usage reporting includes captures, newly generated pins, reads/writes and billing freshness; compare per-capture and per-new-area costs, not totals alone.
- [ ] Set an owner-approved daily/monthly operating budget and alerts; do not invent a budget or treat estimated savings as measured savings.
- [ ] Seven consecutive test days without a reproducible critical login, capture, progress-loss or duplicate-reward defect, followed by owner sign-off.

## 0.2 — Finish quests and birds

Goal: a complete, repeatable quest-to-companion experience.

- [ ] Finish Leonard dialogue, transparent artwork, map reveal and 30m east placement; keep Leonard at the saved location throughout a run.
- [ ] Separate owner replay from the original egg and rewards; replay stops before incubation.
- [ ] Test discovery and the full quest in at least three distinct areas, including one outside Cowes and one low-density area. Test a no-suitable-location outcome without fake success.
- [ ] Complete eggs, sticks, cotton purchase, recipe, crafting, nest use, 24-hour hatch and Birdhouse handoff; test reconnect/retry at every boundary.
- [ ] Prove no duplicate charges, items, eggs or birds; preserve progress on errors.
- [ ] Finish bird deployment, six-hour relocation, interaction, owner access, quest offers and progress stats under the agreed rules. Legendary birds remain deferred.
- [ ] Quest Factory validation/simulation can produce and exercise at least ten approved T1 quests without bespoke stage code for each.

Exit: at least two testers complete real field runs outside the original pilot area; automated repeat/reconnect tests pass; owner approves the Birdhouse and bird loop.

## 0.3 — Crafting, inventory and economy

Goal: reliable rewards and a balanced progression loop.

- [ ] Finish crafting XP, recipe unlocks, resource/seed quality and buff duration/effect rules.
- [ ] Validate all inventory additions/removals, market purchases and repeated reward requests.
- [ ] Verify collection-card awards and artwork match the card actually received.
- [ ] Establish the baseline price/reward table and leveling curve; review earning versus spending using playtest data.
- [ ] Define and announce any planned alpha reset; back it up and obtain separate approval before performing it.
- [ ] Deferred reset experiment (requested 16 September 2026): test a minimum 75m distance between generated map pins, not merely an average or spacing along each road. Validate neighbouring cells, intersections and parallel roads for closer pairs. Compare pin counts, loading time, reads/writes, costs and resource/capture opportunities on matched routes. Confirm scope/exceptions for real-location POIs, owned plots, quest and event pins before applying a universal rule. Do not alter live spacing or reset data now; test at the planned server reset and seek approval before adopting it permanently.

Exit: the capture → harvest → craft → use/sell loop is tested on both platforms; no known item duplication/loss; the owner signs off on the baseline economy.

## 0.4 — Social, markets and events

Goal: group play and events function as one coherent experience.

- [ ] Friends, players met, profile photos, QR scans and profile links work on both platforms.
- [ ] Explicitly decide whether parties return for launch. If yes, finish joining/leaving and bonuses; if no, clearly disable/remove misleading controls.
- [ ] Finish market creation, editing, tiers, attendance, check-in verification and owner controls.
- [ ] Verify private cornucopia drops, shared vendor stock with per-player limits and event expiry.
- [ ] Verify achievement deploys, avatars, reset limits, world-first sharing window and announcements.
- [ ] Finish weekly events, calendar ordering/time zones, once-per-event announcements and temporary Pew-Pew expiry/charge accounting.

Exit: complete one organized multi-player market test, including late arrival, duplicate scans, event expiry and reconnect, without shared/private reward leakage.

## 0.5 — Atlas integration

Goal: introduce the new visual world without breaking game interactions or making costs unaffordable.

- [ ] Maintain a genuinely separate sandbox: no production writes or production credentials needed for visual tests.
- [ ] Validate asset sizes, textures, placement, draw distance, memory and mobile loading.
- [ ] Integrate one small representative area first; retain the existing map fallback.
- [ ] Confirm taps, long presses, pins, quest targets and capture distances still work over Atlas visuals.
- [ ] Measure frame rate, battery/memory behavior, network transfer and backend costs on representative devices.

Exit: owner-approved visual/performance results in the small test area and a demonstrated fallback/rollback. Expand progressively, not worldwide at once.

## 0.6 — World content and exploration

Goal: enough polished things to discover, using the proven systems.

- [ ] Finish launch-scope POIs, aquariums/museums, post offices and route achievements with consistent artwork.
- [ ] Connect Quest Factory templates to approved locations/Atlas assets without hand-coding every quest.
- [ ] Finish Fishy Business/dinosaur collection presentation and award rules; add only launch-approved content.
- [ ] Handle sparse regions, unavailable sources and unsuitable locations gracefully.
- [ ] Review public accessibility and placement safety; do not deliberately direct play into restricted or hazardous areas.

Exit: representative city, suburban and rural test areas provide complete playable loops and clear no-content fallbacks.

## 0.7 — Operations and launch commerce

Goal: the owner can operate, support and recover the game safely.

- [ ] Finish owner Mission Control reporting, support cases, case closure and audit logs.
- [ ] Demonstrate backup/restore, rollback, incident diagnosis and practical cost alerts.
- [ ] Finish player mail/reward collection and personal mailbox permissions/limits.
- [ ] Decide whether real-money purchases are in launch scope. If yes, verify payment receipt validation, duplicate delivery protection, refunds and required storefront disclosures; otherwise disable checkout clearly.
- [ ] Finish support sender/domain setup if emails are required for launch.
- [ ] Keep multi-staff role/delegation expansion deferred until staff are added, unless an essential launch requirement emerges.

Exit: a support incident and recovery drill succeed; all enabled payment flows pass sandbox testing; spending controls are approved.

## 0.8 — Closed beta and polish

Goal: prove the integrated launch scope with testers, without adding major new systems.

- [ ] Test onboarding, navigation, screen sizes, font consistency, long press and accessible controls.
- [ ] Exercise poor GPS, weak network, offline/reconnect, backgrounding and interrupted transactions.
- [ ] Grow from the current testers toward the agreed small beta group (up to 20), only within the approved cost budget.
- [ ] Track failures, retention/quest completion, latency and normalized cost; obtain enough data before extrapolating to thousands of players.
- [ ] Fix serious issues, remove incomplete launch features and document non-blocking known issues.

Exit: proposed 14 consecutive stable beta days; no critical/high-severity unresolved player-data, reward, access or purchase defects; budget/performance gates met.

## 0.9 — Release candidate

Goal: rehearse the release with a frozen feature set.

- [ ] Final permission/security review and abuse/rate-limit tests.
- [ ] Complete applicable privacy, account deletion, store listing, payment and support requirements for the chosen launch platforms.
- [ ] Final progression/reset decision communicated and separately authorized.
- [ ] Full install/update/login/play/reward/recovery smoke test on representative devices.
- [ ] Record release assets, exact versions, backend versions, rollback and launch monitoring responsibilities.
- [ ] Only release-blocking fixes; no new major features.

Exit: owner explicitly signs off on scope, known issues, cost headroom, rollback readiness and launch destination.

## 1.0 — Release

Launch the approved scope gradually. Monitor errors, capture/reward completion, retention and costs. Continue fixes as 1.0.1, 1.0.2; put new feature work into 1.1 only after launch is stable.

## Decision still needed

The owner should approve/reorder these milestones, confirm what "release" means (web, app stores, or both), choose cost limits and representative performance-test devices, and decide which optional systems may be deferred. Until then this roadmap is a proposed sequence, not a deadline or promise.
