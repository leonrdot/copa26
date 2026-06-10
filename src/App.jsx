import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";

// ═══════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════
const TEAMS = {
  MEX: { name: "México",          cc: "mx"     },
  RSA: { name: "África do Sul",   cc: "za"     },
  KOR: { name: "Coreia do Sul",   cc: "kr"     },
  CZE: { name: "Tchéquia",        cc: "cz"     },
  CAN: { name: "Canadá",          cc: "ca"     },
  BIH: { name: "Bósnia-Herz.",    cc: "ba"     },
  QAT: { name: "Catar",           cc: "qa"     },
  SUI: { name: "Suíça",           cc: "ch"     },
  BRA: { name: "Brasil",          cc: "br"     },
  MAR: { name: "Marrocos",        cc: "ma"     },
  HAI: { name: "Haiti",           cc: "ht"     },
  SCO: { name: "Escócia",         cc: "gb-sct" },
  USA: { name: "EUA",             cc: "us"     },
  PAR: { name: "Paraguai",        cc: "py"     },
  AUS: { name: "Austrália",       cc: "au"     },
  TUR: { name: "Turquia",         cc: "tr"     },
  GER: { name: "Alemanha",        cc: "de"     },
  CUW: { name: "Curaçao",         cc: "cw"     },
  CIV: { name: "Costa do Marfim", cc: "ci"     },
  ECU: { name: "Equador",         cc: "ec"     },
  NED: { name: "Holanda",         cc: "nl"     },
  JPN: { name: "Japão",           cc: "jp"     },
  SWE: { name: "Suécia",          cc: "se"     },
  TUN: { name: "Tunísia",         cc: "tn"     },
  BEL: { name: "Bélgica",         cc: "be"     },
  EGY: { name: "Egito",           cc: "eg"     },
  IRN: { name: "Irã",             cc: "ir"     },
  NZL: { name: "Nova Zelândia",   cc: "nz"     },
  ESP: { name: "Espanha",         cc: "es"     },
  CPV: { name: "Cabo Verde",      cc: "cv"     },
  KSA: { name: "Arábia Saudita",  cc: "sa"     },
  URU: { name: "Uruguai",         cc: "uy"     },
  FRA: { name: "França",          cc: "fr"     },
  SEN: { name: "Senegal",         cc: "sn"     },
  IRQ: { name: "Iraque",          cc: "iq"     },
  NOR: { name: "Noruega",         cc: "no"     },
  ARG: { name: "Argentina",       cc: "ar"     },
  ALG: { name: "Argélia",         cc: "dz"     },
  AUT: { name: "Áustria",         cc: "at"     },
  JOR: { name: "Jordânia",        cc: "jo"     },
  POR: { name: "Portugal",        cc: "pt"     },
  COD: { name: "Congo RD",        cc: "cd"     },
  UZB: { name: "Uzbequistão",     cc: "uz"     },
  COL: { name: "Colômbia",        cc: "co"     },
  ENG: { name: "Inglaterra",      cc: "gb-eng" },
  CRO: { name: "Croácia",         cc: "hr"     },
  GHA: { name: "Gana",            cc: "gh"     },
  PAN: { name: "Panamá",          cc: "pa"     },
};

const GROUPS_RAW = [
  { id: "A", teams: ["MEX","RSA","KOR","CZE"] },
  { id: "B", teams: ["CAN","BIH","QAT","SUI"] },
  { id: "C", teams: ["BRA","MAR","HAI","SCO"] },
  { id: "D", teams: ["USA","PAR","AUS","TUR"] },
  { id: "E", teams: ["GER","CUW","CIV","ECU"] },
  { id: "F", teams: ["NED","JPN","SWE","TUN"] },
  { id: "G", teams: ["BEL","EGY","IRN","NZL"] },
  { id: "H", teams: ["ESP","CPV","KSA","URU"] },
  { id: "I", teams: ["FRA","SEN","IRQ","NOR"] },
  { id: "J", teams: ["ARG","ALG","AUT","JOR"] },
  { id: "K", teams: ["POR","COD","UZB","COL"] },
  { id: "L", teams: ["ENG","CRO","GHA","PAN"] },
];

// Official Copa 2026 group stage schedule — UTC timestamps (ET + 4h for EDT)
// Sources: FIFA, NBC Sports, ESPN (verified June 2026)
const MATCH_SCHEDULE = {
  // Group A: MEX RSA KOR CZE
  A1:Date.UTC(2026,5,11,19,0,0), A2:Date.UTC(2026,5,12, 2,0,0),
  A3:Date.UTC(2026,5,19, 3,0,0), A4:Date.UTC(2026,5,18,16,0,0),
  A5:Date.UTC(2026,5,25, 1,0,0), A6:Date.UTC(2026,5,25, 1,0,0),
  // Group B: CAN BIH QAT SUI
  B1:Date.UTC(2026,5,12,19,0,0), B2:Date.UTC(2026,5,13,19,0,0),
  B3:Date.UTC(2026,5,18,22,0,0), B4:Date.UTC(2026,5,18,19,0,0),
  B5:Date.UTC(2026,5,24,19,0,0), B6:Date.UTC(2026,5,24,19,0,0),
  // Group C: BRA MAR HAI SCO
  C1:Date.UTC(2026,5,13,22,0,0), C2:Date.UTC(2026,5,14, 1,0,0),
  C3:Date.UTC(2026,5,20, 1,0,0), C4:Date.UTC(2026,5,19,22,0,0),
  C5:Date.UTC(2026,5,24,22,0,0), C6:Date.UTC(2026,5,24,22,0,0),
  // Group D: USA PAR AUS TUR
  D1:Date.UTC(2026,5,13, 1,0,0), D2:Date.UTC(2026,5,14, 4,0,0),
  D3:Date.UTC(2026,5,19,19,0,0), D4:Date.UTC(2026,5,20, 4,0,0),
  D5:Date.UTC(2026,5,26, 2,0,0), D6:Date.UTC(2026,5,26, 2,0,0),
  // Group E: GER CUW CIV ECU
  E1:Date.UTC(2026,5,14,17,0,0), E2:Date.UTC(2026,5,14,23,0,0),
  E3:Date.UTC(2026,5,20,20,0,0), E4:Date.UTC(2026,5,21, 0,0,0),
  E5:Date.UTC(2026,5,25,20,0,0), E6:Date.UTC(2026,5,25,20,0,0),
  // Group F: NED JPN SWE TUN
  F1:Date.UTC(2026,5,14,20,0,0), F2:Date.UTC(2026,5,15, 2,0,0),
  F3:Date.UTC(2026,5,20,17,0,0), F4:Date.UTC(2026,5,21, 4,0,0),
  F5:Date.UTC(2026,5,25,23,0,0), F6:Date.UTC(2026,5,25,23,0,0),
  // Group G: BEL EGY IRN NZL
  G1:Date.UTC(2026,5,15,22,0,0), G2:Date.UTC(2026,5,16, 4,0,0),
  G3:Date.UTC(2026,5,21,19,0,0), G4:Date.UTC(2026,5,22, 1,0,0),
  G5:Date.UTC(2026,5,27, 3,0,0), G6:Date.UTC(2026,5,27, 3,0,0),
  // Group H: ESP CPV KSA URU
  H1:Date.UTC(2026,5,15,17,0,0), H2:Date.UTC(2026,5,15,22,0,0),
  H3:Date.UTC(2026,5,21,16,0,0), H4:Date.UTC(2026,5,21,22,0,0),
  H5:Date.UTC(2026,5,27, 0,0,0), H6:Date.UTC(2026,5,27, 0,0,0),
  // Group I: FRA SEN IRQ NOR
  I1:Date.UTC(2026,5,16,19,0,0), I2:Date.UTC(2026,5,16,22,0,0),
  I3:Date.UTC(2026,5,22,21,0,0), I4:Date.UTC(2026,5,23, 0,0,0),
  I5:Date.UTC(2026,5,26,19,0,0), I6:Date.UTC(2026,5,26,19,0,0),
  // Group J: ARG ALG AUT JOR
  J1:Date.UTC(2026,5,17, 1,0,0), J2:Date.UTC(2026,5,17, 4,0,0),
  J3:Date.UTC(2026,5,22,17,0,0), J4:Date.UTC(2026,5,23, 3,0,0),
  J5:Date.UTC(2026,5,28, 2,0,0), J6:Date.UTC(2026,5,28, 2,0,0),
  // Group K: POR COD UZB COL
  K1:Date.UTC(2026,5,17,17,0,0), K2:Date.UTC(2026,5,18, 2,0,0),
  K3:Date.UTC(2026,5,23,17,0,0), K4:Date.UTC(2026,5,24, 2,0,0),
  K5:Date.UTC(2026,5,27,23,30,0),K6:Date.UTC(2026,5,27,23,30,0),
  // Group L: ENG CRO GHA PAN
  L1:Date.UTC(2026,5,17,20,0,0), L2:Date.UTC(2026,5,17,23,0,0),
  L3:Date.UTC(2026,5,23,20,0,0), L4:Date.UTC(2026,5,23,23,0,0),
  L5:Date.UTC(2026,5,27,21,0,0), L6:Date.UTC(2026,5,27,21,0,0),
};

