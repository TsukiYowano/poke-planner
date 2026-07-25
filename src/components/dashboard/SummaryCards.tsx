import {
  CircleAlert,
  ListFilter,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

type SummaryCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
};

const summaryCards: SummaryCard[] = [
  {
    label: "候補ポケモン",
    value: "18",
    note: "登録済み",
    icon: Users,
  },
  {
    label: "仮想敵",
    value: "50",
    note: "TOP50",
    icon: Target,
  },
  {
    label: "危険な相手",
    value: "7",
    note: "要対策",
    icon: CircleAlert,
  },
  {
    label: "未評価",
    value: "42",
    note: "相性セル",
    icon: ListFilter,
  },
];

function SummaryCards() {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </span>

                  <span className="pb-1 text-sm text-slate-400">
                    {card.note}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Icon size={20} strokeWidth={1.8} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default SummaryCards;