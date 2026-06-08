const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageOrientation, convertInchesToTwip, Header, Footer,
} = require("docx");
const fs = require("fs");

const BRAND_BLUE = "2E81C5";
const BRAND_GREEN = "4A7C25";
const RED = "C0392B";
const LIGHT_BLUE_BG = "EBF5FF";
const LIGHT_RED_BG = "FDEDEC";
const LIGHT_GRAY = "F5F5F5";
const HEADER_BG = "1A5276";

function rtl(text, opts = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    ...opts,
    children: Array.isArray(text) ? text : [new TextRun({ text, rightToLeft: true, ...opts.run })],
  });
}

function cell(content, opts = {}) {
  const { bg, bold, color, width, center, run: runOpts = {} } = opts;
  const runs = Array.isArray(content)
    ? content
    : [new TextRun({ text: content, bold: bold || false, color: color || "000000", rightToLeft: true, ...runOpts })];
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: bg ? { type: ShadingType.SOLID, color: bg, fill: bg } : undefined,
    children: [new Paragraph({
      bidirectional: true,
      alignment: center ? AlignmentType.CENTER : AlignmentType.RIGHT,
      children: runs,
    })],
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function sectionHeader(title, bg = LIGHT_BLUE_BG) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 240, after: 80 },
    shading: { type: ShadingType.SOLID, color: bg, fill: bg },
    children: [new TextRun({
      text: title, bold: true, size: 24, color: HEADER_BG, rightToLeft: true,
    })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
    children: [],
  });
}

// ===== TABLES =====

function makeAttendeesTable() {
  const header = new TableRow({
    children: [
      cell("תפקיד", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 35, center: true }),
      cell("שם", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 30, center: true }),
      cell("חתימה", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 20, center: true }),
    ],
    tableHeader: true,
  });
  const rows = [
    ["ממונה הבטיחות הראשי", "גיא ברקוביץ", ""],
    ["מנהל ייצור — קו א'", "רחל שמעוני", ""],
    ["מנהל ייצור — קו ב'", "יוסי אברהם", ""],
    ["מנהל לוגיסטיקה ואחסנה", "דינה כהן-לוי", ""],
    ["נציג עובדים (ועד)", "אמיר שפירא", ""],
    ["ממונה רכש וחומרים", "נועה קמחי", ""],
    ["מנהל תחזוקה", "שלמה ביטון", ""],
    ["מנהל משאבי אנוש", "הדר פרידמן", ""],
  ].map(([role, name, sig], i) =>
    new TableRow({
      children: [
        cell(role, { bg: i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY }),
        cell(name, { bg: i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY, bold: true }),
        cell(sig, { bg: i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY }),
      ],
    })
  );
  return new Table({ rows: [header, ...rows], width: { size: 100, type: WidthType.PERCENTAGE }, bidiVisual: true });
}

function makePreviousActionsTable() {
  const header = new TableRow({
    children: [
      cell("סטטוס", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 12, center: true }),
      cell("אחראי", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 15 }),
      cell("מועד יעד", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 13, center: true }),
      cell("פעולה שהוחלטה בישיבה הקודמת", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 60 }),
    ],
    tableHeader: true,
  });
  const prev = [
    ["✅ בוצע", "שלמה ביטון", "31.01.26", "החלפת מסועים 3 ו-4 בקו הייצור — בוצעה בדיקת בטיחות ואישור חידוש הפעלה"],
    ["✅ בוצע", "הדר פרידמן", "15.02.26", "ריענון הדרכת בטיחות ל-40 עובדי קו ב' — הושלמה ב-12.02"],
    ["⚠️ חלקי", "גיא ברקוביץ", "28.02.26", "בדיקת מערכת כיבוי האש בכל המחסנים — בוצע ב-2 מתוך 4 מחסנים"],
    ["❌ לא בוצע", "שלמה ביטון", "15.02.26", "תיקון מעקות בגשר גישה לאזור קירור 3 — נדחה עקב המתנה לחלפים"],
    ["❌ לא בוצע", "דינה כהן-לוי", "28.02.26", "עדכון נוהל עבודה עם מלגזות חשמליות — אחראי לא קבע מועד ביצוע"],
    ["⚠️ חלקי", "יוסי אברהם", "20.02.26", "הצבת שילוט בטיחות מחודש בקו ב' — הוצב ב-3 עמדות מתוך 8"],
  ];
  const rows = prev.map(([status, owner, date, action], i) => {
    const isDone = status.startsWith("✅");
    const isLate = status.startsWith("❌");
    const bg = isDone ? "EAF7EA" : isLate ? LIGHT_RED_BG : "FFFBEA";
    return new TableRow({
      children: [
        cell(status, { bg, center: true }),
        cell(owner, { bg }),
        cell(date, { bg, center: true }),
        cell(action, { bg }),
      ],
    });
  });
  return new Table({ rows: [header, ...rows], width: { size: 100, type: WidthType.PERCENTAGE }, bidiVisual: true });
}

