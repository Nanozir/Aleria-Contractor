// monsters.js — Monster roster with movesets, telegraphs and traits.
// Move damage is a multiplier range of the monster's (scaled) atk, so difficulty scaling carries over.
//
// Move fields:
//   kind:      "attack" | "heavy" | "multi" | "charge" | "buff" | "drain"
//   mult:      [min,max] multiplier of atk
//   hits:      number of hits (multi)
//   sweep:     true  -> wide attack, cannot be evaded, Guard reduces it heavily
//   pierce:    true  -> unblockable, Guard does nothing, Evade is the answer
//   status:    { type, turns, power } applied to the player on hit
//   next:      move id forced on the following turn (wind-ups)
//   tell:      telegraph text shown as the monster's intent
//   weight:    selection weight (default 1)
//   airborne:  monster cannot be hit by melee while this intent is shown
//
// Traits: regen, explode, pack, feedback, blindHunter, pressure, clone, enrage, armored, manaEater

export const STATUS_INFO = {
  bleed: { label: "Bleeding", color: "#e85c3a", icon: "🩸", desc: "Lose HP every round." },
  burn: { label: "Burning", color: "#ff8c00", icon: "🔥", desc: "Lose HP every round." },
  acid: { label: "Corroded", color: "#9be35a", icon: "🧪", desc: "Armor weakened." },
  stun: { label: "Stunned", color: "#ffd966", icon: "💫", desc: "Lose your next turn." },
  blind: { label: "Blinded", color: "#a89df0", icon: "🌫", desc: "Attacks miss more often." },
  weaken: { label: "Weakened", color: "#c48cff", icon: "⬇", desc: "Deal less damage." },
  rally: { label: "Rallied", color: "#e0a523", icon: "📯", desc: "Deals more damage." },
  shield: { label: "Hardened", color: "#87cefa", icon: "🛡", desc: "Takes less damage." },
  confuse: { label: "Confused", color: "#ff6bcb", icon: "❓", desc: "May strike its allies." },
  staggered: { label: "Staggered", color: "#ffd966", icon: "✷", desc: "Skips its action and takes +50% damage." },
  recharging: { label: "Recharging", color: "#3ec995", icon: "⟳", desc: "Exposed: takes +50% damage." },
};

