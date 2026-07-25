import { promises as fs } from "fs";

const API = "https://pokeapi.co/api/v2/move";

type Move = {
  id: string;
  jpName: string;
  enName: string;

  type: string;

  category:
    | "physical"
    | "special"
    | "status";

  power: number | null;
  accuracy: number | null;
  pp: number;

  priority: number;
};

async function fetchMove(
  name: string,
): Promise<Move> {
  const res = await fetch(`${API}/${name}`);

  if (!res.ok) {
    throw new Error(name);
  }

  const json: any = await res.json();

  const jp =
    json.names.find(
      (n: any) =>
        n.language.name === "ja-Hrkt",
    ) ??
    json.names.find(
      (n: any) =>
        n.language.name === "ja",
    );

  return {
    id: json.name,

    jpName: jp?.name ?? json.name,
    enName: json.name,

    type: json.type.name,

    category: json.damage_class.name,

    power: json.power,
    accuracy: json.accuracy,
    pp: json.pp,

    priority: json.priority,
  };
}

async function main() {
  console.log("Move list取得中...");

  const listRes = await fetch(
    `${API}?limit=10000`,
  );

  const listJson: any =
    await listRes.json();

  const moves =
    listJson.results.map(
      (move: any) => move.name,
    );

  console.log(
    `${moves.length}件取得`,
  );

  const result: Move[] = [];

  for (const move of moves) {
    console.log(move);

    try {
      result.push(
        await fetchMove(move),
      );
    } catch {
      console.log(
        `取得失敗: ${move}`,
      );
    }
  }

  await fs.writeFile(
    "master/moves.json",
    JSON.stringify(result, null, 2),
  );

  console.log(
    `Generated: ${result.length}`,
  );
}

main();