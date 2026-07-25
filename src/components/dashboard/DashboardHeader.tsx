import { Plus } from "lucide-react";

function DashboardHeader() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Dashboard
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          ホーム
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          現在の構築や環境データを確認し、対戦準備を進めましょう。
        </p>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus size={18} />
        新しい構築
      </button>
    </header>
  );
}

export default DashboardHeader;