// Views.jsx
import React, { useState, useEffect, useRef } from "react";
import { SFX } from "./AudioEngine";
import { WEAPONS, ARMORS, POTIONS, TOOLS, SKILLS, SLEEP, HOUSE_PRICE } from "./GameData";
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
  
  const allWeapons = [...WEAPONS, ...craftedShop.filter(c => c.atk !== undefined)];
  
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
      {[...ARMORS, ...craftedShop.filter(c => c.def !== undefined)].map(a => {
        const owned = ownedArmors.includes(a.id); const adj = a.price === 0 ? 0 : adjustedPrice(a.price); const aff = bronze >= adj; const eq = armor.id === a.id; return <Panel key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: owned || aff ? 1 : 0.45, boxShadow: a.isCrafted ? "0 0 10px rgba(255,217,102,0.2)" : "none", borderColor: a.isCrafted ? "#ffd966" : "rgba(255,255,255,0.1)" }}>
          <div style={{ flex: 1 }}><div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 2 }}><span style={{ fontWeight: 600, fontSize: 13, color: a.isCrafted ? "#ffd966" : "#d4cbf8" }}>{a.name}</span><span style={{ fontSize: 11, color: "rgba(200,192,248,0.45)" }}>+{a.def} DEF</span></div></div>
          {eq ? <Tag color="#3ec995">Equipped</Tag> : owned ? <Btn small variant="primary" onClick={() => buyOrEquipArmor(a)}>Equip</Btn> : <Btn small variant={a.isCrafted ? "gold" : "amber"} disabled={!aff} onClick={() => buyOrEquipArmor(a)}>{a.price === 0 ? "Equip" : `${adj} B`}</Btn>}
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

