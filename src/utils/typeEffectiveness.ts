import { abilityMap } from "../data/abilities";
import { typeChart } from "../data/typeChart";
import type {
  Ability,
  PokemonMaster,
  PokemonTypeId,
} from "../types/pokemon";

export type TypeEffectivenessResult = {
  attackingType: PokemonTypeId;
  baseMultiplier: number;
  abilityMultiplier: number;
  finalMultiplier: number;
  abilityName?: string;
  notes: string[];
};

function getSingleTypeMultiplier(
  attackingType: PokemonTypeId,
  defendingType: PokemonTypeId,
): number {
  return typeChart[attackingType][defendingType] ?? 1;
}

function getBaseMultiplier(
  attackingType: PokemonTypeId,
  defendingTypes: [
    PokemonTypeId,
    PokemonTypeId?,
  ],
): number {
  return defendingTypes.reduce((multiplier, typeId) => {
    if (!typeId) {
      return multiplier;
    }

    return (
      multiplier *
      getSingleTypeMultiplier(attackingType, typeId)
    );
  }, 1);
}

function getAbilityMultiplier(
  attackingType: PokemonTypeId,
  ability?: Ability,
): {
  multiplier: number;
  notes: string[];
} {
  if (!ability) {
    return {
      multiplier: 1,
      notes: [],
    };
  }

  let multiplier = 1;
  const notes: string[] = [];

  for (const effect of ability.effects) {
    if (
      effect.kind === "type-immunity" &&
      effect.type === attackingType
    ) {
      return {
        multiplier: 0,
        notes: [
          `${ability.name}により無効`,
        ],
      };
    }

    if (
      effect.kind === "damage-multiplier" &&
      effect.type === attackingType
    ) {
      multiplier *= effect.multiplier;

      notes.push(
        `${ability.name}により${effect.multiplier}倍`,
      );
    }
  }

  return {
    multiplier,
    notes,
  };
}

export function calculateTypeEffectiveness(
  pokemon: PokemonMaster,
  attackingType: PokemonTypeId,
  abilityId?: string,
): TypeEffectivenessResult {
  const ability = abilityId
    ? abilityMap[abilityId]
    : undefined;

  const baseMultiplier = getBaseMultiplier(
    attackingType,
    pokemon.types,
  );

  const abilityResult = getAbilityMultiplier(
    attackingType,
    ability,
  );

  const finalMultiplier =
    baseMultiplier === 0
      ? 0
      : baseMultiplier *
        abilityResult.multiplier;

  const notes: string[] = [];

  if (baseMultiplier === 0) {
    notes.push("タイプ相性により無効");
  }

  notes.push(...abilityResult.notes);

  return {
    attackingType,
    baseMultiplier,
    abilityMultiplier:
      abilityResult.multiplier,
    finalMultiplier,
    abilityName: ability?.name,
    notes,
  };
}

export function calculateAllDefensiveMatchups(
  pokemon: PokemonMaster,
  attackingTypes: PokemonTypeId[],
  abilityId?: string,
): TypeEffectivenessResult[] {
  return attackingTypes.map((attackingType) =>
    calculateTypeEffectiveness(
      pokemon,
      attackingType,
      abilityId,
    ),
  );
}