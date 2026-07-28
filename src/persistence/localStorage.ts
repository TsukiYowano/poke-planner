import type { StorageLike } from "./storageTypes";
import type { PersistedPlannerData, PlannerDataV1, PlannerDataV2 } from "./types";
import { migratePlannerData } from "./migration";

export const V2_STORAGE_KEY = "poke-planner-data-v2";
export const V1_TEAMS_STORAGE_KEY = "poke-planner-teams";
export const V1_CURRENT_TEAM_ID_STORAGE_KEY =
  "poke-planner-current-team-id";
export const V1_TEAM_STORAGE_KEY = "poke-planner-current-team";
export const V1_CANDIDATE_STORAGE_KEY = "poke-planner-candidates";
export const V1_RANKING_STORAGE_KEY = "poke-planner-ranking-set";
export const V1_MATCHUP_STORAGE_KEY = "poke-planner-matchups";

export function loadLocalPlannerData(
  storage: StorageLike,
  fallback: PlannerDataV2,
): PlannerDataV2 {
  const storedV2 = parseJson(storage.getItem(V2_STORAGE_KEY));
  if (isPersistedPlannerData(storedV2)) {
    return migratePlannerData(storedV2);
  }

  const v1Data = assembleV1PlannerData(
    storage,
    fallback.rankingSet,
  );
  return v1Data ? migratePlannerData(v1Data) : migratePlannerData(fallback);
}

export function saveLocalPlannerData(
  storage: StorageLike,
  data: PlannerDataV2,
): void {
  storage.setItem(V2_STORAGE_KEY, JSON.stringify(data));
}

export function saveLocalPlannerDataIfReady(
  storage: StorageLike,
  data: PlannerDataV2,
  isInitialized: boolean,
): boolean {
  if (!isInitialized) {
    return false;
  }
  saveLocalPlannerData(storage, data);
  return true;
}

export function assembleV1PlannerData(
  storage: StorageLike,
  fallbackRankingSet: PlannerDataV1["rankingSet"],
): PlannerDataV1 | null {
  const teamsValue = parseJson(storage.getItem(V1_TEAMS_STORAGE_KEY));
  const v1TeamValue = parseJson(
    storage.getItem(V1_TEAM_STORAGE_KEY),
  );
  const teams = Array.isArray(teamsValue)
    ? teamsValue
    : v1TeamValue && typeof v1TeamValue === "object"
      ? [v1TeamValue]
      : null;

  if (!teams) {
    return null;
  }

  const candidates = parseJson(
    storage.getItem(V1_CANDIDATE_STORAGE_KEY),
  );
  const rankingSet = parseJson(
    storage.getItem(V1_RANKING_STORAGE_KEY),
  );
  const matchups = parseJson(
    storage.getItem(V1_MATCHUP_STORAGE_KEY),
  );

  return {
    version: 1,
    exportedAt: "1970-01-01T00:00:00.000Z",
    teams: teams as PlannerDataV1["teams"],
    currentTeamId:
      storage.getItem(V1_CURRENT_TEAM_ID_STORAGE_KEY) ?? undefined,
    candidates: Array.isArray(candidates)
      ? (candidates as PlannerDataV1["candidates"])
      : [],
    rankingSet:
      rankingSet && typeof rankingSet === "object"
        ? (rankingSet as PlannerDataV1["rankingSet"])
        : fallbackRankingSet,
    matchups: Array.isArray(matchups)
      ? (matchups as PlannerDataV1["matchups"])
      : [],
  };
}

export function isPersistedPlannerData(
  value: unknown,
): value is PersistedPlannerData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    (record.version === 1 || record.version === 2) &&
    Array.isArray(record.teams) &&
    Array.isArray(record.candidates) &&
    Array.isArray(record.matchups) &&
    !!record.rankingSet &&
    typeof record.rankingSet === "object"
  );
}

function parseJson(value: string | null): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
