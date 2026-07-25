import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  Plus,
  X,
} from "lucide-react";
import { getAbilityName } from "../../data/abilities";
import { pokemonMaster } from "../../data/pokemon";
import { teamRoles } from "../../data/roles";
import type {
  EffortValues,
  TeamPokemon,
  TeamRoleCategory,
  TeamRoleId,
} from "../../types/pokemon";
import MoveAutocomplete from "../common/MoveAutocomplete";

type TeamPokemonEditorProps = {
  teamPokemon: TeamPokemon;
  onSave: (
    teamPokemon: TeamPokemon,
  ) => void;
  onClose: () => void;
};

const roleCategoryLabels: Record<
  TeamRoleCategory,
  string
> = {
  attack: "攻撃",
  defense: "耐久",
  speed: "速度",
  support: "補助",
};

const effortValueFields: {
  key: keyof EffortValues;
  label: string;
}[] = [
  {
    key: "hp",
    label: "HP",
  },
  {
    key: "attack",
    label: "攻撃",
  },
  {
    key: "defense",
    label: "防御",
  },
  {
    key: "specialAttack",
    label: "特攻",
  },
  {
    key: "specialDefense",
    label: "特防",
  },
  {
    key: "speed",
    label: "素早さ",
  },
];

function normalizeMoveList(
  moves: string[],
): string[] {
  return Array.from(
    {
      length: 4,
    },
    (_, index) =>
      moves[index] ?? "",
  );
}

function getEffortValueTotal(
  effortValues: EffortValues,
): number {
  return Object.values(
    effortValues,
  ).reduce(
    (total, value) =>
      total + (value ?? 0),
    0,
  );
}

