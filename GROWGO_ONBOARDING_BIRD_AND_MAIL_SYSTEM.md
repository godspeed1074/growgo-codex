# GrowGo Onboarding, Bird Introduction, and Mail System

Status: current approved design baseline

## Leonard quest override — 13 September 2026

The owner explicitly selected the six-egg, 300-coin version for the Rubberlips
test. This overrides conflicting Leonard quest details below (not unrelated
onboarding or mail rules): six lost eggs; six quest-only sticks; six quest-only
cotton bought once from **Mr. Van Zant** for 300 coins. Return to Leonard to
receive the nest recipe after gathering both ingredients in either order.
Craft with six sticks and six cotton, then explicitly use the nest with the
rewarded egg to start the exact 24-hour incubation. Leonard stays in place.
The quest is personal and untimed apart from incubation; its items cannot be
sold. The approved definition is `quest-factory/leonard-introduction.mjs`.

Implementation status: definition and offline simulation only. No live account
has been started or reset. Live map placement, atomic inventory transactions,
recipe/use integration, bird award and an owner-scoped test/reset workflow remain
required before this introduction can be tested on Rubberlips. The existing
owned-dove T1 quest pilot is a different system.

This document records the current player onboarding, Leonard bird-introduction quest, core bird rules, and Post Office reward-delivery flow. It supersedes conflicting ideas from earlier planning discussions.

## Starter tutorial with Bingles

1. Bingles welcomes the player and directs them to the nearest valid base pin.
2. The player captures the base pin using the normal pin interaction.
3. Completion reward: 100 coins and one starter seed.
4. Bingles teaches the player to long-press the captured pin and purchase it for 100 coins.
5. Completion reward: 100 coins and the second starter seed.
6. Bingles directs the player to purchase a second base pin and long-press the owned pins to plant the seeds.
7. The two starter seeds are one wheat seed and one sugar-cane seed.
8. After both seeds are planted, the player receives two Miracle Grow items.
9. Miracle Grow instantly finishes crop growth and makes a crop ready to harvest.
10. The player uses the Miracle Grow, captures/harvests both pins, and receives both resources.
11. The player receives the Energy Bar recipe.
12. Bingles directs the player to the menu and Crafting screen.
13. The player refines the harvested wheat and sugar cane into Flour and Sugar, then crafts an Energy Bar from those two ingredients.
14. Final reward: 200 coins and two more of the same seeds.
15. Bingles congratulates the player and ends the initial tutorial.

## Level 5 bird quest: Leonard's eggs

Trigger: the player reaches level 5.

Bingles returns and says:

> Hey, you! I urgently need your help! You're so good at finding things—could you help me find something?

After the player taps Next, Bingles explains that his friend is a bird, jokes that a scarecrow being friends with a bird is strange, and asks the player to recover five missing eggs near the old church.

Quest setup:

- Locate the nearest suitable church.
- Select the five nearest safe, accessible, valid base pins around it.
- Place one quest egg on each selected pin.
- Mark the church area and all five eggs as quest objectives.
- Use a safe public-landmark fallback if no suitable church is available.

After the fifth egg is collected, Bingles thanks the player and introduces Leonard the Dove. Leonard thanks the player and gives them one egg because they look like they could use a travelling companion.

Leonard is a subtle `Free Bird` / Leonard Skinner (Lynyrd Skynyrd) Easter egg. Do not explain the reference directly in the game.

## Level 5 bird quest: build the nest

Bingles tells the player that Leonard's egg must be kept warm and instructs them to build a nest.

Quest setup:

- Automatically unlock the Nest recipe when this quest starts.
- Locate the nearest suitable supermarket.
- Place a temporary quest pin over it featuring Mr. Van Zant's portrait.
- Locate the nearest suitable named park.
- Place six twigs on six safe, accessible, valid base pins around the park.
- Use appropriate safe public-location fallbacks when either location type is unavailable.

Mr. Van Zant gives the player one bundle of cotton scraps for free after learning that Bingles sent them. Nothing in the Leonard quest chain costs coins, premium currency, real money, or advertisements.

Nest recipe:

- 1 bundle of cotton scraps
- 6 twigs

After collecting the ingredients, the player crafts the nest through the Crafting menu.

## Incubation

