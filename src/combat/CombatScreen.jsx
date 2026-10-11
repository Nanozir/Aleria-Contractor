// CombatScreen.jsx — Shared turn-based battle UI built on engine.js.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Tag, StarRating } from "../UIComponents";
import { SFX } from "../AudioEngine";
import { STATUS_INFO } from "./monsters";
import { createBattle, doPlayerAction, doEnemyPhase, doSkipTurn, useItemInBattle, intentBadge, alive } from "./engine";

const LOG_COLORS = { info: "rgba(200,192,248,0.6)", dmg: "#e85c3a", heal: "#3ec995", sys: "rgba(230,225,255,0.9)", reward: "#e0a523", spell: "#a89df0", lumen: "#ffd966" };

function StatusChips({ statuses }) {
  const keys = Object.keys(statuses || {}).filter(k => STATUS_INFO[k]);
  if (!keys.length) return null;
  return <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
    {keys.map(k => <span key={k} title={STATUS_INFO[k].desc} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, border: `1px solid ${STATUS_INFO[k].color}66`, color: STATUS_INFO[k].color, background: `${STATUS_INFO[k].color}14`, fontWeight: 700 }}>{STATUS_INFO[k].icon} {STATUS_INFO[k].label}{statuses[k] > 1 ? ` ${statuses[k]}` : ""}</span>)}
  </div>;
}

function FloatFx({ fx, target }) {
  const items = fx.filter(f => f.target === target).slice(-4);
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
    {items.map((f, i) => <span key={f.id} className="float-fx" style={{ left: `${30 + i * 12}%`, color: f.color }}>{f.text}</span>)}
  </div>;
}

