// AudioEngine.js

// 1. Global Volume State
export let VOLUMES = { master: 1.0, bgm: 0.6, sfx: 1.0 };

// 2. The Bridge: App.jsx calls this when you move a slider
window.updateAudioVolumes = (newVols) => {
    VOLUMES = newVols;
    if (typeof currentBGM !== "undefined" && currentBGM) {
        currentBGM.volume = 0.3 * VOLUMES.master * VOLUMES.bgm; 
    }
};

// ── 1. Gamla ljudmotorn (SFX & Bossar) ──
let actx = null;
function aC(){if(!actx&&(window.AudioContext||window.webkitAudioContext))actx=new(window.AudioContext||window.webkitAudioContext)();return actx;}

export function tn(f,t="sine",d=0.15,v=0.1,dl=0){
  try{
    const finalV = v * VOLUMES.master * VOLUMES.sfx;
    if (finalV <= 0) return; 
    const c=aC();if(!c)return;
    const g=c.createGain(),o=c.createOscillator();
    o.type=t;o.frequency.value=f;
    g.gain.setValueAtTime(0,c.currentTime+dl);
    g.gain.linearRampToValueAtTime(finalV,c.currentTime+dl+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dl+d);
    o.connect(g);g.connect(c.destination);
    o.start(c.currentTime+dl);o.stop(c.currentTime+dl+d+0.05);
  }catch(e){}
}

export function nz(d=0.1,v=0.1,ff=400){
  try{
    const finalV = v * VOLUMES.master * VOLUMES.sfx;
    if (finalV <= 0) return;
    const c=aC();if(!c)return;
    const bs=c.createBufferSource();
    const buf=c.createBuffer(1,c.sampleRate*d,c.sampleRate);
    const dt=buf.getChannelData(0);
    for(let i=0;i<dt.length;i++)dt[i]=Math.random()*2-1;
    bs.buffer=buf;
    const f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=ff;
    const g=c.createGain();
    g.gain.setValueAtTime(finalV,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01,c.currentTime+d);
    bs.connect(f);f.connect(g);g.connect(c.destination);
    bs.start();
  }catch(e){}
}

// ── 2. Återställda ljudeffekter (SFX) ──
export const SFX = {
    attack: () => nz(0.1, 0.2, 800),
    hit: () => nz(0.15, 0.3, 300),
    defeat: () => tn(100, "sawtooth", 0.5, 0.2),
    reward: () => { tn(400, "sine", 0.1, 0.1); tn(600, "sine", 0.2, 0.1, 0.1); },
    buy: () => tn(800, "sine", 0.1, 0.1),
    spell: () => tn(600, "sine", 0.3, 0.1),
    church: () => tn(300, "sine", 0.8, 0.1),
    flee: () => nz(0.2, 0.2, 1200),
    guard: () => tn(200, "square", 0.2, 0.1),
    victory: () => { tn(400, "sine", 0.2, 0.1); tn(600, "sine", 0.2, 0.1, 0.2); tn(800, "sine", 0.4, 0.1, 0.4); },
    rankup: () => { tn(500, "sine", 0.2, 0.1); tn(700, "sine", 0.2, 0.1, 0.2); tn(900, "sine", 0.4, 0.1, 0.4); },
    siphon: () => tn(300, "sine", 0.1, 0.1),
    roar: () => nz(0.5, 0.4, 200),
    lumen: () => tn(150, "sawtooth", 1.0, 0.3),
    warn: () => tn(500, "square", 0.3, 0.2),
    cryM: () => tn(250, "sawtooth", 0.3, 0.1),
    cryF: () => tn(350, "sawtooth", 0.3, 0.1),
    click: () => tn(600, "sine", 0.05, 0.05),
    menuSelect: () => tn(700, "sine", 0.1, 0.1),
    menuBack: () => tn(400, "sine", 0.1, 0.1),
    sleep: () => tn(200, "sine", 0.5, 0.1),
    
    // --- NYA LJUD FÖR ALV-SCENARIOT ---
    // Dovt dån och ihållande kall vind för introt
    elfIntro: () => { nz(4.5, 0.25, 150); tn(60, "sawtooth", 4.5, 0.2); tn(100, "sine", 4.5, 0.15); }, 
    // Vinande is-storm blandat med obehagliga "sprick"-ljud när du fryser ihjäl
    frozen: () => { nz(3.0, 0.35, 800); tn(900, "sine", 0.1, 0.15, 0.2); tn(1300, "sine", 0.1, 0.1, 0.8); tn(1800, "sine", 0.1, 0.1, 1.5); }, 
    // Brutalt slag/splatter när du dödas av monster eller explosioner
    shatter: () => { nz(0.6, 0.6, 2000); tn(100, "square", 0.5, 0.5); tn(40, "sawtooth", 0.6, 0.5); },

    // --- NYA LJUD FÖR MINIGAMES & CRAFTING ---
    craftGear: () => tn(800, "sine", 0.1, 0.1),
    craftMeal: () => tn(400, "sine", 0.1, 0.1),
    reflexHit: () => tn(1200, "sine", 0.05, 0.15),
    liftTick: () => nz(0.05, 0.1, 400),
    anvilHit: () => { tn(1000, "square", 0.1, 0.2); nz(0.1, 0.1, 2000); },
    anvilMiss: () => tn(150, "sawtooth", 0.3, 0.2),
    eat: () => tn(300, "sine", 0.1, 0.1),
    encounter: () => tn(150, "sawtooth", 0.5, 0.3)
};

// Global SFX for standard functions
if (typeof window !== "undefined") window.SFX = SFX;

// Boss & Environmental triggers
// FIX: Procedural Lumenari boss music with escalating orchestral phases
let bossLoop = null;
let bossPhase = 0;
let bossInterval = null;

