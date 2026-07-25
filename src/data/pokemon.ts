import pokemonJson from "../../master/pokemon.json";

import type {
  PokemonForm,
  PokemonMaster,
  PokemonTypeId,
} from "../types/pokemon";

type RawPokemonMaster = {
  id: string;
  jpName: string;
  enName: string;

  types: string[];
  abilities: string[];

  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };

  height: number;
  weight: number;
  sprite: string;
};

const rawPokemonMaster =
  pokemonJson as RawPokemonMaster[];

const validTypeIds = new Set<PokemonTypeId>([
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
  return validTypeIds.has(value as PokemonTypeId);
}

function getPokemonForm(
  id: string,
): PokemonForm {
  if (
    id.includes("-mega") ||
    id.includes("-mega-")
  ) {
    return "mega";
  }

  if (
    id.includes("-alola") ||
    id.includes("-galar") ||
    id.includes("-hisui") ||
    id.includes("-paldea")
  ) {
    return "regional";
  }

  if (
    id.includes("-male") ||
    id.includes("-female") ||
    id.includes("-midday") ||
    id.includes("-midnight") ||
    id.includes("-dusk") ||
    id.includes("-shield") ||
    id.includes("-blade") ||
    id.includes("-zero") ||
    id.includes("-hero") ||
    id.includes("-average") ||
    id.includes("-small") ||
    id.includes("-large") ||
    id.includes("-super") ||
    id.includes("-disguised") ||
    id.includes("-full-belly") ||
    id.includes("-family-of-")
  ) {
    return "alternate";
  }

  return "normal";
}

function getBasePokemonId(
  id: string,
  form: PokemonForm,
): string | undefined {
  if (form === "normal") {
    return undefined;
  }

  const megaIndex = id.indexOf("-mega");

  if (megaIndex >= 0) {
    return id.slice(0, megaIndex);
  }

  const suffixes = [
    "-alola",
    "-galar",
    "-hisui",
    "-paldea-combat-breed",
    "-paldea-blaze-breed",
    "-paldea-aqua-breed",
    "-male",
    "-female",
    "-midday",
    "-midnight",
    "-dusk",
    "-shield",
    "-blade",
    "-zero",
    "-hero",
    "-average",
    "-small",
    "-large",
    "-super",
    "-disguised",
    "-full-belly",
    "-family-of-four",
    "-family-of-three",
  ];

  const suffix = suffixes.find((value) =>
    id.endsWith(value),
  );

  if (!suffix) {
    return undefined;
  }

  return id.slice(0, -suffix.length);
}

function convertPokemon(
  rawPokemon: RawPokemonMaster,
): PokemonMaster {
  const types = rawPokemon.types.filter(
    isPokemonTypeId,
  );

  if (types.length === 0) {
    throw new Error(
      `${rawPokemon.id} に有効なタイプがありません。`,
    );
  }

  const form = getPokemonForm(rawPokemon.id);

  return {
    id: rawPokemon.id,
    name: rawPokemon.jpName,
    enName: rawPokemon.enName,

    basePokemonId: getBasePokemonId(
      rawPokemon.id,
      form,
    ),

    form,

    types: [
      types[0],
      types[1],
    ],

    abilityIds: rawPokemon.abilities,

    stats: {
      hp: rawPokemon.stats.hp,
      attack: rawPokemon.stats.attack,
      defense: rawPokemon.stats.defense,
      specialAttack:
        rawPokemon.stats.spAttack,
      specialDefense:
        rawPokemon.stats.spDefense,
      speed: rawPokemon.stats.speed,
    },

    height: rawPokemon.height,
    weight: rawPokemon.weight,
    sprite: rawPokemon.sprite,

    isAvailableInChampions: true,
  };
}

export const pokemonMaster: PokemonMaster[] =
  rawPokemonMaster.map(convertPokemon);

export const pokemonMasterMap: Record<
  string,
  PokemonMaster
> = Object.fromEntries(
  pokemonMaster.map((pokemon) => [
    pokemon.id,
    pokemon,
  ]),
);

/**
 * 以前のデータで使っていた
 * "mega-metagross" 形式を
 * "metagross-mega" に変換する。
 */
function convertLegacyPokemonId(
  pokemonId: string,
): string {
  if (pokemonId.startsWith("mega-")) {
    return `${pokemonId.slice(5)}-mega`;
  }

  return pokemonId;
}

export function getPokemonById(
  pokemonId: string,
): PokemonMaster | undefined {
  const directResult =
    pokemonMasterMap[pokemonId];

  if (directResult) {
    return directResult;
  }

  return pokemonMasterMap[
    convertLegacyPokemonId(pokemonId)
  ];
}

export function searchPokemon(
  searchText: string,
): PokemonMaster[] {
  const normalizedText = searchText
    .trim()
    .toLowerCase();

  if (!normalizedText) {
    return pokemonMaster;
  }

  return pokemonMaster.filter((pokemon) => {
    return (
      pokemon.name
        .toLowerCase()
        .includes(normalizedText) ||
      pokemon.enName
        ?.toLowerCase()
        .includes(normalizedText) ||
      pokemon.id
        .toLowerCase()
        .includes(normalizedText)
    );
  });
}