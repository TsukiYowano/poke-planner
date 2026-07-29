import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  Team,
} from "../types/pokemon";
import {
  createMatchupMap,
  isGoodOrBetterMatchupRating,
  matchupKey,
} from "./matchupTable";

export type TeamPokemonResponsibility = {
  teamPokemonId: string;
  candidatePokemonId: string;
  soleEntries: ResponsibilityEntry[];
  sharedEntries: ResponsibilityEntry[];
};

export type ResponsibilityEntry = {
  entry: RankingEntry;
  rating: MatchupRating;
};

export type ResponsibilityAnalysis = {
  pokemon: TeamPokemonResponsibility[];
  uncoveredEntries: RankingEntry[];
  unratedEntries: RankingEntry[];
  ranking: RankingResponsibility[];
};

export type TeamPokemonRankingRating = {
  teamPokemonId: string;
  candidatePokemonId: string;
  rating: MatchupRating;
};

export type RankingCoverage =
  | "unrated"
  | "uncovered"
  | "single"
  | "shared";

export type RankingResponsibility = {
  entry: RankingEntry;
  evaluatedCount: number;
  goodOrBetterCount: number;
  assignments: TeamPokemonRankingRating[];
  teamRatings: TeamPokemonRankingRating[];
  coverage: RankingCoverage;
};

export type DangerousRankingEntries = {
  uncovered: RankingResponsibility[];
  singleCoverage: RankingResponsibility[];
};

export function selectDangerousRankingEntries(
  analysis: ResponsibilityAnalysis,
): DangerousRankingEntries {
  return {
    uncovered: analysis.ranking.filter(
      (responsibility) => responsibility.coverage === "uncovered",
    ),
    singleCoverage: analysis.ranking.filter(
      (responsibility) => responsibility.coverage === "single",
    ),
  };
}

export function analyzeTeamResponsibilities(
  team: Team | undefined,
  candidates: CandidatePokemon[],
  rankingEntries: RankingEntry[],
  matchups: Matchup[],
): ResponsibilityAnalysis {
  if (!team) {
    return {
      pokemon: [],
      uncoveredEntries: [],
      unratedEntries: [],
      ranking: [],
    };
  }

  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const matchupMap = createMatchupMap(matchups);
  const sortedEntries = [...rankingEntries].sort(
    (left, right) => left.rank - right.rank,
  );
  const pokemon = team.pokemon.map((teamPokemon) => ({
    teamPokemonId: teamPokemon.id,
    candidatePokemonId: teamPokemon.candidatePokemonId,
    soleEntries: [] as ResponsibilityEntry[],
    sharedEntries: [] as ResponsibilityEntry[],
  }));
  const responsibilityByTeamPokemonId = new Map(
    pokemon.map((responsibility) => [
      responsibility.teamPokemonId,
      responsibility,
    ]),
  );
  const uncoveredEntries: RankingEntry[] = [];
  const unratedEntries: RankingEntry[] = [];
  const ranking: RankingResponsibility[] = [];

  for (const entry of sortedEntries) {
    const teamRatings: TeamPokemonRankingRating[] = team.pokemon.flatMap(
      (teamPokemon) => {
      if (!candidateIds.has(teamPokemon.candidatePokemonId)) return [];
      const rating =
        matchupMap.get(
          matchupKey(teamPokemon.candidatePokemonId, entry.id),
        )?.rating ?? "unrated";
      return [{ teamPokemon, rating }];
      },
    ).map(({ teamPokemon, rating }) => ({
      teamPokemonId: teamPokemon.id,
      candidatePokemonId: teamPokemon.candidatePokemonId,
      rating,
    }));
    const responsibleTeamPokemon = teamRatings.filter(({ rating }) =>
      isGoodOrBetterMatchupRating(rating),
    );
    const evaluatedCount = teamRatings.filter(
      ({ rating }) => rating !== "unrated",
    ).length;
    const goodOrBetterCount = responsibleTeamPokemon.length;
    const hasUnrated = teamRatings.some(
      ({ rating }) => rating === "unrated",
    );
    const coverage: RankingCoverage =
      goodOrBetterCount >= 2
        ? "shared"
        : goodOrBetterCount === 1
          ? "single"
          : hasUnrated
            ? "unrated"
            : "uncovered";

    ranking.push({
      entry,
      evaluatedCount,
      goodOrBetterCount,
      assignments: responsibleTeamPokemon,
      teamRatings,
      coverage,
    });

    if (responsibleTeamPokemon.length === 0) {
      if (hasUnrated) {
        unratedEntries.push(entry);
      } else {
        uncoveredEntries.push(entry);
      }
      continue;
    }

    const target =
      responsibleTeamPokemon.length === 1 ? "soleEntries" : "sharedEntries";
    for (const {
      teamPokemonId,
      rating,
    } of responsibleTeamPokemon) {
      responsibilityByTeamPokemonId
        .get(teamPokemonId)
        ?.[target].push({ entry, rating });
    }
  }

  return { pokemon, uncoveredEntries, unratedEntries, ranking };
}
