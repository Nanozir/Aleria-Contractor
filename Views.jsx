// Views.jsx
import React, { useState, useEffect, useRef } from "react";
import { SFX } from "./AudioEngine";
import { WEAPONS, ARMORS, POTIONS, TOOLS, SKILLS, SLEEP, HOUSE_PRICE, M_ACT, POTIONS as GameDataPotions } from "./GameData";
import { Panel, Btn, Tag, Bar, StarRating, fmt } from "./UIComponents";

export function ShopView({ bronze, setBronze, weapon, setWeapon, weapon2, setWeapon2, armor, setArmor, ownedWeapons, setOwnedWeapons, ownedArmors, setOwnedArmors, myTools, setMyTools, setPotions, setStats, race, notify, adjustedPrice, shopDiscount, craftedShop }) {
  function buyOrEquipWeapon(w, setEq) {
    const owned = ownedWeapons.includes(w.id);
    if (!owned) { const adj = adjustedPrice(w.price); if (bronze < adj) return; setBronze(b => b - adj); setOwnedWeapons(p => [...p, w.id]); notify(`Bought ${w.name}.`, "#a8740c"); SFX.buy(); }
    setEq(w); SFX.click();
  }
  function buyOrEquipArmor(a) {
    const owned = ownedArmors.includes(a.id);
    if (!owned) { const adj = adjustedPrice(a.price); if (bronze < adj) return; setBronze(b => b - adj); setOwnedArmors(p => [...p, a.id]); notify(`Bought ${a.name}.`, "#a8740c"); SFX.buy(); }
    setArmor(a); SFX.click();
  }
  
  const allWeapons = [...WEAPONS, ...craftedShop];
  
  // NY LOGIK: Filtrera potions baserat på typ
  const hpPotions = POTIONS.filter(p => p.stat === "hp");
  const mpPotions = POTIONS.filter(p => p.stat === "mp");
  const staPotions = POTIONS.filter(p => p.stat === "stamina");

  // NY LOGIK: Hjälpfunktion för att rendera en rad med potions
  const renderPotions = (title, list) => {
    if (list.length === 0) return null;
    return (
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 12, color: "rgba(200,192,248,0.45)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 7 }}>
          {list.map(p => {
            const adj = adjustedPrice(p.price); 
            return (
              <Panel key={p.id} style={{ opacity: bronze >= adj ? 1 : 0.4 }}>
                <p style={{ fontWeight: 600, fontSize: 12, color: "#d4cbf8", marginBottom: 2 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: "rgba(200,192,248,0.4)", marginBottom: 8 }}>+{p.val} {p.stat.toUpperCase()}</p>
                <Btn small variant="success" disabled={bronze < adj} onClick={() => { 
                  setBronze(b => b - adj); 
                  setPotions(prev => [...prev, p]); 
                  SFX.buy(); 
                  notify(`Bought ${p.name}`, "#1a7a4f"); 
                }}>{adj} B</Btn>
              </Panel>
            );
          })}
        </div>
      </div>
    );
  };

  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Shop</h2>
    <p style={{ fontSize: 12, color: "rgba(200,192,248,0.4)", marginBottom: 16 }}>Balance: {fmt(bronze)}{shopDiscount() > 0 && <span style={{ color: "#3ec995", marginLeft: 8 }}>· {Math.round(shopDiscount() * 100)}% discount</span>}</p>
    
    <p style={{ fontSize: 13, color: "rgba(200,192,248,0.55)", marginBottom: 8, fontWeight: 600, marginTop: 20 }}>Primary weapon</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
      {allWeapons.map(w => {
        const owned = ownedWeapons.includes(w.id); const adj = w.price === 0 ? 0 : adjustedPrice(w.price); const aff = bronze >= adj; const eq = weapon.id === w.id; return <Panel key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: owned || aff ? 1 : 0.45, boxShadow: w.isCrafted ? "0 0 10px rgba(255,217,102,0.2)" : "none", borderColor: w.isCrafted ? "#ffd966" : "rgba(255,255,255,0.1)" }}>
          <div style={{ flex: 1 }}><div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 2 }}><span style={{ fontWeight: 600, fontSize: 13, color: w.isCrafted ? "#ffd966" : "#d4cbf8" }}>{w.name}</span><span style={{ fontSize: 11, color: "rgba(200,192,248,0.45)" }}>+{w.atk} ATK</span></div></div>
          {eq ? <Tag color="#3ec995">Equipped</Tag> : owned ? <Btn small variant="primary" onClick={() => buyOrEquipWeapon(w, setWeapon)}>Equip</Btn> : <Btn small variant={w.isCrafted ? "gold" : "amber"} disabled={!aff} onClick={() => buyOrEquipWeapon(w, setWeapon)}>{w.price === 0 ? "Equip" : `${adj} B`}</Btn>}
        </Panel>;
      })}
    </div>
    
    {race?.id === "tetrabrachian" && <>
      <p style={{ fontSize: 13, color: "rgba(200,192,248,0.55)", marginBottom: 8, fontWeight: 600, marginTop: 20 }}>Secondary weapon <span style={{ fontSize: 10, color: "#e0a523", fontWeight: 400, marginLeft: 6 }}>−3 DEF</span></p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {allWeapons.map(w => {
          const owned = ownedWeapons.includes(w.id); const adj = w.price === 0 ? 0 : adjustedPrice(w.price); const eq = weapon2.id === w.id; return <Panel key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, boxShadow: w.isCrafted ? "0 0 10px rgba(255,217,102,0.2)" : "none", borderColor: w.isCrafted ? "#ffd966" : "rgba(255,255,255,0.1)" }}>
            <div style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 13, color: w.isCrafted ? "#ffd966" : "#d4cbf8" }}>{w.name}</span><span style={{ fontSize: 11, color: "rgba(200,192,248,0.45)", marginLeft: 8 }}>+{w.atk} ATK</span></div>
            {eq ? <Tag color="#3ec995">Off-hand</Tag> : owned ? <Btn small variant="primary" onClick={() => buyOrEquipWeapon(w, setWeapon2)}>Equip</Btn> : <Btn small variant={w.isCrafted ? "gold" : "amber"} disabled={bronze < adj} onClick={() => buyOrEquipWeapon(w, setWeapon2)}>{w.price === 0 ? "Equip" : `${adj} B`}</Btn>}
          </Panel>;
        })}
      </div>
    </>}
    
    <p style={{ fontSize: 13, color: "rgba(200,192,248,0.55)", marginBottom: 8, fontWeight: 600, marginTop: 20 }}>Armor</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
      {ARMORS.map(a => {
        const owned = ownedArmors.includes(a.id); const adj = a.price === 0 ? 0 : adjustedPrice(a.price); const aff = bronze >= adj; const eq = armor.id === a.id; return <Panel key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: owned || aff ? 1 : 0.45 }}>
          <div style={{ flex: 1 }}><div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 2 }}><span style={{ fontWeight: 600, fontSize: 13, color: "#d4cbf8" }}>{a.name}</span><span style={{ fontSize: 11, color: "rgba(200,192,248,0.45)" }}>+{a.def} DEF</span></div></div>
          {eq ? <Tag color="#3ec995">Equipped</Tag> : owned ? <Btn small variant="primary" onClick={() => buyOrEquipArmor(a)}>Equip</Btn> : <Btn small variant="amber" disabled={!aff} onClick={() => buyOrEquipArmor(a)}>{a.price === 0 ? "Equip" : `${adj} B`}</Btn>}
        </Panel>;
      })}
    </div>
    
    <p style={{ fontSize: 13, color: "rgba(200,192,248,0.55)", marginBottom: 8, fontWeight: 600, marginTop: 20 }}>Foci & Charms</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 7, marginBottom: 16 }}>
      {TOOLS.map(t => {
        const owned = myTools.find(x => x.id === t.id); const adj = adjustedPrice(t.price); const aff = bronze >= adj; return <Panel key={t.id} style={{ opacity: aff || owned ? 1 : 0.45 }}>
          <p style={{ fontWeight: 600, fontSize: 12, color: "#d4cbf8", marginBottom: 2 }}>{t.name}</p>
          <p style={{ fontSize: 11, color: "rgba(200,192,248,0.4)", marginBottom: 8 }}>{t.desc}</p>
          {owned ? <Tag color="#3ec995">Equipped</Tag> : <Btn small variant="primary" disabled={!aff} onClick={() => { setBronze(b => b - adj); setMyTools(p => [...p, t]); setStats(s => ({ ...s, [t.stat]: s[t.stat] + t.val })); SFX.buy(); notify(`Equipped ${t.name}`, "#5b4fd4"); }}>{adj} B</Btn>}
        </Panel>;
      })}
    </div>
    
    <p style={{ fontSize: 13, color: "rgba(200,192,248,0.55)", marginBottom: 8, fontWeight: 600, marginTop: 20 }}>Potions</p>
    {/* NY LOGIK: Anropa hjälpfunktionen för varje kategori */}
    {renderPotions("Health", hpPotions)}
    {renderPotions("Mana", mpPotions)}
    {renderPotions("Stamina", staPotions)}
  </div>;
}

