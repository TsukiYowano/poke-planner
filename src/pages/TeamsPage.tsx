import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Tags,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useLocation } from "react-router-dom";
import TypeBadge from "../components/common/TypeBadge";
import TeamPokemonEditor from "../components/teams/TeamPokemonEditor";
import { getAbilityName } from "../data/abilities";
import { getPokemonById, pokemonMaster } from "../data/pokemon";
import {
  getTeamRole,
  getTeamRoleName,
} from "../data/roles";
import { usePlanner } from "../context/PlannerContext";
import type {
  PokemonTypeId,
  Team,
  TeamPokemon,
  TeamRoleCategory,
  TeamStatus,
} from "../types/pokemon";
import { analyzeTeam } from "../utils/teamAnalysis";
import { analyzeTeamTypeCoverage } from "../utils/teamTypeCoverage";
import { getMoveByName } from "../data/moves";
import PokemonIcon from "../components/common/PokemonIcon";
import PokemonAutocomplete from "../components/common/PokemonAutocomplete";

type TeamModalMode = "create" | "edit";

type TeamModalState = {
  mode: TeamModalMode;
  team?: Team;
};

type TeamFormData = {
  name: string;
  description: string;
  status: TeamStatus;
};

function getStatusLabel(status: TeamStatus): string {
  switch (status) {
    case "active":
      return "使用中";
    case "testing":
      return "試運転";
    case "draft":
      return "作成中";
    case "archived":
      return "保管済み";
  }
}

function getStatusStyle(status: TeamStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "testing":
      return "bg-amber-50 text-amber-700";
    case "draft":
      return "bg-blue-50 text-blue-700";
    case "archived":
      return "bg-slate-100 text-slate-600";
  }
}

function getCategoryLabel(
  category: TeamRoleCategory,
): string {
  switch (category) {
    case "attack":
      return "攻撃";
    case "defense":
      return "耐久";
    case "speed":
      return "速度";
    case "support":
      return "補助";
  }
}

function getCategoryIcon(
  category: TeamRoleCategory,
) {
  switch (category) {
    case "attack":
      return Swords;
    case "defense":
      return Shield;
    case "speed":
      return Zap;
    case "support":
      return Sparkles;
  }
}

const moveTypeClasses: Record<
  PokemonTypeId,
  string
> = {
  normal: "border-slate-200 bg-slate-100",
  fire: "border-red-200 bg-red-50",
  water: "border-blue-200 bg-blue-50",
  electric: "border-yellow-200 bg-yellow-50",
  grass: "border-green-200 bg-green-50",
  ice: "border-cyan-200 bg-cyan-50",
  fighting: "border-orange-200 bg-orange-50",
  poison: "border-purple-200 bg-purple-50",
  ground: "border-amber-200 bg-amber-50",
  flying: "border-sky-200 bg-sky-50",
  psychic: "border-pink-200 bg-pink-50",
  bug: "border-lime-200 bg-lime-50",
  rock: "border-stone-300 bg-stone-100",
  ghost: "border-violet-200 bg-violet-50",
  dragon: "border-indigo-200 bg-indigo-50",
  dark: "border-slate-300 bg-slate-200",
  steel: "border-zinc-300 bg-zinc-100",
  fairy: "border-rose-200 bg-rose-50",
};

