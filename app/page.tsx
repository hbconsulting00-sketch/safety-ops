"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, Plus, X } from "lucide-react";
import { Meeting } from "@/lib/types";
import { getMeetings, saveMeeting } from "@/lib/storage";
import MeetingHistorySidebar from "@/app/components/MeetingHistorySidebar";
import Dashboard from "@/app/components/Dashboard";
import CrossMeetingSummary from "@/app/components/CrossMeetingSummary";
import AppHeader from "@/app/components/AppHeader";
import DateInput from "@/app/components/DateInput";

type InputMode = "text" | "file";

export default function HomePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<InputMode>("text");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [protocolText, setProtocolText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMeetings().then((ms) => {
      setMeetings(ms);
      if (ms.length === 0) setShowForm(true);
    });
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("יש להזין כותרת לדיון"); return; }
    if (mode === "text" && !protocolText.trim()) { setError("יש להזין טקסט הפרוטוקול"); return; }
    if (mode === "file" && !selectedFile) { setError("יש לבחור קובץ"); return; }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("meeting_date", meetingDate);
      if (mode === "text") formData.append("text", protocolText);
      else if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "שגיאה בעיבוד");
      }

      const meeting: Meeting = await res.json();
      await saveMeeting(meeting);
      router.push(`/analysis/${meeting.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200">
      <AppHeader />

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">

        {/* Left: Dashboard + Form */}
        <main className="flex-1 min-w-0">
          <Dashboard meetings={meetings} />
          <CrossMeetingSummary meetings={meetings} />

          {/* כפתור דיון חדש / טופס */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 font-semibold hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Plus size={20} />
              ניתוח דיון חדש
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">ניתוח דיון חדש</h2>
                {meetings.length > 0 && (
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    כותרת הדיון <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="למשל: ועדת בטיחות — מאי 2026"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    תאריך הדיון <span className="text-xs font-normal text-slate-400">(יי/חח/שנה)</span>
                  </label>
                  <DateInput value={meetingDate} onChange={setMeetingDate} />
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setMode("text")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    mode === "text" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  <FileText size={15} /> הדבקת טקסט
                </button>
                <button
                  onClick={() => setMode("file")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    mode === "file" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  <Upload size={15} /> העלאת קובץ
                </button>
              </div>

              {mode === "text" ? (
                <textarea
                  value={protocolText}
                  onChange={(e) => setProtocolText(e.target.value)}
                  placeholder="הדביקו כאן את פרוטוקול ועדת הבטיחות..."
                  rows={10}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                >
                  <Upload className="mx-auto mb-3 text-slate-400" size={32} />
                  {selectedFile ? (
                    <p className="font-medium text-blue-600">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="font-medium text-slate-600 mb-1">לחצו להעלאת קובץ</p>
                      <p className="text-sm text-slate-400">PDF, Word (.docx) או טקסט</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" />מנתח את הפרוטוקול...</>
                ) : (
                  "נתח וצור תוכנית פעולה ←"
                )}
              </button>
            </div>
          )}
        </main>

        {/* Right: Meeting history sidebar */}
        <MeetingHistorySidebar meetings={meetings} />
      </div>
    </div>
  );
}