export const MONSTERS = [
  // ── Star 1 ──
  { id: "crystone", name: "Crystone", star: 1, hp: 40, atk: 8, def: 4, poise: 3, reward: { xp: 30, bronze: 7 },
    desc: "A spiked stone with an eye that opens far too late.",
    traits: ["regen", "manaEater"],
    moves: [
      { id: "lash", name: "Tentacle Lash", kind: "drain", mult: [0.8, 1.0], tell: "Its eye opens. A tentacle coils back.", drain: 12 },
      { id: "spinup", name: "Spin Up", kind: "charge", tell: "Its plates begin to rotate faster and faster…", next: "winds", weight: 0.7 },
      { id: "winds", name: "Cutting Winds", kind: "attack", mult: [1.4, 1.8], sweep: true, tell: "The spinning plates fling out a storm of cutting wind!", hidden: true },
    ] },
  { id: "cur", name: "Mana-touched cur", star: 1, hp: 35, atk: 7, def: 1, poise: 2, reward: { xp: 28, bronze: 6 },
    desc: "A lean dog with luminous eyes.",
    traits: ["pack"],
    moves: [
      { id: "bite", name: "Bite", kind: "attack", mult: [0.9, 1.2], tell: "Snarls and lunges for your arm." },
      { id: "maul", name: "Hamstring", kind: "attack", mult: [0.7, 0.9], status: { type: "bleed", turns: 2, power: 3 }, tell: "Circles low, eyeing your legs." },
    ] },
  { id: "crawler", name: "Tunnel crawler", star: 1, hp: 50, atk: 10, def: 3, poise: 3, reward: { xp: 40, bronze: 9 },
    desc: "Six-limbed. Always closer than it looked.",
    moves: [
      { id: "rake", name: "Claw Rake", kind: "attack", mult: [0.9, 1.2], tell: "Rears up on four legs, claws spread." },
      { id: "burrow", name: "Burrow", kind: "buff", self: { shield: 2 }, tell: "Starts digging in. It will be harder to hurt." },
      { id: "erupt", name: "Erupt", kind: "heavy", mult: [1.5, 1.9], pierce: true, tell: "The ground bulges beneath you!", weight: 0.6 },
    ] },
  // ── Star 2 ──
  { id: "shafo", name: "Shafo", star: 2, hp: 70, atk: 12, def: 4, poise: 4, reward: { xp: 55, bronze: 15 },
    desc: "A black-furred biped with one orange eye and a far-too-wide grin. Pack leader.",
    traits: ["pack"],
    moves: [
      { id: "claw", name: "Grin & Claw", kind: "attack", mult: [0.9, 1.2], tell: "Grins wider. Thick claws flex." },
      { id: "howl", name: "Rally Howl", kind: "buff", allies: { rally: 2 }, tell: "Throws its head back to howl — the pack will hit harder.", weight: 0.6 },
      { id: "gore", name: "Horn Gore", kind: "heavy", mult: [1.5, 1.9], status: { type: "bleed", turns: 2, power: 4 }, tell: "Lowers its single horn and paws the ground." },
    ] },
  { id: "blobooze", name: "Blobooze", star: 2, hp: 85, atk: 11, def: 2, poise: 5, reward: { xp: 55, bronze: 14 },
    desc: "Lures you in with a dopey grin. The tentacles do the rest.",
    moves: [
      { id: "grab", name: "Tentacle Grab", kind: "attack", mult: [0.5, 0.7], status: { type: "stun", turns: 1 }, tell: "Grins dopily. Tentacles slither along the ground…", weight: 0.8 },
      { id: "ram", name: "Crown Ram", kind: "heavy", mult: [1.6, 2.0], tell: "Lowers its crystal crown like a battering ram." },
      { id: "slap", name: "Slap", kind: "attack", mult: [0.8, 1.0], tell: "Wobbles closer." },
    ] },
  { id: "gasgees", name: "Gasgees", star: 2, hp: 75, atk: 12, def: 5, poise: 4, reward: { xp: 60, bronze: 18 },
    desc: "Docile — until someone gets near its Pompas pouch.",
    moves: [
      { id: "rear", name: "Rear Up", kind: "charge", tell: "Rears up and aims its pouch at you. Muscles contract…", next: "blast" },
      { id: "blast", name: "Acid Slurry Blast", kind: "heavy", mult: [1.5, 1.8], sweep: true, status: { type: "acid", turns: 3, power: 6 }, tell: "A high-pressure stream of acid slurry erupts from the pouch!", hidden: true },
      { id: "kick", name: "Root-leg Kick", kind: "attack", mult: [0.8, 1.1], tell: "Stamps its root-like legs." },
    ] },
  { id: "wanderer", name: "Gaunt wanderer", star: 2, hp: 65, atk: 14, def: 2, poise: 3, reward: { xp: 55, bronze: 14 },
    desc: "Used to be human. Mana poisoning finished the job.",
    traits: ["enrage"],
    moves: [
      { id: "claw", name: "Claw", kind: "attack", mult: [0.9, 1.2], tell: "Shambles forward, hands hooked." },
      { id: "flail", name: "Desperate Flail", kind: "multi", hits: 3, mult: [0.4, 0.55], tell: "Shrieks and flails wildly." },
    ] },
  // ── Star 3 ──
  { id: "kekali", name: "Kekali huntress", star: 3, hp: 90, atk: 17, def: 5, poise: 5, reward: { xp: 90, bronze: 30 },
    desc: "Fox-eared, scale-plated, amber-eyed. Hunts in coordinated packs.",
    traits: ["pack"],
    moves: [
      { id: "pounce", name: "Pack Pounce", kind: "multi", hits: 2, mult: [0.55, 0.75], tell: "Crouches. Ears flatten." },
      { id: "flank", name: "Flanking Rake", kind: "attack", mult: [1.0, 1.3], pierce: true, tell: "Slips around your guard — it's going for your blind side!" },
      { id: "gaze", name: "Testing Gaze", kind: "buff", self: { shield: 1 }, tell: "Watches you intently, judging your strength." , weight: 0.5 },
    ] },
  { id: "brute", name: "Stone-backed brute", star: 3, hp: 100, atk: 19, def: 11, poise: 9, reward: { xp: 90, bronze: 28 },
    desc: "A hulking quadruped with a back like a cliff face.",
    traits: ["armored"],
    moves: [
      { id: "slam", name: "Slam", kind: "attack", mult: [0.9, 1.2], tell: "Lifts a front leg high." },
      { id: "brace", name: "Lower Head", kind: "charge", tell: "Lowers its head and scrapes the ground. A charge is coming!", next: "charge" },
      { id: "charge", name: "Charge", kind: "heavy", mult: [1.8, 2.3], tell: "It thunders forward, head down!", hidden: true },
    ] },
  { id: "veilstalker", name: "Veilstalker", star: 3, hp: 80, atk: 24, def: 5, poise: 4, reward: { xp: 105, bronze: 35 },
    desc: "Translucent and fast. You see it best when it's already striking.",
    moves: [
      { id: "strike", name: "Strike", kind: "attack", mult: [0.9, 1.15], tell: "Flickers at the edge of your vision." },
      { id: "fade", name: "Fade", kind: "charge", tell: "It fades from sight entirely…", next: "ambush", airborne: true },
      { id: "ambush", name: "Veil Ambush", kind: "heavy", mult: [1.5, 1.9], pierce: true, tell: "It is right behind you —", hidden: true },
    ] },
  // ── Star 4 ──
  { id: "drakein", name: "Drakein", star: 4, hp: 150, atk: 28, def: 10, poise: 8, reward: { xp: 160, bronze: 60 },
    desc: "Obsidian scales, scythe claws and violet lightning along its spine.",
    moves: [
      { id: "scythe", name: "Scythe Slash", kind: "attack", mult: [0.9, 1.15], status: { type: "bleed", turns: 3, power: 5 }, tell: "Its sickle claws curve forward." },
      { id: "climb", name: "Wall Climb", kind: "charge", tell: "Violet energy crackles — it scrambles up the wall above you!", next: "dive", airborne: true },
      { id: "dive", name: "Electrified Dive", kind: "heavy", mult: [1.8, 2.2], pierce: true, status: { type: "stun", turns: 1 }, tell: "It drops from the wall wreathed in violet lightning!", hidden: true },
    ] },
  { id: "fire_drakein", name: "Fire Drakein", star: 4, hp: 140, atk: 26, def: 14, poise: 10, reward: { xp: 160, bronze: 62 },
    desc: "A ball of volcanic rock on spider legs. Do not be near it when it breaks.",
    traits: ["explode", "armored"],
    moves: [
      { id: "spit", name: "Lava Spit", kind: "attack", mult: [0.8, 1.0], status: { type: "burn", turns: 3, power: 5 }, tell: "The red eye glows. Magma bubbles in its maw." },
      { id: "roll", name: "Scorching Roll", kind: "heavy", mult: [1.5, 1.9], sweep: true, tell: "Tucks in its legs and starts rolling!" },
    ] },
  { id: "feaster", name: "Feaster", star: 4, hp: 170, atk: 27, def: 9, poise: 9, reward: { xp: 170, bronze: 65 },
    desc: "Bark-hide, horned tendrils, molten-gold eyes.",
    moves: [
      { id: "rend", name: "Claw Rend", kind: "attack", mult: [0.9, 1.2], tell: "Long curved claws sweep back." },
      { id: "coil", name: "Coil Neck", kind: "charge", tell: "It coils its neck inward and opens its maw wide. A wet gurgling rises from its throat…", next: "torrent" },
      { id: "torrent", name: "Acid Torrent", kind: "heavy", mult: [1.7, 2.1], sweep: true, status: { type: "acid", turns: 3, power: 8 }, tell: "A torrent of acidic sludge floods out of its maw!", hidden: true },
    ] },
  { id: "stalker", name: "Stalker", star: 4, hp: 140, atk: 30, def: 7, poise: 7, reward: { xp: 165, bronze: 62 },
    desc: "Eyeless. It hunts by sound alone — hold still and it loses you.",
    traits: ["blindHunter"],
    moves: [
      { id: "listen", name: "Listen", kind: "charge", tell: "Its rabbit-like ears twitch. It is listening for you…", next: "pounce" },
      { id: "pounce", name: "Pounce", kind: "heavy", mult: [1.7, 2.1], tell: "Its ears lock onto you. It pounces!", hidden: true },
      { id: "screech", name: "Screech", kind: "attack", mult: [0.6, 0.8], sweep: true, status: { type: "stun", turns: 1 }, tell: "Throat swells — a screech is coming.", weight: 0.6 },
      { id: "bite", name: "Maw Bite", kind: "attack", mult: [0.9, 1.15], tell: "Rows of teeth snap toward the last sound." },
    ] },
  { id: "mana_horror", name: "Mana horror", star: 4, hp: 140, atk: 30, def: 8, poise: 6, reward: { xp: 160, bronze: 60 },
    desc: "Corrupted mana given shape.",
    traits: ["manaEater"],
    moves: [
      { id: "slam", name: "Slam", kind: "attack", mult: [0.9, 1.2], tell: "Its mass bunches up." },
      { id: "drain", name: "Drain", kind: "drain", mult: [0.5, 0.7], drain: 20, tell: "It reaches for your core." },
    ] },
  // ── Star 5 ──
  { id: "ritfien", name: "Ritfien", star: 5, hp: 220, atk: 36, def: 14, poise: 11, reward: { xp: 250, bronze: 110 },
    desc: "Glowing cracks vent unstable mana. Touching it hurts you too.",
    traits: ["feedback"],
    moves: [
      { id: "lash", name: "Crack Lash", kind: "attack", mult: [0.9, 1.15], tell: "The cracks along its arm flare." },
      { id: "vent", name: "Mana Vent", kind: "heavy", mult: [1.3, 1.6], sweep: true, status: { type: "burn", turns: 2, power: 7 }, tell: "Every crack glows white. It is about to vent!" },
    ] },
  { id: "vekrath", name: "Vekrath", star: 5, hp: 190, atk: 40, def: 10, poise: 8, reward: { xp: 260, bronze: 115 },
    desc: "A black dive-bird. Witnesses report a pressure change, a blur, then the aftermath.",
    moves: [
      { id: "jab", name: "Beak Jab", kind: "attack", mult: [0.8, 1.0], tell: "Hops closer, beak half-open." },
      { id: "climb", name: "Climb", kind: "charge", tell: "It beats its wings and climbs out of sight. The air goes very still…", next: "dive", airborne: true },
      { id: "dive", name: "Silent Dive", kind: "heavy", mult: [2.2, 2.7], pierce: true, tell: "A sudden pressure change in the air —", hidden: true },
    ] },
  { id: "huliut", name: "Huliut", star: 5, hp: 210, atk: 38, def: 12, poise: 10, reward: { xp: 270, bronze: 120 },
    desc: "Blindfolded, mouth sewn shut, its core floating above its head. It senses mana — not sight.",
    traits: ["pressure", "clone"],
    moves: [
      { id: "gap", name: "Gap Strike", kind: "multi", hits: 3, mult: [0.45, 0.6], tell: "It doesn't move. Then it has moved." },
      { id: "burst", name: "Core Burst", kind: "heavy", mult: [1.5, 1.8], sweep: true, selfStatus: { recharging: 2 }, tell: "The floating core brightens painfully. Omnidirectional burst incoming!" },
    ] },
  { id: "deep_stalker", name: "Deep stalker", star: 5, hp: 200, atk: 40, def: 15, poise: 9, reward: { xp: 250, bronze: 110 },
    desc: "It shouldn't be on the surface.",
    traits: ["enrage"],
    moves: [
      { id: "rend", name: "Rend", kind: "attack", mult: [0.9, 1.15], status: { type: "bleed", turns: 2, power: 6 }, tell: "Joints crack as it unfolds." },
      { id: "crush", name: "Crushing Embrace", kind: "heavy", mult: [1.6, 2.0], tell: "Opens its arms impossibly wide." },
    ] },
];