export function CraftView({ bronze, setBronze, craftMats, setCraftMats, setOwnedWeapons, setOwnedArmors, setPotions, notify, setCraftedShop }) {
  const [category, setCategory] = useState("weapons"); // weapons, armor, potions
  const [mini, setMini] = useState(null);
  const [bundleCount, setBundleCount] = useState(1);
  const [ingredient, setIngredient] = useState("steel"); // steel, mythril, dragon
  
  // Smith Minigame
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const [dir, setDir] = useState(1);
  const [hits, setHits] = useState(0);
  const [smithScore, setSmithScore] = useState(0);
  const [smithGoal, setSmithGoal] = useState(8);
  const [smithType, setSmithType] = useState("weapon"); // weapon or armor

  // Potion Minigame
  const [potionDiff, setPotionDiff] = useState(null);
  const [potionTarget, setPotionTarget] = useState("");
  const [potionMix, setPotionMix] = useState([]);
  
  // Vial-catching minigame
  const [vialPos, setVialPos] = useState(50);
  const [catcherPos, setCatcherPos] = useState(50);
  const [vialsCaught, setVialsCaught] = useState(0);
  const [vialsMissed, setVialsMissed] = useState(0);
  const [vialActive, setVialActive] = useState(false);
  
  const INGREDIENTS = {
    steel: { name: "Steel Ingot", cost: 2, qualityBonus: 0, color: "#9aa5b8", desc: "Standard alloy. Reliable forge." },
    mythril: { name: "Mythril Shard", cost: 4, qualityBonus: 2, color: "#87cefa", desc: "Lighter, sharper. +Quality." },
    dragon: { name: "Dragon Bone", cost: 6, qualityBonus: 4, color: "#e85c3a", desc: "Legendary core. +Big Quality." }
  };

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

  // Vial catcher minigame loop
  useEffect(() => {
    if (mini !== "vial") return;
    let interval;
    const spawnVial = () => {
      setVialPos(Math.random() * 80 + 10);
      setVialActive(true);
    };
    spawnVial();
    interval = setInterval(() => {
      setVialPos(p => {
        // Vial falls (using top % which increases)
        const newY = (p + 8);
        if (newY > 90) {
          // Check catch
          const catcher = catcherPos;
          if (Math.abs((catcher) - (vialPos)) < 15) {
            setVialsCaught(v => v + 1);
            if (window.SFX) window.SFX.click();
          } else {
            setVialsMissed(v => v + 1);
            if (window.SFX) window.SFX.attack();
          }
          // Reset for new vial
          setTimeout(spawnVial, 200);
          return -10;
        }
        return newY;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [mini, catcherPos]);
  
  useEffect(() => {
    if (mini !== "vial") return;
    if (vialsCaught + vialsMissed >= 8) {
      const accuracy = vialsCaught / (vialsCaught + vialsMissed);
      const potionTypes = ["hp", "mp", "stamina"];
      const chosenType = potionTypes[Math.floor(Math.random() * potionTypes.length)];
      const bundles = bundleCount;
      let pots = [];
      if (accuracy >= 0.9) {
        // Mastercraft
        const masterPot = chosenType === "hp" ? { id: "master_hp_"+Date.now(), name: "Masterwork Health", stat: "hp", val: 150, price: 120 } :
                          chosenType === "mp" ? { id: "master_mp_"+Date.now(), name: "Masterwork Mana", stat: "mp", val: 120, price: 130 } :
                          { id: "master_sta_"+Date.now(), name: "Masterwork Stamina", stat: "stamina", val: 130, price: 110 };
        pots = Array.from({length: bundles}, () => ({...masterPot}));
        notify(`Mastercraft! Brewed ${bundles} ${masterPot.name}`, "#ffd966");
      } else if (accuracy >= 0.6) {
        const goodPot = chosenType === "hp" ? { id: "hp_high_"+Date.now(), name: "Health (High)", stat: "hp", val: 100, price: 130 } :
                       chosenType === "mp" ? { id: "mp_high_"+Date.now(), name: "Mana (High)", stat: "mp", val: 90, price: 120 } :
                       { id: "sta_high_"+Date.now(), name: "Stamina (High)", stat: "stamina", val: 100, price: 110 };
        pots = Array.from({length: bundles}, () => ({...goodPot}));
        notify(`Brewed ${bundles} ${goodPot.name}`, "#3ec995");
      } else {
        const weakPot = chosenType === "hp" ? { id: "hp_med_"+Date.now(), name: "Health (Mid)", stat: "hp", val: 50, price: 60 } :
                       chosenType === "mp" ? { id: "mp_med_"+Date.now(), name: "Mana (Mid)", stat: "mp", val: 40, price: 75 } :
                       { id: "sta_med_"+Date.now(), name: "Stamina (Mid)", stat: "stamina", val: 50, price: 55 };
        pots = Array.from({length: bundles}, () => ({...weakPot}));
        notify(`Brewed ${bundles} ${weakPot.name} — middling quality`, "#a89df0");
      }
      pots.forEach(p => setPotions(prev => [...prev, p]));
      setMini(null); setVialsCaught(0); setVialsMissed(0);
    }
  }, [vialsCaught, vialsMissed, mini, bundleCount, notify, setPotions]);

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
          const potionTypes = ["hp", "mp", "stamina"];
          const chosenType = potionTypes[Math.floor(Math.random() * potionTypes.length)];
          
          let midPot, highPot, masterPot;
          
          if (chosenType === "hp") {
            midPot = { id: "hp_med_"+Date.now(), name: "Health (Mid)", stat: "hp", val: 70, price: 60 };
            highPot = { id: "hp_high_"+Date.now(), name: "Health (High)", stat: "hp", val: 150, price: 130 };
            masterPot = { id: "master_hp_"+Date.now(), name: "Masterwork Health", stat: "hp", val: 200, price: 180 }; 
          } else if (chosenType === "mp") {
            midPot = { id: "mp_med_"+Date.now(), name: "Mana (Mid)", stat: "mp", val: 50, price: 75 };
            highPot = { id: "mp_high_"+Date.now(), name: "Mana (High)", stat: "mp", val: 120, price: 120 };
            masterPot = { id: "master_mp_"+Date.now(), name: "Masterwork Mana", stat: "mp", val: 160, price: 170 };
          } else {
            midPot = { id: "sta_med_"+Date.now(), name: "Stamina (Mid)", stat: "stamina", val: 60, price: 55 };
            highPot = { id: "sta_high_"+Date.now(), name: "Stamina (High)", stat: "stamina", val: 120, price: 110 };
            masterPot = { id: "master_sta_"+Date.now(), name: "Masterwork Stamina", stat: "stamina", val: 170, price: 140 };
          }

          const bundles = bundleCount;
          let chosen = midPot;
          if (potionDiff === "easy") chosen = midPot;
          else {
            const masterworkChance = potionDiff === "hard" ? 0.4 : 0.2;
            const masterwork = Math.random() < masterworkChance;
            chosen = masterwork ? masterPot : highPot;
          }
          const pots = Array.from({length: bundles}, () => ({...chosen, id: chosen.id + "_" + Math.random()}));
          pots.forEach(p => setPotions(prev => [...prev, p]));
          notify(`Brewed ${bundles}× ${chosen.name}!`, chosen === masterPot ? "#ffd966" : "#3ec995");
        } else {
          notify("Vials exploded. Failed brew.", "#d84838");
        }
        setMini(null);
        setPotionDiff(null);
      }, 500);
    }
  };
  
  const startSmith = (type) => {
    const ing = INGREDIENTS[ingredient];
    const totalMetal = ing.cost * bundleCount;
    if (craftMats.metal < totalMetal) { notify(`Need ${totalMetal} Metal (${ing.name})`, "#d84838"); return; }
    setCraftMats(m => ({ ...m, metal: m.metal - totalMetal }));
    setSmithType(type); setMini("smith"); setHits(0); setSmithScore(0); 
    setPos(0); posRef.current = 0; setSmithGoal(6 + bundleCount * 2);
  };

  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffd966", marginBottom: 6 }}>Workshop</h2>
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
      <Tag color="#a8740c">Metal: {craftMats.metal}</Tag>
      <Tag color="#3ec995">Herb: {craftMats.herb}</Tag>
      <Btn small data-testid="buy-metal" onClick={() => { if (bronze >= 35) { setBronze(b => b - 35); setCraftMats(m => ({ ...m, metal: m.metal + 1 })); if(window.SFX) window.SFX.buy(); } else notify("Need 35 B", "#d84838"); }}>Buy Metal (35 B)</Btn>
      <Btn small data-testid="buy-herb" onClick={() => { if (bronze >= 15) { setBronze(b => b - 15); setCraftMats(m => ({ ...m, herb: m.herb + 1 })); if(window.SFX) window.SFX.buy(); } else notify("Need 15 B", "#d84838"); }}>Buy Herb (15 B)</Btn>
    </div>

    {!mini && <>
      {/* CATEGORY TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[{id:"weapons",label:"Weapons",c:"#e85c3a"},{id:"armor",label:"Armor",c:"#87cefa"},{id:"potions",label:"Potions",c:"#3ec995"}].map(t => (
          <button key={t.id} data-testid={`craft-tab-${t.id}`} onClick={() => setCategory(t.id)} style={{ padding: "8px 16px", borderRadius: 99, border: category === t.id ? `2px solid ${t.c}` : "1px solid rgba(255,255,255,0.15)", background: category === t.id ? `${t.c}22` : "transparent", color: category === t.id ? t.c : "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>

      {/* BUNDLE COUNT */}
      <Panel style={{ marginBottom: 14, padding: 14, background: "rgba(168,157,240,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ color: "rgba(200,192,248,0.7)", fontSize: 13, fontWeight: 600 }}>Craft Bundle Size:</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 3, 5].map(n => <Btn key={n} small variant={bundleCount === n ? "primary" : "ghost"} data-testid={`bundle-${n}`} onClick={() => setBundleCount(n)}>×{n}</Btn>)}
          </div>
        </div>
      </Panel>

      {/* CATEGORY CONTENT */}
      {category === "weapons" && <>
        <p style={{ fontSize: 12, color: "rgba(200,192,248,0.55)", marginBottom: 12 }}>Select an ingredient (better ingredients = better quality):</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          {Object.entries(INGREDIENTS).map(([k, v]) => (
            <Panel key={k} onClick={() => setIngredient(k)} style={{ cursor: "pointer", borderColor: ingredient === k ? v.color : "rgba(255,255,255,0.1)", background: ingredient === k ? `${v.color}15` : "rgba(0,0,0,0.2)", padding: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: v.color, marginBottom: 4 }}>{v.name}</p>
              <p style={{ fontSize: 10, color: "rgba(200,192,248,0.55)", marginBottom: 6 }}>{v.desc}</p>
              <p style={{ fontSize: 11, color: "#ffd966" }}>{v.cost} Metal each</p>
            </Panel>
          ))}
        </div>
        <Btn variant="gold" data-testid="forge-weapon-btn" full onClick={() => startSmith("weapon")}>Forge {bundleCount} Weapon{bundleCount > 1 ? "s" : ""} ({INGREDIENTS[ingredient].cost * bundleCount} Metal)</Btn>
      </>}
      
      {category === "armor" && <>
        <p style={{ fontSize: 12, color: "rgba(200,192,248,0.55)", marginBottom: 12 }}>Hammer-strike an anvil to forge new armor pieces:</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          {Object.entries(INGREDIENTS).map(([k, v]) => (
            <Panel key={k} onClick={() => setIngredient(k)} style={{ cursor: "pointer", borderColor: ingredient === k ? v.color : "rgba(255,255,255,0.1)", background: ingredient === k ? `${v.color}15` : "rgba(0,0,0,0.2)", padding: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: v.color, marginBottom: 4 }}>{v.name}</p>
              <p style={{ fontSize: 11, color: "#ffd966" }}>{v.cost} Metal each</p>
            </Panel>
          ))}
        </div>
        <Btn variant="primary" data-testid="forge-armor-btn" full onClick={() => startSmith("armor")}>Forge {bundleCount} Armor Piece{bundleCount > 1 ? "s" : ""} ({INGREDIENTS[ingredient].cost * bundleCount} Metal)</Btn>
      </>}
      
      {category === "potions" && <>
        <p style={{ fontSize: 12, color: "rgba(200,192,248,0.55)", marginBottom: 12 }}>Choose a brewing method:</p>
        <Panel style={{ borderColor: "rgba(62,201,149,0.4)", marginBottom: 12 }}>
          <b style={{ color: "#3ec995", display: "block", marginBottom: 6 }}>Color-Mix Brew (2 Herb × {bundleCount})</b>
          <p style={{ fontSize: 11, color: "rgba(200,192,248,0.5)", marginBottom: 10 }}>Mix colors to match the target — hard recipes can yield Mastercraft.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small variant="success" data-testid="brew-easy" onClick={() => { const c = 2 * bundleCount; if (craftMats.herb >= c) { setCraftMats(m => ({ ...m, herb: m.herb - c })); startPotion("easy"); } else notify(`Need ${c} Herb`, "#d84838"); }}>Easy</Btn>
            <Btn small variant="amber" data-testid="brew-normal" onClick={() => { const c = 2 * bundleCount; if (craftMats.herb >= c) { setCraftMats(m => ({ ...m, herb: m.herb - c })); startPotion("normal"); } else notify(`Need ${c} Herb`, "#d84838"); }}>Normal</Btn>
            <Btn small variant="danger" data-testid="brew-hard" onClick={() => { const c = 2 * bundleCount; if (craftMats.herb >= c) { setCraftMats(m => ({ ...m, herb: m.herb - c })); startPotion("hard"); } else notify(`Need ${c} Herb`, "#d84838"); }}>Hard</Btn>
          </div>
        </Panel>
        
        <Panel style={{ borderColor: "rgba(255,140,0,0.4)" }}>
          <b style={{ color: "#ff8c00", display: "block", marginBottom: 6 }}>Vial-Catch Minigame (3 Herb × {bundleCount})</b>
          <p style={{ fontSize: 11, color: "rgba(200,192,248,0.5)", marginBottom: 10 }}>Catch falling vials. Accuracy determines potion quality.</p>
          <Btn small variant="amber" data-testid="brew-vial" onClick={() => { const c = 3 * bundleCount; if (craftMats.herb >= c) { setCraftMats(m => ({ ...m, herb: m.herb - c })); setVialsCaught(0); setVialsMissed(0); setMini("vial"); } else notify(`Need ${c} Herb`, "#d84838"); }}>Start Catching</Btn>
        </Panel>
      </>}
    </>}

    {mini === "smith" && (
      <Panel style={{ textAlign: "center", borderColor: "#e0a523", padding: 25 }}>
        <b style={{ color: "#e0a523", fontSize: 16 }}>Forging {smithType === "weapon" ? "Weapon" : "Armor"}...</b>
        <p style={{ fontSize: 12, marginBottom: 18, color: "rgba(255,255,255,0.6)" }}>Strike when the marker hits the green zone! ({INGREDIENTS[ingredient].name})</p>
        <div style={{ width: "100%", height: 36, background: "rgba(0,0,0,0.6)", position: "relative", marginBottom: 18, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ position: "absolute", left: "30%", width: "40%", height: "100%", background: "rgba(232,185,56,0.4)" }} />
          <div style={{ position: "absolute", left: "45%", width: "10%", height: "100%", background: "rgba(62,201,149,0.85)" }} />
          <div style={{ position: "absolute", left: `${pos}%`, width: 5, height: "100%", background: "#fff", transform: "translateX(-50%)", boxShadow: "0 0 12px #fff" }} />
        </div>
        
        <Btn variant="gold" data-testid="anvil-strike" onClick={() => {
          const currentPos = posRef.current;
          const isPerfect = currentPos >= 45 && currentPos <= 55;
          const isGood = currentPos >= 30 && currentPos <= 70;
          
          let points = 0;
          if (isPerfect) { points = 2; if(window.SFX) window.SFX.anvilHit?.() || window.SFX.click(); } 
          else if (isGood) { points = 1; if(window.SFX) window.SFX.anvilHit?.() || window.SFX.click(); } 
          else { if(window.SFX) window.SFX.anvilMiss?.() || window.SFX.attack(); }
          
          setSmithScore(s => s + points);
          
          if (hits + 1 >= smithGoal) {
            setMini(null);
            const finalScore = smithScore + points;
            const maxScore = smithGoal * 2;
            const accuracy = finalScore / maxScore;
            const ingredient_bonus = INGREDIENTS[ingredient].qualityBonus;
            const totalScore = finalScore + ingredient_bonus;
            
            const masterworkThreshold = maxScore * 0.85;
            const goodThreshold = maxScore * 0.55;
            
            if (smithType === "weapon") {
              for (let i = 0; i < bundleCount; i++) {
                let wep;
                if (totalScore >= masterworkThreshold) {
                  wep = { id: "craft_w_" + Date.now() + "_" + i, name: `Masterwork ${INGREDIENTS[ingredient].name.split(" ")[0]} Blade`, atk: 35 + ingredient_bonus * 6, price: 2200 + ingredient_bonus * 500, isCrafted: true };
                  notify(`Mastercraft! ${wep.name}`, "#ffd966");
                } else if (totalScore >= goodThreshold) {
                  wep = { id: "craft_w_" + Date.now() + "_" + i, name: `Forged ${INGREDIENTS[ingredient].name.split(" ")[0]}`, atk: 18 + ingredient_bonus * 4, price: 700 + ingredient_bonus * 200, isCrafted: true };
                  notify(`Forged ${wep.name}`, "#3ec995");
                } else {
                  setBronze(b => b + 30); notify(`Scrap. Salvaged 30 B.`, "#e85c3a"); continue;
                }
                setCraftedShop(prev => [...prev, wep]); setOwnedWeapons(w => [...w, wep.id]);
              }
            } else {
              // Armor
              for (let i = 0; i < bundleCount; i++) {
                let arm;
                if (totalScore >= masterworkThreshold) {
                  arm = { id: "craft_a_" + Date.now() + "_" + i, name: `Masterwork ${INGREDIENTS[ingredient].name.split(" ")[0]} Plate`, def: 22 + ingredient_bonus * 4, price: 2000 + ingredient_bonus * 400, isCrafted: true };
                  notify(`Mastercraft! ${arm.name}`, "#ffd966");
                } else if (totalScore >= goodThreshold) {
                  arm = { id: "craft_a_" + Date.now() + "_" + i, name: `Forged ${INGREDIENTS[ingredient].name.split(" ")[0]} Mail`, def: 12 + ingredient_bonus * 2, price: 600 + ingredient_bonus * 150, isCrafted: true };
                  notify(`Forged ${arm.name}`, "#3ec995");
                } else {
                  setBronze(b => b + 30); notify(`Scrap. Salvaged 30 B.`, "#e85c3a"); continue;
                }
                if (setOwnedArmors) setOwnedArmors(a => [...a, arm.id]);
                // Add to crafted shop so it shows in shop
                setCraftedShop(prev => [...prev, arm]);
              }
            }
          } else { setHits(h => h + 1); }
        }}>Strike Anvil</Btn>
        <p style={{ fontSize: 11, marginTop: 14, color: "rgba(255,255,255,0.55)" }}>Strikes: {hits}/{smithGoal} | Score: {smithScore}/{smithGoal * 2}</p>
      </Panel>
    )}
    
    {mini === "potion" && (
      <Panel style={{ textAlign: "center", borderColor: "#3ec995", padding: 25 }}>
        <b style={{ color: "#3ec995", fontSize: 16 }}>Pouring Vials...</b>
        <p style={{ fontSize: 13, margin: "10px 0 20px" }}>Target: <strong style={{ color: potionTarget.toLowerCase() }}>{potionTarget}</strong></p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          {P_COLORS[potionDiff].map(c => (
            <div key={c} onClick={() => mixColor(c)} style={{ width: 56, height: 90, background: c.toLowerCase(), borderRadius: "0 0 24px 24px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.4)", boxShadow: `0 0 12px ${c.toLowerCase()}`, opacity: potionMix.length < P_RECIPES[potionDiff][potionTarget].length ? 1 : 0.5, transition: "transform 0.15s" }} 
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Vial contains: {potionMix.join(" + ") || "Empty"}</p>
      </Panel>
    )}
    
    {mini === "vial" && (
      <Panel style={{ borderColor: "#ff8c00", padding: 25 }}>
        <b style={{ color: "#ff8c00", fontSize: 16, display: "block", marginBottom: 8, textAlign: "center" }}>Catch the Vials!</b>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14, textAlign: "center" }}>Move the catcher to align with falling vials. {vialsCaught} caught / {vialsMissed} missed (of 8)</p>
        <div style={{ position: "relative", width: "100%", height: 260, background: "linear-gradient(180deg, rgba(255,140,0,0.05), rgba(0,0,0,0.4))", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,140,0,0.3)" }} 
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            setCatcherPos(Math.max(0, Math.min(100, x)));
          }}>
          {/* Vial falling */}
          {vialActive && vialPos >= 0 && (
            <div style={{ position: "absolute", left: `${vialPos}%`, top: `${vialPos * 2.5}%`, transform: "translateX(-50%)", width: 24, height: 36, background: "linear-gradient(180deg, #87cefa, #4d80a8)", borderRadius: "0 0 12px 12px", border: "1.5px solid #fff", boxShadow: "0 0 12px #87cefa" }} />
          )}
          {/* Catcher */}
          <div style={{ position: "absolute", left: `${catcherPos}%`, bottom: 10, transform: "translateX(-50%)", width: 80, height: 18, background: "linear-gradient(180deg, #d49830, #8a5a19)", borderRadius: 8, border: "2px solid #ffd966", boxShadow: "0 0 12px rgba(255,217,102,0.5)" }} />
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 10, textAlign: "center" }}>Move your mouse left/right inside the box.</p>
      </Panel>
    )}
  </div>;
}
// The Gambling Den lives in src/casino/.
export { default as GambleView } from "./casino/Casino";

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

