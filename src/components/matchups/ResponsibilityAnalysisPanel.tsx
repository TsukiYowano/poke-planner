import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import PokemonIcon from "../common/PokemonIcon";
import MatchupRatingBadge from "./MatchupRatingBadge";
import { pokemonMasterMap } from "../../data/pokemon";
import type {
  CandidatePokemon,
  Matchup,
  RankingEntry,
  Team,
} from "../../types/pokemon";
import { getCandidateDisplayName } from "../../utils/matchupTable";
import { formatCandidateDisplayName } from "../../utils/responsibilityDisplay";
import {
  analyzeTeamResponsibilities,
  selectDangerousRankingEntries,
  type RankingResponsibility,
  type ResponsibilityEntry,
  type TeamPokemonResponsibility,
} from "../../utils/responsibilityAnalysis";

type ResponsibilityAnalysisPanelProps = {
  team: Team | undefined;
  candidates: CandidatePokemon[];
  rankingEntries: RankingEntry[];
  matchups: Matchup[];
};

function getPokemonName(pokemonId: string): string | undefined {
  return pokemonMasterMap[pokemonId]?.name;
}

function ResponsibilityAnalysisPanel({
  team,
  candidates,
  rankingEntries,
  matchups,
}: ResponsibilityAnalysisPanelProps) {
  const candidateMap = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.id, candidate])),
    [candidates],
  );
  const analysis = useMemo(
    () =>
      analyzeTeamResponsibilities(
        team,
        candidates,
        rankingEntries,
        matchups,
      ),
    [candidates, matchups, rankingEntries, team],
  );
  const dangerousEntries = useMemo(
    () => selectDangerousRankingEntries(analysis),
    [analysis],
  );

  if (!team || team.pokemon.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        責任度を分析する構築ポケモンがありません。
      </div>
    );
  }

  return (
    <section className="mt-5" aria-labelledby="responsibility-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2
            id="responsibility-heading"
            className="font-bold text-slate-900"
          >
            責任度分析
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            ○以上の評価をもとに、各ポケモンの担当を表示します。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
            対応なし：{analysis.uncoveredEntries.length}体
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            未評価：{analysis.unratedEntries.length}体
          </div>
        </div>
      </div>

      <DangerPokemonSection
        uncovered={dangerousEntries.uncovered}
        singleCoverage={dangerousEntries.singleCoverage}
        candidateMap={candidateMap}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analysis.pokemon.map((responsibility) => (
          <ResponsibilityCard
            key={responsibility.teamPokemonId}
            responsibility={responsibility}
            candidate={candidateMap.get(responsibility.candidatePokemonId)}
          />
        ))}
      </div>
    </section>
  );
}

function DangerPokemonSection({
  uncovered,
  singleCoverage,
  candidateMap,
}: {
  uncovered: RankingResponsibility[];
  singleCoverage: RankingResponsibility[];
  candidateMap: Map<string, CandidatePokemon>;
}) {
  const hasUncovered = uncovered.length > 0;
  const hasSingleCoverage = singleCoverage.length > 0;
  const hasBothGroups = hasUncovered && hasSingleCoverage;

  return (
    <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">要注意仮想敵</h2>
          <p className="mt-1 text-xs text-slate-500">
            構築全体で対応がない、または○以上が1匹だけの仮想敵です。
          </p>
        </div>
        {(!hasUncovered || !hasSingleCoverage) && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {!hasUncovered && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                対応なし：該当なし
              </span>
            )}
            {!hasSingleCoverage && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                ○以上1匹：該当なし
              </span>
            )}
          </div>
        )}
      </div>
      <div
        className={[
          "mt-4 grid gap-4",
          hasBothGroups ? "lg:grid-cols-2" : "grid-cols-1",
        ].join(" ")}
      >
        {hasUncovered && (
          <DangerPokemonGroup
            title="対応なし"
            entries={uncovered}
            candidateMap={candidateMap}
          />
        )}
        {hasSingleCoverage && (
          <DangerPokemonGroup
            title="○以上1匹"
            entries={singleCoverage}
            candidateMap={candidateMap}
            showAssignment
          />
        )}
      </div>
    </section>
  );
}

