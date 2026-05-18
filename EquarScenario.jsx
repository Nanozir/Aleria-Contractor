// EquarScenario.jsx
// A completely standalone Equar scenario built around:
//   - Opportunity System (the core loop)
//   - Family + Reputation systems (replacing settlements)
//   - Deferred consequences (the world remembers)
//   - Dirty-trick combat (sand, smoke, escape — not raw force)
//   - 5 long-term ambitions (Wealth / Thief / Trade / Underworld / Explorer)
//   - Family Legacy meta-progression (only Easy/Normal — no hard/insane unlock)
//
// Pure copper/dusk visual identity — does NOT reuse Elf or Tenebrim mechanics.

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Btn, Tag, Panel, Bar, CoinBar } from "./UIComponents";

// ───────────────────────── SAVE KEYS ─────────────────────────
const SAVE_KEY = "aleria_equar_run";
const META_KEY = "aleria_equar_meta";

// ───────────────────────── REGIONS ───────────────────────────
const REGIONS = [
  { id: "valley",  name: "Crystal Valley",  hint: "Glittering caves. Risky. Rewards the lucky.",        suspicion: 1, danger: 2, oppBias: ["lost_package","secret_info","shady_deal"] },
  { id: "forest",  name: "Mana Forest",     hint: "Wild magic, wilder rumors. Suspicion stays low.",    suspicion: 0, danger: 2, oppBias: ["secret_info","merchant_conflict"] },
  { id: "city",    name: "Trade City",      hint: "Crowds, gossip, opportunity, watchmen.",             suspicion: 1, danger: 1, oppBias: ["merchant_conflict","overpay","shady_deal"] },
  { id: "roads",   name: "Ruined Roads",    hint: "Ambushes and fortunes lost on the highway.",         suspicion: 0, danger: 3, oppBias: ["lost_package","ambush"] },
  { id: "black",   name: "Black Market",    hint: "Faces you don't ask about. Coin moves fast.",        suspicion: 2, danger: 2, oppBias: ["shady_deal","rigged_table","secret_info"] },
  { id: "temple",  name: "Sky Temple",      hint: "Old stones. Older secrets. Few witnesses.",          suspicion: 0, danger: 2, oppBias: ["secret_info","relic_offer"] },
  { id: "tunnels", name: "Ancient Tunnels", hint: "Forgotten roads under the world. Hard to track you.",suspicion: -1,danger: 3, oppBias: ["relic_offer","lost_package"] },
];

// ────────────────────── OPPORTUNITY POOL ─────────────────────
// Each opportunity must offer A / B / C with distinct payoff curves.
// Some choices write a "consequence" that resolves N days later.
const OPPS = [
  {
    id: "overpay",
    title: "A merchant has just overpaid you.",
    flavor: "His clerk made the math wrong. He hasn't noticed yet.",
    A: { label: "Return the coin.",         text: "+Reputation, no gold.",                    apply: (s)=>({rep:+5, msg:"Word travels: an honest Equar."}) },
    B: { label: "Pocket the difference.",   text: "+Gold. Suspicion creeps up.",              apply: (s)=>({money:+ rng(35,70), suspicion:+10, msg:"You walk fast and don't look back."}) },
    C: { label: "Manipulate his clerk.",    text: "Risk for big gold. Could go very wrong.",  risky:true, apply: (s)=>{
        const luckHit = rollLuck(s.luck, 0.05);
        if (luckHit) return { money:+ rng(140,220), rep:-2, suspicion:+18, msg:"You leave him owing you a 'favor'." };
        return { money:- rng(30,60), suspicion:+25, rep:-5, defer:{ days:3, kind:"clerk_grudge"}, msg:"The clerk caught your eyes. He'll remember." };
      } },
  },
  {
    id: "shady_deal",
    title: "A stranger offers a 'no-questions' parcel run.",
    flavor: "Heavy. Sealed. Pays well if you don't open it.",
    A: { label: "Refuse politely.",          text: "Lose nothing.",                            apply:()=>({msg:"You smile, you decline."}) },
    B: { label: "Run it as asked.",          text: "+Gold. Maybe trouble later.",              apply:(s)=>({money:+ rng(60,110), suspicion:+12, defer:{days:rng(2,5),kind:"parcel_heat"}, msg:"You deliver. Don't think about it."}) },
    C: { label: "Run it AND peek inside.",   text: "Could be a fortune. Could be a curse.",    risky:true, apply:(s)=>{
        if (rollLuck(s.luck, 0.0)) return { money:+ rng(180,280), rep:-3, suspicion:+22, msg:"Inside: enough to vanish for a month."};
        return { money:- rng(20,50), suspicion:+30, defer:{days:rng(2,4), kind:"parcel_betrayal"}, rep:-4, msg:"You should not have looked."};
      } },
  },
  {
    id: "rigged_table",
    title: "A gambling table where the dealer is too smooth.",
    flavor: "Marked dice. You can see the chip.",
    A: { label: "Walk away.",               text: "Wisdom is free.",                          apply:()=>({msg:"Not your fight."}) },
    B: { label: "Play honestly anyway.",    text: "Lose money. Maybe make a friend.",         apply:(s)=>({money:- rng(20,40), rep:+1, msg:"You laugh, you lose, you stay."}) },
    C: { label: "Cheat the cheater.",       text: "Big win or violent eviction.",             risky:true, apply:(s)=>{
        if (rollLuck(s.luck, 0.05)) return { money:+ rng(120,200), rep:+2, suspicion:+15, msg:"You out-cheat him. The crowd loves it."};
        return { hp:- rng(15,30), money:- rng(20,50), suspicion:+20, msg:"The bouncers find your ribs."};
      } },
  },
  {
    id: "merchant_conflict",
    title: "Two merchants are fighting over a contract.",
    flavor: "Both want you on their side. Neither will forget.",
    A: { label: "Side with the elder.",     text: "Steady gold, slower payoff.",              apply:()=>({money:+ rng(40,70), rep:+3, defer:{days:6, kind:"elder_favor"}, msg:"You shake calluses."}) },
    B: { label: "Side with the upstart.",   text: "Bigger short-term win.",                    apply:()=>({money:+ rng(80,130), suspicion:+6, defer:{days:6, kind:"upstart_grudge"}, msg:"The young one grins. The old one stares."}) },
    C: { label: "Sell info to both.",       text: "Most gold. Reputation tanks.",              risky:true, apply:(s)=>({money:+ rng(160,240), rep:-12, suspicion:+18, defer:{days:5, kind:"double_cross"}, msg:"You count coin twice and never look up."}) },
  },
  {
    id: "lost_package",
    title: "A sealed package, lying in the dust.",
    flavor: "Whoever lost it is far away now.",
    A: { label: "Hand it to the watch.",    text: "+Reputation. Coppers reward.",              apply:()=>({money:+ rng(15,30), rep:+4, suspicion:-4, msg:"They thank you. Briefly."}) },
    B: { label: "Keep it.",                  text: "+Gold, but someone is looking for it.",     apply:()=>({money:+ rng(70,120), suspicion:+10, defer:{days:rng(3,6), kind:"lost_package_owner"}, msg:"It rattles in your pack."}) },
    C: { label: "Resell it openly.",         text: "More gold, more eyes.",                     apply:()=>({money:+ rng(110,170), suspicion:+18, defer:{days:rng(2,4), kind:"package_witness"}, msg:"The buyer winks. The buyer talks."}) },
  },
  {
    id: "secret_info",
    title: "You overheard something you weren't meant to.",
    flavor: "It would matter to the right person.",
    A: { label: "Forget you heard.",         text: "Free of charge.",                           apply:()=>({rep:+1, msg:"Some doors stay shut."}) },
    B: { label: "Sell it cheaply.",          text: "Modest gold, low risk.",                     apply:()=>({money:+ rng(30,60), suspicion:+6, msg:"A small purse, a small lie."}) },
    C: { label: "Sell it to the worst person.",text: "Lots of gold. People will die.",           risky:true, apply:()=>({money:+ rng(130,210), rep:-10, suspicion:+12, defer:{days:rng(3,7), kind:"info_blowback"}, msg:"You count quickly."}) },
  },
  {
    id: "ambush",
    title: "Bandits are moving on a wagon ahead.",
    flavor: "You can be useful — or invisible.",
    A: { label: "Warn the wagon.",           text: "+Reputation, big risk of fight.",            apply:()=>({rep:+6, msg:"You sprint. They listen."}) },
    B: { label: "Slip past unseen.",         text: "Nothing gained, nothing lost.",              apply:()=>({suspicion:-2, msg:"They never knew you were there."}) },
    C: { label: "Pick the wagon yourself after.",text:"+Gold. The dead don't complain.",          risky:true, apply:()=>({money:+ rng(60,140), rep:-8, suspicion:+15, defer:{days:rng(2,5), kind:"vulture_seen"}, msg:"You loot what bandits left."}) },
  },
  {
    id: "relic_offer",
    title: "A scholar offers gold for an old relic.",
    flavor: "He won't say where it has to come from.",
    A: { label: "Find one legitimately.",    text: "Slow gold, no heat.",                        apply:()=>({money:+ rng(40,70), rep:+2, msg:"The pay is honest. The work is slow."}) },
    B: { label: "Lift one from the temple.",  text: "Big gold, witnesses possible.",              apply:(s)=>({money:+ rng(140,220), suspicion:+18, defer:{days:rng(2,6),kind:"relic_witness"}, msg:"Stone makes no complaint."}) },
    C: { label: "Forge a fake.",              text: "Profit if scholar can't tell. Reputation hit if he can.", risky:true, apply:(s)=>{
        if (rollLuck(s.luck, 0.05)) return { money:+ rng(180,260), msg:"He thinks it's authentic. He pays in full."};
        return { money:- rng(30,50), rep:-9, suspicion:+12, msg:"He knows. He tells everyone."};
      } },
  },
];