function TeamPokemonEditor({
  teamPokemon,
  onSave,
  onClose,
}: TeamPokemonEditorProps) {
  const [formData, setFormData] =
    useState<TeamPokemon>({
      ...teamPokemon,
      moves: normalizeMoveList(
        teamPokemon.moves,
      ),
      roleIds: [
        ...teamPokemon.roleIds,
      ],
      tags: [
        ...teamPokemon.tags,
      ],
      effortValues: {
        ...teamPokemon.effortValues,
      },
    });

  const [tagInput, setTagInput] =
    useState("");

  const selectedPokemon =
    pokemonMaster.find(
      (pokemon) =>
        pokemon.id ===
        formData.pokemonId,
    );

  const effortValueTotal =
    getEffortValueTotal(
      formData.effortValues ?? {},
    );

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        originalOverflow;
    };
  }, [onClose]);

  function handlePokemonChange(
    pokemonId: string,
  ) {
    const pokemon =
      pokemonMaster.find(
        (item) =>
          item.id === pokemonId,
      );

    setFormData((current) => ({
      ...current,
      pokemonId,
      abilityId:
        pokemon?.abilityIds[0] ??
        undefined,
    }));
  }

  function handleMoveChange(
    index: number,
    value: string,
  ) {
    setFormData((current) => {
      const moves =
        normalizeMoveList(
          current.moves,
        );

      moves[index] = value;

      return {
        ...current,
        moves,
      };
    });
  }

  function handleEffortValueChange(
    key: keyof EffortValues,
    value: string,
  ) {
    const parsedValue =
      value === ""
        ? undefined
        : Math.max(
            0,
            Math.min(
              32,
              Number(value),
            ),
          );

    setFormData((current) => ({
      ...current,
      effortValues: {
        ...current.effortValues,
        [key]: Number.isNaN(
          parsedValue,
        )
          ? undefined
          : parsedValue,
      },
    }));
  }

  function toggleRole(
    roleId: TeamRoleId,
  ) {
    setFormData((current) => {
      const isSelected =
        current.roleIds.includes(
          roleId,
        );

      return {
        ...current,
        roleIds: isSelected
          ? current.roleIds.filter(
              (id) =>
                id !== roleId,
            )
          : [
              ...current.roleIds,
              roleId,
            ],
      };
    });
  }

  function addTag() {
    const newTags = tagInput
      .split(/[,、]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (newTags.length === 0) {
      return;
    }

    setFormData((current) => ({
      ...current,
      tags: Array.from(
        new Set([
          ...current.tags,
          ...newTags,
        ]),
      ),
    }));

    setTagInput("");
  }

  function removeTag(
    tag: string,
  ) {
    setFormData((current) => ({
      ...current,
      tags: current.tags.filter(
        (item) =>
          item !== tag,
      ),
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    onSave({
      ...formData,
      nature:
        formData.nature?.trim() ||
        undefined,
      item:
        formData.item?.trim() ||
        undefined,
      moves: formData.moves
        .map((move) =>
          move.trim(),
        )
        .filter(Boolean),
      memo:
        formData.memo?.trim() ||
        undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Pokémon Editor
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              構築ポケモンを編集
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                ポケモン
              </span>

              <select
                value={
                  formData.pokemonId
                }
                onChange={(event) =>
                  handlePokemonChange(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {pokemonMaster.map(
                  (pokemon) => (
                    <option
                      key={
                        pokemon.id
                      }
                      value={
                        pokemon.id
                      }
                    >
                      {
                        pokemon.name
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                特性
              </span>

              <select
                value={
                  formData.abilityId ??
                  ""
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      abilityId:
                        event.target
                          .value ||
                        undefined,
                    }),
                  )
                }
                disabled={
                  !selectedPokemon ||
                  selectedPokemon
                    .abilityIds
                    .length === 0
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {selectedPokemon
                  ?.abilityIds.length ? (
                  selectedPokemon.abilityIds.map(
                    (abilityId) => (
                      <option
                        key={
                          abilityId
                        }
                        value={
                          abilityId
                        }
                      >
                        {getAbilityName(
                          abilityId,
                        )}
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

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                性格
              </span>

              <input
                type="text"
                value={
                  formData.nature ??
                  ""
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      nature:
                        event.target
                          .value,
                    }),
                  )
                }
                placeholder="例：ようき"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                持ち物
              </span>

              <input
                type="text"
                value={
                  formData.item ?? ""
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      item:
                        event.target
                          .value,
                    }),
                  )
                }
                placeholder="例：こだわりスカーフ"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <section className="mt-7">
            <h3 className="font-bold text-slate-900">
              技
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {normalizeMoveList(
                formData.moves,
              ).map(
                (move, index) => (
                  <div
                    key={index}
                    className="block"
                  >
                    <span className="text-xs font-semibold text-slate-500">
                      技 {index + 1}
                    </span>

                    <div className="mt-1.5">
                      <MoveAutocomplete
                        value={move}
                        onChange={(
                          value,
                        ) =>
                          handleMoveChange(
                            index,
                            value,
                          )
                        }
                        placeholder="技名を検索"
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900">
                努力値
              </h3>

              <span
                className={[
                  "text-sm font-semibold",
                  effortValueTotal >
                  66
                    ? "text-red-600"
                    : "text-slate-500",
                ].join(" ")}
              >
                合計{" "}
                {effortValueTotal}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {effortValueFields.map(
                (field) => (
                  <label
                    key={field.key}
                    className="block"
                  >
                    <span className="text-xs font-semibold text-slate-500">
                      {
                        field.label
                      }
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={32}
                      value={
                        formData
                          .effortValues?.[
                          field.key
                        ] ?? ""
                      }
                      onChange={(
                        event,
                      ) =>
                        handleEffortValueChange(
                          field.key,
                          event.target
                            .value,
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ),
              )}
            </div>

            {effortValueTotal >
              66 && (
              <p className="mt-2 text-sm font-medium text-red-600">
                努力値の合計が66を超えています。
              </p>
            )}
          </section>

          <section className="mt-7">
            <h3 className="font-bold text-slate-900">
              構築内での役割
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              この構築で担当させる役割を選択します。
            </p>

            <div className="mt-4 space-y-5">
              {(
                Object.keys(
                  roleCategoryLabels,
                ) as TeamRoleCategory[]
              ).map(
                (category) => (
                  <div
                    key={category}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {
                        roleCategoryLabels[
                          category
                        ]
                      }
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {teamRoles
                        .filter(
                          (role) =>
                            role.category ===
                            category,
                        )
                        .map(
                          (role) => {
                            const isSelected =
                              formData.roleIds.includes(
                                role.id,
                              );

                            return (
                              <button
                                key={
                                  role.id
                                }
                                type="button"
                                onClick={() =>
                                  toggleRole(
                                    role.id,
                                  )
                                }
                                title={
                                  role.description
                                }
                                className={[
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                                  isSelected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700",
                                ].join(
                                  " ",
                                )}
                              >
                                {isSelected && (
                                  <Check
                                    size={
                                      14
                                    }
                                  />
                                )}

                                {
                                  role.name
                                }
                              </button>
                            );
                          },
                        )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="mt-7">
            <h3 className="font-bold text-slate-900">
              自由タグ
            </h3>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(event) =>
                  setTagInput(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="例：ゲッコウガ対策"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus size={16} />
                追加
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tags
                .length > 0 ? (
                formData.tags.map(
                  (tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                    >
                      {tag}

                      <button
                        type="button"
                        onClick={() =>
                          removeTag(
                            tag,
                          )
                        }
                        className="text-slate-400 transition hover:text-red-600"
                        aria-label={`${tag}を削除`}
                      >
                        <X
                          size={14}
                        />
                      </button>
                    </span>
                  ),
                )
              ) : (
                <span className="text-sm text-slate-400">
                  タグはまだありません。
                </span>
              )}
            </div>
          </section>

          <section className="mt-7">
            <label className="block">
              <span className="font-bold text-slate-900">
                メモ
              </span>

              <textarea
                value={
                  formData.memo ?? ""
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      memo:
                        event.target
                          .value,
                    }),
                  )
                }
                rows={4}
                placeholder="採用理由や選出時の注意点など"
                className="mt-3 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            キャンセル
          </button>

          <button
            type="submit"
            disabled={
              effortValueTotal > 66
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Check size={17} />
            変更を保存
          </button>
        </footer>
      </form>
    </div>
  );
}

export default TeamPokemonEditor;