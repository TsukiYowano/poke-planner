import { describe, expect, it } from "vitest";
import type {
  CandidatePokemon,
  Team,
} from "../types/pokemon";
import {
  analyzeTypeCoverage,
  getDefensiveTypeCategory,
  summarizeTypeMultipliers,
} from "./typeWeaknessAnalysis";

const timestamp = "2026-01-01T00:00:00.000Z";

function candidate(
  id: string,
  pokemonId: string,
): CandidatePokemon {
  return {
    id,
    pokemonId,
    label: pokemonId,
    status: "considering",
    roleIds: [],
    tags: [],
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function team(candidateIds: string[]): Team {
  return {
    id: "team",
    name: "テスト構築",
    status: "testing",
    pokemon: candidateIds.map((candidatePokemonId, index) => ({
      id: `team-pokemon-${index}`,
      candidatePokemonId,
      moves: [],
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("analyzeTypeCoverage", () => {
  it("18タイプを正式な順序で返す", () => {
    const result = analyzeTypeCoverage(team([]), []);

    expect(result).toHaveLength(18);
    expect(result[0]?.typeId).toBe("normal");
    expect(result[17]?.typeId).toBe("fairy");
  });

  it("単タイプの弱点と半減を集計する", () => {
    const candidates = [candidate("vaporeon", "vaporeon")];
    const result = analyzeTypeCoverage(
      team(["vaporeon"]),
      candidates,
    );

    expect(
      result.find((item) => item.typeId === "electric")
        ?.weaknessCount,
    ).toBe(1);
    expect(
      result.find((item) => item.typeId === "fire")?.resistCount,
    ).toBe(1);
  });

  it("複合タイプの4倍弱点とタイプ無効を集計する", () => {
    const candidates = [candidate("garchomp", "garchomp")];
    const result = analyzeTypeCoverage(
      team(["garchomp"]),
      candidates,
    );
    const ice = result.find((item) => item.typeId === "ice");
    const electric = result.find(
      (item) => item.typeId === "electric",
    );

    expect(ice?.fourTimesWeaknessCount).toBe(1);
    expect(ice?.weaknessCount).toBe(0);
    expect(ice?.teamPokemon[0]?.multiplier).toBe(4);
    expect(electric?.immuneCount).toBe(1);
  });

  it("構築を変更すると集計結果も変わる", () => {
    const candidates = [
      candidate("vaporeon", "vaporeon"),
      candidate("garchomp", "garchomp"),
    ];
    const before = analyzeTypeCoverage(
      team(["vaporeon"]),
      candidates,
    );
    const after = analyzeTypeCoverage(
      team(["vaporeon", "garchomp"]),
      candidates,
    );

    expect(
      before.find((item) => item.typeId === "electric")
        ?.immuneCount,
    ).toBe(0);
    expect(
      before.find((item) => item.typeId === "electric")
        ?.isUnresisted,
    ).toBe(true);
    expect(
      after.find((item) => item.typeId === "electric")
        ?.immuneCount,
    ).toBe(1);
    expect(
      after.find((item) => item.typeId === "electric")
        ?.isUnresisted,
    ).toBe(false);
  });
});

describe("summarizeTypeMultipliers", () => {
  it("4倍弱点と2倍弱点を重複せず集計する", () => {
    const summary = summarizeTypeMultipliers([4, 2]);

    expect(summary.fourTimesWeaknessCount).toBe(1);
    expect(summary.weaknessCount).toBe(1);
  });

  it("1/4耐性を耐性側へ集計する", () => {
    expect(
      summarizeTypeMultipliers([0.25]).resistCount,
    ).toBe(1);
  });

  it("半減も無効もなければ一貫ありと判定する", () => {
    expect(
      summarizeTypeMultipliers([1, 2]).isUnresisted,
    ).toBe(true);
  });

  it("半減または無効があれば一貫なしと判定する", () => {
    expect(
      summarizeTypeMultipliers([0.5, 1]).isUnresisted,
    ).toBe(false);
    expect(
      summarizeTypeMultipliers([0, 1]).isUnresisted,
    ).toBe(false);
  });

  it("弱点側と耐性側の差が2以上なら苦手と判定する", () => {
    expect(
      summarizeTypeMultipliers([4, 2, 1]).isWeakType,
    ).toBe(true);
    expect(
      summarizeTypeMultipliers([4, 0.5]).isWeakType,
    ).toBe(false);
    expect(
      summarizeTypeMultipliers([4]).isWeakType,
    ).toBe(false);
  });

  it("一貫ありと苦手の両方へ該当できる", () => {
    const summary = summarizeTypeMultipliers([4, 2, 1]);

    expect(summary.isUnresisted).toBe(true);
    expect(summary.isWeakType).toBe(true);
  });
});

describe("getDefensiveTypeCategory", () => {
  it("弱点・半減・無効・等倍を分類する", () => {
    expect(getDefensiveTypeCategory(4)).toBe("weakness");
    expect(getDefensiveTypeCategory(2)).toBe("weakness");
    expect(getDefensiveTypeCategory(0.5)).toBe("resist");
    expect(getDefensiveTypeCategory(0.25)).toBe("resist");
    expect(getDefensiveTypeCategory(0)).toBe("immune");
    expect(getDefensiveTypeCategory(1)).toBe("neutral");
  });
});
