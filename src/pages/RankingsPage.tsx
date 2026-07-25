import {
  Edit3,
  Search,
  Tags,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { usePlanner } from "../context/PlannerContext";
import { getAbilityName } from "../data/abilities";
import { getPokemonById } from "../data/pokemon";
import { getTeamRoleName, teamRoles } from "../data/roles";
import {
  getPokemonTypeName,
  getPokemonTypeBadgeClass,
} from "../data/types";
import type { RankingEntry, TeamRoleId } from "../types/pokemon";
import MoveAutocomplete, {
  getMoveByName,
} from "../components/common/MoveAutocomplete";
import PokemonIcon from "../components/common/PokemonIcon";

function RankingsPage() {
  const {
  rankingSet,
  updateRankingEntry,
} = usePlanner();

  const [searchText, setSearchText] = useState("");
  const [editingEntry, setEditingEntry] = useState<RankingEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
}: {
  entry: RankingEntry;
  onEdit: () => void;
}) {
  const pokemon = getPokemonById(entry.pokemonId);

  if (!pokemon) {
    return null;
  }

  const assumedMoves = entry.assumedMoves.filter(
    (move) => move.trim().length > 0,
  );

  return (
    <article className="px-5 py-4 transition hover:bg-slate-50/70">
      <div className="grid gap-4 lg:grid-cols-[44px_minmax(220px,320px)_minmax(0,1fr)_auto] lg:items-center">
        {/* 順位 */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
          {entry.rank}
        </div>

        {/* ポケモン名・タイプ・役割 */}
        <div className="flex min-w-0 items-center gap-3">
  <PokemonIcon
    pokemonId={pokemon.id}
    pokemonName={pokemon.name}
    size={56}
  />

  <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-lg font-bold text-slate-900">
        {pokemon.name}
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {pokemon.types.map((typeId) =>
          typeId ? (
            <span
              key={typeId}
              className={getPokemonTypeBadgeClass(
                typeId,
              )}
            >
              {getPokemonTypeName(typeId)}
            </span>
          ) : null,
        )}
      </div>
    </div>

    <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
      {entry.roleIds.length > 0 ? (
        entry.roleIds.map((roleId) => (
          <span
            key={roleId}
            className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
          >
            {getTeamRoleName(roleId)}
          </span>
        ))
      ) : (
        <span className="text-xs text-slate-400">
          役割未設定
        </span>
      )}

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

        {/* 想定特性・想定技 */}
        <div className="grid min-w-0 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-slate-400">
              想定特性
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {entry.assumedAbilityId
                ? getAbilityName(
                    entry.assumedAbilityId,
                  )
                : "未設定"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400">
              想定技
            </p>

            <div className="mt-1 flex flex-wrap gap-1.5">
              {assumedMoves.length > 0 ? (
                assumedMoves.map(
                  (moveName, index) => {
                    const move =
                      getMoveByName(moveName);

                    return (
                      <span
                        key={`${moveName}-${index}`}
                        className={
                          move
                            ? getPokemonTypeBadgeClass(
                                move.type,
                              )
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {moveName}
                      </span>
                    );
                  },
                )
              ) : (
                <span className="text-sm text-slate-400">
                  未設定
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 編集ボタン */}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Edit3 size={16} />
          編集
        </button>
      </div>
    </article>
  );
}

function normalizeMoveList(moves: string[]): string[] {
  return Array.from(
    { length: 4 },
    (_, index) => moves[index] ?? "",
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
  const [tagsText, setTagsText] = useState(entry.tags.join(", "));

  function toggleRole(roleId: TeamRoleId) {
    setDraft((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  }

  function handleMoveChange(
  index: number,
  value: string,
) {
  setDraft((current) => {
    const assumedMoves = normalizeMoveList(
      current.assumedMoves,
    );

    assumedMoves[index] = value;

    return {
      ...current,
      assumedMoves,
    };
  });
}

  function handleSubmit() {
  onSave({
    ...draft,
    assumedMoves: draft.assumedMoves
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
  <div className="mt-2 grid gap-3 sm:grid-cols-2">
    {normalizeMoveList(
      draft.assumedMoves,
    ).map((move, index) => (
      <label
        key={index}
        className="block"
      >
        <span className="text-xs font-semibold text-slate-500">
          技 {index + 1}
        </span>

        <div className="mt-1.5">
  <MoveAutocomplete
    value={move}
    onChange={(value) =>
      handleMoveChange(index, value)
    }
  />
</div>
      </label>
    ))}
  </div>
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
