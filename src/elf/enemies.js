// elf/enemies.js — Movesets for the Northern Expanse expedition enemies (Elf scenario).
const T = (name, star, atk, def, poise, desc, moves, traits = []) => ({ id: "elf_" + name.toLowerCase().replace(/[^a-z]+/g, "_"), name, star, atk, def, poise, desc, moves, traits, reward: { xp: 0, bronze: 0 } });

export const ELF_ENEMIES = {
  "Snow Stalker": T("Snow Stalker", 2, 13, 3, 4, "White fur, black eyes. You only see it when it moves.", [
    { id: "lunge", name: "Lunge", kind: "attack", mult: [0.9, 1.2], tell: "Drops low in the snow." },
    { id: "vanish", name: "Whiteout", kind: "charge", tell: "It melts into the blizzard…", next: "pounce", airborne: true },
    { id: "pounce", name: "Pounce", kind: "heavy", mult: [1.5, 1.9], pierce: true, tell: "It explodes out of the snow beside you!", hidden: true },
  ]),
  "Ice Weaver Spider": T("Ice Weaver Spider", 2, 11, 2, 3, "Spins webs of frozen mana.", [
    { id: "bite", name: "Venom Bite", kind: "attack", mult: [0.8, 1.0], status: { type: "bleed", turns: 2, power: 3 }, tell: "Fangs drip blue." },
    { id: "web", name: "Frost Web", kind: "attack", mult: [0.4, 0.6], status: { type: "stun", turns: 1 }, tell: "Rears back, spinnerets glowing." },
  ]),
  "Rogue Automaton": T("Rogue Automaton", 3, 16, 10, 7, "Ancient Federation steel. Still following an order nobody remembers.", [
    { id: "punch", name: "Piston Punch", kind: "attack", mult: [0.9, 1.2], tell: "A piston in its arm hisses back." },
    { id: "vent", name: "Steam Vent", kind: "heavy", mult: [1.3, 1.6], sweep: true, status: { type: "burn", turns: 2, power: 4 }, tell: "Pressure gauges on its chest spin into the red." },
  ], ["armored"]),
  "Scrap Golem": T("Scrap Golem", 3, 15, 12, 9, "Rubbish given purpose by a leaking mana cell.", [
    { id: "slam", name: "Scrap Slam", kind: "attack", mult: [0.9, 1.1], tell: "Lifts a fist of welded junk." },
    { id: "rebuild", name: "Rebuild", kind: "buff", self: { shield: 2 }, tell: "Pulls scrap from the floor onto itself." },
    { id: "collapse", name: "Avalanche of Junk", kind: "heavy", mult: [1.5, 1.8], sweep: true, tell: "Leans over you, swaying…" },
  ], ["armored", "regen"]),
  "Arcane Sentinel": T("Arcane Sentinel", 4, 19, 12, 8, "A Lost-Magic guardian, faceless, ringed with runes.", [
    { id: "beam", name: "Rune Beam", kind: "attack", mult: [0.9, 1.1], pierce: true, tell: "A rune on its brow brightens and aims at you. (Unblockable)" },
    { id: "ward", name: "Ward", kind: "buff", self: { shield: 2 }, tell: "Runes slide into place around it." },
    { id: "nova", name: "Mana Nova", kind: "heavy", mult: [1.4, 1.7], sweep: true, tell: "Every rune ignites at once." },
  ]),
  "Mana Wyrm": T("Mana Wyrm", 3, 17, 5, 5, "A serpent of violet static.", [
    { id: "drain", name: "Siphon", kind: "drain", mult: [0.6, 0.8], drain: 10, tell: "It coils around the mana in the air — and you." },
    { id: "coil", name: "Coil", kind: "charge", tell: "It coils tighter and tighter, crackling…", next: "strike" },
    { id: "strike", name: "Static Strike", kind: "heavy", mult: [1.6, 2.0], status: { type: "stun", turns: 1 }, tell: "It uncoils like lightning!", hidden: true },
  ], ["manaEater"]),
  "Plague Husk": T("Plague Husk", 3, 15, 4, 4, "What the Blight leaves behind.", [
    { id: "claw", name: "Rotting Claw", kind: "attack", mult: [0.9, 1.1], status: { type: "bleed", turns: 2, power: 4 }, tell: "Shambles closer, too fast." },
    { id: "spew", name: "Blight Spew", kind: "heavy", mult: [1.2, 1.5], sweep: true, status: { type: "acid", turns: 3, power: 6 }, tell: "Its chest bloats. Something wants out." },
  ], ["enrage"]),
  "Flesh Amalgam": T("Flesh Amalgam", 4, 18, 6, 10, "Several people, once.", [
    { id: "flail", name: "Many Arms", kind: "multi", hits: 3, mult: [0.4, 0.55], tell: "Too many arms reach for you." },
    { id: "crush", name: "Engulf", kind: "heavy", mult: [1.6, 2.0], tell: "It opens. All of it opens." },
  ], ["regen"]),
  "Deep Ice Burrower": T("Deep Ice Burrower", 4, 18, 9, 8, "A segmented thing that swims through ice.", [
    { id: "dive", name: "Burrow", kind: "charge", tell: "It dives into the ice floor. The ground hums under your feet…", next: "erupt", airborne: true },
    { id: "erupt", name: "Erupt", kind: "heavy", mult: [1.7, 2.1], pierce: true, tell: "The floor explodes upward!", hidden: true },
    { id: "bite", name: "Ice Mandibles", kind: "attack", mult: [0.9, 1.2], tell: "Mandibles open sideways." },
  ]),
  "Crystal Maw": T("Crystal Maw", 4, 17, 14, 9, "A cave mouth that turned out to be alive.", [
    { id: "shards", name: "Shard Volley", kind: "multi", hits: 4, mult: [0.3, 0.45], tell: "Crystals bristle along its jaw." },
    { id: "chomp", name: "Chomp", kind: "heavy", mult: [1.5, 1.9], tell: "The whole cave inhales." },
  ], ["armored"]),
  "Titan Bone Warden": T("Titan Bone Warden", 5, 22, 14, 11, "Made from a Frost Giant's ribs, by something that respected them.", [
    { id: "cleave", name: "Rib Cleaver", kind: "attack", mult: [0.9, 1.15], tell: "Hefts a blade made from a single rib." },
    { id: "stomp", name: "Graveyard Stomp", kind: "heavy", mult: [1.3, 1.6], sweep: true, status: { type: "stun", turns: 1 }, tell: "Raises a foot the size of a sled." },
  ], ["armored"]),
  "Frost Revenant": T("Frost Revenant", 5, 21, 8, 8, "An elf who froze with a grudge.", [
    { id: "touch", name: "Grave Chill", kind: "attack", mult: [0.8, 1.0], status: { type: "weaken", turns: 2 }, tell: "Reaches out with a hand of rime." },
    { id: "wail", name: "Wail", kind: "heavy", mult: [1.3, 1.6], sweep: true, tell: "Its jaw unhinges. A scream is building." },
  ], ["enrage"]),
  "Temple Guardian": T("Temple Guardian", 5, 24, 16, 12, "Ancient. Patient. Unimpressed.", [
    { id: "halberd", name: "Halberd", kind: "attack", mult: [0.9, 1.1], tell: "Sets its halberd." },
    { id: "judgement", name: "Judgement", kind: "charge", tell: "It raises its halberd overhead and holds it there, waiting…", next: "fall" },
    { id: "fall", name: "Falling Judgement", kind: "heavy", mult: [2.0, 2.4], tell: "The halberd falls!", hidden: true },
  ], ["armored"]),
  "Mana Seraph": T("Mana Seraph", 5, 22, 10, 9, "Six wings of light around a core that is far too bright.", [
    { id: "lance", name: "Light Lance", kind: "attack", mult: [0.9, 1.15], pierce: true, tell: "A wing folds into a spear of light. (Unblockable)" },
    { id: "halo", name: "Halo Burst", kind: "heavy", mult: [1.4, 1.7], sweep: true, status: { type: "blind", turns: 2 }, tell: "Its halo widens and whitens." },
  ]),
};

