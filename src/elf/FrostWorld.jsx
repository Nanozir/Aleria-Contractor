// FrostWorld.jsx — Living background for the Elf scenario.
// Layers (back → front): sky, stars, aurora (blurred drifting gradients), parallax mountain ridges,
// the Core's glow, canvas snowfall, and a frost vignette that creeps in as Heat drops.
// heat: 0..1 (current heat / max heat). genOn: is the Central Core burning.
import React, { useEffect, useMemo, useRef } from "react";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Snow({ heat }) {
  const ref = useRef(null);
  const heatRef = useRef(heat);
  heatRef.current = heat;

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, raf = 0, t = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const MAX = 320;
    const flakes = Array.from({ length: MAX }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), s: Math.random() * Math.PI * 2 }));
    const still = reducedMotion();
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const cold = 1 - Math.max(0, Math.min(1, heatRef.current));
      const count = Math.round(110 + cold * 210);
      const wind = 0.25 + cold * 0.9 + Math.sin(t * 0.3) * 0.25;
      for (let i = 0; i < count; i++) {
        const f = flakes[i];
        const depth = 0.3 + f.z * 0.7;
        if (!still) {
          f.y += (0.0007 + depth * 0.0016) * (1 + cold * 0.6);
          f.x += (wind * 0.0009 + Math.sin(t + f.s) * 0.0004) * depth;
          if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
          if (f.x > 1.02) f.x = -0.02; if (f.x < -0.02) f.x = 1.02;
        }
        const r = 0.6 + depth * 2.2;
        ctx.globalAlpha = 0.25 + depth * 0.6;
        ctx.beginPath(); ctx.arc(f.x * w, f.y * h, r, 0, Math.PI * 2); ctx.fillStyle = "#eaf6ff"; ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!still) raf = requestAnimationFrame(draw);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(draw); };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  return <canvas ref={ref} className="fw-snow" />;
}

export default function FrostWorld({ heat = 1, genOn = true }) {
  const stars = useMemo(() => Array.from({ length: 140 }, () => `${Math.round(Math.random() * 2000)}px ${Math.round(Math.random() * 700)}px 0 ${Math.random() < 0.15 ? 1 : 0}px rgba(255,255,255,${(0.3 + Math.random() * 0.6).toFixed(2)})`).join(","), []);
  const cold = 1 - Math.max(0, Math.min(1, heat));
  const glow = genOn ? 0.25 + heat * 0.55 : 0.05;
  return <div className="fw-root" aria-hidden="true">
    <div className="fw-sky" style={{ filter: `saturate(${1 - cold * 0.5})` }} />
    <div className="fw-stars" style={{ boxShadow: stars }} />
    <div className="fw-aurora" style={{ opacity: 0.25 + cold * 0.25 }}>
      <span className="a1" /><span className="a2" /><span className="a3" />
    </div>
    <svg className="fw-ridges" viewBox="0 0 1600 400" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fwR1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c2b44" /><stop offset="1" stopColor="#0b1220" /></linearGradient>
        <linearGradient id="fwR2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#132037" /><stop offset="1" stopColor="#070c16" /></linearGradient>
        <linearGradient id="fwR3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c1526" /><stop offset="1" stopColor="#04070d" /></linearGradient>
      </defs>
      <g className="r1"><path fill="url(#fwR1)" d="M0 260 L120 170 L210 220 L330 120 L450 210 L560 150 L690 230 L820 110 L940 200 L1060 140 L1180 230 L1300 160 L1420 220 L1600 150 L1600 400 L0 400Z" />
        <path fill="rgba(220,240,255,0.18)" d="M330 120 L360 145 L345 150 L330 140 L315 152 L300 145Z M820 110 L850 135 L830 140 L815 132 L800 142 L790 134Z M1060 140 L1085 160 L1070 163 L1055 158 L1043 164Z" /></g>
      <g className="r2"><path fill="url(#fwR2)" d="M0 300 L160 230 L280 290 L420 220 L560 300 L700 240 L860 310 L1000 230 L1150 300 L1300 240 L1460 300 L1600 250 L1600 400 L0 400Z" /></g>
      <g className="r3"><path fill="url(#fwR3)" d="M0 350 L200 300 L380 345 L560 305 L760 355 L980 310 L1180 350 L1380 315 L1600 345 L1600 400 L0 400Z" /></g>
    </svg>
    <div className={`fw-core ${genOn ? "on" : ""}`} style={{ opacity: glow }} />
    <Snow heat={heat} />
    <div className="fw-frost" style={{ opacity: Math.max(0, cold - 0.25) * 1.3 }} />
  </div>;
}
