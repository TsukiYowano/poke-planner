import type {
  CandidatePokemon,
  CandidateRecommendation,
  Matchup,
  MatchupRating,
  Team,
  TeamPokemon,
  TeamRoleId,
} from "../types/pokemon";
import { teamRoles } from "../data/roles";
import { analyzeTeam, type TeamAnalysis } from "./teamAnalysis";
import {
  analyzeTeamTypeCoverage,
  type TeamTypeCoverage,
} from "./teamTypeCoverage";
import { recommendCandidates } from "./recommendation";

const positiveRatings: MatchupRating[] = ["very-good", "good"];
const negativeRatings: MatchupRating[] = ["bad", "very-bad"];

export type RoleChange = { roleId: TeamRoleId; delta: number };

export type CoverageChange = {
  typeId: TeamTypeCoverage["attackingType"];
  score: number;
  message: string;
};

export type CompareAnalysis = {
  outgoing: TeamPokemon;
  outgoingCandidate: CandidatePokemon;
  incomingCandidate: CandidatePokemon;
  beforeTeam: Team;
  afterTeam: Team;
  beforeAnalysis: TeamAnalysis;
  afterAnalysis: TeamAnalysis;
  roleChanges: RoleChange[];
  coverageChanges: CoverageChange[];
  recommendation?: CandidateRecommendation;
  outgoingGoodMatchups: Matchup[];
  outgoingBadMatchups: Matchup[];
  incomingGoodMatchups: Matchup[];
  incomingBadMatchups: Matchup[];
  uniqueResponsibilities: Matchup[];
};

export function compareTeamCandidateSwap(
  team: Team,
  candidates: CandidatePokemon[],
  matchups: Matchup[],
  outgoingTeamPokemonId: string,
  incomingCandidateId: string,
): CompareAnalysis | null {
  const outgoing = team.pokemon.find(
    (pokemon) => pokemon.id === outgoingTeamPokemonId,
  );
  const incomingCandidate = candidates.find(
    (candidate) => candidate.id === incomingCandidateId,
  );
  const outgoingCandidate = candidates.find(
    (candidate) => candidate.id === outgoing?.candidatePokemonId,
  );
  if (!outgoing || !incomingCandidate || !outgoingCandidate) return null;

  const teamWithoutOutgoing: Team = {
    ...team,
    pokemon: team.pokemon.filter((pokemon) => pokemon.id !== outgoing.id),
  };
  const incomingTeamPokemon: TeamPokemon = {
    id: `compare-${incomingCandidate.id}`,
    candidatePokemonId: incomingCandidate.id,
    moves: [],
  };
  const afterTeam: Team = {
    ...team,
    pokemon: [...teamWithoutOutgoing.pokemon, incomingTeamPokemon],
  };
  const beforeAnalysis = analyzeTeam(team, candidates);
  const afterAnalysis = analyzeTeam(afterTeam, candidates);
  const beforeCoverage = analyzeTeamTypeCoverage(team, candidates);
  const afterCoverage = analyzeTeamTypeCoverage(afterTeam, candidates);
  const recommendation = recommendCandidates(
    teamWithoutOutgoing,
    [incomingCandidate],
    candidates,
  )[0];

  const outgoingMatchups = matchups.filter(
    (matchup) =>
      matchup.candidatePokemonId === outgoing.candidatePokemonId,
  );
  const incomingMatchups = matchups.filter(
    (matchup) =>
      matchup.candidatePokemonId === incomingCandidate.id,
  );
  const remainingCandidateIds = new Set(
    teamWithoutOutgoing.pokemon.map(
      (pokemon) => pokemon.candidatePokemonId,
    ),
  );
  const outgoingGoodMatchups = outgoingMatchups.filter((matchup) =>
    positiveRatings.includes(matchup.rating),
  );

  return {
    outgoing,
    outgoingCandidate,
    incomingCandidate,
    beforeTeam: team,
    afterTeam,
    beforeAnalysis,
    afterAnalysis,
    roleChanges: buildRoleChanges(
      beforeAnalysis.roleCounts,
      afterAnalysis.roleCounts,
    ),
    coverageChanges: buildCoverageChanges(beforeCoverage, afterCoverage),
    recommendation,
    outgoingGoodMatchups,
    outgoingBadMatchups: outgoingMatchups.filter((matchup) =>
      negativeRatings.includes(matchup.rating),
    ),
    incomingGoodMatchups: incomingMatchups.filter((matchup) =>
      positiveRatings.includes(matchup.rating),
    ),
    incomingBadMatchups: incomingMatchups.filter((matchup) =>
      negativeRatings.includes(matchup.rating),
    ),
    uniqueResponsibilities: outgoingGoodMatchups.filter(
      (matchup) =>
        !matchups.some(
          (other) =>
            other.rankingEntryId === matchup.rankingEntryId &&
            remainingCandidateIds.has(other.candidatePokemonId) &&
            positiveRatings.includes(other.rating),
        ),
    ),
  };
}

function buildRoleChanges(
  before: TeamAnalysis["roleCounts"],
  after: TeamAnalysis["roleCounts"],
): RoleChange[] {
  return teamRoles
    .map((role) => ({
      roleId: role.id,
      delta:
        (after.find((item) => item.roleId === role.id)?.count ?? 0) -
        (before.find((item) => item.roleId === role.id)?.count ?? 0),
    }))
    .filter((item) => item.delta !== 0);
}

function defensiveAnswerCount(item: TeamTypeCoverage): number {
  return item.immune + item.quarter + item.half;
}

function weaknessCount(item: TeamTypeCoverage): number {
  return item.double + item.quadruple;
}

function buildCoverageChanges(
  before: TeamTypeCoverage[],
  after: TeamTypeCoverage[],
): CoverageChange[] {
  return before.map((beforeItem) => {
    const afterItem =
      after.find(
        (item) => item.attackingType === beforeItem.attackingType,
      ) ?? beforeItem;
    const answerDelta =
      defensiveAnswerCount(afterItem) - defensiveAnswerCount(beforeItem);
    const weaknessDelta =
      weaknessCount(afterItem) - weaknessCount(beforeItem);
    const score = answerDelta - weaknessDelta;

    let message = "変化なし";
    if (answerDelta > 0 && weaknessDelta <= 0) {
      message = `受け先が${answerDelta}匹増える`;
    } else if (answerDelta < 0 && weaknessDelta >= 0) {
      message = `受け先が${Math.abs(answerDelta)}匹減る`;
    } else if (weaknessDelta > 0 && answerDelta <= 0) {
      message = `弱点が${weaknessDelta}匹増える`;
    } else if (weaknessDelta < 0 && answerDelta >= 0) {
      message = `弱点が${Math.abs(weaknessDelta)}匹減る`;
    } else if (score > 0) {
      message = "耐性バランスが改善";
    } else if (score < 0) {
      message = "耐性バランスが悪化";
    }
    return { typeId: beforeItem.attackingType, score, message };
  });
}
