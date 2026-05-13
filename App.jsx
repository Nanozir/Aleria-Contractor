import React, { useState, useEffect, useRef } from "react";

import ElfScenario from "./ElfScenario";
// ── 1. Importera Ljud ──────────────────────────────────────────────────────
import { SFX, stopBoss, playWaves, playLumen, playMenuBGM, playCombatBGM, stopBGM, playRaceBGM } from "./AudioEngine";

// ── 2. Importera Speldata ──────────────────────────────────────────────────
import { 
  RACES, ORIGINS, CLASSES, RANKS, RANK_THRESHOLDS, RANK_MULT, GRACE, 
  DIFFS, MONSTERS, UW_MONSTERS, M_ACT, SURFACE_SPELLS, DEVIL_SPELLS, 
  WEAPONS, ARMORS, POTIONS, TOOLS, SKILLS, SLEEP, HOUSE_PRICE, 
  ATTACKS_BY_RACE, LOG_C 
} from "./GameData";

// ── 3. Importera UI-komponenter ────────────────────────────────────────────
import { 
  Bar, Tag, Panel, Btn, CoinBar, StarRating, Ton618BG, Confetti, PastoralBG 
} from "./UIComponents";

// ── 4. Importera Vyerna (Sub-skärmar) ──────────────────────────────────────
import { 
  ShopView, SpellsView, SkillsView, ChurchView, GuildView, 
  SleepView, CityView, CraftView, GambleView, TrainingView, EndgameView,
  TenebrimSurvivalView
} from "./Views";

// ── Progress Save System ───────────────────────────────────────────────────
async function loadProg(){try{const r=localStorage.getItem("aleria_progress");return r?JSON.parse(r):{cleared:0};}catch(e){return{cleared:0};}}
async function saveProg(p){try{localStorage.setItem("aleria_progress",JSON.stringify(p));}catch(e){}}

