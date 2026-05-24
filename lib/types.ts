export type TaskStatus = "פתוח" | "בתהליך" | "הושלם" | "באיחור";

export interface Task {
  action: string;
  responsible: string;
  deadline: string;
  status: TaskStatus;
}

export interface HistoricalInsight {
  type:
    | "owner_performance"
    | "zombie_topic"
    | "contractor"
    | "area_heatmap"
    | "trend"
    | "seasonality"
    | "compliance_score"
    | "prediction";
  title: string;
  body: string;
  confidence: "high" | "medium" | "low";
}

export interface AnalysisResult {
  executive_summary: string;
  key_decisions: string[];
  tasks: Task[];
  red_flags: string[];
  tasks_without_owner: string[];
  historical_insights: HistoricalInsight[];
}

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  created_at: string;
  analysis: AnalysisResult;
}
