import { ArrowUp, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [showScrollTopButton, setShowScrollTopButton] =
    useState(false);

  function openMobileMenu() {
    setIsMobileMenuOpen(true);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTopButton(window.scrollY > 300);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
  <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">

    {/* 背景 */}
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 青・紫のぼかし */}
<div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-sky-300/20 blur-3xl" />

<div className="absolute right-[-8rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-300/20 blur-3xl" />

<div className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-200/20 blur-3xl" />

      {/* モンスターボール */}
      <div className="absolute right-[-8rem] top-[-8rem] h-[34rem] w-[34rem] opacity-[0.06]">
        <div className="relative h-full w-full rounded-full border-[16px] border-slate-700">
          {/* 横線 */}
          <div className="absolute left-0 top-1/2 h-[12px] w-full -translate-y-1/2 bg-slate-700" />

          {/* 真ん中 */}
          <div className="absolute left-1/2 top-1/2 h-30 w-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-[16px] border-slate-700 bg-white" />
        </div>
      </div>

      {/* 左下にも少しだけ */}
      <div className="absolute -bottom-20 -left-20 h-56 w-56 opacity-[0.04]">
        <div className="relative h-full w-full rounded-full border-[10px] border-slate-700">
          <div className="absolute left-0 top-1/2 h-[10px] w-full -translate-y-1/2 bg-slate-700" />
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-slate-700 bg-white" />
        </div>
      </div>
    </div>
      <div className="relative z-10 flex min-h-screen">
        {/* PC用サイドバー */}
        <Sidebar mode="desktop" />

        <div className="min-w-0 flex-1">
          {/* スマホ用ヘッダー */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
            <button
              type="button"
              onClick={openMobileMenu}
              aria-label="メニューを開く"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Menu size={23} strokeWidth={1.8} />
            </button>

            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Pokémon Champions
              </p>

              <p className="text-base font-bold text-slate-900">
                PokéPlanner
              </p>
            </div>

            <div className="h-10 w-10" />
          </header>

          <main className="min-w-0">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* スマホ用メニュー */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="ナビゲーションメニュー"
        >
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="メニューを閉じる"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
          />

          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <Sidebar
              mode="mobile"
              onNavigate={closeMobileMenu}
            />

            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="メニューを閉じる"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={21} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      {/* スマホ用：ページ上部へ戻るボタン */}
      {showScrollTopButton && !isMobileMenuOpen && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="ページ上部へ戻る"
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 active:scale-95 lg:hidden"
        >
          <ArrowUp size={21} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export default MainLayout;