// ── Huvudmotorn (App) ──────────────────────────────────────────────────────
export default function App(){
  const [screen, setScreen] = useState("main_menu");
  const [race, setRace] = useState(null);
  const [cls, setCls] = useState(null);
  const [showLore, setShowLore] = useState(null); // Used for the class infoboxes
  const [progress,setProgress]=useState({cleared:0});
  const [diff,setDiff]=useState(DIFFS[1]);
  const [origin,setOrigin]=useState(null);
  const [tenebrimStart,setTenebrimStart]=useState(null);
  const [stats,setStats]=useState({hp:100,maxHp:100,mp:60,maxMp:60,stamina:80,maxStamina:80});
  const [xp,setXp]=useState(0);
  const [bronze,setBronze]=useState(80);
  const [totalEarned,setTotalEarned]=useState(0);
  const [weapon,setWeapon]=useState(WEAPONS[0]);
  const [weapon2,setWeapon2]=useState(WEAPONS[0]);
  const [armor,setArmor]=useState(ARMORS[0]);
  const [ownedWeapons,setOwnedWeapons]=useState(["fists"]);
  const [ownedArmors,setOwnedArmors]=useState(["none"]);
  const [myTools,setMyTools]=useState([]);
  const [potions,setPotions]=useState([]);
  const [log,setLog]=useState([]);
  const [combat,setCombat]=useState(null);
  const [combatPhase,setCombatPhase]=useState("player");
  const [activeEnemyIdx,setActiveEnemyIdx]=useState(0);
  const [guardActive,setGuardActive]=useState(false);
  const [enemyStunned,setEnemyStunned]=useState({});
  const [combatResult,setCombatResult]=useState(null);
  const [combatOrigin,setCombatOrigin]=useState("overworld");
  const [nearDeathWins,setNearDeathWins]=useState(0);
  const [totalKills,setTotalKills]=useState(0);
  const [techniqueUnlocked,setTechniqueUnlocked]=useState(false);
  const [unlockedSkills,setUnlockedSkills]=useState([]);
  const [revealedSkills,setRevealedSkills]=useState([]);
  const [spells,setSpells]=useState(SURFACE_SPELLS.map(s=>({...s})));
  const [spellStudiedToday,setSpellStudiedToday]=useState({});
  const [doomsday,setDoomsday]=useState(1);
// ── Tenebrim Survival System ───────────────────────────────────────────────
  const [food, setFood] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [survivalStats, setSurvivalStats] = useState({ hunting: 1, gathering: 1, crafting: 1 });
  const [survivalInv, setSurvivalInv] = useState({ meat: 0, herbs: 0, junk: 0, parts: 0 });
  
  // Liberation Quest States
  const [locationsExplored, setLocationsExplored] = useState(0);
  const [liberationQuest, setLiberationQuest] = useState("idle"); // idle, active, locked, completed
  const [tenebrimAllies, setTenebrimAllies] = useState(0);

  const [day,setDay]=useState(1);
  const [doomsdaysCleared,setDoomsdaysCleared]=useState(0);
  const [postDoomsday,setPostDoomsday]=useState(false);
  const [daysSinceContract,setDaysSinceContract]=useState(0);
  const [advRankIdx,setAdvRankIdx]=useState(0);
  const [hasBadge,setHasBadge]=useState(true);
  const [hunterStars,setHunterStars]=useState(1);
  const [churchCost,setChurchCost]=useState(15);
  const [notif,setNotif]=useState(null);
  const [tab,setTab]=useState("map");
  const [warnMonster,setWarnMonster]=useState(null);
  const [warnVisible,setWarnVisible]=useState(false);
  const [devilRep,setDevilRep]=useState(0);
  const [nobleInvite,setNobleInvite]=useState(false);
  const [leftUnderworld,setLeftUnderworld]=useState(false);
  const [declinedInvite,setDeclinedInvite]=useState(false);
  const [nobleQuestActive,setNobleQuestActive]=useState(false);
  const [doomsdayTriggered,setDoomsdayTriggered]=useState(false);
  const [showCutscene,setShowCutscene]=useState(false);
  const [showVictory,setShowVictory]=useState(false);
  const [housing,setHousing]=useState("inn");
  const [ownsHouse,setOwnsHouse]=useState(false);
  const [physicalLevel,setPhysicalLevel]=useState(0);
  const [endgameWave,setEndgameWave]=useState(0);
  const [endgameMonsters,setEndgameMonsters]=useState([]);
  const [allies,setAllies]=useState(0);
  // NY LOGIK: Globalt minne för Mercenaries och Guild Upgrades
  const [expeditions, setExpeditions] = useState([]);
  const [guildUpgrades, setGuildUpgrades] = useState({ speed: 0, reward: 0 });
// ── Colosseum (Tetrabrachian Endgame) ──────────────────────────────────────
  const [colosseum, setColosseum] = useState(null); // { floor, phase, losses, opp, weaponStyle }
  const [colQte, setColQte] = useState(null); // För arena-specifika QTEs
  
  // Lumenari
  const [lumenari,setLumenari]=useState(null);
  const [lumenariPhase,setLumenariPhase]=useState(1);
  const [lumenCombatPhase,setLumenCombatPhase]=useState("player");
  const [qteActive,setQteActive]=useState(false);
  const [qteSequence,setQteSequence]=useState([]);
  const [qteIdx,setQteIdx]=useState(0);
  const [golems,setGolems]=useState([]);
  
  // Underworld Minigames
  const [siphonNodes,setSiphonNodes]=useState([]);
  const [siphonScore,setSiphonScore]=useState(0);
  const [siphonActive,setSiphonActive]=useState(false);
  const [siphonTime,setSiphonTime]=useState(30);
  const [siphonResult,setSiphonResult]=useState(null);

// --- SETTINGS & AUDIO STATE ---
  const [showSettings, setShowSettings] = useState(false);
  const [volumes, setVolumes] = useState(() => {
    try {
      const saved = localStorage.getItem("aleria_vols");
      // Safely parse the memory, avoiding the "undefined" string crash
      return saved && saved !== "undefined" ? JSON.parse(saved) : { master: 1.0, bgm: 0.6, sfx: 1.0 };
    } catch (e) {
      console.warn("Audio save corrupted. Resetting to defaults.");
      return { master: 1.0, bgm: 0.6, sfx: 1.0 };
    }
  });

  useEffect(() => {
    localStorage.setItem("aleria_vols", JSON.stringify(volumes));
    if (window.updateAudioVolumes) window.updateAudioVolumes(volumes);
  }, [volumes]);

  const updateVol = (type, val) => {
    setVolumes(prev => ({ ...prev, [type]: parseFloat(val) }));
  };  

// Tenebrim Slave
  const [slaveTask,setSlaveTask]=useState(null);
  const [slaveProgress,setSlaveProgress]=useState(0);
  const [slaveDay,setSlaveDay]=useState(0);
  const [escapeReady,setEscapeReady]=useState(false);
  
  // Crafting
  const [craftMats,setCraftMats]=useState({metal:0,herb:0});
  const [craftedShop, setCraftedShop] = useState([]);
  
  // City Builder
  const [cityLevel,setCityLevel]=useState({pump:0,walls:0});

  const logRef=useRef(null);
  const siphonTickRef=useRef(null);

  useEffect(()=>{loadProg().then(p=>setProgress(p||{cleared:0}));},[]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[log]);
  
  // Audio Router: Triggers BGM depending on current screen
  // Audio Router: Triggers BGM depending on current screen
  useEffect(()=>{
    if(screen==="endgame_combat") { stopBGM(); playWaves(); }
    else if(screen==="lumenari") { stopBGM(); playLumen(lumenariPhase); }
    else if(["main_menu", "difficulty", "race", "origin", "class", "intro", "intro_ten", "devil_intro", "devil_class", "ten_slave", "ten_tribe"].includes(screen)) { 
      stopBoss(); 
      playMenuBGM(); 
    }
    else if(screen==="combat" || screen==="colosseum") { 
      stopBoss(); 
      stopBGM(); 
      playCombatBGM(); // Här startar den nya stridsmusiken!
    }
    else { 
      stopBoss(); 
      // När vi är ute och utforskar (t.ex. 'overworld' eller 'underworld')
      if (race && race.id) {
          playRaceBGM(race.id);
      } else {
          stopBGM(); 
      }
    } 
    return()=>{};
  },[screen, lumenariPhase, race]); // VIKTIGT: Vi la till 'race' i denna lista!

  // NY LOGIK: Global timer för legosoldater (tickar även i bakgrunden)
  useEffect(() => {
    const tick = setInterval(() => {
      setExpeditions(prev => {
        if (prev.length === 0) return prev; // Gör inget om inga är utsända
        
        const updated = prev.map(exp => ({ ...exp, timeLeft: exp.timeLeft - 1 }));
        const finished = updated.filter(exp => exp.timeLeft <= 0);
        const ongoing = updated.filter(exp => exp.timeLeft > 0);
        
        // Ge belöning för de som återvänder
        finished.forEach(exp => {
          setBronze(b => b + exp.reward);
          notify(`A squad returned with ${exp.reward} B!`, "#3ec995");
          if(window.SFX && window.SFX.reward) window.SFX.reward();
        });
        
        return ongoing;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []); // Tom array betyder att den startar en gång när spelet laddas och körs för evigt

  // ── Test-fusk & Debug ──────────────────────────────────────────────────────
  useEffect(() => {
    let typedKeys = "";
    
    const handleKeyDown = (e) => {
      // 1. Confirm cheat by pressing the Enter key
      if (e.key === "Enter") {
        if (screen === "main_menu" || !race) {
          typedKeys = "";
          return;
        }

        const code = typedKeys.toLowerCase();
        let matched = false;

        // Cheat 1: Jump to Endgame
        if (code.endsWith("endgamenow")) {
          setPostDoomsday(true); setDoomsday(0); setScreen("endgame");
          notify("Debug: Endgame Unlocked!", "#ffd966");
          addLog("Time shatters. You reached the New Dawn.", "sys");
          matched = true;
        }

        // Cheat 2: Scalable Material & Money Cheats
        // Base words we are listening for
        const materials = ["money", "junk", "herb", "meat", "part", "gear"];
        
        for (let mat of materials) {
          // Check for 3 repetitions, then 2, then 1
          for (let mult = 3; mult >= 1; mult--) {
            const searchString = "give" + mat.repeat(mult);
            
            if (code.endsWith(searchString)) {
              if (mat === "money") {
                setBronze(b => b + (mult * 5000));
                notify(`Cheat: +${mult * 5000} Bronze!`, "#e0a523");
              } else if (mat === "gear") {
                // Give one of each survival tool per multiplier
                setSurvivalInv(i => ({...i, gatheringGear: (i.gatheringGear||0) + mult, fishingGear: (i.fishingGear||0) + mult, huntingGear: (i.huntingGear||0) + mult}));
                notify(`Cheat: +${mult} to all Survival Tools!`, "#e0a523");
              } else {
                // Map the typed word to the actual state variable names
                const statMap = { junk: "junk", herb: "herbs", meat: "meat", part: "parts" };
                const stat = statMap[mat];
                const amount = mult * 10;
                setSurvivalInv(i => ({ ...i, [stat]: (i[stat]||0) + amount }));
                notify(`Cheat: +${amount} ${mat.charAt(0).toUpperCase() + mat.slice(1)}!`, "#a89df0");
              }
              
              if(window.SFX && window.SFX.reward) window.SFX.reward();
              matched = true;
              break; // Break the multiplier loop so we don't trigger smaller amounts too
            }
          }
          if (matched) break; // Break the material loop if a cheat was found
        }
        
        typedKeys = ""; // Always clear the memory buffer after pressing Enter
      } 
      // 2. Build the string as the player types
      else if (e.key.length === 1) {
        typedKeys += e.key.toLowerCase();
        // Keep the memory clean by only saving the last 50 keystrokes
        if (typedKeys.length > 50) typedKeys = typedKeys.slice(-50);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, race]); 
  // ───────────────────────────────────────────────────────────────────────────

  function notify(msg,color="#5b4fd4"){setNotif({msg,color});setTimeout(()=>setNotif(null),2600);}
  function addLog(msg,type="info"){setLog(l=>[...l.slice(-70),{msg,type,id:Date.now()+Math.random()}]);}

  function exportSave() {
    const data = { diff, race, cls, stats, xp, bronze, weapon, weapon2, armor, ownedWeapons, ownedArmors, potions, doomsday, day, postDoomsday, devilRep, cityLevel, nobleQuestActive, craftedShop };
    try {
      localStorage.setItem("aleria_save_slot", JSON.stringify(data));
      notify("Game saved to browser memory!", "#3ec995");
    } catch(e) {
      notify("Failed to save.", "#d84838");
    }
  }

  function importSave() {
    const s = localStorage.getItem("aleria_save_slot"); 
    if (!s) { notify("No save found in browser.", "#d84838"); return; }
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    try {
      const parsed = JSON.parse(s);
      if(parsed.diff) setDiff(parsed.diff); 
      if(parsed.race) setRace(parsed.race); 
      if(parsed.cls) setCls(parsed.cls); 
      if(parsed.stats) setStats(parsed.stats); 
      if(parsed.xp!==undefined) setXp(parsed.xp); 
      if(parsed.bronze!==undefined) setBronze(parsed.bronze);
      if(parsed.weapon) setWeapon(parsed.weapon); 
      if(parsed.weapon2) setWeapon2(parsed.weapon2); 
      if(parsed.armor) setArmor(parsed.armor); 
      if(parsed.ownedWeapons) setOwnedWeapons(parsed.ownedWeapons); 
      if(parsed.ownedArmors) setOwnedArmors(parsed.ownedArmors);
      if(parsed.potions) setPotions(parsed.potions); 
      if(parsed.doomsday!==undefined) setDoomsday(parsed.doomsday); 
      if(parsed.day!==undefined) setDay(parsed.day); 
      if(parsed.postDoomsday!==undefined) setPostDoomsday(parsed.postDoomsday);
      if(parsed.devilRep!==undefined) setDevilRep(parsed.devilRep); 
      if(parsed.cityLevel) setCityLevel(parsed.cityLevel); 
      if(parsed.nobleQuestActive!==undefined) setNobleQuestActive(parsed.nobleQuestActive);
      if(parsed.craftedShop) setCraftedShop(parsed.craftedShop);
      
      setScreen(parsed.race?.id === "devil" && !parsed.nobleQuestActive ? "underworld" : "overworld");
      setTab("map");
      notify("Save loaded successfully!", "#3ec995");
    } catch (err) { notify("Invalid save data.", "#d84838"); }
  }

  function startNewGame() {
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    
    // ADD THIS LINE TO WIPE THE ELF SCENARIO MEMORY:
    localStorage.removeItem("aleria_elf_save"); 
    
    setDiff(DIFFS[1]); setRace(null); setOrigin(null); setCls(null); setTenebrimStart(null);
    setStats({hp:100,maxHp:100,mp:60,maxMp:60,stamina:80,maxStamina:80});
    setXp(0); setBronze(80); setTotalEarned(0);
    setWeapon(WEAPONS[0]); setWeapon2(WEAPONS[0]); setArmor(ARMORS[0]);
    setOwnedWeapons(["fists"]); setOwnedArmors(["none"]); setMyTools([]); setPotions([]);
    setLog([]); setCombat(null); setCombatPhase("player"); setCombatResult(null);
    setActiveEnemyIdx(0); setGuardActive(false); setEnemyStunned({});
    setNearDeathWins(0); setTotalKills(0); setTechniqueUnlocked(false);
    setUnlockedSkills([]); setRevealedSkills([]); setSpells(SURFACE_SPELLS.map(s=>({...s})));
    setSpellStudiedToday({}); setDoomsday(1); setDay(1); setPostDoomsday(false);
    setDaysSinceContract(0); setAdvRankIdx(0); setHasBadge(true); setHunterStars(1);
    setDevilRep(0); setNobleInvite(false); setLeftUnderworld(false); setDeclinedInvite(false);
    setNobleQuestActive(false); setHousing("inn"); setOwnsHouse(false); setPhysicalLevel(0);
    setEndgameWave(0); setEndgameMonsters([]); setAllies(0);
    setLumenari(null); setLumenariPhase(1); setLumenCombatPhase("player"); setQteActive(false); setQteSequence([]); setQteIdx(0); setGolems([]);
    setSiphonNodes([]); setSiphonScore(0); setSiphonActive(false); setSiphonTime(30); setSiphonResult(null);
    setSlaveTask(null); setSlaveProgress(0); setSlaveDay(0); setEscapeReady(false);
    setCraftMats({metal:0,herb:0}); setCityLevel({pump:0,walls:0}); setCraftedShop([]);
    setScreen("difficulty");
  }

  function returnToMenu(){
    if (window.SFX && window.SFX.menuBack) window.SFX.menuBack();
    stopBoss(); setScreen("main_menu");
  }

  function checkSkillUnlocks(){
    const ctx={kills:totalKills,nearDeath:nearDeathWins,earned:totalEarned,days:day,spellsLearned:spells.filter(s=>s.learned).length};
    SKILLS.forEach(sk=>{
      if(unlockedSkills.find(u=>u.id===sk.id))return;
      if(ctx[sk.reqType]>=sk.reqVal){
        setUnlockedSkills(p=>[...p,sk]);
        notify(`Skill unlocked: ${sk.name}`,"#a89df0");
        if(sk.effect==="passive_hp")setStats(s=>({...s,maxHp:s.maxHp+sk.val,hp:s.hp+sk.val}));
        else if(sk.effect==="passive_sta")setStats(s=>({...s,maxStamina:s.maxStamina+sk.val,stamina:s.stamina+sk.val}));
      }
    });
  }
  useEffect(()=>{checkSkillUnlocks();},[totalKills,nearDeathWins,totalEarned,day,spells]);

  function getSkill(eff){return unlockedSkills.filter(s=>s.effect===eff).reduce((sum,s)=>sum+(s.val||0),0);}
  function shopDiscount(){return getSkill("shop_discount");}
  function adjustedPrice(p){return Math.round(p*(1-shopDiscount()));}

  useEffect(()=>{if(doomsday>=10&&!doomsdayTriggered&&!postDoomsday){setDoomsdayTriggered(true);setShowCutscene(true);SFX.roar();setTimeout(()=>{setShowCutscene(false);startEndgame(0);},4500);}},[doomsday,doomsdayTriggered,postDoomsday]);
  useEffect(()=>{if(race?.id==="devil"&&devilRep>=8&&!nobleInvite&&!leftUnderworld&&!declinedInvite){setNobleInvite(true);notify("A noble has heard of your reputation.","#c8911a");}},[devilRep,race,nobleInvite,leftUnderworld,declinedInvite]);

  function pickDiff(d){
    if(d.locked&&progress.cleared<d.unlockReq){notify(`Defeat ${d.unlockReq} Doomsday to unlock.`,"#9a6c10");return;}
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    setDiff(d);setScreen("race");
  }

  function pickRace(r){
    if(r.locked){ notify(r.unlockHint || "Locked.", "#9a6c10"); return; }
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    
    setRace(r);
    setStats({ hp: 100 + (r.hpBonus || 0), maxHp: 100 + (r.hpBonus || 0), mp: 60 + (r.mpBonus || 0), maxMp: 60 + (r.mpBonus || 0), stamina: 80, maxStamina: 80 });

    if(r.id === "devil"){ setSpells(DEVIL_SPELLS.map(s => ({ ...s }))); setScreen("devil_intro"); } 
    else if(r.id === "tenebrim"){ setScreen("ten_origin"); } 
    else if(r.id === "elf"){ setScreen("elf_scenario"); } 
    else { setScreen("origin"); }
  }

  function pickOrigin(o){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    setOrigin(o);
    if (o.id === "traveler") { setBronze(b => b + 70); } 
    else if (o.id === "youth") { setPotions(p => [...p, POTIONS[0]]); }
    setScreen("class");
  }

  function pickClass(c){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    setCls(c);setScreen("intro");
  }

  function beginGame(){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    if (race?.id === "tenebrim") { setScreen("tenebrim_survival"); addLog("You step into the wilds. Survival begins.", "sys"); } 
    else { setScreen("overworld"); setTab("map"); addLog("You take your first steps.", "sys"); }
  }

  function beginUnderworld(){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    setScreen("underworld");setTab("map");addLog("Sector Three. Your shift begins.","sys");
  }

  function startSlaveWork(){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    const tasks=["Carry crates","Scrub floors","Haul water", "Break rocks"];
    setSlaveTask(tasks[Math.floor(Math.random()*tasks.length)]);
    setSlaveProgress(0);
  }
  
  function doSlaveWork(){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect(); // Tactile click for working
    const np=Math.min(100,slaveProgress+Math.floor(Math.random()*22)+18);
    setSlaveProgress(np);
    
    if(np>=100){
      if (window.SFX && window.SFX.reward) window.SFX.reward(); // Ping when the bar fills!
      const nd=slaveDay+1;
      setSlaveDay(nd);
      setSlaveProgress(0);
      
      if(nd>=3){
        setEscapeReady(true);
        notify("Escape opportunity.","#c8911a");
      } else {
        startSlaveWork();
      }
    }
  }
  
  function doEscape(){
    if (window.SFX && window.SFX.menuSelect) window.SFX.menuSelect();
    setCls({id:"wanderer",name:"Wanderer",org:"Self-trained"});
    setScreen("intro_ten");
  }

  function acceptInvite(){setNobleInvite(false);setLeftUnderworld(true);setSpells(p=>p.map(s=>s.combatUse?{...s,combatUse:{...s.combatUse,mpCost:Math.round(s.combatUse.mpCost*1.6)}}:s));addLog("You accept. Surface mana dims your spells.","sys");setScreen("devil_class");}
  function declineInvite(){setNobleInvite(false);setDeclinedInvite(true);addLog("Underworld grows more dangerous.","sys");}
  function acceptNobleQuest(){setNobleQuestActive(true);notify("Noble Quest Accepted!","#ffd966");}

  function chooseHousing(opt){const o=SLEEP.find(x=>x.id===opt);if(o.id==="owned_house"&&!ownsHouse){notify("You don't own a house.","#b83a2a");return;}setHousing(opt);notify(`Lodging: ${o.name}.`,"#3ec995");setScreen("overworld");setTab("map");}
  
  // FIX: Garanterar 100% helning oavsett maxHp
  function doSleep(){
    const opt=SLEEP.find(o=>o.id===housing);
    if(opt.cost>0&&bronze<opt.cost){notify("Not enough Bronze.","#b83a2a");return;}
    if(opt.cost>0)setBronze(b=>b-opt.cost);
    
    setStats(s=>({
      ...s,
      hp: opt.hpRec >= 1.0 ? s.maxHp : Math.min(s.maxHp, s.hp + Math.round(s.maxHp * opt.hpRec)),
      mp: opt.mpRec >= 1.0 ? s.maxMp : Math.min(s.maxMp, s.mp + Math.round(s.maxMp * opt.mpRec)),
      stamina: opt.staRec >= 1.0 ? s.maxStamina : Math.min(s.maxStamina, s.stamina + Math.round(s.maxStamina * opt.staRec))
    }));
    
    setSpellStudiedToday({});
    const nd=day+1;
    setDay(nd);
    const dsc=daysSinceContract+1;
    setDaysSinceContract(dsc);
    if(cls?.id==="adventurer"&&hasBadge){
      const grace=GRACE[advRankIdx];
      if(grace){
        if(dsc===grace[0])notify("Guild warning.","#c8911a");
        else if(dsc===grace[1])notify("Final warning.","#b83a2a");
        else if(dsc>=grace[2]){
          if(advRankIdx===0){setHasBadge(false);notify("Badge revoked.","#b83a2a");}
          else{setAdvRankIdx(i=>i-1);setDaysSinceContract(0);notify("Rank reduced.","#b83a2a");}
        }
      }
    }
    if(!postDoomsday)setDoomsday(d=>Math.min(10,d+opt.doomGain));
    addLog(`Slept at ${opt.name}. Day ${nd}.`,"sys");
    if(window.SFX && window.SFX.sleep) window.SFX.sleep();
  }
  
  function buyHouse(){if(bronze<HOUSE_PRICE){notify("Not enough.","#b83a2a");return;}setBronze(b=>b-HOUSE_PRICE);setOwnsHouse(true);notify("House purchased.","#3ec995");SFX.buy();}

  function getStacks(){const m={};potions.forEach(p=>{if(m[p.id])m[p.id].count++;else m[p.id]={...p,count:1};});return Object.values(m);}
  function usePotion(p){const k="max"+p.stat.charAt(0).toUpperCase()+p.stat.slice(1);setStats(s=>({...s,[p.stat]:Math.min(s[k],s[p.stat]+p.val)}));setPotions(prev=>{const i=prev.findIndex(x=>x.id===p.id);if(i<0)return prev;const n=[...prev];n.splice(i,1);return n;});addLog(`Used ${p.name}.`,"heal");}

  function studySpell(id){
    if(!race?.canSpell){notify("Your kind doesn't work with spells.","#9a6c10");return;}
    if(spellStudiedToday[id]){notify("Studied today already.","#9a6c10");return;}
    SFX.spell();const opt=SLEEP.find(o=>o.id===housing);const mult=opt?.spellMult||1;
    setSpells(p=>p.map(s=>{if(s.id!==id)return s;const np=Math.min(100,s.progress+Math.floor((Math.random()*7+4)*mult));if(np>=100){SFX.reward();notify(`Learned: ${s.name}`,"#5b4fd4");setStats(st=>({...st,maxMp:st.maxMp+8,mp:st.mp+8}));}return{...s,progress:np,learned:np>=100};}));
    setSpellStudiedToday(p=>({...p,[id]:true}));
  }
  function visibleSpells(){return spells.filter(s=>{const r=spells.find(x=>x.replaces===s.id);return!(r&&r.learned);});}

  function visitChurch(skillId){
    const cost=race?.id==="devil"?Math.round(churchCost*1.5):churchCost;
    if(race?.id==="devil"&&!leftUnderworld){notify("Devils can't enter churches in the Underworld.","#b83a2a");return;}
    if(bronze<cost){notify(`Need ${cost} Bronze.`,"#b83a2a");return;}
    if(revealedSkills.includes(skillId)){return;}
    SFX.church();setBronze(b=>b-cost);setRevealedSkills(p=>[...p,skillId]);
    notify("Skill revealed.","#5b4fd4");
  }

  function getBonusAtk(){return (weapon?.atk||0)+(race?.id==="tetrabrachian"?(weapon2?.atk||0):0)+(race?.atkBonus||0)+physicalLevel+getSkill("passive_atk");}
  function getBonusDef(){return (armor?.def||0)+(race?.defBonus||0)+getSkill("passive_def")+(race?.id==="tetrabrachian"&&weapon2?.id!=="fists"?-3:0);}
  function rollDodge(){return Math.random()*100<((race?.dodge||5)+getSkill("passive_dodge"));}

function startSlaverCombat(isBoss) {
    setCombatOrigin(screen);
    const slaverNames = ["Syndicate Scout", "Camp Guard", "Mercenary Thug", "Slave Driver"];
    const num = isBoss ? 1 : (diff?.enemies || 2);
    
    const enemies = Array.from({length:num}, (_, i) => {
      const name = isBoss ? "Syndicate Leader" : slaverNames[Math.floor(Math.random() * slaverNames.length)];
      // Scale human enemies based on how far into the quest you are
      const hpScale = isBoss ? 500 : 80 + (tenebrimAllies * 15);
      const atkScale = isBoss ? 35 : 12 + (tenebrimAllies * 2);
      
      return {
        id: "slaver_" + i + "_" + Date.now(),
        name: name,
        star: isBoss ? 5 : 3,
        hp: hpScale, maxHp: hpScale, atk: atkScale, def: isBoss ? 15 : 5,
        reward: { xp: isBoss ? 600 : 50, bronze: isBoss ? 1500 : 40 }
      };
    });
    
    setCombat(enemies); setActiveEnemyIdx(0); setGuardActive(false); setEnemyStunned({});
    setCombatPhase("player"); setCombatResult(null);
    setLog([{msg: `${enemies.length} hostile humans engage you!`, type:"sys", id:Date.now()}]);
    setScreen("combat");
  }

  function startCombat(isUw){
    setCombatOrigin(screen); // Dynamically saves your current screen
    let pool=isUw?UW_MONSTERS:(()=>{const dd=doomsday;const ms=postDoomsday?5:dd<3?2:dd<6?3:dd<8?4:5;return MONSTERS.filter(m=>m.star<=ms);})();
    const dd=postDoomsday?5:doomsday;
    const num=diff?.enemies||2;
    const enemies=Array.from({length:num},(_,i)=>{
      const b=pool[Math.floor(Math.random()*pool.length)];
      const hpScale=(isUw?1.4:1)+dd*0.08+(declinedInvite?0.3:0);
      const atkScale=((isUw?1.3:1)+dd*0.06+(declinedInvite?0.25:0))*(diff?.enemyAtk||1);
      const hpMult=diff?.hpMult||1;
      return{...b,id:b.id+"_"+i+"_"+Date.now(),hp:Math.round(b.hp*hpScale*hpMult),maxHp:Math.round(b.hp*hpScale*hpMult),atk:Math.round(b.atk*atkScale),def:b.def};
    });
    const highStar=Math.max(...enemies.map(e=>e.star));
    const pp=getBonusAtk()+getBonusDef();const thr=pp>=40?4:pp>=25?3:2;
    if(highStar>thr){const wm=enemies.find(e=>e.star===highStar);setWarnMonster(wm);setWarnVisible(true);SFX.warn();setTimeout(()=>{setWarnVisible(false);setTimeout(()=>launchCombat(enemies),350);},2500);}
    else launchCombat(enemies);
  }
  function launchCombat(enemies){
    setCombat(enemies);setActiveEnemyIdx(0);setGuardActive(false);setEnemyStunned({});
    setCombatPhase("player");setCombatResult(null);
    setLog([{msg:`${enemies.length} ${enemies.length===1?"enemy appears":"enemies appear"}!`,type:"sys",id:Date.now()}]);
    setScreen("combat");setDaysSinceContract(0);
    if(race?.id==="devil"&&!leftUnderworld)setDevilRep(r=>r+1);
  }
  function flee(){SFX.flee();const cost=Math.ceil(bronze*0.05);setBronze(b=>Math.max(0,b-cost));addLog(`Fled. Lost ${cost} Bronze.`,"sys");setScreen(combatOrigin);setTab("map");setCombatResult(null);setCombat(null);}

  // FIX: Hanterar både vanliga och Multi-attacks (AoE)
  function playerAct(action){
    if(combatPhase!=="player")return;
    let ns={...stats};let newGuard=false;
    if(action.staminaCost&&ns.stamina<action.staminaCost){notify("Not enough stamina.","#b83a2a");return;}
    if(action.mpCost&&ns.mp<action.mpCost){notify("Not enough mana.","#b83a2a");return;}
    
    let nc=[...combat];
    const tIdx=activeEnemyIdx<nc.length&&nc[activeEnemyIdx].hp>0?activeEnemyIdx:nc.findIndex(e=>e.hp>0);
    if(tIdx<0)return;
    const target=nc[tIdx];
    
    if(action.id==="guard"){newGuard=true;SFX.guard();addLog("You brace.","info");}
    else if(action.id==="focus"){ns.stamina=Math.min(ns.maxStamina,ns.stamina+15);addLog("Stamina restored.","heal");}
    else if(action.effect==="confuse"||action.effect==="stun"){ns.mp-=action.mpCost;SFX.spell();setEnemyStunned(p=>({...p,[target.id]:action.turns||1}));addLog(`${action.name}: ${target.name} stunned.`,"spell");}
    else{
      if(action.accuracy&&Math.random()>action.accuracy){addLog(`${action.name} missed!`,"info");if(action.staminaCost)ns.stamina-=action.staminaCost;}
      else{
        if (action.aoe) {
          let totalDmg = 0;
          for (let i = 0; i < nc.length; i++) {
            if (nc[i].hp <= 0) continue;
            const raw = action.dmg ? Math.floor(Math.random() * (action.dmg[1] - action.dmg[0] + 1)) + action.dmg[0] : 10;
            let bonus = getBonusAtk();
            const dmg = Math.max(1, raw + bonus - nc[i].def);
            totalDmg += dmg;
            nc[i].hp = Math.max(0, nc[i].hp - dmg);
          }
          if (action.staminaCost) ns.stamina -= action.staminaCost;
          if (action.mpCost) ns.mp -= action.mpCost;
          SFX.attack();
          addLog(`${action.name} hit all enemies for ${totalDmg} total damage!`, "dmg");
        } 
        else {
          const hits=action.hits||1;let totalDmg=0;
          for(let h=0;h<hits;h++){
            const raw=action.dmg?Math.floor(Math.random()*(action.dmg[1]-action.dmg[0]+1))+action.dmg[0]:Math.floor(Math.random()*10)+6;
            let bonus=getBonusAtk();
            if(action.id==="strike")bonus+=getSkill("strike_bonus");
            const dmg=Math.max(1,raw+bonus-target.def);
            totalDmg+=dmg;target.hp=Math.max(0,target.hp-dmg);if(target.hp<=0)break;
          }
          if(action.staminaCost)ns.stamina-=action.staminaCost;if(action.mpCost)ns.mp-=action.mpCost;
          SFX.attack();addLog(`${action.name} → ${target.name}: ${totalDmg} damage.`,"dmg");
          if(action.effect==="stun"){setEnemyStunned(p=>({...p,[target.id]:1}));}

          // Tenebrim Weapon Durability Check
          if (action.id === "spear_thrust" && Math.random() < 0.20) {
             setSurvivalInv(i => ({...i, huntingGear: Math.max(0, (i.huntingGear||1) - 1)}));
             addLog("Your Spear shattered!", "sys");
          } else if (action.id === "heavy_spear" && Math.random() < 0.10) {
             setSurvivalInv(i => ({...i, heavySpear: Math.max(0, (i.heavySpear||1) - 1)}));
             addLog("Your Heavy Spear broke!", "sys");
          }
        }
      }
    }
    
    if (!action.aoe) { nc[tIdx] = target; }
    setGuardActive(newGuard);setStats(ns);setCombat(nc);
    if(nc.every(e=>e.hp<=0)){endCombat(true,ns,nc);return;}
    if(target.hp<=0){const next=nc.findIndex(e=>e.hp>0);if(next>=0)setActiveEnemyIdx(next);}
    setCombatPhase("enemy");setTimeout(()=>enemyTurn(nc,ns,newGuard),850);
  }

  function enemyTurn(enemies,ps,guarded){
    try {
      let ns={...ps};
      for(let i=0;i<enemies.length;i++){
        const m=enemies[i];if(m.hp<=0)continue;
        if(enemyStunned[m.id]>0){setEnemyStunned(p=>({...p,[m.id]:p[m.id]-1}));addLog(`${m.name} stunned.`,"info");continue;}
        const baseId=m.id.split("_")[0];const acts=M_ACT[baseId]||M_ACT.cur;
        const a=acts[Math.floor(Math.random()*acts.length)];
        if(a&&a.dmg&&a.dmg[1]>0){
          if(rollDodge()){addLog(`Evaded ${m.name}!`,"heal");continue;}
          let raw=Math.floor(Math.random()*(a.dmg[1]-a.dmg[0]+1))+a.dmg[0];
          if(guarded&&i===0)raw=Math.max(0,raw-6);
          const dmg=Math.max(1,raw-getBonusDef());
          ns.hp=Math.max(0,ns.hp-dmg);SFX.hit();
          addLog(`${m.name}: ${dmg} damage.`,"dmg");
          if(a.effect==="drain_mp")ns.mp=Math.max(0,ns.mp-10);
        }
        if(ns.hp<=0)break;
      }
      setStats(ns);
      if(ns.hp<=0){SFX.defeat();addLog("You collapse.","sys");setCombatPhase("result");setCombatResult("lose");return;}
      setCombatPhase("player");
    } catch(err) {
      console.error(err);
      setCombatPhase("player");
    }
  }
  function endCombat(won,fs,finalEnemies){
    setCombatPhase("result");setCombatResult(won?"win":"lose");
    if(won){
      let totalXp=0,totalBronze=0;
      finalEnemies.forEach(e=>{totalXp+=e.reward.xp;totalBronze+=e.reward.bronze;});
      const rm=cls?.id==="adventurer"?RANK_MULT[advRankIdx]:1.5;
      const gm=diff?.goldMult||1;
      const bonus=Math.round(totalBronze*(1+(postDoomsday?0:doomsday*0.08))*rm*gm);
      setXp(x=>x+totalXp);setBronze(b=>b+bonus);setTotalEarned(t=>t+bonus);setTotalKills(k=>k+finalEnemies.length);
      if(!postDoomsday)setDoomsday(d=>Math.min(10,d+0.25));
      SFX.reward();addLog(`Victory. +${totalXp} XP, +${bonus} Bronze.`,"reward");
      
      // Tenebrim Post-Combat Processing
      if (race?.id === "tenebrim") {
         // Check if we were fighting humans
         if (finalEnemies.some(e => e.name.includes("Syndicate") || e.name.includes("Guard") || e.name.includes("Mercenary") || e.name.includes("Driver"))) {
            if (finalEnemies.some(e => e.name === "Syndicate Leader")) {
               setLiberationQuest("completed");
               notify("The Syndicate is destroyed. You are truly free.", "#ffd966");
               addLog("You have liberated your people.", "sys");
            } else {
               const rescued = Math.floor(Math.random() * 2) + 1;
               setTenebrimAllies(a => a + rescued);
               notify(`Camp cleared! Rescued ${rescued} captives.`, "#3ec995");
               addLog(`Your rebel force grows. Allies: ${tenebrimAllies + rescued}`, "sys");
            }
         } else {
            // Standard monster meat harvesting
            const meatGained = finalEnemies.length * (Math.floor(Math.random() * 3) + 1);
            setSurvivalInv(i => ({...i, meat: (i.meat || 0) + meatGained}));
            addLog(`Harvested ${meatGained} meat from the carcasses.`, "sys");
         }
      }

      if(cls?.id==="adventurer"&&hasBadge&&advRankIdx<5){const newXp=xp+totalXp;if(newXp>=RANK_THRESHOLDS[advRankIdx]){setAdvRankIdx(i=>i+1);SFX.rankup();notify(`Rank up: ${RANKS[advRankIdx+1]}!`,"#3ec995");}}
      if(cls?.id==="hunter"){const ns=Math.min(5,Math.floor((xp+totalXp)/300)+1);if(ns>hunterStars){setHunterStars(ns);SFX.rankup();notify(`Hunter ★${ns}`,"#3ec995");}}
      if(fs.hp<=fs.maxHp*0.15){const nc=nearDeathWins+1;setNearDeathWins(nc);if(nc>=3&&!techniqueUnlocked){setTechniqueUnlocked(true);notify("Technique stirs.","#9a6c10");}}
    }else if(diff?.perma){addLog("Permadeath: progress lost.","sys");setTimeout(returnToMenu,2000);}
  }

  function startSiphon(){const nodes=Array.from({length:6},(_,i)=>({id:i,level:Math.random()*30+10,rising:Math.random()*1.8+1.0+doomsday*0.15}));setSiphonNodes(nodes);setSiphonScore(0);setSiphonActive(true);setSiphonTime(30);setSiphonResult(null);setScreen("siphon");}
  useEffect(()=>{if(!siphonActive)return;siphonTickRef.current=setInterval(()=>{setSiphonNodes(p=>p.map(n=>{let lv=n.level+n.rising;if(lv>100)lv=100;return{...n,level:lv,danger:lv>80};}));setSiphonTime(t=>{if(t<=1){clearInterval(siphonTickRef.current);setSiphonActive(false);setSiphonResult("complete");return 0;}return t-1;});},700);return()=>clearInterval(siphonTickRef.current);},[siphonActive]);
  function tapNode(id){if(!siphonActive)return;SFX.siphon();setSiphonNodes(p=>p.map(n=>n.id===id?{...n,level:Math.max(0,n.level-40)}:n));setSiphonScore(s=>s+10);}
  function leaveSiphon(){if(siphonTickRef.current)clearInterval(siphonTickRef.current);setSiphonActive(false);setSiphonResult(null);setScreen(race?.id==="devil"&&!leftUnderworld?"underworld":"overworld");setTab("map");}
  useEffect(()=>{if(siphonResult==="complete"){const ov=siphonNodes.filter(n=>n.level>=100).length;if(ov>0&&!postDoomsday)setDoomsday(d=>Math.min(10,d+ov*0.5));const r=Math.round(siphonScore*0.8+20);setBronze(b=>b+r);setTotalEarned(t=>t+r);addLog(`Shift done. +${r} Bronze.`,"reward");if(race?.id==="devil"&&!leftUnderworld)setDevilRep(r2=>r2+(ov===0?2:1));}},[siphonResult]);

// ── Colosseum Logik ────────────────────────────────────────────────────────
  function startColosseum() {
    setColosseum({ floor: 1, phase: 'prep', losses: 0, opp: null, weaponStyle: null });
    setScreen("colosseum");
  }

  function setupColosseumFight(phaseToSetup, chosenWeapon = null) {
    let f = colosseum.floor;
    // Skala HP och Skada baserat på våning och fas
    let hp = phaseToSetup === 'boss' ? 300 + (f * 120) : 100 + (f * 60);
    let atk = phaseToSetup === 'boss' ? 25 + (f * 12) : 15 + (f * 7);
    let name = phaseToSetup === 'boss' ? `Titan of Floor ${f}` : phaseToSetup === 'weapon' ? `${chosenWeapon} Gladiator` : `Pit Brawler`;

    setColosseum(c => ({ 
      ...c, 
      phase: phaseToSetup, 
      weaponStyle: chosenWeapon || c.weaponStyle,
      opp: { name, hp, maxHp: hp, atk, def: f * 4 } 
    }));
    // Hela spelaren inför varje arena-strid
    setStats(s => ({ ...s, hp: s.maxHp, stamina: s.maxStamina })); 
    setLog([{ msg: `Match starts: ${name}!`, type: "sys", id: Date.now() }]);
  }

  function advanceColosseum() {
    let c = colosseum;
    SFX.click();
    if (c.phase === 'prep') setupColosseumFight('fist');
    else if (c.phase === 'fist') setColosseum({...c, phase: 'weapon_select'});
    else if (c.phase === 'weapon_select') setupColosseumFight('weapon');
    else if (c.phase === 'weapon') setupColosseumFight('boss');
    else if (c.phase === 'boss') {
      const reward = c.floor * 800;
      notify(`Floor ${c.floor} conquered! +${reward} Bronze`, "#e0a523");
      setBronze(b => b + reward);
      setColosseum({...c, floor: c.floor + 1, phase: 'prep', losses: 0, opp: null});
    }
  }

  function handleColosseumLoss() {
    SFX.defeat();
    let maxLosses = colosseum.phase === 'boss' ? 3 : 2;
    let newLosses = colosseum.losses + 1;

    if (newLosses >= maxLosses) {
       let newFloor = Math.max(1, colosseum.floor - 1);
       notify(`Defeated ${newLosses} times! Cast down to floor ${newFloor}.`, "#d84838");
       setColosseum({ floor: newFloor, phase: 'prep', losses: 0, opp: null, weaponStyle: null });
    } else {
       notify(`Defeated! ${maxLosses - newLosses} attempts left on this stage.`, "#d84838");
       setColosseum(c => ({...c, losses: newLosses}));
       setupColosseumFight(colosseum.phase); // Starta om samma match
    }
  }

  function colosseumAttack(action) {
    if (colQte) return; // Kan inte attackera under QTE
    
    // 1. Spelarens attack
    if (action.staminaCost && stats.stamina < action.staminaCost) { notify("Not enough stamina.", "#b83a2a"); return; }
    let ns = { ...stats };
    if (action.staminaCost) ns.stamina -= action.staminaCost;

    let dmg = Math.max(1, (action.dmg ? Math.floor(Math.random()*(action.dmg[1]-action.dmg[0]+1))+action.dmg[0] : 10) + getBonusAtk() - colosseum.opp.def);
    
    // Tvinga näv-skada om vi är i fist-phase oavsett utrustning
    if (colosseum.phase === 'fist') dmg = Math.max(1, 5 + Math.floor(Math.random()*10) + physicalLevel - colosseum.opp.def);

    SFX.attack();
    addLog(`You strike for ${dmg} damage.`, "dmg");
    
    let newOppHp = Math.max(0, colosseum.opp.hp - dmg);
    if (newOppHp <= 0) {
      setColosseum(c => ({...c, opp: {...c.opp, hp: 0}}));
      setStats(ns);
      setTimeout(advanceColosseum, 1500);
      return;
    }

    // 2. Fiendens tur & QTE Chans
    let counterChance = 0.15 + (colosseum.floor * 0.05); // Mer QTE på högre våningar
    if (colosseum.phase === 'boss') counterChance += 0.2;

    if (Math.random() < counterChance) {
       addLog(`${colosseum.opp.name} readies a brutal strike! EVADE!`, "lumen");
       const arrows = ["←", "→", "↑", "↓"];
       const seqLength = colosseum.phase === 'boss' ? 4 : 3;
       const seq = Array.from({length: seqLength}, () => arrows[Math.floor(Math.random() * 4)]);
       setColQte({ keys: seq, idx: 0 });
    } else {
       // Normal fiende-attack
       let oppDmg = Math.max(1, colosseum.opp.atk - getBonusDef() + Math.floor(Math.random()*10));
       ns.hp = Math.max(0, ns.hp - oppDmg);
       addLog(`${colosseum.opp.name} hits you for ${oppDmg}.`, "dmg");
       SFX.hit();
       if (ns.hp <= 0) setTimeout(handleColosseumLoss, 1000);
    }
    
    setColosseum(c => ({...c, opp: {...c.opp, hp: newOppHp}}));
    setStats(ns);
  }

  // QTE Lyssnare för Colosseum
  useEffect(() => {
    if (!colQte || screen !== "colosseum") return;
    const h = (e) => {
      let dir;
      if(e.key==="ArrowLeft") dir="←"; else if(e.key==="ArrowRight") dir="→"; else if(e.key==="ArrowUp") dir="↑"; else if(e.key==="ArrowDown") dir="↓";
      if (!dir) return;

      if (dir === colQte.keys[colQte.idx]) {
         if (colQte.idx + 1 >= colQte.keys.length) {
            setColQte(null);
            addLog("Perfect evasion & Counter!", "heal");
            SFX.spell();
            let counterDmg = 40 + (colosseum.floor * 10);
            setColosseum(c => {
               let newHp = Math.max(0, c.opp.hp - counterDmg);
               if(newHp <= 0) setTimeout(advanceColosseum, 1500);
               return {...c, opp: {...c.opp, hp: newHp}};
            });
         } else {
            setColQte(c => ({...c, idx: c.idx + 1}));
            SFX.click();
         }
      } else {
         setColQte(null);
         let dmg = colosseum.opp.atk * 2; // Brutal skada vid miss
         setStats(s => {
           let newHp = Math.max(0, s.hp - dmg);
           if(newHp <= 0) setTimeout(handleColosseumLoss, 1000);
           return {...s, hp: newHp};
         });
         addLog(`QTE Failed! Devastating hit for ${dmg} dmg.`, "dmg");
         SFX.hit();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [colQte, colosseum, screen]);

  function startEndgame(idx){
    setEndgameWave(idx);
    const stars=[3,3,4,4,5];const sn=stars[idx];
    const pool=MONSTERS.filter(m=>m.star===sn||m.star===sn-1);
    const wave=Array.from({length:3},()=>{const b=pool[Math.floor(Math.random()*pool.length)];const sc=1.5+idx*0.2;return{...b,id:b.id+"_"+Math.random(),hp:Math.round(b.hp*sc),maxHp:Math.round(b.hp*sc),atk:Math.round(b.atk*sc),def:b.def};});
    setEndgameMonsters(wave);setCombatResult(null);
    setLog([{msg:`Wave ${idx+1}/5`,type:"sys",id:Date.now()}]);
    setScreen("endgame_combat");
  }
  function recruit(){const cost=120+allies*40;if(bronze<cost){notify("Not enough.","#b83a2a");return;}setBronze(b=>b-cost);setAllies(a=>a+1);notify(`Ally (${allies+1})`,"#3ec995");Math.random()<0.5?SFX.cryM():SFX.cryF();}
  function endAttack(idx){
    const t=[...endgameMonsters];const dmg=Math.max(1,(getBonusAtk()+Math.floor(Math.random()*15)+10)-t[idx].def);t[idx].hp-=dmg;SFX.attack();addLog(`Strike: ${dmg}.`,"dmg");
    let ah=0;for(let i=0;i<allies;i++){const al=t.filter(x=>x.hp>0);if(al.length===0)break;const tg=al[Math.floor(Math.random()*al.length)];const ad=Math.max(1,15+Math.floor(Math.random()*10)-tg.def);tg.hp-=ad;ah+=ad;}
    if(allies>0)addLog(`Allies: ${ah}.`,"info");
    const surv=t.filter(x=>x.hp>0);setEndgameMonsters(t);
    if(surv.length===0){addLog(`Wave ${endgameWave+1} cleared.`,"reward");if(endgameWave>=4)setTimeout(()=>startLumenari(),1200);else setTimeout(()=>startEndgame(endgameWave+1),1200);return;}
    let ns={...stats};surv.forEach(s=>{if(rollDodge())return;const dmg=Math.max(1,Math.floor(Math.random()*15)+10-getBonusDef());ns.hp=Math.max(0,ns.hp-dmg);addLog(`${s.name}: ${dmg}.`,"dmg");});
    if(allies>0&&Math.random()<0.2){setAllies(a=>Math.max(0,a-1));addLog("An ally has fallen.","sys");}
    setStats(ns);if(ns.hp<=0){SFX.defeat();setCombatResult("lose");}
  }

  const LUMEN_HP={1:280,2:320,3:350};const LUMEN_DEF={1:30,2:35,3:42};
  function startLumenari(){SFX.lumen();setLumenari({phaseHp:LUMEN_HP[1],phaseMaxHp:LUMEN_HP[1],def:LUMEN_DEF[1]});setLumenariPhase(1);setLumenCombatPhase("player");setQteActive(false);setGolems([{id:"g0",name:"Golem",hp:120,maxHp:120},{id:"g1",name:"Golem",hp:120,maxHp:120},{id:"g2",name:"Golem",hp:120,maxHp:120}]);setLog([{msg:"The sky cracks open.",type:"lumen",id:Date.now()}]);setCombatResult(null);setScreen("lumenari");}

  function lumenAttack(action){
    if(lumenCombatPhase!=="player"||combatResult||qteActive)return;
    let ns={...stats},nl={...lumenari};
    if(action.staminaCost&&ns.stamina<action.staminaCost){notify("Not enough stamina.","#b83a2a");return;}
    if(action.mpCost&&ns.mp<action.mpCost){notify("Not enough mana.","#b83a2a");return;}
    const raw=action.dmg?Math.floor(Math.random()*(action.dmg[1]-action.dmg[0]+1))+action.dmg[0]:Math.floor(Math.random()*8)+5;
    const dmg=Math.max(1,raw+getBonusAtk()-nl.def);
    if(action.staminaCost)ns.stamina-=action.staminaCost;if(action.mpCost)ns.mp-=action.mpCost;
    nl.phaseHp=Math.max(0,nl.phaseHp-dmg);
    if(allies>0){const ad=allies*(8+Math.floor(Math.random()*6));nl.phaseHp=Math.max(0,nl.phaseHp-ad);addLog(`Allies: ${ad}.`,"info");}
    SFX.attack();addLog(`${action.name}: ${dmg}.`,"dmg");
    setStats(ns);
    if(nl.phaseHp<=0){
      if(lumenariPhase===1){setLumenariPhase(2);nl={phaseHp:LUMEN_HP[2],phaseMaxHp:LUMEN_HP[2],def:LUMEN_DEF[2]};addLog("The Lumenari rises.","lumen");}
      else if(lumenariPhase===2){setLumenariPhase(3);nl={phaseHp:LUMEN_HP[3],phaseMaxHp:LUMEN_HP[3],def:LUMEN_DEF[3]};addLog("Pillars of stone erupt.","lumen");}
      else{
        setLumenari(nl);addLog("The Lumenari shatters.","reward");SFX.victory();stopBoss();setCombatResult("win");setShowVictory(true);
        if(nobleQuestActive) { setBronze(b=>b+20000); notify("Noble Quest Completed: +20 000 B!","#ffd966"); }
        return;
      }
    }
    setLumenari(nl);setLumenCombatPhase("enemy");setTimeout(()=>lumenEnemyTurn(nl,ns),800);
  }
  function lumenEnemyTurn(nl,ps){
    let ns={...ps};
    if(lumenariPhase===1){if(rollDodge()){addLog("Evaded!","heal");}else{const dmg=Math.max(1,32+Math.floor(Math.random()*14)-getBonusDef());ns.hp=Math.max(0,ns.hp-dmg);ns.mp=Math.max(0,ns.mp-15);SFX.hit();addLog(`Lumenari: ${dmg}.`,"dmg");}}
    else if(lumenariPhase===2){addLog("Spears of light rain!","lumen");const seq=Array.from({length:4},()=>["←","→","↑","↓"][Math.floor(Math.random()*4)]);setQteSequence(seq);setQteIdx(0);setQteActive(true);setStats(ns);return;}
    else if(lumenariPhase===3){const al=golems.filter(g=>g.hp>0);if(al.length>0){const td=al.length*(16+Math.floor(Math.random()*8));const dmg=Math.max(1,td-getBonusDef());ns.hp=Math.max(0,ns.hp-dmg);if(dmg>0){addLog(`Golems: ${dmg}.`,"dmg");SFX.hit();}}if(allies>0&&Math.random()<0.3){setAllies(a=>Math.max(0,a-1));addLog("An ally consumed.","sys");}if(Math.random()<0.5){const seq=Array.from({length:3},()=>["←","→","↑","↓"][Math.floor(Math.random()*4)]);setQteSequence(seq);setQteIdx(0);setQteActive(true);setStats(ns);return;}}
    setStats(ns);if(ns.hp<=0){SFX.defeat();setCombatResult("lose");setLumenCombatPhase("result");return;}
    setLumenCombatPhase("player");
  }
  function qteInput(dir){
    if(!qteActive)return;
    if(dir===qteSequence[qteIdx]){
      if(qteIdx+1>=qteSequence.length){setQteActive(false);addLog("Evaded!","heal");SFX.spell();setLumenCombatPhase("player");}
      else setQteIdx(i=>i+1);
    }else{
      setQteActive(false);
      const dmg=Math.max(1,42+Math.floor(Math.random()*15)-getBonusDef());
      setStats(s=>({...s,hp:Math.max(0,s.hp-dmg)}));
      addLog(`Spears: ${dmg}.`,"dmg");SFX.hit();setLumenCombatPhase("player");
    }
  }
  useEffect(()=>{
    if(!qteActive)return;
    const h=(e)=>{if(e.key==="ArrowLeft")qteInput("←");else if(e.key==="ArrowRight")qteInput("→");else if(e.key==="ArrowUp")qteInput("↑");else if(e.key==="ArrowDown")qteInput("↓");};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[qteActive,qteIdx,qteSequence]);
  function attackGolem(idx){if(lumenCombatPhase!=="player"||qteActive)return;const ng=[...golems];const dmg=Math.max(1,getBonusAtk()+Math.floor(Math.random()*12)+8);ng[idx]={...ng[idx],hp:Math.max(0,ng[idx].hp-dmg)};addLog(`Golem ${idx+1}: ${dmg}.`,"dmg");SFX.attack();setGolems(ng);}

  async function continueAfterLumen(){
    setShowVictory(false);setPostDoomsday(true);
    const cleared=doomsdaysCleared+1;setDoomsdaysCleared(cleared);
    const np={...progress,cleared:Math.max(progress.cleared,cleared)};setProgress(np);await saveProg(np);
    setDoomsday(0);setDoomsdayTriggered(false);
    setStats(s=>({...s,hp:s.maxHp,mp:s.maxMp,stamina:s.maxStamina}));
    addLog("The Doomsday is past.","sys");
    setScreen(race?.id==="devil"&&!leftUnderworld?"underworld":"overworld");setTab("map");
  }

  const BG="linear-gradient(160deg,#0a0814 0%,#100e1d 50%,#0d0b1a 100%)";

  // ── Rendering av UI ──────────────────────────────────────────────────────
  const renderGameScreen = () => {
    if(showCutscene)return <div style={{minHeight:"100vh",background:"radial-gradient(circle,#3a0a0a,#000 70%)",display:"flex",alignItems:"center",justifyContent:"center",animation:"shake 0.4s ease infinite"}}><div style={{textAlign:"center",padding:"0 2rem"}}><h1 style={{fontSize:42,fontWeight:800,color:"#e85c3a",letterSpacing:"-0.03em",textShadow:"0 0 30px #e85c3a",marginBottom:14}}>The Doomsday Has Come</h1><p style={{fontSize:15,color:"rgba(255,200,180,0.7)"}}>The earth screams.</p></div></div>;

    if(screen==="main_menu")return (
    <div style={{
      minHeight: "100vh", 
      fontFamily: "var(--font-sans)", 
      position: "relative", 
      overflow: "hidden"
    }}>
      {/* Dynamic Animated Magic Circles Background */}
      <PastoralBG />
      
      <div style={{position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem"}}>
        <div style={{maxWidth: 520, textAlign: "center", width: "100%"}}>
          
          <h1 style={{fontFamily: "Arial, sans-serif", fontSize: 82, fontWeight: 900, color: "#fff", marginBottom: -5, letterSpacing: "0.1em", textShadow: "0 0 40px rgba(255,255,255,0.8), 0 0 100px rgba(255,217,102,0.4)", textTransform: "uppercase"}}>ALERIA</h1>
          
          <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 15, marginBottom: 50}}>
            <div style={{height: 1, width: 40, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5))"}} />
            <p style={{fontFamily: "Arial, sans-serif", fontSize: 18, color: "#fff", letterSpacing: "0.6em", textTransform: "uppercase", fontWeight: 600, margin: 0, textShadow: "0 0 15px rgba(255,255,255,0.6)"}}>CONTRACTOR</p>
            <div style={{height: 1, width: 40, background: "linear-gradient(-90deg, transparent, rgba(255,255,255,0.5))"}} />
          </div>
          
          {progress.cleared > 0 && <p style={{fontSize: 16, color: "#fff", marginBottom: 30, letterSpacing: "0.05em", fontWeight: 600, textShadow: "0 0 10px rgba(0,0,0,0.8)"}}>Doomsdays cleared: {progress.cleared}</p>}
          
          <div style={{display: "flex", flexDirection: "column", gap: 20, width: "320px", margin: "0 auto"}}>
            
            {/* --- GOLDEN "NEW GAME" BUTTON --- */}
            <div 
              onClick={startNewGame} 
              style={{ position: "relative", height: "60px", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"} 
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {/* Main Body */}
              <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(255, 230, 150, 0.9)", boxShadow: "0 0 20px rgba(224, 165, 35, 0.4), inset 0 0 15px rgba(255, 230, 150, 0.5)", background: "linear-gradient(180deg, #fcebaf 0%, #d49830 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: 20, fontWeight: 800, color: "#1a1005", letterSpacing: "0.05em" }}>New Game</span>
              </div>
              {/* Inner Highlight Line */}
              <div style={{ position: "absolute", inset: "4px", border: "1px solid rgba(255, 255, 255, 0.7)", pointerEvents: "none" }} />
              {/* Left Notch */}
              <div style={{ position: "absolute", left: "-7px", top: "50%", transform: "translateY(-50%) rotate(45deg)", width: "14px", height: "14px", background: "#080310", borderRight: "2px solid rgba(255, 230, 150, 0.9)", borderTop: "2px solid rgba(255, 230, 150, 0.9)", zIndex: 2 }} />
              {/* Right Notch */}
              <div style={{ position: "absolute", right: "-7px", top: "50%", transform: "translateY(-50%) rotate(45deg)", width: "14px", height: "14px", background: "#080310", borderLeft: "2px solid rgba(255, 230, 150, 0.9)", borderBottom: "2px solid rgba(255, 230, 150, 0.9)", zIndex: 2 }} />
            </div>
            
            {/* --- PURPLE "LOAD SAVE" BUTTON --- */}
            <div 
              onClick={importSave} 
              style={{ position: "relative", height: "60px", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"} 
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {/* Main Body */}
              <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(160, 150, 220, 0.8)", boxShadow: "0 0 20px rgba(100, 90, 180, 0.4), inset 0 0 15px rgba(160, 150, 220, 0.3)", background: "linear-gradient(180deg, #6c639f 0%, #3b3169 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.05em", textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>Load Save Game</span>
              </div>
              {/* Inner Highlight Line */}
              <div style={{ position: "absolute", inset: "4px", border: "1px solid rgba(255, 255, 255, 0.15)", pointerEvents: "none" }} />
              {/* Left Notch */}
              <div style={{ position: "absolute", left: "-7px", top: "50%", transform: "translateY(-50%) rotate(45deg)", width: "14px", height: "14px", background: "#080310", borderRight: "2px solid rgba(160, 150, 220, 0.8)", borderTop: "2px solid rgba(160, 150, 220, 0.8)", zIndex: 2 }} />
              {/* Right Notch */}
              <div style={{ position: "absolute", right: "-7px", top: "50%", transform: "translateY(-50%) rotate(45deg)", width: "14px", height: "14px", background: "#080310", borderLeft: "2px solid rgba(160, 150, 220, 0.8)", borderBottom: "2px solid rgba(160, 150, 220, 0.8)", zIndex: 2 }} />
            </div>

          </div>

        </div>
      </div>
    </div>
  );

  if(screen==="difficulty") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 650}}>
        
        <div style={{textAlign: "center", marginBottom: 40}}>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", marginBottom: 10}}>Choose your difficulty</h2>
          <p style={{fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600}}>Permanent for this playthrough</p>
        </div>
        
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <div onClick={() => pickDiff({id: "easy", goldMult: 1.5, enemies: 1, perma: false})} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
              <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: 0}}>Easy</h3>
            </div>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0}}>Reduced enemy damage, faster gold. Single enemies.</p>
          </div>

          <div onClick={() => pickDiff({id: "normal", goldMult: 1, enemies: 2, perma: false})} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
              <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: 0}}>Normal</h3>
            </div>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0}}>Standard balance. Two enemies per fight.</p>
          </div>

          <div onClick={() => pickDiff({id: "hard", goldMult: 0.8, enemies: 2, perma: true})} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
              <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: 0}}>Hard</h3>
              <span style={{background: "rgba(184, 58, 42, 0.15)", border: "1px solid rgba(184, 58, 42, 0.5)", color: "#e85c3a", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.05em"}}>PERMADEATH</span>
            </div>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0}}>Less gold, tougher enemies, two per fight. Permadeath.</p>
          </div>

          <div onClick={() => { if(progress.cleared > 0) pickDiff({id: "insanity", goldMult: 0.5, enemies: 3, perma: true}); }} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: progress.cleared > 0 ? "pointer" : "not-allowed", opacity: progress.cleared > 0 ? 1 : 0.5, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { if(progress.cleared > 0) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; } }} onMouseOut={(e) => { if(progress.cleared > 0) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; } }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
              <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: 0}}>Insanity</h3>
              <span style={{background: "rgba(184, 58, 42, 0.15)", border: "1px solid rgba(184, 58, 42, 0.5)", color: "#e85c3a", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.05em"}}>PERMADEATH</span>
            </div>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0}}>Three enemies, much harder. Permadeath. Defeat the Lumenari to unlock.</p>
          </div>
        </div>
        
        <div style={{textAlign: "center", marginTop: 30}}>
          <button onClick={() => { if(window.SFX && window.SFX.menuBack) window.SFX.menuBack(); setScreen("main_menu"); }} style={{background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: "10px", transition: "color 0.2s"}} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}>
            ← Back
          </button>
        </div>

      </div>
    </div>
  );

  if(screen==="race") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 1000}}>
        
        <div style={{textAlign: "center", marginBottom: 40}}>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", marginBottom: 10}}>Choose your race</h2>
          <p style={{fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600}}>DIFFICULTY</p>
        </div>
        
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20}}>
          
          <div onClick={() => pickRace(RACES.find(r=>r.id==="human"))} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px 0"}}>Human</h3>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 8px 0"}}>Versatile.</p>
            <p style={{fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "0 0 16px 0", flex: 1}}>A blank slate.</p>
          </div>

          <div onClick={() => pickRace(RACES.find(r=>r.id==="equar"))} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px 0"}}>Equar</h3>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 8px 0"}}>Small, sharp, fast.</p>
            <p style={{fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "0 0 16px 0", flex: 1}}>Reflexes second to none. Merchants.</p>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
              <span style={{background: "rgba(224, 165, 35, 0.15)", border: "1px solid rgba(224, 165, 35, 0.5)", color: "#e0a523", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+2 ATK</span>
              <span style={{background: "rgba(62, 201, 149, 0.15)", border: "1px solid rgba(62, 201, 149, 0.5)", color: "#3ec995", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>28% Dodge</span>
              <span style={{background: "rgba(255, 217, 102, 0.15)", border: "1px solid rgba(255, 217, 102, 0.5)", color: "#ffd966", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>Merchant</span>
            </div>
          </div>

          <div onClick={() => pickRace(RACES.find(r=>r.id==="tetrabrachian"))} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px 0"}}>Tetrabrachian</h3>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 8px 0"}}>Four-armed and powerfully built.</p>
            <p style={{fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "0 0 16px 0", flex: 1}}>Wields two weapons.</p>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
              <span style={{background: "rgba(184, 58, 42, 0.15)", border: "1px solid rgba(184, 58, 42, 0.5)", color: "#e85c3a", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+15 HP</span>
              <span style={{background: "rgba(224, 165, 35, 0.15)", border: "1px solid rgba(224, 165, 35, 0.5)", color: "#e0a523", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+3 ATK</span>
              <span style={{background: "rgba(123, 111, 228, 0.15)", border: "1px solid rgba(123, 111, 228, 0.5)", color: "#7b6fe4", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+1 DEF</span>
            </div>
          </div>

          <div onClick={() => pickRace(RACES.find(r=>r.id==="tenebrim"))} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px 0"}}>Tenebrim</h3>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 8px 0"}}>A shadow-touched race.</p>
            <p style={{fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "0 0 16px 0", flex: 1}}>Physically imposing, but incapable of casting normal spells.</p>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
              <span style={{background: "rgba(184, 58, 42, 0.15)", border: "1px solid rgba(184, 58, 42, 0.5)", color: "#e85c3a", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+25 HP</span>
              <span style={{background: "rgba(224, 165, 35, 0.15)", border: "1px solid rgba(224, 165, 35, 0.5)", color: "#e0a523", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+5 ATK</span>
              <span style={{background: "rgba(123, 111, 228, 0.15)", border: "1px solid rgba(123, 111, 228, 0.5)", color: "#7b6fe4", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+2 DEF</span>
            </div>
          </div>

          <div onClick={() => pickRace(RACES.find(r=>r.id==="devil"))} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px 0"}}>Devil</h3>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 8px 0"}}>Starts in the Underworld.</p>
            <p style={{fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "0 0 16px 0", flex: 1}}>Innate elemental spells.</p>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
              <span style={{background: "rgba(184, 58, 42, 0.15)", border: "1px solid rgba(184, 58, 42, 0.5)", color: "#e85c3a", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+5 HP</span>
              <span style={{background: "rgba(224, 165, 35, 0.15)", border: "1px solid rgba(224, 165, 35, 0.5)", color: "#e0a523", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+2 ATK</span>
              <span style={{background: "rgba(168, 157, 240, 0.15)", border: "1px solid rgba(168, 157, 240, 0.5)", color: "#a89df0", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700}}>+40 MP</span>
            </div>
          </div>

          {/* THE ONLY ELF CARD WE NEED! */}
          <div onClick={() => {
            const elfData = RACES.find(r=>r.id==="elf");
            pickRace({...elfData, locked: false}); 
          }} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(135, 206, 250, 0.4)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(135, 206, 250, 0.9)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(135,206,250,0.3)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(135, 206, 250, 0.4)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12}}>
              <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: 0}}>Elf</h3>
              <span style={{color: "#87cefa", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", background: "rgba(135,206,250,0.15)", padding: "2px 6px", borderRadius: 4}}>DEV UNLOCKED</span>
            </div>
            <p style={{fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 8px 0"}}>A harsh Frostpunk-style survival scenario.</p>
            <p style={{fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "0 0 16px 0", flex: 1}}>Unique technology and survival mechanics.</p>
          </div>

        </div>
        
        <div style={{textAlign: "center", marginTop: 40}}>
          <button onClick={() => { if(window.SFX && window.SFX.menuBack) window.SFX.menuBack(); setScreen("difficulty"); }} style={{background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: "10px", transition: "color 0.2s"}} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}>
            ← Back
          </button>
        </div>

      </div>
    </div>
  );

if(showVictory)return <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0530,#3a0a4a,#1a0530)",fontFamily:"var(--font-sans)"}}><Confetti/><div style={{position:"relative",zIndex:60,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem 1.5rem"}}>
    <div style={{maxWidth:560,textAlign:"center",background:"rgba(0,0,0,0.55)",padding:"40px 32px",borderRadius:18,border:"2px solid #ffd966",boxShadow:"0 0 60px rgba(255,217,102,0.5)",backdropFilter:"blur(10px)"}}>
      <h1 className="gradient-text" style={{fontSize:42,fontWeight:900,marginBottom:16,letterSpacing:"-0.03em"}}>VICTORY</h1>
      <p style={{fontSize:16,color:"#fff",marginBottom:8,fontWeight:600}}>The Lumenari has fallen.</p>
      <p style={{fontSize:13,color:"rgba(255,217,200,0.65)",lineHeight:1.7,marginBottom:30}}>Aleria breathes again.</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Btn variant="gold" full onClick={continueAfterLumen}>Continue this life ↗</Btn>
        <Btn variant="primary" full onClick={startNewGame}>Start over with a new race</Btn>
        <Btn variant="ghost" full onClick={()=>{exportSave();returnToMenu();}}>Save & return to menu</Btn>
      </div>
    </div>
  </div></div>;

if (screen === "elf_scenario") {
    return <ElfScenario setScreen={setScreen} notify={notify} exportSave={exportSave} stats={stats} setStats={setStats} />;
  }

  if(screen==="devil_intro")return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a0a14,#0f0e1c)",padding:"2.5rem 1.5rem"}}><div style={{maxWidth:560,margin:"0 auto"}}>
    <Tag color="#a8740c">Devil · Underworld</Tag>
    <h2 style={{fontSize:22,fontWeight:700,color:"#e8c878",margin:"14px 0 10px"}}>Siphoning Station — Sector Three</h2>
    <p style={{fontSize:14,lineHeight:1.9,color:"rgba(232,200,120,0.65)",marginBottom:32,whiteSpace:"pre-line"}}>The station smells of mineral heat. Mana concentrations are creeping past safe levels.{"\n\n"}You've never seen the surface.</p>
    <Btn variant="amber" onClick={beginUnderworld}>Begin shift ↗</Btn>
  </div></div>;
  
  if(screen==="devil_class") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 650}}>
        <div style={{textAlign: "center", marginBottom: 40}}>
          <Tag color="#e85c3a" style={{marginBottom: 10}}>Devil · Surface</Tag>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", margin: "10px 0"}}>Choose a path</h2>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          {CLASSES.filter(c => c.id !== "merchant" || race?.canMerchant).map(c=>(
            <div key={c.id} onClick={()=>{setCls(c);setScreen("overworld");setTab("map");}} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(232, 92, 58, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(232, 92, 58, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(232,92,58,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(232, 92, 58, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12}}>
                <h3 style={{fontSize: 22, fontWeight: 800, color: "#fff", margin: 0}}>{c.name}</h3>
                <span style={{color: "rgba(232, 92, 58, 0.6)", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase"}}>{c.org}</span>
              </div>
              <p style={{fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6}}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- NEW SCREEN: Tenebrim Origin Choice ---
  if(screen==="ten_origin") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 650}}>
        <div style={{textAlign: "center", marginBottom: 40}}>
          <Tag color="#a89df0" style={{marginBottom: 10}}>Tenebrim</Tag>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", margin: "10px 0"}}>Choose your origin</h2>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          
          <div onClick={() => { if(window.SFX && window.SFX.menuSelect) window.SFX.menuSelect(); setTenebrimStart("slave"); setScreen("ten_slave"); }} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(184, 58, 42, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(184, 58, 42, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(184,58,42,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(184, 58, 42, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <p style={{fontWeight:800,fontSize:20,color:"#fff",margin:"0 0 8px 0"}}>Slave in Elysandria</p>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",margin:0,lineHeight:1.6}}>Sold before you understood. You must survive hard labor and find a window to escape.</p>
          </div>
          
          <div onClick={() => { if(window.SFX && window.SFX.menuSelect) window.SFX.menuSelect(); setTenebrimStart("tribe"); setScreen("ten_tribe"); }} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(62, 201, 149, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(62, 201, 149, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(62,201,149,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(62, 201, 149, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
            <p style={{fontWeight:800,fontSize:20,color:"#fff",margin:"0 0 8px 0"}}>Free Tribe in Menfor</p>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",margin:0,lineHeight:1.6}}>You grew up among your own in the forest encampment. You choose to walk away and wander.</p>
          </div>

        </div>
        <div style={{textAlign: "center", marginTop: 40}}>
          <button onClick={() => { if(window.SFX && window.SFX.menuBack) window.SFX.menuBack(); setScreen("race"); }} style={{background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: "10px", transition: "color 0.2s"}} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );

  if(screen==="ten_slave") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 500}}>
        <div style={{textAlign: "center", marginBottom: 40}}>
          <Tag color="#b83a2a" style={{marginBottom: 10}}>Tenebrim · Slave</Tag>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", margin: "10px 0"}}>Lower Estate</h2>
          <p style={{fontSize: 16, color: "rgba(232,192,176,0.8)", lineHeight: 1.7}}>Sold before you understood. {escapeReady?"An opportunity has appeared.":""}</p>
        </div>
        
        <div style={{display: "flex", flexDirection: "column", gap: 20}}>
          {!slaveTask&&!escapeReady&&<Btn variant="danger" full onClick={startSlaveWork}>Begin labor</Btn>}
          
          {slaveTask&&!escapeReady&&<div style={{ background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(184, 58, 42, 0.4)", borderRadius: 12, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            <p style={{fontSize:13, color: "rgba(255,255,255,0.5)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700}}>Day {slaveDay+1}/3</p>
            <p style={{fontWeight:800, fontSize:22, color:"#fff", marginBottom:16}}>{slaveTask}</p>
            <Bar val={slaveProgress} max={100} color="#b83a2a" h={12} />
            <div style={{marginTop:24}}><Btn variant="danger" full onClick={doSlaveWork}>Work</Btn></div>
          </div>}
          
          {escapeReady&&<div style={{ background: "linear-gradient(180deg, rgba(40,30,10,0.9) 0%, rgba(20,15,5,0.95) 100%)", border: "1px solid rgba(224, 165, 35, 0.6)", borderRadius: 12, padding: "24px", boxShadow: "0 0 30px rgba(224, 165, 35, 0.2)" }}>
            <p style={{fontWeight:800, fontSize:22, color:"#e0a523", marginBottom:16, textAlign: "center"}}>Escape window</p>
            <Btn variant="gold" full onClick={doEscape}>Run</Btn>
          </div>}
        </div>
      </div>
    </div>
  );
  
  if(screen==="ten_tribe") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 500}}>
        <div style={{textAlign: "center", marginBottom: 40}}>
          <Tag color="#3ec995" style={{marginBottom: 10}}>Tenebrim · Menfor Tribe</Tag>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", margin: "10px 0"}}>Forest Encampment</h2>
          <p style={{fontSize: 16, color: "rgba(192,232,208,0.8)", lineHeight: 1.7}}>You grew up among your own. You've decided to leave.</p>
        </div>
        <Btn variant="success" full onClick={()=>{if(window.SFX && window.SFX.menuSelect) window.SFX.menuSelect(); setCls({id:"wanderer",name:"Wanderer",org:"Self-trained"});setScreen("intro_ten");}}>Leave the tribe ↗</Btn>
      </div>
    </div>
  );
  
  if(screen==="intro_ten") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 600, textAlign: "center"}}>
        <div style={{display:"flex", gap:8, justifyContent:"center", marginBottom:20}}>
          <Tag color="#b83a2a">Tenebrim</Tag>
          <Tag color="#e0a523">Wanderer</Tag>
        </div>
        <p style={{fontSize: 18, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 40}}>The wilds are quiet. You'll train alone. No guild.</p>
        <Btn variant="primary" onClick={beginGame}>Begin</Btn>
      </div>
    </div>
  );

  if(screen==="origin") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      <PastoralBG />
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 650}}>
        <div style={{textAlign: "center", marginBottom: 40}}>
          <Tag color="#7b6fe4" style={{marginBottom: 10}}>{race?.name}</Tag>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", margin: "10px 0"}}>Where are you coming from?</h2>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          {ORIGINS.map(o=>(
            <div key={o.id} onClick={() => pickOrigin(o)} style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.3)", borderRadius: 12, padding: "24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.8)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(123,111,228,0.2)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.border = "1px solid rgba(123, 111, 228, 0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}>
              <p style={{fontWeight:800,fontSize:20,color:"#fff",margin:"0 0 8px 0"}}>{o.name}</p>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",margin:0,lineHeight:1.6}}>{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

    
  if(screen==="class") return (
    <div style={{minHeight: "100vh", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem"}}>
      {/* Animated Background */}
      <PastoralBG />
      
      <div style={{position: "relative", zIndex: 10, width: "100%", maxWidth: 800}}>
        
        {/* Header Section */}
        <div style={{textAlign: "center", marginBottom: 40}}>
          <Tag color={race?.id==="human"?"#7b6fe4":"#a89df0"} style={{marginBottom: 10}}>{race?.name || "Human"}</Tag>
          <h2 style={{fontSize: 42, fontWeight: 900, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.5)", margin: "10px 0"}}>Choose your path</h2>
          <p style={{fontSize: 14, color: "#e85c3a", fontWeight: 800, letterSpacing: "0.1em"}}>Permanent.</p>
        </div>
        
        {/* Class Cards Container */}
        <div style={{display: "flex", flexDirection: "column", gap: 24}}>
          
          {/* --- ADVENTURER'S GUILD --- */}
          <div style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(224, 165, 35, 0.4)", borderRadius: 12, display: "flex", alignItems: "stretch", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }}>
            
            {/* HÄR ÄR FIXEN: Vi använder pickClass() istället för setScreen("origin") */}
            <div 
              onClick={() => pickClass(CLASSES.find(c=>c.id==="adventurer"))}
              style={{ flex: 1, padding: "24px", cursor: "pointer" }}
              onMouseOver={(e) => { e.currentTarget.parentElement.style.transform = "scale(1.02)"; e.currentTarget.parentElement.style.border = "1px solid rgba(224, 165, 35, 0.9)"; e.currentTarget.parentElement.style.boxShadow = "0 0 30px rgba(224,165,35,0.2)"; }}
              onMouseOut={(e) => { e.currentTarget.parentElement.style.transform = "scale(1)"; e.currentTarget.parentElement.style.border = "1px solid rgba(224, 165, 35, 0.4)"; e.currentTarget.parentElement.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
            >
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12}}>
                <h3 style={{fontSize: 26, fontWeight: 800, color: "#fff", margin: 0}}>Adventurer</h3>
                <span style={{color: "rgba(224, 165, 35, 0.6)", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase"}}>Adventurer's Guild</span>
              </div>
              <p style={{fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0}}>Bronze to Platinum ranking. Earnings and prestige scale with rank. Diverse contracts.</p>
            </div>

            {/* Info Box Button */}
            <div 
              onClick={() => setShowLore("adventurer")}
              style={{ width: "60px", borderLeft: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.03)", borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(224,165,35,0.15)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <div style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", fontWeight: "bold", fontFamily: "serif" }}>i</div>
            </div>
          </div>

          {/* --- HUNTER ASSOCIATION --- */}
          <div style={{ position: "relative", background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", border: "1px solid rgba(123, 111, 228, 0.4)", borderRadius: 12, display: "flex", alignItems: "stretch", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s" }}>
            
            {/* HÄR ÄR FIXEN: Vi använder pickClass() istället för setScreen("origin") */}
            <div 
              onClick={() => pickClass(CLASSES.find(c=>c.id==="hunter"))}
              style={{ flex: 1, padding: "24px", cursor: "pointer" }}
              onMouseOver={(e) => { e.currentTarget.parentElement.style.transform = "scale(1.02)"; e.currentTarget.parentElement.style.border = "1px solid rgba(123, 111, 228, 0.9)"; e.currentTarget.parentElement.style.boxShadow = "0 0 30px rgba(123,111,228,0.2)"; }}
              onMouseOut={(e) => { e.currentTarget.parentElement.style.transform = "scale(1)"; e.currentTarget.parentElement.style.border = "1px solid rgba(123, 111, 228, 0.4)"; e.currentTarget.parentElement.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
            >
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12}}>
                <h3 style={{fontSize: 26, fontWeight: 800, color: "#fff", margin: 0}}>Hunter</h3>
                <span style={{color: "rgba(123, 111, 228, 0.6)", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase"}}>Hunter Association</span>
              </div>
              <p style={{fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0}}>Better flat pay. Specialized extermination. Star-based threat qualification. No inactivity rules.</p>
            </div>

            {/* Info Box Button */}
            <div 
              onClick={() => setShowLore("hunter")}
              style={{ width: "60px", borderLeft: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.03)", borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(123,111,228,0.15)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <div style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", fontWeight: "bold", fontFamily: "serif" }}>i</div>
            </div>
          </div>

        </div>
        
        {/* Back Button FIX: Vi skickar dig tillbaka till origin istället för race */}
        <div style={{textAlign: "center", marginTop: 40}}>
          <button onClick={() => { if(window.SFX && window.SFX.menuBack) window.SFX.menuBack(); setScreen("origin"); }} style={{background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: "10px", transition: "color 0.2s"}} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}>
            ← Back
          </button>
        </div>

      </div>

      {/* --- LORE MODAL OVERLAY --- */}
      {showLore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ background: "#13091c", border: `1px solid ${showLore === "adventurer" ? "#e0a523" : "#7b6fe4"}`, borderRadius: 12, padding: "30px", maxWidth: 700, maxHeight: "80vh", overflowY: "auto", position: "relative", boxShadow: `0 10px 40px rgba(0,0,0,0.8)` }}>
            
            <button onClick={() => setShowLore(null)} style={{ position: "absolute", top: 15, right: 15, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 24, cursor: "pointer" }}>✕</button>
            
            <h2 style={{ color: showLore === "adventurer" ? "#e0a523" : "#7b6fe4", marginTop: 0, marginBottom: 20 }}>{showLore === "adventurer" ? "The Adventurer's Guild" : "The Hunter Association"}</h2>
            
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
              {showLore === "hunter" ? (
                `The Hunter Association is the older of the two major combat-for-hire organizations, predating the Adventurer Guild by decades. It did not begin as an institution. Monster hunting was originally one job among many that mercenaries took alongside bodyguard work, debt collection, and general contract killing. As Doomsdays made monsters increasingly dangerous and frequent, demand for specialized fighters grew steadily until one person recognized it as a dedicated trade and built a business around it. That was the origin of the Hunter.\n\nHunters are specialized exterminators. They take only beast and monster contracts — no gathering, no escorts, no exploration. The work is bounty-based, and the culture it produced never shed its mercenary roots. Hunters do not pursue rank or public recognition. Their offices are small, functional, and often visibly worn. Nobody there is trying to impress anyone who walks through the door.\n\nHunters are ranked on a 1 to 5 Star scale based on the threat level they are qualified to face:\n• Star-1 Hunters can handle Star-1 to Star-2 threats.\n• Star-2 Hunters can handle multiple Star-1 to Star-2 threats, including a singular Star-3.\n• Star-3 Hunters can handle multiple Star-1 to Star-3 threats, including a singular Star-4.\n• Star-4 Hunters can handle multiple Star-1 to Star-4 threats, including a limited number of Star-5 threats.\n• Star-5 Hunters can handle most threat levels with relative competence, though Star-6 threats remain either unmanageable or extremely dangerous, and Star-7 threats are effectively outside the scope of any Hunter.\n\nThis scale is a qualification system, not a prestige ladder. It tells you what a Hunter is cleared to take on, nothing more.\n\nIn most regions, the Hunter Association holds legal priority on monster contracts. When a beast needs killing, hunters get first claim regardless of how large or well-funded the local Adventurer Guild is. This is one of the few areas where the older organization retained hard leverage when the guild arrived, and in practice it means that Star-3 and above contracts are almost exclusively Hunter territory. An adventurer who takes a high-Star hunt without authorization faces serious guild penalties, and the Association has enough institutional weight in most regions to enforce that.`
              ) : (
                `The Adventurer Guild was introduced by a summoned hero who modeled it on concepts from his home world. Where the Hunter Association grew from necessity, the guild was designed from the top down — with ranked classifications, formal structures, and a degree of ceremony that hunters tend to find pointless. Guild offices are larger and more elaborate, often among the more prominent buildings in a settlement.\n\nUnlike hunters, adventurers are generalists. They take escort contracts, gathering requests, dungeon expeditions, and lower-tier monster hunts. The range of available work makes the guild more accessible and more appealing to people who want steady income without specializing entirely in killing dangerous things.\n\nAdventurers are ranked in a tiered system using the names of local metals: Bronze, Iron, Silver, Gold, Diamond, and Platinum, from lowest to highest. Higher ranks grant access to better-paying contracts, more prestigious jobs, and exclusive guild resources. Rank is the point, for most members — it represents security, standing, and opportunity.\n\n---\n\nThe Divide\nHolding membership in both organizations simultaneously is effectively prohibited. The enforcement varies by region — some places have formal legal barriers, others simply make dual registration nearly impossible through institutional pressure — but the outcome is the same almost everywhere. You are one or the other.\n\nThe two organizations coexist in separate lanes with a quiet mutual contempt running underneath. Hunters regard adventurers as people who dressed a profession up in ceremony it never needed. Adventurers tend to view the Association as underfunded, unglamorous, and too stubborn to modernize. Neither is entirely wrong about the other.`
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
  
  if(screen==="intro"){const txt={traveler:"The contract board outside the guild smells of old rain.",youth:"The road from home took four days."};return <div style={{minHeight:"100vh",background:BG,padding:"3rem 1.5rem"}}><div style={{maxWidth:560,margin:"0 auto"}}>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}><Tag color="#5b4fd4">{race?.name}</Tag>{origin&&<Tag color="#7c6fd4">{origin.name}</Tag>}{cls&&<Tag color="#3ec995">{cls.name}</Tag>}</div>
    <p style={{fontSize:14,lineHeight:1.95,color:"rgba(220,215,255,0.75)",marginBottom:32}}>{txt[origin?.id]||""}</p>
    <Btn variant="primary" onClick={beginGame}>Begin</Btn>
  </div></div>;}

  if(screen==="siphon")return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#080810,#0d0c18)"}}><div style={{background:"rgba(0,0,0,0.5)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"10px 16px",display:"flex",alignItems:"center",gap:14}}>
    <span style={{fontWeight:700,fontSize:14,color:"#a89df0"}}>Siphoning</span>
    <span style={{fontSize:12,marginLeft:"auto"}}>Time: {siphonTime}s</span>
    <span style={{fontSize:12,color:"#e0a523"}}>Score: {siphonScore}</span>
    {siphonActive&&<Btn small variant="ghost" onClick={leaveSiphon}>Leave</Btn>}
  </div><div style={{maxWidth:600,margin:"0 auto",padding:18}}>
    {!siphonResult?<><p style={{fontSize:12,color:"rgba(200,192,248,0.45)",marginBottom:18}}>Click nodes before they overflow.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {siphonNodes.map(n=>{const pct=Math.round(n.level);const col=n.level>80?"#e85c3a":n.level>55?"#e0a523":"#a89df0";return <div key={n.id} onClick={()=>tapNode(n.id)} style={{cursor:"pointer",padding:"18px 14px",borderRadius:12,border:`2px solid ${col}${n.danger?"":"55"}`,background:`${col}11`,textAlign:"center",animation:n.danger?"pulse 0.55s ease infinite alternate":undefined}}>
          <div style={{height:90,display:"flex",alignItems:"flex-end",justifyContent:"center",marginBottom:10}}><div style={{width:32,borderRadius:"4px 4px 0 0",background:col,height:`${pct}%`,maxHeight:90,minHeight:4,boxShadow:`0 0 16px ${col}88`}}/></div>
          <p style={{fontSize:13,fontWeight:700,color:col}}>{pct}%</p>
        </div>;})}
      </div></>:<Panel style={{marginTop:20}}><p style={{fontWeight:700,fontSize:16,color:"#c8c0f8",marginBottom:8}}>Shift complete</p><div style={{display:"flex",gap:10}}><Btn variant="primary" onClick={leaveSiphon}>Continue</Btn><Btn variant="ghost" onClick={startSiphon}>Run another</Btn></div></Panel>}
  </div></div>;

  // ── Overworld + Underworld shared shell ───────────────────────────────
  const isOver=["overworld","shop","spells","skills","church","guild","sleep","craft","gamble", "training", "endgame", "tenebrim_survival"].includes(screen);
if (race?.id === "elf") {
  return <ElfScenario setScreen={setScreen} notify={notify} exportSave={exportSave} stats={stats} setStats={setStats} />;
}
  const isUw=screen==="underworld";
  if(isOver||isUw){
    const dd=doomsday;const ddPct=Math.round((dd/10)*100);const ddCol=dd<4?"#3ec995":dd<7?"#e0a523":"#e85c3a";
    const housingOpt=SLEEP.find(o=>o.id===housing);
    
    const tabs=isUw?[{id:"map",label:"Map"},{id:"shop",label:"Shop"},{id:"spells",label:"Spells"},{id:"city",label:"City"}]:(
      race?.id === "tenebrim" ? [
        {id:"tenebrim_survival", label:"The Wilds"},
        {id:"training", label:"Physical Training"}
      ] : [
        {id:"overworld",label:"Map"},{id:"shop",label:"Shop"},{id:"sleep",label:"Sleep"},
        ...(race?.canSpell?[{id:"spells",label:"Spells"}]:[]),
        {id:"skills",label:"Skills"},
        ...(race?.id !== "tenebrim" ? [{id:"church",label:"Church"}] : []),
        ...(cls?.id==="adventurer"?[{id:"guild",label:"Guild"}]:[]),
        ...((cls?.id==="merchant"||(postDoomsday&&race?.canMerchant))?[{id:"craft",label:"Craft"}]:[]),
        ...((postDoomsday||race?.canGamble||race?.canMerchant||race?.id==="equar")?[{id:"gamble",label:"Gamble"}]:[]),
        ...(postDoomsday?[{id:"endgame",label:"Endgame"}]:[])
      ]
    );
    return <div style={{minHeight:"100vh",background:isUw?"linear-gradient(160deg,#0a0a14,#0f0e1c)":BG,fontFamily:"var(--font-sans)"}}>
      {notif&&<div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",zIndex:200,background:notif.color,color:"#fff",padding:"8px 22px",borderRadius:99,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,0.5)",animation:"notifIn 0.2s",whiteSpace:"nowrap"}}>{notif.msg}</div>}
      <div style={{background:"linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.3))",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"11px 16px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",backdropFilter:"blur(10px)"}}>
        <span style={{fontWeight:900,fontSize:16,color:isUw?"#e8c878":"#d4cbf8",letterSpacing:"0.05em",textShadow:"0 2px 10px rgba(0,0,0,0.5)"}}>{isUw?"UNDERWORLD":"ALERIA"}</span>
        <div style={{flex:1,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginLeft:10}}>
          {[
            { l:"HP", v:stats.hp, m:stats.maxHp+(cityLevel?.walls*5 || 0), c:"#e85c3a" },
            ...(race?.canSpell ? [{ l:"MP", v:stats.mp, m:stats.maxMp+(cityLevel?.pump*5 || 0), c:"#a89df0" }] : []),
            { l:"STA", v:stats.stamina, m:stats.maxStamina, c:"#3ec995" }
          ].map(b=>(
            <div key={b.l} style={{display:"flex",flexDirection:"column",gap:4,minWidth:130, background:"rgba(0,0,0,0.4)", padding:"6px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.06)", boxShadow:`0 2px 12px ${b.c}15`}}>
              <div style={{display:"flex",justifyContent:"space-between", alignItems:"baseline"}}>
                <span style={{fontSize:11,fontWeight:800,color:b.c,letterSpacing:"0.05em"}}>{b.l}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>{b.v} <span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>/ {b.m}</span></span>
              </div>
              <Bar val={b.v} max={b.m} color={b.c} h={7}/>
            </div>
          ))}
          
          {!postDoomsday&&race?.id!=="tenebrim"&&<div style={{display:"flex",flexDirection:"column",gap:4,minWidth:130, background:"rgba(0,0,0,0.4)", padding:"6px 12px", borderRadius:8, border:`1px solid ${ddCol}40`, boxShadow:`0 2px 12px ${ddCol}20`}}>
            <div style={{display:"flex",justifyContent:"space-between", alignItems:"baseline"}}>
              <span style={{fontSize:11,fontWeight:800,color:ddCol,letterSpacing:"0.05em"}}>DOOM</span>
              <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>{ddPct}%</span>
            </div>
            <Bar val={dd} max={10} color={ddCol} h={7}/>
          </div>}
          {postDoomsday&&<Tag color="#3ec995" glow>Freeplay</Tag>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",fontSize:11,color:"rgba(200,192,248,0.5)",flexWrap:"wrap"}}>
          <span>Day {day}</span>
          {/* NY LOGIK: Visa fysisk nivå om rasen saknar magi */}
          {!race?.canSpell && physicalLevel > 0 && <Tag color="#e0a523">Phys Lvl {physicalLevel}</Tag>}
          {isUw&&<Tag color="#e0a523">Rep {devilRep}/8</Tag>}
          {!isUw&&<><span>{xp} XP</span>{cls?.id==="adventurer"&&hasBadge&&<Tag color="#e0a523">{RANKS[advRankIdx]}</Tag>}{cls?.id==="hunter"&&<Tag color="#7c6fd4">★{hunterStars} Hunter</Tag>}</>}
          <Btn small variant="ghost" onClick={exportSave}>Save Game</Btn>
          <Btn small variant="ghost" onClick={returnToMenu}>Menu</Btn>
        </div>
      </div>
      <div style={{padding:"6px 12px",background:"rgba(0,0,0,0.25)"}}><CoinBar bronze={bronze}/></div>
      <div style={{display:"flex", gap:10, padding:"0 20px", background:"linear-gradient(180deg, rgba(20,10,30,0.8) 0%, rgba(10,5,15,0.9) 100%)", borderBottom:"1px solid rgba(123, 111, 228, 0.2)", boxShadow:"0 4px 15px rgba(0,0,0,0.5)", overflowX:"auto"}}>
        {tabs.map(t=>{
          const isActive = (isUw ? tab===t.id : screen===t.id);
          return (
            <div key={t.id} onClick={()=>{SFX.click();if(isUw){setTab(t.id);}else{setScreen(t.id);setTab(t.id);}}} style={{
              padding:"12px 20px", cursor:"pointer", fontWeight:800, fontSize:13, letterSpacing:"0.05em", textTransform:"uppercase",
              color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
              borderBottom: isActive ? "3px solid #e0a523" : "3px solid transparent",
              background: isActive ? "linear-gradient(0deg, rgba(224,165,35,0.15) 0%, transparent 100%)" : "transparent",
              textShadow: isActive ? "0 0 10px rgba(224,165,35,0.8)" : "none",
              transition:"all 0.2s ease",
              whiteSpace:"nowrap"
            }}
            onMouseOver={(e)=> { if(!isActive) e.target.style.color="#fff"; }}
            onMouseOut={(e)=> { if(!isActive) e.target.style.color="rgba(255,255,255,0.4)"; }}
            >
              {t.label}
            </div>
          )
        })}
      </div>
      <div style={{padding:"16px",maxWidth:780,margin:"0 auto"}}>
        {/* Underworld map tab */}
        {isUw&&tab==="map"&&<div>
          {nobleInvite&&<Panel style={{marginBottom:14,borderColor:"rgba(232,185,56,0.5)",background:"linear-gradient(180deg,rgba(232,185,56,0.12),rgba(232,185,56,0.02))"}}>
            <p style={{fontWeight:700,fontSize:14,color:"#e8c878",marginBottom:6}}>A noble's invitation</p>
            <p style={{fontSize:12,color:"rgba(232,200,120,0.65)",lineHeight:1.65,marginBottom:14}}>A surface noble has heard of your work. Permanent move.</p>
            <div style={{display:"flex",gap:8}}><Btn variant="amber" onClick={acceptInvite}>Accept ↗</Btn><Btn variant="ghost" onClick={declineInvite}>Decline</Btn></div>
          </Panel>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10}}>
            <Panel onClick={startSiphon}><p style={{fontWeight:600,fontSize:13,color:"#a89df0",marginBottom:4}}>Siphoning</p><p style={{fontSize:11,color:"rgba(200,192,248,0.5)",marginBottom:8}}>Manage mana nodes.</p><Btn small variant="primary" onClick={startSiphon}>Start ↗</Btn></Panel>
            <Panel onClick={()=>startCombat(true)}><p style={{fontWeight:600,fontSize:13,color:"#e85c3a",marginBottom:4}}>Hunt monsters</p><p style={{fontSize:11,color:"rgba(200,192,248,0.5)",marginBottom:8}}>{declinedInvite?"Threats heavier.":"Cull threats."}</p><Btn small variant="danger" onClick={()=>startCombat(true)}>Hunt ↗</Btn></Panel>
            <Panel><p style={{fontWeight:600,fontSize:13,color:"#3ec995",marginBottom:4}}>Sleep</p><p style={{fontSize:11,color:"rgba(200,192,248,0.5)",marginBottom:8}}>Rest in your quarters.</p><Btn small variant="success" onClick={()=>{const opt=SLEEP[1];setStats(s=>({...s,hp:Math.min(s.maxHp,s.hp+Math.round(s.maxHp*opt.hpRec)),mp:Math.min(s.maxMp,s.mp+Math.round(s.maxMp*opt.mpRec)),stamina:Math.min(s.maxStamina,s.stamina+Math.round(s.maxStamina*opt.staRec))}));setSpellStudiedToday({});setDay(d=>d+1);if(!postDoomsday)setDoomsday(d=>Math.min(10,d+0.25)); if(window.SFX && window.SFX.sleep) window.SFX.sleep();}}>Sleep</Btn></Panel>
          </div>
          {potions.length>0&&<Panel style={{marginTop:10}}><p style={{fontSize:11,color:"rgba(200,192,248,0.4)",marginBottom:8}}>Potions</p><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{getStacks().map(p=><Btn key={p.id} small variant="success" onClick={()=>usePotion(p)}>{p.name} x{p.count}</Btn>)}</div></Panel>}
          {log.length>0&&<div ref={logRef} style={{maxHeight:130,overflowY:"auto",padding:"10px 14px",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,fontSize:12,lineHeight:1.8,marginTop:10,background:"rgba(0,0,0,0.25)"}}>{log.map(l=><div key={l.id} style={{color:LOG_C[l.type]||"#ccc"}}>{l.msg}</div>)}</div>}
        </div>}

        {/* Overworld map */}
        {screen==="overworld"&&<div>
          {!nobleQuestActive&&race?.id==="devil"&&!postDoomsday&&<Panel style={{marginBottom:14,borderColor:"#ffd966",background:"linear-gradient(180deg,rgba(255,217,102,0.1),rgba(255,217,102,0.02))"}}>
            <p style={{fontWeight:700,fontSize:14,color:"#e0a523",marginBottom:6}}>The Noble's Request</p>
            <p style={{fontSize:12,color:"rgba(255,217,102,0.7)",marginBottom:10}}>The noble asks you to protect his territory during the impending Doomsday. Huge reward if you survive the Lumenari.</p>
            <Btn variant="gold" onClick={acceptNobleQuest}>Accept Quest</Btn>
          </Panel>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,marginBottom:14}}>
            <Panel onClick={()=>startCombat(false)}><p style={{fontWeight:600,fontSize:13,color:"#e85c3a",marginBottom:4}}>Contract board</p><p style={{fontSize:11,color:"rgba(200,192,248,0.5)",marginBottom:8}}>{postDoomsday?"Post-doomsday work.":doomsday>=7?"⚠ Surge.":doomsday>=4?"Active.":"Routine."}</p><Btn small variant="danger" onClick={()=>startCombat(false)}>Take ↗</Btn></Panel>
            <Panel><p style={{fontWeight:600,fontSize:13,color:"#3ec995",marginBottom:4}}>Sleep — {housingOpt.name}</p><p style={{fontSize:11,color:"rgba(200,192,248,0.5)",marginBottom:8}}>{housingOpt.cost>0?`${housingOpt.cost} B/night`:"Free"}</p><div style={{display:"flex",gap:6}}><Btn small variant="success" onClick={doSleep}>Sleep</Btn><Btn small variant="ghost" onClick={()=>{setScreen("sleep");setTab("sleep");}}>Change</Btn></div></Panel>
            {/* NY LOGIK: Knappen länkar nu till vår nya komponent i Views.jsx! */}
            {!race?.canSpell&&<Panel onClick={() => setScreen("training")}><p style={{fontWeight:600,fontSize:13,color:"#e0a523",marginBottom:4}}>Combat training</p><p style={{fontSize:11,color:"rgba(200,192,248,0.5)",marginBottom:8}}>+Physical level</p><Btn small variant="amber" onClick={() => setScreen("training")}>Train ↗</Btn></Panel>}
          </div>
          {potions.length>0&&<Panel style={{marginBottom:10}}><p style={{fontSize:11,color:"rgba(200,192,248,0.4)",marginBottom:8}}>Potions</p><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{getStacks().map(p=><Btn key={p.id} small variant="success" onClick={()=>usePotion(p)}>{p.name} x{p.count}</Btn>)}</div></Panel>}
          {log.length>0&&<div ref={logRef} style={{maxHeight:120,overflowY:"auto",padding:"10px 14px",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,fontSize:12,lineHeight:1.8,background:"rgba(0,0,0,0.25)"}}>{log.map(l=><div key={l.id} style={{color:LOG_C[l.type]||"#ccc"}}>{l.msg}</div>)}</div>}
        </div>}

        {/* ── Sub-Vyerna ── */}
        {(screen==="shop"||(isUw&&tab==="shop"))&&<ShopView bronze={bronze} setBronze={setBronze} weapon={weapon} setWeapon={setWeapon} weapon2={weapon2} setWeapon2={setWeapon2} armor={armor} setArmor={setArmor} ownedWeapons={ownedWeapons} setOwnedWeapons={setOwnedWeapons} ownedArmors={ownedArmors} setOwnedArmors={setOwnedArmors} myTools={myTools} setMyTools={setMyTools} setPotions={setPotions} setStats={setStats} race={race} notify={notify} adjustedPrice={adjustedPrice} shopDiscount={shopDiscount} craftedShop={craftedShop}/>}
        {(screen==="spells"||(isUw&&tab==="spells"))&&<SpellsView spells={visibleSpells()} race={race} spellStudiedToday={spellStudiedToday} studySpell={studySpell} allSpells={spells}/>}
        {screen==="skills"&&<SkillsView unlockedSkills={unlockedSkills} revealedSkills={revealedSkills} totalKills={totalKills} nearDeathWins={nearDeathWins} totalEarned={totalEarned} day={day} spells={spells} techniqueUnlocked={techniqueUnlocked}/>}
        {screen==="church"&&<ChurchView race={race} bronze={bronze} churchCost={churchCost} unlockedSkills={unlockedSkills} revealedSkills={revealedSkills} visitChurch={visitChurch} leftUnderworld={leftUnderworld}/>}
        {screen==="guild"&&<GuildView advRankIdx={advRankIdx} hasBadge={hasBadge} xp={xp} daysSinceContract={daysSinceContract} RANKS={RANKS} RANK_MULT={RANK_MULT} RANK_THRESHOLDS={RANK_THRESHOLDS} GRACE={GRACE} />}
        {screen==="sleep"&&<SleepView housing={housing} chooseHousing={chooseHousing} bronze={bronze} ownsHouse={ownsHouse} buyHouse={buyHouse}/>}
        {screen==="craft"&&<CraftView bronze={bronze} setBronze={setBronze} craftMats={craftMats} setCraftMats={setCraftMats} setOwnedWeapons={setOwnedWeapons} setPotions={setPotions} notify={notify} setCraftedShop={setCraftedShop}/>}
        {screen==="gamble"&&<GambleView bronze={bronze} setBronze={setBronze} notify={notify} setTotalEarned={setTotalEarned}/>}
        {isUw&&tab==="city"&&<CityView bronze={bronze} setBronze={setBronze} cityLevel={cityLevel} setCityLevel={setCityLevel} setStats={setStats} notify={notify}/>}
        {/* Nya vyer anropas här */}
        {screen==="training"&&<TrainingView physicalLevel={physicalLevel} setPhysicalLevel={setPhysicalLevel} setScreen={setScreen} notify={notify} race={race} />}
        {screen==="endgame"&&<EndgameView race={race} bronze={bronze} setBronze={setBronze} stats={stats} setStats={setStats} notify={notify} onEnterArena={() => startEndgame(0)} expeditions={expeditions} setExpeditions={setExpeditions} guildUpgrades={guildUpgrades} setGuildUpgrades={setGuildUpgrades} />}
        {screen==="tenebrim_survival" && <TenebrimSurvivalView food={food} setFood={setFood} energy={energy} setEnergy={setEnergy} survivalStats={survivalStats} setSurvivalStats={setSurvivalStats} survivalInv={survivalInv} setSurvivalInv={setSurvivalInv} stats={stats} setStats={setStats} notify={notify} startCombat={() => startCombat(false)} locationsExplored={locationsExplored} setLocationsExplored={setLocationsExplored} liberationQuest={liberationQuest} setLiberationQuest={setLiberationQuest} tenebrimAllies={tenebrimAllies} startSlaverCombat={startSlaverCombat} />}
      </div>
    </div>;
  }

  // ── Stridsvyerna ────────────────────────────────────────────────────────
  if(screen==="combat"){
    const learned=visibleSpells().filter(s=>s.learned&&s.combatUse);
    const ra=ATTACKS_BY_RACE[race?.id]||ATTACKS_BY_RACE.human;
    
    // Dynamically inject Survival Spears for Tenebrim
    let dynActions = [];
    if (race?.id === "tenebrim") {
       if ((survivalInv?.heavySpear||0) > 0) dynActions.push({id:"heavy_spear", name:"Heavy Spear", dmg:[15, 26], desc:"Fierce thrust. 10% break chance.", staminaCost: 15});
       else if ((survivalInv?.huntingGear||0) > 0) dynActions.push({id:"spear_thrust", name:"Spear Thrust", dmg:[8, 16], desc:"Basic thrust. 20% break chance.", staminaCost: 10});
    }

    const ACTIONS=[...ra, ...dynActions, {id:"guard",name:"Guard",desc:"Reduce next hit by 6."},{id:"focus",name:"Focus",desc:"+15 stamina."},...(race?.canSpell?learned.map(s=>({id:s.id,name:s.combatUse.label,dmg:s.combatUse.dmg,mpCost:s.combatUse.mpCost,desc:s.combatUse.desc||"Spell.",isSpell:true,...(s.combatUse.effect?{effect:s.combatUse.effect,turns:s.combatUse.turns}:{})})):[])];
    const highStar=combat?Math.max(...combat.map(e=>e.star)):0;
    const isHigh=highStar>=3;
    return <div style={{minHeight:"100vh",background:isHigh?"linear-gradient(160deg,#0a0410,#1c0a18,#0d0510)":"linear-gradient(160deg,#0d0510,#180a12)",fontFamily:"var(--font-sans)"}}>
      
      {warnVisible&&warnMonster&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:300,background:"linear-gradient(90deg,#a82828,#c84838)",padding:"14px 20px",display:"flex",alignItems:"center",gap:12,animation:"warnSlide 0.35s ease",boxShadow:"0 4px 24px rgba(184,58,42,0.5)"}}><span style={{fontSize:22}}>⚠</span><div><p style={{fontWeight:800,fontSize:14,color:"#fff"}}>{warnMonster.star}-STAR THREAT</p><p style={{fontSize:12,color:"rgba(255,255,255,0.75)"}}>{warnMonster.name}</p></div></div>}
      <div style={{background:"rgba(0,0,0,0.6)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"12px 16px",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",backdropFilter:"blur(8px)"}}>
        <span style={{fontWeight:800,fontSize:13,color:"#e85c3a",letterSpacing:"0.04em"}}>COMBAT</span>
        {combat&&<StarRating stars={highStar} max={highStar}/>}
        {combatPhase==="player"&&!combatResult&&<div style={{marginLeft:"auto"}}><button className="al-btn flee-btn" onClick={flee} style={{padding:"8px 16px",borderRadius:8,fontWeight:900,cursor:"pointer"}}>FLEE (5%)</button></div>}
      </div>

      <div style={{maxWidth:780,margin:"0 auto",padding:"16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:14,marginBottom:14}}>
          <Panel style={{background:"linear-gradient(180deg,rgba(60,90,200,0.1),rgba(60,90,200,0.04))",borderColor:"rgba(124,111,212,0.25)"}}>
            <p style={{fontSize:10,color:"rgba(200,192,248,0.4)",marginBottom:10,letterSpacing:"0.1em",fontWeight:700}}>YOU</p>
            {[{l:"HP",v:stats.hp,m:stats.maxHp+(cityLevel.walls*5),c:"#e85c3a"},{l:"MP",v:stats.mp,m:stats.maxMp+(cityLevel.pump*5),c:"#a89df0"},{l:"Sta",v:stats.stamina,m:stats.maxStamina,c:"#3ec995"}].map(b=>(<div key={b.l} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:"rgba(200,192,248,0.55)",fontWeight:600}}>{b.l}</span><span style={{fontSize:11,color:"rgba(200,192,248,0.4)"}}>{b.v}/{b.m}</span></div><Bar val={b.v} max={b.m} color={b.c} h={6}/></div>))}
            <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>{guardActive&&<Tag color="#3ec995">Guard</Tag>}{weapon.id!=="fists"&&<Tag color="#a8740c">{weapon.name}</Tag>}{race?.id==="tetrabrachian"&&weapon2.id!=="fists"&&<Tag color="#a8740c">{weapon2.name}</Tag>}</div>
          </Panel>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {combat?.map((e,i)=>(<Panel key={e.id} onClick={e.hp>0?()=>setActiveEnemyIdx(i):undefined} style={{opacity:e.hp<=0?0.35:1,background:i===activeEnemyIdx&&e.hp>0?"linear-gradient(180deg,rgba(232,92,58,0.15),rgba(232,92,58,0.06))":"linear-gradient(180deg,rgba(232,92,58,0.06),rgba(232,92,58,0.02))",borderColor:i===activeEnemyIdx&&e.hp>0?"rgba(232,92,58,0.4)":"rgba(232,92,58,0.18)",cursor:e.hp>0?"pointer":"default",animation:e.star>=4&&e.hp>0?"glowPulse 2s ease infinite":undefined,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><StarRating stars={e.star} max={e.star}/><span style={{fontWeight:600,fontSize:12,color:"rgba(255,200,180,0.85)"}}>{e.name}</span></div>
                <span style={{fontSize:11,color:"rgba(200,192,248,0.45)"}}>{e.hp}/{e.maxHp}</span>
              </div>
              <Bar val={e.hp} max={e.maxHp} color={e.hp/e.maxHp>0.5?"#e0a523":"#e85c3a"} h={5}/>
              {enemyStunned[e.id]>0&&<div style={{marginTop:5}}><Tag color="#7c6fd4">Stunned</Tag></div>}
            </Panel>))}
          </div>
        </div>

        <div ref={logRef} style={{minHeight:80,maxHeight:130,overflowY:"auto",padding:"10px 12px",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,fontSize:12,lineHeight:1.85,marginBottom:12,background:"rgba(0,0,0,0.35)"}}>{log.map(l=><div key={l.id} style={{color:LOG_C[l.type]||"#ccc"}}>{l.msg}</div>)}</div>

        {potions.length>0&&combatPhase==="player"&&!combatResult&&<div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>{getStacks().map(p=><Btn key={p.id} small variant="success" onClick={()=>usePotion(p)}>{p.name} x{p.count}</Btn>)}</div>}

        {combatResult?<div style={{display:"flex",gap:10}}>
          {combatResult==="win"?<Btn variant="success" onClick={()=>{setScreen(combatOrigin);setTab("map");}}>Return</Btn>:<Btn variant="danger" onClick={()=>{if(diff?.perma)startNewGame();else{setStats(s=>({...s,hp:Math.round(s.maxHp*0.4),stamina:Math.round(s.maxStamina*0.5)}));setScreen(combatOrigin);setTab("map");}}}>{diff?.perma?"Return to menu":"Respawn"}</Btn>}
        </div>:combatPhase==="player"?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
            {ACTIONS.map(a=>{const noSta=a.staminaCost&&stats.stamina<a.staminaCost;const noMp=a.mpCost&&stats.mp<a.mpCost;const dis=!!noSta||!!noMp;return <button key={a.id} disabled={dis} onClick={()=>playerAct(a)} className="action-card" style={{borderColor:a.isSpell?"rgba(168,157,240,0.3)":"rgba(255,255,255,0.15)"}}>
              <p style={{fontWeight:700,fontSize:14,color:a.isSpell?"#a89df0":a.id==="guard"?"#3ec995":a.id==="heavy"||a.id==="quad_flurry"||a.id==="power_strike"||a.id==="hell_strike"?"#e85c3a":"#d4cbf8",marginBottom:4}}>{a.name}</p>
              <p style={{fontSize:11,color:"rgba(200,192,248,0.4)",lineHeight:1.5,marginBottom:8}}>{a.desc}</p>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{a.mpCost>0&&<Tag color="#a89df0">{a.mpCost} MP</Tag>}{a.staminaCost>0&&<Tag color="#3ec995">{a.staminaCost} Sta</Tag>}</div>
            </button>;})}
          </div>
        ):<p style={{fontSize:12,color:"rgba(200,192,248,0.35)"}}>Enemy acting…</p>}
      </div>
    </div>;
  }

  if(screen==="endgame_combat")return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1a0808,#2a1010)",fontFamily:"var(--font-sans)",position:"relative"}}>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",animation:"redEdge 1.4s ease infinite",zIndex:0}}/>
    <div style={{background:"rgba(0,0,0,0.6)",borderBottom:"1px solid rgba(232,92,58,0.4)",padding:"12px 16px",display:"flex",gap:14,alignItems:"center",position:"relative",zIndex:1}}>
      <span style={{fontWeight:800,fontSize:14,color:"#e85c3a",letterSpacing:"0.03em"}}>DOOMSDAY · Wave {endgameWave+1}/5</span>
      <span style={{fontSize:12,color:"rgba(255,200,180,0.6)"}}>Allies: {allies}</span>
      <div style={{marginLeft:"auto"}}><Btn small variant="amber" onClick={recruit} disabled={bronze<120+allies*40}>Recruit ({120+allies*40} B)</Btn></div>
    </div>
    <div style={{maxWidth:780,margin:"0 auto",padding:"18px",position:"relative",zIndex:1}}>
      <Panel style={{marginBottom:14,background:"rgba(40,15,15,0.5)"}}>
        <p style={{fontSize:11,color:"rgba(255,200,180,0.5)",marginBottom:8}}>YOU</p>
        {[{l:"HP",v:stats.hp,m:stats.maxHp+(cityLevel.walls*5),c:"#e85c3a"},{l:"MP",v:stats.mp,m:stats.maxMp+(cityLevel.pump*5),c:"#a89df0"}].map(b=>(<div key={b.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}><span style={{fontSize:11,minWidth:50}}>{b.l} {b.v}/{b.m}</span><Bar val={b.v} max={b.m} color={b.c} h={5}/></div>))}
      </Panel>
      {potions.length>0&&!combatResult&&<Panel style={{marginBottom:10,background:"rgba(26,60,40,0.3)",borderColor:"rgba(62,201,149,0.2)"}}><p style={{fontSize:11,color:"rgba(62,201,149,0.6)",marginBottom:8}}>Potions</p><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{getStacks().map(p=><Btn key={p.id} small variant="success" onClick={()=>usePotion(p)}>{p.name} x{p.count}</Btn>)}</div></Panel>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:10,marginBottom:14}}>
        {endgameMonsters.map((m,i)=>(<Panel key={m.id} style={{opacity:m.hp<=0?0.35:1,background:"rgba(60,15,15,0.4)",borderColor:"rgba(232,92,58,0.3)",cursor:m.hp>0?"pointer":"default"}} onClick={m.hp>0?()=>endAttack(i):undefined}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><StarRating stars={m.star} max={m.star}/><p style={{fontWeight:700,fontSize:12,color:"#e85c3a"}}>{m.name}</p></div>
          <Bar val={Math.max(0,m.hp)} max={m.maxHp} color="#e85c3a" h={5}/>
          <p style={{fontSize:10,color:"rgba(255,200,180,0.5)",marginTop:4}}>{Math.max(0,m.hp)}/{m.maxHp}</p>
        </Panel>))}
      </div>
      <div ref={logRef} style={{maxHeight:150,overflowY:"auto",padding:"10px 12px",border:"1px solid rgba(232,92,58,0.2)",borderRadius:10,fontSize:12,lineHeight:1.85,background:"rgba(0,0,0,0.4)"}}>{log.map(l=><div key={l.id} style={{color:LOG_C[l.type]||"#ccc"}}>{l.msg}</div>)}</div>
      {combatResult==="lose"&&<div style={{marginTop:14}}><Btn variant="danger" onClick={()=>{setStats(s=>({...s,hp:s.maxHp,mp:s.maxMp}));startEndgame(endgameWave);setCombatResult(null);}}>Retry wave</Btn></div>}
    </div>
  </div>;

// ── Colosseum (Arena UI) ─────────────────────────────────────────────────
  if(screen === "colosseum" && colosseum) {
    const isPrep = colosseum.phase === 'prep';
    const isWepSelect = colosseum.phase === 'weapon_select';
    const isCombat = ['fist', 'weapon', 'boss'].includes(colosseum.phase);
    
    // Tillfälliga vapen för arenan
    const arenaWeapons = ["Dual Axes", "Heavy Warhammer", "Spiked Gauntlets"];

    return <div style={{minHeight:"100vh", background:"linear-gradient(160deg, #1f0a0a, #0a0404)", fontFamily:"var(--font-sans)", padding:"20px"}}>
      <div style={{maxWidth: 800, margin: "0 auto"}}>
        
        {/* Header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"2px solid #e85c3a", paddingBottom:15, marginBottom:20}}>
          <div>
            <h1 style={{color:"#e85c3a", margin:0, fontSize:28, textTransform:"uppercase"}}>The Colosseum</h1>
            <p style={{color:"#e0a523", margin:0, fontWeight:"bold"}}>Floor {colosseum.floor} — Losses: {colosseum.losses}/{colosseum.phase==='boss'?3:2}</p>
          </div>
          <div style={{textAlign:"right"}}>
             <CoinBar bronze={bronze} />
             {isPrep && <Btn small variant="ghost" onClick={() => setScreen("overworld")} style={{marginTop:10, display:"block"}}>Flee Arena</Btn>}
          </div>
        </div>

        {/* Fas 1: Förberedelse & Butik */}
        {isPrep && <Panel style={{borderColor: "#e0a523", textAlign:"center", padding:"40px 20px"}}>
          <h2 style={{color:"#e0a523", fontSize:24}}>Rest Area</h2>
          <p style={{marginBottom: 30}}>Stock up on potions before the gates open. Next match is bare-knuckle.</p>
          <div style={{display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:30}}>
            {POTIONS.map(p => {
              const adj = adjustedPrice(p.price); 
              return <Btn key={p.id} small variant="success" disabled={bronze < adj} onClick={() => { setBronze(b => b - adj); setPotions(prev => [...prev, p]); SFX.buy(); notify(`Bought ${p.name}`, "#1a7a4f"); }}>{p.name} ({adj} B)</Btn>
            })}
          </div>
          <Btn variant="danger" onClick={advanceColosseum} style={{padding:"15px 40px", fontSize:18}}>Enter Ring (Fist Fight)</Btn>
        </Panel>}

        {/* Fas 3: Vapenval */}
        {isWepSelect && <Panel style={{borderColor: "#a89df0", textAlign:"center", padding:"40px 20px"}}>
          <h2 style={{color:"#a89df0", fontSize:24}}>Choose Your Arsenal</h2>
          <p style={{marginBottom: 30}}>The crowd roars. Pick a weapon style for the next round. Your opponent will adapt.</p>
          <div style={{display:"flex", gap:15, justifyContent:"center"}}>
            {arenaWeapons.map(wep => (
              <Btn key={wep} variant="primary" onClick={() => setupColosseumFight('weapon', wep)}>{wep}</Btn>
            ))}
          </div>
        </Panel>}

        {/* Fas 2, 4, 5: Stridsgränssnitt */}
        {isCombat && <>
          {/* Spelarens och Fiendens HP */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20}}>
            <Panel style={{background:"rgba(62,201,149,0.1)", borderColor:"#3ec995"}}>
              <p style={{color:"#3ec995", fontWeight:"bold", marginBottom:5}}>YOU</p>
              <Bar val={stats.hp} max={stats.maxHp} color="#3ec995" h={12} />
              <p style={{fontSize:12, marginTop:5, color:"rgba(255,255,255,0.7)"}}>HP: {stats.hp}/{stats.maxHp} | Sta: {stats.stamina}/{stats.maxStamina}</p>
            </Panel>
            
            <Panel style={{background:"rgba(232,92,58,0.1)", borderColor:"#e85c3a"}}>
              <p style={{color:"#e85c3a", fontWeight:"bold", marginBottom:5, textTransform:"uppercase"}}>{colosseum.opp?.name}</p>
              <Bar val={Math.max(0, colosseum.opp?.hp || 0)} max={colosseum.opp?.maxHp || 1} color="#e85c3a" h={12} />
              <p style={{fontSize:12, marginTop:5, color:"rgba(255,255,255,0.7)"}}>HP: {Math.max(0, colosseum.opp?.hp || 0)}</p>
            </Panel>
          </div>

          {/* QTE Overlay */}
          {colQte && <div style={{background:"rgba(232,185,56,0.2)", border:"2px solid #e0a523", borderRadius:12, padding:20, textAlign:"center", marginBottom:20, animation:"qtePulse 0.5s ease infinite"}}>
            <h3 style={{color:"#e0a523", margin:"0 0 10px"}}>COUNTER-ATTACK!</h3>
            <div style={{display:"flex", gap:10, justifyContent:"center"}}>
              {colQte.keys.map((d,i)=>(
                <span key={i} style={{width:50, height:50, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:`2px solid ${i<colQte.idx?"#3ec995":i===colQte.idx?"#e0a523":"rgba(255,255,255,0.3)"}`, color:i<colQte.idx?"#3ec995":i===colQte.idx?"#e0a523":"rgba(255,255,255,0.3)", fontSize:24, fontWeight:"bold"}}>{d}</span>
              ))}
            </div>
          </div>}

          {/* Action-knappar & Potions */}
          <Panel>
            <div style={{display:"flex", gap:10, marginBottom:15, flexWrap:"wrap"}}>
              {getStacks().map(p=><Btn key={p.id} small variant="success" onClick={()=>usePotion(p)} disabled={!!colQte}>{p.name} x{p.count}</Btn>)}
            </div>
            <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
              {ATTACKS_BY_RACE.tetrabrachian.map(a => (
                <Btn key={a.id} variant="primary" disabled={!!colQte || stats.stamina < (a.staminaCost||0)} onClick={() => colosseumAttack(a)}>
                  {a.name} {a.staminaCost ? `(${a.staminaCost} Sta)` : ""}
                </Btn>
              ))}
              <Btn variant="ghost" onClick={() => setStats(s => ({...s, stamina: Math.min(s.maxStamina, s.stamina + 20)}))} disabled={!!colQte}>Rest (+20 Sta)</Btn>
            </div>
          </Panel>

          {/* Logg */}
          <div ref={logRef} style={{maxHeight:150, overflowY:"auto", padding:15, border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, fontSize:13, lineHeight:1.8, marginTop:20, background:"rgba(0,0,0,0.5)"}}>
            {log.slice(-15).map(l=><div key={l.id} style={{color:LOG_C[l.type]||"#ccc"}}>{l.msg}</div>)}
          </div>
        </>}
      </div>
    </div>;
  }

  if(screen==="lumenari"){
    const phaseLabels={1:"PHASE I — GROUNDED",2:"PHASE II — LEVITATING",3:"PHASE III — AERIAL PLANE"};
    const phaseCol={1:"#a89df0",2:"#ffd966",3:"#e85c3a"};
    const learned=visibleSpells().filter(s=>s.learned&&s.combatUse);
    const ra=ATTACKS_BY_RACE[race?.id]||ATTACKS_BY_RACE.human;
    const ACT=[...ra.slice(0,3),...(race?.canSpell?learned.map(s=>({id:s.id,name:s.combatUse.label,dmg:s.combatUse.dmg||[10,18],mpCost:s.combatUse.mpCost,isSpell:true})):[])];
    const canAct=lumenCombatPhase==="player"&&!combatResult&&!qteActive;
    return <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#1a0a30 0%,#080010 60%,#000 100%)",fontFamily:"var(--font-sans)",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      {lumenariPhase>=2&&Array.from({length:14}).map((_,i)=>(<div key={i} style={{position:"fixed",left:`${3+i*7}%`,top:0,width:1.5,height:55,background:"linear-gradient(180deg,transparent,#ffd966cc,transparent)",animation:`lightRain ${1+Math.random()*1.6}s linear infinite`,animationDelay:`${Math.random()*2.2}s`,pointerEvents:"none",zIndex:0,boxShadow:"0 0 8px #ffd966"}}/>))}
      {lumenari&&<div style={{padding:"18px 22px 16px",background:"linear-gradient(180deg,rgba(0,0,0,0.85),rgba(0,0,0,0.5))",borderBottom:"1px solid rgba(255,217,102,0.45)",position:"relative",zIndex:2,animation:"lumenGlow 3s ease infinite"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div><span className="gradient-text" style={{fontWeight:900,fontSize:26,letterSpacing:"-0.03em",textShadow:"0 0 20px rgba(255,217,102,0.4)"}}>LUMENARI</span><span style={{marginLeft:14,fontSize:11,color:phaseCol[lumenariPhase],fontWeight:700,letterSpacing:"0.15em"}}>{phaseLabels[lumenariPhase]}</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>{allies>0&&<Tag color="#3ec995">Allies: {allies}</Tag>}<span style={{fontSize:12,color:"rgba(255,217,102,0.7)",fontWeight:600}}>{lumenari.phaseHp}/{lumenari.phaseMaxHp}</span></div>
        </div>
        <Bar val={lumenari.phaseHp} max={lumenari.phaseMaxHp} color="#ffd966" h={14}/>
      </div>}
      <div style={{flex:1,display:"flex",position:"relative",zIndex:1,overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",gap:18}}>
          <p style={{fontSize:12,color:"rgba(255,217,102,0.5)",fontStyle:"italic",textAlign:"center",maxWidth:420,lineHeight:1.65}}>
            {lumenariPhase===1&&"It barely floats. Each touch drains your mana."}
            {lumenariPhase===2&&"It hangs in the air. Spears fall from above. (Use arrow keys on keyboard.)"}
            {lumenariPhase===3&&"The ground is gone. Stone golems press in."}
          </p>
          {qteActive&&<div style={{width:"100%",maxWidth:400,padding:"22px",borderRadius:14,background:"rgba(255,217,102,0.12)",border:"2px solid #ffd966",animation:"qtePulse 0.8s ease infinite",textAlign:"center"}}>
            <p style={{fontWeight:900,fontSize:16,color:"#ffd966",marginBottom:6,letterSpacing:"0.05em"}}>EVADE</p>
            <p style={{fontSize:11,color:"rgba(255,217,102,0.6)",marginBottom:18}}>{qteIdx+1} / {qteSequence.length} — Arrow keys on Keyboard</p>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:22}}>{qteSequence.map((d,i)=>(<span key={i} style={{width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,border:`2px solid ${i<qteIdx?"#3ec995":i===qteIdx?"#ffd966":"rgba(255,217,102,0.25)"}`,color:i<qteIdx?"#3ec995":i===qteIdx?"#ffd966":"rgba(255,217,102,0.3)",fontSize:20,fontWeight:800,background:i===qteIdx?"rgba(255,217,102,0.12)":"transparent"}}>{d}</span>))}</div>
          </div>}
          {!qteActive&&lumenariPhase===3&&<div style={{width:"100%",maxWidth:420}}><p style={{fontSize:11,color:"rgba(200,160,100,0.6)",marginBottom:10,textAlign:"center",letterSpacing:"0.06em",fontWeight:600}}>STONE GOLEMS</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{golems.map((g,i)=>(<div key={g.id} onClick={g.hp>0?()=>attackGolem(i):undefined} style={{opacity:g.hp<=0?0.3:1,cursor:g.hp>0?"pointer":"default",padding:"12px",borderRadius:10,border:"1px solid rgba(160,120,80,0.4)",background:"rgba(80,60,40,0.25)",textAlign:"center"}}><p style={{fontSize:11,fontWeight:600,color:"#c8a070",marginBottom:6}}>Golem {i+1}</p><Bar val={Math.max(0,g.hp)} max={g.maxHp} color="#a8744c" h={5}/></div>))}</div></div>}
          {!qteActive&&!combatResult&&<div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(ACT.length,3)},1fr)`,gap:10,width:"100%",maxWidth:480}}>
            {ACT.map(a=>{const dis=(a.staminaCost&&stats.stamina<a.staminaCost)||(a.mpCost&&stats.mp<a.mpCost)||!canAct;return <button key={a.id} disabled={dis} onClick={()=>lumenAttack(a)} className="action-card" style={{borderColor:a.isSpell?"rgba(168,157,240,0.5)":"rgba(255,217,102,0.4)",background:a.isSpell?"rgba(168,157,240,0.12)":"rgba(255,217,102,0.06)",textAlign:"center"}}>
              <p style={{fontWeight:800,fontSize:15,color:a.isSpell?"#a89df0":"#ffd966",marginBottom:6}}>{a.name}</p>
              <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>{a.mpCost>0&&<Tag color="#a89df0">{a.mpCost} MP</Tag>}{a.staminaCost>0&&<Tag color="#3ec995">{a.staminaCost} Sta</Tag>}</div>
            </button>;})}
          </div>}
          {!combatResult&&<p style={{fontSize:11,color:lumenCombatPhase==="player"?"rgba(255,217,102,0.5)":"rgba(232,92,58,0.5)",letterSpacing:"0.08em",fontWeight:700}}>{qteActive?"INPUT REQUIRED":lumenCombatPhase==="player"?"YOUR TURN":"LUMENARI ACTING"}</p>}
          {combatResult==="lose"&&<div style={{textAlign:"center",padding:"22px",borderRadius:14,background:"rgba(184,58,42,0.15)",border:"1px solid #b83a2a",maxWidth:400}}><p style={{fontWeight:700,fontSize:16,color:"#e85c3a",marginBottom:12}}>The Lumenari overwhelms you.</p><Btn variant="danger" onClick={()=>{setStats(s=>({...s,hp:s.maxHp,mp:s.maxMp,stamina:s.maxStamina}));startLumenari();}}>Try again</Btn></div>}
        </div>
        <div style={{width:200,background:"rgba(0,0,0,0.55)",borderLeft:"1px solid rgba(255,217,102,0.18)",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12,position:"relative",zIndex:2}}>
          <div><p style={{fontSize:10,color:"rgba(255,217,102,0.45)",letterSpacing:"0.1em",fontWeight:700,marginBottom:10}}>STATS</p>{[{l:"HP",v:stats.hp,m:stats.maxHp+(cityLevel.walls*5),c:"#e85c3a"},{l:"MP",v:stats.mp,m:stats.maxMp+(cityLevel.pump*5),c:"#a89df0"},{l:"Sta",v:stats.stamina,m:stats.maxStamina,c:"#3ec995"}].map(b=>(<div key={b.l} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.55)"}}>{b.l}</span><span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{b.v}/{b.m}</span></div><Bar val={b.v} max={b.m} color={b.c} h={7}/></div>))}</div>
          <div style={{borderTop:"1px solid rgba(255,217,102,0.12)",paddingTop:12}}><p style={{fontSize:10,color:"rgba(255,217,102,0.45)",letterSpacing:"0.1em",fontWeight:700,marginBottom:10}}>POTIONS</p>{potions.length===0?<p style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>None</p>:<div style={{display:"flex",flexDirection:"column",gap:6}}>{getStacks().map(p=>(<button key={p.id} onClick={()=>usePotion(p)} style={{padding:"7px 10px",borderRadius:6,border:"1px solid rgba(62,201,149,0.3)",background:"rgba(42,156,105,0.1)",color:"#3ec995",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left"}}>{p.name} <span style={{opacity:0.6}}>x{p.count}</span></button>))}</div>}</div>
          <div style={{borderTop:"1px solid rgba(255,217,102,0.12)",paddingTop:12,flex:1,display:"flex",flexDirection:"column"}}><p style={{fontSize:10,color:"rgba(255,217,102,0.45)",letterSpacing:"0.1em",fontWeight:700,marginBottom:8}}>LOG</p><div ref={logRef} style={{flex:1,overflowY:"auto",fontSize:10,lineHeight:1.7}}>{log.slice(-20).map(l=><div key={l.id} style={{color:LOG_C[l.type]||"rgba(200,192,248,0.4)",marginBottom:2}}>{l.msg}</div>)}</div></div>
        </div>
      </div>
    </div>;
  }

  return null;
}; // <-- THIS CLOSES renderGameScreen()

  // --- THE GLOBAL WRAPPER ---
  return (
    <>
      {/* GLOBAL SETTINGS COG */}
      <div 
        onClick={() => setShowSettings(true)} 
        style={{ 
          position: "fixed", bottom: 20, right: 20, zIndex: 9999, cursor: "pointer", 
          background: "linear-gradient(180deg, rgba(40,20,60,0.8) 0%, rgba(20,10,35,0.9) 100%)", 
          border: "1px solid rgba(168, 157, 240, 0.4)", borderRadius: "50%", 
          width: 45, height: 45, display: "flex", alignItems: "center", justifyContent: "center", 
          fontSize: 22, boxShadow: "0 4px 15px rgba(0,0,0,0.6)", transition: "all 0.2s" 
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = "rotate(45deg) scale(1.1)"; e.currentTarget.style.borderColor = "#a89df0"; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = "rotate(0deg) scale(1)"; e.currentTarget.style.borderColor = "rgba(168, 157, 240, 0.4)"; }}
      >
        ⚙️
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "linear-gradient(180deg, #13091c 0%, #0a0410 100%)", border: "1px solid #7b6fe4", borderRadius: 12, padding: "30px 24px", boxShadow: "0 10px 40px rgba(0,0,0,0.8)", position: "relative" }}>
            
            <button onClick={() => setShowSettings(false)} style={{ position: "absolute", top: 15, right: 15, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 24, cursor: "pointer" }}>✕</button>
            
            <h2 style={{ color: "#a89df0", margin: "0 0 25px 0", textAlign: "center", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase" }}>Settings</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* MASTER VOLUME */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", marginBottom: 8, fontSize: 13, fontWeight: "bold" }}>
                  <span>Master Volume</span>
                  <span>{Math.round(volumes.master * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={volumes.master} onChange={(e) => updateVol("master", e.target.value)} style={{ width: "100%", cursor: "pointer", accentColor: "#a89df0" }} />
              </div>

              {/* BGM VOLUME */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#e0a523", marginBottom: 8, fontSize: 13, fontWeight: "bold" }}>
                  <span>Music (BGM)</span>
                  <span>{Math.round(volumes.bgm * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={volumes.bgm} onChange={(e) => updateVol("bgm", e.target.value)} style={{ width: "100%", cursor: "pointer", accentColor: "#e0a523" }} />
              </div>

              {/* SFX VOLUME */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#e85c3a", marginBottom: 8, fontSize: 13, fontWeight: "bold" }}>
                  <span>Sound Effects (SFX)</span>
                  <span>{Math.round(volumes.sfx * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={volumes.sfx} onChange={(e) => updateVol("sfx", e.target.value)} style={{ width: "100%", cursor: "pointer", accentColor: "#e85c3a" }} />
              </div>

              {/* MUTE BUTTON */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={() => updateVol("master", volumes.master > 0 ? 0 : 1)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, cursor: "pointer" }}>
                  {volumes.master > 0 ? "Mute All" : "Unmute All"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* RENDER THE ACTUAL GAME HERE */}
      {renderGameScreen()}
    </>
  );
} // <-- THIS CLOSES App()
