// beastkin/logic.js — Rules and events for "The Hollowmere Year".
import { SUBTYPES, WILD_SURGE, SEASONS, DAYS_PER_SEASON, NOTABLES, BUILDINGS, BK_ENEMIES, OUTSIDERS } from "./data";
import { findMonster } from "../combat/monsters";

export const irnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const HARVEST_DAY = 15;
export const LAST_DAY = 20;

export function newGame() {
  return {
    v: 1, subtype: null, act: "pick", day: 1, slot: 0,
    hp: 100, maxHp: 100, stamina: 80, maxStamina: 80, mp: 40, maxMp: 40, atk: 0,
    food: 20, materials: 6, herbs: 2, goods: 3,
    pop: 30, trust: 60, favor: 0, clues: 0, exposed: false, spied: 0,
    notables: Object.fromEntries(NOTABLES.map(n => [n.id, "home"])), taken: 0,
    built: {}, outsider: null, flags: {}, log: [], event: null, combat: null, cinematic: null, ending: null, dead: null, toasts: [],
  };
}

export const seasonOf = (g) => SEASONS[Math.min(3, Math.floor((g.day - 1) / DAYS_PER_SEASON))];
export const sub = (g) => SUBTYPES[g.subtype] || SUBTYPES.canine;
export function log(g, msg, type = "info") { g.log = [...g.log.slice(-80), { id: Math.random(), msg, type }]; }
export function toast(g, msg, color = "#e0a523") { g.toasts = [...(g.toasts || []), { msg, color }]; }
const home = (g, id) => g.notables[id] === "home";

export function chooseSubtype(g, id) {
  const S = SUBTYPES[id];
  g.subtype = id; g.act = "village";
  g.hp = g.maxHp = S.stats.hp; g.mp = g.maxMp = S.stats.mp; g.atk = S.stats.atk;
  if (id === "melano") g.trust = 45; // the Gemea still flinch when you pass
  g.cinematic = "intro";
  log(g, `Hollowmere. Spring. You are ${S.name}.`, "sys");
}

// ── Combat helpers ─────────────────────────────────────────────────────────
export function combatCtx(g) {
  const S = sub(g); const season = seasonOf(g);
  let atk = g.atk + (g.flags.trained || 0);
  if (g.subtype === "lizardman") atk *= season === "Summer" ? 1.15 : season === "Winter" ? 0.8 : 1;
  return { atk: Math.round(atk), def: S.stats.def, dodge: S.stats.dodge, crit: 0.08, strikeBonus: 0 };
}
export function battlePlayer(g) { return { hp: g.hp, maxHp: g.maxHp, mp: g.mp, maxMp: g.maxMp, stamina: g.stamina, maxStamina: g.maxStamina }; }
export function actionsFor(g) { return [...sub(g).actions, g.subtype === "canine" ? { ...WILD_SURGE, backfire: 0.25, desc: "Raw core power, pure instinct. Huge range. 25% it backfires." } : WILD_SURGE]; }
export function alliesFor(g, extra = 0) {
  return (g.subtype === "canine" ? 1 : 0) + extra;
}
export function startFight(g, kind, enemies, opts = {}) {
  g.combat = { key: Date.now() + Math.random(), kind, enemies, allies: opts.allies ?? alliesFor(g), ambush: !!opts.ambush, title: opts.title, startHp: g.hp, result: null, summary: null, scale: opts.scale || 1 };
}
export function buildEnemies(g, c, diff, makeEnemy) {
  return c.enemies.map(id => {
    const tpl = BK_ENEMIES[id] || findMonster(id) || findMonster("cur");
    const hp = (diff?.hpMult || 1) * (1 + g.day * 0.025) * c.scale;
    const atk = (diff?.enemyAtk || 1) * (1 + g.day * 0.015) * c.scale;
    const e = makeEnemy(tpl, { hp, atk });
    if (c.ambush) e.statuses.staggered = 1;
    return e;
  });
}

// ── Time ───────────────────────────────────────────────────────────────────
export function spend(g, slots = 1) {
  g.slot += slots;
  while (g.slot >= 2 && !g.ending && !g.dead) { g.slot -= 2; endDay(g); }
}

