import { teamRoles } from "../data/roles";
import type {
  CandidatePokemon,
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
  candidates: CandidatePokemon[],
): TeamAnalysis {
  const roleCountMap = new Map<
    TeamRoleId,
    number
  >();

  for (const pokemon of team.pokemon) {
    const candidate = candidates.find(
      (item) => item.id === pokemon.candidatePokemonId,
    );
    for (const roleId of candidate?.roleIds ?? []) {
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
    const candidate = candidates.find(
      (item) => item.id === pokemon.candidatePokemonId,
    );
    const pokemonCategories = new Set(
      (candidate?.roleIds ?? []).map((roleId) => {
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
