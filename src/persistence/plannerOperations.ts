import type {
  CandidatePokemon,
  EffortValues,
  MatchupRating,
  Team,
  TeamPokemon,
} from "../types/pokemon";
import type { PlannerDataV2 } from "./types";
import { normalizeMatchups } from "./migration";

export type ActionResult =
  | { success: true }
  | { success: false; message: string };

export type CandidateDeletionImpact = {
  teamCount: number;
  teamPokemonCount: number;
  matchupCount: number;
};

export type TeamPokemonChanges = {
  nickname?: string;
  abilityId?: string;
  item?: string;
  nature?: string;
  moves: string[];
  effortValues?: EffortValues;
  memo?: string;
};

export type UpdateCandidateInput = {
  id: string;
  label: string;
  status: CandidatePokemon["status"];
  roleIds: CandidatePokemon["roleIds"];
  tags: string[];
  memo?: string;
  isVisibleInCandidateMatchups: boolean;
};

export type OperationResult = {
  data: PlannerDataV2;
  result: ActionResult;
};

export function createCandidate(
  id: string,
  pokemonId: string,
  label: string,
  timestamp: string,
): CandidatePokemon {
  return {
    id,
    pokemonId,
    label,
    status: "considering",
    roleIds: [],
    tags: [],
    memo: undefined,
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function addCandidate(
  data: PlannerDataV2,
  candidate: CandidatePokemon,
): OperationResult {
  if (data.candidates.some((item) => item.id === candidate.id)) {
    return failure(data, "同じIDの候補がすでに存在します。");
  }

  return success({
    ...data,
    candidates: [...data.candidates, cloneCandidate(candidate)],
  });
}

export function updateCandidate(
  data: PlannerDataV2,
  input: UpdateCandidateInput,
  updatedAt: string,
): OperationResult {
  const existing = data.candidates.find((item) => item.id === input.id);
  if (!existing) {
    return failure(data, "更新対象の候補が見つかりません。");
  }

  return success({
    ...data,
    candidates: data.candidates.map((item) =>
      item.id === input.id
        ? {
            ...existing,
            label: input.label.trim() || existing.label,
            status: input.status,
            roleIds: [...input.roleIds],
            tags: normalizeCandidateTags(input.tags),
            memo: input.memo?.trim() || undefined,
            isVisibleInCandidateMatchups:
              input.isVisibleInCandidateMatchups,
            updatedAt,
          }
        : item,
    ),
  });
}

export function getCandidateDeletionImpact(
  data: PlannerDataV2,
  candidateId: string,
): CandidateDeletionImpact {
  const affectedTeams = data.teams.filter((team) =>
    team.pokemon.some(
      (teamPokemon) => teamPokemon.candidatePokemonId === candidateId,
    ),
  );
  const teamPokemonCount = affectedTeams.reduce(
    (count, team) =>
      count +
      team.pokemon.filter(
        (teamPokemon) => teamPokemon.candidatePokemonId === candidateId,
      ).length,
    0,
  );

  return {
    teamCount: affectedTeams.length,
    teamPokemonCount,
    matchupCount: data.matchups.filter(
      (matchup) => matchup.candidatePokemonId === candidateId,
    ).length,
  };
}

export function deleteCandidate(
  data: PlannerDataV2,
  candidateId: string,
): OperationResult {
  if (!data.candidates.some((candidate) => candidate.id === candidateId)) {
    return failure(data, "削除対象の候補が見つかりません。");
  }

  return success({
    ...data,
    candidates: data.candidates.filter(
      (candidate) => candidate.id !== candidateId,
    ),
    teams: data.teams.map((team) => {
      const pokemon = team.pokemon.filter(
        (teamPokemon) =>
          teamPokemon.candidatePokemonId !== candidateId,
      );

      return pokemon.length === team.pokemon.length
        ? team
        : { ...team, pokemon };
    }),
    matchups: data.matchups.filter(
      (matchup) => matchup.candidatePokemonId !== candidateId,
    ),
  });
}

export function addCandidateToTeam(
  data: PlannerDataV2,
  teamId: string,
  candidateId: string,
  teamPokemonId: string,
  defaultAbilityId?: string,
): OperationResult {
  const team = data.teams.find((item) => item.id === teamId);
  const candidate = data.candidates.find((item) => item.id === candidateId);

  if (!team) {
    return failure(data, "追加先の構築が見つかりません。");
  }
  if (!candidate) {
    return failure(data, "候補が見つかりません。");
  }
  if (team.pokemon.length >= 6) {
    return failure(data, "構築には6匹までしか追加できません。");
  }

  const hasSamePokemon = team.pokemon.some((teamPokemon) => {
    const existingCandidate = data.candidates.find(
      (item) => item.id === teamPokemon.candidatePokemonId,
    );
    return existingCandidate?.pokemonId === candidate.pokemonId;
  });

  if (hasSamePokemon) {
    return failure(data, "同じポケモンがすでに構築へ入っています。");
  }

  const teamPokemon: TeamPokemon = {
    id: teamPokemonId,
    candidatePokemonId: candidateId,
    abilityId: defaultAbilityId,
    moves: [],
  };

  return success({
    ...data,
    teams: data.teams.map((item) =>
      item.id === teamId
        ? { ...item, pokemon: [...item.pokemon, teamPokemon] }
        : item,
    ),
  });
}

export function updateTeamPokemon(
  data: PlannerDataV2,
  teamId: string,
  teamPokemonId: string,
  changes: TeamPokemonChanges,
): OperationResult {
  const team = data.teams.find((item) => item.id === teamId);
  const target = team?.pokemon.find((item) => item.id === teamPokemonId);

  if (!team || !target) {
    return failure(data, "更新対象の構築ポケモンが見つかりません。");
  }

  const updated: TeamPokemon = {
    id: target.id,
    candidatePokemonId: target.candidatePokemonId,
    nickname: changes.nickname,
    abilityId: changes.abilityId,
    item: changes.item,
    nature: changes.nature,
    moves: [...changes.moves],
    effortValues: changes.effortValues
      ? { ...changes.effortValues }
      : undefined,
    memo: changes.memo,
  };

  return success({
    ...data,
    teams: data.teams.map((item) =>
      item.id === teamId
        ? {
            ...item,
            pokemon: item.pokemon.map((teamPokemon) =>
              teamPokemon.id === teamPokemonId ? updated : teamPokemon,
            ),
          }
        : item,
    ),
  });
}

export function removeTeamPokemon(
  data: PlannerDataV2,
  teamId: string,
  teamPokemonId: string,
): OperationResult {
  const team = data.teams.find((item) => item.id === teamId);
  if (!team?.pokemon.some((item) => item.id === teamPokemonId)) {
    return failure(data, "削除対象の構築ポケモンが見つかりません。");
  }

  return success({
    ...data,
    teams: data.teams.map((item) =>
      item.id === teamId
        ? {
            ...item,
            pokemon: item.pokemon.filter(
              (teamPokemon) => teamPokemon.id !== teamPokemonId,
            ),
          }
        : item,
    ),
  });
}

export function deleteTeam(
  data: PlannerDataV2,
  teamId: string,
): OperationResult {
  if (!data.teams.some((team) => team.id === teamId)) {
    return failure(data, "削除対象の構築が見つかりません。");
  }
  if (data.teams.length <= 1) {
    return failure(
      data,
      "最後の1件は削除できません。先に新しい構築を作成してください。",
    );
  }

  return success({
    ...data,
    teams: data.teams.filter((team) => team.id !== teamId),
    currentTeamId:
      data.currentTeamId === teamId
        ? data.teams.find((team) => team.id !== teamId)?.id
        : data.currentTeamId,
  });
}

export function duplicateTeam(
  data: PlannerDataV2,
  teamId: string,
  newTeamId: string,
  createTeamPokemonId: () => string,
  timestamp: string,
): OperationResult {
  const source = data.teams.find((team) => team.id === teamId);
  if (!source) {
    return failure(data, "複製元の構築が見つかりません。");
  }

  const duplicated: Team = {
    ...source,
    id: newTeamId,
    name: `${source.name} コピー`,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    pokemon: source.pokemon.map((teamPokemon) => ({
      ...teamPokemon,
      id: createTeamPokemonId(),
      moves: [...teamPokemon.moves],
      effortValues: teamPokemon.effortValues
        ? { ...teamPokemon.effortValues }
        : undefined,
    })),
  };

  return success({
    ...data,
    teams: [duplicated, ...data.teams],
    currentTeamId: duplicated.id,
  });
}

export function setMatchupRating(
  data: PlannerDataV2,
  candidatePokemonId: string,
  rankingEntryId: string,
  rating: MatchupRating,
  matchupId: string,
): PlannerDataV2 {
  const normalized = normalizeMatchups(data.matchups);
  const existing = normalized.find(
    (matchup) =>
      matchup.candidatePokemonId === candidatePokemonId &&
      matchup.rankingEntryId === rankingEntryId,
  );

  return {
    ...data,
    matchups: existing
      ? normalized.map((matchup) =>
          matchup.id === existing.id ? { ...matchup, rating } : matchup,
        )
      : [
          ...normalized,
          {
            id: matchupId,
            candidatePokemonId,
            rankingEntryId,
            rating,
          },
        ],
  };
}

export function updateMatchupMemo(
  data: PlannerDataV2,
  candidatePokemonId: string,
  rankingEntryId: string,
  memo: string,
  matchupId: string,
): PlannerDataV2 {
  const normalized = normalizeMatchups(data.matchups);
  const existing = normalized.find(
    (matchup) =>
      matchup.candidatePokemonId === candidatePokemonId &&
      matchup.rankingEntryId === rankingEntryId,
  );

  return {
    ...data,
    matchups: existing
      ? normalized.map((matchup) =>
          matchup.id === existing.id ? { ...matchup, memo } : matchup,
        )
      : [
          ...normalized,
          {
            id: matchupId,
            candidatePokemonId,
            rankingEntryId,
            rating: "unrated",
            memo,
          },
        ],
  };
}

function cloneCandidate(candidate: CandidatePokemon): CandidatePokemon {
  return {
    ...candidate,
    roleIds: [...candidate.roleIds],
    tags: normalizeCandidateTags(candidate.tags),
  };
}

export function normalizeCandidateTags(tags: string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  );
}

function success(data: PlannerDataV2): OperationResult {
  return { data, result: { success: true } };
}

function failure(data: PlannerDataV2, message: string): OperationResult {
  return { data, result: { success: false, message } };
}