export function SpellsView({ spells, race, spellStudiedToday, studySpell, allSpells }) {
  if (!race?.canSpell) return <div><h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Spells</h2><p style={{ fontSize: 13, color: "rgba(200,192,248,0.55)" }}>Your kind doesn't work with spells.</p></div>;
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Spell research</h2>
    <p style={{ fontSize: 12, color: "rgba(200,192,248,0.45)", marginBottom: 20 }}>Study once per day per node. Sleep affects research speed.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {spells.map(sp => {
        const prereqMet = sp.prereq === null || allSpells.find(s => s.id === sp.prereq)?.learned; const studied = spellStudiedToday[sp.id]; return <Panel key={sp.id} style={{ opacity: (!prereqMet && !sp.learned) ? 0.3 : 1, borderColor: sp.learned ? "rgba(62,201,149,0.3)" : "rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><p style={{ fontWeight: 700, fontSize: 13, color: sp.learned ? "#3ec995" : "#d4cbf8" }}>{sp.name}</p><span style={{ fontSize: 11, color: sp.learned ? "#3ec995" : prereqMet ? "rgba(200,192,248,0.5)" : "rgba(200,192,248,0.25)" }}>{sp.learned ? "Learned" : prereqMet ? `${sp.progress}/100` : "Locked"}</span></div>
          <p style={{ fontSize: 12, color: "rgba(200,192,248,0.5)", lineHeight: 1.65, marginBottom: prereqMet && !sp.learned ? 10 : 6 }}>{sp.desc}</p>
          {prereqMet && !sp.learned && <><div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 3, height: 5, marginBottom: 10 }}><div style={{ width: `${sp.progress}%`, height: "100%", background: "#a89df0" }} /></div><Btn small variant="primary" disabled={studied} onClick={() => studySpell(sp.id)}>{studied ? "Studied today" : "Study ↗"}</Btn></>}
          {sp.learned && sp.combatUse && <div style={{ display: "flex", gap: 6 }}><Tag color="#a89df0">{sp.combatUse.label}</Tag><span style={{ fontSize: 11, color: "rgba(200,192,248,0.35)" }}>{sp.combatUse.mpCost} MP</span></div>}
        </Panel>;
      })}
    </div>
  </div>;
}

export function SkillsView({ unlockedSkills, revealedSkills, totalKills, nearDeathWins, totalEarned, day, spells, techniqueUnlocked }) {
  const ctx = { kills: totalKills, nearDeath: nearDeathWins, earned: totalEarned, days: day, spellsLearned: spells.filter(s => s.learned).length };
  const locked = SKILLS.filter(sk => !unlockedSkills.find(u => u.id === sk.id));
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Skills</h2>
    <p style={{ fontSize: 12, color: "rgba(200,192,248,0.45)", marginBottom: 20 }}>Unlock by fulfilling requirements. Visit church to learn what each does.</p>
    {unlockedSkills.length > 0 && <><p style={{ fontSize: 12, color: "rgba(62,201,149,0.7)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.05em" }}>UNLOCKED</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {unlockedSkills.map(sk => { const r = revealedSkills.includes(sk.id); return <Panel key={sk.id} style={{ borderColor: "rgba(62,201,149,0.3)" }}><p style={{ fontWeight: 700, fontSize: 13, color: "#3ec995", marginBottom: 4 }}>{sk.name}</p><p style={{ fontSize: 12, color: "rgba(200,192,248,0.55)", lineHeight: 1.65 }}>{r ? sk.desc : "Visit Church to reveal."}</p></Panel>; })}
      </div></>}
    {locked.length > 0 && <><p style={{ fontSize: 12, color: "rgba(200,192,248,0.5)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.05em" }}>IN PROGRESS</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {locked.map(sk => { const cur = ctx[sk.reqType] || 0; return <Panel key={sk.id} style={{ opacity: 0.85 }}><p style={{ fontWeight: 600, fontSize: 13, color: "rgba(200,192,248,0.7)", marginBottom: 4 }}>???</p><p style={{ fontSize: 11, color: "rgba(200,192,248,0.5)", marginBottom: 8 }}>{sk.reqLabel} — {cur}/{sk.reqVal}</p><Bar val={Math.min(cur, sk.reqVal)} max={sk.reqVal} color="#a89df0" h={5} /></Panel>; })}
      </div></>}
    {techniqueUnlocked && <Panel style={{ borderColor: "rgba(232,165,35,0.35)", marginTop: 14 }}><p style={{ fontWeight: 700, fontSize: 13, color: "#e0a523", marginBottom: 4 }}>Technique — unnamed</p><p style={{ fontSize: 12, color: "rgba(200,192,248,0.5)" }}>Something changed.</p></Panel>}
  </div>;
}

export function ChurchView({ race, bronze, churchCost, unlockedSkills, revealedSkills, visitChurch, leftUnderworld }) {
  if (race?.id === "devil" && !leftUnderworld) return <div><h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Church</h2><p style={{ fontSize: 13, color: "rgba(200,192,248,0.4)" }}>You don't enter churches in the Underworld.</p></div>;
  const cost = race?.id === "devil" ? Math.round(churchCost * 1.5) : churchCost;
  const undisc = unlockedSkills.filter(sk => !revealedSkills.includes(sk.id));
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Church of Ucliat</h2>
    <p style={{ fontSize: 12, color: "rgba(200,192,248,0.45)", marginBottom: 20 }}>Pay the priest to learn what each unlocked Skill does. {cost} Bronze per reading{race?.id === "devil" ? " (devils pay 50% more)" : ""}.</p>
    {undisc.length === 0 ? <p style={{ fontSize: 13, color: "rgba(200,192,248,0.4)" }}>No undisclosed Skills.</p> : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {undisc.map(sk => (<Panel key={sk.id}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><p style={{ fontWeight: 700, fontSize: 13, color: "#d4cbf8" }}>{sk.name}</p><Tag color="#a8740c">{cost} B</Tag></div><Btn small variant="primary" disabled={bronze < cost} onClick={() => visitChurch(sk.id)}>Reveal ↗</Btn></Panel>))}
    </div>}
  </div>;
}

