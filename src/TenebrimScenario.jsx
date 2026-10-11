import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Btn, Panel, Tag, Confetti } from "./UIComponents";

// Tenebrim addition: standalone scenario data and rules. Tenebrim does not use mana.
const SAVE_KEY = "aleria_tenebrim_save";
const META_KEY = "aleria_tenebrim_meta";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const roll = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

const TECHNIQUES = [
  { id: "endurePain", name: "Endure Pain", description: "Pain penalties reduced by 30%.", unlockCondition: "Survive severe injuries 10 times", effect: "pain_resist", req: { severeInjuries: 10 } },
  { id: "predatorReflex", name: "Predator Reflex", description: "Small slow-motion window in combat.", unlockCondition: "Perfect dodge 50 attacks", effect: "reflex_window", req: { perfectDodges: 50 } },
  { id: "lastStand", name: "Last Stand", description: "+20% damage while below 10% health.", unlockCondition: "Win battles below 10% HP five times", effect: "critical_damage", req: { criticalWins: 5 } },
  { id: "ironStomach", name: "Iron Stomach", description: "Poison and dangerous food penalties are reduced.", unlockCondition: "Eat dangerous food without dying", effect: "poison_resist", req: { dangerousMeals: 3 } },
  { id: "clanHunter", name: "Clan Hunter", description: "Tracking bonus during hunts and travel.", unlockCondition: "Kill 100 creatures", effect: "tracking_bonus", req: { kills: 100 } },
  { id: "unbreakable", name: "Unbreakable", description: "Physical resistance increases after recovered fractures.", unlockCondition: "Recover from broken limbs three times", effect: "physical_resist", req: { brokenRecoveries: 3 } }
];

const INJURIES = [
  { id: "brokenArm", name: "Broken arm", effect: "Reduced attack power." },
  { id: "brokenRibs", name: "Broken ribs", effect: "Higher pain from heavy hits." },
  { id: "concussion", name: "Concussion", effect: "Reduced hit chance and visual distortion." },
  { id: "bleeding", name: "Bleeding", effect: "Health loss over time." },
  { id: "legInjury", name: "Leg injury", effect: "Movement and travel penalties." },
  { id: "internalInjury", name: "Internal injury", effect: "Condition decays faster." }
];

const REGIONS = [
  { id: "bone", name: "Bone Flats", danger: 1, resources: ["bone", "hide", "dry grass"], weather: "Hot white wind", nodes: ["Bleached Trail", "Marrow Den", "Salted Hollow", "Scavenger Ring", "Old Firepit"], boss: "Ivory Gorer" },
  { id: "storm", name: "Red Storm Canyon", danger: 2, resources: ["iron dust", "red crystal", "old weapons"], weather: "Dust storms", nodes: ["Collapsed Camp", "Dust Cave", "Old Battlefield", "Hunter Grave", "Crystal Pit"], boss: "Storm-Maw Ravager" },
  { id: "ash", name: "Ash Fields", danger: 2, resources: ["charcoal", "ash root", "scrap"], weather: "Ash rain", nodes: ["Charred Farm", "Buried Shrine", "Smoke Wallow", "Cinder Creek", "Black Orchard"], boss: "Ash-Hide Matriarch" },
  { id: "deadForest", name: "Dead Forest", danger: 3, resources: ["herbs", "hardwood", "venom sacs"], weather: "Still fog", nodes: ["Hollow Grove", "Snare Paths", "Rot Cave", "Moonless Pond", "Thorn Nest"], boss: "Rootless Ancient" },
  { id: "coast", name: "Black Stone Coast", danger: 3, resources: ["salt", "shell iron", "fish"], weather: "Cold black rain", nodes: ["Tide Graves", "Basalt Shelf", "Wrecked Barge", "Salt Cave", "Siren Rocks"], boss: "Basalt Leviathan" },
  { id: "ruins", name: "Broken Clan Ruins", danger: 4, resources: ["relics", "stone", "medicine"], weather: "Unsettled echoes", nodes: ["Oath Hall", "Collapsed Longhouse", "Ancestor Pit", "Banner Field", "Hidden Granary"], boss: "Oathbreaker Chief" },
  { id: "whisper", name: "Whispering Valley", danger: 4, resources: ["rare herbs", "spirit stones", "tracks"], weather: "Voices in mist", nodes: ["Echo Pass", "Silent Brook", "Watcher Cairn", "Veil Camp", "No-Sound Cave"], boss: "The Whispering Mourak" },
  { id: "monarch", name: "Ruined Monarch Territory", danger: 5, resources: ["relics", "royal steel", "clan banners"], weather: "Mana pressure", nodes: ["Broken Throne", "Royal Hunt Grounds", "Crown Bridge", "Siege Fields", "Monarch Tomb"], boss: "Fallen Grand Monarch" }
];

