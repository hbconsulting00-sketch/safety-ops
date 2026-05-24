"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Calendar, AlertTriangle, CheckCircle2, Clock, Users, TrendingUp, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Meeting } from "@/lib/types";

const BLOCKS = [
  { key: "block-summary", label: "סיכום מנהלים", icon: <FileText size={13} /> },
  { key: "block-decisions", label: "החלטות מרכזיות", icon: <CheckCircle2 size={13} /> },
  { key: "block-tasks", label: "משימות לביצוע", icon: <Clock size={13} /> },
  { key: "block-redflags", label: "דגלים אדומים", icon: <AlertTriangle size={13} /> },
  { key: "block-noowner", label: "ללא אחראי", icon: <Users size={13} /> },
];

interface Props {
  meetings: Meeting[];
  activeMeetingId?: string;
}

export default function MeetingHistorySidebar({ meetings, activeMeetingId }: Props) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(activeMeetingId || meetings[0]?.id || null);

  const navigateToBlock = (meeting: Meeting, blockId: string) => {
    sessionStorage.setItem(`meeting_${meeting.id}`, JSON.stringify(meeting));
    router.push(`/analysis/${meeting.id}#${blockId}`);
  };

  if (meetings.length === 0) {
    return (
      <aside className="w-full lg:w-72 flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-slate-500 mb-3">היסטוריית דיונים</p>
        <p className="text-sm text-slate-400 text-center py-8">עדיין אין דיונים שמורים</p>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-sm font-bold text-[#333333]">היסטוריית דיונים</p>
        <p className="text-xs text-slate-400">{meetings.length} דיונים שמורים</p>
      </div>
      <div className="overflow-y-auto max-h-96 lg:max-h-[calc(100vh-12rem)] divide-y divide-slate-100">
        {meetings.map((m) => {
          const isOpen = openId === m.id;
          const overdue = m.analysis.tasks.filter((t) => t.status === "באיחור").length;
          const redFlags = m.analysis.red_flags.length;

          return (
            <div key={m.id}>
              <button
                onClick={() => setOpenId(isOpen ? null : m.id)}
                className={`w-full text-right px-4 py-3 flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                  isOpen ? "bg-[#2E81C5]/5" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isOpen ? "text-[#2E81C5]" : "text-[#333333]"}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    {formatDate(m.meeting_date)}
                  </p>
                  {(overdue > 0 || redFlags > 0) && (
                    <div className="flex gap-2 mt-1">
                      {overdue > 0 && (
                        <span className="text-xs text-red-500 flex items-center gap-0.5">
                          <Clock size={10} />{overdue} באיחור
                        </span>
                      )}
                      {redFlags > 0 && (
                        <span className="text-xs text-red-500 flex items-center gap-0.5">
                          <AlertTriangle size={10} />{redFlags} דגלים
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown size={15} className="text-[#2E81C5] flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronLeft size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
                )}
              </button>

              {isOpen && (
                <div className="bg-[#2E81C5]/3 border-t border-[#2E81C5]/10 pb-1">
                  {BLOCKS.map((block) => {
                    let count: number | null = null;
                    if (block.key === "block-tasks") count = m.analysis.tasks.length;
                    if (block.key === "block-decisions") count = m.analysis.key_decisions.length;
                    if (block.key === "block-redflags") count = m.analysis.red_flags.length;
                    if (block.key === "block-noowner") count = m.analysis.tasks_without_owner.length;
                    if (count === 0 && block.key !== "block-summary" && block.key !== "block-tasks") return null;

                    return (
                      <button
                        key={block.key}
                        onClick={() => navigateToBlock(m, block.key)}
                        className="w-full text-right px-6 py-2 text-xs text-slate-600 hover:text-[#2E81C5] hover:bg-[#2E81C5]/8 transition-colors flex items-center gap-2"
                      >
                        <span className="text-slate-400">{block.icon}</span>
                        <span>{block.label}</span>
                        {count !== null && count > 0 && (
                          <span className="mr-auto bg-white border border-slate-200 text-slate-500 rounded-full px-1.5 py-0.5 text-xs">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {m.analysis.historical_insights?.length > 0 && (
                    <button
                      onClick={() => navigateToBlock(m, "block-insights")}
                      className="w-full text-right px-6 py-2 text-xs text-[#78318E] hover:bg-[#78318E]/8 transition-colors flex items-center gap-2"
                    >
                      <TrendingUp size={13} />
                      <span>תובנות היסטוריות</span>
                      <span className="mr-auto bg-[#78318E]/10 text-[#78318E] rounded-full px-1.5 py-0.5 text-xs">
                        {m.analysis.historical_insights.length}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      sessionStorage.setItem(`meeting_${m.id}`, JSON.stringify(m));
                      router.push(`/analysis/${m.id}`);
                    }}
                    className="w-full text-right px-6 py-2 text-xs text-[#2E81C5] font-semibold hover:underline"
                  >
                    פתח דיון מלא ←
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
