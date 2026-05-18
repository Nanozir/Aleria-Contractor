import React, { useState, useEffect, useRef } from "react";
import { Btn, Tag, Bar } from "./UIComponents";

export default function DevilScenario({ setScreen, stats, setStats, notify }) {
  const playClick = () => { if (window.SFX && window.SFX.click) window.SFX.click(); };

  const [phase, setPhase] = useState("intro");
  const [animStep, setAnimStep] = useState(0);

  // Underworld Resources
  const [souls, setSouls] = useState(0);
  const [obsidian, setObsidian] = useState(0);
  const [hellfire, setHellfire] = useState(0);

  // Buildings (Levels)
  const [siphonLv, setSiphonLv] = useState(1);  // Generates Souls
  const [quarryLv, setQuarryLv] = useState(0);  // Generates Obsidian
  const [forgeLv, setForgeLv] = useState(0);    // Generates Hellfire (costs Souls)
  const [spireLv, setSpireLv] = useState(1);    // Main HQ, boosts global production

  const [log, setLog] = useState([{ msg: "You have returned to the Abyss.", type: "sys", id: Date.now() }]);
  const logRef = useRef(null);

  const addLog = (msg, type = "info") => setLog(prev => [...prev.slice(-29), { msg, type, id: Date.now() + Math.random() }]);

  // Intro Cinematic
  useEffect(() => {
    if (phase === "intro") {
      if (window.SFX && window.SFX.spell) window.SFX.spell(); 
      const seq = [{s: 1, d: 1000}, {s: 2, d: 4000}, {s: 3, d: 8000}];
      seq.forEach(({ s, d }) => setTimeout(() => setAnimStep(s), d));
      const endTimer = setTimeout(() => setPhase("builder"), 12000);
      return () => clearTimeout(endTimer);
    }
  }, [phase]);

  // Auto-Scroll Log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // The Grand Underworld Tick (Every 3 seconds)
  useEffect(() => {
    if (phase !== "builder") return;
    const tick = setInterval(() => {
      let sYield = siphonLv * 2 * spireLv;
      let oYield = quarryLv * 1 * spireLv;
      let hYield = 0;

      // Forge consumes souls to make hellfire
      if (forgeLv > 0) {
          const cost = forgeLv * 2;
          setSouls(currentSouls => {
              if (currentSouls >= cost) {
                  hYield = forgeLv * 1 * spireLv;
                  return currentSouls - cost;
              }
              return currentSouls;
          });
      }

      setSouls(s => s + sYield);
      setObsidian(o => o + oYield);
      setHellfire(h => h + hYield);

    }, 3000);
    return () => clearInterval(tick);
  }, [phase, siphonLv, quarryLv, forgeLv, spireLv]);

  const upgradeBuilding = (type) => {
      playClick();
      if (type === "siphon") {
          const cost = siphonLv * 50;
          if (obsidian < cost) return notify(`Need ${cost} Obsidian`, "#e85c3a");
          setObsidian(o => o - cost);
          setSiphonLv(l => l + 1);
          addLog(`Soul Siphon upgraded to Lv.${siphonLv + 1}`, "reward");
      }
      else if (type === "quarry") {
          const cost = (quarryLv + 1) * 100;
          if (souls < cost) return notify(`Need ${cost} Souls`, "#e85c3a");
          setSouls(s => s - cost);
          setQuarryLv(l => l + 1);
          addLog(`Obsidian Quarry upgraded to Lv.${quarryLv + 1}`, "reward");
      }
      else if (type === "forge") {
          const cost = (forgeLv + 1) * 150;
          if (obsidian < cost) return notify(`Need ${cost} Obsidian`, "#e85c3a");
          setObsidian(o => o - cost);
          setForgeLv(l => l + 1);
          addLog(`Hellfire Forge upgraded to Lv.${forgeLv + 1}`, "reward");
      }
      else if (type === "spire") {
          const sCost = spireLv * 500;
          const oCost = spireLv * 500;
          const hCost = spireLv * 100;
          if (souls < sCost || obsidian < oCost || hellfire < hCost) return notify("Insufficient resources for Spire", "#e85c3a");
          setSouls(s => s - sCost); setObsidian(o => o - oCost); setHellfire(h => h - hCost);
          setSpireLv(l => l + 1);
          addLog(`Abyssal Spire reached Lv.${spireLv + 1}! Global production increased.`, "reward");
          if (window.SFX && window.SFX.buy) window.SFX.buy();
      }
  };

  const manualSiphon = () => {
      playClick();
      setSouls(s => s + (5 * spireLv));
      addLog(`Manually harvested ${5 * spireLv} Souls.`, "info");
  };

  if (phase === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0305", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#e85c3a", textAlign: "center", padding: "2rem" }}>
        {animStep >= 1 && <h2 style={{ fontSize: 32, letterSpacing: "4px", animation: "cinFadeIn 1s ease forwards", textShadow: "0 0 20px #e85c3a" }}>The Surface World was only a distraction.</h2>}
        {animStep >= 2 && <h2 style={{ fontSize: 24, color: "#87cefa", marginTop: 20, animation: "cinFadeIn 1s ease forwards" }}>The true kingdom lies below.</h2>}
        {animStep >= 3 && <h2 style={{ fontSize: 24, color: "#a89df0", marginTop: 20, animation: "cinFadeIn 1s ease forwards" }}>It is time to rebuild the Abyssal Spire.</h2>}
        <Btn style={{ marginTop: 40, opacity: animStep >= 1 ? 1 : 0 }} onClick={() => setPhase("builder")}>Enter the Underworld</Btn>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% -20%, #2b0b0b 0%, #050202 100%)", fontFamily: "var(--font-sans)", padding: "20px" }}>
      
      {/* HEADER */}
      <div className="frost-panel" style={{ padding: "15px 20px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderColor: "#e85c3a" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: "#e85c3a", textTransform: "uppercase", letterSpacing: "3px", textShadow: "0 0 15px #e85c3a" }}>Abyssal Domain</h2>
          <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Spire Level {spireLv} • Rule with an iron fist.</p>
        </div>
        
        <div style={{ display: "flex", gap: 15 }}>
          <div style={{ textAlign: "center", padding: "5px 15px", background: "rgba(0,0,0,0.5)", borderRadius: 8, border: "1px solid rgba(135,206,250,0.3)" }}>
             <span style={{ fontSize: 11, color: "#87cefa", display: "block", marginBottom: 3 }}>SOULS</span>
             <strong style={{ color: "#fff", fontSize: 18 }}>{Math.floor(souls)}</strong>
          </div>
          <div style={{ textAlign: "center", padding: "5px 15px", background: "rgba(0,0,0,0.5)", borderRadius: 8, border: "1px solid rgba(168,157,240,0.3)" }}>
             <span style={{ fontSize: 11, color: "#a89df0", display: "block", marginBottom: 3 }}>OBSIDIAN</span>
             <strong style={{ color: "#fff", fontSize: 18 }}>{Math.floor(obsidian)}</strong>
          </div>
          <div style={{ textAlign: "center", padding: "5px 15px", background: "rgba(0,0,0,0.5)", borderRadius: 8, border: "1px solid rgba(232,92,58,0.3)" }}>
             <span style={{ fontSize: 11, color: "#e85c3a", display: "block", marginBottom: 3 }}>HELLFIRE</span>
             <strong style={{ color: "#fff", fontSize: 18 }}>{Math.floor(hellfire)}</strong>
          </div>
          <Btn variant="ghost" onClick={() => { playClick(); setScreen("overworld"); }}>Surface ↗</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 20, maxWidth: 1200, margin: "0 auto" }}>
        
        {/* BUILDINGS COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          
          {/* THE SPIRE */}
          <div className="frost-panel" style={{ padding: 30, borderRadius: 12, textAlign: "center", borderColor: "#e85c3a", background: "rgba(232,92,58,0.05)", boxShadow: "0 0 30px rgba(232,92,58,0.1)" }}>
             <h3 style={{ color: "#e85c3a", fontSize: 26, margin: "0 0 10px", letterSpacing: "2px" }}>The Abyssal Spire (Lv.{spireLv})</h3>
             <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 20 }}>The seat of your power. Upgrading multiplies all resource yields.</p>
             <div style={{ display: "flex", justifyContent: "center", gap: 15, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Cost: <span style={{color:"#87cefa"}}>{spireLv*500} Souls</span>, <span style={{color:"#a89df0"}}>{spireLv*500} Obs</span>, <span style={{color:"#e85c3a"}}>{spireLv*100} Fire</span></span>
                <Btn variant="danger" onClick={() => upgradeBuilding('spire')}>Ascend Spire</Btn>
             </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
              {/* SOUL SIPHON */}
              <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "rgba(135,206,250,0.3)" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h4 style={{ color: "#87cefa", margin: 0, fontSize: 18 }}>Soul Siphon</h4>
                    <Tag color="#87cefa">Lv.{siphonLv}</Tag>
                 </div>
                 <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", minHeight: 35 }}>Tears souls from the ether. Yields +{siphonLv * 2 * spireLv}/tick.</p>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: "#a89df0" }}>{siphonLv * 50} Obsidian</span>
                    <Btn small variant="ghost" onClick={() => upgradeBuilding('siphon')}>Upgrade</Btn>
                 </div>
              </div>

              {/* OBSIDIAN QUARRY */}
              <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "rgba(168,157,240,0.3)" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h4 style={{ color: "#a89df0", margin: 0, fontSize: 18 }}>Obsidian Quarry</h4>
                    <Tag color="#a89df0">Lv.{quarryLv}</Tag>
                 </div>
                 <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", minHeight: 35 }}>Mines dark stone for construction. Yields +{quarryLv * 1 * spireLv}/tick.</p>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: "#87cefa" }}>{(quarryLv + 1) * 100} Souls</span>
                    <Btn small variant="ghost" onClick={() => upgradeBuilding('quarry')}>Build/Up</Btn>
                 </div>
              </div>

              {/* HELLFIRE FORGE */}
              <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "rgba(232,92,58,0.3)", gridColumn: "1 / -1" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h4 style={{ color: "#e85c3a", margin: 0, fontSize: 18 }}>Hellfire Forge</h4>
                    <Tag color="#e85c3a">Lv.{forgeLv}</Tag>
                 </div>
                 <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Burns Souls to create Hellfire. Consumes {forgeLv * 2} Souls to yield +{forgeLv * 1 * spireLv} Fire/tick.</p>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: "#a89df0" }}>{(forgeLv + 1) * 150} Obsidian</span>
                    <Btn small variant="ghost" onClick={() => upgradeBuilding('forge')}>Build/Up</Btn>
                 </div>
              </div>
          </div>
          
          {/* MANUAL ACTION */}
          <Btn variant="primary" style={{ padding: 20, fontSize: 16, letterSpacing: "2px" }} onClick={manualSiphon}>
             MANUALLY HARVEST SOULS
          </Btn>

        </div>

        {/* LOG & LORE COLUMN */}
        <div className="frost-panel" style={{ padding: 20, borderRadius: 12, display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "#ffd966", margin: "0 0 15px", borderBottom: "1px solid rgba(255,217,102,0.3)", paddingBottom: 10, letterSpacing: "1px" }}>Domain Records</h3>
            <div ref={logRef} style={{ flex: 1, overflowY: "auto", fontSize: 13, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
               {log.map(l => (
                   <div key={l.id} style={{ color: l.type === "dmg" ? "#e85c3a" : l.type === "reward" ? "#a89df0" : "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: 6, borderLeft: `3px solid ${l.type === "reward" ? "#a89df0" : "#444"}` }}>
                       {l.msg}
                   </div>
               ))}
            </div>
        </div>

      </div>
    </div>
  );
}