export function stopBoss() {
  if (bossInterval) { clearInterval(bossInterval); bossInterval = null; }
  if (bossLoop) {
    try {
      bossLoop.oscillators?.forEach(o => { try { o.stop(); } catch(e){} });
      bossLoop.gainNodes?.forEach(g => { try { g.disconnect(); } catch(e){} });
    } catch(e){}
    bossLoop = null;
  }
}

export function startBossMusic(phase = 1) {
  stopBoss();
  bossPhase = phase;
  const c = aC(); if (!c) return;
  
  const oscillators = [];
  const gainNodes = [];
  
  // Phase 1: Low dark drone + slow ominous bass
  // Phase 2: Add cello-like middle voice + slow brass swells
  // Phase 3: Full orchestral - timpani hits, brass stabs, dissonant strings
  const baseVol = 0.06 + (phase - 1) * 0.025;
  
  // Sustained bass drone (root note)
  const drone = c.createOscillator(); drone.type = "sawtooth"; drone.frequency.value = 55;
  const droneFilter = c.createBiquadFilter(); droneFilter.type = "lowpass"; droneFilter.frequency.value = 250 + phase * 80;
  const droneGain = c.createGain(); droneGain.gain.value = baseVol * VOLUMES.master * VOLUMES.bgm;
  drone.connect(droneFilter); droneFilter.connect(droneGain); droneGain.connect(c.destination);
  drone.start(); oscillators.push(drone); gainNodes.push(droneGain);
  
  // 5th harmony (sub-bass)
  const sub = c.createOscillator(); sub.type = "triangle"; sub.frequency.value = 82.41; // E
  const subGain = c.createGain(); subGain.gain.value = baseVol * 0.7 * VOLUMES.master * VOLUMES.bgm;
  sub.connect(subGain); subGain.connect(c.destination);
  sub.start(); oscillators.push(sub); gainNodes.push(subGain);
  
  if (phase >= 2) {
    // Mid voice: cello-like sawtooth
    const cello = c.createOscillator(); cello.type = "sawtooth"; cello.frequency.value = 110; // A
    const celloF = c.createBiquadFilter(); celloF.type = "lowpass"; celloF.frequency.value = 800;
    const celloG = c.createGain(); celloG.gain.value = baseVol * 0.5 * VOLUMES.master * VOLUMES.bgm;
    cello.connect(celloF); celloF.connect(celloG); celloG.connect(c.destination);
    cello.start(); oscillators.push(cello); gainNodes.push(celloG);
    
    // LFO for swells
    const lfo = c.createOscillator(); lfo.frequency.value = 0.4;
    const lfoGain = c.createGain(); lfoGain.gain.value = baseVol * 0.3 * VOLUMES.master * VOLUMES.bgm;
    lfo.connect(lfoGain); lfoGain.connect(celloG.gain);
    lfo.start(); oscillators.push(lfo);
  }
  
  if (phase >= 3) {
    // Dissonant high string
    const diss = c.createOscillator(); diss.type = "sawtooth"; diss.frequency.value = 233; // Bb
    const dissF = c.createBiquadFilter(); dissF.type = "bandpass"; dissF.frequency.value = 1200;
    const dissG = c.createGain(); dissG.gain.value = baseVol * 0.35 * VOLUMES.master * VOLUMES.bgm;
    diss.connect(dissF); dissF.connect(dissG); dissG.connect(c.destination);
    diss.start(); oscillators.push(diss); gainNodes.push(dissG);
  }
  
  bossLoop = { oscillators, gainNodes };
  
  // Periodic timpani/brass hits
  bossInterval = setInterval(() => {
    // Brass stab
    tn(110, "sawtooth", 0.4, 0.08 + phase * 0.02, 0);
    tn(220, "sawtooth", 0.3, 0.05 + phase * 0.015, 0.05);
    // Timpani
    if (phase >= 2) nz(0.25, 0.12 + phase * 0.03, 200);
    // Phase 3: dissonant brass
    if (phase >= 3) { tn(174, "sawtooth", 0.5, 0.07, 0.2); tn(185, "sawtooth", 0.5, 0.06, 0.25); }
  }, 2400 - phase * 300);
}

export function playWaves() { nz(2, 0.1, 100); }
export function playLumen(phase) { 
  startBossMusic(phase);
  tn(100 + (phase * 50), "sawtooth", 2, 0.2); 
}


// ── 3. Nya Musiksystemet (BGM) ──
let currentBGM = null; 
let currentTrackUrl = null; 

export function playMenuBGM() {
    playTrack("/audio/menu_bgm.mp3"); 
}

export function playTrack(trackUrl) {
    if (currentTrackUrl === trackUrl && currentBGM) return; 
    stopBGM(); 
    try {
        currentTrackUrl = trackUrl; 
        currentBGM = new Audio(trackUrl);
        currentBGM.loop = true;
        currentBGM.volume = 0.3 * VOLUMES.master * VOLUMES.bgm; 
        currentBGM.play().catch(e => console.warn("Audio autoplay blocked:", e));
    } catch (e) {
        console.error("Audio playback error:", e);
    }
}

export function stopBGM() {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
        currentBGM = null;
    }
    currentTrackUrl = null; 
}

export function playRaceBGM(raceId) {
    const raceTracks = {
        equar: "/audio/equar_bgm.mp3",
        tenebrim: "/audio/tenebrim_bgm.mp3",
        elf: "/audio/elf_bgm.mp3" // <-- Lägg till ett dedikerat spår för alverna här
    };
    if (raceTracks[raceId]) {
        playTrack(raceTracks[raceId]);
    } else {
        stopBGM();
    }
}

export function playCombatBGM() {
    playTrack("/audio/combat_bgm.mp3"); 
}