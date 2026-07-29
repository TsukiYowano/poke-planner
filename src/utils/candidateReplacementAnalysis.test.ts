import { describe, expect, it } from "vitest";
import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  Team,
} from "../types/pokemon";
import { analyzeCandidateReplacement } from "./candidateReplacementAnalysis";

const timestamp = "2026-01-01T00:00:00.000Z";
const candidate = (
  id: string,
  pokemonId: string,
): CandidatePokemon => ({
  id,
  pokemonId,
  label: id,
  status: "considering",
  roleIds: [],
  tags: [],
  isVisibleInCandidateMatchups: true,
  createdAt: timestamp,
  updatedAt: timestamp,
});
const outgoing = candidate("candidate-outgoing", "pokemon-outgoing");
const partner = candidate("candidate-partner", "pokemon-partner");
const incoming = candidate("candidate-incoming", "pokemon-incoming");
const samePokemonIncoming = candidate(
  "candidate-incoming-other",
  "pokemon-incoming",
);
const candidates = [outgoing, partner, incoming, samePokemonIncoming];
const team: Team = {
  id: "team",
  name: "比較構築",
  status: "active",
  createdAt: timestamp,
  updatedAt: timestamp,
  pokemon: [
    {
      id: "team-outgoing",
      candidatePokemonId: outgoing.id,
      moves: [],
    },
    {
      id: "team-partner",
      candidatePokemonId: partner.id,
      moves: [],
    },
  ],
};
const entries: RankingEntry[] = [
  ["entry-worsened", 2],
  ["entry-improved", 1],
  ["entry-unchanged", 3],
  ["entry-warning-removed", 4],
  ["entry-warning-added", 5],
  ["entry-unrated", 6],
  ["entry-warning-removed-2", 7],
].map(([id, rank]) => ({
  id: String(id),
  pokemonId: `pokemon-${id}`,
  rank: Number(rank),
  assumedMoves: [],
  roleIds: [],
  tags: [],
}));
const ratings: Record<
  string,
  [MatchupRating, MatchupRating, MatchupRating]
> = {
  "entry-improved": ["bad", "bad", "good"],
  "entry-worsened": ["very-good", "bad", "bad"],
  "entry-unchanged": ["good", "bad", "good"],
  "entry-warning-removed": ["bad", "good", "good"],
  "entry-warning-added": ["good", "good", "bad"],
  "entry-unrated": ["unrated", "unrated", "unrated"],
  "entry-warning-removed-2": ["even", "good", "very-good"],
};
const candidateOrder = [outgoing, partner, incoming];
const matchups: Matchup[] = [
  ...entries.flatMap((entry) =>
    candidateOrder.map((item, index) => ({
      id: `${item.id}-${entry.id}`,
      candidatePokemonId: item.id,
      rankingEntryId: entry.id,
      rating: ratings[entry.id][index],
    })),
  ),
  {
    id: "same-pokemon-different-candidate",
    candidatePokemonId: samePokemonIncoming.id,
    rankingEntryId: "entry-improved",
    rating: "very-good",
  },
];

describe("candidate replacement analysis", () => {
  const analysis = analyzeCandidateReplacement(
    team,
    candidates,
    outgoing,
    incoming,
    entries,
    matchups,
  );

  it("仮想TeamだけをCandidate.id基準で入れ替える", () => {
    expect(team.pokemon[0].candidatePokemonId).toBe(outgoing.id);
    expect(analysis?.afterTeam.pokemon[0]).toMatchObject({
      id: "team-outgoing",
      candidatePokemonId: incoming.id,
    });
  });

  it("改善・悪化を評価順序で判定し、変化なしを除外する", () => {
    expect(
      analysis?.improvedEntries.map(({ entry }) => entry.id),
    ).toEqual([
      "entry-improved",
      "entry-warning-removed",
      "entry-warning-removed-2",
    ]);
    expect(
      analysis?.worsenedEntries.map(({ entry }) => entry.id),
    ).toEqual(["entry-worsened", "entry-warning-added"]);
    expect(
      [...(analysis?.improvedEntries ?? []), ...(analysis?.worsenedEntries ?? [])]
        .map(({ entry }) => entry.id),
    ).not.toContain("entry-unchanged");
  });

  it("同じpokemonIdの別Candidateではなく選択Candidateの評価を使う", () => {
    const improved = analysis?.improvedEntries.find(
      ({ entry }) => entry.id === "entry-improved",
    );
    expect(improved?.afterRating).toBe("good");
  });

  it("要注意追加・解除をrank順で返す", () => {
    expect(analysis?.removedWarnings.map((entry) => entry.id)).toEqual([
      "entry-warning-removed",
      "entry-warning-removed-2",
    ]);
    expect(analysis?.addedWarnings.map((entry) => entry.id)).toEqual([
      "entry-warning-added",
    ]);
  });

  it("サマリーの変更前後と差分件数を返す", () => {
    expect(analysis?.summary.warnings).toEqual({
      before: 5,
      after: 4,
      delta: -1,
    });
    expect(analysis?.summary.sharedResponsibilities.delta).toBe(2);
    expect(analysis?.summary.soleResponsibilities.delta).toBe(-1);
  });

  it("Teamが変わると比較結果も変わる", () => {
    const smallerTeam = { ...team, pokemon: [team.pokemon[0]] };
    const smaller = analyzeCandidateReplacement(
      smallerTeam,
      candidates,
      outgoing,
      incoming,
      entries,
      matchups,
    );
    expect(smaller?.summary).not.toEqual(analysis?.summary);
  });
});
