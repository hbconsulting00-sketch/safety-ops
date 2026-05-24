"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Meeting } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { TrendingUp, AlertTriangle, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  meetings: Meeting[];
}

export default function CrossMeetingSummary({ meetings }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  if (meetings.length < 2) return null;

  const allOpenTasks = meetings
    .flatMap((m) =>
      m.analysis.tasks
        .filter((t) => t.status === "פתוח" || t.status === "בתהליך" || t.status === "באיחור")
        .map((t) => ({ ...t, meetingTitle: m.title, meetingDate: m.meeting_date, meeting: m }))
    )
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));

  const ownerMap: Record<string, { count: number; overdue: number }> = {};
  allOpenTasks.forEach((t) => {
    if (!t.responsible) return;
    if (!ownerMap[t.responsible]) ownerMap[t.responsible] = { count: 0, overdue: 0 };
    ownerMap[t.responsible].count++;
    if (t.status === "באיחור") ownerMap[t.responsible].overdue++;
  });
  const topOwners = Object.entries(ownerMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  const meetingsWithNoOwner = meetings.filter((m) => m.analysis.tasks_without_owner.length > 0);

  const zombieCandidates = meetings
    .flatMap((m) => m.analysis.tasks.map((t) => ({ action: t.action, status: t.status })))
    .filter((t) => t.status !== "הושלם");

  const goTo = (m: Meeting) => {
    sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
    router.push(`/analysis/${m.id}`);
  };

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#2E81C5]" />
          <span className="font-bold text-[#333333]">סיכום מצטבר — כלל הדיונים</span>
          <span className="text-xs text-slate-400 font-normal">({meetings.length} דיונים)</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">

          {allOpenTasks.length > 0 && (
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-[#333333] mb-3 flex items-center gap-2">
                <Clock size={15} className="text-orange-500" />
                משימות שעדיין לא טופלו
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {allOpenTasks.length}
                </span>
              </h3>
              <div className="space-y-2">
                {allOpenTasks.slice(0, 5).map((t, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(t.meeting)}
                    className="w-full text-right flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100"
                  >
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5 ${
                      t.status === "באיחור" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                    }`}>{t.status}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#333333] truncate">{t.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.meetingTitle} · {formatDate(t.meetingDate)}
                        {t.responsible && ` · ${t.responsible}`}
                      </p>
                    </div>
                  </button>
                ))}
                {allOpenTasks.length > 5 && (
                  <p className="text-xs text-slate-400 text-center pt-1">ועוד {allOpenTasks.length - 5} משימות פתוחות</p>
                )}
              </div>
            </div>
          )}

          {topOwners.length > 0 && (
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-[#333333] mb-3 flex items-center gap-2">
                <Users size={15} className="text-[#2E81C5]" />
                אחראים עם משימות פתוחות
              </h3>
              <div className="flex flex-wrap gap-2">
                {topOwners.map(([name, data]) => (
                  <div
                    key={name}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                      data.overdue > 0
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-xs opacity-70">{data.count} משימות{data.overdue > 0 ? ` · ${data.overdue} באיחור` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meetingsWithNoOwner.length > 0 && (
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-[#333333] mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                דיונים עם משימות ללא אחראי — {meetingsWithNoOwner.length} מתוך {meetings.length}
              </h3>
              <div className="space-y-1">
                {meetingsWithNoOwner.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => goTo(m)}
                    className="w-full text-right flex items-center justify-between px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors text-sm"
                  >
                    <span className="text-slate-700">{m.title}</span>
                    <span className="text-amber-600 font-semibold text-xs">
                      {m.analysis.tasks_without_owner.length} ללא בעלים
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {zombieCandidates.length > 3 && (
            <div className="px-5 py-4 bg-[#78318E]/5">
              <h3 className="text-sm font-semibold text-[#78318E] mb-2 flex items-center gap-2">
                <TrendingUp size={15} className="text-[#78318E]" />
                תובנה — {zombieCandidates.length} משימות נותרו פתוחות בסך הכל
              </h3>
              <p className="text-xs text-[#78318E]/80 leading-relaxed">
                מתוך {meetings.length} דיונים שנותחו, {allOpenTasks.filter((t) => t.status === "באיחור").length} משימות עברו את הדדליין ו-{allOpenTasks.filter((t) => !t.responsible).length} משימות עדיין ללא אחראי מוגדר. מומלץ לקיים דיון מעקב ממוקד.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
