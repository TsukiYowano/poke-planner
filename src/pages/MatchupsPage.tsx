import { Search, Swords, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usePlanner } from "../context/PlannerContext";
import { getPokemonById } from "../data/pokemon";
import type { MatchupRating } from "../types/pokemon";

const ratingOrder: MatchupRating[] = [
  "unrated",
  "very-good",
  "good",
  "even",
  "bad",
  "very-bad",
];

const ratingConfig: Record<
  MatchupRating,
  { label: string; title: string; className: string; score: number }
> = {
  "very-good": {
    label: "◎",
    title: "明確に有利",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
    score: 4,
  },
  good: {
    label: "○",
    title: "有利",
    className: "border-blue-300 bg-blue-100 text-blue-800",
    score: 3,
  },
  even: {
    label: "△",
    title: "五分・要注意",
    className: "border-amber-300 bg-amber-100 text-amber-800",
    score: 2,
  },
  bad: {
    label: "×",
    title: "不利",
    className: "border-orange-300 bg-orange-100 text-orange-800",
    score: 1,
  },
  "very-bad": {
    label: "××",
    title: "明確に不利",
    className: "border-red-300 bg-red-100 text-red-800",
    score: 0,
  },
  unrated: {
    label: "－",
    title: "未評価",
    className: "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
    score: 0,
  },
};

