import type { PokemonTypeId } from "./pokemon";

export type MoveCategory =
  | "physical"
  | "special"
  | "status";

export type MoveMaster = {
  id: string;

  name: string;
  enName: string;

  type: PokemonTypeId;
  category: MoveCategory;

  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
};