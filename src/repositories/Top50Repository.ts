import { supabase } from "../lib/supabase";
import pokemonMaster from "../../master/pokemon.json";

export type Top50Ranking = {
  rank: number;
  pokemon_id: string;
};

export async function importTop50(tsvFile: File): Promise<void> {
  const text = await tsvFile.text();

  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  const dataLines = lines;

  const rankings: Top50Ranking[] = [];
  const notFoundNames: string[] = [];

  for (const line of dataLines) {
    const [rankText, pokemonNameText] = line.split("\t");

    const rank = Number(rankText?.trim());
    const pokemonName = pokemonNameText?.trim();

    if (!Number.isInteger(rank) || !pokemonName) {
  throw new Error(
    `TSVの形式が不正です: ${line}`,
  );
}

    const pokemon = pokemonMaster.find(
      (entry) => entry.jpName === pokemonName,
    );

    if (!pokemon) {
      notFoundNames.push(pokemonName);
      continue;
    }

    rankings.push({
      rank,
      pokemon_id: pokemon.id,
    });
  }

  if (notFoundNames.length > 0) {
    throw new Error(
      `pokemon.jsonに見つからないポケモンがあります: ${notFoundNames.join("、")}`,
    );
  }

  if (rankings.length === 0) {
    throw new Error("登録できるTOP50データがありませんでした。");
  }

  const { error } = await supabase
    .from("top50_rankings")
    .upsert(rankings, {
      onConflict: "rank",
    });

  if (error) {
    throw error;
  }
}

export async function loadTop50(): Promise<Top50Ranking[]> {
  const { data, error } = await supabase
    .from("top50_rankings")
    .select("rank, pokemon_id")
    .order("rank", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}