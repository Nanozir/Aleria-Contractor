// Cinematic.jsx — Reusable cutscene player.
// shots: [{ text, sub, speaker, duration, bg, color, fx: [...], sfx: () => void, align }]
//   fx: "snow" | "blizzard" | "embers" | "ash" | "rain" | "stars" | "rays" | "motes" | "lightning" | "shake" | "flash" | "pulse" | "vignette-red" | "fog"
// Click / Space / Enter advances, Esc or the SKIP button ends. onDone fires exactly once.
import React, { useEffect, useMemo, useRef, useState } from "react";

function Particles({ kind, count = 60 }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, left: Math.random() * 100, top: Math.random() * 100, size: Math.random(),
    dur: 0.6 + Math.random(), delay: -Math.random() * 10,
  })), [kind, count]);
  const style = (p) => {
    switch (kind) {
      case "snow": return { left: `${p.left}%`, width: 2 + p.size * 4, height: 2 + p.size * 4, background: "#fff", borderRadius: "50%", opacity: 0.4 + p.size * 0.5, animation: `cinSnow ${6 + p.dur * 8}s linear ${p.delay}s infinite` };
      case "blizzard": return { left: `${p.left}%`, width: 1 + p.size * 3, height: 10 + p.size * 20, background: "rgba(255,255,255,0.6)", transform: "rotate(65deg)", animation: `cinBlizzard ${0.8 + p.dur}s linear ${p.delay}s infinite` };
      case "embers": return { left: `${p.left}%`, width: 2 + p.size * 3, height: 2 + p.size * 3, background: p.size > 0.5 ? "#ffb347" : "#ff5a1f", borderRadius: "50%", boxShadow: "0 0 8px #ff8c00", animation: `cinRise ${5 + p.dur * 7}s ease-in ${p.delay}s infinite` };
      case "ash": return { left: `${p.left}%`, width: 3 + p.size * 4, height: 2 + p.size * 3, background: "rgba(160,150,140,0.7)", animation: `cinSnow ${9 + p.dur * 9}s linear ${p.delay}s infinite` };
      case "rain": return { left: `${p.left}%`, width: 1, height: 18 + p.size * 18, background: "linear-gradient(transparent, rgba(170,200,255,0.6))", animation: `cinRain ${0.5 + p.dur * 0.5}s linear ${p.delay}s infinite` };
      case "stars": return { left: `${p.left}%`, top: `${p.top}%`, width: 1 + p.size * 2, height: 1 + p.size * 2, background: "#fff", borderRadius: "50%", animation: `cinTwinkle ${2 + p.dur * 3}s ease-in-out ${p.delay}s infinite` };
      case "motes": return { left: `${p.left}%`, width: 3 + p.size * 5, height: 3 + p.size * 5, background: "#ffd966", borderRadius: "50%", boxShadow: "0 0 12px #ffd966", opacity: 0.7, animation: `cinRise ${8 + p.dur * 10}s ease-in-out ${p.delay}s infinite` };
      default: return {};
    }
  };
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {items.map(p => <span key={p.i} style={{ position: "absolute", top: kind === "stars" ? undefined : "-5%", ...style(p) }} />)}
  </div>;
}

function Typewriter({ text, speed = 28, onFinish }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (!text) return;
    if (n >= text.length) { onFinish?.(); return; }
    const t = setTimeout(() => setN(x => x + 1), text[n] === "." || text[n] === "," ? speed * 6 : speed);
    return () => clearTimeout(t);
  }, [n, text]);
  return <>{text.slice(0, n)}<span style={{ opacity: n < (text?.length || 0) ? 1 : 0 }} className="cin-caret">▍</span></>;
}

