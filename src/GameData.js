// GameData.js
export const RACES=[
  {id:"human",name:"Human",locked:false,desc:"Versatile.",flavor:"A blank slate.",hpBonus:0,atkBonus:0,defBonus:0,dodge:5,mpBonus:0,canSpell:true},
  {id:"equar",name:"Equar",locked:false,desc:"Small, sharp, fast.",flavor:"Reflexes second to none. Merchants.",hpBonus:-5,atkBonus:2,defBonus:0,dodge:28,mpBonus:0,canSpell:true,canMerchant:true},
  {id:"tetrabrachian",name:"Tetrabrachian",locked:false,desc:"Four-armed and powerfully built.",flavor:"Wields two weapons.",hpBonus:15,atkBonus:3,defBonus:1,dodge:5,mpBonus:0,canSpell:false},
  {id:"lizardman",name:"Lizardman",locked:true,desc:"Locked indefinitely.",unlockHint:"Unique gameplay coming."},
  {
    id: "tenebrim",
    name: "Tenebrim",
    desc: "A shadow-touched race. Randomized start: slave in Elysandria or free tribe in Menfor.",
    flavor: "Physically imposing, but incapable of casting normal spells.",
    hpBonus: 25,
    atkBonus: 5,
    defBonus: 2,
    canSpell: false,
    locked: false
  },
  {id:"devil",name:"Devil",locked:false,desc:"Starts in the Underworld.",flavor:"Innate elemental spells.",hpBonus:5,atkBonus:2,defBonus:1,dodge:8,mpBonus:40,canSpell:true},
  {id:"beastkin",name:"Beastkin",locked:true,desc:"Locked indefinitely.",unlockHint:"Unique gameplay coming."},
  {
    id: "elf",
    name: "Elf",
    locked: true,
    unlockReq: 3,
    desc: "A harsh Frostpunk-style survival scenario.",
    unlockHint: "Defeat 3 Doomsdays to unlock.",
    hpBonus: 0, 
    atkBonus: 0, 
    defBonus: 0, 
    dodge: 10, 
    mpBonus: 0, 
    canSpell: true
  }
];

export const ORIGINS=[{id:"traveler",name:"Wandering contractor",desc:"On the road long enough."},{id:"youth",name:"Youth leaving home",desc:"Earn money or find independence."}];

export const CLASSES = [
  { id: "adventurer", name: "Adventurer", org: "Alabastrine Guild", desc: "General combat and exploration contracts." },
  { id: "hunter", name: "Hunter", org: "Hunter Association", desc: "Specializes in tracking and beast contracts." },
  { id: "merchant", name: "Merchant", org: "Independent", desc: "Focuses on crafting and trade requests. (Equar only)" }
];

// 2. Make sure "Silk" exists as a base material so you can actually craft Robes/Armor!
export const MATERIALS = [
  { id: "junk", name: "Junk", price: 2 },
  { id: "parts", name: "Mechanical Parts", price: 10 },
  { id: "hide", name: "Beast Hide", price: 15 },
  { id: "silk", name: "Spider Silk", price: 25 }, // <-- FIXED: Added missing Silk
  { id: "ore", name: "Iron Ore", price: 20 }
];
export const RANKS=["Bronze","Iron","Silver","Gold","Diamond","Platinum"];
export const RANK_THRESHOLDS=[80,250,600,1400,3000];
export const RANK_MULT=[1.0,1.15,1.35,1.6,2.0,2.5];
export const GRACE={0:[5,10,15],1:[7,14,21],2:[10,20,30],3:[14,28,42],4:[20,40,60],5:null};

export const DIFFS=[
  {id:"easy",name:"Easy",desc:"Reduced enemy damage, faster gold. Single enemies.",enemyAtk:0.7,goldMult:1.5,enemies:1,perma:false,hpMult:0.85},
  {id:"normal",name:"Normal",desc:"Standard balance. Two enemies per fight.",enemyAtk:1,goldMult:1,enemies:2,perma:false,hpMult:1},
  {id:"hard",name:"Hard",desc:"Less gold, tougher enemies, two per fight. Permadeath.",enemyAtk:1.2,goldMult:0.6,enemies:2,perma:true,hpMult:1.3},
  {id:"insanity",name:"Insanity",desc:"Three enemies, much harder. Permadeath. Defeat the Lumenari to unlock.",enemyAtk:1.5,goldMult:0.4,enemies:3,perma:true,hpMult:1.6,locked:true,unlockReq:1},
];

