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
    shatter: () => { nz(0.6, 0.6, 2000); tn(100, "square", 0.5, 0.5); tn(40, "sawtooth", 0.6, 0.5); } 
};

// Global SFX for standard functions
if (typeof window !== "undefined") window.SFX = SFX;

// Boss & Environmental triggers
export function stopBoss() {}
export function playWaves() { nz(2, 0.1, 100); }
export function playLumen(phase) { tn(100 + (phase * 50), "sawtooth", 2, 0.2); }


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