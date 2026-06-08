import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";

// ═══════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════
const TEAMS = {
  MEX: { name: "México",          flag: "🇲🇽" },
  RSA: { name: "África do Sul",   flag: "🇿🇦" },
  KOR: { name: "Coreia do Sul",   flag: "🇰🇷" },
  CZE: { name: "Tchéquia",        flag: "🇨🇿" },
  CAN: { name: "Canadá",          flag: "🇨🇦" },
  BIH: { name: "Bósnia-Herz.",    flag: "🇧🇦" },
  QAT: { name: "Catar",           flag: "🇶🇦" },
  SUI: { name: "Suíça",           flag: "🇨🇭" },
  BRA: { name: "Brasil",          flag: "🇧🇷" },
  MAR: { name: "Marrocos",        flag: "🇲🇦" },
  HAI: { name: "Haiti",           flag: "🇭🇹" },
  SCO: { name: "Escócia",         flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "EUA",             flag: "🇺🇸" },
  PAR: { name: "Paraguai",        flag: "🇵🇾" },
  AUS: { name: "Austrália",       flag: "🇦🇺" },
  TUR: { name: "Turquia",         flag: "🇹🇷" },
  GER: { name: "Alemanha",        flag: "🇩🇪" },
  CUW: { name: "Curaçao",         flag: "🇨🇼" },
  CIV: { name: "Costa do Marfim", flag: "🇨🇮" },
  ECU: { name: "Equador",         flag: "🇪🇨" },
  NED: { name: "Holanda",         flag: "🇳🇱" },
  JPN: { name: "Japão",           flag: "🇯🇵" },
  SWE: { name: "Suécia",          flag: "🇸🇪" },
  TUN: { name: "Tunísia",         flag: "🇹🇳" },
  BEL: { name: "Bélgica",         flag: "🇧🇪" },
  EGY: { name: "Egito",           flag: "🇪🇬" },
  IRN: { name: "Irã",             flag: "🇮🇷" },
  NZL: { name: "Nova Zelândia",   flag: "🇳🇿" },
  ESP: { name: "Espanha",         flag: "🇪🇸" },
  CPV: { name: "Cabo Verde",      flag: "🇨🇻" },
  KSA: { name: "Arábia Saudita",  flag: "🇸🇦" },
  URU: { name: "Uruguai",         flag: "🇺🇾" },
  FRA: { name: "França",          flag: "🇫🇷" },
  SEN: { name: "Senegal",         flag: "🇸🇳" },
  IRQ: { name: "Iraque",          flag: "🇮🇶" },
  NOR: { name: "Noruega",         flag: "🇳🇴" },
  ARG: { name: "Argentina",       flag: "🇦🇷" },
  ALG: { name: "Argélia",         flag: "🇩🇿" },
  AUT: { name: "Áustria",         flag: "🇦🇹" },
  JOR: { name: "Jordânia",        flag: "🇯🇴" },
  POR: { name: "Portugal",        flag: "🇵🇹" },
  COD: { name: "Congo RD",        flag: "🇨🇩" },
  UZB: { name: "Uzbequistão",     flag: "🇺🇿" },
  COL: { name: "Colômbia",        flag: "🇨🇴" },
  ENG: { name: "Inglaterra",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { name: "Croácia",         flag: "🇭🇷" },
  GHA: { name: "Gana",            flag: "🇬🇭" },
  PAN: { name: "Panamá",          flag: "🇵🇦" },
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

// Copa 2026 approximate schedule (BRT = UTC-3)
// MD1: Jun 11-16, MD2: Jun 17-22, MD3: Jun 23-28
// 2 groups per day; even groups at 13h/16h BRT, odd at 16h/19h BRT
function getMatchStartTime(groupId, md, matchIdx) {
  const gi = "ABCDEFGHIJKL".indexOf(groupId);
  const pairIdx = Math.floor(gi / 2); // 0-5 → one pair of groups per day
  const isOdd = gi % 2 === 1;
  const dayBase = [11, 17, 23][md - 1];
  const day = dayBase + pairIdx;
  let hourBRT;
  if (md === 3) {
    // MD3: both matches play simultaneously
    hourBRT = isOdd ? 16 : 13;
  } else {
    hourBRT = isOdd ? (matchIdx === 0 ? 16 : 19) : (matchIdx === 0 ? 13 : 16);
  }
  return Date.UTC(2026, 5, day, hourBRT + 3, 0, 0); // UTC
}

function genMatches(g) {
  const [t0,t1,t2,t3] = g.teams;
  const st = (md, mi) => getMatchStartTime(g.id, md, mi);
  return [
    { id:`${g.id}1`, group:g.id, md:1, home:t0, away:t1, startTime:st(1,0) },
    { id:`${g.id}2`, group:g.id, md:1, home:t2, away:t3, startTime:st(1,1) },
    { id:`${g.id}3`, group:g.id, md:2, home:t0, away:t2, startTime:st(2,0) },
    { id:`${g.id}4`, group:g.id, md:2, home:t1, away:t3, startTime:st(2,1) },
    { id:`${g.id}5`, group:g.id, md:3, home:t0, away:t3, startTime:st(3,0) },
    { id:`${g.id}6`, group:g.id, md:3, home:t1, away:t2, startTime:st(3,0) },
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

const POINTS_CONFIG = { result:3, exact:2, champion:15, runnerUp:8 };

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
    const r = ref(db, path);
    const unsub = onValue(r, snap => {
      const data = snap.val();
      setValue(data !== null ? data : defaultValue);
      setReady(true);
    });
    return () => unsub();
  }, [path]); // eslint-disable-line

  async function save(newValue) {
    setValue(newValue);
    await set(ref(db, path), newValue);
  }
  return [value, save, ready];
}

// ═══════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════
export default function BolaoApp() {
  const [tab, setTab]           = useState("grupos");
  const [activePid, setActivePid] = useState(null);
  const [activeGroup, setActiveGroup] = useState("A");
  const [liveScores, setLiveScores]   = useState({});
  const [apiStatus, setApiStatus]     = useState("idle");
  const [now, setNow] = useState(Date.now());

  const [participants, saveParticipants, p_ready]  = useFirebaseValue("bolao/participants", []);
  const [predictions,  savePredictions,  pr_ready] = useFirebaseValue("bolao/predictions", {});
  const [extraPicks,   saveExtraPicks,   ex_ready] = useFirebaseValue("bolao/extraPicks", {});
  const [bracket,      saveBracket,      br_ready] = useFirebaseValue("bolao/bracket", {});

  const loaded = p_ready && pr_ready && ex_ready && br_ready;

  // Keep `now` up to date for live locking
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
    if (p_ready && Array.isArray(participants) && participants.length > 0 && !activePid) {
      setActivePid(participants[0].id);
    }
  }, [p_ready, participants]); // eslint-disable-line

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

  const parts = Array.isArray(participants) ? participants : [];
  const ranking = parts
    .map(p => ({ ...p, ...calcScore(p.id), preds: Object.keys(predictions[p.id]||{}).length }))
    .sort((a,b) => b.pts - a.pts || b.correct - a.correct || b.preds - a.preds);

  const activePart = parts.find(p => p.id === activePid);

  if (!loaded) {
    return (
      <div style={{ minHeight:"100vh", background:S.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:S.gold, fontSize:48 }}>🏆</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:"#e8eaf0", fontFamily:"'Nunito',sans-serif" }}>
      <Header activePart={activePart} participants={parts} activePid={activePid} setActivePid={setActivePid} apiStatus={apiStatus} fetchLiveScores={fetchLiveScores} />
      <TabBar tab={tab} setTab={setTab} />
      <main style={{ maxWidth:820, margin:"0 auto", padding:"20px 16px 80px" }}>
        {tab==="ranking"       && <RankingTab ranking={ranking} participants={parts} />}
        {tab==="grupos"        && <GruposTab activeGroup={activeGroup} setActiveGroup={setActiveGroup} activePid={activePid} participants={parts} predictions={predictions} liveScores={liveScores} savePredictions={savePredictions} now={now} />}
        {tab==="chaveamento"   && <BracketTab bracket={bracket} saveBracket={saveBracket} />}
        {tab==="campeao"       && <CampeaoTab activePid={activePid} participants={parts} extraPicks={extraPicks} saveExtraPicks={saveExtraPicks} />}
        {tab==="participantes" && <ParticipantesTab participants={parts} saveParticipants={saveParticipants} activePid={activePid} setActivePid={setActivePid} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════════════
function Header({ activePart, participants, activePid, setActivePid, apiStatus, fetchLiveScores }) {
  return (
    <header style={{
      background:"linear-gradient(90deg,#0b101f 0%,#10192e 100%)",
      borderBottom:`2px solid ${S.gold}`, padding:"0 20px",
    }}>
      <div style={{ maxWidth:820, margin:"0 auto", display:"flex", alignItems:"center", gap:12, minHeight:64 }}>
        <div style={{ fontSize:36, lineHeight:1 }}>🏆</div>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:S.gold, letterSpacing:3, lineHeight:1 }}>BOLÃO COPA 2026</div>
          <div style={{ fontSize:10, color:"#556", letterSpacing:2, marginTop:2 }}>EUA · CANADÁ · MÉXICO</div>
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
//  RANKING TAB
// ═══════════════════════════════════════════════════════
function RankingTab({ ranking, participants }) {
  const medals = ["🥇","🥈","🥉"];
  if (participants.length === 0) {
    return <EmptyState icon="👥" title="Nenhum participante ainda" subtitle='Vá em "Participantes" para adicionar os jogadores do bolão.' />;
  }
  return (
    <div>
      <SectionTitle icon="🏅" title="Classificação Geral" />
      <div style={{ ...S.card, background:"linear-gradient(135deg,rgba(232,184,75,0.08),rgba(232,184,75,0.02))", border:`1px solid rgba(232,184,75,0.2)`, marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 80px 80px 80px", gap:8, fontSize:11, color:"#556", fontWeight:700, letterSpacing:1, padding:"0 4px 8px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <span>#</span><span>PARTICIPANTE</span><span style={{textAlign:"center"}}>PONTOS</span><span style={{textAlign:"center"}}>ACERTOS</span><span style={{textAlign:"center"}}>PALPITES</span>
        </div>
        {ranking.map((p, i) => (
          <div key={p.id} style={{
            display:"grid", gridTemplateColumns:"40px 1fr 80px 80px 80px", gap:8,
            alignItems:"center", padding:"10px 4px",
            borderBottom: i < ranking.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            background: i===0 ? "rgba(232,184,75,0.04)" : "none",
          }}>
            <span style={{ fontSize:18, textAlign:"center" }}>{medals[i] || `${i+1}`}</span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Avatar participant={p} size={32} />
              <span style={{ fontWeight:700, fontSize:14 }}>{p.name}</span>
            </div>
            <div style={{ textAlign:"center" }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:i===0?S.gold:"#e8eaf0" }}>{p.pts}</span>
              <span style={{ fontSize:10, color:"#556", marginLeft:2 }}>pts</span>
            </div>
            <div style={{ textAlign:"center", fontSize:13, color:"#8a9" }}>{p.correct} ✓</div>
            <div style={{ textAlign:"center", fontSize:13, color:"#667" }}>{p.preds}/{ALL_MATCHES.length}</div>
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
            <span style={{ fontSize:22 }}>{TEAMS[code].flag}</span>
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
  const [homeInput, setHomeInput] = useState(pred?.home ?? "");
  const [awayInput, setAwayInput] = useState(pred?.away ?? "");

  useEffect(() => {
    setHomeInput(pred?.home ?? "");
    setAwayInput(pred?.away ?? "");
  }, [pred, match.id]);

  const isLive  = liveScore?.status === "live";
  const isFinal = liveScore?.status === "final";
  const isLocked = now >= match.startTime; // trava quando o jogo começa

  const actualResult = (isFinal||isLive)
    ? (liveScore.homeScore > liveScore.awayScore ? "H" : liveScore.homeScore < liveScore.awayScore ? "A" : "D")
    : null;

  const canEdit = !disabled && !isLocked;

  function handleResult(r) {
    if (!canEdit) return;
    onPred(r, homeInput !== "" ? parseInt(homeInput) : undefined, awayInput !== "" ? parseInt(awayInput) : undefined);
  }
  function handleScore(who, val) {
    const v = val === "" ? "" : Math.max(0, parseInt(val)||0);
    if (who==="home") {
      setHomeInput(v);
      if (pred?.result) onPred(pred.result, v !== "" ? v : undefined, awayInput !== "" ? parseInt(awayInput) : undefined);
    } else {
      setAwayInput(v);
      if (pred?.result) onPred(pred.result, homeInput !== "" ? parseInt(homeInput) : undefined, v !== "" ? v : undefined);
    }
  }

  const otherPreds = participants.filter(p => predictions[p.id]?.[match.id]).map(p => ({ ...p, pred: predictions[p.id][match.id] }));

  return (
    <div style={{
      ...S.card,
      border: pred ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.05)",
      background: isLive ? "rgba(46,204,113,0.05)" : isFinal ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
      position:"relative", overflow:"hidden",
    }}>
      {isLive && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#2ecc71,#1abc9c)" }} />}

      {/* Match time / status */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
        {isLive ? (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:10, background:"rgba(46,204,113,0.2)", color:"#2ecc71" }}>
            🔴 AO VIVO {liveScore.displayClock}
          </span>
        ) : isFinal ? (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:10, background:"rgba(255,255,255,0.08)", color:"#556" }}>⚫ ENCERRADO</span>
        ) : isLocked ? (
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:10, background:"rgba(231,76,60,0.12)", color:"#e74c3c" }}>🔒 APOSTAS ENCERRADAS</span>
        ) : (
          <span style={{ fontSize:10, color:"#667", padding:"3px 8px", borderRadius:10, background:"rgba(255,255,255,0.04)", letterSpacing:0.5 }}>
            ⏱ {fmtTime(match.startTime)}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:12, marginBottom:14 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, lineHeight:1, marginBottom:6 }}>{home.flag}</div>
          <div style={{ fontSize:13, fontWeight:700, lineHeight:1.2 }}>{home.name}</div>
        </div>

        <div style={{ textAlign:"center", minWidth:90 }}>
          {(isLive||isFinal) ? (
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:isLive?S.green:S.silver, letterSpacing:2 }}>
              {liveScore.homeScore} – {liveScore.awayScore}
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <input type="number" min="0" max="99" value={homeInput} onChange={e => handleScore("home", e.target.value)} disabled={!canEdit}
                style={{ width:40, textAlign:"center", background: canEdit ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border:`1px solid ${canEdit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius:6, color: canEdit ? "#fff" : "#556", padding:"6px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:22, outline:"none" }} />
              <span style={{ color:"#445", fontSize:18 }}>–</span>
              <input type="number" min="0" max="99" value={awayInput} onChange={e => handleScore("away", e.target.value)} disabled={!canEdit}
                style={{ width:40, textAlign:"center", background: canEdit ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border:`1px solid ${canEdit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius:6, color: canEdit ? "#fff" : "#556", padding:"6px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:22, outline:"none" }} />
            </div>
          )}
          {!isLive && !isFinal && (
            <div style={{ fontSize:10, color:"#445", marginTop:4, letterSpacing:1 }}>PLACAR</div>
          )}
        </div>

        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, lineHeight:1, marginBottom:6 }}>{away.flag}</div>
          <div style={{ fontSize:13, fontWeight:700, lineHeight:1.2 }}>{away.name}</div>
        </div>
      </div>

      {/* Result buttons */}
      {!isLocked && !isFinal && !isLive ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[
            { code:"H", label:`Vitória ${home.flag}`, color:"#3498db" },
            { code:"D", label:"Empate ⚖️",            color:"#f39c12" },
            { code:"A", label:`Vitória ${away.flag}`, color:"#e74c3c" },
          ].map(opt => {
            const sel = pred?.result === opt.code;
            return (
              <button key={opt.code} onClick={() => handleResult(opt.code)} disabled={!canEdit} style={{
                background: sel ? opt.color : "rgba(255,255,255,0.05)",
                border:`1.5px solid ${sel ? opt.color : "rgba(255,255,255,0.1)"}`,
                borderRadius:8, padding:"9px 4px", cursor: canEdit ? "pointer" : "default",
                color: sel ? "#fff" : "#667", fontSize:11, fontWeight:700, letterSpacing:0.3, transition:"all 0.15s",
              }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : (isFinal||isLive) ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[
            { code:"H", label:`Vitória ${home.flag}`, color:"#3498db" },
            { code:"D", label:"Empate ⚖️",            color:"#f39c12" },
            { code:"A", label:`Vitória ${away.flag}`, color:"#e74c3c" },
          ].map(opt => {
            const sel = pred?.result === opt.code;
            const correct = actualResult === opt.code;
            const wrong = sel && !correct;
            return (
              <button key={opt.code} disabled style={{
                background: sel ? opt.color : correct ? `${opt.color}22` : "rgba(255,255,255,0.04)",
                border:`1.5px solid ${sel || correct ? opt.color : "rgba(255,255,255,0.08)"}`,
                borderRadius:8, padding:"9px 4px", cursor:"default",
                color: sel ? "#fff" : correct ? opt.color : "#445", fontSize:11, fontWeight:700, letterSpacing:0.3, position:"relative",
              }}>
                {opt.label}
                {wrong   && <span style={{position:"absolute",top:2,right:5,fontSize:10}}>✗</span>}
                {sel && correct && <span style={{position:"absolute",top:2,right:5,fontSize:10,color:"#2ecc71"}}>✓</span>}
              </button>
            );
          })}
        </div>
      ) : pred?.result ? (
        // Locked with a prediction made
        <div style={{ display:"flex", justifyContent:"center" }}>
          <span style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"8px 20px", fontSize:12, color:"#778" }}>
            Palpite registrado: {pred.result==="H" ? `${home.flag} ${home.name}` : pred.result==="A" ? `${away.flag} ${away.name}` : "Empate ⚖️"}
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
            <div key={p.id} title={`${p.name}: ${p.pred.result==="H"?home.name:p.pred.result==="A"?away.name:"Empate"}${p.pred.home!==undefined?` (${p.pred.home}–${p.pred.away})`:""}`}
              style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.05)", borderRadius:20, padding:"3px 8px", fontSize:11, borderLeft:`3px solid ${p.color}` }}>
              <span style={{ fontWeight:700, color:p.color, fontSize:10 }}>{initials(p.name)}</span>
              <span style={{ color:"#778" }}>
                {p.pred.result==="H"?home.flag:p.pred.result==="A"?away.flag:"⚖️"}
                {p.pred.home!==undefined&&` ${p.pred.home}–${p.pred.away}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  BRACKET TAB
// ═══════════════════════════════════════════════════════
const BK_H    = 768; // bracket body height px (divisible by 16)
const BK_COL  = 158; // column width px
const BK_GAP  = 10;  // gap between columns px
const BK_CARD = 44;  // match card height px
const BK_LABEL = 30; // round label height px

function getBracketMatch(bracket, roundId, idx) {
  return bracket?.[roundId]?.[idx] || emptyBracketMatch();
}

function BracketTab({ bracket, saveBracket }) {
  const [editing, setEditing] = useState(null); // { roundId, idx }
  const [editData, setEditData] = useState({});

  function startEdit(roundId, idx) {
    setEditData({ ...getBracketMatch(bracket, roundId, idx) });
    setEditing({ roundId, idx });
  }

  function saveEdit() {
    const next = {
      ...bracket,
      [editing.roundId]: { ...(bracket[editing.roundId]||{}), [editing.idx]: editData },
    };
    saveBracket(next);
    setEditing(null);
  }

  function clearMatch() {
    const next = {
      ...bracket,
      [editing.roundId]: { ...(bracket[editing.roundId]||{}), [editing.idx]: emptyBracketMatch() },
    };
    saveBracket(next);
    setEditing(null);
  }

  const totalWidth = BRACKET_ROUNDS.length * (BK_COL + BK_GAP);

  return (
    <div>
      <SectionTitle icon="🏆" title="Chaveamento" />
      <div style={{ fontSize:12, color:"#556", marginBottom:12 }}>Toque em qualquer jogo para atualizar os times e o placar.</div>

      <div style={{ ...S.card, padding:8, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        <div style={{ position:"relative", height:BK_H + BK_LABEL, width:totalWidth, minWidth:totalWidth }}>
          {BRACKET_ROUNDS.map((round, rIdx) => {
            const x = rIdx * (BK_COL + BK_GAP);
            const slotH = BK_H / round.slots;
            return (
              <div key={round.id} style={{ position:"absolute", left:x, top:0, width:BK_COL }}>
                <div style={{ height:BK_LABEL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:S.gold, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>
                  {round.label}
                </div>
                {Array.from({ length:round.slots }, (_,idx) => {
                  const match = getBracketMatch(bracket, round.id, idx);
                  const top = BK_LABEL + idx * slotH + (slotH - BK_CARD) / 2;
                  return (
                    <div key={idx} style={{ position:"absolute", top, left:0, right:0 }} onClick={() => startEdit(round.id, idx)}>
                      <BracketCard match={match} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign:"center", fontSize:10, color:"#334", marginTop:4, paddingTop:4, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          ← deslize para ver o chaveamento completo →
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, width:"100%", maxWidth:340, margin:0, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontWeight:700, fontSize:14, color:S.gold, marginBottom:14 }}>
              ✏️ {BRACKET_ROUNDS.find(r=>r.id===editing.roundId)?.label} — Jogo {editing.idx+1}
            </div>

            <TeamSearchPicker label="Time A (casa)" value={editData.home||""} onChange={v => setEditData(d=>({...d, home:v, winner: d.winner==="home" && !v ? "" : d.winner}))} />

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

            <TeamSearchPicker label="Time B (fora)" value={editData.away||""} onChange={v => setEditData(d=>({...d, away:v, winner: d.winner==="away" && !v ? "" : d.winner}))} />

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
                      }}>
                        {team ? `${team.flag} ${team.name}` : side==="home" ? "Time A" : "Time B"}
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

function BracketCard({ match }) {
  const home = match.home ? TEAMS[match.home] : null;
  const away = match.away ? TEAMS[match.away] : null;
  const hasResult = match.homeScore !== "" && match.homeScore !== null && match.homeScore !== undefined;

  return (
    <div style={{
      background: match.winner ? "rgba(232,184,75,0.06)" : "rgba(255,255,255,0.05)",
      border:`1px solid ${match.winner ? "rgba(232,184,75,0.25)" : "rgba(255,255,255,0.1)"}`,
      borderRadius:7, height:BK_CARD, overflow:"hidden", cursor:"pointer",
      display:"flex", flexDirection:"column", justifyContent:"space-around",
      padding:"3px 7px", transition:"all 0.15s",
    }}>
      <BracketTeamRow team={home} score={hasResult ? match.homeScore : null} isWinner={match.winner==="home"} />
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"0 -7px" }} />
      <BracketTeamRow team={away} score={hasResult ? match.awayScore : null} isWinner={match.winner==="away"} />
    </div>
  );
}

function BracketTeamRow({ team, score, isWinner }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <span style={{ fontSize:14, lineHeight:1 }}>{team ? team.flag : "🏳️"}</span>
      <span style={{ fontSize:9, flex:1, color: isWinner ? "#fff" : "#667", fontWeight: isWinner ? 700 : 400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {team ? team.name : "A definir"}
      </span>
      {score !== null && score !== undefined && (
        <span style={{ fontSize:13, fontFamily:"'Bebas Neue',sans-serif", color: isWinner ? S.gold : "#556", minWidth:14, textAlign:"right" }}>
          {score}
        </span>
      )}
    </div>
  );
}

function TeamSearchPicker({ label, value, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const team = value ? TEAMS[value] : null;
  const filtered = Object.entries(TEAMS).filter(([,t]) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ fontSize:11, color:"#556", marginBottom:4 }}>{label}</div>
      <button onClick={() => setOpen(o=>!o)} style={{
        width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
        borderRadius:8, color: team ? "#fff" : "#556", padding:"8px 12px", cursor:"pointer",
        fontFamily:"'Nunito',sans-serif", fontSize:13, textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span>{team ? `${team.flag} ${team.name}` : "Selecionar seleção..."}</span>
        <span style={{ color:"#445" }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop:4 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." autoFocus
            style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", padding:"7px 12px", fontSize:12, fontFamily:"'Nunito',sans-serif", boxSizing:"border-box", outline:"none" }} />
          <div style={{ maxHeight:160, overflowY:"auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:3, marginTop:4 }}>
            {value && (
              <button onClick={() => { onChange(""); setOpen(false); setSearch(""); }} style={{ gridColumn:"1/-1", background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:6, color:S.red, padding:"5px 8px", cursor:"pointer", fontSize:11, textAlign:"left" }}>
                ✕ Remover seleção
              </button>
            )}
            {filtered.map(([code, t]) => (
              <button key={code} onClick={() => { onChange(code); setOpen(false); setSearch(""); }} style={{
                background: value===code ? `${S.gold}22` : "rgba(255,255,255,0.04)",
                border:`1px solid ${value===code ? S.gold : "rgba(255,255,255,0.07)"}`,
                borderRadius:6, color: value===code ? S.gold : "#aab", padding:"5px 8px",
                cursor:"pointer", fontSize:11, fontFamily:"'Nunito',sans-serif",
                display:"flex", alignItems:"center", gap:5, textAlign:"left",
              }}>
                <span style={{ fontSize:16 }}>{t.flag}</span>
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
function CampeaoTab({ activePid, participants, extraPicks, saveExtraPicks }) {
  const [search, setSearch] = useState("");
  const activePart = participants.find(p => p.id === activePid);
  const myPicks = activePid ? (extraPicks[activePid] || {}) : {};

  function pick(field, value) {
    if (!activePid) return;
    const next = { ...extraPicks, [activePid]: { ...(extraPicks[activePid]||{}), [field]: value } };
    saveExtraPicks(next);
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
            const champ = extraPicks[p.id]?.champion ? TEAMS[extraPicks[p.id].champion] : null;
            return (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <Avatar participant={p} size={28} />
                <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{p.name}</span>
                {champ
                  ? <span style={{ fontSize:15 }}>{champ.flag} {champ.name}</span>
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
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, background:"rgba(232,184,75,0.1)", borderRadius:8, padding:"6px 12px" }}>
              <span style={{ fontSize:24 }}>{TEAMS[myPicks.champion].flag}</span>
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
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, background:"rgba(176,184,200,0.08)", borderRadius:8, padding:"6px 12px" }}>
              <span style={{ fontSize:24 }}>{TEAMS[myPicks.runnerUp].flag}</span>
              <span style={{ fontWeight:600, color:S.silver }}>{TEAMS[myPicks.runnerUp].name}</span>
            </div>
          )}
        </div>
        <TeamPicker value={myPicks.runnerUp} onPick={v => pick("runnerUp",v)} highlight={S.silver} search={search} setSearch={setSearch} filtered={filtered} />
      </div>

      <div style={{ ...S.card }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <span style={{ fontSize:28 }}>⚽</span>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Artilheiro da Copa</div>
            <div style={{ fontSize:11, color:"#667" }}>Campo livre — bônus a definir</div>
          </div>
        </div>
        <input value={myPicks.topScorer||""} onChange={e => pick("topScorer",e.target.value)} placeholder="Nome do jogador..."
          style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#fff", padding:"10px 14px", fontSize:14, fontFamily:"'Nunito',sans-serif", boxSizing:"border-box", outline:"none" }} />
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
      }}>
        {value ? `${TEAMS[value].flag} ${TEAMS[value].name}` : "Selecionar seleção..."}
        <span style={{ float:"right" }}>{open?"▲":"▼"}</span>
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
                <span style={{ fontSize:20 }}>{team.flag}</span>
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
