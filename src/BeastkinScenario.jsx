// BeastkinScenario.jsx — "The Hollowmere Year": one year in a secluded Beastkin village.
import React, { useEffect, useRef, useState } from "react";
import { Bar, Btn, Panel, Tag, Confetti } from "./UIComponents";
import { SFX } from "./AudioEngine";
import { TACTICS } from "./GameData";
import CombatScreen from "./combat/CombatScreen";
import Cinematic from "./cinematic/Cinematic";
import { makeEnemy } from "./combat/engine";
import { SUBTYPES, SEASONS, SLOTS, NOTABLES, BUILDINGS, OUTSIDERS, DAYS_PER_SEASON } from "./beastkin/data";
import {
  newGame, chooseSubtype, seasonOf, sub, log, clamp, HARVEST_DAY, LAST_DAY,
  combatCtx, battlePlayer, actionsFor, buildEnemies, applyCombatResult, afterCombat, startFight, alliesFor,
  fields, forage, hunt, patrol, train, rest, build, pilgrimage, EVENTS, ENDINGS,
} from "./beastkin/logic";

const SAVE_KEY = "aleria_beastkin_save";
const SEASON_BG = {
  Spring: "radial-gradient(ellipse at 20% 0%, rgba(120,200,120,0.18), transparent 50%), linear-gradient(160deg,#0e1a10,#080d09 55%,#0d120c)",
  Summer: "radial-gradient(ellipse at 80% 0%, rgba(255,200,90,0.18), transparent 50%), linear-gradient(160deg,#1a160a,#0d0b06 55%,#12100a)",
  Autumn: "radial-gradient(ellipse at 20% 0%, rgba(230,120,50,0.2), transparent 50%), linear-gradient(160deg,#1c0f08,#0d0705 55%,#140a08)",
  Winter: "radial-gradient(ellipse at 50% 0%, rgba(160,200,255,0.16), transparent 50%), linear-gradient(160deg,#0c1218,#06080c 55%,#0a0e14)",
};
const SEASON_COL = { Spring: "#7fbf5a", Summer: "#ffd966", Autumn: "#ff8c42", Winter: "#a8d0ff" };
const LOGC = { info: "rgba(230,240,220,0.62)", dmg: "#e85c3a", heal: "#3ec995", sys: "#f0f0e0", reward: "#ffd966", lumen: "#ffb347" };

const CINE = {
  intro: [
    { text: "Long ago, the 7th Hero loved animals more than he loved people.", sub: "He spent his own core, piece by piece, making something in between.", bg: "radial-gradient(ellipse at 50% 30%, #3a4a20 0%, #0a0c06 70%)", fx: ["motes"], color: "#e8f0c0", duration: 6000 },
    { text: "His children kept their keen senses, their instincts — and cores too strong for them to steer.", bg: "radial-gradient(ellipse at 50% 60%, #2a3a1a 0%, #060806 70%)", fx: ["motes", "fog"], color: "#d0e8b8", duration: 5600 },
    { text: "Hollowmere: a valley the roads forgot. Thirty-odd beastkin, a mill, goats, and everything shared.", sub: "Nobody here locks a door. That's the problem.", bg: "radial-gradient(ellipse at 50% 80%, #4a3a10 0%, #0a0804 70%)", fx: ["motes"], color: "#ffe8a8", duration: 6200 },
  ],
  harvest: [
    { text: "The last night of the harvest.", bg: "radial-gradient(ellipse at 50% 90%, #3a1a08 0%, #050302 70%)", fx: ["embers"], color: "#ffc89a", duration: 3800 },
    { text: "Lanterns move between the trees. Too many lanterns.", sub: "Nets. Wagons with cages. Chains that glow.", bg: "radial-gradient(ellipse at 50% 50%, #2a1a10 0%, #040202 70%)", fx: ["fog", "embers"], color: "#ffb08a", duration: 5200 },
    { text: "Orlen's harvest has come.", bg: "radial-gradient(circle, #5a1a0a 0%, #000 70%)", fx: ["flash", "shake", "vignette-red"], color: "#ff6b4a", duration: 3400, sfx: () => SFX.roar() },
  ],
};

