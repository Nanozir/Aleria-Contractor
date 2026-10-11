// tenebrim/data.js — Static data for the Tenebrim scenario.
// Lore anchors: Tenebrim have no core (no mana, no passive healing — scars stay, illness hits harder),
// they come from Menfor (deserts, badlands, volcanic ranges), live in independent clans, value
// endurance and legacy, and are easily bound by slave pacts because nothing buffers the binding.

export const HERITAGE = [
  { id: "stonehide", name: "Stone Hide", desc: "Skin like weathered basalt. +6 DEF and wounds are rarer.", def: 6, woundResist: 0.35 },
  { id: "emberblood", name: "Ember Blood", desc: "Born near the vents. Immune to burning; heat and thirst wear on you slower.", immune: ["burn"], thirstMult: 0.6 },
  { id: "stillness", name: "Hunter's Stillness", desc: "You can stop breathing for a minute. Far better at ambushes, +8% dodge.", ambush: 0.25, dodge: 8 },
  { id: "ironlungs", name: "Iron Lungs", desc: "You never seem to tire. +25 max stamina, start fights with Fury.", stamina: 25, fury: 30 },
];

export const REGIONS = {
  ashveil: { name: "Ashveil Basin", x: 18, y: 58, danger: 1, water: "spring", links: ["redmaw", "saltflat"], clan: "emberhide",
    desc: "Black sand, hot springs and the steam of the vents. The Emberhide forges glow at night.",
    beasts: ["cur", "crawler", "shafo"], forage: { food: [2, 5], materials: [2, 4], herbs: [0, 2] } },
  redmaw: { name: "Red Maw Canyon", x: 38, y: 36, danger: 2, water: "seep", links: ["ashveil", "bonefield", "glassdunes"], clan: "redmaw",
    desc: "A wound in the earth, walls stained rust-red. Raiders' country.",
    beasts: ["shafo", "wanderer", "gasgees"], forage: { food: [1, 4], materials: [3, 6], herbs: [0, 1] } },
  saltflat: { name: "Bone-Salt Flats", x: 30, y: 78, danger: 2, water: "none", links: ["ashveil", "blackcoast"],
    desc: "White to the horizon. The salt keeps the bones of everything that tried to cross it.",
    beasts: ["crawler", "cur", "kekali"], forage: { food: [0, 2], materials: [2, 5], herbs: [0, 1] } },
  bonefield: { name: "Boneyard of Giants", x: 58, y: 22, danger: 3, water: "seep", links: ["redmaw", "monarch"], clan: "stoneoath",
    desc: "Ribs the size of longhouses. The Stoneoath hold their oaths among them.",
    beasts: ["brute", "veilstalker", "kekali"], forage: { food: [2, 4], materials: [3, 6], herbs: [1, 2] } },
  glassdunes: { name: "Glass Dune Sea", x: 62, y: 52, danger: 3, water: "none", links: ["redmaw", "monarch", "oasis"],
    desc: "Sand fused to glass by some ancient heat. It sings when the wind crosses it.",
    beasts: ["veilstalker", "drakein", "gasgees"], forage: { food: [0, 2], materials: [4, 7], herbs: [0, 1] } },
  oasis: { name: "The Last Oasis", x: 78, y: 70, danger: 2, water: "spring", links: ["glassdunes", "blackcoast"], clan: "wellkeepers",
    desc: "Palms, shade, and water that tastes of iron. The Wellkeepers turn nobody away — once.",
    beasts: ["gasgees", "blobooze", "cur"], forage: { food: [3, 6], materials: [1, 3], herbs: [2, 4] } },
  blackcoast: { name: "Black Stone Coast", x: 52, y: 88, danger: 4, water: "seep", links: ["saltflat", "oasis"], fort: true,
    desc: "Basalt cliffs over a cold sea. Chainhold squats on the headland — the Syndicate's fort.",
    beasts: ["stalker", "feaster", "kekali"], forage: { food: [2, 4], materials: [2, 5], herbs: [0, 2] } },
  monarch: { name: "Ruined Monarch Lands", x: 84, y: 28, danger: 5, water: "seep", links: ["bonefield", "glassdunes"], relic: true,
    desc: "Where the Grand Monarch once kept beasts no one else could tame. The air is wrong here.",
    beasts: ["vekrath", "huliut", "fire_drakein"], forage: { food: [1, 3], materials: [4, 8], herbs: [1, 3] } },
};

