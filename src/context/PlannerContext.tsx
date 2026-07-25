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
import {
  loadTop50,
  type Top50Ranking,
} from "../repositories/Top50Repository";
import { initialCandidates } from "../data/candidates";
import { pokemonMaster } from "../data/pokemon";
import { initialRankingSet } from "../data/rankings";
import { teams as initialTeams } from "../data/teams";
import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
  RankingSet,
  Team,
  TeamPokemon,
  TeamStatus,
} from "../types/pokemon";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

type CreateTeamInput = {
  name: string;
  description?: string;
  status?: TeamStatus;
};

type PlannerExportData = {
  version: 1;
  exportedAt: string;
  teams: Team[];
  currentTeamId?: string;
  candidates: CandidatePokemon[];
  rankingSet: RankingSet;
  matchups: Matchup[];
};

type PlannerContextValue = {
  teams: Team[];
  currentTeamId?: string;
  currentTeam?: Team;

  candidates: CandidatePokemon[];
  rankingSet: RankingSet;
  matchups: Matchup[];

  setCurrentTeam: (teamId: string) => ActionResult;
  createTeam: (input: CreateTeamInput) => Team;
  updateTeam: (team: Team) => ActionResult;
  deleteTeam: (teamId: string) => ActionResult;
  duplicateTeam: (teamId: string) => ActionResult;

  updateTeamPokemon: (teamPokemon: TeamPokemon) => void;
  addCandidate: (pokemonId: string) => ActionResult;
  updateCandidate: (candidate: CandidatePokemon) => void;
  removeCandidate: (candidateId: string) => void;
  addCandidateToTeam: (candidateId: string) => ActionResult;
  removePokemonFromTeam: (pokemonId: string) => void;
  isPokemonInTeam: (pokemonId: string) => boolean;

  addRankingEntry: (pokemonId: string) => ActionResult;
  updateRankingEntry: (entry: RankingEntry) => void;
  removeRankingEntry: (entryId: string) => void;

  setMatchupRating: (
    teamPokemonId: string,
    rankingEntryId: string,
    rating: MatchupRating,
  ) => void;

  updateMatchupMemo: (
    teamPokemonId: string,
    rankingEntryId: string,
    memo: string,
  ) => void;

  exportPlannerData: () => string;
  importPlannerData: (json: string) => ActionResult;
  resetPlannerData: () => void;

  addPokemonToTeam: (pokemonId: string) => ActionResult;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

const TEAMS_STORAGE_KEY = "poke-planner-teams";
const CURRENT_TEAM_ID_STORAGE_KEY = "poke-planner-current-team-id";
const LEGACY_TEAM_STORAGE_KEY = "poke-planner-current-team";

const CANDIDATE_STORAGE_KEY = "poke-planner-candidates";
const RANKING_STORAGE_KEY = "poke-planner-ranking-set";
const MATCHUP_STORAGE_KEY = "poke-planner-matchups";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function cloneTeam(team: Team): Team {
  return {
    ...team,
    pokemon: team.pokemon.map((teamPokemon) => ({
      ...teamPokemon,
      moves: [...(teamPokemon.moves ?? [])],
      roleIds: [...(teamPokemon.roleIds ?? [])],
      tags: [...(teamPokemon.tags ?? [])],
      effortValues: teamPokemon.effortValues
        ? { ...teamPokemon.effortValues }
        : undefined,
    })),
  };
}

function normalizeTeam(team: Team): Team {
  return {
    ...team,
    status: team.status ?? "draft",
    pokemon: (team.pokemon ?? []).map((teamPokemon) => ({
      ...teamPokemon,
      moves: teamPokemon.moves ?? [],
      roleIds: teamPokemon.roleIds ?? [],
      tags: teamPokemon.tags ?? [],
      effortValues: teamPokemon.effortValues
        ? { ...teamPokemon.effortValues }
        : undefined,
    })),
  };
}

function cloneInitialTeams(): Team[] {
  return initialTeams.map(cloneTeam);
}

function loadStoredTeams(): Team[] {
  const fallback = cloneInitialTeams();

  try {
    const storedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);

    if (storedTeams) {
      const parsed = JSON.parse(storedTeams) as Team[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeTeam);
      }
    }

    const legacyTeam = localStorage.getItem(
      LEGACY_TEAM_STORAGE_KEY,
    );

    if (legacyTeam) {
      const parsedLegacyTeam = JSON.parse(
        legacyTeam,
      ) as Team;

      return [normalizeTeam(parsedLegacyTeam)];
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function loadStoredCurrentTeamId(
  availableTeams: Team[],
): string | undefined {
  try {
    const storedId = localStorage.getItem(
      CURRENT_TEAM_ID_STORAGE_KEY,
    );

    if (
      storedId &&
      availableTeams.some((team) => team.id === storedId)
    ) {
      return storedId;
    }

    return availableTeams[0]?.id;
  } catch {
    return availableTeams[0]?.id;
  }
}

function cloneInitialCandidates(): CandidatePokemon[] {
  return initialCandidates.map((candidate) => ({
    ...candidate,
    roleIds: [...candidate.roleIds],
    tags: [...candidate.tags],
  }));
}

function loadStoredCandidates(): CandidatePokemon[] {
  const fallback = cloneInitialCandidates();

  try {
    const storedValue = localStorage.getItem(
      CANDIDATE_STORAGE_KEY,
    );

    if (!storedValue) {
      return fallback;
    }

    const parsed = JSON.parse(
      storedValue,
    ) as CandidatePokemon[];

    return parsed.map((candidate) => ({
      ...candidate,
      roleIds: candidate.roleIds ?? [],
      tags: candidate.tags ?? [],
    }));
  } catch {
    return fallback;
  }
}

function cloneInitialRankingSet(): RankingSet {
  return {
    ...initialRankingSet,
    entries: initialRankingSet.entries.map((entry) => ({
      ...entry,
      assumedMoves: [...entry.assumedMoves],
      roleIds: [...entry.roleIds],
      tags: [...entry.tags],
    })),
  };
}

function normalizeRankingSet(
  rankingSet: RankingSet,
): RankingSet {
  return {
    ...rankingSet,
    entries: (rankingSet.entries ?? []).map((entry) => ({
      ...entry,
      assumedMoves: entry.assumedMoves ?? [],
      roleIds: entry.roleIds ?? [],
      tags: entry.tags ?? [],
    })),
  };
}

function mergeTop50Ranking(
  currentRankingSet: RankingSet,
  top50Rankings: Top50Ranking[],
): RankingSet {
  const currentEntriesByPokemonId = new Map(
    currentRankingSet.entries.map((entry) => [
      entry.pokemonId,
      entry,
    ]),
  );

  const entries: RankingEntry[] = top50Rankings.map(
    (ranking) => {
      const existingEntry = currentEntriesByPokemonId.get(
        ranking.pokemon_id,
      );

      if (existingEntry) {
        return {
          ...existingEntry,
          rank: ranking.rank,
          pokemonId: ranking.pokemon_id,
          assumedMoves: [...existingEntry.assumedMoves],
          roleIds: [...existingEntry.roleIds],
          tags: [...existingEntry.tags],
        };
      }

      const pokemon = pokemonMaster.find(
        (item) => item.id === ranking.pokemon_id,
      );

      return {
        id: createId("ranking-entry"),
        pokemonId: ranking.pokemon_id,
        rank: ranking.rank,
        assumedAbilityId:
          pokemon?.abilityIds[0] ?? undefined,
        assumedMoves: [],
        roleIds: [],
        tags: [],
        memo: "",
      };
    },
  );

  return {
    ...currentRankingSet,
    entries,
    updatedAt: new Date().toISOString(),
  };
}

function loadStoredRankingSet(): RankingSet {
  const fallback = cloneInitialRankingSet();

  try {
    const storedValue = localStorage.getItem(
      RANKING_STORAGE_KEY,
    );

    if (!storedValue) {
      return fallback;
    }

    return normalizeRankingSet(
      JSON.parse(storedValue) as RankingSet,
    );
  } catch {
    return fallback;
  }
}

function loadStoredMatchups(): Matchup[] {
  try {
    const storedValue = localStorage.getItem(
      MATCHUP_STORAGE_KEY,
    );

    return storedValue
      ? (JSON.parse(storedValue) as Matchup[])
      : [];
  } catch {
    return [];
  }
}

type PlannerProviderProps = {
  children: ReactNode;
};

export function PlannerProvider({
  children,
}: PlannerProviderProps) {
  const [teams, setTeams] = useState<Team[]>(loadStoredTeams);

  const [currentTeamId, setCurrentTeamIdState] = useState<
    string | undefined
  >(() => loadStoredCurrentTeamId(loadStoredTeams()));

  const [candidates, setCandidates] = useState<
    CandidatePokemon[]
  >(loadStoredCandidates);

  const [rankingSet, setRankingSet] = useState<RankingSet>(
    loadStoredRankingSet,
  );

  const [matchups, setMatchups] = useState<Matchup[]>(
    loadStoredMatchups,
  );

  const [cloudUserId, setCloudUserId] = useState<string | null>(
    null,
  );

  const [cloudSyncReady, setCloudSyncReady] = useState(false);

  async function refreshTop50Ranking(): Promise<void> {
  try {
    const top50Rankings = await loadTop50();

    if (top50Rankings.length === 0) {
      console.warn(
        "SupabaseにTOP50ランキングが登録されていません。",
      );
      return;
    }

    setRankingSet((current) =>
      mergeTop50Ranking(current, top50Rankings),
    );
  } catch (error) {
    console.error(
      "TOP50ランキングの読み込みに失敗しました。",
      error,
    );
  }
}

  const currentTeam = useMemo(
    () =>
      teams.find((team) => team.id === currentTeamId) ??
      teams[0],
    [teams, currentTeamId],
  );

  useEffect(() => {
  void refreshTop50Ranking();
}, []);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

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
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!cloudUserId) {
      setCloudSyncReady(false);
      return;
    }

    let isCancelled = false;
    setCloudSyncReady(false);

    void loadPlannerData(cloudUserId)
      .then((cloudData) => {
        if (isCancelled) {
          return;
        }

        if (cloudData) {
          const result = importPlannerData(
            JSON.stringify(cloudData),
          );

          if (!result.success) {
            console.error(
              "Supabaseのデータ形式が不正です。",
              result.message,
            );
          }
        }

        setCloudSyncReady(true);
void refreshTop50Ranking();
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "Supabaseからの読み込みに失敗しました。",
          error,
        );

        // 読み込みに失敗した場合は、誤ってローカルデータで
        // クラウドを上書きしないよう自動保存を開始しない。
        setCloudSyncReady(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [cloudUserId]);

  useEffect(() => {
    if (!cloudUserId || !cloudSyncReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const data: PlannerExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        teams,
        currentTeamId,
        candidates,
        rankingSet,
        matchups,
      };

      void savePlannerData(
        cloudUserId,
        JSON.stringify(data),
      ).catch((error: unknown) => {
        console.error(
          "Supabaseへの保存に失敗しました。",
          error,
        );
      });
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    cloudUserId,
    cloudSyncReady,
    teams,
    currentTeamId,
    candidates,
    rankingSet,
    matchups,
  ]);

  useEffect(() => {
    localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify(teams),
    );
  }, [teams]);

  useEffect(() => {
    if (currentTeamId) {
      localStorage.setItem(
        CURRENT_TEAM_ID_STORAGE_KEY,
        currentTeamId,
      );
    } else {
      localStorage.removeItem(
        CURRENT_TEAM_ID_STORAGE_KEY,
      );
    }
  }, [currentTeamId]);

  useEffect(() => {
    localStorage.setItem(
      CANDIDATE_STORAGE_KEY,
      JSON.stringify(candidates),
    );
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem(
      RANKING_STORAGE_KEY,
      JSON.stringify(rankingSet),
    );
  }, [rankingSet]);

  useEffect(() => {
    localStorage.setItem(
      MATCHUP_STORAGE_KEY,
      JSON.stringify(matchups),
    );
  }, [matchups]);

  useEffect(() => {
  const validRankingEntryIds = new Set(
    rankingSet.entries.map((entry) => entry.id),
  );

  setMatchups((current) => {
    const filtered = current.filter((matchup) =>
      validRankingEntryIds.has(matchup.rankingEntryId),
    );

    return filtered.length === current.length
      ? current
      : filtered;
  });
}, [rankingSet.entries]);

  useEffect(() => {
    if (teams.length === 0) {
      if (currentTeamId !== undefined) {
        setCurrentTeamIdState(undefined);
      }

      return;
    }

    if (
      !currentTeamId ||
      !teams.some((team) => team.id === currentTeamId)
    ) {
      setCurrentTeamIdState(teams[0].id);
    }
  }, [teams, currentTeamId]);

  function setCurrentTeam(teamId: string): ActionResult {
    const exists = teams.some((team) => team.id === teamId);

    if (!exists) {
      return {
        success: false,
        message: "指定された構築が見つかりません。",
      };
    }

    setCurrentTeamIdState(teamId);
    return { success: true };
  }

  function createTeam(input: CreateTeamInput): Team {
    const now = new Date().toISOString();

    const newTeam: Team = {
      id: createId("team"),
      name: input.name.trim() || "新しい構築",
      description: input.description?.trim(),
      status: input.status ?? "draft",
      pokemon: [],
      createdAt: now,
      updatedAt: now,
    };

    setTeams((current) => [newTeam, ...current]);
    setCurrentTeamIdState(newTeam.id);

    return newTeam;
  }

  function updateTeam(updatedTeam: Team): ActionResult {
    if (
      !teams.some((team) => team.id === updatedTeam.id)
    ) {
      return {
        success: false,
        message: "更新対象の構築が見つかりません。",
      };
    }

    setTeams((current) =>
      current.map((team) =>
        team.id === updatedTeam.id
          ? {
              ...normalizeTeam(updatedTeam),
              updatedAt: new Date().toISOString(),
            }
          : team,
      ),
    );

    return { success: true };
  }

  function deleteTeam(teamId: string): ActionResult {
    const target = teams.find((team) => team.id === teamId);

    if (!target) {
      return {
        success: false,
        message: "削除対象の構築が見つかりません。",
      };
    }

    if (teams.length <= 1) {
      return {
        success: false,
        message:
          "最後の1件は削除できません。先に新しい構築を作成してください。",
      };
    }

    const deletedPokemonIds = new Set(
      target.pokemon.map((pokemon) => pokemon.id),
    );

    const nextTeams = teams.filter(
      (team) => team.id !== teamId,
    );

    setTeams(nextTeams);

    setMatchups((current) =>
      current.filter(
        (matchup) =>
          !deletedPokemonIds.has(matchup.teamPokemonId),
      ),
    );

    if (currentTeamId === teamId) {
      setCurrentTeamIdState(nextTeams[0]?.id);
    }

    return { success: true };
  }

  function duplicateTeam(teamId: string): ActionResult {
    const source = teams.find((team) => team.id === teamId);

    if (!source) {
      return {
        success: false,
        message: "複製元の構築が見つかりません。",
      };
    }

    const now = new Date().toISOString();

    const duplicatedTeam: Team = {
      ...cloneTeam(source),
      id: createId("team"),
      name: `${source.name} コピー`,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      pokemon: source.pokemon.map((teamPokemon) => ({
        ...teamPokemon,
        id: createId("team-pokemon"),
        moves: [...teamPokemon.moves],
        roleIds: [...teamPokemon.roleIds],
        tags: [...teamPokemon.tags],
        effortValues: teamPokemon.effortValues
          ? { ...teamPokemon.effortValues }
          : undefined,
      })),
    };

    setTeams((current) => [
      duplicatedTeam,
      ...current,
    ]);

    setCurrentTeamIdState(duplicatedTeam.id);

    return { success: true };
  }

  function updateTeamPokemon(
    updatedTeamPokemon: TeamPokemon,
  ) {
    if (!currentTeam) {
      return;
    }

    setTeams((current) =>
      current.map((team) =>
        team.id === currentTeam.id
          ? {
              ...team,
              updatedAt: new Date().toISOString(),
              pokemon: team.pokemon.map((teamPokemon) =>
                teamPokemon.id === updatedTeamPokemon.id
                  ? {
                      ...updatedTeamPokemon,
                      moves: [
                        ...updatedTeamPokemon.moves,
                      ],
                      roleIds: [
                        ...updatedTeamPokemon.roleIds,
                      ],
                      tags: [
                        ...updatedTeamPokemon.tags,
                      ],
                      effortValues:
                        updatedTeamPokemon.effortValues
                          ? {
                              ...updatedTeamPokemon.effortValues,
                            }
                          : undefined,
                    }
                  : teamPokemon,
              ),
            }
          : team,
      ),
    );
  }

  function addCandidate(
    pokemonId: string,
  ): ActionResult {
    const pokemon = pokemonMaster.find(
      (item) => item.id === pokemonId,
    );

    if (!pokemon) {
      return {
        success: false,
        message: "ポケモンが見つかりません。",
      };
    }

    if (
      candidates.some(
        (candidate) =>
          candidate.pokemonId === pokemonId,
      )
    ) {
      return {
        success: false,
        message: "すでに候補へ追加されています。",
      };
    }

    const now = new Date().toISOString();

    const newCandidate: CandidatePokemon = {
      id: createId("candidate"),
      pokemonId,
      status: "considering",
      abilityId: pokemon.abilityIds[0] ?? undefined,
      roleIds: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    setCandidates((current) => [
      ...current,
      newCandidate,
    ]);

    return { success: true };
  }

  function updateCandidate(
    updatedCandidate: CandidatePokemon,
  ) {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === updatedCandidate.id
          ? {
              ...updatedCandidate,
              roleIds: [...updatedCandidate.roleIds],
              tags: [...updatedCandidate.tags],
              updatedAt: new Date().toISOString(),
            }
          : candidate,
      ),
    );
  }

  function removeCandidate(candidateId: string) {
    setCandidates((current) =>
      current.filter(
        (candidate) => candidate.id !== candidateId,
      ),
    );
  }

  function addCandidateToTeam(
    candidateId: string,
  ): ActionResult {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    );

    if (!candidate) {
      return {
        success: false,
        message: "候補が見つかりません。",
      };
    }

    if (!currentTeam) {
      return {
        success: false,
        message: "追加先の構築がありません。",
      };
    }

    if (currentTeam.pokemon.length >= 6) {
      return {
        success: false,
        message:
          "構築には6匹までしか追加できません。",
      };
    }

    if (
      currentTeam.pokemon.some(
        (teamPokemon) =>
          teamPokemon.pokemonId === candidate.pokemonId,
      )
    ) {
      return {
        success: false,
        message: "すでに構築へ入っています。",
      };
    }

    const newTeamPokemon: TeamPokemon = {
      id: createId("team-pokemon"),
      pokemonId: candidate.pokemonId,
      abilityId: candidate.abilityId,
      moves: [],
      roleIds: [...candidate.roleIds],
      tags: [...candidate.tags],
      memo: candidate.memo,
    };

    setTeams((current) =>
      current.map((team) =>
        team.id === currentTeam.id
          ? {
              ...team,
              updatedAt: new Date().toISOString(),
              pokemon: [
                ...team.pokemon,
                newTeamPokemon,
              ],
            }
          : team,
      ),
    );

    return { success: true };
  }

  function addPokemonToTeam(
  pokemonId: string,
): ActionResult {
  const pokemon = pokemonMaster.find(
    (item) => item.id === pokemonId,
  );

  if (!pokemon) {
    return {
      success: false,
      message: "ポケモンが見つかりません。",
    };
  }

  if (!currentTeam) {
    return {
      success: false,
      message: "追加先の構築がありません。",
    };
  }

  if (currentTeam.pokemon.length >= 6) {
    return {
      success: false,
      message: "構築には6匹までしか追加できません。",
    };
  }

  if (
    currentTeam.pokemon.some(
      (teamPokemon) =>
        teamPokemon.pokemonId === pokemonId,
    )
  ) {
    return {
      success: false,
      message: "すでに構築へ入っています。",
    };
  }

  const newTeamPokemon: TeamPokemon = {
    id: createId("team-pokemon"),
    pokemonId,
    abilityId: pokemon.abilityIds[0],
    moves: [],
    roleIds: [],
    tags: [],
    memo: "",
  };

  setTeams((current) =>
    current.map((team) =>
      team.id === currentTeam.id
        ? {
            ...team,
            updatedAt: new Date().toISOString(),
            pokemon: [
              ...team.pokemon,
              newTeamPokemon,
            ],
          }
        : team,
    ),
  );

  return { success: true };
}

  function removePokemonFromTeam(pokemonId: string) {
    if (!currentTeam) {
      return;
    }

    const removedPokemon = currentTeam.pokemon.find(
      (teamPokemon) =>
        teamPokemon.pokemonId === pokemonId,
    );

    setTeams((current) =>
      current.map((team) =>
        team.id === currentTeam.id
          ? {
              ...team,
              updatedAt: new Date().toISOString(),
              pokemon: team.pokemon.filter(
                (teamPokemon) =>
                  teamPokemon.pokemonId !== pokemonId,
              ),
            }
          : team,
      ),
    );

    if (removedPokemon) {
      setMatchups((current) =>
        current.filter(
          (matchup) =>
            matchup.teamPokemonId !== removedPokemon.id,
        ),
      );
    }
  }

  function isPokemonInTeam(
    pokemonId: string,
  ): boolean {
    return (
      currentTeam?.pokemon.some(
        (teamPokemon) =>
          teamPokemon.pokemonId === pokemonId,
      ) ?? false
    );
  }

  function addRankingEntry(
    pokemonId: string,
  ): ActionResult {
    const pokemon = pokemonMaster.find(
      (item) => item.id === pokemonId,
    );

    if (!pokemon) {
      return {
        success: false,
        message: "ポケモンが見つかりません。",
      };
    }

    if (
      rankingSet.entries.some(
        (entry) => entry.pokemonId === pokemonId,
      )
    ) {
      return {
        success: false,
        message:
          "すでに仮想敵へ登録されています。",
      };
    }

    if (rankingSet.entries.length >= 50) {
      return {
        success: false,
        message:
          "仮想敵は50匹まで登録できます。",
      };
    }

    const nextRank =
      rankingSet.entries.length > 0
        ? Math.max(
            ...rankingSet.entries.map(
              (entry) => entry.rank,
            ),
          ) + 1
        : 1;

    const newEntry: RankingEntry = {
      id: createId("ranking-entry"),
      pokemonId,
      rank: nextRank,
      assumedAbilityId:
        pokemon.abilityIds[0] ?? undefined,
      assumedMoves: [],
      roleIds: [],
      tags: [],
    };

    setRankingSet((current) => ({
      ...current,
      entries: [...current.entries, newEntry],
      updatedAt: new Date().toISOString(),
    }));

    return { success: true };
  }

  function updateRankingEntry(
    updatedEntry: RankingEntry,
  ) {
    setRankingSet((current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.id === updatedEntry.id
          ? {
              ...updatedEntry,
              assumedMoves: [
                ...updatedEntry.assumedMoves,
              ],
              roleIds: [...updatedEntry.roleIds],
              tags: [...updatedEntry.tags],
            }
          : entry,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }

  function removeRankingEntry(entryId: string) {
    setRankingSet((current) => ({
      ...current,
      entries: current.entries
        .filter((entry) => entry.id !== entryId)
        .sort((a, b) => a.rank - b.rank)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        })),
      updatedAt: new Date().toISOString(),
    }));

    setMatchups((current) =>
      current.filter(
        (matchup) =>
          matchup.rankingEntryId !== entryId,
      ),
    );
  }

  function setMatchupRating(
    teamPokemonId: string,
    rankingEntryId: string,
    rating: MatchupRating,
  ) {
    setMatchups((current) => {
      const existing = current.find(
        (matchup) =>
          matchup.teamPokemonId === teamPokemonId &&
          matchup.rankingEntryId === rankingEntryId,
      );

      if (existing) {
        return current.map((matchup) =>
          matchup.id === existing.id
            ? { ...matchup, rating }
            : matchup,
        );
      }

      return [
        ...current,
        {
          id: createId("matchup"),
          teamPokemonId,
          rankingEntryId,
          rating,
        },
      ];
    });
  }

  function updateMatchupMemo(
    teamPokemonId: string,
    rankingEntryId: string,
    memo: string,
  ) {
    setMatchups((current) => {
      const existing = current.find(
        (matchup) =>
          matchup.teamPokemonId === teamPokemonId &&
          matchup.rankingEntryId === rankingEntryId,
      );

      if (existing) {
        return current.map((matchup) =>
          matchup.id === existing.id
            ? { ...matchup, memo }
            : matchup,
        );
      }

      return [
        ...current,
        {
          id: createId("matchup"),
          teamPokemonId,
          rankingEntryId,
          rating: "unrated",
          memo,
        },
      ];
    });
  }

  function exportPlannerData(): string {
    const data: PlannerExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      teams,
      currentTeamId,
      candidates,
      rankingSet,
      matchups,
    };

    return JSON.stringify(data, null, 2);
  }

  function importPlannerData(
    json: string,
  ): ActionResult {
    try {
      const parsed = JSON.parse(
        json,
      ) as Partial<PlannerExportData>;

      if (
        !Array.isArray(parsed.teams) ||
        parsed.teams.length === 0
      ) {
        return {
          success: false,
          message:
            "構築データが含まれていません。",
        };
      }

      if (!Array.isArray(parsed.candidates)) {
        return {
          success: false,
          message:
            "候補ポケモンデータの形式が不正です。",
        };
      }

      if (
        !parsed.rankingSet ||
        !Array.isArray(parsed.rankingSet.entries)
      ) {
        return {
          success: false,
          message:
            "ランキングデータの形式が不正です。",
        };
      }

      if (!Array.isArray(parsed.matchups)) {
        return {
          success: false,
          message:
            "相性表データの形式が不正です。",
        };
      }

      const importedTeams =
        parsed.teams.map(normalizeTeam);

      const importedCurrentTeamId =
        parsed.currentTeamId &&
        importedTeams.some(
          (team) =>
            team.id === parsed.currentTeamId,
        )
          ? parsed.currentTeamId
          : importedTeams[0].id;

      setTeams(importedTeams);
      setCurrentTeamIdState(importedCurrentTeamId);

      setCandidates(
  parsed.candidates
    .filter(
      (candidate) =>
        candidate.pokemonId !== "wash-rotom",
    )
    .map((candidate) => ({
      ...candidate,
      roleIds: candidate.roleIds ?? [],
      tags: candidate.tags ?? [],
    })),
);

      setRankingSet(
        normalizeRankingSet(parsed.rankingSet),
      );

      setMatchups(parsed.matchups);

      return { success: true };
    } catch {
      return {
        success: false,
        message:
          "JSONの読み込みに失敗しました。",
      };
    }
  }

  function resetPlannerData() {
    const resetTeams = cloneInitialTeams();

    setTeams(resetTeams);
    setCurrentTeamIdState(resetTeams[0]?.id);
    setCandidates(cloneInitialCandidates());
    setRankingSet(cloneInitialRankingSet());
    setMatchups([]);

    localStorage.removeItem(
      LEGACY_TEAM_STORAGE_KEY,
    );
  }

  const value = useMemo<PlannerContextValue>(
    () => ({
      teams,
      currentTeamId,
      currentTeam,

      candidates,
      rankingSet,
      matchups,

      setCurrentTeam,
      createTeam,
      updateTeam,
      deleteTeam,
      duplicateTeam,

      updateTeamPokemon,
      addCandidate,
      updateCandidate,
      removeCandidate,
      addCandidateToTeam,
      addPokemonToTeam,
      removePokemonFromTeam,
      isPokemonInTeam,

      addRankingEntry,
      updateRankingEntry,
      removeRankingEntry,

      setMatchupRating,
      updateMatchupMemo,

      exportPlannerData,
      importPlannerData,
      resetPlannerData,
    }),
    [
      teams,
      currentTeamId,
      currentTeam,
      candidates,
      rankingSet,
      matchups,
    ],
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