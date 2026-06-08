"use client";

import { useRouter } from "next/navigation";
import { Meeting } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { TrendingUp, AlertTriangle, Users, CheckCircle2, CalendarDays } from "lucide-react";

interface Props {
  meetings: Meeting[];
}

export default function CrossMeetingSummary({ meetings }: Props) {
  const router = useRouter();

  if (meetings.length < 2) return null;

  const allTasks    = meetings.flatMap((m) => m.analysis.tasks);
  const doneTasks   = allTasks.filter((t) => t.status === "הושלם");
  const overdueTasks = allTasks.filter((t) => t.status === "באיחור");
  const allRedFlags = meetings.flatMap((m) => m.analysis.red_flags);
  const completionRate = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;

  const ownerMap: Record<string, { open: number; overdue: number }> = {};
  meetings.forEach((m) => {
    m.analysis.tasks.forEach((t) => {
      if (!t.responsible) return;
      if (!ownerMap[t.responsible]) ownerMap[t.responsible] = { open: 0, overdue: 0 };
      if (t.status !== "הושלם") ownerMap[t.responsible].open++;
      if (t.status === "באיחור") ownerMap[t.responsible].overdue++;
    });
  });
  const topOwners = Object.entries(ownerMap)
    .filter(([, d]) => d.open > 0)
    .sort((a, b) => b[1].open - a[1].open)
    .slice(0, 4);
  const maxLoad = topOwners.length > 0 ? Math.max(...topOwners.map(([, d]) => d.open)) : 1;
  const maxRF   = Math.max(...meetings.map((m) => m.analysis.red_flags.length), 1);

  const sortedByDate = [...meetings].sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));

  const goTo = (m: Meeting) => {
    sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
    router.push(`/analysis/${m.id}`);
  };

  const shortTitle = (m: Meeting) =>
    m.title.replace("ועדת בטיחות —", "").replace("ועדת בטיחות -", "").trim();

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <TrendingUp size={14} />
        תמונת מצב מצטברת — {meetings.length} דיונים
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">

        {/* Completion */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">השלמת משימות</span>
            <CheckCircle2 size={14} className="text-[#93C93E]" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">{completionRate}%</span>
            <span className="text-xs text-slate-400 mb-1">{doneTasks.length} מתוך {allTasks.length}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#93C93E] rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
          {overdueTasks.length > 0 && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle size={10} /> {overdueTasks.length} באיחור מהדדליין
            </p>
          )}
        </div>

        {/* Red flags */}
        <div className={`border rounded-2xl p-4 shadow-sm ${allRedFlags.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-red-600 font-medium">דגלים אדומים</span>
            <AlertTriangle size={14} className="text-red-500" />
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-red-700">{allRedFlags.length}</span>
            <span className="text-xs text-red-400 mb-1">ב-{meetings.length} דיונים</span>
          </div>
          <div className="space-y-1.5">
            {sortedByDate.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-14 truncate flex-shrink-0">{shortTitle(m)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-red-100 overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${(m.analysis.red_flags.length / maxRF) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-red-600 font-bold w-3 text-center">{m.analysis.red_flags.length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Owner workload */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">עומס אחראים</span>
            <Users size={14} className="text-[#2E81C5]" />
          </div>
          {topOwners.length > 0 ? (
            <div className="space-y-2 mt-1">
              {topOwners.map(([name, data]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-700 w-16 truncate flex-shrink-0">{name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${data.overdue > 0 ? "bg-red-400" : "bg-[#2E81C5]"}`}
                      style={{ width: `${(data.open / maxLoad) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-4 text-center">{data.open}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#93C93E] font-medium mt-3">כל המשימות הושלמו ✓</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={13} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ציר זמן דיונים</span>
        </div>
        <div className="flex items-start overflow-x-auto pb-1">
          {sortedByDate.map((m, i) => {
            const taskCount = m.analysis.tasks.length;
            const doneCount = m.analysis.tasks.filter((t) => t.status === "הושלם").length;
            const rate = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
            const highRisk = m.analysis.red_flags.length > 3;
            return (
              <div key={m.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => goTo(m)}
                  className="flex flex-col items-center gap-1.5 px-2 hover:opacity-75 transition-opacity"
                  title={`${m.title} — ${formatDate(m.meeting_date, true)}`}
                >
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    highRisk
                      ? "border-red-400 bg-red-50 text-red-700"
                      : rate >= 70
                      ? "border-[#93C93E] bg-[#93C93E]/10 text-[#569E27]"
                      : "border-[#2E81C5] bg-[#2E81C5]/8 text-[#2E81C5]"
                  }`}>
                    {rate}%
                  </div>
                  <span className="text-[9px] text-slate-400 text-center w-14 leading-tight">
                    {shortTitle(m)}
                  </span>
                </button>
                {i < sortedByDate.length - 1 && (
                  <div className="w-6 h-px bg-slate-200 flex-shrink-0 mb-5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
