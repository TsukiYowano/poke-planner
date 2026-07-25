import abilitiesJson from "../../master/abilities.json";

import type {
  Ability
} from "../types/pokemon";

type RawAbility = {
  id: string;
  jpName: string;
  enName: string;
};

const rawAbilities =
  abilitiesJson as RawAbility[];

const abilityEffects: Record<
  string,
  Ability["effects"]
> = {
  levitate: [
    {
      kind: "type-immunity",
      type: "ground",
    },
  ],

  "flash-fire": [
    {
      kind: "type-immunity",
      type: "fire",
    },
  ],

  "water-absorb": [
    {
      kind: "type-immunity",
      type: "water",
    },
  ],

  "volt-absorb": [
    {
      kind: "type-immunity",
      type: "electric",
    },
  ],

  "lightning-rod": [
    {
      kind: "type-immunity",
      type: "electric",
    },
  ],

  "motor-drive": [
    {
      kind: "type-immunity",
      type: "electric",
    },
  ],

  "sap-sipper": [
    {
      kind: "type-immunity",
      type: "grass",
    },
  ],

  "earth-eater": [
    {
      kind: "type-immunity",
      type: "ground",
    },
  ],

  "dry-skin": [
    {
      kind: "type-immunity",
      type: "water",
    },
  ],

  "thick-fat": [
    {
      kind: "damage-multiplier",
      type: "fire",
      multiplier: 0.5,
    },
    {
      kind: "damage-multiplier",
      type: "ice",
      multiplier: 0.5,
    },
  ],

  heatproof: [
    {
      kind: "damage-multiplier",
      type: "fire",
      multiplier: 0.5,
    },
  ],
};

export const abilityMaster: Ability[] =
  rawAbilities.map((ability) => ({
    id: ability.id,
    name: ability.jpName,
    effects:
      abilityEffects[ability.id] ?? [],
  }));

export const abilityMap: Record<
  string,
  Ability
> = Object.fromEntries(
  abilityMaster.map((ability) => [
    ability.id,
    ability,
  ]),
);

export const abilityMasterMap = abilityMap;

export function getAbilityName(
  id: string,
): string {
  return abilityMap[id]?.name ?? id;
}