function makeIncidentsTable() {
  const header = new TableRow({
    children: [
      cell("חומרה", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 10, center: true }),
      cell("תיאור האירוע ונסיבותיו", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 60 }),
      cell("תאריך", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 12, center: true }),
      cell("מס'", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 8, center: true }),
    ],
    tableHeader: true,
  });
  const incidents = [
    ["1", "08.01.26", "גבוהה 🔴",
     "תאונת עבודה — עובד קו א' נחבל בידו הימנית עקב הכנסת יד לתוך מסוע בתנועה. נזק: שבר בשני אצבעות, 21 ימי אי-כושר. ממצאי חקירה: גארד מגן הוסר ולא הוחזר לאחר תחזוקה ב-31.12.25, העובד לא עבר הדרכה ייעודית על הפעלת המסוע."],
    ["2", "17.01.26", "בינונית 🟡",
     "כמעט-תאונה — דליפת חומר חיטוי ריכוזי (פרואוקסיד מימן 35%) ממיכל אחסון בחדר החומרים. הדליפה זוהתה ע\"י עובד שנכנס ללא ציוד מגן נשימה. לא נגרם פציעה אך נדרש פינוי זמני של 3 עובדים. ממצאי חקירה: שסתום כניסה לא נאטם כראוי לאחר מילוי, אין חיישן גז ייעודי לפרואוקסיד בחדר."],
    ["3", "29.01.26", "נמוכה 🟢",
     "תקרית — מלגזה גיחכה לאחר חריגה מנתיב מסומן באזור פריקה 7. נזק חומרי בלבד (פגיעה בקיר). ממצאי חקירה: קיר הפרדה בין נתיב מלגזות לנתיב הולכי רגל אינו קיים בכניסה לאזור 7, הנהג לא ביצע ריענון הדרכה מאז 2023."],
    ["4", "14.02.26", "גבוהה 🔴",
     "תאונת עבודה — עובדת ממחלקת אריזה החליקה על ריצפה רטובה ונפלה. אובחנה שבר בשורש כף יד שמאל, 14 ימי אי-כושר. ממצאי חקירה: שלט 'ריצפה רטובה' לא הוצב לאחר ניקוי הרצפה, מדיניות ניקוי בזמן שעות העבודה אינה מוסדרת."],
    ["5", "02.03.26", "בינונית 🟡",
     "כמעט-תאונה — רכיב מכני (גלגל שיניים, משקל 12 ק\"ג) נפל ממכונת אריזה גובה 2.4 מ' בזמן עצירה מתוכננת. לא נגרם פציעה רק כי אזור מתחת למכונה היה מפונה. ממצאי חקירה: תחזוקה מניעתית לא בוצעה 4 חודשים, ברגי הידוק לא נבדקו."],
  ];
  const rows = incidents.map(([num, date, severity, desc], i) => {
    const isHigh = severity.includes("גבוהה");
    const bg = isHigh ? LIGHT_RED_BG : i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY;
    return new TableRow({
      children: [
        cell(severity, { bg, center: true }),
        cell(desc, { bg }),
        cell(date, { bg, center: true }),
        cell(num, { bg, center: true }),
      ],
    });
  });
  return new Table({ rows: [header, ...rows], width: { size: 100, type: WidthType.PERCENTAGE }, bidiVisual: true });
}

