import { useEffect, useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { getPokemonById } from "../../data/pokemon";
import { teamRoles } from "../../data/roles";
import type {
  CandidatePokemon,
  CandidateStatus,
  TeamRoleCategory,
  TeamRoleId,
} from "../../types/pokemon";
import type { UpdateCandidateInput } from "../../persistence/plannerOperations";

type CandidateEditorProps = {
  candidate: CandidatePokemon;
  onSave: (candidate: UpdateCandidateInput) => void;
  onClose: () => void;
};

const statusOptions: { value: CandidateStatus; label: string }[] = [
  { value: "considering", label: "検討中" },
  { value: "promising", label: "有力" },
  { value: "on-hold", label: "保留" },
];

const roleCategoryLabels: Record<TeamRoleCategory, string> = {
  attack: "攻撃",
  defense: "耐久",
  speed: "速度",
  support: "補助",
};

export function createCandidateUpdateInput(
  candidate: CandidatePokemon,
): UpdateCandidateInput {
  return {
    id: candidate.id,
    label: candidate.label,
    status: candidate.status,
    roleIds: [...candidate.roleIds],
    tags: [...candidate.tags],
    memo: candidate.memo,
    isVisibleInCandidateMatchups:
      candidate.isVisibleInCandidateMatchups,
  };
}

export function createCandidateVisibilityUpdateInput(
  candidate: CandidatePokemon,
  isVisibleInCandidateMatchups: boolean,
): UpdateCandidateInput {
  return {
    ...createCandidateUpdateInput(candidate),
    isVisibleInCandidateMatchups,
  };
}

function CandidateEditor({
  candidate,
  onSave,
  onClose,
}: CandidateEditorProps) {
  const [formData, setFormData] = useState<UpdateCandidateInput>(() =>
    createCandidateUpdateInput(candidate),
  );
  const [tagInput, setTagInput] = useState("");
  const pokemon = getPokemonById(candidate.pokemonId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  function toggleRole(roleId: TeamRoleId) {
    setFormData((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  }

  function addTag() {
    const newTags = tagInput
      .split(/[,、]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (newTags.length === 0) return;

    setFormData((current) => ({
      ...current,
      tags: Array.from(
        new Set([
          ...current.tags.map((tag) => tag.trim()).filter(Boolean),
          ...newTags,
        ]),
      ),
    }));
    setTagInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...formData,
      label: formData.label.trim() || candidate.label,
      tags: Array.from(
        new Set(formData.tags.map((tag) => tag.trim()).filter(Boolean)),
      ),
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
        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              候補編集
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {pokemon?.name ?? candidate.label ?? candidate.pokemonId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                育成案ラベル
              </span>
              <input
                value={formData.label}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                検討状況
              </span>
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    status: event.target.value as CandidateStatus,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={formData.isVisibleInCandidateMatchups}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  isVisibleInCandidateMatchups: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                候補ポケモン相性表に表示する
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                候補一覧モードの相性表へ表示する育成案として扱います。
              </span>
            </span>
          </label>

          <section className="mt-7">
            <h3 className="font-bold text-slate-900">想定する役割</h3>
            <div className="mt-4 space-y-5">
              {(Object.keys(roleCategoryLabels) as TeamRoleCategory[]).map(
                (category) => (
                  <div key={category}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {roleCategoryLabels[category]}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {teamRoles
                        .filter((role) => role.category === category)
                        .map((role) => {
                          const selected = formData.roleIds.includes(role.id);
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => toggleRole(role.id)}
                              className={[
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300",
                              ].join(" ")}
                            >
                              {selected && <Check size={14} />}
                              {role.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="mt-7">
            <h3 className="font-bold text-slate-900">タグ</h3>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="例：カバルドン対策"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} />追加
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        tags: current.tags.filter((item) => item !== tag),
                      }))
                    }
                    aria-label={`${tag}を削除`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <label>
              <span className="font-bold text-slate-900">検討メモ</span>
              <textarea
                value={formData.memo ?? ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    memo: event.target.value,
                  }))
                }
                rows={5}
                placeholder="採用するメリット、気になる点、仮想敵など"
                className="mt-3 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Check size={17} />保存
          </button>
        </footer>
      </form>
    </div>
  );
}

export default CandidateEditor;
