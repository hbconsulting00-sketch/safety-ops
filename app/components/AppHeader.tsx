"use client";

import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, Home, History, Plus } from "lucide-react";

export default function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const router = useRouter();
  const path = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-20 print:hidden shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <ShieldCheck className="text-[#2E81C5]" size={22} />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#333333] leading-none">AI Operations & Insights</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">ממונה בטיחות</p>
          </div>
          <span className="text-sm font-bold text-[#333333] sm:hidden">AI Ops</span>
        </button>

        {/* Page title — shown on analysis page, hidden on mobile */}
        {title && (
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="text-slate-300 text-lg">/</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 leading-none truncate max-w-[180px]">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mr-auto flex items-center gap-1">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path === "/" ? "bg-[#2E81C5]/10 text-[#2E81C5]" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Home size={15} />
            <span className="hidden sm:inline">דף הבית</span>
          </button>
          <button
            onClick={() => router.push("/history")}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path === "/history" ? "bg-[#2E81C5]/10 text-[#2E81C5]" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History size={15} />
            <span className="hidden sm:inline">היסטוריה</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2E81C5] text-white hover:bg-[#2E81C5]/90 transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">דיון חדש</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
