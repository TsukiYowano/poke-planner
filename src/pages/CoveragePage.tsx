import { useMemo, useState } from "react";
import { pokemonMaster } from "../data/pokemon";
import {
  getPokemonTypeName,
  pokemonTypes,
} from "../data/types";
import { getAbilityName } from "../data/abilities";
import {
  calculateAllDefensiveMatchups,
  type TypeEffectivenessResult,
} from "../utils/typeEffectiveness";
import PokemonAutocomplete from "../components/common/PokemonAutocomplete";

function getMultiplierStyle(multiplier: number): string {
  if (multiplier >= 4) {
    return "border-red-200 bg-red-100 text-red-800";
  }

  if (multiplier >= 2) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (multiplier === 0) {
    return "border-slate-300 bg-slate-200 text-slate-700";
  }

  if (multiplier <= 0.25) {
    return "border-blue-200 bg-blue-100 text-blue-800";
  }

  if (multiplier <= 0.5) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function getMultiplierLabel(multiplier: number): string {
  if (multiplier === 0) {
    return "無効";
  }

  return `${multiplier}倍`;
}

function CoveragePage() {
  const [selectedPokemonId, setSelectedPokemonId] =
    useState(pokemonMaster[0]?.id ?? "");

  const selectedPokemon = useMemo(
    () =>
      pokemonMaster.find(
        (pokemon) =>
          pokemon.id === selectedPokemonId,
      ),
    [selectedPokemonId],
  );

  const [selectedAbilityId, setSelectedAbilityId] =
    useState(
      pokemonMaster[0]?.abilityIds[0] ?? "",
    );

  function handlePokemonChange(
    pokemonId: string,
  ) {
    setSelectedPokemonId(pokemonId);

    const pokemon = pokemonMaster.find(
      (item) => item.id === pokemonId,
    );

    setSelectedAbilityId(
      pokemon?.abilityIds[0] ?? "",
    );
  }

  const matchupResults = useMemo<
    TypeEffectivenessResult[]
  >(() => {
    if (!selectedPokemon) {
      return [];
    }

    return calculateAllDefensiveMatchups(
      selectedPokemon,
      pokemonTypes.map((type) => type.id),
      selectedAbilityId || undefined,
    );
  }, [selectedPokemon, selectedAbilityId]);

  return (
    <div>
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Type Coverage
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            タイプ相性
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            ポケモンのタイプと特性を含めた、
            防御側のタイプ相性を確認します。
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
             <span className="text-sm font-semibold text-slate-700">
              ポケモン
            </span>

            <div className="mt-2">
              <PokemonAutocomplete
                value={selectedPokemonId}
                onChange={handlePokemonChange}
              />
            </div>
          </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                特性
              </span>

              <select
                value={selectedAbilityId}
                onChange={(event) =>
                  setSelectedAbilityId(
                    event.target.value,
                  )
                }
                disabled={
                  !selectedPokemon ||
                  selectedPokemon.abilityIds
                    .length === 0
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {selectedPokemon &&
                selectedPokemon.abilityIds.length >
                  0 ? (
                  selectedPokemon.abilityIds.map(
                    (abilityId) => (
                      <option
                        key={abilityId}
                        value={abilityId}
                      >
                        {getAbilityName(abilityId)}
                      </option>
                    ),
                  )
                ) : (
                  <option value="">
                    特性未登録
                  </option>
                )}
              </select>
            </label>
          </div>

          {selectedPokemon && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
              <span className="text-sm font-semibold text-slate-600">
                基本タイプ
              </span>

              {selectedPokemon.types
                .filter(
                  (
                    typeId,
                  ): typeId is NonNullable<
                    typeof typeId
                  > => Boolean(typeId),
                )
                .map((typeId) => (
                  <span
                    key={typeId}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {getPokemonTypeName(typeId)}
                  </span>
                ))}
            </div>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">
            受ける技のタイプ相性
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {matchupResults.map((result) => (
              <article
                key={result.attackingType}
                className={[
                  "rounded-xl border p-4",
                  getMultiplierStyle(
                    result.finalMultiplier,
                  ),
                ].join(" ")}
              >
                <p className="text-sm font-semibold">
                  {getPokemonTypeName(
                    result.attackingType,
                  )}
                </p>

                <p className="mt-2 text-xl font-bold">
                  {getMultiplierLabel(
                    result.finalMultiplier,
                  )}
                </p>

                {result.notes.length > 0 && (
                  <p className="mt-2 text-xs leading-5 opacity-80">
                    {result.notes.join(" / ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          現在は通常のタイプ相性と、特性マスタに登録された
          無効・ダメージ倍率補正を計算しています。
        </div>
      </div>
  );
}

export default CoveragePage;