// ────────────────────── FAMILY EVENTS ────────────────────────
const FAMILY_EVENTS = [
  { id:"sibling_help",  title:"Your younger sibling is in trouble.", text:"They need 80 coin or someone will hurt them.",
    A:{label:"Pay the 80.",       cost:80, apply:()=>({trust:+10, safety:+10, msg:"They thank you, eyes wet."}) },
    B:{label:"Solve it yourself.", apply:()=>({trust:+5, safety:+5, defer:{days:2,kind:"sibling_threat"}, msg:"You'll handle this."}) },
    C:{label:"Refuse.",            apply:()=>({trust:-15, relationships:-10, msg:"They go quiet for a long time."}) }
  },
  { id:"family_debt",   title:"An old family debt has come due.", text:"A lender has come to collect 150 coin.",
    A:{label:"Pay in full.",       cost:150, apply:()=>({trust:+8, wealth:+5, msg:"The ledger closes."}) },
    B:{label:"Talk him down.",     apply:()=>({trust:+3, defer:{days:4,kind:"lender_partial"}, msg:"He laughs. He'll be back."}) },
    C:{label:"Stiff him.",         apply:()=>({trust:-5, safety:-15, defer:{days:rng(3,6),kind:"lender_revenge"}, msg:"Bad idea. You know it."}) }
  },
  { id:"family_conflict", title:"Two relatives have stopped speaking.", text:"They want you to pick a side.",
    A:{label:"Mediate.",           apply:()=>({relationships:+12, trust:+4, msg:"You spend a week in their kitchen."}) },
    B:{label:"Side with one.",     apply:()=>({relationships:-6, trust:+3, msg:"You won them. You lost the other."}) },
    C:{label:"Stay out of it.",    apply:()=>({relationships:-3, msg:"You shrug. Quietly."}) }
  },
  { id:"opportunity_for_family", title:"A cousin asks to join your work.",
    text:"They're hungry. Bringing them in changes everything.",
    A:{label:"Bring them in.",     apply:()=>({relationships:+10, wealth:+3, defer:{days:5,kind:"cousin_payoff"}, msg:"They start tomorrow."}) },
    B:{label:"Find them a clean job instead.", cost:60, apply:()=>({trust:+10, safety:+5, msg:"You cover the placement fee."}) },
    C:{label:"Decline.",           apply:()=>({trust:-8, msg:"They walk off without a word."}) }
  },
];

// ────────────────────── COMBAT MOVES ─────────────────────────
// Equar combat = dirty tricks. No big damage. Win by escaping or stunning.
const TRICKS = [
  { id:"sand",     name:"Throw Sand",      desc:"Blind 1 turn, no damage.",   stam:8,  effect:"blind", turns:2 },
  { id:"trip",     name:"Trip the Enemy",  desc:"Stun 1 turn. Light damage.", stam:10, effect:"stun",  dmg:[3,6] },
  { id:"smoke",    name:"Smoke Bomb",      desc:"Massive escape chance.",     stam:14, effect:"escape_boost", val:35 },
  { id:"poison",   name:"Poison Needle",   desc:"Bleed: 4/turn for 3 turns.", stam:12, effect:"bleed", val:4, turns:3 },
  { id:"jab",      name:"Quick Jab",       desc:"Reliable small damage.",     stam:5,  dmg:[5,9] },
  { id:"escape",   name:"Try to Escape",   desc:"Roll vs enemy. Wins end fight.", stam:6, effect:"escape" },
];

