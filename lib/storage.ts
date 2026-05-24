import { Meeting, Task } from "./types";
import { DEMO_MEETINGS } from "./demoData";

export function getMeetings(): Meeting[] {
  if (typeof window === "undefined") return [];
  const stored = JSON.parse(localStorage.getItem("meetings") || "[]") as Meeting[];
  if (stored.length === 0) {
    localStorage.setItem("meetings", JSON.stringify(DEMO_MEETINGS));
    return DEMO_MEETINGS;
  }
  return stored;
}

export function getMeeting(id: string): Meeting | null {
  const fromSession = sessionStorage.getItem(`meeting_${id}`);
  if (fromSession) return JSON.parse(fromSession);
  return getMeetings().find((m) => m.id === id) ?? null;
}

export function saveMeeting(meeting: Meeting): void {
  sessionStorage.setItem(`meeting_${meeting.id}`, JSON.stringify(meeting));
  const meetings = getMeetings();
  const idx = meetings.findIndex((m) => m.id === meeting.id);
  if (idx >= 0) meetings[idx] = meeting;
  else meetings.unshift(meeting);
  localStorage.setItem("meetings", JSON.stringify(meetings.slice(0, 50)));
}

export function updateTask(meetingId: string, taskIndex: number, patch: Partial<Task>): Meeting | null {
  const meeting = getMeeting(meetingId);
  if (!meeting) return null;
  meeting.analysis.tasks[taskIndex] = { ...meeting.analysis.tasks[taskIndex], ...patch };
  saveMeeting(meeting);
  return meeting;
}

export function tasksToCSV(meeting: Meeting): string {
  const header = ["פעולה", "אחראי", "דדליין", "סטטוס"].join(",");
  const rows = meeting.analysis.tasks.map((t) =>
    [t.action, t.responsible, t.deadline, t.status]
      .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return "﻿" + [header, ...rows].join("\n"); // BOM for Hebrew in Excel/Sheets
}
