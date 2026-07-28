import { describe, expect, it } from "vitest";
import type {
  CandidatePokemon,
  Matchup,
  Team,
} from "../types/pokemon";
import { compareTeamCandidateSwap } from "./compareAnalysis";

const timestamp = "2026-01-01T00:00:00.000Z";
const candidates: CandidatePokemon[] = [
  {
    id: "candidate-outgoing",
    pokemonId: "mega-metagross",
    label: "メタグロス",
    status: "considering",
    roleIds: ["physical-attacker"],
    tags: [],
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "candidate-partner",
    pokemonId: "primarina",
    label: "アシレーヌ",
    status: "considering",
    roleIds: ["special-attacker"],
    tags: [],
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "candidate-incoming",
    pokemonId: "hydreigon",
    label: "サザンドラ",
    status: "considering",
    roleIds: ["special-attacker", "fast-attacker"],
    tags: [],
    isVisibleInCandidateMatchups: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];
const team: Team = {
  id: "team",
  name: "比較構築",
  status: "active",
  createdAt: timestamp,
  updatedAt: timestamp,
  pokemon: [
    {
      id: "team-pokemon-outgoing",
      candidatePokemonId: "candidate-outgoing",
      moves: [],
    },
    {
      id: "team-pokemon-partner",
      candidatePokemonId: "candidate-partner",
      moves: [],
    },
  ],
};
const matchups: Matchup[] = [
  {
    id: "outgoing-good",
    candidatePokemonId: "candidate-outgoing",
    rankingEntryId: "enemy-a",
    rating: "good",
  },
  {
    id: "partner-bad",
    candidatePokemonId: "candidate-partner",
    rankingEntryId: "enemy-a",
    rating: "bad",
  },
  {
    id: "incoming-good",
    candidatePokemonId: "candidate-incoming",
    rankingEntryId: "enemy-b",
    rating: "very-good",
  },
];

describe("v2 Compare analysis", () => {
  const comparison = compareTeamCandidateSwap(
    team,
    candidates,
    matchups,
    "team-pokemon-outgoing",
    "candidate-incoming",
  );

  it("Compare表示に必要な変更前後データを生成する", () => {
    expect(comparison).not.toBeNull();
    expect(comparison?.outgoingCandidate.label).toBe("メタグロス");
    expect(comparison?.incomingCandidate.label).toBe("サザンドラ");
    expect(comparison?.afterTeam.pokemon).toHaveLength(2);
  });

  it("Candidate参照を維持して入れ替える", () => {
    expect(
      comparison?.afterTeam.pokemon.map(
        (pokemon) => pokemon.candidatePokemonId,
      ),
    ).toEqual(["candidate-partner", "candidate-incoming"]);
  });

  it("MatchupをCandidateとRankingEntryのキーで比較する", () => {
    expect(comparison?.uniqueResponsibilities.map((item) => item.id)).toEqual([
      "outgoing-good",
    ]);
    expect(comparison?.incomingGoodMatchups.map((item) => item.id)).toEqual([
      "incoming-good",
    ]);
  });

  it("正式v2のAnalysis結果を比較する", () => {
    expect(comparison?.beforeAnalysis.pokemonCount).toBe(2);
    expect(comparison?.afterAnalysis.pokemonCount).toBe(2);
    expect(
      comparison?.roleChanges.some(
        (change) =>
          change.roleId === "fast-attacker" && change.delta === 1,
      ),
    ).toBe(true);
    expect(comparison?.coverageChanges.length).toBeGreaterThan(0);
  });

  it("正式v2のRecommendation結果を含める", () => {
    expect(comparison?.recommendation?.candidate.id).toBe(
      "candidate-incoming",
    );
    expect(comparison?.recommendation?.reasons).toBeDefined();
  });
});
