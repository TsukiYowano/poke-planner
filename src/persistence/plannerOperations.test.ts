import { describe, expect, it } from "vitest";
import type { CandidatePokemon } from "../types/pokemon";
import type { PlannerDataV2 } from "./types";
import {
  addCandidate,
  addCandidateToTeam,
  deleteCandidate,
  deleteTeam,
  duplicateTeam,
  getCandidateDeletionImpact,
  removeTeamPokemon,
  setMatchupRating,
  createCandidate,
  updateCandidate,
  updateTeamPokemon,
  updateMatchupMemo,
} from "./plannerOperations";

function candidate(
  id: string,
  pokemonId: string,
): CandidatePokemon {
  return {
    id,
    pokemonId,
    label: id,
    status: "considering",
    roleIds: [],
    tags: [],
    isVisibleInCandidateMatchups: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function data(): PlannerDataV2 {
  return {
    version: 2,
    exportedAt: "2026-01-01T00:00:00.000Z",
    currentTeamId: "team-1",
    candidates: [
      candidate("candidate-a", "garchomp"),
      candidate("candidate-b", "garchomp"),
      candidate("candidate-c", "rotom"),
    ],
    teams: [
      {
        id: "team-1",
        name: "Team 1",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        pokemon: [
          {
            id: "team-pokemon-a",
            candidatePokemonId: "candidate-a",
            moves: [],
          },
        ],
      },
      {
        id: "team-2",
        name: "Team 2",
        status: "draft",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        pokemon: [
          {
            id: "team-pokemon-a-2",
            candidatePokemonId: "candidate-a",
            moves: [],
          },
        ],
      },
    ],
    rankingSet: {
      id: "ranking",
      name: "Ranking",
      entries: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    matchups: [
      {
        id: "matchup-a",
        candidatePokemonId: "candidate-a",
        rankingEntryId: "enemy",
        rating: "good",
      },
      {
        id: "matchup-c",
        candidatePokemonId: "candidate-c",
        rankingEntryId: "enemy",
        rating: "even",
      },
    ],
  };
}

describe("Planner v2 operations", () => {
  it("Candidate作成時の正式な初期値を設定する", () => {
    const created = createCandidate(
      "candidate-new",
      "garchomp",
      "ガブリアス",
      "2026-03-01T00:00:00.000Z",
    );

    expect(created).toEqual({
      id: "candidate-new",
      pokemonId: "garchomp",
      label: "ガブリアス",
      status: "considering",
      roleIds: [],
      tags: [],
      memo: undefined,
      isVisibleInCandidateMatchups: true,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    });
    expect(created).not.toHaveProperty("abilityId");
    expect(created).not.toHaveProperty("item");
    expect(created).not.toHaveProperty("moves");
  });

  it("同じpokemonIdを持つCandidateを複数作成できる", () => {
    const input = data();
    const result = addCandidate(
      input,
      candidate("candidate-d", "garchomp"),
    );

    expect(result.result.success).toBe(true);
    expect(result.data.candidates).toHaveLength(4);
  });

  it("同一Teamへ同じpokemonIdのCandidateを追加できない", () => {
    const result = addCandidateToTeam(
      data(),
      "team-1",
      "candidate-b",
      "new-team-pokemon",
    );

    expect(result.result).toEqual({
      success: false,
      message: "同じポケモンがすでに構築へ入っています。",
    });
  });

  it("TeamPokemon編集では構築固有情報だけを更新する", () => {
    const result = updateTeamPokemon(data(), "team-1", "team-pokemon-a", {
      nickname: "スカーフ",
      abilityId: "rough-skin",
      item: "こだわりスカーフ",
      nature: "ようき",
      moves: ["じしん"],
      effortValues: { attack: 252, speed: 252 },
      memo: "終盤用",
    });

    expect(result.result.success).toBe(true);
    expect(result.data.teams[0].pokemon[0]).toEqual({
      id: "team-pokemon-a",
      candidatePokemonId: "candidate-a",
      nickname: "スカーフ",
      abilityId: "rough-skin",
      item: "こだわりスカーフ",
      nature: "ようき",
      moves: ["じしん"],
      effortValues: { attack: 252, speed: 252 },
      memo: "終盤用",
    });
  });

  it("Candidate編集で許可項目だけを更新しタグを正規化する", () => {
    const result = updateCandidate(
      data(),
      {
        id: "candidate-a",
        label: "  スカーフ型  ",
        status: "promising",
        roleIds: ["fast-attacker"],
        tags: ["高速", " 高速 ", "", "終盤"],
        memo: "  更新メモ  ",
        isVisibleInCandidateMatchups: false,
      },
      "2026-04-01T00:00:00.000Z",
    );
    const updated = result.data.candidates[0];

    expect(updated).toMatchObject({
      id: "candidate-a",
      pokemonId: "garchomp",
      label: "スカーフ型",
      status: "promising",
      roleIds: ["fast-attacker"],
      tags: ["高速", "終盤"],
      memo: "更新メモ",
      isVisibleInCandidateMatchups: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
  });

  it("相性表の表示切替で他項目とMatchupを維持し再表示できる", () => {
    const input = data();
    const source = input.candidates[0];
    const hidden = updateCandidate(
      input,
      {
        id: source.id,
        label: source.label,
        status: source.status,
        roleIds: source.roleIds,
        tags: source.tags,
        memo: source.memo,
        isVisibleInCandidateMatchups: false,
      },
      "2026-05-01T00:00:00.000Z",
    );

    expect(hidden.data.candidates[0]).toMatchObject({
      ...source,
      isVisibleInCandidateMatchups: false,
      updatedAt: "2026-05-01T00:00:00.000Z",
    });
    expect(hidden.data.matchups).toEqual(input.matchups);

    const restored = updateCandidate(
      hidden.data,
      {
        id: source.id,
        label: source.label,
        status: source.status,
        roleIds: source.roleIds,
        tags: source.tags,
        memo: source.memo,
        isVisibleInCandidateMatchups: true,
      },
      "2026-05-02T00:00:00.000Z",
    );
    expect(restored.data.candidates[0].isVisibleInCandidateMatchups).toBe(true);
    expect(restored.data.matchups).toEqual(input.matchups);
  });

  it("Candidate削除影響件数を返す", () => {
    expect(
      getCandidateDeletionImpact(data(), "candidate-a"),
    ).toEqual({
      teamCount: 2,
      teamPokemonCount: 2,
      matchupCount: 1,
    });
  });

  it("Candidate削除でTeamPokemonとMatchupを削除しTeamは残す", () => {
    const result = deleteCandidate(data(), "candidate-a");

    expect(result.result.success).toBe(true);
    expect(result.data.candidates.map((item) => item.id)).not.toContain(
      "candidate-a",
    );
    expect(result.data.teams).toHaveLength(2);
    expect(
      result.data.teams.flatMap((team) => team.pokemon),
    ).toHaveLength(0);
    expect(result.data.matchups.map((item) => item.id)).toEqual([
      "matchup-c",
    ]);
  });

  it("Team削除でMatchupを維持する", () => {
    const result = deleteTeam(data(), "team-1");

    expect(result.result.success).toBe(true);
    expect(result.data.matchups).toEqual(data().matchups);
  });

  it("TeamPokemon削除でMatchupを維持する", () => {
    const result = removeTeamPokemon(
      data(),
      "team-1",
      "team-pokemon-a",
    );

    expect(result.result.success).toBe(true);
    expect(result.data.teams[0].pokemon).toHaveLength(0);
    expect(result.data.matchups).toEqual(data().matchups);
  });

  it("Team複製でcandidatePokemonIdを維持しTeamPokemon.idを更新する", () => {
    const result = duplicateTeam(
      data(),
      "team-1",
      "team-copy",
      () => "new-team-pokemon",
      "2026-02-01T00:00:00.000Z",
    );

    expect(result.result.success).toBe(true);
    expect(result.data.teams[0].pokemon[0]).toMatchObject({
      id: "new-team-pokemon",
      candidatePokemonId: "candidate-a",
    });
  });

  it("MatchupをCandidateとRankingEntryの組み合わせで更新する", () => {
    const updated = setMatchupRating(
      data(),
      "candidate-a",
      "enemy",
      "very-bad",
      "unused-new-id",
    );

    expect(updated.matchups).toHaveLength(2);
    expect(updated.matchups[0]).toMatchObject({
      id: "matchup-a",
      candidatePokemonId: "candidate-a",
      rankingEntryId: "enemy",
      rating: "very-bad",
    });
  });

  it("MatchupメモをCandidateとRankingEntryの組み合わせで更新する", () => {
    const updated = updateMatchupMemo(
      data(),
      "candidate-a",
      "enemy",
      "交代から有利",
      "unused-new-id",
    );

    expect(updated.matchups).toHaveLength(2);
    expect(updated.matchups[0]).toMatchObject({
      id: "matchup-a",
      candidatePokemonId: "candidate-a",
      rankingEntryId: "enemy",
      memo: "交代から有利",
    });
  });
});
