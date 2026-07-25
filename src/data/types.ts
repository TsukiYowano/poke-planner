import type {
  PokemonType,
  PokemonTypeId,
} from "../types/pokemon";

export const pokemonTypes: PokemonType[] = [
  { id: "normal", name: "ノーマル" },
  { id: "fire", name: "ほのお" },
  { id: "water", name: "みず" },
  { id: "electric", name: "でんき" },
  { id: "grass", name: "くさ" },
  { id: "ice", name: "こおり" },
  { id: "fighting", name: "かくとう" },
  { id: "poison", name: "どく" },
  { id: "ground", name: "じめん" },
  { id: "flying", name: "ひこう" },
  { id: "psychic", name: "エスパー" },
  { id: "bug", name: "むし" },
  { id: "rock", name: "いわ" },
  { id: "ghost", name: "ゴースト" },
  { id: "dragon", name: "ドラゴン" },
  { id: "dark", name: "あく" },
  { id: "steel", name: "はがね" },
  { id: "fairy", name: "フェアリー" },
];

export const pokemonTypeMap = Object.fromEntries(
  pokemonTypes.map((type) => [type.id, type]),
) as Record<PokemonTypeId, PokemonType>;

export function getPokemonTypeName(
  typeId: PokemonTypeId,
): string {
  return pokemonTypeMap[typeId].name;
}