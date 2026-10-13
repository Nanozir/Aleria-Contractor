// beastkin/data.js — "The Hollowmere Year": a Beastkin village scenario.
// Lore anchors: Beastkin were engineered by the 7th Hero from his own mana core — true hybrids with
// keen senses and instincts, unusually potent cores but poor spell control. They live in small secluded
// villages built on farming, foraging and sharing; they are naive, and other races treat them as soft
// targets. The Church protects them as a Hero's creation — but that protection doesn't reach everywhere.
// Angelos, Lizardmen, Canine Kin, Melano and Gemea follow the author's canon. Ursan is a new sub-type for the game.

export const SUBTYPES = {
  lizardman: {
    name: "Lizardman", color: "#7fbf5a", lore: true,
    look: "Scaled, tailed, armored by nature. Acute senses. Clan-born, martial, keeps their own gods.",
    blurb: "Natural armor and a tail that sweeps the ground clean. Cold-blooded: stronger in summer, sluggish in winter.",
    stats: { hp: 135, atk: 6, def: 9, dodge: 4, mp: 30, senses: 2 },
    perks: ["+9 DEF natural armor", "Tail Sweep hits everything", "Shed Skin cleanses afflictions", "Summer +15% ATK · Winter -20% ATK"],
    actions: [
      { id: "claw", name: "Claw", dmg: [4, 10], desc: "Hooked claws." },
      { id: "tail", name: "Tail Sweep", dmg: [8, 14], staminaCost: 22, aoe: true, poise: 3, desc: "Hits every enemy. Breaks poise." },
      { id: "bite", name: "Crushing Bite", dmg: [12, 20], staminaCost: 18, effect: "bleed", desc: "Jaws lock and tear." },
      { id: "shed", name: "Shed Skin", heal: 0.12, cleanse: true, staminaCost: 15, desc: "Slough off damaged scales: heal 12%, remove afflictions." },
    ],
  },
  angelos: {
    name: "Angelos", color: "#f4f0ff", lore: true,
    look: "Pure white feathered wings, sometimes a smaller pair above the ears. Gentle, trusting, short-lived.",
    blurb: "You can fly: scout from above and read outsiders more easily. Fragile — and worth a fortune to slavers, who will come for you specifically.",
    stats: { hp: 85, atk: 2, def: 2, dodge: 22, mp: 70, senses: 3 },
    perks: ["Flight: see outsiders' true intent more often", "+22% dodge, heal with Hymn", "The Church guards Angelos closely: favor grows faster", "Slavers target you — high stakes"],
    actions: [
      { id: "buffet", name: "Wing Buffet", dmg: [4, 9], poise: 3, desc: "A blast of air. Breaks poise." },
      { id: "dive", name: "Diving Strike", dmg: [10, 18], staminaCost: 18, armorPierce: true, ranged: true, desc: "From above. Ignores armor; reaches flying foes." },
      { id: "flare", name: "Radiant Flare", dmg: [6, 10], mpCost: 18, isSpell: true, effect: "stun", desc: "Light bursts from your feathers. Stuns." },
      { id: "hymn", name: "Soothing Hymn", heal: 0.22, mpCost: 20, isSpell: true, desc: "Heal 22%." },
    ],
  },
  canine: {
    name: "Canine Kin", color: "#c8b48a", lore: true,
    look: "Canine ears and tail, a nose that never stops working. Heavily instinct-driven; not much for thinking things through.",
    blurb: "The strongest sense of smell in the valley: you read outsiders and follow trails better than anyone. Your packmates fight beside you. Your instincts run your core, too — Wild Surge is even wilder.",
    stats: { hp: 115, atk: 6, def: 4, dodge: 8, mp: 30, senses: 4 },
    perks: ["Best nose: read outsiders & track the missing", "+1 packmate ally in every fight", "Bite causes bleeding", "Instinct over thought: Wild Surge backfires 25%"],
    actions: [
      { id: "bite", name: "Bite", dmg: [5, 11], effect: "bleed", desc: "Bleeds." },
      { id: "flank", name: "Pack Flank", dmg: [12, 18], staminaCost: 16, poise: 3, desc: "You and the pack hit together." },
      { id: "howl", name: "Howl & Rush", dmg: [6, 10], staminaCost: 26, aoe: true, poise: 4, desc: "Hits every enemy. Breaks poise." },
    ],
  },
  melano: {
    name: "Melano", color: "#9a5a4a", lore: true,
    look: "Dark-skinned, tall and heavily muscled, with a minotaur's horns, hooves, legs and fur. Aggressive by nature. Melano cannot speak.",
    blurb: "Most Melano roam the highlands in bands; you were raised in Hollowmere instead. You are the strongest thing in the valley — and you have no words. The Gemea still flinch when you pass.",
    stats: { hp: 145, atk: 10, def: 5, dodge: 2, mp: 25, senses: 2 },
    perks: ["Highest ATK and HP", "Gore & Trample break poise", "Cannot speak: you bellow instead of arguing", "Village trust starts lower"],
    actions: [
      { id: "horns", name: "Horn Hook", dmg: [7, 13], desc: "A short, brutal hook of the horns." },
      { id: "gore", name: "Gore Charge", dmg: [18, 28], staminaCost: 24, poise: 6, effect: "bleed", desc: "Head down, full charge. Bleeds, huge stagger." },
      { id: "trample", name: "Trample", dmg: [10, 16], staminaCost: 26, aoe: true, poise: 3, desc: "Hooves over everything in front of you." },
      { id: "bellow", name: "Bellow", dmg: [2, 4], staminaCost: 14, aoe: true, effect: "stun", effectChance: 0.45, desc: "A wordless roar. May stun everything." },
    ],
  },
  gemea: {
    name: "Gemea", color: "#e8dcc8", lore: true,
    look: "Goat horns, fluffy wool on the hips and in the hair, a frail build. Passive, easily frightened. Mountain folk.",
    blurb: "Fragile and fearful — which keeps you alive. You notice everything, you know the mountain paths, and you're quick to bolt.",
    stats: { hp: 80, atk: 3, def: 2, dodge: 24, mp: 45, senses: 3 },
    perks: ["Skittish: +24% dodge, always alert", "Mountain forager: more herbs", "Hoof Kick can stun", "Knows the mountain paths: hunts ambush more often"],
    actions: [
      { id: "ram", name: "Ram", dmg: [4, 9], poise: 3, desc: "Horns first. Breaks poise." },
      { id: "kick", name: "Hoof Kick", dmg: [6, 12], staminaCost: 14, effect: "stun", effectChance: 0.4, desc: "Panic-strength kick. May stun." },
      { id: "wool", name: "Huddle", heal: 0.14, cleanse: true, staminaCost: 15, desc: "Curl up in your wool: heal 14%, shake off afflictions." },
    ],
  },
  ursan: {
    name: "Ursan", color: "#c88a5a", lore: false, // invented for the game, not in the lore doc
    look: "Bear-kin. Broad, slow to anger, the village's strongest back at harvest.",
    blurb: "Enormous strength and endurance. Fields yield more with you in them; in winter you can hibernate to heal.",
    stats: { hp: 155, atk: 9, def: 6, dodge: 0, mp: 25, senses: 1 },
    perks: ["Harvest work yields +50% food", "Maul breaks poise hard", "Bear Hug stuns", "Hibernate: heal 30% in a fight"],
    actions: [
      { id: "swat", name: "Swat", dmg: [6, 12], desc: "Heavy paw." },
      { id: "maul", name: "Maul", dmg: [14, 24], staminaCost: 22, poise: 6, desc: "Shattering. Big stagger." },
      { id: "hug", name: "Bear Hug", dmg: [10, 16], staminaCost: 20, effect: "stun", desc: "Crush and stun." },
      { id: "hibernate", name: "Hibernate", heal: 0.3, staminaCost: 30, desc: "Curl up and recover 30%." },
    ],
  },
};

