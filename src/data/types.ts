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

const pokemonTypeBadgeClassMap: Record<PokemonTypeId, string> = {
  normal: "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700",
  fire: "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700",
  water: "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700",
  electric: "rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700",
  grass: "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700",
  ice: "rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700",
  fighting: "rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700",
  poison: "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700",
  ground: "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700",
  flying: "rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700",
  psychic: "rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-700",
  bug: "rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-700",
  rock: "rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700",
  ghost: "rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700",
  dragon: "rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700",
  dark: "rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800",
  steel: "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700",
  fairy: "rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-700",
};

export function getPokemonTypeName(
  typeId: PokemonTypeId,
): string {
  return pokemonTypeMap[typeId].name;
}

export function getPokemonTypeBadgeClass(
  typeId: PokemonTypeId,
): string {
  return pokemonTypeBadgeClassMap[typeId];
}