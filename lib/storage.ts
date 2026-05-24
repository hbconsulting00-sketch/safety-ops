import { Meeting, Task } from "./types";
import { supabase } from "./supabase";
import { DEMO_MEETINGS } from "./demoData";

export async function getMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .order("meeting_date", { ascending: false });

  if (error) {
    console.error("getMeetings error:", error.message);
    return [];
  }

  if (!data || data.length === 0) {
    await seedDemoMeetings();
    return [...DEMO_MEETINGS].reverse();
  }

  return data as Meeting[];
}

async function seedDemoMeetings() {
  for (const m of DEMO_MEETINGS) {
    await supabase.from("meetings").upsert({
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

  const { data, error } = await supabase
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

  await supabase.from("meetings").upsert({
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

export function tasksToCSV(meeting: Meeting): string {
  const header = ["פעולה", "אחראי", "דדליין", "סטטוס"].join(",");
  const rows = meeting.analysis.tasks.map((t) =>
    [t.action, t.responsible, t.deadline, t.status]
      .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return "﻿" + [header, ...rows].join("\n");
}
