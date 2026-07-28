import { describe, expect, it } from "vitest";
import type { CandidatePokemon } from "../../types/pokemon";
import { createCandidateVisibilityUpdateInput } from "./CandidateEditor";

describe("candidate matchup visibility input", () => {
  it("表示フラグ以外の候補項目を維持する", () => {
    const candidate: CandidatePokemon = {
      id: "candidate",
      pokemonId: "garchomp",
      label: "スカーフ型",
      status: "promising",
      roleIds: ["physical-attacker"],
      tags: ["高速"],
      memo: "既存メモ",
      isVisibleInCandidateMatchups: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    expect(createCandidateVisibilityUpdateInput(candidate, false)).toEqual({
      id: candidate.id,
      label: candidate.label,
      status: candidate.status,
      roleIds: candidate.roleIds,
      tags: candidate.tags,
      memo: candidate.memo,
      isVisibleInCandidateMatchups: false,
    });
  });
});