export const UW_MONSTERS = [
  { id: "uw_fiend", name: "Mana fiend", star: 3, hp: 110, atk: 22, def: 8, poise: 5, reward: { xp: 80, bronze: 22 },
    desc: "Aggressive. Born from a pocket of pooled mana.",
    traits: ["manaEater"],
    moves: [
      { id: "surge", name: "Surge", kind: "attack", mult: [0.9, 1.2], tell: "It crackles and surges forward." },
      { id: "lash", name: "Mana Lash", kind: "drain", mult: [0.6, 0.8], drain: 15, tell: "Mana threads whip toward you." },
    ] },
  { id: "uw_crusher", name: "Depth crusher", star: 4, hp: 160, atk: 32, def: 14, poise: 12, reward: { xp: 140, bronze: 48 },
    desc: "Enormous. The tunnels were built around things like this.",
    traits: ["armored"],
    moves: [
      { id: "slam", name: "Slam", kind: "attack", mult: [0.9, 1.2], tell: "Raises a fist the size of a cart." },
      { id: "quake", name: "Quake", kind: "heavy", mult: [1.3, 1.6], sweep: true, status: { type: "stun", turns: 1 }, tell: "Both fists rise over its head — it will shake the cavern!" },
    ] },
  { id: "uw_drakein", name: "Tunnel Fire Drakein", star: 4, hp: 150, atk: 30, def: 14, poise: 10, reward: { xp: 150, bronze: 55 },
    desc: "Leaves trails of scorched stone through the siphon tunnels.",
    traits: ["explode", "armored"],
    moves: [
      { id: "spit", name: "Lava Spit", kind: "attack", mult: [0.8, 1.0], status: { type: "burn", turns: 3, power: 6 }, tell: "Magma bubbles in its maw." },
      { id: "roll", name: "Scorching Roll", kind: "heavy", mult: [1.5, 1.9], sweep: true, tell: "Tucks in its legs and starts rolling!" },
    ] },
  { id: "uw_ritfien", name: "Ritfien", star: 5, hp: 230, atk: 38, def: 14, poise: 11, reward: { xp: 240, bronze: 100 },
    desc: "A high-mana mid-predator. Its cracks vent raw mana.",
    traits: ["feedback"],
    moves: [
      { id: "lash", name: "Crack Lash", kind: "attack", mult: [0.9, 1.15], tell: "The cracks along its arm flare." },
      { id: "vent", name: "Mana Vent", kind: "heavy", mult: [1.3, 1.6], sweep: true, status: { type: "burn", turns: 2, power: 7 }, tell: "Every crack glows white. It is about to vent!" },
    ] },
];

