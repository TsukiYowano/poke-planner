import { pokemonMasterMap } from "../data/pokemon";
import { pokemonTypes } from "../data/types";
import { calculateTypeEffectiveness } from "./typeEffectiveness";
import type {
  CandidatePokemon,
  PokemonTypeId,
  Team,
} from "../types/pokemon";

export type TeamTypeCoverage = {
  attackingType: PokemonTypeId;
  immune: number;
  quarter: number;
  half: number;
  neutral: number;
  double: number;
  quadruple: number;
};

export function analyzeTeamTypeCoverage(
  team: Team,
  candidates: CandidatePokemon[],
): TeamTypeCoverage[] {
  return pokemonTypes.map((type) => {
    const attackingType = type.id;

    const result: TeamTypeCoverage = {
      attackingType,
      immune: 0,
      quarter: 0,
      half: 0,
      neutral: 0,
      double: 0,
      quadruple: 0,
    };

    for (const teamPokemon of team.pokemon) {
      const candidate = candidates.find(
        (item) => item.id === teamPokemon.candidatePokemonId,
      );
      const pokemon =
        pokemonMasterMap[candidate?.pokemonId ?? ""];

      if (!pokemon) {
        continue;
      }

      const effectiveness =
        calculateTypeEffectiveness(
          pokemon,
          attackingType,
          teamPokemon.abilityId,
        );

      switch (effectiveness.finalMultiplier) {
        case 0:
          result.immune++;
          break;

        case 0.25:
          result.quarter++;
          break;

        case 0.5:
          result.half++;
          break;

        case 1:
          result.neutral++;
          break;

        case 2:
          result.double++;
          break;

        case 4:
          result.quadruple++;
          break;
      }
    }

    return result;
  });
}
