import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitCompareArrows,
  Minus,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getPokemonById } from "../data/pokemon";
import { getTeamRoleName, teamRoles } from "../data/roles";
import { getPokemonTypeName } from "../data/types";
import { usePlanner } from "../context/PlannerContext";
import type {
  CandidatePokemon,
  Matchup,
  RankingSet,
  TeamRoleId,
} from "../types/pokemon";
import CandidateSelector from "../components/common/CandidateSelector";
import { getTeamPokemonIds } from "../utils/plannerSelectors";
import {
  compareTeamCandidateSwap,
  type CompareAnalysis,
  type CoverageChange,
} from "../utils/compareAnalysis";
import {
  analyzeCandidateReplacement,
  type CandidateReplacementAnalysis,
  type ReplacementMetric,
  type ReplacementRatingChange,
} from "../utils/candidateReplacementAnalysis";
import { matchupRatingConfig } from "../utils/matchupRatingDisplay";

function ComparePage() {
  const { plannerData } = usePlanner();
  const { candidates, rankingSet, matchups } = plannerData;
  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );
  const [outgoingId, setOutgoingId] = useState("");
  const [incomingId, setIncomingId] = useState("");

  const outgoing = currentTeam?.pokemon.find((item) => item.id === outgoingId);
  const incoming = candidates.find((item) => item.id === incomingId);

  const availableCandidates = useMemo(() => {
    if (!currentTeam) {
      return candidates;
    }

    const teamPokemonIds = getTeamPokemonIds(currentTeam, candidates);
    const outgoingCandidateId = currentTeam.pokemon.find(
      (pokemon) => pokemon.id === outgoingId,
    )?.candidatePokemonId;
    const outgoingPokemonId = candidates.find(
      (candidate) => candidate.id === outgoingCandidateId,
    )?.pokemonId;
    return candidates.filter(
      (candidate) =>
        !teamPokemonIds.has(candidate.pokemonId) ||
        candidate.pokemonId === outgoingPokemonId,
    );
  }, [candidates, currentTeam, outgoingId]);

  const comparison = useMemo(() => {
    if (!currentTeam || !outgoing || !incoming) {
      return null;
    }

    return compareTeamCandidateSwap(
      currentTeam,
      candidates,
      matchups,
      outgoing.id,
      incoming.id,
    );
  }, [candidates, currentTeam, incoming, matchups, outgoing]);
  const replacementImpact = useMemo(() => {
    if (!currentTeam || !comparison || !incoming) return null;
    return analyzeCandidateReplacement(
      currentTeam,
      candidates,
      comparison.outgoingCandidate,
      incoming,
      rankingSet.entries,
      matchups,
    );
  }, [
    candidates,
    comparison,
    currentTeam,
    incoming,
    matchups,
    rankingSet.entries,
  ]);

  if (!currentTeam) {
    return <EmptyState message="比較する構築が登録されていません。" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <GitCompareArrows size={17} /> TEAM SWAP COMPARISON
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          入れ替え比較
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          構築から外す1匹と候補から入れる1匹を選び、役割とタイプ耐性の変化を確認します。
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <SelectCard
            label="構築から外す"
            value={outgoingId}
            onChange={setOutgoingId}
            options={currentTeam.pokemon.map((teamPokemon) => ({
              id: teamPokemon.id,
              label: (() => {
                const candidate = candidates.find(
                  (item) => item.id === teamPokemon.candidatePokemonId,
                );
                return candidate
                  ? getPokemonById(candidate.pokemonId)?.name ?? candidate.label
                  : teamPokemon.candidatePokemonId;
              })(),
            }))}
            placeholder="外すポケモンを選択"
          />

          <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 lg:flex">
            <ArrowRight size={20} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">候補から入れる</p>
            <div className="mt-2">
              <CandidateSelector
                candidates={availableCandidates}
                value={incomingId}
                onChange={setIncomingId}
                placeholder="入れる候補を選択"
              />
            </div>
          </div>
        </div>
      </section>

      {!comparison || !outgoing || !incoming ? (
        <EmptyState message="入れ替える2匹を選ぶと比較結果が表示されます。" />
      ) : (
        <ComparisonResult
          incoming={incoming}
          comparison={comparison}
          rankingSet={rankingSet}
          replacementImpact={replacementImpact}
        />
      )}
    </div>
  );
}