// ────────────────────── ABILITIES (UNLOCK TREE) ──────────────
const ABILITIES = [
  { id:"fast_hands",     name:"Fast Hands",      cost:1, desc:"+10% gold from kept-money choices."},
  { id:"escape_artist",  name:"Escape Artist",   cost:1, desc:"+25% chance any escape attempt succeeds."},
  { id:"silver_tongue",  name:"Silver Tongue",   cost:2, desc:"Reputation gains +1 per event."},
  { id:"lucky_timing",   name:"Lucky Timing",    cost:2, desc:"+1 Luck. Risky outcomes lean better."},
  { id:"legal_loophole", name:"Legal Loophole",  cost:2, desc:"Suspicion decays 50% faster while resting."},
];

// ────────────────────── LEGACY UNLOCKS ───────────────────────
const LEGACY_UNLOCKS = [
  { id:"contacts",      cost:3,  name:"Starting Contacts",  desc:"Begin with 1 known friendly merchant."},
  { id:"start_money",   cost:5,  name:"Inheritance",        desc:"+150 starting coin."},
  { id:"family_bonus",  cost:8,  name:"Trusted Bloodline",  desc:"Family Trust starts at 60 instead of 50."},
  { id:"opp_radar",     cost:10, name:"Opportunity Radar",  desc:"Daily chance for a SECOND opportunity."},
];

// ────────────────────── ENDINGS ──────────────────────────────
const ENDINGS = [
  { id:"wealth",    title:"Become the Richest Family",   req:s=>s.money>=2000 && s.family.wealth>=80 },
  { id:"thief",     title:"Become a Legendary Thief",    req:s=>s.suspicion>=80 && s.money>=1200 && s.rep<=-30 },
  { id:"trade",     title:"Build a Trade Empire",         req:s=>s.money>=1500 && s.rep>=60 },
  { id:"underworld",title:"Become an Underworld Leader",  req:s=>s.rep<=-50 && s.suspicion>=60 },
  { id:"explorer",  title:"Become a Famous Explorer",     req:s=>s.regionsExplored>=6 && s.rep>=40 },
];

