// LumenariFight.jsx — The Doomsday boss.
// Lore: a Lumenari is a core grown past its ability to regulate mana. It drifts, it does not hate.
// Its body shifts between solid and intangible. It constantly leaks mana, and it burns itself out.
//
// Mechanics
//  • Form rhythm  — solid (full dmg) / flicker (weapons 50%) / intangible (weapons pass through, spells ABSORBED).
//                   The next forms are shown so the player can plan.
//  • Mana Pressure — rises every round; at 100 it Overflows: a huge sweep that also burns away its own HP.
//  • Leaked motes  — small targets; destroying them vents pressure, ignoring them lets it reabsorb them.
//  • Phase II      — spear rain lane-dodge QTE, hurled debris.
//  • Phase III     — stone golems shield it (50% dmg while any stands), terrain reshaping (evade it).
//  • Collapse      — timing QTE to strike the exposed core three times.
import React, { useEffect, useRef, useState } from "react";
import { Bar, Tag } from "../UIComponents";
import { SFX } from "../AudioEngine";

const irnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const mitigate = (dmg, def) => dmg * (1 - Math.max(0, def) / (Math.max(0, def) + 50));
const ARROWS = ["←", "→", "↑", "↓"];
const KEYMAP = { ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", a: "←", d: "→", w: "↑", s: "↓" };

const PHASES = {
  1: { name: "PHASE I — GROUNDED", hp: 300, def: 22, color: "#a89df0", rhythm: ["solid", "solid", "flicker", "intangible"], pressure: 11,
       flavor: "It barely touches the ground. It isn't angry. It doesn't seem to notice the city it is erasing." },
  2: { name: "PHASE II — LEVITATING", hp: 340, def: 28, color: "#ffd966", rhythm: ["solid", "flicker", "intangible", "flicker"], pressure: 13,
       flavor: "It lifts into the air. Debris rises with it, orbiting like moons. Light gathers overhead." },
  3: { name: "PHASE III — UNBOUND", hp: 380, def: 34, color: "#e85c3a", rhythm: ["flicker", "solid", "intangible", "intangible", "solid"], pressure: 15,
       flavor: "The ground is gone. Stone rises at its whim. Its cracks are blinding now — it is burning out." },
};

const MOVES = {
  touch: { name: "Drifting Touch", dmg: [26, 34], drainMp: 15, tell: "It drifts toward you, hand outstretched, serene. (Drains mana)" },
  pulse: { name: "Pulse", dmg: [20, 28], sweep: true, tell: "Light pools in its chest-cracks. (Sweep — Guard!)" },
  shed: { name: "Leak", motes: 2, tell: "Its cracks weep loose motes of light. (Destroy them to vent pressure)" },
  spears: { name: "Lumen Spears", lanes: 2, tell: "Spears of light gather overhead… (Lane dodge)" },
  debris: { name: "Orbiting Debris", dmg: [40, 52], heavy: true, tell: "Rubble orbits faster and faster around it. (Heavy — Evade or Guard)" },
  golems: { name: "Raise Stone", golems: 2, tell: "The ground groans. Something is being pulled up out of it." },
  quake: { name: "Terrain Reshape", dmg: [24, 32], pierce: true, stun: true, tell: "The ground beneath you bends upward! (Unblockable — Evade!)" },
  overflow: { name: "OVERFLOW", dmg: [70, 90], sweep: true, tell: "Every crack blazes white. Its core cannot hold any more. (Guard, then stabilize!)" },
};
const MOVESET = { 1: ["touch", "touch", "pulse", "shed"], 2: ["spears", "debris", "pulse", "shed", "touch"], 3: ["spears", "quake", "debris", "golems", "pulse"] };

const FORM_INFO = {
  solid: { label: "Solid", color: "#ffd966", desc: "Full damage." },
  flicker: { label: "Flickering", color: "#87cefa", desc: "Weapons deal 50%. Spells full." },
  intangible: { label: "Intangible", color: "#a89df0", desc: "Weapons pass through. Spells are ABSORBED." },
};

export default function LumenariFight({ stats, ctx, actions, potions = [], onConsumePotion, allies: startAllies = 0, diff, onPhase, onWin, onLose }) {
  const hpMult = diff?.hpMult || 1;
  const atkMult = diff?.enemyAtk || 1;
  const mkPhase = (n) => ({ phase: n, hp: Math.round(PHASES[n].hp * hpMult), maxHp: Math.round(PHASES[n].hp * hpMult), def: PHASES[n].def });

  const [st, setSt] = useState(() => ({
    boss: mkPhase(1), rhythmIdx: 0, pressure: 10, overflowPending: false,
    player: { hp: stats.hp, maxHp: stats.maxHp, mp: stats.mp, maxMp: stats.maxMp, stamina: stats.stamina, maxStamina: stats.maxStamina, stance: null, stunned: false },
    motes: [], golems: [], allies: startAllies, intent: "touch", turn: "player", log: [{ id: 0, msg: "The sky cracks open. Something drifts down through the light.", type: "lumen" }],
    over: null, round: 1,
  }));
  const [qte, setQte] = useState(null);
  const [interlude, setInterlude] = useState(null);
  const [shake, setShake] = useState(false);
  const logRef = useRef(null);
  const stRef = useRef(st); stRef.current = st;

  const P = PHASES[st.boss.phase] || PHASES[3];
  const form = P.rhythm[st.rhythmIdx % P.rhythm.length];
  const upcoming = Array.from({ length: 4 }, (_, k) => P.rhythm[(st.rhythmIdx + k) % P.rhythm.length]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [st.log]);
  useEffect(() => { onPhase?.(st.boss.phase); }, [st.boss.phase]);

  const log = (s, msg, type = "info") => { s.log = [...s.log.slice(-50), { id: Math.random(), msg, type }]; };
  const hurtPlayer = (s, raw, opts = {}) => {
    let r = raw * atkMult;
    if (s.player.stance === "guard" && !opts.pierce) r *= (opts.sweep || opts.heavy) ? 0.3 : 0.5;
    if (!opts.sweep && Math.random() * 100 < (ctx.dodge || 5) + (s.player.stance === "evade" ? 55 : 0)) { log(s, `You evade ${opts.name || "the attack"}!`, "heal"); return 0; }
    const d = Math.max(1, Math.round(mitigate(r, ctx.def)));
    s.player.hp = Math.max(0, s.player.hp - d);
    setShake(true); setTimeout(() => setShake(false), 380); SFX.hit();
    return d;
  };

  // ── Player turn ───────────────────────────────────────────────────────────
  function act(a, targetType = "boss", targetIdx = 0) {
    if (st.turn !== "player" || st.over || qte || interlude) return;
    const s = structuredClone(st);
    const p = s.player;
    if (a.staminaCost && p.stamina < a.staminaCost) return;
    if (a.mpCost && p.mp < a.mpCost) return;
    p.stamina -= a.staminaCost || 0; p.mp -= a.mpCost || 0; p.stance = null;

    if (a.id === "guard") { p.stance = "guard"; p.stamina = Math.min(p.maxStamina, p.stamina + 8); log(s, "You brace against the light."); SFX.guard(); }
    else if (a.id === "evade") { p.stance = "evade"; log(s, "You keep moving, watching its hands."); }
    else if (a.id === "focus") { p.stamina = Math.min(p.maxStamina, p.stamina + 22); p.mp = Math.min(p.maxMp, p.mp + 4); log(s, "You steady your breathing.", "heal"); }
    else {
      a.isSpell ? SFX.spell() : SFX.attack();
      const raw = irnd(a.dmg?.[0] ?? 6, a.dmg?.[1] ?? 12) + (a.isSpell ? Math.round(ctx.atk * 0.35) : ctx.atk);
      const hits = a.hits || 1;
      if (targetType === "mote" && s.motes[targetIdx]) {
        // Motes are fragile: any hit bursts one. The cost is the turn you spend on it.
        s.motes.splice(targetIdx, 1); s.pressure = Math.max(0, s.pressure - 16);
        log(s, "A mote bursts harmlessly. Pressure vents (-16).", "reward");
      } else if (targetType === "golem" && s.golems[targetIdx]) {
        const g = s.golems[targetIdx]; const d = Math.round(mitigate(raw * hits, 10)); g.hp = Math.max(0, g.hp - d);
        log(s, `${a.name} → stone golem (${d}).`, "dmg");
        if (g.hp <= 0) { s.golems.splice(targetIdx, 1); log(s, "The golem crumbles back into the earth.", "reward"); }
      } else {
        let mult = 1;
        if (form === "flicker" && !a.isSpell) mult = 0.5;
        if (form === "intangible") {
          if (a.isSpell) {
            const heal = Math.round(raw * 0.6);
            s.boss.hp = Math.min(s.boss.maxHp, s.boss.hp + heal); s.pressure = Math.min(100, s.pressure + 12);
            log(s, `It is intangible — your spell sinks into it. It ABSORBS it (+${heal} HP, +12 pressure).`, "lumen");
            mult = 0;
          } else { log(s, "Your attack passes straight through its intangible body.", "info"); mult = 0; }
        }
        if (s.golems.length && mult > 0) { mult *= 0.5; log(s, "The stone golems shield it — damage halved."); }
        if (mult > 0) {
          let total = 0;
          for (let h = 0; h < hits; h++) {
            const crit = Math.random() < (ctx.crit || 0.08);
            total += Math.max(1, Math.round(mitigate(raw * (crit ? 1.6 : 1), a.armorPierce || a.isSpell ? 0 : s.boss.def) * mult));
          }
          s.boss.hp = Math.max(0, s.boss.hp - total);
          log(s, `${a.name} → Lumenari: ${total}.`, a.isSpell ? "spell" : "dmg");
        }
      }
    }
    // Allies
    if (s.allies > 0) {
      const d = s.allies * irnd(6, 11) * (form === "intangible" ? 0 : form === "flicker" ? 0.5 : 1) * (s.golems.length ? 0.5 : 1);
      if (d > 0) { s.boss.hp = Math.max(0, s.boss.hp - Math.round(d)); log(s, `Your allies strike (${Math.round(d)}).`); }
    }
    if (p.hp <= 0) return finishLose(s);
    if (s.boss.hp <= 0) return breakPhase(s);
    s.turn = "boss";
    setSt(s);
    setTimeout(() => bossTurn(), 850);
  }

  function breakPhase(s) {
    const next = s.boss.phase + 1;
    if (next > 3) {
      s.turn = "collapse"; setSt(s);
      setInterlude({ title: "ITS CORE IS EXPOSED", text: "The light stutters. For one heartbeat, the core hangs naked in the air. STRIKE IT." });
      setTimeout(() => { setInterlude(null); setQte({ type: "strike", hits: 0, need: 3, pos: 0, dir: 1, zone: 0.22 }); }, 2400);
      SFX.lumen();
      return;
    }
    s.boss = mkPhase(next); s.rhythmIdx = 0; s.motes = []; s.golems = next === 3 ? [mkGolem(), mkGolem()] : [];
    s.pressure = Math.max(0, s.pressure - 20); s.overflowPending = false;
    s.intent = MOVESET[next][0]; s.turn = "player";
    log(s, `${PHASES[next].name}. ${PHASES[next].flavor}`, "lumen");
    setSt(s);
    SFX.lumen();
    setInterlude({ title: PHASES[next].name, text: PHASES[next].flavor });
    setTimeout(() => setInterlude(null), 2600);
  }
  const mkGolem = () => ({ id: Math.random(), hp: 120, maxHp: 120 });

  // ── Boss turn ─────────────────────────────────────────────────────────────
  function bossTurn() {
    const s = structuredClone(stRef.current);
    if (s.over) return;
    const key = s.overflowPending ? "overflow" : s.intent;
    const mv = MOVES[key];
    log(s, `Lumenari — ${mv.name}.`, "lumen");

    if (key === "overflow") {
      setSt(s);
      setQte({ type: "stabilize", seq: Array.from({ length: 4 + s.boss.phase - 1 }, () => ARROWS[irnd(0, 3)]), idx: 0, time: 100 });
      return;
    }
    if (key === "spears") {
      setSt(s);
      const waves = s.boss.phase >= 3 ? 3 : 2;
      setQte({ type: "lanes", wave: 1, waves, lane: 1, danger: rollLanes(), time: 100, hits: 0 });
      return;
    }
    if (mv.dmg) {
      const d = hurtPlayer(s, irnd(mv.dmg[0], mv.dmg[1]), { sweep: mv.sweep, heavy: mv.heavy, pierce: mv.pierce, name: mv.name });
      if (d) log(s, `${mv.name} hits you for ${d}.`, "dmg");
      if (mv.drainMp && d) s.player.mp = Math.max(0, s.player.mp - mv.drainMp);
      if (mv.stun && d) { s.player.stunned = true; log(s, "The ground throws you off your feet! (Stunned)", "dmg"); }
    }
    if (mv.motes) { for (let i = 0; i < mv.motes + (s.boss.phase - 1); i++) s.motes.push({ id: Math.random(), age: 0 }); }
    if (mv.golems) { while (s.golems.length < 2) s.golems.push(mkGolem()); log(s, "Two stone golems tear themselves free of the ground.", "lumen"); }
    endRound(s);
  }

  function endRound(s) {
    // Golems pound
    if (s.golems.length) {
      const d = hurtPlayer(s, s.golems.length * irnd(12, 18), { name: "the golems" });
      if (d) log(s, `Golems: ${d}.`, "dmg");
    }
    // Allies may be consumed by stray mana
    if (s.allies > 0 && Math.random() < 0.15 * s.boss.phase) { s.allies -= 1; log(s, "An ally is caught in leaking light and does not get up.", "sys"); }
    // Motes reabsorb
    s.motes.forEach(m => m.age++);
    const reabsorbed = s.motes.filter(m => m.age >= 3);
    if (reabsorbed.length) {
      s.motes = s.motes.filter(m => m.age < 3);
      s.pressure = Math.min(100, s.pressure + 14 * reabsorbed.length);
      s.boss.hp = Math.min(s.boss.maxHp, s.boss.hp + 15 * reabsorbed.length);
      log(s, `It reabsorbs ${reabsorbed.length} mote(s). Pressure rises.`, "lumen");
    }
    // Pressure
    if (s.overflowPending) { s.overflowPending = false; }
    else {
      s.pressure = Math.min(100, s.pressure + PHASES[s.boss.phase].pressure);
      if (s.pressure >= 100) { s.overflowPending = true; log(s, "⚠ Its cracks blaze white. Mana pressure is at its limit — OVERFLOW next turn!", "lumen"); }
    }
    s.rhythmIdx += 1;
    const set = MOVESET[s.boss.phase];
    s.intent = set[irnd(0, set.length - 1)];
    s.player.stamina = Math.min(s.player.maxStamina, s.player.stamina + 5);
    s.player.stance = null;
    s.round += 1;
    if (s.player.hp <= 0) return finishLose(s);
    if (s.player.stunned) {
      s.player.stunned = false; s.turn = "boss"; log(s, "You are stunned and lose your turn!", "dmg");
      setSt(s); setTimeout(() => bossTurn(), 1100); return;
    }
    s.turn = "player";
    setSt(s);
  }

  function finishLose(s) { s.over = "lose"; s.turn = "over"; setSt(s); SFX.defeat(); onLose?.(s.player); }

  const rollLanes = () => { const safe = irnd(0, 2); return [0, 1, 2].map(i => i !== safe); };

  // ── QTE engine ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!qte) return;
    if (qte.type === "strike") {
      const t = setInterval(() => setQte(q => {
        if (!q) return q;
        let pos = q.pos + q.dir * (0.022 + q.hits * 0.008); let dir = q.dir;
        if (pos >= 1) { pos = 1; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; }
        return { ...q, pos, dir };
      }), 16);
      return () => clearInterval(t);
    }
    const speed = qte.type === "lanes" ? 3.4 : 2.6;
    const t = setInterval(() => setQte(q => q ? { ...q, time: q.time - speed } : q), 60);
    return () => clearInterval(t);
  }, [qte?.type, qte?.wave]);

  useEffect(() => { if (qte && qte.time !== undefined && qte.time <= 0) resolveQteTimeout(); }, [qte?.time]);

  function resolveQteTimeout() {
    if (qte.type === "lanes") {
      const s = structuredClone(stRef.current);
      let hits = qte.hits;
      if (qte.danger[qte.lane]) {
        const d = hurtPlayer(s, irnd(28, 38), { sweep: true, name: "the spears" });
        log(s, `Spears of light pierce your lane (${d}).`, "dmg"); hits++;
      } else { log(s, "You slip between the falling spears.", "heal"); SFX.spell(); }
      setSt(s);
      if (s.player.hp <= 0) { setQte(null); return finishLose(s); }
      if (qte.wave < qte.waves) setQte({ ...qte, wave: qte.wave + 1, danger: rollLanes(), time: 100, hits });
      else { setQte(null); setTimeout(() => endRound(structuredClone(stRef.current)), 300); }
    } else if (qte.type === "stabilize") finishOverflow(false);
  }

  function finishOverflow(success) {
    const s = structuredClone(stRef.current);
    const mv = MOVES.overflow;
    const raw = irnd(mv.dmg[0], mv.dmg[1]) * (success ? 0.5 : 1);
    const d = hurtPlayer(s, raw, { sweep: true, name: "the Overflow" });
    log(s, success ? `You ride out the Overflow, your own mana steadied (${d}).` : `The Overflow tears through everything (${d}).`, "dmg");
    const burn = Math.round(s.boss.maxHp * 0.1);
    s.boss.hp = Math.max(1, s.boss.hp - burn);
    log(s, `Its core burns itself to release that much (-${burn}). It is dying as it fights.`, "reward");
    if (s.allies > 0) { const lost = Math.min(s.allies, success ? 1 : 2); s.allies -= lost; log(s, `${lost} ally(s) vanish in the light.`, "sys"); }
    s.pressure = 20; s.overflowPending = false; s.motes = [];
    setQte(null);
    SFX.lumen();
    if (s.player.hp <= 0) return finishLose(s);
    endRound(s);
  }

  function qteKey(dir) {
    if (!qte) return;
    if (qte.type === "lanes") {
      if (dir === "←") setQte(q => ({ ...q, lane: Math.max(0, q.lane - 1) }));
      if (dir === "→") setQte(q => ({ ...q, lane: Math.min(2, q.lane + 1) }));
      if (dir === "↓" || dir === "↑") setQte(q => ({ ...q, time: Math.min(q.time, 1) })); // commit early
      SFX.click();
    } else if (qte.type === "stabilize") {
      if (dir === qte.seq[qte.idx]) {
        SFX.click();
        if (qte.idx + 1 >= qte.seq.length) finishOverflow(true); else setQte(q => ({ ...q, idx: q.idx + 1, time: Math.min(100, q.time + 18) }));
      } else finishOverflow(false);
    }
  }

  function strikeCore() {
    if (!qte || qte.type !== "strike") return;
    const center = 0.5; const hit = Math.abs(qte.pos - center) <= qte.zone / 2;
    const s = structuredClone(stRef.current);
    if (hit) {
      SFX.attack(); SFX.spell();
      const hits = qte.hits + 1;
      log(s, ["Your strike lands. A crack runs across the core.", "Another strike. The light screams without sound.", "The core shatters."][hits - 1] || "Strike!", "reward");
      setSt(s);
      if (hits >= qte.need) {
        setQte(null); s.over = "win"; s.turn = "over"; setSt(s); SFX.victory();
        setTimeout(() => onWin?.(s.player, s.allies), 900);
      } else setQte({ ...qte, hits, zone: qte.zone * 0.8 });
    } else {
      const d = hurtPlayer(s, irnd(18, 26), { sweep: true, name: "a backlash of light" });
      log(s, `You miss — raw mana lashes out (${d}).`, "dmg"); setSt(s);
      if (s.player.hp <= 0) { setQte(null); finishLose(s); }
    }
  }

  useEffect(() => {
    const h = (e) => {
      if (qte?.type === "strike" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); strikeCore(); return; }
      const dir = KEYMAP[e.key];
      if (qte && dir) { e.preventDefault(); qteKey(dir); return; }
      if (!qte && st.turn === "player") { const n = parseInt(e.key, 10); if (n >= 1 && n <= actions.length) act(actions[n - 1]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const drink = (pt) => {
    if (st.turn !== "player" || qte) return;
    onConsumePotion?.(pt.id);
    setSt(s => { const n = structuredClone(s); const k = pt.stat === "hp" ? "maxHp" : pt.stat === "mp" ? "maxMp" : "maxStamina"; n.player[pt.stat] = Math.min(n.player[k], n.player[pt.stat] + pt.val); log(n, `You drink ${pt.name}.`, "heal"); return n; });
  };

  const p = st.player;
  const canAct = st.turn === "player" && !st.over && !qte && !interlude;
  const intent = st.overflowPending ? MOVES.overflow : MOVES[st.intent];
  const LOGC = { info: "rgba(200,192,248,0.6)", dmg: "#e85c3a", heal: "#3ec995", sys: "#ddd", reward: "#e0a523", spell: "#a89df0", lumen: "#ffd966" };

  return <div className={`lumen-root phase-${st.boss.phase} ${shake ? "hit-shake" : ""}`}>
    <div className="lumen-sky" />
    {st.boss.phase >= 2 && <div className="lumen-rain">{Array.from({ length: 16 }).map((_, i) => <span key={i} style={{ left: `${3 + i * 6}%`, animationDelay: `${(i * 0.37) % 2}s` }} />)}</div>}

    {/* Boss header */}
    <div className="lumen-header">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
        <div>
          <span className="gradient-text" style={{ fontWeight: 900, fontSize: 28, letterSpacing: "-0.02em" }}>LUMENARI</span>
          <span style={{ marginLeft: 12, fontSize: 11, color: P.color, fontWeight: 800, letterSpacing: "0.15em" }}>{P.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {st.allies > 0 && <Tag color="#3ec995">Allies {st.allies}</Tag>}
          <span style={{ fontSize: 12, color: "rgba(255,217,102,0.75)", fontWeight: 700 }}>{st.boss.hp}/{st.boss.maxHp}</span>
        </div>
      </div>
      <Bar val={st.boss.hp} max={st.boss.maxHp} color={P.color} h={14} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, marginTop: 10, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: st.pressure >= 80 ? "#ff6b4a" : "rgba(255,255,255,0.5)", marginBottom: 3 }}>
            <span>MANA PRESSURE</span><span>{st.pressure}/100</span>
          </div>
          <div className={`pressure-bar ${st.pressure >= 80 ? "critical" : ""}`}><div style={{ width: `${st.pressure}%` }} /></div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }} title="Form rhythm — upcoming forms">
          {upcoming.map((f, k) => <span key={k} className={`form-pip ${k === 0 ? "now" : ""}`} style={{ borderColor: FORM_INFO[f].color, color: FORM_INFO[f].color }}>{k === 0 ? FORM_INFO[f].label : FORM_INFO[f].label[0]}</span>)}
        </div>
      </div>
    </div>

    <div className="lumen-body">
      <div className="lumen-stage">
        {/* The entity */}
        <div className={`lumen-entity form-${form}`} onClick={() => canAct && null}>
          <div className="lumen-core" />
          <div className="lumen-figure" />
        </div>
        <p style={{ fontSize: 12, color: FORM_INFO[form].color, fontWeight: 800, letterSpacing: ".1em", margin: "4px 0" }}>{FORM_INFO[form].label.toUpperCase()} — <span style={{ fontWeight: 500, letterSpacing: 0 }}>{FORM_INFO[form].desc}</span></p>

        {/* Intent */}
        {!st.over && st.turn !== "collapse" && <div className="intent-box" style={{ borderColor: st.overflowPending ? "#ff6b4a" : "#ffd96666", background: st.overflowPending ? "rgba(255,80,40,0.15)" : "rgba(255,217,102,0.06)", maxWidth: 520, width: "100%" }}>
          <b style={{ color: st.overflowPending ? "#ff6b4a" : "#ffd966", fontSize: 12 }}>NEXT: {intent?.name}</b>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,240,220,0.8)", fontStyle: "italic" }}>{intent?.tell}</p>
        </div>}

        {/* Motes & golems */}
        {(st.motes.length > 0 || st.golems.length > 0) && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 560 }}>
          {st.motes.map((m, i) => <button key={m.id} className="mote" disabled={!canAct} onClick={() => act(actions[0], "mote", i)} title="Destroy with your basic attack to vent pressure">
            ✦ Mote <small>reabsorbed in {3 - m.age}</small></button>)}
          {st.golems.map((g, i) => <button key={g.id} className="golem" disabled={!canAct} onClick={() => act(actions[0], "golem", i)}>
            ⛰ Golem <small>{g.hp}/{g.maxHp}</small></button>)}
        </div>}

        {/* QTEs */}
        {qte?.type === "lanes" && <div className="qte-panel">
          <p className="qte-title">⚡ SPEARS — WAVE {qte.wave}/{qte.waves} ⚡</p>
          <p style={{ fontSize: 12, color: "rgba(255,217,102,0.75)", margin: "0 0 10px" }}>Move to the lane with no shadow. ← → or click. ↓ to commit.</p>
          <div className="lanes">
            {[0, 1, 2].map(l => <div key={l} className={`lane ${qte.danger[l] ? "danger" : "safe"} ${qte.lane === l ? "here" : ""}`} onClick={() => setQte(q => ({ ...q, lane: l }))}>
              {qte.danger[l] && <div className="spear-shadow" style={{ opacity: 1 - qte.time / 140 }} />}
              {qte.lane === l && <div className="you-marker">YOU</div>}
            </div>)}
          </div>
          <Bar val={qte.time} max={100} color={qte.time > 40 ? "#ffd966" : "#e85c3a"} h={6} />
        </div>}
        {qte?.type === "stabilize" && <div className="qte-panel" style={{ borderColor: "#ff6b4a" }}>
          <p className="qte-title" style={{ color: "#ff6b4a" }}>OVERFLOW — STABILIZE YOUR CORE</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "10px 0 14px" }}>
            {qte.seq.map((d, i) => <span key={i} className={`qte-key ${i < qte.idx ? "done" : i === qte.idx ? "cur" : ""}`}>{d}</span>)}
          </div>
          <Bar val={qte.time} max={100} color={qte.time > 40 ? "#ffd966" : "#e85c3a"} h={6} />
          <div className="arrow-pad">{["↑", "←", "↓", "→"].map(d => <button key={d} onClick={() => qteKey(d)} style={{ gridArea: { "↑": "u", "←": "l", "↓": "d", "→": "r" }[d] }}>{d}</button>)}</div>
        </div>}
        {qte?.type === "strike" && <div className="qte-panel" style={{ borderColor: "#fff" }} onClick={strikeCore}>
          <p className="qte-title">STRIKE THE CORE — {qte.hits}/{qte.need}</p>
          <div className="strike-track">
            <div className="strike-zone" style={{ left: `${(0.5 - qte.zone / 2) * 100}%`, width: `${qte.zone * 100}%` }} />
            <div className="strike-needle" style={{ left: `${qte.pos * 100}%` }} />
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "10px 0 0" }}>Press SPACE or click when the needle is in the gold.</p>
        </div>}

        {/* Actions */}
        {canAct && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, width: "100%", maxWidth: 640 }}>
          {actions.map((a, k) => {
            const dis = (a.staminaCost && p.stamina < a.staminaCost) || (a.mpCost && p.mp < a.mpCost);
            const warn = form === "intangible" && a.isSpell;
            return <button key={a.id} disabled={dis} onClick={() => act(a)} className="action-card" style={{ textAlign: "center", padding: "10px 8px", borderColor: warn ? "#e85c3a" : a.isSpell ? "rgba(168,157,240,0.5)" : "rgba(255,217,102,0.35)" }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: a.isSpell ? "#a89df0" : "#ffd966", margin: "0 0 4px" }}>{k + 1}. {a.name}</p>
              <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                {a.mpCost > 0 && <Tag color="#a89df0">{a.mpCost} MP</Tag>}{a.staminaCost > 0 && <Tag color="#3ec995">{a.staminaCost} STA</Tag>}
                {warn && <Tag color="#e85c3a">Absorbed!</Tag>}
              </div>
            </button>;
          })}
        </div>}
        {!canAct && !st.over && !qte && <p style={{ fontSize: 11, color: "rgba(232,92,58,0.6)", letterSpacing: ".12em", fontWeight: 800 }}>{interlude ? "" : "THE LUMENARI ACTS…"}</p>}
      </div>

      {/* Side panel */}
      <div className="lumen-side">
        <p className="section-label">You</p>
        {[{ l: "HP", v: p.hp, m: p.maxHp, c: "#e85c3a" }, ...(p.maxMp > 0 ? [{ l: "MP", v: p.mp, m: p.maxMp, c: "#a89df0" }] : []), { l: "STA", v: p.stamina, m: p.maxStamina, c: "#3ec995" }].map(b => <div key={b.l} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: b.c, fontWeight: 800 }}>{b.l}</span><span style={{ color: "rgba(255,255,255,0.5)" }}>{b.v}/{b.m}</span></div>
          <Bar val={b.v} max={b.m} color={b.c} h={7} />
        </div>)}
        {p.stance && <Tag color="#3ec995">{p.stance}</Tag>}
        <p className="section-label" style={{ marginTop: 14 }}>Potions</p>
        {potions.length === 0 ? <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>None</p> : <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{potions.map(pt => <button key={pt.id} className="item-chip" disabled={!canAct} onClick={() => drink(pt)}>{pt.name} ×{pt.count}</button>)}</div>}
        <p className="section-label" style={{ marginTop: 14 }}>Log</p>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", fontSize: 11, lineHeight: 1.6, minHeight: 120 }}>{st.log.map(l => <div key={l.id} style={{ color: LOGC[l.type] || "#ccc", marginBottom: 3 }}>{l.msg}</div>)}</div>
      </div>
    </div>

    {interlude && <div className="lumen-interlude"><h2>{interlude.title}</h2><p>{interlude.text}</p></div>}
  </div>;
}
