import { describe, expect, it } from "vitest";
import type {
  CandidatePokemon,
  Matchup,
  RankingEntry,
  Team,
} from "../types/pokemon";
import {
  createMatchupMap,
  filterMatchupCandidates,
  filterRankingEntries,
  getCandidateDisplayName,
  matchupKey,
  matchupUiText,
  summarizeCandidateMatchups,
} from "./matchupTable";

const timestamp = "2026-01-01T00:00:00.000Z";
const candidates: CandidatePokemon[] = [
  {
    id: "garchomp-scarf",
    pokemonId: "garchomp",
    label: "スカーフ型",
    status: "considering",
    roleIds: [],
    tags: ["高速"],
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "garchomp-rocks",
    pokemonId: "garchomp",
    label: "ステロ型",
    status: "considering",
    roleIds: [],
    tags: ["起点作成"],
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "hidden",
    pokemonId: "rotom",
    label: "非表示",
    status: "considering",
    roleIds: [],
    tags: [],
    isVisibleInCandidateMatchups: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];
const team: Team = {
  id: "team",
  name: "team",
  status: "active",
  createdAt: timestamp,
  updatedAt: timestamp,
  pokemon: [
    { id: "team-pokemon", candidatePokemonId: "hidden", moves: [] },
  ],
};
const entries: RankingEntry[] = [
  {
    id: "enemy-a",
    pokemonId: "charizard",
    rank: 2,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  },
  {
    id: "enemy-b",
    pokemonId: "metagross",
    rank: 1,
    assumedMoves: [],
    roleIds: [],
    tags: [],
  },
];
const matchups: Matchup[] = [
  {
    id: "matchup-a",
    candidatePokemonId: "garchomp-scarf",
    rankingEntryId: "enemy-a",
    rating: "good",
    memo: "対面有利",
  },
];
const names: Record<string, string> = {
  garchomp: "ガブリアス",
  charizard: "リザードン",
  metagross: "メタグロス",
};
const getName = (id: string) => names[id];

describe("candidate matchup table selectors", () => {
  it("利用者向け文言は候補表記を使用する", () => {
    expect(matchupUiText.candidateList).toBe("候補一覧");
    expect(matchupUiText.candidateSummary).toBe("候補別集計");
    expect(Object.values(matchupUiText).join(" ")).not.toContain("Candidate");
  });
  it("Candidateモードでは同種Candidateを別IDの列として表示する", () => {
    expect(
      filterMatchupCandidates("candidate", candidates, team, "", getName).map(
        (candidate) => candidate.id,
      ),
    ).toEqual(["garchomp-scarf", "garchomp-rocks"]);
  });

  it("PokemonMasterがない場合はlabel、次にpokemonIdを表示名にする", () => {
    expect(getCandidateDisplayName(candidates[2], getName)).toBe("非表示");
    expect(
      getCandidateDisplayName({ ...candidates[2], label: "" }, getName),
    ).toBe("rotom");
  });

  it("isVisibleInCandidateMatchupsをCandidateモードだけに適用する", () => {
    expect(
      filterMatchupCandidates("candidate", candidates, team, "", getName),
    ).toHaveLength(2);
    expect(
      filterMatchupCandidates("team", candidates, team, "", getName).map(
        (candidate) => candidate.id,
      ),
    ).toEqual(["hidden"]);
  });

  it("Pokemon名・label・pokemonId・tagsでCandidate検索する", () => {
    expect(
      filterMatchupCandidates("candidate", candidates, team, "ガブリアス", getName),
    ).toHaveLength(2);
    expect(
      filterMatchupCandidates("candidate", candidates, team, "ステロ", getName)[0]
        .id,
    ).toBe("garchomp-rocks");
    expect(
      filterMatchupCandidates("candidate", candidates, team, "高速", getName)[0]
        .id,
    ).toBe("garchomp-scarf");
  });

  it("RankingEntryのPokemon名で検索し順位順にする", () => {
    expect(filterRankingEntries(entries, "リザードン", getName)[0].id).toBe(
      "enemy-a",
    );
    expect(filterRankingEntries(entries, "", getName).map((entry) => entry.id)).toEqual([
      "enemy-b",
      "enemy-a",
    ]);
  });

  it("Candidateごとの評価済み・未評価・評価別件数を集計する", () => {
    const summary = summarizeCandidateMatchups(
      candidates.slice(0, 2),
      entries,
      matchups,
    );
    expect(summary[0]).toMatchObject({
      candidateId: "garchomp-scarf",
      ratedCount: 1,
      unratedCount: 1,
    });
    expect(summary[0].counts.good).toBe(1);
    expect(summary[1].unratedCount).toBe(2);
  });

  it("評価・メモをCandidateとRankingEntryの複合キーで参照する", () => {
    const map = createMatchupMap(matchups);
    expect(map.get(matchupKey("garchomp-scarf", "enemy-a"))).toMatchObject({
      rating: "good",
      memo: "対面有利",
    });
  });
});
