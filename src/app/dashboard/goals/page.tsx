"use client";

import { useMemo, useState } from "react";
import { Target, Sparkles, Trophy, AlertTriangle, Lightbulb, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

import { StatCard, CardSkeleton } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { classifyGpa, normalizeScale, scaleMax } from "@/lib/grades";

type Insights = {
  overview: {
    cgpa: number;
    targetCgpa: number;
    totalCredits: number;
    pendingCredits: number;
    projectedCgpa: number;
    neededAvgOnPending: number | null;
    trend: "up" | "down" | "flat";
    semesterCount: number;
    courseCount: number;
    scale?: string;
    scaleMax?: number;
  };
  insights: {
    id: string;
    type: "strength" | "warning" | "prediction" | "tip" | "goal";
    title: string;
    detail: string;
    metric?: string;
  }[];
  studyPlan: { week: string; focus: string; hours: number; why: string }[];
};

type SemesterRow = {
  id: string;
  name: string;
  gpa: number;
  creditsAttempted: number;
  order: number;
};

export default function GoalsPage() {
  const { user, refresh } = useAuth();
  const { data: insights, loading: aiLoading } = useFetch<Insights>("/api/ai/insights");
  const { data: semData, loading: semLoading } = useFetch<{ semesters: SemesterRow[] }>("/api/semesters");

  const [targetInput, setTargetInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Build cumulative CGPA projection chart
  const chartData = useMemo(() => {
    const semesters = semData?.semesters ?? [];
    if (!insights || semesters.length === 0) return [];

    type Row = { name: string; actual: number | null; projected: number | null; target: number };
    type Acc = { rows: Row[]; cumPoints: number; cumCredits: number };

    const { rows: historical } = semesters.reduce<Acc>(
      (acc, s) => {
        const gpa = s.gpa || 0;
        const cr = s.creditsAttempted || 0;
        const cumPoints = acc.cumPoints + gpa * cr;
        const cumCredits = acc.cumCredits + cr;
        return {
          cumPoints,
          cumCredits,
          rows: [
            ...acc.rows,
            {
              name: s.name,
              actual: cumCredits > 0 ? Number((cumPoints / cumCredits).toFixed(2)) : null,
              projected: null,
              target: insights.overview.targetCgpa,
            },
          ],
        };
      },
      { rows: [], cumPoints: 0, cumCredits: 0 }
    );

    // Extend with projection
    if (insights.overview.pendingCredits > 0 && historical.length > 0) {
      const last = historical[historical.length - 1];
      const projectedCgpa = insights.overview.projectedCgpa;
      const connectedLast: Row = { ...last, projected: last.actual };
      const projectedRow: Row = {
        name: "Projected",
        actual: null,
        projected: Number(projectedCgpa.toFixed(2)),
        target: insights.overview.targetCgpa,
      };
      return [...historical.slice(0, -1), connectedLast, projectedRow];
    }
    return historical;
  }, [insights, semData]);

  async function saveTarget() {
    const n = Number(targetInput);
    if (!Number.isFinite(n) || n < 0 || n > 4) return;
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetCgpa: n }),
    });
    await refresh();
    setSaving(false);
    setTargetInput("");
  }

  const loading = aiLoading || semLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="h-72 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-4 w-40 animate-pulse-soft rounded bg-slate-200" />
          <div className="mt-6 h-full animate-pulse-soft rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (insights && insights.overview.semesterCount === 0) {
    return (
      <EmptyState
        icon={<Target className="h-6 w-6" />}
        title="No data to analyze yet"
        description="Add a semester and a few courses first — then this page will show your CGPA trajectory and personalized AI recommendations."
        action={
          <Link
            href="/dashboard/semesters"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to Semesters
          </Link>
        }
      />
    );
  }

  const ov = insights?.overview;
  const scale = normalizeScale(user?.scale);
  const maxPts = ov?.scaleMax ?? scaleMax(scale);
  const cgpa = ov?.cgpa ?? 0;
  const target = ov?.targetCgpa ?? Number((maxPts * 0.7).toFixed(2));
  const gap = target - cgpa;
  const cls = classifyGpa(cgpa, scale);

  const insightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <Trophy className="h-5 w-5 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "prediction":
        return <Sparkles className="h-5 w-5 text-violet-600" />;
      case "goal":
        return <Target className="h-5 w-5 text-indigo-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-sky-600" />;
    }
  };

  const insightToneClass = (type: string) => {
    switch (type) {
      case "strength":
        return "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white";
      case "warning":
        return "border-amber-200 bg-gradient-to-br from-amber-50 to-white";
      case "prediction":
        return "border-violet-200 bg-gradient-to-br from-violet-50 to-white";
      case "goal":
        return "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white";
      default:
        return "border-sky-200 bg-gradient-to-br from-sky-50 to-white";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Target className="h-6 w-6 text-indigo-600" /> Goals & AI advisor
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Set your target CGPA, see your path, and get a personalized plan to get there.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            max={maxPts}
            placeholder={target.toFixed(2)}
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={saveTarget}
            disabled={saving || !targetInput}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Update target
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Current CGPA"
          value={cgpa.toFixed(2)}
          sub={<span className={cls.color}>{cls.label}</span>}
          tone="indigo"
        />
        <StatCard
          label="Target CGPA"
          value={target.toFixed(2)}
          sub={
            gap > 0
              ? `${gap.toFixed(2)} points away`
              : `You're already above it 🎉`
          }
          tone="emerald"
        />
        <StatCard
          label="Avg needed on remaining"
          value={
            ov?.neededAvgOnPending !== null && ov?.neededAvgOnPending !== undefined
              ? Math.min(maxPts, ov.neededAvgOnPending).toFixed(2)
              : "—"
          }
          sub={
            ov?.pendingCredits
              ? `Across ${ov.pendingCredits} pending credits`
              : "No pending courses"
          }
          tone={
            ov && ov.neededAvgOnPending !== null && ov.neededAvgOnPending !== undefined && ov.neededAvgOnPending > maxPts
              ? "rose"
              : "amber"
          }
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">CGPA trajectory</h2>
            <p className="text-xs text-slate-500">Your cumulative CGPA vs. target, with projection.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Actual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" /> Projected
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Target
            </span>
          </div>
        </div>
        <div className="mt-6 h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="projGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[maxPts * 0.375, maxPts]}
                  ticks={
                    maxPts === 5
                      ? [2, 2.5, 3, 3.5, 4, 4.5, 5]
                      : [1.5, 2, 2.5, 3, 3.5, 4]
                  }
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <ReferenceLine y={target} stroke="#10b981" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#actualGrad)"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fill="url(#projGrad)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-500">
              Add semesters to see your trajectory.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-violet-600" /> AI insights
            </h2>
            <span className="text-xs text-slate-500">
              {insights?.insights.length ?? 0} recommendations
            </span>
          </div>
          {insights?.insights.map((i) => (
            <div
              key={i.id}
              className={`animate-fade-in rounded-xl border p-5 shadow-sm ${insightToneClass(i.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
                  {insightIcon(i.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-slate-900">{i.title}</div>
                    {i.metric && (
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                        {i.metric}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{i.detail}</p>
                </div>
              </div>
            </div>
          ))}
          {(!insights || insights.insights.length === 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Add semesters and courses to get personalized AI recommendations.
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Lightbulb className="h-4 w-4 text-amber-500" /> Personalized study plan
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              A week-by-week roadmap tuned to your target of {target.toFixed(2)}.
            </p>
            <ol className="mt-5 space-y-4">
              {insights?.studyPlan.map((p, idx) => (
                <li key={idx} className="flex gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{p.focus}</div>
                      <span className="text-xs font-semibold text-indigo-600">{p.hours}h/wk</span>
                    </div>
                    <div className="text-xs text-slate-500">{p.week}</div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{p.why}</p>
                  </div>
                </li>
              ))}
              {(!insights || insights.studyPlan.length === 0) && (
                <li className="text-sm text-slate-500">Add data to generate a plan.</li>
              )}
            </ol>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3 text-xs">
              <span className="font-medium text-indigo-900">
              {ov && ov.trend === "up" ? (
                <span className="inline-flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Trending up
                </span>
              ) : ov && ov.trend === "down" ? (
                <span className="inline-flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5" /> Trending down
                </span>
              ) : (
                "Flat trend"
              )}
            </span>
              <span className="text-indigo-700">
                {ov ? ov.semesterCount : 0} semesters tracked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