// Human enemies for scenario-specific fights (slavers, rival clans, church knights…)
export const HUMANOIDS = {
  slaver: { id: "slaver", name: "Syndicate enforcer", star: 3, hp: 90, atk: 16, def: 6, poise: 5, reward: { xp: 60, bronze: 40 },
    desc: "Carries a pact-chain and a whip.",
    moves: [
      { id: "whip", name: "Whip Crack", kind: "attack", mult: [0.8, 1.0], status: { type: "bleed", turns: 2, power: 4 }, tell: "Uncoils a barbed whip." },
      { id: "chain", name: "Pact Chain", kind: "attack", mult: [0.6, 0.8], status: { type: "stun", turns: 1 }, tell: "Swings a binding chain at your legs." },
      { id: "club", name: "Club", kind: "heavy", mult: [1.4, 1.7], tell: "Two-handed overhead swing." },
    ] },
  knight: { id: "knight", name: "Church Knight", star: 4, hp: 150, atk: 26, def: 16, poise: 10, reward: { xp: 150, bronze: 80 },
    desc: "Silver chains over black cloth, a halo of blades.",
    traits: ["armored"],
    moves: [
      { id: "cut", name: "Disciplined Cut", kind: "attack", mult: [0.9, 1.1], tell: "Measured footwork. Blade high." },
      { id: "skill", name: "Skill: Radiant Thrust", kind: "heavy", mult: [1.6, 2.0], pierce: true, tell: "The halo flares. A Skill is activating!" },
      { id: "brace", name: "Chain Guard", kind: "buff", self: { shield: 2 }, tell: "Wraps chains around its forearm." },
    ] },
};

export const ALL_MONSTERS = [...MONSTERS, ...UW_MONSTERS, ...Object.values(HUMANOIDS)];
export const findMonster = (id) => ALL_MONSTERS.find(m => m.id === id);
