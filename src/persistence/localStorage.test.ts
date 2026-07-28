import { describe, expect, it } from "vitest";
import type { StorageLike } from "./storageTypes";
import {
  V1_CANDIDATE_STORAGE_KEY,
  V1_MATCHUP_STORAGE_KEY,
  V1_RANKING_STORAGE_KEY,
  V1_TEAMS_STORAGE_KEY,
  V2_STORAGE_KEY,
  loadLocalPlannerData,
  saveLocalPlannerDataIfReady,
} from "./localStorage";
import type { PlannerDataV2 } from "./types";

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  writes: string[] = [];

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes.push(key);
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const rankingSet = {
  id: "ranking",
  name: "Ranking",
  entries: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function fallback(): PlannerDataV2 {
  return {
    version: 2,
    exportedAt: "2026-01-01T00:00:00.000Z",
    teams: [],
    candidates: [],
    rankingSet,
    matchups: [],
  };
}

describe("localStorage persistence", () => {
  it("分割されたv1データを組み立ててv2へMigrationする", () => {
    const storage = new MemoryStorage();
    storage.values.set(
      V1_TEAMS_STORAGE_KEY,
      JSON.stringify([
        {
          id: "team",
          name: "V1",
          status: "draft",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-02T00:00:00.000Z",
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
      ]),
    );
    storage.values.set(V1_CANDIDATE_STORAGE_KEY, "[]");
    storage.values.set(V1_RANKING_STORAGE_KEY, JSON.stringify(rankingSet));
    storage.values.set(
      V1_MATCHUP_STORAGE_KEY,
      JSON.stringify([
        {
          id: "v1-matchup",
          teamPokemonId: "old-team-pokemon",
          rankingEntryId: "enemy",
          rating: "good",
        },
      ]),
    );

    const loaded = loadLocalPlannerData(storage, fallback());

    expect(loaded.version).toBe(2);
    expect(loaded.teams[0].pokemon[0].candidatePokemonId).toBe(
      loaded.candidates[0].id,
    );
    expect(loaded.matchups[0].candidatePokemonId).toBe(
      loaded.candidates[0].id,
    );
  });

  it("v2データを内容変更せず読み込む", () => {
    const storage = new MemoryStorage();
    const input = fallback();
    storage.values.set(V2_STORAGE_KEY, JSON.stringify(input));

    expect(loadLocalPlannerData(storage, fallback())).toEqual(input);
  });

  it("初期化完了前は保存しない", () => {
    const storage = new MemoryStorage();

    expect(
      saveLocalPlannerDataIfReady(storage, fallback(), false),
    ).toBe(false);
    expect(storage.writes).toEqual([]);
  });

  it("初期化完了後はversion 2だけを保存する", () => {
    const storage = new MemoryStorage();

    expect(
      saveLocalPlannerDataIfReady(storage, fallback(), true),
    ).toBe(true);
    expect(
      JSON.parse(storage.values.get(V2_STORAGE_KEY) ?? "").version,
    ).toBe(2);
    expect(storage.writes).toEqual([V2_STORAGE_KEY]);
  });
});
