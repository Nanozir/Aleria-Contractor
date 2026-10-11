# Design Notes

How the game's systems fit together, what was changed in the overhaul, and where to go next. The lore source is *A Guide For Heroes (Who'd Rather Not Be)*, specifically the "A (Real) Guide for Heroes" and "Races" tabs.

---

## 1. Combat engine (`src/combat/`)

Every standard fight uses one engine, including the contract board, Underworld patrols, Doomsday waves, Tenebrim, Beastkin and Elf expeditions.

- **Intents.** Each enemy shows its next move before you act: name, telegraph text and a badge. You read it, then answer it.
  - `➶ Unblockable`: Guard does nothing. **Evade.**
  - `≋ Sweep`: cannot be dodged. **Guard.**
  - `◎ Winding up`: a charge that turns into a big hit next turn. Prepare for it, or stagger the enemy to cancel it.
  - `airborne` moves (Veilstalker fading, Drakein climbing, Vekrath diving) can only be hit by spells or `ranged` attacks.
- **Poise and stagger.** Attacks drain poise. At 0 the enemy is staggered: it loses its action and takes +50% damage. Each stagger raises its max poise by 50%, so you can't stun-lock it.
- **Statuses.**
  - On the player: bleed, burn, acid (armor down), stun (lose a turn, then briefly immune), blind, weaken.
  - On enemies: stun, confuse, burn, bleed, rally, shield, staggered, recharging.
- **Armor is percentage-based:** `damage × (1 − def / (def + 50))`.
- **Monster traits:** `regen`, `explode`, `pack`, `feedback`, `blindHunter`, `pressure`, `clone`, `enrage`, `armored`, `manaEater`.
- **Optional player resources** a scenario can turn on:
  - `fury` (Tenebrim)
  - `heal` and `cleanse` actions
  - `backfire` (Beastkin Wild Surge)
  - `pactImmune` (pact-chain moves fail)
  - `immune` (status immunities)
  - `coreless` (mana drain fails; Huliut's pressure field can't sense you)

