// TenebrimScenario.jsx — "Unbound": the Tenebrim campaign.
// Two origins (slave in Elysandria / Emberhide tribe in Menfor) converge on Menfor, where the
// Syndicate's slave fort Chainhold must be broken before its grip closes on every clan.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Btn, Panel, Tag, Confetti } from "./UIComponents";
import { SFX } from "./AudioEngine";
import { TACTICS } from "./GameData";
import CombatScreen from "./combat/CombatScreen";
import Cinematic from "./cinematic/Cinematic";
import { makeEnemy } from "./combat/engine";
import { HERITAGE, REGIONS, CLANS, ROLES, WOUNDS, TECHNIQUES, WEAPONS, CAMP_BUILDINGS, TEN_ACTIONS, FINALE_ENDINGS } from "./tenebrim/data";
import { EVENTS, BONDAGE_TASKS, BONDAGE_NIGHT } from "./tenebrim/events";
import {
  newGame, log, toast, clamp, pick, irnd, SEGS, META_UPGRADES, hasTech, heritageOf, weaponOf, regionOf, alliedClans,
  combatCtx, battlePlayer, buildEnemies, applyCombatResult, afterCombat, advance, checkDeath,
  forage, hunt, drawWater, rest, tend, riskyMeal, scout, travel, raidCaravan, foundCamp, build, craftWeapon, searchRuins, addFollower,
} from "./tenebrim/logic";

const SAVE_KEY = "aleria_tenebrim_save";
const META_KEY = "aleria_tenebrim_meta";

const CINEMATICS = {
  slave: [
    { text: "You were sold before you understood the word.", bg: "radial-gradient(ellipse at 50% 70%, #2a1410 0%, #070303 70%)", fx: ["ash"], color: "#e8c0b0", duration: 5200 },
    { text: "The sigil on your wrist is a slave pact. It is anchored to your soul.", sub: "Other races have a core to buffer a binding. Tenebrim have nothing. When the master says move, your body moves.", bg: "radial-gradient(circle at 50% 45%, #5a1010 0%, #0c0303 65%)", fx: ["pulse", "vignette-red"], color: "#ff8a7a", duration: 7000 },
    { text: "The Lower Estate, Elysandria. The labor never ends.", sub: "But you are watching. You are always watching.", bg: "radial-gradient(ellipse at 50% 30%, #2a2018 0%, #080605 70%)", fx: ["fog"], color: "#e0d0b8", duration: 5600 },
  ],
  tribe: [
    { text: "Menfor does not forgive. That is why the clans teach early.", bg: "radial-gradient(ellipse at 50% 90%, #6a2a0a 0%, #120604 70%)", fx: ["embers"], color: "#ffc89a", duration: 5200 },
    { text: "By ten, a Tenebrim child can hunt, fight, farm and survive alone.", sub: "If something happens to the adults, the child should be able to continue.", bg: "radial-gradient(ellipse at 50% 80%, #4a2010 0%, #0a0403 70%)", fx: ["embers"], color: "#ffd8b0", duration: 6200 },
    { text: "You are Emberhide. Today, the elders read your markings.", bg: "radial-gradient(circle at 50% 50%, #7a3010 0%, #100503 65%)", fx: ["embers", "pulse"], color: "#ff9a5a", duration: 5000 },
  ],
  raid: [
    { text: "Smoke.", bg: "radial-gradient(ellipse at 50% 80%, #3a1008 0%, #050202 70%)", fx: ["embers", "vignette-red"], color: "#ff8a6a", duration: 3000, sfx: () => SFX.roar() },
    { text: "Chains that glow with sigils. Men who know exactly what they are doing.", sub: "One touch of a pact-chain and a coreless body stops obeying.", bg: "radial-gradient(ellipse at 50% 60%, #5a1a10 0%, #080302 70%)", fx: ["embers", "shake"], color: "#ffb0a0", duration: 5600 },
    { text: "The Syndicate has come to the Emberhide.", bg: "radial-gradient(circle, #6a1a0a 0%, #000 70%)", fx: ["flash", "shake", "vignette-red"], color: "#ff6b4a", duration: 3600 },
  ],
  crossing: [
    { text: "Nine days in the dark of an ore barge's hold.", bg: "radial-gradient(ellipse at 50% 50%, #0a1418 0%, #020405 70%)", fx: ["rain"], color: "#b8d0e0", duration: 4600 },
    { text: "Then: black cliffs, white salt, and air that tastes of sulfur.", sub: "Menfor. You've never seen it. It smells like home anyway.", bg: "radial-gradient(ellipse at 50% 90%, #4a3020 0%, #0a0604 70%)", fx: ["ash"], color: "#f0d8c0", duration: 6000 },
    { text: "You are free. Nobody here knows you. Some will call you a returned slave; some will call you Mourak.", sub: "Chainhold, the Syndicate's fort, squats on this same coast. You are not done with them.", bg: "radial-gradient(ellipse at 50% 70%, #2a1810 0%, #050302 70%)", fx: ["embers"], color: "#ffd0a0", duration: 7000 },
  ],
};