function endDay(g) {
  const season = seasonOf(g);
  // Production and needs
  if (g.built.smokehouse) g.food += 3;
  const eat = Math.ceil(g.pop / 6);
  g.food -= eat;
  if (g.food < 0) { g.food = 0; g.trust = clamp(g.trust - 8); if (g.pop > 5) { g.pop -= 1; log(g, "A family leaves for a village with fuller stores.", "dmg"); } }
  if (g.trust < 25 && Math.random() < 0.4 && g.pop > 5) { g.pop -= 2; log(g, "Two villagers slip away. They don't trust that you can keep them safe.", "dmg"); }
  g.hp = Math.min(g.maxHp, g.hp + Math.round(g.maxHp * 0.1));
  g.stamina = Math.min(g.maxStamina, g.stamina + 45);
  g.mp = Math.min(g.maxMp, g.mp + 10);

  // Outsiders: if ignored, the village trusts them by default
  if (g.outsider) {
    g.outsider.days -= 1;
    if (g.outsider.days <= 0) { resolveOutsider(g, "welcome", true); }
  }
  g.day += 1;

  if (g.day > LAST_DAY) { decideEnding(g); return; }
  if (g.day === HARVEST_DAY + 1 && !g.flags.harvestNight) { g.flags.harvestNight = true; g.cinematic = "harvest"; g.event = { id: "harvestNight" }; return; }

  // Scripted beats
  if (g.day === 4 && !g.flags.orlen) { g.flags.orlen = true; g.event = { id: "orlen" }; return; }
  if (g.day === 7 && !g.flags.kekali) { g.flags.kekali = true; g.event = { id: "kekali" }; return; }
  if (g.day === 8 && !g.flags.heat) { g.flags.heat = true; g.event = { id: "heat" }; return; }
  if (g.day === 9 && !g.flags.pip) { g.flags.pip = true; g.event = { id: "pip" }; return; }
  if (g.day === 12 && !g.flags.missing) { g.flags.missing = true; g.event = { id: "missing" }; return; }
  if (seasonOf(g) === "Winter" && !g.flags.fever) { g.flags.fever = true; g.event = { id: "fever" }; return; }
  if (seasonOf(g) === "Spring" && g.day === 3 && !g.flags.festival) { g.flags.festival = true; g.event = { id: "festival" }; return; }

  // New outsider every so often
  if (!g.outsider && g.day < HARVEST_DAY && Math.random() < 0.55) {
    const pool = OUTSIDERS.filter(o => (o.truth !== "slaver" || g.day >= 3) && (o.truth !== "spy" || g.day >= 5));
    const o = pick(g.flags.patron ? [...pool, ...pool.filter(x => x.truth === "slaver")] : pool);
    g.outsider = { id: o.id, days: 2, read: false };
    log(g, `An outsider arrives at Hollowmere: ${o.who}.`, "lumen");
  }
}

export function decideEnding(g) {
  if (g.pop < 15) g.ending = "scattered";
  else if (g.flags.orlenDown && g.favor >= 3 && g.pop >= 22) g.ending = "sanctuary";
  else if (g.flags.orlenDown) g.ending = "unbowed";
  else g.ending = "hardwinter";
}

