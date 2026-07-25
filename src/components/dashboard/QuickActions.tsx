import {
  Plus,
  Swords,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type QuickAction = {
  label: string;
  icon: LucideIcon;
  path: string;
  state?: Record<string, unknown>;
};

const quickActions: QuickAction[] = [
  {
    label: "構築を作成",
    icon: Plus,
    path: "/teams",
    state: {
      openCreateTeam: true,
    },
  },
  {
    label: "候補を追加",
    icon: Users,
    path: "/candidates",
  },
  {
    label: "TOP50を編集",
    icon: Target,
    path: "/rankings",
  },
  {
    label: "相性表を開く",
    icon: Swords,
    path: "/matchups",
  },
];

function QuickActions() {
  const navigate = useNavigate();

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-bold text-slate-900">
          クイック操作
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          よく使う機能へ移動
        </p>
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={() =>
                navigate(action.path, {
                  state: action.state,
                })
              }
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Icon size={18} strokeWidth={1.8} />
              {action.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default QuickActions;