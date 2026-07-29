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
  getGoodOrBetterCount,
  loadSelectedCandidateIds,
  MATCHUP_SELECTED_CANDIDATES_STORAGE_KEY,
  normalizeSelectedCandidateIds,
  parseSelectedCandidateIds,
  saveSelectedCandidateIds,
  matchupKey,
  matchupUiText,
  summarizeCandidateMatchups,
  summarizeTeamRankingMatchup,
  toggleSelectedCandidateId,
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
    expect(getGoodOrBetterCount(summary[0])).toBe(1);
    expect(summary[1].unratedCount).toBe(2);
  });

  it("評価・メモをCandidateとRankingEntryの複合キーで参照する", () => {
    const map = createMatchupMap(matchups);
    expect(map.get(matchupKey("garchomp-scarf", "enemy-a"))).toMatchObject({
      rating: "good",
      memo: "対面有利",
    });
  });

  it("候補モードの初期選択は表示対象の先頭から最大3件にする", () => {
    const extraVisible = {
      ...candidates[0],
      id: "fourth",
      pokemonId: "metagross",
    };
    expect(
      normalizeSelectedCandidateIds([], [
        ...candidates.slice(0, 2),
        extraVisible,
        { ...extraVisible, id: "fifth" },
      ]),
    ).toEqual(["garchomp-scarf", "garchomp-rocks", "fourth"]);
  });

  it("同種候補をCandidate ID単位で別々に選択でき、最大3件に制限する", () => {
    const selected = toggleSelectedCandidateId(
      ["garchomp-scarf"],
      "garchomp-rocks",
    );
    expect(selected).toEqual(["garchomp-scarf", "garchomp-rocks"]);
    expect(toggleSelectedCandidateId([...selected, "third"], "fourth")).toEqual([
      "garchomp-scarf",
      "garchomp-rocks",
      "third",
    ]);
    expect(toggleSelectedCandidateId(["garchomp-scarf"], "garchomp-scarf")).toEqual([
      "garchomp-scarf",
    ]);
  });

  it("保存済み選択から削除済み・非表示候補を除外する", () => {
    expect(
      normalizeSelectedCandidateIds(
        ["garchomp-rocks", "deleted", "hidden"],
        candidates,
      ),
    ).toEqual(["garchomp-rocks"]);
  });

  it("壊れたlocalStorage値は安全に初期状態へ戻す", () => {
    expect(parseSelectedCandidateIds("{broken")).toEqual([]);
    expect(parseSelectedCandidateIds(JSON.stringify({ id: "x" }))).toEqual([]);
    expect(
      parseSelectedCandidateIds(
        JSON.stringify(["garchomp-scarf", "garchomp-scarf", 42]),
      ),
    ).toEqual(["garchomp-scarf"]);
  });

  it("選択中のCandidate IDをUI専用キーへ保存し復元する", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    saveSelectedCandidateIds(storage, [
      "garchomp-scarf",
      "garchomp-rocks",
    ]);
    expect(
      JSON.parse(
        values.get(MATCHUP_SELECTED_CANDIDATES_STORAGE_KEY) ?? "[]",
      ),
    ).toEqual(["garchomp-scarf", "garchomp-rocks"]);
    expect(loadSelectedCandidateIds(storage)).toEqual([
      "garchomp-scarf",
      "garchomp-rocks",
    ]);
  });

  it("構築モードの○以上件数と最良評価を既存評価段階で集計する", () => {
    const map = createMatchupMap([
      ...matchups,
      {
        id: "matchup-b",
        candidatePokemonId: "garchomp-rocks",
        rankingEntryId: "enemy-a",
        rating: "very-good",
      },
    ]);
    expect(
      summarizeTeamRankingMatchup(candidates.slice(0, 2), "enemy-a", map),
    ).toEqual({
      goodOrBetterCount: 2,
      candidateCount: 2,
      bestRating: "very-good",
    });
  });
});
