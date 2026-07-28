import { describe, expect, it } from "vitest";
import { initialCandidates } from "../data/candidates";
import { teams } from "../data/teams";
import { recommendCandidates } from "./recommendation";
import { analyzeTeam } from "./teamAnalysis";
import { analyzeTeamTypeCoverage } from "./teamTypeCoverage";

describe("v2 Analysis and Recommendation", () => {
  it("CandidateのroleIdsを使ってTeamを分析する", () => {
    const analysis = analyzeTeam(teams[0], initialCandidates);
    expect(analysis.pokemonCount).toBe(teams[0].pokemon.length);
    expect(
      analysis.roleCounts.find((item) => item.roleId === "physical-attacker")
        ?.count,
    ).toBeGreaterThan(0);
  });

  it("TeamPokemon→Candidate→PokemonMasterでタイプ分析する", () => {
    const coverage = analyzeTeamTypeCoverage(teams[0], initialCandidates);
    expect(coverage.length).toBeGreaterThan(0);
    const counted = coverage[0].immune +
      coverage[0].quarter +
      coverage[0].half +
      coverage[0].neutral +
      coverage[0].double +
      coverage[0].quadruple;
    expect(counted).toBeGreaterThan(0);
    expect(counted).toBeLessThanOrEqual(teams[0].pokemon.length);
  });

  it("正式v2 TeamとCandidateから推薦を生成する", () => {
    const recommendations = recommendCandidates(
      teams[0],
      initialCandidates.slice(0, 3),
    );
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].candidate).not.toHaveProperty(
      "candidatePokemonId",
    );
    expect(recommendations[0].candidate).toHaveProperty("pokemonId");
  });
});
