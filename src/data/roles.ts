import type {
  TeamRole,
  TeamRoleId,
} from "../types/pokemon";

export const teamRoles: TeamRole[] = [
  {
    id: "physical-attacker",
    name: "物理アタッカー",
    shortName: "物理",
    category: "attack",
    description:
      "物理技を中心に相手へ圧力をかける。",
  },
  {
    id: "special-attacker",
    name: "特殊アタッカー",
    shortName: "特殊",
    category: "attack",
    description:
      "特殊技を中心に相手へ圧力をかける。",
  },
  {
    id: "mixed-attacker",
    name: "両刀アタッカー",
    shortName: "両刀",
    category: "attack",
    description:
      "物理技と特殊技の両方を使う。",
  },
  {
    id: "fast-attacker",
    name: "高速アタッカー",
    shortName: "高速",
    category: "speed",
    description:
      "高い素早さを活かして上から攻撃する。",
  },
  {
    id: "setup-sweeper",
    name: "積みエース",
    shortName: "積み",
    category: "attack",
    description:
      "能力上昇技を使い、全抜きを狙う。",
  },
  {
    id: "wallbreaker",
    name: "崩し",
    shortName: "崩し",
    category: "attack",
    description:
      "高火力や特殊な手段で耐久ポケモンを崩す。",
  },
  {
    id: "physical-wall",
    name: "物理受け",
    shortName: "物理受け",
    category: "defense",
    description:
      "物理アタッカーへの受け先になる。",
  },
  {
    id: "special-wall",
    name: "特殊受け",
    shortName: "特殊受け",
    category: "defense",
    description:
      "特殊アタッカーへの受け先になる。",
  },
  {
    id: "pivot",
    name: "対面操作",
    shortName: "対面操作",
    category: "support",
    description:
      "交代技などを使い、有利対面を作る。",
  },
  {
    id: "lead",
    name: "先発",
    shortName: "先発",
    category: "support",
    description:
      "初手から展開を作る役割。",
  },
  {
    id: "support",
    name: "サポート",
    shortName: "補助",
    category: "support",
    description:
      "味方の行動を補助する。",
  },
  {
    id: "revenge-killer",
    name: "ストッパー",
    shortName: "ストッパー",
    category: "speed",
    description:
      "高速技やスカーフで相手のエースを止める。",
  },
  {
    id: "hazard-setter",
    name: "設置技",
    shortName: "設置",
    category: "support",
    description:
      "ステルスロックなどを設置する。",
  },
  {
    id: "hazard-removal",
    name: "設置技除去",
    shortName: "除去",
    category: "support",
    description:
      "こうそくスピンなどで設置技を除去する。",
  },
  {
    id: "priority-user",
    name: "先制技",
    shortName: "先制技",
    category: "speed",
    description:
      "先制技で削れた相手を処理する。",
  },
  {
    id: "status-spreader",
    name: "状態異常",
    shortName: "状態異常",
    category: "support",
    description:
      "あくびやどくなどで相手へ負荷をかける。",
  },
];

export const teamRoleMap = Object.fromEntries(
  teamRoles.map((role) => [role.id, role]),
) as Record<TeamRoleId, TeamRole>;

export function getTeamRole(
  roleId: TeamRoleId,
): TeamRole {
  return teamRoleMap[roleId];
}

export function getTeamRoleName(
  roleId: TeamRoleId,
): string {
  return teamRoleMap[roleId]?.name ?? roleId;
}