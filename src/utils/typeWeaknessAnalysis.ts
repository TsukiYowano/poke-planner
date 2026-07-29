import { getPokemonById } from "../data/pokemon";
import { pokemonTypes } from "../data/types";
import type {
  CandidatePokemon,
  PokemonTypeId,
  Team,
} from "../types/pokemon";
import { calculateTypeEffectiveness } from "./typeEffectiveness";

export type DefensiveTypeCategory =
  | "weakness"
  | "neutral"
  | "resist"
  | "immune";

export type TeamPokemonTypeBreakdown = {
  teamPokemonId: string;
  candidatePokemonId: string;
  pokemonId: string;
  pokemonName: string;
  candidateLabel?: string;
  multiplier: number;
  category: DefensiveTypeCategory;
};

export type TypeCoverageAnalysis = {
  typeId: PokemonTypeId;
  typeName: string;
  fourTimesWeaknessCount: number;
  weaknessCount: number;
  resistCount: number;
  immuneCount: number;
  neutralCount: number;
  isUnresisted: boolean;
  isWeakType: boolean;
  teamPokemon: TeamPokemonTypeBreakdown[];
};

export type TypeCoverageSummary = Pick<
  TypeCoverageAnalysis,
  | "fourTimesWeaknessCount"
  | "weaknessCount"
  | "resistCount"
  | "immuneCount"
  | "neutralCount"
  | "isUnresisted"
  | "isWeakType"
>;

export function getDefensiveTypeCategory(
  multiplier: number,
): DefensiveTypeCategory {
  if (multiplier === 0) {
    return "immune";
  }

  if (multiplier < 1) {
    return "resist";
  }

  if (multiplier >= 2) {
    return "weakness";
  }

  return "neutral";
}

export function getDefensiveTypeLabel(
  multiplier: number,
): string {
  if (multiplier === 0) {
    return "無効";
  }

  if (multiplier >= 4) {
    return "4倍弱点";
  }

  if (multiplier >= 2) {
    return "弱点";
  }

  if (multiplier <= 0.25) {
    return "1/4";
  }

  if (multiplier < 1) {
    return "半減";
  }

  return "等倍";
}

export function summarizeTypeMultipliers(
  multipliers: number[],
): TypeCoverageSummary {
  let fourTimesWeaknessCount = 0;
  let weaknessCount = 0;
  let resistCount = 0;
  let immuneCount = 0;
  let neutralCount = 0;

  for (const multiplier of multipliers) {
    if (multiplier >= 4) {
      fourTimesWeaknessCount += 1;
    } else if (multiplier >= 2) {
      weaknessCount += 1;
    } else if (multiplier === 0) {
      immuneCount += 1;
    } else if (multiplier < 1) {
      resistCount += 1;
    } else {
      neutralCount += 1;
    }
  }

  const isUnresisted =
    resistCount === 0 && immuneCount === 0;
  const isWeakType =
    fourTimesWeaknessCount +
      weaknessCount -
      (resistCount + immuneCount) >=
    2;

  return {
    fourTimesWeaknessCount,
    weaknessCount,
    resistCount,
    immuneCount,
    neutralCount,
    isUnresisted,
    isWeakType,
  };
}

export function analyzeTypeCoverage(
  team: Team,
  candidates: CandidatePokemon[],
): TypeCoverageAnalysis[] {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );

  const resolvedTeam = team.pokemon.flatMap((teamPokemon) => {
    const candidate = candidateMap.get(
      teamPokemon.candidatePokemonId,
    );
    const pokemon = candidate
      ? getPokemonById(candidate.pokemonId)
      : undefined;

    if (!candidate || !pokemon) {
      return [];
    }

    return [{ teamPokemon, candidate, pokemon }];
  });

  return pokemonTypes.map((type) => {
    const breakdown = resolvedTeam.map(
      ({ teamPokemon, candidate, pokemon }) => {
        const multiplier = calculateTypeEffectiveness(
          pokemon,
          type.id,
          teamPokemon.abilityId,
        ).finalMultiplier;

        return {
          teamPokemonId: teamPokemon.id,
          candidatePokemonId: candidate.id,
          pokemonId: pokemon.id,
          pokemonName: pokemon.name,
          candidateLabel:
            candidate.label.trim() &&
            candidate.label.trim() !== pokemon.name
              ? candidate.label.trim()
              : undefined,
          multiplier,
          category: getDefensiveTypeCategory(multiplier),
        } satisfies TeamPokemonTypeBreakdown;
      },
    );

    const summary = summarizeTypeMultipliers(
      breakdown.map((item) => item.multiplier),
    );

    return {
      typeId: type.id,
      typeName: type.name,
      ...summary,
      teamPokemon: breakdown,
    };
  });
}
