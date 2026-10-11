// tenebrim/logic.js — Rules for the Tenebrim scenario.
// All functions mutate a draft game object `g` (the component clones before calling).
import { HERITAGE, REGIONS, CLANS, ROLES, NAMES, WOUNDS, TECHNIQUES, WEAPONS, CAMP_BUILDINGS, TEN_ENEMIES } from "./data";
import { findMonster } from "../combat/monsters";

export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const irnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const SEGS = ["Dawn", "Day", "Dusk"];

export const META_UPGRADES = [
  { id: "clanMemory", name: "Clan Memory", cost: 3, desc: "Start with +6 food and +4 water." },
  { id: "hunterTradition", name: "Hunter Tradition", cost: 4, desc: "Start with a bone spear." },
  { id: "survivalKnowledge", name: "Survival Knowledge", cost: 5, desc: "+3 herbs and +15 max HP at the start." },
  { id: "ancientWarrior", name: "Ancestral Fury", cost: 5, desc: "Start every fight with +20 Fury." },
];

export function newGame() {
  const clan = () => ({ rel: 0, allied: false, raided: 0, fallen: false, questDay: 0 });
  return {
    v: 2, origin: null, act: "origin", day: 1, seg: 0,
    hp: 125, maxHp: 125, stamina: 90, maxStamina: 90, hunger: 80, thirst: 80,
    food: 6, water: 6, materials: 4, herbs: 1, trophies: 0, weapon: "fists",
    wounds: [], scars: 0, heritage: null, techniques: [],
    counters: { kills: 0, ambushWins: 0, lastStand: 0, wounds: 0, riskyMeals: 0, freed: 0, duels: 0 },
    region: "ashveil", known: ["ashveil"], caravans: {},
    clans: { emberhide: clan(), redmaw: clan(), stoneoath: clan(), wellkeepers: clan() },
    band: [], grip: 12, pursuit: 0, camp: null, legacy: 0, deeds: [], sibling: null, flags: {},
    bondage: null, tribeStep: 0, log: [], event: null, combat: null, ending: null, cinematic: null, dead: null, toasts: [], meta: {},
  };
}

// ── small helpers ──────────────────────────────────────────────────────────
export function log(g, msg, type = "info") { g.log = [...g.log.slice(-80), { id: Math.random(), msg, type, day: g.day }]; }
export function toast(g, msg, color = "#e0a523") { g.toasts = [...(g.toasts || []), { msg, color }]; }
export const hasTech = (g, id) => g.techniques.includes(id);
export const heritageOf = (g) => HERITAGE.find(h => h.id === g.heritage) || {};
export const weaponOf = (g) => WEAPONS.find(w => w.id === g.weapon) || WEAPONS[0];
export const regionOf = (g) => REGIONS[g.region];
export const alliedClans = (g) => Object.entries(g.clans).filter(([, c]) => c.allied && !c.fallen).map(([k]) => k);
export const deed = (g, text, legacy = 3) => { g.deeds = [...g.deeds, { day: g.day, text }]; g.legacy += legacy; log(g, `Deed remembered: ${text} (+${legacy} legacy)`, "reward"); };
export function addFollower(g, role) {
  const used = new Set(g.band.map(b => b.name));
  const name = pick(NAMES.filter(n => !used.has(n) && n !== g.sibling)) || pick(NAMES);
  const r = role || pick(Object.keys(ROLES));
  g.band.push({ id: Math.random(), name, role: r });
  log(g, `${name} (${ROLES[r].label}) joins your band.`, "heal");
  return name;
}

export function checkTechniques(g) {
  TECHNIQUES.forEach(t => {
    if (!g.techniques.includes(t.id) && t.check(g)) {
      g.techniques.push(t.id);
      log(g, `TECHNIQUE — ${t.name}. Something in you has been pushed past its limit and stayed there.`, "reward");
      toast(g, `Technique: ${t.name}`, "#e0a523");
    }
  });
}

