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
  MatchupRating,
  Team,
  TeamPokemon,
  TeamRoleId,
} from "../types/pokemon";
import { recommendCandidates } from "../utils/recommendation";
import { analyzeTeam } from "../utils/teamAnalysis";
import {
  analyzeTeamTypeCoverage,
  type TeamTypeCoverage,
} from "../utils/teamTypeCoverage";

const positiveRatings: MatchupRating[] = ["very-good", "good"];
const negativeRatings: MatchupRating[] = ["bad", "very-bad"];

function ComparePage() {
  const { currentTeam, candidates, rankingSet, matchups } = usePlanner();
  const [outgoingId, setOutgoingId] = useState("");
  const [incomingId, setIncomingId] = useState("");

  const outgoing = currentTeam?.pokemon.find((item) => item.id === outgoingId);
  const incoming = candidates.find((item) => item.id === incomingId);

  const availableCandidates = useMemo(() => {
    if (!currentTeam) {
      return candidates;
    }

    return candidates.filter(
      (candidate) =>
        !currentTeam.pokemon.some(
          (teamPokemon) => teamPokemon.pokemonId === candidate.pokemonId,
        ),
    );
  }, [candidates, currentTeam]);

  const comparison = useMemo(() => {
    if (!currentTeam || !outgoing || !incoming) {
      return null;
    }

    const incomingTeamPokemon = candidateToTeamPokemon(incoming);
    const beforeTeam = currentTeam;
    const teamWithoutOutgoing: Team = {
      ...currentTeam,
      pokemon: currentTeam.pokemon.filter((item) => item.id !== outgoing.id),
    };
    const afterTeam: Team = {
      ...currentTeam,
      pokemon: [...teamWithoutOutgoing.pokemon, incomingTeamPokemon],
    };

    const beforeAnalysis = analyzeTeam(beforeTeam);
    const afterAnalysis = analyzeTeam(afterTeam);
    const beforeCoverage = analyzeTeamTypeCoverage(beforeTeam);
    const afterCoverage = analyzeTeamTypeCoverage(afterTeam);
    const recommendation = recommendCandidates(teamWithoutOutgoing, [incoming])[0];

    const roleChanges = buildRoleChanges(beforeAnalysis.roleCounts, afterAnalysis.roleCounts);
    const coverageChanges = buildCoverageChanges(beforeCoverage, afterCoverage);

    const outgoingMatchups = matchups.filter(
      (matchup) => matchup.teamPokemonId === outgoing.id,
    );
    const goodMatchups = outgoingMatchups.filter((matchup) =>
      positiveRatings.includes(matchup.rating),
    );
    const badMatchups = outgoingMatchups.filter((matchup) =>
      negativeRatings.includes(matchup.rating),
    );

    const uniqueResponsibilities = goodMatchups.filter((matchup) => {
      const otherGoodAnswerExists = matchups.some(
        (other) =>
          other.rankingEntryId === matchup.rankingEntryId &&
          other.teamPokemonId !== outgoing.id &&
          positiveRatings.includes(other.rating),
      );

      return !otherGoodAnswerExists;
    });

    return {
      beforeTeam,
      afterTeam,
      beforeAnalysis,
      afterAnalysis,
      roleChanges,
      coverageChanges,
      recommendation,
      goodMatchups,
      badMatchups,
      uniqueResponsibilities,
    };
  }, [currentTeam, incoming, matchups, outgoing]);

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
              label: getPokemonById(teamPokemon.pokemonId)?.name ?? teamPokemon.pokemonId,
            }))}
            placeholder="外すポケモンを選択"
          />

          <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 lg:flex">
            <ArrowRight size={20} />
          </div>

          <SelectCard
            label="候補から入れる"
            value={incomingId}
            onChange={setIncomingId}
            options={availableCandidates.map((candidate) => ({
              id: candidate.id,
              label: getPokemonById(candidate.pokemonId)?.name ?? candidate.pokemonId,
            }))}
            placeholder="入れる候補を選択"
          />
        </div>
      </section>

      {!comparison || !outgoing || !incoming ? (
        <EmptyState message="入れ替える2匹を選ぶと比較結果が表示されます。" />
      ) : (
        <ComparisonResult
          outgoing={outgoing}
          incoming={incoming}
          comparison={comparison}
          rankingSet={rankingSet}
        />
      )}
    </div>
  );
}