function TeamsPage() {
  const location = useLocation();

  const {
    teams,
    currentTeam,
    currentTeamId,
    setCurrentTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    duplicateTeam,
    updateTeamPokemon,
    addPokemonToTeam,
    removePokemonFromTeam,
  } = usePlanner();

  const [
    editingTeamPokemon,
    setEditingTeamPokemon,
  ] = useState<TeamPokemon | null>(null);

  const [teamModal, setTeamModal] =
    useState<TeamModalState | null>(null);

  const [isAddPokemonOpen, setIsAddPokemonOpen] = useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = useState("");
  const [addPokemonMessage, setAddPokemonMessage] = useState<string | null>(null);

  const [teamForm, setTeamForm] =
    useState<TeamFormData>({
      name: "",
      description: "",
      status: "draft",
    });

  const [message, setMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const state = location.state as
      | { openCreateTeam?: boolean }
      | null;

    if (state?.openCreateTeam) {
      openCreateModal();
      window.history.replaceState(
        {},
        document.title,
      );
    }
  }, [location.state]);

  function openCreateModal() {
    setTeamForm({
      name: "",
      description: "",
      status: "draft",
    });

    setTeamModal({
      mode: "create",
    });

    setMessage(null);
  }

  function openEditModal() {
    if (!currentTeam) {
      return;
    }

    setTeamForm({
      name: currentTeam.name,
      description: currentTeam.description ?? "",
      status: currentTeam.status,
    });

    setTeamModal({
      mode: "edit",
      team: currentTeam,
    });

    setMessage(null);
  }

  function closeTeamModal() {
    setTeamModal(null);
  }

  function handleTeamSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!teamForm.name.trim()) {
      setMessage("構築名を入力してください。");
      return;
    }

    if (teamModal?.mode === "create") {
      createTeam({
        name: teamForm.name,
        description: teamForm.description,
        status: teamForm.status,
      });

      closeTeamModal();
      return;
    }

    if (
      teamModal?.mode === "edit" &&
      teamModal.team
    ) {
      const result = updateTeam({
        ...teamModal.team,
        name: teamForm.name.trim(),
        description:
          teamForm.description.trim() || undefined,
        status: teamForm.status,
      });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      closeTeamModal();
    }
  }

  function handleDuplicate() {
    if (!currentTeam) {
      return;
    }

    const result = duplicateTeam(currentTeam.id);

    if (!result.success) {
      window.alert(result.message);
    }
  }

  function handleDelete() {
    if (!currentTeam) {
      return;
    }

    const confirmed = window.confirm(
      `「${currentTeam.name}」を削除しますか？`,
    );

    if (!confirmed) {
      return;
    }

    const result = deleteTeam(currentTeam.id);

    if (!result.success) {
      window.alert(result.message);
    }
  }

  function handleSaveTeamPokemon(
    updatedTeamPokemon: TeamPokemon,
  ) {
    updateTeamPokemon(updatedTeamPokemon);
    setEditingTeamPokemon(null);
  }

  function openAddPokemonModal() {
    setSelectedPokemonId("");
    setAddPokemonMessage(null);
    setIsAddPokemonOpen(true);
  }

  function closeAddPokemonModal() {
    setIsAddPokemonOpen(false);
    setSelectedPokemonId("");
    setAddPokemonMessage(null);
  }

  function handleAddPokemon() {
    if (!selectedPokemonId) {
      setAddPokemonMessage("追加するポケモンを選択してください。");
      return;
    }

    const result = addPokemonToTeam(selectedPokemonId);

    if (!result.success) {
      setAddPokemonMessage(result.message);
      return;
    }

    closeAddPokemonModal();
  }

  function handleRemovePokemon(teamPokemon: TeamPokemon) {
    const pokemon = getPokemonById(teamPokemon.pokemonId);
    const confirmed = window.confirm(
      `${pokemon?.name ?? teamPokemon.pokemonId}を構築から外しますか？`,
    );

    if (!confirmed) {
      return;
    }

    removePokemonFromTeam(teamPokemon.pokemonId);
  }

  if (!currentTeam) {
    return (
      <div>
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            構築がありません
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            新しい構築を作成して、パーティ管理を始めましょう。
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            新しい構築
          </button>

          {teamModal && (
            <TeamModal
              modal={teamModal}
              form={teamForm}
              message={message}
              onFormChange={setTeamForm}
              onSubmit={handleTeamSubmit}
              onClose={closeTeamModal}
            />
          )}
        </div>
      </div>
    );
  }

  const analysis = analyzeTeam(currentTeam);

  const typeCoverage =
    analyzeTeamTypeCoverage(currentTeam);

  const visibleRoles = analysis.roleCounts.filter(
    (role) => role.count > 0,
  );

  return (
    <div>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Team Builder
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              構築
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              ポケモンの型・役割・タグを管理し、構築全体のバランスを確認します。
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            新しい構築
          </button>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <label
                htmlFor="team-selector"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                表示する構築
              </label>

              <div className="relative mt-2 max-w-md">
                <select
                  id="team-selector"
                  value={currentTeamId ?? ""}
                  onChange={(event) =>
                    setCurrentTeam(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {currentTeam.name}
                </h2>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    getStatusStyle(currentTeam.status),
                  ].join(" ")}
                >
                  {getStatusLabel(currentTeam.status)}
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {currentTeam.description ||
                  "説明はまだ登録されていません。"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={16} />
                構築を編集
              </button>

              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Copy size={16} />
                複製
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={16} />
                削除
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {currentTeam.pokemon.map(
                (teamPokemon) => {
                  const pokemon = getPokemonById(
                    teamPokemon.pokemonId,
                  );

                  if (!pokemon) {
                    return null;
                  }

                  return (
                    <article
                      key={teamPokemon.id}
                      className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTeamPokemon(teamPokemon)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemovePokemon(teamPokemon)}
                          className="rounded-lg bg-white p-1.5 text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`${pokemon.name}を構築から外す`}
                          title="構築から外す"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-start gap-3 pr-16">
  <PokemonIcon
    pokemonId={pokemon.id}
    pokemonName={pokemon.name}
    size={56}
  />

  <div className="min-w-0">
    <h3 className="font-bold text-slate-900">
      {pokemon.name}
    </h3>

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
          <TypeBadge
            key={typeId}
            typeId={typeId}
          />
        ))}
    </div>
  </div>
</div>

                      <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex gap-2">
                          <dt className="w-12 shrink-0 text-slate-400">
                            持ち物
                          </dt>

                          <dd className="font-medium text-slate-700">
                            {teamPokemon.item ??
                              "未登録"}
                          </dd>
                        </div>

                        <div className="flex gap-2">
                          <dt className="w-12 shrink-0 text-slate-400">
                            特性
                          </dt>

                          <dd className="font-medium text-slate-700">
                            {teamPokemon.abilityId
                              ? getAbilityName(
                                  teamPokemon.abilityId,
                                )
                              : "未登録"}
                          </dd>
                        </div>

                        <div className="flex gap-2">
                          <dt className="w-12 shrink-0 text-slate-400">
                            性格
                          </dt>

                          <dd className="font-medium text-slate-700">
                            {teamPokemon.nature ??
                              "未登録"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          技
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          {teamPokemon.moves.length >
                          0 ? (
                            teamPokemon.moves.map(
  (moveName, index) => {
    const move =
      getMoveByName(moveName);

    return (
      <span
        key={`${moveName}-${index}`}
        className={[
          "rounded-md border px-2 py-1 text-xs text-slate-700",
          move
            ? moveTypeClasses[move.type]
            : "border-slate-200 bg-white",
        ].join(" ")}
      >
        {moveName}
      </span>
    );
  },
)
                          ) : (
                            <span className="col-span-2 text-xs text-slate-400">
                              技未登録
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          役割
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {teamPokemon.roleIds.length >
                          0 ? (
                            teamPokemon.roleIds.map(
                              (roleId) => {
                                const role =
                                  getTeamRole(roleId);

                                return (
                                  <span
                                    key={roleId}
                                    className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                  >
                                    {role.shortName}
                                  </span>
                                );
                              },
                            )
                          ) : (
                            <span className="text-xs text-slate-400">
                              役割なし
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
                          {teamPokemon.tags.length >
                          0 ? (
                            teamPokemon.tags.map(
                              (tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
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

                      {teamPokemon.memo && (
                        <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                          {teamPokemon.memo}
                        </p>
                      )}
                    </article>
                  );
                },
              )}
            {currentTeam.pokemon.length < 6 && (
              <button
                type="button"
                onClick={openAddPokemonModal}
                className="flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <Plus size={24} />
                </span>
                <span className="mt-3 font-bold">ポケモンを追加</span>
                <span className="mt-1 text-xs">構築は最大6匹まで</span>
              </button>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">
            構築分析
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {analysis.categoryCounts.map(
              (categoryCount) => {
                const Icon = getCategoryIcon(
                  categoryCount.category,
                );

                return (
                  <article
                    key={categoryCount.category}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Icon size={18} />
                      </span>

                      <span className="text-2xl font-bold text-slate-900">
                        {categoryCount.count}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      {getCategoryLabel(
                        categoryCount.category,
                      )}
                      役割
                    </p>
                  </article>
                );
              },
            )}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">
                登録されている役割
              </h3>

              {visibleRoles.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {visibleRoles.map((roleCount) => (
                    <div
                      key={roleCount.roleId}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {getTeamRoleName(
                          roleCount.roleId,
                        )}
                      </span>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                        {roleCount.count}匹
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  役割がまだ登録されていません。
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">
                不足役割
              </h3>

              {analysis.missingImportantRoles.length >
              0 ? (
                <div className="mt-4 space-y-2">
                  {analysis.missingImportantRoles.map(
                    (roleId) => (
                      <div
                        key={roleId}
                        className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
                      >
                        <AlertTriangle
                          size={16}
                          className="shrink-0"
                        />

                        <span>
                          {getTeamRoleName(roleId)}
                          が未登録です
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  主要な役割は一通り登録されています。
                </div>
              )}
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            タイプ耐性分析
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left">
                    タイプ
                  </th>
                  <th className="px-3 py-2 text-center">
                    無効
                  </th>
                  <th className="px-3 py-2 text-center">
                    1/4
                  </th>
                  <th className="px-3 py-2 text-center">
                    1/2
                  </th>
                  <th className="px-3 py-2 text-center">
                    等倍
                  </th>
                  <th className="px-3 py-2 text-center">
                    2倍
                  </th>
                  <th className="px-3 py-2 text-center">
                    4倍
                  </th>
                </tr>
              </thead>

              <tbody>
                {typeCoverage.map((row) => (
                  <tr
                    key={row.attackingType}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-2">
                      <TypeBadge
                        typeId={row.attackingType}
                      />
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.immune}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.quarter}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.half}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.neutral}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.double}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {row.quadruple}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {editingTeamPokemon && (
          <TeamPokemonEditor
            teamPokemon={editingTeamPokemon}
            onSave={handleSaveTeamPokemon}
            onClose={() =>
              setEditingTeamPokemon(null)
            }
          />
        )}

        {isAddPokemonOpen && (
          <AddPokemonModal
            selectedPokemonId={selectedPokemonId}
            options={pokemonMaster.filter(
              (pokemon) =>
                !currentTeam.pokemon.some(
                  (teamPokemon) => teamPokemon.pokemonId === pokemon.id,
                ),
            )}
            message={addPokemonMessage}
            onPokemonChange={setSelectedPokemonId}
            onAdd={handleAddPokemon}
            onClose={closeAddPokemonModal}
          />
        )}

        {teamModal && (
          <TeamModal
            modal={teamModal}
            form={teamForm}
            message={message}
            onFormChange={setTeamForm}
            onSubmit={handleTeamSubmit}
            onClose={closeTeamModal}
          />
        )}
      </div>
  );
}

type AddPokemonModalProps = {
  selectedPokemonId: string;
  options: typeof pokemonMaster;
  message: string | null;
  onPokemonChange: (pokemonId: string) => void;
  onAdd: () => void;
  onClose: () => void;
};

function AddPokemonModal({
  selectedPokemonId,
  options,
  message,
  onPokemonChange,
  onAdd,
  onClose,
}: AddPokemonModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">ポケモンを追加</h2>
            <p className="mt-1 text-sm text-slate-500">
              構築へ直接追加するポケモンを選択します。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <PokemonAutocomplete
            value={selectedPokemonId}
            onChange={onPokemonChange}
            options={options}
            placeholder="ポケモンを検索"
          />
          {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedPokemonId}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            追加する
          </button>
        </div>
      </div>
    </div>
  );
}

type TeamModalProps = {
  modal: TeamModalState;
  form: TeamFormData;
  message: string | null;
  onFormChange: (form: TeamFormData) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onClose: () => void;
};

function TeamModal({
  modal,
  form,
  message,
  onFormChange,
  onSubmit,
  onClose,
}: TeamModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">
            {modal.mode === "create"
              ? "新しい構築"
              : "構築を編集"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-5 p-6">
            {message && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </div>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                構築名
              </span>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  onFormChange({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="例：メガメタグロス軸"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                説明
              </span>

              <textarea
                value={form.description}
                onChange={(event) =>
                  onFormChange({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                rows={4}
                placeholder="構築の狙いやコンセプト"
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                状態
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  onFormChange({
                    ...form,
                    status: event.target
                      .value as TeamStatus,
                  })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="draft">
                  作成中
                </option>
                <option value="testing">
                  試運転
                </option>
                <option value="active">
                  使用中
                </option>
                <option value="archived">
                  保管済み
                </option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {modal.mode === "create"
                ? "作成する"
                : "保存する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamsPage;