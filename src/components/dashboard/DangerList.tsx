import { CircleAlert } from "lucide-react";
import { useMemo } from "react";
import { usePlanner } from "../../context/PlannerContext";
import { getPokemonById } from "../../data/pokemon";
import { getDangerousPokemon } from "../../utils/matchupAnalysis";

function DangerList() {
  const { plannerData } = usePlanner();
  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );
  const { rankingSet, matchups } = plannerData;

  const dangerousPokemon = useMemo(() => {
    if (!currentTeam) {
      return [];
    }

    return getDangerousPokemon(
      currentTeam.pokemon,
      rankingSet.entries,
      matchups,
      5,
    );
  }, [
    currentTeam,
    rankingSet.entries,
    matchups,
  ]);

  const hasTeamPokemon =
    (currentTeam?.pokemon.length ?? 0) > 0;

  const hasRankingEntries =
    rankingSet.entries.length > 0;

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <CircleAlert
            size={19}
            className="text-rose-500"
            strokeWidth={1.8}
          />

          <h3 className="text-lg font-bold text-slate-900">
            要注意TOP5
          </h3>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          現在の構築で対応が薄い仮想敵
        </p>
      </div>

      {dangerousPokemon.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {dangerousPokemon.map(
            ({
              rankingEntry,
              coverageCount,
              dangerScore,
            }) => {
              const pokemon = getPokemonById(
                rankingEntry.pokemonId,
              );

              return (
                <div
                  key={rankingEntry.id}
                  className="flex items-center justify-between gap-4 px-6 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                      {rankingEntry.rank}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {pokemon?.name ??
                          "不明なポケモン"}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {coverageCount === 0
                          ? "有利な担当なし"
                          : "有利な担当1匹"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-rose-600">
                      {dangerScore}
                    </span>

                    <p className="text-[10px] font-medium text-slate-400">
                      危険度
                    </p>
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <EmptyState
          hasTeamPokemon={hasTeamPokemon}
          hasRankingEntries={hasRankingEntries}
        />
      )}
    </article>
  );
}

type EmptyStateProps = {
  hasTeamPokemon: boolean;
  hasRankingEntries: boolean;
};

function EmptyState({
  hasTeamPokemon,
  hasRankingEntries,
}: EmptyStateProps) {
  let message =
    "担当数1以下の要注意ポケモンはいません。";

  if (!hasTeamPokemon) {
    message =
      "構築にポケモンを登録すると診断されます。";
  } else if (!hasRankingEntries) {
    message =
      "ランキングを登録すると診断されます。";
  }

  return (
    <div className="flex min-h-44 items-center justify-center px-6 py-8">
      <div className="text-center">
        <CircleAlert
          size={28}
          strokeWidth={1.5}
          className="mx-auto text-slate-300"
        />

        <p className="mt-3 text-sm text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

export default DangerList;
