// tenebrim/events.js — Story beats and choice events.
// Each entry: (g, data) => ({ title, text, tone, choices: [{ label, hint, disabled, run(g, data) }] })
import { HERITAGE, REGIONS, CLANS, ROLES } from "./data";
import { log, toast, irnd, pick, clamp, addWound, addFollower, startFight, deed, alliedClans, hasTech, checkTechniques } from "./logic";

const heritageChoices = (next) => HERITAGE.map(h => ({
  label: h.name, hint: h.desc,
  run: (g) => {
    g.heritage = h.id;
    if (h.stamina) { g.maxStamina += h.stamina; g.stamina += h.stamina; }
    log(g, `Your blood remembers: ${h.name}.`, "reward");
    next(g);
  },
}));

export const EVENTS = {
  // ── Slave origin ─────────────────────────────────────────────────────────
  bloodline: () => ({
    title: "What your mother left you", tone: "#b83a2a",
    text: "You remember almost nothing of Menfor. But Tenebrim inherit their gifts in the blood, not in any core — and some nights, chained in the Lower Estate, you feel yours.",
    choices: heritageChoices((g) => { g.bondage.phase = "task"; }),
  }),
  inspection: (g) => ({
    title: "Inspection", tone: "#b83a2a",
    text: "The overseer walks the line with a lamp, looking for anything that isn't where it should be. Your stash is under a loose stone two steps from his boot.",
    choices: [
      { label: "Stay perfectly still", hint: "Suspicion +5", run: (g) => { g.bondage.suspicion += 5; log(g, "He passes. Your heart doesn't slow for an hour."); } },
      { label: "Cause a distraction", hint: "Suspicion +15, stash safe, a contact owes you", run: (g) => { g.bondage.suspicion += 15; g.bondage.contacts += 1; log(g, "You knock over a water jar. Everyone gets beaten a little. Imre saw why you did it."); } },
      { label: "Hand over part of the stash", hint: "Stash -2, suspicion -15", disabled: g.bondage.stash < 2, run: (g) => { g.bondage.stash -= 2; g.bondage.suspicion = Math.max(0, g.bondage.suspicion - 15); log(g, "A bribe of stale bread. He pockets it and moves on."); } },
    ],
  }),
  sickslave: (g) => ({
    title: "Fever in the pens", tone: "#b83a2a",
    text: "Old Duun is burning with fever. Tenebrim have no core to fight it off — illnesses strike harder. Without food, he won't last.",
    choices: [
      { label: "Share your stash", hint: "Stash -2, contacts +2", disabled: g.bondage.stash < 2, run: (g) => { g.bondage.stash -= 2; g.bondage.contacts += 2; log(g, "Duun lives. Everyone in the pen knows who fed him."); } },
      { label: "Take his shifts", hint: "HP -15, contacts +1", run: (g) => { g.hp -= 15; g.bondage.contacts += 1; log(g, "Double labor. Your hands crack and bleed."); } },
      { label: "Look away", hint: "Nothing", run: (g) => { log(g, "Duun is gone by morning. Nobody says anything to you about it."); } },
    ],
  }),
  guest: (g) => ({
    title: "The master's guest", tone: "#b83a2a",
    text: "A Syndicate factor visits the estate. You serve wine and are invisible — which means they talk in front of you.",
    choices: [
      { label: "Listen carefully", hint: "Info +2, suspicion +10", run: (g) => { g.bondage.info += 2; g.bondage.suspicion += 10; log(g, "Ships, tides, the name 'Chainhold'. A fort on Menfor's black coast where coreless are gathered before being shipped."); g.flags.heardChainhold = true; } },
      { label: "Keep your eyes down", hint: "Safe", run: (g) => { log(g, "You hear nothing worth the risk."); } },
    ],
  }),
  ledgertip: () => ({
    title: "Imre's whisper", tone: "#e0a523",
    text: "\"The master keeps a ledger,\" Imre whispers. \"Every pact he holds is a sigil in that book. Burn your page and the binding has nothing left to hold.\" It's in his study. Locked. Guarded at night.",
    choices: [{ label: "Remember it", hint: "Unlocks the night action: Steal the ledger", run: (g) => { g.bondage.ledgerKnown = true; } }],
  }),
  escape: (g) => ({
    title: "The night you run", tone: "#e0a523",
    text: g.bondage.ledger
      ? "You hold your page of the ledger over the lamp. Your sigil curls, blackens — and the weight you've carried behind your ribs your whole life is simply gone."
      : "You don't have the ledger. So you walk past the line the pact forbids, and keep walking. The binding tears at your soul — and with no core to absorb the backlash, it tears straight through your body.",
    choices: [{
      label: g.bondage.ledger ? "Go" : "Endure it",
      hint: g.bondage.ledger ? "The pact breaks cleanly" : `You will take about ${Math.max(10, 70 - Math.round(g.bondage.strain * 0.6))} damage. Pact strain you built up softens the blow.`,
      run: (g) => {
        if (!g.bondage.ledger) { const d = Math.max(10, 70 - Math.round(g.bondage.strain * 0.6)); g.hp -= d; log(g, `The pact rips loose (-${d} HP). You are still standing.`, "dmg"); }
        g.flags.pactBroken = true; checkTechniques(g);
        deed(g, "Broke a slave pact", 6);
        const guards = g.bondage.contacts >= 3 ? ["houseguard"] : ["houseguard", "houseguard"];
        if (g.bondage.contacts >= 3) log(g, "Imre sets the hay-store burning on the far side of the estate. Half the guards run toward the smoke.", "reward");
        startFight(g, "escape", guards, { danger: 1, allies: 0, title: "ESCAPE" });
      },
    }],
  }),
  harbor: (g) => ({
    title: "The harbor", tone: "#4dd9c2",
    text: `Salt wind. A Menfor-bound ore barge, loading at night. ${g.bondage.info >= 5 ? "You know which hold the crew never checks." : "You'll have to guess which hold is safe."}`,
    choices: [{
      label: "Stow away", hint: g.bondage.info >= 5 ? "Safe crossing" : "Risky crossing",
      run: (g) => {
        if (g.bondage.info < 5 && Math.random() < 0.5) { addWound(g); log(g, "A sailor finds you on the third day. You make sure he doesn't tell anyone.", "dmg"); }
        const companions = Math.min(2, Math.floor(g.bondage.contacts / 2));
        g.food = 4 + g.bondage.stash; g.water = 6;
        g.act = "menfor"; g.region = "saltflat"; g.known = ["saltflat", "ashveil", "blackcoast"]; g.pursuit = 20; g.day = 1; g.seg = 0;
        for (let i = 0; i < companions; i++) addFollower(g, i === 0 ? "scout" : "hunter");
        Object.keys(g.clans).forEach(k => { g.clans[k].rel = -10; });
        g.clans.wellkeepers.rel = 10;
        g.cinematic = "crossing";
        log(g, "Menfor. You've never seen it, and it smells like home anyway.", "sys");
      },
    }],
  }),

  // ── Tribe origin ─────────────────────────────────────────────────────────
  marking: () => ({
    title: "The Day of Marking", tone: "#ff8c42",
    text: "At fifteen, every Emberhide child kneels before the elders, and their crimson markings are read. Tenebrim have no core and no Skills from any god — but the blood carries gifts. Which one is yours?",
    choices: heritageChoices((g) => { g.tribeStep = 1; g.event = { id: "firsthunt" }; }),
  }),
  firsthunt: (g) => ({
    title: "First hunt", tone: "#ff8c42",
    text: `Elder Ashka sends you out with ${g.sibling}, your sibling, to bring down a Shafo pack-leader that has been taking goats. "Come back with it, or come back with a story worth the goats."`,
    choices: [{ label: "Hunt", hint: "Your sibling fights beside you", run: (g) => startFight(g, "tribehunt", ["shafo"], { danger: 1, allies: 1, title: "FIRST HUNT" }) }],
  }),
  raid: (g) => ({
    title: "Chains in the night", tone: "#e85c3a",
    text: `You wake to smoke. Men with sigil-marked chains move through the longhouses — Syndicate. Pact-chains hit Tenebrim like nothing else: with no core to resist, one touch and a body stops obeying. By the time you reach the gate, they are dragging ${g.sibling} toward the carts.`,
    choices: [
      { label: "Chase them now", hint: "Fight the rearguard. Leave tonight, wounded.", run: (g) => { startFight(g, "tribechase", ["slaver", "slaver"], { danger: 1, allies: 0, title: "THE CARTS" }); } },
      { label: "Stay and bury the dead", hint: "Emberhide +25. The trail goes cold (Grip +5).", run: (g) => { g.clans.emberhide.rel += 25; g.grip += 5; g.tribeStep = 3; g.event = { id: "leave" }; log(g, "You dig until dawn. Nobody forgets who stayed.", "heal"); } },
    ],
  }),
  leave: (g) => ({
    title: "Leaving the fire", tone: "#ff8c42",
    text: `Elder Ashka presses a waterskin into your hands. "They'll take ${g.sibling} to Chainhold, on the black coast. Every clan has lost someone there. Nobody has ever got them back." She doesn't tell you not to go.`,
    choices: [{ label: "Walk out into Menfor", hint: "The survival campaign begins", run: (g) => { g.act = "menfor"; g.region = "ashveil"; g.known = ["ashveil", "redmaw", "saltflat"]; g.day = 1; g.seg = 0; g.clans.emberhide.rel += 20; g.food += 4; g.water += 4; log(g, `Goal: reach Chainhold and free ${g.sibling}.`, "sys"); } }],
  }),

  // ── Menfor ───────────────────────────────────────────────────────────────
  fortsight: (g) => ({
    title: "Chainhold", tone: "#e85c3a",
    text: "Black stone walls on a headland above a cold sea. Cages along the cliff. Barges below. This is where Menfor's missing go. Storming it alone would be suicide — but the clans hate it as much as you do.",
    choices: [{ label: "Remember the walls", hint: "Build a band, win allies, then storm it", run: (g) => log(g, "Goal: gather a band and clan allies, then storm Chainhold.", "sys") }],
  }),
  captives: (g, d) => ({
    title: "The freed", tone: "#3ec995",
    text: `${d.n} Tenebrim stand blinking at you, the sigil-burns on their wrists still raw. With the caravan's pact-master dead, the bindings have nothing to hold.`,
    choices: [
      { label: "Take them into your band", hint: `+${Math.min(d.n, 3)} followers (they eat and drink)`, run: (g, d) => { for (let i = 0; i < Math.min(d.n, 3); i++) addFollower(g); } },
      { label: "Send them home to their clans", hint: "+15 with a clan, +2 legacy", run: (g) => { const k = pick(Object.keys(g.clans).filter(x => !g.clans[x].fallen)) || "wellkeepers"; g.clans[k].rel = clamp(g.clans[k].rel + 15, -100, 100); g.legacy += 2; log(g, `They go home to the ${CLANS[k].name}, and tell everyone who freed them.`, "reward"); } },
    ],
  }),
  hunters: () => ({
    title: "Bounty hunters", tone: "#e85c3a",
    text: "Three figures on your trail, following too precisely to be anything but hired. Your old master hasn't forgotten what you cost him.",
    choices: [
      { label: "Turn and fight", hint: "Combat", run: (g) => startFight(g, "hunters", ["slaver", "crossbow", "slaver"], { title: "BOUNTY HUNTERS" }) },
      { label: "Lose them in the rocks", hint: "Costs the day, 50% to shake them", run: (g) => { if (Math.random() < 0.5) { log(g, "You double back over stone until they lose you.", "heal"); g.seg = 2; } else { log(g, "They don't lose you.", "dmg"); startFight(g, "hunters", ["slaver", "crossbow"], { title: "BOUNTY HUNTERS" }); } } },
    ],
  }),
  stranger: (g) => ({
    title: "A Mourak at your fire", tone: "#a89df0",
    text: "A scarred Tenebrim who has clearly been across the sea and back sits down uninvited. \"You're building something,\" they say. \"I can smell it.\"",
    choices: [
      { label: "Share food and listen", hint: "Food -3, learn something", disabled: g.food < 3, run: (g) => { g.food -= 3; const r = pick(Object.keys(REGIONS).filter(k => !g.known.includes(k))); if (r) { g.known.push(r); log(g, `They tell you of ${REGIONS[r].name}.`, "info"); } else { g.legacy += 2; log(g, "They tell you a story about yourself you haven't lived yet.", "info"); } } },
      { label: "Ask them to join", hint: "+1 warrior if your legacy is 10+", disabled: g.legacy < 10, run: (g) => addFollower(g, "warrior") },
      { label: "Send them away", hint: "", run: (g) => log(g, "They leave without complaint. Mourak always do.") },
    ],
  }),
  storm: () => ({
    title: "Red storm", tone: "#e0a523",
    text: "A wall of red dust swallows the horizon. Mana-lamps would cut through it. You have cloth, instinct, and stubborn lungs.",
    choices: [
      { label: "Shelter and wait", hint: "Lose a time segment", run: (g) => { g.seg = Math.min(2, g.seg + 1); log(g, "You wait it out behind a rock."); } },
      { label: "Push through", hint: "Materials +6, wound risk", run: (g) => { g.materials += 6; if (Math.random() < 0.35) addWound(g); log(g, "You salvage what the storm uncovers."); } },
    ],
  }),
  carcass: () => ({
    title: "A fresh carcass", tone: "#e0a523",
    text: "Something big killed something big, and left. The meat is still warm. Whatever did this might come back.",
    choices: [
      { label: "Butcher it quickly", hint: "Food +8, 30% the killer returns", run: (g) => { g.food += 8; if (Math.random() < 0.3) { log(g, "It comes back.", "dmg"); startFight(g, "hunt", [pick(REGIONS[g.region].beasts)]); } } },
      { label: "Leave it", hint: "", run: (g) => log(g, "Not worth it.") },
    ],
  }),
  vision: (g) => ({
    title: "Faces in the coals", tone: "#a89df0",
    text: "Tenebrim worship no god — many believe they were abandoned, if anything was ever there. But tonight, staring into the fire, you think about who will remember you.",
    choices: [
      { label: "Carve your deeds into stone", hint: "+2 legacy", run: (g) => { g.legacy += 2; log(g, "Marks on stone. Reading is for other races; marks are enough."); } },
      { label: "Sleep", hint: "+15 HP", run: (g) => { g.hp = Math.min(g.maxHp, g.hp + 15); } },
    ],
  }),
  trader: (g) => ({
    title: "Equar trader", tone: "#e0a523",
    text: "A tiny, sharp-eyed Equar with a pack bigger than they are. \"Oh, a coreless! You lot always pay in useful things.\" They're looking at your trophies.",
    choices: [
      { label: "Trade a trophy for herbs", hint: "Trophy -1, herbs +3", disabled: g.trophies < 1, run: (g) => { g.trophies -= 1; g.herbs += 3; } },
      { label: "Trade a trophy for water", hint: "Trophy -1, water +8", disabled: g.trophies < 1, run: (g) => { g.trophies -= 1; g.water += 8; } },
      { label: "No deal", hint: "", run: (g) => log(g, "\"Your loss!\" They are gone before you can blink.") },
    ],
  }),
  sickness: (g) => ({
    title: "Fever", tone: "#b83a2a",
    text: "You wake shaking. Other races have cores that burn off sickness. You don't.",
    choices: [
      { label: "Use herbs", hint: "Herbs -2", disabled: g.herbs < 2, run: (g) => { g.herbs -= 2; log(g, "Bitter tea. The fever breaks by noon.", "heal"); } },
      { label: "Endure it", hint: "-20 HP, -30 stamina", run: (g) => { g.hp -= 20; g.stamina = Math.max(0, g.stamina - 30); log(g, "You sweat it out.", "dmg"); } },
    ],
  }),
  clan: (g, d) => {
    const k = d.clan; const c = g.clans[k]; const C = CLANS[k];
    if (c.fallen) return { title: `The ${C.name} longhouses`, tone: "#e85c3a", text: "Empty. Sigil-burns on the doorposts. The Syndicate took them all. If any still live, they are in Chainhold.", choices: [{ label: "Leave", run: () => {} }] };
    const allies = alliedClans(g).length;
    const questReady = c.questDay !== g.day;
    return {
      title: `The ${C.name}`, tone: C.color,
      text: `${C.trait} Relation: ${c.rel}${c.allied ? " — ALLIED" : ""}.${c.rel < 0 ? " They watch you with open suspicion." : c.rel >= 60 ? " They make room for you at the fire." : ""}`,
      choices: [
        { label: `Trade (${C.trade.give} → ${C.trade.get})`, hint: k === "emberhide" ? "8 materials → craft at their forge (Weapons tab)" : k === "redmaw" ? "1 trophy → 8 food" : k === "stoneoath" ? "6 materials → 3 herbs" : "4 food → 8 water",
          disabled: (k === "redmaw" && g.trophies < 1) || (k === "stoneoath" && g.materials < 6) || (k === "wellkeepers" && g.food < 4) || (k === "emberhide" && g.materials < 8),
          run: (g) => {
            if (k === "redmaw") { g.trophies -= 1; g.food += 8; }
            if (k === "stoneoath") { g.materials -= 6; g.herbs += 3; }
            if (k === "wellkeepers") { g.food -= 4; g.water += 8; }
            if (k === "emberhide") { g.materials -= 8; g.clans.emberhide.rel += 5; g.flags.emberForge = true; log(g, "They let you use the forge. (+5 relation)", "reward"); }
            g.event = { id: "clan", data: d };
          } },
        { label: "Ask for work", hint: questReady ? "A beast is troubling them (combat, +15 relation)" : "Come back tomorrow", disabled: !questReady,
          run: (g) => { c.questDay = g.day; startFight(g, "quest", [pick(REGIONS[C.region].beasts), pick(REGIONS[C.region].beasts)], { data: { clan: k }, title: `${C.name.toUpperCase()} — HUNT` }); } },
        { label: `Challenge their champion`, hint: "Honor duel, one on one (+20 relation, +30 Stoneoath)", disabled: g.stamina < 30,
          run: (g) => { startFight(g, "duel", ["champion"], { allies: 0, data: { clan: k }, title: `DUEL — ${C.champion.toUpperCase()}` }); } },
        { label: "Recruit a warrior", hint: "Needs relation 30, costs 6 food", disabled: c.rel < 30 || g.food < 6,
          run: (g) => { g.food -= 6; c.rel -= 5; addFollower(g, k === "wellkeepers" ? "healer" : k === "stoneoath" ? "warrior" : k === "redmaw" ? "warrior" : pick(["warrior", "hunter"])); g.event = { id: "clan", data: d }; } },
        { label: c.allied ? "Allied ✓" : "Ask for alliance against Chainhold", hint: "Needs relation 60 and 2 deeds", disabled: c.allied || c.rel < 60 || g.deeds.length < 2,
          run: (g) => { c.allied = true; deed(g, `Allied with the ${C.name}`, 5); toast(g, `${C.name} will march on Chainhold`, C.color); } },
        { label: "Leave", run: () => {} },
      ],
    };
  },
  assault: (g) => {
    const allies = alliedClans(g).length; const scouts = g.band.some(b => b.role === "scout") || g.heritage === "stillness";
    const army = allies * 3 + g.band.filter(b => b.role === "warrior").length;
    return {
      title: "Storm Chainhold", tone: "#e85c3a",
      text: `Your band: ${g.band.length}. Allied clans: ${allies}. Fighting strength at your side: ${army}. The Syndicate garrison grows with its grip (${g.grip}%). How do you go in?`,
      choices: [
        { label: "Frontal assault", hint: `All allies fight with you (${army + (g.flags.horn ? 2 : 0)})`, run: (g) => startFight(g, "gate", ["slaver", "houseguard", "crossbow", ...(g.grip > 50 ? ["slaver"] : [])], { danger: 4, allies: army + (g.flags.horn ? 2 : 0), title: "CHAINHOLD — THE GATE" }) },
        { label: "Night infiltration", hint: scouts ? "Ambush the gate watch" : "Needs a scout or Hunter's Stillness", disabled: !scouts, run: (g) => startFight(g, "gate", ["slaver", "crossbow"], { danger: 4, ambush: true, allies: Math.ceil(army / 2), title: "CHAINHOLD — NIGHT" }) },
        { label: "Burn the gate", hint: "Costs 20 materials; defenders start burning", disabled: g.materials < 20, run: (g) => { g.materials -= 20; startFight(g, "gate", ["slaver", "houseguard", "crossbow"], { danger: 4, burning: true, allies: army, title: "CHAINHOLD — FIRE" }); } },
        { label: "Not yet", hint: "", run: () => {} },
      ],
    };
  },
  pens: (g) => ({
    title: "The pens", tone: "#e0a523",
    text: `Cages cut into the cliff. Hundreds of Tenebrim, every one with a sigil burned into their wrist.${g.sibling ? ` And there — thinner, older-looking, but alive — ${g.sibling}.` : ""} The bindings won't break while the Pactmaster holds his ledger. He is in the keep.`,
    choices: [
      { label: "Free who you can, then go for the keep", hint: "Freed +30. Legacy +5.", run: (g) => { g.counters.freed += 30; g.legacy += 5; if (g.sibling) { g.flags.siblingFound = true; log(g, `${g.sibling} grips your arm and doesn't let go.`, "heal"); } g.event = { id: "varn" }; } },
      { label: "Straight to the keep", hint: "Faster — the guards are still disorganized (Varn fights alone)", run: (g) => { g.flags.rushVarn = true; g.event = { id: "varn" }; } },
    ],
  }),
  varn: (g) => ({
    title: "Pactmaster Varn", tone: "#e85c3a",
    text: `A grey man with a leather ledger chained to his wrist. "Coreless," he says, almost fondly. "Do you know why it is always your kind? Nothing inside you to say no." ${g.flags.pactBroken || hasTech(g, "chainbreaker") ? "He doesn't know you've broken a pact before." : "He opens the ledger to a fresh page."}`,
    choices: [{ label: "End this", hint: "Final battle", run: (g) => startFight(g, "varn", g.flags.rushVarn ? ["pactmaster"] : ["pactmaster", "crossbow"], { danger: 5, allies: Math.ceil(alliedClans(g).length * 1.5), title: "THE KEEP OF CHAINHOLD" }) }],
  }),
  finale: (g) => ({
    title: "The ledger burns", tone: "#ffd966",
    text: "You throw the ledger into the brazier. Across the cliff, a sound goes up from the pens — hundreds of people feeling their souls come back to them at once. Chainhold is yours. What now?",
    choices: [
      { label: "Call a moot of all the clans", hint: "Needs 2 allied clans", disabled: alliedClans(g).length < 2, run: (g) => { g.ending = "uniter"; } },
      { label: "Found a free clan with the freed", hint: "Needs a camp or a band of 5+", disabled: !g.camp && g.band.length < 5, run: (g) => { g.ending = "founder"; } },
      { label: "Keep the ledger's last pages. Rule.", hint: "Needs the Monarch's Horn", disabled: !g.flags.horn, run: (g) => { g.ending = "monarch"; } },
      { label: "Take a barge across the sea", hint: "Leave Menfor as a Mourak", run: (g) => { g.ending = "mourak"; } },
    ],
  }),
  sail: (g) => ({
    title: "A smuggler's boat", tone: "#4dd9c2",
    text: "An Equar smuggler is willing to take you across — for a price. Leave Menfor now, and the clans will call you Mourak.",
    choices: [
      { label: "Pay and sail", hint: "15 food, 10 water, 2 trophies", disabled: g.food < 15 || g.water < 10 || g.trophies < 2, run: (g) => { g.ending = "mourak"; } },
      { label: "Not yet", hint: "", run: () => {} },
    ],
  }),
};