export function elfEnemyTemplate(name, hp) {
  const t = ELF_ENEMIES[name] || T(name, 2, 14, 4, 4, "Something hostile in the snow.", [{ id: "hit", name: "Attack", kind: "attack", mult: [0.9, 1.2], tell: "It comes at you." }]);
  return { ...t, hp };
}

export function elfActions(weapon) {
  const base = weapon === "mana_rifle"
    ? [{ id: "rifle", name: "Mana Rifle Shot", dmg: [55, 80], ranged: true, armorPierce: true, desc: "A bolt of compressed mana. Reaches anything." },
       { id: "overcharge", name: "Overcharge", dmg: [80, 115], staminaCost: 30, ranged: true, poise: 6, desc: "Dump the whole cell. Massive stagger." }]
    : weapon === "scrap_blade"
      ? [{ id: "slash", name: "Scrap Blade", dmg: [28, 42], desc: "Jagged, heavy, effective." },
         { id: "hew", name: "Hew", dmg: [40, 58], staminaCost: 22, poise: 4, desc: "Two-handed. Breaks poise." }]
      : [{ id: "strike", name: "Ice-pick Strike", dmg: [14, 26], desc: "It's what you have." },
         { id: "heavy", name: "Desperate Swing", dmg: [22, 34], staminaCost: 20, poise: 3, desc: "All your weight behind it." }];
  return [...base, { id: "flare", name: "Signal Flare", dmg: [8, 14], staminaCost: 12, ranged: true, effect: "burn", desc: "Sets it burning. Reaches flying or hidden foes." }];
}