export default function CombatScreen({
  initialEnemies, player, ctx, actions, potions = [], onConsumePotion, allies = 0, coreless = false,
  title = "COMBAT", subtitle, onEnd, onFlee, canFlee = true, resultContent, background, warning,
}) {
  const [battle, setBattle] = useState(() => createBattle({ enemies: initialEnemies, player, allies, coreless }));
  const [target, setTarget] = useState(null);
  const [shake, setShake] = useState({});
  const prevHp = useRef({});
  const logRef = useRef(null);
  const ended = useRef(false);

  const live = alive(battle);
  const tgt = live.find(e => e.uid === target) || live[0];
  const busy = battle.phase === "enemy" || battle.phase === "stunned" || !!battle.over;

  // Enemy phase sequencing
  useEffect(() => {
    if (battle.over) return;
    if (battle.phase === "enemy") {
      const t = setTimeout(() => setBattle(b => doEnemyPhase(b, ctx)), 750);
      return () => clearTimeout(t);
    }
    if (battle.phase === "stunned") {
      const t = setTimeout(() => setBattle(b => doSkipTurn(b, ctx)), 1100);
      return () => clearTimeout(t);
    }
  }, [battle.phase, battle.round, battle.over]);

  // Hit feedback: shake whoever lost HP, play sounds
  useEffect(() => {
    const next = {};
    const changed = {};
    battle.enemies.forEach(e => { next[e.uid] = e.hp; if (prevHp.current[e.uid] !== undefined && e.hp < prevHp.current[e.uid]) changed[e.uid] = true; });
    next.player = battle.player.hp;
    if (prevHp.current.player !== undefined && battle.player.hp < prevHp.current.player) { changed.player = true; SFX.hit(); }
    prevHp.current = next;
    if (Object.keys(changed).length) { setShake(changed); const t = setTimeout(() => setShake({}), 380); return () => clearTimeout(t); }
  }, [battle]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [battle.log]);

  useEffect(() => {
    if (!battle.over || ended.current) return;
    ended.current = true;
    if (battle.over === "win") SFX.reward(); else SFX.defeat();
    onEnd?.(battle.over, battle);
  }, [battle.over]);

  const act = (a) => {
    if (busy) return;
    if (a.staminaCost && battle.player.stamina < a.staminaCost) { SFX.warn?.(); return; }
    if (a.mpCost && battle.player.mp < a.mpCost) { SFX.warn?.(); return; }
    if (a.furyCost && (battle.player.fury || 0) < a.furyCost) { SFX.warn?.(); return; }
    a.isSpell ? SFX.spell() : a.id === "guard" ? SFX.guard() : SFX.attack();
    setBattle(b => doPlayerAction(b, a, tgt?.uid, ctx));
  };

  const drink = (p) => {
    if (busy) return;
    onConsumePotion?.(p.id);
    setBattle(b => useItemInBattle(b, p));
  };

  // Keyboard: 1-9 for actions, Tab cycles targets
  useEffect(() => {
    const h = (e) => {
      if (busy) return;
      if (e.key === "Tab") { e.preventDefault(); const i = live.findIndex(x => x.uid === tgt?.uid); setTarget(live[(i + 1) % live.length]?.uid); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= actions.length) act(actions[n - 1]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const p = battle.player;
  const highStar = Math.max(0, ...battle.enemies.map(e => e.star || 1));
  const groups = useMemo(() => ({
    attack: actions.filter(a => !a.isSpell && !a.furyCost && !["guard", "evade", "focus"].includes(a.id)),
    fury: actions.filter(a => a.furyCost),
    spell: actions.filter(a => a.isSpell),
    tactic: actions.filter(a => ["guard", "evade", "focus"].includes(a.id)),
  }), [actions]);

  const renderAction = (a) => {
    const idx = actions.indexOf(a) + 1;
    const noRes = (a.staminaCost && p.stamina < a.staminaCost) || (a.mpCost && p.mp < a.mpCost) || (a.furyCost && (p.fury || 0) < a.furyCost);
    const col = a.furyCost ? "#ff4d4d" : a.isSpell ? "#a89df0" : a.id === "guard" ? "#3ec995" : a.id === "evade" ? "#ff6bcb" : a.id === "focus" ? "#87cefa" : (a.staminaCost || 0) >= 20 ? "#e85c3a" : "#d4cbf8";
    return <button key={a.id} data-testid={`combat-action-${a.id}`} disabled={busy || noRes} onClick={() => act(a)} className="action-card" style={{ borderColor: `${col}55`, padding: "12px 14px", minHeight: 84, textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: col }}>{a.name}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{idx <= 9 ? idx : ""}</span>
      </div>
      <p style={{ fontSize: 11, color: "rgba(200,192,248,0.55)", lineHeight: 1.45, margin: "0 0 8px" }}>{a.desc}</p>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {a.dmg && a.dmg[1] > 0 && <Tag color="#d4cbf8">{a.dmg[0]}–{a.dmg[1]}</Tag>}
        {a.mpCost > 0 && <Tag color="#a89df0">{a.mpCost} MP</Tag>}
        {a.furyCost > 0 && <Tag color="#ff4d4d">{a.furyCost} FURY</Tag>}
        {a.staminaCost > 0 && <Tag color="#3ec995">{a.staminaCost} STA</Tag>}
        {a.aoe && <Tag color="#ff8c00">All</Tag>}
        {a.hits > 1 && <Tag color="#a8740c">×{a.hits}</Tag>}
        {a.effect && <Tag color="#ffd966">{a.effect}</Tag>}
        {a.armorPierce && <Tag color="#ff6bcb">Pierce</Tag>}
      </div>
    </button>;
  };

  return <div style={{ minHeight: "100vh", background: background || (highStar >= 4 ? "radial-gradient(ellipse at top,#2a0a18 0%,#0d0510 70%)" : "radial-gradient(ellipse at top,#1c0c20 0%,#0a0610 70%)"), fontFamily: "var(--font-sans)" }}>
    {warning}
    <div className="combat-topbar">
      <span style={{ fontWeight: 900, fontSize: 13, color: "#e85c3a", letterSpacing: "0.12em" }}>{title}</span>
      {subtitle && <span style={{ fontSize: 12, color: "rgba(255,200,180,0.6)" }}>{subtitle}</span>}
      <StarRating stars={highStar} />
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Round {battle.round}</span>
      {battle.allies > 0 && <Tag color="#3ec995">Allies {battle.allies}</Tag>}
      {canFlee && !battle.over && <button data-testid="combat-flee-btn" className="al-btn flee-btn" onClick={onFlee} disabled={busy} style={{ marginLeft: "auto" }}>↩ Flee <span style={{ fontSize: 10, opacity: 0.7 }}>(-5% B)</span></button>}
    </div>

    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      {/* ENEMIES */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(220px,1fr))`, gap: 12, marginBottom: 14 }}>
        {battle.enemies.map(e => {
          const dead = e.hp <= 0; const sel = tgt?.uid === e.uid && !dead;
          const badge = intentBadge(e.intent);
          const stunned = e.statuses.stun || e.statuses.staggered;
          return <div key={e.uid} onClick={() => !dead && setTarget(e.uid)} className={`enemy-card ${shake[e.uid] ? "hit-shake" : ""} ${sel ? "selected" : ""}`} style={{ opacity: dead ? 0.3 : 1, cursor: dead ? "default" : "pointer", position: "relative", filter: e.intent?.airborne ? "drop-shadow(0 0 8px #87cefa)" : undefined }}>
            <FloatFx fx={battle.fx} target={e.uid} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}><StarRating stars={e.star || 1} /><span style={{ fontWeight: 800, fontSize: 13, color: "#ffd0c0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span></div>
              {sel && <span style={{ fontSize: 10, color: "#ffd966", fontWeight: 800 }}>TARGET</span>}
            </div>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", lineHeight: 1.4 }}>{e.desc}</p>
            <Bar val={e.hp} max={e.maxHp} color={e.hp / e.maxHp > 0.5 ? "#e0a523" : "#e85c3a"} h={7} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.45)", margin: "3px 0" }}><span>{e.hp}/{e.maxHp}</span><span title="Poise — heavy attacks break it">Poise {e.poise}/{e.maxPoise}</span></div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${(e.poise / e.maxPoise) * 100}%`, height: "100%", background: "#ffd966", transition: "width .3s" }} /></div>
            <StatusChips statuses={e.statuses} />
            {!dead && <div className="intent-box" style={{ borderColor: `${badge.color}66`, background: `${badge.color}12` }}>
              {stunned ? <span style={{ color: "#ffd966", fontWeight: 800, fontSize: 11 }}>✷ Can't act this turn</span> : <>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 15, color: badge.color }}>{badge.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 11, color: badge.color, letterSpacing: "0.04em" }}>{e.intent?.name} · {badge.label}</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,240,220,0.75)", fontStyle: "italic", lineHeight: 1.4 }}>{e.intent?.tell}</p>
              </>}
            </div>}
          </div>;
        })}
      </div>

      {/* PLAYER + LOG */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px,320px) 1fr", gap: 12, marginBottom: 14 }} className="combat-mid">
        <div className={`player-card ${shake.player ? "hit-shake" : ""}`} style={{ position: "relative" }}>
          <FloatFx fx={battle.fx} target="player" />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "rgba(200,192,248,0.5)", letterSpacing: "0.12em", fontWeight: 800 }}>YOU</span>
            {p.stance && <Tag color={p.stance === "guard" ? "#3ec995" : "#ff6bcb"} glow>{p.stance === "guard" ? "Guarding" : "Evading"}</Tag>}
          </div>
          {[{ l: "HP", v: p.hp, m: p.maxHp, c: "#e85c3a" }, ...(p.maxMp > 0 ? [{ l: "MP", v: p.mp, m: p.maxMp, c: "#a89df0" }] : []), { l: "STA", v: p.stamina, m: p.maxStamina, c: "#3ec995" }, ...(p.maxFury ? [{ l: "FURY", v: p.fury || 0, m: p.maxFury, c: "#ff4d4d" }] : [])].map(b => <div key={b.l} style={{ marginBottom: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: b.c, fontWeight: 800 }}>{b.l}</span><span style={{ color: "rgba(255,255,255,0.55)" }}>{Math.round(b.v)}/{b.m}</span></div>
            <Bar val={b.v} max={b.m} color={b.c} h={7} />
          </div>)}
          <StatusChips statuses={p.statuses} />
        </div>
        <div ref={logRef} className="combat-log">
          {battle.log.map(l => <div key={l.id} style={{ color: LOG_COLORS[l.type] || "#ccc" }}>{l.msg}</div>)}
        </div>
      </div>

      {battle.over ? <div className="result-panel">{resultContent}</div> : <>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span><b style={{ color: "#ff6bcb" }}>➶ Unblockable</b> → Evade</span>
          <span><b style={{ color: "#ff8c00" }}>≋ Sweep</b> → Guard</span>
          <span><b style={{ color: "#ffd966" }}>◎ Winding up</b> → prepare or stagger it</span>
          <span>Keys 1–9 act · Tab switches target</span>
        </div>
        {busy ? <p style={{ fontSize: 12, color: "rgba(255,200,180,0.5)", letterSpacing: "0.1em", fontWeight: 700, padding: "18px 0" }}>{battle.phase === "stunned" ? "YOU ARE STUNNED…" : "ENEMIES ACTING…"}</p> : <>
          {[["Attacks", groups.attack], ["Fury", groups.fury], ["Spells", groups.spell], ["Tactics", groups.tactic]].map(([label, list]) => list.length > 0 && <div key={label} style={{ marginBottom: 10 }}>
            <p className="section-label">{label}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>{list.map(renderAction)}</div>
          </div>)}
          {potions.length > 0 && <div>
            <p className="section-label">Items</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{potions.map(pt => <button key={pt.id} className="item-chip" onClick={() => drink(pt)}>{pt.name} ×{pt.count}</button>)}</div>
          </div>}
        </>}
      </>}
    </div>
  </div>;
}