// ── Actions ────────────────────────────────────────────────────────────────
export function fields(g) {
  const season = seasonOf(g);
  let f = season === "Winter" ? 2 : season === "Autumn" ? 9 : 6;
  if (g.subtype === "ursan") f = Math.round(f * 1.5);
  g.food += f; g.trust = clamp(g.trust + 2);
  log(g, `You work the ${season === "Winter" ? "frozen" : ""} fields alongside everyone else. +${f} food. Nobody here keeps score — what's grown is shared.`, "heal");
  spend(g);
}
export function forage(g) {
  const m = irnd(4, 7), h = irnd(1, 2) + (g.subtype === "gemea" ? 2 : 0);
  g.materials += m; g.herbs += h;
  log(g, `Wood, reed and resin from the forest: +${m} materials, +${h} herbs.`, "reward");
  if (Math.random() < 0.2) { log(g, "Something in the undergrowth has been watching you.", "dmg"); startFight(g, "hunt", [pick(["cur", "crawler", "blobooze"])]); }
  spend(g);
}
export function hunt(g) {
  if (g.stamina < 15) { toast(g, "Too tired to hunt.", "#e85c3a"); return; }
  g.stamina -= 15;
  const prey = pick(seasonOf(g) === "Summer" ? ["kekali", "gasgees", "shafo"] : ["cur", "shafo", "gasgees", "blobooze"]);
  const ambush = Math.random() < 0.35 + (g.subtype === "canine" ? 0.2 : 0);
  startFight(g, "hunt", [prey], { ambush, title: "THE HUNT" });
  spend(g);
}
export function patrol(g) {
  const night = g.slot === 1;
  const mel = g.subtype === "canine"; // the nose finds what eyes miss
  log(g, night ? "You walk the borders under the moon." : "You walk the borders.", "info");
  const r = Math.random();
  if (r < (mel ? 0.4 : 0.25)) {
    log(g, "Two of Orlen's men, far from the road, with nets. They see you.", "dmg");
    startFight(g, "patrol", ["thug", "thug"], { ambush: mel, title: "THE BORDER" });
  } else if (r < (mel ? 0.75 : 0.5)) {
    g.clues += 1; log(g, "Cart tracks where no cart should go, and a dropped sigil-chain link. (+1 clue)", "lumen");
  } else log(g, "Quiet. Too quiet, or just quiet?");
  spend(g);
}
export function train(g) {
  g.flags.trained = (g.flags.trained || 0) + 1;
  g.maxMp += 4; g.mp += 4;
  log(g, "You practise until your instincts move before you do. (+1 ATK, +4 max MP)", "reward");
  spend(g);
}
export function rest(g) {
  g.hp = Math.min(g.maxHp, g.hp + Math.round(g.maxHp * 0.3)); g.stamina = g.maxStamina; g.mp = Math.min(g.maxMp, g.mp + 15);
  log(g, "You sleep in the sun like everyone's grandmother told you not to.", "heal");
  spend(g);
}
export function build(g, id) {
  const B = BUILDINGS[id]; if (g.built[id]) return;
  for (const [k, v] of Object.entries(B.cost)) if ((g[k] || 0) < v) { toast(g, `Need ${v} ${k}.`, "#e85c3a"); return; }
  for (const [k, v] of Object.entries(B.cost)) g[k] -= v;
  g.built[id] = true;
  if (id === "shrine") { g.favor += 1; g.trust = clamp(g.trust + 8); }
  log(g, `The village builds a ${B.name} together.`, "reward");
  spend(g);
}
export function pilgrimage(g) {
  if (g.goods < 3) { toast(g, "Bring 3 goods as an offering.", "#e85c3a"); return; }
  g.goods -= 3;
  const gain = g.subtype === "angelos" ? 3 : 2;
  g.favor += gain;
  log(g, `You walk to Church Holling, the roadside church outside the capital. The priests are delighted to see one of the Hero's children. (+${gain} favor)`, "reward");
  if (g.clues >= 3 && !g.exposed) {
    g.exposed = true;
    log(g, g.subtype === "melano" ? "You have no words — so you draw Orlen's seal in the dirt, lay down the chain-link you found, and point at the road. The priest understands. \"The Knights will hear of this.\"" : "You tell them about Orlen — the tracks, the chains, the 'recruits' who never write. The priest stops smiling. \"The Knights will hear of this.\"", "lumen");
    toast(g, "Orlen exposed to the Church", "#ffd966");
  }
  spend(g, 4);
}

export function readChance(g) {
  return Math.min(0.95, 0.35 + sub(g).stats.senses * 0.12 + (g.built.tower ? 0.12 : 0) + (g.subtype === "angelos" ? 0.1 : 0));
}