// Potent core, poor control — every beastkin can do this.
export const WILD_SURGE = { id: "surge", name: "Wild Surge", dmg: [4, 60], mpCost: 22, isSpell: true, backfire: 0.18, desc: "Raw core power, barely aimed. Huge range. 18% it backfires." };

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
export const DAYS_PER_SEASON = 5;
export const SLOTS = ["Morning", "Evening"];

export const NOTABLES = [
  { id: "moss", name: "Elder Moss", kind: "Ursan", desc: "Keeps the seed-stores and the old stories." },
  { id: "sela", name: "Sela", kind: "Angelos", desc: "The village healer. Sings while she works." },
  { id: "kesh", name: "Kesh", kind: "Lizardman", desc: "The best hunter in Hollowmere. Doesn't talk much." },
  { id: "rook", name: "Rook", kind: "Canine Kin", desc: "Herds the goats. Can smell a stranger a valley away." },
  { id: "pip", name: "Pip", kind: "Gemea", desc: "A skittish Gemea kid who follows you everywhere anyway." },
];

export const BUILDINGS = {
  palisade: { name: "Palisade", cost: { materials: 18 }, desc: "Harvest Night raiders are weaker." },
  tower: { name: "Watchtower", cost: { materials: 12 }, desc: "See outsiders coming: +1 to reading intent." },
  smokehouse: { name: "Smokehouse", cost: { materials: 10 }, desc: "+3 food per day; winter is survivable." },
  shrine: { name: "Hero's Shrine", cost: { materials: 8, goods: 3 }, desc: "+1 Church favor; the village's trust steadies." },
  infirmary: { name: "Infirmary", cost: { materials: 12, herbs: 4 }, desc: "Sickness can't take villagers." },
};

