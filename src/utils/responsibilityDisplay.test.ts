import { describe, expect, it } from "vitest";
import { formatCandidateDisplayName } from "./responsibilityDisplay";

describe("formatCandidateDisplayName", () => {
  const pokemonName = "メガミミロップ";

  it.each([
    [undefined, "メガミミロップ"],
    ["", "メガミミロップ"],
    ["メガミミロップ", "メガミミロップ"],
    ["  メガミミロップ  ", "メガミミロップ"],
    ["対面型", "メガミミロップ（対面型）"],
  ])("label=%sを重複なく表示する", (label, expected) => {
    expect(formatCandidateDisplayName(pokemonName, label)).toBe(expected);
  });
});