function makeDecisionsTable() {
  const header = new TableRow({
    children: [
      cell("סטטוס", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 10, center: true }),
      cell("מועד יעד", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 12, center: true }),
      cell("אחראי", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 15 }),
      cell("פעולה נדרשת", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 55 }),
      cell("#", { bg: HEADER_BG, bold: true, color: "FFFFFF", width: 8, center: true }),
    ],
    tableHeader: true,
  });
  const actions = [
    ["1", "הוספת גארד מגן למסוע 2 וסקר בטיחות לכל מסועי קו א' — 6 יחידות", "שלמה ביטון", "25.03.26", "פתוח"],
    ["2", "ביצוע הדרכת בטיחות ייעודית ל-12 מפעילי מסועים שלא עברו הדרכה מאז 2024", "הדר פרידמן", "31.03.26", "פתוח"],
    ["3", "התקנת חיישן גז לפרואוקסיד מימן בחדר החומרים + בדיקת כל שסתומי מיכלי הכימיקלים", "שלמה ביטון", "15.03.26", "פתוח"],
    ["4", "הכנת נוהל כניסה לחדר חומרים (PPE חובה, רישום כניסות, זוגיות חובה)", "גיא ברקוביץ", "20.03.26", "פתוח"],
    ["5", "סימון מחדש של כל נתיבי מלגזות — כולל קירות הפרדה בכניסות לאזורים 6 ו-7", "שלמה ביטון", "10.04.26", "פתוח"],
    ["6", "ריענון הדרכת מלגזות לכל 8 נהגים המורשים — כולל מבחן מעשי", "הדר פרידמן", "31.03.26", "פתוח"],
    ["7", "גיבוש מדיניות ניקוי ריצפות — שעות מותרות, חובת שילוט, אחריות פיקוח", "גיא ברקוביץ", "15.03.26", "פתוח"],
    ["8", "תחזוקה מניעתית מיידית לכל מכונות האריזה — 7 יחידות — כולל בדיקת ברגי הידוק", "שלמה ביטון", "22.03.26", "פתוח"],
    ["9", "השלמת בדיקת מערכת כיבוי אש ב-2 המחסנים שנותרו (מישיבה קודמת)", "גיא ברקוביץ", "31.03.26", "פתוח"],
    ["10", "תיקון מעקות גשר גישה לאזור קירור 3 — דחוי מינואר, ביצוע מיידי", "שלמה ביטון", "20.03.26", "פתוח"],
    ["11", "עדכון נוהל עבודה עם מלגזות חשמליות + אישור סמנכ\"ל תפעול (נדחה מינואר)", "דינה כהן-לוי", "31.03.26", "פתוח"],
    ["12", "הצבת שילוט בטיחות ב-5 העמדות החסרות בקו ב' (מישיבה קודמת, חלקי)", "יוסי אברהם", "15.03.26", "פתוח"],
    ["13", "ניתוח מגמות — הכנת דו\"ח שיעור ימי אי-כושר H1 2026 מול H1 2025", "גיא ברקוביץ", "15.04.26", "פתוח"],
    ["14", "בדיקת עמידת כל ציוד ה-PPE במפרט — 3 שנים מאז הרכש האחרון", "", "30.04.26", "פתוח"],
    ["15", "הקמת ועדת בדיקה לתרבות הבטיחות בקרב עובדים חדשים (עלה ע\"י אמיר שפירא)", "", "", "פתוח"],
  ];
  const rows = actions.map(([num, action, owner, date, status], i) => {
    const isLate = !owner;
    const bg = isLate ? LIGHT_RED_BG : i % 2 === 0 ? "FFFFFF" : LIGHT_GRAY;
    return new TableRow({
      children: [
        cell(status, { bg, center: true }),
        cell(date, { bg, center: true }),
        cell(owner || "⚠️ לא הוגדר", { bg, color: owner ? "000000" : RED }),
        cell(action, { bg }),
        cell(num, { bg, center: true }),
      ],
    });
  });
  return new Table({ rows: [header, ...rows], width: { size: 100, type: WidthType.PERCENTAGE }, bidiVisual: true });
}

