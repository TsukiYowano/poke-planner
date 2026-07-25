import {
  GitCompareArrows,
  Home,
  LayoutDashboard,
  Settings,
  Sparkles,
  Swords,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
};

const menuItems = [
  {
    label: "ホーム",
    path: "/",
    icon: Home,
  },
  {
    label: "構築",
    path: "/teams",
    icon: LayoutDashboard,
  },
  {
    label: "候補ポケモン",
    path: "/candidates",
    icon: Users,
  },
  {
  label: "あと1匹おすすめ",
  path: "/recommendations",
  icon: Sparkles,
},
  {
    label: "仮想敵・TOP50",
    path: "/rankings",
    icon: Target,
  },
  {
    label: "相性表",
    path: "/matchups",
    icon: Swords,
  },
  {
    label: "入れ替え比較",
    path: "/compare",
    icon: GitCompareArrows,
  },
  {
    label: "タイプ・技範囲",
    path: "/coverage",
    icon: Zap,
  },
];

function Sidebar({
  mode = "desktop",
  onNavigate,
}: SidebarProps) {
  const isDesktop = mode === "desktop";

  return (
    <aside
      className={[
        "w-64 shrink-0 border-r border-slate-200 bg-white",
        "flex h-full flex-col",
        isDesktop ? "hidden lg:flex" : "flex",
      ].join(" ")}
    >
      <div className="border-b border-slate-200 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Pokémon Champions
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          PokéPlanner
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                  "text-left text-sm font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
              "text-left text-sm font-medium transition",
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")
          }
        >
          <Settings size={19} strokeWidth={1.8} />
          <span>設定</span>
        </NavLink>

        <div className="mt-3 rounded-xl bg-slate-100 p-3">
          <p className="text-sm font-semibold text-slate-800">
            TsukiYowano
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            開発中
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;