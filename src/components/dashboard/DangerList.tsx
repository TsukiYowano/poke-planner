import { CircleAlert } from "lucide-react";

const dangerousPokemon = [
  {
    rank: 1,
    name: "メガバシャーモ",
    score: 92,
  },
  {
    rank: 2,
    name: "カバルドン",
    score: 85,
  },
  {
    rank: 3,
    name: "メガギャラドス",
    score: 78,
  },
  {
    rank: 4,
    name: "マスカーニャ",
    score: 72,
  },
  {
    rank: 5,
    name: "メガリザードンY",
    score: 69,
  },
];

function DangerList() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <CircleAlert
            size={19}
            className="text-rose-500"
            strokeWidth={1.8}
          />

          <h3 className="text-lg font-bold text-slate-900">
            要注意TOP5
          </h3>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          現在の構築で対応が薄い仮想敵
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {dangerousPokemon.map((pokemon) => (
          <div
            key={pokemon.name}
            className="flex items-center justify-between px-6 py-3.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                {pokemon.rank}
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {pokemon.name}
              </span>
            </div>

            <span className="text-sm font-bold text-rose-600">
              {pokemon.score}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default DangerList;