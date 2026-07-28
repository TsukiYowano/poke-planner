import { describe, expect, it } from "vitest";
import type { PlannerDataV1, PlannerDataV2 } from "./types";
import { migratePlannerData } from "./migration";

const rankingSet = {
  id: "ranking",
  name: "Ranking",
  entries: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function createV1(overrides: Partial<PlannerDataV1> = {}): PlannerDataV1 {
  return {
    version: 1,
    exportedAt: "2026-02-01T00:00:00.000Z",
    teams: [],
    candidates: [],
    rankingSet,
    matchups: [],
    ...overrides,
  };
}

function createIdFactory(): (prefix: string) => string {
  let sequence = 0;
  return (prefix) => `${prefix}-generated-${++sequence}`;
}

describe("migratePlannerData v1 → v2", () => {
  it("旧Candidateの値を維持し、labelと相性表表示フラグを追加する", () => {
    const result = migratePlannerData(
      createV1({
        candidates: [
          {
            id: "v1-candidate",
            pokemonId: "unknown-pokemon-123",
            status: "promising",
            roleIds: ["pivot"],
            tags: ["tag"],
            memo: "既存メモ",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-02-01T00:00:00.000Z",
          },
        ],
      }),
      {
        getPokemonName: () => undefined,
      },
    );

    expect(result.candidates).toEqual([
      {
        id: "v1-candidate",
        pokemonId: "unknown-pokemon-123",
        label: "unknown-pokemon-123",
        status: "promising",
        roleIds: ["pivot"],
        tags: ["tag"],
        memo: "既存メモ",
        isVisibleInCandidateMatchups: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-02-01T00:00:00.000Z",
      },
    ]);
  });

  it("旧CandidateのabilityIdを特性名付きでmemo末尾へ移す", () => {
    const result = migratePlannerData(
      createV1({
        candidates: [
          {
            id: "v1-candidate",
            pokemonId: "arcanine",
            status: "considering",
            abilityId: "intimidate",
            roleIds: [],
            tags: [],
            memo: "既存の候補メモ",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      }),
      {
        getPokemonName: () => "ウインディ",
        getAbilityName: () => "いかく",
      },
    );

    expect(result.candidates[0]).not.toHaveProperty("abilityId");
    expect(result.candidates[0].memo).toBe(
      "既存の候補メモ\n\n旧想定特性: いかく",
    );
  });

  it("特性名を解決できない旧abilityIdをmemoへID付きで残す", () => {
    const result = migratePlannerData(
      createV1({
        candidates: [
          {
            id: "v1-candidate",
            pokemonId: "unknown",
            status: "considering",
            abilityId: "unknown-ability",
            roleIds: [],
            tags: [],
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      }),
      {
        getAbilityName: () => undefined,
      },
    );

    expect(result.candidates[0].memo).toBe(
      "旧想定特性ID: unknown-ability",
    );
  });

  it("旧TeamPokemonごとに新Candidateを生成し構築固有情報を維持する", () => {
    const result = migratePlannerData(
      createV1({
        teams: [
          {
            id: "team-1",
            name: "Team",
            status: "active",
            createdAt: "2025-03-01T00:00:00.000Z",
            updatedAt: "2025-04-01T00:00:00.000Z",
            pokemon: [
              {
                id: "old-team-pokemon-1",
                pokemonId: "garchomp",
                nickname: "ガブ",
                abilityId: "rough-skin",
                item: "オボンのみ",
                nature: "ようき",
                moves: ["じしん"],
                effortValues: { hp: 32 },
                roleIds: ["physical-attacker"],
                tags: ["HD"],
                memo: "構築内メモ",
              },
              {
                id: "old-team-pokemon-2",
                pokemonId: "garchomp",
                moves: [],
                roleIds: ["fast-attacker"],
                tags: ["AS"],
              },
            ],
          },
        ],
      }),
      {
        createId: createIdFactory(),
        getPokemonName: () => "ガブリアス",
      },
    );

    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.map((candidate) => candidate.id)).toEqual([
      "candidate-generated-1",
      "candidate-generated-2",
    ]);
    expect(result.candidates[0]).toMatchObject({
      pokemonId: "garchomp",
      label: "ガブリアス",
      status: "considering",
      roleIds: ["physical-attacker"],
      tags: ["HD"],
      memo: undefined,
      isVisibleInCandidateMatchups: true,
      createdAt: "2025-03-01T00:00:00.000Z",
      updatedAt: "2025-04-01T00:00:00.000Z",
    });
    expect(result.teams[0].pokemon[0]).toEqual({
      id: "old-team-pokemon-1",
      candidatePokemonId: "candidate-generated-1",
      nickname: "ガブ",
      abilityId: "rough-skin",
      item: "オボンのみ",
      nature: "ようき",
      moves: ["じしん"],
      effortValues: { hp: 32 },
      memo: "構築内メモ",
    });
  });

  it("生成Candidateの日時を所属Teamから決定的にフォールバックする", () => {
    const result = migratePlannerData(
      createV1({
        exportedAt: undefined,
        teams: [
          {
            id: "team-1",
            name: "Team",
            status: "draft",
            pokemon: [
              {
                id: "old-team-pokemon",
                pokemonId: "unknown",
                moves: [],
                roleIds: [],
                tags: [],
              },
            ],
          },
        ],
      }),
      {
        createId: () => "new-candidate",
      },
    );

    expect(result.exportedAt).toBe("1970-01-01T00:00:00.000Z");
    expect(result.candidates[0]).toMatchObject({
      createdAt: "1970-01-01T00:00:00.000Z",
      updatedAt: "1970-01-01T00:00:00.000Z",
    });
  });

  it("旧Matchupを一時Map経由でCandidate参照へ変換し、重複は後勝ちにする", () => {
    const result = migratePlannerData(
      createV1({
        teams: [
          {
            id: "team",
            name: "Team",
            status: "draft",
            pokemon: [
              {
                id: "old-team-pokemon",
                pokemonId: "garchomp",
                moves: [],
                roleIds: [],
                tags: [],
              },
            ],
          },
        ],
        matchups: [
          {
            id: "first",
            teamPokemonId: "old-team-pokemon",
            rankingEntryId: "enemy",
            rating: "good",
            memo: "first memo",
          },
          {
            id: "orphan",
            teamPokemonId: "missing-team-pokemon",
            rankingEntryId: "enemy",
            rating: "even",
          },
          {
            id: "last",
            teamPokemonId: "old-team-pokemon",
            rankingEntryId: "enemy",
            rating: "very-bad",
            memo: "last memo",
          },
        ],
      }),
      {
        createId: () => "new-candidate",
      },
    );

    expect(result.matchups).toEqual([
      {
        id: "last",
        candidatePokemonId: "new-candidate",
        rankingEntryId: "enemy",
        rating: "very-bad",
        memo: "last memo",
      },
    ]);
  });
});

describe("migratePlannerData v2 normalization", () => {
  const v2: PlannerDataV2 = {
    version: 2,
    exportedAt: "2026-02-01T00:00:00.000Z",
    teams: [],
    candidates: [],
    rankingSet,
    matchups: [],
  };

  it("正規化が不要なv2データを変更しない", () => {
    expect(migratePlannerData(v2)).toBe(v2);
  });

  it("重複する実質キーを後勝ちで正規化する", () => {
    const input: PlannerDataV2 = {
      ...v2,
      matchups: [
        {
          id: "first",
          candidatePokemonId: "candidate",
          rankingEntryId: "enemy",
          rating: "good",
        },
        {
          id: "last",
          candidatePokemonId: "candidate",
          rankingEntryId: "enemy",
          rating: "bad",
          memo: "last",
        },
      ],
    };

    expect(migratePlannerData(input).matchups).toEqual([
      input.matchups[1],
    ]);
  });
});
