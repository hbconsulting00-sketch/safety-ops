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

  const allTasks = meetings.flatMap((m) =>
    m.analysis.tasks.map((t) => ({ ...t, meetingTitle: m.title, meetingId: m.id, meetingDate: m.meeting_date, meeting: m }))
  );
  const openTasks    = allTasks.filter((t) => t.status === "פתוח");
  const inProgress   = allTasks.filter((t) => t.status === "בתהליך");
  const overdueTasks = allTasks.filter((t) => t.status === "באיחור");
  const doneTasks    = allTasks.filter((t) => t.status === "הושלם");
  const pendingTasks = allTasks.filter((t) => t.status !== "הושלם");
  const allRedFlags  = meetings.flatMap((m) =>
    m.analysis.red_flags.map((f) => ({ flag: f, meetingTitle: m.title, meetingId: m.id, meetingDate: m.meeting_date, meeting: m }))
  );
  const allNoOwner = meetings.flatMap((m) =>
    m.analysis.tasks_without_owner.map((t) => ({ task: t, meetingTitle: m.title, meetingId: m.id, meetingDate: m.meeting_date, meeting: m }))
  );

  const total = allTasks.length;
  const donePct = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;

  const doneW    = total > 0 ? (doneTasks.length  / total) * 100 : 0;
  const inW      = total > 0 ? (inProgress.length / total) * 100 : 0;
  const openW    = total > 0 ? (openTasks.length  / total) * 100 : 0;
  const overdueW = total > 0 ? (overdueTasks.length / total) * 100 : 0;

  const goToMeeting = (m: Meeting) => {
    sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
    router.push(`/analysis/${m.id}`);
  };
  const toggle = (key: PanelType) => setPanel(panel === key ? null : key);

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">מצב נוכחי</h2>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex gap-5 items-center">

          {/* Donut */}
          <div className="relative flex-shrink-0 w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-24 h-24" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="15.91549" fill="none" stroke="#f1f5f9" strokeWidth="4" />
              {donePct > 0 && (
                <circle
                  cx="18" cy="18" r="15.91549" fill="none"
                  stroke="#93C93E" strokeWidth="4"
                  strokeDasharray={`${donePct} ${100 - donePct}`}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 leading-none">{donePct}%</span>
              <span className="text-[9px] text-slate-400 mt-0.5">הושלם</span>
            </div>
          </div>

          {/* Right: bar + stats */}
          <div className="flex-1 min-w-0">
            <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 mb-1">
              {doneW    > 0 && <div style={{ width: `${doneW}%`    }} className="bg-[#93C93E]" />}
              {inW      > 0 && <div style={{ width: `${inW}%`      }} className="bg-[#2E81C5]" />}
              {openW    > 0 && <div style={{ width: `${openW}%`    }} className="bg-amber-400" />}
              {overdueW > 0 && <div style={{ width: `${overdueW}%` }} className="bg-red-500"   />}
            </div>
            <div className="flex gap-3 text-[9px] text-slate-400 mb-4 flex-wrap">
              {doneW    > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-[#93C93E] inline-block" />הושלם</span>}
              {inW      > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-[#2E81C5] inline-block" />בתהליך</span>}
              {openW    > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-amber-400 inline-block" />פתוח</span>}
              {overdueW > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-red-500 inline-block" />באיחור</span>}
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[
                { key: "meetings" as PanelType, icon: <ShieldCheck size={14} className="text-[#2E81C5]" />, val: meetings.length, label: "דיונים", active: "bg-[#2E81C5]/10" },
                { key: "open"     as PanelType, icon: <Clock         size={14} className="text-amber-500" />, val: openTasks.length + inProgress.length, label: "פתוחות", active: "bg-amber-50" },
                { key: "overdue"  as PanelType, icon: <AlertTriangle size={14} className={overdueTasks.length > 0 ? "text-red-500" : "text-slate-300"} />, val: overdueTasks.length, label: "באיחור", active: "bg-red-50" },
                { key: "done"     as PanelType, icon: <CheckCircle2  size={14} className="text-[#93C93E]" />, val: doneTasks.length, label: "הושלמו", active: "bg-[#93C93E]/10" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggle(s.key)}
                  className={`flex flex-col items-center py-2 rounded-lg transition-colors ${panel === s.key ? s.active : "hover:bg-slate-50"}`}
                >
                  <span className="mb-0.5">{s.icon}</span>
                  <span className={`text-base font-bold leading-none ${s.key === "overdue" && overdueTasks.length > 0 ? "text-red-600" : "text-slate-800"}`}>{s.val}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {(allRedFlags.length > 0 || allNoOwner.length > 0) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
            {allRedFlags.length > 0 && (
              <button
                onClick={() => toggle("redflags")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  panel === "redflags" ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                }`}
              >
                <AlertTriangle size={11} />
                {allRedFlags.length} דגלים אדומים
              </button>
            )}
            {allNoOwner.length > 0 && (
              <button
                onClick={() => toggle("noowner")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  panel === "noowner" ? "bg-amber-600 text-white border-amber-600" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <Users size={11} />
                {allNoOwner.length} ללא אחראי
              </button>
            )}
          </div>
        )}
      </div>

      {panel && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#333333] text-sm">
              {panel === "meetings" ? "דיונים" : panel === "open" ? "משימות פתוחות ובתהליך" : panel === "overdue" ? "משימות באיחור" : panel === "done" ? "משימות שהושלמו" : panel === "redflags" ? "דגלים אדומים" : "משימות ללא אחראי"}
            </h3>
            <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>

          {panel === "meetings" && (
            <div className="space-y-2">
              {meetings.map((m) => (
                <button key={m.id} onClick={() => goToMeeting(m)} className="w-full text-right flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 hover:border-[#2E81C5]/30 hover:bg-[#2E81C5]/5 transition-colors">
                  <div>
                    <p className="font-medium text-[#333333] text-sm">{m.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Calendar size={11} />{formatDate(m.meeting_date, true)}</p>
                  </div>
                  <span className="text-xs text-slate-500">{m.analysis.tasks.length} משימות</span>
                </button>
              ))}
            </div>
          )}

          {(panel === "open" || panel === "overdue" || panel === "done") && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(panel === "open" ? pendingTasks : panel === "overdue" ? overdueTasks : doneTasks).map((t, i) => (
                <button key={i} onClick={() => goToMeeting(t.meeting)} className="w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-[#2E81C5]/30 hover:bg-[#2E81C5]/5 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm text-[#333333]">{t.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{t.meetingTitle}</span>
                      {t.deadline && <span className="flex items-center gap-0.5"><Calendar size={10} />{formatDate(t.deadline)}</span>}
                    </p>
                  </div>
                  {t.responsible && <span className="text-xs text-slate-500 flex-shrink-0">{t.responsible}</span>}
                </button>
              ))}
              {(panel === "open" ? pendingTasks : panel === "overdue" ? overdueTasks : doneTasks).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">אין פריטים להצגה</p>
              )}
            </div>
          )}

          {panel === "redflags" && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allRedFlags.map((f, i) => (
                <button key={i} onClick={() => goToMeeting(f.meeting)} className="w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
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
                <button key={i} onClick={() => goToMeeting(n.meeting)} className="w-full text-right flex items-start gap-3 px-3 py-2.5 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors">
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
