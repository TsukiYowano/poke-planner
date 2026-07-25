import { ShieldCheck } from "lucide-react";

function DummyDataNotice() {
  return (
    <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck
          size={22}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p className="text-sm font-bold text-blue-900">
            現在はダミーデータです
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            この次の段階で、構築・候補・仮想敵の実データと接続します。
          </p>
        </div>
      </div>
    </section>
  );
}

export default DummyDataNotice;