**To add a monster:** add an entry to `monsters.js` (or a scenario's own enemy file) with `moves`. Every move needs a `tell` so the player can read it.

## 2. Lumenari (`src/combat/LumenariFight.jsx`)

Based on the Races lore: a core that grew past what it could hold. It drifts, does not hate, flickers between solid and intangible, leaks mana and burns itself out.

- **Form rhythm.** Upcoming forms are shown in advance.
  - Solid: takes full damage.
  - Flickering: weapons deal 50%.
  - Intangible: weapons pass through, and spells are **absorbed** (heal it and raise pressure).
- **Mana Pressure** rises every round. At 100% it **Overflows** next turn: a big sweep, softened by a Stabilize arrow QTE. Each Overflow also burns 10% of the Lumenari's own HP.
- **Leaked motes** pop with any hit and vent pressure. Ignored motes are reabsorbed.
- **Phases:**
  - Phase II: lane-dodge spear rain and hurled debris.
  - Phase III: stone golems halve the damage it takes, and terrain reshaping must be evaded.
- **Collapse:** a 3-hit timing QTE on the exposed core.

## 3. Cinematics (`src/cinematic/Cinematic.jsx`)

`<Cinematic shots={[...]} onDone={fn} />`. Each shot takes `text`, `sub`, `speaker`, `bg` (any CSS background), `fx`, `color`, `duration` and `sfx`.

- **Available `fx`:** `snow`, `blizzard`, `embers`, `ash`, `rain`, `stars`, `motes`, `rays`, `fog`, `pulse`, `lightning`, `shake`, `flash`, `vignette-red`.
- **Controls:** click, Space or Enter advances (the first click finishes the typewriter). Esc or SKIP ends the cutscene. `onDone` fires exactly once and every timer is cleaned up. This fixes the old Elf town cutscene, which fired twice after skipping.

## 4. Classic contractor loop (`src/App.jsx`, `src/contracts.js`)

- **Contract board.** Three postings each morning.
  - Hunters get bounties and pack culls, cleared up to one star above their qualification. Star-3 and above is Hunter territory by law.
  - Adventurers get escorts, gathering, den-clearing and shallow dungeon surveys.
- **Roam the wilds** gives a random fight.
- **Doomsday:** cutscene → 5 waves through the full combat screen. You can recruit militia between waves → Lumenari.

## 5. Tenebrim, "Unbound" (`src/TenebrimScenario.jsx`, `src/tenebrim/`)

Lore anchors: coreless (no mana, no passive healing, scars persist, sickness hits hard), easily bound by slave pacts, Menfor clans, legacy, the Mourak, the Grand Monarch.

- **Slave origin.** Daily labor and night actions build Routes, Contacts and Pact Strain against Suspicion.
  - Escape by stealing the ledger page (a clean break) or by enduring the backlash. Pact Strain built up beforehand softens the damage.
  - Then fight past the guards, cross the sea, and be hunted by bounty hunters until Chainhold falls.
- **Tribe origin.** Day of Marking (pick a hereditary trait) → first hunt with your sibling → Syndicate raid takes them.
- **Menfor campaign:**
  - A linked region map; food and water.
  - Wounds that heal over days into scars.
  - A band of followers with roles.
  - Four clans: Emberhide, Red Maw, Stoneoath, Wellkeepers.
  - Camp building, weapon crafting, the Monarch's Horn.
  - Techniques unlocked by what the body survives.
- **Syndicate Grip** is this scenario's doom clock. Raid caravans to push it back.
- **Finale:** storm Chainhold → the pens → Pactmaster Varn → four endings (uniter, founder, monarch, mourak), plus the Chain Tide failure.

## 6. Devil, "Warden of Sector Three" (`src/DevilScenario.jsx`)

Lore anchors: mana sinks and pools below; Devils siphon it to delay the Doomsday; Fuhmar → Constaelous hierarchy; bonded beasts instead of machines; the Sealed Facility.

- **Subtypes:**
  - Veyrith: mana intake, starts with Illusion.
  - Kharvex: absorbs cores for +ATK, builds instability → fragmentation.
  - Syrakai: stone skin, burn immunity, slower siphon nodes, no Illusion.
- **Companion** (Cindermaw, Gloomstrider, Shellback) with a bond level.
- **Sector Pressure** feeds the global Doomsday bar and causes surges at 90%.
- **Sector works,** rank promotions, story events, and the surface envoy choice.

## 7. Beastkin, "The Hollowmere Year" (`src/BeastkinScenario.jsx`, `src/beastkin/`)

Lore anchors: engineered by the 7th Hero, keen senses, potent cores with poor control, naive sharing communities, Church protection that doesn't reach everywhere.

- **Sub-types:** Lizardman, Angelos, Canine Kin, Melano and Gemea follow the author's canon. **Ursan** is a game invention.
  - Melano cannot speak: they bellow instead of confronting. The village trusts them less at first.
- **Core loop:**
  - 20 days, 2 actions per day.
  - Outsiders arrive and the village trusts them by default. Read them with your senses, then welcome, refuse or confront.
  - Gather clues on Factor Orlen and Church favor.
- **Story:** Harvest Night raid → Orlen boss fight → Church Knights help if you exposed him → winter rescue → four endings.
- **Wild Surge:** raw core power with a huge damage range and an 18% backfire chance.

## 8. Elf (`src/ElfScenario.jsx`, `src/elf/enemies.js`)

- All cutscenes now use `<Cinematic>`.
- Expedition fights use the combat engine, with region-themed movesets for all 14 expedition enemies.
- The Frost Giant QTE now telegraphs the attack ("A fist comes crashing down on your LEFT…") instead of showing which key to press. Crippled legs give more time, and a disabled arm removes fist attacks.

---

## Ideas for next steps

- **Equar:** port its dirty-trick fights to the shared engine, using intents so tricks like *throw sand* can cancel a wind-up.
- **Tetrabrachian Colosseum:** move it onto the engine. Its arrow-key QTE is still old-style.
- **Sound stingers** for the cutscenes (see the music brief).
- **Beastkin winter music variant;** seasonal music switching.
- **More Underworld story:** the other three Fuhmar regions, and a Doomsday that hits the Underworld first if you stayed below.
- **Save slots:** right now each scenario keeps one save.
