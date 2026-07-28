import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import {
  loadPlannerData,
  savePlannerData,
} from "../repositories/SupabaseRepository";
import { loadTop50, type Top50Ranking } from "../repositories/Top50Repository";
import { initialCandidates } from "../data/candidates";
import { pokemonMaster } from "../data/pokemon";
import { initialRankingSet } from "../data/rankings";
import { teams as initialTeams } from "../data/teams";
import {
  addCandidate as addCandidateOperation,
  addCandidateToTeam as addCandidateToTeamOperation,
  deleteCandidate as deleteCandidateOperation,
  deleteTeam as deleteTeamOperation,
  duplicateTeam as duplicateTeamOperation,
  getCandidateDeletionImpact as getCandidateDeletionImpactOperation,
  removeTeamPokemon as removeTeamPokemonOperation,
  setMatchupRating as setMatchupRatingOperation,
  updateCandidate as updateCandidateOperation,
  updateMatchupMemo as updateMatchupMemoOperation,
  updateTeamPokemon as updateTeamPokemonOperation,
  type ActionResult,
  type CandidateDeletionImpact,
  type TeamPokemonChanges,
  type UpdateCandidateInput,
  createCandidate as createCandidateModel,
} from "../persistence/plannerOperations";
import {
  loadLocalPlannerData,
  saveLocalPlannerDataIfReady,
} from "../persistence/localStorage";
import { migratePlannerData } from "../persistence/migration";
import type { PlannerDataV2 } from "../persistence/types";
import {
  parsePlannerData,
  parsePlannerDataJson,
  serializePlannerData,
} from "../persistence/serialization";
import type {
  MatchupRating,
  RankingEntry,
  RankingSet,
  Team,
  TeamStatus,
} from "../types/pokemon";

type CreateTeamInput = {
  name: string;
  description?: string;
  status?: TeamStatus;
};

export type CreateCandidateInput = {
  pokemonId: string;
  label?: string;
};

type PlannerContextValue = {
  plannerData: PlannerDataV2;
  isInitialized: boolean;

  setCurrentTeam: (teamId: string) => ActionResult;
  createTeam: (input: CreateTeamInput) => Team;
  updateTeam: (team: Team) => ActionResult;
  deleteTeam: (teamId: string) => ActionResult;
  duplicateTeam: (teamId: string) => ActionResult;

  addCandidate: (input: CreateCandidateInput) => ActionResult;
  updateCandidate: (input: UpdateCandidateInput) => ActionResult;
  getCandidateDeletionImpact: (
    candidateId: string,
  ) => CandidateDeletionImpact;
  deleteCandidate: (candidateId: string) => ActionResult;
  addCandidateToTeam: (candidateId: string) => ActionResult;

  updateTeamPokemon: (
    teamPokemonId: string,
    changes: TeamPokemonChanges,
  ) => ActionResult;
  removeTeamPokemon: (teamPokemonId: string) => ActionResult;
  isCandidateInTeam: (candidateId: string) => boolean;

  addRankingEntry: (pokemonId: string) => ActionResult;
  updateRankingEntry: (entry: RankingEntry) => void;
  removeRankingEntry: (entryId: string) => void;

  setMatchupRating: (
    candidatePokemonId: string,
    rankingEntryId: string,
    rating: MatchupRating,
  ) => void;
  updateMatchupMemo: (
    candidatePokemonId: string,
    rankingEntryId: string,
    memo: string,
  ) => void;

  exportPlannerData: () => string;
  importPlannerData: (json: string) => ActionResult;
  resetPlannerData: () => void;

};

const PlannerContext = createContext<PlannerContextValue | null>(null);

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function createInitialPlannerData(): PlannerDataV2 {
  return migratePlannerData({
    version: 2,
    exportedAt: "2026-07-24T15:30:00+09:00",
    teams: initialTeams,
    currentTeamId: initialTeams[0]?.id,
    candidates: initialCandidates,
    rankingSet: initialRankingSet,
    matchups: [],
  });
}

export function parseAndMigratePlannerData(raw: unknown): PlannerDataV2 {
  return parsePlannerData(raw);
}

