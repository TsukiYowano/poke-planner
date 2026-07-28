import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import CandidateEditor, {
  createCandidateVisibilityUpdateInput,
} from "../components/candidates/CandidateEditor";
import PokemonAutocomplete from "../components/common/PokemonAutocomplete";
import PokemonIcon from "../components/common/PokemonIcon";
import { getPokemonById, pokemonMaster } from "../data/pokemon";
import { getTeamRoleName } from "../data/roles";
import { getPokemonTypeName } from "../data/types";
import { usePlanner } from "../context/PlannerContext";
import type {
  CandidateDeletionImpact,
} from "../persistence/plannerOperations";
import type {
  CandidatePokemon,
  CandidateStatus,
} from "../types/pokemon";

function getStatusLabel(status: CandidateStatus): string {
  switch (status) {
    case "promising":
      return "有力";
    case "considering":
      return "検討中";
    case "on-hold":
      return "保留";
  }
}

function getStatusStyle(status: CandidateStatus): string {
  switch (status) {
    case "promising":
      return "bg-emerald-50 text-emerald-700";
    case "considering":
      return "bg-blue-50 text-blue-700";
    case "on-hold":
      return "bg-slate-100 text-slate-600";
  }
}

type DeletionConfirmation = {
  candidate: CandidatePokemon;
  impact: CandidateDeletionImpact;
};

