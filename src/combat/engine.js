// engine.js — Pure turn-based combat logic shared by every standard fight.
// State shape:
//   { player: {hp,maxHp,mp,maxMp,stamina,maxStamina,statuses,stance}, enemies: [...], allies, log: [], fx: [], round, over }
// Every exported "do*" function takes a state and returns a NEW state (never mutates the input).

import { findMonster } from "./monsters";

export const rnd = (a, b) => a + Math.random() * (b - a);
export const irnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clone = (s) => (typeof structuredClone === "function" ? structuredClone(s) : JSON.parse(JSON.stringify(s)));
let uidCounter = 0;
const uid = (p = "e") => `${p}_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

// ── Construction ────────────────────────────────────────────────────────────
// base: a monster template; scale: { hp, atk } multipliers
export function makeEnemy(base, scale = {}) {
  const tpl = base.moves ? base : (findMonster(base.id) || base);
  const hp = Math.round((tpl.hp || 50) * (scale.hp || 1));
  const atk = Math.round((tpl.atk || 10) * (scale.atk || 1));
  const poise = tpl.poise || Math.max(2, tpl.star * 2);
  return {
    ...tpl, uid: uid(tpl.id), hp, maxHp: hp, atk, baseAtk: atk, def: tpl.def || 0,
    poise, maxPoise: poise, statuses: {}, intent: null, forcedNext: null, cloned: false,
    moves: tpl.moves || [{ id: "hit", name: "Attack", kind: "attack", mult: [0.9, 1.2], tell: "Prepares to attack." }],
    traits: tpl.traits || [], reward: tpl.reward || { xp: 20, bronze: 5 },
  };
}

export function createBattle({ enemies, player, allies = 0, coreless = false }) {
  const s = {
    player: { ...player, statuses: {}, stance: null },
    enemies: enemies.map(e => (e.uid ? e : makeEnemy(e))),
    allies, coreless, round: 1, log: [], fx: [], over: null, lastWasSpell: false,
  };
  s.enemies.forEach(e => { e.intent = pickIntent(e, s); });
  pushLog(s, `${s.enemies.length === 1 ? s.enemies[0].name + " appears" : s.enemies.length + " enemies appear"}!`, "sys");
  return s;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
export function pushLog(s, msg, type = "info") { s.log.push({ msg, type, id: uid("l") }); if (s.log.length > 60) s.log.shift(); }
function pushFx(s, target, text, color) { s.fx.push({ id: uid("fx"), target, text, color }); if (s.fx.length > 30) s.fx.shift(); }
export const alive = (s) => s.enemies.filter(e => e.hp > 0);
const has = (e, t) => e.traits?.includes(t);

function pickIntent(e, s) {
  if (e.forcedNext) {
    const m = e.moves.find(x => x.id === e.forcedNext);
    e.forcedNext = null;
    if (m) return m;
  }
  const pool = e.moves.filter(m => !m.hidden);
  // Packs coordinate: pack-buffs are pointless when alone
  const usable = pool.filter(m => !(m.allies && alive(s).length <= 1));
  const list = usable.length ? usable : pool;
  const total = list.reduce((a, m) => a + (m.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const m of list) { r -= (m.weight ?? 1); if (r <= 0) return m; }
  return list[0];
}

export function intentBadge(move) {
  if (!move) return { icon: "…", label: "Unknown", color: "#888" };
  if (move.kind === "charge") return { icon: "◎", label: "Winding up", color: "#ffd966" };
  if (move.kind === "buff") return { icon: "✦", label: "Buff", color: "#87cefa" };
  if (move.pierce) return { icon: "➶", label: "Unblockable — Evade!", color: "#ff6bcb" };
  if (move.sweep) return { icon: "≋", label: "Sweep — Guard!", color: "#ff8c00" };
  if (move.kind === "heavy") return { icon: "⬢", label: "Heavy", color: "#e85c3a" };
  if (move.kind === "multi") return { icon: "⚔", label: `×${move.hits} hits`, color: "#e0a523" };
  if (move.kind === "drain") return { icon: "◌", label: "Mana drain", color: "#a89df0" };
  return { icon: "⚔", label: "Attack", color: "#e0a523" };
}

// Percentage armor: 50 def ≈ 50% reduction. Keeps high-tier gear valuable without trivializing fights.
const mitigate = (dmg, def) => dmg * (1 - Math.max(0, def) / (Math.max(0, def) + 50));

function enemyDamageTaken(e, raw) {
  let d = raw;
  if (e.statuses.staggered) d *= 1.5;
  if (e.statuses.recharging) d *= 1.5;
  if (e.statuses.shield) d *= 0.6;
  return d;
}

// ── Player actions ──────────────────────────────────────────────────────────
// ctx: { atk, def, dodge, crit, strikeBonus, race }
export function doPlayerAction(state, action, targetUid, ctx) {
  const s = clone(state);
  const p = s.player;
  if (s.over) return s;
  if (action.staminaCost && p.stamina < action.staminaCost) { pushLog(s, "Not enough stamina.", "dmg"); return s; }
  if (action.mpCost && p.mp < action.mpCost) { pushLog(s, "Not enough mana.", "dmg"); return s; }
  p.stamina -= action.staminaCost || 0;
  p.mp -= action.mpCost || 0;
  p.stance = null;
  s.lastWasSpell = !!action.isSpell;

  const live = alive(s);
  let target = s.enemies.find(e => e.uid === targetUid && e.hp > 0) || live[0];

  if (action.id === "guard") {
    p.stance = "guard"; p.stamina = Math.min(p.maxStamina, p.stamina + 8);
    pushLog(s, "You brace yourself. Incoming hits will be blunted — sweeps most of all.", "info");
    return endPlayerTurn(s, ctx);
  }
  if (action.id === "evade") {
    p.stance = "evade";
    pushLog(s, "You stay light on your feet, ready to dodge.", "info");
    return endPlayerTurn(s, ctx);
  }
  if (action.id === "focus") {
    p.stamina = Math.min(p.maxStamina, p.stamina + 22);
    p.mp = Math.min(p.maxMp, p.mp + 4);
    pushLog(s, "You steady your breathing. +22 stamina.", "heal");
    return endPlayerTurn(s, ctx);
  }

  if (!target) return s;
  if (target.intent?.airborne && !action.isSpell && !action.ranged) {
    pushLog(s, `${target.name} is out of reach! Only spells or ranged attacks can hit it now.`, "dmg");
    pushFx(s, target.uid, "Out of reach", "#87cefa");
    return endPlayerTurn(s, ctx);
  }

  if (action.effect === "confuse") {
    target.statuses.confuse = (action.turns || 1) + 1;
    pushLog(s, `${action.name}: ${target.name} sees enemies everywhere.`, "spell");
    pushFx(s, target.uid, "Confused", "#ff6bcb");
    return endPlayerTurn(s, ctx);
  }

  const targets = action.aoe ? alive(s) : [target];
  const blindMiss = p.statuses.blind ? 0.3 : 0;
  let total = 0;
  for (const t of targets) {
    const hits = action.hits || 1;
    for (let h = 0; h < hits && t.hp > 0; h++) {
      if (Math.random() < blindMiss + (action.accuracy ? 1 - action.accuracy : 0)) { pushFx(s, t.uid, "Miss", "#888"); continue; }
      let raw = irnd(action.dmg?.[0] ?? 4, action.dmg?.[1] ?? 10) + (action.isSpell ? Math.round(ctx.atk * 0.35) : ctx.atk);
      if (action.id === "strike") raw += ctx.strikeBonus || 0;
      if (p.statuses.weaken) raw *= 0.75;
      const crit = Math.random() < (ctx.crit || 0.08) + (t.statuses.staggered ? 0.15 : 0);
      if (crit) raw *= 1.6;
      let dmg = action.armorPierce || action.isSpell ? raw : mitigate(raw, t.def);
      dmg = Math.max(1, Math.round(enemyDamageTaken(t, dmg)));
      t.hp = Math.max(0, t.hp - dmg);
      total += dmg;
      pushFx(s, t.uid, `${crit ? "✷" : ""}-${dmg}`, crit ? "#ffd966" : "#fff");
      // Poise / stagger
      if (!t.statuses.staggered && t.hp > 0) {
        t.poise -= action.poise ?? (1 + Math.floor((action.staminaCost || 0) / 10) + (crit ? 1 : 0));
        if (t.poise <= 0) {
          t.statuses.staggered = 1; t.maxPoise = Math.round(t.maxPoise * 1.5) + 1; t.poise = t.maxPoise; t.forcedNext = null; // it adapts: harder to stagger again
          pushLog(s, `${t.name} is STAGGERED! It loses its action and takes extra damage.`, "reward");
          pushFx(s, t.uid, "STAGGER", "#ffd966");
        }
      }
      // Status effects on enemy
      if (action.effect === "stun" && t.hp > 0 && Math.random() < (action.effectChance ?? 1)) { t.statuses.stun = 1; pushFx(s, t.uid, "Stunned", "#ffd966"); }
      if (action.effect === "burn" && t.hp > 0) t.statuses.burn = Math.max(t.statuses.burn || 0, 3);
      if (action.effect === "bleed" && t.hp > 0) t.statuses.bleed = Math.max(t.statuses.bleed || 0, 3);
      // Feedback trait: melee punishes the attacker
      if (has(t, "feedback") && !action.isSpell) {
        const fb = Math.max(1, Math.round(dmg * 0.18));
        p.hp = Math.max(0, p.hp - fb);
        pushFx(s, "player", `-${fb}`, "#ff8c00");
        pushLog(s, `Unstable mana arcs back through your weapon (${fb}).`, "dmg");
      }
      // Crystone & other mana-eaters drink spells
      if (has(t, "manaEater") && action.isSpell && t.hp > 0) {
        const heal = Math.round(dmg * 0.3);
        t.hp = Math.min(t.maxHp, t.hp + heal);
        pushLog(s, `${t.name} absorbs part of the spell (+${heal} HP).`, "spell");
      }
    }
  }
  pushLog(s, `${action.name}${action.aoe ? " hits everything" : " → " + target.name}: ${total} damage.`, action.isSpell ? "spell" : "dmg");
  resolveDeaths(s, ctx);
  if (alive(s).length === 0) { s.over = "win"; pushLog(s, "Victory.", "reward"); return s; }
  if (p.hp <= 0) { s.over = "lose"; pushLog(s, "You collapse.", "sys"); return s; }
  return endPlayerTurn(s, ctx);
}

// Allies (Doomsday militia) act right after the player.
function alliesAct(s) {
  if (!s.allies) return;
  let dealt = 0;
  for (let i = 0; i < s.allies; i++) {
    const live = alive(s); if (!live.length) break;
    const t = live[Math.floor(Math.random() * live.length)];
    const d = Math.max(1, Math.round(mitigate(irnd(10, 18), t.def)));
    t.hp = Math.max(0, t.hp - d); dealt += d;
  }
  if (dealt) pushLog(s, `Your allies strike for ${dealt} total.`, "info");
}

function endPlayerTurn(s, ctx) {
  alliesAct(s);
  resolveDeaths(s, ctx);
  if (alive(s).length === 0) { s.over = "win"; pushLog(s, "Victory.", "reward"); }
  s.phase = "enemy";
  return s;
}

function resolveDeaths(s, ctx) {
  for (const e of s.enemies) {
    if (e.hp > 0 || e.dead) continue;
    e.dead = true;
    pushLog(s, `${e.name} falls.`, "reward");
    if (has(e, "explode")) {
      const guard = s.player.stance === "guard";
      const raw = e.atk * 1.4 * (guard ? 0.3 : 1);
      const dmg = Math.max(1, Math.round(mitigate(raw, ctx.def)));
      s.player.hp = Math.max(0, s.player.hp - dmg);
      pushFx(s, "player", `-${dmg}`, "#ff8c00");
      pushLog(s, `${e.name} bursts in superheated mana! (${dmg}${guard ? ", guarded" : ""})`, "dmg");
    }
  }
}

// ── Enemy phase ─────────────────────────────────────────────────────────────
export function doEnemyPhase(state, ctx) {
  const s = clone(state);
  if (s.over) return s;
  const p = s.player;
  const packBonus = (attacker) => alive(s).some(o => o.uid !== attacker.uid && has(o, "pack")) ? 1.12 : 1;

  for (const e of s.enemies) {
    if (e.hp <= 0 || p.hp <= 0) continue;
    // Huliut's pressure field — coreless beings (Tenebrim) are invisible to it
    if (has(e, "pressure") && !s.coreless) {
      const d = Math.max(1, Math.round(e.atk * 0.12));
      p.hp = Math.max(0, p.hp - d);
      pushLog(s, `The pressure field crushes you (${d}).`, "dmg");
    }
    if (e.statuses.staggered) { pushLog(s, `${e.name} reels, unable to act.`, "info"); e.intent = null; continue; }
    if (e.statuses.stun) { pushLog(s, `${e.name} is stunned.`, "info"); e.intent = null; continue; }
    const move = e.intent || pickIntent(e, s);
    if (e.statuses.confuse && Math.random() < 0.6) {
      const others = alive(s).filter(o => o.uid !== e.uid);
      const victim = others.length ? others[Math.floor(Math.random() * others.length)] : e;
      const d = Math.max(1, Math.round(e.atk * 0.9));
      victim.hp = Math.max(0, victim.hp - d);
      pushFx(s, victim.uid, `-${d}`, "#ff6bcb");
      pushLog(s, `${e.name}, confused, attacks ${victim === e ? "itself" : victim.name} (${d}).`, "spell");
      continue;
    }
    executeMove(s, e, move, ctx, packBonus(e));
    if (move.next) e.forcedNext = move.next;
    if (move.selfStatus) Object.entries(move.selfStatus).forEach(([k, v]) => { e.statuses[k] = v + 1; });
  }
  resolveDeaths(s, ctx);
  return endRound(s, ctx);
}

function executeMove(s, e, move, ctx, packMult) {
  const p = s.player;
  if (move.kind === "charge") { pushLog(s, `${e.name}: ${move.tell}`, "lumen"); return; }
  if (move.kind === "buff") {
    if (move.self) Object.entries(move.self).forEach(([k, v]) => { e.statuses[k] = v + 1; });
    if (move.allies) alive(s).forEach(o => Object.entries(move.allies).forEach(([k, v]) => { o.statuses[k] = v + 1; }));
    pushLog(s, `${e.name} uses ${move.name}.`, "info");
    pushFx(s, e.uid, move.name, "#87cefa");
    return;
  }
  // Allies can soak attacks during Doomsday battles
  if (s.allies > 0 && Math.random() < 0.18) {
    if (Math.random() < 0.35) { s.allies -= 1; pushLog(s, `${e.name}'s ${move.name} kills one of your allies.`, "dmg"); }
    else pushLog(s, `An ally takes ${e.name}'s ${move.name} for you.`, "info");
    return;
  }
  const hits = move.hits || 1;
  let total = 0, dodged = 0;
  for (let h = 0; h < hits; h++) {
    // Dodge
    let dodge = move.sweep ? 0 : (ctx.dodge || 5) + (p.stance === "evade" ? 55 : 0);
    if (has(e, "blindHunter") && p.stance === "guard") dodge += 60; // holding still
    if (Math.random() * 100 < dodge) { dodged++; continue; }
    let raw = e.atk * rnd(move.mult?.[0] ?? 0.9, move.mult?.[1] ?? 1.2) * packMult;
    if (e.statuses.rally) raw *= 1.2;
    if (has(e, "enrage") && e.hp < e.maxHp * 0.35) raw *= 1.3;
    if (p.stance === "guard" && !move.pierce) raw *= (move.sweep || move.kind === "heavy") ? 0.3 : 0.5;
    const def = Math.max(0, ctx.def - (p.statuses.acid ? (p.statuses.acidPower || 6) : 0));
    const dmg = Math.max(1, Math.round(mitigate(raw, def)));
    p.hp = Math.max(0, p.hp - dmg); total += dmg;
    if (move.kind === "drain" && move.drain) p.mp = Math.max(0, p.mp - move.drain);
    if (move.status && p.hp > 0) applyPlayerStatus(s, move.status);
    if (p.hp <= 0) break;
  }
  if (total > 0) {
    pushFx(s, "player", `-${total}`, "#e85c3a");
    pushLog(s, `${e.name} — ${move.name}: ${total} damage${dodged ? ` (${dodged} dodged)` : ""}.`, "dmg");
  } else {
    pushFx(s, "player", "Dodged", "#3ec995");
    pushLog(s, `You avoid ${e.name}'s ${move.name}!`, "heal");
  }
}