// Enemies unique to this scenario
export const BK_ENEMIES = {
  thug: { id: "b_thug", name: "Orlen's hired hand", star: 2, hp: 70, atk: 12, def: 4, poise: 4, reward: { xp: 0, bronze: 0 },
    desc: "Polite in the village. Not out here.",
    moves: [
      { id: "club", name: "Cudgel", kind: "attack", mult: [0.9, 1.1], tell: "Hefts a cudgel." },
      { id: "net", name: "Weighted Net", kind: "attack", mult: [0.4, 0.6], status: { type: "stun", turns: 1 }, tell: "Swings a weighted net — meant for catching, not killing." },
    ] },
  netter: { id: "b_netter", name: "Syndicate netter", star: 3, hp: 85, atk: 14, def: 5, poise: 5, reward: { xp: 0, bronze: 0 },
    desc: "Carries nets, sedative darts and a price list.",
    moves: [
      { id: "dart", name: "Sedative Dart", kind: "attack", mult: [0.5, 0.7], pierce: true, status: { type: "weaken", turns: 2 }, tell: "Raises a blowpipe. (Unblockable)" },
      { id: "net", name: "Throw Net", kind: "attack", mult: [0.4, 0.6], status: { type: "stun", turns: 1 }, tell: "Spins a net overhead." },
      { id: "knife", name: "Knife", kind: "attack", mult: [0.9, 1.2], tell: "Draws a skinning knife." },
    ] },
  orlen: { id: "b_orlen", name: "Factor Orlen", star: 4, hp: 220, atk: 22, def: 10, poise: 10, reward: { xp: 0, bronze: 0 },
    desc: "Still smiling. He always smiles. A Skill-crystal glows in his cane.",
    traits: ["armored"],
    moves: [
      { id: "cane", name: "Cane Strike", kind: "attack", mult: [0.9, 1.1], tell: "Twirls his cane, almost playfully." },
      { id: "skill", name: "Skill: Silver Tongue", kind: "buff", self: { shield: 2 }, allies: { rally: 2 }, tell: "\"Now, now. Let's be reasonable,\" he says — and his men feel braver." },
      { id: "crystal", name: "Crystal Discharge", kind: "heavy", mult: [1.6, 2.0], sweep: true, tell: "The crystal in his cane flares white. (Sweep)" },
      { id: "chain", name: "Pact-chain", kind: "attack", mult: [0.6, 0.8], status: { type: "stun", turns: 1 }, tell: "Produces a sigil-chain from his coat." },
    ] },
  knight: { id: "b_knight", name: "Church Knight", star: 4, hp: 150, atk: 26, def: 16, poise: 10, reward: { xp: 0, bronze: 0 },
    desc: "Silver chains, a halo of blades.", moves: [{ id: "cut", name: "Cut", kind: "attack", mult: [0.9, 1.1], tell: "Measured footwork." }] },
};

// Outsiders who come to Hollowmere. `truth` is hidden until read. Beastkin naivety means the
// village will trust them unless you intervene.
export const OUTSIDERS = [
  { id: "trader_honest", who: "A tired human trader", pitch: "Salt, needles and lamp oil for your hides and honey. Fair weights, he swears.", truth: "honest",
    tell: { honest: "His heartbeat is slow and steady. He smells of road dust and nothing else." } },
  { id: "trader_cheat", who: "A cheerful trader with loaded scales", pitch: "Wonderful prices! Bring everything you have.", truth: "cheat",
    tell: { cheat: "His pulse jumps every time someone weighs something. There's lead in the bottom of his scale-pan." } },
  { id: "recruiter", who: "One of Factor Orlen's 'labor recruiters'", pitch: "Good work in the city for strong young folk. Food, pay, a roof. They'll write home.", truth: "slaver",
    tell: { slaver: "Under the cologne: old fear-sweat and iron. Pact-chain iron. Nobody he 'recruits' ever writes home." } },
  { id: "missionary", who: "A Church missionary", pitch: "The Church protects the Hero's children. I'm here to record your village so the knights know you're here.", truth: "honest",
    tell: { honest: "Nervous, but honest — scared of the woods, not of you." } },
  { id: "spy", who: "A 'lost traveler'", pitch: "Just need a bed and a meal. Lovely village. How many of you live here, anyway?", truth: "spy",
    tell: { spy: "He counts. Doors, children, wings. He smells of Orlen's cologne." } },
  { id: "hunter", who: "A human hunter with a fine bow", pitch: "Tracking a Kekali pack. I'll pay for a guide.", truth: "honest",
    tell: { honest: "Blood on his boots is Kekali blood. He's exactly what he says." } },
];
