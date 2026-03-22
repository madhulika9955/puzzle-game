import { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STYLES  (injected once via a top-level <style> in App)
═══════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:        #08090d;
    --surface:   #111218;
    --surface2:  #18191f;
    --border:    #252630;
    --border2:   #31323f;
    --txt:       #e8e9f3;
    --txt-muted: #555670;
    --txt-dim:   #2a2b38;
    --a:         #e8ff47;
    --a-dim:     rgba(232,255,71,0.10);
    --a-glow:    rgba(232,255,71,0.22);
    --b:         #ff5c87;
    --b-dim:     rgba(255,92,135,0.10);
    --b-border:  rgba(255,92,135,0.40);
    --c:         #47d4ff;
    --c-dim:     rgba(71,212,255,0.10);
    --ok:        #4ade80;
    --ok-dim:    rgba(74,222,128,0.12);
    --ok-border: rgba(74,222,128,0.40);
    --err:       #ff5c5c;
    --err-dim:   rgba(255,92,92,0.12);
    --heat-0: #1a1b22; --heat-1: #1f3d2e; --heat-2: #2d6644;
    --heat-3: #4ade80; --heat-4: #a3f0be;
  }
  body, #root {
    background: var(--bg); color: var(--txt);
    font-family: 'Syne', sans-serif; min-height: 100vh; overflow-x: hidden;
  }
  button { font-family: inherit; cursor: pointer; border: none; background: none; }
  input  { font-family: inherit; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes popIn     { from{opacity:0;transform:scale(0.84)} to{opacity:1;transform:scale(1)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 60%{transform:translateX(7px)} }
  @keyframes bounce    { from{transform:scale(0.7)} to{transform:scale(1)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes letterPop { 0%{transform:scale(0.5) rotate(-8deg);opacity:0} 70%{transform:scale(1.15) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes confettiDrop { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(90px) rotate(360deg);opacity:0} }
  @keyframes timerWarn { 0%,100%{color:var(--err)} 50%{color:var(--txt)} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes todayPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(232,255,71,0.55)} 50%{box-shadow:0 0 0 3px rgba(232,255,71,0)} }
  @keyframes winPop    { 0%{opacity:0;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }

  .fadeUp0 { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
  .fadeUp1 { animation: fadeUp 0.45s 0.06s cubic-bezier(.22,1,.36,1) both; }
  .fadeUp2 { animation: fadeUp 0.45s 0.12s cubic-bezier(.22,1,.36,1) both; }
  .fadeUp3 { animation: fadeUp 0.45s 0.18s cubic-bezier(.22,1,.36,1) both; }
  .popIn   { animation: winPop 0.4s cubic-bezier(.34,1.56,.64,1) both; }
`;

/* ═══════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════════════════════════ */
function Btn({ children, onClick, variant = "primary", style = {}, disabled = false, full = false }) {
  const bases = {
    primary: { background: "var(--a)",       color: "#08090d", boxShadow: "0 2px 18px var(--a-glow)" },
    ghost:   { background: "transparent",    color: "var(--txt)",  border: "1.5px solid var(--border2)" },
    pink:    { background: "var(--b-dim)",   color: "var(--b)",    border: "1.5px solid var(--b-border)" },
    cyan:    { background: "var(--c-dim)",   color: "var(--c)",    border: "1.5px solid var(--c)" },
    surface: { background: "var(--surface2)",color: "var(--txt)",  border: "1.5px solid var(--border2)" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        padding: "0.65rem 1.4rem", borderRadius: 10, fontWeight: 700, fontSize: "0.88rem",
        transition: "all 0.14s", opacity: disabled ? 0.38 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
        width: full ? "100%" : undefined,
        ...bases[variant], ...style,
      }}
    >{children}</button>
  );
}

function Badge({ children, color = "var(--a)", bg = "var(--a-dim)", borderColor }) {
  return (
    <span style={{
      padding: "0.18rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
      background: bg, color, border: `1px solid ${borderColor || color}`, letterSpacing: "0.4px",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Card({ children, style = {}, glowColor }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${glowColor ? glowColor : "var(--border)"}`,
      borderRadius: 18, padding: "1.25rem", position: "relative", overflow: "hidden",
      ...(glowColor ? { boxShadow: `0 0 28px rgba(0,0,0,0.3), 0 0 0 1px ${glowColor}22` } : {}),
      ...style,
    }}>{children}</div>
  );
}

function GlowDot({ color = "var(--a)", top = -40, right = -40, size = 120 }) {
  return (
    <div style={{
      position: "absolute", top, right, width: size, height: size,
      borderRadius: "50%", background: color, opacity: 0.07, pointerEvents: "none",
    }} />
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2.5px",
      color: "var(--txt-muted)", marginBottom: "0.4rem", fontWeight: 600,
    }}>{children}</div>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    delay: Math.random() * 0.8,
    color: ["var(--a)", "var(--b)", "var(--c)", "var(--ok)"][i % 4],
    size: 5 + Math.random() * 9,
    round: i % 3 === 0,
  })), []);
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 9999 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: 0, width: p.size, height: p.size,
          borderRadius: p.round ? "50%" : 3, background: p.color,
          animation: `confettiDrop 1.5s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT SHELL
═══════════════════════════════════════════════════════════════════ */
function Shell({ children, nav }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {nav && (
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(8,9,13,0.88)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 1.5rem", height: 54,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {nav}
        </nav>
      )}
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

function NavBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.2rem" }}>🧩</span>
      <span style={{
        fontWeight: 800, fontSize: "1.05rem",
        background: "linear-gradient(90deg,var(--a),var(--b))",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>PuzzleStrike</span>
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const tabs = [
    ["home",    "🏠", "Home"],
    ["puzzle",  "🎯", "Play"],
    ["games",   "🎮", "Games"],
    ["stats",   "📊", "Stats"],
    ["heatmap", "🗓️", "Activity"],
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(8,9,13,0.96)", backdropFilter: "blur(12px)",
      borderTop: "1px solid var(--border)", display: "flex", zIndex: 200,
    }}>
      {tabs.map(([id, icon, label]) => {
        const active = screen === id
          || (screen === "numgrid"  && id === "games")
          || (screen === "scramble" && id === "games");
        return (
          <button key={id} onClick={() => setScreen(id)} style={{
            flex: 1, padding: "0.6rem 0.2rem 0.75rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.12rem",
            color: active ? "var(--a)" : "var(--txt-muted)", transition: "color 0.15s",
          }}>
            <span style={{ fontSize: "1.15rem" }}>{icon}</span>
            <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 400, letterSpacing: "0.3px" }}>{label}</span>
            {active && <div style={{ width: 18, height: 2, borderRadius: 1, background: "var(--a)", marginTop: 1 }} />}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════ */
function dateKey(d = new Date()) { return d.toISOString().slice(0, 10); }
function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }

function seedRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function strToSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function djs(d) {
  const date = d ? new Date(d) : new Date();
  const fmt = (v) => String(v).padStart(2, "0");
  return {
    _d: date,
    format(f) {
      return f
        .replace("YYYY", date.getFullYear())
        .replace("MM", fmt(date.getMonth() + 1))
        .replace("DD", fmt(date.getDate()));
    },
    startOf(u) { return u === "year" ? djs(new Date(date.getFullYear(), 0, 1)) : this; },
    add(n, u) { const nd = new Date(date); if (u === "day") nd.setDate(nd.getDate() + n); return djs(nd); },
    subtract(n, u) { return this.add(-n, u); },
    isSame(o, u) { return u === "day" ? this.format("YYYY-MM-DD") === o.format("YYYY-MM-DD") : false; },
    diff(o, u) { return u === "day" ? Math.floor((date - o._d) / 86400000) : 0; },
  };
}

/* ── In-memory store ── */
const store = {
  _d: {},
  async get(k) { return this._d[k] ?? null; },
  async set(k, v) { this._d[k] = v; },
  async getAll() { return Object.values(this._d); },
};

// Seed demo history — 4-day streak ending yesterday
;(() => {
  const scores = [142, 98, 175, 110];
  const times  = [52,  81,  34,  67];
  const diffs  = [2, 3, 2, 4];
  for (let i = 0; i < 4; i++) {
    const d = djs().subtract(4 - i, "day"), key = d.format("YYYY-MM-DD");
    store._d[key] = { date: key, solved: true, score: scores[i], timeTaken: times[i], difficulty: diffs[i], synced: true };
  }
})();

/* ── Puzzle generators ── */
function genMath(date) {
  const rng = seedRandom(strToSeed(date + "math_v2"));
  const ops = ["+", "-", "*"], op = ops[Math.floor(rng() * 3)];
  let a, b, ans;
  if (op === "+") { a = Math.floor(rng() * 50) + 10; b = Math.floor(rng() * 50) + 10; ans = a + b; }
  else if (op === "-") { a = Math.floor(rng() * 50) + 30; b = Math.floor(rng() * 30) + 5; ans = a - b; }
  else { a = Math.floor(rng() * 12) + 2; b = Math.floor(rng() * 12) + 2; ans = a * b; }
  const cs = [ans];
  for (let i = 0; i < 3; i++) { let v; do { v = ans + Math.floor(rng() * 22) - 11; } while (cs.includes(v) || v < 0); cs.push(v); }
  cs.sort(() => rng() - 0.5);
  return { type: "math", question: `${a} ${op} ${b} = ?`, answer: String(ans), choices: cs.map(String), difficulty: op === "*" ? 3 : 2 };
}

function genPattern(date) {
  const rng = seedRandom(strToSeed(date + "pattern_v2"));
  const pats = [
    () => { const s = Math.floor(rng() * 3) + 1, a = Math.floor(rng() * 5) + 2; const seq = Array.from({ length: 5 }, (_, i) => a + s * i); return { seq: seq.slice(0, 4), answer: seq[4], hint: `+${s} each step` }; },
    () => { const s = Math.floor(rng() * 2) + 2, a = Math.floor(rng() * 3) + 2; const seq = Array.from({ length: 5 }, (_, i) => a * Math.pow(s, i)); return { seq: seq.slice(0, 4), answer: seq[4], hint: `×${s} each step` }; },
    () => { const a = Math.floor(rng() * 5) + 1, b = Math.floor(rng() * 5) + 2; const seq = [a, b]; for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]); return { seq: seq.slice(0, 4), answer: seq[4], hint: "Add previous two" }; },
  ];
  const p = pats[Math.floor(rng() * pats.length)]();
  const cs = [p.answer];
  for (let i = 0; i < 3; i++) { let v; do { v = p.answer + Math.floor(rng() * 22) - 11; } while (cs.includes(v) || v < 0); cs.push(v); }
  cs.sort(() => rng() - 0.5);
  return { type: "pattern", sequence: p.seq, answer: String(p.answer), choices: cs.map(String), hint: p.hint, difficulty: 2 };
}

function genCrossword(date) {
  const rng = seedRandom(strToSeed(date + "cross_v2"));
  const words = [
    { word: "REACT",  clue: "Popular JS UI library" },
    { word: "PIXEL",  clue: "Smallest screen unit" },
    { word: "CACHE",  clue: "Stored for quick access" },
    { word: "QUERY",  clue: "Database question" },
    { word: "TOKEN",  clue: "Auth credential" },
    { word: "ASYNC",  clue: "Non-blocking operation" },
    { word: "STACK",  clue: "LIFO data structure" },
    { word: "FETCH",  clue: "Browser network API" },
  ];
  const { word, clue } = words[Math.floor(rng() * words.length)];
  const blanks = word.split("").map(() => "");
  const ri = Math.floor(rng() * word.length); blanks[ri] = word[ri];
  return { type: "crossword", word, clue, blanks, revealed: ri, difficulty: 3 };
}

function genPuzzle(date) {
  const rng = seedRandom(strToSeed(date)), t = Math.floor(rng() * 3);
  return t === 0 ? genMath(date) : t === 1 ? genPattern(date) : genCrossword(date);
}

function calcScore(t, h, d) {
  return Math.round((100 + Math.max(0, 120 - t) * 0.5 - h * 15) * ([1, 1, 1.5, 2, 2.5][d] ?? 1));
}

async function calcStreak() {
  const all = await store.getAll(), map = {};
  all.forEach(a => { if (a?.solved) map[a.date] = true; });
  let s = 0, cur = djs();
  while (map[cur.format("YYYY-MM-DD")]) { s++; cur = cur.subtract(1, "day"); }
  return s;
}

function getIntensity(e) {
  if (!e?.solved) return 0;
  if (e.score >= 200) return 4;
  if (e.difficulty >= 3) return 3;
  if (e.difficulty >= 2) return 2;
  return 1;
}

/* ── useTimer ── */
function useTimer(running) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setSecs(s => s + 1), 1000); }
    else { clearInterval(ref.current); }
    return () => clearInterval(ref.current);
  }, [running]);
  const reset = useCallback(() => setSecs(0), []);
  return [secs, reset];
}

/* ── SyncBadge ── */
function SyncBadge({ state }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      padding: "0.4rem 1rem", background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 20, fontSize: "0.78rem", color: "var(--txt-muted)",
      width: "fit-content", margin: "0.5rem auto", animation: "fadeIn 0.3s both",
    }}>
      {state === "syncing"
        ? <><div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--a)", animation: "pulse 1s infinite" }} /> Syncing...</>
        : <><div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ok)" }} /> Synced ✓</>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DAILY PUZZLE COMPONENTS
═══════════════════════════════════════════════════════════════════ */
function ChoiceGrid({ choices, answer, onCorrect }) {
  const [sel, setSel] = useState(null);
  const [wrongSel, setWrongSel] = useState(null);

  const pick = (c) => {
    if (sel === answer) return; // already answered
    setSel(c);
    if (c === answer) {
      setTimeout(onCorrect, 500);
    } else {
      setWrongSel(c);
      setTimeout(() => { setWrongSel(null); setSel(null); }, 650);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", maxWidth: 340, margin: "1rem auto" }}>
      {choices.map(c => {
        const isRight  = sel === c && c === answer;
        const isWrong  = wrongSel === c;
        return (
          <button key={c} onClick={() => pick(c)} style={{
            padding: "1rem", fontSize: "1.35rem", fontWeight: 800, borderRadius: 12,
            border: `2px solid ${isRight ? "var(--ok)" : isWrong ? "var(--err)" : "var(--border2)"}`,
            background: isRight ? "var(--ok-dim)" : isWrong ? "var(--err-dim)" : "var(--surface2)",
            color: isRight ? "var(--ok)" : isWrong ? "var(--err)" : "var(--a)",
            cursor: "pointer", transition: "all 0.14s", fontFamily: "'JetBrains Mono',monospace",
            animation: isWrong ? "shake 0.5s" : isRight ? "winPop 0.3s" : "none",
          }}>{c}</button>
        );
      })}
    </div>
  );
}

function MathPuzzleView({ puzzle, onSolve, hintsUsed, onHint }) {
  return (
    <div style={{ textAlign: "center" }}>
      <SectionLabel>Math Challenge</SectionLabel>
      <div style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--a)", margin: "0.8rem 0", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-1px" }}>
        {puzzle.question}
      </div>
      <ChoiceGrid choices={puzzle.choices} answer={puzzle.answer} onCorrect={onSolve} />
      {hintsUsed < 1 && (
        <button onClick={onHint} style={{ marginTop: "0.5rem", background: "var(--a-dim)", border: "1px solid var(--a)", borderRadius: 8, padding: "0.35rem 0.9rem", color: "var(--a)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
          💡 Hint (1 left)
        </button>
      )}
    </div>
  );
}

function PatternPuzzleView({ puzzle, onSolve, hintsUsed, onHint, showHint }) {
  return (
    <div style={{ textAlign: "center" }}>
      <SectionLabel>Pattern Recognition</SectionLabel>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", margin: "1rem 0", flexWrap: "wrap" }}>
        {puzzle.sequence.map((n, i) => (
          <div key={i} style={{
            width: 54, height: 54, borderRadius: 10,
            background: "var(--surface2)", border: "2px solid var(--border2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", fontWeight: 800, color: "var(--a)",
            fontFamily: "'JetBrains Mono',monospace",
            animation: `fadeUp 0.3s ${i * 0.07}s both`,
          }}>{n}</div>
        ))}
        <div style={{ width: 54, height: 54, borderRadius: 10, border: "2.5px dashed var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "var(--txt-muted)" }}>?</div>
      </div>
      {showHint && (
        <div style={{ background: "var(--a-dim)", border: "1px solid var(--a)", borderRadius: 8, padding: "0.4rem 0.9rem", marginBottom: "0.8rem", fontSize: "0.82rem", color: "var(--a)", display: "inline-block" }}>
          💡 {puzzle.hint}
        </div>
      )}
      <ChoiceGrid choices={puzzle.choices} answer={puzzle.answer} onCorrect={onSolve} />
      {hintsUsed < 1 && (
        <button onClick={onHint} style={{ marginTop: "0.3rem", background: "var(--a-dim)", border: "1px solid var(--a)", borderRadius: 8, padding: "0.35rem 0.9rem", color: "var(--a)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
          💡 Hint −10 pts
        </button>
      )}
    </div>
  );
}

function CrosswordView({ puzzle, onSolve }) {
  const [inputs, setInputs] = useState(() => puzzle.blanks.slice());
  const [err, setErr] = useState(false);
  const refs = useRef([]);

  const upd = (i, v) => {
    const val = v.toUpperCase().slice(-1);
    const next = [...inputs]; next[i] = val;
    setInputs(next); setErr(false);
    if (val && i < puzzle.word.length - 1) refs.current[i + 1]?.focus();
    if (next.join("") === puzzle.word) setTimeout(onSolve, 300);
  };

  const check = () => {
    if (inputs.join("") !== puzzle.word) {
      setErr(true);
      setTimeout(() => setErr(false), 700);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <SectionLabel>Word Puzzle</SectionLabel>
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "0.7rem 1.2rem", marginBottom: "1.2rem", display: "inline-block" }}>
        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--txt-muted)", marginBottom: "0.2rem" }}>Clue</div>
        <div style={{ fontWeight: 700, color: "var(--txt)", fontSize: "1rem" }}>{puzzle.clue}</div>
      </div>
      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", margin: "0.8rem 0", flexWrap: "wrap" }}>
        {puzzle.word.split("").map((_, i) => (
          <div key={i} style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 0, right: 0, textAlign: "center", fontSize: "0.62rem", color: "var(--txt-muted)", fontWeight: 700 }}>{i + 1}</div>
            <input
              ref={el => refs.current[i] = el}
              maxLength={1}
              value={inputs[i]}
              disabled={i === puzzle.revealed}
              onChange={e => upd(i, e.target.value)}
              onKeyDown={e => { if (e.key === "Backspace" && !inputs[i] && i > 0) refs.current[i - 1]?.focus(); }}
              style={{
                width: 44, height: 48, textAlign: "center", fontSize: "1.3rem", fontWeight: 800,
                borderRadius: 9,
                border: `2px solid ${err ? "var(--err)" : i === puzzle.revealed ? "var(--a)" : "var(--border2)"}`,
                background: i === puzzle.revealed ? "var(--a-dim)" : "var(--surface2)",
                color: i === puzzle.revealed ? "var(--a)" : "var(--txt)",
                outline: "none", cursor: i === puzzle.revealed ? "default" : "text",
                transition: "border-color 0.2s",
                animation: err ? "shake 0.5s" : "none",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            />
          </div>
        ))}
      </div>
      <Btn onClick={check} style={{ marginTop: "0.8rem" }}>Check Answer</Btn>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HEATMAP
═══════════════════════════════════════════════════════════════════ */
function Heatmap({ activity }) {
  const [tooltip, setTooltip] = useState(null);

  const { weeks } = useMemo(() => {
    const now = djs(), start = now.startOf("year");
    const data = [];
    for (let i = 0; i < 365; i++) {
      const d = start.add(i, "day"), key = d.format("YYYY-MM-DD");
      data.push({ date: key, entry: activity[key] ?? null, isToday: now.isSame(d, "day"), isFuture: d._d > now._d });
    }
    const firstDow = start._d.getDay();
    const padded = [...Array(firstDow).fill(null), ...data];
    const wks = [];
    for (let i = 0; i < padded.length; i += 7) wks.push(padded.slice(i, i + 7));
    return { weeks: wks };
  }, [activity]);

  const colors = { 0: "var(--heat-0)", 1: "var(--heat-1)", 2: "var(--heat-2)", 3: "var(--heat-3)", 4: "var(--heat-4)" };

  return (
    <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
      <div style={{ display: "flex", gap: 3, minWidth: "fit-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((cell, di) => {
              if (!cell) return <div key={di} style={{ width: 12, height: 12 }} />;
              const intensity = cell.isFuture ? -1 : getIntensity(cell.entry);
              return (
                <div
                  key={di}
                  onMouseEnter={e => setTooltip({ cell, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: 12, height: 12, borderRadius: 3, cursor: "pointer",
                    background: cell.isFuture ? "transparent" : (colors[intensity] ?? colors[0]),
                    border: cell.isToday ? "2px solid var(--a)" : cell.isFuture ? "1px dashed var(--border)" : "none",
                    animation: cell.isToday ? "todayPulse 2s infinite" : "none",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {tooltip && (
        <div style={{
          position: "fixed", top: tooltip.y - 98, left: tooltip.x - 80,
          background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10,
          padding: "0.6rem 0.85rem", zIndex: 9999, fontSize: "0.78rem", minWidth: 148,
          boxShadow: "0 8px 28px rgba(0,0,0,0.5)", pointerEvents: "none",
          animation: "winPop 0.15s both",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 3, color: "var(--txt)" }}>{tooltip.cell.date}</div>
          {tooltip.cell.entry
            ? <><div style={{ color: "var(--ok)" }}>✅ Solved</div><div style={{ color: "var(--txt-muted)" }}>Score: {tooltip.cell.entry.score}</div><div style={{ color: "var(--txt-muted)" }}>Time: {tooltip.cell.entry.timeTaken}s</div></>
            : tooltip.cell.isFuture
              ? <div style={{ color: "var(--txt-muted)" }}>Upcoming</div>
              : <div style={{ color: "var(--txt-muted)" }}>Not played</div>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME 1 — NUMBER GRID (4×4)
═══════════════════════════════════════════════════════════════════ */
function genGrid(difficulty = "medium") {
  const base = [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]];
  const shuf = a => { const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
  let g = base.map(r => [...r]);
  const perm = shuf([1,2,3,4]); g = g.map(r => r.map(v => perm[v-1]));
  const ro = [...shuf([0,1]), ...shuf([2,3])]; g = ro.map(r => g[r]);
  const co = [...shuf([0,1]), ...shuf([2,3])]; g = g.map(r => co.map(c => r[c]));
  const solution = g.map(r => [...r]);
  const remove = difficulty === "easy" ? 6 : difficulty === "medium" ? 9 : 12;
  const cells = shuf(Array.from({ length: 16 }, (_, i) => i));
  const puzzle = g.map(r => [...r]);
  for (let i = 0; i < remove; i++) { const idx = cells[i]; puzzle[Math.floor(idx/4)][idx%4] = 0; }
  return { puzzle, solution };
}

function validPlacement(g, r, c, v) {
  if (g[r].some((x, ci) => ci !== c && x === v)) return false;
  if (g.some((row, ri) => ri !== r && row[c] === v)) return false;
  const br = Math.floor(r/2)*2, bc = Math.floor(c/2)*2;
  for (let rr = br; rr < br+2; rr++) for (let cc = bc; cc < bc+2; cc++)
    if ((rr !== r || cc !== c) && g[rr][cc] === v) return false;
  return true;
}

function NumberGridGame({ onBack }) {
  const [diff, setDiff] = useState(null);
  const [gs, setGs] = useState(null);
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  const [wrongCells, setWrongCells] = useState([]);
  const [errFlash, setErrFlash] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!timerOn) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  const startGame = (d) => {
    setDiff(d);
    const { puzzle, solution } = genGrid(d);
    setGs({ puzzle, solution, filled: puzzle.map(r => [...r]), selected: null });
    setTimerOn(true); setWon(false); setElapsed(0); setWrongCells([]);
  };

  const selectCell = (r, c) => {
    if (!gs || gs.puzzle[r][c] !== 0) return;
    setGs(prev => ({ ...prev, selected: [r, c] }));
  };

  const inputNum = (v) => {
    if (!gs?.selected) return;
    const [r, c] = gs.selected;
    if (gs.puzzle[r][c] !== 0) return;
    const nf = gs.filled.map(row => [...row]); nf[r][c] = v;
    const valid = v === 0 || validPlacement(nf, r, c, v);
    if (!valid) {
      setWrongCells(w => [...w.filter(x => !(x[0]===r && x[1]===c)), [r, c]]);
      setErrFlash(`${r}-${c}`);
      setTimeout(() => setErrFlash(null), 600);
    } else {
      setWrongCells(w => w.filter(x => !(x[0]===r && x[1]===c)));
    }
    setGs(prev => ({ ...prev, filled: nf }));
    // Check win using solution from current gs snapshot
    if (nf.every((row, ri) => row.every((val, ci) => val === gs.solution[ri][ci]))) {
      setTimerOn(false); setWon(true);
    }
  };

  const hlType = (r, c) => {
    if (!gs?.selected) return "none";
    const [sr, sc] = gs.selected;
    if (r === sr && c === sc) return "sel";
    if (r === sr || c === sc) return "line";
    if (Math.floor(r/2) === Math.floor(sr/2) && Math.floor(c/2) === Math.floor(sc/2)) return "box";
    if (gs.filled[r][c] !== 0 && gs.filled[r][c] === gs.filled[sr][sc]) return "same";
    return "none";
  };

  if (!diff) return (
    <div style={{ padding: "1.5rem 1.2rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
        <Btn variant="ghost" onClick={onBack} style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>← Back</Btn>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--a)" }}>🔢 Number Grid</div>
          <div style={{ fontSize: "0.75rem", color: "var(--txt-muted)" }}>Fill every row, column & 2×2 box with 1–4</div>
        </div>
      </div>
      <Card>
        <GlowDot color="var(--a)" />
        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: "0.5rem", display: "inline-block", animation: "float 3s ease-in-out infinite" }}>🔢</div>
          <p style={{ color: "var(--txt-muted)", fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 1.5rem" }}>
            No repeats in any row, column, or 2×2 box. Pure logic — no guessing required.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", maxWidth: 320, margin: "0 auto" }}>
            {[["Easy", "6 blanks", "var(--ok)"], ["Medium", "9 blanks", "var(--a)"], ["Hard", "12 blanks", "var(--b)"]].map(([d, s, col]) => (
              <button key={d} onClick={() => startGame(d.toLowerCase())} style={{
                padding: "1.1rem 0.5rem", borderRadius: 12,
                background: "var(--surface2)", border: `2px solid ${col}`,
                color: col, cursor: "pointer", transition: "all 0.14s", fontFamily: "'Syne',sans-serif",
              }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{d}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--txt-muted)", marginTop: 3 }}>{s}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ padding: "1rem 1.2rem 5rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <Btn variant="ghost" onClick={() => { setDiff(null); setTimerOn(false); setWon(false); }} style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>← Back</Btn>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "var(--a)", fontSize: "1rem" }}>{fmtTime(elapsed)}</span>
          <Badge color="var(--a)">{diff}</Badge>
        </div>
      </div>

      {won && <Confetti />}
      {won && (
        <div style={{ animation: "winPop 0.4s cubic-bezier(.34,1.56,.64,1) both", marginBottom: "1rem" }}>
          <Card glowColor="var(--ok-border)" style={{ textAlign: "center" }}>
            <GlowDot color="var(--ok)" />
            <div style={{ fontSize: "2.5rem" }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--ok)", margin: "0.3rem 0" }}>Solved!</div>
            <div style={{ color: "var(--txt-muted)", fontSize: "0.85rem" }}>Time: {fmtTime(elapsed)}</div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
              <Btn onClick={() => startGame(diff)}>Play Again</Btn>
              <Btn variant="ghost" onClick={() => setDiff(null)}>Change Level</Btn>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <GlowDot color="var(--a)" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3, background: "var(--border2)", padding: 4, borderRadius: 14, border: "2px solid var(--border2)" }}>
            {gs.filled.map((row, r) => row.map((val, c) => {
              const h = hlType(r, c);
              const given = gs.puzzle[r][c] !== 0;
              const wrong = wrongCells.some(x => x[0] === r && x[1] === c) && val !== 0;
              const flash = errFlash === `${r}-${c}`;
              const bg = wrong ? "var(--err-dim)"
                : h === "sel"  ? "var(--a-dim)"
                : h === "line" || h === "box" ? "rgba(232,255,71,0.04)"
                : h === "same" ? "rgba(232,255,71,0.08)"
                : "var(--surface)";
              // thicker inner borders between 2×2 boxes
              const extraStyle = {};
              if (c === 1) extraStyle.borderRight  = "3px solid var(--border2)";
              if (r === 1) extraStyle.borderBottom = "3px solid var(--border2)";
              return (
                <div key={`${r}-${c}`} onClick={() => selectCell(r, c)} style={{
                  width: 62, height: 62, borderRadius: 9, background: bg,
                  border: `2px solid ${h === "sel" ? "var(--a)" : wrong ? "var(--err)" : "transparent"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: given ? "default" : "pointer", transition: "background 0.1s",
                  animation: flash ? "shake 0.4s" : "none",
                  ...extraStyle,
                }}>
                  {val !== 0 && (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.5rem", fontWeight: 700, color: wrong ? "var(--err)" : given ? "var(--txt)" : "var(--a)" }}>
                      {val}
                    </span>
                  )}
                </div>
              );
            }))}
          </div>
          {/* Numpad */}
          <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => inputNum(n)} style={{ width: 54, height: 50, borderRadius: 10, background: "var(--surface2)", border: "1.5px solid var(--border2)", color: "var(--a)", fontFamily: "'JetBrains Mono',monospace", fontSize: "1.25rem", fontWeight: 700, cursor: "pointer" }}>{n}</button>
            ))}
            <button onClick={() => inputNum(0)} style={{ width: 54, height: 50, borderRadius: 10, background: "var(--b-dim)", border: "1.5px solid var(--b-border)", color: "var(--b)", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>✕</button>
          </div>
          <p style={{ color: "var(--txt-muted)", fontSize: "0.73rem", marginTop: "0.2rem" }}>Tap a cell, then tap a number</p>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME 2 — WORD SCRAMBLE
═══════════════════════════════════════════════════════════════════ */
const WORDS = [
  { word: "SAFARI",  hint: "African wildlife adventure" },
  { word: "CIPHER",  hint: "Encoded secret message" },
  { word: "QUARTZ",  hint: "Common crystal mineral" },
  { word: "VORTEX",  hint: "Spinning whirlpool" },
  { word: "JUNGLE",  hint: "Dense tropical forest" },
  { word: "PLASMA",  hint: "Fourth state of matter" },
  { word: "COBALT",  hint: "Vivid blue metallic element" },
  { word: "FRACTAL", hint: "Self-similar geometric pattern" },
  { word: "NEBULA",  hint: "Cloud of gas in space" },
  { word: "SPHINX",  hint: "Ancient Egyptian monument" },
  { word: "TUNDRA",  hint: "Freezing treeless biome" },
  { word: "ENZYME",  hint: "Biological catalyst" },
  { word: "PRISM",   hint: "Splits white light into rainbow" },
  { word: "GEYSER",  hint: "Hot spring that erupts" },
  { word: "ZENITH",  hint: "Highest point overhead" },
  { word: "MANTIS",  hint: "Praying insect predator" },
  { word: "OBELISK", hint: "Tall four-sided monument" },
  { word: "CREVICE", hint: "Narrow crack in rock" },
];

function makeScramble(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("") === word ? makeScramble(word) : arr;
}

function WordScrambleGame({ onBack }) {
  const [mode, setMode]           = useState("menu");
  const [wo, setWo]               = useState(null);
  const [letters, setLetters]     = useState([]);
  const [answer, setAnswer]       = useState([]);
  const [shaking, setShaking]     = useState(false);
  const [hintUsed, setHintUsed]   = useState(false);
  const [showHint, setShowHint]   = useState(false);
  const [streak, setStreak]       = useState(0);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft]   = useState(60);
  const [timerOn, setTimerOn]     = useState(false);
  const [flashOk, setFlashOk]     = useState(false);
  const [roundKey, setRoundKey]   = useState(0); // used to re-trigger timer effect

  const timerRef    = useRef(null);
  const timeLimitRef = useRef(60);  // stable ref for use inside closures
  const streakRef   = useRef(0);    // stable ref to avoid stale streak in selLetter

  // Keep refs in sync
  useEffect(() => { timeLimitRef.current = timeLimit; }, [timeLimit]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  const loadNextWord = useCallback(() => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    const sc = makeScramble(w.word);
    setWo(w);
    setLetters(sc.map((char, id) => ({ char, id, used: false })));
    setAnswer([]);
    setHintUsed(false);
    setShowHint(false);
    setFlashOk(false);
    setRoundKey(k => k + 1);
  }, []);

  const startGame = (lim) => {
    setTimeLimit(lim);
    timeLimitRef.current = lim;
    setStreak(0);
    streakRef.current = 0;
    setTimeLeft(lim);
    setMode("playing");
    setTimerOn(true);
    loadNextWord();
  };

  // Timer countdown — re-runs when roundKey changes (new word)
  useEffect(() => {
    if (!timerOn || mode !== "playing") return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimerOn(false);
          setMode("lose");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerOn, mode, roundKey]);

  const selectLetter = (l) => {
    if (l.used || !wo) return;
    const nl = letters.map(x => x.id === l.id ? { ...x, used: true } : x);
    const na = [...answer, { char: l.char, id: l.id }];
    setLetters(nl);
    setAnswer(na);

    if (na.length === wo.word.length) {
      const guess = na.map(a => a.char).join("");
      if (guess === wo.word) {
        // Correct!
        clearInterval(timerRef.current);
        setTimerOn(false);
        setFlashOk(true);
        const bonus = hintUsed ? 5 : 10;
        setTimeLeft(t => Math.min(t + bonus, timeLimitRef.current));
        setStreak(s => s + 1);
        setTimeout(() => {
          setTimerOn(true);
          loadNextWord();
        }, 900);
      } else {
        // Wrong
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setAnswer([]);
          setLetters(ls => ls.map(x => ({ ...x, used: false })));
        }, 650);
      }
    }
  };

  const removeLast = () => {
    if (!answer.length) return;
    const last = answer[answer.length - 1];
    setLetters(ls => ls.map(l => l.id === last.id ? { ...l, used: false } : l));
    setAnswer(a => a.slice(0, -1));
  };

  const clearAll = () => {
    setAnswer([]);
    setLetters(ls => ls.map(l => ({ ...l, used: false })));
  };

  const useHintFn = () => {
    if (hintUsed) return;
    setHintUsed(true);
    setShowHint(true);
    setTimeLeft(t => Math.max(t - 8, 1));
  };

  const pct = timeLeft / timeLimit;
  const tColor = pct > 0.5 ? "var(--ok)" : pct > 0.25 ? "var(--a)" : "var(--err)";

  if (mode === "menu") return (
    <div style={{ padding: "1.5rem 1.2rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
        <Btn variant="ghost" onClick={onBack} style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>← Back</Btn>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--b)" }}>🔤 Word Scramble</div>
          <div style={{ fontSize: "0.75rem", color: "var(--txt-muted)" }}>Unscramble words before time runs out</div>
        </div>
      </div>
      <Card>
        <GlowDot color="var(--b)" />
        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: "0.5rem", display: "inline-block", animation: "float 3s ease-in-out infinite" }}>🔤</div>
          <p style={{ color: "var(--txt-muted)", fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 290, margin: "0 auto 1.5rem" }}>
            Tap letters to spell the word. Earn bonus time for each correct answer. Use hints wisely — they cost 8 seconds!
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", maxWidth: 320, margin: "0 auto" }}>
            {[["🐢 Chill", "90s", 90], ["⚡ Normal", "60s", 60], ["🔥 Rush", "40s", 40]].map(([label, t, lim]) => (
              <button key={t} onClick={() => startGame(lim)} style={{
                padding: "1.1rem 0.4rem", borderRadius: 12,
                background: "var(--surface2)", border: "2px solid var(--b-border)",
                color: "var(--b)", cursor: "pointer", fontFamily: "'Syne',sans-serif", transition: "all 0.14s",
              }}>
                <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>{label}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--txt-muted)", marginTop: 3 }}>{t}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  if (mode === "lose") return (
    <div style={{ padding: "1.5rem 1.2rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <Btn variant="ghost" onClick={() => { setMode("menu"); }} style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>← Back</Btn>
      </div>
      <div style={{ animation: "winPop 0.4s cubic-bezier(.34,1.56,.64,1) both" }}>
        <Card>
          <GlowDot color="var(--err)" />
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⏰</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem", color: "var(--err)" }}>Time's Up!</div>
            <div style={{ color: "var(--txt-muted)", margin: "0.5rem 0 0.2rem", fontSize: "0.85rem" }}>The word was</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--b)", letterSpacing: "4px", fontFamily: "'JetBrains Mono',monospace" }}>{wo?.word}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "0.75rem 1.5rem", margin: "1.2rem 0" }}>
              <span style={{ fontSize: "1.5rem" }}>🔥</span>
              <div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--a)", fontFamily: "'JetBrains Mono',monospace" }}>{streak}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--txt-muted)" }}>words solved</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
              <Btn onClick={() => startGame(timeLimit)}>Play Again</Btn>
              <Btn variant="ghost" onClick={() => setMode("menu")}>Menu</Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // ── Playing ──
  return (
    <div style={{ padding: "1rem 1.2rem 5rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <Btn variant="ghost" onClick={() => { clearInterval(timerRef.current); setMode("menu"); }} style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>← Back</Btn>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--txt-muted)" }}>Streak</span>
          <Badge color="var(--b)" bg="var(--b-dim)" borderColor="var(--b-border)">{streak} 🔥</Badge>
        </div>
      </div>

      <Card>
        <GlowDot color="var(--b)" />
        {/* Timer bar */}
        <div style={{ marginBottom: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", fontSize: "0.75rem", color: "var(--txt-muted)" }}>
            <span>Time remaining</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: tColor, animation: timeLeft <= 10 ? "timerWarn 0.8s infinite" : "none" }}>{timeLeft}s</span>
          </div>
          <div style={{ height: 5, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: tColor, width: `${pct * 100}%`, transition: "width 1s linear, background 0.3s" }} />
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <div style={{ background: "var(--b-dim)", border: "1px solid var(--b-border)", borderRadius: 9, padding: "0.45rem 1rem", marginBottom: "1rem", fontSize: "0.82rem", color: "var(--b)", textAlign: "center", animation: "fadeUp 0.3s both" }}>
            💡 {wo.hint}
          </div>
        )}

        {/* Answer slots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
          {Array.from({ length: wo?.word.length ?? 0 }).map((_, i) => {
            const a = answer[i];
            return (
              <div key={i} style={{
                width: 44, height: 48, borderRadius: 9,
                border: `2px solid ${flashOk ? "var(--ok)" : a ? "var(--b-border)" : "var(--border2)"}`,
                background: flashOk ? "var(--ok-dim)" : a ? "var(--b-dim)" : "var(--surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.14s",
                animation: a ? "letterPop 0.25s cubic-bezier(.34,1.56,.64,1)" : "none",
              }}>
                {a && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "1.2rem", fontWeight: 800, color: flashOk ? "var(--ok)" : "var(--b)" }}>{a.char}</span>}
              </div>
            );
          })}
        </div>

        {/* Scrambled letters */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.1rem", animation: shaking ? "shake 0.5s" : "none" }}>
          {letters.map(l => (
            <button key={l.id} onClick={() => selectLetter(l)} disabled={l.used} style={{
              width: 48, height: 50, borderRadius: 9,
              background: l.used ? "var(--surface)" : "var(--surface2)",
              border: `2px solid ${l.used ? "var(--border)" : "var(--a)"}`,
              color: l.used ? "var(--txt-dim)" : "var(--a)",
              fontFamily: "'JetBrains Mono',monospace", fontSize: "1.25rem", fontWeight: 800,
              cursor: l.used ? "default" : "pointer",
              transition: "all 0.12s", opacity: l.used ? 0.25 : 1,
              transform: l.used ? "scale(0.88)" : "scale(1)",
            }}>{l.char}</button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="ghost" onClick={removeLast} disabled={!answer.length} style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>⌫ Back</Btn>
          <Btn variant="ghost" onClick={clearAll}   disabled={!answer.length} style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>✕ Clear</Btn>
          {!hintUsed && <Btn variant="pink" onClick={useHintFn} style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>💡 Hint −8s</Btn>}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPLETION CARD
═══════════════════════════════════════════════════════════════════ */
function CompletionCard({ data, syncing, synced, onHome, celebrate, onDismiss }) {
  return (
    <div style={{ textAlign: "center", animation: "winPop 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
      {celebrate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onDismiss}>
          <Card glowColor="var(--a)" style={{ padding: "2.5rem", textAlign: "center", maxWidth: 300, margin: "1rem" }}>
            <GlowDot color="var(--a)" />
            <div style={{ fontSize: "4rem", animation: "bounce 0.5s cubic-bezier(.34,1.56,.64,1) infinite alternate" }}>🔥</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem", color: "var(--a)", margin: "0.4rem 0" }}>{data.streak}-Day Streak!</div>
            <div style={{ color: "var(--txt-muted)", fontSize: "0.85rem", marginBottom: "1.2rem" }}>Milestone reached! Keep it up!</div>
            <Btn full onClick={onDismiss}>🎉 Awesome!</Btn>
          </Card>
        </div>
      )}
      <Confetti />
      <div style={{ fontSize: "4rem", animation: "bounce 0.4s cubic-bezier(.34,1.56,.64,1)" }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: "1.8rem", color: "var(--a)", margin: "0.4rem 0" }}>Puzzle Solved!</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", margin: "1.2rem 0" }}>
        {[["🏆", "Score", data.score], ["⏱", "Time", `${data.time}s`], ["🔥", "Streak", data.streak]].map(([icon, label, val]) => (
          <Card key={label} style={{ padding: "0.9rem 0.4rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem" }}>{icon}</div>
            <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--a)", fontFamily: "'JetBrains Mono',monospace" }}>{val}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--txt-muted)", marginTop: 2 }}>{label}</div>
          </Card>
        ))}
      </div>
      {syncing && <SyncBadge state="syncing" />}
      {synced  && <SyncBadge state="synced" />}
      <Btn full onClick={onHome} style={{ marginTop: "0.8rem" }}>← Back to Home</Btn>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE SCREENS
═══════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "40px 40px", opacity: 0.35, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(232,255,71,0.08) 0%,transparent 60%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ animation: "float 3s ease-in-out infinite", fontSize: "4rem", marginBottom: "0.6rem" }}>🧩</div>
        <h1 className="fadeUp0" style={{ fontWeight: 800, fontSize: "3rem", lineHeight: 1, letterSpacing: "-2px", marginBottom: "0.4rem", background: "linear-gradient(135deg,var(--a) 0%,var(--b) 55%,var(--c) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          PuzzleStrike
        </h1>
        <p className="fadeUp1" style={{ color: "var(--txt-muted)", marginBottom: "2.5rem", fontSize: "0.92rem" }}>
          Daily puzzles · Build your streak · Master your mind
        </p>
        <div className="fadeUp2" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button onClick={() => onLogin({ name: "Player", type: "google" })} style={{
            padding: "0.85rem 1.5rem", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
            background: "var(--a)", color: "#08090d", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
            boxShadow: "0 4px 24px var(--a-glow)", fontFamily: "'Syne',sans-serif", border: "none", width: "100%",
          }}>
            <span style={{ fontSize: "1.15rem", fontWeight: 900 }}>G</span> Continue with Google
          </button>
          <button onClick={() => onLogin({ name: "Guest", type: "guest" })} style={{
            padding: "0.85rem 1.5rem", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
            background: "var(--surface2)", color: "var(--txt)", border: "1.5px solid var(--border2)",
            fontFamily: "'Syne',sans-serif", width: "100%",
          }}>
            👤 Play as Guest
          </button>
        </div>
        <p style={{ color: "var(--txt-muted)", fontSize: "0.72rem", marginTop: "1.5rem" }}>Progress saved offline · Syncs when connected</p>
      </div>
    </div>
  );
}

