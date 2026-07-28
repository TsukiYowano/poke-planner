export type PokemonTypeId =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export type PokemonType = {
  id: PokemonTypeId;
  name: string;
};

export type AbilityEffect =
  | {
      kind: "type-immunity";
      type: PokemonTypeId;
    }
  | {
      kind: "damage-multiplier";
      type: PokemonTypeId;
      multiplier: number;
    }
  | {
      kind: "note";
      description: string;
    };

export type Ability = {
  id: string;
  name: string;
  description?: string;
  effects: AbilityEffect[];
};

export type PokemonStats = {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};

export type PokemonForm =
  | "normal"
  | "mega"
  | "regional"
  | "alternate";

export type PokemonMaster = {
  id: string;
  name: string;
  enName?: string;

  basePokemonId?: string;
  form: PokemonForm;

  types: [PokemonTypeId, PokemonTypeId?];
  abilityIds: string[];

  stats?: PokemonStats;

  height?: number;
  weight?: number;
  sprite?: string;

  isAvailableInChampions: boolean;
  notes?: string;
};

export type TeamRoleId =
  | "physical-attacker"
  | "special-attacker"
  | "mixed-attacker"
  | "fast-attacker"
  | "setup-sweeper"
  | "wallbreaker"
  | "physical-wall"
  | "special-wall"
  | "pivot"
  | "lead"
  | "support"
  | "revenge-killer"
  | "hazard-setter"
  | "hazard-removal"
  | "priority-user"
  | "status-spreader";

export type TeamRoleCategory =
  | "attack"
  | "defense"
  | "speed"
  | "support";

export type TeamRole = {
  id: TeamRoleId;
  name: string;
  shortName: string;
  category: TeamRoleCategory;
  description: string;
};

export type EffortValues = {
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
};

export type TeamPokemon = {
  id: string;
  candidatePokemonId: string;

  abilityId?: string;
  nickname?: string;

  nature?: string;
  item?: string;
  moves: string[];

  effortValues?: EffortValues;

  memo?: string;
};

export type TeamStatus =
  | "draft"
  | "testing"
  | "active"
  | "archived";

export type Team = {
  id: string;
  name: string;
  description?: string;

  status: TeamStatus;
  pokemon: TeamPokemon[];

  createdAt: string;
  updatedAt: string;
};

export type CandidateStatus =
  | "considering"
  | "promising"
  | "on-hold";

export type CandidatePokemon = {
  id: string;
  pokemonId: string;
  label: string;

  status: CandidateStatus;
  roleIds: TeamRoleId[];

  tags: string[];
  memo?: string;
  isVisibleInCandidateMatchups: boolean;

  createdAt: string;
  updatedAt: string;
};

export type RankingEntry = {
  id: string;
  pokemonId: string;
  rank: number;

  assumedAbilityId?: string;
  assumedMoves: string[];

  roleIds: TeamRoleId[];
  tags: string[];

  memo?: string;
};

export type RankingSet = {
  id: string;
  name: string;
  season?: string;

  entries: RankingEntry[];

  updatedAt: string;
};

export type MatchupRating =
  | "very-good"
  | "good"
  | "even"
  | "bad"
  | "very-bad"
  | "unrated";

export type Matchup = {
  id: string;

  candidatePokemonId: string;
  rankingEntryId: string;

  rating: MatchupRating;
  memo?: string;
};

export type RecommendationReasonType =
  | "type-cover"
  | "type-weakness"
  | "missing-role";

export type RecommendationReason = {
  type: RecommendationReasonType;
  message: string;
  score: number;
};

export type CandidateRecommendation = {
  candidate: CandidatePokemon;

  score: number;

  reasons: RecommendationReason[];
};