function applyPlayerStatus(s, st) {
  const p = s.player;
  if (st.type === "stun" && p.statuses.stunImmune) return;
  p.statuses[st.type] = Math.max(p.statuses[st.type] || 0, st.turns);
  if (st.type === "bleed" || st.type === "burn") p.statuses[st.type + "Power"] = Math.max(p.statuses[st.type + "Power"] || 0, st.power || 4);
  if (st.type === "acid") p.statuses.acidPower = Math.max(p.statuses.acidPower || 0, st.power || 6);
}

function endRound(s, ctx) {
  const p = s.player;
  // Damage over time on player
  for (const dot of ["bleed", "burn"]) {
    if (p.statuses[dot] > 0) {
      const d = p.statuses[dot + "Power"] || 4;
      p.hp = Math.max(0, p.hp - d);
      pushLog(s, `${dot === "bleed" ? "You bleed" : "You burn"} (${d}).`, "dmg");
    }
  }
  // Tick player statuses
  for (const k of Object.keys(p.statuses)) {
    if (k.endsWith("Power") || k === "stunImmune") continue;
    if (k === "stun") continue; // consumed at the start of the player's turn
    p.statuses[k] -= 1;
    if (p.statuses[k] <= 0) { delete p.statuses[k]; delete p.statuses[k + "Power"]; }
  }
  // Enemies: DoTs, regen, tick, clone, new intents
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    if (e.statuses.burn) { const d = Math.round(e.maxHp * 0.05); e.hp = Math.max(0, e.hp - d); pushFx(s, e.uid, `-${d}`, "#ff8c00"); }
    if (e.statuses.bleed) { const d = Math.round(e.maxHp * 0.04); e.hp = Math.max(0, e.hp - d); pushFx(s, e.uid, `-${d}`, "#e85c3a"); }
    if (has(e, "regen") && e.hp > 0) { const h = Math.round(e.maxHp * 0.05); e.hp = Math.min(e.maxHp, e.hp + h); }
    for (const k of Object.keys(e.statuses)) { e.statuses[k] -= 1; if (e.statuses[k] <= 0) delete e.statuses[k]; }
    if (has(e, "clone") && !e.cloned && e.hp > 0 && e.hp < e.maxHp * 0.5) {
      e.cloned = true;
      const c = makeEnemy({ ...e, traits: e.traits.filter(t => t !== "clone"), name: e.name + " (clone)" }, { hp: 0.4, atk: 0.7 });
      c.hp = Math.round(e.maxHp * 0.4); c.maxHp = c.hp;
      s.enemies.push(c); c.intent = pickIntent(c, s);
      pushLog(s, `${e.name} spends its gathered mana to produce an inferior clone!`, "lumen");
    }
  }
  resolveDeaths(s, ctx);
  for (const e of s.enemies) if (e.hp > 0) e.intent = pickIntent(e, s);
  // Natural recovery
  p.stamina = Math.min(p.maxStamina, p.stamina + 5);
  p.stance = null;
  s.round += 1;
  if (alive(s).length === 0) { s.over = "win"; pushLog(s, "Victory.", "reward"); }
  else if (p.hp <= 0) { s.over = "lose"; pushLog(s, "You collapse.", "sys"); }
  s.phase = "player";
  // Stun: the player loses this turn
  if (!s.over && p.statuses.stun) {
    delete p.statuses.stun;
    p.statuses.stunImmune = 1; // can't be chain-stunned
    pushLog(s, "You are stunned and lose your turn!", "dmg");
    s.phase = "stunned";
  } else if (p.statuses.stunImmune && !p.statuses.stun) {
    delete p.statuses.stunImmune;
  }
  return s;
}

// Skip-turn used when the player is stunned.
export function doSkipTurn(state, ctx) {
  const s = clone(state); s.phase = "enemy"; return s;
}

export function useItemInBattle(state, potion) {
  const s = clone(state);
  const p = s.player;
  const key = potion.stat === "hp" ? "maxHp" : potion.stat === "mp" ? "maxMp" : "maxStamina";
  p[potion.stat] = Math.min(p[key], p[potion.stat] + potion.val);
  if (potion.stat === "hp") { delete p.statuses.bleed; delete p.statuses.bleedPower; }
  pushLog(s, `You drink ${potion.name}.`, "heal");
  pushFx(s, "player", `+${potion.val}`, "#3ec995");
  return s;
}
