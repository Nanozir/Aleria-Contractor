import React, { useState, useEffect, useRef } from "react";
import { Btn, Tag, Panel } from "./UIComponents";

export default function EquarScenario({ setScreen, bronze, setBronze, notify }) {
    const playClick = () => { if (window.SFX && window.SFX.click) window.SFX.click(); };
    const [tab, setTab] = useState("market");
    
    // Equar Merchant State
    const [mats, setMats] = useState({ metal: 10, herb: 10 });
    const [stock, setStock] = useState({ weapons: 0, armors: 0, potions: 0 });
    const [bazaarMult, setBazaarMult] = useState(1);
    
    // Minigame State
    const [mini, setMini] = useState(null);
    const [pos, setPos] = useState(0);
    const [dir, setDir] = useState(1);
    const [hits, setHits] = useState(0);
    const posRef = useRef(0);

    useEffect(() => {
        const t = setInterval(() => setBazaarMult(Math.random() * 1.5 + 0.5), 10000);
        return () => clearInterval(t);
    }, []);

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

    const fulfillOrder = (reqMats, reqType, reward) => {
        playClick();
        if (stock[reqType] < reqMats) return notify(`Not enough ${reqType} in stock!`, "#e85c3a");
        setStock(s => ({ ...s, [reqType]: s[reqType] - reqMats }));
        setBronze(b => b + reward);
        notify(`Order fulfilled! +${reward} Bronze`, "#ffd966");
        if (window.SFX && window.SFX.buy) window.SFX.buy();
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1f1a0a, #0a0804)", padding: 20, fontFamily: "var(--font-sans)" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                        <h1 style={{ color: "#e0a523", margin: "0 0 5px", fontSize: 28, textTransform: "uppercase", letterSpacing: "2px" }}>Equar Merchant Route</h1>
                        <Tag color="#e0a523">Bronze: {Math.floor(bronze)}</Tag>
                    </div>
                    {/* Allow them to join standard combat guilds later! */}
                    <Btn variant="ghost" onClick={() => { playClick(); setScreen("overworld"); }}>Join a Combat Guild ↗</Btn>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <Btn variant={tab === "market" ? "primary" : "ghost"} onClick={() => { playClick(); setTab("market"); }}>Market Board</Btn>
                    <Btn variant={tab === "workshop" ? "primary" : "ghost"} onClick={() => { playClick(); setTab("workshop"); }}>Workshop</Btn>
                </div>

                {tab === "market" && (
                    <Panel style={{ borderColor: "#ffd966" }}>
                        <h3 style={{ color: "#ffd966", marginBottom: 15 }}>Trade Requests</h3>
                        <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
                            <Tag color="#87cefa">Stocked Weapons: {stock.weapons}</Tag>
                            <Tag color="#a8a8a8">Stocked Armor: {stock.armors}</Tag>
                            <Tag color="#3ec995">Stocked Potions: {stock.potions}</Tag>
                        </div>
                        
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ padding: 15, background: "rgba(0,0,0,0.4)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div><p style={{ margin: 0, color: "#fff", fontWeight: "bold" }}>Militia Arms</p><p style={{ margin: 0, fontSize: 12, color: "gray" }}>Requires 3 Weapons</p></div>
                                <Btn small onClick={() => fulfillOrder(3, 'weapons', 800)}>Deliver (800 B)</Btn>
                            </div>
                            <div style={{ padding: 15, background: "rgba(0,0,0,0.4)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div><p style={{ margin: 0, color: "#fff", fontWeight: "bold" }}>Guard Plating</p><p style={{ margin: 0, fontSize: 12, color: "gray" }}>Requires 2 Armors</p></div>
                                <Btn small onClick={() => fulfillOrder(2, 'armors', 1200)}>Deliver (1200 B)</Btn>
                            </div>
                            <div style={{ padding: 15, background: "rgba(0,0,0,0.4)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div><p style={{ margin: 0, color: "#fff", fontWeight: "bold" }}>Alchemist's Order</p><p style={{ margin: 0, fontSize: 12, color: "gray" }}>Requires 5 Potions</p></div>
                                <Btn small onClick={() => fulfillOrder(5, 'potions', 600)}>Deliver (600 B)</Btn>
                            </div>
                        </div>

                        <h3 style={{ color: "#3ec995", marginTop: 30, marginBottom: 15 }}>Silk Road</h3>
                        <p style={{ fontSize: 12, color: "gray", marginBottom: 10 }}>Current Market Multiplier: <strong style={{ color: bazaarMult > 1 ? "#3ec995" : "#e85c3a" }}>{bazaarMult.toFixed(2)}x</strong></p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <Btn variant="amber" disabled={bronze < 500 * bazaarMult} onClick={() => { playClick(); setBronze(b => b - (500 * bazaarMult)); notify("Bought Silk!", "#e0a523"); }}>Buy Cargo</Btn>
                            <Btn variant="success" onClick={() => { playClick(); setBronze(b => b + (600 * bazaarMult)); notify("Sold Silk!", "#3ec995"); }}>Sell Cargo</Btn>
                        </div>
                    </Panel>
                )}

                {tab === "workshop" && (
                    <Panel style={{ borderColor: "#a89df0" }}>
                        <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
                            <Tag color="#87cefa">Metal: {mats.metal}</Tag>
                            <Tag color="#3ec995">Herbs: {mats.herb}</Tag>
                            <Btn small onClick={() => { playClick(); if (bronze >= 50) { setBronze(b => b - 50); setMats(m => ({ ...m, metal: m.metal + 5 })); } else notify("Need 50 B", "#e85c3a"); }}>Buy 5 Metal (50 B)</Btn>
                        </div>

                        {!mini ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                                <Panel onClick={() => { playClick(); if (mats.metal >= 2) { setMats(m => ({...m, metal: m.metal - 2})); setMini("smith"); setHits(0); setPos(0); posRef.current = 0; } else notify("Need 2 Metal", "#e85c3a"); }} style={{ cursor: "pointer", textAlign: "center", borderColor: "#87cefa" }}>
                                    <h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Forge Weapons</h4>
                                    <p style={{ fontSize: 11, color: "gray", margin: 0 }}>Costs 2 Metal. Minigame.</p>
                                </Panel>
                                <Panel onClick={() => { playClick(); setStock(s => ({...s, potions: s.potions + 1})); notify("Brewed a Potion!", "#3ec995"); }} style={{ cursor: "pointer", textAlign: "center", borderColor: "#3ec995" }}>
                                    <h4 style={{ color: "#3ec995", margin: "0 0 5px" }}>Brew Potions</h4>
                                    <p style={{ fontSize: 11, color: "gray", margin: 0 }}>Auto-brew for trade.</p>
                                </Panel>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: 20 }}>
                                <h3 style={{ color: "#e0a523", marginBottom: 15 }}>Strike the Anvil!</h3>
                                <div style={{ width: "100%", height: 30, background: "#000", position: "relative", borderRadius: 6, marginBottom: 20, overflow: "hidden" }}>
                                    <div style={{ position: "absolute", left: "40%", width: "20%", height: "100%", background: "#3ec995" }} />
                                    <div style={{ position: "absolute", left: `${pos}%`, width: 4, height: "100%", background: "#fff" }} />
                                </div>
                                <Btn variant="gold" onClick={() => {
                                    const curr = posRef.current;
                                    if (curr >= 40 && curr <= 60) {
                                        setHits(h => h + 1);
                                        if (window.SFX) window.SFX.click();
                                        if (hits + 1 >= 5) {
                                            setMini(null);
                                            setStock(s => ({ ...s, weapons: s.weapons + 1 }));
                                            notify("Weapon Forged!", "#ffd966");
                                        }
                                    } else {
                                        if (window.SFX && window.SFX.hit) window.SFX.hit();
                                        notify("Missed!", "#e85c3a");
                                    }
                                }}>Strike!</Btn>
                                <p style={{ fontSize: 12, color: "gray", marginTop: 15 }}>Hits: {hits} / 5</p>
                            </div>
                        )}
                    </Panel>
                )}
            </div>
        </div>
    );
}