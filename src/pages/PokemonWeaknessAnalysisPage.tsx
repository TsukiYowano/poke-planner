import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import PokemonIcon from "../components/common/PokemonIcon";
import MatchupRatingBadge from "../components/matchups/MatchupRatingBadge";
import { usePlanner } from "../context/PlannerContext";
import { getPokemonById } from "../data/pokemon";
import { formatCandidateDisplayName } from "../utils/responsibilityDisplay";
import {
  analyzePokemonWeaknesses,
  type PokemonWeaknessEntry,
  type PokemonWeaknessStatus,
} from "../utils/pokemonWeaknessAnalysis";

const groupConfig: Record<
  PokemonWeaknessStatus,
  {
    label: string;
    summaryClassName: string;
    sectionClassName: string;
  }
> = {
  difficult: {
    label: "対応困難",
    summaryClassName: "border-red-200 bg-red-50 text-red-700",
    sectionClassName: "border-red-200 bg-red-50/30",
  },
  warning: {
    label: "要注意",
    summaryClassName: "border-amber-200 bg-amber-50 text-amber-700",
    sectionClassName: "border-amber-200 bg-amber-50/30",
  },
  stable: {
    label: "安定対応",
    summaryClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sectionClassName: "border-emerald-200 bg-emerald-50/20",
  },
  unrated: {
    label: "未評価",
    summaryClassName: "border-slate-200 bg-slate-50 text-slate-600",
    sectionClassName: "border-slate-200 bg-slate-50/50",
  },
};

const groupOrder: PokemonWeaknessStatus[] = [
  "difficult",
  "warning",
  "stable",
  "unrated",
];

function PokemonWeaknessAnalysisPage() {
  const { plannerData } = usePlanner();
  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );
  const analysis = useMemo(
    () =>
      analyzePokemonWeaknesses(
        currentTeam,
        plannerData.candidates,
        plannerData.rankingSet.entries,
        plannerData.matchups,
      ),
    [
      currentTeam,
      plannerData.candidates,
      plannerData.matchups,
      plannerData.rankingSet.entries,
    ],
  );

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-blue-600">Analysis</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          苦手ポケモン分析
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          相性表の評価を仮想敵側から整理し、構築が対応しづらい相手を確認します。
        </p>
      </header>

      {!currentTeam || currentTeam.pokemon.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">
            分析する構築ポケモンがありません
          </p>
          <p className="mt-2 text-sm text-slate-500">
            構築画面で候補ポケモンを追加してください。
          </p>
        </section>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            対象：
            <span className="font-semibold text-slate-900">
              {currentTeam.name}
            </span>
            <span className="ml-2 text-slate-400">
              {currentTeam.pokemon.length}匹
            </span>
          </div>

          <section
            aria-label="苦手ポケモン分析サマリー"
            className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {groupOrder.map((status) => (
              <div
                key={status}
                className={[
                  "rounded-xl border px-4 py-3",
                  groupConfig[status].summaryClassName,
                ].join(" ")}
              >
                <p className="text-xs font-semibold">
                  {groupConfig[status].label}
                </p>
                <p className="mt-1 text-xl font-bold">
                  {analysis.groups[status].length}体
                </p>
              </div>
            ))}
          </section>

          <div className="mt-5 space-y-4">
            {groupOrder.map((status) => {
              const entries = analysis.groups[status];
              return entries.length > 0 ? (
                <WeaknessGroup
                  key={status}
                  status={status}
                  entries={entries}
                />
              ) : null;
            })}
          </div>
        </>
      )}
    </div>
  );
}

function WeaknessGroup({
  status,
  entries,
}: {
  status: PokemonWeaknessStatus;
  entries: PokemonWeaknessEntry[];
}) {
  const [showAll, setShowAll] = useState(false);
  const initialCount = 10;
  const remainingCount = Math.max(entries.length - initialCount, 0);
  const config = groupConfig[status];
  const initiallyOpen = status === "difficult" || status === "warning";
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className={[
        "group rounded-2xl border p-4",
        config.sectionClassName,
      ].join(" ")}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:content-none">
        <h2 className="font-bold text-slate-900">
          {config.label}（{entries.length}）
        </h2>
        <ChevronDown className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" size={18} />
      </summary>

      <div className="mt-4 space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.rankingEntry.id}
            hidden={!showAll && index >= initialCount}
          >
            <WeaknessEntryRow entry={entry} />
          </div>
        ))}

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="mt-2 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            {showAll ? "折りたたむ" : `残り${remainingCount}件を表示`}
          </button>
        )}
      </div>
    </details>
  );
}

function WeaknessEntryRow({
  entry,
}: {
  entry: PokemonWeaknessEntry;
}) {
  const pokemon = getPokemonById(entry.rankingEntry.pokemonId);
  const pokemonName = pokemon?.name ?? entry.rankingEntry.pokemonId;

  return (
    <details className="group/entry rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer list-none p-3 marker:content-none">
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-7 shrink-0 text-right text-xs font-bold text-slate-400">
            {entry.rankingEntry.rank}
          </span>
          <PokemonIcon
            pokemonId={entry.rankingEntry.pokemonId}
            pokemonName={pokemonName}
            size={42}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900" title={pokemonName}>
              {pokemonName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                最良評価
                <MatchupRatingBadge rating={entry.bestRating} />
              </span>
              <span>○以上：{entry.goodOrBetterCount}匹</span>
              <span>◎：{entry.excellentCount}匹</span>
            </div>
          </div>
          <ChevronDown
            size={17}
            className="shrink-0 text-slate-400 transition-transform group-open/entry:rotate-180"
          />
        </div>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50/60 p-3">
        <p className="mb-2 text-xs font-bold text-slate-600">
          構築内の評価
        </p>
        <ul className="space-y-2">
          {entry.assignments.map(({ teamPokemon, candidate, rating }) => {
            const assignedPokemon = getPokemonById(candidate.pokemonId);
            const assignedName =
              assignedPokemon?.name ?? candidate.pokemonId;
            const displayName = formatCandidateDisplayName(
              assignedName,
              candidate.label,
            );

            return (
              <li
                key={teamPokemon.id}
                className="flex min-w-0 items-center gap-3 rounded-lg bg-white px-3 py-2"
              >
                <PokemonIcon
                  pokemonId={candidate.pokemonId}
                  pokemonName={assignedName}
                  size={36}
                  className="shrink-0"
                />
                <span
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700"
                  title={displayName}
                >
                  {displayName}
                </span>
                <MatchupRatingBadge rating={rating} />
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

export default PokemonWeaknessAnalysisPage;