const SURVIVAL_EVENTS = [
  {
    id: "dustStorm",
    title: "Dust Storm",
    description: "The red wall rises over the land. Mana lamps would cut through it. You have cloth, instinct, and stubborn lungs.",
    choices: [
      { label: "Hide", result: "lose time, recover condition", apply: s => ({ condition: 6, stamina: 8, hunger: -5, log: "You bury yourself behind stone until the storm passes." }) },
      { label: "Push forward", result: "resource gain, small injury chance", apply: s => ({ materials: roll(4, 9), condition: -8, injuryChance: 0.18, log: "You force a path through the storm and salvage buried scrap." }) },
      { label: "Follow tracks", result: "rare loot chance or danger encounter", apply: s => Math.random() < 0.55 ? ({ relics: 1, condition: -10, log: "The tracks lead to a half-buried clan marker." }) : ({ encounter: true, condition: -6, log: "The tracks were fresh. Too fresh." }) }
    ]
  },
  {
    id: "traveler",
    title: "Starving Traveler",
    description: "A half-dead stranger asks for food. Their hand shakes around a broken spear.",
    choices: [
      { label: "Give food", result: "+Honor, -Food", apply: s => ({ food: -12, honor: 5, log: "You leave food and a warning about the next valley." }) },
      { label: "Ignore", result: "No immediate effect", apply: s => ({ log: "You keep walking. Menfor remembers silence too." }) },
      { label: "Recruit", result: "+Population, higher food consumption", apply: s => ({ population: 1, honor: 2, legacy: 1, food: -8, log: "They join your fire and owe you their breath." }) }
    ]
  },
  {
    id: "aid",
    title: "A Clan Requests Aid",
    description: "A small clan sends a runner. Their hunters have not returned.",
    choices: [
      { label: "Help", result: "+Honor, possible battle", apply: s => ({ honor: 8, strength: 2, encounterChance: 0.4, log: "You answer the call without asking price." }) },
      { label: "Demand payment", result: "+Resources", apply: s => ({ materials: 14, honor: -2, log: "They pay in tools and resentment." }) },
      { label: "Ignore", result: "Possible future consequences", apply: s => ({ honor: -5, legacy: -1, log: "Their messenger stops looking at you as a person." }) }
    ]
  },
  {
    id: "challenge",
    title: "A Clan Challenges Your Leadership",
    description: "A rival leader names you wanderer, not monarch. Their warriors wait to see whether you answer.",
    choices: [
      { label: "Fight leader", result: "+Strength, injury risk", apply: s => ({ strength: 8, condition: -8, injuryChance: 0.25, log: "The duel is ugly, direct, and remembered." }) },
      { label: "Negotiate", result: "+Honor, slower legacy", apply: s => ({ honor: 5, legacy: 2, log: "You make room at the fire before blades come out." }) },
      { label: "Accept alliance", result: "+Population, +Legacy", apply: s => ({ population: 3, legacy: 5, food: -15, log: "Two banners hang over one camp." }) }
    ]
  }
];

const ENEMIES = [
  { name: "Bone Flats Wretch", hp: 55, atk: 9, evasion: 6, reward: 7 },
  { name: "Red Canyon Stalker", hp: 78, atk: 13, evasion: 10, reward: 10 },
  { name: "Ash-Hide Brute", hp: 105, atk: 17, evasion: 5, reward: 14 },
  { name: "Dead Forest Ambusher", hp: 90, atk: 18, evasion: 15, reward: 15 },
  { name: "Clan Ruin Duelist", hp: 130, atk: 22, evasion: 12, reward: 22 },
  { name: "Monarch Remnant", hp: 190, atk: 28, evasion: 14, reward: 38 }
];

const META_UPGRADES = [
  { id: "clanMemory", name: "Clan Memory", cost: 3, desc: "+5 starting food." },
  { id: "hunterTradition", name: "Hunter Tradition", cost: 4, desc: "+5 tracking." },
  { id: "survivalKnowledge", name: "Survival Knowledge", cost: 5, desc: "+10 starting condition." },
  { id: "ancientWarrior", name: "Ancient Warrior Training", cost: 5, desc: "+10 starting stamina." }
];

