import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanner } from "../../context/PlannerContext";

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.floor(
    (startOfToday.getTime() -
      startOfTarget.getTime()) /
      86_400_000,
  );

  if (diffDays === 0) {
    return "今日";
  }

  if (diffDays === 1) {
    return "昨日";
  }

  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays}日前`;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function RecentTeams() {
  const navigate = useNavigate();

  const {
    teams,
    currentTeamId,
    setCurrentTeam,
  } = usePlanner();

  const recentTeams = [...teams]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  function handleOpen(teamId: string) {
    setCurrentTeam(teamId);
    navigate("/teams");
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            最近の構築
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            最近編集した構築
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          すべて見る
        </button>
      </div>

      {recentTeams.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {recentTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => handleOpen(team.id)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {team.name}
                  </p>

                  {team.id === currentTeamId && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      選択中
                    </span>
                  )}
                </div>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {team.description ||
                    `${team.pokemon.length}匹登録`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-slate-400">
                  {formatUpdatedAt(team.updatedAt)}
                </span>

                <ChevronRight
                  size={17}
                  className="text-slate-400"
                />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8 text-center text-sm text-slate-500">
          構築がまだありません。
        </div>
      )}
    </article>
  );
}

export default RecentTeams;