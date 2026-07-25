import { Plus } from "lucide-react";

function DashboardHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <div>
          <p className="text-sm font-medium text-slate-500">
            ダッシュボード
          </p>

          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            ホーム
          </h2>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          新しい構築
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;