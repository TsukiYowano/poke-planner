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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
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
            <Outlet />
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