import { promises as fs } from "fs";

const API = "https://pokeapi.co/api/v2/ability";

type Ability = {
  id: string;
  jpName: string;
  enName: string;
};

async function fetchAbility(name: string): Promise<Ability> {
  const res = await fetch(`${API}/${name}`);

  if (!res.ok) {
    throw new Error(name);
  }

  const json = (await res.json()) as any;

  const jp =
    json.names.find(
      (n: any) => n.language.name === "ja-Hrkt",
    ) ??
    json.names.find(
      (n: any) => n.language.name === "ja",
    );

  return {
    id: json.name,
    jpName: jp?.name ?? json.name,
    enName: json.name,
  };
}

async function main() {
  const pokemon = JSON.parse(
    await fs.readFile(
      "master/pokemon.json",
      "utf-8",
    ),
    ) as any[];

  const abilityIds = [
    ...new Set(
      pokemon.flatMap((p: any) => p.abilities),
    ),
  ];

  abilityIds.sort();

  const result: Ability[] = [];

  for (const id of abilityIds) {
    console.log(id);
    result.push(await fetchAbility(id));
  }

  await fs.writeFile(
    "master/abilities.json",
    JSON.stringify(result, null, 2),
  );
}

main();