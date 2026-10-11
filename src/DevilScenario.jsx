// DevilScenario.jsx — Underworld hub for Devils: Warden of Sector Three.
// Lore: mana sinks like cold air and pools in the Underworld. Devils regulate it day and night;
// the sealed facility at the bottom of the world is where Doomsdays begin. A Constaelous answers
// for each sector's siphons. Devils ride bonded beasts. Subtypes: Veyrith, Kharvex, Syrakai.
import React, { useEffect, useState } from "react";
import { Btn, Tag, Bar, Panel } from "./UIComponents";
import { SFX } from "./AudioEngine";

export const DEVIL_SUBTYPES = [
  { id: "veyrith", name: "Veyrith", color: "#ffd966",
    look: "Two short horizontal horns, a yellow third eye, solid black eyes that read as unreadable.",
    desc: "The most common subtype. Balanced mana expression, and filtration openings along the back let you take in ambient mana.",
    perks: ["+20 max MP", "Starts knowing Illusion", "Siphoning restores your mana", "+4% crit"] },
  { id: "kharvex", name: "Kharvex", color: "#c48cff",
    look: "Pale skin crossed by raised veins, large curved horns, a star-shaped eye.",
    desc: "You can absorb the cores of what you kill. Power now — instability later. Other devils keep their distance.",
    perks: ["Absorb monster cores after victories: +1 ATK each", "Instability grows with every core", "Too much: identity drift, fragmentation", "+2 ATK"] },
  { id: "syrakai", name: "Syrakai", color: "#7fe0b0",
    look: "Stone-textured blue-grey skin with glowing cracks, blunt upright horns, green eyes.",
    desc: "You convert heat into energy. Built to hold ground: exceptionally stable, but your system has no room for illusion.",
    perks: ["+6 DEF, +25 max HP", "Immune to burning", "Siphon nodes rise 25% slower for you", "Cannot learn Illusion"] },
];

export const COMPANIONS = [
  { id: "cindermaw", name: "Cindermaw hound", desc: "A heat-hound, loyal to a fault. Fights beside you.", perk: "+1 ally in fights (+2 at bond 3)" },
  { id: "gloomstrider", name: "Gloomstrider", desc: "A six-legged tunnel mount. Gets you out of the way of things.", perk: "+8% dodge; ally at bond 3" },
  { id: "shellback", name: "Shellback", desc: "A plated crawler that plants itself in front of you.", perk: "+3 DEF; ally at bond 3" },
];

export const RANKS_UW = [
  { rep: 0, title: "Junior Warden", stipend: 20 },
  { rep: 4, title: "Warden", stipend: 45 },
  { rep: 9, title: "Senior Warden", stipend: 80 },
  { rep: 15, title: "Sector Marshal", stipend: 140 },
  { rep: 22, title: "Constaelous-Elect", stipend: 220 },
];
export const rankOf = (rep) => [...RANKS_UW].reverse().find(r => rep >= r.rep) || RANKS_UW[0];

export const WORKS = {
  arrays: { name: "Siphon Array", color: "#a89df0", desc: "Sector pressure rises 2 less per day per level.", base: 300, max: 4 },
  wards: { name: "Ward Line", color: "#e85c3a", desc: "Surges are weaker; fewer monsters break through.", base: 350, max: 3 },
  stables: { name: "Beast Stables", color: "#ffb347", desc: "Your companion's bond grows faster. +1 bond now.", base: 250, max: 3 },
  refinery: { name: "Crystal Refinery", color: "#4dd9c2", desc: "+40 Bronze per day per level from refined crystal.", base: 400, max: 3 },
  archive: { name: "Warden Archive", color: "#ffd966", desc: "+6 max MP and faster spell research per level.", base: 300, max: 3 },
};

export function newDevilState() {
  return { subtype: null, companion: null, pressure: 30, works: {}, instability: 0, absorbed: 0, story: {}, lastDay: 1, surge: false, event: null };
}

// Story beats keyed by reputation and flags.
function nextStory(d, rep, declined) {
  const s = d.story;
  if (!s.outcast && rep >= 2) return "outcast";
  if (!s.pamphlet && rep >= 4) return "pamphlet";
  if (!s.facility && rep >= 6) return "facility";
  if (!s.marshal && declined && rep >= 15) return "marshal";
  return null;
}