export function addWound(g, forced) {
  const h = heritageOf(g);
  if (!forced && h.woundResist && Math.random() < h.woundResist) { log(g, "Your stone-hard skin turns what should have been a wound.", "heal"); return; }
  const free = Object.keys(WOUNDS).filter(k => !g.wounds.some(w => w.type === k));
  if (!free.length) { g.hp = Math.max(1, g.hp - 10); return; }
  const type = forced && free.includes(forced) ? forced : pick(free);
  g.wounds.push({ type, days: WOUNDS[type].days });
  g.counters.wounds += 1;
  log(g, `WOUND — ${WOUNDS[type].name}: ${WOUNDS[type].desc} No core means no mana to knit it. It heals slowly, and it will scar.`, "dmg");
  checkTechniques(g);
}

// Combat context derived from the body, gear and techniques.
export function combatCtx(g, vsBeast = true) {
  const h = heritageOf(g);
  const pen = hasTech(g, "endure") ? 0.5 : 1;
  let atk = 5 + weaponOf(g).atk;
  let def = 2 + (h.def || 0) + (hasTech(g, "unbreakable") ? Math.min(10, g.scars) : 0);
  let dodge = 5 + (h.dodge || 0) + (hasTech(g, "stillstrike") ? 12 : 0);
  g.wounds.forEach(w => {
    const W = WOUNDS[w.type];
    if (W.atkMult) atk *= 1 - (1 - W.atkMult) * pen;
    if (W.def) def += W.def * pen;
    if (W.dodge) dodge += W.dodge * pen;
  });
  if (hasTech(g, "laststand") && g.hp < g.maxHp * 0.35) atk += 12;
  if (hasTech(g, "clanhunter") && vsBeast) atk += 6;
  return { atk: Math.round(atk), def: Math.max(0, Math.round(def)), dodge: Math.max(0, dodge), crit: 0.1, strikeBonus: 0 };
}

export function battlePlayer(g) {
  const h = heritageOf(g);
  const statuses = {};
  g.wounds.forEach(w => { if (WOUNDS[w.type].blind) statuses.blind = 2; if (WOUNDS[w.type].bleed) { statuses.bleed = 2; statuses.bleedPower = 3; } });
  const immune = [...(h.immune || [])];
  if (hasTech(g, "endure")) immune.push("stun");
  return {
    hp: g.hp, maxHp: g.maxHp, mp: 0, maxMp: 0, stamina: g.stamina, maxStamina: g.maxStamina,
    fury: (h.fury || 0) + (hasTech(g, "laststand") ? 30 : 0) + (g.meta?.ancientWarrior ? 20 : 0), maxFury: 100,
    immune, pactImmune: hasTech(g, "chainbreaker") || !!g.flags.pactBroken, statuses,
  };
}

export function alliesInFight(g, extra = 0) {
  return g.band.filter(b => b.role === "warrior").length + (g.flags.horn ? 2 : 0) + extra;
}

// Builds a combat config. enemies: array of monster ids or TEN_ENEMIES keys.
export function startFight(g, kind, enemies, opts = {}) {
  const danger = opts.danger ?? (regionOf(g)?.danger || 1);
  g.combat = { key: Date.now() + Math.random(), kind, enemies, danger, ambush: !!opts.ambush, burning: !!opts.burning, allies: opts.allies ?? alliesInFight(g), data: opts.data || {}, title: opts.title, startHp: g.hp, result: null, summary: null };
}

export function buildEnemies(g, combat, diff, makeEnemy) {
  const day = g.day;
  return combat.enemies.map(id => {
    const tpl = TEN_ENEMIES[id] || findMonster(id) || findMonster("cur");
    const hp = (diff?.hpMult || 1) * (1 + combat.danger * 0.08 + Math.min(day, 60) * 0.01);
    const atk = (diff?.enemyAtk || 1) * (1 + combat.danger * 0.05 + Math.min(day, 60) * 0.006);
    const e = makeEnemy(tpl, { hp, atk });
    if (combat.ambush) e.statuses.staggered = 1;
    if (combat.burning) e.statuses.burn = 3;
    return e;
  });
}

