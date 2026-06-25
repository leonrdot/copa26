export const BRACKET_ROUNDS = [
  { id:"r32",   slug:"round-of-32",    label:"Rodada de 32", slots:16 },
  { id:"r16",   slug:"round-of-16",    label:"Oitavas",      slots:8  },
  { id:"qf",    slug:"quarterfinals",   label:"Quartas",      slots:4  },
  { id:"sf",    slug:"semifinals",      label:"Semifinais",   slots:2  },
  { id:"third", slug:"3rd-place-match", label:"3º Lugar",     slots:1  },
  { id:"final", slug:"final",           label:"Final",        slots:1  },
];

const ROUND_BY_SLUG = Object.fromEntries(BRACKET_ROUNDS.map(round => [round.slug, round]));

const SOURCE_ROUNDS = {
  "Round of 32": "r32",
  "Round of 16": "r16",
  "Quarterfinal": "qf",
  "Semifinal": "sf",
};

function toScore(value) {
  if (value === "" || value === undefined || value === null) return "";
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? "" : parsed;
}

export function buildPrediction(result, home, away) {
  const prediction = {};
  if (result !== undefined && result !== null && result !== "") prediction.result = result;
  if (home !== undefined && home !== null && home !== "") prediction.home = toScore(home);
  if (away !== undefined && away !== null && away !== "") prediction.away = toScore(away);
  return prediction;
}

export function translateBracketPlaceholder(name) {
  if (!name) return "A definir";

  let match = name.match(/^Group ([A-L]) Winner$/);
  if (match) return `1º do Grupo ${match[1]}`;

  match = name.match(/^Group ([A-L]) 2nd Place$/);
  if (match) return `2º do Grupo ${match[1]}`;

  match = name.match(/^Third Place Group (.+)$/);
  if (match) return `3º lugar — grupos ${match[1]}`;

  match = name.match(/^(Round of 32|Round of 16|Quarterfinal|Semifinal) (\d+) (Winner|Loser)$/);
  if (match) {
    const labels = {
      "Round of 32": "Rodada de 32",
      "Round of 16": "Oitavas",
      Quarterfinal: "Quartas",
      Semifinal: "Semifinais",
    };
    return `${match[3] === "Winner" ? "Vencedor" : "Perdedor"} do jogo ${match[2]} (${labels[match[1]]})`;
  }

  return name;
}

function parseSource(name) {
  const match = name?.match(/^(Round of 32|Round of 16|Quarterfinal|Semifinal) (\d+) (Winner|Loser)$/);
  if (!match) return null;
  return {
    roundId: SOURCE_ROUNDS[match[1]],
    index: Number.parseInt(match[2], 10) - 1,
    outcome: match[3].toLowerCase(),
  };
}

function parseTeam(competitor, resolveTeamCode) {
  const rawName = competitor?.team?.displayName
    || competitor?.team?.shortDisplayName
    || competitor?.team?.name
    || "";
  const code = resolveTeamCode(competitor?.team) || "";
  return {
    code,
    name: code ? "" : translateBracketPlaceholder(rawName),
    source: rawName,
  };
}

function selectedTeam(match, outcome) {
  if (!match?.winner) return null;
  const winningSide = match.winner;
  const side = outcome === "winner"
    ? winningSide
    : winningSide === "home" ? "away" : "home";
  return {
    code: match[side] || "",
    name: match[`${side}Name`] || "",
  };
}

function propagateBracket(rounds) {
  BRACKET_ROUNDS.forEach(round => {
    (rounds[round.id] || []).forEach(match => {
      ["home", "away"].forEach(side => {
        if (match[side]) return;
        const source = parseSource(match[`${side}Source`]);
        if (!source) return;
        const sourceMatch = rounds[source.roundId]?.[source.index];
        const team = selectedTeam(sourceMatch, source.outcome);
        if (!team) return;
        match[side] = team.code;
        match[`${side}Name`] = team.name;
      });
    });
  });
  return rounds;
}

export function parseKnockoutEvents(events, resolveTeamCode) {
  const rounds = Object.fromEntries(BRACKET_ROUNDS.map(round => [round.id, []]));

  (events || []).forEach(event => {
    const round = ROUND_BY_SLUG[event?.season?.slug];
    if (!round) return;

    const competition = event.competitions?.[0];
    if (!competition) return;

    const homeCompetitor = competition.competitors?.find(item => item.homeAway === "home");
    const awayCompetitor = competition.competitors?.find(item => item.homeAway === "away");
    if (!homeCompetitor || !awayCompetitor) return;

    const statusType = competition.status?.type || event.status?.type || {};
    const state = statusType.state || "pre";
    const completed = Boolean(statusType.completed);
    const started = state !== "pre";
    const homeTeam = parseTeam(homeCompetitor, resolveTeamCode);
    const awayTeam = parseTeam(awayCompetitor, resolveTeamCode);
    const homeScore = started ? toScore(homeCompetitor.score) : "";
    const awayScore = started ? toScore(awayCompetitor.score) : "";

    let winner = homeCompetitor.winner ? "home" : awayCompetitor.winner ? "away" : "";
    if (!winner && completed && homeScore !== "" && awayScore !== "" && homeScore !== awayScore) {
      winner = homeScore > awayScore ? "home" : "away";
    }

    rounds[round.id].push({
      id: event.id || competition.id,
      startTime: Date.parse(competition.date || event.date),
      home: homeTeam.code,
      homeName: homeTeam.name,
      homeSource: homeTeam.source,
      away: awayTeam.code,
      awayName: awayTeam.name,
      awaySource: awayTeam.source,
      homeScore,
      awayScore,
      homeShootout: started ? toScore(homeCompetitor.shootoutScore) : "",
      awayShootout: started ? toScore(awayCompetitor.shootoutScore) : "",
      winner,
      status: completed ? "final" : state === "in" ? "live" : "scheduled",
      displayClock: competition.status?.displayClock || event.status?.displayClock || "",
      venue: competition.venue?.fullName || event.venue?.displayName || "",
    });
  });

  BRACKET_ROUNDS.forEach(round => {
    rounds[round.id].sort((a, b) => a.startTime - b.startTime);
    rounds[round.id] = rounds[round.id].slice(0, round.slots);
  });

  return propagateBracket(rounds);
}

export function getBracketMatch(bracket, roundId, index) {
  return bracket?.[roundId]?.[index] || null;
}

export function hasBracketData(bracket) {
  return BRACKET_ROUNDS.some(round => (bracket?.[round.id] || []).length > 0);
}

export function getTournamentPodium(bracket) {
  const final = getBracketMatch(bracket, "final", 0);
  if (!final || final.status !== "final" || !final.winner) {
    return { champion:"", runnerUp:"" };
  }
  const runnerSide = final.winner === "home" ? "away" : "home";
  return {
    champion: final[final.winner] || "",
    runnerUp: final[runnerSide] || "",
  };
}