export default function TenebrimScenario({ setScreen, notify, stats, setStats, diff, exportSave }) {
  const logRef = useRef(null);
  const [phase, setPhase] = useState("map");
  const [tab, setTab] = useState("map");
  const [day, setDay] = useState(1);
  const [health, setHealth] = useState(stats?.hp || 125);
  const [maxHealth, setMaxHealth] = useState(stats?.maxHp || 125);
  const [stamina, setStamina] = useState(90);
  const [maxStamina, setMaxStamina] = useState(90);
  // Tenebrim addition: Condition replaces mana as the central body-state resource.
  const [condition, setCondition] = useState(100);
  const [pain, setPain] = useState(0);
  const [hunger, setHunger] = useState(70);
  const [resources, setResources] = useState({ food: 20, materials: 12, medicine: 2, relics: 0 });
  const [clan, setClan] = useState({ strength: 0, honor: 0, legacy: 0, population: 1 });
  const [injuries, setInjuries] = useState([]);
  const [unlockedTechniques, setUnlockedTechniques] = useState([]);
  const [counters, setCounters] = useState({ severeInjuries: 0, perfectDodges: 0, criticalWins: 0, dangerousMeals: 0, kills: 0, brokenRecoveries: 0 });
  const [knownRegions, setKnownRegions] = useState(["bone"]);
  const [visitedNodes, setVisitedNodes] = useState({ bone: ["Bleached Trail"] });
  const [currentRegion, setCurrentRegion] = useState("bone");
  const [activeEvent, setActiveEvent] = useState(null);
  const [combat, setCombat] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [legacyTitle, setLegacyTitle] = useState(null);
  const [ending, setEnding] = useState(null);
  const [echoes, setEchoes] = useState(0);
  const [metaUpgrades, setMetaUpgrades] = useState({});
  const isMetaDisabled = diff?.id === "hard" || diff?.id === "insanity";

  const learned = useMemo(() => TECHNIQUES.filter(t => unlockedTechniques.includes(t.id)), [unlockedTechniques]);
  const current = REGIONS.find(r => r.id === currentRegion) || REGIONS[0];
  const conditionBand = condition >= 90 ? "Peak" : condition >= 70 ? "Stable" : condition >= 40 ? "Worn" : condition >= 20 ? "Damaged" : "Collapsing";
  const conditionBonus = condition >= 90 ? 5 : condition >= 70 ? 0 : condition >= 40 ? -4 : condition >= 20 ? -10 : -18;
  const painPenalty = Math.floor((pain * (unlockedTechniques.includes("endurePain") ? 0.7 : 1)) / 10);
  const trackingBonus = unlockedTechniques.includes("clanHunter") ? 8 : 0;

  const addLog = (msg, type = "info") => setCombatLog(prev => [...prev.slice(-60), { msg, type, id: Date.now() + Math.random() }]);
  const patchResources = patch => setResources(r => ({ ...r, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, Math.max(0, (r[k] || 0) + v)])) }));
  const patchClan = patch => setClan(c => ({ ...c, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, Math.max(k === "honor" || k === "legacy" ? -100 : 0, (c[k] || 0) + v)])) }));
  const hasTechnique = id => unlockedTechniques.includes(id);

  useEffect(() => {
    try {
      const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
      setEchoes(meta.echoes || 0);
      setMetaUpgrades(meta.upgrades || {});
      if (!isMetaDisabled) {
        if (meta.upgrades?.clanMemory) patchResources({ food: 5 });
        if (meta.upgrades?.survivalKnowledge) setCondition(c => clamp(c + 10));
        if (meta.upgrades?.ancientWarrior) {
          setMaxStamina(s => s + 10);
          setStamina(s => s + 10);
        }
      }
    } catch (e) {}
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      if (!saved || !saved.day) return;
      setPhase(saved.phase || "map"); setTab(saved.tab || "map"); setDay(saved.day || 1);
      setHealth(saved.health ?? 125); setMaxHealth(saved.maxHealth ?? 125); setStamina(saved.stamina ?? 90); setMaxStamina(saved.maxStamina ?? 90);
      setCondition(saved.condition ?? 100); setPain(saved.pain ?? 0); setHunger(saved.hunger ?? 70);
      setResources(saved.resources || { food: 20, materials: 12, medicine: 2, relics: 0 });
      setClan(saved.clan || { strength: 0, honor: 0, legacy: 0, population: 1 });
      setInjuries(saved.injuries || []); setUnlockedTechniques(saved.unlockedTechniques || []);
      setCounters(saved.counters || { severeInjuries: 0, perfectDodges: 0, criticalWins: 0, dangerousMeals: 0, kills: 0, brokenRecoveries: 0 });
      setKnownRegions(saved.knownRegions || ["bone"]); setVisitedNodes(saved.visitedNodes || { bone: ["Bleached Trail"] });
      setCurrentRegion(saved.currentRegion || "bone"); setCombatLog(saved.combatLog || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (phase === "dead" || phase === "ending") return;
    const data = { phase, tab, day, health, maxHealth, stamina, maxStamina, condition, pain, hunger, resources, clan, injuries, unlockedTechniques, counters, knownRegions, visitedNodes, currentRegion, combatLog };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    setStats?.(s => ({ ...s, hp: health, maxHp: maxHealth, mp: 0, maxMp: 0, stamina, maxStamina }));
  }, [phase, tab, day, health, maxHealth, stamina, maxStamina, condition, pain, hunger, resources, clan, injuries, unlockedTechniques, counters, knownRegions, visitedNodes, currentRegion, combatLog]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [combatLog]);

  useEffect(() => {
    setUnlockedTechniques(prev => {
      const next = [...prev];
      TECHNIQUES.forEach(t => {
        const key = Object.keys(t.req)[0];
        if (!next.includes(t.id) && (counters[key] || 0) >= t.req[key]) {
          next.push(t.id);
          notify?.(`Technique unlocked: ${t.name}`, "#e0a523");
          addLog(`Technique unlocked: ${t.name}.`, "reward");
        }
      });
      return next;
    });
  }, [counters]);

  useEffect(() => {
    if (!injuries.includes("bleeding") || phase === "dead") return;
    const t = setInterval(() => {
      setHealth(h => {
        const next = h - 3;
        if (next <= 0) handleDeath("Blood loss ended the journey.");
        return Math.max(0, next);
      });
      setCondition(c => clamp(c - 2));
    }, 5000);
    return () => clearInterval(t);
  }, [injuries, phase]);

  function addInjury(forcedId) {
    const injury = INJURIES.find(i => i.id === forcedId) || INJURIES[Math.floor(Math.random() * INJURIES.length)];
    setInjuries(prev => prev.includes(injury.id) ? prev : [...prev, injury.id]);
    setPain(p => clamp(p + 16));
    setCondition(c => clamp(c - 12));
    setCounters(c => ({ ...c, severeInjuries: c.severeInjuries + 1, brokenRecoveries: c.brokenRecoveries + (injury.id === "brokenArm" || injury.id === "legInjury" ? 1 : 0) }));
    addLog(`${injury.name}: ${injury.effect}`, "dmg");
  }

  function applyOutcome(outcome) {
    if (outcome.food) patchResources({ food: outcome.food });
    if (outcome.materials) patchResources({ materials: outcome.materials });
    if (outcome.medicine) patchResources({ medicine: outcome.medicine });
    if (outcome.relics) patchResources({ relics: outcome.relics });
    if (outcome.condition) setCondition(c => clamp(c + outcome.condition));
    if (outcome.stamina) setStamina(s => clamp(s + outcome.stamina, 0, maxStamina));
    if (outcome.hunger) setHunger(h => clamp(h + outcome.hunger));
    if (outcome.strength || outcome.honor || outcome.legacy || outcome.population) patchClan({ strength: outcome.strength || 0, honor: outcome.honor || 0, legacy: outcome.legacy || 0, population: outcome.population || 0 });
    if (outcome.log) addLog(outcome.log, outcome.condition < 0 ? "dmg" : "info");
    if (outcome.injuryChance && Math.random() < outcome.injuryChance) addInjury();
    if (outcome.encounter || (outcome.encounterChance && Math.random() < outcome.encounterChance)) startCombat(current.danger);
  }

  function advanceDay(cost = 1) {
    setDay(d => d + cost);
    setHunger(h => clamp(h - 7 * cost - Math.max(0, clan.population - 1)));
    setStamina(s => clamp(s + (condition < 70 ? 10 : 18), 0, maxStamina));
    if (hunger < 20) setCondition(c => clamp(c - 6));
    if (injuries.includes("internalInjury")) setCondition(c => clamp(c - 3));
  }

  function travel(regionId) {
    const region = REGIONS.find(r => r.id === regionId);
    if (!region) return;
    const travelCost = 6 + region.danger * 4 + (injuries.includes("legInjury") ? 8 : 0);
    if (stamina < travelCost) return notify?.("Too exhausted to travel.", "#e85c3a");
    setCurrentRegion(region.id);
    setKnownRegions(prev => prev.includes(region.id) ? prev : [...prev, region.id]);
    setStamina(s => clamp(s - travelCost, 0, maxStamina));
    setCondition(c => clamp(c - region.danger));
    advanceDay(Math.max(1, Math.ceil(region.danger / 2)));
    revealNode(region.id);
    addLog(`Traveled to ${region.name}. ${region.weather} presses against you.`, "sys");
    const eventChance = 0.25 + region.danger * 0.05;
    if (Math.random() < eventChance) setActiveEvent(SURVIVAL_EVENTS[Math.floor(Math.random() * SURVIVAL_EVENTS.length)]);
    else if (Math.random() < 0.18 + region.danger * 0.04) startCombat(region.danger);
  }

  function revealNode(regionId = currentRegion) {
    const region = REGIONS.find(r => r.id === regionId);
    const known = visitedNodes[regionId] || [];
    const hidden = region.nodes.filter(n => !known.includes(n));
    if (hidden.length === 0) return;
    const next = hidden[Math.floor(Math.random() * hidden.length)];
    setVisitedNodes(prev => ({ ...prev, [regionId]: [...(prev[regionId] || []), next] }));
  }

  function riskAction(node, tier) {
    const cfg = {
      safe: { label: "Safe scavenge", reward: [2, 5], risk: 0.05, stamina: 8, condition: -2 },
      deep: { label: "Deep search", reward: [6, 12], risk: 0.22, stamina: 16, condition: -6 },
      forbidden: { label: "Forbidden search", reward: [1, 2], relic: true, risk: 0.42, stamina: 24, condition: -12 }
    }[tier];
    if (stamina < cfg.stamina) return notify?.("Not enough stamina.", "#e85c3a");
    setStamina(s => clamp(s - cfg.stamina, 0, maxStamina));
    setCondition(c => clamp(c + cfg.condition));
    setHunger(h => clamp(h - 4));
    if (cfg.relic) patchResources({ relics: roll(cfg.reward[0], cfg.reward[1]), materials: roll(2, 5) });
    else patchResources({ materials: roll(cfg.reward[0], cfg.reward[1]) });
    patchClan({ legacy: tier === "forbidden" ? 2 : 0 });
    addLog(`${cfg.label} at ${node}.`, "reward");
    if (Math.random() < cfg.risk) {
      if (Math.random() < 0.5) addInjury();
      else startCombat(current.danger + (tier === "forbidden" ? 2 : 0));
    } else if (Math.random() < 0.35) revealNode();
    advanceDay(1);
  }

  function hunt(type) {
    const cfg = {
      small: { name: "Small prey", risk: 0.08, food: [5, 10], stamina: 8, strength: 1 },
      large: { name: "Large prey", risk: 0.25, food: [15, 26], stamina: 18, strength: 3 },
      alpha: { name: "Alpha hunt", risk: 0.48, food: [28, 44], stamina: 30, strength: 8 }
    }[type];
    if (stamina < cfg.stamina) return notify?.("Your body refuses the hunt.", "#e85c3a");
    const success = Math.random() < 0.62 + trackingBonus / 100 + conditionBonus / 100;
    setStamina(s => clamp(s - cfg.stamina, 0, maxStamina));
    setCondition(c => clamp(c - Math.ceil(cfg.stamina / 8)));
    if (success) {
      const foodGain = roll(cfg.food[0], cfg.food[1]);
      patchResources({ food: foodGain });
      patchClan({ strength: cfg.strength });
      setCounters(c => ({ ...c, kills: c.kills + (type === "alpha" ? 3 : 1) }));
      addLog(`${cfg.name} succeeded. +${foodGain} food.`, "reward");
    } else {
      patchClan({ strength: -1 });
      addLog(`${cfg.name} failed. The tracks vanish into hostile land.`, "dmg");
    }
    if (Math.random() < cfg.risk) startCombat(current.danger + (type === "alpha" ? 2 : 0));
    advanceDay(1);
  }

  function rest(kind) {
    const cfg = {
      sleep: { food: -8, hp: 22, stamina: 999, condition: 18, pain: -12, msg: "Sleep pulls you back from the edge." },
      eat: { food: -10, hp: 4, stamina: 8, condition: 8, pain: -2, msg: "Food makes the world less sharp." },
      medicine: { medicine: -1, hp: 12, stamina: 4, condition: 12, pain: -24, msg: "Medicine quiets the body's alarm." },
      campfire: { materials: -4, hp: 8, stamina: 18, condition: 10, pain: -6, msg: "A campfire makes the dark negotiate." },
      dangerousFood: { food: 8, hp: -8, stamina: 4, condition: hasTechnique("ironStomach") ? -2 : -10, pain: 8, msg: "Dangerous food stays down. Mostly." }
    }[kind];
    if (cfg.food && resources.food + cfg.food < 0) return notify?.("Not enough food.", "#e85c3a");
    if (cfg.medicine && resources.medicine + cfg.medicine < 0) return notify?.("No medicine.", "#e85c3a");
    if (cfg.materials && resources.materials + cfg.materials < 0) return notify?.("Not enough materials.", "#e85c3a");
    patchResources({ food: cfg.food || 0, medicine: cfg.medicine || 0, materials: cfg.materials || 0 });
    setHealth(h => clamp(h + cfg.hp, 0, maxHealth));
    setStamina(s => cfg.stamina === 999 ? maxStamina : clamp(s + cfg.stamina, 0, maxStamina));
    setCondition(c => clamp(c + cfg.condition));
    setPain(p => clamp(p + cfg.pain));
    setHunger(h => clamp(h + (kind === "eat" ? 25 : kind === "dangerousFood" ? 16 : 0)));
    if (kind === "dangerousFood") setCounters(c => ({ ...c, dangerousMeals: c.dangerousMeals + 1 }));
    if ((kind === "medicine" || kind === "sleep") && injuries.length && Math.random() < 0.45) {
      const healed = injuries[0];
      setInjuries(prev => prev.slice(1));
      addLog(`Recovered from ${INJURIES.find(i => i.id === healed)?.name || "an injury"}.`, "heal");
    }
    addLog(cfg.msg, "heal");
    advanceDay(kind === "sleep" ? 1 : 0);
  }

  function startCombat(extraDanger = 1, bossName = null) {
    const template = bossName ? { name: bossName, hp: 170 + extraDanger * 25, atk: 22 + extraDanger * 4, evasion: 12, reward: 30 + extraDanger * 4 } : ENEMIES[Math.min(ENEMIES.length - 1, Math.max(0, extraDanger - 1))];
    setCombat({ ...template, hp: template.hp, maxHp: template.hp, staggered: false });
    setPhase("combat");
    addLog(`${template.name} blocks your path.`, "dmg");
    if (window.SFX?.roar) window.SFX.roar();
  }

  function attack(zone) {
    if (!combat) return;
    const zoneData = {
      Head: { chance: 48, mult: 1.45, crit: 0.22 },
      Chest: { chance: 68, mult: 1.0, crit: 0.12 },
      Arms: { chance: 62, mult: 0.82, crit: 0.16 },
      Legs: { chance: 58, mult: 0.9, crit: 0.2 }
    }[zone];
    const weaponBonus = resources.relics > 0 ? 7 : 0;
    const techniqueBonus = hasTechnique("predatorReflex") ? 6 : 0;
    const concussionPenalty = injuries.includes("concussion") ? 12 : 0;
    const finalChance = zoneData.chance + techniqueBonus + conditionBonus + weaponBonus - combat.evasion - painPenalty - concussionPenalty;
    const cost = zone === "Head" ? 18 : zone === "Chest" ? 12 : 10;
    if (stamina < cost) return notify?.("Not enough stamina.", "#e85c3a");
    setStamina(s => clamp(s - cost, 0, maxStamina));
    const hit = Math.random() * 100 < finalChance;
    if (hit) {
      let damage = Math.floor((roll(12, 22) + clan.strength * 0.15 + (condition >= 90 ? 2 : 0)) * zoneData.mult);
      if (injuries.includes("brokenArm")) damage = Math.floor(damage * 0.72);
      if (hasTechnique("lastStand") && health <= maxHealth * 0.1) damage = Math.floor(damage * 1.2);
      const critical = Math.random() < zoneData.crit;
      if (critical) damage = Math.floor(damage * 1.45);
      setCombat(e => ({ ...e, hp: Math.max(0, e.hp - damage), staggered: critical }));
      addLog(`${zone} hit for ${damage}${critical ? " and staggered the enemy" : ""}.`, "reward");
      if (window.SFX?.hit) window.SFX.hit();
      setTimeout(() => {
        setCombat(e => {
          if (!e || e.hp > 0) return e;
          finishCombat(e);
          return null;
        });
      }, 120);
    } else {
      addLog(`You miss the ${zone.toLowerCase()}.`, "dmg");
    }
    setTimeout(() => {
      setCombat(e => {
        if (!e || e.hp <= 0) return e;
        enemyTurn(e);
        return e;
      });
    }, 300);
  }

  function enemyTurn(enemy) {
    if (enemy.staggered) {
      addLog(`${enemy.name} staggers and loses its attack.`, "heal");
      setCombat(e => e ? ({ ...e, staggered: false }) : e);
      return;
    }
    const dodgeChance = 8 + (condition >= 90 ? 5 : 0) + (hasTechnique("predatorReflex") ? 7 : 0) - painPenalty;
    if (Math.random() * 100 < dodgeChance) {
      setCounters(c => ({ ...c, perfectDodges: c.perfectDodges + 1 }));
      addLog("A perfect dodge. The world narrows for a breath.", "heal");
      return;
    }
    const resist = hasTechnique("unbreakable") ? 4 : 0;
    const dmg = Math.max(1, roll(enemy.atk - 4, enemy.atk + 5) - resist);
    setHealth(h => {
      const next = h - dmg;
      if (next <= 0) handleDeath(`Killed by ${enemy.name}.`);
      return Math.max(0, next);
    });
    setPain(p => clamp(p + Math.ceil(dmg / 3)));
    setCondition(c => clamp(c - Math.ceil(dmg / 8)));
    addLog(`${enemy.name} hits you for ${dmg}.`, "dmg");
    if (Math.random() < 0.18 + enemy.atk / 220) addInjury();
  }

  function finishCombat(enemy) {
    const critical = health <= maxHealth * 0.1;
    patchResources({ food: Math.ceil(enemy.reward / 3), materials: enemy.reward });
    patchClan({ strength: Math.ceil(enemy.reward / 3), legacy: enemy.name.includes("Monarch") || enemy.name.includes("Mourak") ? 8 : 1 });
    setCounters(c => ({ ...c, kills: c.kills + 1, criticalWins: c.criticalWins + (critical ? 1 : 0) }));
    setCondition(c => clamp(c + 4));
    setPhase("map");
    addLog(`${enemy.name} falls. The kill feeds camp and reputation.`, "reward");
    if (window.SFX?.victory) window.SFX.victory();
  }

  function handleDeath(reason) {
    const title = calculateLegacyTitle();
    setLegacyTitle({ title, reason });
    const gained = isMetaDisabled ? 0 : Math.max(1, Math.floor((clan.strength + Math.max(0, clan.honor) + Math.max(0, clan.legacy)) / 30));
    if (gained > 0) {
      const next = echoes + gained;
      setEchoes(next);
      localStorage.setItem(META_KEY, JSON.stringify({ echoes: next, upgrades: metaUpgrades }));
    }
    setPhase("dead");
  }

  function calculateLegacyTitle() {
    if (clan.strength >= 90 && clan.honor < 20) return "Warlord";
    if (clan.legacy >= 90 && clan.population >= 20) return "Clan Founder";
    if (counters.kills >= 100) return "Monster Slayer";
    if (clan.honor >= 80) return "Guardian";
    if (clan.legacy >= 50) return "Wandering Mourak";
    return "Enduring Wanderer";
  }

  function chooseEvent(choice) {
    const outcome = choice.apply({ condition, stamina, hunger });
    applyOutcome(outcome);
    setActiveEvent(null);
    advanceDay(1);
  }

  function buyMeta(upgrade) {
    if (isMetaDisabled || metaUpgrades[upgrade.id] || echoes < upgrade.cost) return;
    const nextEchoes = echoes - upgrade.cost;
    const nextUpgrades = { ...metaUpgrades, [upgrade.id]: true };
    setEchoes(nextEchoes);
    setMetaUpgrades(nextUpgrades);
    localStorage.setItem(META_KEY, JSON.stringify({ echoes: nextEchoes, upgrades: nextUpgrades }));
    addLog(`Ancestral memory awakened: ${upgrade.name}.`, "reward");
  }

  function triggerEnding(id) {
    const scenes = {
      monarch: "You take the broken throne without mana, without blessing, and without apology. Menfor calls you Grand Monarch because you endured what crowns could not.",
      unite: "Banners gather under shared fire. Not conquered. Not bought. United because the wilds are less cruel when someone keeps watch.",
      clan: "Your clan becomes the strongest in Menfor. Children learn your hunting paths before they learn old prayers.",
      mourak: "You refuse thrones and walls. The land itself carries your name as a warning and a comfort.",
      sacrifice: "You hold the pass while the camps flee. By sunrise, Menfor survives, and your absence becomes law."
    };
    setEnding({ id, scene: scenes[id], title: id === "monarch" ? "Grand Monarch" : id === "unite" ? "Uniter of Menfor" : id === "clan" ? "Strongest Clan" : id === "mourak" ? "Legendary Mourak" : "Guardian Sacrifice" });
    setPhase("ending");
    if (window.SFX?.victory) window.SFX.victory();
  }

  function resetScenario() {
    localStorage.removeItem(SAVE_KEY);
    setPhase("map"); setTab("map"); setDay(1); setHealth(125); setMaxHealth(125); setStamina(90); setMaxStamina(90);
    setCondition(100); setPain(0); setHunger(70); setResources({ food: 20, materials: 12, medicine: 2, relics: 0 });
    setClan({ strength: 0, honor: 0, legacy: 0, population: 1 }); setInjuries([]); setUnlockedTechniques([]);
    setCounters({ severeInjuries: 0, perfectDodges: 0, criticalWins: 0, dangerousMeals: 0, kills: 0, brokenRecoveries: 0 });
    setKnownRegions(["bone"]); setVisitedNodes({ bone: ["Bleached Trail"] }); setCurrentRegion("bone"); setCombatLog([]);
  }

  const statBox = (label, value, max, color) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 11, color }}>{value}/{max}</span>
      </div>
      <Bar val={value} max={max} color={color} h={8} />
    </div>
  );

  if (phase === "dead") {
    return <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#120809,#050303)", color: "#fff", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Panel style={{ maxWidth: 620, borderColor: "#b83a2a", textAlign: "center" }}>
        <Tag color="#b83a2a">Tenebrim Legacy</Tag>
        <h1 style={{ margin: "18px 0 8px", color: "#fff" }}>{legacyTitle?.title}</h1>
        <p style={{ color: "rgba(255,210,190,0.7)", lineHeight: 1.7 }}>{legacyTitle?.reason}</p>
        <p style={{ color: "#e0a523", fontWeight: 800 }}>Your name will be remembered for strength {clan.strength}, honor {clan.honor}, legacy {clan.legacy}.</p>
        {!isMetaDisabled && <Tag color="#e0a523">Ancestral Echoes: {echoes}</Tag>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <Btn variant="danger" onClick={resetScenario}>Begin another endurance</Btn>
          <Btn variant="ghost" onClick={() => setScreen("main_menu")}>Main menu</Btn>
        </div>
      </Panel>
    </div>;
  }

  if (phase === "ending") {
    return <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%,#3a2513,#080504 62%)", color: "#fff", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Confetti />
      <Panel style={{ maxWidth: 720, borderColor: "#e0a523", textAlign: "center", position: "relative", zIndex: 2 }}>
        <Tag color="#e0a523">Ending</Tag>
        <h1 style={{ margin: "18px 0 8px", color: "#ffd966" }}>{ending?.title}</h1>
        <p style={{ color: "rgba(255,235,200,0.78)", lineHeight: 1.8, fontSize: 16 }}>{ending?.scene}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <Btn variant="gold" onClick={() => { exportSave?.(); setScreen("main_menu"); }}>Save legacy</Btn>
          <Btn variant="ghost" onClick={resetScenario}>Start over</Btn>
        </div>
      </Panel>
    </div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#15100c 0%,#090706 48%,#100b12 100%)", color: "#fff", fontFamily: "var(--font-sans)", padding: 20 }}>
      <div style={{ maxWidth: 1260, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <Tag color="#b83a2a">Tenebrim</Tag>
              <Tag color="#e0a523">Endure</Tag>
              <Tag color="#3ec995">Day {day}</Tag>
              <Tag color={condition >= 70 ? "#3ec995" : condition >= 40 ? "#e0a523" : "#e85c3a"}>{conditionBand}</Tag>
            </div>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "0.02em" }}>Menfor Survival</h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.55)", maxWidth: 720 }}>Adapt. Endure. Leave behind a legacy.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn small variant="ghost" onClick={() => { exportSave?.(); notify?.("Tenebrim scenario saved.", "#3ec995"); }}>Save</Btn>
            <Btn small variant="ghost" onClick={() => setScreen("main_menu")}>Menu</Btn>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 300px) 1fr minmax(260px, 320px)", gap: 18, alignItems: "start" }}>
          <Panel style={{ borderColor: "#6e3a24", position: "sticky", top: 20 }}>
            <h3 style={{ color: "#e0a523", margin: "0 0 14px" }}>Body</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {statBox("Health", health, maxHealth, "#e85c3a")}
              {statBox("Stamina", stamina, maxStamina, "#3ec995")}
              {statBox("Condition", condition, 100, condition >= 70 ? "#3ec995" : condition >= 40 ? "#e0a523" : "#e85c3a")}
              {statBox("Pain", pain, 100, "#b83a2a")}
              {statBox("Hunger", hunger, 100, "#ffd966")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 18 }}>
              <Tag color="#ffd966">Food {resources.food}</Tag>
              <Tag color="#a8a8a8">Materials {resources.materials}</Tag>
              <Tag color="#3ec995">Medicine {resources.medicine}</Tag>
              <Tag color="#a89df0">Relics {resources.relics}</Tag>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <Btn small full variant="success" onClick={() => rest("eat")}>Eat</Btn>
              <Btn small full variant="primary" onClick={() => rest("sleep")}>Sleep</Btn>
              <Btn small full variant="success" onClick={() => rest("medicine")}>Medicine</Btn>
              <Btn small full variant="amber" onClick={() => rest("campfire")}>Campfire</Btn>
              <Btn small full variant="danger" onClick={() => rest("dangerousFood")}>Risky Food</Btn>
            </div>
            {injuries.length > 0 && <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 800, letterSpacing: "0.08em" }}>INJURIES</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{injuries.map(id => <Tag key={id} color="#e85c3a">{INJURIES.find(i => i.id === id)?.name || id}</Tag>)}</div>
            </div>}
          </Panel>

          <main style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["map", "hunt", "clan", "techniques", "legacy"].map(id => <Btn key={id} small variant={tab === id ? "gold" : "ghost"} onClick={() => setTab(id)}>{id}</Btn>)}
            </div>

            {activeEvent && <Panel style={{ borderColor: "#e0a523", background: "linear-gradient(180deg,rgba(50,32,12,0.8),rgba(18,10,4,0.9))" }}>
              <Tag color="#e0a523">Survival Event</Tag>
              <h2 style={{ margin: "12px 0 8px" }}>{activeEvent.title}</h2>
              <p style={{ color: "rgba(255,240,210,0.7)", lineHeight: 1.7 }}>{activeEvent.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginTop: 16 }}>
                {activeEvent.choices.map(c => <Panel key={c.label} onClick={() => chooseEvent(c)} style={{ padding: 14, borderColor: "#e0a523", borderRadius: 8 }}>
                  <h4 style={{ margin: "0 0 6px", color: "#ffd966" }}>{c.label}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{c.result}</p>
                </Panel>)}
              </div>
            </Panel>}

            {phase === "combat" && combat && <Panel style={{ borderColor: "#b83a2a" }}>
              <Tag color="#b83a2a">Physical Combat</Tag>
              <h2 style={{ margin: "12px 0 6px" }}>{combat.name}</h2>
              <Bar val={combat.hp} max={combat.maxHp} color="#e85c3a" h={12} />
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Target weak points. Hit chance uses condition, technique, weapon, pain, and enemy evasion.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
                {["Head", "Chest", "Arms", "Legs"].map(zone => <Btn key={zone} variant={zone === "Head" ? "danger" : "primary"} onClick={() => attack(zone)}>{zone}</Btn>)}
              </div>
            </Panel>}

            {tab === "map" && phase !== "combat" && <Panel style={{ borderColor: "#6e3a24" }}>
              <h2 style={{ margin: "0 0 12px", color: "#e0a523" }}>Regional Map</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
                {REGIONS.map(region => {
                  const known = knownRegions.includes(region.id);
                  return <Panel key={region.id} onClick={known ? () => travel(region.id) : undefined} style={{ padding: 14, borderColor: known ? (region.id === currentRegion ? "#e0a523" : "rgba(255,255,255,0.18)") : "rgba(255,255,255,0.06)", opacity: known ? 1 : 0.35, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <h4 style={{ margin: 0, color: known ? "#fff" : "rgba(255,255,255,0.35)" }}>{known ? region.name : "Unknown Region"}</h4>
                      <Tag color={region.danger >= 4 ? "#e85c3a" : region.danger >= 2 ? "#e0a523" : "#3ec995"}>D{region.danger}</Tag>
                    </div>
                    {known && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{region.weather}. Resources: {region.resources.join(", ")}.</p>}
                  </Panel>;
                })}
              </div>
              <h3 style={{ margin: "20px 0 10px", color: "#ffd966" }}>{current.name} Nodes</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {(visitedNodes[current.id] || []).map(node => <Panel key={node} style={{ borderColor: "rgba(224,165,35,0.28)", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div><strong>{node}</strong><p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Safe scavenge, deep search, or forbidden search.</p></div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn small variant="success" onClick={() => riskAction(node, "safe")}>Safe</Btn>
                      <Btn small variant="gold" onClick={() => riskAction(node, "deep")}>Deep</Btn>
                      <Btn small variant="danger" onClick={() => riskAction(node, "forbidden")}>Forbidden</Btn>
                    </div>
                  </div>
                </Panel>)}
              </div>
              {knownRegions.length < REGIONS.length && <Btn style={{ marginTop: 14 }} variant="ghost" onClick={() => setKnownRegions(k => [...k, REGIONS[k.length].id])}>Scout Unknown Border</Btn>}
              <Btn style={{ marginTop: 14, marginLeft: 10 }} variant="danger" onClick={() => startCombat(current.danger + 3, current.boss)}>Challenge Region Boss</Btn>
            </Panel>}

            {tab === "hunt" && phase !== "combat" && <Panel style={{ borderColor: "#3ec995" }}>
              <h2 style={{ marginTop: 0, color: "#3ec995" }}>Hunting</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <Btn variant="success" onClick={() => hunt("small")}>Small prey</Btn>
                <Btn variant="gold" onClick={() => hunt("large")}>Large prey</Btn>
                <Btn variant="danger" onClick={() => hunt("alpha")}>Alpha hunt</Btn>
              </div>
            </Panel>}

            {tab === "clan" && <Panel style={{ borderColor: "#e0a523" }}>
              <h2 style={{ marginTop: 0, color: "#e0a523" }}>Clan</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
                <Tag color="#e85c3a">Strength {clan.strength}</Tag>
                <Tag color="#3ec995">Honor {clan.honor}</Tag>
                <Tag color="#e0a523">Legacy {clan.legacy}</Tag>
                <Tag color="#a89df0">Population {clan.population}</Tag>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                <Btn variant="success" onClick={() => { patchClan({ honor: 4, legacy: 1 }); patchResources({ food: -5 }); addLog("You protect a small camp on the road.", "heal"); }}>Protect people</Btn>
                <Btn variant="gold" onClick={() => { patchClan({ legacy: 6 }); patchResources({ materials: -10 }); addLog("A settlement marker rises from stone and hide.", "reward"); }}>Construct settlement</Btn>
                <Btn variant="danger" onClick={() => { patchClan({ honor: -8, strength: 3 }); addLog("You abandon allies to win faster.", "dmg"); }}>Abandon allies</Btn>
                <Btn variant="danger" onClick={() => { patchClan({ legacy: -8, strength: 10 }); addLog("A rival clan is broken. Menfor grows quieter.", "dmg"); }}>Destroy clan</Btn>
              </div>
            </Panel>}

            {tab === "techniques" && <Panel style={{ borderColor: "#a89df0" }}>
              <h2 style={{ marginTop: 0, color: "#a89df0" }}>Techniques</h2>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Techniques are not purchased. They unlock from what your body survives.</p>
              <div style={{ display: "grid", gap: 10 }}>
                {TECHNIQUES.map(t => <Panel key={t.id} style={{ padding: 14, borderColor: unlockedTechniques.includes(t.id) ? "#3ec995" : "rgba(255,255,255,0.14)", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong style={{ color: unlockedTechniques.includes(t.id) ? "#3ec995" : "#fff" }}>{t.name}</strong>
                    <Tag color={unlockedTechniques.includes(t.id) ? "#3ec995" : "#a8a8a8"}>{unlockedTechniques.includes(t.id) ? "Unlocked" : "Locked"}</Tag>
                  </div>
                  <p style={{ margin: "6px 0", color: "rgba(255,255,255,0.6)" }}>{t.description}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#e0a523" }}>{t.unlockCondition}</p>
                </Panel>)}
              </div>
            </Panel>}

            {tab === "legacy" && <Panel style={{ borderColor: "#ffd966" }}>
              <h2 style={{ marginTop: 0, color: "#ffd966" }}>Legacy and Endings</h2>
              {!isMetaDisabled && <div style={{ marginBottom: 18 }}>
                <Tag color="#e0a523">Ancestral Echoes {echoes}</Tag>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 12 }}>
                  {META_UPGRADES.map(up => <Panel key={up.id} style={{ padding: 14, borderColor: metaUpgrades[up.id] ? "#3ec995" : "rgba(224,165,35,0.35)", borderRadius: 8 }}>
                    <strong>{up.name}</strong>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{up.desc}</p>
                    {metaUpgrades[up.id] ? <Tag color="#3ec995">Unlocked</Tag> : <Btn small variant="gold" disabled={echoes < up.cost} onClick={() => buyMeta(up)}>Echoes {up.cost}</Btn>}
                  </Panel>)}
                </div>
              </div>}
              {isMetaDisabled && <Tag color="#b83a2a">Meta progression unavailable on {diff?.name}</Tag>}
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <Btn variant="gold" disabled={clan.strength < 120 || clan.legacy < 80} onClick={() => triggerEnding("monarch")}>Become Grand Monarch</Btn>
                <Btn variant="success" disabled={clan.honor < 90 || clan.population < 25} onClick={() => triggerEnding("unite")}>Unite Menfor</Btn>
                <Btn variant="gold" disabled={clan.strength < 100 || clan.population < 30} onClick={() => triggerEnding("clan")}>Build strongest clan</Btn>
                <Btn variant="primary" disabled={counters.kills < 100 || clan.legacy < 60} onClick={() => triggerEnding("mourak")}>Become legendary Mourak</Btn>
                <Btn variant="danger" disabled={clan.honor < 70 || health > maxHealth * 0.35} onClick={() => triggerEnding("sacrifice")}>Sacrifice yourself protecting Menfor</Btn>
              </div>
            </Panel>}
          </main>

          <Panel style={{ borderColor: "#33271d", position: "sticky", top: 20, maxHeight: "calc(100vh - 40px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "#d6c0a0", margin: "0 0 12px" }}>Survival Log</h3>
            <div ref={logRef} style={{ overflowY: "auto", minHeight: 320, fontSize: 12, lineHeight: 1.65, paddingRight: 4 }}>
              {combatLog.length === 0 ? <p style={{ color: "rgba(255,255,255,0.35)" }}>The wilds wait.</p> : combatLog.map(l => <div key={l.id} style={{ color: l.type === "dmg" ? "#e85c3a" : l.type === "reward" ? "#ffd966" : l.type === "heal" ? "#3ec995" : "rgba(255,255,255,0.68)", marginBottom: 6 }}>{l.msg}</div>)}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, marginTop: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 800 }}>BODY MODIFIERS</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>Condition bonus {conditionBonus >= 0 ? "+" : ""}{conditionBonus}. Pain penalty -{painPenalty}. Tracking +{trackingBonus}.</p>
              {learned.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{learned.map(t => <Tag key={t.id} color="#a89df0">{t.name}</Tag>)}</div>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
