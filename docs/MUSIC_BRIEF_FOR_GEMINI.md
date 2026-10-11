# Music Brief — Aleria: Contractor

A brief for composing the game's missing music. Every track below is optional: the game has a fallback for each one, so new files can be added one at a time.

## How tracks get into the game

- Put the file in **`public/audio/`** with the **exact filename** listed below.
- Use the **MP3** format, stereo, 44.1 kHz, 128–192 kbps.
- **Every track loops** (`loop = true`), so the end must flow seamlessly back into the start. Avoid fade-outs and big final cadences.
- The game plays music at about 30% volume, under its sound effects. Keep tracks mid-level without heavy mastering, and avoid sharp transients in the first second.
- Aim for 1:30–3:00 per loop. Exploration tracks can run longer.
- No vocals with words. Wordless choir or humming is fine. Lyrics would clash with the on-screen story text.

## Tracks that already exist (do not replace)

| File | Used for |
|---|---|
| `menu_bgm.mp3` | Main menu, race/difficulty select. Also the fallback for any missing scenario track. |
| `combat_bgm.mp3` | All standard fights |
| `elf_bgm.mp3` | Elf scenario (Northern Expanse) |
| `equar_bgm.mp3` | Equar merchant scenario |

---

## Tracks wanted

### 1. `tenebrim_bgm.mp3`: Menfor, the Tenebrim campaign
*Currently falls back to the menu theme.*

- **Setting:** Menfor, the northern continent: deserts, salt flats, volcanic basins and a black stone coast. Tenebrim have **no mana core**. They are coreless, physically enormous, scarred and long-lived. They live in independent clans, value endurance and legacy, and **worship no god** (many believe they were abandoned). The story is about slavery, escape and breaking the Syndicate's slave fort, Chainhold.
- **Mood:** stubborn, dry, enduring. Hope that has to be earned. No magic shimmer at all, because these people have no mana.
- **Tempo:** slow-mid, 70–85 BPM, with a walking feel.
- **Instruments:** frame drums and low hand percussion, bowed bass or low fiddle, a single breathy wooden flute or duduk-like reed, plucked low strings (oud or bouzouki colour). Optionally a low male hum. **Avoid** bells, harps, sparkly synths and celesta.
- **Reference feel:** desert caravan + funeral march + the moment someone decides to keep walking anyway.

### 2. `underworld_bgm.mp3`: the Devil scenario, Sector Three
*Currently falls back to the menu theme.*

- **Setting:** the Underworld is **not** hell. Mana sinks like cold air and pools far below the surface. It is lit by glowing crystals and bioluminescent fungi, with cities older than the surface Church. Devils keep the siphons running day and night to delay the Doomsday, and the surface never thanks them. They ride bonded beasts instead of machines. Their technology resembles the early 20th century but runs on mana crystals.
- **Mood:** vast, humming, industrious, quietly proud, a little lonely. Night-shift workers keeping the world from ending.
- **Tempo:** 80–95 BPM, with a steady mechanical pulse underneath.
- **Instruments:** a low drone (the siphons) with a slow pulsing filter, glassy mallets or a crystal-glass texture, pizzicato low strings, a muted brass chorale that swells occasionally, and subtle metallic industrial percussion (pipes, valves). Keep it **warm, not evil**. **Avoid** church organ, choirs singing "demonic" Latin, and heavy-metal guitars. The point is that the surface's idea of devils is wrong.

### 3. `beastkin_bgm.mp3`: Hollowmere village
*Currently falls back to the menu theme.*

- **Setting:** a secluded beastkin village in a forgotten valley. Beastkin were made by the 7th Hero, are naive and generous, and share everything. The scenario runs through **Spring → Summer → Autumn → Winter**, and a slaver ("Factor Orlen") is quietly circling the village.
- **Mood:** pastoral, warm, communal, with a faint undercurrent of unease (a minor-key turn every 16–32 bars). Think "folk tune everyone in the village knows".
- **Tempo:** 90–105 BPM, lilting 6/8 or a gentle 4/4.
- **Instruments:** acoustic guitar or lute, fiddle, tin whistle, hand drum, a small group humming. **Avoid** epic orchestra. This is a village, not a kingdom.
- **Bonus (optional):** a winter variant, `beastkin_winter_bgm.mp3`, with sparser, colder arrangement of the same melody. It isn't wired in yet. Tell the developer if you make it.

### 4. `doomsday_bgm.mp3`: the Doomsday waves
*Currently falls back to `combat_bgm.mp3`.*

- **Setting:** every few decades, mana overflows from the bottom of the world and tides of monsters climb to the surface. The player holds a barricade with hired militia across 5 waves before the boss appears.
- **Mood:** desperate, relentless, siege. Should feel bigger and more hopeless than normal combat.
- **Tempo:** 130–150 BPM.
- **Instruments:** taiko or war drums, low brass ostinato, aggressive staccato strings, and a short rising motif that repeats as if the earth were "breathing". Hint at the Lumenari motif (below) near the end of the loop.

### 5. `lumenari_bgm.mp3`: the final boss
*Currently falls back to a procedurally generated synth score.*

- **Lore:** a Lumenari is a core that grew past its ability to hold mana. It is **not angry and not cruel**. It drifts, calm and almost blissful, unaware of the destruction it causes. Its body is smooth polished stone (marble or obsidian) with **gold or silver cracks that pulse like a heartbeat**, and it flickers between solid and intangible. It is burning itself out as it fights.
- **Mood:** awe and terror at once. Beautiful and wrong. The music should be **serene on top and catastrophic underneath**.
- **Tempo:** a slow, floating pulse (about 60 BPM feel) over driving lower layers (120 BPM).
- **Instruments:** a high, pure, wordless soprano or choir pad (the calm), heavy low strings and timpani (the destruction), and a recurring **heartbeat pulse** (two beats, then silence), echoing the pulsing cracks. Glassy shimmer with **bitcrushed or distorted edges** to suggest it flickering in and out of reality.
- **Structure:** the fight has 3 phases (Grounded → Levitating → Unbound) but uses **one looping file**. Let the loop build from calm to intense, so wherever the player is, it feels like it is escalating.

---

## Short stingers (optional, not wired in yet)

If you make any of these, put them in `public/audio/stingers/` and tell the developer, who will hook them into the cutscenes:

| File | Length | Moment |
|---|---|---|
| `doomsday_has_come.mp3` | 4–6 s | Final card of the Doomsday cutscene: a huge low hit and a rising scream |
| `lumenari_shatters.mp3` | 4–6 s | The Lumenari's core breaks: a glass shatter that resolves into silence |
| `chain_breaks.mp3` | 3–4 s | Tenebrim breaks a slave pact: tension, then release |
| `harvest_night.mp3` | 4–6 s | Beastkin raid begins: village folk motif turning minor |

## World notes (shared context for every track)

- **Aleria** is a fantasy world where people from Earth are summoned as "Heroes" to fight the recurring **Doomsday**. The tone mixes **dry humour with real darkness**, as the title *A Guide for Heroes (Who'd Rather Not Be)* suggests.
- **Mana** is a real physical-ish substance: it sinks, pools, poisons and builds up. Music that is "magical" should sound like *pressure and resonance*, not fairy dust.
- Each race has its own sound world. Keep them distinct from one another:
  - Elves: frozen steam-industry.
  - Equar: quick and roguish.
  - Tenebrim: dry, percussive, mana-less.
  - Devils: humming, deep, warm-industrial.
  - Beastkin: folk and pastoral.