const STORY = {
  outcast: (d) => ({
    title: "The Kharvex at the tribunal",
    text: "A Kharvex siphon-worker, Teshvar, stands accused: his crewmate died in a node collapse and Teshvar's veins have spread since. \"I took the core after he was already gone,\" he says. \"Otherwise it would have bled into the node and fed a monster.\" Ilvane wants a Warden's opinion.",
    choices: [
      { label: "Speak for him", hint: "He did the sector a service. (+2 rep, Kharvex: -10 instability — you feel less alone)", run: (dv, api) => { api.rep(2); if (dv.subtype === "kharvex") dv.instability = Math.max(0, dv.instability - 10); api.log("Teshvar keeps his post. He nods to you in the corridors after that.", "reward"); } },
      { label: "Condemn him", hint: "Absorbing a sentient's core is erasing them. (+1 rep)", run: (dv, api) => { api.rep(1); api.log("Teshvar is sent to the deep stations. Nobody absorbs anything for a while.", "info"); } },
    ],
  }),
  pamphlet: () => ({
    title: "A Church pamphlet",
    text: "A trader brings down a surface pamphlet: horned figures, flames, sinners in chains. \"That's us,\" laughs the trader. Ilvane reads it twice. \"They print these while we keep their sky from falling. Most of us find it faintly absurd.\"",
    choices: [
      { label: "Laugh it off", hint: "+1 rep", run: (dv, api) => { api.rep(1); api.log("You pin it to the barracks wall. It becomes a joke everyone gets."); } },
      { label: "Keep it", hint: "Someday you'll go up there and see for yourself.", run: (dv, api) => { dv.story.curious = true; api.log("You fold it into your coat."); } },
    ],
  }),
  facility: () => ({
    title: "The Sealed Facility",
    text: "Ilvane takes you down — further than you've ever been. The air is thick enough to taste. Behind a sealed gate, the deepest siphons in the world run without stopping, and the needles still creep upward. \"This is where Doomsdays come from,\" she says. \"Not from anger. Not from gods. From arithmetic. We can't stop it. We can only push it back.\"",
    choices: [{ label: "\"Then we push.\"", hint: "Unlocks Deep Patrols at the facility. +2 rep", run: (dv, api) => { api.rep(2); dv.story.deep = true; api.log("You are cleared for the Sealed Facility.", "reward"); } }],
  }),
  marshal: () => ({
    title: "Sector Marshal",
    text: "You declined the surface. You stayed. Ilvane pins a crystal-iron badge on your coat in front of the whole station: Sector Marshal. \"When the Doomsday comes, it hits us first. I want you holding the line.\"",
    choices: [{ label: "Accept the badge", hint: "+500 Bronze, +20 max HP", run: (dv, api) => { api.bronze(500); api.stats(s => ({ ...s, maxHp: s.maxHp + 20, hp: s.hp + 20 })); api.log("Sector Marshal. The siphons are yours to keep running.", "reward"); } }],
  }),
  surge: (d) => ({
    title: "PRESSURE SURGE",
    text: `Sector pressure hit its limit. A node blew in the eastern tunnels and the mana is already taking shape. ${d.works.wards ? "Your ward lines are holding most of it back." : "Nothing is holding it back."}`,
    choices: [
      { label: "Go in yourself", hint: "Fight what formed. Sector pressure drops sharply.", run: (dv, api) => { dv.pressure = 45; api.combat(); } },
      { label: "Seal the tunnel and let it rot", hint: "Doomsday +0.5. The global bar rises.", run: (dv, api) => { dv.pressure = 60; api.doom(0.5); api.log("You seal the tunnel. Somewhere, the mana keeps pooling.", "dmg"); } },
    ],
  }),
  fragment: () => ({
    title: "Fragmentation",
    text: "You wake up in a corridor you don't remember walking down, holding a memory of a childhood that isn't yours. The cores you've taken are louder than you are. The strongest Kharvex are not the ones who consumed the most — they are the ones who kept their balance.",
    choices: [{ label: "Purge what you can", hint: "Lose half your absorbed power, -40% HP, instability 40", run: (dv, api) => { dv.absorbed = Math.floor(dv.absorbed / 2); dv.instability = 40; api.stats(s => ({ ...s, hp: Math.max(1, Math.round(s.hp * 0.6)) })); api.log("You claw your way back to yourself. Most of you.", "dmg"); } }],
  }),
};

