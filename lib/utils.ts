import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// מחזיר תאריך בפורמט ישראלי: DD/MM/YYYY
export function formatDate(dateStr: string, long = false): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  if (long) {
    const months = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
    return `${parseInt(day)} ב${months[parseInt(month) - 1]} ${year}`;
  }
  return `${day}/${month}/${year}`;
}
