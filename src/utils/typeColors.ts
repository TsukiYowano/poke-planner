import type { PokemonTypeId } from "../types/pokemon";

const typeClassNames: Record<PokemonTypeId, string> = {
  normal:
    "border-slate-300 bg-slate-100 text-slate-700",
  fire:
    "border-orange-300 bg-orange-100 text-orange-800",
  water:
    "border-blue-300 bg-blue-100 text-blue-800",
  electric:
    "border-yellow-300 bg-yellow-100 text-yellow-800",
  grass:
    "border-green-300 bg-green-100 text-green-800",
  ice:
    "border-cyan-300 bg-cyan-100 text-cyan-800",
  fighting:
    "border-red-300 bg-red-100 text-red-800",
  poison:
    "border-purple-300 bg-purple-100 text-purple-800",
  ground:
    "border-amber-300 bg-amber-100 text-amber-800",
  flying:
    "border-indigo-300 bg-indigo-100 text-indigo-800",
  psychic:
    "border-pink-300 bg-pink-100 text-pink-800",
  bug:
    "border-lime-300 bg-lime-100 text-lime-800",
  rock:
    "border-stone-300 bg-stone-100 text-stone-800",
  ghost:
    "border-violet-300 bg-violet-100 text-violet-800",
  dragon:
    "border-indigo-400 bg-indigo-100 text-indigo-900",
  dark:
    "border-slate-500 bg-slate-700 text-white",
  steel:
    "border-zinc-300 bg-zinc-100 text-zinc-700",
  fairy:
    "border-rose-300 bg-rose-100 text-rose-800",
};

export function getTypeClassName(
  typeId: PokemonTypeId,
): string {
  return typeClassNames[typeId];
}