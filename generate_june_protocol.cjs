const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
} = require("docx");
const fs = require("fs");

const HEADER_BG  = "1A5276";
const LIGHT_BLUE = "EBF5FF";
const LIGHT_RED  = "FDEDEC";
const LIGHT_GRAY = "F5F5F5";
const LIGHT_GREEN= "EAFAF1";
const AMBER_BG   = "FEF9E7";
const RED        = "C0392B";
const GREEN      = "1E8449";

function cell(text, opts = {}) {
  const { bg, bold, color, width, center } = opts;
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: bg ? { type: ShadingType.SOLID, color: bg, fill: bg } : undefined,
    margins: { top: 80, bottom: 80, left: 110, right: 110 },
    children: [new Paragraph({
      bidirectional: true,
      alignment: center ? AlignmentType.CENTER : AlignmentType.RIGHT,
      children: [new TextRun({ text, bold: !!bold, color: color || "111111", rightToLeft: true, size: 20 })],
    })],
  });
}

function hdr(text, bg = LIGHT_BLUE) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { before: 260, after: 80 },
    shading: { type: ShadingType.SOLID, color: bg, fill: bg },
    children: [new TextRun({ text, bold: true, size: 24, color: HEADER_BG, rightToLeft: true })],
  });
}

function p(text, opts = {}) {
  const { bold, color, spacing, bullet } = opts;
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: spacing || { before: 60, after: 60 },
    bullet: bullet ? { level: 0 } : undefined,
    children: [new TextRun({ text, bold: !!bold, color: color || "111111", rightToLeft: true, size: 20 })],
  });
}

// ─── טבלת מעקב מישיבת מרץ ───
function prevTable() {
  const rows = [
    ["✅ בוצע",    "שלמה ביטון",   "25.03", "סקר בטיחות מסועי קו א' — גארד הותקן, 5 מסועים נוספים תקינים"],
    ["✅ בוצע",    "הדר פרידמן",   "31.03", "הדרכת בטיחות ל-12 מפעילי מסועים — הושלמה ב-28.03"],
    ["✅ בוצע",    "שלמה ביטון",   "20.03", "תיקון מעקות גשר גישה לאזור קירור 3 — בוצע לאחר דחייה"],
    ["✅ בוצע",    "שלמה ביטון",   "22.03", "תחזוקה מניעתית ל-7 מכונות אריזה — בוצעה ב-18.03"],
    ["⚠️ חלקי",   "גיא ברקוביץ",  "15.03", "נוהל עבודה בחדר חומרים — טיוטה הוגשה, טרם אושרה ע\"י סמנכ\"ל"],
    ["⚠️ חלקי",   "יוסי אברהם",   "15.03", "שילוט בטיחות קו ב' — הוצב ב-6 עמדות, נותרו 2"],
    ["❌ לא בוצע", "דינה כהן-לוי", "31.03", "עדכון נוהל עבודה עם מלגזות חשמליות — דחוי לשלישית"],
    ["❌ לא בוצע", "—",            "30.04", "בדיקת ציוד PPE — לא מונה אחראי, לא בוצע"],
    ["❌ לא בוצע", "—",            "",      "ועדת בדיקה לתרבות הבטיחות — אושר עקרונית, לא הוקמה"],
  ];
  return new Table({
    bidiVisual: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [
        cell("סטטוס",  { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 12, center: true }),
        cell("אחראי",  { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 16 }),
        cell("יעד",    { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 10, center: true }),
        cell("פעולה",  { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 62 }),
      ]}),
      ...rows.map(([status, owner, date, action]) => {
        const bg = status.startsWith("✅") ? LIGHT_GREEN : status.startsWith("❌") ? LIGHT_RED : AMBER_BG;
        return new TableRow({ children: [
          cell(status, { bg, center: true }),
          cell(owner,  { bg, color: owner === "—" ? RED : "111111", bold: owner === "—" }),
          cell(date,   { bg, center: true }),
          cell(action, { bg }),
        ]});
      }),
    ],
  });
}