function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (s && s.v === 1) return { ...s, toasts: [] }; } catch (e) {} return null; }

export default function BeastkinScenario({ setScreen, notify, setStats, diff, exportSave }) {
  const [g, setG] = useState(() => loadSave() || newGame());
  const [tab, setTab] = useState("village");
  const logRef = useRef(null);
  const up = (fn, ...a) => setG(prev => { const n = structuredClone(prev); fn(n, ...a); if (n.hp <= 0 && !n.dead && !n.combat) n.dead = { reason: "Your body gave out." }; return n; });

  useEffect(() => {
    const { toasts, ...rest } = g;
    if (g.ending || g.dead) localStorage.removeItem(SAVE_KEY); else try { localStorage.setItem(SAVE_KEY, JSON.stringify(rest)); } catch (e) {}
    setStats?.(s => ({ ...s, hp: g.hp, maxHp: g.maxHp, mp: g.mp, maxMp: g.maxMp, stamina: g.stamina, maxStamina: g.maxStamina }));
  }, [g]);
  useEffect(() => { if (g.toasts?.length) { g.toasts.forEach(t => notify?.(t.msg, t.color)); setG(p => ({ ...p, toasts: [] })); } }, [g.toasts]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [g.log]);
  useEffect(() => { if (g.ending) (ENDINGS[g.ending]?.good ? SFX.victory : SFX.defeat)(); }, [g.ending]);

  if (g.cinematic) return <Cinematic shots={CINE[g.cinematic]} onDone={() => setG(p => ({ ...p, cinematic: null }))} />;

  if (g.combat) {
    const c = g.combat;
    const resultContent = c.summary && <div>
      <h2 style={{ margin: "0 0 8px", color: c.result === "win" ? "#3ec995" : "#e85c3a" }}>{c.summary.title}</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{c.summary.lines.map((l, i) => <span key={i} className="pill" style={{ color: "#f0f0e0", borderColor: "rgba(255,255,255,0.2)" }}>{l}</span>)}</div>
      <Btn variant={c.result === "win" ? "success" : "danger"} onClick={() => up(afterCombat)}>Continue</Btn>
    </div>;
    return <CombatScreen key={c.key} initialEnemies={buildEnemies(g, c, diff, makeEnemy)} player={battlePlayer(g)} ctx={combatCtx(g)}
      actions={[...actionsFor(g), ...TACTICS]} allies={c.allies || 0} title={c.title || "COMBAT"} subtitle={c.ambush ? "Ambush — they're staggered!" : undefined}
      canFlee={c.kind === "hunt"} onFlee={() => up(n => { n.combat = null; log(n, "You slip back into the trees.", "info"); })}
      background="radial-gradient(ellipse at top,#1a2a12 0%,#070a05 70%)"
      onEnd={(r, b) => up(n => applyCombatResult(n, r, b, diff))} resultContent={resultContent} />;
  }

  if (g.ending || g.dead) {
    const E = g.ending ? ENDINGS[g.ending] : { title: "Fallen", good: false, text: g.dead.reason };
    return <div style={{ minHeight: "100vh", background: SEASON_BG.Winter, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {E.good && <Confetti />}
      <Panel style={{ maxWidth: 680, textAlign: "center", borderColor: E.good ? "#ffd966" : "#a8d0ff", position: "relative", zIndex: 2 }}>
        <Tag color={sub(g).color}>{sub(g).name} of Hollowmere</Tag>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, color: E.good ? "#ffd966" : "#fff", margin: "16px 0 10px" }}>{E.title}</h1>
        <p style={{ color: "rgba(240,240,230,0.82)", lineHeight: 1.8, fontSize: 16 }}>{E.text}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "16px 0" }}>
          <Tag color="#7fbf5a">Villagers {g.pop}</Tag><Tag color="#e85c3a">Taken {g.taken}</Tag><Tag color="#ffd966">Church favor {g.favor}</Tag><Tag color="#a89df0">Clues {g.clues}</Tag>
        </div>
        <p style={{ fontSize: 13 }}>{NOTABLES.map(n => `${n.name}: ${g.notables[n.id] === "home" ? "home" : "taken"}`).join(" · ")}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          <Btn variant="primary" onClick={() => setG(newGame())}>Another year</Btn>
          <Btn variant="ghost" onClick={() => setScreen("main_menu")}>Main menu</Btn>
        </div>
      </Panel>
    </div>;
  }

  if (g.act === "pick") {
    return <div style={{ minHeight: "100vh", background: SEASON_BG.Spring, padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Tag color="#7fbf5a">Beastkin</Tag>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 42, color: "#fff", margin: "12px 0 6px" }}>The Hollowmere Year</h1>
          <p style={{ maxWidth: 640, margin: "0 auto" }}>Made by a Hero, protected by the Church — on paper. Your village is generous, trusting, and a soft target. Spend one year keeping it whole. Choose what kind of beastkin you are.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {Object.entries(SUBTYPES).map(([id, S]) => <div key={id} className="choice-card" style={{ "--accent": `${S.color}55`, "--accent-strong": S.color, "--glow": `${S.color}44` }} onClick={() => { SFX.menuSelect(); up(chooseSubtype, id); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h3 style={{ color: S.color, margin: 0 }}>{S.name}</h3>{!S.lore && <span style={{ fontSize: 9, opacity: 0.5 }}>new</span>}</div>
            <p style={{ fontSize: 11.5, fontStyle: "italic", margin: "8px 0" }}>{S.look}</p>
            <p style={{ fontSize: 12.5, margin: "0 0 8px" }}>{S.blurb}</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}><Tag color="#e85c3a">HP {S.stats.hp}</Tag><Tag color="#e0a523">ATK {S.stats.atk}</Tag><Tag color="#87cefa">DEF {S.stats.def}</Tag><Tag color="#3ec995">Dodge {S.stats.dodge}</Tag></div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: "rgba(255,255,255,0.72)" }}>{S.perks.map(p => <li key={p}>{p}</li>)}</ul>
          </div>)}
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}><Btn variant="ghost" onClick={() => setScreen("main_menu")}>← Main menu</Btn></div>
      </div>
    </div>;
  }

  const season = seasonOf(g);
  const S = sub(g);
  const ev = g.event ? EVENTS[g.event.id]?.(g) : null;
  const choose = (c) => { SFX.click(); up(n => { n.event = null; c.run(n); }); };
  const out = g.outsider && OUTSIDERS.find(o => o.id === g.outsider.id);
  const dayInSeason = ((g.day - 1) % DAYS_PER_SEASON) + 1;
  const toHarvest = HARVEST_DAY - g.day;
  const canRescue = season === "Winter" && g.taken > 0 && !g.flags.rescued && (g.subtype === "canine" || g.notables.rook === "home");

  return <div style={{ minHeight: "100vh", background: SEASON_BG[season], color: "#fff", fontFamily: "var(--font-sans)" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}><Tag color={S.color}>{S.name}</Tag><Tag color={SEASON_COL[season]}>{season} · day {dayInSeason}</Tag><Tag color="#ffd966">{SLOTS[g.slot]}</Tag>{toHarvest >= 0 && <Tag color="#e85c3a">Harvest in {toHarvest + 1}d</Tag>}</div>
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 30 }}>Hollowmere</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}><Btn small variant="ghost" onClick={() => { exportSave?.(); notify?.("Saved.", "#3ec995"); }}>Save</Btn><Btn small variant="ghost" onClick={() => setScreen("main_menu")}>Menu</Btn></div>
      </div>

      {/* Year timeline */}
      <div className="bk-year">{Array.from({ length: LAST_DAY }, (_, i) => { const d = i + 1; const s = SEASONS[Math.floor(i / DAYS_PER_SEASON)]; return <span key={d} title={`${s} ${d}`} className={`${d < g.day ? "past" : d === g.day ? "now" : ""} ${d === HARVEST_DAY ? "harvest" : ""}`} style={{ "--c": SEASON_COL[s] }} />; })}</div>

      <div className="ten-grid" style={{ marginTop: 14 }}>
        <Panel style={{ borderColor: `${S.color}55`, padding: 16 }}>
          <p className="section-label" style={{ color: S.color }}>You</p>
          {[["HP", g.hp, g.maxHp, "#e85c3a"], ["MP", g.mp, g.maxMp, "#a89df0"], ["Stamina", g.stamina, g.maxStamina, "#3ec995"]].map(([l, v, m, c]) => <div key={l} style={{ marginBottom: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: c, fontWeight: 800 }}>{l}</span><span style={{ opacity: 0.6 }}>{Math.round(v)}/{m}</span></div><Bar val={v} max={m} color={c} h={6} />
          </div>)}
          <p className="section-label" style={{ marginTop: 12 }}>Village</p>
          {[["Trust", g.trust, 100, "#7fbf5a", "Low trust and families leave"], ["Church favor", g.favor, 6, "#ffd966", "The Church protects the Hero's children — if it knows"], ["Clues on Orlen", g.clues, 5, "#ff8c42", "3+ lets you expose him at Church Holling"]].map(([l, v, m, c, d]) => <div key={l} style={{ marginBottom: 7 }} title={d}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: c, fontWeight: 800 }}>{l}</span><span style={{ opacity: 0.6 }}>{v}{m !== 100 ? `/${m}` : ""}</span></div><Bar val={Math.min(v, m)} max={m} color={c} h={5} />
          </div>)}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
            <Tag color="#7fbf5a">Villagers {g.pop}</Tag><Tag color="#ffd966">Food {g.food}</Tag><Tag color="#c8b48a">Materials {g.materials}</Tag><Tag color="#3ec995">Herbs {g.herbs}</Tag><Tag color="#e0a523">Goods {g.goods}</Tag>
            {g.taken > 0 && <Tag color="#e85c3a">Taken {g.taken}</Tag>}{g.exposed && <Tag color="#ffd966" glow>Orlen exposed</Tag>}
          </div>
          <p style={{ fontSize: 10.5, margin: "6px 0 0" }}>The village eats {Math.ceil(g.pop / 6)} food a day.</p>
        </Panel>

        <main style={{ display: "grid", gap: 12, alignContent: "start" }}>
          {ev && <Panel style={{ borderColor: ev.tone || "#e0a523", background: "linear-gradient(180deg,rgba(40,30,10,0.85),rgba(10,8,4,0.95))" }}>
            <h2 style={{ margin: "0 0 8px", fontFamily: "Georgia, serif", fontWeight: 400 }}>{ev.title}</h2>
            <p style={{ color: "rgba(250,240,220,0.82)", whiteSpace: "pre-line", lineHeight: 1.7 }}>{ev.text}</p>
            <div style={{ display: "grid", gap: 8 }}>{ev.choices.map((c, i) => <button key={i} className="ten-choice" disabled={!!c.disabled} onClick={() => choose(c)}><b>{c.label}</b>{c.hint && <span>{c.hint}</span>}</button>)}</div>
          </Panel>}

          {!ev && <>
            {out && <Panel style={{ borderColor: "#ffb347", background: "linear-gradient(180deg,rgba(255,180,70,0.1),rgba(0,0,0,0.3))" }}>
              <p className="section-label" style={{ color: "#ffb347" }}>An outsider in the village · leaves in {g.outsider.days}d</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div><b>{out.who}</b><p style={{ fontSize: 12, margin: "3px 0 0", fontStyle: "italic" }}>"{out.pitch}"</p></div>
                <Btn variant="amber" onClick={() => up(n => { n.event = { id: "outsider" }; })}>Deal with them</Btn>
              </div>
            </Panel>}

            <div style={{ display: "flex", gap: 6 }}>{[["village", "Village life"], ["build", "Build"], ["people", "People"]].map(([id, l]) => <Btn key={id} small variant={tab === id ? "gold" : "ghost"} onClick={() => setTab(id)}>{l}</Btn>)}</div>

            {tab === "village" && <Panel style={{ borderColor: `${SEASON_COL[season]}55` }}>
              <p className="section-label">{SLOTS[g.slot]} — what do you do?</p>
              <div className="ten-actions">
                <button className="ten-choice" onClick={() => up(fields)}><b>Work the fields</b><span>{season === "Winter" ? "Little grows now" : `Food${g.subtype === "ursan" ? " (+50%, Ursan)" : ""}, trust`}</span></button>
                <button className="ten-choice" onClick={() => up(forage)}><b>Forage the forest</b><span>Materials, herbs</span></button>
                <button className="ten-choice" onClick={() => up(hunt)}><b>Hunt</b><span>-15 stamina · food and hides to trade</span></button>
                <button className="ten-choice" onClick={() => up(patrol)}><b>{g.slot === 1 ? "Night watch" : "Patrol the borders"}</b><span>Look for Orlen's men{g.subtype === "canine" ? " — your nose finds more" : ""}</span></button>
                <button className="ten-choice" onClick={() => up(train)}><b>Train your instincts</b><span>+1 ATK, +4 max MP</span></button>
                <button className="ten-choice" onClick={() => up(rest)}><b>Rest</b><span>Recover HP, stamina, mana</span></button>
                <button className="ten-choice" disabled={g.goods < 3} onClick={() => up(pilgrimage)}><b>Walk to Church Holling</b><span>Two days · 3 goods offering · Church favor{g.clues >= 3 && !g.exposed ? " · EXPOSE ORLEN" : ""}</span></button>
                {canRescue && <button className="ten-choice danger" onClick={() => up(n => startFight(n, "rescue", ["netter", "netter", "thug"], { title: "THE COAST ROAD", allies: alliesFor(n, n.notables.kesh === "home" ? 1 : 0) }))}><b>Follow the captives' trail</b><span>Bring the taken home before they reach the coast</span></button>}
              </div>
            </Panel>}

            {tab === "build" && <Panel style={{ borderColor: "#c8b48a" }}>
              <p style={{ fontSize: 12 }}>Everything here is built together, and belongs to everyone.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                {Object.entries(BUILDINGS).map(([k, B]) => <div key={k} style={{ padding: 10, borderRadius: 10, border: `1px solid ${g.built[k] ? "#3ec995" : "rgba(255,255,255,0.12)"}` }}>
                  <b>{B.name}</b><p style={{ fontSize: 11, margin: "4px 0 8px" }}>{B.desc}</p>
                  {g.built[k] ? <Tag color="#3ec995">Built</Tag> : <Btn small variant="gold" onClick={() => up(build, k)}>{Object.entries(B.cost).map(([a, v]) => `${v} ${a}`).join(", ")}</Btn>}
                </div>)}
              </div>
            </Panel>}

            {tab === "people" && <Panel style={{ borderColor: "#7fbf5a" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                {NOTABLES.map(n => { const st = g.notables[n.id]; return <div key={n.id} style={{ padding: 10, borderRadius: 10, border: `1px solid ${st === "home" ? "rgba(127,191,90,0.5)" : "rgba(232,92,58,0.5)"}`, opacity: st === "home" ? 1 : 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><b>{n.name}</b><Tag color={st === "home" ? "#7fbf5a" : "#e85c3a"}>{st}</Tag></div>
                  <p style={{ fontSize: 11, margin: "4px 0 0" }}>{n.kind}. {n.desc}</p>
                </div>; })}
              </div>
              <p style={{ fontSize: 11.5, marginTop: 10 }}>Kesh fights beside you in the big fights. Rook can smell out the trail of anyone who goes missing.</p>
            </Panel>}
          </>}
        </main>

        <Panel style={{ borderColor: "rgba(255,255,255,0.1)", padding: 14, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 160px)", position: "sticky", top: 16 }}>
          <p className="section-label">The year so far</p>
          <div ref={logRef} style={{ overflowY: "auto", fontSize: 12, lineHeight: 1.6, flex: 1, minHeight: 200 }}>{g.log.map(l => <div key={l.id} style={{ color: LOGC[l.type] || "#ccc", marginBottom: 5 }}>{l.msg}</div>)}</div>
        </Panel>
      </div>
    </div>
  </div>;
}