function HomeScreen({ user, streak, activity, onPlay, syncing, synced, alreadyDone }) {
  const today = dateKey();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = djs().subtract(6 - i, "day");
    return { key: d.format("YYYY-MM-DD"), isToday: i === 6 };
  });
  const solved = Object.values(activity).filter(a => a?.solved);
  const total  = solved.length;
  const avg    = total ? Math.round(solved.reduce((s, e) => s + e.score, 0) / total) : 0;

  return (
    <div style={{ padding: "1.2rem 1.2rem 5rem", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 200, background: "radial-gradient(ellipse 80% 100% at 50% -20%,rgba(232,255,71,0.06) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Greeting */}
        <div className="fadeUp0" style={{ marginBottom: "1.2rem", paddingTop: "0.5rem" }}>
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2.5px", color: "var(--txt-muted)", marginBottom: "0.2rem" }}>
            Good {new Date().getHours() < 12 ? "Morning" : "Evening"}
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--txt)" }}>{user?.name} 👋</div>
        </div>

        {/* Streak hero */}
        <div className="fadeUp1" style={{ marginBottom: "1rem" }}>
          <Card glowColor="rgba(232,255,71,0.25)" style={{ background: "linear-gradient(135deg,rgba(232,255,71,0.06) 0%,var(--surface) 60%)" }}>
            <GlowDot color="var(--a)" top={-50} right={-50} size={160} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <SectionLabel>Current Streak</SectionLabel>
                <div style={{ fontWeight: 800, fontSize: "2.8rem", color: "var(--a)", lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>
                  {streak} <span style={{ fontSize: "2rem" }}>🔥</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--txt-muted)", marginTop: "0.3rem" }}>
                  {streak === 0 ? "Start your streak today!" : streak < 7 ? "Keep going!" : streak < 30 ? "On fire! 🔥" : "Legendary! 🏆"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--txt-muted)", marginBottom: "0.3rem", textAlign: "right" }}>Last 7 Days</div>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  {last7.map(({ key, isToday }) => {
                    const done = !!activity[key]?.solved;
                    return (
                      <div key={key} style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: done ? "var(--a)" : "var(--surface2)",
                        border: `2px solid ${isToday ? "var(--a)" : done ? "var(--a)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 700, color: done ? "#08090d" : "var(--txt-muted)",
                      }}>{done ? "✓" : "·"}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's puzzle */}
        <div className="fadeUp2" style={{ marginBottom: "1rem" }}>
          <Card>
            <GlowDot color="var(--b)" top={-30} right={-30} size={100} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <SectionLabel>Today's Puzzle</SectionLabel>
                <div style={{ fontWeight: 700, color: "var(--txt)", fontSize: "1rem" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>
              <Badge color={alreadyDone ? "var(--ok)" : "var(--b)"} bg={alreadyDone ? "var(--ok-dim)" : "var(--b-dim)"} borderColor={alreadyDone ? "var(--ok-border)" : "var(--b-border)"}>
                {alreadyDone ? "✅ Done" : "⏳ Pending"}
              </Badge>
            </div>
            {alreadyDone ? (
              <div style={{ textAlign: "center", padding: "0.8rem 0" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>🎉</div>
                <div style={{ fontWeight: 700, color: "var(--txt)", marginBottom: "0.2rem" }}>Puzzle complete!</div>
                <div style={{ fontSize: "0.82rem", color: "var(--txt-muted)" }}>Score: {activity[today]?.score} · Come back tomorrow!</div>
              </div>
            ) : (
              <Btn full onClick={onPlay} style={{ fontSize: "1rem", padding: "0.85rem" }}>🎯 Play Today's Puzzle</Btn>
            )}
          </Card>
        </div>

        {/* Quick stats */}
        <div className="fadeUp3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {[["Total Solved", "🧩", total], ["Avg Score", "⭐", avg]].map(([label, icon, val]) => (
            <Card key={label} style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "1.4rem" }}>{icon}</div>
              <div style={{ fontWeight: 800, fontSize: "1.6rem", color: "var(--a)", fontFamily: "'JetBrains Mono',monospace" }}>{val}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--txt-muted)", marginTop: 2 }}>{label}</div>
            </Card>
          ))}
        </div>

        {syncing && <SyncBadge state="syncing" />}
        {synced  && <SyncBadge state="synced" />}
      </div>
    </div>
  );
}

function PuzzleScreen({ puzzle, phase, onSolve, onBack, elapsedSecs, hintsUsed, setHintsUsed, showHint, setShowHint, completionData, syncing, synced, celebrate, onDismissCelebrate }) {
  const typeLabel = puzzle?.type === "math" ? "🔢 Math" : puzzle?.type === "pattern" ? "🔷 Pattern" : "🔤 Word";
  return (
    <div style={{ padding: "1rem 1.2rem 5rem", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <Btn variant="ghost" onClick={onBack} style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>← Back</Btn>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          {phase === "playing" && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "var(--a)", fontSize: "1.05rem" }}>{fmtTime(elapsedSecs)}</span>
          )}
          {puzzle && <Badge color="var(--a)">{typeLabel}</Badge>}
        </div>
      </div>

      {phase === "complete" && completionData ? (
        <CompletionCard data={completionData} syncing={syncing} synced={synced} onHome={onBack} celebrate={celebrate} onDismiss={onDismissCelebrate} />
      ) : puzzle ? (
        <Card>
          <GlowDot color="var(--a)" />
          <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
            <div style={{ width: 36, height: 3, background: "var(--a)", borderRadius: 2, margin: "0 auto" }} />
          </div>
          {puzzle.type === "math"      && <MathPuzzleView    puzzle={puzzle} onSolve={onSolve} hintsUsed={hintsUsed} onHint={() => { setHintsUsed(h => h + 1); setShowHint(true); }} />}
          {puzzle.type === "pattern"   && <PatternPuzzleView puzzle={puzzle} onSolve={onSolve} hintsUsed={hintsUsed} onHint={() => { setHintsUsed(h => h + 1); setShowHint(true); }} showHint={showHint} />}
          {puzzle.type === "crossword" && <CrosswordView     puzzle={puzzle} onSolve={onSolve} />}
        </Card>
      ) : null}
    </div>
  );
}

function GamesScreen({ onSelectGame }) {
  const games = [
    { id: "numgrid",  icon: "🔢", name: "Number Grid",  accent: "var(--a)", accentBg: "rgba(232,255,71,0.08)", badge: "3 Levels", tags: ["Easy","Medium","Hard"],   desc: "Fill the 4×4 grid so every row, column & 2×2 box contains 1–4. Pure logic — no guessing." },
    { id: "scramble", icon: "🔤", name: "Word Scramble", accent: "var(--b)", accentBg: "rgba(255,92,135,0.08)", badge: "Timed",    tags: ["Chill","Normal","Rush"], desc: "Unscramble words against the clock. Correct words earn bonus time. Hints cost 8 seconds!" },
  ];
  return (
    <div style={{ padding: "1.2rem 1.2rem 5rem", maxWidth: 560, margin: "0 auto" }}>
      <div className="fadeUp0" style={{ marginBottom: "1.4rem", paddingTop: "0.5rem" }}>
        <SectionLabel>Arcade</SectionLabel>
        <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--txt)" }}>🎮 Mini Games</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {games.map((g, idx) => (
          <button key={g.id} onClick={() => onSelectGame(g.id)}
            className={idx === 0 ? "fadeUp1" : "fadeUp2"}
            style={{ width: "100%", padding: "1.3rem", borderRadius: 18, textAlign: "left", cursor: "pointer", background: "var(--surface)", border: "1.5px solid var(--border)", transition: "all 0.16s", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = g.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: g.accent, opacity: 0.07, pointerEvents: "none" }} />
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: g.accentBg, border: `1.5px solid ${g.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", flexShrink: 0 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: g.accent }}>{g.name}</span>
                  <Badge color={g.accent} bg={g.accentBg} borderColor={g.accent}>{g.badge}</Badge>
                </div>
                <p style={{ color: "var(--txt-muted)", fontSize: "0.82rem", lineHeight: 1.55, marginBottom: "0.6rem" }}>{g.desc}</p>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {g.tags.map(t => <Badge key={t} color="var(--txt-muted)" bg="var(--surface2)" borderColor="var(--border2)">{t}</Badge>)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatsScreen({ activity, streak }) {
  const entries = Object.values(activity).filter(a => a?.solved);
  const total   = entries.length;
  const avgScore  = total ? Math.round(entries.reduce((s, e) => s + e.score, 0)     / total) : 0;
  const perfect   = entries.filter(e => e.score >= 200).length;

  return (
    <div style={{ padding: "1.2rem 1.2rem 5rem", maxWidth: 560, margin: "0 auto" }}>
      <div className="fadeUp0" style={{ marginBottom: "1.4rem", paddingTop: "0.5rem" }}>
        <SectionLabel>Performance</SectionLabel>
        <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--txt)" }}>📊 My Stats</div>
      </div>
      <div className="fadeUp1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        {[["🧩","Total Solved",total],["🔥","Best Streak",streak],["⭐","Avg Score",avgScore],["💎","Perfect Runs",perfect]].map(([icon, label, val]) => (
          <Card key={label} style={{ textAlign: "center", padding: "1.1rem 0.5rem" }}>
            <div style={{ fontSize: "1.5rem" }}>{icon}</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem", color: "var(--a)", fontFamily: "'JetBrains Mono',monospace" }}>{val}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--txt-muted)", marginTop: 2 }}>{label}</div>
          </Card>
        ))}
      </div>
      <div className="fadeUp2">
        <Card>
          <GlowDot color="var(--c)" />
          <div style={{ fontWeight: 700, color: "var(--txt)", marginBottom: "1rem", fontSize: "0.95rem" }}>Recent Activity</div>
          {Object.entries(activity)
            .filter(([, e]) => e?.solved)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 8)
            .map(([date, entry], i) => (
              <div key={date} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.82rem", alignItems: "center", animation: `slideIn 0.3s ${i * 0.04}s both` }}>
                <span style={{ color: "var(--txt-muted)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem" }}>{date}</span>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Badge color="var(--a)" bg="var(--a-dim)">{entry.score} pts</Badge>
                  <span style={{ color: "var(--ok)" }}>✅</span>
                </div>
              </div>
            ))}
          {total === 0 && <div style={{ color: "var(--txt-muted)", textAlign: "center", padding: "1.2rem 0", fontSize: "0.85rem" }}>No activity yet — play your first puzzle!</div>}
        </Card>
      </div>
    </div>
  );
}