export const MONSTERS=[
  {id:"cur",name:"Mana-touched cur",star:1,desc:"A lean dog with luminous eyes.",hp:35,atk:7,def:1,reward:{xp:28,bronze:6}},
  {id:"crawler",name:"Tunnel crawler",star:1,desc:"Six-limbed.",hp:50,atk:10,def:3,reward:{xp:40,bronze:9}},
  {id:"wanderer",name:"Gaunt wanderer",star:2,desc:"Used to be human.",hp:65,atk:14,def:2,reward:{xp:55,bronze:14}},
  {id:"brute",name:"Stone-backed brute",star:3,desc:"Hulking quadruped.",hp:100,atk:19,def:11,reward:{xp:90,bronze:28}},
  {id:"veilstalker",name:"Veilstalker",star:3,desc:"Translucent, fast.",hp:80,atk:24,def:5,reward:{xp:105,bronze:35}},
  {id:"mana_horror",name:"Mana horror",star:4,desc:"Corrupted mana given shape.",hp:140,atk:30,def:8,reward:{xp:160,bronze:60}},
  {id:"deep_stalker",name:"Deep stalker",star:5,desc:"It shouldn't be on the surface.",hp:200,atk:40,def:15,reward:{xp:250,bronze:110}},
];
export const UW_MONSTERS=[
  {id:"uw_fiend",name:"Mana fiend",star:3,desc:"Aggressive.",hp:110,atk:22,def:8,reward:{xp:80,bronze:22}},
  {id:"uw_crusher",name:"Depth crusher",star:4,desc:"Enormous.",hp:160,atk:32,def:14,reward:{xp:140,bronze:48}},
];
export const M_ACT={cur:[{name:"Bite",dmg:[7,11]}],crawler:[{name:"Claw rake",dmg:[10,16]}],wanderer:[{name:"Claw",dmg:[12,18]}],brute:[{name:"Slam",dmg:[18,26]},{name:"Charge",dmg:[22,30]}],veilstalker:[{name:"Strike",dmg:[20,28]},{name:"Rend",dmg:[24,32]}],mana_horror:[{name:"Slam",dmg:[26,36]},{name:"Drain",dmg:[14,20],effect:"drain_mp"}],deep_stalker:[{name:"Rend",dmg:[36,48]}],uw_fiend:[{name:"Surge",dmg:[20,28]}],uw_crusher:[{name:"Slam",dmg:[30,42]}]};

export const SURFACE_SPELLS=[
  {id:"elem_theory",name:"Elemental theory",prereq:null,progress:0,learned:false,replaces:null,desc:"The foundation.",combatUse:null},
  {id:"fire_1",name:"Fire — Lv.1",prereq:"elem_theory",progress:0,learned:false,replaces:null,desc:"Heat.",combatUse:{label:"Fire Lv.1",dmg:[18,26],mpCost:14}},
  {id:"fire_2",name:"Fire — Lv.2",prereq:"fire_1",progress:0,learned:false,replaces:"fire_1",desc:"Greater output.",combatUse:{label:"Fire Lv.2",dmg:[30,42],mpCost:22}},
  {id:"water_1",name:"Water — Lv.1",prereq:"elem_theory",progress:0,learned:false,replaces:null,desc:"Pressurized.",combatUse:{label:"Water Lv.1",dmg:[14,20],mpCost:10}},
];
export const DEVIL_SPELLS=[
  {id:"elem_theory",name:"Elemental theory",prereq:null,progress:100,learned:true,replaces:null,desc:"Innate.",combatUse:null},
  {id:"fire_1",name:"Fire — Lv.1",prereq:"elem_theory",progress:100,learned:true,replaces:null,desc:"Innate fire.",combatUse:{label:"Fire Lv.1",dmg:[18,26],mpCost:10}},
  {id:"fire_2",name:"Hellfire — Lv.2",prereq:"fire_1",progress:0,learned:false,replaces:"fire_1",desc:"Intense demonic flames.",combatUse:{label:"Hellfire Lv.2",dmg:[35,50],mpCost:25}},
  {id:"illusion_1",name:"Illusion — Lv.1",prereq:"elem_theory",progress:0,learned:false,replaces:null,desc:"Confuses.",combatUse:{label:"Illusion Lv.1",dmg:[0,0],mpCost:12,effect:"confuse",turns:1}},
];