// ─── טבלת אירועים ───
function incidentsTable() {
  const rows = [
    ["🟡 בינונית", "02.04.26", "נפילת חפץ ממדף גבוה באזור אחסון ג' — ארגז 8 ק\"ג נפל ממדף עליון, לא פגע באיש. ממצאים: מדפים עמוסים מעל לנפח המותר, אין רשת בטיחות תחתית."],
    ["🔴 גבוהה",   "19.04.26", "תאונת עבודה — עובד קו ב' לכד יד במכונת מילוי בעת ניקוי ללא הפסקת מכונה. פציעה: חתכים ושפשופים, 8 ימי אי-כושר. ממצאים: נוהל LOTO לא יושם, גארד הוסר בשבוע שעבר ולא הוחזר."],
    ["🟡 בינונית", "07.05.26", "כמעט-תאונה — מלגזה וכלי רגלי הגיעו לאותה צומת בו-זמנית באזור מעבר 4. לא נגרם נזק. ממצאים: שילוט עדיפות אינו קיים בצומת, נהג לא עבר ריענון (עדיין ממרץ)."],
    ["🟢 קלה",     "22.05.26", "תקרית — דליפת נוזל ניקוי מיכל פגום ליד תחנת ייצור 3. הוכל מיידית. ממצאים: מיכל לא עבר בדיקה שנתית."],
  ];
  return new Table({
    bidiVisual: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [
        cell("חומרה",  { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 11, center: true }),
        cell("תאריך", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 11, center: true }),
        cell("תיאור ונסיבות", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 78 }),
      ]}),
      ...rows.map(([sev, date, desc], i) => {
        const bg = sev.startsWith("🔴") ? LIGHT_RED : i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY;
        return new TableRow({ children: [
          cell(sev,  { bg, center: true }),
          cell(date, { bg, center: true }),
          cell(desc, { bg }),
        ]});
      }),
    ],
  });
}

// ─── טבלת החלטות ───
function decisionsTable() {
  const rows = [
    ["1",  "גיא ברקוביץ",  "30.06.26", "חקירת שורש לאירוע ה-LOTO מ-19.04 — הגשת ממצאים ותכנית מניעה לישיבה הבאה"],
    ["2",  "שלמה ביטון",   "25.06.26", "ביצוע סקר LOTO לכל מכונות הייצור — וידוא שגארדים במקום ונוהל ידוע לכל מפעיל"],
    ["3",  "הדר פרידמן",   "20.06.26", "הדרכת LOTO מחודשת לכלל עובדי הייצור — 45 עובדים, כולל מבחן עם ציון עובר"],
    ["4",  "שלמה ביטון",   "15.06.26", "התקנת רשתות בטיחות תחתיות בכל 6 המדפים הגבוהים באזור אחסון"],
    ["5",  "דינה כהן-לוי", "30.06.26", "עדכון נוהל עבודה עם מלגזות — אישור סמנכ\"ל תפעול (דחוי מינואר ומרץ!)"],
    ["6",  "הדר פרידמן",   "30.06.26", "ריענון הדרכת מלגזות לנהג שטרם עשה (ממרץ) + בדיקת יתר הנהגים"],
    ["7",  "גיא ברקוביץ",  "30.06.26", "אישור נוהל חדר חומרים ע\"י סמנכ\"ל — גיא ברקוביץ יתאם ישירות"],
    ["8",  "נועה קמחי",    "15.07.26", "רכש ציוד PPE — בדיקת מפרטים, הזמנה ואספקה לכל העמדות"],
    ["9",  "שלמה ביטון",   "30.06.26", "בדיקה שנתית לכל מיכלי נוזלים — 14 יחידות"],
    ["10", "גיא ברקוביץ",  "31.07.26", "הקמת ועדת תרבות בטיחות — מינוי 3 חברים וקיום ישיבה ראשונה"],
    ["11", "",             "",         "הכנת מצגת מגמות בטיחות H1 2026 להנהלה הבכירה — לא מונה אחראי"],
  ];
  return new Table({
    bidiVisual: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [
        cell("#",       { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 6,  center: true }),
        cell("אחראי",   { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 16 }),
        cell("יעד",     { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 12, center: true }),
        cell("פעולה",   { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 66 }),
      ]}),
      ...rows.map(([num, owner, date, action], i) => {
        const noOwner = !owner;
        const bg = noOwner ? LIGHT_RED : i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY;
        return new TableRow({ children: [
          cell(num,    { bg, center: true }),
          cell(owner || "⚠️ לא הוגדר", { bg, color: noOwner ? RED : "111111", bold: noOwner }),
          cell(date,   { bg, center: true }),
          cell(action, { bg }),
        ]});
      }),
    ],
  });
}

