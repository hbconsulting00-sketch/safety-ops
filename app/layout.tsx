import type { Metadata } from "next";
import { Heebo, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import MobileDock from "@/app/components/MobileDock";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "AI Operations & Insights — בטיחות",
  description: "הפיכת פרוטוקול ועדת בטיחות לתוכנית פעולה ניהולית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={cn("h-full", "antialiased", heebo.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">
        {children}
        <MobileDock />
      </body>
    </html>
  );
}