export default function DevilScenario({
  devil, setDevil, day, bronze, setBronze, stats, setStats, devilRep, setDevilRep, doomsday, setDoomsday, postDoomsday,
  nobleInvite, acceptInvite, declineInvite, declinedInvite, startSiphon, startPatrol, startDeepPatrol, onSleep, notify, addLog, log, LOG_C, potions, usePotion, setSpells,
}) {
  const [pickName, setPickName] = useState("");
  const d = devil;
  const rank = rankOf(devilRep);

  const api = {
    rep: (n) => setDevilRep(r => r + n),
    bronze: (n) => setBronze(b => b + n),
    stats: (fn) => setStats(fn),
    log: (m, t) => addLog(m, t),
    doom: (n) => !postDoomsday && setDoomsday(x => Math.min(10, x + n)),
    combat: () => startPatrol(true),
  };

  // End-of-day sector simulation (runs when the day counter moves)
  useEffect(() => {
    if (!d.subtype || day <= d.lastDay) return;
    const days = day - d.lastDay;
    setDevil(prev => {
      const n = { ...prev, works: { ...prev.works }, story: { ...prev.story } };
      for (let i = 0; i < days; i++) {
        n.pressure = Math.min(100, n.pressure + 7 - (n.works.arrays || 0) * 2);
        n.instability = Math.max(0, n.instability - 3);
      }
      n.lastDay = day;
      if (n.pressure >= 90 && !n.event) n.event = "surge";
      if (n.instability >= 100 && !n.event) n.event = "fragment";
      return n;
    });
    const income = rank.stipend + (d.works.refinery || 0) * 40 * days;
    setBronze(b => b + income);
    addLog(`Stipend and refinery: +${income} Bronze.`, "reward");
    if (!postDoomsday) setDoomsday(x => Math.min(10, x + d.pressure / 500));
  }, [day]);

  // Story triggers
  useEffect(() => {
    if (!d.subtype || d.event) return;
    const s = nextStory(d, devilRep, declinedInvite);
    if (s) setDevil(p => ({ ...p, event: s }));
  }, [devilRep, d.subtype, d.event, declinedInvite]);

  // ── Setup: subtype & companion ───────────────────────────────────────────
  if (!d.subtype) {
    return <div>
      <h2 style={{ color: "#e8c878", margin: "4px 0 6px" }}>Who are you, Warden?</h2>
      <p style={{ fontSize: 13 }}>Devils are not one race. Your subtype shapes how mana moves through you.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
        {DEVIL_SUBTYPES.map(st => <div key={st.id} className="choice-card" style={{ "--accent": `${st.color}55`, "--accent-strong": st.color, "--glow": `${st.color}44` }} onClick={() => {
          SFX.menuSelect();
          setDevil(p => ({ ...p, subtype: st.id }));
          if (st.id === "veyrith") { setStats(s => ({ ...s, maxMp: s.maxMp + 20, mp: s.mp + 20 })); setSpells(sp => sp.map(x => x.id === "illusion_1" ? { ...x, progress: 100, learned: true } : x)); }
          if (st.id === "syrakai") { setStats(s => ({ ...s, maxHp: s.maxHp + 25, hp: s.hp + 25 })); setSpells(sp => sp.filter(x => x.id !== "illusion_1")); }
          addLog(`You are ${st.name}.`, "sys");
        }}>
          <h3 style={{ color: st.color, margin: "0 0 6px" }}>{st.name}</h3>
          <p style={{ fontSize: 11.5, fontStyle: "italic", margin: "0 0 8px" }}>{st.look}</p>
          <p style={{ fontSize: 12.5, margin: "0 0 10px" }}>{st.desc}</p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{st.perks.map(p => <li key={p}>{p}</li>)}</ul>
        </div>)}
      </div>
    </div>;
  }
  if (!d.companion) {
    return <div>
      <h2 style={{ color: "#e8c878", margin: "4px 0 6px" }}>Your bonded beast</h2>
      <p style={{ fontSize: 13 }}>Devils don't drive machines. A machine is replaced when it breaks; a beast companion is a relationship. Choose who walks the tunnels with you.</p>
      <input value={pickName} onChange={e => setPickName(e.target.value)} placeholder="Name your companion (optional)" style={{ width: "100%", maxWidth: 340, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.4)", color: "#fff", margin: "8px 0 12px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {COMPANIONS.map(c => <div key={c.id} className="choice-card" onClick={() => { SFX.menuSelect(); setDevil(p => ({ ...p, companion: { kind: c.id, name: pickName.trim() || c.name.split(" ")[0], bond: 1 } })); addLog(`${pickName.trim() || c.name} bonds with you.`, "heal"); }}>
          <h3 style={{ color: "#ffb347", margin: "0 0 6px" }}>{c.name}</h3>
          <p style={{ fontSize: 12.5, margin: "0 0 6px" }}>{c.desc}</p><Tag color="#ffb347">{c.perk}</Tag>
        </div>)}
      </div>
    </div>;
  }

  const ev = d.event ? STORY[d.event]?.(d) : null;
  const choose = (c) => {
    SFX.click();
    const draft = { ...d, works: { ...d.works }, story: { ...d.story, [d.event]: true }, event: null };
    c.run(draft, api);
    setDevil(draft);
  };
  const pCol = d.pressure < 50 ? "#3ec995" : d.pressure < 80 ? "#e0a523" : "#e85c3a";
  const sub = DEVIL_SUBTYPES.find(s => s.id === d.subtype);
  const comp = COMPANIONS.find(c => c.id === d.companion.kind);
  const nextRank = RANKS_UW.find(r => r.rep > devilRep);

  const build = (k) => {
    const W = WORKS[k]; const lvl = d.works[k] || 0; const cost = W.base + lvl * W.base;
    if (lvl >= W.max || bronze < cost) return;
    setBronze(b => b - cost); SFX.buy();
    setDevil(p => ({ ...p, works: { ...p.works, [k]: lvl + 1 }, companion: k === "stables" ? { ...p.companion, bond: p.companion.bond + 1 } : p.companion }));
    if (k === "archive") setStats(s => ({ ...s, maxMp: s.maxMp + 6, mp: s.mp + 6 }));
    notify(`${W.name} → Lv ${lvl + 1}`, W.color);
  };

  return <div>
    {ev && <Panel style={{ marginBottom: 14, borderColor: d.event === "surge" || d.event === "fragment" ? "#e85c3a" : "#e8c878", background: "linear-gradient(180deg,rgba(232,185,56,0.12),rgba(0,0,0,0.3))" }}>
      <p className="section-label" style={{ color: "#e8c878" }}>Sector Three</p>
      <h3 style={{ margin: "0 0 8px", color: "#fff" }}>{ev.title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.7 }}>{ev.text}</p>
      <div style={{ display: "grid", gap: 8 }}>{ev.choices.map((c, i) => <button key={i} className="ten-choice" onClick={() => choose(c)}><b>{c.label}</b><span>{c.hint}</span></button>)}</div>
    </Panel>}

    {nobleInvite && <Panel style={{ marginBottom: 14, borderColor: "rgba(232,185,56,0.5)", background: "linear-gradient(180deg,rgba(232,185,56,0.12),rgba(232,185,56,0.02))" }}>
      <p className="section-label" style={{ color: "#e8c878" }}>An envoy from above</p>
      <p style={{ fontWeight: 700, fontSize: 15, color: "#e8c878", marginBottom: 6 }}>A surface noble asks for a Devil liaison</p>
      <p style={{ fontSize: 12.5, lineHeight: 1.7, marginBottom: 12 }}>One of the few surface nobles who knows what the siphons are for wants a Warden at his court before the next Doomsday. Ilvane shrugs: "Go if you want to see the sky. The mana up there is thin — your spells will cost more. Or stay, and hold this sector when it hits us first."</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Btn variant="amber" onClick={acceptInvite}>Go to the surface ↗</Btn><Btn variant="ghost" onClick={declineInvite}>Stay below</Btn></div>
    </Panel>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12, marginBottom: 14 }}>
      <Panel style={{ borderColor: `${pCol}66` }}>
        <p className="section-label" style={{ color: pCol }}>Sector pressure</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><b style={{ color: pCol }}>{Math.round(d.pressure)}%</b><span style={{ opacity: 0.6 }}>+{7 - (d.works.arrays || 0) * 2}/day</span></div>
        <Bar val={d.pressure} max={100} color={pCol} h={8} />
        <p style={{ fontSize: 11, margin: "6px 0 0" }}>Siphon shifts drain it. At 90%, a surge breaks loose. High pressure feeds the Doomsday.</p>
      </Panel>
      <Panel style={{ borderColor: `${sub.color}55` }}>
        <p className="section-label" style={{ color: sub.color }}>{sub.name} · {rank.title}</p>
        <p style={{ fontSize: 12, margin: "0 0 6px" }}>Rep {devilRep}{nextRank ? ` / ${nextRank.rep} for ${nextRank.title}` : " — highest rank"}. Stipend {rank.stipend} B/day.</p>
        {nextRank && <Bar val={devilRep} max={nextRank.rep} color={sub.color} h={5} />}
        {d.subtype === "kharvex" && <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: "#c48cff", fontWeight: 800 }}>INSTABILITY</span><span>{d.instability}/100 · cores {d.absorbed}</span></div>
          <Bar val={d.instability} max={100} color={d.instability >= 70 ? "#e85c3a" : "#c48cff"} h={5} />
        </div>}
      </Panel>
      <Panel style={{ borderColor: "rgba(255,179,71,0.4)" }}>
        <p className="section-label" style={{ color: "#ffb347" }}>{d.companion.name} · {comp.name}</p>
        <p style={{ fontSize: 12, margin: "0 0 6px" }}>Bond {d.companion.bond}/5 · {comp.perk}</p>
        <Bar val={d.companion.bond} max={5} color="#ffb347" h={5} />
        <Btn small variant="ghost" disabled={bronze < 60 || d.companion.bond >= 5} onClick={() => { setBronze(b => b - 60); setDevil(p => ({ ...p, companion: { ...p.companion, bond: Math.min(5, p.companion.bond + (Math.random() < 0.4 + (p.works.stables || 0) * 0.2 ? 1 : 0)) } })); SFX.click(); addLog(`You ride the tunnels with ${d.companion.name}.`, "heal"); }} style={{ marginTop: 8 }}>Ride & train (60 B)</Btn>
      </Panel>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginBottom: 14 }}>
      <button className="ten-choice" onClick={startSiphon}><b style={{ color: "#a89df0" }}>Siphon shift</b><span>Keep the nodes from overflowing. Drains pressure, pays, earns rep.</span></button>
      <button className="ten-choice danger" onClick={() => startPatrol(false)}><b style={{ color: "#e85c3a" }}>Patrol the tunnels</b><span>Cull what the mana has made. {d.companion.name} comes along.</span></button>
      {d.story.deep && <button className="ten-choice danger" onClick={startDeepPatrol}><b style={{ color: "#ff6b4a" }}>Sealed Facility patrol</b><span>The deepest, densest tunnels. Star-5 threats. Big rep, big pressure relief.</span></button>}
      <button className="ten-choice" onClick={onSleep}><b style={{ color: "#3ec995" }}>Sleep in quarters</b><span>Full rest. The day ends; the sector keeps filling.</span></button>
    </div>

    <Panel style={{ marginBottom: 14, borderColor: "rgba(232,200,120,0.3)" }}>
      <p className="section-label" style={{ color: "#e8c878" }}>Sector works</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        {Object.entries(WORKS).map(([k, W]) => { const lvl = d.works[k] || 0; const cost = W.base + lvl * W.base; return <div key={k} style={{ padding: 10, borderRadius: 10, border: `1px solid ${W.color}44` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ color: W.color, fontSize: 13 }}>{W.name}</b><span style={{ fontSize: 11, opacity: 0.6 }}>Lv {lvl}/{W.max}</span></div>
          <p style={{ fontSize: 11, margin: "4px 0 8px" }}>{W.desc}</p>
          <Btn small variant="primary" disabled={lvl >= W.max || bronze < cost} onClick={() => build(k)}>{lvl >= W.max ? "Complete" : `Build (${cost} B)`}</Btn>
        </div>; })}
      </div>
    </Panel>

    {potions.length > 0 && <Panel style={{ marginBottom: 10 }}><p className="section-label">Potions</p><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{potions.map(p => <Btn key={p.id} small variant="success" onClick={() => usePotion(p)}>{p.name} x{p.count}</Btn>)}</div></Panel>}
    {log.length > 0 && <div style={{ maxHeight: 150, overflowY: "auto", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12, lineHeight: 1.8, background: "rgba(0,0,0,0.25)" }}>{log.slice(-30).map(l => <div key={l.id} style={{ color: LOG_C[l.type] || "#ccc" }}>{l.msg}</div>)}</div>}
  </div>;
}
