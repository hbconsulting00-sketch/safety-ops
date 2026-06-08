import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResult } from "@/lib/types";

export const maxDuration = 60;

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
- כתוב הכל בעברית
- חשוב מאוד: קיצורים עבריים כמו בע"מ, צה"ל, רמ"ח — כתוב אותם עם גרשיים עבריים (״) ולא עם מרכאות ASCII ("), לדוגמה: בע״מ, צה״ל. מרכאות כפולות רגילות מותרות אך ורק לסימון מפתחות וערכים ב-JSON עצמו`;

// Keep within ~45s generation time on Vercel Hobby (60s hard limit)
function truncate(text: string, maxChars = 18000): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "\n\n[המסמך קוצר לניתוח — אורך מקורי: " + text.length + " תווים]";
}

export async function POST(req: NextRequest) {
  // Parse request before starting stream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userContent: any[];
  let meetingTitle: string;
  let meetingDate: string;

  try {
    const formData = await req.formData();
    meetingTitle = (formData.get("title") as string) || "דיון ועדת בטיחות";
    meetingDate = (formData.get("meeting_date") as string) || new Date().toISOString().split("T")[0];

    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        userContent = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
          },
          { type: "text", text: "נתח את פרוטוקול ועדת הבטיחות המצורף" },
        ];
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mammothMod = await import("mammoth");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mammoth = (mammothMod as any).default ?? mammothMod;
        const result = await mammoth.extractRawText({ buffer });
        if (!result.value.trim()) {
          return NextResponse.json({ error: "לא הצלחתי לחלץ טקסט מהקובץ" }, { status: 400 });
        }
        userContent = [{ type: "text", text: `נתח את פרוטוקול ועדת הבטיחות הבא:\n\n${truncate(result.value)}` }];
      } else {
        const txt = buffer.toString("utf-8");
        userContent = [{ type: "text", text: `נתח את פרוטוקול ועדת הבטיחות הבא:\n\n${truncate(txt)}` }];
      }
    } else if (text?.trim()) {
      userContent = [{ type: "text", text: `נתח את פרוטוקול ועדת הבטיחות הבא:\n\n${truncate(text)}` }];
    } else {
      return NextResponse.json({ error: "לא התקבל טקסט לניתוח" }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `שגיאה בעיבוד הקובץ: ${msg}` }, { status: 400 });
  }

  // Stream Claude's response — keeps the connection alive during long generation
  const encoder = new TextEncoder();
  const meetingId = crypto.randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 6000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
          stream: true,
        });

        let fullText = "";

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            // Heartbeat byte — tells Vercel the connection is active
            controller.enqueue(encoder.encode(" "));
          }
        }

        const rawJson = fullText.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
        // Fix unescaped " inside Hebrew words (e.g. בע"מ → בע״מ)
        const jsonText = rawJson.replace(/(?<=[א-ת])"(?=[א-ת])/g, "״");
        let analysis: AnalysisResult;
        try {
          analysis = JSON.parse(jsonText);
        } catch {
          // Last-resort: strip any remaining bare " inside string values
          const fallback = jsonText.replace(/([^\\])"(?=[^,:{}\[\]\n])/g, '$1\\"');
          analysis = JSON.parse(fallback);
        }

        const meeting = {
          id: meetingId,
          title: meetingTitle,
          meeting_date: meetingDate,
          created_at: new Date().toISOString(),
          analysis,
        };

        controller.enqueue(encoder.encode("\n[[RESULT]]" + JSON.stringify(meeting)));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode("\n[[ERROR]]" + JSON.stringify({ error: msg })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