// How each outsider resolves. how: welcome | refuse | confront
export function resolveOutsider(g, how, auto = false) {
  const o = OUTSIDERS.find(x => x.id === g.outsider?.id); if (!o) return;
  const t = o.truth;
  g.outsider = null;
  if (how === "welcome") {
    if (auto) log(g, `Nobody stopped ${o.who.toLowerCase()} — Hollowmere trusts by default.`, "info");
    if (t === "honest") { g.goods += 2; g.food += 3; g.trust = clamp(g.trust + 3); if (o.id === "missionary") g.favor += 1; log(g, "It goes well. Not everyone outside wants something from you.", "heal"); }
    if (t === "cheat") { g.goods = Math.max(0, g.goods - 3); log(g, "The trader leaves with far more than he paid for.", "dmg"); }
    if (t === "slaver") { const n = irnd(2, 3); g.pop -= n; g.taken += n; log(g, `${n} young villagers leave with the recruiter, waving. They will not write home.`, "dmg"); const nt = Object.keys(g.notables).filter(k => home(g, k) && k !== "moss"); if (Math.random() < 0.3 && nt.length) { const k = pick(nt); g.notables[k] = "taken"; log(g, `${NOTABLES.find(n => n.id === k).name} went with them.`, "dmg"); } }
    if (t === "spy") { g.spied += 1; log(g, "The traveler leaves at dawn, having asked a great many questions.", "info"); }
  } else if (how === "refuse") {
    if (t === "honest") { g.trust = clamp(g.trust - 6); if (o.id === "missionary") g.favor = Math.max(0, g.favor - 1); log(g, "You send them away. The village thinks you were unkind — and they were right.", "dmg"); }
    else { g.trust = clamp(g.trust + 2); log(g, "You send them away. The village grumbles — until later.", "info"); }
  } else if (how === "confront" && g.subtype === "melano") {
    // Melano cannot speak. A bellow says enough.
    if (t === "slaver" || t === "spy") { g.clues += 1; g.trust = clamp(g.trust + 4); log(g, "You bellow and lower your horns. He runs for the road and doesn't look back — dropping a sigil-chain as he goes. (+1 clue)", "reward"); }
    else if (t === "cheat") { g.goods += 1; log(g, "One bellow and the trader suddenly finds his scales were wrong all along.", "reward"); }
    else { g.trust = clamp(g.trust - 6); log(g, "You bellow at an honest stranger. They flee. The Gemea won't look at you for the rest of the day.", "dmg"); }
  } else if (how === "confront") {
    if (t === "slaver" || t === "spy") {
      g.clues += 1;
      log(g, "You call it out loud, in front of everyone. He runs for the road — with friends waiting.", "dmg");
      startFight(g, "patrol", t === "slaver" ? ["thug", "netter"] : ["thug"], { title: "UNMASKED" });
    } else if (t === "cheat") { g.goods += 2; g.trust = clamp(g.trust + 4); log(g, "You tip his scale-pan over. Lead. He pays fairly after that.", "reward"); }
    else { g.trust = clamp(g.trust - 10); log(g, "You accuse an honest stranger. The village is ashamed of you.", "dmg"); }
  }
}

