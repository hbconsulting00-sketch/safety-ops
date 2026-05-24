"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Meeting } from "@/lib/types";
import { Clock, AlertTriangle, CheckCircle2, Users, ShieldCheck, X, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

type PanelType = "meetings" | "open" | "overdue" | "done" | "redflags" | "noowner" | null;

interface Props {
  meetings: Meeting[];
}

export default function Dashboard({ meetings }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<PanelType>(null);

  if (meetings.length === 0) return null;

  const allTasks = meetings.flatMap((m) => m.analysis.tasks.map((t) => ({ ...t, meetingTitle: m.title, meetingId: m.id, meetingDate: m.meeting_date, meeting: m })));
  const openTasks = allTasks.filter((t) => t.status === "פתוח" || t.status === "בתהליך");
  const overdueTasks = allTasks.filter((t) => t.status === "באיחור");
  const doneTasks = allTasks.filter((t) => t.status === "הושלם");
  const allRedFlags = meetings.flatMap((m) => m.analysis.red_flags.map((f) => ({ flag: f, meetingTitle: m.title, meetingId: m.id, meetingDate: m.meeting_date, meeting: m })));
  const allNoOwner = meetings.flatMap((m) => m.analysis.tasks_without_owner.map((t) => ({ task: t, meetingTitle: m.title, meetingId: m.id, meetingDate: m.meeting_date, meeting: m })));

  const cards = [
    { key: "meetings" as PanelType, label: "דיונים", value: meetings.length, icon: <ShieldCheck size={18} />, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
    { key: "open" as PanelType, label: "משימות פתוחות", value: openTasks.length, icon: <Clock size={18} />, color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
    { key: "overdue" as PanelType, label: "באיחור", value: overdueTasks.length, icon: <AlertTriangle size={18} />, color: overdueTasks.length > 0 ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100" },
    { key: "done" as PanelType, label: "הושלמו", value: doneTasks.length, icon: <CheckCircle2 size={18} />, color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { key: "redflags" as PanelType, label: "דגלים אדומים", value: allRedFlags.length, icon: <AlertTriangle size={18} />, color: allRedFlags.length > 0 ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100" },
    { key: "noowner" as PanelType, label: "ללא אחראי", value: allNoOwner.length, icon: <Users size={18} />, color: allNoOwner.length > 0 ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100" },
  ];

  const goToMeeting = (m: Meeting) => {
    sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
    router.push(`/analysis/${m.id}`);
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">מצב נוכחי</h2>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setPanel(panel === c.key ? null : c.key)}
            className={`border rounded-xl p-3 flex items-center gap-3 transition-colors text-right cursor-pointer ${c.color} ${panel === c.key ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
          >
            <span className="opacity-70">{c.icon}</span>
            <div>
              <p className="text-xl font-bold leading-none">{c.value}</p>
              <p className="text-xs opacity-70 mt-0.5">{c.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Panel */}
      {panel && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">
              {cards.find((c) => c.key === panel)?.label}
            </h3>
            <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          {panel === "meetings" && (
            <div className="space-y-2">
              {meetings.map((m) => (
                <button
                  key={m.id}
                  onClick={() => goToMeeting(m)}
                  className="w-full text-right flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{m.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} />{formatDate(m.meeting_date, true)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{m.analysis.tasks.length} משימות</span>
                </button>
              ))}
            </div>
          )}

          {(panel === "open" || panel === "overdue" || panel === "done") && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(panel === "open" ? openTasks : panel === "overdue" ? overdueTasks : doneTasks).map((t, i) => (
                <button
                  key={i}
                  onClick={() => goToMeeting(t.meeting)}
                  className="w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{t.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{t.meetingTitle}</span>
                      {t.deadline && <span className="flex items-center gap-0.5"><Calendar size={10} />{formatDate(t.deadline)}</span>}
                    </p>
                  </div>
                  {t.responsible && <span className="text-xs text-slate-500 flex-shrink-0">{t.responsible}</span>}
                </button>
              ))}
              {(panel === "open" ? openTasks : panel === "overdue" ? overdueTasks : doneTasks).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">אין פריטים להצגה</p>
              )}
            </div>
          )}

          {panel === "redflags" && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allRedFlags.map((f, i) => (
                <button
                  key={i}
                  onClick={() => goToMeeting(f.meeting)}
                  className="w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800">{f.flag}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{f.meetingTitle} · {formatDate(f.meetingDate)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {panel === "noowner" && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allNoOwner.map((n, i) => (
                <button
                  key={i}
                  onClick={() => goToMeeting(n.meeting)}
                  className="w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors"
                >
                  <Users size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900">{n.task}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.meetingTitle} · {formatDate(n.meetingDate)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">
        דיון אחרון: <span className="text-slate-600 font-medium">{meetings[0].title}</span>{" "}
        ({formatDate(meetings[0].meeting_date)})
      </p>
    </div>
  );
}
