import { describe, expect, it } from "vitest";
import type { CandidatePokemon, Team } from "../types/pokemon";
import type { PlannerDataV2 } from "../persistence/types";
import {
  buildDashboardSummary,
  resolveTeamPokemon,
  selectMatchupCandidates,
} from "./plannerSelectors";

const candidates: CandidatePokemon[] = [
  {
    id: "candidate-visible",
    pokemonId: "garchomp",
    label: "visible",
    status: "considering",
    roleIds: [],
    tags: [],
    isVisibleInCandidateMatchups: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "candidate-hidden",
    pokemonId: "rotom",
    label: "hidden",
    status: "considering",
    roleIds: [],
    tags: [],
    isVisibleInCandidateMatchups: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const team: Team = {
  id: "team",
  name: "team",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  pokemon: [
    {
      id: "team-pokemon",
      candidatePokemonId: "candidate-hidden",
      moves: [],
    },
  ],
};

describe("v2 view selectors", () => {
  it("TeamPokemonをCandidate経由で解決する", () => {
    const resolved = resolveTeamPokemon(team.pokemon[0], candidates);
    expect(resolved.candidate?.id).toBe("candidate-hidden");
  });

  it("Candidateモードは表示対象だけ、Teamモードは所属Candidateを返す", () => {
    expect(
      selectMatchupCandidates("candidate", candidates).map((item) => item.id),
    ).toEqual(["candidate-visible"]);
    expect(
      selectMatchupCandidates("team", candidates, team).map((item) => item.id),
    ).toEqual(["candidate-hidden"]);
  });

  it("Dashboard集計を正式v2データから作る", () => {
    const data: PlannerDataV2 = {
      version: 2,
      exportedAt: "2026-01-01T00:00:00.000Z",
      teams: [team],
      currentTeamId: team.id,
      candidates,
      rankingSet: {
        id: "ranking",
        name: "ranking",
        updatedAt: "2026-01-01T00:00:00.000Z",
        entries: [
          {
            id: "enemy",
            pokemonId: "enemy",
            rank: 1,
            tags: [],
            assumedMoves: [],
            roleIds: [],
          },
          {
            id: "enemy-2",
            pokemonId: "enemy-2",
            rank: 2,
            tags: [],
            assumedMoves: [],
            roleIds: [],
          },
        ],
      },
      matchups: [
        {
          id: "matchup",
          candidatePokemonId: "candidate-hidden",
          rankingEntryId: "enemy",
          rating: "good",
        },
      ],
    };
    expect(buildDashboardSummary(data)).toMatchObject({
      candidateCount: 2,
      rankingCount: 2,
      unratedCount: 1,
    });
  });
});
