"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "slate";
  className?: string;
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  indigo: "from-indigo-500/15 to-violet-500/10 text-indigo-600",
  emerald: "from-emerald-500/15 to-teal-500/10 text-emerald-600",
  amber: "from-amber-500/15 to-orange-500/10 text-amber-600",
  rose: "from-rose-500/15 to-pink-500/10 text-rose-600",
  sky: "from-sky-500/15 to-cyan-500/10 text-sky-600",
  slate: "from-slate-500/15 to-slate-400/10 text-slate-600",
};

export function StatCard({ label, value, sub, icon, tone = "indigo", className }: Props) {
  return (
    <div
      className={cn(
        "card-hover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
        {icon && (
          <div className={cn("grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br", TONES[tone])}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-3 w-24 animate-pulse-soft rounded bg-slate-200" />
      <div className="mt-3 h-8 w-20 animate-pulse-soft rounded bg-slate-200" />
      <div className="mt-2 h-3 w-32 animate-pulse-soft rounded bg-slate-100" />
    </div>
  );
}
