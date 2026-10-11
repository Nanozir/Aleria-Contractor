// Casino.jsx — The Gambling Den: Wheel, Blackjack, Slots, Dice and High-Low.
// Every game shares one wallet (bronze) and one bet picker. Sounds come from ./sound.js.
import React, { useEffect, useRef, useState } from "react";
import { play, sleep } from "./sound";
import "./casino.css";

const fmt = (n) => Math.floor(n).toLocaleString("en-US");
const CHIPS = [10, 50, 100, 500, 1000, 5000];
const CHIP_COLORS = { 10: "#8e8aa8", 50: "#3ec995", 100: "#4aa3ff", 500: "#a66bff", 1000: "#ff6bcb", 5000: "#ffd966" };

// Keeps async game sequences from touching state after the player leaves the screen.
function useAlive() {
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  return alive;
}

function BetPicker({ bet, setBet, bronze, disabled }) {
  return <div className="cz-bets">
    {CHIPS.map(c => <button key={c} data-testid={`bet-${c}`} disabled={disabled || bronze < c}
      className={`cz-chip ${bet === c ? "on" : ""}`} style={{ "--chip": CHIP_COLORS[c] }}
      onClick={() => { setBet(c); play("chip", 1); }}>{c >= 1000 ? `${c / 1000}k` : c}</button>)}
  </div>;
}

function Banner({ result }) {
  if (!result) return <div className="cz-banner empty" />;
  return <div key={result.id} className={`cz-banner ${result.kind}`}>
    <b>{result.title}</b>
    {result.sub && <span>{result.sub}</span>}
    {result.amount > 0 && <em className="cz-float">+{fmt(result.amount)} B</em>}
  </div>;
}

// ═════════════════════════════ CARDS ═════════════════════════════
const SUITS = ["♠", "♥", "♦", "♣"];
const RANK_LABEL = { 1: "A", 11: "J", 12: "Q", 13: "K" };
const label = (r) => RANK_LABEL[r] || String(r);

function newShoe(decks = 1) {
  const s = [];
  for (let d = 0; d < decks; d++) for (const suit of SUITS) for (let r = 1; r <= 13; r++) s.push({ r, suit, id: `${d}${suit}${r}` });
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
}

export function PlayingCard({ card, hidden, small, from = "shoe", glow }) {
  const red = card && (card.suit === "♥" || card.suit === "♦");
  return <div className={`cz-card ${small ? "small" : ""} from-${from} ${glow ? "glow-" + glow : ""}`}>
    <div className={`cz-card-inner ${hidden ? "hidden" : ""}`}>
      <div className={`cz-face ${red ? "red" : ""}`}>
        {card && <>
          <span className="cz-idx tl">{label(card.r)}<i>{card.suit}</i></span>
          <span className="cz-pip">{card.r > 10 ? <span className="cz-court">{label(card.r)}</span> : card.suit}</span>
          <span className="cz-idx br">{label(card.r)}<i>{card.suit}</i></span>
        </>}
      </div>
      <div className="cz-back"><span /></div>
    </div>
  </div>;
}

// ═════════════════════════════ BLACKJACK ═════════════════════════════
const bjVal = (c) => c.r === 1 ? 11 : Math.min(10, c.r);
function handValue(h) {
  let v = 0, aces = 0;
  for (const c of h) { v += bjVal(c); if (c.r === 1) aces++; }
  while (v > 21 && aces > 0) { v -= 10; aces--; }
  return { v, soft: aces > 0 && v <= 21 };
}
const isNatural = (h) => h.length === 2 && handValue(h).v === 21;

