"use client";

import React, { useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionProps } from "framer-motion";
import { Home, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE = 44;
const MAGNIFICATION = 62;
const DISTANCE = 120;

interface DockIconProps extends Omit<MotionProps & React.HTMLAttributes<HTMLDivElement>, "children"> {
  mouseX?: MotionValue<number>;
  children?: React.ReactNode;
}

function DockIcon({ mouseX, className, children, ...props }: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const defaultMouseX = useMotionValue(Infinity);

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(distanceCalc, [-DISTANCE, 0, DISTANCE], [SIZE, MAGNIFICATION, SIZE]);
  const scaleSize = useSpring(sizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const padding = Math.max(6, SIZE * 0.2);

  return (
    <motion.div
      ref={ref}
      style={{ width: scaleSize, height: scaleSize, padding }}
      className={cn("flex aspect-square cursor-pointer items-center justify-center rounded-full transition-colors", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default function MobileDock() {
  const router = useRouter();
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  const items = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "בית",
      href: "/",
      active: pathname === "/",
      className: "bg-[#2E81C5]/10 text-[#2E81C5]",
      activeClass: "bg-[#2E81C5]/20 text-[#2E81C5]",
    },
    {
      icon: <Plus className="w-5 h-5" />,
      label: "דיון חדש",
      href: "/",
      active: false,
      className: "bg-[#93C93E]/10 text-[#93C93E]",
      activeClass: "bg-[#93C93E]/20 text-[#93C93E]",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "היסטוריה",
      href: "/history",
      active: pathname === "/history",
      className: "bg-slate-100 text-slate-600",
      activeClass: "bg-slate-200 text-slate-700",
    },
  ];

  return (
    <div className="fixed bottom-4 inset-x-0 flex justify-center z-50 lg:hidden">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex h-[58px] items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/80 px-3 shadow-lg backdrop-blur-md"
      >
        {items.map((item) => (
          <DockIcon
            key={item.href + item.label}
            mouseX={mouseX}
            onClick={() => router.push(item.href)}
            className={item.active ? item.activeClass : item.className}
            aria-label={item.label}
          >
            {item.icon}
          </DockIcon>
        ))}
      </motion.div>
    </div>
  );
}
