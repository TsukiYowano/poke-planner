import {
  Edit3,
  Plus,
  Search,
  Tags,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { usePlanner } from "../context/PlannerContext";
import { getAbilityName } from "../data/abilities";
import { getPokemonById, pokemonMaster } from "../data/pokemon";
import { getTeamRoleName, teamRoles } from "../data/roles";
import { getPokemonTypeName } from "../data/types";
import type { RankingEntry, TeamRoleId } from "../types/pokemon";
import PokemonAutocomplete from "../components/common/PokemonAutocomplete";

function RankingsPage() {
  const {
    rankingSet,
    addRankingEntry,
    updateRankingEntry,
    removeRankingEntry,
  } = usePlanner();

  const [selectedPokemonId, setSelectedPokemonId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [editingEntry, setEditingEntry] = useState<RankingEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const availablePokemon = useMemo(
    () =>
      pokemonMaster.filter(
        (pokemon) =>
          pokemon.isAvailableInChampions &&
          !rankingSet.entries.some((entry) => entry.pokemonId === pokemon.id),
      ),
    [rankingSet.entries],
  );

  const visibleEntries = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return [...rankingSet.entries]
      .sort((a, b) => a.rank - b.rank)
      .filter((entry) => {
        if (!query) {
          return true;
        }

        const pokemon = getPokemonById(entry.pokemonId);
        const text = [
          pokemon?.name,
          entry.memo,
          ...entry.assumedMoves,
          ...entry.tags,
          ...entry.roleIds.map(getTeamRoleName),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      });
  }, [rankingSet.entries, searchText]);

  function handleAdd() {
    if (!selectedPokemonId) {
      setMessage("追加するポケモンを選択してください。");
      return;
    }

    const result = addRankingEntry(selectedPokemonId);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setSelectedPokemonId("");
    setMessage("仮想敵へ追加しました。");
  }

  function handleDelete(entry: RankingEntry) {
    const pokemon = getPokemonById(entry.pokemonId);

    if (!window.confirm(`${pokemon?.name ?? "このポケモン"}を削除しますか？`)) {
      return;
    }

    removeRankingEntry(entry.id);
    setMessage("仮想敵から削除しました。");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Trophy size={17} />
            META RANKING
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            仮想敵・TOP50
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            環境で意識するポケモンと想定する型を管理します。
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">登録数</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {rankingSet.entries.length}
            <span className="ml-1 text-sm font-medium text-slate-500">/ 50</span>
          </p>
        </div>
      </header>

      {message && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">仮想敵を追加</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
  <PokemonAutocomplete
    value={selectedPokemonId}
    onChange={setSelectedPokemonId}
    options={availablePokemon}
    placeholder="ポケモンを検索"
  />
</div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={rankingSet.entries.length >= 50}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Plus size={17} />
            追加
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">登録済み仮想敵</h2>
            <p className="mt-1 text-sm text-slate-500">順位、想定技、役割などを編集できます。</p>
          </div>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="名前・技・タグで検索"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
            />
          </div>
        </div>

        {visibleEntries.length ? (
          <div className="divide-y divide-slate-200">
            {visibleEntries.map((entry) => (
              <RankingRow
                key={entry.id}
                entry={entry}
                onEdit={() => setEditingEntry(entry)}
                onDelete={() => handleDelete(entry)}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-slate-500">
            <Trophy size={38} className="mx-auto text-slate-300" />
            <p className="mt-4 font-semibold text-slate-800">仮想敵が登録されていません</p>
            <p className="mt-1 text-sm">上のフォームから追加してください。</p>
          </div>
        )}
      </section>

      {editingEntry && (
        <RankingEntryEditor
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={(entry) => {
            updateRankingEntry(entry);
            setEditingEntry(null);
            setMessage("仮想敵を更新しました。");
          }}
        />
      )}
    </div>
  );
}

function RankingRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: RankingEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pokemon = getPokemonById(entry.pokemonId);

  if (!pokemon) {
    return null;
  }

  return (
    <article className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {entry.rank}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">{pokemon.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {pokemon.types.filter(Boolean).map((typeId) => (
                <span
                  key={typeId}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                >
                  {getPokemonTypeName(typeId!)}
                </span>
              ))}
              {entry.roleIds.map((roleId) => (
                <span
                  key={roleId}
                  className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
                >
                  {getTeamRoleName(roleId)}
                </span>
              ))}
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit3 size={16} />
            編集
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            削除
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBox
          label="想定特性"
          value={entry.assumedAbilityId ? getAbilityName(entry.assumedAbilityId) : "未設定"}
        />
        <InfoBox
          label="想定技"
          value={entry.assumedMoves.length ? entry.assumedMoves.join(" / ") : "未設定"}
        />
        <InfoBox label="メモ" value={entry.memo || "未設定"} />
      </div>
    </article>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{value}</p>
    </div>
  );
}

function RankingEntryEditor({
  entry,
  onSave,
  onClose,
}: {
  entry: RankingEntry;
  onSave: (entry: RankingEntry) => void;
  onClose: () => void;
}) {
  const pokemon = getPokemonById(entry.pokemonId);
  const [draft, setDraft] = useState<RankingEntry>({
    ...entry,
    assumedMoves: [...entry.assumedMoves],
    roleIds: [...entry.roleIds],
    tags: [...entry.tags],
  });
  const [movesText, setMovesText] = useState(entry.assumedMoves.join("\n"));
  const [tagsText, setTagsText] = useState(entry.tags.join(", "));

  function toggleRole(roleId: TeamRoleId) {
    setDraft((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  }

  function handleSubmit() {
    onSave({
      ...draft,
      rank: Math.max(1, Math.min(50, draft.rank)),
      assumedMoves: movesText
        .split("\n")
        .map((move) => move.trim())
        .filter(Boolean),
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold text-blue-600">仮想敵編集</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {pokemon?.name ?? entry.pokemonId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <Field label="順位">
            <input
              type="number"
              min={1}
              max={50}
              value={draft.rank}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  rank: Number(event.target.value) || 1,
                }))
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field label="想定特性">
            <select
              value={draft.assumedAbilityId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  assumedAbilityId: event.target.value || undefined,
                }))
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">未設定</option>
              {pokemon?.abilityIds.map((abilityId) => (
                <option key={abilityId} value={abilityId}>
                  {getAbilityName(abilityId)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="想定技">
            <textarea
              value={movesText}
              onChange={(event) => setMovesText(event.target.value)}
              rows={5}
              placeholder={"じしん\nステルスロック\nドラゴンテール"}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-500">1行につき1つ入力します。</p>
          </Field>

          <div>
            <p className="text-sm font-semibold text-slate-700">役割</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {teamRoles.map((role) => {
                const selected = draft.roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="タグ" icon={<Tags size={16} />}>
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="先発, ステロ, 要警戒"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-500">カンマ区切りで入力します。</p>
          </Field>

          <Field label="メモ">
            <textarea
              value={draft.memo ?? ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, memo: event.target.value }))
              }
              rows={4}
              placeholder="対策時に意識することなど"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

export default RankingsPage;
