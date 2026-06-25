import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrediction,
  getTournamentPodium,
  parseKnockoutEvents,
  translateBracketPlaceholder,
} from "./tournament.js";

const resolveTeamCode = team => ["BRA", "ARG"].includes(team?.abbreviation)
  ? team.abbreviation
  : null;

function event({ id, slug, date, home, away, homeScore="0", awayScore="0", completed=false, state="pre", winner="" }) {
  return {
    id,
    date,
    season: { slug },
    competitions: [{
      id,
      date,
      status: { type: { completed, state }, displayClock: state === "in" ? "75'" : "" },
      competitors: [
        { homeAway:"home", score:homeScore, winner:winner === "home", team:home },
        { homeAway:"away", score:awayScore, winner:winner === "away", team:away },
      ],
    }],
  };
}

test("buildPrediction removes undefined Firebase values", () => {
  assert.deepEqual(buildPrediction(undefined, 0, undefined), { home:0 });
  assert.deepEqual(buildPrediction("D", 1, 1), { result:"D", home:1, away:1 });
});

test("placeholder labels are localized", () => {
  assert.equal(translateBracketPlaceholder("Group F 2nd Place"), "2º do Grupo F");
  assert.equal(
    translateBracketPlaceholder("Round of 32 3 Winner"),
    "Vencedor do jogo 3 (Rodada de 32)",
  );
});

test("scheduled knockout matches do not show fake 0-0 scores", () => {
  const bracket = parseKnockoutEvents([
    event({
      id:"1",
      slug:"round-of-32",
      date:"2026-06-28T19:00:00Z",
      home:{ abbreviation:"BRA", displayName:"Brazil" },
      away:{ abbreviation:"ARG", displayName:"Argentina" },
    }),
  ], resolveTeamCode);

  assert.equal(bracket.r32[0].home, "BRA");
  assert.equal(bracket.r32[0].away, "ARG");
  assert.equal(bracket.r32[0].homeScore, "");
  assert.equal(bracket.r32[0].awayScore, "");
});

test("winners automatically propagate into later placeholder slots", () => {
  const bracket = parseKnockoutEvents([
    event({
      id:"r32-1",
      slug:"round-of-32",
      date:"2026-06-28T19:00:00Z",
      home:{ abbreviation:"BRA", displayName:"Brazil" },
      away:{ abbreviation:"ARG", displayName:"Argentina" },
      homeScore:"2",
      awayScore:"1",
      completed:true,
      state:"post",
      winner:"home",
    }),
    event({
      id:"r16-1",
      slug:"round-of-16",
      date:"2026-07-04T17:00:00Z",
      home:{ abbreviation:"RD32", displayName:"Round of 32 1 Winner" },
      away:{ abbreviation:"RD32", displayName:"Round of 32 2 Winner" },
    }),
  ], resolveTeamCode);

  assert.equal(bracket.r16[0].home, "BRA");
});

test("final result exposes champion and runner-up for special-pick scoring", () => {
  const bracket = parseKnockoutEvents([
    event({
      id:"final",
      slug:"final",
      date:"2026-07-19T19:00:00Z",
      home:{ abbreviation:"BRA", displayName:"Brazil" },
      away:{ abbreviation:"ARG", displayName:"Argentina" },
      homeScore:"1",
      awayScore:"2",
      completed:true,
      state:"post",
      winner:"away",
    }),
  ], resolveTeamCode);

  assert.deepEqual(getTournamentPodium(bracket), { champion:"ARG", runnerUp:"BRA" });
});