function CandidatesPage() {
  const {
    plannerData,
    addCandidate,
    updateCandidate,
    getCandidateDeletionImpact,
    deleteCandidate,
    addCandidateToTeam,
    removeTeamPokemon,
    isCandidateInTeam,
  } = usePlanner();
  const candidates = plannerData.candidates;
  const currentTeam = plannerData.teams.find(
    (team) => team.id === plannerData.currentTeamId,
  );

  const [selectedPokemonId, setSelectedPokemonId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [editingCandidate, setEditingCandidate] =
    useState<CandidatePokemon | null>(null);
  const [deletionConfirmation, setDeletionConfirmation] =
    useState<DeletionConfirmation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filteredCandidates = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return candidates;

    return candidates.filter((candidate) => {
      const pokemon = getPokemonById(candidate.pokemonId);
      const searchable = [
        pokemon?.name,
        candidate.pokemonId,
        candidate.label,
        candidate.memo,
        ...candidate.tags,
        ...candidate.roleIds.map(getTeamRoleName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [candidates, searchText]);

  function handleAddCandidate() {
    if (!selectedPokemonId) {
      setMessage("追加するポケモンを選択してください。");
      return;
    }

    const result = addCandidate({ pokemonId: selectedPokemonId });
    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setSelectedPokemonId("");
    setMessage("育成案を追加しました。");
  }

  function handleToggleTeam(candidate: CandidatePokemon) {
    if (isCandidateInTeam(candidate.id)) {
      const teamPokemon = currentTeam?.pokemon.find(
        (item) => item.candidatePokemonId === candidate.id,
      );
      if (teamPokemon) {
        const result = removeTeamPokemon(teamPokemon.id);
        setMessage(
          result.success ? "構築から外しました。" : result.message,
        );
      }
      return;
    }

    const result = addCandidateToTeam(candidate.id);
    setMessage(
      result.success ? "構築へ追加しました。" : result.message,
    );
  }

  function handleToggleMatchupVisibility(candidate: CandidatePokemon) {
    const nextVisible = !candidate.isVisibleInCandidateMatchups;
    const result = updateCandidate(
      createCandidateVisibilityUpdateInput(candidate, nextVisible),
    );
    setMessage(
      result.success
        ? nextVisible
          ? "相性表に表示しました。"
          : "相性表では非表示にしました。評価とメモは保持されます。"
        : result.message,
    );
  }

  function requestCandidateDeletion(candidate: CandidatePokemon) {
    setDeletionConfirmation({
      candidate,
      impact: getCandidateDeletionImpact(candidate.id),
    });
  }

  function confirmCandidateDeletion() {
    if (!deletionConfirmation || isDeleting) return;
    setIsDeleting(true);
    const candidateId = deletionConfirmation.candidate.id;
    const result = deleteCandidate(candidateId);

    if (result.success) {
      if (editingCandidate?.id === candidateId) {
        setEditingCandidate(null);
      }
      setDeletionConfirmation(null);
      setMessage("候補と関連データを削除しました。");
    } else {
      setMessage(result.message);
    }
    setIsDeleting(false);
  }

  return (
    <div>
      <header>
        <p className="text-sm font-semibold text-blue-600">
          候補ライブラリ
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          候補ポケモン
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          同じポケモンでも、型や役割が異なる育成案を個別に管理できます。
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <PokemonAutocomplete
              value={selectedPokemonId}
              onChange={setSelectedPokemonId}
              options={pokemonMaster}
              placeholder="育成案を作成するポケモン"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCandidate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            候補を作成
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
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
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="名前・ラベル・タグ・役割・メモで検索"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="text-sm text-slate-500">
          候補 {candidates.length}件・構築{" "}
          {currentTeam?.pokemon.length ?? 0}/6匹
        </p>
      </div>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCandidates.map((candidate) => {
          const pokemon = getPokemonById(candidate.pokemonId);
          const pokemonName =
            pokemon?.name || candidate.label || candidate.pokemonId;
          const isInTeam = isCandidateInTeam(candidate.id);

          return (
            <article
              key={candidate.id}
              data-candidate-id={candidate.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <PokemonIcon
                    pokemonId={candidate.pokemonId}
                    pokemonName={pokemonName}
                    size={56}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">
                        {pokemonName}
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
                    <p className="mt-1 break-words text-sm font-semibold text-blue-700">
                      {candidate.label}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pokemon?.types
                        .filter(
                          (typeId): typeId is NonNullable<typeof typeId> =>
                            Boolean(typeId),
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
                  onClick={() => setEditingCandidate(candidate)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  aria-label={`${candidate.label}を編集`}
                >
                  <Edit3 size={17} />
                </button>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={candidate.isVisibleInCandidateMatchups}
                aria-label={`${candidate.label}を相性表に表示`}
                onClick={() => handleToggleMatchupVisibility(candidate)}
                className={[
                  "mt-4 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold transition",
                  candidate.isVisibleInCandidateMatchups
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  {candidate.isVisibleInCandidateMatchups ? (
                    <Eye size={16} />
                  ) : (
                    <EyeOff size={16} />
                  )}
                  {candidate.isVisibleInCandidateMatchups
                    ? "相性表に表示"
                    : "相性表では非表示"}
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    "relative h-5 w-9 rounded-full transition",
                    candidate.isVisibleInCandidateMatchups
                      ? "bg-emerald-500"
                      : "bg-slate-300",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                      candidate.isVisibleInCandidateMatchups
                        ? "left-[18px]"
                        : "left-0.5",
                    ].join(" ")}
                  />
                </span>
              </button>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  想定役割
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {candidate.roleIds.length > 0 ? (
                    candidate.roleIds.map((roleId) => (
                      <span
                        key={roleId}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                      >
                        {getTeamRoleName(roleId)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">未設定</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Tags size={13} />
                  タグ
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {candidate.tags.length > 0 ? (
                    candidate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">タグなし</span>
                  )}
                </div>
              </div>

              {candidate.memo ? (
                <p className="mt-4 line-clamp-3 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
                  {candidate.memo}
                </p>
              ) : (
                <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  メモなし
                </p>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTeam(candidate)}
                  className={[
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    isInTeam
                      ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-blue-600 text-white hover:bg-blue-700",
                  ].join(" ")}
                >
                  {isInTeam ? (
                    <>
                      <ArrowUpFromLine size={16} />
                      構築から外す
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine size={16} />
                      構築へ追加
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => requestCandidateDeletion(candidate)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  aria-label={`${candidate.label}を削除`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {filteredCandidates.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold text-slate-700">
            条件に一致する候補はありません。
          </p>
          <p className="mt-1 text-sm text-slate-400">
            上の選択欄から新しい育成案を作成できます。
          </p>
        </div>
      )}

      {editingCandidate && (
        <CandidateEditor
          candidate={editingCandidate}
          onSave={(input) => {
            const result = updateCandidate(input);
            if (result.success) {
              setEditingCandidate(null);
              setMessage("候補を更新しました。");
            } else {
              setMessage(result.message);
            }
          }}
          onClose={() => setEditingCandidate(null)}
        />
      )}

      {deletionConfirmation && (
        <CandidateDeletionDialog
          confirmation={deletionConfirmation}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) setDeletionConfirmation(null);
          }}
          onConfirm={confirmCandidateDeletion}
        />
      )}
    </div>
  );
}

function CandidateDeletionDialog({
  confirmation,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  confirmation: DeletionConfirmation;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { candidate, impact } = confirmation;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-delete-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-600">
              候補削除
            </p>
            <h2
              id="candidate-delete-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              「{candidate.label}」を削除しますか？
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="閉じる"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          この候補を削除すると、{impact.teamCount}
          件の構築で使用されている{impact.teamPokemonCount}
          件の構築内ポケモンと、{impact.matchupCount}
          件の相性データも削除されます。この操作は元に戻せません。
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["利用構築", impact.teamCount],
            ["構築内ポケモン", impact.teamPokemonCount],
            ["相性評価", impact.matchupCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-slate-50 p-3 text-center"
            >
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">
                {value}件
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "削除中…" : "関連データも削除"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidatesPage;
