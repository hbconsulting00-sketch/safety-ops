import { Meeting, Task } from "./types";
import { getSupabase } from "./supabase";
import { DEMO_MEETINGS } from "./demoData";

export async function getMeetings(): Promise<Meeting[]> {
  const { data, error } = await getSupabase()
    .from("meetings")
    .select("*")
    .order("meeting_date", { ascending: false });

  if (error) {
    console.error("getMeetings error:", error.message);
    return [];
  }

  const rows = (data || []) as Meeting[];
  const existingIds = new Set(rows.map((m) => m.id));
  const missingDemos = DEMO_MEETINGS.filter((m) => !existingIds.has(m.id));

  if (missingDemos.length > 0) {
    await seedDemoMeetings(missingDemos);
    const { data: refreshed } = await getSupabase()
      .from("meetings")
      .select("*")
      .order("meeting_date", { ascending: false });
    return (refreshed || []) as Meeting[];
  }

  return rows;
}

async function seedDemoMeetings(meetings: Meeting[] = DEMO_MEETINGS) {
  for (const m of meetings) {
    await getSupabase().from("meetings").upsert({
      id: m.id,
      title: m.title,
      meeting_date: m.meeting_date,
      created_at: m.created_at,
      analysis: m.analysis,
    });
  }
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(`meeting_${id}`);
    if (cached) return JSON.parse(cached);
  }

  const { data, error } = await getSupabase()
    .from("meetings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Meeting;
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`meeting_${meeting.id}`, JSON.stringify(meeting));
  }

  await getSupabase().from("meetings").upsert({
    id: meeting.id,
    title: meeting.title,
    meeting_date: meeting.meeting_date,
    created_at: meeting.created_at,
    analysis: meeting.analysis,
  });
}

export async function updateTask(
  meetingId: string,
  taskIndex: number,
  patch: Partial<Task>
): Promise<Meeting | null> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) return null;
  meeting.analysis.tasks[taskIndex] = { ...meeting.analysis.tasks[taskIndex], ...patch };
  await saveMeeting(meeting);
  return meeting;
}

export async function reorderTasks(meetingId: string, newTasks: Task[]): Promise<Meeting | null> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) return null;
  meeting.analysis.tasks = newTasks;
  await saveMeeting(meeting);
  return meeting;
}

export async function deleteMeeting(id: string): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(`meeting_${id}`);
  }
  await getSupabase().from("meetings").delete().eq("id", id);
}

export function tasksToCSV(meeting: Meeting): string {
  const header = ["פעולה", "אחראי", "דדליין", "סטטוס"].join(",");
  const rows = meeting.analysis.tasks.map((t) =>
    [t.action, t.responsible, t.deadline, t.status]
      .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return "﻿" + [header, ...rows].join("\n");
}
