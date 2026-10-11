// sound.js — Casino sound effects.
// Each sound first tries a recorded file in public/audio/sfx/<file>.ogg (for example the CC0
// Kenney "Casino Audio" pack: https://kenney.nl/assets/casino-audio). If the file is missing,
// a synthesized version plays instead, so the casino always has sound.
import { asset } from "../assets";
import { aC, VOLUMES } from "../AudioEngine";

const FILES = {
  shuffle: "card_shuffle", deal: "card_deal", flip: "card_flip",
  chip: "chips", diceShake: "dice_shake", diceThrow: "dice_throw",
};
const fileState = {}; // name -> "ok" | "missing"

const vol = () => VOLUMES.master * VOLUMES.sfx;
function ctx() { const c = aC(); if (c && c.state === "suspended") c.resume(); return c; }

let noiseBuf = null;
function noise(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// Short filtered noise burst: the building block for paper, felt and wood sounds.
function burst(c, { t = 0, d = 0.02, f = 3000, f2, q = 1, type = "bandpass", v = 0.3 }) {
  const T = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noise(c);
  const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, T);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, T + d);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, T);
  g.gain.linearRampToValueAtTime(v * vol(), T + Math.min(0.004, d / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, T + d);
  s.connect(fl); fl.connect(g); g.connect(c.destination);
  s.start(T, Math.random() * 0.8); s.stop(T + d + 0.02);
}

function tone(c, { t = 0, f = 440, f2, d = 0.1, type = "sine", v = 0.1 }) {
  const T = c.currentTime + t;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f, T);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, T + d);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, T);
  g.gain.linearRampToValueAtTime(v * vol(), T + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, T + d);
  o.connect(g); g.connect(c.destination);
  o.start(T); o.stop(T + d + 0.03);
}

const SYNTH = {
  // Riffle shuffle: a fast run of paper clicks, then the "bridge" as the cards settle.
  shuffle(c) {
    let t = 0;
    for (let i = 0; i < 36; i++) {
      t += 0.022 - i * 0.0003 + Math.random() * 0.006;
      burst(c, { t, d: 0.012, f: 2500 + Math.random() * 2200, q: 1.4, v: 0.18 + Math.random() * 0.12 });
    }
    burst(c, { t: t + 0.05, d: 0.28, f: 2200, f2: 500, type: "lowpass", v: 0.22 });
    burst(c, { t: t + 0.3, d: 0.04, f: 900, type: "lowpass", v: 0.25 });
  },
  // A card sliding across felt, then landing.
  deal(c) {
    burst(c, { d: 0.11, f: 5200, f2: 1800, q: 0.7, v: 0.3 });
    burst(c, { t: 0.09, d: 0.03, f: 1100, type: "lowpass", v: 0.28 });
  },
  flip(c) {
    burst(c, { d: 0.018, f: 3600, q: 2, v: 0.32 });
    burst(c, { t: 0.035, d: 0.025, f: 1700, q: 1.2, v: 0.24 });
  },
  chip(c, n = 3) {
    for (let i = 0; i < n; i++) {
      const t = i * 0.055 + Math.random() * 0.015;
      tone(c, { t, f: 2700 + Math.random() * 400, d: 0.07, v: 0.07 });
      tone(c, { t, f: 4200 + Math.random() * 500, d: 0.045, v: 0.04 });
      burst(c, { t, d: 0.01, f: 5000, q: 2, v: 0.2 });
    }
  },
  tick(c) {
    burst(c, { d: 0.012, f: 2600, q: 5, v: 0.3 });
    tone(c, { f: 1500, d: 0.015, type: "square", v: 0.025 });
  },
  whoosh(c) { burst(c, { d: 0.5, f: 400, f2: 2400, q: 0.8, v: 0.18 }); },
  lever(c) {
    burst(c, { d: 0.18, f: 900, type: "lowpass", v: 0.25 });
    tone(c, { f: 220, f2: 80, d: 0.18, type: "triangle", v: 0.15 });
    tone(c, { t: 0.2, f: 1800, d: 0.04, type: "square", v: 0.03 });
  },
  reel(c) {
    tone(c, { f: 130, f2: 55, d: 0.12, v: 0.3 });
    burst(c, { d: 0.05, f: 1300, type: "lowpass", v: 0.3 });
  },
  diceShake(c) {
    for (let i = 0; i < 22; i++) burst(c, { t: Math.random() * 0.45, d: 0.014, f: 1200 + Math.random() * 1600, q: 3, v: 0.22 });
  },
  diceThrow(c) {
    [0, 0.13, 0.22, 0.28, 0.32].forEach((t, i) => {
      burst(c, { t, d: 0.035, f: 1500, type: "lowpass", v: 0.32 - i * 0.05 });
      tone(c, { t, f: 190 + Math.random() * 40, d: 0.05, v: 0.12 - i * 0.02 });
    });
  },
  win(c) { [523, 659, 784, 1047].forEach((f, i) => tone(c, { t: i * 0.07, f, d: 0.2, type: "triangle", v: 0.11 })); },
  bigWin(c) {
    SYNTH.win(c);
    [1047, 1319, 1568].forEach(f => tone(c, { t: 0.32, f, d: 0.7, type: "triangle", v: 0.07 }));
    for (let i = 0; i < 10; i++) tone(c, { t: 0.3 + Math.random() * 0.8, f: 1800 + Math.random() * 1600, d: 0.12, v: 0.04 });
    SYNTH.chip(c, 6);
  },
  blackjack(c) {
    [392, 523, 659, 784].forEach((f, i) => tone(c, { t: i * 0.09, f, d: 0.25, type: "square", v: 0.05 }));
    [784, 988, 1175, 1568].forEach(f => tone(c, { t: 0.4, f, d: 0.8, type: "triangle", v: 0.06 }));
    SYNTH.chip(c, 5);
  },
  lose(c) {
    tone(c, { f: 330, f2: 220, d: 0.35, type: "triangle", v: 0.11 });
    tone(c, { t: 0.14, f: 247, f2: 160, d: 0.4, type: "triangle", v: 0.09 });
  },
  push(c) { tone(c, { f: 440, d: 0.14, v: 0.08 }); tone(c, { t: 0.12, f: 440, d: 0.14, v: 0.08 }); },
};

function synth(name, arg) {
  try { const c = ctx(); if (c && vol() > 0) SYNTH[name]?.(c, arg); } catch (e) {}
}

export function play(name, arg) {
  const file = FILES[name];
  if (!file || fileState[name] === "missing") return synth(name, arg);
  try {
    const a = new Audio(asset(`audio/sfx/${file}.ogg`));
    a.volume = Math.min(1, 0.8 * vol());
    a.addEventListener("error", () => { if (fileState[name] !== "ok") { fileState[name] = "missing"; synth(name, arg); } }, { once: true });
    a.addEventListener("canplay", () => { fileState[name] = "ok"; }, { once: true });
    a.play().catch(() => {});
  } catch (e) { synth(name, arg); }
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
