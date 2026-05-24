"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, Calendar, ChevronLeft, Plus } from "lucide-react";
import { Meeting } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface SidebarProps {
  currentId: string;
  meetings: Meeting[];
  blocks: { id: string; label: string; count?: number; color?: string }[];
}

export default function Sidebar({ currentId, meetings, blocks }: SidebarProps) {
  const router = useRouter();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pb-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <ShieldCheck className="text-blue-600" size={20} />
        <span className="font-bold text-slate-700 text-sm">AI Operations</span>
      </div>

      {/* ניווט בלוקים */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
          בלוקי הדיון הנוכחי
        </p>
        <nav className="space-y-0.5">
          {blocks.map((b) => (
            <button
              key={b.id}
              onClick={() => scrollTo(b.id)}
              className="w-full text-right px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2"
            >
              <span>{b.label}</span>
              {b.count !== undefined && b.count > 0 && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${b.color || "bg-slate-100 text-slate-500"}`}>
                  {b.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* דיונים אחרונים */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            דיונים
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="דיון חדש"
          >
            <Plus size={15} />
          </button>
        </div>
        <nav className="space-y-0.5">
          {meetings.slice(0, 8).map((m) => (
            <button
              key={m.id}
              onClick={() => {
                sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
                router.push(`/analysis/${m.id}`);
              }}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors flex flex-col gap-0.5 ${
                m.id === currentId
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="truncate">{m.title}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={11} />
                {formatDate(m.meeting_date)}
              </span>
            </button>
          ))}
          {meetings.length > 8 && (
            <button
              onClick={() => router.push("/history")}
              className="w-full text-right px-3 py-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <ChevronLeft size={12} />
              כל הדיונים ({meetings.length})
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
}