// ── Time ───────────────────────────────────────────────────────────────────
export function advance(g, segs = 1) {
  g.seg += segs;
  while (g.seg >= 3 && !g.dead && !g.ending) { g.seg -= 3; endDay(g); }
}

export function endDay(g) {
  g.day += 1;
  const h = heritageOf(g);
  const mouths = g.band.length;
  // Production
  const hunters = g.band.filter(b => b.role === "hunter").length;
  if (hunters) g.food += hunters * 2;
  if (g.camp?.built?.rack) g.food += 3;
  if (g.camp?.built?.cistern) g.water += 3;
  if (g.camp?.built?.totem) g.legacy += 1;
  // Personal needs
  g.hunger = clamp(g.hunger - (hasTech(g, "ironstomach") ? 14 : 20));
  const dry = regionOf(g)?.water === "none" ? 10 : 0;
  g.thirst = clamp(g.thirst - Math.round((24 + dry) * (h.thirstMult || 1)));
  if (g.food >= 2) { g.food -= 2; g.hunger = clamp(g.hunger + 32); } else if (g.food > 0) { g.food = 0; g.hunger = clamp(g.hunger + 12); }
  if (g.water >= 2) { g.water -= 2; g.thirst = clamp(g.thirst + 40); } else if (g.water > 0) { g.water = 0; g.thirst = clamp(g.thirst + 15); }
  // Band needs
  if (mouths) {
    const shortFood = mouths - g.food, shortWater = mouths - g.water;
    g.food = Math.max(0, g.food - mouths); g.water = Math.max(0, g.water - mouths);
    if ((shortFood > 0 || shortWater > 0) && Math.random() < 0.45) {
      const gone = g.band.splice(Math.floor(Math.random() * g.band.length), 1)[0];
      log(g, `${gone.name} leaves in the night. There wasn't enough ${shortWater > 0 ? "water" : "food"} for everyone.`, "dmg");
    }
  }
  if (g.hunger <= 0) { g.hp -= 14; log(g, "Starvation gnaws at you (-14 HP).", "dmg"); }
  if (g.thirst <= 0) { g.hp -= 22; log(g, "Your tongue is cracked leather. Thirst is killing you (-22 HP).", "dmg"); }
  // Coreless healing: slow, no mana, scars
  const healer = g.band.some(b => b.role === "healer");
  g.hp = Math.min(g.maxHp, g.hp + Math.round(g.maxHp * 0.04));
  g.stamina = Math.min(g.maxStamina, g.stamina + 50);
  g.wounds = g.wounds.filter(w => {
    w.days -= healer ? 2 : 1;
    if (w.days <= 0) { g.scars += 1; log(g, `${WOUNDS[w.type].name} has closed — into a scar you'll carry forever. (${g.scars} scars)`, "heal"); return false; }
    return true;
  });
  checkTechniques(g);

  if (g.act !== "menfor") return checkDeath(g, "Your body gave out.");
  // Syndicate grip & raids
  g.grip = clamp(g.grip + 2 + Math.floor(g.day / 14) - (g.camp?.built?.palisade ? 1 : 0));
  Object.keys(g.caravans).forEach(k => { g.caravans[k] -= 1; if (g.caravans[k] <= 0) delete g.caravans[k]; });
  if (Math.random() < 0.4) {
    const options = Object.keys(REGIONS).filter(k => !REGIONS[k].fort && !g.caravans[k]);
    const r = pick(options);
    g.caravans[r] = 3;
    if (g.known.includes(r) || g.band.some(b => b.role === "scout")) log(g, `Word reaches you: a Syndicate slave caravan is moving through ${REGIONS[r].name}.`, "lumen");
  }
  if (g.grip >= 35 && Math.random() < g.grip / 220) {
    const targets = Object.keys(g.clans).filter(k => !g.clans[k].fallen);
    if (targets.length) {
      const k = pick(targets); const c = g.clans[k];
      c.raided += 1;
      log(g, `The Syndicate raided the ${CLANS[k].name}. Pact-chains, smoke, empty longhouses. (${c.raided}/3)`, "dmg");
      if (c.raided >= 3) { c.fallen = true; c.allied = false; log(g, `The ${CLANS[k].name} are gone — bound and shipped from Chainhold.`, "dmg"); toast(g, `${CLANS[k].name} have fallen`, "#e85c3a"); }
    }
  }
  if (g.origin === "slave" && !g.flags.fortTaken) {
    g.pursuit += 5;
    if (Math.random() < g.pursuit / 160 && !g.event) { g.event = { id: "hunters" }; g.pursuit = Math.max(0, g.pursuit - 25); }
  }
  if (!g.event && Math.random() < 0.3) g.event = { id: pick(["stranger", "storm", "carcass", "vision", "trader", "sickness"]) };
  if (g.grip >= 100) { g.ending = "chaintide"; return; }
  checkDeath(g, "The wilds wore you down to nothing.");
}

