import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { PokemonMaster } from "./types.js";

const POKE_API = "https://pokeapi.co/api/v2";

const INPUT_PATH = resolve("master/champions-pokemon.txt");
const OUTPUT_PATH = resolve("master/pokemon.json");
const NOT_FOUND_PATH = resolve("scripts/output/not_found.txt");

interface PokemonResponse {
  name: string;
  height: number;
  weight: number;
  abilities: {
    ability: {
      name: string;
    };
  }[];
  types: {
    slot: number;
    type: {
      name: string;
    };
  }[];
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
  sprites: {
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
    front_default: string | null;
  };
}

interface SpeciesResponse {
  names: {
    language: {
      name: string;
    };
    name: string;
  }[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveJson(path: string, data: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

async function saveText(path: string, text: string) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, "utf8");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as T;
}

async function main() {
  const lines = (await readFile(INPUT_PATH, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean);

  const pokemonList: PokemonMaster[] = [];
  const notFound: string[] = [];

  for (const line of lines) {
    const [jpName, id] = line.split("\t");

    if (!jpName || !id) continue;

    console.log(`Fetching ${id}...`);

    const pokemon = await fetchJson<PokemonResponse>(
      `${POKE_API}/pokemon/${id}`
    );

    if (!pokemon) {
      console.log(`Not Found: ${id}`);
      notFound.push(id);
      continue;
    }

    const species = await fetchJson<SpeciesResponse>(
      `${POKE_API}/pokemon-species/${id}`
    );

    const jpNameApi =
      species?.names.find((x) => x.language.name === "ja-Hrkt")?.name ?? jpName;

    const enNameApi =
      species?.names.find((x) => x.language.name === "en")?.name ??
      pokemon.name;

    const stats = {
      hp: 0,
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0,
    };

    for (const stat of pokemon.stats) {
      switch (stat.stat.name) {
        case "hp":
          stats.hp = stat.base_stat;
          break;
        case "attack":
          stats.attack = stat.base_stat;
          break;
        case "defense":
          stats.defense = stat.base_stat;
          break;
        case "special-attack":
          stats.spAttack = stat.base_stat;
          break;
        case "special-defense":
          stats.spDefense = stat.base_stat;
          break;
        case "speed":
          stats.speed = stat.base_stat;
          break;
      }
    }

    pokemonList.push({
      id,
      jpName: jpNameApi,
      enName: enNameApi,
      types: pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name),
      abilities: pokemon.abilities.map((a) => a.ability.name),
      stats,
      height: pokemon.height,
      weight: pokemon.weight,
      sprite:
        pokemon.sprites.other?.["official-artwork"]?.front_default ??
        pokemon.sprites.front_default ??
        "",
    });

    await sleep(100);
  }

  await saveJson(OUTPUT_PATH, pokemonList);
  await saveText(NOT_FOUND_PATH, notFound.join("\n"));

  console.log(`Generated: ${pokemonList.length}`);
  console.log(`Not Found: ${notFound.length}`);
}

main().catch(console.error);