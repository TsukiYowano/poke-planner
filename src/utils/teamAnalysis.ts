import { teamRoles } from "../data/roles";
import type {
  Team,
  TeamRoleCategory,
  TeamRoleId,
} from "../types/pokemon";

export type RoleCount = {
  roleId: TeamRoleId;
  count: number;
};

export type RoleCategoryCount = {
  category: TeamRoleCategory;
  count: number;
};

export type TeamAnalysis = {
  pokemonCount: number;
  roleCounts: RoleCount[];
  categoryCounts: RoleCategoryCount[];
  missingImportantRoles: TeamRoleId[];
};

const importantRoleIds: TeamRoleId[] = [
  "physical-attacker",
  "special-attacker",
  "fast-attacker",
  "pivot",
  "priority-user",
];

export function analyzeTeam(
  team: Team,
): TeamAnalysis {
  const roleCountMap = new Map<
    TeamRoleId,
    number
  >();

  for (const pokemon of team.pokemon) {
    for (const roleId of pokemon.roleIds) {
      const currentCount =
        roleCountMap.get(roleId) ?? 0;

      roleCountMap.set(
        roleId,
        currentCount + 1,
      );
    }
  }

  const roleCounts: RoleCount[] =
    teamRoles.map((role) => ({
      roleId: role.id,
      count: roleCountMap.get(role.id) ?? 0,
    }));

  const categoryCountMap = new Map<
    TeamRoleCategory,
    number
  >();

  for (const pokemon of team.pokemon) {
    const pokemonCategories = new Set(
      pokemon.roleIds.map((roleId) => {
        const role = teamRoles.find(
          (item) => item.id === roleId,
        );

        return role?.category;
      }),
    );

    for (const category of pokemonCategories) {
      if (!category) {
        continue;
      }

      const currentCount =
        categoryCountMap.get(category) ?? 0;

      categoryCountMap.set(
        category,
        currentCount + 1,
      );
    }
  }

  const categories: TeamRoleCategory[] = [
    "attack",
    "defense",
    "speed",
    "support",
  ];

  const categoryCounts =
    categories.map((category) => ({
      category,
      count:
        categoryCountMap.get(category) ?? 0,
    }));

  const missingImportantRoles =
    importantRoleIds.filter(
      (roleId) =>
        (roleCountMap.get(roleId) ?? 0) === 0,
    );

  return {
    pokemonCount: team.pokemon.length,
    roleCounts,
    categoryCounts,
    missingImportantRoles,
  };
}