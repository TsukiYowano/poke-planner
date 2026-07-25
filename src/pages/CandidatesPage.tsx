import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit3,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import CandidateEditor from "../components/candidates/CandidateEditor";
import { getAbilityName } from "../data/abilities";
import {
  getPokemonById,
  pokemonMaster,
} from "../data/pokemon";
import { getTeamRoleName } from "../data/roles";
import { getPokemonTypeName } from "../data/types";
import { usePlanner } from "../context/PlannerContext";
import { recommendCandidates } from "../utils/recommendation";
import type {
  CandidatePokemon,
  CandidateStatus,
} from "../types/pokemon";
import PokemonAutocomplete from "../components/common/PokemonAutocomplete";
import PokemonIcon from "../components/common/PokemonIcon";

function getStatusLabel(
  status: CandidateStatus,
): string {
  switch (status) {
    case "promising":
      return "有力";
    case "considering":
      return "検討中";
    case "on-hold":
      return "保留";
  }
}

function getStatusStyle(
  status: CandidateStatus,
): string {
  switch (status) {
    case "promising":
      return "bg-emerald-50 text-emerald-700";
    case "considering":
      return "bg-blue-50 text-blue-700";
    case "on-hold":
      return "bg-slate-100 text-slate-600";
  }
}

function CandidatesPage() {
  const {
    candidates,
    currentTeam,
    addCandidate,
    updateCandidate,
    removeCandidate,
    addCandidateToTeam,
    removePokemonFromTeam,
    isPokemonInTeam,
  } = usePlanner();

  const [selectedPokemonId, setSelectedPokemonId] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [
    editingCandidate,
    setEditingCandidate,
  ] = useState<CandidatePokemon | null>(
    null,
  );

  const [message, setMessage] =
    useState<string | null>(null);

  const availablePokemon = useMemo(
    () =>
      pokemonMaster.filter(
        (pokemon) =>
          !candidates.some(
            (candidate) =>
              candidate.pokemonId ===
              pokemon.id,
          ),
      ),
    [candidates],
  );

  const filteredCandidates = useMemo(() => {
    const normalizedText = searchText
      .trim()
      .toLowerCase();

    if (!normalizedText) {
      return candidates;
    }

    return candidates.filter(
      (candidate) => {
        const pokemon = getPokemonById(
          candidate.pokemonId,
        );

        const searchableText = [
          pokemon?.name,
          candidate.memo,
          ...candidate.tags,
          ...candidate.roleIds.map(
            getTeamRoleName,
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedText,
        );
      },
    );
  }, [candidates, searchText]);

  const recommendations = useMemo(
    () =>
      currentTeam
        ? recommendCandidates(
            currentTeam,
            filteredCandidates,
          )
        : filteredCandidates.map(
            (candidate) => ({
              candidate,
              score: 0,
              reasons: [],
            }),
          ),
    [currentTeam, filteredCandidates],
  );

  function handleAddCandidate() {
    if (!selectedPokemonId) {
      setMessage(
        "追加するポケモンを選択してください。",
      );
      return;
    }

    const result = addCandidate(
      selectedPokemonId,
    );

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setSelectedPokemonId("");
    setMessage(
      "候補ポケモンを追加しました。",
    );
  }

  function handleToggleTeam(
    candidate: CandidatePokemon,
  ) {
    if (
      isPokemonInTeam(
        candidate.pokemonId,
      )
    ) {
      removePokemonFromTeam(
        candidate.pokemonId,
      );

      setMessage(
        "構築から外しました。",
      );
      return;
    }

    const result = addCandidateToTeam(
      candidate.id,
    );

    setMessage(
      result.success
        ? "構築へ追加しました。"
        : result.message,
    );
  }

  return (
    <div>
        <header>
          <p className="text-sm font-semibold text-blue-600">
            Candidate Pool
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            候補ポケモン
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            構築へ採用する可能性のあるポケモンと、
            採用理由や懸念点を管理します。
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
  <PokemonAutocomplete
    value={selectedPokemonId}
    onChange={setSelectedPokemonId}
    options={availablePokemon}
    placeholder="候補へ追加するポケモン"
  />
</div>

            <button
              type="button"
              onClick={handleAddCandidate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              候補へ追加
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm text-slate-600">
              {message}
            </p>
          )}
        </section>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value,
                )
              }
              placeholder="名前・タグ・役割・メモで検索"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <p className="text-sm text-slate-500">
            候補 {candidates.length}匹
            ・構築{" "}
            {currentTeam?.pokemon.length ?? 0}
            /6匹
          </p>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map(
            (recommendation) => {
              const candidate =
                recommendation.candidate;

              const pokemon =
                getPokemonById(
                  candidate.pokemonId,
                );

              if (!pokemon) {
                return null;
              }

              const isInTeam =
                isPokemonInTeam(
                  candidate.pokemonId,
                );

              return (
                <article
                  key={candidate.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
  <PokemonIcon
    pokemonId={pokemon.id}
    pokemonName={pokemon.name}
    size={56}
  />

  <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="font-bold text-slate-900">
        {pokemon.name}
      </h2>

      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          getStatusStyle(candidate.status),
        ].join(" ")}
      >
        {getStatusLabel(candidate.status)}
      </span>
    </div>

    <p className="mt-1 text-sm font-bold text-blue-600">
      推薦スコア {recommendation.score}
    </p>

    <div className="mt-2 flex flex-wrap gap-1.5">
      {pokemon.types
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
            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
          >
            {getPokemonTypeName(typeId)}
          </span>
        ))}
    </div>
  </div>
