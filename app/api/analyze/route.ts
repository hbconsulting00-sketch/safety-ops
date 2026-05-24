import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResult } from "@/lib/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `אתה מומחה לניהול בטיחות תעסוקתית. אתה מנתח פרוטוקולי ועדת בטיחות ומפיק תוכניות פעולה ניהוליות.

עליך להחזיר JSON בלבד, ללא טקסט נוסף, לפי הסכמה הבאה בדיוק:
{
  "executive_summary": "סיכום של 3-4 משפטים",
  "key_decisions": ["החלטה 1", "החלטה 2"],
  "tasks": [
    {
      "action": "תיאור הפעולה",
      "responsible": "שם האחראי או ריק אם לא צוין",
      "deadline": "תאריך בפורמט YYYY-MM-DD או ריק",
      "status": "פתוח"
    }
  ],
  "red_flags": ["דגל אדום 1 — מה ולמה"],
  "tasks_without_owner": ["משימה ללא בעלים 1"],
  "historical_insights": []
}

כללים:
- status תמיד "פתוח" לדיון חדש
- tasks_without_owner: משימות שאין להן אחראי מוגדר בפרוטוקול
- red_flags: ליקויים חמורים, סיכונים מיידיים, החלטות ללא מועד ביצוע
- historical_insights ריק בניתוח ראשוני (יתמלא בפנייה נפרדת)
- כתוב הכל בעברית`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;

    let protocolText = text || "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        protocolText = data.text;
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        protocolText = result.value;
      } else {
        protocolText = buffer.toString("utf-8");
      }
    }

    if (!protocolText.trim()) {
      return NextResponse.json({ error: "לא התקבל טקסט לניתוח" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `נתח את פרוטוקול ועדת הבטיחות הבא:\n\n${protocolText}`,
        },
      ],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const jsonText = rawContent.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const analysis: AnalysisResult = JSON.parse(jsonText);

    const meeting = {
      id: crypto.randomUUID(),
      title: formData.get("title") as string || "דיון ועדת בטיחות",
      meeting_date: formData.get("meeting_date") as string || new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      analysis,
    };

    return NextResponse.json(meeting);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: "שגיאה בעיבוד הפרוטוקול. אנא נסה שנית." },
      { status: 500 }
    );
  }
}