export default function Cinematic({ shots, onDone, skippable = true, letterbox = true }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(false);
  const done = useRef(false);
  const shot = shots[Math.min(i, shots.length - 1)] || {};
  const fx = shot.fx || [];

  const finish = () => { if (done.current) return; done.current = true; onDone?.(); };
  const next = () => {
    if (!typed) { setTyped(true); return; } // first click completes the text
    if (i + 1 >= shots.length) finish(); else { setI(i + 1); }
  };

  useEffect(() => { setTyped(false); shot.sfx?.(); }, [i]);
  useEffect(() => {
    const t = setTimeout(() => { if (i + 1 >= shots.length) finish(); else setI(x => x + 1); }, shot.duration || 5200);
    return () => clearTimeout(t);
  }, [i]);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape" && skippable) finish();
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  useEffect(() => () => { done.current = true; }, []);

  const particleKinds = fx.filter(f => ["snow", "blizzard", "embers", "ash", "rain", "stars", "motes"].includes(f));
  return <div className={`cin-root ${fx.includes("shake") ? "cin-shake" : ""}`} onClick={next}>
    {shots.map((s, k) => <div key={k} className="cin-bg" style={{ background: s.bg || "#000", opacity: k === i ? 1 : 0 }} />)}
    {fx.includes("aurora") && <div className="fw-aurora cin-aurora"><span className="a1" /><span className="a2" /><span className="a3" /></div>}
    {fx.includes("rays") && <div className="cin-rays" />}
    {fx.includes("ridges") && <svg className="cin-ridges" viewBox="0 0 1600 400" preserveAspectRatio="none">
      <path className="r1" fill="#1a2840" d="M0 260 L120 170 L210 220 L330 120 L450 210 L560 150 L690 230 L820 110 L940 200 L1060 140 L1180 230 L1300 160 L1420 220 L1600 150 L1600 400 L0 400Z" />
      <path className="r2" fill="#0f1a2c" d="M0 300 L160 230 L280 290 L420 220 L560 300 L700 240 L860 310 L1000 230 L1150 300 L1300 240 L1460 300 L1600 250 L1600 400 L0 400Z" />
      <path className="r3" fill="#060a12" d="M0 350 L200 300 L380 345 L560 305 L760 355 L980 310 L1180 350 L1380 315 L1600 345 L1600 400 L0 400Z" />
    </svg>}
    {fx.includes("fog") && <div className="cin-fog" />}
    {fx.includes("pulse") && <div className="cin-pulse" style={{ background: `radial-gradient(circle, ${shot.color || "#ff8c00"}55 0%, transparent 60%)` }} />}
    {particleKinds.map(k => <Particles key={k + i} kind={k} count={k === "blizzard" ? 90 : k === "stars" ? 120 : 60} />)}
    {fx.includes("lightning") && <div className="cin-lightning" />}
    {fx.includes("flash") && <div key={"flash" + i} className="cin-flash" />}
    <div className={`cin-vignette ${fx.includes("vignette-red") ? "red" : ""}`} />
    {letterbox && <><div className="cin-bar top" /><div className="cin-bar bottom" /></>}

    <div className="cin-text-wrap" style={{ justifyContent: shot.align === "bottom" ? "flex-end" : "center" }}>
      {shot.speaker && <p key={"sp" + i} className="cin-speaker" style={{ color: shot.color || "#ffd966" }}>{shot.speaker}</p>}
      <h2 key={"t" + i} className="cin-text" style={{ color: shot.color || "#fff", textShadow: `0 0 24px ${shot.color || "rgba(255,255,255,0.4)"}` }}>
        {typed ? shot.text : <Typewriter text={shot.text || ""} onFinish={() => setTyped(true)} />}
      </h2>
      {shot.sub && <p key={"sub" + i} className="cin-sub" style={{ opacity: typed ? 1 : 0 }}>{shot.sub}</p>}
    </div>

    <div className="cin-progress">{shots.map((_, k) => <span key={k} className={k <= i ? "on" : ""} />)}</div>
    {skippable && <button className="cin-skip" onClick={(e) => { e.stopPropagation(); finish(); }}>SKIP ❯</button>}
    <p className="cin-hint">click to continue</p>
  </div>;
}