export function checkDeath(g, reason) {
  if (g.hp <= 0 && !g.dead) { g.hp = 0; g.dead = { reason }; }
}

// ── Menfor actions ─────────────────────────────────────────────────────────
export function forage(g, deep) {
  const r = regionOf(g); const cost = deep ? 20 : 10;
  if (g.stamina < cost) { toast(g, "Too exhausted.", "#e85c3a"); return; }
  g.stamina -= cost;
  const m = deep ? 2 : 1;
  const food = irnd(r.forage.food[0], r.forage.food[1]) * m, mats = irnd(r.forage.materials[0], r.forage.materials[1]) * m, herbs = irnd(r.forage.herbs[0], r.forage.herbs[1]) * (deep ? 1 : 0);
  g.food += food; g.materials += mats; g.herbs += herbs;
  log(g, `${deep ? "Deep search" : "Forage"} in ${r.name}: +${food} food, +${mats} materials${herbs ? `, +${herbs} herbs` : ""}.`, "reward");
  const risk = (deep ? 0.25 : 0.08) + r.danger * 0.03;
  if (Math.random() < risk) {
    if (Math.random() < 0.5) addWound(g); else { log(g, "Something was waiting in the rocks.", "dmg"); startFight(g, "hunt", [pick(r.beasts)], { ambush: false }); }
  }
  advance(g, 1);
}

export function hunt(g) {
  const r = regionOf(g);
  if (g.stamina < 15) { toast(g, "Your body refuses the hunt.", "#e85c3a"); return; }
  g.stamina -= 15;
  const h = heritageOf(g);
  const chance = 0.4 + (h.ambush || 0) + (g.band.some(b => b.role === "scout") ? 0.15 : 0) + (hasTech(g, "stillstrike") ? 0.15 : 0);
  const ambush = Math.random() < chance;
  const prey = pick(r.beasts);
  const count = r.danger >= 3 && Math.random() < 0.35 ? 2 : 1;
  log(g, ambush ? `You track a ${findMonster(prey)?.name} downwind and strike before it knows you're there.` : `The ${findMonster(prey)?.name} catches your scent. It turns to face you.`, ambush ? "reward" : "dmg");
  startFight(g, "hunt", Array(count).fill(prey), { ambush });
  advance(g, 1);
}

export function drawWater(g) {
  const r = regionOf(g);
  if (r.water === "spring") { g.water += 8; log(g, "You fill every skin at the spring. (+8 water)", "heal"); }
  else if (r.water === "seep") { g.water += 4; log(g, "Slow drips from a rock seep. (+4 water)", "heal"); }
  else {
    if (g.stamina < 15) { toast(g, "Too exhausted to dig.", "#e85c3a"); return; }
    g.stamina -= 15;
    if (Math.random() < 0.45) { const w = irnd(2, 4); g.water += w; log(g, `You dig for hours and find a damp layer. (+${w} water)`, "heal"); }
    else log(g, "You dig until your hands bleed. Dry.", "dmg");
  }
  advance(g, 1);
}