function genMatches(g) {
  const [t0,t1,t2,t3] = g.teams;
  const s = n => MATCH_SCHEDULE[`${g.id}${n}`];
  return [
    { id:`${g.id}1`, group:g.id, md:1, home:t0, away:t1, startTime:s(1) },
    { id:`${g.id}2`, group:g.id, md:1, home:t2, away:t3, startTime:s(2) },
    { id:`${g.id}3`, group:g.id, md:2, home:t0, away:t2, startTime:s(3) },
    { id:`${g.id}4`, group:g.id, md:2, home:t1, away:t3, startTime:s(4) },
    { id:`${g.id}5`, group:g.id, md:3, home:t0, away:t3, startTime:s(5) },
    { id:`${g.id}6`, group:g.id, md:3, home:t1, away:t2, startTime:s(6) },
  ];
}
const ALL_MATCHES = GROUPS_RAW.flatMap(genMatches);

// Bracket rounds (48-team format: 32 → 16 → 8 → 4 → 2 → 1)
const BRACKET_ROUNDS = [
  { id:"r32",   label:"Rodada de 32", slots:16 },
  { id:"r16",   label:"Oitavas",      slots:8  },
  { id:"qf",    label:"Quartas",      slots:4  },
  { id:"sf",    label:"Semifinais",   slots:2  },
  { id:"final", label:"Final",        slots:1  },
];

function emptyBracketMatch() {
  return { home:"", away:"", homeScore:"", awayScore:"", winner:"" };
}

const COLORS = [
  "#e74c3c","#3498db","#2ecc71","#f39c12",
  "#9b59b6","#1abc9c","#e67e22","#e91e63",
  "#00bcd4","#ff5722","#607d8b","#795548",
];

const POINTS_CONFIG = { result:1, exact:3, champion:10, runnerUp:10 };

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const S = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:"12px",
    padding:"16px",
    marginBottom:"12px",
  },
  gold:"#e8b84b", silver:"#b0b8c8", green:"#2ecc71", red:"#e74c3c", bg:"#080c18",
};

function initials(name) {
  return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
}
function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
function fmtTime(ts) {
  const d = new Date(ts);
  const day = d.toLocaleDateString("pt-BR",{ weekday:"short", day:"2-digit", month:"2-digit", timeZone:"America/Sao_Paulo" });
  const time = d.toLocaleTimeString("pt-BR",{ hour:"2-digit", minute:"2-digit", timeZone:"America/Sao_Paulo" });
  return `${day} ${time}`;
}

// flag image from flagcdn.com (SVG — scales to any size, no broken URLs)
function FlagImg({ code, size=48 }) {
  const team = TEAMS[code];
  if (!team) return null;
  return (
    <img
      src={`https://flagcdn.com/${team.cc}.svg`}
      alt={team.name}
      loading="lazy"
      style={{ width:size, height:"auto", display:"block", borderRadius:3 }}
    />
  );
}