function Blackjack({ bronze, bet, setBet, pay, payout }) {
  const alive = useAlive();
  const shoe = useRef(newShoe(4));
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [holeHidden, setHoleHidden] = useState(true);
  const [phase, setPhase] = useState("bet"); // bet | dealing | player | dealer | done
  const [stake, setStake] = useState(0);
  const [result, setResult] = useState(null);
  const [shuffling, setShuffling] = useState(false);
  const lock = useRef(false); // stops double clicks / key repeats from running two actions at once
  const act = (fn) => (...a) => { if (lock.current) return; lock.current = true; fn(...a); };
  const toPlayer = () => { lock.current = false; setPhase("player"); };

  async function draw() {
    if (shoe.current.length < 52) {
      setShuffling(true); play("shuffle"); await sleep(900);
      shoe.current = newShoe(4); if (alive.current) setShuffling(false);
    }
    return shoe.current.pop();
  }
  const finish = (kind, title, sub, amount) => {
    if (amount > 0) payout(amount);
    setResult({ id: Date.now(), kind, title, sub, amount });
    setPhase("done"); lock.current = false;
    play(kind === "bj" ? "blackjack" : kind === "win" ? "win" : kind === "push" ? "push" : "lose");
  };

  async function deal() {
    if (!pay(bet)) { lock.current = false; return; }
    setStake(bet); setResult(null); setHoleHidden(true); setPlayer([]); setDealer([]); setPhase("dealing");
    play("chip", 3); await sleep(250);
    let p = [], d = [];
    for (const who of ["p", "d", "p", "d"]) {
      const c = await draw(); if (!alive.current) return;
      if (who === "p") { p = [...p, c]; setPlayer(p); } else { d = [...d, c]; setDealer(d); }
      play("deal"); await sleep(260);
    }
    // Naturals resolve immediately: no hit or stand on a dealt 21.
    const pn = isNatural(p), dn = isNatural(d);
    if (pn || dn) {
      await sleep(250); setHoleHidden(false); play("flip"); await sleep(450);
      if (!alive.current) return;
      if (pn && dn) return finish("push", "Push", "Both have Blackjack. Bet returned.", bet);
      if (pn) return finish("bj", "BLACKJACK!", "Natural 21 pays 3 to 2.", Math.floor(bet * 2.5));
      return finish("lose", "Dealer Blackjack", "The house turns over 21.", 0);
    }
    toPlayer();
  }

  async function dealerPlay(p, s) {
    setPhase("dealer"); setHoleHidden(false); play("flip"); await sleep(500);
    let d = dealer;
    while (handValue(d).v < 17) {
      const c = await draw(); if (!alive.current) return;
      d = [...d, c]; setDealer(d); play("deal"); await sleep(520);
    }
    if (!alive.current) return;
    const pv = handValue(p).v, dv = handValue(d).v;
    if (dv > 21) finish("win", "Dealer busts!", `Dealer drew to ${dv}.`, s * 2);
    else if (pv > dv) finish("win", "You win!", `${pv} beats ${dv}.`, s * 2);
    else if (pv === dv) finish("push", "Push", `Both on ${pv}. Bet returned.`, s);
    else finish("lose", "Dealer wins", `${dv} beats ${pv}.`, 0);
  }

  async function hit(double = false) {
    let s = stake;
    if (double) { if (!pay(stake)) { lock.current = false; return; } s = stake * 2; setStake(s); play("chip", 3); }
    setPhase("dealing");
    const c = await draw(); if (!alive.current) return;
    const p = [...player, c]; setPlayer(p); play("deal"); await sleep(320);
    const v = handValue(p).v;
    if (v > 21) return finish("lose", "Bust!", `You went over with ${v}.`, 0);
    if (v === 21 || double) return dealerPlay(p, s); // 21 stands automatically
    toPlayer();
  }

  useEffect(() => {
    const h = (e) => {
      if (phase !== "player" || e.repeat) return;
      if (e.key === "h" || e.key === "H") act(hit)();
      if (e.key === "s" || e.key === "S") act(dealerPlay)(player, stake);
      if ((e.key === "d" || e.key === "D") && player.length === 2 && bronze >= stake) act(hit)(true);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  const pv = handValue(player), dv = handValue(holeHidden ? dealer.slice(0, 1) : dealer);
  const busy = phase === "dealing" || phase === "dealer";
  const showTable = phase !== "bet";

  return <div className="cz-game cz-felt green">
    <div className="cz-table-head">
      <div><h3>Blackjack</h3><p>Dealer stands on 17 · Blackjack pays 3:2 · 21 stands automatically</p></div>
      <div className={`cz-shoe ${shuffling ? "shuffling" : ""}`} title="Card shoe"><span /><span /><span /><em>{shuffling ? "Shuffling…" : `${shoe.current.length} cards`}</em></div>
    </div>

    <div className="cz-hand-row">
      <div className="cz-hand-label">Dealer {showTable && dealer.length > 0 && <b>{dv.v}{holeHidden && dealer.length > 1 ? " + ?" : ""}</b>}</div>
      <div className="cz-hand" data-testid="bj-dealer">{dealer.map((c, i) => <PlayingCard key={c.id + i} card={c} hidden={i === 1 && holeHidden} />)}</div>
    </div>
    <div className="cz-hand-row">
      <div className="cz-hand-label">You {player.length > 0 && <b className={pv.v > 21 ? "bust" : pv.v === 21 ? "best" : ""}>{pv.soft && pv.v < 21 ? `soft ${pv.v}` : pv.v}</b>}
        {stake > 0 && showTable && <span className="cz-stake">Stake {fmt(stake)} B</span>}</div>
      <div className="cz-hand" data-testid="bj-player">{player.map((c, i) => <PlayingCard key={c.id + i} card={c} glow={phase === "done" && result?.kind === "bj" ? "gold" : null} />)}</div>
    </div>

    <Banner result={phase === "done" ? result : null} />

    {phase === "player" ? <div className="cz-actions">
      <button className="cz-btn green" data-testid="bj-hit" onClick={() => act(hit)()}>Hit <kbd>H</kbd></button>
      <button className="cz-btn amber" data-testid="bj-stand" onClick={() => act(dealerPlay)(player, stake)}>Stand <kbd>S</kbd></button>
      {player.length === 2 && <button className="cz-btn violet" data-testid="bj-double" disabled={bronze < stake} onClick={() => act(hit)(true)}>Double <kbd>D</kbd></button>}
    </div> : <div className="cz-actions">
      <BetPicker bet={bet} setBet={setBet} bronze={bronze} disabled={busy} />
      <button className="cz-btn gold big" data-testid={phase === "done" ? "bj-replay" : "bj-deal"} disabled={busy || bronze < bet} onClick={act(deal)}>
        {busy ? "…" : phase === "done" ? `Deal again · ${fmt(bet)} B` : `Deal · ${fmt(bet)} B`}</button>
    </div>}
  </div>;
}

// ═════════════════════════════ WHEEL ═════════════════════════════
// 24 equal segments. Expected return is about 1.1x the bet, with a jackpot next to two blanks.
const WHEEL = [10, 0, 1, 0, 2, 0.5, 0, 1.5, 0, 1, 0, 2, 0, 5, 0, 0.5, 0, 1.5, 0, 1, 0, 0.5, 0, 0];
const SEG = 360 / WHEEL.length;
const WHEEL_COLOR = (m, i) => m === 10 ? "#ffd966" : m === 5 ? "#ff6bcb" : m === 2 ? "#a66bff" : m === 1.5 ? "#4aa3ff" : m === 1 ? "#3ec995" : m === 0.5 ? "#5d6a85" : (i % 2 ? "#1d1029" : "#2a1838");
const wheelLabel = (m) => m === 0 ? "✕" : m === 10 ? "10×" : `${m}×`;

function polar(r, deg) { const a = (deg - 90) * Math.PI / 180; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]; }
function segPath(i) {
  const [x1, y1] = polar(92, i * SEG), [x2, y2] = polar(92, (i + 1) * SEG);
  return `M100 100 L${x1} ${y1} A92 92 0 0 1 ${x2} ${y2} Z`;
}

function Wheel({ bronze, bet, setBet, pay, payout }) {
  const alive = useAlive();
  const rotor = useRef(null), pointer = useRef(null);
  const angle = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [winIdx, setWinIdx] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  function spin() {
    if (spinning || !pay(bet)) return;
    setSpinning(true); setWinIdx(null); setResult(null);
    play("chip", 2); play("whoosh");
    const target = Math.floor(Math.random() * WHEEL.length);
    const jitter = (Math.random() - 0.5) * SEG * 0.7;
    // The pointer is at the top (0°). Segment i is centred on (i + 0.5) * SEG on the rotor.
    const start = angle.current;
    const base = start - (start % 360);
    const end = base + 360 * 6 + (360 - ((target + 0.5) * SEG + jitter));
    const dur = 5200, t0 = performance.now();
    let lastSeg = Math.floor(start / SEG);
    const frame = (now) => {
      if (!alive.current) return;
      const x = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - x, 4);
      const a = start + (end - start) * e;
      angle.current = a;
      if (rotor.current) rotor.current.style.transform = `rotate(${a}deg)`;
      const seg = Math.floor(a / SEG);
      if (seg !== lastSeg) {
        lastSeg = seg; play("tick");
        if (pointer.current) { pointer.current.classList.remove("flick"); void pointer.current.offsetWidth; pointer.current.classList.add("flick"); }
      }
      if (x < 1) return requestAnimationFrame(frame);
      const m = WHEEL[target], win = Math.floor(bet * m);
      setWinIdx(target); setSpinning(false);
      setHistory(h => [m, ...h].slice(0, 10));
      if (win > 0) payout(win);
      const kind = m >= 5 ? "bj" : m > 1 ? "win" : m === 1 ? "push" : m > 0 ? "lose" : "lose";
      setResult({ id: Date.now(), kind, title: m === 0 ? "Blank" : m >= 5 ? `JACKPOT ${m}×!` : `${m}×`, sub: m === 0 ? "The wheel keeps your bet." : m < 1 ? "Half your bet back." : m === 1 ? "Bet returned." : null, amount: win });
      play(m >= 5 ? "bigWin" : m > 1 ? "win" : m === 1 ? "push" : "lose");
    };
    requestAnimationFrame(frame);
  }

  return <div className="cz-game cz-felt rose">
    <div className="cz-table-head"><div><h3>Wheel of Fortune</h3><p>Land on a multiplier. Gold pays 10×, pink pays 5×.</p></div></div>
    <div className="cz-wheel-wrap">
      <div className={`cz-wheel-lights ${spinning ? "chase" : winIdx != null && WHEEL[winIdx] > 1 ? "flash" : ""}`}>
        {Array.from({ length: 24 }, (_, i) => <span key={i} style={{ transform: `rotate(${i * 15}deg) translateY(-143px)` }} />)}
      </div>
      <div ref={pointer} className="cz-wheel-pointer" />
      <svg className="cz-wheel" viewBox="0 0 200 200">
        <defs><radialGradient id="czHub"><stop offset="0" stopColor="#fff6d0" /><stop offset="1" stopColor="#a8740c" /></radialGradient></defs>
        <circle cx="100" cy="100" r="99" fill="#120818" stroke="#ffd966" strokeWidth="2" />
        <g ref={rotor} style={{ transformOrigin: "100px 100px", transform: `rotate(${angle.current}deg)` }}>
          {WHEEL.map((m, i) => <g key={i}>
            <path d={segPath(i)} fill={WHEEL_COLOR(m, i)} stroke="rgba(0,0,0,0.45)" strokeWidth="0.6" className={winIdx === i ? "cz-seg-win" : ""} />
            <text x="100" y="22" transform={`rotate(${(i + 0.5) * SEG} 100 100)`} textAnchor="middle" className={`cz-seg-label ${m >= 5 ? "hot" : m === 0 ? "dim" : ""}`}>{wheelLabel(m)}</text>
          </g>)}
          {WHEEL.map((_, i) => { const [x, y] = polar(92, i * SEG); return <circle key={"p" + i} cx={x} cy={y} r="1.6" fill="#ffe9a8" />; })}
        </g>
        <circle cx="100" cy="100" r="17" fill="url(#czHub)" stroke="#5a3a00" strokeWidth="1.5" />
        <text x="100" y="104" textAnchor="middle" className="cz-hub-text">ALERIA</text>
      </svg>
    </div>
    <div className="cz-history">{history.map((m, i) => <span key={i} style={{ background: WHEEL_COLOR(m, 1) }}>{wheelLabel(m)}</span>)}</div>
    <Banner result={result} />
    <div className="cz-actions">
      <BetPicker bet={bet} setBet={setBet} bronze={bronze} disabled={spinning} />
      <button className="cz-btn gold big" data-testid="wheel-spin" disabled={spinning || bronze < bet} onClick={spin}>{spinning ? "Spinning…" : `Spin · ${fmt(bet)} B`}</button>
    </div>
  </div>;
}

// ═════════════════════════════ SLOTS ═════════════════════════════
// Reel strips are built from symbol weights, so rarer symbols really are rarer. Expected return ≈ 1.0×.
const SYMBOLS = [
  { s: "🍒", w: 7, pay: 8 }, { s: "🍋", w: 6, pay: 10 }, { s: "🔔", w: 5, pay: 15 }, { s: "🍀", w: 4, pay: 20 },
  { s: "⭐", w: 3, pay: 30 }, { s: "💎", w: 2, pay: 60 }, { s: "7️⃣", w: 1, pay: 150 },
];
function buildStrip() {
  const s = []; SYMBOLS.forEach(x => { for (let i = 0; i < x.w; i++) s.push(x.s); });
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
}
const CELL = 74;
function slotPay(line) {
  const [a, b, c] = line;
  if (a === b && b === c) return { m: SYMBOLS.find(x => x.s === a).pay, cells: [0, 1, 2], name: `Three ${a}` };
  const cherries = line.map((x, i) => x === "🍒" ? i : -1).filter(i => i >= 0);
  if (cherries.length === 2) return { m: 3, cells: cherries, name: "Two cherries" };
  if (a === "🍒") return { m: 1, cells: [0], name: "Cherry on reel one" };
  return { m: 0, cells: [], name: "" };
}

function Slots({ bronze, bet, setBet, pay, payout }) {
  const alive = useAlive();
  const strips = useRef([buildStrip(), buildStrip(), buildStrip()]);
  const [pos, setPos] = useState([0, 5, 11]);
  const [moving, setMoving] = useState([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [lever, setLever] = useState(false);
  const [win, setWin] = useState(null);
  const [result, setResult] = useState(null);
  const N = strips.current[0].length;

  function spin() {
    if (spinning || !pay(bet)) return;
    setSpinning(true); setWin(null); setResult(null); setLever(true); play("lever");
    setTimeout(() => alive.current && setLever(false), 380);
    const start = [...pos];
    const targets = [0, 1, 2].map(() => Math.floor(Math.random() * N));
    const ends = start.map((p, i) => p + N * (2 + i) + (((targets[i] - p) % N) + N) % N);
    const durs = [1300, 1750, 2200];
    const t0 = performance.now();
    const stopped = [false, false, false];
    setMoving([true, true, true]);
    const frame = (now) => {
      if (!alive.current) return;
      const next = start.map((p, i) => {
        const x = Math.min(1, (now - t0) / durs[i]);
        // ease-out with a small bounce at the end, like a reel catching its stop
        const c1 = 1.2, c3 = c1 + 1;
        const e = 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        if (x >= 1 && !stopped[i]) { stopped[i] = true; play("reel"); setMoving(m => m.map((v, k) => k === i ? false : v)); }
        return p + (ends[i] - p) * e;
      });
      setPos(next);
      if (stopped.every(Boolean)) {
        const final = ends.map(e => e % N);
        setPos(final); setSpinning(false);
        const line = final.map((p, i) => strips.current[i][Math.round(p) % N]);
        const r = slotPay(line), amount = Math.floor(bet * r.m);
        if (amount > 0) payout(amount);
        setWin(r.m > 0 ? r : null);
        setResult(r.m > 0
          ? { id: Date.now(), kind: r.m >= 20 ? "bj" : r.m > 1 ? "win" : "push", title: r.m >= 20 ? `JACKPOT ${r.m}×!` : `${r.m}×`, sub: r.name, amount }
          : { id: Date.now(), kind: "lose", title: "No line", sub: "Spin again?", amount: 0 });
        play(r.m >= 20 ? "bigWin" : r.m > 1 ? "win" : r.m === 1 ? "push" : "lose");
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  return <div className="cz-game cz-felt gold">
    <div className="cz-table-head"><div><h3>Lucky Sevens</h3><p>One payline across the middle row.</p></div></div>
    <div className="cz-slot">
      <div className={`cz-slot-cab ${win ? (win.m >= 20 ? "jackpot" : "won") : ""} ${spinning ? "running" : ""}`}>
        <div className="cz-slot-marquee">{Array.from({ length: 14 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}</div>
        <div className="cz-reels">
          {[0, 1, 2].map(r => {
            const p = pos[r], base = Math.floor(p), frac = p - base;
            return <div key={r} className={`cz-reel ${moving[r] ? "blur" : ""}`}>
              <div className="cz-reel-strip" style={{ transform: `translateY(${frac * CELL - CELL}px)` }}>
                {[-1, 0, 1, 2, 3].map(k => {
                  const idx = (((base - k + 1) % N) + N) % N;
                  const isLine = k === 1 && !moving[r] && win?.cells.includes(r);
                  return <div key={k} className={`cz-cell ${isLine ? "hit" : ""}`}>{strips.current[r][idx]}</div>;
                })}
              </div>
            </div>;
          })}
          <div className="cz-payline" />
        </div>
      </div>
      <button className={`cz-lever ${lever ? "pulled" : ""}`} aria-label="Pull lever" disabled={spinning || bronze < bet} onClick={spin}><span className="knob" /><span className="arm" /></button>
    </div>
    <Banner result={result} />
    <div className="cz-actions">
      <BetPicker bet={bet} setBet={setBet} bronze={bronze} disabled={spinning} />
      <button className="cz-btn gold big" data-testid="slot-spin" disabled={spinning || bronze < bet} onClick={spin}>{spinning ? "Spinning…" : `Spin · ${fmt(bet)} B`}</button>
    </div>
    <div className="cz-paytable">
      {SYMBOLS.slice().reverse().map(x => <span key={x.s}>{x.s}{x.s}{x.s} <b>{x.pay}×</b></span>)}
      <span>🍒🍒 any <b>3×</b></span><span>🍒 first reel <b>1×</b></span>
    </div>
  </div>;
}

// ═════════════════════════════ DICE ═════════════════════════════
const FACE_ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const RIVALS = [
  { name: "Old Brannoc", line: "Bones don't lie, lad. People do." },
  { name: "Sly Wenna", line: "Loaded? Me? I'm insulted. Roll." },
  { name: "Ser Dregg", line: "I lost a castle like this once." },
  { name: "Tamsin Two-Coins", line: "Double or nothing, always." },
];

function Die({ value, spin, rival, tossKey }) {
  const [rx, ry] = FACE_ROT[value || 1];
  return <div className={`cz-die-wrap ${rival ? "rival" : ""} ${tossKey ? "toss" + (tossKey % 2) : ""}`}>
    <div className="cz-die" style={{ transform: `rotateX(${rx + spin * 360}deg) rotateY(${ry + spin * 360}deg)` }}>
      {[1, 2, 3, 4, 5, 6].map(f => <div key={f} className={`cz-die-face f${f}`}>
        {Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[f].includes(i) ? "on" : ""} />)}
      </div>)}
    </div>
  </div>;
}

const rollD = () => 1 + Math.floor(Math.random() * 6);

function Dice({ bronze, bet, setBet, pay, payout }) {
  const alive = useAlive();
  const [mode, setMode] = useState("duel"); // duel | seven
  const [pick, setPick] = useState("over");
  const [you, setYou] = useState([3, 4]);
  const [them, setThem] = useState([2, 5]);
  const [spin, setSpin] = useState(0);
  const [toss, setToss] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [rival, setRival] = useState(() => RIVALS[Math.floor(Math.random() * RIVALS.length)]);

  async function roll() {
    if (rolling || !pay(bet)) return;
    setRolling(true); setResult(null);
    play("chip", 2); play("diceShake"); await sleep(480);
    if (!alive.current) return;
    const y = [rollD(), rollD()], t = [rollD(), rollD()];
    setSpin(s => s + 2 + Math.floor(Math.random() * 2)); setToss(k => k + 1);
    setYou(y); if (mode === "duel") setThem(t);
    play("diceThrow"); await sleep(1150);
    if (!alive.current) return;
    setRolling(false);
    const ys = y[0] + y[1];
    if (mode === "duel") {
      const ts = t[0] + t[1];
      const boxcars = y[0] === 6 && y[1] === 6, snake = y[0] === 1 && y[1] === 1;
      if (boxcars) { payout(bet * 5); setResult({ id: Date.now(), kind: "bj", title: "BOXCARS! 5×", sub: "Double sixes win outright.", amount: bet * 5 }); play("bigWin"); }
      else if (snake) { setResult({ id: Date.now(), kind: "lose", title: "Snake eyes", sub: "Double ones lose outright.", amount: 0 }); play("lose"); }
      else if (ys > ts) { const m = y[0] === y[1] ? 3 : 2; payout(bet * m); setResult({ id: Date.now(), kind: "win", title: m === 3 ? "Doubles win! 3×" : "You win! 2×", sub: `${ys} beats ${ts}.`, amount: bet * m }); play("win"); }
      else if (ys === ts) { payout(bet); setResult({ id: Date.now(), kind: "push", title: "Tie", sub: `Both rolled ${ys}. Bet returned.`, amount: bet }); play("push"); }
      else { setResult({ id: Date.now(), kind: "lose", title: `${rival.name} wins`, sub: `${ts} beats ${ys}.`, amount: 0 }); play("lose"); }
    } else {
      const hit = (pick === "under" && ys < 7) || (pick === "seven" && ys === 7) || (pick === "over" && ys > 7);
      const m = pick === "seven" ? 5 : 2;
      if (hit) { payout(bet * m); setResult({ id: Date.now(), kind: m === 5 ? "bj" : "win", title: `${ys}! ${m}×`, sub: pick === "seven" ? "Lucky seven." : `Called ${pick} seven.`, amount: bet * m }); play(m === 5 ? "bigWin" : "win"); }
      else { setResult({ id: Date.now(), kind: "lose", title: `Rolled ${ys}`, sub: `You called ${pick === "seven" ? "exactly seven" : pick + " seven"}.`, amount: 0 }); play("lose"); }
    }
  }

  return <div className="cz-game cz-felt violet">
    <div className="cz-table-head">
      <div><h3>{mode === "duel" ? "Dice Duel" : "Over / Under Seven"}</h3>
        <p>{mode === "duel" ? "Higher total wins 2×. Winning doubles pay 3×. 6-6 wins 5×, 1-1 loses." : "Call the total of two dice. Over or under pays 2×, exactly seven pays 5×."}</p></div>
      <div className="cz-seg-ctl">
        <button className={mode === "duel" ? "on" : ""} data-testid="dice-mode-duel" disabled={rolling} onClick={() => { setMode("duel"); setResult(null); }}>Duel</button>
        <button className={mode === "seven" ? "on" : ""} data-testid="dice-mode-seven" disabled={rolling} onClick={() => { setMode("seven"); setResult(null); }}>Over/Under</button>
      </div>
    </div>
    <div className={`cz-dice-table ${mode}`}>
      <div className="cz-dice-side">
        <p className="cz-hand-label">You <b>{you[0] + you[1]}</b></p>
        <div className="cz-dice-pair"><Die value={you[0]} spin={spin} tossKey={toss} /><Die value={you[1]} spin={spin + 1} tossKey={toss} /></div>
      </div>
      {mode === "duel" && <div className="cz-dice-side">
        <p className="cz-hand-label">{rival.name} <b>{them[0] + them[1]}</b></p>
        <div className="cz-dice-pair"><Die value={them[0]} spin={spin + 1} rival tossKey={toss} /><Die value={them[1]} spin={spin} rival tossKey={toss} /></div>
        <p className="cz-rival-line" onClick={() => !rolling && setRival(RIVALS[(RIVALS.indexOf(rival) + 1) % RIVALS.length])} title="Pick another opponent">“{rival.line}” ↻</p>
      </div>}
    </div>
    {mode === "seven" && <div className="cz-seg-ctl wide">
      {[["under", "Under 7 · 2×"], ["seven", "Exactly 7 · 5×"], ["over", "Over 7 · 2×"]].map(([k, l]) =>
        <button key={k} className={pick === k ? "on" : ""} data-testid={`dice-pick-${k}`} disabled={rolling} onClick={() => setPick(k)}>{l}</button>)}
    </div>}
    <Banner result={result} />
    <div className="cz-actions">
      <BetPicker bet={bet} setBet={setBet} bronze={bronze} disabled={rolling} />
      <button className="cz-btn gold big" data-testid="dice-roll" disabled={rolling || bronze < bet} onClick={roll}>{rolling ? "Rolling…" : `Roll · ${fmt(bet)} B`}</button>
    </div>
  </div>;
}

// ═════════════════════════════ HIGH-LOW ═════════════════════════════
// One real deck, no replacement, aces high. Each guess pays fair odds minus a 5% house edge,
// so a risky call is worth more than a safe one. Equal ranks are a push.
const hlRank = (c) => c.r === 1 ? 14 : c.r;
function hlOdds(deck, cur) {
  const n = deck.length; if (!n) return { hi: 0, lo: 0, mHi: 0, mLo: 0 };
  const r = hlRank(cur);
  const hi = deck.filter(c => hlRank(c) > r).length / n, lo = deck.filter(c => hlRank(c) < r).length / n;
  const mult = (p) => p > 0 ? Math.max(1.02, Math.round(0.95 / p * 100) / 100) : 0;
  return { hi, lo, mHi: mult(hi), mLo: mult(lo) };
}

function HighLow({ bronze, bet, setBet, pay, payout }) {
  const alive = useAlive();
  const deck = useRef(newShoe(1));
  const [cur, setCur] = useState(null);
  const [next, setNext] = useState(null);
  const [nextHidden, setNextHidden] = useState(true);
  const [trail, setTrail] = useState([]);
  const [pot, setPot] = useState(0);
  const [stake, setStake] = useState(0);
  const [phase, setPhase] = useState("bet"); // bet | play | reveal | done
  const [skips, setSkips] = useState(1);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(null);

  async function drawCard() {
    if (deck.current.length === 0) { play("shuffle"); await sleep(800); deck.current = newShoe(1); }
    return deck.current.pop();
  }

  async function start() {
    if (!pay(bet)) return;
    setStake(bet); setPot(bet); setTrail([]); setResult(null); setNext(null); setSkips(1); setFlash(null);
    if (deck.current.length < 20) { play("shuffle"); deck.current = newShoe(1); await sleep(800); }
    play("chip", 2);
    const c = await drawCard(); if (!alive.current) return;
    setCur(c); play("deal"); setPhase("play");
  }

  const lock = useRef(false);
  async function guess(dir) {
    if (phase !== "play" || lock.current) return;
    lock.current = true;
    try { await guessInner(dir); } finally { lock.current = false; }
  }
  async function guessInner(dir) {
    const o = hlOdds(deck.current, cur);
    setPhase("reveal");
    const c = await drawCard(); if (!alive.current) return;
    setNext(c); setNextHidden(true); play("deal"); await sleep(280);
    setNextHidden(false); play("flip"); await sleep(420);
    if (!alive.current) return;
    const a = hlRank(cur), b = hlRank(c);
    if (dir === "skip") {
      setSkips(s => s - 1); setFlash(null);
    } else if (a === b) {
      setFlash("push");
    } else if ((dir === "hi" && b > a) || (dir === "lo" && b < a)) {
      const m = dir === "hi" ? o.mHi : o.mLo;
      setPot(p => Math.floor(p * m)); setFlash("win"); play("chip", 2);
    } else {
      setFlash("lose"); setPhase("done");
      setResult({ id: Date.now(), kind: "lose", title: "Wrong call", sub: `${label(c.r)}${c.suit} after ${label(cur.r)}${cur.suit}. The pot is gone.`, amount: 0 });
      play("lose"); return;
    }
    await sleep(350); if (!alive.current) return;
    setTrail(t => [...t, cur].slice(-8)); setCur(c); setNext(null); setPhase("play");
  }

  function cashOut() {
    if (phase !== "play" || pot <= stake) return;
    payout(pot);
    setResult({ id: Date.now(), kind: pot >= stake * 5 ? "bj" : "win", title: `Cashed out ${fmt(pot)} B`, sub: `${(pot / stake).toFixed(2)}× your stake.`, amount: pot });
    play(pot >= stake * 5 ? "bigWin" : "win"); setPhase("done");
  }

  const o = cur ? hlOdds(deck.current, cur) : null;
  const pct = (p) => `${Math.round(p * 100)}%`;
  useEffect(() => {
    const h = (e) => {
      if (phase === "play") {
        if (e.repeat) return;
        if (e.key === "ArrowUp" && o?.hi > 0) { e.preventDefault(); guess("hi"); }
        if (e.key === "ArrowDown" && o?.lo > 0) { e.preventDefault(); guess("lo"); }
        if (e.key === "c" || e.key === "C") cashOut();
      }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  return <div className="cz-game cz-felt amber">
    <div className="cz-table-head">
      <div><h3>High-Low</h3><p>One deck, aces high. Riskier calls pay more. Equal rank is a push. Cash out any time.</p></div>
      <div className="cz-shoe small"><span /><span /><em>{deck.current.length} left</em></div>
    </div>
    {phase === "bet" ? <div className="cz-hl-intro">
      <PlayingCard card={null} hidden from="none" /><p>Guess whether the next card is higher or lower. Every right call grows the pot.</p>
    </div> : <>
      <div className="cz-hl-trail">{trail.map((c, i) => <PlayingCard key={c.id + i} card={c} small from="none" />)}</div>
      <div className="cz-hl-board">
        <div className="cz-hl-slot">{cur && <PlayingCard key={cur.id} card={cur} from="none" glow={flash === "win" ? "green" : null} />}<span>Current</span></div>
        <div className="cz-hl-pot"><small>Pot</small><b data-testid="hl-pot">{fmt(pot)} B</b><small>{stake ? `${(pot / stake).toFixed(2)}×` : ""}</small></div>
        <div className="cz-hl-slot">{next ? <PlayingCard key={next.id} card={next} hidden={nextHidden} glow={flash === "lose" ? "red" : flash === "win" ? "green" : null} /> : <div className="cz-card-ghost">?</div>}<span>Next</span></div>
      </div>
    </>}
    <Banner result={phase === "done" ? result : null} />
    {phase === "play" || phase === "reveal" ? <div className="cz-actions">
      <div className="cz-hl-btns">
        <button className="cz-btn green" data-testid="hl-higher" disabled={phase !== "play" || !o?.hi} onClick={() => guess("hi")}>▲ Higher <small>{o?.hi ? `${pct(o.hi)} · ${o.mHi}×` : "impossible"}</small></button>
        <button className="cz-btn red" data-testid="hl-lower" disabled={phase !== "play" || !o?.lo} onClick={() => guess("lo")}>▼ Lower <small>{o?.lo ? `${pct(o.lo)} · ${o.mLo}×` : "impossible"}</small></button>
      </div>
      <div className="cz-hl-btns">
        <button className="cz-btn ghost" data-testid="hl-skip" disabled={phase !== "play" || skips < 1} onClick={() => guess("skip")}>Skip card ({skips})</button>
        <button className="cz-btn gold" data-testid="hl-cash" disabled={phase !== "play" || pot <= stake} onClick={cashOut}>Cash out {fmt(pot)} B</button>
      </div>
    </div> : <div className="cz-actions">
      <BetPicker bet={bet} setBet={setBet} bronze={bronze} />
      <button className="cz-btn gold big" data-testid={phase === "done" ? "hl-replay" : "hl-start"} disabled={bronze < bet} onClick={start}>{phase === "done" ? "Play again" : "Start"} · {fmt(bet)} B</button>
    </div>}
  </div>;
}

// ═════════════════════════════ DEN ═════════════════════════════
const GAMES = [
  { id: "wheel", name: "Wheel", icon: "🎡", color: "#ff6bcb", C: Wheel },
  { id: "bj", name: "Blackjack", icon: "🂡", color: "#3ec995", C: Blackjack },
  { id: "slot", name: "Slots", icon: "🎰", color: "#ffd966", C: Slots },
  { id: "dice", name: "Dice", icon: "🎲", color: "#a89df0", C: Dice },
  { id: "hl", name: "High-Low", icon: "📈", color: "#ff8c00", C: HighLow },
];

export default function Casino({ bronze, setBronze, notify, setTotalEarned }) {
  const [tab, setTab] = useState(() => { try { return localStorage.getItem("aleria_casino_tab") || "bj"; } catch (e) { return "bj"; } });
  const [bet, setBet] = useState(50);
  const [delta, setDelta] = useState(null);
  const bronzeRef = useRef(bronze); bronzeRef.current = bronze;

  useEffect(() => { try { localStorage.setItem("aleria_casino_tab", tab); } catch (e) {} }, [tab]);
  // Keep the chosen bet affordable.
  useEffect(() => { if (bronze < bet) { const fit = [...CHIPS].reverse().find(c => c <= bronze); if (fit) setBet(fit); } }, [bronze]);

  const pay = (amount) => {
    if (bronzeRef.current < amount) { notify?.("Not enough bronze.", "#d84838"); return false; }
    bronzeRef.current -= amount; setBronze(b => b - amount);
    setDelta({ id: Date.now(), v: -amount });
    return true;
  };
  const payout = (amount) => {
    if (amount <= 0) return;
    bronzeRef.current += amount; setBronze(b => b + amount); setTotalEarned?.(t => t + amount);
    setDelta({ id: Date.now(), v: amount });
  };

  const game = GAMES.find(g => g.id === tab) || GAMES[1];
  const G = game.C;
  return <div className="cz-root">
    <div className="cz-header">
      <div><h2>The Gambling Den</h2><p>The house always… well, almost always wins.</p></div>
      <div className="cz-purse" data-testid="casino-purse">
        <span className="cz-coin" /> <b>{fmt(bronze)}</b> <small>B</small>
        {delta && <em key={delta.id} className={delta.v > 0 ? "up" : "down"}>{delta.v > 0 ? "+" : "−"}{fmt(Math.abs(delta.v))}</em>}
      </div>
    </div>
    <div className="cz-tabs">
      {GAMES.map(g => <button key={g.id} data-testid={`gamble-tab-${g.id}`} className={tab === g.id ? "on" : ""} style={{ "--c": g.color }}
        onClick={() => { setTab(g.id); play("chip", 1); }}><span>{g.icon}</span>{g.name}</button>)}
    </div>
    {bronze < CHIPS[0] && <p className="cz-broke">You're out of bronze. Come back after a contract.</p>}
    <G key={game.id} bronze={bronze} bet={bet} setBet={setBet} pay={pay} payout={payout} />
  </div>;
}
