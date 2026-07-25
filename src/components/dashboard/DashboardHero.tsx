import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanner } from "../../context/PlannerContext";

function DashboardHero() {
  const navigate = useNavigate();
  const { currentTeam } = usePlanner();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            おかえりなさい
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            構築の状態を確認しましょう
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            {currentTeam
              ? `現在は「${currentTeam.name}」を編集中です。仮想敵への対応状況や未評価データを確認できます。`
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