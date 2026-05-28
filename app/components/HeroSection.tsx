"use client";

import React, {
  useEffect, useRef, useState, useCallback,
  forwardRef, useImperativeHandle, useMemo,
  type ReactNode,
} from "react";
import {
  motion, AnimatePresence,
  type Transition, type VariantLabels, type Target,
  type TargetAndTransition,
} from "framer-motion";

// ── RotatingText ──────────────────────────────────────────────────────────────

interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

interface RotatingTextProps extends Omit<React.ComponentPropsWithoutRef<typeof motion.span>, "children" | "transition" | "initial" | "animate" | "exit"> {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: "sync" | "wait";
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: string;
  loop?: boolean;
  mainClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(({
  texts,
  transition = { type: "spring", damping: 25, stiffness: 300 },
  initial = { y: "100%", opacity: 0 },
  animate = { y: 0, opacity: 1 },
  exit = { y: "-120%", opacity: 0 },
  animatePresenceMode = "wait",
  rotationInterval = 2200,
  staggerDuration = 0.01,
  loop = true,
  mainClassName,
  elementLevelClassName,
  ...rest
}, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const splitChars = (text: string): string[] => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      try {
        const seg = new Intl.Segmenter("he", { granularity: "grapheme" });
        return Array.from(seg.segment(text), (s) => s.segment);
      } catch { return text.split(""); }
    }
    return text.split("");
  };

  const elements = useMemo(() => {
    const text = texts[currentIndex] ?? "";
    const words = text.split(/(\s+)/);
    let count = 0;
    return words.filter((p) => p.length > 0).map((part) => {
      const isSpace = /^\s+$/.test(part);
      const chars = isSpace ? [part] : splitChars(part);
      const start = count;
      count += chars.length;
      return { characters: chars, isSpace, startIndex: start };
    });
  }, [texts, currentIndex]);

  const total = useMemo(() => elements.reduce((s, e) => s + e.characters.length, 0), [elements]);

  const getDelay = (index: number, t: number) =>
    t <= 1 ? 0 : (t - 1 - index) * staggerDuration!;

  const next = useCallback(() => {
    const n = currentIndex === texts.length - 1 ? (loop ? 0 : currentIndex) : currentIndex + 1;
    if (n !== currentIndex) setCurrentIndex(n);
  }, [currentIndex, texts.length, loop]);

  useImperativeHandle(ref, () => ({
    next,
    previous: () => {
      const p = currentIndex === 0 ? (loop ? texts.length - 1 : 0) : currentIndex - 1;
      if (p !== currentIndex) setCurrentIndex(p);
    },
    jumpTo: (i: number) => setCurrentIndex(Math.max(0, Math.min(i, texts.length - 1))),
    reset: () => setCurrentIndex(0),
  }), [next, currentIndex, texts.length, loop]);

  useEffect(() => {
    if (texts.length <= 1) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, texts.length]);