export function GuildView({ advRankIdx, hasBadge, xp, daysSinceContract, RANKS, RANK_MULT, RANK_THRESHOLDS, GRACE }) {
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Alabastrine Guild</h2>
    {!hasBadge ? <Panel style={{ borderColor: "rgba(184,58,42,0.4)" }}><p style={{ fontWeight: 700, fontSize: 14, color: "#e85c3a", marginBottom: 6 }}>Badge revoked</p></Panel> : <>
      <Panel style={{ marginBottom: 14, background: "linear-gradient(180deg,rgba(232,185,56,0.1),rgba(232,185,56,0.02))", borderColor: "rgba(232,185,56,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><p style={{ fontWeight: 700, fontSize: 18, color: "#e0a523" }}>{RANKS[advRankIdx]}</p>{advRankIdx === 5 && <Tag color="#ffd966" glow>MAX</Tag>}</div>
        <p style={{ fontSize: 11, color: "rgba(232,185,56,0.65)", marginBottom: 8 }}>Earnings ×{RANK_MULT[advRankIdx]}</p>
        {advRankIdx < 5 && <><Bar val={Math.min(xp, RANK_THRESHOLDS[advRankIdx])} max={RANK_THRESHOLDS[advRankIdx]} color="#e0a523" h={8} /><p style={{ fontSize: 11, color: "rgba(232,185,56,0.5)", marginTop: 5 }}>{xp}/{RANK_THRESHOLDS[advRankIdx]} XP</p></>}
      </Panel>
      {GRACE[advRankIdx] && <Panel><p style={{ fontWeight: 600, fontSize: 13, color: "#d4cbf8", marginBottom: 8 }}>Activity</p><p style={{ fontSize: 12, color: "rgba(200,192,248,0.55)", lineHeight: 1.7 }}>Take a contract within {GRACE[advRankIdx][2] - daysSinceContract} days. Days idle: {daysSinceContract}/{GRACE[advRankIdx][2]}</p></Panel>}
    </>}
  </div>;
}

export function SleepView({ housing, chooseHousing, bronze, ownsHouse, buyHouse }) {
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d4cbf8", marginBottom: 6 }}>Sleep</h2>
    <p style={{ fontSize: 12, color: "rgba(200,192,248,0.45)", marginBottom: 20 }}>Where you rest affects recovery, Doomsday speed, and spell research.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {SLEEP.map(o => {
        const cur = housing === o.id; const aff = o.cost === 0 || bronze >= o.cost; const need = o.id === "owned_house" && !ownsHouse; return <Panel key={o.id} style={{ opacity: need ? 0.4 : 1, borderColor: cur ? "rgba(62,201,149,0.4)" : "rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}><p style={{ fontWeight: 700, fontSize: 14, color: "#d4cbf8" }}>{o.name}</p><span style={{ fontSize: 11, color: "rgba(200,192,248,0.5)" }}>{o.cost > 0 ? `${o.cost} B/night` : need ? "Need house" : "Free"}</span></div>
          <p style={{ fontSize: 12, color: "rgba(200,192,248,0.5)", lineHeight: 1.65, marginBottom: 8 }}>{o.desc}</p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}><Tag color="#e85c3a">HP {Math.round(o.hpRec * 100)}%</Tag><Tag color="#a89df0">MP {Math.round(o.mpRec * 100)}%</Tag><Tag color="#3ec995">Sta {Math.round(o.staRec * 100)}%</Tag><Tag color="#e0a523">Doom +{o.doomGain}</Tag><Tag color="#7c6fd4">Study ×{o.spellMult}</Tag></div>
          <Btn small variant={cur ? "success" : "primary"} disabled={!aff || need} onClick={() => chooseHousing(o.id)}>{cur ? "Selected" : "Select"}</Btn>
        </Panel>;
      })}
    </div>
    {!ownsHouse && <Panel style={{ marginTop: 18, borderColor: "rgba(232,185,56,0.3)", background: "linear-gradient(180deg,rgba(232,185,56,0.08),rgba(232,185,56,0.02))" }}>
      <p style={{ fontWeight: 700, fontSize: 14, color: "#e0a523", marginBottom: 6 }}>Buy a house</p>
      <p style={{ fontSize: 12, color: "rgba(200,192,248,0.55)", lineHeight: 1.65, marginBottom: 12 }}>{HOUSE_PRICE} Bronze. Best rest, no nightly cost.</p>
      <Btn variant="amber" disabled={bronze < HOUSE_PRICE} onClick={buyHouse}>{bronze < HOUSE_PRICE ? `Need ${HOUSE_PRICE} B` : "Purchase ↗"}</Btn>
    </Panel>}
  </div>;
}

export function CityView({ bronze, setBronze, cityLevel, setCityLevel, setStats, notify }) {
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8c878", marginBottom: 6 }}>Underworld City Builder</h2>
    <p style={{ fontSize: 12, color: "rgba(232,200,120,0.65)", marginBottom: 20 }}>Rebuild the sector. Upgrades give permanent stat boosts.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel style={{ borderColor: "rgba(168,157,240,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#a89df0" }}>Mana Pump (Lv {cityLevel.pump})</p>
          <Btn small variant="primary" disabled={bronze < 500} onClick={() => { setBronze(b => b - 500); setCityLevel(c => ({ ...c, pump: c.pump + 1 })); setStats(s => ({ ...s, maxMp: s.maxMp + 5 })); notify("Pump upgraded! +5 Max MP", "#a89df0"); }}>Buy (500 B)</Btn>
        </div>
        <p style={{ fontSize: 11, color: "rgba(200,192,248,0.5)" }}>Increases Max MP by 5 per level.</p>
      </Panel>
      <Panel style={{ borderColor: "rgba(232,92,58,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#e85c3a" }}>Obsidian Walls (Lv {cityLevel.walls})</p>
          <Btn small variant="danger" disabled={bronze < 500} onClick={() => { setBronze(b => b - 500); setCityLevel(c => ({ ...c, walls: c.walls + 1 })); setStats(s => ({ ...s, maxHp: s.maxHp + 5 })); notify("Walls upgraded! +5 Max HP", "#e85c3a"); }}>Buy (500 B)</Btn>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,200,180,0.5)" }}>Increases Max HP by 5 per level.</p>
      </Panel>
    </div>
  </div>;
}

export function CraftView({ bronze, setBronze, craftMats, setCraftMats, setOwnedWeapons, setPotions, notify, setCraftedShop }) {
  const [mini, setMini] = useState(null);
  
  // Smith Minigame
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const [dir, setDir] = useState(1);
  const [hits, setHits] = useState(0);
  const [smithScore, setSmithScore] = useState(0);

  // Potion Minigame
  const [potionDiff, setPotionDiff] = useState(null);
  const [potionTarget, setPotionTarget] = useState("");
  const [potionMix, setPotionMix] = useState([]);
  
  // Recept och färger för de olika svårighetsgraderna
  const P_RECIPES = {
    easy: { "Purple": ["Red", "Blue"], "Green": ["Yellow", "Blue"], "Orange": ["Red", "Yellow"] },
    normal: { "Teal": ["Blue", "White"], "Pink": ["Red", "White"], "Brown": ["Red", "Yellow", "Blue"] },
    hard: { "Dark Purple": ["Red", "Blue", "Black"], "Lime": ["Yellow", "Blue", "White"], "Crimson": ["Red", "Black"] }
  };
  const P_COLORS = {
    easy: ["Red", "Blue", "Yellow"],
    normal: ["Red", "Blue", "Yellow", "White"],
    hard: ["Red", "Blue", "Yellow", "White", "Black"]
  };

  useEffect(() => {
    if (mini !== "smith") return;
    const t = setInterval(() => {
      setPos(p => {
        let next = p + dir * 4; 
        if (next >= 100) { next = 100; setDir(-1); }
        if (next <= 0) { next = 0; setDir(1); }
        posRef.current = next; return next;
      });
    }, 30);
    return () => clearInterval(t);
  }, [mini, dir]);

  const startPotion = (diff) => {
    setPotionDiff(diff);
    const colors = Object.keys(P_RECIPES[diff]);
    setPotionTarget(colors[Math.floor(Math.random() * colors.length)]);
    setPotionMix([]);
    setMini("potion");
  };

  const mixColor = (c) => {
    const reqColors = P_RECIPES[potionDiff][potionTarget];
    if (potionMix.length >= reqColors.length) return;
    
    const newMix = [...potionMix, c];
    setPotionMix(newMix);
    if(window.SFX && window.SFX.click) window.SFX.click(); 
    
    if (newMix.length === reqColors.length) { 
      const correct = reqColors.every(req => newMix.includes(req));
      setTimeout(() => {
        if (correct) {
          // NY LOGIK: Välj slumpmässig typ av dryck (HP, MP eller Stamina)
          const potionTypes = ["hp", "mp", "stamina"];
          const chosenType = potionTypes[Math.floor(Math.random() * potionTypes.length)];
          
          let midPot, highPot, masterPot;
          
          if (chosenType === "hp") {
            midPot = { id: "hp_med", name: "Health (Mid)", stat: "hp", val: 70, price: 60 };
            highPot = { id: "hp_high", name: "Health (High)", stat: "hp", val: 150, price: 130 };
            masterPot = { id: "master_hp", name: "Masterwork Health", stat: "hp", val: 110, price: 80 }; 
          } else if (chosenType === "mp") {
            midPot = { id: "mp_med", name: "Mana (Mid)", stat: "mp", val: 50, price: 75 };
            highPot = { id: "mp_high", name: "Mana (High)", stat: "mp", val: 120, price: 120 };
            masterPot = { id: "master_mp", name: "Masterwork Mana", stat: "mp", val: 80, price: 90 };
          } else {
            midPot = { id: "sta_med", name: "Stamina (Mid)", stat: "stamina", val: 60, price: 55 };
            highPot = { id: "sta_high", name: "Stamina (High)", stat: "stamina", val: 120, price: 110 };
            masterPot = { id: "master_sta", name: "Masterwork Stamina", stat: "stamina", val: 90, price: 65 };
          }

          if (potionDiff === "easy") {
             setPotions(p => [...p, midPot]);
             notify(`Perfect brew! Created ${midPot.name}`, "#3ec995");
          } else {
             const masterwork = Math.random() > (potionDiff === "hard" ? 0.3 : 0.6);
             if (masterwork) {
                setPotions(p => [...p, masterPot]);
                notify(`Legendary! ${masterPot.name} Brewed!`, "#ffd966");
             } else {
                setPotions(p => [...p, highPot]);
                notify(`Perfect brew! Created ${highPot.name}`, "#3ec995");
             }
          }
        } else {
          notify("The vial exploded. Failed brew.", "#d84838");
        }
        setMini(null);
        setPotionDiff(null);
      }, 500);
    }
  };

  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffd966", marginBottom: 6 }}>Workshop</h2>
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <Tag color="#a8740c">Metal: {craftMats.metal}</Tag><Tag color="#3ec995">Herb: {craftMats.herb}</Tag>
    </div>

    {!mini ? <>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn small onClick={() => { if (bronze >= 35) { setBronze(b => b - 35); setCraftMats(m => ({ ...m, metal: m.metal + 1 })); if(window.SFX) window.SFX.buy(); } else notify("Need 35 B", "#d84838"); }}>Buy Metal (35 B)</Btn>
        <Btn small onClick={() => { if (bronze >= 15) { setBronze(b => b - 15); setCraftMats(m => ({ ...m, herb: m.herb + 1 })); if(window.SFX) window.SFX.buy(); } else notify("Need 15 B", "#d84838"); }}>Buy Herb (15 B)</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <Panel onClick={() => { if (craftMats.metal >= 2) { setCraftMats(m => ({ ...m, metal: m.metal - 2 })); setMini("smith"); setHits(0); setSmithScore(0); setPos(0); posRef.current = 0; } else notify("Need 2 Metal", "#d84838"); }}>
          <b style={{ color: "#e0a523" }}>Smith Weapon (2 Metal)</b>
        </Panel>
        
        <Panel style={{ borderColor: "rgba(62,201,149,0.4)" }}>
          <b style={{ color: "#3ec995", display: "block", marginBottom: 10 }}>Brew Potion (2 Herb)</b>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small variant="success" onClick={() => { if (craftMats.herb >= 2) { setCraftMats(m => ({ ...m, herb: m.herb - 2 })); startPotion("easy"); } else notify("Need 2 Herb", "#d84838"); }}>Easy</Btn>
            <Btn small variant="amber" onClick={() => { if (craftMats.herb >= 2) { setCraftMats(m => ({ ...m, herb: m.herb - 2 })); startPotion("normal"); } else notify("Need 2 Herb", "#d84838"); }}>Normal</Btn>
            <Btn small variant="danger" onClick={() => { if (craftMats.herb >= 2) { setCraftMats(m => ({ ...m, herb: m.herb - 2 })); startPotion("hard"); } else notify("Need 2 Herb", "#d84838"); }}>Hard</Btn>
          </div>
        </Panel>
      </div>
    </> : mini === "smith" ? (
      <Panel style={{ textAlign: "center", borderColor: "#e0a523" }}>
        <b style={{ color: "#e0a523", fontSize: 16 }}>Forging...</b>
        <p style={{ fontSize: 12, marginBottom: 20 }}>Strike the anvil! Yellow is Good (1 pt), Green is Perfect (2 pts).</p>
        <div style={{ width: "100%", height: 30, background: "rgba(0,0,0,0.5)", position: "relative", marginBottom: 20, borderRadius: 4 }}>
          <div style={{ position: "absolute", left: "30%", width: "40%", height: "100%", background: "rgba(232,185,56,0.5)" }} />
          <div style={{ position: "absolute", left: "45%", width: "10%", height: "100%", background: "rgba(62,201,149,0.8)" }} />
          <div style={{ position: "absolute", left: `${pos}%`, width: 4, height: "100%", background: "#fff", transform: "translateX(-50%)" }} />
        </div>
        
        <Btn variant="gold" onClick={() => {
          const currentPos = posRef.current;
          const isPerfect = currentPos >= 45 && currentPos <= 55;
          const isGood = currentPos >= 30 && currentPos <= 70;
          
          let points = 0;
          if (isPerfect) { points = 2; if(window.SFX) window.SFX.anvilHit(); } 
          else if (isGood) { points = 1; if(window.SFX) window.SFX.anvilHit(); } 
          else { if(window.SFX) window.SFX.anvilMiss(); }
          
          setSmithScore(s => s + points);
          
          if (hits + 1 >= 8) {
            setMini(null);
            const finalScore = smithScore + points;
            
            if (finalScore >= 13) {
              const newWep = { id: "craft_" + Date.now(), name: "Masterwork Blade", atk: 45, price: 2500, isCrafted: true };
              setCraftedShop(prev => [...prev, newWep]); setOwnedWeapons(w => [...w, newWep.id]);
              notify("Legendary Mastercraft created!", "#ffd966");
            } else if (finalScore >= 7) {
              const newWep = { id: "craft_" + Date.now(), name: "Forged Steel", atk: 20, price: 800, isCrafted: true };
              setOwnedWeapons(w => [...w, newWep.id]);
              notify("Forged a solid weapon.", "#3ec995");
            } else {
              setBronze(b => b + finalScore * 20);
              notify(`Scrap metal. Salvaged ${finalScore * 20} B.`, "#e85c3a");
            }
          } else { setHits(h => h + 1); }
        }}>Strike Anvil</Btn>
        <p style={{ fontSize: 11, marginTop: 15 }}>Strikes: {hits}/8 | Score: {smithScore}/16</p>
      </Panel>
    ) : (
      <Panel style={{ textAlign: "center", borderColor: "#3ec995" }}>
        <b style={{ color: "#3ec995", fontSize: 16 }}>Pouring Vials...</b>
        <p style={{ fontSize: 13, margin: "10px 0 20px" }}>Target Mixture: <strong style={{ color: potionTarget.toLowerCase() }}>{potionTarget}</strong></p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          {P_COLORS[potionDiff].map(c => (
            <div key={c} onClick={() => mixColor(c)} style={{ width: 50, height: 80, background: c.toLowerCase(), borderRadius: "0 0 20px 20px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.5)", opacity: potionMix.length < P_RECIPES[potionDiff][potionTarget].length ? 1 : 0.5 }} />
          ))}
        </div>
        <p style={{ fontSize: 11 }}>Vial contains: {potionMix.join(" + ") || "Empty"}</p>
      </Panel>
    )}
  </div>;
}
export function GambleView({ bronze, setBronze, notify, setTotalEarned }) {
  const [wheelAng, setWheelAng] = useState(0);
  const [wheelSp, setWheelSp] = useState(false);
  const [bjPlayer, setBjPlayer] = useState([]);
  const [bjDealer, setBjDealer] = useState([]);
  const [bjState, setBjState] = useState("idle");
  const [bjBet, setBjBet] = useState(0);
  const [bjMsg, setBjMsg] = useState("");

  function spinWheel(bet) {
    if (wheelSp || bronze < bet) return notify("Cannot spin.", "#d84838");
    setBronze(b => b - bet); setWheelSp(true); SFX.spin?.() || SFX.click();
    const final = wheelAng + 1080 + Math.floor(Math.random() * 360);
    setWheelAng(final);
    setTimeout(() => {
      const slot = Math.floor(((360 - (((final % 360) + 360) % 360)) % 360) / 45);
      const mults = [0, 2, 0, 1.5, 0, 5, 0, 10]; // 8 slots
      const win = Math.floor(bet * mults[slot]);
      if (win > 0) { setBronze(b => b + win); setTotalEarned(t => t + win); notify(`Won ${win} B!`, "#ffd966"); if (mults[slot] >= 5) SFX.reward(); else SFX.reward(); }
      else { notify("Lost.", "#d84838"); SFX.defeat(); }
      setWheelSp(false);
    }, 2500);
  }

  function dC() { const v = Math.floor(Math.random() * 13) + 1; return v > 10 ? 10 : v === 1 ? 11 : v; }
  function vH(h) { let v = h.reduce((a, b) => a + b, 0), a = h.filter(c => c === 11).length; while (v > 21 && a > 0) { v -= 10; a--; } return v; }

  function startBj(bet) {
    if (bronze < bet) return notify("Cannot bet.", "#d84838");
    setBronze(b => b - bet); setBjBet(bet); setBjPlayer([dC(), dC()]); setBjDealer([dC(), dC()]); setBjState("playing"); setBjMsg("");
  }
  function hitBj() {
    const np = [...bjPlayer, dC()]; setBjPlayer(np);
    if (vH(np) > 21) { setBjState("done"); setBjMsg("Bust! You lose."); SFX.defeat(); }
  }
  function standBj() {
    let nd = [...bjDealer]; while (vH(nd) < 17) nd.push(dC());
    setBjDealer(nd); setBjState("done");
    const pv = vH(bjPlayer), dv = vH(nd);
    if (dv > 21 || pv > dv) { const win = bjBet * 2; setBronze(b => b + win); setTotalEarned(t => t + win); setBjMsg(`You win ${win} B!`); SFX.reward(); }
    else if (pv === dv) { setBronze(b => b + bjBet); setTotalEarned(t => t + bjBet); setBjMsg("Push. Bet returned."); }
    else { setBjMsg("Dealer wins."); SFX.defeat(); }
  }

  const Card = ({ v, hidden }) => <div style={{ width: 45, height: 65, background: hidden ? "linear-gradient(135deg,#5b4fd4,#1c164c)" : "#f2edff", color: hidden ? "#fff" : "#000", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18, boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>{hidden ? "?" : v === 11 ? "A" : v}</div>;

  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ff6bcb", marginBottom: 6 }}>Gambling Den</h2>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 15 }}>
      <Panel style={{ borderColor: "rgba(255,107,203,0.3)", textAlign: "center" }}>
        <b style={{ color: "#ff6bcb" }}>The Wheel</b>
        <div style={{ position: "relative", width: 160, height: 160, margin: "20px auto", overflow: "hidden", borderRadius: "50%" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "20px solid #fff", zIndex: 10, filter: "drop-shadow(0 0 5px #fff)" }} />
          {/* Hjulet som garanterat snurrar via inline transition */}
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "3px solid rgba(255,107,203,0.5)", transform: `rotate(${wheelAng}deg)`, transition: wheelSp ? "transform 2.5s cubic-bezier(0.1, 0.8, 0.2, 1)" : "none", background: "conic-gradient(#222 0 45deg, #3ec995 45deg 90deg, #222 90deg 135deg, #a89df0 135deg 180deg, #222 180deg 225deg, #e0a523 225deg 270deg, #222 270deg 315deg, #ff6bcb 315deg 360deg)" }} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{[10, 50, 200].map(b => <Btn key={b} small disabled={wheelSp || bronze < b} onClick={() => spinWheel(b)}>Spin {b}</Btn>)}</div>
      </Panel>

      <Panel style={{ borderColor: "rgba(62,201,149,0.3)" }}>
        <b style={{ color: "#3ec995" }}>Blackjack</b>
        {bjState === "idle" ? <div style={{ marginTop: 20 }}>{[50, 100, 500].map(b => <Btn key={b} small variant="success" style={{ marginRight: 8 }} disabled={bronze < b} onClick={() => startBj(b)}>Bet {b}</Btn>)}</div> :
          <div style={{ marginTop: 15 }}>
            <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 5px" }}>Dealer {bjState === "done" ? `(${vH(bjDealer)})` : ""}</p>
            <div style={{ display: "flex", gap: 5, marginBottom: 15 }}>{bjDealer.map((c, i) => <Card key={i} v={c} hidden={bjState === "playing" && i > 0} />)}</div>
            <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 5px" }}>You ({vH(bjPlayer)})</p>
            <div style={{ display: "flex", gap: 5, marginBottom: 15 }}>{bjPlayer.map((c, i) => <Card key={i} v={c} />)}</div>

            {bjState === "playing" ? <div style={{ display: "flex", gap: 8 }}><Btn small variant="primary" onClick={hitBj}>Hit</Btn><Btn small variant="amber" onClick={standBj}>Stand</Btn></div> :
              <div><p style={{ fontWeight: "bold", color: bjMsg.includes("win") ? "#3ec995" : "#d84838" }}>{bjMsg}</p><Btn small onClick={() => setBjState("idle")}>Play Again</Btn></div>}
          </div>}
      </Panel>
    </div>
  </div>;
}

// --- SUB-COMPONENT: TENEBRIM REFLEX DRILL ---
function ReflexTraining({ physicalLevel, setPhysicalLevel, setScreen, notify, race }) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const spawnTimer = setInterval(() => {
      setTarget({ id: Date.now(), x: Math.floor(Math.random() * 85), y: Math.floor(Math.random() * 85) });
    }, Math.random() * 600 + 400);
    return () => clearInterval(spawnTimer);
  }, [active]);

  useEffect(() => {
    if (timeLeft <= 0 && active) {
      setActive(false);
      setTarget(null);
      const gains = Math.floor(score / 5);
      setPhysicalLevel(p => p + gains);
      notify(`Reflex training complete! +${gains} Physical Level`, "#e0a523");
      setTimeout(() => setScreen(race?.id === "tenebrim" ? "tenebrim_survival" : "overworld"), 2000);
    }
  }, [timeLeft, active, score, race, setPhysicalLevel, setScreen, notify]);

  const hitTarget = (e) => {
    e.stopPropagation();
    if (!active || !target) return;
    setScore(s => s + 1);
    setTarget(null);
    if (window.SFX && window.SFX.reflexHit) window.SFX.reflexHit(); // Uses the new ping sound
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2 style={{ color: "#e0a523", marginBottom: 15 }}>Reflex Training</h2>
      {!active && timeLeft === 15 ? (
        <Panel>
          <p style={{marginBottom: 15}}>Click the targets as fast as they appear. Speed and accuracy define your physical strength.</p>
          <Btn variant="amber" onClick={() => setActive(true)}>Start Drill</Btn>
        </Panel>
      ) : (
        <Panel style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
             <span style={{ fontSize: 18, fontWeight: "bold", color: "#e0a523" }}>Time: {timeLeft}s</span>
             <span style={{ fontSize: 18, fontWeight: "bold", color: "#3ec995" }}>Score: {score}</span>
          </div>
          <div style={{ height: 350, width: "100%", background: "rgba(0,0,0,0.6)", position: "relative", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden", cursor: "crosshair" }}>
            {target && (
              <div 
                onMouseDown={hitTarget}
                style={{ position: "absolute", left: `${target.x}%`, top: `${target.y}%`, width: 40, height: 40, background: "radial-gradient(circle, #e85c3a, #7a2311)", borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 10px #e85c3a", animation: "pulse 0.2s ease" }} 
              />
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: TETRABRACHIAN HEAVY LIFTING ---
function TetraWeightlifting({ physicalLevel, setPhysicalLevel, setScreen, notify }) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  
  // Visual states for smooth rendering
  const [barPos, setBarPos] = useState(10);
  const [targetPos, setTargetPos] = useState(50);

  // Mutable refs for high-performance 30fps math calculations
  const physics = useRef({ bar: 10, target: 50, score: 0, isLifting: false });

  useEffect(() => {
    if (!active) return;
    const fps = 30; 
    let tick = 0;
    
    const timer = setInterval(() => {
      tick++;
      if (tick % fps === 0) setTimeLeft(t => t - 1);

      // 1. Move the sweet spot erratically using sine waves
      const time = Date.now() / 800;
      physics.current.target = 50 + Math.sin(time) * 30 + Math.cos(time * 2.1) * 10; 
      physics.current.target = Math.max(15, Math.min(85, physics.current.target));

      // 2. Barbell gravity and lifting physics
      if (physics.current.isLifting) {
        physics.current.bar = Math.min(100, physics.current.bar + 3.0); // Lift up
      } else {
        physics.current.bar = Math.max(0, physics.current.bar - 4.0); // Heavy drop
      }

      // 3. Check collision (Barbell inside the moving target zone)
      if (Math.abs(physics.current.bar - physics.current.target) < 15) {
        physics.current.score += 1;
        
        // Play the mechanical tick sound every 10 points to indicate success without spamming
        if (physics.current.score % 10 === 0 && window.SFX && window.SFX.liftTick) {
            window.SFX.liftTick();
        }
      }

      // Sync refs to visual state
      setBarPos(physics.current.bar);
      setTargetPos(physics.current.target);
      setScore(Math.floor(physics.current.score / 10)); // Divide to make the score readable

    }, 1000 / fps);
    
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (timeLeft <= 0 && active) {
      setActive(false);
      const gains = Math.floor(score / 12); // Balance the stats
      setPhysicalLevel(p => p + gains);
      notify(`Heavy lifting complete! +${gains} Physical Level`, "#e85c3a");
      setTimeout(() => setScreen("overworld"), 2000);
    }
  }, [timeLeft, active, score, setPhysicalLevel, setScreen, notify]);

  // Touch & Mouse handlers
  const startLift = () => { physics.current.isLifting = true; };
  const stopLift = () => { physics.current.isLifting = false; };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2 style={{ color: "#e85c3a", marginBottom: 15 }}>Tetrabrachian Deadlifts</h2>
      {!active && timeLeft === 15 ? (
        <Panel>
          <p style={{marginBottom: 15}}>Hold the LIFT button to raise the barbell. Release to drop. Balance it inside the moving green zone!</p>
          <Btn variant="danger" onClick={() => setActive(true)}>Start Lifting</Btn>
        </Panel>
      ) : (
        <Panel style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
             <span style={{ fontSize: 18, fontWeight: "bold", color: "#e85c3a" }}>Time: {timeLeft}s</span>
             <span style={{ fontSize: 18, fontWeight: "bold", color: "#3ec995" }}>Score: {score}</span>
          </div>
          <div style={{ height: 300, width: 60, background: "rgba(0,0,0,0.6)", margin: "20px auto", position: "relative", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
            {/* The Moving Target Zone */}
            <div style={{ position: "absolute", bottom: `calc(${targetPos}% - 15%)`, width: "100%", height: "30%", background: "rgba(62,201,149,0.3)", borderTop: "2px solid #3ec995", borderBottom: "2px solid #3ec995" }} />
            {/* The Barbell */}
            <div style={{ position: "absolute", bottom: `${barPos}%`, left: "-20%", width: "140%", height: 10, background: "#e0a523", borderRadius: 4, boxShadow: "0 0 10px #e0a523", transform: "translateY(50%)" }} />
          </div>
          <div 
            onMouseDown={startLift} onMouseUp={stopLift} onMouseLeave={stopLift}
            onTouchStart={startLift} onTouchEnd={stopLift}
            style={{ padding: "20px 40px", fontSize: 18, background: "#e85c3a", color: "#fff", fontWeight: "bold", borderRadius: 8, cursor: "pointer", userSelect: "none" }}
          >
            HOLD TO LIFT
          </div>
        </Panel>
      )}
    </div>
  );
}

// --- MAIN ROUTER ---
export function TrainingView({ physicalLevel, setPhysicalLevel, setScreen, notify, race }) {
  // Route to the correct minigame based on Race
  if (race?.id === "tetrabrachian") {
    return <TetraWeightlifting physicalLevel={physicalLevel} setPhysicalLevel={setPhysicalLevel} setScreen={setScreen} notify={notify} />;
  } else {
    return <ReflexTraining physicalLevel={physicalLevel} setPhysicalLevel={setPhysicalLevel} setScreen={setScreen} notify={notify} race={race} />;
  }
}
export function EndgameView({ race, bronze, setBronze, stats, setStats, notify, onEnterArena, expeditions, setExpeditions, guildUpgrades, setGuildUpgrades }) {
  const [bazaarMultiplier, setBazaarMultiplier] = useState(1);

  // Equar: Bazaar Logik
  useEffect(() => {
    if (race?.id !== "equar") return;
    const t = setInterval(() => setBazaarMultiplier(Math.random() * 1.5 + 0.5), 10000);
    return () => clearInterval(t);
  }, [race]);

  const fundExpedition = () => {
    if (bronze < 1000) return;
    setBronze(b => b - 1000);
    notify("Mercenaries dispatched!", "#a89df0");
    if(window.SFX && window.SFX.buy) window.SFX.buy();
    
    // NY LOGIK: Modifiera tid och belöning baserat på uppgraderingar
    const duration = Math.max(5, 15 - (guildUpgrades.speed * 2)); // Blir 2 sekunder snabbare per level (minst 5s)
    const reward = 2500 + (guildUpgrades.reward * 500); // +500 B per level
    
    setExpeditions(prev => [
      ...prev,
      { id: Date.now() + Math.random(), duration: duration, timeLeft: duration, reward: reward }
    ]);
  };

  return <div>
    <h2 style={{ color: "#ffd966", fontSize: 24, marginBottom: 20 }}>New Dawn ({race?.name})</h2>

    {/* --- HUMAN ENDGAME --- */}
    {race?.id === "human" && <Panel>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* Vänster sida: Kontroller och Uppgraderingar */}
        <div style={{ flex: "1 1 250px" }}>
          <h3 style={{ color: "#a89df0", margin: "0 0 10px" }}>Mercenary Guild Commander</h3>
          <p style={{ fontSize: 13, marginBottom: 15 }}>Send lesser adventurers on contracts while you manage the realm. Use profits to expand the guild.</p>
          <Btn variant="primary" disabled={bronze < 1000} onClick={fundExpedition}>
            Fund Expedition (1000 B)
          </Btn>

          {/* Meningsfulla Guild-uppgraderingar */}
          <div style={{ marginTop: 25, padding: 15, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,157,240,0.3)", borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: "#e0a523", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Guild Infrastructure</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              
              <Btn small variant="amber" disabled={bronze < 15000} onClick={() => {
                setBronze(b => b - 15000); 
                setGuildUpgrades(u => ({ ...u, speed: u.speed + 1 }));
                notify("Logistics upgraded! Expeditions are 2s faster.", "#3ec995");
              }}>Logistics Lvl {guildUpgrades.speed} (15k B)</Btn>
              
              <Btn small variant="amber" disabled={bronze < 10000} onClick={() => {
                setBronze(b => b - 10000); 
                setGuildUpgrades(u => ({ ...u, reward: u.reward + 1 }));
                notify("Loot Appraiser upgraded! Expeditions yield +500 B.", "#3ec995");
              }}>Appraiser Lvl {guildUpgrades.reward} (10k B)</Btn>

            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Upgrades permanently improve your mercenary operations.</p>
          </div>
        </div>

        {/* Höger sida: Aktiv Tracker */}
        <div style={{ flex: "1 1 250px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: "bold", color: "#a89df0" }}>Active Squads</span>
            <Tag color="#a89df0">{expeditions.length}</Tag>
          </div>
          
          <div style={{ maxHeight: 210, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 5 }}>
            {expeditions.length === 0 ? (
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", textAlign: "center", marginTop: 20 }}>No active expeditions.</p>
            ) : (
              expeditions.map(exp => (
                <div key={exp.id} style={{ background: "rgba(168,157,240,0.08)", border: "1px solid rgba(168,157,240,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color: "#d4cbf8", fontWeight: 600 }}>Mercenary Squad</span>
                    <span style={{ color: "#3ec995", fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>{exp.timeLeft}s</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.6)", borderRadius: 99, display: "flex", justifyContent: "flex-end", overflow: "hidden" }}>
                    <div style={{ width: `${(exp.timeLeft / exp.duration) * 100}%`, height: "100%", background: "linear-gradient(90deg, #7b6fe4, #a89df0)", transition: "width 1s linear" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Panel>}

    {/* --- ÖVRIGA RASER --- */}
    {race?.id === "equar" && <Panel>
      <h3 style={{ color: "#e0a523", margin: "0 0 10px" }}>Grand Bazaar</h3>
      <p style={{ fontSize: 13, marginBottom: 15 }}>Trade vast quantities of Silk based on fluctuating global prices. Current Price Multiplier: <b style={{ color: bazaarMultiplier > 1 ? "#3ec995" : "#e85c3a" }}>{bazaarMultiplier.toFixed(2)}x</b></p>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="amber" disabled={bronze < 500 * bazaarMultiplier} onClick={() => { const cost = 500 * bazaarMultiplier; setBronze(b => b - cost); notify("Bought Silk!", "#e0a523"); }}>Buy Silk Cargo</Btn>
        <Btn variant="success" onClick={() => { const profit = 600 * bazaarMultiplier; setBronze(b => b + profit); notify("Sold Silk Cargo!", "#3ec995"); if(window.SFX && window.SFX.buy) window.SFX.buy(); }}>Sell Silk Cargo</Btn>
      </div>
    </Panel>}

    {race?.id === "tetrabrachian" && <Panel>
      <h3 style={{ color: "#e85c3a", margin: "0 0 10px" }}>The Colosseum</h3>
      <p style={{ fontSize: 13, marginBottom: 15 }}>Face waves of corrupted survivors in an endless onslaught for pure glory and immense riches.</p>
      <Btn variant="danger" onClick={onEnterArena}>Enter Arena</Btn>
    </Panel>}

    {race?.id === "tenebrim" && <Panel>
      <h3 style={{ color: "#7c6fd4", margin: "0 0 10px" }}>Shadow Weaver Contracts</h3>
      <p style={{ fontSize: 13, marginBottom: 15 }}>High-profile targets exist in the new world. Precision is everything.</p>
      <Btn variant="primary" disabled={bronze < 5000} onClick={() => {
        setBronze(b => b - 5000);
        notify("Target eliminated from the shadows. +100 Max HP", "#7c6fd4");
        setStats(s => ({ ...s, maxHp: s.maxHp + 100 }));
        if(window.SFX && window.SFX.attack) window.SFX.attack();
      }}>Assassinate Target (Costs 5000 B)</Btn>
    </Panel>}

    {race?.id === "devil" && <Panel>
      <h3 style={{ color: "#a82828", margin: "0 0 10px" }}>Soul Forge</h3>
      <p style={{ fontSize: 13, marginBottom: 15 }}>Melt down immense amounts of earthly Bronze to permanently increase your demonic essence.</p>
      <Btn variant="danger" disabled={bronze < 15000} onClick={() => {
        setBronze(b => b - 15000); setStats(s => ({ ...s, maxHp: s.maxHp + 50, maxMp: s.maxMp + 25 }));
        notify("Soul Forged! +50 Max HP, +25 Max MP", "#a82828"); 
        if(window.SFX && window.SFX.roar) window.SFX.roar();
      }}>Forge Soul (15000 B)</Btn>
    </Panel>}
  </div>;
}

export function TenebrimSurvivalView({ food, setFood, energy, setEnergy, survivalStats, setSurvivalStats, survivalInv, setSurvivalInv, stats, setStats, notify, startCombat, locationsExplored, setLocationsExplored, liberationQuest, setLiberationQuest, tenebrimAllies, startSlaverCombat }) {
  const [craftMode, setCraftMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Exploit Lock
  
  const [location, setLocation] = useState("Forest Edge");
  const [resourcePool, setResourcePool] = useState(100);
  
  // Expanded Locations
  const locNames = ["Deep Woods", "Murky River", "Barren Plains", "Crag Valley", "Overgrown Ruins", "Scorched Canyon", "Whispering Marsh", "Desolate Tundra", "Jagged Peaks", "Forgotten Crossroads", "Shadowed Grove", "Crystal Caverns"];

  // ── HELPER: Handles Costs & Starvation Damage ──────────────────────────
  const applyExertion = (energyCost, foodCost) => {
    if (energy < energyCost) {
      notify("Too exhausted. You need Energy to act.", "#b83a2a");
      return false; // Prevent action
    }
    
    setEnergy(e => Math.max(0, e - energyCost));

    if (food >= foodCost) {
      setFood(f => f - foodCost);
      return true; // Normal execution
    } else {
      // Starvation Mechanics
      const deficit = foodCost - food;
      setFood(0);
      
      const hpDamage = deficit * 2; // Taking 2 HP damage per missing Food point
      setStats(s => {
        const newHp = Math.max(1, s.hp - hpDamage); // Leaves you at 1 HP max from starving
        return { ...s, hp: newHp };
      });
      
      if(window.SFX && window.SFX.hit) window.SFX.hit();
      notify(`Starving! Your body consumes itself. -${hpDamage} HP`, "#b83a2a");
      return true; 
    }
  };

  const moveLocation = () => {
    if (isTransitioning) return;
    if (!applyExertion(20, 15)) return; // Uses 20 Energy, 15 Food
    
    let newLoc = locNames[Math.floor(Math.random() * locNames.length)];
    while (newLoc === location) newLoc = locNames[Math.floor(Math.random() * locNames.length)];
    
    setLocation(newLoc);
    setResourcePool(Math.floor(Math.random() * 50) + 70); 
    setLocationsExplored(l => l + 1); // Tracks how far you have traveled
    notify(`Traveled to ${newLoc}.`, "#3ec995");
  };

  const triggerEncounter = () => {
    if (Math.random() < 0.25) {
       setIsTransitioning(true); // LOCK THE UI
       if(window.SFX && window.SFX.encounter) window.SFX.encounter();
       notify("A monster ambushes you!", "#d84838");
       setTimeout(() => { setIsTransitioning(false); startCombat(); }, 1200);
       return true;
    }
    return false;
  };

  // ── GATHERING ──────────────────────────────────────────────────────────
  const doScour = () => {
    if (isTransitioning) return;
    if (resourcePool <= 0) { notify("This area is stripped bare. Move on.", "#b83a2a"); return; }
    
    if (!applyExertion(10, 5)) return; // Uses 10 Energy, 5 Food
    
    setResourcePool(r => Math.max(0, r - 10));

    if (triggerEncounter()) return;

    const hasReinforced = (survivalInv.reinforcedGloves||0) > 0;
    const hasBasic = !hasReinforced && (survivalInv.gatheringGear||0) > 0;
    
    const typeRoll = Math.random() * 10;
    const skillBonus = Math.floor(survivalStats.gathering / 2) + (hasReinforced ? 5 : hasBasic ? 3 : 0);
    
    if (typeRoll > 5) {
      const found = Math.floor(Math.random() * 2) + 1 + skillBonus;
      setSurvivalInv(i => ({ ...i, herbs: (i.herbs||0) + found }));
      notify(`Gathered ${found} herbs.`, "#3ec995");
    } else if (typeRoll > 1) {
      const found = 1 + skillBonus;
      setSurvivalInv(i => ({ ...i, junk: (i.junk||0) + found }));
      notify(`Scavenged ${found} junk.`, "#a89df0");
    } else {
      notify("Found nothing.", "#d84838");
    }

    if (hasReinforced && Math.random() < 0.10) { setSurvivalInv(i => ({...i, reinforcedGloves: i.reinforcedGloves - 1})); notify("Reinforced Gloves tore.", "#d84838"); }
    else if (hasBasic && Math.random() < 0.20) { setSurvivalInv(i => ({...i, gatheringGear: i.gatheringGear - 1})); notify("Gloves tore apart.", "#d84838"); }

    if (Math.random() > 0.6) setSurvivalStats(s => ({ ...s, gathering: s.gathering + 1 }));
  };

  // ── HUNTING ────────────────────────────────────────────────────────────
  const doHunt = () => {
    if (isTransitioning) return;
    if (resourcePool <= 0) { notify("No tracks left here. Move on.", "#b83a2a"); return; }

    if (!applyExertion(15, 10)) return; // Uses 15 Energy, 10 Food
    
    setResourcePool(r => Math.max(0, r - 15));

    if (triggerEncounter()) return;

    const hasHeavy = (survivalInv.heavySpear||0) > 0;
    const hasBasic = !hasHeavy && (survivalInv.huntingGear||0) > 0;
    const roll = Math.random() * 10 + survivalStats.hunting + (hasHeavy ? 10 : hasBasic ? 6 : -4);

    if (roll > 12) {
      const found = Math.floor(Math.random() * 3) + (hasHeavy ? 4 : hasBasic ? 2 : 1);
      setSurvivalInv(i => ({ ...i, meat: (i.meat||0) + found }));
      notify(`Prey secured. +${found} Meat`, "#e85c3a");
    } else if (roll > 7) {
      setSurvivalInv(i => ({ ...i, meat: (i.meat||0) + 1 }));
      notify("Caught small game. +1 Meat", "#e85c3a");
    } else {
      notify("The prey escaped.", "#d84838");
    }

    if (hasHeavy && Math.random() < 0.10) { setSurvivalInv(i => ({...i, heavySpear: i.heavySpear - 1})); notify("Heavy Spear broke.", "#d84838"); }
    else if (hasBasic && Math.random() < 0.20) { setSurvivalInv(i => ({...i, huntingGear: i.huntingGear - 1})); notify("Spear snapped.", "#d84838"); }

    if (Math.random() > 0.6) setSurvivalStats(s => ({ ...s, hunting: s.hunting + 1 }));
  };

  // ── FISHING ────────────────────────────────────────────────────────────
  const doFish = () => {
    if (isTransitioning) return;
    if (!location.includes("River")) { notify("No water here.", "#b83a2a"); return; }
    if (resourcePool <= 0) { notify("The water is empty. Move on.", "#b83a2a"); return; }

    if (!applyExertion(10, 5)) return; // Uses 10 Energy, 5 Food
    
    setResourcePool(r => Math.max(0, r - 10));

    const hasTool = (survivalInv.fishingGear||0) > 0;
    const roll = Math.random() * 10 + survivalStats.gathering + (hasTool ? 5 : -5);

    if (roll > 10) {
      const found = Math.floor(Math.random() * 2) + (hasTool ? 2 : 1);
      setSurvivalInv(i => ({ ...i, meat: (i.meat||0) + found }));
      notify(`Caught fish! +${found} Meat`, "#3ec995");
    } else {
      notify("Nothing biting.", "#d84838");
    }

    if (hasTool && Math.random() < 0.20) { setSurvivalInv(i => ({...i, fishingGear: i.fishingGear - 1})); notify("Fishing rod snapped.", "#d84838"); }
  };

  // ── CRAFTING ───────────────────────────────────────────────────────────
  const tryCraft = (recipe) => {
    if (isTransitioning) return;
    const successChance = survivalStats.crafting + Math.random() * 10;

    if (recipe === "parts") {
      if ((survivalInv.junk||0) < 2) { notify("Need 2 Junk.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, junk: i.junk - 2 }));
      if (successChance >= 3) {
        setSurvivalInv(i => ({ ...i, parts: (i.parts||0) + 1 }));
        if(window.SFX && window.SFX.craftGear) window.SFX.craftGear();
        notify("Crafted Parts.", "#a89df0");
        if (Math.random() > 0.5) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("The junk broke apart.", "#d84838");
    } 
    else if (recipe === "gathering") {
      if ((survivalInv.parts||0) < 1 || (survivalInv.junk||0) < 1) { notify("Need 1 Parts, 1 Junk.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, junk: i.junk - 1, parts: i.parts - 1 }));
      if (successChance >= 6) {
        setSurvivalInv(i => ({ ...i, gatheringGear: (i.gatheringGear||0) + 1 }));
        if(window.SFX && window.SFX.craftGear) window.SFX.craftGear();
        notify("Crafted Basic Gloves!", "#3ec995");
        if (Math.random() > 0.3) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("Failed to craft gloves.", "#d84838");
    }
    else if (recipe === "reinforced_gloves") {
      if ((survivalInv.parts||0) < 3 || (survivalInv.junk||0) < 3) { notify("Need 3 Parts, 3 Junk.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, junk: i.junk - 3, parts: i.parts - 3 }));
      if (successChance >= 9) {
        setSurvivalInv(i => ({ ...i, reinforcedGloves: (i.reinforcedGloves||0) + 1 }));
        if(window.SFX && window.SFX.craftGear) window.SFX.craftGear();
        notify("Crafted Reinforced Gloves!", "#3ec995");
        if (Math.random() > 0.3) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("The materials fell apart.", "#d84838");
    }
    else if (recipe === "fishing") {
      if ((survivalInv.parts||0) < 2 || (survivalInv.junk||0) < 1) { notify("Need 2 Parts, 1 Junk.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, junk: i.junk - 1, parts: i.parts - 2 }));
      if (successChance >= 7) {
        setSurvivalInv(i => ({ ...i, fishingGear: (i.fishingGear||0) + 1 }));
        if(window.SFX && window.SFX.craftGear) window.SFX.craftGear();
        notify("Crafted a Fishing Rod!", "#a89df0");
        if (Math.random() > 0.3) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("The rod snapped.", "#d84838");
    }
    else if (recipe === "hunting") {
      if ((survivalInv.parts||0) < 3 || (survivalInv.junk||0) < 2) { notify("Need 3 Parts, 2 Junk.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, junk: i.junk - 2, parts: i.parts - 3 }));
      if (successChance >= 8) {
        setSurvivalInv(i => ({ ...i, huntingGear: (i.huntingGear||0) + 1 }));
        if(window.SFX && window.SFX.craftGear) window.SFX.craftGear();
        notify("Crafted a Basic Spear!", "#e0a523");
        if (Math.random() > 0.3) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("The spearhead crumbled.", "#d84838");
    } 
    else if (recipe === "heavy_spear") {
      if ((survivalInv.parts||0) < 5 || (survivalInv.junk||0) < 4) { notify("Need 5 Parts, 4 Junk.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, junk: i.junk - 4, parts: i.parts - 5 }));
      if (successChance >= 10) {
        setSurvivalInv(i => ({ ...i, heavySpear: (i.heavySpear||0) + 1 }));
        if(window.SFX && window.SFX.craftGear) window.SFX.craftGear();
        notify("Crafted a Heavy Spear!", "#e0a523");
        if (Math.random() > 0.3) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("The heavy materials collapsed.", "#d84838");
    }
    else if (recipe === "meal") {
      if ((survivalInv.meat||0) < 1 || (survivalInv.herbs||0) < 1) { notify("Need 1 Meat, 1 Herb.", "#b83a2a"); return; }
      setSurvivalInv(i => ({ ...i, meat: i.meat - 1, herbs: i.herbs - 1 }));
      if (successChance >= 4) {
        setFood(f => Math.min(100, f + 45));
        setEnergy(e => Math.min(100, e + 25));
        if(window.SFX && window.SFX.craftMeal) window.SFX.craftMeal();
        notify("Cooked a meal! +45 Food, +25 Energy", "#3ec995");
        if (Math.random() > 0.7) setSurvivalStats(s => ({ ...s, crafting: s.crafting + 1 }));
      } else notify("The food burned.", "#d84838");
    }
  };

  const doRest = () => {
    if (isTransitioning) return;
    setEnergy(100);
    setFood(f => Math.max(0, f - 15)); 
    setStats(s => ({ ...s, hp: s.maxHp, stamina: s.maxStamina }));
    if(window.SFX && window.SFX.sleep) window.SFX.sleep();
    notify("You sleep. Energy, HP, and Stamina restored.", "#3ec995");
  };

  return <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ color: "#c0e8d0", fontSize: 24, margin: 0 }}>The Wilds</h2>
      <div style={{ textAlign: "right" }}>
        <Tag color="#a89df0">{location}</Tag>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>Resources left: {resourcePool}%</p>
      </div>
    </div>
    
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
      <Panel style={{ borderColor: "rgba(62,201,149,0.3)" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10, fontWeight: "bold" }}>STATUS</p>
        
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#e85c3a" }}>Food</span>
            <span style={{ fontSize: 11 }}>{food}/100</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.5)", borderRadius: 4 }}>
            <div style={{ width: `${food}%`, height: "100%", background: "#e85c3a", borderRadius: 4 }} />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#e0a523" }}>Energy</span>
            <span style={{ fontSize: 11 }}>{energy}/100</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.5)", borderRadius: 4 }}>
            <div style={{ width: `${energy}%`, height: "100%", background: "#e0a523", borderRadius: 4 }} />
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
          <Btn small variant="success" onClick={() => { if(isTransitioning) return; if(food >= 100) return; if((survivalInv.herbs||0) > 0) { setSurvivalInv(i => ({...i, herbs: i.herbs - 1})); setFood(f => Math.min(100, f + 15)); if(window.SFX && window.SFX.eat) window.SFX.eat(); notify("Ate an herb. +15 Food", "#3ec995"); } else notify("No herbs!", "#d84838"); }}>Eat Herb</Btn>
          <Btn small variant="danger" onClick={() => { if(isTransitioning) return; if(food >= 100) return; if((survivalInv.meat||0) > 0) { setSurvivalInv(i => ({...i, meat: i.meat - 1})); setFood(f => Math.min(100, f + 25)); if(window.SFX && window.SFX.eat) window.SFX.eat(); notify("Ate raw meat. +25 Food", "#e85c3a"); } else notify("No meat!", "#d84838"); }}>Eat Raw Meat</Btn>
          <Btn small variant="ghost" onClick={doRest}>Rest (-15 Food)</Btn>
        </div>
      </Panel>

      <Panel style={{ borderColor: "rgba(168,157,240,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10, fontWeight: "bold" }}>SKILLS</p>
            <p style={{ fontSize: 13, color: "#d4cbf8", marginBottom: 4 }}>Hunting: Lv. {survivalStats.hunting}</p>
            <p style={{ fontSize: 13, color: "#d4cbf8", marginBottom: 4 }}>Gathering: Lv. {survivalStats.gathering}</p>
            <p style={{ fontSize: 13, color: "#d4cbf8", marginBottom: 4 }}>Crafting: Lv. {survivalStats.crafting}</p>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 15 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10, fontWeight: "bold" }}>INVENTORY & TOOLS</p>
            <div style={{ display: "flex", gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, color: "#3ec995", marginBottom: 4 }}>Herbs: {survivalInv.herbs || 0}</p>
                <p style={{ fontSize: 12, color: "#e85c3a", marginBottom: 4 }}>Meat: {survivalInv.meat || 0}</p>
                <p style={{ fontSize: 12, color: "#a89df0", marginBottom: 4 }}>Junk: {survivalInv.junk || 0}</p>
                <p style={{ fontSize: 12, color: "#e0a523", marginBottom: 4 }}>Parts: {survivalInv.parts || 0}</p>
              </div>
              <div style={{ borderLeft: "1px dashed rgba(255,255,255,0.1)", paddingLeft: 10 }}>
                <p style={{ fontSize: 11, color: (survivalInv.gatheringGear||0)>0 ? "#3ec995" : "#666", marginBottom: 4 }}>Basic Glove: {survivalInv.gatheringGear || 0}</p>
                <p style={{ fontSize: 11, color: (survivalInv.reinforcedGloves||0)>0 ? "#3ec995" : "#666", marginBottom: 4 }}>Reinf. Glove: {survivalInv.reinforcedGloves || 0}</p>
                <p style={{ fontSize: 11, color: (survivalInv.huntingGear||0)>0 ? "#e0a523" : "#666", marginBottom: 4 }}>Basic Spear: {survivalInv.huntingGear || 0}</p>
                <p style={{ fontSize: 11, color: (survivalInv.heavySpear||0)>0 ? "#e0a523" : "#666", marginBottom: 4 }}>Heavy Spear: {survivalInv.heavySpear || 0}</p>
                <p style={{ fontSize: 11, color: (survivalInv.fishingGear||0)>0 ? "#a89df0" : "#666", marginBottom: 4 }}>Fishing Rod: {survivalInv.fishingGear || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
      <h3 style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{craftMode ? "Crafting" : "Actions"}</h3>
      <Btn small variant="ghost" onClick={() => setCraftMode(!craftMode)}>{craftMode ? "← Back to Actions" : "Open Crafting ↗"}</Btn>
    </div>

    {!craftMode ? (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        
        {/* THE CROSSROADS EVENT */}
        {liberationQuest === "idle" && locationsExplored >= 6 && (
          <Panel style={{ gridColumn: "1 / -1", borderColor: "#a8740c", background: "rgba(168,116,12,0.1)", textAlign: "center", padding: "20px" }}>
            <h3 style={{ color: "#e0a523", marginBottom: 10 }}>A Chained Captive</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 15, maxWidth: "600px", margin: "0 auto 15px" }}>You stumble upon a Syndicate Scout dragging a wounded Tenebrim in chains. This is part of a vast slaver organization. If you strike now, you start a war. There is no turning back.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="danger" onClick={() => { setLiberationQuest("active"); startSlaverCombat(false); }}>Ambush Scout (Accept Quest)</Btn>
              <Btn variant="ghost" onClick={() => { setLiberationQuest("locked"); notify("You turn away. The wilds swallow their cries.", "#d84838"); }}>Walk Away</Btn>
            </div>
          </Panel>
        )}

        {/* ACTIVE QUEST PANEL */}
        {liberationQuest === "active" && (
          <Panel onClick={() => startSlaverCombat(tenebrimAllies >= 10)} style={{ gridColumn: "1 / -1", cursor: "pointer", textAlign: "center", borderColor: "#b83a2a", background: "rgba(184,58,42,0.15)" }}>
            <h3 style={{ color: "#e85c3a", margin: "0 0 5px" }}>{tenebrimAllies >= 10 ? "Assault Syndicate Boss" : "Raid Slaver Camp"}</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Fight heavily armed humans. Rescue captives to build your rebellion.</p>
            <div style={{ marginTop: 10, display: "inline-block", background: "rgba(0,0,0,0.5)", padding: "5px 15px", borderRadius: "20px", color: "#e0a523", fontWeight: "bold" }}>
               Rescued Allies: {tenebrimAllies} / 10
            </div>
          </Panel>
        )}

        {/* COMPLETED QUEST PANEL */}
        {liberationQuest === "completed" && (
          <Panel style={{ gridColumn: "1 / -1", textAlign: "center", borderColor: "#ffd966", background: "rgba(255,217,102,0.1)" }}>
            <h3 style={{ color: "#ffd966", margin: "0 0 5px" }}>The Wilds are Free</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>The Syndicate lies in ruins. Your people thrive in the shadows once more.</p>
          </Panel>
        )}

        <Panel onClick={doScour} style={{ cursor: "pointer", textAlign: "center", borderColor: "#a89df0", background: "rgba(168,157,240,0.05)" }}>
          <p style={{ fontWeight: "bold", color: "#a89df0" }}>Scour Terrain</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Find herbs/junk. Tools can break.</p>
          <p style={{ fontSize: 10, marginTop: 10, color: "#e85c3a" }}>-10 Energy, -5 Food</p>
        </Panel>
        
        <Panel onClick={doHunt} style={{ cursor: "pointer", textAlign: "center", borderColor: "#e85c3a", background: "rgba(232,92,58,0.05)" }}>
          <p style={{ fontWeight: "bold", color: "#e85c3a" }}>Hunt Beasts</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Spears increase success but can break.</p>
          <p style={{ fontSize: 10, marginTop: 10, color: "#e85c3a" }}>-15 Energy, -10 Food</p>
        </Panel>

        <Panel onClick={doFish} style={{ cursor: "pointer", opacity: location.includes("River") ? 1 : 0.4, textAlign: "center", borderColor: "#3ec995", background: "rgba(62,201,149,0.05)" }}>
          <p style={{ fontWeight: "bold", color: "#3ec995" }}>Fish</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Requires River. Rod can break.</p>
          <p style={{ fontSize: 10, marginTop: 10, color: "#e85c3a" }}>-10 Energy, -5 Food</p>
        </Panel>

        <Panel onClick={moveLocation} style={{ cursor: "pointer", textAlign: "center", borderColor: "#e0a523", background: "rgba(224,165,35,0.05)" }}>
          <p style={{ fontWeight: "bold", color: "#e0a523" }}>Move Camp</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Reset area resources.</p>
          <p style={{ fontSize: 10, marginTop: 10, color: "#e85c3a" }}>-20 Energy, -15 Food</p>
        </Panel>
      </div>
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <Panel onClick={() => tryCraft("meal")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#3ec995" }}>
          <p style={{ fontWeight: "bold", color: "#3ec995", fontSize: 12 }}>Cook Meal</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>1 Meat, 1 Herb</p>
        </Panel>
        <Panel onClick={() => tryCraft("parts")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#a89df0" }}>
          <p style={{ fontWeight: "bold", color: "#a89df0", fontSize: 12 }}>Refine Junk</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>2 Junk</p>
        </Panel>
        <Panel onClick={() => tryCraft("gathering")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#3ec995" }}>
          <p style={{ fontWeight: "bold", color: "#3ec995", fontSize: 12 }}>Basic Gloves</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>1 Parts, 1 Junk</p>
        </Panel>
        <Panel onClick={() => tryCraft("hunting")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#e0a523" }}>
          <p style={{ fontWeight: "bold", color: "#e0a523", fontSize: 12 }}>Basic Spear</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>3 Parts, 2 Junk</p>
        </Panel>
        <Panel onClick={() => tryCraft("fishing")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#a89df0" }}>
          <p style={{ fontWeight: "bold", color: "#a89df0", fontSize: 12 }}>Fishing Rod</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>2 Parts, 1 Junk</p>
        </Panel>
        <Panel onClick={() => tryCraft("reinforced_gloves")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#3ec995", background:"rgba(62,201,149,0.1)" }}>
          <p style={{ fontWeight: "bold", color: "#3ec995", fontSize: 12 }}>Reinf. Gloves</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>3 Parts, 3 Junk</p>
        </Panel>
        <Panel onClick={() => tryCraft("heavy_spear")} style={{ cursor: "pointer", textAlign: "center", borderColor: "#e0a523", background:"rgba(224,165,35,0.1)" }}>
          <p style={{ fontWeight: "bold", color: "#e0a523", fontSize: 12 }}>Heavy Spear</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0" }}>5 Parts, 4 Junk</p>
        </Panel>
      </div>
    )}
  </div>;
}