export const BONDAGE_TASKS = [
  { id: "docks", name: "Haul at the docks", desc: "Learn ship schedules. Maybe pocket something.", run: (g) => { if (Math.random() < 0.65) { g.bondage.info += 1; log(g, "You memorize which barges sail for Menfor, and when."); } if (Math.random() < 0.3) { g.bondage.stash += 1; log(g, "A dropped ration finds its way into your shirt."); } g.stamina = Math.max(0, g.stamina - 25); } },
  { id: "quarry", name: "Break stone in the quarry", desc: "Brutal. Your body grows harder.", run: (g) => { g.maxHp += 4; g.hp += 4; g.maxStamina += 3; log(g, "Stone after stone. You are getting stronger, and they don't notice. (+4 max HP, +3 max stamina)"); if (Math.random() < 0.2) addWound(g); g.stamina = Math.max(0, g.stamina - 35); } },
  { id: "kitchen", name: "Scrub the kitchens", desc: "Scraps for the stash. Gossip.", run: (g) => { g.bondage.stash += 2; if (Math.random() < 0.4) { g.bondage.contacts += 1; log(g, "The cook's girl laughs at your jokes. She knows everyone."); } else log(g, "Scraps for the stash."); g.stamina = Math.max(0, g.stamina - 15); } },
  { id: "kennels", name: "Muck out the kennels", desc: "Learn the guard rotations.", run: (g) => { if (Math.random() < 0.55) { g.bondage.info += 1; log(g, "The dogs are walked at the same hour every night. So are the guards."); } if (Math.random() < 0.3) g.bondage.contacts += 1; g.stamina = Math.max(0, g.stamina - 20); } },
];