function ComparisonResult({
  outgoing,
  incoming,
  comparison,
  rankingSet,
}: {
  outgoing: TeamPokemon;
  incoming: CandidatePokemon;
  comparison: ComparisonData;
  rankingSet: ReturnType<typeof usePlanner>["rankingSet"];
}) {
  const outgoingPokemon = getPokemonById(outgoing.pokemonId);
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
        <PokemonSummary title="変更前" pokemonName={outgoingPokemon?.name ?? outgoing.pokemonId} roleIds={outgoing.roleIds} />
        <div className="flex items-center justify-center text-slate-400">
          <ArrowRight size={24} />
        </div>
        <PokemonSummary title="変更後" pokemonName={incomingPokemon?.name ?? incoming.pokemonId} roleIds={incoming.roleIds} />
      </section>

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
          beforeTeam={comparison.beforeTeam}
          afterTeam={comparison.afterTeam}
        />
        <CoverageComparison changes={comparison.coverageChanges} />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} />
          <div>
            <h2 className="font-bold text-amber-900">相性表について</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              候補ポケモンはまだ相性表の評価を持っていないため、仮想敵への改善は自動判定していません。
              入れ替え後は相性表で候補の対面評価を入力すると、担当状況を正確に確認できます。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

type ComparisonData = {
  beforeTeam: Team;
  afterTeam: Team;
  beforeAnalysis: ReturnType<typeof analyzeTeam>;
  afterAnalysis: ReturnType<typeof analyzeTeam>;
  roleChanges: RoleChange[];
  coverageChanges: CoverageChange[];
  recommendation: ReturnType<typeof recommendCandidates>[number] | undefined;
  goodMatchups: ReturnType<typeof usePlanner>["matchups"];
  badMatchups: ReturnType<typeof usePlanner>["matchups"];
  uniqueResponsibilities: ReturnType<typeof usePlanner>["matchups"];
};

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

function RoleComparison({ beforeTeam, afterTeam }: { beforeTeam: Team; afterTeam: Team }) {
  const before = analyzeTeam(beforeTeam);
  const after = analyzeTeam(afterTeam);

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

type RoleChange = { roleId: TeamRoleId; delta: number };

type CoverageChange = {
  typeId: TeamTypeCoverage["attackingType"];
  score: number;
  message: string;
};

function candidateToTeamPokemon(candidate: CandidatePokemon): TeamPokemon {
  return {
    id: `compare-${candidate.id}`,
    pokemonId: candidate.pokemonId,
    abilityId: candidate.abilityId,
    moves: [],
    roleIds: [...candidate.roleIds],
    tags: [...candidate.tags],
    memo: candidate.memo,
  };
}

function buildRoleChanges(
  before: ReturnType<typeof analyzeTeam>["roleCounts"],
  after: ReturnType<typeof analyzeTeam>["roleCounts"],
): RoleChange[] {
  return teamRoles
    .map((role) => ({
      roleId: role.id,
      delta:
        (after.find((item) => item.roleId === role.id)?.count ?? 0) -
        (before.find((item) => item.roleId === role.id)?.count ?? 0),
    }))
    .filter((item) => item.delta !== 0);
}

function defensiveAnswerCount(item: TeamTypeCoverage): number {
  return item.immune + item.quarter + item.half;
}

function weaknessCount(item: TeamTypeCoverage): number {
  return item.double + item.quadruple;
}

function buildCoverageChanges(
  before: TeamTypeCoverage[],
  after: TeamTypeCoverage[],
): CoverageChange[] {
  return before.map((beforeItem) => {
    const afterItem = after.find((item) => item.attackingType === beforeItem.attackingType) ?? beforeItem;
    const answerDelta = defensiveAnswerCount(afterItem) - defensiveAnswerCount(beforeItem);
    const weaknessDelta = weaknessCount(afterItem) - weaknessCount(beforeItem);
    const score = answerDelta - weaknessDelta;

    let message = "変化なし";
    if (answerDelta > 0 && weaknessDelta <= 0) message = `受け先が${answerDelta}匹増える`;
    else if (answerDelta < 0 && weaknessDelta >= 0) message = `受け先が${Math.abs(answerDelta)}匹減る`;
    else if (weaknessDelta > 0 && answerDelta <= 0) message = `弱点が${weaknessDelta}匹増える`;
    else if (weaknessDelta < 0 && answerDelta >= 0) message = `弱点が${Math.abs(weaknessDelta)}匹減る`;
    else if (score > 0) message = "耐性バランスが改善";
    else if (score < 0) message = "耐性バランスが悪化";

    return { typeId: beforeItem.attackingType, score, message };
  });
}

export default ComparePage;
