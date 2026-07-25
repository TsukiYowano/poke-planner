import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TypeBadge from "../common/TypeBadge";
import { usePlanner } from "../../context/PlannerContext";
import { getPokemonById } from "../../data/pokemon";

function getStatusLabel(
  status: "draft" | "testing" | "active" | "archived",
): string {
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

function getStatusStyle(
  status: "draft" | "testing" | "active" | "archived",
): string {
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

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function CurrentTeamCard() {
  const navigate = useNavigate();
  const { currentTeam } = usePlanner();

  if (!currentTeam) {
    return (
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          現在の構築
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          構築が登録されていません。
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/teams", {
              state: {
                openCreateTeam: true,
              },
            })
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          新しい構築を作成
          <ChevronRight size={17} />
        </button>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <p className="text-sm font-medium text-slate-500">
            現在の構築
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {currentTeam.name}
          </h3>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            getStatusStyle(currentTeam.status),
          ].join(" ")}
        >
          {getStatusLabel(currentTeam.status)}
        </span>
      </div>

      <div className="p-6">
        {currentTeam.pokemon.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentTeam.pokemon.map((teamPokemon) => {
              const pokemon = getPokemonById(
                teamPokemon.pokemonId,
              );

              if (!pokemon) {
                return null;
              }

              return (
                <button
                  key={teamPokemon.id}
                  type="button"
                  onClick={() => navigate("/teams")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {pokemon.name}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
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
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            ポケモンがまだ登録されていません。
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 px-3 py-1">
              {currentTeam.pokemon.length}匹登録済み
            </span>

            <span className="rounded-full border border-slate-200 px-3 py-1">
              最終更新：
              {formatUpdatedAt(currentTeam.updatedAt)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/teams")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            詳細を開く
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default CurrentTeamCard;