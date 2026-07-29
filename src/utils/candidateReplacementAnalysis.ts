import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  Team,
} from "../types/pokemon";
import {
  compareMatchupRatings,
  createMatchupMap,
  matchupKey,
} from "./matchupTable";
import {
  analyzeTeamResponsibilities,
  selectDangerousRankingEntries,
  type ResponsibilityAnalysis,
} from "./responsibilityAnalysis";

export type ReplacementMetric = {
  before: number;
  after: number;
  delta: number;
};

export type CandidateReplacementSummary = {
  warnings: ReplacementMetric;
  uncovered: ReplacementMetric;
  unrated: ReplacementMetric;
  soleResponsibilities: ReplacementMetric;
  sharedResponsibilities: ReplacementMetric;
};

export type ReplacementRatingChange = {
  entry: RankingEntry;
  beforeRating: MatchupRating;
  afterRating: MatchupRating;
};

export type CandidateReplacementAnalysis = {
  beforeTeam: Team;
  afterTeam: Team;
  beforeResponsibilities: ResponsibilityAnalysis;
  afterResponsibilities: ResponsibilityAnalysis;
  summary: CandidateReplacementSummary;
  improvedEntries: ReplacementRatingChange[];
  worsenedEntries: ReplacementRatingChange[];
  removedWarnings: RankingEntry[];
  addedWarnings: RankingEntry[];
};

function metric(before: number, after: number): ReplacementMetric {
  return { before, after, delta: after - before };
}

function responsibilityTotals(analysis: ResponsibilityAnalysis): {
  sole: number;
  shared: number;
} {
  return analysis.pokemon.reduce(
    (totals, pokemon) => ({
      sole: totals.sole + pokemon.soleEntries.length,
      shared: totals.shared + pokemon.sharedEntries.length,
    }),
    { sole: 0, shared: 0 },
  );
}

export function analyzeCandidateReplacement(
  team: Team,
  candidates: CandidatePokemon[],
  replacingCandidate: CandidatePokemon,
  replacementCandidate: CandidatePokemon,
  rankingEntries: RankingEntry[],
  matchups: Matchup[],
): CandidateReplacementAnalysis | null {
  const replacingTeamPokemon = team.pokemon.find(
    (pokemon) =>
      pokemon.candidatePokemonId === replacingCandidate.id,
  );
  if (!replacingTeamPokemon) return null;

  const afterTeam: Team = {
    ...team,
    pokemon: team.pokemon.map((pokemon) =>
      pokemon.id === replacingTeamPokemon.id
        ? {
            ...pokemon,
            candidatePokemonId: replacementCandidate.id,
          }
        : pokemon,
    ),
  };
  const beforeResponsibilities = analyzeTeamResponsibilities(
    team,
    candidates,
    rankingEntries,
    matchups,
  );
  const afterResponsibilities = analyzeTeamResponsibilities(
    afterTeam,
    candidates,
    rankingEntries,
    matchups,
  );
  const beforeDanger = selectDangerousRankingEntries(
    beforeResponsibilities,
  );
  const afterDanger = selectDangerousRankingEntries(afterResponsibilities);
  const beforeWarningIds = new Set(
    [...beforeDanger.uncovered, ...beforeDanger.singleCoverage].map(
      ({ entry }) => entry.id,
    ),
  );
  const afterWarningIds = new Set(
    [...afterDanger.uncovered, ...afterDanger.singleCoverage].map(
      ({ entry }) => entry.id,
    ),
  );
  const matchupMap = createMatchupMap(matchups);
  const sortedEntries = [...rankingEntries].sort(
    (left, right) => left.rank - right.rank,
  );
  const improvedEntries: ReplacementRatingChange[] = [];
  const worsenedEntries: ReplacementRatingChange[] = [];

  for (const entry of sortedEntries) {
    const beforeRating =
      matchupMap.get(matchupKey(replacingCandidate.id, entry.id))?.rating ??
      "unrated";
    const afterRating =
      matchupMap.get(matchupKey(replacementCandidate.id, entry.id))?.rating ??
      "unrated";
    const comparison = compareMatchupRatings(afterRating, beforeRating);
    const change = { entry, beforeRating, afterRating };
    if (comparison > 0) improvedEntries.push(change);
    if (comparison < 0) worsenedEntries.push(change);
  }

  const beforeTotals = responsibilityTotals(beforeResponsibilities);
  const afterTotals = responsibilityTotals(afterResponsibilities);
  const beforeWarningCount = beforeWarningIds.size;
  const afterWarningCount = afterWarningIds.size;

  return {
    beforeTeam: team,
    afterTeam,
    beforeResponsibilities,
    afterResponsibilities,
    summary: {
      warnings: metric(beforeWarningCount, afterWarningCount),
      uncovered: metric(
        beforeResponsibilities.uncoveredEntries.length,
        afterResponsibilities.uncoveredEntries.length,
      ),
      unrated: metric(
        beforeResponsibilities.unratedEntries.length,
        afterResponsibilities.unratedEntries.length,
      ),
      soleResponsibilities: metric(beforeTotals.sole, afterTotals.sole),
      sharedResponsibilities: metric(
        beforeTotals.shared,
        afterTotals.shared,
      ),
    },
    improvedEntries,
    worsenedEntries,
    removedWarnings: sortedEntries.filter(
      (entry) =>
        beforeWarningIds.has(entry.id) && !afterWarningIds.has(entry.id),
    ),
    addedWarnings: sortedEntries.filter(
      (entry) =>
        !beforeWarningIds.has(entry.id) && afterWarningIds.has(entry.id),
    ),
  };
}
