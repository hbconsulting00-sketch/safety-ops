"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock,
  Users, TrendingUp, ArrowRight, Download, TableIcon, Trash2, ChevronUp, ChevronDown, X
} from "lucide-react";
import { Meeting, Task, TaskStatus, HistoricalInsight } from "@/lib/types";
import { getMeeting, getMeetings, updateTask, reorderTasks, tasksToCSV, deleteMeeting } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import Sidebar from "@/app/components/Sidebar";
import AppHeader from "@/app/components/AppHeader";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS: TaskStatus[] = ["פתוח", "בתהליך", "הושלם", "באיחור", "מושהה"];

const STATUS_COLORS: Record<string, string> = {
  "פתוח":    "bg-blue-100 text-blue-700",
  "בתהליך":  "bg-yellow-100 text-yellow-700",
  "הושלם":   "bg-green-100 text-green-700",
  "באיחור":  "bg-red-100 text-red-700",
  "מושהה":   "bg-orange-100 text-orange-700",
};

function ResponsiblePicker({
  value, onChange, allNames,
}: {
  value: string;
  onChange: (v: string) => void;
  allNames: string[];
}) {
  const [newName, setNewName] = useState("");
  const selected = value ? value.split(", ").filter(Boolean) : [];
  const remaining = allNames.filter((n) => !selected.includes(n));

  const add = (name: string) => {
    const t = name.trim();
    if (!t || selected.includes(t)) return;
    onChange([...selected, t].join(", "));
    setNewName("");
  };
  const remove = (name: string) => onChange(selected.filter((n) => n !== name).join(", "));

  return (
    <div className="space-y-1">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((n) => (
            <span key={n} className="inline-flex items-center gap-1 bg-[#2E81C5]/10 text-[#2E81C5] text-xs px-2 py-0.5 rounded-full">
              {n}
              <button type="button" onClick={() => remove(n)} className="hover:text-red-500 leading-none">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      {remaining.length > 0 && (
        <select
          value=""
          onChange={(e) => { if (e.target.value) add(e.target.value); }}
          className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E81C5]"
        >
          <option value="">+ בחר מהרשימה</option>
          {remaining.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      )}
      <div className="flex gap-1">
        <input
          className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E81C5]"
          placeholder="הוסף שם חדש..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(newName); } }}
        />
        {newName.trim() && (
          <button type="button" onClick={() => add(newName)}
            className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200">
            הוסף
          </button>
        )}
      </div>
    </div>
  );
}

const INSIGHT_ICONS: Record<HistoricalInsight["type"], React.ReactNode> = {
  owner_performance: <Users size={18} />,
  zombie_topic: <Clock size={18} />,
  contractor: <AlertTriangle size={18} />,
  area_heatmap: <AlertTriangle size={18} />,
  trend: <TrendingUp size={18} />,
  seasonality: <TrendingUp size={18} />,
  compliance_score: <CheckCircle2 size={18} />,
  prediction: <TrendingUp size={18} />,
};

function EditableTask({
  task, index, isFirst, isLast, allNames, onSave, onReorder,
}: {
  task: Task;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  allNames: string[];
  onSave: (index: number, patch: Partial<Task>) => void;
  onReorder: (index: number, dir: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  useEffect(() => { setDraft(task); }, [task]);

  const names = task.responsible ? task.responsible.split(", ").filter(Boolean) : [];

  if (!editing) {
    return (
      <tr className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setEditing(true)} title="לחץ לעריכה">
        <td className="py-3 pr-2 text-slate-800 font-medium">{task.action}</td>
        <td className="py-3 px-3 text-slate-600">
          {names.length > 0
            ? <div className="flex flex-wrap gap-1">
                {names.map((n) => (
                  <span key={n} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{n}</span>
                ))}
              </div>
            : <span className="text-red-400 italic text-sm">לא הוגדר</span>
          }
        </td>
        <td className="py-3 px-3 text-slate-600 text-sm">
          {task.deadline ? formatDate(task.deadline) : <span className="text-slate-400 italic">לא הוגדר</span>}
        </td>
        <td className="py-3 px-3">
          <Badge className={STATUS_COLORS[task.status] || "bg-slate-100 text-slate-600"}>{task.status}</Badge>
        </td>
        <td className="py-3 pl-2 w-12" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-0.5 items-center">
            <button
              onClick={() => onReorder(index, "up")}
              disabled={isFirst}
              className="p-0.5 rounded text-slate-400 hover:text-[#2E81C5] hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="הזז למעלה"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => onReorder(index, "down")}
              disabled={isLast}
              className="p-0.5 rounded text-slate-400 hover:text-[#2E81C5] hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="הזז למטה"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50 border-y border-blue-200">
      <td className="py-2 pr-2">
        <textarea
          className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2E81C5]"
          value={draft.action}
          rows={2}
          onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}
        />
      </td>
      <td className="py-2 px-3">
        <ResponsiblePicker
          value={draft.responsible}
          onChange={(v) => setDraft((d) => ({ ...d, responsible: v }))}
          allNames={allNames}
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="date"
          className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E81C5]"
          value={draft.deadline}
          onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
        />
      </td>
      <td className="py-2 px-3">
        <div className="flex flex-col gap-1">
          <select
            className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E81C5]"
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as TaskStatus }))}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => { onSave(index, draft); setEditing(false); }}
              className="flex-1 text-xs bg-[#2E81C5] text-white rounded-lg py-1 hover:bg-[#2E81C5]/90 transition-colors"
            >שמור</button>
            <button
              onClick={() => { setDraft(task); setEditing(false); }}
              className="flex-1 text-xs bg-white border border-slate-300 text-slate-600 rounded-lg py-1 hover:bg-slate-50 transition-colors"
            >בטל</button>
          </div>
        </div>
      </td>
      <td className="py-2 pl-2 w-12" />
    </tr>
  );
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    getMeeting(id).then((m) => { if (m) setMeeting(m); });
    getMeetings().then(setAllMeetings);
  }, [id]);

  const handleSaveTask = useCallback(async (taskIndex: number, patch: Partial<Task>) => {
    const updated = await updateTask(id, taskIndex, patch);
    if (updated) {
      setMeeting({ ...updated });
      getMeetings().then(setAllMeetings);
    }
  }, [id]);

  const handleReorder = useCallback(async (taskIndex: number, dir: "up" | "down") => {
    if (!meeting) return;
    const tasks = [...meeting.analysis.tasks];
    const swap = dir === "up" ? taskIndex - 1 : taskIndex + 1;
    if (swap < 0 || swap >= tasks.length) return;
    [tasks[taskIndex], tasks[swap]] = [tasks[swap], tasks[taskIndex]];
    const updated = await reorderTasks(id, tasks);
    if (updated) setMeeting({ ...updated });
  }, [id, meeting]);

  const allNames = [...new Set(
    allMeetings.flatMap((m) => m.analysis.tasks.map((t) => t.responsible).filter(Boolean))
  )].sort();

  const handleExportCSV = () => {
    if (!meeting) return;
    const csv = tasksToCSV(meeting);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title} — משימות.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">טוען...</p>
      </div>
    );
  }

  const { analysis } = meeting;
  const overdueTasks = analysis.tasks.filter((t) => t.status === "באיחור");

  const sidebarBlocks = [
    { id: "block-summary", label: "סיכום מנהלים" },
    { id: "block-decisions", label: "החלטות מרכזיות", count: analysis.key_decisions.length },
    {
      id: "block-tasks", label: "משימות לביצוע",
      count: analysis.tasks.length,
      color: overdueTasks.length > 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600",
    },
    { id: "block-redflags", label: "דגלים אדומים", count: analysis.red_flags.length, color: "bg-red-100 text-red-600" },
    { id: "block-noowner", label: "ללא אחראי", count: analysis.tasks_without_owner.length, color: "bg-amber-100 text-amber-600" },
    ...(analysis.historical_insights?.length > 0
      ? [{ id: "block-insights", label: "תובנות היסטוריות", count: analysis.historical_insights.length, color: "bg-purple-100 text-purple-600" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#f5ede0]">
      <AppHeader title={meeting.title} subtitle={formatDate(meeting.meeting_date, true)} />
      {/* Action buttons */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex justify-end gap-2 flex-wrap print:hidden">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#93C93E]/10 hover:bg-[#93C93E]/20 border border-[#93C93E]/30 rounded-lg text-sm font-medium text-[#93C93E] transition-colors"
        >
          <TableIcon size={15} />
          ייצוא לשיטס
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
        >
          <Download size={15} />
          PDF
        </button>
        <button
          onClick={async () => {
            if (!window.confirm(`למחוק את הדיון "${meeting.title}"?\nפעולה זו לא ניתנת לביטול.`)) return;
            await deleteMeeting(id);
            router.push("/");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium text-red-600 transition-colors"
        >
          <Trash2 size={15} />
          מחק דיון
        </button>
      </div>

      {/* Layout: sidebar + content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-5">

          {/* 1. סיכום מנהלים */}
          <section id="block-summary" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-20">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#2E81C5] text-white text-xs flex items-center justify-center font-bold">1</span>
              סיכום מנהלים
            </h2>
            <p className="text-slate-700 leading-relaxed">{analysis.executive_summary}</p>
          </section>

          {/* 2. החלטות מרכזיות */}
          {analysis.key_decisions.length > 0 && (
            <section id="block-decisions" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-20">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#2E81C5] text-white text-xs flex items-center justify-center font-bold">2</span>
                החלטות מרכזיות
              </h2>
              <ol className="space-y-2">
                {analysis.key_decisions.map((decision, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{decision}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 3. טבלת משימות */}
          <section id="block-tasks" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-20">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#2E81C5] text-white text-xs flex items-center justify-center font-bold">3</span>
                משימות לביצוע
              </h2>
              <span className="text-sm text-slate-500 mr-auto">
                {analysis.tasks.length} משימות
                {overdueTasks.length > 0 && (
                  <span className="text-red-500 mr-2">· {overdueTasks.length} באיחור</span>
                )}
              </span>
              <span className="text-xs text-slate-400 italic">לחץ על שורה לעריכה</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פעולה</TableHead>
                  <TableHead>אחראי</TableHead>
                  <TableHead>דדליין</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead className="w-10">סדר</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.tasks.map((task: Task, i) => (
                  <EditableTask
                    key={i} task={task} index={i}
                    isFirst={i === 0} isLast={i === analysis.tasks.length - 1}
                    allNames={allNames}
                    onSave={handleSaveTask}
                    onReorder={handleReorder}
                  />
                ))}
              </TableBody>
            </Table>
          </section>

          {/* 4. דגלים אדומים */}
          {analysis.red_flags.length > 0 && (
            <section id="block-redflags" className="bg-red-50 rounded-2xl border border-red-200 p-6 shadow-sm scroll-mt-20">
              <h2 className="text-base font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                דגלים אדומים — הסלמה ניהולית
              </h2>
              <ul className="space-y-3">
                {analysis.red_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ArrowRight size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-800">{flag}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 5. משימות ללא בעלים */}
          {analysis.tasks_without_owner.length > 0 && (
            <section id="block-noowner" className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm scroll-mt-20">
              <h2 className="text-base font-bold text-amber-800 mb-4 flex items-center gap-2">
                <Users size={18} className="text-amber-600" />
                משימות ללא אחראי מוגדר
              </h2>
              <ul className="space-y-2">
                {analysis.tasks_without_owner.map((task, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-amber-900">{task}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* תובנות היסטוריות */}
          {analysis.historical_insights?.length > 0 && (
            <section id="block-insights" className="bg-[#78318E]/5 rounded-2xl border border-[#78318E]/20 p-6 shadow-sm scroll-mt-20">
              <h2 className="text-base font-bold text-[#78318E] mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#78318E]" />
                תובנות מצטברות מהיסטוריית הדיונים
              </h2>
              <div className="space-y-3">
                {analysis.historical_insights.map((insight, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#78318E]/20 p-4 flex gap-3">
                    <span className="text-[#78318E] mt-0.5 flex-shrink-0">
                      {INSIGHT_ICONS[insight.type] || <TrendingUp size={18} />}
                    </span>
                    <div>
                      <p className="font-semibold text-[#78318E] mb-1">{insight.title}</p>
                      <p className="text-[#78318E]/80 text-sm leading-relaxed">{insight.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <div className="hidden lg:block print:hidden">
          <Sidebar currentId={id} meetings={allMeetings} blocks={sidebarBlocks} />
        </div>
      </div>

      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          body { background: white; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
