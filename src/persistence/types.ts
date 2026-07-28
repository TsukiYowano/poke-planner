import type {
  CandidatePokemon,
  CandidateStatus,
  EffortValues,
  Matchup,
  MatchupRating,
  RankingSet,
  Team,
  TeamRoleId,
  TeamStatus,
} from "../types/pokemon";

export type PersistedTeamPokemonV1 = {
  id: string;
  pokemonId: string;
  abilityId?: string;
  nickname?: string;
  nature?: string;
  item?: string;
  moves: string[];
  effortValues?: EffortValues;
  roleIds: TeamRoleId[];
  tags: string[];
  memo?: string;
};

export type PersistedTeamV1 = {
  id: string;
  name: string;
  description?: string;
  status: TeamStatus;
  pokemon: PersistedTeamPokemonV1[];
  createdAt?: string;
  updatedAt?: string;
};

export type PersistedCandidatePokemonV1 = {
  id: string;
  pokemonId: string;
  status: CandidateStatus;
  abilityId?: string;
  roleIds: TeamRoleId[];
  tags: string[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

export type PersistedMatchupV1 = {
  id: string;
  teamPokemonId: string;
  rankingEntryId: string;
  rating: MatchupRating;
  memo?: string;
};

export type PlannerDataV1 = {
  version: 1;
  exportedAt?: string;
  teams: PersistedTeamV1[];
  currentTeamId?: string;
  candidates: PersistedCandidatePokemonV1[];
  rankingSet: RankingSet;
  matchups: PersistedMatchupV1[];
};

export type PlannerDataV2 = {
  version: 2;
  exportedAt: string;
  teams: Team[];
  currentTeamId?: string;
  candidates: CandidatePokemon[];
  rankingSet: RankingSet;
  matchups: Matchup[];
};

export type PersistedPlannerData = PlannerDataV1 | PlannerDataV2;