// ===== DOCUMENT =====

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "David", size: 22, rightToLeft: true },
        paragraph: { alignment: AlignmentType.RIGHT, bidirectional: true },
      },
    },
  },
  sections: [{
    properties: { bidi: true },
    children: [

      // ===== TITLE BLOCK =====
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        shading: { type: ShadingType.SOLID, color: HEADER_BG, fill: HEADER_BG },
        children: [new TextRun({ text: "כרמל מזון בע\"מ", bold: true, size: 40, color: "FFFFFF", rightToLeft: true })],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 240 },
        shading: { type: ShadingType.SOLID, color: HEADER_BG, fill: HEADER_BG },
        children: [new TextRun({ text: "פרוטוקול ועדת בטיחות — ישיבה מספר 2/2026  |  מרץ 2026", size: 24, color: "BDC3C7", rightToLeft: true })],
      }),

      // Meeting info
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: "תאריך: ", bold: true, rightToLeft: true }),
          new TextRun({ text: "10 במרץ 2026  ", rightToLeft: true }),
          new TextRun({ text: "  |  שעה: ", bold: true, rightToLeft: true }),
          new TextRun({ text: "09:00–11:30  ", rightToLeft: true }),
          new TextRun({ text: "  |  מיקום: ", bold: true, rightToLeft: true }),
          new TextRun({ text: "חדר ישיבות המפעל, בניין ניהול, קומה 1", rightToLeft: true }),
        ],
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { after: 240 },
        children: [
          new TextRun({ text: "מספר ישיבה: ", bold: true, rightToLeft: true }),
          new TextRun({ text: "2/2026  ", rightToLeft: true }),
          new TextRun({ text: "  |  ישיבה קודמת: ", bold: true, rightToLeft: true }),
          new TextRun({ text: "14 בינואר 2026  ", rightToLeft: true }),
          new TextRun({ text: "  |  ישיבה הבאה: ", bold: true, rightToLeft: true }),
          new TextRun({ text: "5 במאי 2026", rightToLeft: true }),
        ],
      }),

      // ===== ATTENDEES =====
      sectionHeader("א. משתתפי הישיבה"),
      makeAttendeesTable(),

      new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

      // ===== PREV ACTIONS =====
      sectionHeader("ב. סקירת פעולות מישיבה קודמת (14.01.2026)"),
      rtl("להלן סטטוס הפעולות שהוחלטו בישיבת ינואר 2026:", { spacing: { before: 120, after: 80 } }),
      makePreviousActionsTable(),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 120, after: 200 },
        shading: { type: ShadingType.SOLID, color: LIGHT_RED_BG, fill: LIGHT_RED_BG },
        children: [new TextRun({
          text: "⚠️ תשומת לב: 2 מתוך 6 פעולות לא בוצעו — ועדת הבטיחות מנחה לשים דגש על ביצוע מלא של החלטות בישיבה הנוכחית.",
          bold: true, color: RED, rightToLeft: true,
        })],
      }),

      // ===== INCIDENTS =====
      sectionHeader("ג. אירועי בטיחות — ינואר–מרץ 2026"),
      rtl("בתקופה שבין 01.01.2026 ל-10.03.2026 נרשמו 5 אירועי בטיחות, מהם 2 תאונות עבודה עם ימי אי-כושר:", { spacing: { before: 120, after: 80 } }),
      makeIncidentsTable(),

      new Paragraph({ spacing: { before: 120, after: 80 }, children: [
        new TextRun({ text: "סיכום תקופתי: ", bold: true, rightToLeft: true }),
        new TextRun({ text: "2 תאונות עבודה (35 ימי אי-כושר מצטברים) | 3 כמעט-תאונות | 0 תאונות קטלניות. מגמה: ב-H1 2025 נרשמו 3 תאונות עבודה בסך 28 ימי אי-כושר — יש עלייה של כ-25% ביחס לתקופה המקבילה אשתקד.", rightToLeft: true }),
      ], bidirectional: true, alignment: AlignmentType.RIGHT }),

      new Paragraph({ spacing: { before: 120, after: 200 }, children: [
        new TextRun({ text: "גורמי שורש חוזרים: ", bold: true, rightToLeft: true }),
        new TextRun({ text: "(1) הוצאת ציוד הגנה מבלי להחזירו; (2) תחזוקה מניעתית שנדחית; (3) חוסר בשילוט ואמצעי הפרדה פיזיים; (4) עובדים ללא ריענון הדרכה.", rightToLeft: true }),
      ], bidirectional: true, alignment: AlignmentType.RIGHT }),

      // ===== DEPT SURVEY =====
      sectionHeader("ד. ממצאי סקר בטיחות מחלקתי — פברואר 2026"),
      rtl("הסקר בוצע ע\"י ממונה הבטיחות הראשי ב-3–12 בפברואר 2026. נבדקו 9 אזורי עבודה:", { spacing: { before: 120, after: 100 } }),

      ...["קו ייצור א': 3 ליקויים — גארד חסר (קריטי), שילוט חסר (2 עמדות), מדי חום לא מכוילים.",
        "קו ייצור ב': 5 ליקויים — מעקה סדוק בגשר גישה (קריטי, נדחה מינואר), מכסה חשמל פתוח, 3 שלטים שחוקים.",
        "מחסן קירור: 2 ליקויים — דלת חירום חסומה ע\"י פלטות, חיישן טמפרטורה לא מכויל.",
        "אזור אחסון חומרים: 4 ליקויים — חיישן גז חסר (קריטי), שילוט MSDS לא עדכני, ציוד PPE לא מונגש, כיבוי אש לא נבדק.",
        "חדר אריזה: 1 ליקוי — מפרק מכני במכונה מס' 4 לא טופל.",
        "אזור פריקה/טעינה: 2 ליקויים — קירות הפרדה חסרים, תאורה לקויה.",
        "משרדים ושטחים משותפים: 1 ליקוי — מטפה אש פג תוקף (ינואר 2026)."].map(txt =>
        new Paragraph({
          bidirectional: true, alignment: AlignmentType.RIGHT,
          spacing: { before: 60, after: 40 },
          bullet: { level: 0 },
          children: [new TextRun({ text: txt, rightToLeft: true })],
        })
      ),

      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        spacing: { before: 140, after: 200 },
        children: [new TextRun({ text: "סה\"כ: 18 ליקויים — 3 קריטיים, 8 משמעותיים, 7 קלים.", bold: true, rightToLeft: true })],
      }),

      // ===== DECISIONS =====
      sectionHeader("ה. החלטות ופעולות נדרשות"),
      rtl("הוועדה החליטה על 15 פעולות שיש לבצע עד ישיבת מאי 2026:", { spacing: { before: 120, after: 80 } }),
      makeDecisionsTable(),

      // ===== RED FLAGS =====
      new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),
      sectionHeader("ו. דגלים אדומים — מחייבים טיפול מיידי", LIGHT_RED_BG),

      ...[
        "תאונות חוזרות כתוצאה מגארדים שמוסרים ולא מוחזרים — 2 אירועים בפחות מ-3 חודשים, מצביע על כשל תרבותי ולא רק טכני.",
        "עדר קירור 3 — מעקה גשר גישה לא תוקן 55 יום לאחר שהוחלט (ינואר 2026). עובדים נחשפים לסכנת נפילה מגובה 2.2 מ' בכל יום עבודה.",
        "חדר חומרים ללא חיישן גז לפרואוקסיד מימן — אחד מהחומרים המסוכנים ביותר. כמעט-תאונה בינואר הייתה יכולה להסתיים בפציעה קשה.",
        "תחזוקה מניעתית נדחית ב-4 חודשים בציוד ייצור — ישירות הובילה לנפילת רכיב 12 ק\"ג מגובה. סיכון לאסון.",
        "שיעור ימי אי-כושר עולה — 35 יום ב-Q1 2026 לעומת 28 ב-H1 2025 כולו. מגמת הידרדרות ברורה.",
        "2 פעולות קריטיות מישיבה קודמת לא בוצעו — דפוס שחוזר על עצמו ומצביע על חוסר במנגנון מעקב אפקטיבי.",
      ].map(flag =>
        new Paragraph({
          bidirectional: true, alignment: AlignmentType.RIGHT,
          spacing: { before: 80, after: 40 },
          shading: { type: ShadingType.SOLID, color: LIGHT_RED_BG, fill: LIGHT_RED_BG },
          children: [
            new TextRun({ text: "🚩 ", rightToLeft: true }),
            new TextRun({ text: flag, rightToLeft: true }),
          ],
        })
      ),

      // ===== RAISED AT MEETING =====
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),
      sectionHeader("ז. נושאים שעלו בדיון"),

      rtl("אמיר שפירא (נציג עובדים) העלה: עובדים חדשים מדווחים על לחץ מהמנהלים הישירים לא לדווח על תקריות קלות כדי 'לא לסבך'. הנושא מחייב התייחסות של ההנהלה הבכירה — עלול להסתיר את תמונת הסיכון האמיתית.", { spacing: { before: 100, after: 80 } }),
      rtl("נועה קמחי (ממונה רכש): ציוד PPE במחסן — 3 שנים מאז הרכש האחרון. יש לבצע בדיקת עמידה במפרט ולהחליף מה שצריך לפני ביקורת שנתית. הצביעו כי לא ברור מי אחראי על הרכש השוטף של PPE.", { spacing: { before: 60, after: 80 } }),
      rtl("גיא ברקוביץ: הציע הקמת ועדת בדיקה לתרבות הבטיחות — ראיונות אנונימיים עם עובדים בכל מחלקה. הנושא אושר עקרונית אך לא מונה אחראי ולא נקבע לוח זמנים.", { spacing: { before: 60, after: 200 } }),

      // ===== SIGNATURES =====
      sectionHeader("ח. אישור הפרוטוקול"),
      new Table({
        bidiVisual: true,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            cell("תאריך אישור:", { bg: LIGHT_GRAY, bold: true, width: 25 }),
            cell("", { width: 40 }),
            cell("חתימת ממונה הבטיחות:", { bg: LIGHT_GRAY, bold: true, width: 35 }),
          ]}),
          new TableRow({ children: [
            cell("גיא ברקוביץ", { bold: true, width: 25 }),
            cell("", { width: 40 }),
            cell("_________________________", { width: 35 }),
          ]}),
        ],
      }),

      new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 60 },
        children: [new TextRun({ text: "מסמך זה סודי — לשימוש פנימי בלבד", size: 16, color: "999999", rightToLeft: true })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = "./demo_protocol_march2026.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath);
});