</div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingCandidate(
                          candidate,
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      aria-label="編集"
                    >
                      <Edit3 size={17} />
                    </button>
                  </div>

                  <dl className="mt-4 text-sm">
                    <div className="flex gap-3">
                      <dt className="text-slate-400">
                        特性
                      </dt>

                      <dd className="font-medium text-slate-700">
                        {candidate.abilityId
                          ? getAbilityName(
                              candidate.abilityId,
                            )
                          : "未設定"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      想定役割
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidate.roleIds
                        .length > 0 ? (
                        candidate.roleIds.map(
                          (roleId) => (
                            <span
                              key={roleId}
                              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                            >
                              {getTeamRoleName(
                                roleId,
                              )}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-xs text-slate-400">
                          未設定
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Tags size={13} />
                      タグ
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidate.tags
                        .length > 0 ? (
                        candidate.tags.map(
                          (tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                            >
                              {tag}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-xs text-slate-400">
                          タグなし
                        </span>
                      )}
                    </div>
                  </div>

                  {recommendation.reasons.length > 0 && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">
                        推薦理由
                      </p>

                      <ul className="mt-2 space-y-1">
                        {recommendation.reasons.map(
                          (reason, index) => (
                            <li
                              key={`${reason.type}-${reason.message}-${index}`}
                              className={[
                                "text-sm",
                                reason.score >= 0
                                  ? "text-emerald-700"
                                  : "text-red-600",
                              ].join(" ")}
                            >
                              {reason.score > 0
                                ? "+"
                                : ""}
                              {reason.score}　
                              {reason.message}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {candidate.memo && (
                    <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
                      {candidate.memo}
                    </p>
                  )}

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleTeam(
                          candidate,
                        )
                      }
                      className={[
                        "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        isInTeam
                          ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-blue-600 text-white hover:bg-blue-700",
                      ].join(" ")}
                    >
                      {isInTeam ? (
                        <>
                          <ArrowUpFromLine
                            size={16}
                          />
                          構築から外す
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine
                            size={16}
                          />
                          構築へ追加
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const confirmed =
                          window.confirm(
                            `${pokemon.name}を候補から削除しますか？`,
                          );

                        if (confirmed) {
                          removeCandidate(
                            candidate.id,
                          );
                        }
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label="候補から削除"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            },
          )}
        </section>

        {filteredCandidates.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              条件に一致する候補はいません。
            </p>

            <p className="mt-1 text-sm text-slate-400">
              上の選択欄からポケモンを追加できます。
            </p>
          </div>
        )}

        {editingCandidate && (
          <CandidateEditor
            candidate={editingCandidate}
            onSave={(updatedCandidate) => {
              updateCandidate(
                updatedCandidate,
              );

              setEditingCandidate(null);
              setMessage(
                "候補情報を更新しました。",
              );
            }}
            onClose={() =>
              setEditingCandidate(null)
            }
          />
        )}
      </div>
  );
}

export default CandidatesPage;