// ────────────────────── HELPERS ──────────────────────────────
function rng(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function rollLuck(luckStat, bonus){
  // luckStat 0..10 -> 0.30..0.80 odds. bonus shifts.
  const odds = Math.min(0.95, 0.30 + luckStat*0.05 + (bonus||0));
  return Math.random() < odds;
}
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

function loadMeta(){
  try {
    const r = localStorage.getItem(META_KEY);
    return r ? JSON.parse(r) : { legacy: 0, unlocks: [] };
  } catch(e) { return { legacy: 0, unlocks: [] }; }
}
function saveMeta(m){
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch(e) {}
}

// ────────────────────── MAIN COMPONENT ───────────────────────
export default function EquarScenario({ setScreen, bronze, setBronze, notify, diff }) {
  const [meta, setMeta] = useState(() => loadMeta());

  // Difficulty awareness — meta progression locked on hard/insane
  const isHard = !!(diff && diff.perma);
  const metaAllowed = !isHard;

  // Starting bonuses from legacy unlocks
  const hasUnlock = (id) => meta.unlocks.includes(id);

  // ──── Core stats (Equar identity) ────
  const [hp, setHp] = useState(70);
  const [maxHp] = useState(70);
  const [energy, setEnergy] = useState(80);
  const [maxEnergy] = useState(100);
  const [hunger, setHunger] = useState(40); // 0 = stuffed, 100 = starving
  const [suspicion, setSuspicion] = useState(0); // 0..100
  const [rep, setRep] = useState(0); // -100..+100
  const [luck, setLuck] = useState(3 + (hasUnlock("lucky_timing")?1:0));

  // Money + ambition tracking
  const [money, setMoney] = useState(60 + (hasUnlock("start_money") ? 150 : 0));
  const [day, setDay] = useState(1);
  const [region, setRegion] = useState(REGIONS[2]); // Trade City
  const [regionsExplored, setRegionsExplored] = useState(["city"]);
  const [chosenAmbition, setChosenAmbition] = useState(null);

  // Family
  const [family, setFamily] = useState({
    trust: hasUnlock("family_bonus") ? 60 : 50,
    wealth: 30,
    safety: 60,
    relationships: 50,
  });

  // Contacts (legacy unlock or earned later)
  const [contacts, setContacts] = useState(hasUnlock("contacts") ? ["A friendly Trade-City merchant"] : []);

  // Abilities
  const [abilityPoints, setAbilityPoints] = useState(0);
  const [abilities, setAbilities] = useState([]);

  // Pending consequences (deferred outcomes)
  const [pending, setPending] = useState([]); // [{ days, kind }]

  // Daily flow
  const [todayOpps, setTodayOpps] = useState([]);
  const [todayFamily, setTodayFamily] = useState(null);
  const [resolvedToday, setResolvedToday] = useState({}); // { oppId: true }
  const [familyResolved, setFamilyResolved] = useState(false);

  // Log
  const [log, setLog] = useState([]);
  const logRef = useRef(null);
  const addLog = (msg, color="#d4b48b") => setLog(l => [...l.slice(-60), { msg, color, id: Date.now()+Math.random() }]);

  // Combat
  const [fight, setFight] = useState(null); // { enemy:{name,hp,maxHp,atk}, blind, stunTurns, bleed, escapeBoost, escaped }
  const [showEnding, setShowEnding] = useState(null);
  const [showLegacyEarn, setShowLegacyEarn] = useState(null);

  // ──── INIT: roll first day's opportunities ────
  useEffect(() => {
    rollNewDay(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──── Auto-scroll log ────
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  // ──── Ending checks ────
  useEffect(() => {
    if (!chosenAmbition) return;
    const stateForCheck = { money, rep, suspicion, regionsExplored: regionsExplored.length, family };
    const target = ENDINGS.find(e => e.id === chosenAmbition);
    if (target && target.req(stateForCheck)) {
      handleEnding(target);
    }
  }, [money, rep, suspicion, regionsExplored, family, chosenAmbition]);

  // ──── Roll a fresh day ────
  function rollNewDay(initial=false) {
    // Pick 3 opps, biased to current region. Always include some randomness.
    const pool = [...OPPS];
    const biased = pool.filter(o => region.oppBias.includes(o.id));
    const others = pool.filter(o => !region.oppBias.includes(o.id));
    const picks = [];
    while (picks.length < 3) {
      const useBiased = Math.random() < 0.6 && biased.length;
      const arr = useBiased ? biased : others;
      const c = arr[Math.floor(Math.random() * arr.length)];
      if (c && !picks.find(p => p.id === c.id)) picks.push(c);
      if (!biased.length && !others.length) break;
    }
    // Opportunity Radar legacy: 35% chance for a 4th
    if (hasUnlock("opp_radar") && Math.random() < 0.35) {
      const extra = pool.find(o => !picks.find(p => p.id === o.id));
      if (extra) picks.push(extra);
    }
    setTodayOpps(picks);
    setResolvedToday({});

    // Family event ~30% per day
    if (Math.random() < 0.30) {
      const ev = FAMILY_EVENTS[Math.floor(Math.random()*FAMILY_EVENTS.length)];
      setTodayFamily(ev);
    } else {
      setTodayFamily(null);
    }
    setFamilyResolved(false);

    if (!initial) addLog(`Day ${day}: a new set of doors opens.`, "#e8a85c");
  }

  // ──── Ambition selection (one-time choice, can re-pick) ────
  function pickAmbition(id) {
    setChosenAmbition(id);
    notify(`Ambition set: ${ENDINGS.find(e=>e.id===id).title}`, "#e0a523");
    addLog(`You choose your aim: ${ENDINGS.find(e=>e.id===id).title}.`, "#e0a523");
  }

  // ──── Apply opportunity outcome ────
  function applyOutcome(out) {
    if (!out) return;
    const silver = abilities.includes("silver_tongue") ? 1 : 0;
    const fastHands = abilities.includes("fast_hands") ? 0.10 : 0;

    if (typeof out.money === "number") {
      let m = out.money;
      if (m > 0 && fastHands) m = Math.round(m * (1 + fastHands));
      setMoney(v => Math.max(0, v + m));
    }
    if (typeof out.rep === "number") {
      let r = out.rep;
      if (r > 0) r += silver;
      setRep(v => clamp(v + r, -100, 100));
    }
    if (typeof out.suspicion === "number") setSuspicion(v => clamp(v + out.suspicion, 0, 100));
    if (typeof out.hp === "number") {
      const newHp = clamp(hp + out.hp, 0, maxHp);
      setHp(newHp);
      if (newHp <= 0) handleDeath("Wounded too badly. The road claims another Equar.");
    }
    if (out.defer) {
      setPending(p => [...p, { ...out.defer, born: day }]);
    }
    if (out.msg) addLog(out.msg, out.rep < 0 || out.suspicion >= 15 ? "#d97a5a" : "#d4b48b");
  }

  // ──── Handle a player choice on an opportunity ────
  function chooseOpportunity(opp, key) {
    if (resolvedToday[opp.id]) return;
    const state = { money, rep, suspicion, luck, hp, abilities, family };
    const branch = opp[key];
    if (!branch) return;
    const out = typeof branch.apply === "function" ? branch.apply(state) : (branch.apply || {});
    applyOutcome(out);
    setResolvedToday(r => ({ ...r, [opp.id]: key }));

    // Earn an ability point on every C choice (high-risk teaches cleverness)
    if (key === "C") setAbilityPoints(p => p + 1);
  }

  // ──── Handle a family choice ────
  function chooseFamily(ev, key) {
    if (familyResolved) return;
    const branch = ev[key];
    if (branch.cost && money < branch.cost) {
      notify("Not enough coin.", "#b83a2a");
      return;
    }
    if (branch.cost) setMoney(m => m - branch.cost);
    const out = branch.apply ? branch.apply() : {};
    setFamily(f => {
      const nf = { ...f };
      ["trust","wealth","safety","relationships"].forEach(k => { if (typeof out[k] === "number") nf[k] = clamp(nf[k] + out[k], 0, 100); });
      return nf;
    });
    if (out.defer) setPending(p => [...p, { ...out.defer, born: day }]);
    if (out.msg) addLog(out.msg, "#c8b394");
    setFamilyResolved(true);
  }

  // ──── Travel to another region ────
  function travel(r) {
    if (r.id === region.id) return;
    if (energy < 15) { notify("Too exhausted to travel.", "#b83a2a"); return; }
    setEnergy(e => Math.max(0, e - 15));
    setRegion(r);
    if (!regionsExplored.includes(r.id)) setRegionsExplored(arr => [...arr, r.id]);
    setSuspicion(v => clamp(v + (r.suspicion||0), 0, 100));
    addLog(`You slip into ${r.name}. ${r.hint}`, "#a8a07c");
  }

  // ──── Rest / advance day ────
  function endDay(restType) {
    let energyGain = 30, hpGain = 8, suspicionDecay = -8, hungerGain = 25, cost = 0;
    if (restType === "inn") { energyGain = 60; hpGain = 22; suspicionDecay = -15; hungerGain = 0; cost = 25; }
    else if (restType === "safehouse") { energyGain = 80; hpGain = 35; suspicionDecay = -22; hungerGain = -10; cost = 60; }

    if (cost && money < cost) { notify("Not enough coin to lodge there.", "#b83a2a"); return; }
    if (cost) setMoney(m => m - cost);

    // Legal Loophole: faster suspicion decay during rest
    if (abilities.includes("legal_loophole")) suspicionDecay = Math.round(suspicionDecay * 1.5);

    setEnergy(e => clamp(e + energyGain, 0, maxEnergy));
    setHp(h => clamp(h + hpGain, 0, maxHp));
    setSuspicion(v => clamp(v + suspicionDecay, 0, 100));
    setHunger(h => clamp(h + hungerGain, 0, 100));

    // Hunger penalties
    if (hunger >= 80) {
      setHp(h => Math.max(0, h - 10));
      addLog("Hunger gnaws at you. -10 HP.", "#d97a5a");
    }

    // Tick deferred consequences
    const newDay = day + 1;
    const fired = [];
    const remaining = [];
    pending.forEach(c => {
      if (newDay - c.born >= c.days) fired.push(c);
      else remaining.push(c);
    });
    setPending(remaining);
    fired.forEach(triggerConsequence);

    // Check if death by combined suspicion + bad rep -> bounty
    if (suspicion >= 95 && rep <= -40) {
      addLog("Bounty hunters have caught your scent.", "#d84838");
      // 50% chance they actually find you tonight
      if (Math.random() < 0.5) startCombat({ name:"Bounty Hunter", hp:40, atk:[8,14], escapeDC:0.55, reward:0 });
      return;
    }

    setDay(newDay);
    rollNewDay();
  }

  // ──── Trigger a deferred consequence ────
  function triggerConsequence(c) {
    switch (c.kind) {
      case "clerk_grudge":
        addLog("The clerk you slighted hired men to find you.", "#d97a5a");
        startCombat({ name:"Hired Thug", hp:32, atk:[6,11], escapeDC:0.45, reward:0 });
        break;
      case "parcel_heat":
        addLog("Whispers about that parcel reach the wrong ears. +Suspicion.", "#d97a5a");
        setSuspicion(v => clamp(v + 12, 0, 100));
        break;
      case "parcel_betrayal":
        addLog("The package's true owner sends mercenaries.", "#d84838");
        startCombat({ name:"Sealed-Order Mercenary", hp:48, atk:[8,15], escapeDC:0.40, reward:0 });
        break;
      case "lender_revenge":
        addLog("The lender broke your sister's window. -Family Safety.", "#d97a5a");
        setFamily(f => ({ ...f, safety: clamp(f.safety - 18, 0, 100), trust: clamp(f.trust - 6, 0, 100) }));
        break;
      case "lender_partial":
        addLog("The lender accepts a partial payment. -50 coin.", "#c8b394");
        setMoney(m => Math.max(0, m - 50));
        break;
      case "elder_favor":
        addLog("The elder merchant rewards your loyalty. +80 coin.", "#79b07c");
        setMoney(m => m + 80);
        break;
      case "upstart_grudge":
        addLog("The upstart spread rumors. -Reputation.", "#d97a5a");
        setRep(v => clamp(v - 10, -100, 100));
        break;
      case "double_cross":
        addLog("Both merchants compared notes. They know.", "#d84838");
        setRep(v => clamp(v - 15, -100, 100));
        setSuspicion(v => clamp(v + 12, 0, 100));
        break;
      case "lost_package_owner":
        addLog("The owner of the package found your name.", "#d97a5a");
        startCombat({ name:"Furious Courier", hp:28, atk:[5,9], escapeDC:0.50, reward:0 });
        break;
      case "package_witness":
      case "vulture_seen":
      case "relic_witness":
        addLog("Witnesses reported you. Suspicion spikes.", "#d97a5a");
        setSuspicion(v => clamp(v + 18, 0, 100));
        break;
      case "info_blowback":
        addLog("Someone died because of what you sold. -Reputation, -Family Safety.", "#d84838");
        setRep(v => clamp(v - 12, -100, 100));
        setFamily(f => ({ ...f, safety: clamp(f.safety - 8, 0, 100) }));
        break;
      case "cousin_payoff":
        addLog("Your cousin's first run pays off: +120 coin.", "#79b07c");
        setMoney(m => m + 120);
        break;
      case "sibling_threat":
        addLog("Your sibling got hurt because you didn't pay. -Family Trust.", "#d84838");
        setFamily(f => ({ ...f, trust: clamp(f.trust - 18, 0, 100), safety: clamp(f.safety - 10, 0, 100) }));
        break;
      default: break;
    }
  }

  // ──── COMBAT ────
  function startCombat(enemy) {
    setFight({
      enemy: { name: enemy.name, hp: enemy.hp, maxHp: enemy.hp, atk: enemy.atk, escapeDC: enemy.escapeDC, reward: enemy.reward },
      blind: 0, stunTurns: 0, bleedRem: 0, bleedDmg: 0, escapeBoost: 0, msg: "They blocked your path."
    });
  }

  function trickAct(t) {
    if (!fight) return;
    if (energy < t.stam) { notify("Too tired.", "#b83a2a"); return; }
    setEnergy(e => Math.max(0, e - t.stam));
    let f = { ...fight };
    let enemy = { ...f.enemy };

    // Player effect
    if (t.dmg) {
      const dmg = rng(t.dmg[0], t.dmg[1]);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      addLog(`${t.name}: ${dmg} damage to ${enemy.name}.`, "#d4b48b");
    }
    if (t.effect === "blind") { f.blind = (f.blind||0) + (t.turns||2); addLog(`${enemy.name} blinded.`, "#a8a07c"); }
    if (t.effect === "stun")  { f.stunTurns = (f.stunTurns||0) + 1; addLog(`${enemy.name} stunned.`, "#a8a07c"); }
    if (t.effect === "bleed") { f.bleedRem = t.turns||3; f.bleedDmg = t.val||4; addLog(`${enemy.name} bleeds.`, "#a8a07c"); }
    if (t.effect === "escape_boost") { f.escapeBoost = t.val||0; addLog("Smoke fills the air. You can almost walk out.", "#c8b394"); }

    if (t.effect === "escape") {
      const baseDC = enemy.escapeDC ?? 0.50;
      const artistBonus = abilities.includes("escape_artist") ? 0.25 : 0;
      const smokeBonus = (f.escapeBoost||0)/100;
      const chance = Math.min(0.95, baseDC + artistBonus + smokeBonus);
      if (Math.random() < chance) {
        addLog(`You vanish into the crowd. (${Math.round(chance*100)}% roll)`, "#79b07c");
        setFight(null);
        return;
      } else {
        addLog(`Escape failed. (${Math.round(chance*100)}% roll)`, "#d97a5a");
      }
    }

    // Apply bleed
    if (f.bleedRem > 0 && t.effect !== "bleed") {
      enemy.hp = Math.max(0, enemy.hp - f.bleedDmg);
      f.bleedRem -= 1;
      addLog(`Bleed: -${f.bleedDmg} HP.`, "#d4b48b");
    }

    if (enemy.hp <= 0) {
      addLog(`You drop ${enemy.name}.`, "#79b07c");
      setFight(null);
      // Killing leaves a body — suspicion rises
      setSuspicion(v => clamp(v + 8, 0, 100));
      return;
    }

    // Enemy's turn
    f.enemy = enemy;
    setTimeout(() => enemyTurn(f), 500);
    setFight(f);
  }

  function enemyTurn(f) {
    let nf = { ...f };
    if (nf.stunTurns > 0) {
      nf.stunTurns -= 1;
      addLog(`${nf.enemy.name} can't act.`, "#a8a07c");
      setFight(nf);
      return;
    }
    let raw = rng(nf.enemy.atk[0], nf.enemy.atk[1]);
    if (nf.blind > 0) {
      nf.blind -= 1;
      if (Math.random() < 0.55) {
        addLog(`${nf.enemy.name} swings wide.`, "#a8a07c");
        setFight(nf);
        return;
      }
      raw = Math.max(1, raw - 3);
    }
    setHp(h => {
      const nh = Math.max(0, h - raw);
      if (nh <= 0) { setTimeout(()=>handleDeath(`${nf.enemy.name} brought you down.`), 400); }
      return nh;
    });
    addLog(`${nf.enemy.name} hits you for ${raw}.`, "#d97a5a");
    setFight(nf);
  }

  // ──── DEATH / ENDINGS ────
  function handleDeath(reason) {
    addLog(reason, "#d84838");
    awardLegacy(false);
    setShowEnding({ kind:"death", title:"Your run ends.", reason });
  }
  function handleEnding(ending) {
    if (showEnding) return;
    addLog(`Ambition fulfilled: ${ending.title}.`, "#e0a523");
    awardLegacy(true);
    setShowEnding({ kind:"win", title:ending.title, reason:"You've made your name." });
  }

  function awardLegacy(success) {
    if (!metaAllowed) return; // hard/insane: no meta
    const earned = success ? 5 : 1;
    const next = { ...meta, legacy: meta.legacy + earned };
    setMeta(next);
    saveMeta(next);
    setShowLegacyEarn(earned);
  }

  function buyAbility(a) {
    if (abilityPoints < a.cost) { notify("Not enough ability points.", "#b83a2a"); return; }
    if (abilities.includes(a.id)) return;
    setAbilityPoints(p => p - a.cost);
    setAbilities(arr => [...arr, a.id]);
    if (a.id === "lucky_timing") setLuck(l => l + 1);
    notify(`Learned: ${a.name}`, "#e0a523");
  }

  function buyLegacy(u) {
    if (meta.legacy < u.cost || meta.unlocks.includes(u.id)) return;
    const next = { legacy: meta.legacy - u.cost, unlocks: [...meta.unlocks, u.id] };
    setMeta(next); saveMeta(next);
    notify(`Legacy unlocked: ${u.name}`, "#e0a523");
  }

  // ──── COLOR PALETTE — copper / dusk / parchment ────
  // Distinct from Elf (frost) and Tenebrim (red/black).
  const BG = "linear-gradient(165deg, #2a1408 0%, #3d1f0d 35%, #1a0d05 100%)";
  const CARD = "linear-gradient(180deg, rgba(60,30,15,0.85) 0%, rgba(28,14,6,0.95) 100%)";
  const COPPER = "#e0a060";
  const RUST = "#b86c2a";

  // ──── RENDER: ENDING SCREEN ────
  if (showEnding) {
    return (
      <div style={{ minHeight:"100vh", background:BG, fontFamily:"var(--font-sans)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ maxWidth:540, textAlign:"center", background:CARD, border:`2px solid ${showEnding.kind==="win"?COPPER:"#b83a2a"}`, padding:"36px 28px", borderRadius:14, boxShadow:`0 0 60px ${showEnding.kind==="win"?"rgba(224,160,96,0.4)":"rgba(184,58,42,0.4)"}` }}>
          <p style={{ fontSize:11, color:"#b88a5a", letterSpacing:"0.3em", fontWeight:700, marginBottom:10 }}>{showEnding.kind==="win"?"AMBITION FULFILLED":"END OF THE LINE"}</p>
          <h1 style={{ fontSize:32, fontWeight:900, color:"#fff", margin:"0 0 14px" }}>{showEnding.title}</h1>
          <p style={{ fontSize:14, color:"rgba(255,235,200,0.7)", lineHeight:1.7, marginBottom:24 }}>{showEnding.reason}</p>
          {metaAllowed && showLegacyEarn != null && (
            <p style={{ fontSize:13, color:COPPER, marginBottom:20 }}>+{showLegacyEarn} Family Legacy earned. (Total: {meta.legacy})</p>
          )}
          {!metaAllowed && (
            <p style={{ fontSize:12, color:"#b88a5a", marginBottom:20, fontStyle:"italic" }}>Hard/Insane runs do not contribute to Family Legacy.</p>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Btn variant="gold" full onClick={() => { localStorage.removeItem(SAVE_KEY); setScreen("main_menu"); }}>Return to main menu</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ──── RENDER: COMBAT VIEW ────
  if (fight) {
    return (
      <div style={{ minHeight:"100vh", background:BG, fontFamily:"var(--font-sans)" }}>
        <div style={{ background:"rgba(0,0,0,0.6)", borderBottom:`1px solid ${RUST}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontWeight:900, fontSize:14, color:COPPER, letterSpacing:"0.05em" }}>SKIRMISH</span>
          <span style={{ fontSize:12, color:"rgba(255,235,200,0.6)" }}>You don't out-muscle them. You out-think them.</span>
        </div>
        <div style={{ maxWidth:760, margin:"0 auto", padding:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            <Panel style={{ borderColor:RUST, background:"rgba(60,30,15,0.55)" }}>
              <p style={{ fontSize:10, color:"#b88a5a", letterSpacing:"0.15em", fontWeight:800, marginBottom:8 }}>YOU</p>
              <Bar val={hp} max={maxHp} color="#d96a5a" h={9}/>
              <p style={{ fontSize:11, color:"rgba(255,235,200,0.6)", marginTop:6 }}>HP {hp}/{maxHp} · Energy {energy}/{maxEnergy}</p>
            </Panel>
            <Panel style={{ borderColor:RUST, background:"rgba(60,20,10,0.55)" }}>
              <p style={{ fontSize:10, color:"#b88a5a", letterSpacing:"0.15em", fontWeight:800, marginBottom:8 }}>{fight.enemy.name.toUpperCase()}</p>
              <Bar val={fight.enemy.hp} max={fight.enemy.maxHp} color={COPPER} h={9}/>
              <p style={{ fontSize:11, color:"rgba(255,235,200,0.6)", marginTop:6 }}>HP {fight.enemy.hp}/{fight.enemy.maxHp}</p>
              <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                {fight.blind > 0 && <Tag color="#a8a07c">Blinded {fight.blind}</Tag>}
                {fight.stunTurns > 0 && <Tag color="#a8a07c">Stunned {fight.stunTurns}</Tag>}
                {fight.bleedRem > 0 && <Tag color="#d97a5a">Bleed {fight.bleedRem}</Tag>}
                {fight.escapeBoost > 0 && <Tag color={COPPER}>Smoke +{fight.escapeBoost}%</Tag>}
              </div>
            </Panel>
          </div>
          <div ref={logRef} style={{ maxHeight:140, overflowY:"auto", padding:"10px 12px", border:`1px solid ${RUST}40`, borderRadius:10, fontSize:12, lineHeight:1.7, marginBottom:14, background:"rgba(0,0,0,0.4)" }}>
            {log.slice(-12).map(l => <div key={l.id} style={{ color:l.color }}>{l.msg}</div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:10 }}>
            {TRICKS.map(t => (
              <button
                key={t.id}
                onClick={() => trickAct(t)}
                disabled={energy < t.stam}
                style={{
                  padding:"12px 14px", borderRadius:10, border:`1px solid ${COPPER}55`,
                  background: energy < t.stam ? "rgba(60,30,15,0.3)" : "rgba(60,30,15,0.6)",
                  color:"#fff", textAlign:"left", cursor: energy < t.stam ? "not-allowed" : "pointer",
                  opacity: energy < t.stam ? 0.5 : 1,
                  transition:"all 0.15s",
                }}
              >
                <p style={{ fontWeight:800, color:COPPER, marginBottom:4 }}>{t.name}</p>
                <p style={{ fontSize:11, color:"rgba(255,235,200,0.6)", marginBottom:6, lineHeight:1.5 }}>{t.desc}</p>
                <Tag color="#79b07c">{t.stam} energy</Tag>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ──── RENDER: AMBITION SELECTION (first-time gate) ────
  if (!chosenAmbition) {
    return (
      <div style={{ minHeight:"100vh", background:BG, fontFamily:"var(--font-sans)", padding:"3rem 1.5rem" }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <Tag color={COPPER}>Equar · The First Choice</Tag>
          <h2 style={{ fontSize:32, fontWeight:900, color:"#fff", margin:"14px 0 6px" }}>What kind of life will you make?</h2>
          <p style={{ fontSize:14, color:"rgba(255,235,200,0.65)", marginBottom:24, lineHeight:1.7 }}>
            You are not stronger than them. You are smarter. Pick the shape of your story — you can change your aim later, but the game will end when you reach one of these.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {ENDINGS.map(e => (
              <Panel key={e.id} onClick={()=>pickAmbition(e.id)} style={{ cursor:"pointer", borderColor:`${COPPER}55`, background:CARD }}>
                <p style={{ fontWeight:800, color:COPPER, marginBottom:4 }}>{e.title}</p>
                <p style={{ fontSize:12, color:"rgba(255,235,200,0.55)" }}>{ambitionHint(e.id)}</p>
              </Panel>
            ))}
          </div>
          <div style={{ marginTop:30, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Btn variant="ghost" onClick={()=>setScreen("main_menu")}>← Main menu</Btn>
            {metaAllowed && (
              <span style={{ fontSize:12, color:"#b88a5a" }}>Family Legacy: <b style={{color:COPPER}}>{meta.legacy}</b></span>
            )}
          </div>
          {metaAllowed && meta.legacy > 0 && (
            <Panel style={{ marginTop:18, background:CARD, borderColor:`${COPPER}40` }}>
              <p style={{ fontWeight:800, color:COPPER, marginBottom:8 }}>Legacy Unlocks (apply at start of next run)</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {LEGACY_UNLOCKS.map(u => (
                  <button
                    key={u.id}
                    onClick={()=>buyLegacy(u)}
                    disabled={meta.unlocks.includes(u.id) || meta.legacy < u.cost}
                    style={{
                      padding:"8px 12px", borderRadius:8,
                      border:`1px solid ${meta.unlocks.includes(u.id)?"#79b07c":COPPER}55`,
                      background: meta.unlocks.includes(u.id) ? "rgba(121,176,124,0.15)" : "rgba(60,30,15,0.5)",
                      color: meta.unlocks.includes(u.id) ? "#79b07c" : "#fff",
                      fontSize:12, cursor: meta.unlocks.includes(u.id)?"default":"pointer", textAlign:"left", flex:"1 1 240px"
                    }}>
                    <div style={{fontWeight:700}}>{u.name} {meta.unlocks.includes(u.id) ? "✓" : `(${u.cost})`}</div>
                    <div style={{fontSize:11, opacity:0.75, marginTop:3}}>{u.desc}</div>
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    );
  }

  // ──── RENDER: MAIN HUB ────
  const suspicionColor = suspicion >= 70 ? "#d84838" : suspicion >= 40 ? COPPER : "#79b07c";
  const repColor = rep >= 30 ? "#79b07c" : rep <= -30 ? "#d84838" : COPPER;

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"var(--font-sans)" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))", borderBottom:`1px solid ${RUST}55`, padding:"11px 16px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:12 }}>
        <span style={{ fontWeight:900, fontSize:16, color:COPPER, letterSpacing:"0.05em", textShadow:"0 0 10px rgba(224,160,96,0.4)" }}>EQUAR · {region.name.toUpperCase()}</span>
        <div style={{ flex:1, display:"flex", flexWrap:"wrap", gap:10 }}>
          <StatChip label="HP"        val={hp}        max={maxHp}     color="#d96a5a" />
          <StatChip label="Energy"    val={energy}    max={maxEnergy} color="#79b07c" />
          <StatChip label="Hunger"    val={hunger}    max={100}       color={hunger>70?"#d84838":COPPER} />
          <StatChip label="Suspicion" val={suspicion} max={100}       color={suspicionColor} />
          <StatChip label="Reputation" val={rep+100}   max={200}       color={repColor} display={`${rep>0?"+":""}${rep}`} />
          <StatChip label="Luck"      val={luck*10}   max={100}       color={COPPER} display={luck.toString()} />
        </div>
        <span style={{ fontSize:12, color:"#b88a5a" }}>Day {day}</span>
        <Btn small variant="ghost" onClick={()=>setScreen("main_menu")}>☰ Menu</Btn>
      </div>

      <div style={{ padding:"6px 16px", background:"rgba(0,0,0,0.25)", display:"flex", gap:14, alignItems:"center" }}>
        <CoinBar bronze={money} />
        <span style={{ fontSize:12, color:"#b88a5a" }}>Aim: <b style={{color:COPPER}}>{ENDINGS.find(e=>e.id===chosenAmbition)?.title}</b></span>
        {abilityPoints>0 && <Tag color={COPPER}>{abilityPoints} ability pt</Tag>}
        {pending.length>0 && <Tag color="#d97a5a">{pending.length} pending</Tag>}
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"16px", display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        {/* LEFT: Opportunities + family event */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Panel style={{ background:CARD, borderColor:`${COPPER}40` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>TODAY'S OPPORTUNITIES</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {todayOpps.map(opp => {
                const picked = resolvedToday[opp.id];
                return (
                  <div key={opp.id} style={{ borderTop:`1px solid ${RUST}33`, paddingTop:10 }}>
                    <p style={{ fontWeight:800, color:"#fff", marginBottom:4 }}>{opp.title}</p>
                    <p style={{ fontSize:12, color:"rgba(255,235,200,0.55)", marginBottom:10, fontStyle:"italic" }}>{opp.flavor}</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:8 }}>
                      {["A","B","C"].map(k => (
                        <button
                          key={k}
                          onClick={()=>chooseOpportunity(opp,k)}
                          disabled={!!picked}
                          style={{
                            padding:"10px 12px", borderRadius:8,
                            border: picked===k ? `2px solid ${COPPER}` : `1px solid ${k==="C"?"#d84838":k==="A"?"#79b07c":COPPER}55`,
                            background: picked ? (picked===k ? `${COPPER}22` : "rgba(40,20,10,0.4)") : "rgba(40,20,10,0.55)",
                            color: picked && picked!==k ? "rgba(255,255,255,0.4)" : "#fff",
                            cursor: picked ? "default" : "pointer",
                            textAlign:"left", fontSize:12, lineHeight:1.5
                          }}
                        >
                          <div style={{ fontWeight:800, marginBottom:3, color: k==="C"?"#e85c3a":k==="A"?"#79b07c":COPPER }}>{k}: {opp[k].label}</div>
                          <div style={{ opacity:0.8 }}>{opp[k].text}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {todayFamily && (
            <Panel style={{ background:"linear-gradient(180deg, rgba(80,40,15,0.85), rgba(40,20,8,0.95))", borderColor:COPPER }}>
              <p style={{ fontSize:11, letterSpacing:"0.2em", color:COPPER, fontWeight:800, marginBottom:8 }}>FAMILY · {todayFamily.title}</p>
              <p style={{ fontSize:13, color:"rgba(255,235,200,0.85)", marginBottom:14 }}>{todayFamily.text}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:8 }}>
                {["A","B","C"].map(k => {
                  const branch = todayFamily[k];
                  const blocked = branch.cost && money < branch.cost;
                  return (
                    <button
                      key={k}
                      onClick={()=>chooseFamily(todayFamily, k)}
                      disabled={familyResolved || blocked}
                      style={{
                        padding:"10px 12px", borderRadius:8,
                        border:`1px solid ${COPPER}55`,
                        background: familyResolved ? "rgba(40,20,10,0.4)" : "rgba(60,30,15,0.7)",
                        color: blocked ? "rgba(255,255,255,0.4)" : "#fff",
                        cursor: familyResolved||blocked?"not-allowed":"pointer",
                        textAlign:"left", fontSize:12
                      }}
                    >
                      <div style={{ fontWeight:800, marginBottom:3, color:COPPER }}>{k}: {branch.label}{branch.cost?` (${branch.cost} coin)`:""}</div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* End-of-day */}
          <Panel style={{ background:CARD, borderColor:`${RUST}55` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>END THE DAY</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:8 }}>
              <Btn variant="ghost" onClick={()=>endDay("rough")}>Sleep rough (free)</Btn>
              <Btn variant="primary" onClick={()=>endDay("inn")} disabled={money<25}>Inn (25 coin)</Btn>
              <Btn variant="gold" onClick={()=>endDay("safehouse")} disabled={money<60}>Safehouse (60 coin)</Btn>
            </div>
          </Panel>

          {/* Log */}
          <Panel style={{ background:CARD, borderColor:`${RUST}33` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>LOG</p>
            <div ref={logRef} style={{ maxHeight:160, overflowY:"auto", fontSize:12, lineHeight:1.7 }}>
              {log.length===0 && <span style={{ color:"rgba(255,235,200,0.35)" }}>Quiet so far.</span>}
              {log.map(l=><div key={l.id} style={{color:l.color}}>{l.msg}</div>)}
            </div>
          </Panel>
        </div>

        {/* RIGHT: Family + travel + abilities + ambition */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Panel style={{ background:CARD, borderColor:`${COPPER}40` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>FAMILY</p>
            <FamilyMeter label="Trust"        val={family.trust}        color={COPPER} />
            <FamilyMeter label="Wealth"       val={family.wealth}       color="#79b07c" />
            <FamilyMeter label="Safety"       val={family.safety}       color="#d96a5a" />
            <FamilyMeter label="Relationships" val={family.relationships} color="#a89df0" />
          </Panel>

          <Panel style={{ background:CARD, borderColor:`${COPPER}40` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>TRAVEL</p>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={()=>travel(r)}
                  disabled={r.id===region.id || energy<15}
                  style={{
                    padding:"8px 10px", borderRadius:8,
                    border: r.id===region.id?`2px solid ${COPPER}`:`1px solid ${COPPER}33`,
                    background: r.id===region.id?`${COPPER}22`:"rgba(40,20,10,0.5)",
                    color: r.id===region.id?COPPER:"#fff", textAlign:"left",
                    cursor: r.id===region.id || energy<15?"not-allowed":"pointer",
                    fontSize:12
                  }}>
                  <div style={{ fontWeight:700 }}>{r.name} {regionsExplored.includes(r.id) && r.id!==region.id && <span style={{fontSize:10, opacity:0.6}}>(visited)</span>}</div>
                  <div style={{ fontSize:11, opacity:0.7 }}>{r.hint}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel style={{ background:CARD, borderColor:`${COPPER}40` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>ABILITIES</p>
            <p style={{ fontSize:12, color:"rgba(255,235,200,0.55)", marginBottom:10 }}>Earn 1 ability point each time you take a risky (C) opportunity.</p>
            {ABILITIES.map(a => {
              const owned = abilities.includes(a.id);
              const can = abilityPoints >= a.cost && !owned;
              return (
                <button
                  key={a.id}
                  onClick={()=>buyAbility(a)}
                  disabled={!can}
                  style={{
                    width:"100%", padding:"8px 10px", marginBottom:6, borderRadius:8,
                    border:`1px solid ${owned?"#79b07c":COPPER}55`,
                    background: owned?"rgba(121,176,124,0.15)":"rgba(40,20,10,0.5)",
                    color: owned?"#79b07c":(can?"#fff":"rgba(255,255,255,0.4)"),
                    textAlign:"left", cursor:can?"pointer":"default", fontSize:12
                  }}>
                  <div style={{fontWeight:700}}>{a.name} {owned ? "✓" : `(${a.cost})`}</div>
                  <div style={{fontSize:11, opacity:0.75, marginTop:2}}>{a.desc}</div>
                </button>
              );
            })}
          </Panel>

          <Panel style={{ background:CARD, borderColor:`${COPPER}40` }}>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:10 }}>YOUR AIM</p>
            <p style={{ fontSize:12, color:"rgba(255,235,200,0.7)", marginBottom:10 }}>{ambitionHint(chosenAmbition)}</p>
            <Btn small variant="ghost" full onClick={()=>setChosenAmbition(null)}>Change ambition</Btn>
          </Panel>

          {contacts.length>0 && (
            <Panel style={{ background:CARD, borderColor:`${COPPER}40` }}>
              <p style={{ fontSize:11, letterSpacing:"0.2em", color:"#b88a5a", fontWeight:800, marginBottom:8 }}>CONTACTS</p>
              <ul style={{ margin:0, padding:"0 0 0 18px", color:"rgba(255,235,200,0.7)", fontSize:12 }}>
                {contacts.map((c,i)=> <li key={i} style={{marginBottom:4}}>{c}</li>)}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── SUB-WIDGETS ───────────────────────
function StatChip({ label, val, max, color, display }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:120, background:"rgba(0,0,0,0.4)", padding:"5px 10px", borderRadius:6, border:`1px solid ${color}33` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontSize:10, fontWeight:800, color, letterSpacing:"0.05em" }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{display ?? val}</span>
      </div>
      <Bar val={val} max={max} color={color} h={5}/>
    </div>
  );
}

function FamilyMeter({ label, val, color }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:11, color:"rgba(255,235,200,0.65)", fontWeight:700 }}>{label}</span>
        <span style={{ fontSize:11, color, fontWeight:700 }}>{val}/100</span>
      </div>
      <Bar val={val} max={100} color={color} h={6}/>
    </div>
  );
}

function ambitionHint(id) {
  switch (id) {
    case "wealth":     return "Need ~2000 coin and Family Wealth ≥ 80.";
    case "thief":      return "Need ~1200 coin, Suspicion ≥ 80, Reputation ≤ -30.";
    case "trade":      return "Need ~1500 coin and Reputation ≥ 60.";
    case "underworld": return "Need Reputation ≤ -50 and Suspicion ≥ 60.";
    case "explorer":   return "Visit all 7 regions and reach Reputation ≥ 40.";
    default: return "";
  }
}
