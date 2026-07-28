import { describe, expect, it } from "vitest";
import type { PlannerDataV1, PlannerDataV2 } from "./types";
import {
  parsePlannerData,
  parsePlannerDataJson,
  serializePlannerData,
} from "./serialization";

const rankingSet = {
  id: "ranking",
  name: "Ranking",
  entries: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const v2: PlannerDataV2 = {
  version: 2,
  exportedAt: "2026-01-01T00:00:00.000Z",
  teams: [],
  candidates: [],
  rankingSet,
  matchups: [],
};

describe("Planner serialization", () => {
  it("JSON exportはversion 2になり、importとの往復で内容を維持する", () => {
    const json = serializePlannerData(
      v2,
      "2026-02-01T00:00:00.000Z",
      true,
    );
    const raw = JSON.parse(json) as Record<string, unknown>;

    expect(raw.version).toBe(2);
    expect(parsePlannerDataJson(json)).toEqual({
      ...v2,
      exportedAt: "2026-02-01T00:00:00.000Z",
    });
  });

  it("Supabase読み込み相当のv1 payloadも共通Migrationを通る", () => {
    const cloudPayload: PlannerDataV1 = {
      version: 1,
      exportedAt: "2025-01-01T00:00:00.000Z",
      teams: [],
      candidates: [],
      rankingSet,
      matchups: [],
    };

    expect(parsePlannerData(cloudPayload).version).toBe(2);
  });
});