// ════════ DOCUMENT ════════
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "David", size: 20, rightToLeft: true }, paragraph: { alignment: AlignmentType.RIGHT, bidirectional: true } },
    },
  },
  sections: [{
    properties: { bidi: true },
    children: [

      // ── כותרת ──
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.SOLID, color: HEADER_BG, fill: HEADER_BG },
        children: [new TextRun({ text: "כרמל מזון בע״מ", bold: true, size: 44, color: "FFFFFF", rightToLeft: true })],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 300 },
        shading: { type: ShadingType.SOLID, color: HEADER_BG, fill: HEADER_BG },
        children: [new TextRun({ text: "פרוטוקול ועדת בטיחות  |  ישיבה 3/2026  |  יוני 2026", size: 22, color: "AED6F1", rightToLeft: true })],
      }),

      // ── פרטי ישיבה ──
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 40 },
        children: [
          new TextRun({ text: "תאריך: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "9 ביוני 2026   ", rightToLeft: true, size: 20 }),
          new TextRun({ text: "  |  שעה: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "09:00–11:00   ", rightToLeft: true, size: 20 }),
          new TextRun({ text: "  |  מיקום: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "חדר ישיבות קומה 1, בניין ניהול", rightToLeft: true, size: 20 }),
        ],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 240 },
        children: [
          new TextRun({ text: "ישיבה קודמת: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "10 במרץ 2026   ", rightToLeft: true, size: 20 }),
          new TextRun({ text: "  |  ישיבה הבאה: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "8 בספטמבר 2026   ", rightToLeft: true, size: 20 }),
          new TextRun({ text: "  |  מנהלת הישיבה: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "גיא ברקוביץ, ממונה בטיחות ראשי", rightToLeft: true, size: 20 }),
        ],
      }),

      // ── מעקב מרץ ──
      hdr("א. מעקב אחר החלטות ישיבת מרץ 2026"),
      p("מתוך 9 פעולות שהוחלטו בישיבת מרץ — 4 בוצעו, 2 בוצעו חלקית, 3 לא בוצעו כלל:", { spacing: { before: 120, after: 80 } }),
      prevTable(),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 100, after: 200 },
        shading: { type: ShadingType.SOLID, color: LIGHT_RED, fill: LIGHT_RED },
        children: [new TextRun({ text: "⚠️ הערת יו\"ר: נוהל עבודה עם מלגזות נדחה בשלוש ישיבות רצופות. הוועדה מנחה לסגור את הנושא עד ישיבת ספטמבר ללא דחייה נוספת.", bold: true, color: RED, rightToLeft: true, size: 20 })],
      }),

      // ── אירועים ──
      hdr("ב. אירועי בטיחות — אפריל–מאי 2026"),
      p("נרשמו 4 אירועים בתקופה, מהם תאונת עבודה אחת (8 ימי אי-כושר):", { spacing: { before: 120, after: 80 } }),
      incidentsTable(),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: "מגמה: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "H1 2026 — 3 תאונות עבודה, 43 ימי אי-כושר. לשם השוואה: כל שנת 2025 — 4 תאונות, 51 ימי אי-כושר. קצב שנתי 2026 גבוה משמעותית.", rightToLeft: true, size: 20 }),
        ],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 60, after: 200 },
        children: [
          new TextRun({ text: "גורם חוזר: ", bold: true, rightToLeft: true, size: 20 }),
          new TextRun({ text: "3 מתוך 4 האירועים קשורים לגארדים שהוסרו ולא הוחזרו או לנהלים שלא יושמו — דפוס שמצריך מענה מערכתי.", rightToLeft: true, size: 20 }),
        ],
      }),

      // ── החלטות ──
      hdr("ג. החלטות ופעולות — יוני–יולי 2026"),
      p("11 פעולות הוחלטו בישיבה זו:", { spacing: { before: 120, after: 80 } }),
      decisionsTable(),

      // ── דגלים אדומים ──
      hdr("ד. דגלים אדומים", LIGHT_RED),
      ...[
        "גארד שהוסר ולא הוחזר — אירוע שלישי בשישה חודשים. כל פעם אחרת. מצביע על כשל בנוהל החזרת ציוד, לא על רשלנות פרטנית.",
        "נוהל LOTO אינו מיושם בפועל — למרות הוראות קיימות. התוצאה: תאונת יד ב-19.04. דרוש אכיפה מיידית ובקרת מפקחים.",
        "נוהל מלגזות דחוי בשלוש ישיבות רצופות — פגיעה ישירה ביכולת לאכוף בטיחות בשטח.",
        "קצב ימי אי-כושר עולה — 43 ימים ב-H1 2026 לעומת 51 בכל 2025. אם המגמה נמשכת, 2026 יהיה שנת שיא שלילי.",
        "ועדת תרבות בטיחות ובדיקת PPE — אושרו בישיבות קודמות, לא הוקמו. חוסר ביצוע של החלטות מרכזיות.",
      ].map(flag => new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 80, after: 60 },
        shading: { type: ShadingType.SOLID, color: LIGHT_RED, fill: LIGHT_RED },
        children: [new TextRun({ text: `🚩 ${flag}`, rightToLeft: true, size: 20 })],
      })),

      // ── נושאים שעלו ──
      hdr("ה. נושאים שעלו בדיון"),
      p("אמיר שפירא (נציג עובדים): עובדים מסרבים לדווח על גארדים חסרים מחשש לביקורת. הציע מנגנון דיווח אנונימי — הוחלט לשלב בתוך ועדת תרבות הבטיחות.", { spacing: { before: 100, after: 80 } }),
      p("יוסי אברהם (מנהל קו ב'): מכונת האריזה שנפגעה ב-19.04 חזרה לפעולה מבלי שהוכנה תעודת חזרה לפעילות (Return to Service). הנושא הועבר לשלמה ביטון לטיפול מיידי.", { spacing: { before: 60, after: 80 } }),
      p("גיא ברקוביץ: הציע לשקול הגדרת יעד ביצועי מדיד לבטיחות (מדד KPI) שיוצג להנהלה הבכירה מדי רבעון. הוועדה אישרה עקרונית — הצגה בישיבת ספטמבר.", { spacing: { before: 60, after: 200 } }),

      // ── חתימה ──
      hdr("ו. אישור הפרוטוקול"),
      new Table({
        bidiVisual: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            cell("ממונה הבטיחות הראשי:", { bg: LIGHT_GRAY, bold: true, width: 30 }),
            cell("גיא ברקוביץ", { width: 30 }),
            cell("חתימה: ______________________", { width: 40 }),
          ]}),
          new TableRow({ children: [
            cell("תאריך אישור:", { bg: LIGHT_GRAY, bold: true, width: 30 }),
            cell("", { width: 30 }),
            cell("", { width: 40 }),
          ]}),
        ],
      }),

      new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        spacing: { before: 280 },
        children: [new TextRun({ text: "מסמך פנימי — לא להפצה מחוץ לחברה", size: 16, color: "AAAAAA", rightToLeft: true })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("./demo_protocol_june2026.docx", buf);
  console.log("✅ Created: demo_protocol_june2026.docx");
});