  return (
    <motion.span
      className={`inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[6px] ${mainClassName ?? ""}`}
      {...rest}
      layout
    >
      <span className="sr-only">{texts[currentIndex]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={false}>
        <motion.div
          key={currentIndex}
          className="inline-flex flex-wrap items-baseline"
          layout
          aria-hidden
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {elements.map((el, ei) => (
            <span key={ei} className="inline-flex" style={{ whiteSpace: "pre" }}>
              {el.characters.map((char, ci) => (
                <motion.span
                  key={`${char}-${ci}`}
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  transition={{ ...transition, delay: getDelay(el.startIndex + ci, total) }}
                  className={`inline-block leading-none ${elementLevelClassName ?? ""}`}
                >
                  {char === " " ? " " : char}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.span>
  );
});
RotatingText.displayName = "RotatingText";

// ── Canvas dots ───────────────────────────────────────────────────────────────

interface Dot {
  x: number; y: number;
  targetOpacity: number; currentOpacity: number; opacitySpeed: number;
  baseRadius: number; currentRadius: number;
}

function DotsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const gridRef = useRef<Record<string, number[]>>({});
  const sizeRef = useRef({ width: 0, height: 0 });
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  const DOT_SPACING = 28;
  const MIN_OP = 0.15;
  const MAX_OP = 0.30;
  const BASE_R = 1.2;
  const I_RADIUS = 130;
  const I_RADIUS_SQ = I_RADIUS * I_RADIUS;
  const CELL = Math.floor(I_RADIUS / 1.5);

  const createDots = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const dots: Dot[] = [];
    const grid: Record<string, number[]> = {};
    const cols = Math.ceil(width / DOT_SPACING);
    const rows = Math.ceil(height / DOT_SPACING);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * DOT_SPACING + DOT_SPACING / 2;
        const y = j * DOT_SPACING + DOT_SPACING / 2;
        const ck = `${Math.floor(x / CELL)}_${Math.floor(y / CELL)}`;
        if (!grid[ck]) grid[ck] = [];
        grid[ck].push(dots.length);
        const op = Math.random() * (MAX_OP - MIN_OP) + MIN_OP;
        dots.push({ x, y, targetOpacity: op, currentOpacity: op, opacitySpeed: Math.random() * 0.004 + 0.001, baseRadius: BASE_R, currentRadius: BASE_R });
      }
    }
    dotsRef.current = dots;
    gridRef.current = grid;
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.parentElement?.clientWidth ?? window.innerWidth;
    const h = canvas.parentElement?.clientHeight ?? 200;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      sizeRef.current = { width: w, height: h };
      createDots();
    }
  }, [createDots]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const dots = dotsRef.current;
    const grid = gridRef.current;
    const { width, height } = sizeRef.current;
    const { x: mx, y: my } = mouseRef.current;
    if (!ctx || !width || !height) { frameRef.current = requestAnimationFrame(animate); return; }

    ctx.clearRect(0, 0, width, height);

    const active = new Set<number>();
    if (mx !== null && my !== null) {
      const cx = Math.floor(mx / CELL), cy = Math.floor(my / CELL);
      const sr = Math.ceil(I_RADIUS / CELL);
      for (let i = -sr; i <= sr; i++)
        for (let j = -sr; j <= sr; j++) {
          const key = `${cx + i}_${cy + j}`;
          grid[key]?.forEach((idx) => active.add(idx));
        }
    }

    dots.forEach((dot, idx) => {
      dot.currentOpacity += dot.opacitySpeed;
      if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= MIN_OP) {
        dot.opacitySpeed = -dot.opacitySpeed;
        dot.currentOpacity = Math.max(MIN_OP, Math.min(dot.currentOpacity, MAX_OP));
        dot.targetOpacity = Math.random() * (MAX_OP - MIN_OP) + MIN_OP;
      }
      let factor = 0;
      if (mx !== null && my !== null && active.has(idx)) {
        const dx = dot.x - mx, dy = dot.y - my;
        const dSq = dx * dx + dy * dy;
        if (dSq < I_RADIUS_SQ) {
          const d = Math.sqrt(dSq);
          factor = Math.pow(Math.max(0, 1 - d / I_RADIUS), 2);
        }
      }
      const finalOp = Math.min(1, dot.currentOpacity + factor * 0.5);
      dot.currentRadius = BASE_R + factor * 2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(46, 129, 197, ${finalOp.toFixed(3)})`;
      ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    handleResize();
    const onMove = (e: MouseEvent) => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r) mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouseRef.current = { x: null, y: null }; };
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [handleResize, animate]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-60" />;
}

// ── HeroSection ───────────────────────────────────────────────────────────────

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 py-10 px-6 text-center">
      <DotsCanvas />
      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xs font-semibold uppercase tracking-widest text-[#2E81C5] mb-3"
        >
          AI Operations & Insights
        </motion.p>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug"
        >
          הפוך כל פרוטוקול בטיחות ל
          <RotatingText
            texts={["תוכנית פעולה", "מעקב חכם", "תובנות היסטוריות", "דגלים אדומים"]}
            mainClassName="mr-2"
            elementLevelClassName="text-[#2E81C5]"
            staggerFrom="last"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "110%", opacity: 0 }}
            staggerDuration={0.012}
            transition={{ type: "spring", damping: 18, stiffness: 250 }}
            rotationInterval={2400}
            loop
          />
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 text-sm text-slate-500 max-w-md mx-auto"
        >
          AI מנתח את הפרוטוקול ומייצר תוכנית ניהולית מלאה — תוך שניות
        </motion.p>
      </div>
    </section>
  );
}