- Leonard's egg is automatically placed in the nest when it is crafted.
- An exact 24-hour incubation timer begins at the moment crafting completes.
- The active nest is shown in the player's inventory with a visible countdown.
- The countdown is server-authoritative, persists while the game is closed, and cannot be bypassed by changing the device clock.
- The nest and egg cannot be sold, discarded, traded, dismantled, or duplicated during incubation.
- No paid skip, advertisement skip, or premium prompt is offered.
- At zero, the inventory state changes to `Ready to Hatch` and tapping the nest begins the hatching sequence.

## Core bird-system rules

- Core interaction rules reconfirmed on 10 September 2026. This is a design record, not confirmation that the system has been deployed.
- Leonard the Dove is earned through the level-5 quest chain.
- The dove is the first bird. Its approved rounded three-hop/skater-spin animation is saved in [the approved asset bundle](../output/dove-approved-2026-09-10/APPROVED.md); runtime integration is still pending.
- Leonard is the only free bird a player receives.
- Additional birds may be purchased with real money.
- Birds and bird eggs are permanently non-sellable and cannot be listed on the player market, regardless of how they were obtained.
- Birds fly into the world and land on eligible owned base pins, including their
  owner's plots (owner eligibility reconfirmed 12 September 2026).
- On 12 September the user confirmed that manually deploying the dove should
  choose a random eligible planted plot **anywhere in the world**, not merely
  within 1 km or among loaded pins. This selection is server-authoritative.
- A destination pin must have an active seed growing or a crop in its harvest period.
- Empty plots are not eligible landing locations.
- On 12 September the user requested that an unaccepted bird move to another
  planted/harvest-active plot after its six-hour visit expires. The local pilot
  implementation advances on the next existing server bird refresh, starts a new
  six-hour visit, excludes its previous host, and waits/retries if no alternative
  is found. Already harvested today remains eligible. Recall stops automatic travel;
  a bird that left after quest acceptance is not resurrected by this expiry rule.
  This expiry change was published and verified on 12 September 2026; see
  `release-checkpoints/bird-expiry-travel-2026-09-12.md`.
- Tapping a visiting bird offers three quests: two at the bird's current level and one at a lower level. The approved level-1 exception is up to three different suitable T1 quests, with the player choosing one; there is no lower tier.
- Before offering location-dependent T1 quests, verify enough suitable pins or harvest-ready crops within 1 km of the player. If only one or two quests qualify, offer just those; do not duplicate choices or extend the range.
- The player explicitly accepts or rejects the quest offer. Tapping the bird does not automatically accept a quest.
- Once a quest is accepted, the bird flies off.
- Accepted bird quests have no time limit.
- When the quest is completed, the visiting player receives its defined rewards, including points/XP, resources and seeds.
- Completing a bird quest has a chance to award the completing player one random card drawn from the complete card pool available at that time. A card is not guaranteed. The approved T1 drop probability is 10% per completion; higher-tier drop probabilities remain TBD.
- If a card is awarded, its rarity is rolled independently using the existing normal `90% Common / 10% Rare` odds. These rarity odds are not the chance of receiving a card.
- The bird's owner receives the matching non-card rewards through the mail system.
- The random card is exclusive to the player who completed the quest and is not duplicated into the bird owner's mail.
- The bird receives the same experience earned by the player who completed its quest.
- Birds level from 1 through 4. Legendary birds, progression and quests are deferred and excluded from the current implementation scope.
- Higher-level birds provide more challenging quests and better rewards. Exact scaling remains to be defined.

### Birdhouse

- Collections contains a Birdhouse showing all owned birds.
- Tapping an owned bird opens its details, including level, quests completed and deployed location.
- A bird that is not deployed is clearly shown as not deployed; no location is invented for it.

### Parameters still to confirm

- Higher-tier card-drop probabilities, separate from card rarity odds. T1 is approved at 10%.
- The player-facing response/retry behavior when no T1 quests qualify. The local preview returns an empty result without changing the bird. Availability within 1 km and offering fewer than three choices are approved.
- Exact higher-level quest difficulty and reward scaling.
- Active quest-log capacity remains TBD as described below; the 10 September confirmation did not select a numeric limit.

### Owner-bird encounter

- A player's own bird may land on an eligible growing or harvest-ready pin owned
  by that same player. The 12 September clarification supersedes the earlier
  proposed special rarity restriction on landing on one's own plots.