export function rest(g) {
  g.hp = Math.min(g.maxHp, g.hp + Math.round(g.maxHp * 0.12));
  g.stamina = Math.min(g.maxStamina, g.stamina + 45);
  g.wounds.forEach(w => { if (Math.random() < 0.35) w.days -= 1; });
  log(g, "You rest in the shade. Coreless bodies don't knit quickly — but they knit.", "heal");
  advance(g, 1);
}

export function tend(g) {
  if (g.herbs < 1) { toast(g, "No herbs.", "#e85c3a"); return; }
  g.herbs -= 1;
  g.hp = Math.min(g.maxHp, g.hp + Math.round(g.maxHp * 0.15));
  g.wounds.forEach(w => { w.days -= 2; });
  log(g, "You pack your wounds with crushed herbs. It stings like fire.", "heal");
}

export function riskyMeal(g) {
  g.flags.freshKill = false;
  g.hunger = clamp(g.hunger + 40);
  g.counters.riskyMeals += 1;
  if (!hasTech(g, "ironstomach") && Math.random() < 0.5) { g.hp = Math.max(1, g.hp - 12); log(g, "You eat the meat raw. It fights back on the way down (-12 HP).", "dmg"); }
  else log(g, "You eat the meat raw. It stays down.", "heal");
  checkTechniques(g);
}

export function scout(g) {
  const r = regionOf(g);
  r.links.forEach(l => { if (!g.known.includes(l)) { g.known.push(l); log(g, `You climb high and see ${REGIONS[l].name} to the ${REGIONS[l].x > r.x ? "east" : "west"}.`, "info"); } });
  const near = [g.region, ...r.links].filter(k => g.caravans[k]);
  near.forEach(k => log(g, `Dust on the horizon: a Syndicate caravan in ${REGIONS[k].name} (${g.caravans[k]} days).`, "lumen"));
  if (!near.length) log(g, "No caravans in sight.", "info");
  advance(g, 1);
}

export function travel(g, to) {
  const r = regionOf(g); const dest = REGIONS[to];
  if (!r.links.includes(to)) return;
  const leg = g.wounds.some(w => w.type === "leg") ? 1 : 0;
  const waterCost = 1 + leg + (dest.water === "none" ? 1 : 0);
  if (g.water < waterCost) { toast(g, `You need ${waterCost} water for the crossing.`, "#e85c3a"); return; }
  g.water -= waterCost;
  g.region = to;
  if (!g.known.includes(to)) g.known.push(to);
  log(g, `You cross into ${dest.name}. ${dest.desc}`, "sys");
  advance(g, dest.danger >= 3 ? 2 : 1);
  if (!g.combat && !g.event && Math.random() < 0.12 + dest.danger * 0.05) {
    log(g, "You are not alone on the trail.", "dmg");
    startFight(g, "hunt", [pick(dest.beasts)]);
  }
  if (dest.fort && !g.flags.sawFort) { g.flags.sawFort = true; g.event = { id: "fortsight" }; }
}

export function raidCaravan(g) {
  const n = Math.min(4, 2 + Math.floor(g.day / 15));
  const enemies = Array.from({ length: n }, (_, i) => (i === n - 1 ? "crossbow" : "slaver"));
  log(g, "You fall on the caravan from the rocks.", "dmg");
  startFight(g, "raid", enemies, { ambush: g.band.some(b => b.role === "scout") || hasTech(g, "stillstrike"), title: "SYNDICATE CARAVAN" });
  delete g.caravans[g.region];
  advance(g, 1);
}

export function foundCamp(g) {
  if (g.camp) return;
  if (g.materials < 15) { toast(g, "You need 15 materials to found a camp.", "#e85c3a"); return; }
  g.materials -= 15;
  g.camp = { region: g.region, built: {} };
  deed(g, `Founded a camp in ${regionOf(g).name}`, 5);
  advance(g, 1);
}