export const CLANS = {
  emberhide: { name: "Emberhide", region: "ashveil", color: "#ff8c42", trait: "Smiths and warriors. Respect strength and kept promises.",
    trade: { give: "materials", get: "weapon" }, champion: "Emberhide Forgeguard" },
  redmaw: { name: "Red Maw", region: "redmaw", color: "#e85c3a", trait: "Raiders. Respect only what can take from them.",
    trade: { give: "trophies", get: "food" }, champion: "Red Maw Reaver" },
  stoneoath: { name: "Stoneoath", region: "bonefield", color: "#c8b48a", trait: "Keepers of the old oaths. Honor duels settle everything.",
    trade: { give: "materials", get: "herbs" }, champion: "Stoneoath Oathkeeper" },
  wellkeepers: { name: "Wellkeepers", region: "oasis", color: "#4dd9c2", trait: "Healers and water-finders. Peaceful, and tired of burying people.",
    trade: { give: "food", get: "water" }, champion: "Wellkeeper Warden" },
};

export const ROLES = {
  hunter: { label: "Hunter", desc: "+2 food each day.", icon: "🏹" },
  scout: { label: "Scout", desc: "Better ambushes. Spots caravans.", icon: "👁" },
  healer: { label: "Healer", desc: "Wounds close faster.", icon: "🌿" },
  warrior: { label: "Warrior", desc: "Fights beside you.", icon: "⚔" },
};

export const NAMES = ["Ashka", "Varo", "Imre", "Tesh", "Kaela", "Duun", "Morra", "Sefu", "Ilka", "Thorn", "Rhyz", "Oda", "Bekka", "Juro", "Naal", "Sorrin", "Halde", "Vesh", "Yarra", "Koh"];

export const WOUNDS = {
  arm: { name: "Broken arm", days: 6, desc: "-25% damage.", atkMult: 0.75 },
  ribs: { name: "Cracked ribs", days: 5, desc: "-5 DEF.", def: -5 },
  leg: { name: "Torn leg", days: 5, desc: "-15 dodge, travel costs more water.", dodge: -15 },
  head: { name: "Concussion", days: 3, desc: "Start fights blinded.", blind: true },
  gash: { name: "Deep gash", days: 4, desc: "Start fights bleeding.", bleed: true },
};

export const TECHNIQUES = [
  { id: "endure", name: "Endure Pain", desc: "Wound penalties halved. Blows and beasts can no longer stun you (pact-chains still can).", hint: "Survive 6 wounds", check: g => g.counters.wounds >= 6 },
  { id: "stillstrike", name: "Predator's Stillness", desc: "+12 dodge, and ambushes succeed more often.", hint: "Win 4 ambushes", check: g => g.counters.ambushWins >= 4 },
  { id: "laststand", name: "Last Stand", desc: "+12 ATK while below 35% HP (start-of-fight check) and +30 starting Fury.", hint: "Win 3 fights below 20% HP", check: g => g.counters.lastStand >= 3 },
  { id: "ironstomach", name: "Iron Stomach", desc: "Risky meat no longer sickens you. Hunger drains slower.", hint: "Eat risky meat 3 times", check: g => g.counters.riskyMeals >= 3 },
  { id: "unbreakable", name: "Unbreakable", desc: "Each scar you carry adds +1 DEF (max +10).", hint: "Carry 4 scars", check: g => g.scars >= 4 },
  { id: "clanhunter", name: "Clan Hunter", desc: "+6 ATK against beasts, hunts yield more.", hint: "Kill 20 beasts", check: g => g.counters.kills >= 20 },
  { id: "chainbreaker", name: "Chainbreaker", desc: "Pact-chains can't bind you. Immune to the Pactmaster's binding.", hint: "Break a slave pact — or free 10 captives", check: g => g.flags.pactBroken || g.counters.freed >= 10 },
];

