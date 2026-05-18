import React, { useState, useEffect, useRef } from "react";
import { Btn, Tag, Bar, Confetti } from "./UIComponents";

export default function ElfScenario({ setScreen, notify, stats, setStats, diff }) {
  const playClick = () => { if (window.SFX && window.SFX.click) window.SFX.click(); };

  const [phase, setPhase] = useState("intro"); 
  const [animStep, setAnimStep] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null); 
  const [deathReason, setDeathReason] = useState("");
  const [leftTab, setLeftTab] = useState("actions"); 
  
  const [researchAnnounce, setResearchAnnounce] = useState(null);
  const [genOn, setGenOn] = useState(true);
  
  // FIX: Delayed event notice (player can't accidentally dismiss for 2 seconds)
  const [eventReady, setEventReady] = useState(true);
  // FIX: Tutorial state
const [showTutorial, setShowTutorial] = useState(false);
const [showCitizens, setShowCitizens] = useState(false);
  // FIX: Persistent maze states per location (no exploration exploit)
  const [savedMazes, setSavedMazes] = useState({});

  // Survival Stats
  const [hp, setHp] = useState(100); 
  const [temp, setTemp] = useState(100);
  const [food, setFood] = useState(100);
  const [energy, setEnergy] = useState(100); 
  const [morale, setMorale] = useState(70);
  const [permanentEffects, setPermanentEffects] = useState({ foodConsumption: 0, danger: 0, production: 0, revenge: 0, harshRule: 0, celebrations: 0 });
  
  // Resources & Population
  const [artifacts, setArtifacts] = useState(0);
  const [ancientCoreFragments, setAncientCoreFragments] = useState(0);
  const [materials, setMaterials] = useState(10);
  const [coal, setCoal] = useState(50); 
  const [rations, setRations] = useState(0); 
  const [iron, setIron] = useState(0); 
  const [manaCrystals, setManaCrystals] = useState(0); 
  const [frostTitanHearts, setFrostTitanHearts] = useState(0);
  const [meat, setMeat] = useState(0); 
  const [vegetables, setVegetables] = useState(0); 

  // Equipment & Modifiers
  const [equipment, setEquipment] = useState({ pickaxe: 'none', weapon: 'none', armor: 'none' });
  const [mutationLevel, setMutationLevel] = useState(0); 
  
  // FIX: Moved these UP so maxFood can read them without crashing!
  const [ancientEchoes, setAncientEchoes] = useState(0);
  const [metaUpgrades, setMetaUpgrades] = useState({});
  
  const [population, setPopulation] = useState(1);
  const [coreLevel, setCoreLevel] = useState(1);
  const [engineers, setEngineers] = useState(0);
  const [citizens, setCitizens] = useState([]);
  
  // Work Buildings
  const [farms, setFarms] = useState(0);
  const [farmLevel, setFarmLevel] = useState(1);
  const [huntingLodges, setHuntingLodges] = useState(0);
  const [lodgeLevel, setLodgeLevel] = useState(1);
  const [mines, setMines] = useState(0);
  const [mineLevel, setMineLevel] = useState(1);
  const [defenseLevel, setDefenseLevel] = useState(0);
  const maxPopulation = 200;

  const [genEfficiency, setGenEfficiency] = useState(0); 
  
  // Story Progression
  const [townProgress, setTownProgress] = useState(0); 
  const [giantPhase, setGiantPhase] = useState(0); 
  const [capitalPhase, setCapitalPhase] = useState(0);
  const [megaCity, setMegaCity] = useState(false);
const [worldCore, setWorldCore] = useState({
  fragments:0,
  repaired:false,
  activated:false,
  ending:null
});

