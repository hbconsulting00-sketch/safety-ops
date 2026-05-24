"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
}

export default function DateInput({ value, onChange, className = "" }: Props) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-");
      setYear(y || "");
      setMonth(m || "");
      setDay(d || "");
    }
  }, [value]);

  const emit = (d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`);
    }
  };

  const base = `border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`;

  return (
    <div className="flex items-center gap-1 border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="יי"
        value={day}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setDay(v);
          emit(v.padStart(2, "0"), month, year);
        }}
        className={`w-7 outline-none text-slate-800 ${base} border-0 ring-0 focus:ring-0 px-0 py-0`}
      />
      <span className="text-slate-400">/</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="חח"
        value={month}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setMonth(v);
          emit(day, v.padStart(2, "0"), year);
        }}
        className={`w-7 outline-none text-slate-800 ${base} border-0 ring-0 focus:ring-0 px-0 py-0`}
      />
      <span className="text-slate-400">/</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="שנה"
        value={year}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setYear(v);
          emit(day, month, v);
        }}
        className={`w-12 outline-none text-slate-800 ${base} border-0 ring-0 focus:ring-0 px-0 py-0`}
      />
    </div>
  );
}
