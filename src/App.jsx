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

function genMatches(g) {
  const [t0,t1,t2,t3] = g.teams;
  return [
    { id:`${g.id}1`, group:g.id, md:1, home:t0, away:t1 },
    { id:`${g.id}2`, group:g.id, md:1, home:t2, away:t3 },
    { id:`${g.id}3`, group:g.id, md:2, home:t0, away:t2 },
    { id:`${g.id}4`, group:g.id, md:2, home:t1, away:t3 },
    { id:`${g.id}5`, group:g.id, md:3, home:t0, away:t3 },
    { id:`${g.id}6`, group:g.id, md:3, home:t1, away:t2 },
  ];
}
const ALL_MATCHES = GROUPS_RAW.flatMap(genMatches);

const COLORS = [
  "#e74c3c","#3498db","#2ecc71","#f39c12",
  "#9b59b6","#1abc9c","#e67e22","#e91e63",
  "#00bcd4","#ff5722","#607d8b","#795548",
];

const POINTS_CONFIG = { result: 3, exact: 2, champion: 15, runnerUp: 8 };

// ═══════════════════════════════════════════════════════
//  HELPERS / STYLES
// ═══════════════════════════════════════════════════════
const S = {
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
  },
  gold: "#e8b84b",
  silver: "#b0b8c8",
  green: "#2ecc71",
  red: "#e74c3c",
  bg: "#080c18",
};