export const WEAPONS = [
  { id: "fists", name: "Bare hands", atk: 0 },
  { id: "bonespear", name: "Bone spear", atk: 6, cost: { materials: 8 } },
  { id: "obsidian", name: "Obsidian cleaver", atk: 12, cost: { materials: 18, trophies: 1 } },
  { id: "emberaxe", name: "Emberhide war-axe", atk: 20, cost: { materials: 30, trophies: 3 }, needs: "forge" },
  { id: "monarchfang", name: "Monarch's Fang", atk: 30, cost: { materials: 40, trophies: 6 }, needs: "forge" },
];

export const CAMP_BUILDINGS = {
  rack: { name: "Drying racks", cost: { materials: 10 }, desc: "+3 food per day." },
  cistern: { name: "Cistern", cost: { materials: 14 }, desc: "+3 water per day." },
  forge: { name: "Stone forge", cost: { materials: 20, trophies: 2 }, desc: "Craft the best weapons." },
  totem: { name: "Totem of Deeds", cost: { materials: 16, trophies: 3 }, desc: "+1 Legacy per day. Clans respect you more (+10 relation once)." },
  palisade: { name: "Palisade", cost: { materials: 24 }, desc: "Syndicate Grip rises more slowly (-1 per day)." },
};

// Tenebrim-only enemies (Syndicate and clans). Same shape as combat/monsters.js.
export const TEN_ENEMIES = {
  slaver: { id: "t_slaver", name: "Syndicate slaver", star: 2, hp: 75, atk: 13, def: 5, poise: 4, reward: { xp: 0, bronze: 0 },
    desc: "Pact-chains on his belt. He's done this before.",
    moves: [
      { id: "whip", name: "Barbed Whip", kind: "attack", mult: [0.8, 1.0], status: { type: "bleed", turns: 2, power: 3 }, tell: "Uncoils a barbed whip." },
      { id: "chain", name: "Pact Chain", kind: "attack", mult: [0.5, 0.7], status: { type: "stun", turns: 1 }, pact: true, tell: "Swings a sigil-marked chain at your legs. (Binds the coreless!)" },
      { id: "club", name: "Club", kind: "heavy", mult: [1.4, 1.7], tell: "Two-handed overhead swing." },
    ] },
  crossbow: { id: "t_crossbow", name: "Syndicate crossbowman", star: 2, hp: 60, atk: 15, def: 3, poise: 3, reward: { xp: 0, bronze: 0 },
    desc: "Stays behind the others. Reloads slowly.",
    moves: [
      { id: "aim", name: "Take Aim", kind: "charge", tell: "Levels the crossbow at your chest…", next: "bolt" },
      { id: "bolt", name: "Bolt", kind: "heavy", mult: [1.6, 2.0], pierce: true, tell: "Fires!", hidden: true },
      { id: "stab", name: "Knife", kind: "attack", mult: [0.7, 0.9], tell: "Draws a knife." },
    ] },
  houseguard: { id: "t_guard", name: "House guard", star: 3, hp: 95, atk: 16, def: 9, poise: 6, reward: { xp: 0, bronze: 0 },
    desc: "Elysandrian steel and a bored face — until now.",
    moves: [
      { id: "cut", name: "Halberd Cut", kind: "attack", mult: [0.9, 1.1], tell: "Sets his feet and swings." },
      { id: "sweep", name: "Halberd Sweep", kind: "heavy", mult: [1.3, 1.6], sweep: true, tell: "Swings the halberd wide and low." },
      { id: "alarm", name: "Shout for help", kind: "buff", allies: { rally: 2 }, tell: "Fills his lungs to shout for help!" },
    ] },
  champion: { id: "t_champion", name: "Clan champion", star: 3, hp: 120, atk: 18, def: 8, poise: 8, reward: { xp: 0, bronze: 0 },
    desc: "Coreless like you. Every scar on them is a story they'll make you listen to.",
    moves: [
      { id: "feint", name: "Feint", kind: "attack", mult: [0.8, 1.0], pierce: true, tell: "Shifts weight — a feint toward your blind side." },
      { id: "maul", name: "Clan Maul", kind: "heavy", mult: [1.5, 1.9], tell: "Raises a maul in both hands, roaring." },
      { id: "grip", name: "Iron Grip", kind: "attack", mult: [0.7, 0.9], status: { type: "stun", turns: 1 }, tell: "Reaches to grab your wrist." },
    ] },
  pactmaster: { id: "t_pactmaster", name: "Pactmaster Varn", star: 5, hp: 320, atk: 26, def: 14, poise: 14, reward: { xp: 0, bronze: 0 },
    desc: "He has bound a thousand coreless souls. He keeps their sigils in a ledger he never lets go of.",
    traits: ["armored"],
    moves: [
      { id: "bind", name: "Soul Binding", kind: "charge", tell: "He opens the ledger. A fresh sigil burns in the air between you…", next: "kneel" },
      { id: "kneel", name: "Command: KNEEL", kind: "heavy", mult: [2.0, 2.4], pierce: true, pact: true, status: { type: "stun", turns: 1 }, tell: "\"Kneel.\" The pact reaches for your soul — nothing in you to buffer it!", hidden: true },
      { id: "lash", name: "Sigil Lash", kind: "attack", mult: [0.9, 1.1], status: { type: "bleed", turns: 2, power: 5 }, tell: "Snaps a chain wreathed in sigils." },
      { id: "blades", name: "Hired Blades", kind: "buff", self: { shield: 2 }, allies: { rally: 2 }, tell: "Signals his guards to close in." },
      { id: "flare", name: "Ledger Flare", kind: "heavy", mult: [1.3, 1.6], sweep: true, tell: "Tears out a page. Every sigil on it ignites." },
    ] },
};

