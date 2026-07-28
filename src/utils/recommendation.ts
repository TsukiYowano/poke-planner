import { pokemonMasterMap } from "../data/pokemon";
import { getTeamRoleName } from "../data/roles";
import { pokemonTypes } from "../data/types";
import type {
  CandidatePokemon,
  CandidateRecommendation,
  RecommendationReason,
  Team,
} from "../types/pokemon";
import { analyzeTeam } from "./teamAnalysis";
import { analyzeTeamTypeCoverage } from "./teamTypeCoverage";
import { calculateTypeEffectiveness } from "./typeEffectiveness";

const SCORE = {
  immunity: 15,
  resist: 8,
  weakness: -6,
  missingRole: 12,
};

export function recommendCandidates(
  team: Team,
  candidates: CandidatePokemon[],
  allCandidates: CandidatePokemon[] = candidates,
): CandidateRecommendation[] {
  const coverage =
    analyzeTeamTypeCoverage(team, allCandidates);

  const coverageMap = new Map(
    coverage.map((item) => [
      item.attackingType,
      item,
    ]),
  );

  const teamAnalysis = analyzeTeam(team, allCandidates);

  return candidates
    .map((candidate) => {
      const pokemon =
        pokemonMasterMap[
          candidate.pokemonId
        ];

      if (!pokemon) {
        return {
          candidate,
          score: 0,
          reasons: [],
        };
      }

      let score = 0;

      const reasons: RecommendationReason[] =
        [];

      for (const type of pokemonTypes) {
        const effectiveness =
          calculateTypeEffectiveness(
            pokemon,
            type.id,
            undefined,
          );

        const currentCoverage =
          coverageMap.get(type.id);

        if (!currentCoverage) {
          continue;
        }

        const defensiveAnswers =
          currentCoverage.immune +
          currentCoverage.quarter +
          currentCoverage.half;

        // 現在の構築で受け先が少ないタイプを
        // 無効化できる場合は大きく加点
        if (
          defensiveAnswers <= 1 &&
          effectiveness.finalMultiplier === 0
        ) {
          score += SCORE.immunity;

          reasons.push({
            type: "type-cover",
            message: `${type.name}無効で受け先を補完`,
            score: SCORE.immunity,
          });
        }

        // 現在の構築で受け先が少ないタイプを
        // 半減以下にできる場合は加点
        else if (
          defensiveAnswers <= 1 &&
          effectiveness.finalMultiplier <= 0.5
        ) {
          score += SCORE.resist;

          reasons.push({
            type: "type-cover",
            message: `${type.name}耐性で受け先を補完`,
            score: SCORE.resist,
          });
        }

        // すでに弱点が多いタイプを
        // さらに弱点として追加する場合は減点
        if (
          currentCoverage.double +
            currentCoverage.quadruple >=
            2 &&
          effectiveness.finalMultiplier >= 2
        ) {
          score += SCORE.weakness;

          reasons.push({
            type: "type-weakness",
            message: `${type.name}弱点が増える`,
            score: SCORE.weakness,
          });
        }
      }

      // 不足している重要役割を補える場合は加点
      for (const roleId of candidate.roleIds) {
        if (
          !teamAnalysis.missingImportantRoles.includes(
            roleId,
          )
        ) {
          continue;
        }

        score += SCORE.missingRole;

        reasons.push({
          type: "missing-role",
          message: `不足役割「${getTeamRoleName(
            roleId,
          )}」を補完`,
          score: SCORE.missingRole,
        });
      }

      return {
        candidate,
        score,
        reasons,
      };
    })
    .sort(
      (a, b) => b.score - a.score,
    );
}
