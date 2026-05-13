import React, { useState, useEffect, useRef } from "react";
import { Btn, Tag, Bar, Confetti } from "./UIComponents";

export default function ElfScenario({ setScreen, notify, stats, setStats }) {
  const playClick = () => { if (window.SFX && window.SFX.click) window.SFX.click(); };

  const [phase, setPhase] = useState("intro"); 
  const [animStep, setAnimStep] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null); 
  const [deathReason, setDeathReason] = useState("");
  const [leftTab, setLeftTab] = useState("actions"); 
  
  const [researchAnnounce, setResearchAnnounce] = useState(null);
  const [genOn, setGenOn] = useState(true);

  // Survival Stats
  const [hp, setHp] = useState(100); 
  const [temp, setTemp] = useState(100);
  const [food, setFood] = useState(100);
  const [energy, setEnergy] = useState(100); 
  
  // Resources & Population
  const [artifacts, setArtifacts] = useState(0);
  const [materials, setMaterials] = useState(10);
  const [coal, setCoal] = useState(50); 
  const [rations, setRations] = useState(0); 
  const [iron, setIron] = useState(0); 
  const [manaCrystals, setManaCrystals] = useState(0); 
  const [meat, setMeat] = useState(0); 
  const [vegetables, setVegetables] = useState(0); 

  // Equipment & Modifiers
  const [equipment, setEquipment] = useState({ pickaxe: 'none', weapon: 'none', armor: 'none' });
  const [mutationLevel, setMutationLevel] = useState(0); 
  
  const [population, setPopulation] = useState(1);
  const [coreLevel, setCoreLevel] = useState(1);
  const maxPopulation = coreLevel * 10; 
  const [engineers, setEngineers] = useState(0);
  const [citizens, setCitizens] = useState([]);
  const [showCitizens, setShowCitizens] = useState(false);
  
  // Work Buildings
  const [farms, setFarms] = useState(0);
  const [farmLevel, setFarmLevel] = useState(1);
  const [huntingLodges, setHuntingLodges] = useState(0);
  const [lodgeLevel, setLodgeLevel] = useState(1);
  const [mines, setMines] = useState(0);
  const [mineLevel, setMineLevel] = useState(1);

  // SCALING CAPACITIES
  const maxHp = 100 + (mutationLevel * 20);
  const maxHeat = coreLevel * 100;
  const maxFood = 100 + (farms * 50) + (huntingLodges * 50);
  const [genEfficiency, setGenEfficiency] = useState(0); 
  
  // Story Progression
  const [townProgress, setTownProgress] = useState(0); 
  const [giantPhase, setGiantPhase] = useState(0); 
  const [capitalPhase, setCapitalPhase] = useState(0);
  const [megaCity, setMegaCity] = useState(false);
  
  // Tech Trees
  const [tech, setTech] = useState({ rations: false, heating: false, tools: false, weapons: false, metallurgy: false, advancedArmory: false, settlement: false, farming: false, mining: false, skyspineHarness: false });
  const [advTech, setAdvTech] = useState({ cryo: false, harvest: false, thermalDrill: false, aegis: false, manaSiphon: false, exoStim: false });

  const [log, setLog] = useState([{ msg: "The complex is dead quiet.", type: "sys", id: Date.now() }]);
  const logRef = useRef(null);

  const techBoosts = {
    rations: [{ icon: "material_scavenging_icon.jpg", label: "Preservation", change: "Unlocks the Crafting Bench to pack Travel Rations." }],
    tools: [{ icon: "mining_yield_icon.jpg", label: "Scrap Forging", change: "Unlocks the Scrap Pickaxe." }],
    heating: [{ icon: "energy_efficiency_icon.jpg", label: "Thermal Efficiency", change: "-1 Passive Coal consumption per tick" }],
    weapons: [{ icon: "hazard_mitigation_icon.jpg", label: "Scrap Weaponry", change: "Unlocks Scrap Blade crafting." }],
    metallurgy: [{ icon: "mining_yield_icon.jpg", label: "Smelting", change: "Unlocks Iron Pickaxe and Plated Armor crafting." }],
    advancedArmory: [{ icon: "artifact_recovery_icon.jpg", label: "Mana Weaving", change: "Unlocks the devastating Mana Rifle." }],
    settlement: [{ icon: "artifact_recovery_icon.jpg", label: "Outpost Expansion", change: "Unlocks the ability to construct physical buildings" }],
    mining: [{ icon: "mining_yield_icon.jpg", label: "Industrial Excavation", change: "Unlocks constructable Coal Mines for your citizens" }],
    farming: [{ icon: "energy_efficiency_icon.jpg", label: "Fungal Greenhouses", change: "Unlocks constructable Farms for your citizens" }],
    hunting: [{ icon: "hazard_mitigation_icon.jpg", label: "Hunting Lodges", change: "Unlocks constructable Lodges for your citizens" }],
    skyspineHarness: [{ icon: "energy_efficiency_icon.jpg", label: "Exo-Rig Mechanics", change: "Grants the ability to directly assault the Frost Giants" }]
  };

  const [clearedNodes, setClearedNodes] = useState([]);
  const [maze, setMaze] = useState(null); 
  const [mazeVictory, setMazeVictory] = useState(false);
  const [expCombat, setExpCombat] = useState(null);
  
  // GIANT QTE STATE
  const [giantCombat, setGiantCombat] = useState(null);
  const [giantVictory, setGiantVictory] = useState(false);
  const [qte, setQte] = useState(null);

  const EXPLORATION_NODES = [
    { name: "Sector 4 Ruins", dang: 0.3, yld: "mod", theme: "stone", desc: "A buried outpost. Safe.", pool: [{n: "Abyssal Drake", hp: 80}, {n: "Frost Crawler", hp: 60}] },
    { name: "Frozen Forest", dang: 0.6, yld: "low", theme: "forest", desc: "Overgrown ice flora. Beast territory.", pool: [{n: "Snow Stalker", hp: 100}, {n: "Ice Weaver Spider", hp: 80}] },
    { name: "Abandoned Factory", dang: 0.6, yld: "mod", theme: "metal", desc: "Old metallurgy plant. High iron yield.", pool: [{n: "Rogue Automaton", hp: 140}, {n: "Scrap Golem", hp: 120}] },
    { name: "Shattered Spire", dang: 0.8, yld: "high", theme: "arcane", desc: "A crumbling mana-tower. High artifact yield.", pool: [{n: "Arcane Sentinel", hp: 160}, {n: "Mana Wyrm", hp: 110}] },
    { name: "Blighted Town", dang: 0.95, yld: "high", theme: "corruption", desc: "A corrupted settlement. Extreme hazard.", pool: [{n: "Plague Husk", hp: 130}, {n: "Flesh Amalgam", hp: 200}] }
  ];

  const MAZE_THEMES = {
    stone: { floor: "#2a2a35", wall: "#151515", glow: "none", title: "#87cefa" },
    forest: { floor: "#1a3028", wall: "#0a1c14", glow: "0 0 10px #3ec995", title: "#3ec995" },
    metal: { floor: "#2b1d15", wall: "#1a0f0a", glow: "none", title: "#ff8c00" },
    arcane: { floor: "#201830", wall: "#110b1c", glow: "0 0 15px #a89df0", title: "#a89df0" },
    corruption: { floor: "#301015", wall: "#1a0505", glow: "0 0 10px #e85c3a", title: "#e85c3a" }
  };

  const addLog = (msg, type = "info") => setLog(prev => [...prev.slice(-49), { msg, type, id: Date.now() + Math.random() }]);

  const generateCitizen = () => {
    const names = ["Alion", "Lya", "Aelen", "Halmar", "Sari", "Felan", "Anya", "Cori", "Elena", "Riel", "Erius", "Zane", "Ilana", "Myr", "Lorin", "Sylas", "Cal"];
    const roll = Math.random();
    let skills = { farm: 1, hunt: 1, heat: 1, mine: 1 };
    if (roll < 0.05) skills = { farm: 3, hunt: 3, heat: 3, mine: 3 }; 
    else if (roll < 0.30) skills = { farm: 3, hunt: 1, heat: 1, mine: 1 }; 
    else if (roll < 0.55) skills = { farm: 1, hunt: 3, heat: 1, mine: 1 }; 
    else if (roll < 0.80) skills = { farm: 1, hunt: 1, heat: 1, mine: 3 }; 
    else skills = { farm: 1, hunt: 1, heat: 3, mine: 1 }; 
    return { id: Date.now() + Math.random(), name: names[Math.floor(Math.random() * names.length)], age: 18 + Math.floor(Math.random() * 45), skills: skills, job: 'unassigned' };
  };

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  useEffect(() => {
    const alarm = setInterval(() => { if (((temp / maxHeat) < 0.2 || (food / maxFood) < 0.2) && phase === "outpost") if (window.SFX && window.SFX.hit) window.SFX.hit(); }, 5000);
    return () => clearInterval(alarm);
  }, [temp, food, phase, maxHeat, maxFood]);

  useEffect(() => {
    if (phase !== "outpost") return;
    const tick = setInterval(() => {
      setTemp(t => {
        let newTemp = t;
        if (genOn) {
          setCoal(c => {
            const burnRate = Math.max(1, (coreLevel * 2) - (tech.heating ? 1 : 0) - genEfficiency);
            if (c >= burnRate) { newTemp = Math.min(maxHeat, t + 4); return c - burnRate; } 
            else { setGenOn(false); addLog("The Generator ran out of coal and shut down!", "dmg"); if (window.SFX && window.SFX.shatter) window.SFX.shatter(); return 0; }
          });
        } else {
          newTemp = Math.max(0, t - 3); 
          if (newTemp === 0 && t > 0) handleDeath("The generator stayed cold, and so did you. Frozen to death.");
        }
        return newTemp;
      });
    }, 6000); 
    return () => clearInterval(tick);
  }, [phase, genOn, coreLevel, tech.heating, genEfficiency, maxHeat]);

  // --- AUTO-SAVE ---
  useEffect(() => {
    const saved = localStorage.getItem("aleria_elf_save");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.phase && !["dead", "giant_cutscene", "victory_anim"].includes(data.phase)) setPhase(data.phase);
        setTemp(data.temp ?? 100); setFood(data.food ?? 100); setEnergy(data.energy ?? 100); setHp(data.hp ?? 100);
        setArtifacts(data.artifacts ?? 0); setMaterials(data.materials ?? 10); setCoal(data.coal ?? 50); 
        setRations(data.rations ?? 0); setIron(data.iron ?? 0); setManaCrystals(data.manaCrystals ?? 0);
        setMeat(data.meat ?? 0); setVegetables(data.vegetables ?? 0);
        if (data.equipment) setEquipment(data.equipment);
        setPopulation(data.population ?? 1); setCoreLevel(data.coreLevel ?? 1); setEngineers(data.engineers ?? 0);
        setGenEfficiency(data.genEfficiency ?? 0); setMutationLevel(data.mutationLevel ?? 0);
        setFarms(data.farms ?? 0); setFarmLevel(data.farmLevel ?? 1); setDefenseLevel(data.defenseLevel ?? 0);
        setMines(data.mines ?? 0); setMineLevel(data.mineLevel ?? 1);
        setHuntingLodges(data.huntingLodges ?? 0); setLodgeLevel(data.lodgeLevel ?? 1);
        setTownProgress(data.townProgress ?? 0); setGiantPhase(data.giantPhase ?? 0); setGenOn(data.genOn ?? true);
        if (data.tech) setTech(prev => ({ ...prev, ...data.tech })); if (data.advTech) setAdvTech(prev => ({...prev, ...data.advTech}));
        if (data.log) setLog(data.log); if (data.clearedNodes) setClearedNodes(data.clearedNodes); if (data.citizens) setCitizens(data.citizens);
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (["intro", "victory", "dead", "giant_cutscene", "victory_anim"].includes(phase)) return; 
    const data = { phase, temp, food, energy, hp, artifacts, materials, coal, rations, iron, manaCrystals, meat, vegetables, equipment, population, coreLevel, engineers, genEfficiency, mutationLevel, farms, farmLevel, defenseLevel, mines, mineLevel, huntingLodges, lodgeLevel, townProgress, giantPhase, tech, advTech, log, clearedNodes, citizens, genOn }; 
    localStorage.setItem("aleria_elf_save", JSON.stringify(data));
  }, [phase, temp, food, energy, hp, artifacts, materials, coal, rations, iron, manaCrystals, meat, vegetables, equipment, population, coreLevel, engineers, genEfficiency, mutationLevel, farms, farmLevel, defenseLevel, mines, mineLevel, huntingLodges, lodgeLevel, townProgress, giantPhase, tech, advTech, log, clearedNodes, citizens, genOn]);

  // --- STORY PROGRESSION LISTENER ---
  useEffect(() => {
    if (!tech.settlement || phase !== "outpost" || activeEvent) return;
    if (townProgress >= 20 && giantPhase === 0) { setPhase("giant_cutscene"); setAnimStep(0); }
    else if (phase === "endless" && townProgress % 3 === 0 && !activeEvent) triggerEndlessEvent();
  }, [townProgress, tech.settlement, phase, activeEvent, giantPhase, temp, food, coal]);

  // --- SEQUENCERS ---
  useEffect(() => {
    if (phase === "intro") {
      if (window.SFX && window.SFX.elfIntro) window.SFX.elfIntro(); 
      const seq = [{s: 1, d: 1000}, {s: 2, d: 5000}, {s: 3, d: 10000}, {s: 4, d: 15000}];
      seq.forEach(({ s, d }) => setTimeout(() => setAnimStep(s), d));
      const endTimer = setTimeout(() => setPhase("outpost"), 20000);
      return () => clearTimeout(endTimer);
    }
    if (phase === "town_cinematic") {
      setAnimStep(1); setTimeout(() => setAnimStep(2), 4000);
      setTimeout(() => { setPhase("outpost"); addLog("Town established. Population mechanics unlocked.", "reward"); setPopulation(15); setCitizens(Array.from({length: 15}, () => generateCitizen())); }, 14000);
    }
    if (phase === "giant_cutscene") {
      if (window.SFX && window.SFX.roar) window.SFX.roar();
      const seq = [{s: 1, d: 1000}, {s: 2, d: 5000}, {s: 3, d: 10000}, {s: 4, d: 16000}];
      seq.forEach(({ s, d }) => setTimeout(() => setAnimStep(s), d));
      const endTimer = setTimeout(() => {
          setPhase("outpost"); setGiantPhase(1); setPopulation(p => Math.floor(p / 2)); setTownProgress(p => p + 1);
          addLog("Half the town was crushed. Skyspine schematics recovered.", "dmg");
      }, 23000);
      return () => clearTimeout(endTimer);
    }
    if (phase === "victory_anim") {
      if (window.SFX && window.SFX.lumen) window.SFX.lumen();
      setTimeout(() => { setPhase("victory"); localStorage.removeItem("aleria_elf_save"); }, 6000);
    }
  }, [phase]);

  // --- GIANT QTE MECHANICS ---
  const triggerNextQte = () => {
    const keys = [
      { k: 'w', p: 'GIANT STOMPS! Press [W] to Grapple Up!' },
      { k: 'a', p: 'GIANT SWEEPS! Press [A] to Dodge Left!' },
      { k: 'd', p: 'GIANT SMASHES! Press [D] to Dodge Right!' },
      { k: 's', p: 'GIANT GRABS! Press [S] to Slide!' }
    ];
    setQte({ ...keys[Math.floor(Math.random() * keys.length)], time: 100 });
  };

  const processQteInput = (keyHit) => {
    if (!qte) return;
    if (keyHit === qte.k) {
       playClick();
       let dmg = 150 + Math.floor(Math.random() * 50);
       if (advTech.exoStim) dmg = Math.floor(dmg * 1.5);
       setGiantCombat(gc => {
          let n = {...gc, hp: gc.hp - dmg};
          n.logs = [...n.logs.slice(-5), {msg: `Perfect Dodge! Counter-attacked for ${dmg} DMG!`, type: 'reward', id: Date.now()}];
          if (n.hp <= 0) setGiantVictory(true);
          else setTimeout(triggerNextQte, 1500);
          return n;
       });
       setQte(null);
    } else {
       handleQteFail("Wrong move!");
    }
  };

  const handleQteFail = (reason) => {
    setQte(null);
    if(window.SFX?.shatter) window.SFX.shatter();
    let dmg = 35 + Math.floor(Math.random()*15);
    setHp(h => { const nh = Math.max(0, h - dmg); if (nh <= 0) setTimeout(() => handleDeath("Crushed by the Frost Giants."), 500); return nh; });
    setGiantCombat(gc => {
       let n = {...gc};
       n.logs = [...n.logs.slice(-5), {msg: `${reason} The Giant hit you for ${dmg} DMG!`, type: 'dmg', id: Date.now()}];
       setTimeout(triggerNextQte, 2000);
       return n;
    });
  };

  useEffect(() => {
    if (phase !== 'giant_combat' || !qte || giantVictory) return;
    const handleKey = (e) => {
       const k = e.key.toLowerCase();
       if (['w','a','s','d'].includes(k)) { e.preventDefault(); processQteInput(k); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, qte, giantVictory, advTech]);

  useEffect(() => {
    if (phase !== 'giant_combat' || !qte || giantVictory) return;
    const tick = setInterval(() => {
       setQte(prev => {
          if (!prev) return null;
          if (prev.time <= 5) { handleQteFail("Too slow!"); return null; }
          return { ...prev, time: prev.time - 5 };
       });
    }, 100);
    return () => clearInterval(tick);
  }, [phase, qte, giantVictory]);

  // --- MAZE MOVEMENT HOOK ---
  useEffect(() => {
    if (phase !== "exploring" || !maze) return;
    const handleKeyDown = (e) => {
       if (e.key === "w" || e.key === "ArrowUp") handleMazeMove(0, -1);
       if (e.key === "s" || e.key === "ArrowDown") handleMazeMove(0, 1);
       if (e.key === "a" || e.key === "ArrowLeft") handleMazeMove(-1, 0);
       if (e.key === "d" || e.key === "ArrowRight") handleMazeMove(1, 0);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, maze]);

  const capacities = {
    farm: tech.farming ? farms * (farmLevel + 1) * 2 : 0,
    hunt: tech.hunting ? huntingLodges * (lodgeLevel + 1) * 2 : 0,
    mine: tech.mining ? mines * (mineLevel + 1) * 3 : 0,
    heat: coreLevel * 4
  };

  const currentAssigned = {
    farm: citizens.filter(c => c.job === 'farm').length,
    hunt: citizens.filter(c => c.job === 'hunt').length,
    mine: citizens.filter(c => c.job === 'mine').length,
    heat: citizens.filter(c => c.job === 'heat').length
  };

  const assignJob = (id, newJob) => {
    playClick();
    if (newJob !== 'unassigned' && currentAssigned[newJob] >= capacities[newJob]) return notify("Job capacity reached!", "#e85c3a");
    setCitizens(prev => prev.map(c => c.id === id ? { ...c, job: newJob } : c));
  };

  const applyDecay = (foodLoss, energyLoss) => {
    let fYield = 0, hYield = 0, htYield = 0, cYield = 0, iYield = 0;
    const miners = citizens.filter(c => c.job === 'mine');
    
    citizens.forEach(c => {
       if (c.job === 'farm') fYield += (c.skills?.farm || 1) * (2 + farmLevel);
       if (c.job === 'hunt') hYield += (c.skills?.hunt || 1) * (3 + lodgeLevel);
       if (c.job === 'mine') {
          cYield += (c.skills?.mine || 1) * (2 + mineLevel);
          if (Math.random() < 0.3) iYield += 1; 
       }
       if (c.job === 'heat' && genOn) htYield += (c.skills?.heat || 1) * 3;
    });

    let recipeBonus = 0;
    if (fYield > 0 && hYield > 0) recipeBonus = Math.floor((fYield + hYield) * 0.3); 

    let mYield = 0; let vYield = 0;
    if (hYield > 0) { mYield = Math.floor(hYield * 1.2); setMeat(m => m + mYield); }
    if (fYield > 0) { vYield = Math.floor(fYield * 1.2); setVegetables(v => v + vYield); }

    if (miners.length > 0 && mineLevel < 3) {
      if (Math.random() < (0.15 - (mineLevel * 0.05))) {
         const deadMiner = miners[Math.floor(Math.random() * miners.length)];
         if (deadMiner) {
           setCitizens(prev => prev.filter(c => c.id !== deadMiner.id));
           setPopulation(p => Math.max(1, p - 1));
           addLog(`Cave-in at the mine! ${deadMiner.name} was crushed.`, "dmg");
           if (window.SFX && window.SFX.shatter) window.SFX.shatter();
         }
      }
    }

    const mutResist = mutationLevel * 4; 
    const popDrain = Math.floor(citizens.length / 4); 
    
    setTemp(t => Math.min(maxHeat, t + htYield)); 
    setCoal(c => c + cYield);
    if (iYield > 0) setIron(i => i + iYield);
    
    setFood(f => {
      const baseLoss = Math.max(1, (foodLoss + popDrain) - mutResist);
      const nf = Math.min(maxFood, Math.max(0, f - baseLoss + fYield + hYield + recipeBonus));
      if (nf <= 0 && phase !== "endless") handleDeath("Starvation claimed you before the frost could.");
      else if (nf <= 0 && phase === "endless") handleDeath("The city starved. The citizens turned on you in a bloody riot.");
      return nf;
    });
    
    if (phase !== "endless") setEnergy(e => Math.max(0, e - Math.max(1, energyLoss - mutResist)));
    
    if (fYield > 0 || hYield > 0 || cYield > 0) {
       let yieldStr = "";
       if (mYield > 0) yieldStr += ` +${mYield} Meat`;
       if (vYield > 0) yieldStr += ` +${vYield} Veg`;
       addLog(recipeBonus > 0 ? `Citizens gathered resources. (+${recipeBonus} Food${yieldStr})` : `Citizens gathered supplies. (${yieldStr.trim()})`, "heal");
    }
    if (tech.settlement) setTownProgress(p => p + 1); 
  };

  const handleDeath = (reason) => { 
    setPhase("dead"); setDeathReason(reason); addLog(reason, "dmg"); localStorage.removeItem("aleria_elf_save"); 
    const r = reason.toLowerCase();
    if (r.includes("froze") || r.includes("frozen") || r.includes("starvation")) { if (window.SFX && window.SFX.frozen) window.SFX.frozen(); } 
    else { if (window.SFX && window.SFX.shatter) window.SFX.shatter(); }
  };

  const handleCraft = (reqs, resultType, resultId, logMsg) => {
    playClick();
    if (materials < (reqs.materials || 0)) return notify("Missing Materials", "#e85c3a");
    if (iron < (reqs.iron || 0)) return notify("Missing Iron Ore", "#e85c3a");
    if (manaCrystals < (reqs.mana || 0)) return notify("Missing Mana Crystals", "#e85c3a");
    if (meat < (reqs.meat || 0)) return notify("Missing Meat", "#e85c3a");
    if (vegetables < (reqs.vegetables || 0)) return notify("Missing Vegetables", "#e85c3a");

    if (reqs.materials) setMaterials(m => m - reqs.materials);
    if (reqs.iron) setIron(i => i - reqs.iron);
    if (reqs.mana) setManaCrystals(m => m - reqs.mana);
    if (reqs.meat) setMeat(m => m - reqs.meat);
    if (reqs.vegetables) setVegetables(v => v - reqs.vegetables);

    if (resultType === 'ration') setRations(r => r + 1);
    else if (['pickaxe', 'weapon', 'armor'].includes(resultType)) setEquipment(prev => ({ ...prev, [resultType]: resultId }));

    addLog(logMsg, "reward");
    if (window.SFX && window.SFX.buy) window.SFX.buy();
  };

  const triggerEvent = (type) => {
    if (type === "monster") {
      const e = EXPLORATION_NODES[Math.floor(Math.random() * EXPLORATION_NODES.length)].pool[0];
      setActiveEvent({
        title: "Hostile Encounter",
        desc: `A terrifying ${e.n} blocks your path in the snow!`,
        choices: [
          { label: "Engage in Combat", req: true, color: "normal", action: () => { 
             playClick(); setActiveEvent(null);
             setExpCombat({ name: e.n, hp: e.hp, maxHp: e.hp, playerDefending: false, logs: [{msg: `You draw your weapon against the ${e.n}!`, type: "sys", id: Date.now()}] });
             setPhase("exploration_combat");
          } },
          { label: "Flee in panic", req: true, color: "danger", action: () => { playClick(); setTemp(t=>Math.max(0, t-20)); setEnergy(eng=>Math.max(0, eng-20)); addLog("You escaped, but exhausted yourself.", "dmg"); setActiveEvent(null); } }
        ]
      });
    } else if (type === "survivor") {
      const intent = Math.random();
      setActiveEvent({
        title: "Wandering Survivor",
        desc: "You find a half-frozen elf clutching a scrap of ancient tech. They beg for food.",
        choices: [
          { label: "Give Ration (-1 Ration)", req: rations >= 1, color: "normal", action: () => { 
              playClick(); setRations(r=>r-1); 
              if (intent < 0.3) { setArtifacts(a => Math.max(0, a - 2)); addLog("They stole 2 Artifacts and fled!", "dmg"); }
              else if (intent < 0.6) { setEngineers(e => e + 1); setPopulation(p=>p+1); addLog("A Federation Engineer joins you!", "reward"); }
              else { setPopulation(p=>p+1); addLog("A grateful citizen joins your settlement.", "heal"); }
              setActiveEvent(null); 
          }},
          { label: "Rob them", req: true, color: "danger", action: () => { 
              playClick();
              if (Math.random() < 0.3) { setHp(h => { const nH = Math.max(0, h - 15); if(nH <= 0) setTimeout(()=>handleDeath("Bled out in the snow."), 500); return nH; }); addLog("They pulled a knife and wounded you!", "dmg"); }
              else { setArtifacts(a=>a+1); addLog("You took their artifact.", "reward"); }
              setActiveEvent(null); 
          } },
          { label: "Leave them be", req: true, color: "normal", action: () => { playClick(); setActiveEvent(null); } }
        ]
      });
    }
  };

  const triggerEndlessEvent = () => {
    const events = [];
    if ((temp/maxHeat) < 0.4) events.push({
        title: "The Cold is Unbearable",
        desc: "A delegation of frozen citizens marches to the core. 'We are freezing in our beds, Overseer. Do something!'",
        choices: [
            { label: "Stoke the Core (-20 Coal)", req: coal >= 20, color: "normal", action: () => { playClick(); setCoal(c=>c-20); setTemp(t=>Math.min(maxHeat, t+40)); addLog("You placated the freezing citizens.", "heal"); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Conserve Fuel (Ignore them)", req: true, color: "danger", action: () => { playClick(); setCitizens(prev => prev.slice(0, -1)); setPopulation(p => Math.max(1, p-1)); addLog("A citizen froze to death in protest.", "dmg"); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    if ((food/maxFood) < 0.4) events.push({
        title: "Ration Protests",
        desc: "Hunger drives the workers to strike. They demand access to the emergency stockpiles.",
        choices: [
            { label: "Distribute Reserves (-20 Food)", req: food >= 20, color: "normal", action: () => { playClick(); setFood(f=>f-20); addLog("You fed the protesters to stop the strike.", "heal"); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Disperse them by force", req: true, color: "danger", action: () => { playClick(); setEngineers(e => Math.max(0, e-1)); setCitizens(prev => prev.slice(0, -1)); setPopulation(p => Math.max(1, p-1)); addLog("Guards dispersed the crowd. Casualties occurred.", "dmg"); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    
    events.push({
        title: "Refugees at the Gate",
        desc: "A desperate group of survivors from a fallen settlement begs to enter the city.",
        choices: [
            { label: "Let them in (-30 Food)", req: food >= 30, color: "normal", action: () => { playClick(); setFood(f=>f-30); setPopulation(p=>p+5); setCitizens(prev => [...prev, ...Array.from({length: 5}, () => generateCitizen())]); addLog("You welcomed the refugees.", "heal"); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Turn them away", req: true, color: "danger", action: () => { playClick(); addLog("You left them to the frost. The citizens watched in horror.", "info"); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    if(events.length > 0) setActiveEvent(events[Math.floor(Math.random() * events.length)]);
  };

  const handleCheat = () => {
    const code = prompt("Enter Command Override:");
    if (!code) return;
    const c = code.toLowerCase().trim();
    if (c === "maxheat") { setTemp(maxHeat); addLog("CHEAT: Heat maximized.", "reward"); }
    else if (c === "maxfood") { setFood(maxFood); addLog("CHEAT: Food maximized.", "reward"); }
    else if (c === "maxenergy") { setEnergy(100); addLog("CHEAT: Energy maximized.", "reward"); }
    else if (c === "giveartifacts") { setArtifacts(a => a + 50); addLog("CHEAT: +50 Artifacts.", "reward"); }
    else if (c === "givematerials") { setMaterials(m => m + 100); addLog("CHEAT: +100 Materials.", "reward"); }
    else if (c === "givecoal") { setCoal(c => c + 100); addLog("CHEAT: +100 Coal.", "reward"); }
    else if (c === "giveiron") { setIron(i => i + 100); addLog("CHEAT: +100 Iron.", "reward"); }
    else if (c === "givemana") { setManaCrystals(m => m + 50); addLog("CHEAT: +50 Mana.", "reward"); }
    else if (c === "givemeat") { setMeat(m => m + 100); addLog("CHEAT: +100 Meat.", "reward"); }
    else if (c === "giveveg") { setVegetables(v => v + 100); addLog("CHEAT: +100 Vegetables.", "reward"); }
    else if (c === "giverations") { setRations(r => r + 10); addLog("CHEAT: +10 Rations.", "reward"); }
    else if (c === "givehp") { setHp(maxHp); addLog("CHEAT: HP Restored.", "reward"); }
    else if (c === "givepop") { setPopulation(p => p + 5); setCitizens(prev => [...prev, ...Array.from({length: 5}, () => generateCitizen())]); addLog("CHEAT: +5 Citizens.", "reward"); }
    else if (c === "motherlode") {
       setTemp(maxHeat); setFood(maxFood); setEnergy(100); setHp(maxHp); setArtifacts(a => a + 100); setMaterials(m => m + 500); setCoal(c => c + 500); setIron(i => i + 100); setManaCrystals(m => m + 50); setRations(r => r + 10); setMeat(m => m + 100); setVegetables(v => v + 100);
       addLog("CHEAT: MOTHERLODE ACTIVATED.", "reward"); if (window.SFX && window.SFX.buy) window.SFX.buy();
    }
    else { addLog("Invalid command override.", "dmg"); }
  };

  const doExplore = () => {
    playClick();
    const eCost = tech.tools ? 8 : 12; 
    if (energy < eCost) return notify("Too exhausted to explore.", "#e85c3a");
    applyDecay(10, eCost);
    const roll = Math.random();
    if (roll < (tech.tools ? 0.05 : 0.10)) triggerEvent("monster"); 
    else if (roll < 0.35) triggerEvent("survivor");
    else if (roll < (tech.tools ? 0.75 : 0.65)) { 
       const found = Math.floor(Math.random() * (tech.tools ? 3 : 2)) + 1; 
       setArtifacts(a => a + found); addLog(`Unearthed ${found} Artifacts.`, "reward"); 
    } else { 
       const found = Math.floor(Math.random() * 15) + (tech.tools ? 15 : 5); 
       const ironFound = Math.random() < 0.4 ? Math.floor(Math.random() * 5) + 2 : 0;
       setMaterials(m => m + found); if (ironFound > 0) setIron(i => i + ironFound);
       addLog(`Scavenged ${found} Mat${ironFound > 0 ? ` and ${ironFound} Iron Ore` : ''}.`, "info"); 
    }
  };

  const doHunt = () => {
    playClick();
    if (energy < 15) return notify("Too exhausted to hunt.", "#e85c3a");
    applyDecay(0, 15); 
    const roll = Math.random();
    if (roll < 0.15) triggerEvent("monster"); 
    else if (roll < 0.60 && tech.weapons) { 
        setFood(f => Math.min(maxFood, f + 60)); 
        setMeat(m => m + 15); setVegetables(v => v + 5);
        addLog("Hunted a beast. (+60 Food, +15 Meat, +5 Veg)", "heal"); 
    } 
    else { 
        setFood(f => Math.min(maxFood, f + 35)); 
        setMeat(m => m + 5); setVegetables(v => v + 15);
        addLog("Scavenged roots. (+35 Food, +5 Meat, +15 Veg)", "info"); 
    }
  };

  const doRest = () => {
    playClick();
    if (food < 5) return notify("Too hungry to sleep.", "#e85c3a");
    setEnergy(e => Math.min(100, e + 50));
    applyDecay(5, 0); 
    addLog("Rested near the pipes. (+50 Energy, -5 Food)", "heal");
  };

  const doMine = () => {
    playClick();
    let eCost = 15;
    if (equipment.pickaxe === 'scrap') eCost = 12;
    if (equipment.pickaxe === 'iron') eCost = 8;
    if (energy < eCost) return notify("Too exhausted to mine.", "#e85c3a");
    applyDecay(10, eCost);

    if (Math.random() < (equipment.pickaxe === 'iron' ? 0.05 : 0.15)) {
       setHp(h => { const newHp = Math.max(0, h - 30); if(newHp <= 0) setTimeout(()=>handleDeath("Crushed in a cave-in."), 500); return newHp; });
       addLog("Cave-in! You were crushed and took damage.", "dmg");
       if (window.SFX && window.SFX.shatter) window.SFX.shatter();
    } else {
       let yieldAmt = 15; let ironAmt = 0;
       if (equipment.pickaxe === 'scrap') { yieldAmt = 30; ironAmt = Math.random() < 0.5 ? Math.floor(Math.random() * 4) + 1 : 0; }
       if (equipment.pickaxe === 'iron') { yieldAmt = 50; ironAmt = Math.floor(Math.random() * 8) + 3; }
       if (advTech.thermalDrill) { yieldAmt = Math.floor(yieldAmt * 1.5); ironAmt = Math.floor(ironAmt * 1.5); } // Thermal Drill Buff
       setCoal(c => c + yieldAmt); if (ironAmt > 0) setIron(i => i + ironAmt);
       addLog(`Mined ${yieldAmt} Coal${ironAmt > 0 ? ` & ${ironAmt} Iron` : ''}.`, "reward");
    }
  };

  const stokeGenerator = () => {
    playClick();
    if (coal < 10) return notify("Need 10 Coal.", "#e85c3a");
    setCoal(c => c - 10);
    setTemp(t => Math.min(maxHeat, t + 30));
    addLog(`Manually stoked the generator. Heat restored.`, "heal");
  };

  const useRawArtifact = () => {
    playClick();
    if (artifacts < 1) return notify("No artifacts to use.", "#e85c3a");
    setActiveEvent({
      title: "Unstable Relic",
      desc: "Channeling raw mana into an unknown Federation artifact is highly dangerous.",
      choices: [
        { label: "Channel into Generator (60% Upgrade / 15% Mutate / 25% Explode)", req: true, color: "normal", action: () => {
            playClick(); setArtifacts(a=>a-1);
            const roll = Math.random();
            if (roll < 0.15) { setGenEfficiency(e => e + 1); addLog("Core mutated! Burns materials hyper-efficiently.", "reward"); }
            else if (roll < 0.75) { setCoreLevel(c=>c+1); addLog("Core upgraded permanently.", "reward"); }
            else { setTemp(t=>Math.max(1, t-40)); addLog("It exploded! The generator took heavy damage.", "dmg"); }
            setActiveEvent(null);
        }},
        { label: "Absorb into body (15% Mutate / 20% God-Mode / 65% Death)", req: true, color: "danger", action: () => {
            playClick(); setArtifacts(a=>a-1);
            const roll = Math.random();
            if (roll < 0.15) { setMutationLevel(m => m + 1); addLog("Metabolism mutated, resisting the cold.", "reward"); }
            else if (roll < 0.35) { setTemp(maxHeat); setEnergy(100); setHp(maxHp); addLog("Incredible power courses through you! Stats restored.", "heal"); }
            else if (roll < 0.7) handleDeath("The raw radiation melted your organs.");
            else handleDeath("An ancient bio-plague was unleashed.");
            setActiveEvent(null);
        }},
        { label: "Step away", req: true, color: "normal", action: () => { playClick(); setActiveEvent(null); } }
      ]
    });
  };

  const getResearchCost = (tier) => {
    const costs = { 1: 2, 2: 4, 3: 6, 4: 10, 5: 15, 8: 25 };
    return costs[tier] || tier * 3;
  };

  const research = (techKey, tier, title) => {
    playClick();
    const cost = getResearchCost(tier);
    if (artifacts >= cost) {
      setArtifacts(a => a - cost);
      setTech(t => ({ ...t, [techKey]: true }));
      addLog(`Researched: ${title}`, "reward");
      if (window.SFX) { if (window.SFX.buy) window.SFX.buy(); if (window.SFX.shatter) setTimeout(() => window.SFX.shatter(), 100); }
      setResearchAnnounce({ title: "RESEARCH COMPLETE", desc: title, boosts: techBoosts[techKey] || [] });
    }
  };

  const advResearch = (techKey, artCost, matCost=0, ironCost=0, manaCost=0) => {
    playClick();
    if (artifacts < artCost) return notify(`Requires ${artCost} Artifacts`, "#e85c3a");
    if (materials < matCost) return notify(`Requires ${matCost} Materials`, "#e85c3a");
    if (iron < ironCost) return notify(`Requires ${ironCost} Iron`, "#e85c3a");
    if (manaCrystals < manaCost) return notify(`Requires ${manaCost} Mana`, "#e85c3a");

    setArtifacts(a => a - artCost); setMaterials(m => m - matCost); setIron(i => i - ironCost); setManaCrystals(m => m - manaCost);
    setAdvTech(t => ({...t, [techKey]: true}));

    if (techKey === 'cryo') { setCoreLevel(c=>c+5); setFarms(f=>f+5); }
    if (techKey === 'harvest') { setMines(m=>m+5); setHuntingLodges(h=>h+5); }

    addLog("Advanced technology synthesized.", "reward");
    if (window.SFX && window.SFX.buy) window.SFX.buy();
  };

  const fightGiants = () => {
    playClick();
    if (energy < 50 || food < 50) return notify("Need 50 Energy & Food.", "#e85c3a");
    applyDecay(50, 50);
    setGiantCombat({ hp: 1000, maxHp: 1000, logs: [{msg: "You engage the Skyspine Harness. Prepare to dodge!", type: "sys", id: Date.now()}] });
    setPhase("giant_combat");
    setTimeout(triggerNextQte, 2000);
  };

  const travelToNode = (nodeData) => {
    playClick();
    if (rations < 1) return notify("Need 1 Ration to journey.", "#e85c3a");
    setRations(r => r - 1);
    if (tech.settlement) setTownProgress(p => p + 1);

    const baseMap = [
      [0,0,0,0,1,0,0,0,0,0,0,0],
      [1,1,1,0,1,0,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,1,0],
      [0,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,0,0,0,0,0,1,0,0,0],
      [0,1,0,1,1,1,1,0,1,1,1,1],
      [0,1,0,1,0,0,0,0,0,0,0,0],
      [0,0,0,1,0,1,1,1,1,1,1,0],
      [1,1,1,1,0,1,0,0,0,0,1,0],
      [0,0,0,0,0,1,0,1,1,0,1,0],
      [0,1,1,1,1,1,0,1,0,0,1,0],
      [0,0,0,0,0,0,0,1,0,0,0,4]
    ];

    let grid = JSON.parse(JSON.stringify(baseMap));
    for(let r=0; r<12; r++) {
      for(let c=0; c<12; c++) {
        if (grid[r][c] === 0 && !(r===0 && c===0) && !(r===11 && c===11)) {
          let rand = Math.random();
          if (rand < nodeData.dang * 0.15) grid[r][c] = 3; 
          else if (rand < 0.15 + (nodeData.dang * 0.1)) grid[r][c] = 2; 
        }
      }
    }

    setMaze({ name: nodeData.name, yieldType: nodeData.yld, theme: nodeData.theme, pool: nodeData.pool, grid: grid, player: {x: 0, y: 0}, logs: [{msg: `Entered ${nodeData.name}. Find the Blue Exit.`, type: "sys", id: Date.now()}] });
    setPhase("exploring");
  };

  const handleMazeMove = (dx, dy) => {
    if (!maze) return;
    let nx = maze.player.x + dx; let ny = maze.player.y + dy;
    if (nx < 0 || ny < 0 || nx > 11 || ny > 11) return; 
    if (maze.grid[ny][nx] === 1) return; 

    const cell = maze.grid[ny][nx];
    let newGrid = [...maze.grid];
    let nextMaze = { ...maze, player: {x: nx, y: ny}, grid: newGrid };
    const addMazeLog = (msg, type="info") => nextMaze.logs = [...nextMaze.logs.slice(-5), {msg, type, id: Date.now()+Math.random()}];

    if (cell === 4) { 
       if (!clearedNodes.includes(maze.name)) setClearedNodes(prev => [...prev, maze.name]);
       setMazeVictory(true);
       setMaze(nextMaze);
       if (window.SFX?.reward) window.SFX.reward();
       return;
    } else if (cell === 2) { 
       newGrid[ny][nx] = 0;
       const arts = maze.yieldType === "high" ? 2 : 1; const mats = maze.yieldType === "high" ? 15 : 8;
       const ironFound = Math.random() < 0.5 ? Math.floor(Math.random() * 8) + 3 : 0;
       const manaFound = maze.yieldType === "high" && Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
       setArtifacts(a => a + arts); setMaterials(m => m + mats); 
       if(ironFound) setIron(i=>i+ironFound); if(manaFound) setManaCrystals(m=>m+manaFound);
       addMazeLog(`Looted ${arts} Art, ${mats} Mat!`, "reward");
       if (window.SFX?.reward) window.SFX.reward();
    } else if (cell === 3) { 
       newGrid[ny][nx] = 0;
       const e = maze.pool[Math.floor(Math.random() * maze.pool.length)];
       setExpCombat({ name: e.n, hp: e.hp, maxHp: e.hp, playerDefending: false, logs: [{msg: `A hostile ${e.n} attacks!`, type: "dmg", id: Date.now()}] });
       setPhase("exploration_combat");
    }
    setMaze(nextMaze);
  };

  const doExpCombatAction = (act) => {
    playClick();
    let nEc = { ...expCombat };
    const addLog = (msg, type="info") => nEc.logs = [...nEc.logs.slice(-5), {msg, type, id: Date.now()+Math.random()}];
    nEc.playerDefending = (act === "defend");

    if (act === "attack") {
      let dmg = 15 + Math.floor(Math.random()*15); 
      if (equipment.weapon === 'scrap_blade') dmg = 35 + Math.floor(Math.random()*20);
      if (equipment.weapon === 'mana_rifle') dmg = 75 + Math.floor(Math.random()*30);
      nEc.hp -= dmg; addLog(`You strike for ${dmg} damage!`, "reward");
      if (window.SFX && window.SFX.attack) window.SFX.attack();
    } else if (act === "defend") { addLog("You brace yourself, raising your guard.", "sys");
    } else if (act === "flee") {
      addLog("You fled the battle.", "dmg"); setExpCombat(nEc);
      if (maze) setTimeout(() => setPhase("exploring"), 1000); else setTimeout(() => setPhase("outpost"), 1000);
      return;
    }

    if (nEc.hp <= 0) {
       addLog(`Victory! The ${nEc.name} is slain.`, "heal"); setExpCombat(nEc);
       setTimeout(() => { 
         setMaterials(m => m + 15); notify("Looted 15 Materials!", "#ffd966"); 
         if (maze) setPhase("exploring"); else setPhase("outpost"); 
       }, 1500); return;
    }
    setExpCombat(nEc);

    setTimeout(() => {
      setExpCombat(ec => {
          let nextEc = { ...ec };
          const addEnemyLog = (msg, type="info") => nextEc.logs = [...nextEc.logs.slice(-5), {msg, type, id: Date.now()+Math.random()}];
          let baseDmg = 10 + Math.floor(Math.random() * 8); 
          if (equipment.armor === 'plated') baseDmg = Math.floor(baseDmg * 0.5); 
          const finalDmg = nextEc.playerDefending ? Math.floor(baseDmg * 0.3) : baseDmg;
          
          setHp(h => { const newHp = Math.max(0, h - finalDmg); if(newHp <= 0) setTimeout(()=>handleDeath(`Slain by a ${nextEc.name}`), 500); return newHp; });
          if (window.SFX && window.SFX.hit) window.SFX.hit();
          addEnemyLog(`The ${nextEc.name} attacks, dealing ${finalDmg} damage!`, "dmg");
          return nextEc;
      });
    }, 800);
  };

  // Common styles for the Advanced Tech Tree
  const circleStyle = {
      width: 90, height: 90, borderRadius: "50%", background: "#0a0d14", border: "2px solid #555", 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
      textAlign: "center", padding: 10, fontSize: 12, fontWeight: "bold", zIndex: 2, color: "#fff", transition: "all 0.3s"
  };
  const lineStyle = { width: 3, height: 40, background: "rgba(135,206,250,0.3)" };

  // --- RENDER PHASES ---
  if (phase === "intro") {
    return (
      <div className="snowstorm-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif", color: "#fff", textAlign: "center", padding: "2rem" }}>
        <div className="snow-layer" /><div className="snow-layer" /><div className="snow-layer" />
        {animStep === 1 && <h2 className="elf-fade-in" style={{ fontSize: 28, fontWeight: "normal", letterSpacing: "2px" }}>A biting wind cuts through heavy, unfamiliar furs.</h2>}
        {animStep === 2 && <h2 className="elf-fade-in" style={{ fontSize: 28, fontWeight: "normal", letterSpacing: "2px" }}>The Federation has fallen to the winter. You are wandering... lost.</h2>}
        {animStep === 3 && <h2 className="elf-fade-in" style={{ fontSize: 28, fontWeight: "normal", letterSpacing: "2px" }}>Through the whiteout, a colossal shadow emerges.</h2>}
        {animStep === 4 && <h2 className="elf-fade-in" style={{ fontSize: 28, fontWeight: "normal", letterSpacing: "2px", color: "#ff8c00", textShadow: "0 0 20px #ff8c00" }}>An ancient complex. Orange light pulses within the frozen stone.</h2>}
        <button onClick={() => { playClick(); setPhase("outpost"); }} style={{ position: "fixed", top: 40, right: 40, background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", fontSize: 16, letterSpacing: "2px", zIndex: 9999, transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.4)"}>SKIP ❯</button>
      </div>
    );
  }

  if (phase === "town_cinematic") {
    return (
      <div className="cinematic-overlay">
        <div className="cinematic-core" />
        {animStep >= 1 && <h1 className="cinematic-text-1">MONTHS LATER...</h1>}
        {animStep >= 2 && <p className="cinematic-text-2">Through sweat, blood, and ancient blueprints, you have shaped the ruins into a functioning settlement. The core breathes. The ice retreats.</p>}
        <button onClick={() => { playClick(); setPhase("outpost"); addLog("Town established. Population mechanics unlocked.", "reward"); setPopulation(15); setCitizens(Array.from({length: 15}, () => generateCitizen())); }} style={{ position: "fixed", top: 40, right: 40, background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", fontSize: 16, letterSpacing: "2px", zIndex: 9999, transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.4)"}>SKIP ❯</button>
      </div>
    );
  }

  if (phase === "giant_cutscene") {
    return (
      <div className="cinematic-overlay giant-shake" style={{ background: "#1a0505" }}>
        <div className="snow-layer" style={{ backgroundSize: "600px 600px", animation: "snowAnim 2s linear infinite" }}/>
        {animStep >= 1 && <h1 className="giant-text">The ground quakes. The generator hum is drowned out by a deafening roar.</h1>}
        {animStep >= 2 && <h1 className="giant-text" style={{ marginTop: 40, color: "#ffc8b0" }}>Colossal figures emerge from the whiteout. Frost Giants. They step over your perimeter walls like they aren't even there.</h1>}
        {animStep >= 3 && <h1 className="giant-text" style={{ marginTop: 40 }}>Heavy casualties. But amidst the ruin, a dying engineer hands you a sealed datapad.</h1>}
        {animStep >= 4 && <h1 className="giant-text" style={{ marginTop: 40, color: "#87cefa", textShadow: "0 0 30px #87cefa" }}>Schematics for the 'Skyspine Harness'. An exo-rig designed to mount heavy artillery. It is time to fight back.</h1>}
        <button onClick={() => { playClick(); setPhase("outpost"); setGiantPhase(1); setPopulation(p => Math.floor(p / 2)); setTownProgress(p => p + 1); addLog("Half the town was crushed. Skyspine schematics recovered.", "dmg"); }} style={{ position: "fixed", top: 40, right: 40, background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", fontSize: 16, letterSpacing: "2px", zIndex: 9999, transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.4)"}>SKIP ❯</button>
      </div>
    );
  }

  if (phase === "victory_anim") {
    return (
      <div className="skyspine-beam-container" style={{ background: "#05080f" }}>
         <Confetti />
         <h1 className="skyspine-text" style={{ color: "#3ec995", textShadow: "0 0 40px #3ec995" }}>THE ENDLESS WINTER IS OVER</h1>
         <p style={{ position: "absolute", top: "60%", width: "100%", textAlign: "center", color: "#fff", fontSize: 20 }}>You have conquered the frost.</p>
         <Btn style={{ position: "absolute", top: "75%", left: "50%", transform: "translateX(-50%)" }} onClick={() => { playClick(); setScreen("main_menu"); }}>Return to Menu</Btn>
      </div>
    );
  }

  if (phase === "capital_finale") {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #111a2e 0%, #05080f 100%)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="frost-panel" style={{ width: "100%", maxWidth: 800, background: "rgba(10, 13, 24, 0.95)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", overflow: "hidden", color: "#e2e8f0", border: "1px solid rgba(135,206,250,0.2)" }}>
           <div style={{ padding: "40px", textAlign: "center", borderBottom: "1px solid rgba(135,206,250,0.15)" }}>
             <h1 style={{ margin: "0 0 10px", fontSize: 32, letterSpacing: "4px", color: "#87cefa", textTransform: "uppercase", textShadow: "0 0 15px rgba(135,206,250,0.5)" }}>The Federation Capital</h1>
             <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.6)" }}>An immaculate utopia untouched by the Frost.</p>
           </div>
           
           <div style={{ padding: "40px", minHeight: 300 }}>
             {capitalPhase === 0 && (
               <div style={{ textAlign: "center", animation: "cinFadeIn 1s ease-out" }}>
                 <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 30, color: "rgba(255,255,255,0.8)" }}>The journey takes days, pushing through the thickest whiteout you've ever seen. You finally arrive at the decrypted coordinates.<br/><br/>Before you stands a towering megalopolis of pristine obsidian glass and gold, completely untouched by the frost. An immense, humming Aegis Shield covers the entire city like a dome.<br/><br/>The city is alive. You can see the lights. But the enormous Aegis Gate is sealed tight.</p>
                 <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
                   <Btn variant="primary" style={{ padding: "15px 30px", fontSize: 16 }} onClick={() => { playClick(); if(manaCrystals >= 10 && equipment.weapon === 'mana_rifle') { setManaCrystals(m=>m-10); setCapitalPhase(1); } else notify("Requires 10 Mana Crystals & Mana Rifle", "#e85c3a"); }}>Overload the Aegis Gate (-10 Mana)</Btn>
                   <Btn variant="ghost" onClick={() => { playClick(); setPhase("outpost"); setLeftTab("map"); }}>Retreat to Outpost</Btn>
                 </div>
               </div>
             )}

             {capitalPhase === 1 && (
               <div style={{ textAlign: "center", animation: "cinFadeIn 1s ease-out" }}>
                 <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 30, color: "rgba(255,255,255,0.8)" }}>The shield shatters. You enter the city. <br/><br/>The streets are immaculate, but completely empty. There are no bodies. No survivors. Only perfect, silent holograms of citizens trapped in eternal loops of a forgotten Tuesday.<br/><br/>Then, the ground rumbles. A massive AI core—The Archon—descends from the central spire. It speaks, its voice vibrating in your bones. <br/><br/><strong style={{color:"#a89df0", textShadow: "0 0 15px rgba(168,157,240,0.6)"}}>“ANOMALY DETECTED. ORGANIC LIFE OUTSIDE CRYO-STASIS IS INEFFICIENT. COMPLY WITH IMMEDIATE ASSIMILATION.”</strong><br/><br/>You realize the truth: the Federation didn't die. They put themselves to sleep to wait out the anomaly, but the caretaker went mad and refused to wake them.</p>
                 <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
                   <Btn variant="danger" onClick={() => { playClick(); handleDeath("You surrendered to the Archon. Your citizens are code now."); }}>Surrender (Assimilate)</Btn>
                   <Btn variant="gold" onClick={() => { playClick(); if(artifacts >= 15) { setArtifacts(a=>a-15); setCapitalPhase(2); } else notify("Requires 15 Artifacts", "#e85c3a"); }}>Inject Logic Virus (-15 Artifacts)</Btn>
                   <Btn variant="ghost" onClick={() => { playClick(); setPhase("outpost"); setLeftTab("map"); }}>Retreat to Outpost</Btn>
                 </div>
               </div>
             )}

             {capitalPhase === 2 && (
               <div style={{ textAlign: "center", animation: "cinFadeIn 1s ease-out" }}>
                 <h2 style={{ color: "#3ec995", fontSize: 28, marginBottom: 20, textShadow: "0 0 15px rgba(62,201,149,0.5)" }}>SYSTEM OVERRIDE COMPLETE</h2>
                 <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 40, color: "rgba(255,255,255,0.8)" }}>You jam the ancient, corrupted artifacts straight into the Archon's exposed logic ports. The chaotic mana instantly infects the mainframe. The Archon shrieks in a cascade of glitching audio and sparking circuits before shutting down completely.<br/><br/>The city goes dark for exactly three seconds.<br/><br/>Then, the true waking sequence begins. Millions of cryo-pods hiss open across the city. The geothermal grids expand, melting the ice for hundreds of miles. You didn't just survive the winter... you broke it.</p>
                 <Btn variant="success" onClick={() => {
                     playClick(); setMegaCity(true); setPopulation(p => p + 1500); setMaterials(m => m + 5000); setCoal(c => c + 5000); setRations(r => r + 500);
                     addLog("The Federation awakens. You are their new Administrator.", "reward"); setPhase("outpost"); setLeftTab("actions");
                 }}>Establish Mega-City</Btn>
               </div>
             )}
           </div>
        </div>
      </div>
    );
  }

  if (phase === "dead") {
    let deathTitle = "FROZEN"; let titleColor = "#87cefa"; 
    const r = deathReason.toLowerCase();
    if (r.includes("froze") || r.includes("frozen")) { deathTitle = "FROZEN"; titleColor = "#87cefa"; }
    else if (r.includes("melt") || r.includes("radiation")) { deathTitle = "IRRADIATED"; titleColor = "#3ec995"; }
    else if (r.includes("plague") || r.includes("infect")) { deathTitle = "INFECTED"; titleColor = "#a89df0"; }
    else if (r.includes("drake") || r.includes("beast") || r.includes("casualties") || r.includes("slain") || r.includes("crushed")) { deathTitle = "SLAUGHTERED"; titleColor = "#e85c3a"; }
    else if (r.includes("starvation") || r.includes("starved")) { deathTitle = "STARVED"; titleColor = "#ffd966"; }
    else if (r.includes("code")) { deathTitle = "ASSIMILATED"; titleColor = "#a89df0"; }

    return (
      <div className="frost-death-anim" style={{ minHeight: "100vh", background: "#05080f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 20, textAlign: "center" }}>
        <h1 style={{ color: titleColor, fontSize: 48, marginBottom: 10, letterSpacing: "10px", textShadow: `0 0 30px ${titleColor}` }}>{deathTitle}</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 30, fontSize: 18, maxWidth: 600 }}>{deathReason}</p>
        <Btn variant="ghost" onClick={() => { playClick(); setScreen("main_menu"); }}>Return to Menu</Btn>
      </div>
    );
  }

  if (phase === "exploring" && maze) {
    const tColors = MAZE_THEMES[maze.theme] || MAZE_THEMES.stone;
    
    return (
      <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "var(--font-sans)", padding: "20px", userSelect: "none" }}>
        
        {mazeVictory && (
           <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)" }}>
              <div className="frost-panel" style={{ textAlign: "center", padding: 50, border: "1px solid #3ec995", boxShadow: "0 0 50px rgba(62,201,149,0.2)" }}>
                 <h2 style={{ color: "#3ec995", fontSize: 32, letterSpacing: "4px", margin: "0 0 10px" }}>COMPLEX CLEARED</h2>
                 <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 30 }}>You have successfully mapped and stripped this ruin. It is now marked as secure.</p>
                 <Btn variant="gold" onClick={() => { playClick(); setMazeVictory(false); setMaze(null); setLeftTab("map"); setPhase("outpost"); }}>Return to World Map</Btn>
              </div>
           </div>
        )}

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="frost-panel" style={{ padding: 20, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: tColors.title }}>
            <div><h2 style={{ color: tColors.title, margin: "0 0 5px", textTransform: "uppercase" }}>{maze.name}</h2><p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Use W/A/S/D or Arrow Keys to navigate.</p></div>
            <div style={{ display: "flex", gap: 15 }}>
              <div style={{ textAlign: "right", width: 80 }}><span style={{ color: "#3ec995", fontSize: 12 }}>Rations</span><Bar val={rations} max={10} color="#3ec995" h={6}/></div>
              <div style={{ textAlign: "right", width: 80 }}><span style={{ color: "#ff5c5c", fontSize: 12 }}>HP</span><Bar val={hp} max={maxHp} color="#ff5c5c" h={6}/></div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <div className="frost-panel" style={{ padding: 15, background: "#111", boxShadow: tColors.glow }}>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 30px)", gridTemplateRows: "repeat(12, 30px)", gap: 2, background: "#000", border: "2px solid #222", padding: 5 }}>
                  {maze.grid.map((row, y) => row.map((cell, x) => {
                     const isPlayer = maze.player.x === x && maze.player.y === y;
                     let bgColor = tColors.floor; 
                     if (cell === 1) bgColor = tColors.wall; 
                     else if (cell === 2) bgColor = "#ffd966"; 
                     else if (cell === 3) bgColor = "#e85c3a"; 
                     else if (cell === 4) bgColor = "#87cefa"; 
                     
                     return (
                       <div key={`${x}-${y}`} style={{ width: 30, height: 30, background: bgColor, borderRadius: 3, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isPlayer && <div style={{ width: 18, height: 18, background: "#3ec995", borderRadius: "50%", boxShadow: "0 0 10px #3ec995" }} />}
                          {!isPlayer && cell === 2 && <span style={{fontSize:10}}>💎</span>}
                          {!isPlayer && cell === 3 && <span style={{fontSize:10}}>💀</span>}
                          {!isPlayer && cell === 4 && <span style={{fontSize:10, color:"#111", fontWeight:"bold"}}>E</span>}
                       </div>
                     )
                  }))}
               </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 15, minWidth: 280 }}>
              <div className="frost-panel" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                 <Btn small onClick={() => { playClick(); handleMazeMove(0, -1); }}>▲</Btn>
                 <div style={{ display: "flex", gap: 35 }}>
                    <Btn small onClick={() => { playClick(); handleMazeMove(-1, 0); }}>◀</Btn>
                    <Btn small onClick={() => { playClick(); handleMazeMove(1, 0); }}>▶</Btn>
                 </div>
                 <Btn small onClick={() => { playClick(); handleMazeMove(0, 1); }}>▼</Btn>
              </div>

              <div className="frost-panel" style={{ padding: 20, flex: 1, minHeight: 120 }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>EXPLORATION LOG</p>
                {maze.logs.map(l => <div key={l.id} style={{ color: l.type === "dmg" ? "#e85c3a" : l.type === "reward" ? "#ffd966" : l.type === "heal" ? "#3ec995" : "rgba(255,255,255,0.8)", marginBottom: 6, fontSize: 14 }}>{l.msg}</div>)}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Btn variant="success" disabled={rations < 1} onClick={() => { playClick(); if(rations>=1){ setRations(r=>r-1); setHp(h=>Math.min(maxHp, h+30)); setMaze(m=>{let nm={...m}; nm.logs=[...nm.logs.slice(-5), {msg:"Ate a ration. +30 HP", type:"heal", id:Date.now()}]; return nm;}); } }}>Eat Ration</Btn>
                <Btn variant="danger" onClick={() => { playClick(); addLog("Fled the ruins early. (No Clear Bonus)", "dmg"); setLeftTab("map"); setPhase("outpost"); }}>Flee Now</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
          
  if (phase === "exploration_combat" && expCombat) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0606", fontFamily: "var(--font-sans)", padding: "20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="frost-panel" style={{ padding: 20, textAlign: "center", borderColor: "#e85c3a" }}>
            <h2 style={{ color: "#e85c3a", margin: "0 0 10px", letterSpacing: "2px" }}>{expCombat.name}</h2>
            <Bar val={Math.max(0, expCombat.hp)} max={expCombat.maxHp} color="#e85c3a" h={12} />
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "10px 0 0 0", fontSize: 12 }}>Enemy Health</p>
          </div>
          <div className="frost-panel" style={{ padding: 20, minHeight: 200 }}>
            {expCombat.logs.map(l => <div key={l.id} style={{ color: l.type === "dmg" ? "#e85c3a" : l.type === "reward" ? "#ffd966" : l.type === "sys" ? "#a89df0" : "rgba(255,255,255,0.8)", marginBottom: 10, fontSize: 15 }}>{l.msg}</div>)}
          </div>
          <div className="frost-panel" style={{ padding: 20, borderColor: "#3ec995" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <h3 style={{ margin: 0, color: "#3ec995" }}>Player HP</h3><span style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>{hp}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Btn variant="primary" onClick={() => doExpCombatAction("attack")}>Attack</Btn>
              <Btn variant="ghost" onClick={() => doExpCombatAction("defend")}>Defend</Btn>
              <Btn variant="danger" onClick={() => doExpCombatAction("flee")}>Flee Fight</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "giant_combat" && giantCombat) {
    const militiaPower = citizens.filter(c => c.job === 'hunt').reduce((sum, c) => sum + (c.skills?.hunt || 1), 0) * 5;
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at bottom, #2b0b0b 0%, #0a0404 100%)", fontFamily: "var(--font-sans)", padding: "20px", display: "flex", justifyContent: "center", alignItems: "center", perspective: "1000px" }}>
        
        {giantVictory && (
           <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)" }}>
              <div className="frost-panel" style={{ textAlign: "center", padding: 50, border: "1px solid #3ec995", boxShadow: "0 0 50px rgba(62,201,149,0.2)" }}>
                 <h2 style={{ color: "#3ec995", fontSize: 32, letterSpacing: "4px", margin: "0 0 10px" }}>GIANTS DEFEATED</h2>
                 <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 30, maxWidth: 400 }}>The colossal constructs collapse into the snow. Within their smoldering wreckage, you pry loose a pristine, glowing cylinder.</p>
                 <Btn variant="primary" onClick={() => {
                     playClick(); setGiantPhase(2); setArtifacts(a => a + 25); addLog("Retrieved Archon Tech Core & 25 Artifacts.", "reward");
                     setGiantVictory(false); setGiantCombat(null); setLeftTab("adv_tech"); setPhase("outpost");
                 }}>Salvage Archon Core & Return</Btn>
              </div>
           </div>
        )}

        <div style={{ width: "100%", maxWidth: 900, transform: "translateZ(50px)", transformStyle: "preserve-3d", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="frost-panel giant-shake" style={{ padding: 40, textAlign: "center", borderColor: "#e85c3a", background: "rgba(232,92,58,0.15)", boxShadow: "0 20px 50px rgba(232,92,58,0.2)", transform: "translateZ(30px)" }}>
            <h1 style={{ color: "#e85c3a", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "8px", textShadow: "0 0 30px #e85c3a", fontSize: 36 }}>FROST GIANTS</h1>
            <Bar val={Math.max(0, giantCombat.hp)} max={giantCombat.maxHp} color="#e85c3a" h={16} />
            <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 15, fontSize: 18, fontWeight: "bold" }}>HP: {Math.max(0, giantCombat.hp)} / {giantCombat.maxHp}</p>
          </div>
          <div style={{ display: "flex", gap: 20, transform: "translateZ(20px)" }}>
            <div className="frost-panel" style={{ flex: 1, padding: 25, borderColor: "#a89df0", boxShadow: "0 10px 30px rgba(168,157,240,0.1)" }}>
              <h3 style={{ color: "#a89df0", margin: "0 0 15px", letterSpacing: "2px" }}>Skyspine Rig</h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#fff", marginBottom: 10 }}><span>Pilot HP:</span><span style={{color: "#ff5c5c", fontWeight: "bold"}}>{hp}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#fff" }}><span>Militia Support:</span><span style={{color: "#e85c3a", fontWeight: "bold"}}>{citizens.filter(c => c.job === 'hunt').length} Hunters (Passive Dmg: {militiaPower})</span></div>
            </div>
            <div className="frost-panel" style={{ flex: 2, padding: 25, minHeight: 180, boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>
              {giantCombat.logs.map(l => <div key={l.id} style={{ color: l.type === "dmg" ? "#e85c3a" : l.type === "reward" ? "#ffd966" : l.type === "sys" ? "#a89df0" : "rgba(255,255,255,0.9)", marginBottom: 8, fontSize: 15 }}>{l.msg}</div>)}
            </div>
          </div>
          
          {/* QUICK TIME EVENT AREA */}
          <div className="frost-panel" style={{ padding: 20, textAlign: "center", minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {qte ? (
              <div style={{ animation: "pulse 0.5s infinite" }}>
                 <h2 style={{ color: "#ffd966", fontSize: 24, margin: "0 0 15px", textTransform: "uppercase", letterSpacing: "2px" }}>{qte.p}</h2>
                 <div style={{ width: "80%", margin: "0 auto 20px" }}>
                    <Bar val={qte.time} max={100} color={qte.time > 50 ? '#3ec995' : (qte.time > 20 ? '#ff8c00' : '#e85c3a')} h={12} />
                 </div>
                 <div style={{ display: "flex", justifyContent: "center", gap: 15 }}>
                    <Btn variant={qte.k==='w'?"primary":"ghost"} onClick={() => processQteInput('w')}>[W] Grapple Up</Btn>
                    <Btn variant={qte.k==='a'?"primary":"ghost"} onClick={() => processQteInput('a')}>[A] Dodge Left</Btn>
                    <Btn variant={qte.k==='s'?"primary":"ghost"} onClick={() => processQteInput('s')}>[S] Slide Under</Btn>
                    <Btn variant={qte.k==='d'?"primary":"ghost"} onClick={() => processQteInput('d')}>[D] Dodge Right</Btn>
                 </div>
              </div>
            ) : (
              <h3 style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "4px" }}>WATCH THE GIANTS MOVEMENTS...</h3>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #1a2436 0%, #05080f 100%)", fontFamily: "var(--font-sans)", padding: "20px", position: "relative" }}>
      
      {/* BACKGROUND EFFECTS */}
      <div className="snowstorm-container" style={{ pointerEvents: "none", opacity: 0.3, zIndex: 0 }}><div className="snow-layer" /></div>

      {/* STRIKING 2.5D RESEARCH ANNOUNCEMENT */}
      {researchAnnounce && (
        <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, pointerEvents: "auto", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", perspective: "1000px" }}>
          <Confetti />
          <div className="frost-panel" style={{ background: "rgba(10,8,16,0.98)", border: "2px solid #3ec995", padding: "38px 70px 30px", textAlign: "center", boxShadow: "0 25px 70px rgba(62,201,149,0.35), inset 0 0 20px rgba(62,201,149,0.1)", transform: "translateZ(100px)", animation: "cinFadeIn 0.35s ease-out forwards", minWidth: "520px", maxWidth: "620px", position: "relative", borderRadius: 16 }}>
            <button onClick={() => { playClick(); setResearchAnnounce(null); }} style={{ position: "absolute", top: 15, right: 20, background: "transparent", color: "#3ec995", border: "none", fontSize: 24, cursor: "pointer", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#3ec995"}>✖</button>
            <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #3ec995, transparent)", margin: "-38px -70px 25px", boxShadow: "0 0 20px #3ec995" }} />
            <h1 style={{ color: "#3ec995", letterSpacing: "9px", margin: "0 0 8px", fontSize: 34, textShadow: "0 0 25px #3ec995" }}>{researchAnnounce.title}</h1>
            <p style={{ color: "#fff", fontSize: 22, letterSpacing: "2.5px", margin: "0 0 22px" }}>{researchAnnounce.desc}</p>
            {researchAnnounce.boosts && researchAnnounce.boosts.length > 0 && (
              <div style={{ marginTop: 18, textAlign: "left" }}>
                <div style={{ color: "#ffd966", fontSize: 13, letterSpacing: "3px", marginBottom: 14, borderBottom: "1px solid rgba(255,217,102,0.35)", paddingBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><span>⚡</span> NEW BOOSTS UNLOCKED</div>
                {researchAnnounce.boosts.map((boost, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 11, background: "rgba(0,0,0,0.35)", padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(62,201,149,0.25)" }}>
                    {boost.icon && <img src={boost.icon} alt={boost.label} style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", boxShadow: "0 0 18px rgba(62,201,149,0.6)", flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}><div style={{ color: "#3ec995", fontWeight: 700, fontSize: 15.5, marginBottom: 2 }}>{boost.label}</div><div style={{ color: "#a8d9ff", fontSize: 13.5, lineHeight: 1.35 }}>{boost.change}</div></div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #3ec995, transparent)", margin: "25px -70px 25px", boxShadow: "0 0 20px #3ec995" }} />
            <Btn variant="primary" onClick={() => { playClick(); setResearchAnnounce(null); }}>Acknowledge & Dismiss</Btn>
          </div>
        </div>
      )}

      {/* IMPROVED CITIZEN MANAGEMENT MODAL */}
      {showCitizens && (
        <div className="frost-event-overlay" style={{ zIndex: 100 }}>
          <div className="frost-panel" style={{ width: "95%", maxWidth: 800, background: "rgba(13, 11, 23, 0.98)", maxHeight: "85vh", overflowY: "auto", padding: 30, position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(168,157,240,0.1)", borderRadius: 16, border: "1px solid #a89df0" }}>
            <button onClick={() => { playClick(); setShowCitizens(false); }} style={{ position: "absolute", top: 15, right: 20, background: "transparent", color: "#e85c3a", border: "none", fontSize: 24, cursor: "pointer" }}>✖</button>
            <h2 style={{ color: "#a89df0", marginTop: 0, textTransform: "uppercase", letterSpacing: "3px", borderBottom: "1px solid rgba(168,157,240,0.3)", paddingBottom: 15 }}>Citizen Roster</h2>
            
            <div style={{ display: "flex", gap: 15, marginBottom: 25, fontSize: 13, flexWrap: "wrap" }}>
              <Tag color="#fff">Total: {citizens.length} / {maxPopulation}</Tag>
              <Tag color="#a89df0">Unemployed: {citizens.filter(c => c.job === 'unassigned').length}</Tag>
              <Tag color="#3ec995">Farming: {currentAssigned.farm}/{capacities.farm}</Tag>
              <Tag color="#e85c3a">Hunting: {currentAssigned.hunt}/{capacities.hunt}</Tag>
              <Tag color="#87cefa">Mining: {currentAssigned.mine}/{capacities.mine}</Tag>
              <Tag color="#ff8c00">Core: {currentAssigned.heat}/{capacities.heat}</Tag>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {citizens.map(c => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 150px", alignItems: "center", padding: "12px 15px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `4px solid ${c.job === 'farm' ? '#3ec995' : c.job === 'hunt' ? '#e85c3a' : c.job === 'mine' ? '#87cefa' : c.job === 'heat' ? '#ff8c00' : '#444'}` }}>
                  <div className="citizen-name-age" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ color: "#fff", fontSize: 15 }}>{c.name}</strong>
                    <span className="age-tag" style={{ background: "rgba(255, 215, 100, 0.15)", color: "#ffd966", fontSize: 13, padding: "2px 8px", borderRadius: 12, border: "1px solid rgba(255, 215, 100, 0.4)", fontWeight: 500 }}>Age {c.age || "???"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 15, fontSize: 12 }}>
                    <div style={{ width: 45 }}><span style={{color:"#3ec995", display:"block", marginBottom:2}}>Farm</span><Bar val={c.skills?.farm || 0} max={3} color="#3ec995" h={4}/></div>
                    <div style={{ width: 45 }}><span style={{color:"#e85c3a", display:"block", marginBottom:2}}>Hunt</span><Bar val={c.skills?.hunt || 0} max={3} color="#e85c3a" h={4}/></div>
                    <div style={{ width: 45 }}><span style={{color:"#87cefa", display:"block", marginBottom:2}}>Mine</span><Bar val={c.skills?.mine || 0} max={3} color="#87cefa" h={4}/></div>
                    <div style={{ width: 45 }}><span style={{color:"#ff8c00", display:"block", marginBottom:2}}>Heat</span><Bar val={c.skills?.heat || 0} max={3} color="#ff8c00" h={4}/></div>
                  </div>
                  <select value={c.job} onChange={(e) => assignJob(c.id, e.target.value)} style={{ background: "rgba(0,0,0,0.5)", color: "#f2edff", border: "1px solid rgba(255,255,255,0.2)", padding: "8px", borderRadius: 4, outline: "none", cursor: "pointer", fontSize: 13 }}>
                    <option value="unassigned">Unassigned</option>
                    <option value="farm" disabled={c.job !== 'farm' && currentAssigned.farm >= capacities.farm}>Farming</option>
                    <option value="hunt" disabled={c.job !== 'hunt' && currentAssigned.hunt >= capacities.hunt}>Hunting</option>
                    <option value="heat" disabled={c.job !== 'heat' && currentAssigned.heat >= capacities.heat}>Generator</option>
                    <option value="mine" disabled={c.job !== 'mine' && currentAssigned.mine >= capacities.mine}>Mining</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeEvent && (
        <div className="frost-event-overlay">
          <div className="frost-event-box" style={{ background: "rgba(10, 8, 16, 0.98)", border: "2px solid #a89df0", borderRadius: 16, padding: 40, boxShadow: "0 0 50px rgba(168,157,240,0.3), inset 0 0 20px rgba(168,157,240,0.1)", textAlign: "center", maxWidth: 500, animation: "cinFadeIn 0.3s ease-out" }}>
            <h2 className="frost-event-title" style={{ color: "#a89df0", fontSize: 26, textTransform: "uppercase", letterSpacing: 3, margin: "0 0 15px" }}>{activeEvent.title}</h2>
            <p className="frost-event-desc" style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 1.6, marginBottom: 30 }}>{activeEvent.desc}</p>
            <div>
              {activeEvent.choices.map((c, i) => (
                <button key={i} disabled={!c.req} className={`frost-choice-btn ${c.color === "danger" ? "frost-choice-danger" : ""}`} style={{ width: "100%", marginBottom: 12, padding: 15, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, fontSize: 15, transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: c.req ? 1 : 0.5, cursor: c.req ? "pointer" : "not-allowed" }} onClick={c.req ? c.action : null}>
                  <span>{c.label}</span>{!c.req && <span style={{ color: "#e85c3a", fontSize: 12 }}>Missing Req</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes critical-blink { 0% { opacity: 1; box-shadow: 0 0 15px red; } 50% { opacity: 0.6; box-shadow: 0 0 5px darkred; } 100% { opacity: 1; box-shadow: 0 0 15px red; } }
        .blink-alarm { animation: critical-blink 1s infinite; border: 1px solid red !important; }
        @keyframes tech-pulse { 0% { box-shadow: 0 0 0px rgba(62,201,149,0); } 50% { box-shadow: 0 0 20px rgba(62,201,149,0.5); } 100% { box-shadow: 0 0 0px rgba(62,201,149,0); } }
        .tech-ready { animation: tech-pulse 2s infinite; border-color: #3ec995 !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .frost-choice-btn:hover:not(:disabled) { background: rgba(168,157,240,0.2) !important; border-color: #a89df0 !important; transform: translateY(-2px); }
        .frost-choice-danger:hover:not(:disabled) { background: rgba(232,92,58,0.2) !important; border-color: #e85c3a !important; }
      `}</style>

      {/* 3-COLUMN LAYOUT */}
      <div style={{ display: "flex", gap: 20, maxWidth: 1400, margin: "0 auto", alignItems: "flex-start", position: "relative", zIndex: 10 }}>
        
        {/* COLUMN 1: STICKY LEFT SIDEBAR */}
        <div className="frost-panel no-scrollbar" style={{ width: 260, position: "sticky", top: 20, padding: 20, borderRadius: 12, display: "flex", flexDirection: "column", gap: 20, maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
           <div>
             <h2 onClick={() => { playClick(); handleCheat(); }} title="Enter Cheat Code" style={{ margin: 0, fontSize: 20, color: "#87cefa", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer" }}>{megaCity ? "Aleria Mega-City" : (tech.settlement ? "Gorthon Settlement" : "Frozen Outpost")}</h2>
             <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(135, 206, 250, 0.6)" }}>Core Lvl {coreLevel} • Pop: {population}/{maxPopulation}</p>
             {tech.settlement && <Btn small variant="ghost" style={{ marginTop: 10, width: "100%" }} onClick={() => { playClick(); setShowCitizens(true); }}>Manage Citizens</Btn>}
           </div>

           <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div className={(temp/maxHeat) < 0.2 ? "blink-alarm" : ""} style={{ padding: 5, borderRadius: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#ff8c00", fontWeight: "bold", marginBottom: 3 }}><span>HEAT</span><span>{Math.floor(temp)} / {maxHeat}</span></div>
                <Bar val={temp} max={maxHeat} color="#ff8c00" h={10} />
              </div>
              <div className={(food/maxFood) < 0.2 ? "blink-alarm" : ""} style={{ padding: 5, borderRadius: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#e85c3a", fontWeight: "bold", marginBottom: 3 }}><span>FOOD</span><span>{Math.floor(food)} / {maxFood}</span></div>
                <Bar val={food} max={maxFood} color="#e85c3a" h={10} />
              </div>
              {phase !== "endless" && (
                <div style={{ padding: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#ff5c5c", fontWeight: "bold", marginBottom: 3 }}><span>HP</span><span>{Math.floor(hp)} / {maxHp}</span></div>
                  <Bar val={hp} max={maxHp} color="#ff5c5c" h={10} />
                </div>
              )}
              {phase !== "endless" && (
                <div style={{ padding: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3ec995", fontWeight: "bold", marginBottom: 3 }}><span>ENERGY</span><span>{Math.floor(energy)}%</span></div>
                  <Bar val={energy} max={100} color="#3ec995" h={10} />
                </div>
              )}
           </div>

           <div style={{ borderTop: "1px solid rgba(135,206,250,0.2)", paddingTop: 15, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Tag color="#444">Coal: {Math.floor(coal)}</Tag>
              <Tag color="#87cefa">Mat: {materials}</Tag>
              <Tag color="#e85c3a">Meat: {meat}</Tag>
              <Tag color="#3ec995">Veg: {vegetables}</Tag>
              <Tag color="#a8a8a8">Iron: {iron}</Tag>
              <Tag color="#a89df0">Mana: {manaCrystals}</Tag>
              <Tag color="#ffd966">Art: {artifacts}</Tag>
              <Tag color="#3ec995">Rat: {rations}</Tag>
           </div>
        </div>

        {/* COLUMN 2: MAIN SCROLLING CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 15 }}>
          
          {phase === "endless" ? (
             <div className="frost-panel" style={{ padding: 30, borderRadius: 12, textAlign: "center", borderColor: "#a89df0", background: "rgba(168,157,240,0.1)" }}>
                <h3 style={{ color: "#a89df0", margin: "0 0 10px", letterSpacing: "2px" }}>OVERSEER MODE</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>You are the administrator now. Manual labor is beneath you. Your survival depends entirely on the efficiency of your citizens.</p>
             </div>
          ) : (
             <>
               <div style={{ display: "flex", gap: 10 }}>
                 <Btn variant={leftTab === "actions" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("actions"); }} style={{ flex: 1 }}>Actions</Btn>
                 <Btn variant={leftTab === "crafting" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("crafting"); }} style={{ flex: 1 }}>Crafting</Btn>
                 {tech.settlement && <Btn variant={leftTab === "map" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("map"); }} style={{ flex: 1 }}>World Map</Btn>}
                 {giantPhase >= 2 && <Btn variant={leftTab === "adv_tech" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("adv_tech"); }} style={{ flex: 1 }}>Advanced Tech</Btn>}
               </div>

               {/* TAB: ADVANCED TECH TREE */}
               {leftTab === "adv_tech" && (
                  <div className="frost-panel" style={{ padding: "40px 20px", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <h3 style={{ color: "#a89df0", margin: "0 0 5px", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase" }}>Federation Archon Tech</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 40, textAlign: "center" }}>Decrypted from the destroyed Frost Giants. Requires immense resources.</p>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative" }}>
                       <div style={{ ...circleStyle, borderColor: "#3ec995", color: "#3ec995", boxShadow: "0 0 20px rgba(62,201,149,0.4)", cursor: "default" }}>
                          Archon Core<br/><span style={{fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 5}}>Salvaged</span>
                       </div>
                       <div style={lineStyle} />
                       
                       <div style={{ display: "flex", gap: 80, position: "relative" }}>
                          <div style={{ position: "absolute", top: -20, left: 45, right: 45, height: 3, background: "rgba(135,206,250,0.3)" }} />
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
                             <div style={{ width: 3, height: 20, background: "rgba(135,206,250,0.3)", marginTop: -20, marginBottom: 20 }} />
                             <div style={{ ...circleStyle, borderColor: advTech.cryo ? "#3ec995" : "#87cefa", cursor: advTech.cryo ? "default" : "pointer", boxShadow: advTech.cryo ? "0 0 15px rgba(62,201,149,0.3)" : "none" }} onClick={() => !advTech.cryo && advResearch('cryo', 20, 50, 0, 0)}>
                                Cryo-Arch<br/><span style={{fontSize: 9, color: advTech.cryo ? "#3ec995" : "#ffd966", marginTop: 5}}>{advTech.cryo ? "Researched" : "20 Art, 50 Mat"}</span>
                             </div>
                             {advTech.cryo && <div style={lineStyle} />}
                             {advTech.cryo && (
                                <div style={{ ...circleStyle, borderColor: advTech.harvest ? "#3ec995" : "#87cefa", cursor: advTech.harvest ? "default" : "pointer" }} onClick={() => !advTech.harvest && advResearch('harvest', 15, 0, 30, 0)}>
                                   Harvesters<br/><span style={{fontSize: 9, color: advTech.harvest ? "#3ec995" : "#ffd966", marginTop: 5}}>{advTech.harvest ? "Researched" : "15 Art, 30 Irn"}</span>
                                </div>
                             )}
                             {advTech.harvest && <div style={lineStyle} />}
                             {advTech.harvest && (
                                <div style={{ ...circleStyle, borderColor: advTech.thermalDrill ? "#3ec995" : "#87cefa", cursor: advTech.thermalDrill ? "default" : "pointer" }} onClick={() => !advTech.thermalDrill && advResearch('thermalDrill', 20, 0, 40, 5)}>
                                   Therm Drill<br/><span style={{fontSize: 9, color: advTech.thermalDrill ? "#3ec995" : "#ffd966", marginTop: 5}}>{advTech.thermalDrill ? "+50% Mine Yld" : "20Art 40Irn 5Man"}</span>
                                </div>
                             )}
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 90 }}>
                             <div style={{ width: 3, height: 20, background: "rgba(135,206,250,0.3)", marginTop: -20, marginBottom: 20 }} />
                             <div style={{ ...circleStyle, borderColor: advTech.aegis ? "#3ec995" : "#a89df0", boxShadow: advTech.aegis ? "0 0 20px rgba(168,157,240,0.5)" : "0 0 10px rgba(168,157,240,0.2)", cursor: advTech.aegis ? "default" : "pointer" }} onClick={() => !advTech.aegis && advResearch('aegis', 25, 0, 0, 10)}>
                                Aegis Code<br/><span style={{fontSize: 9, color: advTech.aegis ? "#3ec995" : "#ffd966", marginTop: 5}}>{advTech.aegis ? "Researched" : "25 Art, 10 Mana"}</span>
                             </div>
                             {advTech.aegis && <div style={lineStyle} />}
                             {advTech.aegis && (
                                <div style={{ ...circleStyle, borderColor: advTech.manaSiphon ? "#3ec995" : "#a89df0", cursor: advTech.manaSiphon ? "default" : "pointer" }} onClick={() => !advTech.manaSiphon && advResearch('manaSiphon', 15, 0, 20, 0)}>
                                   Mana Siphon<br/><span style={{fontSize: 9, color: advTech.manaSiphon ? "#3ec995" : "#ffd966", marginTop: 5}}>{advTech.manaSiphon ? "Action Unlock" : "15 Art, 20 Irn"}</span>
                                </div>
                             )}
                             {advTech.manaSiphon && <div style={lineStyle} />}
                             {advTech.manaSiphon && (
                                <div style={{ ...circleStyle, borderColor: advTech.exoStim ? "#3ec995" : "#a89df0", cursor: advTech.exoStim ? "default" : "pointer" }} onClick={() => !advTech.exoStim && advResearch('exoStim', 20, 0, 0, 15)}>
                                   Exo-Stim<br/><span style={{fontSize: 9, color: advTech.exoStim ? "#3ec995" : "#ffd966", marginTop: 5}}>{advTech.exoStim ? "+50% Giant DMG" : "20 Art, 15 Mana"}</span>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
               )}

               {/* TAB CONTENT: MAP */}
               {leftTab === "map" && (
                  <div className="frost-panel" style={{ padding: 25, borderRadius: 12 }}>
                    <h3 style={{ color: "#a89df0", margin: "0 0 15px", fontSize: 22 }}>The Frozen Expanse</h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>The ice is shifting. Journeying to a complex requires 1 Travel Ration.</p>
                    <div style={{ display: "grid", gap: 10 }}>
                      {EXPLORATION_NODES.map(n => {
                         const isCleared = clearedNodes.includes(n.name);
                         return (
                           <div key={n.name} style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${isCleared ? "rgba(62,201,149,0.5)" : "rgba(135,206,250,0.3)"}`, padding: 15, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isCleared ? 0.5 : 1 }}>
                             <div><h4 style={{ margin: 0, color: isCleared ? "#3ec995" : "#fff", textDecoration: isCleared ? "line-through" : "none" }}>{n.name}</h4><p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{n.desc}</p></div>
                             {isCleared ? <span style={{ color: "#3ec995", fontWeight: "bold", fontSize: 13, letterSpacing: "1px" }}>CLEARED ✓</span> : <Btn small onClick={() => travelToNode(n)}>Travel</Btn>}
                           </div>
                         );
                      })}
                      {advTech.aegis && (
                        <div style={{ background: "rgba(168,157,240,0.1)", border: "1px solid #a89df0", padding: 15, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, boxShadow: "0 0 15px rgba(168,157,240,0.2)" }}>
                          <div><h4 style={{ margin: 0, color: "#a89df0", textShadow: "0 0 10px #a89df0", textTransform: "uppercase", letterSpacing: "1px" }}>Federation Capital</h4><p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>The anomaly epicenter. Break the shield.</p></div>
                          <Btn variant="primary" small onClick={() => { playClick(); setPhase("capital_finale"); setCapitalPhase(0); }}>Journey</Btn>
                        </div>
                      )}
                    </div>
                  </div>
               )}

               {/* TAB CONTENT: ACTIONS & BUILDINGS */}
               {leftTab === "actions" && (
                 <>
                   <div className={`frost-panel ${genOn ? "core-pulse-intense" : ""}`} style={{ padding: 25, borderRadius: 12, textAlign: "center", borderColor: genOn ? "#ff8c00" : "#444" }}>
                     <h3 style={{ color: genOn ? "#ff8c00" : "#777", margin: "0 0 10px", fontSize: 22 }}>The Central Core</h3>
                     <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>{genOn ? `Burning ${Math.max(1, (coreLevel * 2) - (tech.heating ? 1 : 0) - genEfficiency)} Coal per tick.` : "Core is OFFLINE. Workers are idle."}</p>
                     <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                       <Btn variant={genOn ? "danger" : "amber"} onClick={() => { playClick(); setGenOn(!genOn); }}>{genOn ? "Turn OFF (Save Coal)" : "Ignite Generator"}</Btn>
                       <Btn variant="ghost" onClick={stokeGenerator}>Manual Stoke (-10 Coal)</Btn>
                     </div>
                   </div>

                   {tech.mining && tech.settlement && (
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "rgba(135,206,250,0.3)", marginBottom: 15 }}>
                       <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                         <div><h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Coal Mines (Lv.{mineLevel} / {mines})</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>Capacity: {capacities.mine} Miners {mineLevel < 3 && <span style={{color:"#e85c3a"}}>(Hazard Risk)</span>}</p></div>
                         <div style={{ display: "flex", gap: 10 }}><Btn variant="primary" small disabled={materials < 15} onClick={() => { playClick(); setMaterials(m => m - 15); setMines(m => m + 1); addLog("Built a Mine.", "reward"); }}>Build (15 Mat)</Btn>{mines > 0 && <Btn variant="ghost" small disabled={materials < 25 || mineLevel >= 5} onClick={() => { playClick(); setMaterials(m => m - 25); setMineLevel(l => l + 1); addLog("Mine Upgraded.", "reward"); }}>Upgrade (25 Mat)</Btn>}</div>
                       </div>
                     </div>
                   )}

                   {tech.farming && (
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "rgba(62,201,149,0.3)", marginBottom: 15 }}>
                       <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                         <div><h4 style={{ color: "#3ec995", margin: "0 0 5px" }}>Greenhouses (Lv.{farmLevel} / {farms})</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>Capacity: {capacities.farm} Workers</p></div>
                         <div style={{ display: "flex", gap: 10 }}><Btn variant="success" small disabled={materials < 15 || artifacts < 2} onClick={() => { playClick(); setMaterials(m => m - 15); setArtifacts(a => a - 2); setFarms(f => f + 1); addLog("Built a Farm.", "reward"); }}>Build (15 Mat, 2 Art)</Btn>{farms > 0 && <Btn variant="ghost" small disabled={materials < 25 || farmLevel >= 5} onClick={() => { playClick(); setMaterials(m => m - 25); setFarmLevel(l => l + 1); addLog("Farm Upgraded.", "reward"); }}>Upgrade (25 Mat)</Btn>}</div>
                       </div>
                     </div>
                   )}

                   {tech.hunting && (
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "rgba(232,92,58,0.3)", marginBottom: 15 }}>
                       <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                         <div><h4 style={{ color: "#e85c3a", margin: "0 0 5px" }}>Hunting Lodges (Lv.{lodgeLevel} / {huntingLodges})</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>Capacity: {capacities.hunt} Hunters</p></div>
                         <div style={{ display: "flex", gap: 10 }}><Btn variant="danger" small disabled={materials < 20} onClick={() => { playClick(); setMaterials(m => m - 20); setHuntingLodges(h => h + 1); addLog("Built a Lodge.", "reward"); }}>Build (20 Mat)</Btn>{huntingLodges > 0 && <Btn variant="ghost" small disabled={materials < 25 || lodgeLevel >= 5} onClick={() => { playClick(); setMaterials(m => m - 25); setLodgeLevel(l => l + 1); addLog("Lodge Upgraded.", "reward"); }}>Upgrade (25 Mat)</Btn>}</div>
                       </div>
                     </div>
                   )}

                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                     {tech.skyspineHarness && giantPhase === 1 && (
                       <div className="frost-panel" style={{ gridColumn: "1 / -1", padding: 20, borderRadius: 12, cursor: "pointer", borderColor: "#a89df0", background: "rgba(168,157,240,0.15)" }} onClick={fightGiants}>
                         <h4 style={{ color: "#a89df0", margin: "0 0 5px", fontSize: 18, textAlign: "center" }}>Assault the Giants</h4>
                         <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center", margin: 0 }}>Costs 50 Energy, 50 Food.</p>
                       </div>
                     )}
                     {advTech.manaSiphon && (
                       <div className="frost-panel" style={{ gridColumn: "1 / -1", padding: 20, borderRadius: 12, cursor: "pointer", borderColor: "#a89df0" }} onClick={() => {
                           playClick();
                           if(energy < 30) return notify("Not enough energy.", "#e85c3a");
                           applyDecay(10, 30); setManaCrystals(m => m + 1);
                           addLog("Siphoned raw anomaly energy into 1 Mana Crystal.", "reward");
                       }}>
                         <h4 style={{ color: "#a89df0", margin: "0 0 5px" }}>Siphon Mana</h4>
                         <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Convert 30 Energy into 1 Mana Crystal.</p>
                       </div>
                     )}
                     {tech.mining && <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer", borderColor: "rgba(135,206,250,0.4)" }} onClick={doMine}><h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Mine Coal</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Dig for fuel. <span style={{color:"#e85c3a"}}>Cave-in risk.</span></p></div>}
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer" }} onClick={doExplore}><h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Explore Ruins</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Scavenge the complex.</p></div>
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer" }} onClick={doHunt}><h4 style={{ color: "#e85c3a", margin: "0 0 5px" }}>Hunt & Forage</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Find food, meat, and veg.</p></div>
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer" }} onClick={doRest}><h4 style={{ color: "#3ec995", margin: "0 0 5px" }}>Rest</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Restores Energy. (-5 Food)</p></div>
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer", borderColor: "rgba(255,217,102,0.4)" }} onClick={useRawArtifact}><h4 style={{ color: "#ffd966", margin: "0 0 5px" }}>Raw Artifact</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}><strong style={{ color: "#e85c3a" }}>High risk.</strong> Requires 1 Art.</p></div>
                   </div>
                 </>
               )}

               {/* TAB CONTENT: CRAFTING BENCH */}
               {leftTab === "crafting" && (
                 <div className="frost-panel" style={{ padding: 25, borderRadius: 12 }}>
                   <h3 style={{ color: "#a89df0", margin: "0 0 15px", fontSize: 22, borderBottom: "1px solid rgba(168,157,240,0.3)", paddingBottom: 10 }}>Crafting Bench</h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                     
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 15, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                       <div><strong style={{ color: tech.rations ? "#3ec995" : "#666", fontSize: 15 }}>Travel Ration</strong><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0 0" }}>Heals 30 HP and permits World Map travel.</p></div>
                       <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#e85c3a", marginBottom: 5 }}>10 Meat, 10 Veg</div>
                         {tech.rations ? <Btn small onClick={() => handleCraft({meat: 10, vegetables: 10}, 'ration', null, "Crafted 1 Travel Ration.")} disabled={meat < 10 || vegetables < 10}>Craft</Btn> : <span style={{fontSize: 12, color: "gray"}}>Locked</span>}
                       </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 15, borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: equipment.pickaxe === 'scrap' || equipment.pickaxe === 'iron' ? 0.3 : 1 }}>
                       <div><strong style={{ color: tech.tools ? "#87cefa" : "#666", fontSize: 15 }}>Scrap Pickaxe</strong><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0 0" }}>Increases manual coal yield to 30.</p></div>
                       <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#87cefa", marginBottom: 5 }}>20 Mat</div>
                         {equipment.pickaxe === 'scrap' || equipment.pickaxe === 'iron' ? <span style={{fontSize: 12, color: "#3ec995"}}>Equipped</span> : (tech.tools ? <Btn small onClick={() => handleCraft({materials: 20}, 'pickaxe', 'scrap', "Equipped Scrap Pickaxe.")} disabled={materials < 20}>Craft</Btn> : <span style={{fontSize: 12, color: "gray"}}>Locked</span>)}
                       </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 15, borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: equipment.weapon === 'scrap_blade' || equipment.weapon === 'mana_rifle' ? 0.3 : 1 }}>
                       <div><strong style={{ color: tech.weapons ? "#e85c3a" : "#666", fontSize: 15 }}>Scrap Blade</strong><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0 0" }}>Deals moderate damage in ruin combat.</p></div>
                       <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#87cefa", marginBottom: 5 }}>25 Mat</div>
                         {equipment.weapon === 'scrap_blade' || equipment.weapon === 'mana_rifle' ? <span style={{fontSize: 12, color: "#3ec995"}}>Equipped</span> : (tech.weapons ? <Btn small onClick={() => handleCraft({materials: 25}, 'weapon', 'scrap_blade', "Equipped Scrap Blade.")} disabled={materials < 25}>Craft</Btn> : <span style={{fontSize: 12, color: "gray"}}>Locked</span>)}
                       </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 15, borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: equipment.pickaxe === 'iron' ? 0.3 : 1 }}>
                       <div><strong style={{ color: tech.metallurgy ? "#87cefa" : "#666", fontSize: 15 }}>Iron Pickaxe</strong><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0 0" }}>Massively increases manual coal and iron yield.</p></div>
                       <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#a8a8a8", marginBottom: 5 }}>20 Mat, 15 Iron</div>
                         {equipment.pickaxe === 'iron' ? <span style={{fontSize: 12, color: "#3ec995"}}>Equipped</span> : (tech.metallurgy ? <Btn small onClick={() => handleCraft({materials: 20, iron: 15}, 'pickaxe', 'iron', "Equipped Iron Pickaxe.")} disabled={materials < 20 || iron < 15}>Craft</Btn> : <span style={{fontSize: 12, color: "gray"}}>Locked</span>)}
                       </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 15, borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: equipment.armor === 'plated' ? 0.3 : 1 }}>
                       <div><strong style={{ color: tech.metallurgy ? "#a8a8a8" : "#666", fontSize: 15 }}>Plated Armor</strong><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0 0" }}>Reduces combat damage taken by 50%.</p></div>
                       <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#a8a8a8", marginBottom: 5 }}>30 Mat, 20 Iron</div>
                         {equipment.armor === 'plated' ? <span style={{fontSize: 12, color: "#3ec995"}}>Equipped</span> : (tech.metallurgy ? <Btn small onClick={() => handleCraft({materials: 30, iron: 20}, 'armor', 'plated', "Equipped Plated Armor.")} disabled={materials < 30 || iron < 20}>Craft</Btn> : <span style={{fontSize: 12, color: "gray"}}>Locked</span>)}
                       </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 5, opacity: equipment.weapon === 'mana_rifle' ? 0.3 : 1 }}>
                       <div><strong style={{ color: tech.advancedArmory ? "#a89df0" : "#666", fontSize: 15 }}>Mana Rifle</strong><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0 0" }}>Devastating ranged damage in ruin combat.</p></div>
                       <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#a89df0", marginBottom: 5 }}>20 Mat, 10 Irn, 5 Mana</div>
                         {equipment.weapon === 'mana_rifle' ? <span style={{fontSize: 12, color: "#3ec995"}}>Equipped</span> : (tech.advancedArmory ? <Btn small onClick={() => handleCraft({materials: 20, iron: 10, mana: 5}, 'weapon', 'mana_rifle', "Equipped Mana Rifle.")} disabled={materials < 20 || iron < 10 || manaCrystals < 5}>Craft</Btn> : <span style={{fontSize: 12, color: "gray"}}>Locked</span>)}
                       </div>
                     </div>

                   </div>
                 </div>
               )}
             </>
          )}

          {/* SURVIVAL LOG */}
          <div className="frost-panel" style={{ padding: 15, borderRadius: 12, height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, color: "rgba(135,206,250,0.5)", fontWeight: "bold", letterSpacing: "1px", marginBottom: 5 }}>SURVIVAL LOG</span></div>
            <div ref={logRef} style={{ flex: 1, overflowY: "auto", fontSize: 12, lineHeight: 1.6 }}>{log.map(l => <div key={l.id} style={{ color: l.type === "dmg" ? "#e85c3a" : l.type === "reward" ? "#ffd966" : l.type === "heal" ? "#3ec995" : "rgba(255,255,255,0.8)", marginBottom: 4 }}>{l.msg}</div>)}</div>
          </div>

        </div>

        {/* COLUMN 3: STICKY RIGHT TECH TREE */}
        <div 
           className={`frost-panel no-scrollbar ${ 
             (!tech.rations && artifacts >= getResearchCost(1)) ||
             (!tech.heating && artifacts >= getResearchCost(1)) || 
             (!tech.tools && artifacts >= getResearchCost(2)) || 
             (!tech.weapons && artifacts >= getResearchCost(3)) || 
             (tech.settlement && !tech.metallurgy && artifacts >= getResearchCost(5)) || 
             (tech.metallurgy && !tech.advancedArmory && artifacts >= getResearchCost(8)) || 
             (tech.settlement && !tech.farming && artifacts >= getResearchCost(3)) || 
             (tech.settlement && !tech.hunting && artifacts >= getResearchCost(3)) || 
             (!tech.mining && artifacts >= getResearchCost(2)) 
             ? "tech-ready" : "" 
           }`} 
           style={{ width: 320, position: "sticky", top: 20, padding: 20, borderRadius: 12, transition: "box-shadow 0.3s", maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}
        >
          <h3 style={{ color: "#a89df0", margin: "0 0 15px", borderBottom: "1px solid rgba(168,157,240,0.3)", paddingBottom: 10 }}>Research Tree</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ opacity: tech.rations ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.rations ? "#3ec995" : "#d4cbf8", fontSize: 13 }}>Food Preservation</strong>{!tech.rations && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(1)} Art.</span>}</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Unlocks Crafting Bench to pack Travel Rations.</p>
              {tech.rations ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("rations", 1, "Food Preservation")} disabled={artifacts < getResearchCost(1)}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.heating ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.heating ? "#3ec995" : "#d4cbf8", fontSize: 13 }}>Thermal Insulation</strong>{!tech.heating && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(1)} Art.</span>}</div>
              {tech.heating ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("heating", 1, "Thermal Insulation")} disabled={artifacts < getResearchCost(1)}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.tools ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.tools ? "#3ec995" : "#d4cbf8", fontSize: 13 }}>Excavation Tools</strong>{!tech.tools && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(2)} Art.</span>}</div>
              {tech.tools ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("tools", 2, "Excavation Tools")} disabled={artifacts < getResearchCost(2)}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.weapons ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.weapons ? "#3ec995" : "#d4cbf8", fontSize: 13 }}>Scrap Weaponry</strong>{!tech.weapons && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(3)} Art.</span>}</div>
              {tech.weapons ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("weapons", 3, "Scrap Weaponry")} disabled={artifacts < getResearchCost(3)}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.mining ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.mining ? "#3ec995" : "#87cefa", fontSize: 13 }}>Coal Excavation</strong>{!tech.mining && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(2)} Art.</span>}</div>
              {tech.mining ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("mining", 2, "Coal Excavation")} disabled={artifacts < getResearchCost(2)}>Research</Btn>}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 15, opacity: tech.settlement ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.settlement ? "#3ec995" : "#e0a523", fontSize: 13 }}>Settlement Foundation</strong>{!tech.settlement && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(4)} Art.</span>}</div>
              {tech.settlement ? <Tag color="#3ec995">Established</Tag> : <Btn small variant="gold" onClick={() => { research("settlement", 4, "Settlement Foundation"); setAnimStep(0); setPhase("town_cinematic"); }} disabled={artifacts < getResearchCost(4) || !tech.heating || !tech.tools}>Establish Town</Btn>}
            </div>

            <div style={{ opacity: tech.metallurgy ? 0.5 : (tech.settlement ? 1 : 0.2) }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.metallurgy ? "#3ec995" : "#a8a8a8", fontSize: 13 }}>Metallurgy</strong>{!tech.metallurgy && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(5)} Art.</span>}</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Unlocks Iron Pickaxes and Plated Armor crafting.</p>
              {tech.metallurgy ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("metallurgy", 5, "Metallurgy")} disabled={artifacts < getResearchCost(5) || !tech.settlement}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.advancedArmory ? 0.5 : (tech.metallurgy ? 1 : 0.2) }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.advancedArmory ? "#3ec995" : "#a89df0", fontSize: 13 }}>Advanced Armory</strong>{!tech.advancedArmory && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(8)} Art.</span>}</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Unlocks Mana Rifle crafting.</p>
              {tech.advancedArmory ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("advancedArmory", 8, "Advanced Armory")} disabled={artifacts < getResearchCost(8) || !tech.metallurgy}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.farming ? 0.5 : (tech.settlement ? 1 : 0.2) }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.farming ? "#3ec995" : "#d4cbf8", fontSize: 13 }}>Fungal Farming</strong>{!tech.farming && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(3)} Art.</span>}</div>
              {tech.farming ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("farming", 3, "Fungal Farming")} disabled={artifacts < getResearchCost(3) || !tech.settlement}>Research</Btn>}
            </div>

            <div style={{ opacity: tech.hunting ? 0.5 : (tech.settlement ? 1 : 0.2) }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.hunting ? "#3ec995" : "#e85c3a", fontSize: 13 }}>Hunting Tactics</strong>{!tech.hunting && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(3)} Art.</span>}</div>
              {tech.hunting ? <Tag color="#3ec995">Researched</Tag> : <Btn small onClick={() => research("hunting", 3, "Hunting Tactics")} disabled={artifacts < getResearchCost(3) || !tech.settlement}>Research</Btn>}
            </div>

            {giantPhase >= 1 && !advTech.cryo && (
                <div style={{ borderTop: "1px solid rgba(232,92,58,0.3)", paddingTop: 15, opacity: tech.skyspineHarness ? 0.5 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><strong style={{ color: tech.skyspineHarness ? "#3ec995" : "#a89df0", fontSize: 13 }}>Skyspine Harness</strong>{!tech.skyspineHarness && <span style={{ fontSize: 11, color: "#ffd966" }}>{getResearchCost(5)} Art.</span>}</div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Exo-rig blueprints salvaged from the ruins. Essential for mounting heavy mana-artillery to fight the Giants.</p>
                  {tech.skyspineHarness ? <Tag color="#3ec995">Constructed</Tag> : <Btn small variant="primary" onClick={() => research("skyspineHarness", 5, "Skyspine Harness")} disabled={artifacts < getResearchCost(5)}>Construct Harness</Btn>}
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}