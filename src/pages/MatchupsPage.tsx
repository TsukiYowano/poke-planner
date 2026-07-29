import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Edit3, MessageSquare, Search, X } from "lucide-react";
import { usePlanner } from "../context/PlannerContext";
import { pokemonMasterMap } from "../data/pokemon";
import PokemonIcon from "../components/common/PokemonIcon";
import { useSynchronizedHorizontalScroll } from "../hooks/useSynchronizedHorizontalScroll";
import type {
  CandidatePokemon,
  Matchup,
  MatchupRating,
  RankingEntry,
} from "../types/pokemon";
import {
  createMatchupMap,
  filterMatchupCandidates,
  filterRankingEntries,
  getNextMatchupRating,
  getCandidateDisplayName,
  getGoodOrBetterCount,
  loadSelectedCandidateIds,
  MAX_SELECTED_MATCHUP_CANDIDATES,
  matchupKey,
  matchupRatings,
  matchupUiText,
  normalizeSelectedCandidateIds,
  saveSelectedCandidateIds,
  summarizeCandidateMatchups,
  summarizeTeamRankingMatchup,
  toggleSelectedCandidateId,
  type CandidateMatchupSummary,
  type MatchupMode,
} from "../utils/matchupTable";

const ratingConfig: Record<
  MatchupRating,
  { label: string; name: string; className: string }
