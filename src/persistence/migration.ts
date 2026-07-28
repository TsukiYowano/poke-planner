import { abilityMap } from "../data/abilities";
import { getPokemonById } from "../data/pokemon";
import type {
  CandidatePokemon,
  Matchup,
  Team,
  TeamPokemon,
} from "../types/pokemon";
import type {
  PersistedCandidatePokemonV1,
  PersistedMatchupV1,
  PersistedPlannerData,
  PersistedTeamPokemonV1,
  PlannerDataV1,
  PlannerDataV2,
} from "./types";

export type MigrationDependencies = {
  createId?: (prefix: string) => string;
  getPokemonName?: (pokemonId: string) => string | undefined;
  getAbilityName?: (abilityId: string) => string | undefined;
};

function defaultCreateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const defaultDependencies: Required<MigrationDependencies> = {
  createId: defaultCreateId,
  getPokemonName: (pokemonId) => getPokemonById(pokemonId)?.name,
  getAbilityName: (abilityId) => abilityMap[abilityId]?.name,
};

function appendV1AbilityMemo(
  candidate: PersistedCandidatePokemonV1,
  getAbilityName: (abilityId: string) => string | undefined,
): string | undefined {
  if (!candidate.abilityId) {
    return candidate.memo;
  }

  const abilityName = getAbilityName(candidate.abilityId);
  const v1AbilityNote = abilityName
    ? `旧想定特性: ${abilityName}`
    : `旧想定特性ID: ${candidate.abilityId}`;
  const currentMemo = candidate.memo?.trimEnd();

  return currentMemo
    ? `${currentMemo}\n\n${v1AbilityNote}`
    : v1AbilityNote;
}

function migrateV1Candidate(
  candidate: PersistedCandidatePokemonV1,
  getPokemonName: (pokemonId: string) => string | undefined,
  getAbilityName: (abilityId: string) => string | undefined,
): CandidatePokemon {
  return {
    id: candidate.id,
    pokemonId: candidate.pokemonId,
    label: getPokemonName(candidate.pokemonId) ?? candidate.pokemonId,
    status: candidate.status,
    roleIds: [...(candidate.roleIds ?? [])],
    tags: [...(candidate.tags ?? [])],
    memo: appendV1AbilityMemo(candidate, getAbilityName),
    isVisibleInCandidateMatchups: true,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function createCandidateFromV1TeamPokemon(
  teamPokemon: PersistedTeamPokemonV1,
  createdAt: string,
  updatedAt: string,
  createId: (prefix: string) => string,
  getPokemonName: (pokemonId: string) => string | undefined,
): CandidatePokemon {
  return {
    id: createId("candidate"),
    pokemonId: teamPokemon.pokemonId,
    label: getPokemonName(teamPokemon.pokemonId) ?? teamPokemon.pokemonId,
    status: "considering",
    roleIds: [...(teamPokemon.roleIds ?? [])],
    tags: [...(teamPokemon.tags ?? [])],
    memo: undefined,
    isVisibleInCandidateMatchups: true,
    createdAt,
    updatedAt,
  };
}

function migrateV1TeamPokemon(
  teamPokemon: PersistedTeamPokemonV1,
  candidatePokemonId: string,
): TeamPokemon {
  return {
    id: teamPokemon.id,
    candidatePokemonId,
    nickname: teamPokemon.nickname,
    abilityId: teamPokemon.abilityId,
    item: teamPokemon.item,
    nature: teamPokemon.nature,
    moves: [...(teamPokemon.moves ?? [])],
    effortValues: teamPokemon.effortValues
      ? { ...teamPokemon.effortValues }
      : undefined,
    memo: teamPokemon.memo,
  };
}

export function normalizeMatchups(matchups: Matchup[]): Matchup[] {
  const byKey = new Map<string, Matchup>();

  for (const matchup of matchups) {
    const key = `${matchup.candidatePokemonId}\u0000${matchup.rankingEntryId}`;

    // 同じ実質キーは配列上で後にあるMatchupオブジェクト全体を採用する。
    byKey.set(key, matchup);
  }

  return [...byKey.values()];
}

function migrateV1(
  data: PlannerDataV1,
  dependencies: Required<MigrationDependencies>,
): PlannerDataV2 {
  const exportedAt =
    data.exportedAt ?? "1970-01-01T00:00:00.000Z";
  const oldTeamPokemonToCandidate = new Map<string, string>();
  const generatedCandidates: CandidatePokemon[] = [];
  const migratedTeams: Team[] = data.teams.map((team) => {
    const createdAt =
      team.createdAt ??
      exportedAt;
    const updatedAt =
      team.updatedAt ??
      team.createdAt ??
      exportedAt;
    const pokemon = team.pokemon.map((teamPokemon) => {
      const candidate = createCandidateFromV1TeamPokemon(
        teamPokemon,
        createdAt,
        updatedAt,
        dependencies.createId,
        dependencies.getPokemonName,
      );

      generatedCandidates.push(candidate);
      oldTeamPokemonToCandidate.set(teamPokemon.id, candidate.id);

      return migrateV1TeamPokemon(teamPokemon, candidate.id);
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      status: team.status,
      pokemon,
      createdAt,
      updatedAt,
    };
  });

  const migratedMatchups = data.matchups.flatMap(
    (matchup: PersistedMatchupV1): Matchup[] => {
      const candidatePokemonId = oldTeamPokemonToCandidate.get(
        matchup.teamPokemonId,
      );

      return candidatePokemonId
        ? [
            {
              id: matchup.id,
              candidatePokemonId,
              rankingEntryId: matchup.rankingEntryId,
              rating: matchup.rating,
              memo: matchup.memo,
            },
          ]
        : [];
    },
  );

  return {
    version: 2,
    exportedAt,
    teams: migratedTeams,
    currentTeamId: data.currentTeamId,
    candidates: [
      ...data.candidates.map((candidate) =>
        migrateV1Candidate(
          candidate,
          dependencies.getPokemonName,
          dependencies.getAbilityName,
        ),
      ),
      ...generatedCandidates,
    ],
    rankingSet: {
      ...data.rankingSet,
      entries: data.rankingSet.entries.map((entry) => ({
        ...entry,
        assumedMoves: [...(entry.assumedMoves ?? [])],
        roleIds: [...(entry.roleIds ?? [])],
        tags: [...(entry.tags ?? [])],
      })),
    },
    matchups: normalizeMatchups(migratedMatchups),
  };
}

function normalizeV2(data: PlannerDataV2): PlannerDataV2 {
  const normalizedMatchups = normalizeMatchups(data.matchups);

  if (normalizedMatchups.length === data.matchups.length) {
    return data;
  }

  return {
    ...data,
    matchups: normalizedMatchups,
  };
}

export function migratePlannerData(
  data: PersistedPlannerData,
  dependencies: MigrationDependencies = {},
): PlannerDataV2 {
  if (data.version === 2) {
    return normalizeV2(data);
  }

  return migrateV1(data, {
    ...defaultDependencies,
    ...dependencies,
  });
}
