import { isPersistedPlannerData } from "./localStorage";
import { migratePlannerData } from "./migration";
import type { PlannerDataV2 } from "./types";

export function parsePlannerData(raw: unknown): PlannerDataV2 {
  if (!isPersistedPlannerData(raw)) {
    throw new Error("Plannerデータの形式が不正です。");
  }
  return migratePlannerData(raw);
}

export function parsePlannerDataJson(json: string): PlannerDataV2 {
  return parsePlannerData(JSON.parse(json) as unknown);
}

export function serializePlannerData(
  data: PlannerDataV2,
  exportedAt: string,
  pretty = false,
): string {
  return JSON.stringify(
    { ...data, version: 2, exportedAt },
    null,
    pretty ? 2 : undefined,
  );
}