function MatchupsPage() {
  const {
    currentTeam,
    rankingSet,
    matchups,
    setMatchupRating,
    updateMatchupMemo,
  } = usePlanner();

  const [searchText, setSearchText] = useState("");
  const [editingCell, setEditingCell] = useState<{
    teamPokemonId: string;
    rankingEntryId: string;
  } | null>(null);

  const teamPokemon = currentTeam?.pokemon ?? [];

  const entries = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return [...rankingSet.entries]
      .sort((a, b) => a.rank - b.rank)
      .filter((entry) => {
        if (!query) return true;
        const pokemon = getPokemonById(entry.pokemonId);
        return [pokemon?.name, entry.memo, ...entry.tags, ...entry.assumedMoves]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [rankingSet.entries, searchText]);

  function findMatchup(teamPokemonId: string, rankingEntryId: string) {
    return matchups.find(
      (matchup) =>
        matchup.teamPokemonId === teamPokemonId &&
        matchup.rankingEntryId === rankingEntryId,
    );
  }

  function cycleRating(teamPokemonId: string, rankingEntryId: string) {
    const currentRating =
      findMatchup(teamPokemonId, rankingEntryId)?.rating ?? "unrated";
    const nextIndex = (ratingOrder.indexOf(currentRating) + 1) % ratingOrder.length;
    setMatchupRating(teamPokemonId, rankingEntryId, ratingOrder[nextIndex]);
  }

  function getEnemySummary(rankingEntryId: string) {
    const ratings = teamPokemon.map(
      (pokemon) => findMatchup(pokemon.id, rankingEntryId)?.rating ?? "unrated",
    );
    const rated = ratings.filter((rating) => rating !== "unrated");
    const goodCount = ratings.filter(
      (rating) => rating === "very-good" || rating === "good",
    ).length;
    const best = rated.sort(
      (a, b) => ratingConfig[b].score - ratingConfig[a].score,
    )[0];

    return {
      goodCount,
      best: best ?? "unrated",
    };
  }

  if (!currentTeam) {
    return <EmptyState message="構築が登録されていません。" />;
  }

  if (teamPokemon.length === 0) {
    return <EmptyState message="相性を評価する構築ポケモンがいません。" />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Swords size={17} /> MATCHUP MATRIX
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            相性表
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            仮想敵と構築ポケモンの対面評価をクリックで記録します。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(["very-good", "good", "even", "bad", "very-bad"] as MatchupRating[]).map(
            (rating) => (
              <span
                key={rating}
                className={`rounded-lg border px-2.5 py-1.5 ${ratingConfig[rating].className}`}
              >
                {ratingConfig[rating].label} {ratingConfig[rating].title}
              </span>
            ),
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">{currentTeam.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              評価ボタンを押すと「－ → ◎ → ○ → △ → × → ××」の順で切り替わります。
            </p>
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
              placeholder="仮想敵を検索"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
            />
          </div>
        </div>

        {rankingSet.entries.length === 0 ? (
          <EmptyState message="先に仮想敵・TOP50ページで仮想敵を登録してください。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <th className="sticky left-0 z-20 min-w-56 border-b border-r border-slate-200 bg-slate-50 px-4 py-3">
                    順位・仮想敵
                  </th>
                  {teamPokemon.map((teamMember) => {
                    const pokemon = getPokemonById(teamMember.pokemonId);
                    return (
                      <th
                        key={teamMember.id}
                        className="min-w-32 border-b border-r border-slate-200 px-3 py-3 text-center"
                      >
                        <span className="block text-sm font-bold text-slate-800">
                          {pokemon?.name ?? teamMember.pokemonId}
                        </span>
                        <span className="mt-1 block font-normal text-slate-400">
                          {teamMember.item || "持ち物未設定"}
                        </span>
                      </th>
                    );
                  })}
                  <th className="min-w-28 border-b border-slate-200 px-3 py-3 text-center">
                    担当数
                  </th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry) => {
                  const enemy = getPokemonById(entry.pokemonId);
                  const summary = getEnemySummary(entry.id);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {entry.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {enemy?.name ?? entry.pokemonId}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {entry.assumedMoves.length
                                ? entry.assumedMoves.join(" / ")
                                : "想定技未設定"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {teamPokemon.map((teamMember) => {
                        const matchup = findMatchup(teamMember.id, entry.id);
                        const rating = matchup?.rating ?? "unrated";
                        const config = ratingConfig[rating];

                        return (
                          <td
                            key={teamMember.id}
                            className="border-b border-r border-slate-200 px-3 py-3 text-center"
                          >
                            <button
                              type="button"
                              title={`${config.title}。右クリックでメモ編集`}
                              onClick={() => cycleRating(teamMember.id, entry.id)}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                setEditingCell({
                                  teamPokemonId: teamMember.id,
                                  rankingEntryId: entry.id,
                                });
                              }}
                              className={`inline-flex h-10 min-w-12 items-center justify-center rounded-lg border px-3 text-base font-bold transition ${config.className}`}
                            >
                              {config.label}
                            </button>
                            {matchup?.memo && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCell({
                                    teamPokemonId: teamMember.id,
                                    rankingEntryId: entry.id,
                                  })
                                }
                                className="mt-1 block w-full truncate text-[11px] text-blue-600 hover:underline"
                              >
                                メモあり
                              </button>
                            )}
                          </td>
                        );
                      })}

                      <td className="border-b border-slate-200 px-3 py-3 text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {summary.goodCount}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          ○以上 / {teamPokemon.length}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${ratingConfig[summary.best].className}`}
                        >
                          最良 {ratingConfig[summary.best].label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingCell && (
        <MemoDialog
          memo={
            findMatchup(editingCell.teamPokemonId, editingCell.rankingEntryId)
              ?.memo ?? ""
          }
          onSave={(memo) => {
            updateMatchupMemo(
              editingCell.teamPokemonId,
              editingCell.rankingEntryId,
              memo,
            );
            setEditingCell(null);
          }}
          onClose={() => setEditingCell(null)}
        />
      )}
    </div>
  );
}

function MemoDialog({
  memo,
  onSave,
  onClose,
}: {
  memo: string;
  onSave: (memo: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(memo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">対面メモ</h2>
          <p className="mt-1 text-sm text-slate-500">
            勝ち筋、注意する技、立ち回りなどを記録できます。
          </p>
        </div>
        <div className="p-6">
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={6}
            placeholder="例：冷凍パンチ圏内まで削って処理。地震持ちに注意。"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
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
            onClick={() => onSave(draft.trim())}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <Table2 size={40} className="mx-auto text-slate-300" />
      <p className="mt-4 font-semibold text-slate-800">{message}</p>
    </div>
  );
}

export default MatchupsPage;