export const WEAPONS=[
  {id:"fists",name:"Bare hands",atk:0,price:0},
  {id:"knife",name:"Short knife",atk:4,price:80},
  {id:"sword",name:"Iron sword",atk:10,price:220},
  {id:"axe",name:"Hand axe",atk:14,price:380},
  {id:"greatsword",name:"Greatsword",atk:22,price:700},
  {id:"steelsword",name:"Steel longsword",atk:30,price:1400},
  {id:"warhammer",name:"Warhammer",atk:38,price:2200},
  {id:"runed_blade",name:"Runed blade",atk:48,price:4500},
];
export const ARMORS=[
  {id:"none",name:"No armor",def:0,price:0},
  {id:"leather",name:"Leather vest",def:4,price:120},
  {id:"chainmail",name:"Chainmail",def:9,price:350},
  {id:"plate",name:"Plate cuirass",def:16,price:800},
  {id:"reinforced",name:"Reinforced plate",def:24,price:1700},
  {id:"crystal",name:"Crystal-laced harness",def:34,price:3600},
  {id:"warden",name:"Warden's regalia",def:48,price:7000},
];
export const POTIONS=[
  {id:"hp_low",name:"Health (Low)",stat:"hp",val:30,price:25},
  {id:"hp_med",name:"Health (Mid)",stat:"hp",val:70,price:60},
  {id:"hp_high",name:"Health (High)",stat:"hp",val:150,price:130},
  {id:"mp_low",name:"Mana (Low)",stat:"mp",val:20,price:30},
  {id:"mp_med",name:"Mana (Mid)",stat:"mp",val:50,price:75},
  {id:"mp_high",name:"Mana (High)",stat:"mp",val:120,price:120},
  {id:"sta_low",name:"Stamina (Low)",stat:"stamina",val:25,price:20},
  {id:"sta_med",name:"Stamina (Mid)",stat:"stamina",val:60,price:55},
  {id:"sta_high",name:"Stamina (High)",stat:"stamina",val:120,price:110},
];
export const TOOLS=[
  {id:"focus",name:"Apprentice's focus",stat:"maxMp",val:15,price:300,desc:"+15 max MP"},
  {id:"mana_crystal",name:"Mana crystal pendant",stat:"maxMp",val:35,price:850,desc:"+35 max MP"},
  {id:"hp_charm",name:"Vitality charm",stat:"maxHp",val:30,price:600,desc:"+30 max HP"},
];

export const SKILLS=[
  {id:"hardened",name:"Hardened",reqType:"nearDeath",reqVal:3,reqLabel:"Win 3 fights at near-death",desc:"Reduces damage by 3.",effect:"passive_def",val:3},
  {id:"iron_will",name:"Iron will",reqType:"kills",reqVal:10,reqLabel:"Slay 10 monsters",desc:"+20 max HP.",effect:"passive_hp",val:20},
  {id:"sharp_eye",name:"Sharp eye",reqType:"kills",reqVal:25,reqLabel:"Slay 25 monsters",desc:"+5% dodge.",effect:"passive_dodge",val:5},
  {id:"merchant_blood",name:"Merchant's blood",reqType:"earned",reqVal:500,reqLabel:"Earn 500 Bronze",desc:"5% shop discount.",effect:"shop_discount",val:0.05},
  {id:"endurance",name:"Endurance",reqType:"earned",reqVal:1500,reqLabel:"Earn 1500 Bronze",desc:"+25 max stamina.",effect:"passive_sta",val:25},
  {id:"combat_focus",name:"Combat focus",reqType:"kills",reqVal:50,reqLabel:"Slay 50 monsters",desc:"Strike +4.",effect:"strike_bonus",val:4},
  {id:"survivor",name:"Survivor",reqType:"days",reqVal:30,reqLabel:"Survive 30 days",desc:"Reduces damage by 5.",effect:"passive_def",val:5},
  {id:"hunter_instinct",name:"Hunter's instinct",reqType:"kills",reqVal:100,reqLabel:"Slay 100 monsters",desc:"+6 attack.",effect:"passive_atk",val:6},
];