// ── Combat outcomes ────────────────────────────────────────────────────────
export function applyCombatResult(g, result, battle, diff) {
  const c = g.combat; if (!c || c.result) return;
  const p = battle.player;
  g.hp = Math.max(0, Math.round(p.hp)); g.stamina = Math.round(p.stamina); g.mp = Math.round(p.mp);
  const lines = [];
  if (result === "win") {
    if (c.kind === "hunt") { const f = irnd(6, 11); g.food += f; g.goods += 1; lines.push(`+${f} food`, "+1 goods (hides)"); }
    if (c.kind === "patrol") { g.clues += 1; g.materials += 2; lines.push("+1 clue: they carried Orlen's seal"); }
    if (c.kind === "heat") { g.trust = clamp(g.trust + (g.subtype === "melano" ? 20 : 12)); lines.push("The band turns back toward the highlands.", g.subtype === "melano" ? "The Gemea stop flinching when you pass." : "The Gemea are safe this summer."); }
    if (c.kind === "kekali") { g.trust = clamp(g.trust + 10); g.food += 8; lines.push("The pack moves on. Trust +10"); }
    if (c.kind === "rescue") { g.flags.rescued = true; const n = Math.min(g.taken, irnd(3, 5)); g.taken -= n; g.pop += n; const back = Object.keys(g.notables).filter(k => g.notables[k] === "taken"); back.forEach(k => { g.notables[k] = "home"; }); lines.push(`${n} villagers brought home`, ...back.map(k => `${NOTABLES.find(n => n.id === k).name} is home`)); g.trust = clamp(g.trust + 15); }
    if (c.kind === "harvest1") { lines.push("The first wave breaks against you."); }
    if (c.kind === "harvest2") { g.flags.orlenDown = true; g.trust = clamp(g.trust + 25); lines.push("Factor Orlen is finished.", "Trust +25"); }
  } else {
    if (diff?.perma && !["harvest1", "harvest2"].includes(c.kind)) { g.dead = { reason: "You fell defending Hollowmere's borders." }; }
    else {
      g.hp = Math.max(1, Math.round(g.maxHp * 0.15));
      lines.push("You are carried home.");
      if (c.kind === "heat") { takeGemea(g, lines); }
      if (c.kind === "harvest1" || c.kind === "harvest2") {
        const n = irnd(6, 9); g.pop -= n; g.taken += n; g.trust = clamp(g.trust - 25);
        const nt = Object.keys(g.notables).filter(k => home(g, k));
        for (let i = 0; i < 2 && nt.length; i++) { const k = nt.splice(Math.floor(Math.random() * nt.length), 1)[0]; g.notables[k] = "taken"; lines.push(`${NOTABLES.find(n => n.id === k).name} was taken`); }
        lines.push(`${n} villagers taken in the night`);
        if (g.subtype === "angelos") lines.push("Your wings got you clear. Barely.");
      }
    }
  }
  c.result = result; c.summary = { title: result === "win" ? "Victory" : "Defeat", lines };
}

export function afterCombat(g) {
  const c = g.combat; g.combat = null; if (!c) return;
  if (c.kind === "harvest1") {
    if (c.result === "win") { g.event = { id: "orlenArrives" }; }
    else { g.event = { id: "aftermath" }; }
  }
  if (c.kind === "harvest2") g.event = { id: "aftermath" };
}

function harvestScale(g) {
  return Math.max(0.7, 1 + g.spied * 0.12 - (g.built.palisade ? 0.2 : 0));
}

function takeGemea(g, lines) {
  const n = 2; g.pop -= n; g.taken += n; g.trust = clamp(g.trust - 12);
  const msg = "Two Gemea were carried off into the highlands. Some years, they come back.";
  if (lines) lines.push(msg); else log(g, msg, "dmg");
  if (home(g, "pip") && Math.random() < 0.5) { g.notables.pip = "taken"; if (lines) lines.push("Pip is gone."); else log(g, "Pip is gone.", "dmg"); }
}