function HeatmapScreen({ activity, streak }) {
  const solved = Object.values(activity).filter(a => a?.solved).length;
  return (
    <div style={{ padding: "1.2rem 1.2rem 5rem", maxWidth: 900, margin: "0 auto" }}>
      <div className="fadeUp0" style={{ marginBottom: "1.4rem", paddingTop: "0.5rem" }}>
        <SectionLabel>Year Overview</SectionLabel>
        <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--txt)" }}>🗓️ Activity Heatmap</div>
      </div>
      <div className="fadeUp1" style={{ marginBottom: "1rem" }}>
        <Card>
          <GlowDot color="var(--ok)" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--txt)", fontSize: "0.95rem" }}>Daily Activity — {new Date().getFullYear()}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--txt-muted)", marginTop: 2 }}>{solved} puzzles solved this year</div>
            </div>
            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.7rem", color: "var(--txt-muted)" }}>
              <span>Less</span>
              {[0,1,2,3,4].map(i => <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: `var(--heat-${i})` }} />)}
              <span>More</span>
            </div>
          </div>
          <Heatmap activity={activity} />
        </Card>
      </div>
      <div className="fadeUp2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {[["🔥","Current Streak",streak],["📅","Days Solved",solved]].map(([icon, label, val]) => (
          <Card key={label} style={{ textAlign: "center", padding: "1.1rem" }}>
            <div style={{ fontSize: "1.5rem" }}>{icon}</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem", color: "var(--a)", fontFamily: "'JetBrains Mono',monospace" }}>{val}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--txt-muted)", marginTop: 2 }}>{label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [user,    setUser]    = useState(null);
  const [screen,  setScreen]  = useState("home");
  const [puzzle,  setPuzzle]  = useState(null);
  const [phase,   setPhase]   = useState("idle");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint,  setShowHint]  = useState(false);
  const [streak,  setStreak]  = useState(0);
  const [activity, setActivity] = useState({});
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSecs, resetTimer] = useTimer(timerRunning);
  const [completionData, setCompletionData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [synced,  setSynced]  = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const today = dateKey();

  // Load stored activity + streak on mount
  useEffect(() => {
    store.getAll().then(all => {
      const map = {};
      all.forEach(a => { if (a) map[a.date] = a; });
      setActivity(map);
    });
    calcStreak().then(setStreak);
  }, []);

  const loadPuzzle = useCallback(() => {
    const p = genPuzzle(today);
    setPuzzle(p); setPhase("playing"); setTimerRunning(true);
    setHintsUsed(0); setShowHint(false); resetTimer();
    setScreen("puzzle");
  }, [today, resetTimer]);

  const handleSolve = useCallback(async () => {
    setTimerRunning(false);
    const score = calcScore(elapsedSecs, hintsUsed, puzzle.difficulty);
    const entry = { date: today, solved: true, score, timeTaken: elapsedSecs, difficulty: puzzle.difficulty, synced: false };
    await store.set(today, entry);
    const newActivity = { ...activity, [today]: entry };
    setActivity(newActivity);
    const ns = await calcStreak();
    setStreak(ns);
    if (ns > 0 && ns % 7 === 0) setCelebrate(true);
    setCompletionData({ score, time: elapsedSecs, streak: ns });
    setPhase("complete");
    // Simulate backend sync
    setTimeout(() => {
      setSyncing(true);
      setTimeout(async () => {
        await store.set(entry.date, { ...entry, synced: true });
        setSyncing(false); setSynced(true);
        setTimeout(() => setSynced(false), 3000);
      }, 1800);
    }, 1200);
  }, [elapsedSecs, hintsUsed, puzzle, today, activity]);

  const navElement = (
    <>
      <NavBrand />
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}>
          <span>🔥</span>
          <span style={{ fontWeight: 700, color: "var(--a)", fontFamily: "'JetBrains Mono',monospace" }}>{streak}</span>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", color: "#08090d", fontWeight: 800 }}>
          {user?.name?.[0]}
        </div>
      </div>
    </>
  );

  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <LoginScreen onLogin={u => { setUser(u); setScreen("home"); }} />
    </>
  );

  const alreadyDone = !!activity[today]?.solved;

  // Game sub-screens (full page, still share nav + bottom nav)
  if (screen === "numgrid") return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Shell nav={navElement}>
        <NumberGridGame onBack={() => setScreen("games")} />
        <BottomNav screen={screen} setScreen={setScreen} />
      </Shell>
    </>
  );

  if (screen === "scramble") return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Shell nav={navElement}>
        <WordScrambleGame onBack={() => setScreen("games")} />
        <BottomNav screen={screen} setScreen={setScreen} />
      </Shell>
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Shell nav={navElement}>
        {screen === "home"    && <HomeScreen    user={user} streak={streak} activity={activity} onPlay={loadPuzzle} syncing={syncing} synced={synced} alreadyDone={alreadyDone} />}
        {screen === "puzzle"  && <PuzzleScreen  puzzle={puzzle} phase={phase} onSolve={handleSolve} onBack={() => { setScreen("home"); setPhase("idle"); setTimerRunning(false); }} elapsedSecs={elapsedSecs} hintsUsed={hintsUsed} setHintsUsed={setHintsUsed} showHint={showHint} setShowHint={setShowHint} completionData={completionData} syncing={syncing} synced={synced} celebrate={celebrate} onDismissCelebrate={() => setCelebrate(false)} />}
        {screen === "games"   && <GamesScreen   onSelectGame={setScreen} />}
        {screen === "stats"   && <StatsScreen   activity={activity} streak={streak} />}
        {screen === "heatmap" && <HeatmapScreen activity={activity} streak={streak} />}
        <BottomNav screen={screen} setScreen={setScreen} />
      </Shell>
    </>
  );
}