function DangerPokemonGroup({
  title,
  entries,
  candidateMap,
  showAssignment = false,
}: {
  title: string;
  entries: RankingResponsibility[];
  candidateMap: Map<string, CandidatePokemon>;
  showAssignment?: boolean;
}) {
  const initialDisplayCount = 8;
  const [showAll, setShowAll] = useState(false);
  const remainingCount = Math.max(entries.length - initialDisplayCount, 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800">
        {title}（{entries.length}）
      </h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">該当なし</p>
      ) : (
        <div className="mt-3 space-y-2">
          {entries.map((responsibility, index) => (
            <div
              key={responsibility.entry.id}
              hidden={!showAll && index >= initialDisplayCount}
            >
              <DangerPokemonItem
                responsibility={responsibility}
                candidateMap={candidateMap}
                showAssignment={showAssignment}
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
            >
              {showAll ? "折りたたむ" : `残り${remainingCount}件を表示`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function DangerPokemonItem({
  responsibility,
  candidateMap,
  showAssignment,
}: {
  responsibility: RankingResponsibility;
  candidateMap: Map<string, CandidatePokemon>;
  showAssignment: boolean;
}) {
  const assignment = responsibility.assignments[0];
  const assignedCandidate = assignment
    ? candidateMap.get(assignment.candidatePokemonId)
    : undefined;
  const assignedName = assignedCandidate
    ? getCandidateDisplayName(assignedCandidate, getPokemonName)
    : assignment?.candidatePokemonId;
  const assignedDisplayName = assignedName
    ? formatCandidateDisplayName(assignedName, assignedCandidate?.label)
    : undefined;

  return (
    <details className="group rounded-lg border border-slate-200 bg-white">
      <summary className="cursor-pointer list-none p-2.5 marker:content-none">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="w-7 shrink-0 text-right text-xs font-semibold text-slate-400">
            {responsibility.entry.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-bold text-slate-800"
              title={getPokemonName(responsibility.entry.pokemonId)}
            >
              {getPokemonName(responsibility.entry.pokemonId) ??
                responsibility.entry.pokemonId}
            </p>
            {showAssignment && assignment && (
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                <span className="shrink-0">担当：</span>
                <span className="truncate" title={assignedDisplayName}>
                  {assignedDisplayName}
                </span>
                <MatchupRatingBadge rating={assignment.rating} />
              </p>
            )}
          </div>
          <ChevronDown
            size={16}
            className="mt-0.5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          />
        </div>
      </summary>
      <div className="border-t border-slate-100 bg-slate-50/60 p-3">
        <p className="mb-2 text-xs font-bold text-slate-600">構築内の評価</p>
        <ul className="space-y-2">
          {responsibility.teamRatings.map((teamRating) => {
            const candidate = candidateMap.get(
              teamRating.candidatePokemonId,
            );
            const name = candidate
              ? getCandidateDisplayName(candidate, getPokemonName)
              : teamRating.candidatePokemonId;
            return (
              <li
                key={teamRating.teamPokemonId}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {name}
                  </p>
                  {candidate?.label && (
                    <p className="truncate text-[11px] text-blue-600">
                      {candidate.label}
                    </p>
                  )}
                </div>
                <MatchupRatingBadge rating={teamRating.rating} />
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

function ResponsibilityCard({
  responsibility,
  candidate,
}: {
  responsibility: TeamPokemonResponsibility;
  candidate: CandidatePokemon | undefined;
}) {
  const pokemonId = candidate?.pokemonId ?? responsibility.candidatePokemonId;
  const pokemonName = candidate
    ? getCandidateDisplayName(candidate, getPokemonName)
    : responsibility.candidatePokemonId;

  return (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none p-4 marker:content-none">
        <div className="flex items-start gap-3">
          <PokemonIcon
            pokemonId={pokemonId}
            pokemonName={pokemonName}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-slate-900" title={pokemonName}>
              {pokemonName}
            </p>
            {candidate?.label && (
              <p
                className="truncate text-xs font-semibold text-blue-600"
                title={candidate.label}
              >
                {candidate.label}
              </p>
            )}
            <div className="mt-3 flex gap-4 text-sm">
              <span className="font-bold text-emerald-700">
                単独対応 {responsibility.soleEntries.length}
              </span>
              <span className="font-bold text-blue-700">
                共同対応 {responsibility.sharedEntries.length}
              </span>
            </div>
          </div>
          <ChevronDown
            size={18}
            className="mt-1 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          />
        </div>
      </summary>

      <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 p-4">
        <ResponsibilityEntryList
          title={`単独対応（${responsibility.soleEntries.length}）`}
          entries={responsibility.soleEntries}
        />
        <ResponsibilityEntryList
          title={`共同対応（${responsibility.sharedEntries.length}）`}
          entries={responsibility.sharedEntries}
        />
      </div>
    </details>
  );
}

function ResponsibilityEntryList({
  title,
  entries,
}: {
  title: string;
  entries: ResponsibilityEntry[];
}) {
  return (
    <section>
      <h3 className="text-xs font-bold text-slate-700">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">該当なし</p>
      ) : (
        <ol className="mt-2 space-y-1.5">
          {entries.map(({ entry, rating }) => (
            <li
              key={entry.id}
              className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm text-slate-700"
            >
              <span className="text-right text-xs text-slate-400">
                {entry.rank}
              </span>
              <span className="truncate" title={getPokemonName(entry.pokemonId)}>
                {getPokemonName(entry.pokemonId) ?? entry.pokemonId}
              </span>
              <span className="justify-self-end">
                <MatchupRatingBadge rating={rating} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default ResponsibilityAnalysisPanel;
