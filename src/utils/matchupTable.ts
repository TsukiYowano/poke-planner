import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  Team,
} from "../types/pokemon";

export type MatchupMode = "team" | "candidate";

export const matchupUiText = {
  candidateList: "候補一覧",
  candidateSummary: "候補別集計",
  candidateSearch: "候補を検索（名前・ラベル・タグ）",
  noCandidateSearchResults: "検索条件に一致する候補がありません。",
  noTeamCandidates: "現在の構築に候補ポケモンが登録されていません。",
  noVisibleCandidates:
    "相性表へ表示する候補ポケモンがありません。候補編集画面で表示を有効にしてください。",
} as const;

export const matchupRatings: MatchupRating[] = [
  "unrated",
  "very-good",
  "good",
  "even",
  "bad",
  "very-bad",
];

export type CandidateMatchupSummary = {
  candidateId: string;
  ratedCount: number;
  unratedCount: number;
  counts: Record<MatchupRating, number>;
};

export function matchupKey(
  candidatePokemonId: string,
  rankingEntryId: string,
): string {
  return `${candidatePokemonId}\u0000${rankingEntryId}`;
}

export function createMatchupMap(
  matchups: Matchup[],
): Map<string, Matchup> {
  return new Map(
    matchups.map((matchup) => [
      matchupKey(matchup.candidatePokemonId, matchup.rankingEntryId),
      matchup,
    ]),
  );
}

export function getNextMatchupRating(
  rating: MatchupRating,
): MatchupRating {
  const index = matchupRatings.indexOf(rating);
  return matchupRatings[(index + 1) % matchupRatings.length];
}

export function getCandidateDisplayName(
  candidate: CandidatePokemon,
  getPokemonName: (pokemonId: string) => string | undefined,
): string {
  return (
    getPokemonName(candidate.pokemonId) ||
    candidate.label ||
    candidate.pokemonId
  );
}

export function filterMatchupCandidates(
  mode: MatchupMode,
  candidates: CandidatePokemon[],
  team: Team | undefined,
  query: string,
  getPokemonName: (pokemonId: string) => string | undefined,
): CandidatePokemon[] {
  const teamCandidateIds = new Set(
    team?.pokemon.map((pokemon) => pokemon.candidatePokemonId) ?? [],
  );
  const normalized = query.trim().toLowerCase();

  return candidates.filter((candidate) => {
    const isInMode =
      mode === "candidate"
        ? candidate.isVisibleInCandidateMatchups
        : teamCandidateIds.has(candidate.id);
    if (!isInMode) return false;
    if (!normalized) return true;
    return [
      getPokemonName(candidate.pokemonId),
      candidate.label,
      candidate.pokemonId,
      ...candidate.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });
}

export function filterRankingEntries(
  entries: RankingEntry[],
  query: string,
  getPokemonName: (pokemonId: string) => string | undefined,
): RankingEntry[] {
  const normalized = query.trim().toLowerCase();
  return [...entries]
    .sort((a, b) => a.rank - b.rank)
    .filter((entry) => {
      if (!normalized) return true;
      return [getPokemonName(entry.pokemonId), entry.pokemonId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
}

export function summarizeCandidateMatchups(
  candidates: CandidatePokemon[],
  rankingEntries: RankingEntry[],
  matchups: Matchup[],
): CandidateMatchupSummary[] {
  const matchupMap = createMatchupMap(matchups);
  return candidates.map((candidate) => {
    const counts = Object.fromEntries(
      matchupRatings.map((rating) => [rating, 0]),
    ) as Record<MatchupRating, number>;
    for (const entry of rankingEntries) {
      const rating =
        matchupMap.get(matchupKey(candidate.id, entry.id))?.rating ??
        "unrated";
      counts[rating] += 1;
    }
    const ratedCount = rankingEntries.length - counts.unrated;
    return {
      candidateId: candidate.id,
      ratedCount,
      unratedCount: counts.unrated,
      counts,
    };
  });
}