function initials(name) {
  return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function Avatar({ participant, size=32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: participant.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff",
      flexShrink: 0,
    }}>
      {initials(participant.name)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  FIREBASE HOOKS
// ═══════════════════════════════════════════════════════
function useFirebaseValue(path, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const r = ref(db, path);
    const unsub = onValue(r, (snap) => {
      const data = snap.val();
      setValue(data !== null ? data : defaultValue);
      setReady(true);
    });
    return () => unsub();
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [tab, setTab] = useState("grupos");
  const [activePid, setActivePid] = useState(null);
  const [activeGroup, setActiveGroup] = useState("A");
  const [liveScores, setLiveScores] = useState({});
  const [apiStatus, setApiStatus] = useState("idle");

  const [participants, saveParticipants, p_ready] = useFirebaseValue("bolao/participants", []);
  const [predictions,  savePredictions,  pr_ready] = useFirebaseValue("bolao/predictions", {});
  const [extraPicks,   saveExtraPicks,   ex_ready]  = useFirebaseValue("bolao/extraPicks", {});

  const loaded = p_ready && pr_ready && ex_ready;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (p_ready && participants.length > 0 && !activePid) {
      setActivePid(participants[0].id);
    }
  }, [p_ready, participants]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 60000);
    return () => clearInterval(interval);
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
        const status = comp.status?.type?.name || "";
        const completed = comp.status?.type?.completed;
        const home = comp.competitors?.find(c => c.homeAway === "home");
        const away = comp.competitors?.find(c => c.homeAway === "away");
        if (home && away) {
          const key = `${home.team.abbreviation}vs${away.team.abbreviation}`;
          scores[key] = {
            homeScore: parseInt(home.score) || 0,
            awayScore: parseInt(away.score) || 0,
            homeAbbr: home.team.abbreviation,
            awayAbbr: away.team.abbreviation,
            status: completed ? "final" : status.includes("PROGRESS") ? "live" : "scheduled",
            displayClock: comp.status?.displayClock || "",
          };
        }
      });
      setLiveScores(scores);
      setApiStatus("ok");
    } catch {
      setApiStatus("error");
    }
  }

  // ── Scoring ──
  function calcScore(pid) {
    let pts = 0, correct = 0, exact = 0;
    const preds = predictions[pid] || {};
    ALL_MATCHES.forEach(m => {
      const pred = preds[m.id];
      if (!pred) return;
      const key = `${m.home}vs${m.away}`;
      const live = liveScores[key];
      if (!live || live.status !== "final") return;
      const actual = live.homeScore > live.awayScore ? "H"
                   : live.homeScore < live.awayScore ? "A" : "D";
      if (pred.result === actual) {
        pts += POINTS_CONFIG.result; correct++;
        if (String(pred.home) === String(live.homeScore) && String(pred.away) === String(live.awayScore)) {
          pts += POINTS_CONFIG.exact; exact++;
        }
      }
    });
    return { pts, correct, exact };
  }

  const ranking = Array.isArray(participants)
    ? participants
        .map(p => ({ ...p, ...calcScore(p.id), preds: Object.keys(predictions[p.id]||{}).length }))
        .sort((a,b) => b.pts - a.pts || b.correct - a.correct || b.preds - a.preds)
    : [];

  const activePart = Array.isArray(participants) ? participants.find(p => p.id === activePid) : null;

  if (!loaded) {
    return (
      <div style={{ minHeight:"100vh", background:S.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color: S.gold, fontSize: 48 }}>🏆</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:"#e8eaf0", fontFamily:"'Nunito', sans-serif" }}>
      <Header
        activePart={activePart}
        participants={Array.isArray(participants) ? participants : []}
        activePid={activePid}
        setActivePid={setActivePid}
        apiStatus={apiStatus}
        fetchLiveScores={fetchLiveScores}
      />
      <TabBar tab={tab} setTab={setTab} />
      <main style={{ maxWidth:820, margin:"0 auto", padding:"20px 16px 80px" }}>
        {tab==="ranking"  && <RankingTab ranking={ranking} participants={Array.isArray(participants)?participants:[]} predictions={predictions} />}
        {tab==="grupos"   && <GruposTab activeGroup={activeGroup} setActiveGroup={setActiveGroup} activePid={activePid} participants={Array.isArray(participants)?participants:[]} predictions={predictions} liveScores={liveScores} savePredictions={savePredictions} />}
        {tab==="campeao"  && <CampeaoTab activePid={activePid} participants={Array.isArray(participants)?participants:[]} extraPicks={extraPicks} saveExtraPicks={saveExtraPicks} />}
        {tab==="participantes" && <ParticipantesTab participants={Array.isArray(participants)?participants:[]} saveParticipants={saveParticipants} activePid={activePid} setActivePid={setActivePid} />}
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
      background: "linear-gradient(90deg, #0b101f 0%, #10192e 100%)",
      borderBottom: `2px solid ${S.gold}`,
      padding: "0 20px",
    }}>
      <div style={{ maxWidth:820, margin:"0 auto", display:"flex", alignItems:"center", gap:12, minHeight:64 }}>
        <div style={{ fontSize:36, lineHeight:1 }}>🏆</div>
        <div>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:22, color:S.gold, letterSpacing:3, lineHeight:1 }}>BOLÃO COPA 2026</div>
          <div style={{ fontSize:10, color:"#556", letterSpacing:2, marginTop:2 }}>EUA · CANADÁ · MÉXICO</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <button
            onClick={fetchLiveScores}
            title={apiStatus==="ok" ? "Placar ao vivo ativo" : apiStatus==="fetching" ? "Buscando..." : "Clique para tentar novamente"}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4, fontSize:16, opacity:0.7 }}
          >
            {apiStatus==="fetching" ? "🔄" : apiStatus==="ok" ? "🟢" : apiStatus==="error" ? "🔴" : "⚪"}
          </button>
          {participants.map(p => (
            <button key={p.id} onClick={() => setActivePid(p.id)} style={{
              background: activePid===p.id ? p.color : "rgba(255,255,255,0.06)",
              border: `1.5px solid ${activePid===p.id ? p.color : "rgba(255,255,255,0.15)"}`,
              color: "#fff", borderRadius:20, padding:"4px 12px",
              cursor:"pointer", fontSize:12, fontFamily:"'Nunito',sans-serif",
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
    { id:"campeao",       icon:"🥇", label:"Campeão" },
    { id:"participantes", icon:"👥", label:"Participantes" },
  ];
  return (
    <nav style={{
      background:"#0b101f", borderBottom:"1px solid rgba(255,255,255,0.07)",
      display:"flex", overflowX:"auto", position:"sticky", top:0, zIndex:10,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          background:"none", border:"none",
          color: tab===t.id ? S.gold : "#667",
          borderBottom: tab===t.id ? `3px solid ${S.gold}` : "3px solid transparent",
          padding:"12px 20px", cursor:"pointer",
          fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13,
          letterSpacing:0.5, whiteSpace:"nowrap", transition:"all 0.2s",
          display:"flex", alignItems:"center", gap:6,
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
function RankingTab({ ranking, participants, predictions }) {
  const medals = ["🥇","🥈","🥉"];
  const totalMatches = ALL_MATCHES.length;

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
            <div style={{ textAlign:"center", fontSize:13, color:"#667" }}>{p.preds}/{totalMatches}</div>
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
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#aab" }}>{r.label}</div>
            </div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:S.gold }}>{r.pts} <span style={{fontSize:12}}>pts</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  GRUPOS TAB
// ═══════════════════════════════════════════════════════
function GruposTab({ activeGroup, setActiveGroup, activePid, participants, predictions, liveScores, savePredictions }) {
  const groupMatches = ALL_MATCHES.filter(m => m.group === activeGroup);
  const groupTeams = GROUPS_RAW.find(g => g.id === activeGroup)?.teams || [];
  const activePart = participants.find(p => p.id === activePid);

  function setPred(matchId, result, home, away) {
    if (!activePid) return;
    const next = {
      ...predictions,
      [activePid]: { ...(predictions[activePid]||{}), [matchId]: { result, home, away } }
    };
    savePredictions(next);
  }

  const totalPreds = activePid ? Object.keys(predictions[activePid]||{}).length : 0;
  const pct = Math.round(totalPreds / ALL_MATCHES.length * 100);

  return (
    <div>
      {!activePid && (
        <div style={{ ...S.card, background:"rgba(232,184,75,0.08)", border:`1px solid rgba(232,184,75,0.3)`, marginBottom:16, textAlign:"center", padding:20 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>👆</div>
          <div style={{ color:S.gold, fontWeight:700 }}>Selecione um participante no topo para fazer palpites</div>
        </div>
      )}

      {activePart && (
        <div style={{ ...S.card, display:"flex", alignItems:"center", gap:12, marginBottom:16, background:`linear-gradient(90deg, ${activePart.color}18, transparent)`, border:`1px solid ${activePart.color}44` }}>
          <Avatar participant={activePart} size={38} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Palpitando como: <span style={{ color:activePart.color }}>{activePart.name}</span></div>
            <div style={{ fontSize:11, color:"#667", marginTop:2 }}>
              {totalPreds}/{ALL_MATCHES.length} jogos preenchidos
              <span style={{ display:"inline-block", marginLeft:8, background:"rgba(255,255,255,0.08)", borderRadius:10, height:6, width:80, verticalAlign:"middle", overflow:"hidden" }}>
                <span style={{ display:"block", height:"100%", width:`${pct}%`, background:activePart.color, transition:"width 0.4s" }} />
              </span>
            </div>
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:activePart.color }}>{pct}%</div>
        </div>
      )}

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {GROUPS_RAW.map(g => {
          const groupPreds = ALL_MATCHES.filter(m => m.group===g.id && predictions[activePid]?.[m.id]).length;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)} style={{
              background: activeGroup===g.id ? S.gold : "rgba(255,255,255,0.06)",
              color: activeGroup===g.id ? "#080c18" : "#aab",
              border: "none", borderRadius:8, padding:"8px 14px",
              cursor:"pointer", fontFamily:"'Bebas Neue',sans-serif", fontSize:16,
              fontWeight:700, letterSpacing:1, position:"relative", transition:"all 0.2s",
              minWidth:48,
            }}>
              {g.id}
              {activePid && groupPreds > 0 && (
                <span style={{
                  position:"absolute", top:-4, right:-4,
                  background: groupPreds===6 ? "#2ecc71" : "#f39c12",
                  borderRadius:"50%", width:14, height:14,
                  fontSize:9, display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontFamily:"'Nunito',sans-serif", fontWeight:700,
                }}>
                  {groupPreds===6?"✓":groupPreds}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ ...S.card, marginBottom:8, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:S.gold, marginRight:4 }}>GRUPO {activeGroup}</span>
        {groupTeams.map(code => (
          <span key={code} style={{ background:"rgba(255,255,255,0.07)", borderRadius:20, padding:"4px 10px", fontSize:13, display:"flex", alignItems:"center", gap:5 }}>
            {TEAMS[code].flag} {TEAMS[code].name}
          </span>
        ))}
      </div>

      {[1,2,3].map(md => (
        <div key={md}>
          <div style={{ fontSize:11, color:"#556", letterSpacing:2, fontWeight:700, margin:"16px 0 8px", paddingLeft:4 }}>
            RODADA {md}
          </div>
          {groupMatches.filter(m => m.md===md).map(m => (
            <MatchCard
              key={m.id}
              match={m}
              pred={activePid ? predictions[activePid]?.[m.id] : null}
              liveScore={liveScores[`${m.home}vs${m.away}`]}
              onPred={(r,h,a) => setPred(m.id, r, h, a)}
              disabled={!activePid}
              participants={participants}
              predictions={predictions}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match, pred, liveScore, onPred, disabled, participants, predictions }) {
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

  const actualResult = isFinal || isLive
    ? (liveScore.homeScore > liveScore.awayScore ? "H" : liveScore.homeScore < liveScore.awayScore ? "A" : "D")
    : null;

  function handleResult(r) {
    if (disabled) return;
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

  const otherPreds = participants
    .filter(p => predictions[p.id]?.[match.id])
    .map(p => ({ ...p, pred: predictions[p.id][match.id] }));

  return (
    <div style={{
      ...S.card,
      border: pred ? `1px solid rgba(255,255,255,0.12)` : "1px solid rgba(255,255,255,0.05)",
      background: isLive ? "rgba(46,204,113,0.05)" : isFinal ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
      position:"relative", overflow:"hidden",
    }}>
      {isLive && (
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#2ecc71,#1abc9c)" }} />
      )}

      {(isLive||isFinal) && (
        <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:2, padding:"2px 10px", borderRadius:10,
            background: isLive ? "rgba(46,204,113,0.2)" : "rgba(255,255,255,0.08)",
            color: isLive ? "#2ecc71" : "#556",
          }}>
            {isLive ? `🔴 AO VIVO ${liveScore.displayClock}` : `⚫ ENCERRADO`}
          </span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, lineHeight:1, marginBottom:4 }}>{home.flag}</div>
          <div style={{ fontSize:12, fontWeight:700 }}>{home.name}</div>
        </div>

        <div style={{ textAlign:"center", minWidth:80 }}>
          {(isLive||isFinal) ? (
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:isLive?S.green:S.silver }}>
              {liveScore.homeScore} – {liveScore.awayScore}
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <input
                type="number" min="0" max="99" value={homeInput}
                onChange={e => handleScore("home", e.target.value)}
                disabled={disabled}
                style={{ width:36, textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, color:"#fff", padding:"4px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}
              />
              <span style={{ color:"#445", fontSize:16 }}>–</span>
              <input
                type="number" min="0" max="99" value={awayInput}
                onChange={e => handleScore("away", e.target.value)}
                disabled={disabled}
                style={{ width:36, textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, color:"#fff", padding:"4px 0", fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}
              />
            </div>
          )}
        </div>

        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, lineHeight:1, marginBottom:4 }}>{away.flag}</div>
          <div style={{ fontSize:12, fontWeight:700 }}>{away.name}</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        {[
          { code:"H", label:`Vitória ${home.flag}`, color:"#3498db" },
          { code:"D", label:"Empate ⚖️",            color:"#f39c12" },
          { code:"A", label:`Vitória ${away.flag}`, color:"#e74c3c" },
        ].map(opt => {
          const isSelected = pred?.result === opt.code;
          const isCorrect  = isFinal && actualResult === opt.code;
          const isWrong    = isFinal && pred?.result === opt.code && actualResult !== opt.code;
          return (
            <button key={opt.code} onClick={() => handleResult(opt.code)} disabled={disabled} style={{
              background: isSelected ? opt.color : "rgba(255,255,255,0.05)",
              border: `1.5px solid ${isSelected ? opt.color : isCorrect ? opt.color : "rgba(255,255,255,0.1)"}`,
              borderRadius:8, padding:"8px 4px", cursor: disabled ? "default" : "pointer",
              color: isSelected ? "#fff" : isCorrect ? opt.color : "#667",
              fontSize:11, fontWeight:700, letterSpacing:0.3, transition:"all 0.15s", position:"relative",
            }}>
              {opt.label}
              {isWrong  && <span style={{position:"absolute",top:2,right:4,fontSize:9}}>✗</span>}
              {isCorrect && <span style={{position:"absolute",top:2,right:4,fontSize:9,color:"#2ecc71"}}>✓</span>}
            </button>
          );
        })}
      </div>

      {otherPreds.length > 0 && (
        <div style={{ marginTop:10, display:"flex", gap:4, flexWrap:"wrap" }}>
          {otherPreds.map(p => (
            <div key={p.id}
              title={`${p.name}: ${p.pred.result==="H"?home.name:p.pred.result==="A"?away.name:"Empate"}${p.pred.home!==undefined?` (${p.pred.home}–${p.pred.away})`:""}`}
              style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.05)", borderRadius:20, padding:"3px 8px", fontSize:11, borderLeft:`3px solid ${p.color}` }}>
              <span style={{ fontWeight:700, color:p.color, fontSize:10 }}>{initials(p.name)}</span>
              <span style={{ color:"#778" }}>
                {p.pred.result==="H"?home.flag:p.pred.result==="A"?away.flag:"⚖️"}
                {p.pred.home!==undefined && ` ${p.pred.home}–${p.pred.away}`}
              </span>
            </div>
          ))}
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
  const filtered = search
    ? allTeams.filter(([,t]) => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTeams;

  if (!activePid) {
    return <EmptyState icon="👆" title="Selecione um participante" subtitle="Escolha quem está apostando no topo da tela." />;
  }

  return (
    <div>
      <SectionTitle icon="🥇" title={`Palpites Especiais — ${activePart?.name}`} />

      {participants.length > 1 && (
        <div style={{ ...S.card, marginBottom:20 }}>
          <div style={{ fontSize:12, color:"#556", letterSpacing:1, fontWeight:700, marginBottom:10 }}>TODOS OS PALPITES DE CAMPEÃO</div>
          {participants.map(p => {
            const ep = extraPicks[p.id] || {};
            const champ = ep.champion ? TEAMS[ep.champion] : null;
            return (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <Avatar participant={p} size={28} />
                <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{p.name}</span>
                {champ
                  ? <span style={{ fontSize:14 }}>{champ.flag} {champ.name}</span>
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
              <span style={{ fontSize:20 }}>{TEAMS[myPicks.champion].flag}</span>
              <span style={{ fontWeight:700, color:S.gold }}>{TEAMS[myPicks.champion].name}</span>
            </div>
          )}
        </div>
        <TeamPicker value={myPicks.champion} onPick={v => pick("champion", v)} highlight={S.gold} search={search} setSearch={setSearch} filtered={filtered} />
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
              <span style={{ fontSize:20 }}>{TEAMS[myPicks.runnerUp].flag}</span>
              <span style={{ fontWeight:600, color:S.silver }}>{TEAMS[myPicks.runnerUp].name}</span>
            </div>
          )}
        </div>
        <TeamPicker value={myPicks.runnerUp} onPick={v => pick("runnerUp", v)} highlight={S.silver} search={search} setSearch={setSearch} filtered={filtered} />
      </div>

      <div style={{ ...S.card }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <span style={{ fontSize:28 }}>⚽</span>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Artilheiro da Copa</div>
            <div style={{ fontSize:11, color:"#667" }}>Campo livre — bônus a definir</div>
          </div>
        </div>
        <input
          value={myPicks.topScorer || ""}
          onChange={e => pick("topScorer", e.target.value)}
          placeholder="Nome do jogador..."
          style={{
            width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:8, color:"#fff", padding:"10px 14px", fontSize:14,
            fontFamily:"'Nunito',sans-serif", boxSizing:"border-box",
          }}
        />
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
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            autoFocus
            style={{
              width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:8, color:"#fff", padding:"8px 12px", fontSize:13, marginTop:6,
              fontFamily:"'Nunito',sans-serif", boxSizing:"border-box",
            }}
          />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginTop:6, maxHeight:220, overflowY:"auto" }}>
            {filtered.map(([code, team]) => (
              <button key={code} onClick={() => { onPick(code); setOpen(false); setSearch(""); }} style={{
                background: value===code ? `${highlight}22` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${value===code ? highlight : "rgba(255,255,255,0.08)"}`,
                borderRadius:6, color: value===code ? highlight : "#aab",
                padding:"6px 10px", cursor:"pointer", textAlign:"left",
                fontSize:12, fontFamily:"'Nunito',sans-serif",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <span style={{ fontSize:18 }}>{team.flag}</span>
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
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key==="Enter" && add()}
            placeholder="Nome do participante..."
            maxLength={24}
            style={{
              flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:8, color:"#fff", padding:"10px 14px", fontSize:14,
              fontFamily:"'Nunito',sans-serif",
            }}
          />
          <button onClick={add} disabled={!name.trim()} style={{
            background: name.trim() ? S.gold : "rgba(255,255,255,0.06)",
            color: name.trim() ? "#080c18" : "#556", border:"none",
            borderRadius:8, padding:"10px 20px", cursor: name.trim() ? "pointer" : "default",
            fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:14, transition:"all 0.2s",
          }}>
            Adicionar
          </button>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width:28, height:28, borderRadius:"50%", background:c,
              border: color===c ? "3px solid #fff" : "2px solid transparent",
              cursor:"pointer", transition:"all 0.15s",
            }} />
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
      ) : (
        participants.map((p, i) => (
          <div key={p.id} style={{
            ...S.card,
            display:"flex", alignItems:"center", gap:12,
            border: activePid===p.id ? `1px solid ${p.color}55` : "1px solid rgba(255,255,255,0.06)",
            background: activePid===p.id ? `rgba(${hexToRgb(p.color)},0.06)` : "rgba(255,255,255,0.03)",
          }}>
            <span style={{ color:"#445", fontSize:13, width:20, textAlign:"center" }}>{i+1}</span>
            <Avatar participant={p} size={40} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
              {activePid===p.id && <div style={{ fontSize:11, color:p.color }}>✦ Participante ativo</div>}
            </div>
            <button onClick={() => setActivePid(p.id)} style={{
              background: activePid===p.id ? p.color : "rgba(255,255,255,0.07)",
              border:"none", borderRadius:8, padding:"6px 14px",
              color: activePid===p.id ? "#fff" : "#778", cursor:"pointer",
              fontSize:12, fontFamily:"'Nunito',sans-serif", fontWeight:600,
            }}>
              {activePid===p.id ? "Ativo" : "Selecionar"}
            </button>
            <button onClick={() => remove(p.id)} style={{
              background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)",
              borderRadius:8, padding:"6px 10px", color:S.red, cursor:"pointer", fontSize:12,
            }}>🗑</button>
          </div>
        ))
      )}

      {participants.length > 0 && (
        <div style={{ marginTop:16, padding:12, background:"rgba(255,255,255,0.03)", borderRadius:8, fontSize:12, color:"#556" }}>
          💡 <strong>Dica:</strong> Selecione um participante no topo da tela antes de ir para a aba Grupos e fazer os palpites.
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
