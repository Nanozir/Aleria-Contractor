import React, { useState, useEffect, useRef } from "react";
import { Bar, Btn, Tag } from "./UIComponents";
import { SFX } from "./AudioEngine";
import { ATTACKS_BY_RACE } from "./GameData";

export default function CombatSystem({ race, stats, setStats, initialEnemies, onVictory, onFlee }) {
    const [combatLog, setCombatLog] = useState([{ t: "Battle started!", k: "sys", id: Date.now() }]);
    const [turn, setTurn] = useState("player");
    const [enemies, setEnemies] = useState(initialEnemies || [{ id: 1, name: "Wandering Beast", hp: 50, maxHp: 50, atk: 8 }]);
    const logRef = useRef();

    // Fetch the specific attacks for the player's race (default to human if undefined)
    const playerAttacks = ATTACKS_BY_RACE[race?.id] || ATTACKS_BY_RACE["human"];

    const addLog = (t, k = "info") => setCombatLog(prev => [...prev.slice(-30), { t, k, id: Date.now() + Math.random() }]);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [combatLog]);

    const executeAttack = (attack) => {
        if (turn !== "player") return;
        
        // Check Stamina
        const cost = attack.staminaCost || 0;
        if (stats.stamina < cost) {
            addLog(`Not enough stamina for ${attack.name}! Need ${cost}.`, "dmg");
            if (window.SFX && window.SFX.error) window.SFX.error();
            return;
        }

        // Deduct Stamina & Play SFX
        setStats(s => ({ ...s, stamina: Math.max(0, s.stamina - cost) }));
        if (window.SFX && window.SFX.attack) window.SFX.attack();

        // Calculate Damage
        const minDmg = attack.dmg[0] + (stats.atk || 0);
        const maxDmg = attack.dmg[1] + (stats.atk || 0);
        const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

        addLog(`You used ${attack.name}, dealing ${damage} damage!`, "reward");

        // Apply Damage to Enemy
        setEnemies(prev => {
            const updated = [...prev];
            updated[0].hp -= damage;
            return updated;
        });

        setTurn("enemy");
    };

    // Enemy Turn Logic
    useEffect(() => {
        if (turn === "enemy") {
            const aliveEnemies = enemies.filter(e => e.hp > 0);
            
            if (aliveEnemies.length === 0) {
                setTimeout(() => {
                    if (window.SFX && window.SFX.reward) window.SFX.reward();
                    onVictory();
                }, 1000);
                return;
            }

            const timer = setTimeout(() => {
                let totalDamage = 0;
                aliveEnemies.forEach(e => {
                    const eDmg = Math.max(1, e.atk - (stats.def || 0));
                    totalDamage += eDmg;
                    addLog(`${e.name} attacks you for ${eDmg} damage!`, "dmg");
                });

                if (window.SFX && window.SFX.hit) window.SFX.hit();
                setStats(s => ({ ...s, hp: Math.max(0, s.hp - totalDamage) }));
                setTurn("player");
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [turn, enemies, stats.def, onVictory, setStats]);

    // Check Player Death
    useEffect(() => {
        if (stats.hp <= 0) {
            addLog("You have fallen in battle...", "dmg");
            // App.jsx will handle the death state via stats.hp <= 0
        }
    }, [stats.hp]);

    return (
        <div className="frost-panel" style={{ padding: 20, maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
            
            {/* LEFT: COMBAT ARENA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Enemy Status */}
                <div className="frost-panel" style={{ padding: 20, borderColor: "#e85c3a", background: "rgba(232,92,58,0.05)" }}>
                    {enemies.map((e, idx) => (
                        <div key={idx} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <strong style={{ color: "#e85c3a", fontSize: 18 }}>{e.name}</strong>
                                <span style={{ color: "#fff" }}>{Math.max(0, e.hp)} / {e.maxHp} HP</span>
                            </div>
                            <Bar val={Math.max(0, e.hp)} max={e.maxHp} color="#e85c3a" h={12} />
                        </div>
                    ))}
                </div>

                {/* Player Status */}
                <div className="frost-panel" style={{ padding: 20, borderColor: "#3ec995" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <strong style={{ color: "#3ec995", fontSize: 16 }}>Player HP</strong>
                        <span style={{ color: "#fff" }}>{stats.hp} / {stats.maxHp}</span>
                    </div>
                    <Bar val={stats.hp} max={stats.maxHp} color="#3ec995" h={10} />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, marginTop: 15 }}>
                        <strong style={{ color: "#ffd966", fontSize: 14 }}>Stamina</strong>
                        <span style={{ color: "#fff", fontSize: 12 }}>{stats.stamina} / {stats.maxStamina}</span>
                    </div>
                    <Bar val={stats.stamina} max={stats.maxStamina} color="#ffd966" h={6} />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {playerAttacks.map(atk => (
                        <Btn 
                            key={atk.id} 
                            variant={atk.staminaCost ? "gold" : "primary"} 
                            disabled={turn !== "player" || stats.stamina < (atk.staminaCost || 0)}
                            onClick={() => executeAttack(atk)}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px" }}
                        >
                            <span style={{ fontSize: 15 }}>{atk.name}</span>
                            <span style={{ fontSize: 11, opacity: 0.7 }}>
                                {atk.staminaCost ? `-${atk.staminaCost} STM` : "Free"} | {atk.dmg[0]}-{atk.dmg[1]} DMG
                            </span>
                        </Btn>
                    ))}
                    <Btn variant="danger" style={{ gridColumn: "1 / -1" }} disabled={turn !== "player"} onClick={onFlee}>Flee Battle</Btn>
                </div>
            </div>

            {/* RIGHT: COMBAT LOG */}
            <div className="frost-panel" style={{ padding: 15, display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "2px" }}>COMBAT LOG</h3>
                <div ref={logRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {combatLog.map(l => (
                        <div key={l.id} style={{ fontSize: 13, color: l.k === "dmg" ? "#e85c3a" : l.k === "reward" ? "#3ec995" : "rgba(255,255,255,0.8)" }}>
                            {l.t}
                        </div>
                    ))}
                </div>
        </div>
    );
}