function ComparisonResult({
  incoming,
  comparison,
  rankingSet,
  replacementImpact,
}: {
  incoming: CandidatePokemon;
  comparison: CompareAnalysis;
  rankingSet: RankingSet;
  replacementImpact: CandidateReplacementAnalysis | null;
}) {
  const outgoingPokemon = getPokemonById(
    comparison.outgoingCandidate.pokemonId,
  );
  const incomingPokemon = getPokemonById(incoming.pokemonId);
  const positiveCoverage = comparison.coverageChanges.filter((item) => item.score > 0);
  const negativeCoverage = comparison.coverageChanges.filter((item) => item.score < 0);
  const addedRoles = comparison.roleChanges.filter((item) => item.delta > 0);
  const removedRoles = comparison.roleChanges.filter((item) => item.delta < 0);
  const uniqueNames = comparison.uniqueResponsibilities.map((matchup) => {
    const entry = rankingSet.entries.find((item) => item.id === matchup.rankingEntryId);
    return entry ? getPokemonById(entry.pokemonId)?.name ?? entry.pokemonId : "削除済みの仮想敵";
  });

  const improvementCount = positiveCoverage.length + addedRoles.length;
  const cautionCount = negativeCoverage.length + removedRoles.length + uniqueNames.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <PokemonSummary
          title="変更前"
          pokemonName={
            outgoingPokemon?.name ?? comparison.outgoingCandidate.label
          }
          roleIds={comparison.outgoingCandidate.roleIds}
        />
        <div className="flex items-center justify-center text-slate-400">
          <ArrowRight size={24} />
        </div>
        <PokemonSummary title="変更後" pokemonName={incomingPokemon?.name ?? incoming.pokemonId} roleIds={incoming.roleIds} />
      </section>

      {replacementImpact && (
        <ReplacementImpactSection analysis={replacementImpact} />
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="改善候補" value={improvementCount} unit="件" icon={CheckCircle2} />
        <MetricCard label="注意点" value={cautionCount} unit="件" icon={AlertTriangle} />
        <MetricCard
          label="候補適合スコア"
          value={comparison.recommendation?.score ?? 0}
          unit="点"
          icon={Sparkles}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChangePanel
          title="良くなる可能性"
          icon={CheckCircle2}
          tone="positive"
          items={[
            ...positiveCoverage.map((item) => item.message),
            ...addedRoles.map((item) => `役割「${getTeamRoleName(item.roleId)}」が増える`),
            ...(comparison.recommendation?.reasons ?? [])
              .filter((reason) => reason.score > 0)
              .map((reason) => reason.message),
          ]}
          emptyMessage="明確な改善点はまだ検出されていません。"
        />

        <ChangePanel
          title="注意したい変化"
          icon={AlertTriangle}
          tone="negative"
          items={[
            ...negativeCoverage.map((item) => item.message),
            ...removedRoles.map((item) => `役割「${getTeamRoleName(item.roleId)}」が減る`),
            ...uniqueNames.map((name) => `${name}への唯一の○以上担当を失う`),
            ...(comparison.recommendation?.reasons ?? [])
              .filter((reason) => reason.score < 0)
              .map((reason) => reason.message),
          ]}
          emptyMessage="大きな悪化要素は検出されていません。"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <RoleComparison
          before={comparison.beforeAnalysis}
          after={comparison.afterAnalysis}
        />
        <CoverageComparison changes={comparison.coverageChanges} />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} />
          <div>
            <h2 className="font-bold text-amber-900">相性表について</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              相性評価は候補単位で比較しています。変更前の担当喪失に加えて、
              変更後の候補に登録済みの評価も比較対象になります。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReplacementImpactSection({
  analysis,
}: {
  analysis: CandidateReplacementAnalysis;
}) {
  const summaryItems: {
    label: string;
    metric: ReplacementMetric;
    lowerIsBetter?: boolean;
    higherIsBetter?: boolean;
  }[] = [
    {
      label: "要注意仮想敵",
      metric: analysis.summary.warnings,
      lowerIsBetter: true,
    },
    {
      label: "対応なし",
      metric: analysis.summary.uncovered,
      lowerIsBetter: true,
    },
    {
      label: "未評価",
      metric: analysis.summary.unrated,
      lowerIsBetter: true,
    },
    {
      label: "単独対応数",
      metric: analysis.summary.soleResponsibilities,
    },
    {
      label: "共同対応数",
      metric: analysis.summary.sharedResponsibilities,
      higherIsBetter: true,
    },
  ];

  return (
    <section className="space-y-5" aria-labelledby="replacement-impact-heading">
      <div>
        <h2
          id="replacement-impact-heading"
          className="text-lg font-bold text-slate-900"
        >
          構築への影響
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          実際の構築を変更せず、候補を入れ替えた場合の相性評価を比較します。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryItems.map((item) => (
          <ReplacementMetricCard key={item.label} {...item} />
        ))}
      </div>

      <RatingChangePanel
        title={`改善（${analysis.improvedEntries.length}）`}
        tone="positive"
        entries={analysis.improvedEntries}
        emptyMessage="改善した仮想敵はありません。"
      />
      <RatingChangePanel
        title={`悪化（${analysis.worsenedEntries.length}）`}
        tone="negative"
        entries={analysis.worsenedEntries}
        emptyMessage="悪化した仮想敵はありません。"
      />

      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
        <h3 className="font-bold text-amber-900">要注意仮想敵の変化</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <WarningChangeList
            title={`要注意から外れた（${analysis.removedWarnings.length}）`}
            entries={analysis.removedWarnings}
            emptyMessage="要注意から外れた仮想敵はありません。"
          />
          <WarningChangeList
            title={`新しく要注意になった（${analysis.addedWarnings.length}）`}
            entries={analysis.addedWarnings}
            emptyMessage="新しく要注意になった仮想敵はありません。"
          />
        </div>
      </section>
    </section>
  );
}

function ReplacementMetricCard({
  label,
  metric,
  lowerIsBetter = false,
  higherIsBetter = false,
}: {
  label: string;
  metric: ReplacementMetric;
  lowerIsBetter?: boolean;
  higherIsBetter?: boolean;
}) {
  const isImprovement =
    (lowerIsBetter && metric.delta < 0) ||
    (higherIsBetter && metric.delta > 0);
  const isWorsening =
    (lowerIsBetter && metric.delta > 0) ||
    (higherIsBetter && metric.delta < 0);
  const deltaClassName = isImprovement
    ? "text-emerald-600"
    : isWorsening
      ? "text-rose-600"
      : "text-blue-600";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-900">
        <span>{metric.before}</span>
        <ArrowRight size={16} className="text-slate-400" />
        <span>{metric.after}</span>
      </p>
      <p className={`mt-1 text-sm font-bold ${deltaClassName}`}>
        {metric.delta > 0 ? "+" : ""}
        {metric.delta}
      </p>
    </article>
  );
}