function mergeTop50Ranking(
  current: RankingSet,
  top50Rankings: Top50Ranking[],
): RankingSet {
  const currentByPokemonId = new Map(
    current.entries.map((entry) => [entry.pokemonId, entry]),
  );

  return {
    ...current,
    entries: top50Rankings.map((ranking) => {
      const existing = currentByPokemonId.get(ranking.pokemon_id);
      if (existing) {
        return {
          ...existing,
          rank: ranking.rank,
          assumedMoves: [...existing.assumedMoves],
          roleIds: [...existing.roleIds],
          tags: [...existing.tags],
        };
      }

      const pokemon = pokemonMaster.find(
        (item) => item.id === ranking.pokemon_id,
      );
      return {
        id: createId("ranking-entry"),
        pokemonId: ranking.pokemon_id,
        rank: ranking.rank,
        assumedAbilityId: pokemon?.abilityIds[0],
        assumedMoves: [],
        roleIds: [],
        tags: [],
        memo: "",
      };
    }),
    updatedAt: now(),
  };
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [plannerData, setPlannerData] = useState<PlannerDataV2>(() =>
    loadLocalPlannerData(window.localStorage, createInitialPlannerData()),
  );
  const [isInitialized] = useState(true);
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudSyncReady, setCloudSyncReady] = useState(false);

  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );

  useEffect(() => {
    saveLocalPlannerDataIfReady(
      window.localStorage,
      plannerData,
      isInitialized,
    );
  }, [isInitialized, plannerData]);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("ログイン情報の取得に失敗しました。", error);
        return;
      }
      setCloudUserId(data.session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudSyncReady(false);
      setCloudUserId(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!cloudUserId || !isInitialized) {
      setCloudSyncReady(false);
      return;
    }

    let cancelled = false;
    setCloudSyncReady(false);
    void loadPlannerData(cloudUserId)
      .then((raw) => {
        if (cancelled) return;
        if (raw !== null) {
          setPlannerData(parseAndMigratePlannerData(raw));
        }
        setCloudSyncReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Supabaseからの読み込みに失敗しました。", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cloudUserId, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !cloudUserId || !cloudSyncReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void savePlannerData(
        cloudUserId,
        serializePlannerData(plannerData, now()),
      ).catch((error: unknown) => {
        console.error("Supabaseへの保存に失敗しました。", error);
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [cloudSyncReady, cloudUserId, isInitialized, plannerData]);

  useEffect(() => {
    void loadTop50()
      .then((rankings) => {
        if (rankings.length > 0) {
          setPlannerData((current) => ({
            ...current,
            rankingSet: mergeTop50Ranking(current.rankingSet, rankings),
          }));
        }
      })
      .catch((error: unknown) => {
        console.error("TOP50ランキングの読み込みに失敗しました。", error);
      });
  }, []);

  function applyOperation(
    operation: (data: PlannerDataV2) => {
      data: PlannerDataV2;
      result: ActionResult;
    },
  ): ActionResult {
    const output = operation(plannerData);
    if (output.result.success) {
      setPlannerData(output.data);
    }
    return output.result;
  }

  function setCurrentTeam(teamId: string): ActionResult {
    if (!plannerData.teams.some((team) => team.id === teamId)) {
      return { success: false, message: "指定された構築が見つかりません。" };
    }
    setPlannerData((current) => ({ ...current, currentTeamId: teamId }));
    return { success: true };
  }

  function createTeam(input: CreateTeamInput): Team {
    const timestamp = now();
    const team: Team = {
      id: createId("team"),
      name: input.name.trim() || "新しい構築",
      description: input.description?.trim(),
      status: input.status ?? "draft",
      pokemon: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setPlannerData((current) => ({
      ...current,
      teams: [team, ...current.teams],
      currentTeamId: team.id,
    }));
    return team;
  }

  function updateTeam(team: Team): ActionResult {
    if (!plannerData.teams.some((item) => item.id === team.id)) {
      return { success: false, message: "更新対象の構築が見つかりません。" };
    }
    setPlannerData((current) => ({
      ...current,
      teams: current.teams.map((item) =>
        item.id === team.id
          ? {
              ...item,
              name: team.name,
              description: team.description,
              status: team.status,
              updatedAt: now(),
            }
          : item,
      ),
    }));
    return { success: true };
  }

  function deleteTeam(teamId: string): ActionResult {
    return applyOperation((data) => deleteTeamOperation(data, teamId));
  }

  function duplicateTeam(teamId: string): ActionResult {
    return applyOperation((data) =>
      duplicateTeamOperation(
        data,
        teamId,
        createId("team"),
        () => createId("team-pokemon"),
        now(),
      ),
    );
  }

  function addCandidate(input: CreateCandidateInput): ActionResult {
    const { pokemonId } = input;
    const pokemon = pokemonMaster.find((item) => item.id === pokemonId);
    if (!pokemon) {
      return { success: false, message: "ポケモンが見つかりません。" };
    }
    const timestamp = now();
    return applyOperation((data) =>
      addCandidateOperation(
        data,
        createCandidateModel(
          createId("candidate"),
          pokemonId,
          input.label?.trim() || pokemon.name,
          timestamp,
        ),
      ),
    );
  }

  function updateCandidate(input: UpdateCandidateInput): ActionResult {
    return applyOperation((data) =>
      updateCandidateOperation(data, input, now()),
    );
  }

  function getCandidateDeletionImpact(
    candidateId: string,
  ): CandidateDeletionImpact {
    return getCandidateDeletionImpactOperation(plannerData, candidateId);
  }

  function deleteCandidate(candidateId: string): ActionResult {
    return applyOperation((data) =>
      deleteCandidateOperation(data, candidateId),
    );
  }

  function addCandidateToTeam(candidateId: string): ActionResult {
    if (!currentTeam) {
      return { success: false, message: "追加先の構築がありません。" };
    }
    const candidate = plannerData.candidates.find(
      (item) => item.id === candidateId,
    );
    const defaultAbilityId = pokemonMaster.find(
      (pokemon) => pokemon.id === candidate?.pokemonId,
    )?.abilityIds[0];
    return applyOperation((data) =>
      addCandidateToTeamOperation(
        data,
        currentTeam.id,
        candidateId,
        createId("team-pokemon"),
        defaultAbilityId,
      ),
    );
  }

  function updateTeamPokemon(
    teamPokemonId: string,
    changes: TeamPokemonChanges,
  ): ActionResult {
    if (!currentTeam) {
      return { success: false, message: "更新対象の構築がありません。" };
    }
    return applyOperation((data) =>
      updateTeamPokemonOperation(
        data,
        currentTeam.id,
        teamPokemonId,
        changes,
      ),
    );
  }

  function removeTeamPokemon(teamPokemonId: string): ActionResult {
    if (!currentTeam) {
      return { success: false, message: "削除対象の構築がありません。" };
    }
    return applyOperation((data) =>
      removeTeamPokemonOperation(data, currentTeam.id, teamPokemonId),
    );
  }

  function isCandidateInTeam(candidateId: string): boolean {
    return (
      currentTeam?.pokemon.some(
        (teamPokemon) => teamPokemon.candidatePokemonId === candidateId,
      ) ?? false
    );
  }

  function addRankingEntry(pokemonId: string): ActionResult {
    const pokemon = pokemonMaster.find((item) => item.id === pokemonId);
    if (!pokemon) {
      return { success: false, message: "ポケモンが見つかりません。" };
    }
    if (
      plannerData.rankingSet.entries.some(
        (entry) => entry.pokemonId === pokemonId,
      )
    ) {
      return {
        success: false,
        message: "すでに仮想敵へ登録されています。",
      };
    }
    if (plannerData.rankingSet.entries.length >= 50) {
      return { success: false, message: "仮想敵は50匹まで登録できます。" };
    }
    const rank =
      Math.max(
        0,
        ...plannerData.rankingSet.entries.map((entry) => entry.rank),
      ) + 1;
    const entry: RankingEntry = {
      id: createId("ranking-entry"),
      pokemonId,
      rank,
      assumedAbilityId: pokemon.abilityIds[0],
      assumedMoves: [],
      roleIds: [],
      tags: [],
    };
    setPlannerData((current) => ({
      ...current,
      rankingSet: {
        ...current.rankingSet,
        entries: [...current.rankingSet.entries, entry],
        updatedAt: now(),
      },
    }));
    return { success: true };
  }

  function updateRankingEntry(entry: RankingEntry) {
    setPlannerData((current) => ({
      ...current,
      rankingSet: {
        ...current.rankingSet,
        entries: current.rankingSet.entries.map((item) =>
          item.id === entry.id
            ? {
                ...entry,
                assumedMoves: [...entry.assumedMoves],
                roleIds: [...entry.roleIds],
                tags: [...entry.tags],
              }
            : item,
        ),
        updatedAt: now(),
      },
    }));
  }

  function removeRankingEntry(entryId: string) {
    setPlannerData((current) => ({
      ...current,
      rankingSet: {
        ...current.rankingSet,
        entries: current.rankingSet.entries
          .filter((entry) => entry.id !== entryId)
          .map((entry, index) => ({ ...entry, rank: index + 1 })),
        updatedAt: now(),
      },
      matchups: current.matchups.filter(
        (matchup) => matchup.rankingEntryId !== entryId,
      ),
    }));
  }

  function setMatchupRating(
    candidatePokemonId: string,
    rankingEntryId: string,
    rating: MatchupRating,
  ) {
    setPlannerData((current) =>
      setMatchupRatingOperation(
        current,
        candidatePokemonId,
        rankingEntryId,
        rating,
        createId("matchup"),
      ),
    );
  }

  function updateMatchupMemo(
    candidatePokemonId: string,
    rankingEntryId: string,
    memo: string,
  ) {
    setPlannerData((current) =>
      updateMatchupMemoOperation(
        current,
        candidatePokemonId,
        rankingEntryId,
        memo,
        createId("matchup"),
      ),
    );
  }

  function exportPlannerData(): string {
    return serializePlannerData(plannerData, now(), true);
  }

  function importPlannerData(json: string): ActionResult {
    try {
      const migrated = parsePlannerDataJson(json);
      setPlannerData(migrated);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "JSONの読み込みに失敗しました。",
      };
    }
  }

  function resetPlannerData() {
    setPlannerData(createInitialPlannerData());
  }

  const value = useMemo<PlannerContextValue>(
    () => ({
      plannerData,
      isInitialized,
      setCurrentTeam,
      createTeam,
      updateTeam,
      deleteTeam,
      duplicateTeam,
      addCandidate,
      updateCandidate,
      getCandidateDeletionImpact,
      deleteCandidate,
      addCandidateToTeam,
      updateTeamPokemon,
      removeTeamPokemon,
      isCandidateInTeam,
      addRankingEntry,
      updateRankingEntry,
      removeRankingEntry,
      setMatchupRating,
      updateMatchupMemo,
      exportPlannerData,
      importPlannerData,
      resetPlannerData,
    }),
    [isInitialized, plannerData],
  );

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextValue {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error(
      "usePlannerはPlannerProviderの内側で使用してください。",
    );
  }
  return context;
}
