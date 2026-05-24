"use client";

import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, Home, History, Plus } from "lucide-react";

export default function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const router = useRouter();
  const path = usePathname();

  return (
    <header className="border-b bg-white sticky top-0 z-20 print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        {/* Logo — תמיד מקשר לדף הבית */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <ShieldCheck className="text-blue-600" size={24} />
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 leading-none">AI Operations & Insights</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">ממונה בטיחות</p>
          </div>
        </button>

        {/* Title (optional) */}
        {title && (
          <>
            <span className="text-slate-300 text-lg">/</span>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-none">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </>
        )}

        {/* Navigation */}
        <nav className="mr-auto flex items-center gap-1">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path === "/" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Home size={15} />
            דף הבית
          </button>
          <button
            onClick={() => router.push("/history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path === "/history" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History size={15} />
            היסטוריה
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            דיון חדש
          </button>
        </nav>
      </div>
    </header>
  );
}
