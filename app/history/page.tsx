"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Meeting } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import AppHeader from "@/app/components/AppHeader";

export default function HistoryPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("meetings") || "[]") as Meeting[];
    setMeetings(stored);
  }, []);

  const getStats = (m: Meeting) => {
    const tasks = m.analysis.tasks;
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "הושלם").length;
    const overdue = tasks.filter((t) => t.status === "באיחור").length;
    const redFlags = m.analysis.red_flags.length;
    return { total, done, overdue, redFlags };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {meetings.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <ShieldCheck size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">עדיין אין דיונים שמורים</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              התחל בניתוח ראשון ←
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => {
              const { total, done, overdue, redFlags } = getStats(m);
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
                    router.push(`/analysis/${m.id}`);
                  }}
                  className="w-full bg-white rounded-xl border border-slate-200 p-5 text-right hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-base mb-1">{m.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar size={13} />
                        {formatDate(m.meeting_date, true)}
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm flex-shrink-0">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock size={14} />
                        {total} משימות
                      </span>
                      {done > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={14} />
                          {done} הושלמו
                        </span>
                      )}
                      {overdue > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertTriangle size={14} />
                          {overdue} באיחור
                        </span>
                      )}
                      {redFlags > 0 && (
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          🚩 {redFlags}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