export const BONDAGE_NIGHT = [
  { id: "whisper", name: "Whisper with the others", desc: "Contacts +1, suspicion +8", run: (g) => { g.bondage.contacts += 1; g.bondage.suspicion += 8; log(g, "Names, debts, who can be trusted."); } },
  { id: "steal", name: "Steal from the stores", desc: "Stash +2, suspicion +15", run: (g) => { g.bondage.stash += 2; g.bondage.suspicion += 15; log(g, "Dried meat and a waterskin, under the loose stone."); } },
  { id: "resist", name: "Resist the pact", desc: "Pact strain +20. The backlash hits your body (-18 HP).", run: (g) => { g.bondage.strain += 20; g.hp -= 18; log(g, "You hold your hand still when the pact says move. It feels like your bones are being pulled out through your skin.", "dmg"); } },
  { id: "ledger", name: "Steal the ledger page", desc: "Suspicion +30. Risky, but the pact would break cleanly.", requires: (g) => g.bondage.ledgerKnown && !g.bondage.ledger, run: (g) => { g.bondage.suspicion += 30; const chance = 0.45 + (g.heritage === "stillness" ? 0.25 : 0) + g.bondage.contacts * 0.04; if (Math.random() < chance) { g.bondage.ledger = true; log(g, "You tear out the page with your sigil on it. Your hands won't stop shaking.", "reward"); } else { g.bondage.suspicion += 20; log(g, "A guard's lamp. You run. Did he see your face?", "dmg"); } } },
  { id: "sleep", name: "Sleep", desc: "+15 HP, suspicion -6", run: (g) => { g.hp = Math.min(g.maxHp, g.hp + 15); g.bondage.suspicion = Math.max(0, g.bondage.suspicion - 6); } },
];
