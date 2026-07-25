import type { CandidatePokemon } from "../types/pokemon";

export const initialCandidates: CandidatePokemon[] = [
  {
    id: "candidate-wash-rotom",
    pokemonId: "wash-rotom",
    status: "promising",
    abilityId: "levitate",
    roleIds: [
      "special-attacker",
      "pivot",
      "physical-wall",
    ],
    tags: [
      "ギャラドス対策",
      "地面無効",
    ],
    memo:
      "メガメタグロスの炎・地面への補完候補。ボルトチェンジで対面操作もできる。",
    createdAt: "2026-07-24T16:00:00+09:00",
    updatedAt: "2026-07-24T16:00:00+09:00",
  },
  {
    id: "candidate-umbreon",
    pokemonId: "umbreon",
    status: "considering",
    roleIds: [
      "special-wall",
      "support",
      "status-spreader",
    ],
    tags: [
      "あくび",
      "クッション",
    ],
    memo:
      "特殊方面のクッション。高速枠が不足しやすくなる点は注意。",
    createdAt: "2026-07-24T16:05:00+09:00",
    updatedAt: "2026-07-24T16:05:00+09:00",
  },
];