import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanner } from "../../context/PlannerContext";

function DashboardHero() {
  const navigate = useNavigate();
  const { currentTeam } = usePlanner();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
  <p className="text-sm font-semibold text-blue-600">
    現在の構築
  </p>

  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
    {currentTeam ? currentTeam.name : "構築がありません"}
  </h2>

  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
    {currentTeam
      ? "仮想敵・候補・評価状況を確認できます。"
      : "構築を作成して、パーティの管理を始めましょう。"}
  </p>
</div>

        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {currentTeam
            ? "現在の構築を開く"
            : "構築を作成する"}

          <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}

export default DashboardHero;