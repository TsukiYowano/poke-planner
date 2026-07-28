import { useEffect, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { getAbilityName } from "../../data/abilities";
import { getPokemonById } from "../../data/pokemon";
import type {
  CandidatePokemon,
  EffortValues,
  TeamPokemon,
} from "../../types/pokemon";
import type { TeamPokemonChanges } from "../../persistence/plannerOperations";
import MoveAutocomplete from "../common/MoveAutocomplete";

type TeamPokemonEditorProps = {
  teamPokemon: TeamPokemon;
  candidate: CandidatePokemon;
  onSave: (changes: TeamPokemonChanges) => void;
  onClose: () => void;
};

const effortValueFields: {
  key: keyof EffortValues;
  label: string;
}[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "攻撃" },
  { key: "defense", label: "防御" },
  { key: "specialAttack", label: "特攻" },
  { key: "specialDefense", label: "特防" },
  { key: "speed", label: "素早さ" },
];

function fourMoves(moves: string[]): string[] {
  return Array.from({ length: 4 }, (_, index) => moves[index] ?? "");
}

function TeamPokemonEditor({
  teamPokemon,
  candidate,
  onSave,
  onClose,
}: TeamPokemonEditorProps) {
  const pokemon = getPokemonById(candidate.pokemonId);
  const [formData, setFormData] = useState<TeamPokemonChanges>({
    nickname: teamPokemon.nickname,
    abilityId: teamPokemon.abilityId,
    item: teamPokemon.item,
    nature: teamPokemon.nature,
    moves: fourMoves(teamPokemon.moves),
    effortValues: teamPokemon.effortValues
      ? { ...teamPokemon.effortValues }
      : {},
    memo: teamPokemon.memo,
  });
  const effortValueTotal = Object.values(
    formData.effortValues ?? {},
  ).reduce((total, value) => total + (value ?? 0), 0);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      nickname: formData.nickname?.trim() || undefined,
      abilityId: formData.abilityId,
      item: formData.item?.trim() || undefined,
      nature: formData.nature?.trim() || undefined,
      moves: formData.moves.map((move) => move.trim()).filter(Boolean),
      effortValues: formData.effortValues,
      memo: formData.memo?.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Team Pokémon Editor
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {pokemon?.name ?? candidate.label} / {candidate.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                ニックネーム
              </span>
              <input
                value={formData.nickname ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    nickname: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                特性
              </span>
              <select
                value={formData.abilityId ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    abilityId: event.target.value || undefined,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">未設定</option>
                {pokemon?.abilityIds.map((abilityId) => (
                  <option key={abilityId} value={abilityId}>
                    {getAbilityName(abilityId)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                持ち物
              </span>
              <input
                value={formData.item ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    item: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                性格
              </span>
              <input
                value={formData.nature ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    nature: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <section className="mt-7">
            <h3 className="font-bold text-slate-900">技構成</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {fourMoves(formData.moves).map((move, index) => (
                <MoveAutocomplete
                  key={index}
                  value={move}
                  onChange={(value) =>
                    setFormData((current) => {
                      const moves = fourMoves(current.moves);
                      moves[index] = value;
                      return { ...current, moves };
                    })
                  }
                  placeholder={`技${index + 1}`}
                />
              ))}
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">努力値</h3>
              <span
                className={
                  effortValueTotal > 66
                    ? "text-sm font-bold text-red-600"
                    : "text-sm text-slate-500"
                }
              >
                合計 {effortValueTotal}/66
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {effortValueFields.map((field) => (
                <label key={field.key}>
                  <span className="text-xs font-semibold text-slate-600">
                    {field.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={32}
                    value={formData.effortValues?.[field.key] ?? ""}
                    onChange={(event) => {
                      const value =
                        event.target.value === ""
                          ? undefined
                          : Math.max(
                              0,
                              Math.min(32, Number(event.target.value)),
                            );
                      setFormData((current) => ({
                        ...current,
                        effortValues: {
                          ...current.effortValues,
                          [field.key]: value,
                        },
                      }));
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <label>
              <span className="font-bold text-slate-900">構築内メモ</span>
              <textarea
                value={formData.memo ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    memo: event.target.value,
                  }))
                }
                rows={4}
                className="mt-3 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6"
              />
            </label>
          </section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={effortValueTotal > 66}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            <Check size={17} />変更を保存
          </button>
        </footer>
      </form>
    </div>
  );
}

export default TeamPokemonEditor;