const OBJECTIVES = [
 {
   id:"fragment1",
   title:"Recover Ancient Core Fragments",
   progress:ancientCoreFragments,
   max:25
 },
 {
   id:"mana100",
   title:"Gather Mana Crystals",
   progress:manaCrystals,
   max:100
 },
 {
   id:"titan5",
   title:"Claim Frost Titan Hearts",
   progress:frostTitanHearts,
   max:5
 },
 {
   id:"population50",
   title:"Grow Population",
   progress:population,
   max:50
 },
 {
   id:"morale70",
   title:"Sustain Morale",
   progress:morale,
   max:70
 },
 {
   id:"rebuild",
   title:"Repair the World Core",
   progress:worldCore.repaired ? 1 : 0,
   max:1
 },
 {
   id:"activate",
   title:"Activate the World Core",
   progress:worldCore.activated ? 1 : 0,
   max:1
 }
];
  
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
  const [exploredLandmarks, setExploredLandmarks] = useState(["Frozen Forest"]);
  const [storyBranches, setStoryBranches] = useState([]);
  const [citizenEventCooldown, setCitizenEventCooldown] = useState(0);
  
  // GIANT QTE STATE
  const [giantCombat, setGiantCombat] = useState(null);
  const [giantVictory, setGiantVictory] = useState(false);
  const [qte, setQte] = useState(null);
  const [bossAnim, setBossAnim] = useState(null);

  const EXPLORATION_NODES = [
    { name: "Frozen Forest", dang: 0.35, weather: "Whiteout gusts", yld: "low", theme: "forest", desc: "Black pines, buried tracks, and animal dens.", branches: ["Beast Nest", "Abandoned Camp", "Frozen Lake", "Hunter Cabin"], unlocks: ["Ruined Factory", "Blighted Town"], travelCost: 1, travelTime: 1, hiddenLoot: "Meat, vegetables, artifacts", landmark: "Hunter Cabin", boss: null, pool: [{n: "Snow Stalker", hp: 100}, {n: "Ice Weaver Spider", hp: 80}] },
    { name: "Ruined Factory", dang: 0.55, weather: "Metal-rattling crosswinds", yld: "mod", theme: "metal", desc: "Old industry still ticks beneath the ice.", branches: ["Assembly Hall", "Boiler Pit", "Tool Vault", "Crane Spine"], unlocks: ["Shattered Spire", "Deep Ice Caverns"], travelCost: 1, travelTime: 2, hiddenLoot: "Iron, materials, core fragments", landmark: "Tool Vault", boss: "Scrap Colossus", pool: [{n: "Rogue Automaton", hp: 140}, {n: "Scrap Golem", hp: 120}] },
    { name: "Shattered Spire", dang: 0.75, weather: "Mana static", yld: "high", theme: "arcane", desc: "A broken mana tower throwing violet light into the storm.", branches: ["Mirror Gallery", "Mana Well", "Fallen Observatory", "Spire Crown"], unlocks: ["Ancient Temple"], travelCost: 2, travelTime: 3, hiddenLoot: "Mana crystals, artifacts", landmark: "Mana Well", boss: "Arcane Sentinel Prime", pool: [{n: "Arcane Sentinel", hp: 160}, {n: "Mana Wyrm", hp: 110}] },
    { name: "Blighted Town", dang: 0.85, weather: "Ash snow", yld: "high", theme: "corruption", desc: "A corrupted settlement where survivors whisper through boarded windows.", branches: ["Market Ruin", "Chapel Cellar", "Collapsed Homes", "Old Gate"], unlocks: ["Titan Graveyard"], travelCost: 2, travelTime: 3, hiddenLoot: "Citizens, food, corruption events", landmark: "Old Gate", boss: "Plague Amalgam", pool: [{n: "Plague Husk", hp: 130}, {n: "Flesh Amalgam", hp: 200}] },
    { name: "Deep Ice Caverns", dang: 0.9, weather: "Subzero pressure", yld: "high", theme: "stone", desc: "Blue tunnels with ancient machinery frozen into the walls.", branches: ["Crystal Shelf", "Deep Mine", "Thermal Vent", "Silent Shaft"], unlocks: ["Titan Graveyard"], travelCost: 2, travelTime: 4, hiddenLoot: "Coal, mana, titan traces", landmark: "Deep Mine", boss: "Ice Burrower Matriarch", pool: [{n: "Deep Ice Burrower", hp: 180}, {n: "Crystal Maw", hp: 150}] },
    { name: "Titan Graveyard", dang: 1.05, weather: "Titan storms", yld: "legend", theme: "corruption", desc: "Half-buried giants form a mountain range of dead gods.", branches: ["Rib Canyon", "Heart Vault", "Skull Ridge", "Frozen Arena"], unlocks: ["Ancient Temple"], travelCost: 3, travelTime: 5, hiddenLoot: "Frost Titan Hearts, core fragments", landmark: "Heart Vault", boss: "Frost Titan Remnant", pool: [{n: "Titan Bone Warden", hp: 220}, {n: "Frost Revenant", hp: 190}] },
    { name: "Ancient Temple", dang: 1.15, weather: "Impossible calm", yld: "legend", theme: "arcane", desc: "The sealed temple around the World Core's old arteries.", branches: ["Pilgrim Steps", "Core Reliquary", "Oracle Ice", "Restoration Gate"], unlocks: [], travelCost: 3, travelTime: 6, hiddenLoot: "Core fragments, mana crystals, endings", landmark: "Restoration Gate", boss: "World Core Guardian", pool: [{n: "Temple Guardian", hp: 240}, {n: "Mana Seraph", hp: 210}] }
  ];

  const META_UPGRADES = [
    { id: "generatorMemory", name: "Generator Memory", cost: 3, desc: "+5 starting heat." },
    { id: "efficientSurvival", name: "Efficient Survival", cost: 4, desc: "+10 food capacity at start." },
    { id: "hunterInstinct", name: "Hunter Instinct", cost: 5, desc: "+5% hunting success." },
    { id: "titanKnowledge", name: "Titan Knowledge", cost: 6, desc: "+5% boss accuracy." },
    { id: "ancientEngineering", name: "Ancient Engineering", cost: 4, desc: "+10 materials at start." }
  ];

  // SCALING CAPACITIES & MULTIPLIERS
  const maxHp = 100 + (mutationLevel * 20);
  const maxHeat = coreLevel * 100;
  const isMetaDisabled = diff?.id === "hard" || diff?.id === "insanity";
  const maxFood = 100 + (farms * 50) + (huntingLodges * 50) + Math.floor(population * 5) + (!isMetaDisabled && metaUpgrades.efficientSurvival ? 10 : 0);
  const foodConsumptionMultiplier = 1 + Math.floor((population - 1) / 10) * 0.5;

  const moraleBand = morale >= 90 ? "inspired" : morale >= 70 ? "steady" : morale >= 40 ? "strained" : morale >= 20 ? "mutinous" : "collapse";
  const productionMult = (morale >= 90 ? 1.25 : morale >= 40 ? 1 : morale >= 20 ? 0.9 : 0.75) + (permanentEffects.production || 0);
  const moraleBossBonus = morale >= 90 ? 10 : morale >= 70 ? 0 : morale >= 40 ? -5 : -15;

  const MAZE_THEMES = {
    stone: { floor: "#2a2a35", wall: "#151515", glow: "none", title: "#87cefa" },
    forest: { floor: "#1a3028", wall: "#0a1c14", glow: "0 0 10px #3ec995", title: "#3ec995" },
    metal: { floor: "#2b1d15", wall: "#1a0f0a", glow: "none", title: "#ff8c00" },
    arcane: { floor: "#201830", wall: "#110b1c", glow: "0 0 15px #a89df0", title: "#a89df0" },
    corruption: { floor: "#301015", wall: "#1a0505", glow: "0 0 10px #e85c3a", title: "#e85c3a" }
  };

  const addLog = (msg, type = "info") => setLog(prev => [...prev.slice(-49), { msg, type, id: Date.now() + Math.random() }]);
  const changeMorale = (amount, reason) => {
    setMorale(m => Math.max(0, Math.min(100, m + amount)));
    if (reason) addLog(`${reason} (${amount > 0 ? "+" : ""}${amount} morale)`, amount >= 0 ? "heal" : "dmg");
  };

  const addPermanentEffect = (key, amount) => setPermanentEffects(prev => ({ ...prev, [key]: (prev[key] || 0) + amount }));
  const addBranch = (branch) => setStoryBranches(prev => prev.includes(branch) ? prev : [...prev, branch]);

  const gainEchoes = (amount) => {
    if (isMetaDisabled || amount <= 0) return;
    setAncientEchoes(e => {
      const next = e + amount;
      localStorage.setItem("aleria_elf_meta", JSON.stringify({ echoes: next, upgrades: metaUpgrades }));
      return next;
    });
  };

  const buyMetaUpgrade = (upgrade) => {
    if (isMetaDisabled || metaUpgrades[upgrade.id] || ancientEchoes < upgrade.cost) return;
    const nextEchoes = ancientEchoes - upgrade.cost;
    const nextUpgrades = { ...metaUpgrades, [upgrade.id]: true };
    setAncientEchoes(nextEchoes);
    setMetaUpgrades(nextUpgrades);
    localStorage.setItem("aleria_elf_meta", JSON.stringify({ echoes: nextEchoes, upgrades: nextUpgrades }));
    addLog(`Ancient Echo memory unlocked: ${upgrade.name}.`, "reward");
  };

  // FIX: Delayed event notice, but bypassed for fast exploration encounters!
  useEffect(() => {
    if (activeEvent) {
      if (activeEvent.fast) {
        setEventReady(true);
      } else {
        setEventReady(false);
        const t = setTimeout(() => setEventReady(true), 2000);
        return () => clearTimeout(t);
      }
    }
  }, [activeEvent]);

  const generateCitizen = () => {
    const names = ["Alion", "Lya", "Aelen", "Halmar", "Sari", "Felan", "Anya", "Cori", "Elena", "Riel", "Erius", "Zane", "Ilana", "Myr", "Lorin", "Sylas", "Cal"];
    const traitPool = ["brave", "loyal", "greedy", "lazy", "intelligent", "aggressive", "compassionate"];
    const roll = Math.random();
    let skills = { farm: 1, hunt: 1, heat: 1, mine: 1 };
    if (roll < 0.05) skills = { farm: 3, hunt: 3, heat: 3, mine: 3 }; 
    else if (roll < 0.30) skills = { farm: 3, hunt: 1, heat: 1, mine: 1 }; 
    else if (roll < 0.55) skills = { farm: 1, hunt: 3, heat: 1, mine: 1 }; 
    else if (roll < 0.80) skills = { farm: 1, hunt: 1, heat: 1, mine: 3 }; 
    else skills = { farm: 1, hunt: 1, heat: 3, mine: 1 }; 
    const traits = [traitPool[Math.floor(Math.random() * traitPool.length)]];
    if (Math.random() < 0.25) traits.push(traitPool.filter(t => t !== traits[0])[Math.floor(Math.random() * (traitPool.length - 1))]);
    return { id: Date.now() + Math.random(), name: names[Math.floor(Math.random() * names.length)], age: 18 + Math.floor(Math.random() * 45), skills: skills, job: 'unassigned', traits, relationship: 50, resentment: 0 };
  };

  useEffect(() => {
    try {
      const savedMeta = JSON.parse(localStorage.getItem("aleria_elf_meta") || "{}");
      setAncientEchoes(savedMeta.echoes || 0);
      setMetaUpgrades(savedMeta.upgrades || {});
      if (!isMetaDisabled) {
        if (savedMeta.upgrades?.generatorMemory) setTemp(t => Math.min(maxHeat, t + 5));
        if (savedMeta.upgrades?.ancientEngineering) setMaterials(m => m + 10);
      }
    } catch(e) {}
  }, []);

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
        setTemp(data.temp ?? 100); setFood(data.food ?? 100); setEnergy(data.energy ?? 100); setHp(data.hp ?? 100); setMorale(data.morale ?? 70);
        setArtifacts(data.artifacts ?? 0); setAncientCoreFragments(data.ancientCoreFragments ?? data.worldCore?.fragments ?? 0); setMaterials(data.materials ?? 10); setCoal(data.coal ?? 50); 
        setRations(data.rations ?? 0); setIron(data.iron ?? 0); setManaCrystals(data.manaCrystals ?? 0); setFrostTitanHearts(data.frostTitanHearts ?? 0);
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
        if (data.savedMazes) setSavedMazes(data.savedMazes);
        if (data.exploredLandmarks) setExploredLandmarks(data.exploredLandmarks);
        if (data.permanentEffects) setPermanentEffects(prev => ({ ...prev, ...data.permanentEffects }));
        if (data.storyBranches) setStoryBranches(data.storyBranches);
        if (data.worldCore) setWorldCore(prev => ({ ...prev, ...data.worldCore }));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (["intro", "victory", "dead", "giant_cutscene", "victory_anim"].includes(phase)) return; 
    const data = { phase, temp, food, energy, hp, morale, artifacts, ancientCoreFragments, frostTitanHearts, materials, coal, rations, iron, manaCrystals, meat, vegetables, equipment, population, coreLevel, engineers, genEfficiency, mutationLevel, farms, farmLevel, defenseLevel, mines, mineLevel, huntingLodges, lodgeLevel, townProgress, giantPhase, tech, advTech, log, clearedNodes, citizens, genOn, savedMazes, exploredLandmarks, permanentEffects, storyBranches, worldCore }; 
    localStorage.setItem("aleria_elf_save", JSON.stringify(data));
  }, [phase, temp, food, energy, hp, morale, artifacts, ancientCoreFragments, frostTitanHearts, materials, coal, rations, iron, manaCrystals, meat, vegetables, equipment, population, coreLevel, engineers, genEfficiency, mutationLevel, farms, farmLevel, defenseLevel, mines, mineLevel, huntingLodges, lodgeLevel, townProgress, giantPhase, tech, advTech, log, clearedNodes, citizens, genOn, savedMazes, exploredLandmarks, permanentEffects, storyBranches, worldCore]);

  // --- STORY PROGRESSION LISTENER ---
  useEffect(() => {
    if (!tech.settlement || phase !== "outpost" || activeEvent) return;
    if (townProgress >= 20 && giantPhase === 0) { setPhase("giant_cutscene"); setAnimStep(0); }
    else if (townProgress > 3 && townProgress % 7 === 0 && citizenEventCooldown !== townProgress && population >= 3) { setCitizenEventCooldown(townProgress); triggerCitizenPersonalEvent(); }
    // FIX: Trigger random civilian/refugee/bandit events periodically once settled (every ~5 actions)
    else if (townProgress > 5 && townProgress % 5 === 0 && !activeEvent && population >= 5) triggerEndlessEvent();
    else if (phase === "endless" && townProgress % 3 === 0 && !activeEvent) triggerEndlessEvent();
  }, [townProgress, tech.settlement, phase, activeEvent, giantPhase, temp, food, coal, citizenEventCooldown, population]);

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
    if (megaCity) return; // FIX: The Mega-City is fully automated. Stop resource decay!
    let fYield = 0, hYield = 0, htYield = 0, cYield = 0, iYield = 0;
    const miners = citizens.filter(c => c.job === 'mine');
    
    citizens.forEach(c => {
       const traitMult = c.traits?.includes("lazy") ? 0.85 : c.traits?.includes("loyal") ? 1.08 : 1;
       if (c.job === 'farm') fYield += (c.skills?.farm || 1) * (2 + farmLevel) * traitMult;
       if (c.job === 'hunt') hYield += (c.skills?.hunt || 1) * (3 + lodgeLevel) * traitMult;
       if (c.job === 'mine') {
          cYield += (c.skills?.mine || 1) * (2 + mineLevel) * traitMult;
          if (Math.random() < 0.3) iYield += 1; 
       }
       if (c.job === 'heat' && genOn) htYield += (c.skills?.heat || 1) * 3 * traitMult;
    });

    fYield = Math.floor(fYield * productionMult);
    hYield = Math.floor(hYield * productionMult);
    htYield = Math.floor(htYield * productionMult);
    cYield = Math.floor(cYield * productionMult);

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
           changeMorale(-8, `${deadMiner.name}'s death shook the settlement.`);
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
      // FIX: Food consumption doubles every 5 civilians
      const baseLoss = Math.max(1, ((foodLoss + popDrain) * (foodConsumptionMultiplier + (permanentEffects.foodConsumption || 0))) - mutResist);
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
    if (tech.settlement && morale <= 19 && Math.random() < 0.08) handleDeath("Morale collapsed into riots, desertions, and murder.");
    else if (tech.settlement && morale <= 39 && Math.random() < 0.12) {
      setMaterials(m => Math.max(0, m - 5));
      addLog("Low morale sparked theft and job refusals. Lost 5 Materials.", "dmg");
    }
    else if (tech.settlement && morale >= 90 && Math.random() < 0.06) {
      setFood(f => Math.min(maxFood, f + 10));
      addLog("A celebration lifted spirits and shared food stores.", "heal");
    }
  };

  const bossTargets = [
    { id: "head", label: "Head", base: 25, mult: 2.2, effect: "Critical damage" },
    { id: "chest", label: "Chest", base: 80, mult: 1, effect: "Reliable damage" },
    { id: "leftArm", label: "Left Arm", base: 50, mult: 0.85, effect: "Can disable attacks" },
    { id: "rightArm", label: "Right Arm", base: 50, mult: 0.85, effect: "Can disable attacks" },
    { id: "leftLeg", label: "Left Leg", base: 65, mult: 0.75, effect: "Can slow giant" },
    { id: "rightLeg", label: "Right Leg", base: 65, mult: 0.75, effect: "Can slow giant" }
  ];

  const fireAtGiantTarget = (target) => {
    if (!giantCombat || qte || giantVictory) return;
    playClick();
    const weaponAccuracy = equipment.weapon === "mana_rifle" ? 15 : equipment.weapon === "scrap_blade" ? 5 : 0;
    const skillBonus = Math.min(20, citizens.filter(c => c.job === "hunt").reduce((sum, c) => sum + (c.skills?.hunt || 1), 0));
    const metaBonus = !isMetaDisabled && metaUpgrades.titanKnowledge ? 5 : 0;
    const bossEvasion = giantCombat.phase === 3 ? 18 : giantCombat.phase === 2 ? 10 : 5;
    const finalChance = Math.max(5, Math.min(95, target.base + weaponAccuracy + skillBonus + moraleBossBonus + metaBonus - bossEvasion));
    const hit = Math.random() * 100 < finalChance;
    setBossAnim(hit ? "hit" : "miss");
    setTimeout(() => setBossAnim(null), 450);
    setGiantCombat(gc => {
      const phase = gc.hp < gc.maxHp * 0.33 ? 3 : gc.hp < gc.maxHp * 0.66 ? 2 : 1;
      let n = { ...gc, phase };
      if (hit) {
        let dmg = Math.floor((80 + Math.random() * 45 + skillBonus * 2) * target.mult);
        if (advTech.exoStim) dmg = Math.floor(dmg * 1.5);
        if (target.id.includes("Arm") && Math.random() < 0.35) n.disabledArm = true;
        if (target.id.includes("Leg") && Math.random() < 0.4) n.slowed = true;
        n.hp = gc.hp - dmg;
        n.logs = [...n.logs.slice(-5), {msg: `${target.label} hit for ${dmg} DMG. ${target.effect}.`, type: 'reward', id: Date.now()}];
        if (n.hp <= 0) setGiantVictory(true);
      } else {
        n.logs = [...n.logs.slice(-5), {msg: `Shot missed the ${target.label}. Final chance was ${finalChance}%.`, type: 'dmg', id: Date.now()}];
      }
      return n;
    });
    if (!hit && Math.random() < 0.35) setTimeout(triggerNextQte, 350);
  };

  const handleDeath = (reason) => { 
    gainEchoes(Math.max(1, Math.floor((townProgress + ancientCoreFragments + frostTitanHearts * 3) / 12)));
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
        fast: true, //
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

  const triggerCitizenPersonalEvent = () => {
    if (!tech.settlement || citizens.length === 0) return false;
    const citizen = citizens[Math.floor(Math.random() * citizens.length)];
    const wish = [
      {
        title: `${citizen.name} wants to become a hunter`,
        desc: `${citizen.name} has watched the hunting parties leave the gates and asks for a real weapon. Traits: ${(citizen.traits || []).join(", ") || "none"}.`,
        choices: [
          { label: "Allow it (+Hunt skill, +5 Morale)", req: true, color: "normal", action: () => { playClick(); setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, job: "hunt", skills: { ...c.skills, hunt: Math.min(5, (c.skills?.hunt || 1) + 1) }, relationship: (c.relationship || 50) + 10 } : c)); changeMorale(5, `${citizen.name} found purpose.`); setActiveEvent(null); } },
          { label: "Refuse (-5 Morale, resentment chance)", req: true, color: "danger", action: () => { playClick(); setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, resentment: (c.resentment || 0) + 15, relationship: (c.relationship || 50) - 10 } : c)); changeMorale(-5, `${citizen.name}'s request was refused.`); setActiveEvent(null); } },
          { label: "Train personally (50% elite / 50% injury)", req: energy >= 20, color: "normal", action: () => { playClick(); setEnergy(e => Math.max(0, e - 20)); if (Math.random() < 0.5) { setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, job: "hunt", traits: [...new Set([...(c.traits || []), "brave"])], skills: { ...c.skills, hunt: 5 }, relationship: (c.relationship || 50) + 20 } : c)); changeMorale(8, `${citizen.name} became an elite hunter.`); } else { setHp(h => Math.max(1, h - 10)); changeMorale(-3, `${citizen.name} was injured during training.`); } setActiveEvent(null); } }
        ]
      },
      {
        title: `${citizen.name} asks for family rations`,
        desc: `A private request reaches your desk. Compassion could build loyalty, but the stores are watched by hungry eyes.`,
        choices: [
          { label: "Grant extra food (-15 Food, +relationship)", req: food >= 15, color: "normal", action: () => { playClick(); setFood(f => f - 15); setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, relationship: (c.relationship || 50) + 20 } : c)); changeMorale(4, "A humane exception spread through the quarters."); setActiveEvent(null); } },
          { label: "Make it public ration reform (-30 Food, +10 Morale)", req: food >= 30, color: "normal", action: () => { playClick(); setFood(f => f - 30); changeMorale(10, "Ration reform calmed the settlement."); addPermanentEffect("production", 0.02); setActiveEvent(null); } },
          { label: "Refuse as favoritism (-relationship)", req: true, color: "danger", action: () => { playClick(); setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, relationship: (c.relationship || 50) - 20, resentment: (c.resentment || 0) + 10 } : c)); changeMorale(-2, "The refusal was lawful, but cold."); setActiveEvent(null); } }
        ]
      },
      {
        title: `${citizen.name} proposes a festival`,
        desc: `The settlement wants one night with music instead of storm alarms. Work will slow, but people might remember why they endure.`,
        choices: [
          { label: "Hold festival (-20 Food, +15 Morale)", req: food >= 20, color: "normal", action: () => { playClick(); setFood(f => f - 20); addPermanentEffect("celebrations", 1); changeMorale(15, "The festival lit the frozen streets."); setActiveEvent(null); } },
          { label: "Let workers self-organize (+5 Morale, -5 Mat)", req: materials >= 5, color: "normal", action: () => { playClick(); setMaterials(m => m - 5); changeMorale(5, "A small celebration survived on scraps."); setActiveEvent(null); } },
          { label: "Ban distractions (+danger, -10 Morale)", req: true, color: "danger", action: () => { playClick(); addPermanentEffect("danger", 0.03); addPermanentEffect("harshRule", 1); changeMorale(-10, "The ban hardened the city."); setActiveEvent(null); } }
        ]
      }
    ];
    setActiveEvent(wish[Math.floor(Math.random() * wish.length)]);
    return true;
  };

  const triggerEndlessEvent = () => {
    const events = [];
    if ((temp/maxHeat) < 0.4) events.push({
        title: "The Cold is Unbearable",
        desc: "A delegation of frozen citizens marches to the core. 'We are freezing in our beds, Overseer. Do something!'",
        choices: [
            { label: "Stoke the Core (-20 Coal, +8 Morale)", req: coal >= 20, color: "normal", action: () => { playClick(); setCoal(c=>c-20); setTemp(t=>Math.min(maxHeat, t+40)); changeMorale(8, "You placated the freezing citizens."); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Conserve Fuel (death, -15 Morale)", req: true, color: "danger", action: () => { playClick(); setCitizens(prev => prev.slice(0, -1)); setPopulation(p => Math.max(1, p-1)); changeMorale(-15, "A citizen froze to death in protest."); addBranch("cold_policy"); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    if ((food/maxFood) < 0.4) events.push({
        title: "Ration Protests",
        desc: "Hunger drives the workers to strike. They demand access to the emergency stockpiles.",
        choices: [
            { label: "Distribute Reserves (-20 Food, +8 Morale)", req: food >= 20, color: "normal", action: () => { playClick(); setFood(f=>f-20); changeMorale(8, "You fed the protesters to stop the strike."); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Disperse them by force (-20 Morale)", req: true, color: "danger", action: () => { playClick(); setEngineers(e => Math.max(0, e-1)); setCitizens(prev => prev.slice(0, -1)); setPopulation(p => Math.max(1, p-1)); addPermanentEffect("danger", 0.04); changeMorale(-20, "Guards dispersed the crowd. Casualties occurred."); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    
    // FIX: Civilian problem scenarios
    events.push({
        title: "Citizen Dispute",
        desc: "Two of your citizens fight over a scrap of cloth. If you don't act, others may turn on each other too.",
        choices: [
            { label: "Mediate fairly (+5 Morale, +1 Town progress)", req: true, color: "normal", action: () => { playClick(); changeMorale(5, "You resolved the dispute fairly."); setTownProgress(p=>p+2); setActiveEvent(null); } },
            { label: "Side with the stronger (+5 Mat, future resentment)", req: true, color: "danger", action: () => { playClick(); setMaterials(m => m+5); addPermanentEffect("danger", 0.02); changeMorale(-4, "Justice bent toward power."); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    
    events.push({
        title: "Refugees at the Gate",
        desc: "A desperate group of survivors from a fallen settlement begs to enter the city.",
        choices: [
            { label: "Accept everyone (+5 Pop, +10 Morale, permanent food demand)", req: food >= 30 && population + 5 <= maxPopulation, color: "normal", action: () => { playClick(); setFood(f=>f-30); setPopulation(p=>p+5); setCitizens(prev => [...prev, ...Array.from({length: 5}, () => generateCitizen())]); addPermanentEffect("foodConsumption", 0.2); changeMorale(10, "You welcomed every refugee."); addBranch("open_gate"); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Only skilled workers (+2 Eng, +2 Hunters, +5 Morale)", req: population + 4 <= maxPopulation, color: "normal", action: () => { playClick(); const newHunters = Array.from({length: 2}, () => ({ ...generateCitizen(), job: "hunt", skills: { farm: 1, hunt: 3, heat: 1, mine: 1 }, traits: ["brave"] })); setEngineers(e=>e+2); setPopulation(p=>p+4); setCitizens(prev => [...prev, ...newHunters, ...Array.from({length: 2}, () => ({ ...generateCitizen(), traits: ["intelligent"] }))]); changeMorale(5, "Skilled refugees were admitted."); addBranch("skilled_gate"); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Reject them (-15 Morale, revenge chance)", req: true, color: "danger", action: () => { playClick(); addPermanentEffect("revenge", 0.15); changeMorale(-15, "You left them to the frost."); addBranch("closed_gate"); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });
    
    // FIX: Bandit arrival event
    events.push({
        title: "Bandits Approach!",
        desc: "Armed raiders demand a portion of your stores or they'll storm the gates.",
        choices: [
            { label: "Pay them off (-15 Mat, -10 Coal, +future danger)", req: materials >= 15 && coal >= 10, color: "normal", action: () => { playClick(); setMaterials(m=>m-15); setCoal(c=>c-10); addPermanentEffect("danger", 0.03); addLog("The bandits left with tribute. They may return.", "info"); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Fight back (Risk casualties)", req: true, color: "danger", action: () => { playClick();
                const huntersCount = citizens.filter(c => c.job === 'hunt').length;
                const success = Math.random() < (0.4 + huntersCount * 0.1 + (morale >= 90 ? 0.1 : 0));
                if (success) {
                  setMaterials(m => m + 25); setIron(i => i + 5);
                  changeMorale(6, "Your hunters drove off the bandits.");
                  addLog("Looted their kit!", "reward");
                } else {
                  const lost = Math.min(citizens.length, 2 + Math.floor(Math.random() * 3));
                  setCitizens(prev => prev.slice(0, -lost));
                  setPopulation(p => Math.max(1, p - lost));
                  changeMorale(-12, `The bandits killed ${lost} citizens before retreating.`);
                }
                setActiveEvent(null); setTownProgress(p=>p+1);
            }}
        ]
    });
    
    // FIX: Sickness event
    if (population >= 10) events.push({
        title: "Outbreak of Sickness",
        desc: "A cough spreads through the lower quarters. Without action, it could become a plague.",
        choices: [
            { label: "Quarantine the sick (-5 Food, +5 Morale)", req: food >= 5, color: "normal", action: () => { playClick(); setFood(f=>f-5); changeMorale(5, "The sickness was contained."); setTownProgress(p=>p+2); setActiveEvent(null); } },
            { label: "Do nothing", req: true, color: "danger", action: () => { playClick();
                const sick = Math.floor(population * 0.2);
                setCitizens(prev => prev.slice(0, -sick));
                setPopulation(p => Math.max(1, p - sick));
                changeMorale(-18, `${sick} citizens died of plague.`);
                setActiveEvent(null); setTownProgress(p=>p+1);
            }}
        ]
    });

    if (giantPhase >= 1) events.push({
        title: "Corruption in the Snow",
        desc: "Black frost grows over the outer pipes. Engineers say it feeds on fear and heat.",
        choices: [
            { label: "Purge with mana (-3 Mana, -danger, +Morale)", req: manaCrystals >= 3, color: "normal", action: () => { playClick(); setManaCrystals(m=>m-3); addPermanentEffect("danger", -0.04); changeMorale(7, "The corruption was burned clean."); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Harvest it (+2 Fragments, +danger)", req: true, color: "danger", action: () => { playClick(); setAncientCoreFragments(f=>f+2); addPermanentEffect("danger", 0.06); changeMorale(-6, "The harvested corruption whispered through the settlement."); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Seal the district (-1 Pop, preserve resources)", req: population > 1, color: "danger", action: () => { playClick(); setCitizens(prev => prev.slice(0, -1)); setPopulation(p => Math.max(1, p-1)); changeMorale(-10, "A district was sealed with people inside."); setActiveEvent(null); setTownProgress(p=>p+1); } }
        ]
    });

    if ((permanentEffects.revenge || 0) > 0 && Math.random() < permanentEffects.revenge) events.push({
        title: "Revenge at the Gate",
        desc: "Survivors once refused by your city return with stolen rifles and a list of names.",
        choices: [
            { label: "Negotiate restitution (-25 Food, -10 Mat)", req: food >= 25 && materials >= 10, color: "normal", action: () => { playClick(); setFood(f=>f-25); setMaterials(m=>m-10); addPermanentEffect("revenge", -0.1); changeMorale(4, "Restitution cooled an old wound."); setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Ambush them (Hunter check)", req: true, color: "danger", action: () => { playClick(); const power = citizens.filter(c => c.job === "hunt").length * 0.08; if (Math.random() < 0.45 + power) { setIron(i=>i+8); addPermanentEffect("revenge", -0.05); changeMorale(-3, "The ambush worked, but no one celebrated."); } else { const lost = Math.min(citizens.length, 3); setCitizens(prev=>prev.slice(0, -lost)); setPopulation(p=>Math.max(1, p-lost)); changeMorale(-14, "The revenge raid broke through."); } setActiveEvent(null); setTownProgress(p=>p+1); } },
            { label: "Open the gate and apologize (+Pop, risk theft)", req: population + 3 <= maxPopulation, color: "normal", action: () => { playClick(); setPopulation(p=>p+3); setCitizens(prev=>[...prev, ...Array.from({length:3}, () => generateCitizen())]); setMaterials(m=>Math.max(0, m-15)); addPermanentEffect("revenge", -0.15); changeMorale(8, "The old grievance became new citizens."); setActiveEvent(null); setTownProgress(p=>p+1); } }
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
    // FIX: Early-game "Explore Ruins" has LOW monster chance, scaled by progression
    const monsterChance = !tech.settlement ? 0.04 : (tech.tools ? 0.08 : 0.12);
    if (roll < monsterChance) triggerEvent("monster"); 
    else if (roll < monsterChance + 0.30) triggerEvent("survivor");
    else if (roll < monsterChance + 0.55) { 
       const found = Math.floor(Math.random() * (tech.tools ? 3 : 2)) + 1; 
       setArtifacts(a => a + found); addLog(`Unearthed ${found} Artifacts.`, "reward"); 
    } else if (roll < monsterChance + 0.70) {
       // FIX: Mana acquisition - allow early-game mana finds from ruin exploration
       const manaFound = Math.floor(Math.random() * 2) + 1;
       setManaCrystals(m => m + manaFound);
       addLog(`Recovered ${manaFound} Mana Crystal${manaFound > 1 ? 's' : ''} from a glowing relic.`, "reward");
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
    // FIX: Rest also slightly heals HP per problem statement
    setHp(h => Math.min(maxHp, h + Math.floor(maxHp * 0.15)));
    applyDecay(5, 0); 
    addLog("Rested near the pipes. (+50 Energy, slight HP heal, -5 Food)", "heal");
  };


  // FIX: Eat rations from menu (heal HP + restore food)
  const eatRation = () => {
    if (window.SFX && window.SFX.click) window.SFX.click();
    if (rations < 1) return notify("No rations available.", "#e85c3a");
    
    setRations(r => r - 1);
    setHp(h => Math.min(maxHp, h + 30));
    setFood(f => Math.min(maxFood, f + 40));
    
    addLog("Ate a Travel Ration. (+30 HP, +40 Food)", "heal");
    if (window.SFX && window.SFX.eat) window.SFX.eat();
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

  const startDeepMine = () => {
    playClick();
    if (energy < 10) return notify("Too exhausted to mine.", "#e85c3a");
    setActiveEvent({
      title: "Deep Mine",
      desc: "The shaft descends below the heated levels. Better coal waits below, along with collapses no one will hear.",
      fast: true,
      choices: [
        { label: "Safe shaft (+20 Coal, 5% collapse)", req: energy >= 10, color: "normal", action: () => resolveRiskAction("mine", 20, 0.05, 10) },
        { label: "Risky descent (+50 Coal, 20% collapse)", req: energy >= 18, color: "normal", action: () => resolveRiskAction("mine", 50, 0.2, 18) },
        { label: "Extreme bore (+100 Coal, 40% collapse, rare legendary loot)", req: energy >= 30, color: "danger", action: () => resolveRiskAction("mine", 100, 0.4, 30, true) }
      ]
    });
  };

  const resolveRiskAction = (kind, reward, collapseChance, energyCost, legendary=false) => {
    playClick();
    applyDecay(kind === "hunt" ? 0 : 8, energyCost);
    setActiveEvent(null);
    const danger = collapseChance + (permanentEffects.danger || 0);
    if (Math.random() < danger) {
      const dmg = legendary ? 45 : 25;
      setHp(h => { const nh = Math.max(0, h - dmg); if (nh <= 0) setTimeout(()=>handleDeath("A high-risk expedition ended under ice and stone."), 500); return nh; });
      changeMorale(-5, "The risky action went badly.");
      addLog(`Disaster struck during ${kind}. Took ${dmg} damage.`, "dmg");
      return;
    }
    if (kind === "mine") {
      setCoal(c => c + reward);
      if (legendary && Math.random() < 0.25) { setAncientCoreFragments(f => f + 1); addLog("Legendary find: +1 Ancient Core Fragment.", "reward"); }
      addLog(`Deep Mine success: +${reward} Coal.`, "reward");
    }
    if (kind === "ruins") {
      setArtifacts(a => a + Math.floor(reward / 10));
      setAncientCoreFragments(f => f + (legendary ? 2 : 1));
      addLog(`Ruins excavation recovered ancient core material.`, "reward");
    }
    if (kind === "hunt") {
      setFood(f => Math.min(maxFood, f + reward));
      setMeat(m => m + Math.floor(reward / 4));
      addLog(`Hunt success: +${reward} Food.`, "heal");
    }
  };

  const startRuinsExcavation = () => {
    playClick();
    setActiveEvent({
      title: "Ancient Ruins",
      desc: "You can scrape the surface, pry open sealed rooms, or break forbidden seals around the old core conduits.",
      fast: true,
      choices: [
        { label: "Safe excavation (+Artifacts, +1 Fragment)", req: energy >= 12, color: "normal", action: () => resolveRiskAction("ruins", 20, 0.05, 12) },
        { label: "Aggressive excavation (+Artifacts, +1 Fragment, 20% disaster)", req: energy >= 20, color: "normal", action: () => resolveRiskAction("ruins", 35, 0.2, 20) },
        { label: "Forbidden excavation (+Artifacts, +2 Fragments, 40% disaster)", req: energy >= 35, color: "danger", action: () => resolveRiskAction("ruins", 50, 0.4, 35, true) }
      ]
    });
  };

  const startHuntingChoice = () => {
    playClick();
    setActiveEvent({
      title: "Hunting Grounds",
      desc: "Tracks split at the snowline. Small prey is reliable. Larger prey could feed the city. Monster tracks lead toward a den.",
      fast: true,
      choices: [
        { label: "Small prey (+25 Food, 5% injury)", req: energy >= 8, color: "normal", action: () => resolveRiskAction("hunt", 25, 0.05, 8) },
        { label: "Large prey (+60 Food, 20% injury)", req: energy >= 18, color: "normal", action: () => resolveRiskAction("hunt", 60, 0.2 - (!isMetaDisabled && metaUpgrades.hunterInstinct ? 0.05 : 0), 18) },
        { label: "Monster hunt (+110 Food, 40% injury)", req: energy >= 30 && tech.weapons, color: "danger", action: () => resolveRiskAction("hunt", 110, 0.4 - (!isMetaDisabled && metaUpgrades.hunterInstinct ? 0.05 : 0), 30, true) }
      ]
    });
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
      fast: true,
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
    const bossHp = 1000 + (frostTitanHearts * 150) + Math.floor((permanentEffects.danger || 0) * 1000);
    setGiantCombat({ hp: bossHp, maxHp: bossHp, phase: 1, logs: [{msg: "You engage the Skyspine Harness. Target zones armed. QTE dodges remain active.", type: "sys", id: Date.now()}] });
    setPhase("giant_combat");
    setTimeout(triggerNextQte, 2000);
  };

  const travelToNode = (nodeData) => {
    playClick();
    if (rations < nodeData.travelCost) return notify(`Need ${nodeData.travelCost} Ration(s) to journey.`, "#e85c3a");
    setRations(r => r - nodeData.travelCost);
    setEnergy(e => Math.max(0, e - nodeData.travelTime * 3));
    if (tech.settlement) setTownProgress(p => p + 1);
    if (Math.random() < 0.12 + (permanentEffects.danger || 0)) {
      setTemp(t => Math.max(0, t - 8));
      addLog(`${nodeData.weather} slowed the expedition. Lost heat on return.`, "dmg");
    }

    // FIX: If we already explored this node partially (fled), reuse the same maze
    if (savedMazes[nodeData.name]) {
      setMaze(savedMazes[nodeData.name]);
      setPhase("exploring");
      return;
    }

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
          if (rand < (nodeData.dang + (permanentEffects.danger || 0)) * 0.15) grid[r][c] = 3; 
          else if (rand < 0.15 + (nodeData.dang * 0.1)) grid[r][c] = 2; 
        }
      }
    }

    const newMaze = { name: nodeData.name, yieldType: nodeData.yld, theme: nodeData.theme, pool: nodeData.pool, branches: nodeData.branches, unlocks: nodeData.unlocks, landmark: nodeData.landmark, boss: nodeData.boss, grid: grid, player: {x: 0, y: 0}, logs: [{msg: `Entered ${nodeData.name}. Find the Blue Exit. Weather: ${nodeData.weather}.`, type: "sys", id: Date.now()}] };
    setMaze(newMaze);
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
       if (maze.unlocks?.length) setExploredLandmarks(prev => [...new Set([...prev, ...maze.unlocks])]);
       if (maze.yieldType === "legend") {
         setAncientCoreFragments(f => f + 3);
         if (maze.name === "Titan Graveyard") setFrostTitanHearts(h => Math.min(5, h + 1));
       } else if (maze.yieldType === "high") setAncientCoreFragments(f => f + 1);
       // FIX: Clear saved maze on completion
       setSavedMazes(prev => { const np = {...prev}; delete np[maze.name]; return np; });
       setMazeVictory(true);
       setMaze(nextMaze);
       if (window.SFX?.reward) window.SFX.reward();
       return;
    } else if (cell === 2) { 
       newGrid[ny][nx] = 0;
       const arts = maze.yieldType === "legend" ? 3 : maze.yieldType === "high" ? 2 : 1; const mats = maze.yieldType === "legend" ? 25 : maze.yieldType === "high" ? 15 : 8;
       const ironFound = Math.random() < 0.5 ? Math.floor(Math.random() * 8) + 3 : 0;
       const manaFound = (maze.yieldType === "high" || maze.yieldType === "legend") && Math.random() < 0.45 ? Math.floor(Math.random() * 3) + 1 : 0;
       const fragmentFound = (maze.yieldType === "legend" || Math.random() < 0.2) ? 1 : 0;
       setArtifacts(a => a + arts); setMaterials(m => m + mats); 
       if(ironFound) setIron(i=>i+ironFound); if(manaFound) setManaCrystals(m=>m+manaFound);
       if(fragmentFound) setAncientCoreFragments(f=>f+fragmentFound);
       addMazeLog(`Looted ${arts} Art, ${mats} Mat${fragmentFound ? ", 1 Core Fragment" : ""}!`, "reward");
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
      // FIX: When fleeing combat in maze, return to maze (state already saved in maze state)
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
                   <Btn variant="primary" style={{ padding: "15px 30px", fontSize: 16 }} onClick={() => { playClick(); if(artifacts >= 15 && manaCrystals >= 5) { setArtifacts(a=>a-15); setManaCrystals(m=>m-5); setCapitalPhase(1); } else notify("Requires 15 Artifacts & 5 Mana Crystals", "#e85c3a"); }}>Breach the Aegis Gate (-15 Art, -5 Mana)</Btn>
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

  if (phase === "ending_choice") {
    const endings = {
      escape: { title: "Escape the Planet", desc: "The restored World Core becomes a launch spine. Your people leave the frozen world behind, carrying a seed of Aleria to the stars." },
      remain: { title: "Remain and Build Civilization", desc: "The Core warms a permanent valley. Roads, schools, gardens, and law rise where only emergency shelters once stood." },
      ruler: { title: "Become Ruler of the Wasteland", desc: "You bind the storm to your command. The city survives, the giants kneel, and every distant fire learns your banner." }
    };
    const selected = worldCore.ending ? endings[worldCore.ending] : null;
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #102335 0%, #05080f 100%)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="frost-panel" style={{ maxWidth: 900, padding: 40, borderRadius: 16, textAlign: "center", borderColor: "#87cefa" }}>
          {!selected ? (
            <>
              <h1 style={{ color: "#87cefa", letterSpacing: 5, margin: "0 0 10px" }}>WORLD CORE RESTORED</h1>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 30 }}>The planet waits for your final command.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 15 }}>
                <Btn variant="primary" onClick={() => { playClick(); setWorldCore(w=>({...w, ending:"escape"})); }}>Escape the Planet</Btn>
                <Btn variant="success" onClick={() => { playClick(); setWorldCore(w=>({...w, ending:"remain"})); }}>Build Civilization</Btn>
                <Btn variant="danger" onClick={() => { playClick(); setWorldCore(w=>({...w, ending:"ruler"})); }}>Rule the Wasteland</Btn>
              </div>
            </>
          ) : (
            <>
              <Confetti />
              <h1 style={{ color: worldCore.ending === "ruler" ? "#e85c3a" : worldCore.ending === "remain" ? "#3ec995" : "#87cefa", letterSpacing: 4, margin: "0 0 16px" }}>{selected.title}</h1>
              <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 18, lineHeight: 1.7, maxWidth: 680, margin: "0 auto 28px" }}>{selected.desc}</p>
              <Btn variant="gold" onClick={() => { playClick(); localStorage.removeItem("aleria_elf_save"); setScreen("main_menu"); }}>Return to Menu</Btn>
            </>
          )}
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
                <Btn variant="danger" onClick={() => { playClick(); addLog("Fled the ruins early. (No Clear Bonus)", "dmg"); 
                  // FIX: Save maze state so re-entering keeps same enemies/loot (no exploit)
                  if (maze && !clearedNodes.includes(maze.name)) {
                    setSavedMazes(prev => ({...prev, [maze.name]: maze}));
                  }
                  setLeftTab("map"); setPhase("outpost"); }}>Flee Now</Btn>
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
                     playClick(); setGiantPhase(2); setArtifacts(a => a + 25); setFrostTitanHearts(h => Math.min(5, h + 1)); setAncientCoreFragments(f => f + 4); changeMorale(12, "The city survived a major titan kill."); addLog("Retrieved Archon Tech Core, 25 Artifacts, 4 Core Fragments, and 1 Frost Titan Heart.", "reward");
                     setGiantVictory(false); setGiantCombat(null); setLeftTab("adv_tech"); setPhase("outpost");
                 }}>Salvage Archon Core & Return</Btn>
              </div>
           </div>
        )}

        <div style={{ width: "100%", maxWidth: 900, transform: "translateZ(50px)", transformStyle: "preserve-3d", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="frost-panel giant-shake" style={{ padding: 40, textAlign: "center", borderColor: "#e85c3a", background: "rgba(232,92,58,0.15)", boxShadow: "0 20px 50px rgba(232,92,58,0.2)", transform: "translateZ(30px)" }}>
            <h1 style={{ color: "#e85c3a", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "8px", textShadow: "0 0 30px #e85c3a", fontSize: 36 }}>FROST GIANTS</h1>
            <Bar val={Math.max(0, giantCombat.hp)} max={giantCombat.maxHp} color="#e85c3a" h={16} />
            <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 15, fontSize: 18, fontWeight: "bold" }}>HP: {Math.max(0, giantCombat.hp)} / {giantCombat.maxHp} | Phase {giantCombat.phase || 1}</p>
          </div>
          <div className="frost-panel" style={{ padding: 20, borderColor: "#e85c3a", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "center" }}>
            <div className={`giant-target-stage ${bossAnim === "hit" ? "giant-hit-flash" : bossAnim === "miss" ? "giant-miss-dodge" : ""}`} style={{ position: "relative", height: 360, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "absolute", width: 180, height: 300, borderRadius: "48% 48% 22% 22%", background: "linear-gradient(180deg, #a6d8ff, #4d6d85 45%, #243443)", boxShadow: "0 0 60px rgba(135,206,250,0.35), inset 0 0 30px rgba(0,0,0,0.45)" }} />
              <div style={{ position: "absolute", top: 10, width: 92, height: 82, borderRadius: "45%", background: "#cbefff", boxShadow: "0 0 30px rgba(255,255,255,0.45)" }} />
              <div style={{ position: "absolute", left: "calc(50% - 160px)", top: 115, width: 90, height: 38, borderRadius: 22, background: "#7899ad", transform: "rotate(-25deg)" }} />
              <div style={{ position: "absolute", right: "calc(50% - 160px)", top: 115, width: 90, height: 38, borderRadius: 22, background: "#7899ad", transform: "rotate(25deg)" }} />
              <div style={{ position: "absolute", left: "calc(50% - 82px)", bottom: 22, width: 52, height: 118, borderRadius: 24, background: "#405464" }} />
              <div style={{ position: "absolute", right: "calc(50% - 82px)", bottom: 22, width: 52, height: 118, borderRadius: 24, background: "#405464" }} />
              {bossTargets.map(t => {
                const pos = {
                  head: { top: 28, left: "50%" },
                  chest: { top: 142, left: "50%" },
                  leftArm: { top: 125, left: "31%" },
                  rightArm: { top: 125, left: "69%" },
                  leftLeg: { top: 268, left: "43%" },
                  rightLeg: { top: 268, left: "57%" }
                }[t.id];
                return <button key={t.id} title={`${t.label}: ${t.base}% base. ${t.effect}`} onClick={() => fireAtGiantTarget(t)} style={{ position: "absolute", ...pos, transform: "translate(-50%, -50%)", width: 78, height: 38, borderRadius: 8, border: "1px solid rgba(232,92,58,0.65)", background: "rgba(232,92,58,0.14)", color: "#fff", cursor: qte ? "not-allowed" : "crosshair", fontSize: 11, fontWeight: 800 }}>{t.label}</button>;
              })}
            </div>
            <div>
              <h3 style={{ color: "#ffd966", margin: "0 0 10px" }}>Target Zones</h3>
              <p style={{ fontSize: 12, marginBottom: 12 }}>finalChance = base + weaponAccuracy + skillBonus + moraleBonus - bossEvasion.</p>
              {bossTargets.map(t => <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}><span>{t.label}</span><span style={{ color: "#87cefa" }}>{t.base}% base</span></div>)}
            </div>
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
      
      {/* ELF TUTORIAL BUTTON */}
      <div 
        onClick={() => { playClick(); setShowTutorial(true); }}
        style={{ position: "fixed", bottom: 20, left: 20, width: 45, height: 45, borderRadius: "50%", background: "rgba(135,206,250,0.1)", border: "2px solid #87cefa", color: "#87cefa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "bold", fontFamily: "serif", cursor: "pointer", zIndex: 900, boxShadow: "0 0 15px rgba(135,206,250,0.3)" }}
      >
        i
      </div>

      {showTutorial && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="frost-panel" style={{ maxWidth: 500, padding: 30, position: "relative", borderColor: "#87cefa", boxShadow: "0 0 30px rgba(135,206,250,0.2)" }}>
            <button onClick={() => { playClick(); setShowTutorial(false); }} style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", color: "#e85c3a", fontSize: 20, cursor: "pointer" }}>✕</button>
            <h2 style={{ color: "#87cefa", margin: "0 0 20px", letterSpacing: "2px", textTransform: "uppercase" }}>Survival Guide</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 15, lineHeight: 1.6 }}><strong>Generator:</strong> Burns Coal automatically. Keep it fueled or you freeze to death.</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 15, lineHeight: 1.6 }}><strong>Food:</strong> Gathered by assigned Hunters and Farmers. Raw meat and veg are combined automatically to feed citizens.</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 15, lineHeight: 1.6 }}><strong>Research:</strong> Use Artifacts to unlock crucial technology in the right panel.</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 15, lineHeight: 1.6 }}><strong>Exploration:</strong> Costs Energy and Rations. The deeper you go, the better the loot, but the greater the danger.</p>
          </div>
        </div>
      )}
      
      {/* BACKGROUND EFFECTS */}
      <div className="snowstorm-container" style={{ pointerEvents: "none", opacity: 0.3, zIndex: 0 }}><div className="snow-layer" /></div>

      {/* TUTORIAL "i" BUTTON */}
      <button
        data-testid="elf-tutorial-btn"
        onClick={() => { playClick(); setShowTutorial(true); }}
        style={{ position: "fixed", bottom: 20, left: 20, zIndex: 999, width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(135,206,250,0.8)", background: "rgba(10,15,25,0.9)", color: "#87cefa", fontSize: 20, fontWeight: 900, fontFamily: "serif", cursor: "pointer", boxShadow: "0 0 16px rgba(135,206,250,0.4)", transition: "all 0.2s" }}
        onMouseOver={(e)=>{ e.currentTarget.style.transform="scale(1.1)"; e.currentTarget.style.boxShadow="0 0 26px rgba(135,206,250,0.7)"; }}
        onMouseOut={(e)=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 0 16px rgba(135,206,250,0.4)"; }}
        title="Tutorial"
      >i</button>

      {/* RETURN TO MAIN MENU BUTTON */}
      <button
        data-testid="elf-return-menu-btn"
        onClick={() => { playClick(); if(window.confirm("Return to Main Menu? Your progress is auto-saved.")) setScreen("main_menu"); }}
        style={{ position: "fixed", top: 20, right: 20, zIndex: 998, padding: "8px 16px", borderRadius: 20, border: "1px solid rgba(135,206,250,0.4)", background: "rgba(10,15,25,0.8)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
        onMouseOver={(e)=>{ e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="#87cefa"; }}
        onMouseOut={(e)=>{ e.currentTarget.style.color="rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor="rgba(135,206,250,0.4)"; }}
      >☰ Menu</button>

      {/* TUTORIAL MODAL */}
      {showTutorial && (
        <div className="frost-event-overlay" onClick={() => setShowTutorial(false)}>
          <div className="frost-panel" onClick={(e)=>e.stopPropagation()} style={{ width: "92%", maxWidth: 640, background: "rgba(8, 12, 22, 0.98)", maxHeight: "85vh", overflowY: "auto", padding: 30, position: "relative", borderRadius: 14, border: "1px solid #87cefa", boxShadow: "0 0 40px rgba(135,206,250,0.3)" }}>
            <button data-testid="elf-tutorial-close" onClick={() => { playClick(); setShowTutorial(false); }} style={{ position: "absolute", top: 12, right: 18, background: "transparent", color: "#87cefa", border: "none", fontSize: 24, cursor: "pointer" }}>✖</button>
            <h2 style={{ color: "#87cefa", margin: "0 0 8px", letterSpacing: "3px", textTransform: "uppercase" }}>Overseer's Guide</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 18, fontStyle: "italic" }}>The Federation left scant records. Here's what you've pieced together.</p>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, lineHeight: 1.7 }}>
              <h3 style={{ color: "#ffd966", fontSize: 15, marginTop: 8, marginBottom: 8, letterSpacing: 1 }}>RESOURCES</h3>
              <p><b style={{color:"#ff8c00"}}>Coal</b> — burns in the Central Core to keep <b>Heat</b> up. If the Core goes cold, you freeze.</p>
              <p><b style={{color:"#87cefa"}}>Materials</b> — used to construct buildings and craft equipment.</p>
              <p><b style={{color:"#a8a8a8"}}>Iron</b> — for advanced metallurgy crafts: pickaxes, armor, rifles.</p>
              <p><b style={{color:"#ffd966"}}>Artifacts</b> — unlock research. <b>15 Artifacts</b> + <b>5 Mana</b> are needed to breach the Federation Capital.</p>
              <p><b style={{color:"#a89df0"}}>Mana Crystals</b> — found in glowing ruin relics and the Mana Siphon (after research). Required for high-end research and the Capital.</p>
              <p><b style={{color:"#e85c3a"}}>Meat / Vegetables</b> — used for crafting rations and recipes.</p>

              <h3 style={{ color: "#ffd966", fontSize: 15, marginTop: 14, marginBottom: 8, letterSpacing: 1 }}>BUILDINGS</h3>
              <p><b>Central Core</b> — keeps the complex warm. Stoke it manually or assign citizens.</p>
              <p><b>Greenhouses</b> — produce food/vegetables.</p>
              <p><b>Hunting Lodges</b> — produce food/meat. Hunters also help defend against bandits.</p>
              <p><b>Coal Mines</b> — produce coal. Lower-level mines have cave-in risk.</p>

              <h3 style={{ color: "#ffd966", fontSize: 15, marginTop: 14, marginBottom: 8, letterSpacing: 1 }}>RESEARCH</h3>
              <p>Each research costs <b>Artifacts</b>. <b>Settlement Foundation</b> unlocks construction and population mechanics. <b>Metallurgy → Advanced Armory</b> leads to the Mana Rifle. <b>Skyspine Harness</b> appears after the Giants arrive and is needed to fight back.</p>

              <h3 style={{ color: "#ffd966", fontSize: 15, marginTop: 14, marginBottom: 8, letterSpacing: 1 }}>SURVIVAL TIPS</h3>
              <p>• Food consumption doubles every 5 citizens. Build greenhouses before expanding population.</p>
              <p>• Rest to restore Energy (uses food). Eat Rations or use Raw Artifact for emergencies.</p>
              <p>• The Frost Giants arrive when the town has matured. Build the Skyspine Harness early once it unlocks.</p>
              <p>• Civilian disputes, refugees, and bandits will appear over time — choose carefully.</p>
            </div>
          </div>
        </div>
      )}

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
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 150px", alignItems: "center", padding: "12px 15px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `4px solid ${c.job === 'farm' ? '#3ec995' : c.job === 'hunt' ? '#e85c3a' : c.job === 'mine' ? '#87cefa' : c.job === 'heat' ? '#ff8c00' : '#444'}` }}>
                  <div className="citizen-name-age" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div><strong style={{ color: "#fff", fontSize: 15 }}>{c.name}</strong><div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{(c.traits || []).join(", ") || "no traits"} | Rel {c.relationship ?? 50}</div></div>
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
            <p className="frost-event-desc" style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>{activeEvent.desc}</p>
            {!eventReady && (
              <div style={{ marginBottom: 18, fontSize: 11, color: "rgba(255,217,102,0.6)", letterSpacing: 1.5 }}>
                ⌛ Reading... please wait
              </div>
            )}
            <div>
              {activeEvent.choices.map((c, i) => (
                <button key={i} data-testid={`elf-event-choice-${i}`} disabled={!c.req || !eventReady} className={`frost-choice-btn ${c.color === "danger" ? "frost-choice-danger" : ""}`} style={{ width: "100%", marginBottom: 12, padding: 15, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, fontSize: 15, transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: (c.req && eventReady) ? 1 : 0.5, cursor: (c.req && eventReady) ? "pointer" : "not-allowed" }} onClick={(c.req && eventReady) ? c.action : null}>
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
        .giant-target-stage button:hover { background: rgba(232,92,58,0.85) !important; border-color: #ffb8a8 !important; box-shadow: 0 0 18px rgba(232,92,58,0.8); }
        .giant-hit-flash { animation: giantHitFlash 0.45s ease; }
        .giant-miss-dodge { animation: giantMissDodge 0.45s ease; }
        @keyframes giantHitFlash { 0%,100% { filter: none; } 45% { filter: brightness(1.8) saturate(1.4); } }
        @keyframes giantMissDodge { 0%,100% { transform: translateX(0); } 45% { transform: translateX(28px); } }
      `}</style>

      {/* 3-COLUMN LAYOUT */}
      <div style={{ display: "flex", gap: 20, maxWidth: 1400, margin: "0 auto", alignItems: "flex-start", position: "relative", zIndex: 10 }}>
        
        {/* COLUMN 1: STICKY LEFT SIDEBAR */}
        <div className="frost-panel no-scrollbar" style={{ width: 260, position: "sticky", top: 20, padding: 20, borderRadius: 12, display: "flex", flexDirection: "column", gap: 20, maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
           <div>
  <h2 onClick={() => { playClick(); handleCheat(); }} title="Enter Cheat Code" style={{ margin: 0, fontSize: 20, color: "#87cefa", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer" }}>{megaCity ? "Aleria Mega-City" : (tech.settlement ? "Gorthon Settlement" : "Frozen Outpost")}</h2>
  <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(135, 206, 250, 0.6)" }}>Core Lvl {coreLevel} • Pop: {population}/{maxPopulation}</p>
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
              <div className={morale < 20 ? "blink-alarm" : ""} style={{ padding: 5, borderRadius: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: morale >= 70 ? "#3ec995" : morale >= 40 ? "#ffd966" : "#e85c3a", fontWeight: "bold", marginBottom: 3 }}><span>MORALE</span><span>{Math.floor(morale)}% - {moraleBand}</span></div>
                <Bar val={morale} max={100} color={morale >= 70 ? "#3ec995" : morale >= 40 ? "#ffd966" : "#e85c3a"} h={10} />
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
              <Tag color="#87cefa">Frag: {ancientCoreFragments}</Tag>
              <Tag color="#e85c3a">Heart: {frostTitanHearts}</Tag>
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
                 {tech.settlement && <Btn variant={leftTab === "core" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("core"); }} style={{ flex: 1 }}>World Core</Btn>}
                 {giantPhase >= 2 && <Btn variant={leftTab === "adv_tech" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("adv_tech"); }} style={{ flex: 1 }}>Advanced Tech</Btn>}
                 <Btn variant={leftTab === "meta" ? "primary" : "ghost"} onClick={() => { playClick(); setLeftTab("meta"); }} style={{ flex: 1 }}>Echoes</Btn>
               </div>

               {leftTab === "core" && (
                 <div className="frost-panel" style={{ padding: 25, borderRadius: 12 }}>
                   <h3 style={{ color: "#87cefa", margin: "0 0 12px", fontSize: 22 }}>World Core Restoration</h3>
                   <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 18 }}>Act 4 requires 25 Ancient Core Fragments, 100 Mana Crystals, 5 Frost Titan Hearts, 50 Population, and 70 Morale.</p>
                   <div style={{ display: "grid", gap: 12 }}>
                     {OBJECTIVES.map(o => <div key={o.id}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#fff", marginBottom: 4 }}><span>{o.title}</span><span>{Math.min(o.progress, o.max)} / {o.max}</span></div><Bar val={Math.min(o.progress, o.max)} max={o.max} color={o.progress >= o.max ? "#3ec995" : "#87cefa"} h={8} /></div>)}
                   </div>
                   <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
                     <Btn variant="primary" disabled={worldCore.repaired || ancientCoreFragments < 25 || manaCrystals < 100 || frostTitanHearts < 5 || population < 50 || morale < 70} onClick={() => { playClick(); setAncientCoreFragments(f=>f-25); setManaCrystals(m=>m-100); setFrostTitanHearts(h=>h-5); setWorldCore(w=>({...w, repaired:true})); changeMorale(15, "The World Core was restored."); }}>Restore Core</Btn>
                     {worldCore.repaired && !worldCore.activated && <Btn variant="gold" onClick={() => { playClick(); setWorldCore(w=>({...w, activated:true})); setPhase("ending_choice"); }}>Activate Endgame</Btn>}
                   </div>
                 </div>
               )}

               {leftTab === "meta" && (
                 <div className="frost-panel" style={{ padding: 25, borderRadius: 12 }}>
                   <h3 style={{ color: "#ffd966", margin: "0 0 8px", fontSize: 22 }}>Ancient Echoes</h3>
                   <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{isMetaDisabled ? "Meta progression is disabled in Hard and Insanity." : `Echoes available: ${ancientEchoes}. Earned after death, spent across future runs.`}</p>
                   <div style={{ display: "grid", gap: 10 }}>
                     {META_UPGRADES.map(u => <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,217,102,0.25)", borderRadius: 8 }}>
                       <div><strong style={{ color: metaUpgrades[u.id] ? "#3ec995" : "#ffd966" }}>{u.name}</strong><p style={{ margin: 0, fontSize: 11 }}>{u.desc}</p></div>
                       {metaUpgrades[u.id] ? <Tag color="#3ec995">Unlocked</Tag> : <Btn small variant="gold" disabled={isMetaDisabled || ancientEchoes < u.cost} onClick={() => buyMetaUpgrade(u)}>{u.cost} Echoes</Btn>}
                     </div>)}
                   </div>
                 </div>
               )}

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
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>Fog of war hides distant regions until landmarks are cleared. Travel costs rations and time.</p>
                    <div style={{ display: "grid", gap: 10 }}>
                      {EXPLORATION_NODES.map(n => {
                         const isCleared = clearedNodes.includes(n.name);
                         const isKnown = exploredLandmarks.includes(n.name);
                         return (
                           <div key={n.name} style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${isCleared ? "rgba(62,201,149,0.5)" : isKnown ? "rgba(135,206,250,0.3)" : "rgba(255,255,255,0.08)"}`, padding: 15, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isCleared ? 0.5 : isKnown ? 1 : 0.45 }}>
                             <div><h4 style={{ margin: 0, color: isCleared ? "#3ec995" : isKnown ? "#fff" : "rgba(255,255,255,0.35)", textDecoration: isCleared ? "line-through" : "none" }}>{isKnown ? n.name : "Unknown Region"}</h4><p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{isKnown ? `${n.desc} Branches: ${n.branches.join(", ")}. Danger ${Math.round((n.dang + (permanentEffects.danger || 0)) * 100)}%. Cost ${n.travelCost} ration(s), ${n.travelTime} time.` : "Hidden by fog of war."}</p></div>
                             {!isKnown ? <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>FOG</span> : isCleared ? <span style={{ color: "#3ec995", fontWeight: "bold", fontSize: 13, letterSpacing: "1px" }}>CLEARED</span> : <Btn small onClick={() => travelToNode(n)}>Travel</Btn>}
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
<div 
  className="frost-panel" 
  style={{ padding: 20, borderRadius: 12, cursor: "pointer", borderColor: "rgba(135,206,250,0.4)" }} 
  onClick={() => {
    playClick();
    if (energy < 12) return notify("Too exhausted to scavenge.", "#e85c3a");
    applyDecay(8, 12);
    
    // 15% chance to get ambushed
    if (Math.random() < 0.15) {
       triggerEvent("monster");
    } else {
       const matFound = Math.floor(Math.random() * 8) + 5; // 5 to 12 Materials
       const vegFound = Math.floor(Math.random() * 5) + 2; // 2 to 6 Veggies
       
       setMaterials(m => m + matFound);
       setVegetables(v => v + vegFound);
       addLog(`Scavenged the outskirts. Found ${matFound} Materials and ${vegFound} Frozen Veggies.`, "info");
    }
  }}
>
  <h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Scavenge Outskirts</h4>
  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Search the perimeter for scrap metal and frozen roots. (Yields Materials & Veg)</p>
</div>
               {leftTab === "actions" && (
  <>
    {/* NEW PROMINENT CITIZEN MANAGEMENT BANNER */}
    {tech.settlement && (
      <div className="frost-panel" style={{ padding: 20, borderRadius: 12, borderColor: "#a89df0", background: "rgba(168,157,240,0.1)", marginBottom: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ color: "#a89df0", margin: "0 0 5px", fontSize: 20 }}>Citizen Management</h3>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Assign your {population} citizens to jobs to automate survival.</p>
        </div>
        <Btn variant="primary" onClick={() => { playClick(); setShowCitizens(true); }}>Manage Roster</Btn>
      </div>
    )}

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
                     {tech.mining && <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer", borderColor: "rgba(135,206,250,0.4)" }} onClick={startDeepMine}><h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Deep Mine</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Safe, risky, or extreme coal runs.</p></div>}
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer" }} onClick={startRuinsExcavation}><h4 style={{ color: "#87cefa", margin: "0 0 5px" }}>Ancient Ruins</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Choose excavation risk for artifacts and fragments.</p></div>
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer" }} onClick={startHuntingChoice}><h4 style={{ color: "#e85c3a", margin: "0 0 5px" }}>Hunting</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Small prey, large prey, or monster hunt.</p></div>
                     <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: "pointer" }} onClick={doRest}><h4 style={{ color: "#3ec995", margin: "0 0 5px" }}>Rest</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Restores Energy & some HP. (-5 Food)</p></div>
                    <div className="frost-panel" style={{ padding: 20, borderRadius: 12, cursor: rations > 0 ? "pointer" : "not-allowed", borderColor: "rgba(62,201,149,0.4)", opacity: rations > 0 ? 1 : 0.4 }} onClick={rations > 0 ? eatRation : undefined}><h4 style={{ color: "#3ec995", margin: "0 0 5px" }}>Eat Ration ({rations})</h4><p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>+30 HP, +40 Food.</p></div>
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
