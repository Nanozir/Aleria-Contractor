// UIComponents.jsx
import React, { useState, useEffect, useMemo } from "react";
import { SFX } from "./AudioEngine";

export function fmt(b){if(b<=0)return"0 Bronze";const g=Math.floor(b/10000);const r1=b%10000;const s=Math.floor(r1/100);const br=r1%100;const p=[];if(g>0)p.push(`${g} Gold`);if(s>0)p.push(`${s} Silver`);if(br>0||p.length===0)p.push(`${br} Bronze`);return p.join(", ");}

export function Bar({ val, max, color, h = 6 }) {
  const pct = Math.max(0, Math.min(100, (val / max) * 100)) || 0;
  return (
    <div style={{ width: "100%", background: "rgba(0,0,0,0.6)", height: h, borderRadius: h / 2, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)" }}>
      <div style={{ width: `${pct}%`, background: color, height: "100%", transition: "width 0.3s ease-out", boxShadow: `0 0 10px ${color}` }} />
    </div>
  );
}

export function Tag({ children, color, style, glow }) {
  return <span style={{ background: `linear-gradient(180deg, ${color}20, transparent)`, color: color, border: `1px solid ${color}${glow ? "80" : "40"}`, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: glow ? `0 0 12px ${color}60, inset 0 0 8px ${color}30` : "none", ...style }}>{children}</span>;
}

export function Panel({ children, style, onClick }) {
  const baseBorder = style?.borderColor || "rgba(123, 111, 228, 0.2)";
  return (
    <div 
      onClick={onClick} 
      style={{ 
        background: style?.background || "linear-gradient(180deg, rgba(30,15,45,0.6) 0%, rgba(15,5,25,0.8) 100%)", 
        border: `1px solid ${baseBorder}`, 
        borderRadius: 12, 
        padding: 20, 
        backdropFilter: "blur(10px)",
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), inset 0 0 15px ${baseBorder.replace('0.2', '0.05').replace('1)', '0.05')}`,
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        ...style 
      }}
      onMouseOver={onClick ? (e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.6), inset 0 0 20px ${baseBorder.replace('0.2', '0.2').replace('1)', '0.2')}`; e.currentTarget.style.borderColor = baseBorder.replace('0.2', '0.8').replace('1)', '0.8'); } : undefined}
      onMouseOut={onClick ? (e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), inset 0 0 15px ${baseBorder.replace('0.2', '0.05').replace('1)', '0.05')}`; e.currentTarget.style.borderColor = baseBorder; } : undefined}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", small, full, disabled, "data-testid": testId, style: extraStyle }) {
  let bg = "linear-gradient(180deg, #4b3d8f, #2a205a)"; let col = "#fff"; let brd = "rgba(123, 111, 228, 0.5)"; let glow = "rgba(123,111,228,0.4)";
  if (variant === "gold" || variant === "amber") { bg = "linear-gradient(180deg, #d49830, #8a5a19)"; brd = "rgba(255, 230, 150, 0.8)"; glow = "rgba(224,165,35,0.5)"; col = "#fff"; }
  if (variant === "danger") { bg = "linear-gradient(180deg, #b83a2a, #6e1c12)"; brd = "rgba(232, 92, 58, 0.8)"; glow = "rgba(232,92,58,0.5)"; }
  if (variant === "success") { bg = "linear-gradient(180deg, #2a8f67, #15523a)"; brd = "rgba(62, 201, 149, 0.8)"; glow = "rgba(62,201,149,0.5)"; }
  if (variant === "ghost") { bg = "transparent"; brd = "rgba(255,255,255,0.2)"; glow = "transparent"; }

  return (
    <button
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: bg, color: col, border: `1px solid ${brd}`, borderRadius: 6,
        padding: small ? "6px 12px" : "12px 20px", fontSize: small ? 12 : 15, fontWeight: 800,
        width: full ? "100%" : "auto", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        boxShadow: `0 0 15px ${glow}, inset 0 0 8px rgba(255,255,255,0.1)`,
        textShadow: "0 1px 3px rgba(0,0,0,0.8)", letterSpacing: "0.05em",
        transition: "all 0.2s",
        ...(extraStyle || {})
      }}
      onMouseOver={(e) => { if(!disabled) e.currentTarget.style.transform = "scale(1.04)"; }}
      onMouseOut={(e) => { if(!disabled) e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

export function CoinBar({bronze}){return <div style={{background:"linear-gradient(90deg,rgba(255,180,40,0.16),rgba(255,180,40,0.06))",border:"1px solid rgba(255,200,80,0.3)",borderRadius:99,padding:"7px 18px",display:"inline-flex",alignItems:"center",gap:10,boxShadow:"0 2px 12px rgba(232,185,56,0.15),inset 0 1px 0 rgba(255,255,255,0.05)"}}><span style={{fontSize:10,color:"rgba(255,200,80,0.65)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Wallet</span><span style={{fontSize:13,color:"#ffd166",fontWeight:700}}>{fmt(bronze)}</span></div>;}

export function StarRating({stars, max=5}){
  // Redesigned: bold rounded badge with star icons
  const color = stars >= 5 ? "#e85c3a" : stars >= 4 ? "#ff8c00" : stars >= 3 ? "#ffd966" : stars >= 2 ? "#a89df0" : "#3ec995";
  return (
    <span data-testid="star-rating" style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: `linear-gradient(180deg, ${color}26, ${color}10)`,
      border: `1.5px solid ${color}`,
      borderRadius: 99, padding: "3px 9px",
      fontSize: 11, fontWeight: 900, color: color,
      letterSpacing: "0.04em", lineHeight: 1,
      boxShadow: `0 0 10px ${color}40, inset 0 0 6px ${color}22`,
      textShadow: `0 0 6px ${color}99`
    }}>
      <span style={{ fontSize: 13, lineHeight: 1 }}>★</span>
      <span>{stars}</span>
    </span>
  );
}

export function Ton618BG() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#06030a", zIndex: 0 }}>
      <style>
        {`
          @keyframes slowSpin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
          @keyframes counterSpin { 0% { transform: translate(-50%, -50%) rotate(45deg) scale(1); } 50% { transform: translate(-50%, -50%) rotate(15deg) scale(1.05); } 100% { transform: translate(-50%, -50%) rotate(45deg) scale(1); } }
          @keyframes pulseGlow { 0% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.95); filter: blur(20px); } 50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); filter: blur(30px); } 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.95); filter: blur(20px); } }
        `}
      </style>
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "100vw", height: "100vh", background: "radial-gradient(circle at 50% 50%, rgba(60, 10, 80, 0.2) 0%, transparent 80%)", transform: "translate(-50%, -50%)", zIndex: 1 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(220, 80, 200, 0.3) 0%, transparent 60%)", animation: "pulseGlow 12s ease-in-out infinite", zIndex: 2 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "140vw", height: "500px", borderRadius: "50%", borderTop: "2px solid rgba(255, 180, 100, 0.15)", borderBottom: "8px solid rgba(180, 60, 220, 0.4)", animation: "counterSpin 45s ease-in-out infinite", zIndex: 3, boxShadow: "0 100px 100px -50px rgba(180, 60, 220, 0.3)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "800px", height: "800px", borderRadius: "50%", borderLeft: "4px solid rgba(255, 217, 102, 0.6)", borderRight: "1px solid rgba(220, 80, 200, 0.2)", borderTop: "1px solid transparent", borderBottom: "1px solid transparent", animation: "slowSpin 25s linear infinite", zIndex: 4, filter: "blur(3px)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "240px", height: "240px", background: "#000", borderRadius: "50%", boxShadow: "0 0 50px 10px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(0,0,0,1)", zIndex: 5 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "242px", height: "242px", borderRadius: "50%", border: "1px solid rgba(255, 217, 102, 0.5)", zIndex: 6, opacity: 0.8, boxShadow: "0 0 15px rgba(255, 217, 102, 0.6)" }} />
    </div>
  );
}

export function Confetti(){const colors=["#ffd966","#e85c3a","#3ec995","#a89df0","#e0a523","#ff6bcb"];return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:50,overflow:"hidden"}}>
  {Array.from({length:60}).map((_,i)=>{const left=Math.random()*100;const dur=2+Math.random()*3;const dl=Math.random()*1.5;const c=colors[i%colors.length];const sz=6+Math.random()*8;return <div key={i} style={{position:"absolute",left:`${left}%`,top:0,width:sz,height:sz*0.4,background:c,animation:`confetti_fall ${dur}s linear infinite`,animationDelay:`${dl}s`,borderRadius:2}}/>;})}
</div>;}

export function PastoralBG() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId;
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      animationFrameId = requestAnimationFrame(() => {
        setMousePos({ x, y });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const leaves = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animDuration: 12 + Math.random() * 20, 
      swayDuration: 3 + Math.random() * 5,   
      animDelay: Math.random() * -30,        
      size: 8 + Math.random() * 12,          
      rotation: Math.random() * 360,
      color: Math.random() > 0.6 ? "#e0a523" : (Math.random() > 0.5 ? "#a8740c" : "#3ec995") 
    }));
  }, []);

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      overflow: "hidden", zIndex: 0,
      background: "linear-gradient(180deg, #131d15 0%, #0a0e0a 100%)", 
      pointerEvents: "none"
    }}>
      <style>
        {`
          @keyframes leafFall { 0% { top: -10%; opacity: 0; } 5% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { top: 110%; opacity: 0; } }
          @keyframes leafSway { 0% { transform: translateX(-30px) rotate(-45deg); } 100% { transform: translateX(30px) rotate(45deg); } }
        `}
      </style>

      <div style={{ position: "absolute", inset: -100, background: "radial-gradient(circle at 50% -10%, rgba(224, 165, 35, 0.15) 0%, transparent 60%)", transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`, transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }} />
      <div style={{ position: "absolute", inset: -100, background: "radial-gradient(ellipse at 50% 100%, #1a291e 0%, transparent 70%)", transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`, transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)", opacity: 0.5 }} />

      <div style={{ position: "absolute", inset: -100, transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px)`, transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
        {leaves.map(leaf => (
          <div key={leaf.id} style={{ position: "absolute", left: `${leaf.left}%`, top: "-10%", width: leaf.size, height: leaf.size * 1.5, background: leaf.color, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", opacity: 0.8, boxShadow: `0 0 10px ${leaf.color}40`, animation: `leafFall ${leaf.animDuration}s linear ${leaf.animDelay}s infinite, leafSway ${leaf.swayDuration}s ease-in-out ${leaf.animDelay}s infinite alternate` }} />
        ))}
      </div>
    </div>
  );
}