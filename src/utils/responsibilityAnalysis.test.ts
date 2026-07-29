import { describe, expect, it } from "vitest";
import type {
  CandidatePokemon,
  Matchup,
  RankingEntry,
  Team,
} from "../types/pokemon";
import {
  analyzeTeamResponsibilities,
  selectDangerousRankingEntries,
} from "./responsibilityAnalysis";

const timestamp = "2026-01-01T00:00:00.000Z";
const candidates: CandidatePokemon[] = ["a", "b", "c"].map((id) => ({
  id: `candidate-${id}`,
  pokemonId: `pokemon-${id}`,
  label: `候補${id}`,
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
  pokemon: candidates.map((candidate) => ({
    id: `team-${candidate.id}`,
    candidatePokemonId: candidate.id,
    moves: [],
  })),
};
const entries: RankingEntry[] = [
  {
    id: "entry-shared",
    pokemonId: "shared",
    rank: 2,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  },
  {
    id: "entry-uncovered",
    pokemonId: "uncovered",
    rank: 3,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  },
  {
    id: "entry-partially-unrated",
    pokemonId: "partially-unrated",
    rank: 4,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  },
  {
    id: "entry-sole",
    pokemonId: "sole",
    rank: 1,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  },
];
const matchups: Matchup[] = [
  {
    id: "sole-good",
    candidatePokemonId: "candidate-a",
    rankingEntryId: "entry-sole",
    rating: "good",
  },
  {
    id: "sole-even",
    candidatePokemonId: "candidate-b",
    rankingEntryId: "entry-sole",
    rating: "even",
  },
  {
    id: "shared-very-good",
    candidatePokemonId: "candidate-a",
    rankingEntryId: "entry-shared",
    rating: "very-good",
  },
  {
    id: "shared-good",
    candidatePokemonId: "candidate-b",
    rankingEntryId: "entry-shared",
    rating: "good",
  },
  {
    id: "uncovered-even",
    candidatePokemonId: "candidate-a",
    rankingEntryId: "entry-uncovered",
    rating: "even",
  },
  {
    id: "uncovered-bad",
    candidatePokemonId: "candidate-b",
    rankingEntryId: "entry-uncovered",
    rating: "bad",
  },
  {
    id: "uncovered-very-bad",
    candidatePokemonId: "candidate-c",
    rankingEntryId: "entry-uncovered",
    rating: "very-bad",
  },
  {
    id: "partially-unrated-bad",
    candidatePokemonId: "candidate-a",
    rankingEntryId: "entry-partially-unrated",
    rating: "bad",
  },
];

describe("responsibility analysis", () => {
  it("単独対応・共同対応・対応なしを判定し順位順にする", () => {
    const result = analyzeTeamResponsibilities(
      team,
      candidates,
      entries,
      matchups,
    );
    expect(
      result.pokemon[0].soleEntries.map(({ entry, rating }) => ({
        id: entry.id,
        rating,
      })),
    ).toEqual([{ id: "entry-sole", rating: "good" }]);
    expect(
      result.pokemon[0].sharedEntries.map(({ entry, rating }) => ({
        id: entry.id,
        rating,
      })),
    ).toEqual([{ id: "entry-shared", rating: "very-good" }]);
    expect(result.pokemon[1].soleEntries).toEqual([]);
    expect(
      result.pokemon[1].sharedEntries.map(({ entry, rating }) => ({
        id: entry.id,
        rating,
      })),
    ).toEqual([{ id: "entry-shared", rating: "good" }]);
    expect(result.uncoveredEntries.map((entry) => entry.id)).toEqual([
      "entry-uncovered",
    ]);
    expect(result.unratedEntries.map((entry) => entry.id)).toEqual([
      "entry-partially-unrated",
    ]);
    expect([
      ...result.pokemon[0].soleEntries,
      ...result.pokemon[0].sharedEntries,
    ].map(({ entry }) => entry.rank)).toEqual([1, 2]);
  });

  it("Teamが変わると責任度分析結果も変わる", () => {
    const smallerTeam = {
      ...team,
      id: "team-b",
      pokemon: [team.pokemon[1]],
    };
    const result = analyzeTeamResponsibilities(
      smallerTeam,
      candidates,
      entries,
      matchups,
    );
    expect(
      result.pokemon[0].soleEntries.map(({ entry }) => entry.id),
    ).toEqual(["entry-shared"]);
    expect(result.pokemon[0].sharedEntries).toEqual([]);
    expect(result.uncoveredEntries.map((entry) => entry.id)).toEqual([
      "entry-sole",
      "entry-uncovered",
    ]);
    expect(result.unratedEntries.map((entry) => entry.id)).toEqual([
      "entry-partially-unrated",
    ]);
  });

  it("○以上がなく1体でも未入力なら対応なしではなく未評価にする", () => {
    const result = analyzeTeamResponsibilities(
      team,
      candidates,
      entries,
      matchups,
    );
    expect(result.uncoveredEntries.map((entry) => entry.id)).not.toContain(
      "entry-partially-unrated",
    );
    expect(result.unratedEntries.map((entry) => entry.id)).toContain(
      "entry-partially-unrated",
    );
  });

  it("危険一覧を対応なしと○以上1匹に分け、未評価と2匹以上を除外する", () => {
    const analysis = analyzeTeamResponsibilities(
      team,
      candidates,
      entries,
      matchups,
    );
    const danger = selectDangerousRankingEntries(analysis);
    expect(danger.uncovered.map(({ entry }) => entry.id)).toEqual([
      "entry-uncovered",
    ]);
    expect(danger.singleCoverage.map(({ entry }) => entry.id)).toEqual([
      "entry-sole",
    ]);
    expect(
      [...danger.uncovered, ...danger.singleCoverage].map(
        ({ entry }) => entry.id,
      ),
    ).not.toContain("entry-partially-unrated");
    expect(
      [...danger.uncovered, ...danger.singleCoverage].map(
        ({ entry }) => entry.id,
      ),
    ).not.toContain("entry-shared");
  });

  it("RankingEntry分析に担当Candidate・評価とTeam順の全評価を保持する", () => {
    const analysis = analyzeTeamResponsibilities(
      team,
      candidates,
      entries,
      matchups,
    );
    const sole = analysis.ranking.find(
      ({ entry }) => entry.id === "entry-sole",
    );
    expect(sole).toMatchObject({
      evaluatedCount: 2,
      goodOrBetterCount: 1,
      coverage: "single",
    });
    expect(sole?.assignments).toEqual([
      {
        teamPokemonId: "team-candidate-a",
        candidatePokemonId: "candidate-a",
        rating: "good",
      },
    ]);
    expect(
      sole?.teamRatings.map(({ candidatePokemonId, rating }) => ({
        candidatePokemonId,
        rating,
      })),
    ).toEqual([
      { candidatePokemonId: "candidate-a", rating: "good" },
      { candidatePokemonId: "candidate-b", rating: "even" },
      { candidatePokemonId: "candidate-c", rating: "unrated" },
    ]);
  });

  it("危険一覧はrank順で、Team変更時に再分類される", () => {
    const smallerTeam = {
      ...team,
      id: "team-b",
      pokemon: [team.pokemon[1]],
    };
    const danger = selectDangerousRankingEntries(
      analyzeTeamResponsibilities(
        smallerTeam,
        candidates,
        entries,
        matchups,
      ),
    );
    expect(
      [...danger.uncovered, ...danger.singleCoverage]
        .sort((left, right) => left.entry.rank - right.entry.rank)
        .map(({ entry }) => entry.id),
    ).toEqual(["entry-sole", "entry-shared", "entry-uncovered"]);
    expect(danger.singleCoverage[0].assignments[0]).toMatchObject({
      candidatePokemonId: "candidate-b",
      rating: "good",
    });
  });
});
