import { describe, expect, it } from "vitest";
import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  Team,
} from "../types/pokemon";
import {
  analyzePokemonWeaknesses,
  comparePokemonWeaknessEntries,
  type PokemonWeaknessEntry,
} from "./pokemonWeaknessAnalysis";

const timestamp = "2026-01-01T00:00:00.000Z";
const candidates: CandidatePokemon[] = [
  {
    id: "candidate-a",
    pokemonId: "garchomp",
    label: "スカーフ型",
  },
  {
    id: "candidate-b",
    pokemonId: "garchomp",
    label: "ステロ型",
  },
  {
    id: "candidate-c",
    pokemonId: "vaporeon",
    label: "シャワーズ",
  },
].map((candidate) => ({
  ...candidate,
  status: "considering",
  roleIds: [],
  tags: [],
  isVisibleInCandidateMatchups: true,
  createdAt: timestamp,
  updatedAt: timestamp,
}));

const team: Team = {
  id: "team-a",
  name: "構築A",
  status: "active",
  createdAt: timestamp,
  updatedAt: timestamp,
  pokemon: candidates.map((candidate, index) => ({
    id: `team-pokemon-${index}`,
    candidatePokemonId: candidate.id,
    moves: [],
  })),
};

function rankingEntry(id: string, rank: number): RankingEntry {
  return {
    id,
    pokemonId: id,
    rank,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  };
}

const entries = [
  rankingEntry("warning-excellent", 1),
  rankingEntry("warning-good", 2),
  rankingEntry("difficult-even", 3),
  rankingEntry("unrated", 4),
  rankingEntry("stable", 5),
  rankingEntry("difficult-low", 6),
];

function matchup(
  candidatePokemonId: string,
  rankingEntryId: string,
  rating: MatchupRating,
): Matchup {
  return {
    id: `${candidatePokemonId}-${rankingEntryId}`,
    candidatePokemonId,
    rankingEntryId,
    rating,
  };
}

const matchups: Matchup[] = [
  matchup("candidate-a", "warning-excellent", "very-good"),
  matchup("candidate-b", "warning-excellent", "bad"),
  matchup("candidate-a", "warning-good", "good"),
  matchup("candidate-b", "warning-good", "even"),
  matchup("candidate-a", "difficult-even", "even"),
  matchup("candidate-b", "difficult-even", "bad"),
  matchup("candidate-a", "stable", "good"),
  matchup("candidate-b", "stable", "very-good"),
  matchup("candidate-a", "difficult-low", "very-bad"),
  matchup("candidate-b", "difficult-low", "bad"),
];

describe("analyzePokemonWeaknesses", () => {
  it("全Candidate未評価なら未評価へ分類する", () => {
    const result = analyzePokemonWeaknesses(
      team,
      candidates,
      entries,
      matchups,
    );

    expect(result.groups.unrated.map((item) => item.rankingEntry.id)).toEqual([
      "unrated",
    ]);
    expect(result.groups.unrated[0]?.bestRating).toBe("unrated");
  });

  it("△や×のみなら対応困難、○以上1匹なら要注意、2匹以上なら安定対応にする", () => {
    const result = analyzePokemonWeaknesses(
      team,
      candidates,
      entries,
      matchups,
    );

    expect(
      result.groups.difficult.map((item) => item.rankingEntry.id),
    ).toEqual(["difficult-low", "difficult-even"]);
    expect(
      result.groups.warning.map((item) => item.rankingEntry.id),
    ).toEqual(["warning-good", "warning-excellent"]);
    expect(result.groups.stable[0]).toMatchObject({
      goodOrBetterCount: 2,
      excellentCount: 1,
      bestRating: "very-good",
    });
  });

  it("最良評価、○以上人数、◎人数を正しく集計する", () => {
    const result = analyzePokemonWeaknesses(
      team,
      candidates,
      entries,
      matchups,
    );
    const warning = result.entries.find(
      (item) => item.rankingEntry.id === "warning-excellent",
    );

    expect(warning).toMatchObject({
      bestRating: "very-good",
      goodOrBetterCount: 1,
      excellentCount: 1,
      evaluatedCount: 2,
    });
  });

  it("同じpokemonIdのCandidateをCandidate.idで別々に集計し、Team順を維持する", () => {
    const result = analyzePokemonWeaknesses(
      team,
      candidates,
      entries,
      matchups,
    );
    const warning = result.entries.find(
      (item) => item.rankingEntry.id === "warning-good",
    );

    expect(
      warning?.assignments.map(({ candidate, rating }) => ({
        id: candidate.id,
        pokemonId: candidate.pokemonId,
        rating,
      })),
    ).toEqual([
      { id: "candidate-a", pokemonId: "garchomp", rating: "good" },
      { id: "candidate-b", pokemonId: "garchomp", rating: "even" },
      { id: "candidate-c", pokemonId: "vaporeon", rating: "unrated" },
    ]);
  });

  it("Team変更で分類結果が変わる", () => {
    const smallerTeam = {
      ...team,
      id: "team-b",
      pokemon: [team.pokemon[1]],
    };
    const result = analyzePokemonWeaknesses(
      smallerTeam,
      candidates,
      entries,
      matchups,
    );

    expect(
      result.groups.difficult.map((item) => item.rankingEntry.id),
    ).toContain("warning-good");
    expect(
      result.groups.warning.map((item) => item.rankingEntry.id),
    ).not.toContain("warning-good");
  });
});

describe("comparePokemonWeaknessEntries", () => {
  function item(
    rank: number,
    bestRating: MatchupRating,
    goodOrBetterCount: number,
    excellentCount: number,
  ): PokemonWeaknessEntry {
    return {
      rankingEntry: rankingEntry(`entry-${rank}`, rank),
      status: "stable",
      evaluatedCount: 3,
      bestRating,
      goodOrBetterCount,
      excellentCount,
      assignments: [],
    };
  }

  it("最良評価、○以上人数、◎人数、rankの順に並べる", () => {
    const values = [
      item(4, "good", 2, 1),
      item(3, "good", 2, 0),
      item(2, "good", 1, 0),
      item(1, "even", 0, 0),
      item(5, "good", 2, 0),
    ].sort(comparePokemonWeaknessEntries);

    expect(values.map((value) => value.rankingEntry.rank)).toEqual([
      1, 2, 3, 5, 4,
    ]);
  });

  it("未評価グループはrank昇順にする", () => {
    const values = [
      { ...item(2, "unrated", 0, 0), status: "unrated" as const },
      { ...item(1, "unrated", 0, 0), status: "unrated" as const },
    ].sort(comparePokemonWeaknessEntries);

    expect(values.map((value) => value.rankingEntry.rank)).toEqual([1, 2]);
  });
});