export const TEN_ACTIONS = [
  { id: "strike", name: "Strike", dmg: [4, 9], desc: "Direct, brutal, reliable." },
  { id: "heavy", name: "Heavy blow", dmg: [10, 18], staminaCost: 18, poise: 4, desc: "Breaks poise." },
  { id: "grapple", name: "Grapple", dmg: [8, 14], staminaCost: 16, effect: "stun", desc: "Pin and crush. Stuns." },
  { id: "rend", name: "Rend", dmg: [14, 22], staminaCost: 22, effect: "bleed", desc: "Tear flesh. Bleeds." },
  { id: "bonebreaker", name: "Bone-Breaker", dmg: [26, 38], furyCost: 40, poise: 6, effect: "stun", desc: "Fury: shatter whatever you hit." },
  { id: "warcry", name: "Clan Warcry", dmg: [10, 16], furyCost: 70, aoe: true, poise: 5, desc: "Fury: a roar that hits everything and breaks poise." },
];

export const FINALE_ENDINGS = {
  uniter: { title: "The Unchained Moot", text: "You return every captive to their clan. For the first time anyone remembers, the clans sit at one fire — not because anyone rules them, but because they all owe the same debt. Menfor does not forget it." },
  founder: { title: "Founder of the Free Clan", text: "Most of the freed have no clan left to return to. So they take yours. Your marks are cut into the totem first; the children of Chainhold learn to hunt along your paths before they learn your name." },
  monarch: { title: "The Second Monarch", text: "You keep the ledger. The Monarch's Horn answers you, and beasts no one could tame kneel. Menfor is free of the Syndicate — and bound to you instead. Some call it the same thing." },
  mourak: { title: "Mourak", text: "You stand on the deck of a smuggler's boat as the black cliffs shrink behind you. The clans will call you Mourak — the one who walked away. Somewhere across the sea, they will learn to call you something else." },
  chaintide: { title: "The Chain Tide", text: "The Syndicate's grip closes. One clan after another wakes to sigils burning on their wrists. You run, and keep running. Menfor goes quiet." },
};