export function build(g, id) {
  const b = CAMP_BUILDINGS[id];
  if (!g.camp || g.camp.region !== g.region || g.camp.built[id]) return;
  for (const [k, v] of Object.entries(b.cost)) if ((g[k] || 0) < v) { toast(g, `Need ${v} ${k}.`, "#e85c3a"); return; }
  for (const [k, v] of Object.entries(b.cost)) g[k] -= v;
  g.camp.built[id] = true;
  log(g, `Built: ${b.name}.`, "reward");
  if (id === "totem") Object.values(g.clans).forEach(c => { c.rel = clamp(c.rel + 10, -100, 100); });
  advance(g, 1);
}

export function craftWeapon(g, id) {
  const w = WEAPONS.find(x => x.id === id);
  if (!w || g.weapon === id) return;
  if (w.needs === "forge" && !(g.camp?.built?.forge && g.camp.region === g.region) && !(g.region === "ashveil" && (g.clans.emberhide.rel >= 30 || g.flags.emberForge))) { toast(g, "Needs a forge (your camp's, or the Emberhide's if they trust you).", "#e85c3a"); return; }
  for (const [k, v] of Object.entries(w.cost || {})) if ((g[k] || 0) < v) { toast(g, `Need ${v} ${k}.`, "#e85c3a"); return; }
  for (const [k, v] of Object.entries(w.cost || {})) g[k] -= v;
  g.weapon = id;
  log(g, `You craft a ${w.name} (+${w.atk} ATK).`, "reward");
  advance(g, 1);
}

export function searchRuins(g) {
  if (g.stamina < 25) { toast(g, "Too exhausted.", "#e85c3a"); return; }
  g.stamina -= 25;
  if (!g.flags.horn && Math.random() < 0.35) {
    g.flags.horn = true;
    deed(g, "Found the Monarch's Horn", 8);
    log(g, "Under a collapsed beast-pen, a horn of black bone. When you blow it, something enormous answers from the dunes. A beast follows you now.", "reward");
    toast(g, "The Monarch's Horn", "#ffd966");
  } else {
    g.materials += irnd(4, 8); g.trophies += 1;
    log(g, "Relic-scrap and old bones. And something has noticed you.", "dmg");
    startFight(g, "hunt", [pick(["huliut", "vekrath", "fire_drakein"])]);
  }
  advance(g, 2);
}