// up/down stepper for score input
function ScoreStepper({ value, onChange, disabled }) {
  const n = (value === "" || value === undefined || value === null) ? null : parseInt(value);
  const btnBase = {
    border:"none", borderRadius:6, width:36, height:22, cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:12, transition:"all 0.15s", userSelect:"none",
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
      <button
        onClick={() => !disabled && onChange(n === null ? 0 : n + 1)}
        style={{ ...btnBase, background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)", color: disabled ? "#334" : "#ccd" }}
      >▲</button>
      <div style={{
        background:"rgba(255,255,255,0.09)", border:"1px solid rgba(255,255,255,0.14)",
        borderRadius:8, width:42, height:40,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'Bebas Neue',sans-serif", fontSize:28,
        color: n !== null ? "#fff" : "#334", letterSpacing:1,
      }}>
        {n !== null ? n : "–"}
      </div>
      <button
        onClick={() => !disabled && n !== null && n > 0 && onChange(n - 1)}
        style={{ ...btnBase, background: (disabled || n === null || n <= 0) ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.12)", color: (disabled || n === null || n <= 0) ? "#334" : "#ccd" }}
      >▼</button>
    </div>
  );
}

// derive result from scores — prevents contradicting picks
function deriveResult(h, a) {
  if (h === "" || h === undefined || h === null || a === "" || a === undefined || a === null) return null;
  const hi = parseInt(h), ai = parseInt(a);
  if (isNaN(hi) || isNaN(ai)) return null;
  return hi > ai ? "H" : hi < ai ? "A" : "D";
}

function Avatar({ participant, size=32 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", background:participant.color,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:700, color:"#fff", flexShrink:0,
    }}>
      {initials(participant.name)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  FIREBASE HOOK
// ═══════════════════════════════════════════════════════
function useFirebaseValue(path, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!path) { setValue(defaultValue); setReady(true); return; }
    const r = ref(db, path);
    const unsub = onValue(
      r,
      snap => {
        const data = snap.val();
        setValue(data !== null ? data : defaultValue);
        setReady(true);
      },
      () => { setValue(defaultValue); setReady(true); } // permission/network error → use default
    );
    return () => unsub();
  }, [path]); // eslint-disable-line

  async function save(newValue) {
    if (!path) return;
    setValue(newValue);
    await set(ref(db, path), newValue);
  }
  return [value, save, ready];
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 520);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 520);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ═══════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════
export default function BolaoApp() {
  const [tab, setTab]             = useState("grupos");
  const [activeGroup, setActiveGroup] = useState("A");
  const [liveScores, setLiveScores]   = useState({});
  const [apiStatus, setApiStatus]     = useState("idle");
  const [now, setNow]             = useState(Date.now());

  // ── bolão identity (two-level: which bolão, then who inside it) ──
  const [activeBolaoId, _setBolaoId] = useState(() => localStorage.getItem("bolao_bolaoId"));
  const [activePid,     _setPid]     = useState(() => {
    const bid = localStorage.getItem("bolao_bolaoId");
    return bid ? localStorage.getItem(`bolao_pid_${bid}`) : null;
  });

  function setActiveBolaoId(id) {
    _setBolaoId(id);
    if (id) {
      localStorage.setItem("bolao_bolaoId", id);
      _setPid(localStorage.getItem(`bolao_pid_${id}`));
    } else {
      localStorage.removeItem("bolao_bolaoId");
      _setPid(null);
    }
  }
  function setActivePid(id) {
    _setPid(id);
    if (activeBolaoId) {
      if (id) localStorage.setItem(`bolao_pid_${activeBolaoId}`, id);
      else    localStorage.removeItem(`bolao_pid_${activeBolaoId}`);
    }
  }

  // "main" bolão maps to legacy bolao/ path; new ones use boloes/{id}/
  const bolaoBase = activeBolaoId === "main" ? "bolao"
                  : activeBolaoId             ? `boloes/${activeBolaoId}`
                  : null;

  // Bolão list (always loaded regardless of selection)
  const DEFAULT_META = { main: { name: "Bolão Principal", createdAt: 0 } };
  const [boloesMeta, saveBoloesMeta, meta_ready] = useFirebaseValue("boloes_meta", DEFAULT_META);

  // Bolão-scoped data (null path = not loaded yet)
  const [participants, saveParticipants, p_ready]  = useFirebaseValue(bolaoBase ? `${bolaoBase}/participants` : null, []);
  const [predictions,  savePredictions,  pr_ready] = useFirebaseValue(bolaoBase ? `${bolaoBase}/predictions`  : null, {});
  const [extraPicks,   saveExtraPicks,   ex_ready] = useFirebaseValue(bolaoBase ? `${bolaoBase}/extraPicks`   : null, {});
  const [bracket,      saveBracket,      br_ready] = useFirebaseValue(bolaoBase ? `${bolaoBase}/bracket`      : null, {});

  const loaded = p_ready && pr_ready && ex_ready && br_ready;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    fetchLiveScores();
    const t = setInterval(fetchLiveScores, 60000);
    return () => clearInterval(t);
  }, []);

  async function fetchLiveScores() {
    setApiStatus("fetching");
    try {
      const res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard",
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      const scores = {};
      (data.events || []).forEach(ev => {
        const comp = ev.competitions?.[0];
        if (!comp) return;
        const completed = comp.status?.type?.completed;
        const statusName = comp.status?.type?.name || "";
        const home = comp.competitors?.find(c => c.homeAway === "home");
        const away = comp.competitors?.find(c => c.homeAway === "away");
        if (home && away) {
          scores[`${home.team.abbreviation}vs${away.team.abbreviation}`] = {
            homeScore: parseInt(home.score) || 0,
            awayScore: parseInt(away.score) || 0,
            status: completed ? "final" : statusName.includes("PROGRESS") ? "live" : "scheduled",
            displayClock: comp.status?.displayClock || "",
          };
        }
      });
      setLiveScores(scores);
      setApiStatus("ok");
    } catch { setApiStatus("error"); }
  }

  function calcScore(pid) {
    let pts = 0, correct = 0, exact = 0;
    const preds = predictions[pid] || {};
    ALL_MATCHES.forEach(m => {
      const pred = preds[m.id];
      if (!pred) return;
      const live = liveScores[`${m.home}vs${m.away}`];
      if (!live || live.status !== "final") return;
      const actual = live.homeScore > live.awayScore ? "H" : live.homeScore < live.awayScore ? "A" : "D";
      if (pred.result === actual) {
        pts += POINTS_CONFIG.result; correct++;
        if (String(pred.home) === String(live.homeScore) && String(pred.away) === String(live.awayScore)) {
          pts += POINTS_CONFIG.exact; exact++;
        }
      }
    });
    return { pts, correct, exact };
  }

  const parts      = Array.isArray(participants) ? participants : [];
  const ranking = parts
    .map(p => ({ ...p, ...calcScore(p.id), preds: Object.keys(predictions[p.id]||{}).length }))
    .sort((a,b) => b.pts - a.pts || b.correct - a.correct || b.preds - a.preds);

  const activePart = parts.find(p => p.id === activePid);
  const activeBolaoName = boloesMeta[activeBolaoId]?.name || null;

  const showBolaoGate    = !activeBolaoId;
  const showIdentityGate = loaded && !!activeBolaoId && !parts.find(p => p.id === activePid);

  function handleBolaoCreate(name) {
    const id = Date.now().toString(36);
    saveBoloesMeta({ ...boloesMeta, [id]: { name, createdAt: Date.now() } });
    setActiveBolaoId(id);
  }
  function handleGateAdd(name, color) {
    const id = Date.now().toString();
    saveParticipants([...parts, { id, name, color }]);
    setActivePid(id);
  }

  // Spinner only while bolão data is loading (after a bolão is picked)
  if (activeBolaoId && !loaded) {
    return (
      <div style={{ minHeight:"100vh", background:S.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:S.gold, fontSize:48 }}>🏆</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:"#e8eaf0", fontFamily:"'Nunito',sans-serif" }}>
      {showBolaoGate && (
        <BolaoGate boloesMeta={boloesMeta} onSelect={setActiveBolaoId} onCreate={handleBolaoCreate} />
      )}
      {!showBolaoGate && showIdentityGate && (
        <IdentityGate participants={parts} onSelect={setActivePid} onAdd={handleGateAdd}
          bolaoName={activeBolaoName} onSwitchBolao={() => setActiveBolaoId(null)} />
      )}
      <Header activePart={activePart} participants={parts} activePid={activePid} setActivePid={setActivePid}
        apiStatus={apiStatus} fetchLiveScores={fetchLiveScores}
        activeBolaoName={activeBolaoName} onSwitchBolao={() => setActiveBolaoId(null)} />
      <TabBar tab={tab} setTab={setTab} />
      <main style={{ maxWidth:820, margin:"0 auto", padding:"20px 16px 80px" }}>
        {tab==="ranking"       && <RankingTab ranking={ranking} participants={parts} predictions={predictions} extraPicks={extraPicks} liveScores={liveScores} />}
        {tab==="grupos"        && <GruposTab activeGroup={activeGroup} setActiveGroup={setActiveGroup} activePid={activePid} participants={parts} predictions={predictions} liveScores={liveScores} savePredictions={savePredictions} now={now} />}
        {tab==="chaveamento"   && <BracketTab bracket={bracket} saveBracket={saveBracket} />}
        {tab==="campeao"       && <CampeaoTab activePid={activePid} participants={parts} extraPicks={extraPicks} saveExtraPicks={saveExtraPicks} />}
        {tab==="participantes" && <ParticipantesTab participants={parts} saveParticipants={saveParticipants} activePid={activePid} setActivePid={setActivePid} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  BOLÃO GATE  (pick or create a bolão)
// ═══════════════════════════════════════════════════════
function BolaoGate({ boloesMeta, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [name, setName]         = useState("");
  const list = Object.entries(boloesMeta || {});

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim());
  }

  return (
    <div style={{
      position:"fixed", inset:0, background:S.bg, zIndex:500,
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"24px 20px", overflowY:"auto",
    }}>
      <div style={{ fontSize:52, marginBottom:6 }}>🏆</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:S.gold, letterSpacing:4, marginBottom:4 }}>BOLÃO COPA 2026</div>
      <div style={{ fontSize:11, color:"#445", letterSpacing:2, marginBottom:36 }}>EUA · CANADÁ · MÉXICO</div>

      {!creating ? (
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ fontWeight:700, fontSize:20, textAlign:"center", marginBottom:6 }}>Escolha o Bolão</div>
          <div style={{ fontSize:13, color:"#556", textAlign:"center", marginBottom:20 }}>Selecione o seu grupo para entrar</div>

          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
            {list.map(([id, meta]) => (
              <button key={id} onClick={() => onSelect(id)} style={{
                background:"rgba(232,184,75,0.07)", border:`1.5px solid rgba(232,184,75,0.25)`,
                borderRadius:14, padding:"18px 20px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:14, textAlign:"left",
                transition:"border-color 0.15s",
              }}>
                <span style={{ fontSize:28 }}>🏆</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color:"#e8eaf0" }}>{meta.name}</div>
                  {meta.createdAt > 0 && <div style={{ fontSize:11, color:"#556", marginTop:2 }}>Criado em {fmtSubmitTime(meta.createdAt)}</div>}
                </div>
                <span style={{ marginLeft:"auto", color:S.gold, fontSize:18 }}>›</span>
              </button>
            ))}
          </div>

          <button onClick={() => setCreating(true)} style={{
            width:"100%", background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:10,
            padding:"13px 0", color:"#778", cursor:"pointer",
            fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600,
          }}>
            + Criar novo bolão
          </button>
        </div>
      ) : (
        <div style={{ ...S.card, width:"100%", maxWidth:360 }}>
          <div style={{ fontWeight:700, fontSize:16, color:S.gold, marginBottom:16 }}>Novo Bolão</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder="Nome do bolão (ex: Família, Trabalho...)"
            autoFocus
            maxLength={40}
            style={{
              width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:8, color:"#fff", padding:"11px 14px", fontSize:15,
              fontFamily:"'Nunito',sans-serif", boxSizing:"border-box", outline:"none", marginBottom:12,
            }}
          />
          <button onClick={handleCreate} disabled={!name.trim()} style={{
            width:"100%", background: name.trim() ? S.gold : "rgba(255,255,255,0.06)",
            color: name.trim() ? "#080c18" : "#556", border:"none", borderRadius:8, padding:"12px 0",
            cursor: name.trim() ? "pointer" : "default", fontFamily:"'Nunito',sans-serif",
            fontWeight:700, fontSize:15, marginBottom:8, transition:"all 0.2s",
          }}>
            Criar
          </button>
          <button onClick={() => setCreating(false)} style={{
            width:"100%", background:"none", border:"none", color:"#556",
            cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif", padding:"6px 0",
          }}>
            ← Voltar
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  IDENTITY GATE
// ═══════════════════════════════════════════════════════
function IdentityGate({ participants, onSelect, onAdd, bolaoName, onSwitchBolao }) {
  const [creating, setCreating] = useState(participants.length === 0);
  const [name, setName]   = useState("");
  const [color, setColor] = useState(COLORS[participants.length % COLORS.length]);

  function handleAdd() {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
  }

  return (
    <div style={{
      position:"fixed", inset:0, background:S.bg, zIndex:500,
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"24px 20px", overflowY:"auto",
    }}>
      <div style={{ fontSize:52, marginBottom:6 }}>🏆</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:S.gold, letterSpacing:4, marginBottom:2 }}>BOLÃO COPA 2026</div>
      {bolaoName && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ fontSize:13, color:"#aab", fontWeight:700 }}>{bolaoName}</span>
          <button onClick={onSwitchBolao} style={{ background:"none", border:"none", color:"#556", cursor:"pointer", fontSize:11, padding:0 }}>trocar ↩</button>
        </div>
      )}
      <div style={{ fontSize:11, color:"#445", letterSpacing:2, marginBottom:32 }}>EUA · CANADÁ · MÉXICO</div>

      {!creating ? (
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ fontWeight:700, fontSize:20, textAlign:"center", marginBottom:6 }}>Quem é você?</div>
          <div style={{ fontSize:13, color:"#556", textAlign:"center", marginBottom:20 }}>Toque no seu nome para entrar</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {participants.map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)} style={{
                background:`rgba(${hexToRgb(p.color)},0.1)`,
                border:`2px solid ${p.color}55`,
                borderRadius:14, padding:"18px 10px",
                cursor:"pointer", transition:"border-color 0.15s",
                display:"flex", flexDirection:"column", alignItems:"center", gap:10,
              }}>
                <Avatar participant={p} size={52} />
                <span style={{ color:"#e8eaf0", fontWeight:700, fontSize:14 }}>{p.name}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setCreating(true)} style={{
            width:"100%", background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.1)", borderRadius:10,
            padding:"12px 0", color:"#667", cursor:"pointer",
            fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600,
          }}>
            Sou novo por aqui →
          </button>
        </div>
      ) : (
        <div style={{ ...S.card, width:"100%", maxWidth:360 }}>
          <div style={{ fontWeight:700, fontSize:16, color:S.gold, marginBottom:16 }}>
            {participants.length === 0 ? "Criar o primeiro perfil" : "Criar perfil"}
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Seu nome..."
            autoFocus
            maxLength={24}
            style={{
              width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:8, color:"#fff", padding:"11px 14px", fontSize:15,
              fontFamily:"'Nunito',sans-serif", boxSizing:"border-box", outline:"none", marginBottom:12,
            }}
          />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width:30, height:30, borderRadius:"50%", background:c,
                border: color===c ? "3px solid #fff" : "2px solid transparent",
                cursor:"pointer", transition:"border 0.1s",
              }} />
            ))}
          </div>
          {name.trim() && (
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"8px 10px", background:"rgba(255,255,255,0.04)", borderRadius:8 }}>
              <Avatar participant={{ name, color }} size={36} />
              <span style={{ fontSize:14, fontWeight:600 }}>{name}</span>
            </div>
          )}
          <button onClick={handleAdd} disabled={!name.trim()} style={{
            width:"100%", background: name.trim() ? S.gold : "rgba(255,255,255,0.06)",
            color: name.trim() ? "#080c18" : "#556", border:"none",
            borderRadius:8, padding:"12px 0", cursor: name.trim() ? "pointer" : "default",
            fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:15,
            marginBottom: participants.length > 0 ? 8 : 0, transition:"all 0.2s",
          }}>
            Entrar
          </button>
          {participants.length > 0 && (
            <button onClick={() => setCreating(false)} style={{
              width:"100%", background:"none", border:"none", color:"#556",
              cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif", padding:"6px 0",
            }}>
              ← Voltar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════════════
function Header({ activePart, participants, activePid, setActivePid, apiStatus, fetchLiveScores, activeBolaoName, onSwitchBolao }) {
  return (
    <header style={{
      background:"linear-gradient(90deg,#0b101f 0%,#10192e 100%)",
      borderBottom:`2px solid ${S.gold}`, padding:"0 20px",
    }}>
      <div style={{ maxWidth:820, margin:"0 auto", display:"flex", alignItems:"center", gap:12, minHeight:64 }}>
        <div style={{ fontSize:36, lineHeight:1 }}>🏆</div>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:S.gold, letterSpacing:3, lineHeight:1 }}>BOLÃO COPA 2026</div>
          {activeBolaoName
            ? <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                <span style={{ fontSize:10, color:"#aab", letterSpacing:1 }}>{activeBolaoName}</span>
                <button onClick={onSwitchBolao} style={{ background:"none", border:"none", color:"#445", cursor:"pointer", fontSize:9, padding:0 }}>trocar</button>
              </div>
            : <div style={{ fontSize:10, color:"#556", letterSpacing:2, marginTop:2 }}>EUA · CANADÁ · MÉXICO</div>}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <button onClick={fetchLiveScores} title="Atualizar placares" style={{ background:"none", border:"none", cursor:"pointer", padding:4, fontSize:16, opacity:0.7 }}>
            {apiStatus==="fetching"?"🔄":apiStatus==="ok"?"🟢":apiStatus==="error"?"🔴":"⚪"}
          </button>
          {participants.map(p => (
            <button key={p.id} onClick={() => setActivePid(p.id)} style={{
              background: activePid===p.id ? p.color : "rgba(255,255,255,0.06)",
              border:`1.5px solid ${activePid===p.id ? p.color : "rgba(255,255,255,0.15)"}`,
              color:"#fff", borderRadius:20, padding:"4px 12px", cursor:"pointer",
              fontSize:12, fontFamily:"'Nunito',sans-serif",
              fontWeight: activePid===p.id ? 700 : 400, transition:"all 0.2s",
            }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════
//  TAB BAR
// ═══════════════════════════════════════════════════════
function TabBar({ tab, setTab }) {
  const tabs = [
    { id:"ranking",       icon:"🏅", label:"Ranking" },
    { id:"grupos",        icon:"📋", label:"Grupos" },
    { id:"chaveamento",   icon:"🏆", label:"Chaveamento" },
    { id:"campeao",       icon:"🥇", label:"Campeão" },
    { id:"participantes", icon:"👥", label:"Participantes" },
  ];
  return (
    <nav style={{ background:"#0b101f", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", overflowX:"auto", position:"sticky", top:0, zIndex:10 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          background:"none", border:"none",
          color: tab===t.id ? S.gold : "#667",
          borderBottom: tab===t.id ? `3px solid ${S.gold}` : "3px solid transparent",
          padding:"12px 18px", cursor:"pointer",
          fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:12,
          letterSpacing:0.5, whiteSpace:"nowrap", transition:"all 0.2s",
          display:"flex", alignItems:"center", gap:5,
        }}>
          <span>{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════
function buildCSV(participants, predictions, extraPicks, ranking) {
  const BOM = "﻿";
  const row = (...cells) => cells.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",");

  const lines = [];
  const ts = new Date().toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo" });

  lines.push(row("BOLÃO COPA 2026 — Exportação de Palpites"));
  lines.push(row(`Exportado em: ${ts}`));
  lines.push("");

  // Ranking
  lines.push(row("=== CLASSIFICAÇÃO ==="));
  lines.push(row("Pos","Participante","Pontos","Acertos","Placar Exato","Palpites"));
  ranking.forEach((p, i) => lines.push(row(i+1, p.name, p.pts, p.correct, p.exact, p.preds)));
  lines.push("");

  // Match predictions
  lines.push(row("=== PALPITES DOS JOGOS ==="));
  lines.push(row("Participante","Grupo","Rodada","Casa","Fora","Gols Casa","Gols Fora","Resultado"));
  participants.forEach(p => {
    const preds = predictions[p.id] || {};
    ALL_MATCHES.forEach(m => {
      const pred = preds[m.id];
      if (!pred) return;
      const res = pred.result === "H" ? TEAMS[m.home].name : pred.result === "A" ? TEAMS[m.away].name : pred.result === "D" ? "Empate" : "";
      lines.push(row(p.name, `Grupo ${m.group}`, m.md, TEAMS[m.home].name, TEAMS[m.away].name, pred.home ?? "", pred.away ?? "", res));
    });
  });
  lines.push("");

  // Extra picks
  lines.push(row("=== PALPITES ESPECIAIS ==="));
  lines.push(row("Participante","Campeão","Vice-Campeão","Artilheiro","Artilheiro Enviado Em"));
  participants.forEach(p => {
    const picks = extraPicks[p.id] || {};
    const raw = picks.topScorer;
    const scorer = raw && typeof raw === "object" ? raw : (raw ? { value: raw, submittedAt: null } : null);
    lines.push(row(
      p.name,
      picks.champion ? TEAMS[picks.champion].name : "",
      picks.runnerUp ? TEAMS[picks.runnerUp].name : "",
      scorer?.value || "",
      scorer?.submittedAt ? fmtSubmitTime(scorer.submittedAt) : "",
    ));
  });

  const csv = BOM + lines.join("\r\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bolao_copa2026_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════
//  RANKING TAB
// ═══════════════════════════════════════════════════════
function RankingTab({ ranking, participants, predictions, extraPicks, liveScores }) {
  const medals = ["🥇","🥈","🥉"];
  const mobile = useIsMobile();
  const cols = mobile ? "32px 1fr 64px" : "40px 1fr 80px 72px 72px";
  if (participants.length === 0) {
    return <EmptyState icon="👥" title="Nenhum participante ainda" subtitle='Vá em "Participantes" para adicionar os jogadores do bolão.' />;
  }
  return (
    <div>
      <SectionTitle icon="🏅" title="Classificação Geral" />
      <div style={{ ...S.card, background:"linear-gradient(135deg,rgba(232,184,75,0.08),rgba(232,184,75,0.02))", border:`1px solid rgba(232,184,75,0.2)`, marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:cols, gap:8, fontSize:11, color:"#556", fontWeight:700, letterSpacing:1, padding:"0 4px 8px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <span>#</span><span>PARTICIPANTE</span><span style={{textAlign:"center"}}>PTS</span>
          {!mobile && <><span style={{textAlign:"center"}}>ACERTOS</span><span style={{textAlign:"center"}}>PALPITES</span></>}
        </div>
        {ranking.map((p, i) => (
          <div key={p.id} style={{
            display:"grid", gridTemplateColumns:cols, gap:8,
            alignItems:"center", padding:"10px 4px",
            borderBottom: i < ranking.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            background: i===0 ? "rgba(232,184,75,0.04)" : "none",
          }}>
            <span style={{ fontSize:mobile?15:18, textAlign:"center" }}>{medals[i] || `${i+1}`}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Avatar participant={p} size={mobile?26:32} />
              <div>
                <div style={{ fontWeight:700, fontSize:mobile?13:14 }}>{p.name}</div>
                {mobile && <div style={{ fontSize:11, color:"#8a9" }}>{p.correct} acertos · {p.preds}/{ALL_MATCHES.length}</div>}
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:mobile?20:22, color:i===0?S.gold:"#e8eaf0" }}>{p.pts}</span>
              <span style={{ fontSize:10, color:"#556", marginLeft:2 }}>pts</span>
            </div>
            {!mobile && <>
              <div style={{ textAlign:"center", fontSize:13, color:"#8a9" }}>{p.correct} ✓</div>
              <div style={{ textAlign:"center", fontSize:13, color:"#667" }}>{p.preds}/{ALL_MATCHES.length}</div>
            </>}
          </div>
        ))}
      </div>
      <SectionTitle icon="📊" title="Sistema de Pontuação" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { icon:"✅", label:"Resultado certo (V/E/D)", pts:POINTS_CONFIG.result },
          { icon:"🎯", label:"Placar exato (bônus)", pts:POINTS_CONFIG.exact },
          { icon:"🥇", label:"Acertar o campeão", pts:POINTS_CONFIG.champion },
          { icon:"🥈", label:"Acertar o vice", pts:POINTS_CONFIG.runnerUp },
        ].map(r => (
          <div key={r.label} style={{ ...S.card, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>{r.icon}</span>
            <div style={{ flex:1, fontSize:12, color:"#aab" }}>{r.label}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:S.gold }}>{r.pts}<span style={{fontSize:12}}> pts</span></div>
          </div>
        ))}
      </div>

      {participants.length > 0 && (
        <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end" }}>
          <button
            onClick={() => buildCSV(participants, predictions, extraPicks, ranking)}
            style={{
              display:"flex", alignItems:"center", gap:8,
              background:"rgba(232,184,75,0.1)", border:`1px solid rgba(232,184,75,0.35)`,
              color:S.gold, borderRadius:10, padding:"10px 20px",
              cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13,
              transition:"all 0.2s",
            }}
          >
            ⬇ Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  GRUPOS TAB
// ═══════════════════════════════════════════════════════
function GruposTab({ activeGroup, setActiveGroup, activePid, participants, predictions, liveScores, savePredictions, now }) {
  const groupMatches = ALL_MATCHES.filter(m => m.group === activeGroup);
  const groupTeams = GROUPS_RAW.find(g => g.id === activeGroup)?.teams || [];
  const activePart = participants.find(p => p.id === activePid);
  const totalPreds = activePid ? Object.keys(predictions[activePid]||{}).length : 0;
  const pct = Math.round(totalPreds / ALL_MATCHES.length * 100);

  function setPred(matchId, result, home, away) {
    if (!activePid) return;
    const next = { ...predictions, [activePid]: { ...(predictions[activePid]||{}), [matchId]: { result, home, away } } };
    savePredictions(next);
  }

  return (
    <div>
      {!activePid && (
        <div style={{ ...S.card, background:"rgba(232,184,75,0.08)", border:`1px solid rgba(232,184,75,0.3)`, marginBottom:16, textAlign:"center", padding:20 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>👆</div>
          <div style={{ color:S.gold, fontWeight:700 }}>Selecione um participante no topo para fazer palpites</div>
        </div>
      )}
      {activePart && (
        <div style={{ ...S.card, display:"flex", alignItems:"center", gap:12, marginBottom:16, background:`linear-gradient(90deg,${activePart.color}18,transparent)`, border:`1px solid ${activePart.color}44` }}>
          <Avatar participant={activePart} size={38} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Palpitando como: <span style={{ color:activePart.color }}>{activePart.name}</span></div>
            <div style={{ fontSize:11, color:"#667", marginTop:2, display:"flex", alignItems:"center", gap:8 }}>
              <span>{totalPreds}/{ALL_MATCHES.length} jogos preenchidos</span>
              <span style={{ display:"inline-block", background:"rgba(255,255,255,0.08)", borderRadius:10, height:6, width:80, overflow:"hidden" }}>
                <span style={{ display:"block", height:"100%", width:`${pct}%`, background:activePart.color, transition:"width 0.4s" }} />
              </span>
            </div>
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:activePart.color }}>{pct}%</div>
        </div>
      )}

      {/* Group picker */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {GROUPS_RAW.map(g => {
          const done = ALL_MATCHES.filter(m => m.group===g.id && predictions[activePid]?.[m.id]).length;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)} style={{
              background: activeGroup===g.id ? S.gold : "rgba(255,255,255,0.06)",
              color: activeGroup===g.id ? "#080c18" : "#aab",
              border:"none", borderRadius:8, padding:"8px 14px", cursor:"pointer",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:16, fontWeight:700,
              letterSpacing:1, position:"relative", transition:"all 0.2s", minWidth:48,
            }}>
              {g.id}
              {activePid && done > 0 && (
                <span style={{
                  position:"absolute", top:-4, right:-4,
                  background: done===6 ? "#2ecc71" : "#f39c12",
                  borderRadius:"50%", width:14, height:14, fontSize:9,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontFamily:"'Nunito',sans-serif", fontWeight:700,
                }}>
                  {done===6?"✓":done}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ ...S.card, marginBottom:8, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:S.gold, marginRight:4 }}>GRUPO {activeGroup}</span>
        {groupTeams.map(code => (
          <span key={code} style={{ background:"rgba(255,255,255,0.07)", borderRadius:20, padding:"4px 10px", fontSize:14, display:"flex", alignItems:"center", gap:6 }}>
            <FlagImg code={code} size={24} />
            <span style={{ fontSize:12 }}>{TEAMS[code].name}</span>
          </span>
        ))}
      </div>

      {[1,2,3].map(md => (
        <div key={md}>
          <div style={{ fontSize:11, color:"#556", letterSpacing:2, fontWeight:700, margin:"16px 0 8px", paddingLeft:4 }}>RODADA {md}</div>
          {groupMatches.filter(m => m.md===md).map(m => (
            <MatchCard key={m.id} match={m} pred={activePid ? predictions[activePid]?.[m.id] : null} liveScore={liveScores[`${m.home}vs${m.away}`]} onPred={(r,h,a) => setPred(m.id,r,h,a)} disabled={!activePid} participants={participants} predictions={predictions} now={now} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match, pred, liveScore, onPred, disabled, participants, predictions, now }) {
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  const mobile = useIsMobile();
  const flagSize = mobile ? 40 : 52;
  const [homeInput, setHomeInput] = useState(pred?.home ?? "");
  const [awayInput, setAwayInput] = useState(pred?.away ?? "");

  useEffect(() => {
    setHomeInput(pred?.home ?? "");
    setAwayInput(pred?.away ?? "");
  }, [pred, match.id]);

  const isLive   = liveScore?.status === "live";
  const isFinal  = liveScore?.status === "final";
  const isLocked = now >= match.startTime - 3_600_000; // lock 1h before
  const canEdit  = !disabled && !isLocked;

  const actualResult = (isFinal||isLive)
    ? (liveScore.homeScore > liveScore.awayScore ? "H" : liveScore.homeScore < liveScore.awayScore ? "A" : "D")
    : null;

  // derive result from current score inputs
  const scoreDerived = deriveResult(homeInput, awayInput);

  function handleScore(who, val) {
    const v = val === "" ? "" : Math.max(0, typeof val === "number" ? val : parseInt(val)||0);
    const newHome = who === "home" ? v : homeInput;
    const newAway = who === "away" ? v : awayInput;
    if (who === "home") setHomeInput(v); else setAwayInput(v);
    const derived = deriveResult(newHome, newAway);
    onPred(
      derived || pred?.result || undefined,
      newHome !== "" ? parseInt(newHome) : undefined,
      newAway !== "" ? parseInt(newAway) : undefined,
    );
  }

  function handleResult(r) {
    if (!canEdit) return;
    // If existing scores contradict the chosen result, wipe them
    if (scoreDerived && scoreDerived !== r) {
      setHomeInput(""); setAwayInput("");
      onPred(r, undefined, undefined);
    } else {
      onPred(r, homeInput !== "" ? parseInt(homeInput) : undefined, awayInput !== "" ? parseInt(awayInput) : undefined);
    }
  }

  const otherPreds = participants.filter(p => predictions[p.id]?.[match.id]).map(p => ({ ...p, pred: predictions[p.id][match.id] }));

  const resultOpts = [
    { code:"H", label:`Vitória`, flag: match.home, color:"#3498db" },
    { code:"D", label:"Empate",  flag: null,        color:"#f39c12" },
    { code:"A", label:`Vitória`, flag: match.away,  color:"#e74c3c" },
  ];

  return (
    <div style={{
      ...S.card,
      border: pred ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.05)",
      background: isLive ? "rgba(46,204,113,0.05)" : isFinal ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
      position:"relative", overflow:"hidden",
    }}>
      {isLive && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#2ecc71,#1abc9c)" }} />}

      {/* Status bar */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
        {isLive ? (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:10, background:"rgba(46,204,113,0.2)", color:"#2ecc71" }}>🔴 AO VIVO {liveScore.displayClock}</span>
        ) : isFinal ? (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:10, background:"rgba(255,255,255,0.08)", color:"#556" }}>⚫ ENCERRADO</span>
        ) : isLocked ? (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:10, background:"rgba(231,76,60,0.12)", color:"#e74c3c" }}>🔒 APOSTAS ENCERRADAS</span>
        ) : (
          <span style={{ fontSize:10, color:"#667", padding:"3px 8px", borderRadius:10, background:"rgba(255,255,255,0.04)", letterSpacing:0.5 }}>⏱ {fmtTime(match.startTime)}</span>
        )}
      </div>

      {/* Teams + score */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8, marginBottom:14 }}>
        {/* Home */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <FlagImg code={match.home} size={flagSize} />
          <div style={{ fontSize:mobile?11:13, fontWeight:700, textAlign:"center", lineHeight:1.2 }}>{home.name}</div>
        </div>

        {/* Score */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          {(isLive||isFinal) ? (
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:mobile?28:36, color:isLive?S.green:S.silver, letterSpacing:3, lineHeight:1 }}>
              {liveScore.homeScore} – {liveScore.awayScore}
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:mobile?5:8 }}>
              <ScoreStepper value={homeInput} onChange={v => handleScore("home", v)} disabled={!canEdit} />
              <span style={{ color:"#334", fontSize:18, fontWeight:700 }}>×</span>
              <ScoreStepper value={awayInput} onChange={v => handleScore("away", v)} disabled={!canEdit} />
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <FlagImg code={match.away} size={flagSize} />
          <div style={{ fontSize:mobile?11:13, fontWeight:700, textAlign:"center", lineHeight:1.2 }}>{away.name}</div>
        </div>
      </div>

      {/* Result buttons */}
      {!isLocked && !isFinal && !isLive ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {resultOpts.map(opt => {
            const sel = pred?.result === opt.code;
            // grey out options that contradict the entered score
            const blocked = !!scoreDerived && scoreDerived !== opt.code;
            return (
              <button key={opt.code} onClick={() => handleResult(opt.code)} disabled={!canEdit || blocked} style={{
                background: sel ? opt.color : "rgba(255,255,255,0.05)",
                border:`1.5px solid ${sel ? opt.color : blocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:8, padding:"8px 4px", cursor: (canEdit && !blocked) ? "pointer" : "default",
                color: sel ? "#fff" : blocked ? "#333" : "#778",
                fontSize:11, fontWeight:700, transition:"all 0.15s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:4,
                opacity: blocked ? 0.35 : 1,
              }}>
                {opt.flag
                  ? <><FlagImg code={opt.flag} size={16} /> {opt.label}</>
                  : `⚖️ ${opt.label}`}
              </button>
            );
          })}
        </div>
      ) : (isFinal||isLive) ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {resultOpts.map(opt => {
            const sel = pred?.result === opt.code;
            const correct = actualResult === opt.code;
            return (
              <button key={opt.code} disabled style={{
                background: sel ? opt.color : correct ? `${opt.color}22` : "rgba(255,255,255,0.04)",
                border:`1.5px solid ${(sel||correct) ? opt.color : "rgba(255,255,255,0.08)"}`,
                borderRadius:8, padding:"8px 4px", cursor:"default",
                color: sel ? "#fff" : correct ? opt.color : "#445",
                fontSize:11, fontWeight:700, position:"relative",
                display:"flex", alignItems:"center", justifyContent:"center", gap:4,
              }}>
                {opt.flag ? <><FlagImg code={opt.flag} size={14} /> {opt.label}</> : `⚖️ ${opt.label}`}
                {sel && !correct && <span style={{position:"absolute",top:2,right:5,fontSize:9}}>✗</span>}
                {sel && correct  && <span style={{position:"absolute",top:2,right:5,fontSize:9,color:"#2ecc71"}}>✓</span>}
              </button>
            );
          })}
        </div>
      ) : pred?.result ? (
        <div style={{ display:"flex", justifyContent:"center" }}>
          <span style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"8px 20px", fontSize:12, color:"#778" }}>
            Palpite: {pred.result==="H" ? home.name : pred.result==="A" ? away.name : "Empate"}
            {pred.home !== undefined && ` — ${pred.home}×${pred.away}`}
          </span>
        </div>
      ) : (
        <div style={{ textAlign:"center", fontSize:12, color:"#445", padding:"8px 0" }}>Apostas encerradas para este jogo</div>
      )}

      {/* Others' picks */}
      {otherPreds.length > 0 && (
        <div style={{ marginTop:10, display:"flex", gap:4, flexWrap:"wrap" }}>
          {otherPreds.map(p => (
            <div key={p.id}
              style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.05)", borderRadius:20, padding:"3px 8px", fontSize:11, borderLeft:`3px solid ${p.color}` }}>
              <span style={{ fontWeight:700, color:p.color, fontSize:10 }}>{initials(p.name)}</span>
              <span style={{ color:"#778" }}>
                {p.pred.result==="H" ? home.name : p.pred.result==="A" ? away.name : "⚖️ Empate"}
                {p.pred.home !== undefined && ` ${p.pred.home}–${p.pred.away}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  BRACKET TAB  (tab-based, no horizontal scroll)
// ═══════════════════════════════════════════════════════
function getBracketMatch(bracket, roundId, idx) {
  return bracket?.[roundId]?.[idx] || emptyBracketMatch();
}

function BracketTab({ bracket, saveBracket }) {
  const [activeRound, setActiveRound] = useState("r32");
  const [editing, setEditing]         = useState(null);
  const [editData, setEditData]       = useState({});

  const round = BRACKET_ROUNDS.find(r => r.id === activeRound);

  function openEdit(roundId, idx) {
    setEditData({ ...getBracketMatch(bracket, roundId, idx) });
    setEditing({ roundId, idx });
  }
  function saveEdit() {
    saveBracket({ ...bracket, [editing.roundId]: { ...(bracket[editing.roundId]||{}), [editing.idx]: editData } });
    setEditing(null);
  }
  function clearMatch() {
    saveBracket({ ...bracket, [editing.roundId]: { ...(bracket[editing.roundId]||{}), [editing.idx]: emptyBracketMatch() } });
    setEditing(null);
  }

  return (
    <div>
      <SectionTitle icon="🏆" title="Chaveamento" />

      {/* Round tabs */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:16 }}>
        {BRACKET_ROUNDS.map(r => {
          const filled = Array.from({length:r.slots}, (_,i) => getBracketMatch(bracket, r.id, i)).filter(m => m.home || m.away).length;
          return (
            <button key={r.id} onClick={() => setActiveRound(r.id)} style={{
              background: activeRound===r.id ? S.gold : "rgba(255,255,255,0.07)",
              color: activeRound===r.id ? "#080c18" : "#aab",
              border:"none", borderRadius:8, padding:"8px 14px", cursor:"pointer",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:13, fontWeight:700,
              letterSpacing:1, transition:"all 0.2s", position:"relative",
            }}>
              {r.label}
              {filled > 0 && (
                <span style={{
                  position:"absolute", top:-4, right:-4,
                  background: filled===r.slots ? "#2ecc71" : "#f39c12",
                  borderRadius:"50%", width:14, height:14, fontSize:9,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontFamily:"'Nunito',sans-serif", fontWeight:700,
                }}>
                  {filled===r.slots ? "✓" : filled}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize:11, color:"#556", marginBottom:12 }}>
        {round.label} — {round.slots} {round.slots===1?"jogo":"jogos"} · Toque para editar
      </div>

      {Array.from({length: round.slots}, (_, idx) => {
        const match = getBracketMatch(bracket, activeRound, idx);
        const homeTeam = match.home ? TEAMS[match.home] : null;
        const awayTeam = match.away ? TEAMS[match.away] : null;
        const hasScore = match.homeScore !== "" && match.homeScore != null;
        return (
          <div key={idx} onClick={() => openEdit(activeRound, idx)} style={{
            ...S.card, cursor:"pointer",
            border: match.winner ? `1px solid rgba(232,184,75,0.3)` : "1px solid rgba(255,255,255,0.08)",
            background: match.winner ? "rgba(232,184,75,0.04)" : "rgba(255,255,255,0.04)",
            transition:"all 0.15s",
          }}>
            <div style={{ fontSize:11, color:"#445", marginBottom:8, letterSpacing:1 }}>JOGO {idx+1}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:10 }}>
              {/* Home */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {match.home
                  ? <FlagImg code={match.home} size={32} />
                  : <div style={{ width:32, height:22, background:"rgba(255,255,255,0.06)", borderRadius:4 }} />}
                <span style={{ fontSize:13, fontWeight: match.winner==="home" ? 700 : 400, color: match.winner==="home" ? S.gold : "#aab" }}>
                  {homeTeam ? homeTeam.name : "A definir"}
                </span>
              </div>
              {/* Score */}
              <div style={{ textAlign:"center", minWidth:64 }}>
                {hasScore
                  ? <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color: match.winner ? S.gold : S.silver, letterSpacing:2 }}>{match.homeScore} – {match.awayScore}</span>
                  : <span style={{ fontSize:12, color:"#334", letterSpacing:2 }}>VS</span>}
              </div>
              {/* Away */}
              <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
                <span style={{ fontSize:13, fontWeight: match.winner==="away" ? 700 : 400, color: match.winner==="away" ? S.gold : "#aab", textAlign:"right" }}>
                  {awayTeam ? awayTeam.name : "A definir"}
                </span>
                {match.away
                  ? <FlagImg code={match.away} size={32} />
                  : <div style={{ width:32, height:22, background:"rgba(255,255,255,0.06)", borderRadius:4 }} />}
              </div>
            </div>
            {match.winner && (
              <div style={{ marginTop:8, fontSize:11, color:S.gold, textAlign:"center", letterSpacing:0.5 }}>
                ✓ Classificado: {match.winner==="home" ? homeTeam?.name : awayTeam?.name}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, width:"100%", maxWidth:340, margin:0, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontWeight:700, fontSize:14, color:S.gold, marginBottom:14 }}>
              ✏️ {BRACKET_ROUNDS.find(r=>r.id===editing.roundId)?.label} — Jogo {editing.idx+1}
            </div>
            <TeamSearchPicker label="Time A (casa)" value={editData.home||""} onChange={v => setEditData(d=>({...d, home:v}))} />
            <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:"#556", marginBottom:4 }}>Gols Casa</div>
                <input type="number" min="0" max="99" value={editData.homeScore ?? ""} onChange={e => setEditData(d=>({...d, homeScore: e.target.value===""?"":parseInt(e.target.value)}))}
                  style={{ width:"100%", textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", padding:"8px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:24, boxSizing:"border-box", outline:"none" }} />
              </div>
              <span style={{ color:"#445", fontSize:20, paddingTop:20 }}>×</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:"#556", marginBottom:4 }}>Gols Fora</div>
                <input type="number" min="0" max="99" value={editData.awayScore ?? ""} onChange={e => setEditData(d=>({...d, awayScore: e.target.value===""?"":parseInt(e.target.value)}))}
                  style={{ width:"100%", textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", padding:"8px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:24, boxSizing:"border-box", outline:"none" }} />
              </div>
            </div>
            <TeamSearchPicker label="Time B (fora)" value={editData.away||""} onChange={v => setEditData(d=>({...d, away:v}))} />
            {editData.home && editData.away && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, color:"#556", marginBottom:6 }}>Classificado</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["home","away"].map(side => {
                    const code = side==="home" ? editData.home : editData.away;
                    const team = code ? TEAMS[code] : null;
                    return (
                      <button key={side} onClick={() => setEditData(d=>({...d, winner: d.winner===side ? "" : side}))} style={{
                        flex:1, background: editData.winner===side ? S.gold+"33" : "rgba(255,255,255,0.05)",
                        border:`1.5px solid ${editData.winner===side ? S.gold : "rgba(255,255,255,0.1)"}`,
                        borderRadius:8, padding:"8px 4px", cursor:"pointer",
                        color: editData.winner===side ? S.gold : "#778", fontSize:12, fontWeight:700,
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                        {team && <FlagImg code={code} size={18} />}
                        {team ? team.name : (side==="home" ? "Time A" : "Time B")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button onClick={saveEdit} style={{ flex:1, background:S.gold, color:"#080c18", border:"none", borderRadius:8, padding:"11px 0", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:14 }}>Salvar</button>
              <button onClick={clearMatch} style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", color:S.red, borderRadius:8, padding:"11px 14px", cursor:"pointer", fontSize:13 }}>Limpar</button>
              <button onClick={() => setEditing(null)} style={{ background:"rgba(255,255,255,0.06)", color:"#778", border:"none", borderRadius:8, padding:"11px 14px", cursor:"pointer", fontSize:13 }}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSearchPicker({ label, value, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const team = value ? TEAMS[value] : null;
  const filtered = Object.entries(TEAMS).filter(([,t]) => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ fontSize:11, color:"#556", marginBottom:4 }}>{label}</div>
      <button onClick={() => setOpen(o=>!o)} style={{
        width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
        borderRadius:8, color: team ? "#fff" : "#556", padding:"8px 12px", cursor:"pointer",
        fontFamily:"'Nunito',sans-serif", fontSize:13, textAlign:"left",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          {team && <FlagImg code={value} size={20} />}
          {team ? team.name : "Selecionar seleção..."}
        </span>
        <span style={{ color:"#445" }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop:4 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." autoFocus
            style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", padding:"7px 12px", fontSize:12, fontFamily:"'Nunito',sans-serif", boxSizing:"border-box", outline:"none" }} />
          <div style={{ maxHeight:160, overflowY:"auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:3, marginTop:4 }}>
            {value && <button onClick={() => { onChange(""); setOpen(false); setSearch(""); }} style={{ gridColumn:"1/-1", background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:6, color:S.red, padding:"5px 8px", cursor:"pointer", fontSize:11, textAlign:"left" }}>✕ Remover</button>}
            {filtered.map(([code, t]) => (
              <button key={code} onClick={() => { onChange(code); setOpen(false); setSearch(""); }} style={{
                background: value===code ? `${S.gold}22` : "rgba(255,255,255,0.04)",
                border:`1px solid ${value===code ? S.gold : "rgba(255,255,255,0.07)"}`,
                borderRadius:6, color: value===code ? S.gold : "#aab", padding:"5px 8px",
                cursor:"pointer", fontSize:11, fontFamily:"'Nunito',sans-serif",
                display:"flex", alignItems:"center", gap:5, textAlign:"left",
              }}>
                <FlagImg code={code} size={18} />
                <span style={{ fontWeight: value===code ? 700 : 400 }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  CAMPEÃO TAB
// ═══════════════════════════════════════════════════════
function fmtSubmitTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const day = d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", timeZone:"America/Sao_Paulo" });
  const time = d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit", timeZone:"America/Sao_Paulo" });
  return `${day} às ${time}`;
}

function CampeaoTab({ activePid, participants, extraPicks, saveExtraPicks }) {
  const [search, setSearch] = useState("");
  const activePart = participants.find(p => p.id === activePid);
  const myPicks = activePid ? (extraPicks[activePid] || {}) : {};

  // Artilheiro: stored as {value, submittedAt} or legacy plain string
  const rawScorer = myPicks.topScorer;
  const scorerObj = rawScorer && typeof rawScorer === "object" ? rawScorer : (rawScorer ? { value: rawScorer, submittedAt: null } : null);
  const [editingScorer, setEditingScorer] = useState(false);
  const [scorerInput, setScorerInput]     = useState("");

  function pick(field, value) {
    if (!activePid) return;
    const next = { ...extraPicks, [activePid]: { ...(extraPicks[activePid]||{}), [field]: value } };
    saveExtraPicks(next);
  }

  function submitScorer() {
    if (!scorerInput.trim()) return;
    pick("topScorer", { value: scorerInput.trim(), submittedAt: Date.now() });
    setEditingScorer(false);
  }

  function startEditScorer() {
    setScorerInput(scorerObj?.value || "");
    setEditingScorer(true);
  }

  const allTeams = Object.entries(TEAMS);
  const filtered = search ? allTeams.filter(([,t]) => t.name.toLowerCase().includes(search.toLowerCase())) : allTeams;

  if (!activePid) return <EmptyState icon="👆" title="Selecione um participante" subtitle="Escolha quem está apostando no topo da tela." />;

  return (
    <div>
      <SectionTitle icon="🥇" title={`Palpites Especiais — ${activePart?.name}`} />

      {participants.length > 1 && (
        <div style={{ ...S.card, marginBottom:20 }}>
          <div style={{ fontSize:12, color:"#556", letterSpacing:1, fontWeight:700, marginBottom:10 }}>TODOS OS PALPITES DE CAMPEÃO</div>
          {participants.map(p => {
            const champCode = extraPicks[p.id]?.champion;
            const champ = champCode ? TEAMS[champCode] : null;
            return (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <Avatar participant={p} size={28} />
                <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{p.name}</span>
                {champ
                  ? <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13 }}><FlagImg code={champCode} size={20} />{champ.name}</span>
                  : <span style={{ fontSize:12, color:"#445" }}>Não definido</span>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ ...S.card, border:`1px solid rgba(232,184,75,0.25)`, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:28 }}>🏆</span>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Campeão</div>
            <div style={{ fontSize:11, color:"#667" }}>{POINTS_CONFIG.champion} pontos</div>
          </div>
          {myPicks.champion && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, background:"rgba(232,184,75,0.1)", borderRadius:8, padding:"6px 12px" }}>
              <FlagImg code={myPicks.champion} size={28} />
              <span style={{ fontWeight:700, color:S.gold }}>{TEAMS[myPicks.champion].name}</span>
            </div>
          )}
        </div>
        <TeamPicker value={myPicks.champion} onPick={v => pick("champion",v)} highlight={S.gold} search={search} setSearch={setSearch} filtered={filtered} />
      </div>

      <div style={{ ...S.card, border:`1px solid rgba(176,184,200,0.15)`, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:28 }}>🥈</span>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Vice-Campeão</div>
            <div style={{ fontSize:11, color:"#667" }}>{POINTS_CONFIG.runnerUp} pontos</div>
          </div>
          {myPicks.runnerUp && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, background:"rgba(176,184,200,0.08)", borderRadius:8, padding:"6px 12px" }}>
              <FlagImg code={myPicks.runnerUp} size={28} />
              <span style={{ fontWeight:600, color:S.silver }}>{TEAMS[myPicks.runnerUp].name}</span>
            </div>
          )}
        </div>
        <TeamPicker value={myPicks.runnerUp} onPick={v => pick("runnerUp",v)} highlight={S.silver} search={search} setSearch={setSearch} filtered={filtered} />
      </div>

      <div style={{ ...S.card }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:28 }}>⚽</span>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Artilheiro da Copa</div>
            <div style={{ fontSize:11, color:"#667" }}>Campo livre — bônus a definir</div>
          </div>
        </div>

        {scorerObj && !editingScorer ? (
          <div style={{ background:"rgba(46,204,113,0.06)", border:"1px solid rgba(46,204,113,0.2)", borderRadius:8, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#e8eaf0" }}>{scorerObj.value}</div>
              {scorerObj.submittedAt && (
                <div style={{ fontSize:11, color:"#556", marginTop:3 }}>Enviado em {fmtSubmitTime(scorerObj.submittedAt)}</div>
              )}
            </div>
            <button onClick={startEditScorer} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#aab", padding:"6px 14px", cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif", fontWeight:600 }}>
              Editar
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={editingScorer ? scorerInput : ""}
              onChange={e => setScorerInput(e.target.value)}
              onFocus={() => { if (!editingScorer) { setScorerInput(scorerObj?.value || ""); setEditingScorer(true); } }}
              onKeyDown={e => e.key === "Enter" && submitScorer()}
              placeholder="Nome do jogador..."
              style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#fff", padding:"10px 14px", fontSize:14, fontFamily:"'Nunito',sans-serif", outline:"none" }}
            />
            <button
              onClick={submitScorer}
              disabled={!scorerInput.trim()}
              style={{
                background: scorerInput.trim() ? S.gold : "rgba(255,255,255,0.06)",
                color: scorerInput.trim() ? "#080c18" : "#556",
                border:"none", borderRadius:8, padding:"10px 18px", cursor: scorerInput.trim() ? "pointer" : "default",
                fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:14, transition:"all 0.2s", whiteSpace:"nowrap",
              }}
            >
              Enviar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamPicker({ value, onPick, highlight, search, setSearch, filtered }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{
        background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
        borderRadius:8, color:"#aab", padding:"8px 14px", cursor:"pointer",
        fontFamily:"'Nunito',sans-serif", fontSize:13, width:"100%", textAlign:"left",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          {value && <FlagImg code={value} size={20} />}
          {value ? TEAMS[value].name : "Selecionar seleção..."}
        </span>
        <span>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." autoFocus
            style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", padding:"8px 12px", fontSize:13, marginTop:6, fontFamily:"'Nunito',sans-serif", boxSizing:"border-box", outline:"none" }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginTop:6, maxHeight:220, overflowY:"auto" }}>
            {filtered.map(([code, team]) => (
              <button key={code} onClick={() => { onPick(code); setOpen(false); setSearch(""); }} style={{
                background: value===code ? `${highlight}22` : "rgba(255,255,255,0.04)",
                border:`1.5px solid ${value===code ? highlight : "rgba(255,255,255,0.08)"}`,
                borderRadius:6, color: value===code ? highlight : "#aab",
                padding:"6px 10px", cursor:"pointer", textAlign:"left",
                fontSize:12, fontFamily:"'Nunito',sans-serif",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <FlagImg code={code} size={24} />
                <span style={{ fontWeight: value===code ? 700 : 400 }}>{team.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  PARTICIPANTES TAB
// ═══════════════════════════════════════════════════════
function ParticipantesTab({ participants, saveParticipants, activePid, setActivePid }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  function add() {
    if (!name.trim() || participants.length >= 20) return;
    const next = [...participants, { id: Date.now().toString(), name: name.trim(), color }];
    saveParticipants(next);
    if (next.length === 1) setActivePid(next[0].id);
    setName("");
    setColor(COLORS[next.length % COLORS.length]);
  }
  function remove(id) {
    const next = participants.filter(p => p.id !== id);
    saveParticipants(next);
    if (activePid === id) setActivePid(next[0]?.id || null);
  }

  return (
    <div>
      <SectionTitle icon="👥" title="Participantes do Bolão" />
      <div style={{ ...S.card, border:`1px solid rgba(232,184,75,0.2)` }}>
        <div style={{ fontWeight:700, fontSize:14, color:S.gold, marginBottom:12 }}>➕ Adicionar Participante</div>
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==="Enter" && add()} placeholder="Nome do participante..." maxLength={24}
            style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#fff", padding:"10px 14px", fontSize:14, fontFamily:"'Nunito',sans-serif", outline:"none" }} />
          <button onClick={add} disabled={!name.trim()} style={{
            background: name.trim() ? S.gold : "rgba(255,255,255,0.06)",
            color: name.trim() ? "#080c18" : "#556", border:"none",
            borderRadius:8, padding:"10px 20px", cursor: name.trim() ? "pointer" : "default",
            fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:14, transition:"all 0.2s",
          }}>Adicionar</button>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width:28, height:28, borderRadius:"50%", background:c, border: color===c ? "3px solid #fff" : "2px solid transparent", cursor:"pointer", transition:"all 0.15s" }} />
          ))}
        </div>
        {name && (
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10 }}>
            <Avatar participant={{ name, color }} size={36} />
            <span style={{ fontSize:14, fontWeight:600 }}>{name}</span>
          </div>
        )}
      </div>

      {participants.length === 0 ? (
        <EmptyState icon="🧑‍🤝‍🧑" title="Nenhum participante" subtitle="Adicione os participantes do bolão acima." />
      ) : participants.map((p, i) => (
        <div key={p.id} style={{
          ...S.card, display:"flex", alignItems:"center", gap:12,
          border: activePid===p.id ? `1px solid ${p.color}55` : "1px solid rgba(255,255,255,0.06)",
          background: activePid===p.id ? `rgba(${hexToRgb(p.color)},0.06)` : "rgba(255,255,255,0.03)",
        }}>
          <span style={{ color:"#445", fontSize:13, width:20, textAlign:"center" }}>{i+1}</span>
          <Avatar participant={p} size={40} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
            {activePid===p.id && <div style={{ fontSize:11, color:p.color }}>✦ Participante ativo</div>}
          </div>
          <button onClick={() => setActivePid(p.id)} style={{ background: activePid===p.id ? p.color : "rgba(255,255,255,0.07)", border:"none", borderRadius:8, padding:"6px 14px", color: activePid===p.id ? "#fff" : "#778", cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif", fontWeight:600 }}>
            {activePid===p.id ? "Ativo" : "Selecionar"}
          </button>
          <button onClick={() => remove(p.id)} style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:8, padding:"6px 10px", color:S.red, cursor:"pointer", fontSize:12 }}>🗑</button>
        </div>
      ))}

      {participants.length > 0 && (
        <div style={{ marginTop:16, padding:12, background:"rgba(255,255,255,0.03)", borderRadius:8, fontSize:12, color:"#556" }}>
          💡 Selecione um participante no topo antes de ir para a aba Grupos e fazer os palpites.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════
function SectionTitle({ icon, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:S.gold, letterSpacing:1 }}>{title}</span>
    </div>
  );
}
function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"#445" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <div style={{ fontWeight:700, fontSize:16, color:"#667", marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13 }}>{subtitle}</div>
    </div>
  );
}
