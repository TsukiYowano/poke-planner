import type {
  Matchup,
  MatchupRating,
  RankingEntry,
  TeamPokemon,
} from "../types/pokemon";

const ratingScore: Record<MatchupRating, number> = {
  "very-good": 4,
  good: 3,
  even: 2,
  bad: 1,
  "very-bad": 0,
  unrated: -1,
};

export type PokemonCoverageResult = {
  rankingEntry: RankingEntry;
  coverageCount: number;
  ratedCount: number;
  bestRating: MatchupRating;
  dangerScore: number;
};

/**
 * 現在の構築が、ランキング上の各ポケモンに
 * どの程度対応できているかを集計する。
 */
export function analyzePokemonCoverage(
  teamPokemon: TeamPokemon[],
  rankingEntries: RankingEntry[],
  matchups: Matchup[],
): PokemonCoverageResult[] {
  const teamPokemonIds = new Set(
    teamPokemon.map((pokemon) => pokemon.id),
  );

  const sortedEntries = [...rankingEntries].sort(
    (a, b) => a.rank - b.rank,
  );

  return sortedEntries.map((rankingEntry) => {
    const relevantMatchups = matchups.filter(
      (matchup) =>
        matchup.rankingEntryId === rankingEntry.id &&
        teamPokemonIds.has(matchup.teamPokemonId),
    );

    const ratedMatchups = relevantMatchups.filter(
      (matchup) => matchup.rating !== "unrated",
    );

    const coverageCount = ratedMatchups.filter(
      (matchup) =>
        matchup.rating === "very-good" ||
        matchup.rating === "good",
    ).length;

    const bestRating =
      ratedMatchups.length > 0
        ? ratedMatchups.reduce<MatchupRating>(
            (best, matchup) =>
              ratingScore[matchup.rating] >
              ratingScore[best]
                ? matchup.rating
                : best,
            ratedMatchups[0].rating,
          )
        : "unrated";

    const dangerScore = calculateDangerScore({
      rank: rankingEntry.rank,
      rankingCount: sortedEntries.length,
      coverageCount,
      bestRating,
    });

    return {
      rankingEntry,
      coverageCount,
      ratedCount: ratedMatchups.length,
      bestRating,
      dangerScore,
    };
  });
}

type DangerScoreInput = {
  rank: number;
  rankingCount: number;
  coverageCount: number;
  bestRating: MatchupRating;
};

function calculateDangerScore({
  rank,
  rankingCount,
  coverageCount,
  bestRating,
}: DangerScoreInput): number {
  if (bestRating === "unrated") {
    return 0;
  }

  /*
   * 順位点：
   * ランキング1位は最大30点、
   * ランキング最下位は約0点。
   */
  const rankScore =
    rankingCount <= 1
      ? 30
      : ((rankingCount - rank) /
          (rankingCount - 1)) *
        30;

  /*
   * 担当数：
   * ◎・○が0匹なら最も危険。
   */
  const coverageScore =
    coverageCount === 0
      ? 50
      : coverageCount === 1
        ? 25
        : 0;

  /*
   * 構築内で最も良い評価も加味する。
   */
  const bestRatingScore: Record<MatchupRating, number> = {
    "very-good": 0,
    good: 0,
    even: 10,
    bad: 15,
    "very-bad": 20,
    unrated: 0,
  };

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        rankScore +
          coverageScore +
          bestRatingScore[bestRating],
      ),
    ),
  );
}

/**
 * 要注意ポケモンを危険度順に返す。
 *
 * 未評価しかない相手は除外。
 * 担当数2匹以上は要注意対象から除外。
 */
export function getDangerousPokemon(
  teamPokemon: TeamPokemon[],
  rankingEntries: RankingEntry[],
  matchups: Matchup[],
  limit = 5,
): PokemonCoverageResult[] {
  return analyzePokemonCoverage(
    teamPokemon,
    rankingEntries,
    matchups,
  )
    .filter(
      (result) =>
        result.ratedCount > 0 &&
        result.coverageCount <= 1,
    )
    .sort((a, b) => {
      if (a.coverageCount !== b.coverageCount) {
        return a.coverageCount - b.coverageCount;
      }

      if (a.dangerScore !== b.dangerScore) {
        return b.dangerScore - a.dangerScore;
      }

      return (
        a.rankingEntry.rank -
        b.rankingEntry.rank
      );
    })
    .slice(0, limit);
}