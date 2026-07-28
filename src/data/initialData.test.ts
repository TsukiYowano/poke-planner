import { describe, expect, it } from "vitest";
import { initialCandidates } from "./candidates";
import { teams } from "./teams";

describe("v2 initial data", () => {
  it("すべてのTeamPokemonが存在するCandidateを参照する", () => {
    const candidateIds = new Set(
      initialCandidates.map((candidate) => candidate.id),
    );

    for (const team of teams) {
      for (const teamPokemon of team.pokemon) {
        expect(candidateIds.has(teamPokemon.candidatePokemonId)).toBe(true);
        expect(teamPokemon).not.toHaveProperty("pokemonId");
        expect(teamPokemon).not.toHaveProperty("roleIds");
        expect(teamPokemon).not.toHaveProperty("tags");
      }
    }
  });
});
