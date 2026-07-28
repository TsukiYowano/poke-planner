import {
  Download,
  LogIn,
  LogOut,
  RotateCcw,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { usePlanner } from "../context/PlannerContext";
import { importTop50 } from "../repositories/Top50Repository";

function SettingsPage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const top50InputRef =
  useRef<HTMLInputElement | null>(null);

  const {
    plannerData,
    exportPlannerData,
    importPlannerData,
    resetPlannerData,
  } = usePlanner();
  const { teams, candidates, rankingSet, matchups } = plannerData;

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState("");

  const isAdmin =
  user?.email === "takeru.poke.genger@gmail.com";

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setAuthError(error.message);
        return;
      }

      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleGoogleLogin() {
    setAuthError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    setAuthError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
    }
  }

  function handleExport() {
    const json = exportPlannerData();

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    const dateText = new Date()
      .toISOString()
      .slice(0, 10);

    anchor.href = url;
    anchor.download = `pokeplanner-backup-${dateText}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    setMessage({
      type: "success",
      text: "バックアップを出力しました。",
    });
  }

  async function handleImport(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "現在のデータを、読み込んだバックアップで置き換えます。続行しますか？",
    );

    if (!confirmed) {
      event.target.value = "";
      return;
    }

    try {
      const json = await file.text();
      const result = importPlannerData(json);

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.message,
        });

        return;
      }

      setMessage({
        type: "success",
        text: "バックアップを読み込みました。",
      });
    } catch {
      setMessage({
        type: "error",
        text: "ファイルの読み込みに失敗しました。",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleTop50Import(
  event: ChangeEvent<HTMLInputElement>,
) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const confirmed = window.confirm(
    "TOP50ランキングを更新します。続行しますか？",
  );

  if (!confirmed) {
    event.target.value = "";
    return;
  }

  try {
    await importTop50(file);

    setMessage({
      type: "success",
      text: "TOP50ランキングを更新しました。",
    });
  } catch (error) {
    setMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "TOP50ランキングの更新に失敗しました。",
    });
  } finally {
    event.target.value = "";
  }
}

  function handleReset() {
    const confirmed = window.confirm(
      "保存した構築・候補・ランキング・相性表を初期状態へ戻します。この操作は元に戻せません。",
    );

    if (!confirmed) {
      return;
    }

    resetPlannerData();

    setMessage({
      type: "success",
      text: "データを初期状態へ戻しました。",
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold text-blue-600">
            Settings
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            設定
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            PokéPlannerの保存データを管理します。
          </p>
        </header>

        {message && (
          <div
            className={[
              "mt-6 rounded-xl border px-4 py-3 text-sm",
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              アカウント
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Googleアカウントでログインできます。
            </p>
          </div>

          <div className="p-6">
            {user ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    ログイン中
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <LogOut size={18} />
                  ログアウト
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <LogIn size={18} />
                Googleでログイン
              </button>
            )}

            {authError && (
              <p className="mt-4 text-sm text-red-600">
                {authError}
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              構築
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {teams.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              候補
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {candidates.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              仮想敵
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {rankingSet.entries.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              相性評価
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {matchups.length}
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              バックアップ
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              構築・候補・ランキング・相性表をJSON形式で保存できます。
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Download size={20} />
              </span>

              <span>
                <span className="block font-semibold text-slate-900">
                  JSONをエクスポート
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  現在の保存データをファイルとしてダウンロードします。
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Upload size={20} />
              </span>

              <span>
                <span className="block font-semibold text-slate-900">
                  JSONをインポート
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  バックアップファイルからデータを復元します。
                </span>
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </section>

        {isAdmin && (
  <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-6 py-5">
      <h2 className="text-lg font-bold text-slate-900">
        管理者
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        管理者向けのデータ更新機能です。
      </p>
    </div>

    <div className="p-6">
      <button
        type="button"
        onClick={() => top50InputRef.current?.click()}
        className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Upload size={20} />
        </span>

        <span>
          <span className="block font-semibold text-slate-900">
            TOP50ランキングを更新
          </span>

          <span className="mt-1 block text-sm leading-6 text-slate-500">
            TSVファイルからSupabaseへTOP50ランキングを登録します。
          </span>
        </span>
      </button>

      <input
        ref={top50InputRef}
        type="file"
        accept=".tsv"
        onChange={handleTop50Import}
        className="hidden"
      />
    </div>
  </section>
)}

        <section className="mt-6 rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 px-6 py-5">
            <h2 className="text-lg font-bold text-red-700">
              データの初期化
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              保存したデータを、初期データへ戻します。
            </p>
          </div>

          <div className="p-6">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RotateCcw size={18} />
              すべてのデータを初期化
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
