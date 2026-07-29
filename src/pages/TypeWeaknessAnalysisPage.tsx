import { useMemo } from "react";
import PokemonIcon from "../components/common/PokemonIcon";
import { usePlanner } from "../context/PlannerContext";
import { getPokemonTypeBadgeClass } from "../data/types";
import {
  analyzeTypeCoverage,
  getDefensiveTypeLabel,
  type DefensiveTypeCategory,
  type TypeCoverageAnalysis,
} from "../utils/typeWeaknessAnalysis";

const breakdownTone: Record<DefensiveTypeCategory, string> = {
  weakness: "bg-red-50 text-red-700",
  neutral: "bg-slate-100 text-slate-600",
  resist: "bg-blue-50 text-blue-700",
  immune: "bg-emerald-50 text-emerald-700",
};

function getCardTone(
  analysis: TypeCoverageAnalysis,
): string {
  if (analysis.isWeakType) {
    return "border-red-300 bg-red-50/40";
  }

  if (analysis.fourTimesWeaknessCount > 0) {
    return "border-amber-300 bg-amber-50/40";
  }

  return "border-slate-200 bg-white";
}

function TypeWeaknessAnalysisPage() {
  const { plannerData } = usePlanner();
  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );

  const analysis = useMemo(
    () =>
      currentTeam
        ? analyzeTypeCoverage(
            currentTeam,
            plannerData.candidates,
          )
        : [],
    [currentTeam, plannerData.candidates],
  );
  const unresistedTypes = analysis.filter(
    (item) => item.isUnresisted,
  );
  const weakTypes = analysis.filter(
    (item) => item.isWeakType,
  );

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-blue-600">
          Analysis
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          苦手タイプ分析
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          構築全体が受ける18タイプの弱点・半減・無効を確認します。
          選択中の特性による無効化も集計に含まれます。
        </p>
      </header>

      {!currentTeam ? (
        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">
            分析する構築がありません
          </p>
          <p className="mt-2 text-sm text-slate-500">
            構築画面で構築を作成してください。
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

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-slate-900">
              タイプ傾向
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              構築全体で受け先がないタイプと、弱点側へ偏ったタイプです。
            </p>

            {currentTeam.pokemon.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                構築ポケモンを追加すると傾向を判定できます。
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-amber-50/60 p-3">
                  <h3 className="text-sm font-semibold text-amber-900">
                    一貫しています
                  </h3>
                  {unresistedTypes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {unresistedTypes.map((item) => (
                        <span
                          key={item.typeId}
                          className={getPokemonTypeBadgeClass(
                            item.typeId,
                          )}
                        >
                          {item.typeName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      該当なし
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-red-50/60 p-3">
                  <h3 className="text-sm font-semibold text-red-800">
                    苦手です
                  </h3>
                  {weakTypes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {weakTypes.map((item) => (
                        <span
                          key={item.typeId}
                          className={getPokemonTypeBadgeClass(
                            item.typeId,
                          )}
                        >
                          {item.typeName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      該当なし
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section
            aria-label="18タイプの耐性分析"
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {analysis.map((item) => (
              <details
                key={item.typeId}
                className={[
                  "group rounded-2xl border p-4 shadow-sm",
                  getCardTone(item),
                ].join(" ")}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={getPokemonTypeBadgeClass(
                        item.typeId,
                      )}
                    >
                      {item.typeName}
                    </span>
                    <span className="text-xs font-medium text-slate-400 group-open:rotate-180">
                      ▼
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    <div className="rounded-lg bg-white/80 px-1 py-2">
                      <dt className="text-xs text-slate-500">
                        4倍弱点
                      </dt>
                      <dd
                        className={[
                          "mt-1 text-lg font-bold",
                          item.fourTimesWeaknessCount > 0
                            ? "text-red-700"
                            : "text-slate-800",
                        ].join(" ")}
                      >
                        {item.fourTimesWeaknessCount}匹
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-2 py-2">
                      <dt className="text-xs text-slate-500">
                        弱点
                      </dt>
                      <dd
                        className={[
                          "mt-1 text-lg font-bold",
                          item.weaknessCount > 0
                            ? "text-orange-700"
                            : "text-slate-800",
                        ].join(" ")}
                      >
                        {item.weaknessCount}匹
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-2 py-2">
                      <dt className="text-xs text-slate-500">
                        半減
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-blue-700">
                        {item.resistCount}匹
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-2 py-2">
                      <dt className="text-xs text-slate-500">
                        無効
                      </dt>
                      <dd
                        className={[
                          "mt-1 text-lg font-bold",
                          item.immuneCount >= 2
                            ? "text-emerald-700"
                            : "text-slate-800",
                        ].join(" ")}
                      >
                        {item.immuneCount}匹
                      </dd>
                    </div>
                  </dl>
                </summary>

                <div className="mt-4 border-t border-slate-200/80 pt-3">
                  {item.teamPokemon.length === 0 ? (
                    <p className="py-2 text-sm text-slate-400">
                      構築ポケモンが登録されていません。
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {item.teamPokemon.map((pokemon) => (
                        <li
                          key={pokemon.teamPokemonId}
                          className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2"
                        >
                          <PokemonIcon
                            pokemonId={pokemon.pokemonId}
                            pokemonName={pokemon.pokemonName}
                            size={36}
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {pokemon.pokemonName}
                            </p>
                            {pokemon.candidateLabel && (
                              <p className="truncate text-xs text-slate-500">
                                {pokemon.candidateLabel}
                              </p>
                            )}
                          </div>
                          <span
                            className={[
                              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                              breakdownTone[pokemon.category],
                            ].join(" ")}
                          >
                            {getDefensiveTypeLabel(
                              pokemon.multiplier,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default TypeWeaknessAnalysisPage;