// ── Events ─────────────────────────────────────────────────────────────────
export const EVENTS = {
  outsider: (g) => {
    const o = OUTSIDERS.find(x => x.id === g.outsider?.id);
    const read = g.outsider?.read && !g.outsider?.misread;
    const tried = g.outsider?.read;
    return {
      title: o.who, tone: "#e0a523",
      text: `"${o.pitch}"${read ? `\n\nYour senses: ${o.tell[o.truth]}` : tried ? "\n\nYour instincts give you nothing clear. You'll have to decide blind." : "\n\nThe villagers are already smiling at them. Hollowmere trusts by default — that's why people like this come here."}`,
      choices: [
        ...(!tried ? [{ label: "Read them — scent, heartbeat, posture", hint: `${Math.round(readChance(g) * 100)}% to see the truth`, run: (g) => {
          if (Math.random() < readChance(g)) { g.outsider.read = true; if (["slaver", "spy"].includes(o.truth)) g.clues += 1; log(g, `Instinct: ${o.tell[o.truth]}`, "lumen"); }
          else { g.outsider.read = true; g.outsider.misread = true; log(g, "Your instincts give you nothing clear. They seem… fine?", "info"); }
          g.event = { id: "outsider" };
        } }] : []),
        { label: "Welcome them", hint: "Trade, hospitality", run: (g) => { resolveOutsider(g, "welcome"); spend(g); } },
        { label: "Turn them away politely", hint: "Safe — but rude if they're honest", run: (g) => { resolveOutsider(g, "refuse"); spend(g); } },
        { label: g.subtype === "melano" ? "Bellow at them" : "Confront them publicly", hint: g.subtype === "melano" ? "You can't argue — but you can frighten. No fight, but honest folk will be scared too." : "If you're wrong, the village will be ashamed of you", run: (g) => { resolveOutsider(g, "confront"); spend(g); } },
      ],
    };
  },
  festival: () => ({
    title: "Festival of Seeds", tone: "#7fbf5a",
    text: "Spring planting ends with dancing, honey cakes and every child in the village trying to ride Elder Moss. Nobody remembers who started the tradition. Probably the Hero.",
    choices: [
      { label: "Dance", hint: "Trust +8", run: (g) => { g.trust = clamp(g.trust + 8); } },
      { label: "Listen to Moss tell the story of the 7th Hero", hint: "Favor +1, the village remembers what it is", run: (g) => { g.favor += 1; log(g, "He made us from his own core, Moss says. That's why we're hard to kill and easy to fool."); } },
    ],
  }),
  orlen: () => ({
    title: "Factor Orlen", tone: "#ffd966",
    text: "A carriage — an actual carriage — comes up the forest road. A smiling man in good clothes steps out with gifts: iron tools, salt, sweets for the cubs. \"The Hero's children deserve a patron,\" he says. \"I'll protect your trade. All I ask is the chance to offer your young folk honest work in the city.\"",
    choices: [
      { label: "Accept his patronage", hint: "+4 goods, trust +5. He'll send recruiters more often.", run: (g) => { g.goods += 4; g.trust = clamp(g.trust + 5); g.flags.patron = true; log(g, "The village loves him. You try to."); } },
      { label: "Decline politely", hint: "Trust -5. He keeps smiling.", run: (g) => { g.trust = clamp(g.trust - 5); log(g, "\"Of course, of course. Another time.\" His smile doesn't move at all."); } },
      { label: "Read him", hint: "Use your senses", run: (g) => { if (Math.random() < 0.5 + (g.subtype === "angelos" || g.subtype === "canine" ? 0.2 : 0)) { g.clues += 1; log(g, "Cologne over iron. The same iron as pact-chains. He is counting you. (+1 clue)", "lumen"); } else log(g, "He smells of cologne and nothing else. Too much cologne?"); g.event = { id: "orlen2" }; } },
    ],
  }),
  orlen2: () => ({ title: "Factor Orlen", tone: "#ffd966", text: "He's still waiting for an answer, gifts in hand.", choices: [
    { label: "Accept", hint: "+4 goods, trust +5", run: (g) => { g.goods += 4; g.trust = clamp(g.trust + 5); g.flags.patron = true; } },
    { label: "Decline", hint: "Trust -5", run: (g) => { g.trust = clamp(g.trust - 5); } },
  ] }),
  kekali: () => ({
    title: "A Kekali pack", tone: "#e85c3a",
    text: "Kekali have been seen at the edge of the goat pastures — four huntresses, amber eyes, tails low. They're testing the village.",
    choices: [
      { label: "Drive them off", hint: "Fight the pack", run: (g) => startFight(g, "kekali", ["kekali", "kekali"], { allies: alliesFor(g, home(g, "kesh") ? 1 : 0), title: "THE PACK" }) },
      { label: "Move the herds inland", hint: "Food -6, no fight", run: (g) => { g.food = Math.max(0, g.food - 6); log(g, "The pack loses interest. So do the goats, in the new pasture."); } },
    ],
  }),
  heat: (g) => {
    const allies = alliesFor(g, (home(g, "kesh") ? 1 : 0) + (home(g, "rook") ? 1 : 0));
    const fight = (title) => (g) => startFight(g, "heat", ["melano", "melano"], { allies, title });
    if (g.subtype === "melano") return {
      title: "The heat season", tone: "#9a5a4a",
      text: "You feel it before you hear it: a pressure behind your eyes, a need to break something. Then the bellowing from the high pastures — a Melano band, come down from the highlands for the season. The Gemea know what that means. So do you. You can't tell your kind to leave. None of you have words.",
      choices: [
        { label: "Go up into the peaks alone until it passes", hint: "Lose two days. Trust +6 — they're grateful you stayed away. The band still prowls.", run: (g) => { g.trust = clamp(g.trust + 6); spend(g, 4); if (Math.random() < 0.5) takeGemea(g); } },
        { label: "Stand between them and the Gemea", hint: `Fight two Melano bulls (${allies} allies). Win: trust +20.`, run: fight("YOUR OWN KIND") },
      ],
    };
    if (g.subtype === "gemea") return {
      title: "The heat season", tone: "#e8dcc8",
      text: "Bellowing echoes down from the high pastures. The Melano heat season. Every summer, bands come down from the highlands for Gemea — and not everyone they take survives it. Your knees won't stop shaking. They'll come for you, too.",
      choices: [
        { label: "Hide in the high caves with the other Gemea", hint: "Food -6, lose a day. Everyone stays safe.", disabled: g.food < 6, run: (g) => { g.food -= 6; spend(g, 2); g.trust = clamp(g.trust + 4); log(g, "Two nights in the cold caves, holding each other's hands. The bellowing passes.", "heal"); } },
        { label: "Stand your ground", hint: `Fight two Melano bulls (${allies} allies). You are not built for this.`, run: fight("THE HEAT SEASON") },
      ],
    };
    return {
      title: "The heat season", tone: "#9a5a4a",
      text: "Bellowing from the high pastures. It's the Melano heat season: bands come down from the highlands, aggressive and wordless, and every year Gemea go missing from the mountain hamlets. Some are never found. Hollowmere's own Gemea — Pip's family among them — are terrified.",
      choices: [
        { label: "Hide the Gemea in the high caves", hint: "Food -6. They're safe. Trust +5", disabled: g.food < 6, run: (g) => { g.food -= 6; g.trust = clamp(g.trust + 5); log(g, "The Gemea spend two cold nights in the caves. The band passes by.", "heal"); } },
        { label: "Stand guard at the pastures", hint: `Fight two Melano bulls (${allies} allies). Win: trust +12`, run: fight("THE HEAT SEASON") },
        { label: "Hope they pass by", hint: "Risky", run: (g) => { if (Math.random() < 0.3) log(g, "They pass by. This year.", "info"); else takeGemea(g); } },
      ],
    };
  },
  pip: (g) => ({
    title: "Pip saw something", tone: "#9a8cff",
    text: `${home(g, "pip") ? "Pip tugs your sleeve, wide-eyed. \"There were men in the old mill. They had chains that glowed. They were talking about 'the harvest'.\"" : "Pip is gone — taken. But Pip's best friend comes instead, shaking: men in the old mill, glowing chains, talk of 'the harvest'."}`,
    choices: [
      { label: "Search the mill", hint: "+1 clue, maybe a fight", run: (g) => { g.clues += 1; if (Math.random() < 0.5) startFight(g, "patrol", ["thug", "netter"], { title: "THE OLD MILL" }); else log(g, "Empty — but there are cage-marks on the floor. (+1 clue)", "lumen"); } },
      { label: "Tell the elders", hint: "Trust +4. Moss believes you.", run: (g) => { g.trust = clamp(g.trust + 4); g.clues += 1; } },
    ],
  }),
  missing: (g) => ({
    title: "The missing", tone: "#c8b48a",
    text: `${g.taken > 0 ? `${g.taken} villagers have gone 'to work in the city'. Not one has written.` : "A family from the next valley arrives: their young people went with a recruiter and never wrote."} ${g.subtype === "canine" || home(g, "rook") ? "You know how to follow a trail." : "Nobody here knows how to track that far."}`,
    choices: [
      { label: "Follow the trail", hint: g.subtype === "canine" || home(g, "rook") ? "+2 clues; if anyone was taken, a chance to bring them home" : "Needs Canine Kin or Rook", disabled: !(g.subtype === "canine" || home(g, "rook")), run: (g) => { g.clues += 2; if (g.taken > 0) startFight(g, "rescue", ["netter", "thug"], { title: "THE HOLDING PEN" }); else log(g, "The trail ends at a sealed wagon-yard stamped with Orlen's seal. (+2 clues)", "lumen"); } },
      { label: "Let it go", hint: "", run: () => {} },
    ],
  }),
  fever: (g) => ({
    title: "Winter fever", tone: "#a89df0",
    text: g.built.infirmary ? "A fever runs through the village — but Sela's infirmary is ready. Nobody dies." : "A fever runs through the village. Beastkin cores are potent, but nobody here knows how to use them for healing.",
    choices: [
      ...(g.built.infirmary ? [{ label: "Help Sela", hint: "Trust +5", run: (g) => { g.trust = clamp(g.trust + 5); } }] : [
        { label: "Use the herb stores", hint: "Herbs -4", disabled: g.herbs < 4, run: (g) => { g.herbs -= 4; log(g, "Bitter tea for everyone. The fever breaks.", "heal"); } },
        { label: "Endure it", hint: "Lose 3 villagers", run: (g) => { g.pop -= 3; log(g, "Three graves in the frozen ground.", "dmg"); } },
      ]),
    ],
  }),
  harvestNight: (g) => {
    const allies = alliesFor(g, (home(g, "kesh") ? 1 : 0) + (home(g, "rook") ? 1 : 0));
    return {
      title: "Harvest Night", tone: "#e85c3a",
      text: `Lanterns in the trees. Nets. Glowing chains. Orlen's "harvest" was never about grain. ${g.spied > 0 ? `They know exactly where everyone sleeps (spied ${g.spied}×).` : "They don't know the village well — nobody let their spies in."} ${g.built.palisade ? "The palisade holds them to the gate." : "There's nothing between them and the houses but you."}`,
      choices: [{ label: "Defend Hollowmere", hint: `Allies at your side: ${allies}`, run: (g) => startFight(g, "harvest1", ["thug", "netter", "thug"], { allies, scale: harvestScale(g), title: "HARVEST NIGHT — THE NETS" }) }],
    };
  },
  orlenArrives: (g) => {
    const knights = g.exposed && g.favor >= 3;
    return {
      title: "The Factor himself", tone: "#ffd966",
      text: `Orlen walks through the broken nets, still smiling, a crystal blazing in his cane. "This was going to be so much more pleasant." ${knights ? "Then horns from the forest road — silver chains, halos of blades. The Church Knights. The missionary you welcomed, the clues you brought them: it all comes due tonight." : g.exposed ? "You told the Church — but they don't trust you enough to come in time." : ""}`,
      choices: [{ label: "End it", hint: knights ? "Church Knights fight with you (+3 allies)" : "Final fight", run: (g) => startFight(g, "harvest2", ["orlen", "netter"], { allies: alliesFor(g, (knights ? 3 : 0) + (home(g, "kesh") ? 1 : 0)), scale: harvestScale(g), title: "FACTOR ORLEN" }) }],
    };
  },
  aftermath: (g) => ({
    title: "After the harvest", tone: "#c8b48a",
    text: g.flags.orlenDown ? "Dawn. The nets burn in a pile in the square. Children who were hiding come out one by one. Hollowmere has never once had to fight for itself before. It did tonight." : `Dawn. ${g.taken} of Hollowmere's people are gone, carted toward the coast. Winter is coming, and the village looks at you.`,
    choices: [{ label: "Face the winter", hint: g.taken > 0 && !g.flags.orlenDown ? "You can still follow the trail in winter" : "", run: () => {} }],
  }),
};

export const ENDINGS = {
  sanctuary: { title: "Sanctuary", good: true, text: "In spring a Church Knight rides up the forest road — not to rescue anyone, but to leave a banner: Hollowmere is under the Church's protection now, by name. The village doesn't need it as much as it once did. It learned to look outsiders in the eye." },
  unbowed: { title: "Unbowed", good: true, text: "Factor Orlen's carriage rots in the ditch where it fell. Hollowmere is still naive, still generous, still shares everything it has — but now there is always someone on the wall at night, and everyone knows your name." },
  hardwinter: { title: "A Hard Winter", good: false, text: "Hollowmere survives the year. Not everyone in it did. The village is quieter, warier, and Orlen is still out there with his smile and his price list. Spring will come. So will he." },
  scattered: { title: "Scattered", good: false, text: "By midwinter there aren't enough of you left to call it a village. The survivors walk to other beastkin valleys, carrying a warning about smiling men with carriages. Some of the valleys listen." },
};