export const SLEEP=[
  {id:"camp",name:"Camp outdoors",cost:0,doomGain:0.5,hpRec:0.5,mpRec:0.2,staRec:0.5,spellMult:0.7,desc:"Free, but rough."},
  {id:"inn",name:"Inn room",cost:25,doomGain:0.25,hpRec:1.0,mpRec:0.6,staRec:1.0,spellMult:1.0,desc:"Standard rest."},
  {id:"luxury_inn",name:"Luxury inn",cost:80,doomGain:0.15,hpRec:1.0,mpRec:1.0,staRec:1.0,spellMult:1.2,desc:"Better food, better sleep."},
  {id:"rented_house",name:"Rented house",cost:200,doomGain:0.08,hpRec:1.0,mpRec:1.0,staRec:1.0,spellMult:1.4,desc:"Quiet."},
  {id:"owned_house",name:"Owned house",cost:0,doomGain:0.04,hpRec:1.0,mpRec:1.0,staRec:1.0,spellMult:1.6,desc:"Yours.",owns:true},
];
export const HOUSE_PRICE=8000;

export const ATTACKS_BY_RACE={
  human:[{id:"strike",name:"Strike",dmg:[0,6],desc:"Direct attack."},{id:"heavy",name:"Heavy blow",dmg:[8,16],desc:"High damage. 20 stamina.",staminaCost:20}],
  equar:[{id:"strike",name:"Strike",dmg:[0,6],desc:"Quick attack."},{id:"pierce",name:"Needle Pierce",dmg:[14,22],desc:"Ignore armor. 18 stamina.",staminaCost:18}],
  tetrabrachian:[
    {id:"strike",name:"Strike",dmg:[0,6],desc:"Single-arm jab."},
    {id:"quad_flurry",name:"Quad flurry",dmg:[16,24],desc:"All four arms.",staminaCost:25},
    {id:"whirlwind",name:"Whirlwind",dmg:[12,20],desc:"Hits ALL enemies. 35 stamina.",staminaCost:35,aoe:true},
    {id:"power_strike",name:"Four-arm power strike",dmg:[22,34],desc:"Devastating. 35 stamina.",staminaCost:35},
    {id:"crushing_grapple",name:"Crushing grapple",dmg:[12,18],desc:"Pin and crush. Stuns.",staminaCost:18,effect:"stun"},
  ],
  tenebrim:[
    {id:"strike",name:"Strike",dmg:[2,8],desc:"Direct attack."},
    {id:"heavy",name:"Heavy blow",dmg:[10,18],desc:"High damage.",staminaCost:20},
    {id:"shadow_rend",name:"Shadow Rend",dmg:[18,28],desc:"Vicious tear. 22 stamina.",staminaCost:22},
  ],
  devil:[{id:"strike",name:"Strike",dmg:[0,7],desc:"Direct attack."},{id:"hell_strike",name:"Hell Strike",dmg:[15,25],desc:"Demonic force. 20 stamina.",staminaCost:20}],
};

export const LOG_C={info:"rgba(200,192,248,0.55)",dmg:"#e85c3a",heal:"#3ec995",sys:"rgba(230,225,255,0.9)",reward:"#e0a523",spell:"#a89df0",lumen:"#ffd966"};