// ── Combat outcome ─────────────────────────────────────────────────────────
export function applyCombatResult(g, result, battle, diff) {
  const c = g.combat; if (!c || c.result) return;
  const p = battle.player;
  const lost = Math.max(0, c.startHp - p.hp);
  g.hp = Math.max(0, Math.round(p.hp)); g.stamina = Math.round(p.stamina);
  const lines = [];
  // Warriors may fall in battle
  const startAllies = c.allies || 0;
  const lostAllies = Math.max(0, startAllies - (battle.allies || 0));
  for (let i = 0; i < lostAllies; i++) {
    const idx = g.band.findIndex(b => b.role === "warrior");
    if (idx >= 0) { const d = g.band.splice(idx, 1)[0]; lines.push(`${d.name} fell in the fight.`); log(g, `${d.name} fell in the fight. You carry the body back.`, "dmg"); }
  }
  if (result === "win") {
    if (p.hp < p.maxHp * 0.2) { g.counters.lastStand += 1; lines.push("Won on your last legs."); }
    if (c.ambush) g.counters.ambushWins += 1;
    if (lost > g.maxHp * 0.35) { addWound(g); lines.push("You took a wound."); }
    const beasts = battle.enemies.filter(e => !String(e.id).startsWith("t_"));
    if (c.kind === "hunt") {
      const stars = beasts.reduce((a, e) => a + (e.star || 1), 0);
      const food = Math.round(irnd(3, 6) * Math.max(1, stars * 0.7) * (hasTech(g, "clanhunter") ? 1.5 : 1));
      const troph = beasts.filter(e => (e.star || 1) >= 3).length;
      g.food += food; g.trophies += troph; g.materials += irnd(1, 3);
      g.counters.kills += beasts.length; g.flags.freshKill = true;
      lines.push(`+${food} food`, troph ? `+${troph} trophy` : "Hide & bone");
      beasts.filter(e => (e.star || 1) >= 5).forEach(e => deed(g, `Slew a ${e.name}`, 6));
    } else if (c.kind === "raid") {
      const freed = irnd(2, 4);
      g.counters.freed += freed; g.grip = clamp(g.grip - 10); g.materials += irnd(3, 6);
      lines.push(`${freed} captives freed`, "Syndicate Grip -10");
      g.event = { id: "captives", data: { n: freed } };
      if (g.counters.freed >= 10 && !g.flags.freedDeed) { g.flags.freedDeed = true; deed(g, "Freed ten captives from the chains", 5); }
    } else if (c.kind === "duel") {
      const k = c.data.clan; g.clans[k].rel = clamp(g.clans[k].rel + (k === "stoneoath" ? 30 : 20), -100, 100);
      g.counters.duels += 1; g.legacy += 2;
      lines.push(`${CLANS[k].name} respect you (+${k === "stoneoath" ? 30 : 20})`);
    } else if (c.kind === "quest") {
      const k = c.data.clan; g.clans[k].rel = clamp(g.clans[k].rel + 15, -100, 100); g.food += 6; g.trophies += 1;
      lines.push(`${CLANS[k].name} +15`, "+6 food", "+1 trophy");
    } else if (c.kind === "hunters") {
      g.pursuit = Math.max(0, g.pursuit - 30); g.materials += 4;
      lines.push("The bounty hunters won't report back.");
    } else if (c.kind === "tribehunt") {
      g.clans.emberhide.rel += 10; g.trophies += 1; g.food += 4;
      lines.push("The hunters nod at you. Emberhide +10");
    } else if (c.kind === "tribechase") {
      lines.push("You cut down the stragglers. The caravan is already gone.");
    } else if (c.kind === "escape") {
      lines.push("The guards are down. The harbor is close.");
    } else if (c.kind === "gate") {
      lines.push("The gate of Chainhold is yours.");
    } else if (c.kind === "varn") {
      lines.push("The ledger falls from his hand.");
    }
  } else {
    if (diff?.perma) {
      g.dead = { reason: c.kind === "varn" ? "Pactmaster Varn bound your soul. You serve him still." : `Killed in the wilds of ${regionOf(g)?.name || "Menfor"}.` };
    } else {
      g.hp = Math.max(1, Math.round(g.maxHp * 0.12));
      addWound(g, "gash"); addWound(g);
      g.food = Math.floor(g.food / 2);
      lines.push("You crawl away and live. Barely.", "Two wounds", "Half your food lost");
      if (c.kind === "raid") g.grip = clamp(g.grip + 5);
    }
  }
  checkTechniques(g);
  c.result = result; c.summary = { title: result === "win" ? "Victory" : "Defeat", lines };
}

// What happens when the player presses "Continue" after a fight.
export function afterCombat(g) {
  const c = g.combat; if (!c) return;
  g.combat = null;
  if (c.result !== "win") {
    if (c.kind === "escape" && !g.dead) { g.bondage.phase = "task"; g.bondage.suspicion = 60; log(g, "You are dragged back to the pens. They'll watch you closer now.", "dmg"); }
    if (["gate", "varn"].includes(c.kind) && !g.dead) log(g, "You fall back from Chainhold to lick your wounds.", "dmg");
    if (c.kind === "tribehunt") { g.tribeStep = 2; g.clans.emberhide.rel -= 5; g.cinematic = "raid"; g.event = { id: "raid" }; }
    if (c.kind === "tribechase") { g.tribeStep = 3; g.event = { id: "leave" }; }
    return;
  }
  if (c.kind === "tribehunt") { g.tribeStep = 2; g.cinematic = "raid"; g.event = { id: "raid" }; }
  if (c.kind === "tribechase") { g.tribeStep = 3; addWound(g, "gash"); g.event = { id: "leave" }; }
  if (c.kind === "escape") g.event = { id: "harbor" };
  if (c.kind === "gate") g.event = { id: "pens" };
  if (c.kind === "varn") { g.flags.fortTaken = true; g.grip = 0; g.event = { id: "finale" }; }
}
