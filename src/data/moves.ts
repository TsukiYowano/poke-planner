import movesJson from "../../master/moves.json";

import type {
  MoveCategory,
  MoveMaster,
} from "../types/move";
import type { PokemonTypeId } from "../types/pokemon";

type RawMove = {
  id: string;

  jpName: string;
  enName: string;

  type: string;
  category: string;

  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
};

const rawMoves = movesJson as RawMove[];

const validTypes = new Set<PokemonTypeId>([
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

function isPokemonTypeId(
  value: string,
): value is PokemonTypeId {
  return validTypes.has(value as PokemonTypeId);
}

const validCategories = new Set<MoveCategory>([
  "physical",
  "special",
  "status",
]);

function isMoveCategory(
  value: string,
): value is MoveCategory {
  return validCategories.has(
    value as MoveCategory,
  );
}

export const moveMaster: MoveMaster[] =
  rawMoves
    .filter(
      (move) =>
        isPokemonTypeId(move.type) &&
        isMoveCategory(move.category),
    )
    .map((move): MoveMaster => ({
  id: move.id,
  name: move.jpName,
  enName: move.enName,
  type: move.type as PokemonTypeId,
  category: move.category as MoveCategory,
  power: move.power,
  accuracy: move.accuracy,
  pp: move.pp,
  priority: move.priority,
}));

export const moveMasterNameMap: Record<
  string,
  MoveMaster
> = Object.fromEntries(
  moveMaster.map((move) => [
    move.name,
    move,
  ]),
);

export function getMoveByName(
  name: string,
): MoveMaster | undefined {
  return moveMasterNameMap[name];
}

export const moveMasterMap: Record<
  string,
  MoveMaster
> = Object.fromEntries(
  moveMaster.map((move) => [
    move.id,
    move,
  ]),
);

export function getMoveById(
  id: string,
): MoveMaster | undefined {
  return moveMasterMap[id];
}

function toHiragana(text: string): string {
  return text.replace(
    /[\u30a1-\u30f6]/g,
    (char) =>
      String.fromCharCode(
        char.charCodeAt(0) - 0x60,
      ),
  );
}

function normalizeSearchText(
  text: string,
): string {
  return toHiragana(
    text.trim().toLowerCase(),
  );
}

export function searchMove(
  keyword: string,
): MoveMaster[] {
  const normalizedKeyword =
    normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  return moveMaster.filter((move) => {
    const searchableText =
      normalizeSearchText(
        [
          move.name,
          move.enName,
          move.id,
        ].join(" "),
      );

    return searchableText.includes(
      normalizedKeyword,
    );
  });
}