const LOGC = { info: "rgba(255,240,220,0.62)", dmg: "#e85c3a", heal: "#3ec995", sys: "#f0e6d8", reward: "#ffd966", lumen: "#ffb347" };

function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (s && s.v === 2) return { ...s, toasts: [] }; } catch (e) {}
  return null;
}

export default function TenebrimScenario({ setScreen, notify, stats, setStats, diff, exportSave }) {
  const isMetaDisabled = diff?.id === "hard" || diff?.id === "insanity";
  const [meta, setMeta] = useState(() => { try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch (e) { return {}; } });
  const [g, setG] = useState(() => loadSave() || newGame());
  const [tab, setTab] = useState("region");
  const logRef = useRef(null);

  // Mutate a clone of the state with any logic function.
  const up = (fn, ...args) => setG(prev => {
    const n = structuredClone(prev);
    fn(n, ...args);
    checkDeath(n, n.dead?.reason || "Your body gave out.");
    return n;
  });

  // Persist + sync HP to the main game
  useEffect(() => {
    const { toasts, ...rest } = g;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(rest)); } catch (e) {}
    setStats?.(s => ({ ...s, hp: g.hp, maxHp: g.maxHp, mp: 0, maxMp: 0, stamina: g.stamina, maxStamina: g.maxStamina }));
  }, [g]);
  useEffect(() => {
    if (g.toasts?.length) { g.toasts.forEach(t => notify?.(t.msg, t.color)); setG(p => ({ ...p, toasts: [] })); }
  }, [g.toasts]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [g.log]);

  // Echoes on death / ending (meta progression on Easy/Normal only)
  const rewarded = useRef(false);
  useEffect(() => {
    if ((g.dead || g.ending) && !rewarded.current) {
      rewarded.current = true;
      if (!isMetaDisabled) {
        const gained = Math.max(1, Math.floor(g.legacy / 8) + (g.ending && g.ending !== "chaintide" ? 4 : 0));
        const next = { ...meta, echoes: (meta.echoes || 0) + gained };
        setMeta(next); localStorage.setItem(META_KEY, JSON.stringify(next));
      }
      localStorage.removeItem(SAVE_KEY);
      if (g.ending && g.ending !== "chaintide") SFX.victory(); else SFX.defeat();
    }
  }, [g.dead, g.ending]);

  function begin(origin) {
    SFX.menuSelect();
    const n = newGame();
    n.origin = origin;
    n.meta = isMetaDisabled ? {} : (meta.upgrades || {});
    if (n.meta.clanMemory) { n.food += 6; n.water += 4; }
    if (n.meta.hunterTradition) n.weapon = "bonespear";
    if (n.meta.survivalKnowledge) { n.herbs += 3; n.maxHp += 15; n.hp += 15; }
    if (origin === "slave") {
      n.act = "bondage"; n.cinematic = "slave";
      n.bondage = { day: 1, phase: "bloodline", strain: 0, suspicion: 10, info: 0, contacts: 0, stash: 0, ledger: false, ledgerKnown: false, caught: 0 };
      n.event = { id: "bloodline" };
    } else {
      n.act = "tribe"; n.cinematic = "tribe"; n.sibling = pick(["Kaela", "Varo", "Imre", "Tesh", "Morra"]);
      n.event = { id: "marking" };
    }
    log(n, origin === "slave" ? "The Lower Estate. Day one of the rest of your life." : "The Emberhide camp, Ashveil Basin.", "sys");
    rewarded.current = false;
    setG(n); setTab("region");
  }

  function buyMeta(u) {
    if (isMetaDisabled || meta.upgrades?.[u.id] || (meta.echoes || 0) < u.cost) return;
    const next = { echoes: (meta.echoes || 0) - u.cost, upgrades: { ...(meta.upgrades || {}), [u.id]: true } };
    setMeta(next); localStorage.setItem(META_KEY, JSON.stringify(next)); SFX.buy();
  }

  // ── Event resolution ────────────────────────────────────────────────────
  const ev = g.event && !g.cinematic && !g.combat ? EVENTS[g.event.id]?.(g, g.event.data || {}) : null;
  const choose = (choice) => {
    SFX.click();
    up((n) => { const data = n.event?.data; n.event = null; choice.run(n, data); });
  };

  // ── Bondage day/night ───────────────────────────────────────────────────
  const bondTask = (t) => up((n) => { t.run(n); n.bondage.phase = "night"; });
  const bondNight = (t) => up((n) => {
    t.run(n);
    const b = n.bondage;
    if (b.suspicion >= 100) {
      b.caught += 1; b.stash = 0; b.suspicion = 40; n.hp -= 30;
      log(n, `CAUGHT. They make an example of you in the yard (-30 HP, stash lost). (${b.caught}/3)`, "dmg");
      if (b.caught >= 3) { n.dead = { reason: "Sold to the deep mines as a lesson to the others. Nobody comes back from the mines." }; return; }
    }
    b.day += 1; b.phase = "task"; n.day += 1;
    n.stamina = Math.min(n.maxStamina, n.stamina + 45);
    n.hp = Math.min(n.maxHp, n.hp + 4);
    if (b.contacts >= 4 && !b.ledgerKnown) n.event = { id: "ledgertip" };
    else if (Math.random() < 0.35) n.event = { id: pick(["inspection", "sickslave", "guest"]) };
  });

  // ── Combat ──────────────────────────────────────────────────────────────
  if (g.cinematic) return <Cinematic shots={CINEMATICS[g.cinematic]} onDone={() => setG(p => ({ ...p, cinematic: null }))} />;

  if (g.combat) {
    const c = g.combat;
    const actions = [...TEN_ACTIONS, ...TACTICS];
    const enemies = buildEnemies(g, c, diff, makeEnemy);
    const resultContent = c.summary && <div>
      <h2 style={{ margin: "0 0 8px", color: c.result === "win" ? "#3ec995" : "#e85c3a" }}>{c.summary.title}</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{c.summary.lines.map((l, i) => <span key={i} className="pill" style={{ color: "#f0e0d0", borderColor: "rgba(255,255,255,0.2)" }}>{l}</span>)}</div>
      <Btn variant={c.result === "win" ? "success" : "danger"} onClick={() => up(afterCombat)}>{g.dead ? "…" : "Continue"}</Btn>
    </div>;
    return <CombatScreen key={c.key} initialEnemies={enemies} player={battlePlayer(g)} ctx={combatCtx(g, !["duel", "raid", "hunters", "escape", "gate", "varn", "tribechase"].includes(c.kind))}
      actions={actions} coreless allies={c.allies || 0} title={c.title || (c.kind === "hunt" ? "THE HUNT" : "COMBAT")}
      subtitle={c.ambush ? "Ambush — they're staggered!" : undefined} canFlee={["hunt", "quest"].includes(c.kind)}
      onFlee={() => up((n) => { n.combat = null; n.food = Math.max(0, n.food - 2); log(n, "You break off and run. You drop some food.", "dmg"); })}
      background="radial-gradient(ellipse at top,#3a1a0e 0%,#0e0605 70%)"
      onEnd={(result, battle) => up((n) => applyCombatResult(n, result, battle, diff))} resultContent={resultContent} />;
  }

  // ── Death / endings ─────────────────────────────────────────────────────
  if (g.dead || g.ending) {
    const E = g.ending ? FINALE_ENDINGS[g.ending] : null;
    const good = g.ending && g.ending !== "chaintide";
    const title = E ? E.title : g.legacy >= 40 ? "Remembered" : g.counters.kills >= 20 ? "Beast-Slayer" : g.flags.pactBroken ? "The One Who Broke the Chain" : "Enduring Wanderer";
    return <div className="ten-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {good && <Confetti />}
      <Panel style={{ maxWidth: 720, textAlign: "center", borderColor: good ? "#e0a523" : "#b83a2a", position: "relative", zIndex: 2 }}>
        <Tag color={good ? "#e0a523" : "#b83a2a"}>{E ? "Ending" : "Legacy"}</Tag>
        <h1 style={{ margin: "16px 0 10px", color: good ? "#ffd966" : "#fff", fontFamily: "Georgia, serif", fontWeight: 400, letterSpacing: "0.04em" }}>{title}</h1>
        <p style={{ color: "rgba(255,235,210,0.8)", lineHeight: 1.8, fontSize: 16 }}>{E ? E.text : g.dead.reason}</p>
        {g.ending === "founder" && g.sibling && g.flags.siblingFound && <p style={{ color: "#ffd966" }}>{g.sibling} carves the first mark on the new totem: yours.</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "16px 0" }}>
          <Tag color="#e0a523">Legacy {g.legacy}</Tag><Tag color="#e85c3a">Kills {g.counters.kills}</Tag><Tag color="#3ec995">Freed {g.counters.freed}</Tag><Tag color="#a89df0">Scars {g.scars}</Tag><Tag color="#ffd966">Days {g.day}</Tag>
        </div>
        {g.deeds.length > 0 && <div style={{ textAlign: "left", margin: "0 auto 16px", maxWidth: 480 }}>
          <p className="section-label">Deeds carved in stone</p>
          {g.deeds.map((d, i) => <p key={i} style={{ margin: "2px 0", fontSize: 13 }}>Day {d.day} — {d.text}</p>)}
        </div>}
        {!isMetaDisabled && <p style={{ fontSize: 12, color: "#e0a523" }}>Ancestral Echoes: {meta.echoes || 0}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="danger" onClick={() => { setG(newGame()); rewarded.current = false; }}>Begin another life</Btn>
          <Btn variant="ghost" onClick={() => setScreen("main_menu")}>Main menu</Btn>
        </div>
      </Panel>
    </div>;
  }

  // ── Origin select ───────────────────────────────────────────────────────
  if (g.act === "origin") {
    return <div className="ten-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 820, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <Tag color="#b83a2a">Tenebrim</Tag>
          <h1 style={{ fontSize: 44, margin: "14px 0 6px", fontFamily: "Georgia, serif", fontWeight: 400, color: "#fff" }}>Unbound</h1>
          <p style={{ maxWidth: 560, margin: "0 auto", color: "rgba(255,230,210,0.7)" }}>Coreless. No mana, no spells, no passive healing — scars stay, sickness hits hard, and a slave pact has nothing in you to push against. What you have instead is a body that refuses to stop.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          <div className="choice-card" style={{ "--accent": "rgba(184,58,42,0.45)", "--accent-strong": "#e85c3a", "--glow": "rgba(232,92,58,0.3)" }} onClick={() => begin("slave")}>
            <Tag color="#e85c3a">Kremantin · Elysandria</Tag>
            <h2 style={{ margin: "12px 0 8px", color: "#fff" }}>Slave in Elysandria</h2>
            <p>Bound by a slave pact in a noble's Lower Estate. Work, watch, gather allies and routes — and survive the pact's backlash when you finally break it. Then cross the sea.</p>
            <p style={{ fontSize: 12, color: "#ffb0a0", margin: 0 }}>Hunted by your former master. Clans distrust a returned slave.</p>
          </div>
          <div className="choice-card" style={{ "--accent": "rgba(255,140,66,0.45)", "--accent-strong": "#ff8c42", "--glow": "rgba(255,140,66,0.3)" }} onClick={() => begin("tribe")}>
            <Tag color="#ff8c42">Menfor · Ashveil Basin</Tag>
            <h2 style={{ margin: "12px 0 8px", color: "#fff" }}>Emberhide Tribe</h2>
            <p>Raised among your own. Receive your markings, take your first hunt — and then the Syndicate comes in the night and takes your sibling to Chainhold.</p>
            <p style={{ fontSize: 12, color: "#ffc89a", margin: 0 }}>Start with a clan that trusts you, and someone to get back.</p>
          </div>
        </div>
        {!isMetaDisabled && <Panel style={{ marginTop: 18, borderColor: "rgba(224,165,35,0.35)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><b style={{ color: "#e0a523" }}>Ancestral Echoes</b><Tag color="#e0a523">{meta.echoes || 0}</Tag></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
            {META_UPGRADES.map(u => <div key={u.id} style={{ padding: 10, borderRadius: 10, border: `1px solid ${meta.upgrades?.[u.id] ? "#3ec995" : "rgba(255,255,255,0.12)"}` }}>
              <b style={{ fontSize: 13 }}>{u.name}</b><p style={{ fontSize: 11, margin: "4px 0 8px" }}>{u.desc}</p>
              {meta.upgrades?.[u.id] ? <Tag color="#3ec995">Awakened</Tag> : <Btn small variant="gold" disabled={(meta.echoes || 0) < u.cost} onClick={() => buyMeta(u)}>{u.cost} Echoes</Btn>}
            </div>)}
          </div>
        </Panel>}
        {isMetaDisabled && <p style={{ textAlign: "center", fontSize: 12, color: "#e85c3a", marginTop: 14 }}>Ancestral Echoes are disabled on {diff?.name}.</p>}
        <div style={{ textAlign: "center", marginTop: 18 }}><Btn variant="ghost" onClick={() => setScreen("main_menu")}>← Main menu</Btn></div>
      </div>
    </div>;
  }

  const eventOverlay = ev && <div className="ten-event-wrap">
    <div className="ten-event" style={{ borderColor: ev.tone || "#e0a523" }}>
      <p className="section-label" style={{ color: ev.tone }}>{g.act === "bondage" ? `Lower Estate · Day ${g.bondage?.day}` : g.act === "tribe" ? "Emberhide" : `Day ${g.day} · ${SEGS[g.seg]}`}</p>
      <h2 style={{ margin: "0 0 10px", color: "#fff", fontFamily: "Georgia, serif", fontWeight: 400 }}>{ev.title}</h2>
      <p style={{ color: "rgba(255,240,220,0.8)", lineHeight: 1.75, fontSize: 15 }}>{ev.text}</p>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {ev.choices.map((c, i) => <button key={i} className="ten-choice" disabled={!!c.disabled} onClick={() => choose(c)}>
          <b>{c.label}</b>{c.hint && <span>{c.hint}</span>}
        </button>)}
      </div>
    </div>
  </div>;

  const body = <Panel style={{ borderColor: "#6e3a24", padding: 16 }}>
    <p className="section-label" style={{ color: "#e0a523" }}>Body</p>
    {[["Health", g.hp, g.maxHp, "#e85c3a"], ["Stamina", g.stamina, g.maxStamina, "#3ec995"], ...(g.act === "menfor" ? [["Fullness", g.hunger, 100, "#ffd966"], ["Hydration", g.thirst, 100, "#4dd9c2"]] : [])].map(([l, v, m, c]) =>
      <div key={l} style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: c, fontWeight: 800 }}>{l}</span><span style={{ color: "rgba(255,255,255,0.55)" }}>{Math.round(v)}/{m}</span></div>
        <Bar val={v} max={m} color={c} h={7} />
      </div>)}
    {g.heritage && <p style={{ fontSize: 11, margin: "8px 0 4px" }}><b style={{ color: "#ffb347" }}>{heritageOf(g).name}</b> · {weaponOf(g).name} (+{weaponOf(g).atk})</p>}
    {g.act === "menfor" && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "8px 0" }}>
      <Tag color="#ffd966">Food {g.food}</Tag><Tag color="#4dd9c2">Water {g.water}</Tag><Tag color="#c8b48a">Materials {g.materials}</Tag><Tag color="#3ec995">Herbs {g.herbs}</Tag><Tag color="#e0a523">Trophies {g.trophies}</Tag>
    </div>}
    {g.wounds.length > 0 && <div style={{ marginTop: 8 }}>
      <p className="section-label">Wounds</p>
      {g.wounds.map(w => <div key={w.type} style={{ fontSize: 11.5, color: "#ff9a8a", marginBottom: 3 }}>{WOUNDS[w.type].name} <span style={{ opacity: 0.6 }}>— {WOUNDS[w.type].desc} {w.days}d</span></div>)}
    </div>}
    <p style={{ fontSize: 11, margin: "8px 0 0" }}>Scars: <b>{g.scars}</b> · Legacy: <b style={{ color: "#ffd966" }}>{g.legacy}</b></p>
    {g.act === "menfor" && <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
      <Btn small full variant="success" disabled={g.herbs < 1} onClick={() => up(tend)}>Tend wounds (1 herb)</Btn>
      {g.flags.freshKill && <Btn small full variant="danger" onClick={() => up(riskyMeal)}>Eat the kill raw</Btn>}
    </div>}
  </Panel>;

  const journal = <Panel style={{ borderColor: "#33271d", padding: 14, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)", position: "sticky", top: 16 }}>
    <p className="section-label" style={{ color: "#d6c0a0" }}>Journal</p>
    <div ref={logRef} style={{ overflowY: "auto", fontSize: 12, lineHeight: 1.6, flex: 1, minHeight: 200 }}>
      {g.log.map(l => <div key={l.id} style={{ color: LOGC[l.type] || "#ccc", marginBottom: 5 }}>{l.msg}</div>)}
    </div>
  </Panel>;

  const header = (sub) => <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}><Tag color="#b83a2a">Tenebrim</Tag><Tag color="#e0a523">{g.origin === "slave" ? "Escaped slave" : "Emberhide"}</Tag>{sub}</div>
      <h1 style={{ margin: 0, fontSize: 28, fontFamily: "Georgia, serif", fontWeight: 400, color: "#fff" }}>{g.act === "bondage" ? "The Lower Estate" : g.act === "tribe" ? "Emberhide Camp" : regionOf(g).name}</h1>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Btn small variant="ghost" onClick={() => { exportSave?.(); notify?.("Saved.", "#3ec995"); }}>Save</Btn>
      <Btn small variant="ghost" onClick={() => setScreen("main_menu")}>Menu</Btn>
    </div>
  </div>;

  // ── Bondage view ────────────────────────────────────────────────────────
  if (g.act === "bondage") {
    const b = g.bondage;
    const canEscape = b.info >= 4 && (b.strain >= 60 || b.ledger);
    return <div className="ten-root"><div className="ten-wrap">
      {header(<Tag color="#ffd966">Day {b.day} · {b.phase === "night" ? "Night" : "Labor"}</Tag>)}
      <div className="ten-grid">
        {body}
        <main style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Panel style={{ borderColor: "#b83a2a" }}>
            <p className="section-label" style={{ color: "#e85c3a" }}>Escape plan</p>
            {[["Routes known", b.info, 4, "#4dd9c2", "Learn ship schedules and patrols (docks, kennels)"], ["Contacts", b.contacts, 4, "#a89df0", "Allies among the slaves — they can help on the night"], ["Pact strain", b.strain, 60, "#ff6b4a", "Resist the pact to weaken it — or steal the ledger"], ["Suspicion", b.suspicion, 100, "#e85c3a", "At 100 you are caught"]].map(([l, v, m, c, d]) =>
              <div key={l} style={{ marginBottom: 9 }} title={d}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: c, fontWeight: 800 }}>{l}</span><span style={{ color: "rgba(255,255,255,0.55)" }}>{v}/{m}</span></div>
                <Bar val={Math.min(v, m)} max={m} color={c} h={6} />
                <p style={{ fontSize: 10.5, margin: "2px 0 0", color: "rgba(255,255,255,0.4)" }}>{d}</p>
              </div>)}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <Tag color="#ffd966">Stash {b.stash}</Tag>{b.ledgerKnown && <Tag color={b.ledger ? "#3ec995" : "#e0a523"}>{b.ledger ? "Ledger page stolen" : "Ledger location known"}</Tag>}{b.caught > 0 && <Tag color="#e85c3a">Caught {b.caught}/3</Tag>}
            </div>
            <Btn variant="gold" full disabled={!canEscape} onClick={() => up((n) => { n.event = { id: "escape" }; })} style={{ marginTop: 12 }}>{canEscape ? "Escape tonight ↗" : "Escape (needs 4 routes, and 60 pact strain or the ledger)"}</Btn>
          </Panel>
          <Panel style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <p className="section-label">{b.phase === "night" ? "Night — one action" : "Labor — choose your work"}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
              {(b.phase === "night" ? BONDAGE_NIGHT.filter(t => !t.requires || t.requires(g)) : BONDAGE_TASKS).map(t =>
                <button key={t.id} className="ten-choice" disabled={!!g.event} onClick={() => (b.phase === "night" ? bondNight(t) : bondTask(t))}><b>{t.name}</b><span>{t.desc}</span></button>)}
            </div>
          </Panel>
        </main>
        {journal}
      </div>
    </div>{eventOverlay}</div>;
  }

  // ── Tribe prologue ──────────────────────────────────────────────────────
  if (g.act === "tribe") {
    return <div className="ten-root"><div className="ten-wrap">
      {header(<Tag color="#ff8c42">Prologue</Tag>)}
      <div className="ten-grid">
        {body}
        <main><Panel style={{ borderColor: "#ff8c42" }}>
          <p style={{ color: "rgba(255,230,200,0.8)", lineHeight: 1.8 }}>The Emberhide longhouses ring a black-sand basin. Steam rises from the vents; hammers ring from the forges. {g.sibling} is waiting for you by the goat pens, pretending not to be nervous for you.</p>
          {!g.event && g.tribeStep === 1 && <Btn variant="gold" onClick={() => up(n => { n.event = { id: "firsthunt" }; })}>Go on the hunt</Btn>}
          {!g.event && g.tribeStep === 2 && <Btn variant="danger" onClick={() => up(n => { n.cinematic = "raid"; n.event = { id: "raid" }; })}>Night falls…</Btn>}
          {!g.event && g.tribeStep === 3 && <Btn variant="gold" onClick={() => up(n => { n.event = { id: "leave" }; })}>Leave</Btn>}
        </Panel></main>
        {journal}
      </div>
    </div>{eventOverlay}</div>;
  }

  // ── Menfor ──────────────────────────────────────────────────────────────
  const r = regionOf(g);
  const clanHere = r.clan;
  const caravanHere = g.caravans[g.region];
  const gripCol = g.grip < 40 ? "#3ec995" : g.grip < 70 ? "#e0a523" : "#e85c3a";
  const objective = g.flags.fortTaken ? "Chainhold has fallen." : g.origin === "tribe" ? `Free ${g.sibling} from Chainhold on the Black Stone Coast.` : "Break Chainhold before the Syndicate's grip closes on Menfor.";

  const tabs = [["region", "Region"], ["map", "Map"], ["band", `Band (${g.band.length})`], ["clans", "Clans"], ["camp", "Camp & gear"], ["marks", "Marks"]];
  return <div className="ten-root"><div className="ten-wrap">
    {header(<><Tag color="#ffd966">Day {g.day}</Tag><Tag color="#ffb347">{["☀ Dawn", "☀ Day", "☾ Dusk"][g.seg]}</Tag>{g.origin === "slave" && !g.flags.fortTaken && <Tag color="#e85c3a">Hunted {g.pursuit}</Tag>}</>)}
    <Panel style={{ padding: "12px 16px", marginBottom: 14, borderColor: `${gripCol}55` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", color: gripCol }}>SYNDICATE GRIP — {g.grip}%</span>
        <span style={{ fontSize: 12, color: "rgba(255,240,220,0.7)" }}>Objective: {objective}</span>
      </div>
      <Bar val={g.grip} max={100} color={gripCol} h={8} />
      <p style={{ fontSize: 10.5, margin: "4px 0 0", color: "rgba(255,255,255,0.4)" }}>Rises every day. Raids on clans grow likelier as it climbs. Raid caravans to push it back. At 100%, Menfor falls.</p>
    </Panel>
    <div className="ten-grid">
      {body}
      <main style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{tabs.map(([id, l]) => <Btn key={id} small variant={tab === id ? "gold" : "ghost"} onClick={() => setTab(id)}>{l}</Btn>)}</div>

        {tab === "region" && <Panel style={{ borderColor: "#6e3a24" }}>
          <p style={{ color: "rgba(255,235,210,0.75)", marginBottom: 10 }}>{r.desc}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <Tag color={r.danger >= 4 ? "#e85c3a" : r.danger >= 2 ? "#e0a523" : "#3ec995"}>Danger {r.danger}</Tag>
            <Tag color="#4dd9c2">Water: {r.water === "spring" ? "spring" : r.water === "seep" ? "seep" : "none — dig"}</Tag>
            {caravanHere && <Tag color="#e85c3a" glow>Syndicate caravan here!</Tag>}
            {clanHere && <Tag color={CLANS[clanHere].color}>{CLANS[clanHere].name} territory</Tag>}
          </div>
          <div className="ten-actions">
            <button className="ten-choice" onClick={() => up(forage, false)}><b>Forage</b><span>-10 stamina · food, materials</span></button>
            <button className="ten-choice" onClick={() => up(forage, true)}><b>Deep search</b><span>-20 stamina · double yield, herbs, real risk</span></button>
            <button className="ten-choice" onClick={() => up(hunt)}><b>Hunt</b><span>-15 stamina · stalk {r.beasts.slice(0, 2).join(" / ")}… ambush if you're quiet</span></button>
            <button className="ten-choice" onClick={() => up(drawWater)}><b>{r.water === "none" ? "Dig for water" : "Draw water"}</b><span>{r.water === "spring" ? "+8 water" : r.water === "seep" ? "+4 water" : "-15 stamina, maybe +2-4"}</span></button>
            <button className="ten-choice" onClick={() => up(rest)}><b>Rest</b><span>+12% HP, +45 stamina, wounds may close</span></button>
            <button className="ten-choice" onClick={() => up(scout)}><b>Scout</b><span>Reveal nearby regions and caravans</span></button>
            {caravanHere && <button className="ten-choice danger" onClick={() => up(raidCaravan)}><b>Raid the caravan</b><span>Free captives · Grip -10</span></button>}
            {clanHere && <button className="ten-choice" style={{ borderColor: CLANS[clanHere].color }} onClick={() => up(n => { n.event = { id: "clan", data: { clan: clanHere } }; })}><b>Visit the {CLANS[clanHere].name}</b><span>Trade, work, duels, recruits, alliance ({g.clans[clanHere].rel})</span></button>}
            {r.relic && <button className="ten-choice danger" onClick={() => up(searchRuins)}><b>Search the Monarch's ruins</b><span>-25 stamina, half a day · {g.flags.horn ? "relic-scrap" : "something legendary is buried here"}</span></button>}
            {r.fort && !g.flags.fortTaken && <button className="ten-choice danger" onClick={() => up(n => { n.event = { id: "assault" }; })}><b>Storm Chainhold</b><span>Allied clans {alliedClans(g).length} · band {g.band.length}</span></button>}
            {r.fort && <button className="ten-choice" onClick={() => up(n => { n.event = { id: "sail" }; })}><b>Find a smuggler's boat</b><span>Leave Menfor forever</span></button>}
          </div>
          <p className="section-label" style={{ marginTop: 16 }}>Travel</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {r.links.map(l => <Btn key={l} small variant="ghost" onClick={() => up(travel, l)}>{g.known.includes(l) ? REGIONS[l].name : "Unknown land"} → <span style={{ opacity: 0.6, marginLeft: 4 }}>{1 + (REGIONS[l].water === "none" ? 1 : 0)} water{REGIONS[l].danger >= 3 ? ", half day" : ""}</span></Btn>)}
          </div>
        </Panel>}

        {tab === "map" && <Panel style={{ borderColor: "#6e3a24", padding: 10 }}>
          <svg viewBox="0 12 100 84" className="ten-map">
            <defs><radialGradient id="tenSea"><stop offset="0%" stopColor="#2a1a10" /><stop offset="100%" stopColor="#0a0605" /></radialGradient></defs>
            <rect y="12" width="100" height="84" fill="url(#tenSea)" />
            {Object.entries(REGIONS).flatMap(([k, R]) => R.links.filter(l => l > k).map(l => {
              const vis = g.known.includes(k) || g.known.includes(l);
              return vis && <line key={k + l} x1={R.x} y1={R.y} x2={REGIONS[l].x} y2={REGIONS[l].y} stroke="rgba(255,200,150,0.25)" strokeWidth="0.5" strokeDasharray="1.2 1" />;
            }))}
            {Object.entries(REGIONS).map(([k, R]) => {
              const known = g.known.includes(k); const here = k === g.region; const linked = regionOf(g).links.includes(k);
              if (!known && !linked) return null;
              return <g key={k} style={{ cursor: linked ? "pointer" : "default" }} onClick={() => linked && up(travel, k)}>
                <circle cx={R.x} cy={R.y} r={here ? 3.4 : 2.6} fill={here ? "#ffd966" : R.fort ? "#e85c3a" : known ? "#c87a4a" : "#3a2a20"} stroke={linked ? "#fff" : "none"} strokeWidth="0.4" />
                {g.caravans[k] && known && <circle cx={R.x} cy={R.y} r="4.6" fill="none" stroke="#e85c3a" strokeWidth="0.5" className="ten-pulse" />}
                <text x={R.x} y={R.y - 4.5} textAnchor="middle" fontSize="2.8" fill={known ? "#f0d8c0" : "#7a6a5a"}>{known ? R.name : "?"}</text>
                {R.clan && known && <text x={R.x} y={R.y + 6} textAnchor="middle" fontSize="2.2" fill={g.clans[R.clan].fallen ? "#e85c3a" : CLANS[R.clan].color}>{g.clans[R.clan].fallen ? "fallen" : CLANS[R.clan].name}</text>}
              </g>;
            })}
          </svg>
          <p style={{ fontSize: 11, margin: "6px 0 0" }}>Click a neighbouring region to travel. Red rings mark known caravans.</p>
        </Panel>}

        {tab === "band" && <Panel style={{ borderColor: "#3ec995" }}>
          <p style={{ fontSize: 12 }}>Every follower eats 1 food and drinks 1 water a day. If you can't feed them, they leave.</p>
          {g.band.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>You walk alone. Free captives or recruit from clans.</p> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 8 }}>
              {g.band.map(b => <div key={b.id} style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)" }}>
                <b>{ROLES[b.role].icon} {b.name}</b><p style={{ fontSize: 11, margin: "4px 0 0" }}>{ROLES[b.role].label} — {ROLES[b.role].desc}</p>
              </div>)}
            </div>}
          {g.flags.horn && <p style={{ marginTop: 10, color: "#ffd966" }}>A beast answers the Monarch's Horn and fights beside you (+2 allies).</p>}
        </Panel>}

        {tab === "clans" && <Panel style={{ borderColor: "#e0a523" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(CLANS).map(([k, C]) => { const c = g.clans[k]; return <div key={k} style={{ padding: 12, borderRadius: 10, border: `1px solid ${C.color}55`, background: "rgba(0,0,0,0.25)", opacity: c.fallen ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <b style={{ color: C.color }}>{C.name}</b>
                <span>{c.fallen ? <Tag color="#e85c3a">Fallen</Tag> : c.allied ? <Tag color="#3ec995" glow>Allied</Tag> : <Tag color="#a8a8a8">Relation {c.rel}</Tag>}</span>
              </div>
              <p style={{ fontSize: 11.5, margin: "4px 0" }}>{C.trait} Home: {REGIONS[C.region].name}. Raided {c.raided}/3.</p>
              {!c.fallen && <Bar val={c.rel + 100} max={200} color={C.color} h={4} />}
            </div>; })}
          </div>
        </Panel>}

        {tab === "camp" && <Panel style={{ borderColor: "#c8b48a" }}>
          {!g.camp ? <><p>A camp of your own: production, a forge, and something the clans can see.</p><Btn variant="gold" disabled={g.materials < 15} onClick={() => up(foundCamp)}>Found camp in {r.name} (15 materials)</Btn></> :
            <><p>Your camp is in <b>{REGIONS[g.camp.region].name}</b>{g.camp.region !== g.region && " — travel there to build."}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8 }}>
                {Object.entries(CAMP_BUILDINGS).map(([k, B]) => <div key={k} style={{ padding: 10, borderRadius: 10, border: `1px solid ${g.camp.built[k] ? "#3ec995" : "rgba(255,255,255,0.12)"}` }}>
                  <b>{B.name}</b><p style={{ fontSize: 11, margin: "4px 0 8px" }}>{B.desc}</p>
                  {g.camp.built[k] ? <Tag color="#3ec995">Built</Tag> : <Btn small variant="gold" disabled={g.camp.region !== g.region} onClick={() => up(build, k)}>{Object.entries(B.cost).map(([a, v]) => `${v} ${a}`).join(", ")}</Btn>}
                </div>)}
              </div></>}
          <p className="section-label" style={{ marginTop: 16 }}>Weapons</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8 }}>
            {WEAPONS.filter(w => w.id !== "fists").map(w => <div key={w.id} style={{ padding: 10, borderRadius: 10, border: `1px solid ${g.weapon === w.id ? "#3ec995" : "rgba(255,255,255,0.12)"}` }}>
              <b>{w.name}</b> <span style={{ fontSize: 11, opacity: 0.6 }}>+{w.atk} ATK</span>
              <p style={{ fontSize: 11, margin: "4px 0 8px" }}>{Object.entries(w.cost).map(([a, v]) => `${v} ${a}`).join(", ")}{w.needs ? " · needs a forge" : ""}</p>
              {g.weapon === w.id ? <Tag color="#3ec995">Wielded</Tag> : <Btn small variant="amber" onClick={() => up(craftWeapon, w.id)}>Craft</Btn>}
            </div>)}
          </div>
        </Panel>}

        {tab === "marks" && <Panel style={{ borderColor: "#a89df0" }}>
          <p style={{ fontSize: 12 }}>Techniques aren't taught or bought. They are what's left when your body is pushed past its limits and stays there.</p>
          <div style={{ display: "grid", gap: 8 }}>
            {TECHNIQUES.map(t => { const on = hasTech(g, t.id); return <div key={t.id} style={{ padding: 10, borderRadius: 10, border: `1px solid ${on ? "#3ec995" : "rgba(255,255,255,0.12)"}`, opacity: on ? 1 : 0.75 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ color: on ? "#3ec995" : "#fff" }}>{t.name}</b><Tag color={on ? "#3ec995" : "#888"}>{on ? "Unlocked" : t.hint}</Tag></div>
              <p style={{ fontSize: 11.5, margin: "4px 0 0" }}>{t.desc}</p>
            </div>; })}
          </div>
          <p className="section-label" style={{ marginTop: 16 }}>Deeds</p>
          {g.deeds.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)" }}>Nothing carved yet.</p> : g.deeds.map((d, i) => <p key={i} style={{ margin: "2px 0", fontSize: 12.5 }}>Day {d.day} — {d.text}</p>)}
        </Panel>}
      </main>
      {journal}
    </div>
  </div>{eventOverlay}</div>;
}