function RatingChangePanel({
  title,
  tone,
  entries,
  emptyMessage,
}: {
  title: string;
  tone: "positive" | "negative";
  entries: ReplacementRatingChange[];
  emptyMessage: string;
}) {
  const positive = tone === "positive";
  return (
    <section
      className={[
        "rounded-2xl border p-5",
        positive
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-rose-200 bg-rose-50/60",
      ].join(" ")}
    >
      <h3
        className={`font-bold ${positive ? "text-emerald-900" : "text-rose-900"}`}
      >
        {title}
      </h3>
      {entries.length === 0 ? (
        <p
          className={`mt-3 text-sm ${positive ? "text-emerald-700" : "text-rose-700"}`}
        >
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {entries.map((change) => (
            <RatingChangeRow key={change.entry.id} change={change} />
          ))}
        </div>
      )}
    </section>
  );
}

function RatingChangeRow({
  change,
}: {
  change: ReplacementRatingChange;
}) {
  const pokemonName =
    getPokemonById(change.entry.pokemonId)?.name ?? change.entry.pokemonId;
  return (
    <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/80 bg-white px-3 py-2.5 text-sm shadow-sm">
      <span className="text-right text-xs font-semibold text-slate-400">
        {change.entry.rank}
      </span>
      <span className="truncate font-semibold text-slate-800" title={pokemonName}>
        {pokemonName}
      </span>
      <span className="flex items-center gap-1.5">
        <RatingSymbol rating={change.beforeRating} />
        <ArrowRight size={13} className="text-slate-400" />
        <RatingSymbol rating={change.afterRating} />
      </span>
    </div>
  );
}