> = {
  unrated: {
    label: "－",
    name: "未評価",
    className: "border-slate-200 bg-white text-slate-400",
  },
  "very-good": {
    label: "◎",
    name: "とても有利",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  good: {
    label: "○",
    name: "有利",
    className: "border-green-300 bg-green-50 text-green-700",
  },
  even: {
    label: "△",
    name: "互角",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  bad: {
    label: "×",
    name: "不利",
    className: "border-red-300 bg-red-50 text-red-700",
  },
  "very-bad": {
    label: "××",
    name: "とても不利",
    className: "border-rose-400 bg-rose-100 text-rose-800",
  },
};

function getPokemonName(pokemonId: string): string | undefined {
  return pokemonMasterMap[pokemonId]?.name;
}

function getCandidateName(candidate: CandidatePokemon): string {
  return getCandidateDisplayName(candidate, getPokemonName);
}

function MatchupsPage() {
  const { plannerData, setMatchupRating, updateMatchupMemo } = usePlanner();
  const { candidates, rankingSet, matchups } = plannerData;
  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );
  const [mode, setMode] = useState<MatchupMode>("team");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [rankingQuery, setRankingQuery] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    () =>
      typeof window === "undefined"
        ? []
        : loadSelectedCandidateIds(window.localStorage),
  );
  const [editing, setEditing] = useState<{
    candidate: CandidatePokemon;
    entry: RankingEntry;
  } | null>(null);

  const teamCandidates = useMemo(
    () =>
      filterMatchupCandidates(
        "team",
        candidates,
        currentTeam,
        candidateQuery,
        getPokemonName,
      ),
    [candidateQuery, candidates, currentTeam],
  );
  const allTeamCandidates = useMemo(
    () =>
      filterMatchupCandidates(
        "team",
        candidates,
        currentTeam,
        "",
        getPokemonName,
      ),
    [candidates, currentTeam],
  );
  const candidateOptions = useMemo(
    () =>
      filterMatchupCandidates(
        "candidate",
        candidates,
        currentTeam,
        candidateQuery,
        getPokemonName,
      ),
    [candidateQuery, candidates, currentTeam],
  );
  const allVisibleCandidates = useMemo(
    () =>
      filterMatchupCandidates(
        "candidate",
        candidates,
        currentTeam,
        "",
        getPokemonName,
      ),
    [candidates, currentTeam],
  );
  const normalizedSelectedCandidateIds = useMemo(
    () =>
      normalizeSelectedCandidateIds(
        selectedCandidateIds,
        allVisibleCandidates,
      ),
    [allVisibleCandidates, selectedCandidateIds],
  );
  const visibleCandidates = useMemo(
    () =>
      mode === "team"
        ? teamCandidates
        : allVisibleCandidates.filter((candidate) =>
            normalizedSelectedCandidateIds.includes(candidate.id),
          ),
    [
      allVisibleCandidates,
      mode,
      normalizedSelectedCandidateIds,
      teamCandidates,
    ],
  );

  useEffect(() => {
    const isSame =
      normalizedSelectedCandidateIds.length === selectedCandidateIds.length &&
      normalizedSelectedCandidateIds.every(
        (id, index) => id === selectedCandidateIds[index],
      );
    if (!isSame) setSelectedCandidateIds(normalizedSelectedCandidateIds);
    saveSelectedCandidateIds(
      window.localStorage,
      normalizedSelectedCandidateIds,
    );
  }, [normalizedSelectedCandidateIds, selectedCandidateIds]);
  const entries = useMemo(
    () =>
      filterRankingEntries(
        rankingSet.entries,
        rankingQuery,
        getPokemonName,
      ),
    [rankingQuery, rankingSet.entries],
  );
  const matchupMap = useMemo(() => createMatchupMap(matchups), [matchups]);
  const summaries = useMemo(
    () =>
      summarizeCandidateMatchups(
        visibleCandidates,
        rankingSet.entries,
        matchups,
      ),
    [matchups, rankingSet.entries, visibleCandidates],
  );
  const summaryMap = useMemo(
    () => new Map(summaries.map((summary) => [summary.candidateId, summary])),
    [summaries],
  );

  function getMatchup(candidateId: string, entryId: string) {
    return matchupMap.get(matchupKey(candidateId, entryId));
  }

  function cycleRating(candidateId: string, entryId: string) {
    const rating = getMatchup(candidateId, entryId)?.rating ?? "unrated";
    setMatchupRating(candidateId, entryId, getNextMatchupRating(rating));
  }

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-blue-600">
          候補ポケモン相性
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          候補ポケモン相性表
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          仮想敵ごとの評価とメモを候補単位で共有・比較します。
        </p>
      </header>

      <MatchupFilters
        mode={mode}
        candidateQuery={candidateQuery}
        rankingQuery={rankingQuery}
        onModeChange={setMode}
        onCandidateQueryChange={setCandidateQuery}
        onRankingQueryChange={setRankingQuery}
      />

      {mode === "candidate" && allVisibleCandidates.length > 0 && (
        <CandidateComparisonSelector
          candidates={candidateOptions}
          selectedIds={normalizedSelectedCandidateIds}
          onToggle={(candidateId) =>
            setSelectedCandidateIds((current) =>
              toggleSelectedCandidateId(
                normalizeSelectedCandidateIds(current, allVisibleCandidates),
                candidateId,
              ),
            )
          }
        />
      )}

      {mode === "team" && visibleCandidates.length > 0 && (
        <MatchupSummary
          candidates={visibleCandidates}
          summaries={summaryMap}
        />
      )}

      {visibleCandidates.length === 0 ? (
        <EmptyState
          message={
            candidateQuery
              ? matchupUiText.noCandidateSearchResults
              : mode === "team"
                ? matchupUiText.noTeamCandidates
                : matchupUiText.noVisibleCandidates
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState message="検索条件に一致する仮想敵がありません。" />
      ) : (
        <CandidateMatchupTable
          candidates={visibleCandidates}
          entries={entries}
          summaryMap={summaryMap}
          matchupMap={matchupMap}
          teamAggregateCandidates={
            mode === "team" ? allTeamCandidates : undefined
          }
          onCycleRating={cycleRating}
          onEditMemo={(candidate, entry) => setEditing({ candidate, entry })}
        />
      )}

      {editing && (
        <MatchupEditor
          candidate={editing.candidate}
          entry={editing.entry}
          memo={getMatchup(editing.candidate.id, editing.entry.id)?.memo ?? ""}
          onSave={(memo) => {
            updateMatchupMemo(editing.candidate.id, editing.entry.id, memo);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function MatchupFilters({
  mode,
  candidateQuery,
  rankingQuery,
  onModeChange,
  onCandidateQueryChange,
  onRankingQueryChange,
}: {
  mode: MatchupMode;
  candidateQuery: string;
  rankingQuery: string;
  onModeChange: (mode: MatchupMode) => void;
  onCandidateQueryChange: (query: string) => void;
  onRankingQueryChange: (query: string) => void;
}) {
  return (
    <section className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {([
          ["team", "現在の構築"],
          ["candidate", matchupUiText.candidateList],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold",
              mode === value
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SearchInput
          value={candidateQuery}
          onChange={onCandidateQueryChange}
          placeholder={matchupUiText.candidateSearch}
        />
        <SearchInput
          value={rankingQuery}
          onChange={onRankingQueryChange}
          placeholder="仮想敵名を検索"
        />
      </div>
    </section>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm"
      />
    </label>
  );
}

function CandidateComparisonSelector({
  candidates,
  selectedIds,
  onToggle,
}: {
  candidates: CandidatePokemon[];
  selectedIds: string[];
  onToggle: (candidateId: string) => void;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">比較する候補</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            1〜{MAX_SELECTED_MATCHUP_CANDIDATES}件を選択できます
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          選択中 {selectedIds.length}/{MAX_SELECTED_MATCHUP_CANDIDATES}
        </span>
      </div>
      {candidates.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          検索条件に一致する候補がありません。
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => {
            const selected = selectedIds.includes(candidate.id);
            const disabled =
              !selected &&
              selectedIds.length >= MAX_SELECTED_MATCHUP_CANDIDATES;
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => onToggle(candidate.id)}
                disabled={disabled}
                aria-pressed={selected}
                className={[
                  "flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                    : "border-slate-200 bg-white",
                  disabled ? "cursor-not-allowed opacity-45" : "hover:border-blue-300",
                ].join(" ")}
              >
                <PokemonIcon
                  pokemonId={candidate.pokemonId}
                  pokemonName={getCandidateName(candidate)}
                  size={36}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800">
                    {getCandidateName(candidate)}
                  </span>
                  <span className="block truncate text-xs text-blue-600">
                    {candidate.label || candidate.pokemonId}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold",
                    selected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 text-transparent",
                  ].join(" ")}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CandidateMatchupTable({
  candidates,
  entries,
  summaryMap,
  matchupMap,
  teamAggregateCandidates,
  onCycleRating,
  onEditMemo,
}: {
  candidates: CandidatePokemon[];
  entries: RankingEntry[];
  summaryMap: Map<string, CandidateMatchupSummary>;
  matchupMap: Map<string, Matchup>;
  teamAggregateCandidates?: CandidatePokemon[];
  onCycleRating: (candidateId: string, entryId: string) => void;
  onEditMemo: (candidate: CandidatePokemon, entry: RankingEntry) => void;
}) {
  const {
    topScrollRef,
    tableScrollRef,
    topSpacerRef,
    onTopScroll,
    onTableScroll,
  } = useSynchronizedHorizontalScroll();
  const hasTeamAggregate = teamAggregateCandidates !== undefined;
  const mobileMinimumTableWidth = 176 + candidates.length * 144;
  const desktopMinimumTableWidth =
    208 + candidates.length * 144 + (hasTeamAggregate ? 128 : 0);
  const tableStyle = {
    "--matchup-table-mobile-min-width": `${mobileMinimumTableWidth}px`,
    "--matchup-table-desktop-min-width": `${desktopMinimumTableWidth}px`,
  } as CSSProperties;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        ref={topScrollRef}
        onScroll={onTopScroll}
        aria-label="相性表の上部横スクロール"
        className="hidden overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50 md:block"
      >
        <div ref={topSpacerRef} className="h-3" />
      </div>
      <div
        ref={tableScrollRef}
        onScroll={onTableScroll}
        className="matchup-table-scroll max-h-[70vh] overflow-auto overscroll-contain"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <table
          className="matchup-table table-fixed border-collapse text-sm"
          data-desktop-overflow={candidates.length > 6 ? "true" : "false"}
          style={tableStyle}
        >
          <colgroup>
            <col className="w-44 md:w-52" />
            {candidates.map((candidate) => (
              <col
                key={candidate.id}
                className="matchup-candidate-column w-36"
              />
            ))}
            {hasTeamAggregate && <col className="hidden w-32 md:table-column" />}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 top-0 z-40 min-w-44 bg-slate-50 px-3 py-3 text-left shadow-[1px_1px_0_0_rgb(226_232_240)] md:min-w-52 md:px-4">
                順位・仮想敵
              </th>
              {candidates.map((candidate) => (
                <CandidateHeader
                  key={candidate.id}
                  candidate={candidate}
                  summary={summaryMap.get(candidate.id)}
                />
              ))}
              {hasTeamAggregate && (
                <th className="sticky top-0 z-30 hidden bg-slate-50 px-2 py-3 text-center shadow-[0_1px_0_0_rgb(226_232_240)] md:table-cell">
                  構築集計
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100">
                <RankingHeader
                  entry={entry}
                  teamSummary={
                    teamAggregateCandidates
                      ? summarizeTeamRankingMatchup(
                          teamAggregateCandidates,
                          entry.id,
                          matchupMap,
                        )
                      : undefined
                  }
                />
                {candidates.map((candidate) => (
                  <MatchupCell
                    key={candidate.id}
                    matchup={matchupMap.get(matchupKey(candidate.id, entry.id))}
                    onChangeRating={() =>
                      onCycleRating(candidate.id, entry.id)
                    }
                    onEditMemo={() => onEditMemo(candidate, entry)}
                  />
                ))}
                {teamAggregateCandidates && (
                  <TeamAggregateCell
                    summary={summarizeTeamRankingMatchup(
                      teamAggregateCandidates,
                      entry.id,
                      matchupMap,
                    )}
                  />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CandidateHeader({
  candidate,
  summary,
}: {
  candidate: CandidatePokemon;
  summary?: CandidateMatchupSummary;
}) {
  return (
    <th className="sticky top-0 z-30 bg-slate-50 px-2 py-3 text-center shadow-[0_1px_0_0_rgb(226_232_240)]">
      <PokemonIcon
        pokemonId={candidate.pokemonId}
        pokemonName={getCandidateName(candidate)}
        size={40}
      />
      <span className="mt-1 block truncate whitespace-nowrap font-bold text-slate-800">
        {getCandidateName(candidate)}
      </span>
      <span
        className="block truncate text-xs text-blue-600"
        title={candidate.label || candidate.pokemonId}
      >
        {candidate.label || candidate.pokemonId}
      </span>
      <span className="mt-1 block text-[11px] font-normal text-slate-400">
        評価済 {summary?.ratedCount ?? 0} / 未評価 {summary?.unratedCount ?? 0}
      </span>
    </th>
  );
}

function RankingHeader({
  entry,
  teamSummary,
}: {
  entry: RankingEntry;
  teamSummary?: ReturnType<typeof summarizeTeamRankingMatchup>;
}) {
  const pokemon = pokemonMasterMap[entry.pokemonId];
  return (
    <th className="sticky left-0 z-20 bg-white px-3 py-3 text-left shadow-[1px_0_0_0_rgb(241_245_249)] md:px-4">
      <div className="flex items-center gap-3">
        <span className="w-7 text-slate-400">{entry.rank}</span>
        <PokemonIcon
          pokemonId={entry.pokemonId}
          pokemonName={pokemon?.name}
          size={36}
        />
        <span
          className="truncate whitespace-nowrap font-semibold text-slate-800"
          title={pokemon?.name ?? entry.pokemonId}
        >
          {pokemon?.name ?? entry.pokemonId}
        </span>
      </div>
      {teamSummary && (
        <div className="mt-2 flex items-center gap-2 whitespace-nowrap pl-10 text-[10px] font-normal text-slate-500 md:hidden">
          <span className="font-bold text-slate-700">
            ○以上 {teamSummary.goodOrBetterCount}匹
          </span>
          <span>最良 {ratingConfig[teamSummary.bestRating].label}</span>
        </div>
      )}
    </th>
  );
}

function TeamAggregateCell({
  summary,
}: {
  summary: ReturnType<typeof summarizeTeamRankingMatchup>;
}) {
  return (
    <td className="hidden bg-slate-50/70 px-2 py-3 text-center md:table-cell">
      <p className="text-lg font-bold text-slate-800">
        {summary.goodOrBetterCount}
      </p>
      <p className="whitespace-nowrap text-[11px] text-slate-500">
        ○以上 / {summary.candidateCount}匹
      </p>
      <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-blue-700">
        最良 {ratingConfig[summary.bestRating].label}
      </p>
    </td>
  );
}

function MatchupCell({
  matchup,
  onChangeRating,
  onEditMemo,
}: {
  matchup?: Matchup;
  onChangeRating: () => void;
  onEditMemo: () => void;
}) {
  const rating = matchup?.rating ?? "unrated";
  const config = ratingConfig[rating];
  return (
    <td className="px-2 py-3 text-center">
      <button
        type="button"
        onClick={onChangeRating}
        title={`${config.name}（クリックで変更）`}
        aria-label={`相性評価: ${config.name}`}
        className={`inline-flex h-10 min-w-12 items-center justify-center rounded-lg border px-3 font-bold ${config.className}`}
      >
        {config.label}
      </button>
      <button
        type="button"
        onClick={onEditMemo}
        className={[
          "mt-1 flex w-full items-center justify-center gap-1 text-[11px]",
          matchup?.memo ? "font-semibold text-blue-700" : "text-slate-400",
        ].join(" ")}
      >
        {matchup?.memo ? <MessageSquare size={12} /> : <Edit3 size={11} />}
        {matchup?.memo ? "メモあり" : "メモ"}
      </button>
    </td>
  );
}

function MatchupSummary({
  candidates,
  summaries,
}: {
  candidates: CandidatePokemon[];
  summaries: Map<string, CandidateMatchupSummary>;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-sm font-bold text-slate-700">
        {matchupUiText.candidateSummary}
      </h2>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
        {candidates.map((candidate) => {
          const summary = summaries.get(candidate.id);
          return (
            <article
              key={candidate.id}
              className="min-w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="truncate font-bold text-slate-900">
                {getCandidateName(candidate)}
              </p>
              <p className="truncate text-xs text-blue-600">
                {candidate.label || candidate.pokemonId}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="font-semibold text-slate-700">
                  評価済 {summary?.ratedCount ?? 0}
                </span>
                <span className="text-slate-400">
                  未評価 {summary?.unratedCount ?? 0}
                </span>
                <span className="font-bold text-green-700">
                  ○以上が {summary ? getGoodOrBetterCount(summary) : 0}匹
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {matchupRatings
                  .filter((rating) => rating !== "unrated")
                  .map((rating) => (
                    <span
                      key={rating}
                      title={ratingConfig[rating].name}
                      className={`rounded border px-1.5 py-0.5 text-[11px] ${ratingConfig[rating].className}`}
                    >
                      {ratingConfig[rating].label} {summary?.counts[rating] ?? 0}
                    </span>
                  ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MatchupEditor({
  candidate,
  entry,
  memo,
  onSave,
  onClose,
}: {
  candidate: CandidatePokemon;
  entry: RankingEntry;
  memo: string;
  onSave: (memo: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(memo);
  const enemyName = getPokemonName(entry.pokemonId) ?? entry.pokemonId;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">相性メモ</h2>
            <p className="mt-1 text-xs text-slate-500">
              {getCandidateName(candidate)} / {candidate.label} → {enemyName}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={6}
            autoFocus
            className="w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => onSave(value.trim())}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
      {message}
    </div>
  );
}

export default MatchupsPage;
