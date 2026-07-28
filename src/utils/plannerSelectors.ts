import { getPokemonById } from "../data/pokemon";
import type {
  CandidatePokemon,
  PokemonMaster,
  Team,
  TeamPokemon,
} from "../types/pokemon";
import type { PlannerDataV2 } from "../persistence/types";
import { getDangerousPokemon } from "./matchupAnalysis";

export function findCandidate(
  candidates: CandidatePokemon[],
  candidatePokemonId: string,
): CandidatePokemon | undefined {
  return candidates.find(
    (candidate) => candidate.id === candidatePokemonId,
  );
}

export function resolveTeamPokemon(
  teamPokemon: TeamPokemon,
  candidates: CandidatePokemon[],
): {
  candidate?: CandidatePokemon;
  pokemon?: PokemonMaster;
} {
  const candidate = findCandidate(
    candidates,
    teamPokemon.candidatePokemonId,
  );
  return {
    candidate,
    pokemon: candidate
      ? getPokemonById(candidate.pokemonId)
      : undefined,
  };
}

export function getTeamCandidateIds(team: Team): Set<string> {
  return new Set(
    team.pokemon.map((teamPokemon) => teamPokemon.candidatePokemonId),
  );
}

export function getTeamPokemonIds(
  team: Team,
  candidates: CandidatePokemon[],
): Set<string> {
  return new Set(
    team.pokemon.flatMap((teamPokemon) => {
      const candidate = findCandidate(
        candidates,
        teamPokemon.candidatePokemonId,
      );
      return candidate ? [candidate.pokemonId] : [];
    }),
  );
}

export function selectMatchupCandidates(
  mode: "team" | "candidate",
  candidates: CandidatePokemon[],
  team?: Team,
): CandidatePokemon[] {
  if (mode === "candidate") {
    return candidates.filter(
      (candidate) => candidate.isVisibleInCandidateMatchups,
    );
  }
  const ids = new Set(
    team?.pokemon.map((pokemon) => pokemon.candidatePokemonId) ?? [],
  );
  return candidates.filter((candidate) => ids.has(candidate.id));
}

export function buildDashboardSummary(data: PlannerDataV2) {
  const currentTeam = data.teams.find(
    (team) => team.id === data.currentTeamId,
  );
  const candidateIds = new Set(
    currentTeam?.pokemon.map((pokemon) => pokemon.candidatePokemonId) ?? [],
  );
  const ratedKeys = new Set(
    data.matchups
      .filter(
        (matchup) =>
          candidateIds.has(matchup.candidatePokemonId) &&
          matchup.rating !== "unrated",
      )
      .map(
        (matchup) =>
          `${matchup.candidatePokemonId}\u0000${matchup.rankingEntryId}`,
      ),
  );
  return {
    candidateCount: data.candidates.length,
    rankingCount: data.rankingSet.entries.length,
    dangerCount: currentTeam
      ? getDangerousPokemon(
          currentTeam.pokemon,
          data.rankingSet.entries,
          data.matchups,
          Number.POSITIVE_INFINITY,
        ).length
      : 0,
    unratedCount:
      candidateIds.size * data.rankingSet.entries.length - ratedKeys.size,
  };
}
