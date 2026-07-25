import type { RankingSet } from "../types/pokemon";

export const initialRankingSet: RankingSet = {
  id: "ranking-current",
  name: "仮想敵・TOP50",
  season: "現行シーズン",
  entries: [],
  updatedAt: new Date().toISOString(),
};
