import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  Team,
  TeamPokemon,
} from "../types/pokemon";
import {
  compareMatchupRatings,
  isGoodOrBetterMatchupRating,
} from "./matchupTable";
import { analyzeTeamResponsibilities } from "./responsibilityAnalysis";

export type PokemonWeaknessStatus =
  | "difficult"
  | "warning"
  | "stable"
  | "unrated";

export type PokemonWeaknessAssignment = {
  teamPokemon: TeamPokemon;
  candidate: CandidatePokemon;
  rating: MatchupRating;
};

export type PokemonWeaknessEntry = {
  rankingEntry: RankingEntry;
  status: PokemonWeaknessStatus;
  evaluatedCount: number;
  bestRating: MatchupRating;
  goodOrBetterCount: number;
  excellentCount: number;
  assignments: PokemonWeaknessAssignment[];
};

export type PokemonWeaknessAnalysis = {
  entries: PokemonWeaknessEntry[];
  groups: Record<PokemonWeaknessStatus, PokemonWeaknessEntry[]>;
};

function getBestRating(ratings: MatchupRating[]): MatchupRating {
  return ratings.reduce<MatchupRating>(
    (best, rating) =>
      compareMatchupRatings(rating, best) > 0 ? rating : best,
    "unrated",
  );
}

function getStatus(
  evaluatedCount: number,
  goodOrBetterCount: number,
): PokemonWeaknessStatus {
  if (evaluatedCount === 0) {
    return "unrated";
  }

  if (goodOrBetterCount >= 2) {
    return "stable";
  }

  if (goodOrBetterCount === 1) {
    return "warning";
  }

  return "difficult";
}

export function comparePokemonWeaknessEntries(
  left: PokemonWeaknessEntry,
  right: PokemonWeaknessEntry,
): number {
  if (left.status === "unrated" || right.status === "unrated") {
    return left.rankingEntry.rank - right.rankingEntry.rank;
  }

  return (
    compareMatchupRatings(left.bestRating, right.bestRating) ||
    left.goodOrBetterCount - right.goodOrBetterCount ||
    left.excellentCount - right.excellentCount ||
    left.rankingEntry.rank - right.rankingEntry.rank
  );
}

export function analyzePokemonWeaknesses(
  team: Team | undefined,
  candidates: CandidatePokemon[],
  rankingEntries: RankingEntry[],
  matchups: Matchup[],
): PokemonWeaknessAnalysis {
  const groups: PokemonWeaknessAnalysis["groups"] = {
    difficult: [],
    warning: [],
    stable: [],
    unrated: [],
  };

  if (!team) {
    return { entries: [], groups };
  }

  // Candidate ID基準のMatchup MapとTeam順の評価は責任度分析と共有する。
  const responsibility = analyzeTeamResponsibilities(
    team,
    candidates,
    rankingEntries,
    matchups,
  );
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const teamPokemonMap = new Map(
    team.pokemon.map((teamPokemon) => [teamPokemon.id, teamPokemon]),
  );

  const entries = responsibility.ranking.map((ranking) => {
    const ratings = ranking.teamRatings.map(({ rating }) => rating);
    const assignments = ranking.teamRatings.flatMap((teamRating) => {
      const teamPokemon = teamPokemonMap.get(teamRating.teamPokemonId);
      const candidate = candidateMap.get(teamRating.candidatePokemonId);

      return teamPokemon && candidate
        ? [{ teamPokemon, candidate, rating: teamRating.rating }]
        : [];
    });
    const status = getStatus(
      ranking.evaluatedCount,
      ranking.goodOrBetterCount,
    );

    return {
      rankingEntry: ranking.entry,
      status,
      evaluatedCount: ranking.evaluatedCount,
      bestRating: getBestRating(ratings),
      goodOrBetterCount: ranking.goodOrBetterCount,
      excellentCount: ratings.filter(
        (rating) =>
          rating === "very-good" &&
          isGoodOrBetterMatchupRating(rating),
      ).length,
      assignments,
    } satisfies PokemonWeaknessEntry;
  });

  for (const entry of entries) {
    groups[entry.status].push(entry);
  }

  for (const group of Object.values(groups)) {
    group.sort(comparePokemonWeaknessEntries);
  }

  return { entries, groups };
}
