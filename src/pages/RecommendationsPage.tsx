import {
  AlertTriangle,
  Check,
  Lightbulb,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { pokemonMasterMap } from "../data/pokemon";
import { usePlanner } from "../context/PlannerContext";
import type {
  CandidateRecommendation,
  RecommendationReason,
} from "../types/pokemon";
import { recommendCandidates } from "../utils/recommendation";

type MessageState = {
  type: "success" | "error";
  text: string;
};

function getRecommendationRank(
  score: number,
): {
  label: string;
  description: string;
  className: string;
} {
  if (score >= 40) {
    return {
      label: "S",
      description: "かなりおすすめ",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 25) {
    return {
      label: "A",
      description: "おすすめ",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (score >= 10) {
    return {
      label: "B",
      description: "補完候補",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (score >= 0) {
    return {
      label: "C",
      description: "検討候補",
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  return {
    label: "D",
    description: "相性に注意",
    className:
      "border-red-200 bg-red-50 text-red-700",
  };
}

function getReasonClassName(
  reason: RecommendationReason,
): string {
  if (reason.score > 0) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  return "border-red-100 bg-red-50 text-red-700";
}

function RecommendationCard({
  recommendation,
  rank,
  teamIsFull,
  onAdd,
}: {
  recommendation: CandidateRecommendation;
  rank: number;
  teamIsFull: boolean;
  onAdd: (candidateId: string) => void;
}) {
  const { candidate, score, reasons } =
    recommendation;

  const pokemon =
    pokemonMasterMap[candidate.pokemonId];

  if (!pokemon) {
    return null;
  }

  const recommendationRank =
    getRecommendationRank(score);

  const positiveReasons = reasons.filter(
    (reason) => reason.score > 0,
  );

  const negativeReasons = reasons.filter(
    (reason) => reason.score < 0,
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {rank}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {pokemon.name}
              </h2>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-bold",
                  recommendationRank.className,
                ].join(" ")}
              >
                {recommendationRank.label}ランク
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {recommendationRank.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">
              推薦スコア
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {score}
              <span className="ml-1 text-sm font-medium text-slate-500">
                点
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={teamIsFull}
            onClick={() => onAdd(candidate.id)}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-4 py-2.5",
              "text-sm font-semibold transition",
              teamIsFull
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
          >
            <Plus size={17} />
            構築へ追加
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Check
              size={16}
              className="text-emerald-600"
            />
            加点理由
          </h3>

          {positiveReasons.length > 0 ? (
            <div className="mt-2 space-y-2">
              {positiveReasons.map(
                (reason, index) => (
                  <div
                    key={`${reason.type}-${reason.message}-${index}`}
                    className={[
                      "flex items-start justify-between gap-3 rounded-lg border px-3 py-2",
                      getReasonClassName(reason),
                    ].join(" ")}
                  >
                    <p className="text-sm font-medium">
                      {reason.message}
                    </p>

                    <span className="shrink-0 text-sm font-bold">
                      +{reason.score}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
              現在の構築に対する明確な加点理由はありません。
            </p>
          )}
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle
              size={16}
              className="text-red-500"
            />
            注意点
          </h3>

          {negativeReasons.length > 0 ? (
            <div className="mt-2 space-y-2">
              {negativeReasons.map(
                (reason, index) => (
                  <div
                    key={`${reason.type}-${reason.message}-${index}`}
                    className={[
                      "flex items-start justify-between gap-3 rounded-lg border px-3 py-2",
                      getReasonClassName(reason),
                    ].join(" ")}
                  >
                    <p className="text-sm font-medium">
                      {reason.message}
                    </p>

                    <span className="shrink-0 text-sm font-bold">
                      {reason.score}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
              現在の判定では大きな注意点はありません。
            </p>
          )}
        </div>
      </div>

      {candidate.memo && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            候補メモ
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {candidate.memo}
          </p>
        </div>
      )}
    </article>
  );
}

function RecommendationsPage() {
  const {
    currentTeam,
    candidates,
    addCandidateToTeam,
    isPokemonInTeam,
  } = usePlanner();

  const [message, setMessage] =
    useState<MessageState | null>(null);

  const recommendations = useMemo(() => {
    if (!currentTeam) {
      return [];
    }

    const availableCandidates =
      candidates.filter(
        (candidate) =>
          !isPokemonInTeam(
            candidate.pokemonId,
          ),
      );

    return recommendCandidates(
      currentTeam,
      availableCandidates,
    );
  }, [
    currentTeam,
    candidates,
    isPokemonInTeam,
  ]);

  const teamIsFull =
    (currentTeam?.pokemon.length ?? 0) >= 6;

  function handleAddToTeam(
    candidateId: string,
  ) {
    const result =
      addCandidateToTeam(candidateId);

    if (!result.success) {
      setMessage({
        type: "error",
        text: result.message,
      });

      return;
    }

    setMessage({
      type: "success",
      text: "おすすめ候補を構築へ追加しました。",
    });
  }

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            TEAM RECOMMENDATION
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            あと1匹おすすめ
          </h1>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-900">
            構築がありません
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            おすすめを計算するには、先に構築を作成してください。
          </p>

          <Link
            to="/teams"
            className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            構築ページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Sparkles size={17} />
            TEAM RECOMMENDATION
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            あと1匹おすすめ
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            タイプ耐性と不足役割から、登録済みの候補をおすすめ順に表示します。
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            現在の構築
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {currentTeam.name}
          </p>

          <p className="mt-0.5 text-sm text-slate-500">
            {currentTeam.pokemon.length} / 6匹
          </p>
        </div>
      </header>

      {message && (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm font-medium",
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message.text}
        </div>
      )}

      {teamIsFull && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <div>
            <p className="font-semibold text-amber-900">
              構築が6匹埋まっています
            </p>

            <p className="mt-1 text-sm text-amber-800">
              おすすめの確認はできますが、追加するには構築から1匹外してください。
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">
          現在のメンバー
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {currentTeam.pokemon.length > 0 ? (
            currentTeam.pokemon.map(
              (teamPokemon) => {
                const pokemon =
                  pokemonMasterMap[
                    teamPokemon.pokemonId
                  ];

                return (
                  <span
                    key={teamPokemon.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {pokemon?.name ??
                      teamPokemon.pokemonId}
                  </span>
                );
              },
            )
          ) : (
            <p className="text-sm text-slate-500">
              まだポケモンが登録されていません。
            </p>
          )}
        </div>
      </section>

      {recommendations.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                おすすめランキング
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                全{recommendations.length}件
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.map(
              (recommendation, index) => (
                <RecommendationCard
                  key={
                    recommendation.candidate.id
                  }
                  recommendation={
                    recommendation
                  }
                  rank={index + 1}
                  teamIsFull={teamIsFull}
                  onAdd={handleAddToTeam}
                />
              ),
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Lightbulb
            size={38}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            おすすめできる候補がありません
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            候補ポケモンを登録すると、現在の構築に合わせてランキングを作成します。
          </p>

          <Link
            to="/candidates"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            候補ポケモンを登録
          </Link>
        </section>
      )}
    </div>
  );
}

export default RecommendationsPage;