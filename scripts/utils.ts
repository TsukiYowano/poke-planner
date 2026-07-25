import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function saveJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  await writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

export async function saveText(
  filePath: string,
  text: string,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  await writeFile(filePath, text, "utf8");
}