- The owner may tap the bird, accept its quest and complete it normally.
- Completing a quest received directly from the player's own bird contributes to a dedicated achievement.
- The achievement may track the first completion and additional completion tiers; its final tiers and rewards remain TBD.
- The player receives the normal quest reward once and the bird receives its normal experience.
- Because the questing player and bird owner are the same account, the system must not also create a duplicate matching owner reward in bird mail.
- The server selects the landing; clients cannot nominate a plot. Own and other
  players' eligible plots are both included, without a separate owner-only roll.

## Post Offices and bird mail

- Every recognized town has a Post Office gameplay location and map pin.
- When another player completes a bird's quest, the bird owner's matching rewards are deposited into one shared mailbox.
- The owner receives a Mail Waiting notification.
- The owner travels within interaction range of a Post Office and taps its pin to open the mailbox and claim rewards.
- Mail should identify the bird, completed quest, reward contents, bird experience, and delivery time.
- Support individual Claim and Claim All actions.
- Mail never expires and is never automatically cancelled or deleted. Every unclaimed message and its contents remain in the shared mailbox until successfully claimed by the player.
- Claimed rewards cannot be duplicated.

## Optional home Post Box

- A player may purchase an in-game Post Box and place it at their registered home location.
- The Post Box provides access to the same mailbox available at Post Offices.
- A home Post Box is a private map object visible only to its owner.
- Other players cannot see, select, discover or interact with another player's home Post Box.
- Post Box data sent to the game client must be filtered by the server so private home coordinates are never delivered to other players' devices.
- Mail may be claimed from either location; claiming it at one removes it from the other.
- The Post Box is a convenience feature and does not increase rewards.
- The home Post Box and precise home location are private to the owner and must not be exposed to other players.
- Final Post Box pricing is not yet decided.

## Bird-mail tutorial conclusion

After Leonard's first bird quest is completed by another player:

1. The owner receives a Mail Waiting alert.
2. Bingles directs the player to the nearest suitable Post Office.
3. The player travels there and taps the Post Office pin.
4. The mailbox explains which quest was completed and what Leonard delivered.
5. The player claims the rewards.
6. Bingles explains that future bird-owner rewards arrive through the same mail system.
7. The optional private Home Post Box may be introduced afterward.

This completes the introductory bird loop:

`Hatch bird -> bird travels -> another player completes its quest -> rewards arrive by mail -> collect rewards at a Post Office.`

## Quest-log capacity

- A player may hold only a limited number of accepted optional quests in the active quest log.
- The exact active-quest capacity remains TBD and will be selected through playtesting.
- Mandatory onboarding, main-story and account-recovery quests use protected slots and cannot prevent normal gameplay because the optional quest log is full.
- Before accepting an optional quest that would exceed the limit, the player is told that the quest log is full and may review it first.
- Optional quests may be abandoned when their definition permits it; the confirmation screen explains whether progress or contributed items will be lost.
- Protected quests cannot be abandoned accidentally.
- Completed quests leave the active log and move into quest history after their rewards are accepted.
- Quest capacity and every accept, abandon, complete and reward action are enforced by the server.

## Temporary quest items on base pins

- A quest item may be placed on a suitable base pin even when that pin is currently owned.
- While active for the questing player, the quest item temporarily replaces the pin's normal map appearance and primary interaction.
- This is an owner-scoped quest overlay, not a change to the underlying base pin.
- Ownership, crop state, growth and harvest timers, bird state, capture state and daily capture history continue unchanged beneath the overlay.
- Collecting the quest item removes the overlay and immediately restores the base pin to its current authoritative state.
- Collecting a quest item does not itself count as capturing the base pin and does not reset or consume normal daily capture eligibility.
- After the overlay is removed, the player may capture the restored pin only if they have not already captured that pin in its current state during the current server-defined day.
- Quest-item collection and base-pin capture are separate server transactions with separate replay protection and reward records.

## Universal GrowGo day

- The GrowGo game day resets worldwide at `00:00 UTC`.
- Daily pin-capture eligibility, daily quests, daily rewards, daily achievement measurements and daily leaderboard windows use the same boundary.
- The server clock is authoritative; changing a device clock or timezone cannot change eligibility.
- The HUD shows a countdown to the next daily reset in the player's local display format.
- Weekly, seasonal and event boundaries are also defined by fixed UTC server timestamps.