function RatingSymbol({
  rating,
}: {
  rating: Matchup["rating"];
}) {
  const config = matchupRatingConfig[rating];
  return (
    <span
      title={config.name}
      className={`inline-flex min-w-8 justify-center rounded-md border px-1.5 py-0.5 text-xs font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function WarningChangeList({
  title,
  entries,
  emptyMessage,
}: {
  title: string;
  entries: RankingSet["entries"];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-amber-200 bg-white p-4">
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {entries.map((entry) => {
            const name =
              getPokemonById(entry.pokemonId)?.name ?? entry.pokemonId;
            return (
              <li
                key={entry.id}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 text-sm"
              >
                <span className="text-right text-xs font-semibold text-slate-400">
                  {entry.rank}
                </span>
                <span className="truncate font-semibold text-slate-700" title={name}>
                  {name}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function SelectCard({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PokemonSummary({
  title,
  pokemonName,
  roleIds,
}: {
  title: string;
  pokemonName: string;
  roleIds: TeamRoleId[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">{pokemonName}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {roleIds.length ? (
          roleIds.map((roleId) => (
            <span key={roleId} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              {getTeamRoleName(roleId)}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">役割未設定</span>
        )}
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: number;
  unit: string;
  icon: typeof Shield;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Icon size={18} className="text-blue-600" />
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}<span className="ml-1 text-sm font-semibold text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

function ChangePanel({
  title,
  icon: Icon,
  tone,
  items,
  emptyMessage,
}: {
  title: string;
  icon: typeof Shield;
  tone: "positive" | "negative";
  items: string[];
  emptyMessage: string;
}) {
  const uniqueItems = [...new Set(items)];
  const positive = tone === "positive";

  return (
    <section className={`rounded-2xl border p-5 ${positive ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <h2 className={`flex items-center gap-2 font-bold ${positive ? "text-emerald-900" : "text-rose-900"}`}>
        <Icon size={18} /> {title}
      </h2>
      {uniqueItems.length ? (
        <ul className={`mt-4 space-y-2 text-sm ${positive ? "text-emerald-800" : "text-rose-800"}`}>
          {uniqueItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-0.5">{positive ? "＋" : "－"}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-4 text-sm ${positive ? "text-emerald-700" : "text-rose-700"}`}>{emptyMessage}</p>
      )}
    </section>
  );
}

function RoleComparison({
  before,
  after,
}: {
  before: CompareAnalysis["beforeAnalysis"];
  after: CompareAnalysis["afterAnalysis"];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold text-slate-900"><Swords size={18} /> 役割の比較</h2>
      <div className="mt-4 space-y-2">
        {teamRoles.map((role) => {
          const beforeCount = before.roleCounts.find((item) => item.roleId === role.id)?.count ?? 0;
          const afterCount = after.roleCounts.find((item) => item.roleId === role.id)?.count ?? 0;
          if (beforeCount === 0 && afterCount === 0) return null;
          const delta = afterCount - beforeCount;
          return (
            <div key={role.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-700">{role.name}</span>
              <span className="font-bold text-slate-600">{beforeCount}</span>
              <ArrowRight size={14} className="text-slate-400" />
              <span className={`font-bold ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-slate-600"}`}>{afterCount}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CoverageComparison({ changes }: { changes: CoverageChange[] }) {
  const visible = changes.filter((item) => item.score !== 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold text-slate-900"><Shield size={18} /> タイプ耐性の変化</h2>
      {visible.length ? (
        <div className="mt-4 space-y-2">
          {visible.map((item) => (
            <div key={item.typeId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">{getPokemonTypeName(item.typeId)}</span>
              <span className={item.score > 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{item.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Minus size={16} /> 主要な耐性変化はありません。</div>
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
      <GitCompareArrows size={40} className="mx-auto text-slate-300" />
      <p className="mt-4 font-semibold text-slate-800">{message}</p>
    </div>
  );
}

export default ComparePage;
