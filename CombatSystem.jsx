import React, { useState, useEffect, useRef } from "react";
import { Bar, Btn } from "./UIComponents";
import { SFX } from "./AudioEngine";

export default function CombatSystem({ stats, setStats, enemies, onVictory, onFlee }) {
    const [combatLog, setCombatLog] = useState([{ t: "Battle started!", k: "sys" }]);
    const [turn, setTurn] = useState("player");
    const logRef = useRef();

    const addLog = (t, k = "info") => setCombatLog(prev => [...prev, { t, k, id: Math.random() }]);

    const handleAttack = () => {
        if (turn !== "player") return;
        SFX.attack();
        addLog("You strike the enemy!", "dmg");
        // Här lägger vi in logiken för att sänka fiendens HP
        setTurn("enemy");
    };

    return (
        <div style={{ padding: 20 }}>
            <h3>Combat</h3>
            <div ref={logRef} style={{ height: 100, overflowY: "auto", background: "rgba(0,0,0,0.3)", padding: 10 }}>
                {combatLog.map(l => <div key={l.id} style={{ fontSize: 12 }}>{l.t}</div>)}
            </div>
            <div style={{ marginTop: 20 }}>
                <Btn variant="primary" onClick={handleAttack} disabled={turn !== "player"}>Attack</Btn>
                <Btn onClick={onFlee}>Flee</Btn>
            </div>
        </div>
    );
}