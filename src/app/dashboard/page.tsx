"use client";

import Link from "next/link";
import {
  TrendingUp,
  Target,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Trophy,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Calculator,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import { StatCard, CardSkeleton } from "@/components/stat-card";
import { EmptyState, AddButton } from "@/components/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/use-fetch";
import { classifyGpa, normalizeScale } from "@/lib/grades";

type SemesterRow = {
  id: string;
  name: string;
  year: number;
  order: number;
  isCurrent: boolean;
  courseCount: number;
  gradedCount: number;
  creditsAttempted: number;
  creditsEarned: number;
  gpa: number;
};

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
  };
  insights: {
    id: string;
    type: "strength" | "warning" | "prediction" | "tip" | "goal";
    title: string;
    detail: string;
    metric?: string;
  }[];
  strongest: { code: string; title: string; grade: string } | null;
  weakest: { code: string; title: string; grade: string } | null;
  difficultyAverages: Record<string, number>;
  studyPlan: { week: string; focus: string; hours: number; why: string }[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: semData, loading: semLoading } = useFetch<{ semesters: SemesterRow[] }>(
    "/api/semesters"
  );
  const { data: insights, loading: aiLoading } = useFetch<Insights>("/api/ai/insights");

  const semesters = semData?.semesters ?? [];
  const hasData = semesters.length > 0;

  // Build grade distribution data
  const gradeCounts: Record<string, number> = {};
  if (insights) {
    // we don't have raw courses here, but we can count from semesters gpa
  }

  const chartData = semesters.map((s) => ({
    name: s.name.replace(/Freshman|Sophomore|Junior|Senior/gi, (m) => m.slice(0, 2) + "."),
    gpa: Number(s.gpa.toFixed(2)),
    credits: Number(s.creditsAttempted.toFixed(0)),
  }));

  const difficultyData = insights
    ? Object.entries(insights.difficultyAverages).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        avg: Number(v.toFixed(2)),
        color: k === "hard" ? "#ef4444" : k === "medium" ? "#f59e0b" : "#10b981",
      }))
    : [];

  const trendIcon =
    insights?.overview.trend === "up" ? (
      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
    ) : insights?.overview.trend === "down" ? (
      <ArrowDownRight className="h-4 w-4 text-rose-600" />
    ) : (
      <Minus className="h-4 w-4 text-slate-500" />
    );

  const insightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <Trophy className="h-4 w-4 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "prediction":
        return <Sparkles className="h-4 w-4 text-violet-600" />;
      case "goal":
        return <Target className="h-4 w-4 text-indigo-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-sky-600" />;
    }
  };

  const insightToneClass = (type: string) => {
    switch (type) {
      case "strength":
        return "border-emerald-200 bg-emerald-50/50";
      case "warning":
        return "border-amber-200 bg-amber-50/50";
      case "prediction":
        return "border-violet-200 bg-violet-50/50";
      case "goal":
        return "border-indigo-200 bg-indigo-50/50";
      default:
        return "border-sky-200 bg-sky-50/50";
    }
  };

  if (semLoading || aiLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-4 w-32 animate-pulse-soft rounded bg-slate-200" />
            <div className="mt-6 h-full w-full animate-pulse-soft rounded-xl bg-slate-100" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="h-3 w-3/4 animate-pulse-soft rounded bg-slate-200" />
                <div className="mt-3 h-3 w-full animate-pulse-soft rounded bg-slate-100" />
                <div className="mt-2 h-3 w-2/3 animate-pulse-soft rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Let&apos;s get your academic data set up so we can start tracking your CGPA.
          </p>
        </div>
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No semesters yet"
          description="Create your first semester and start adding courses. Your CGPA will update in real time."
          action={
            <Link href="/dashboard/semesters">
              <AddButton onClick={() => {}}>Add your first semester</AddButton>
            </Link>
          }
        />
      </div>
    );
  }

  const cgpa = insights?.overview.cgpa ?? 0;
  const scale = normalizeScale(user?.scale);
  const classification = classifyGpa(cgpa, scale);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Here&apos;s how your academics are looking right now.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/calculator"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calculator className="h-4 w-4" /> Quick calc
          </Link>
          <Link
            href="/dashboard/semesters"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Manage semesters
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cumulative GPA"
          value={cgpa.toFixed(2)}
          sub={
            <span className="flex items-center gap-1.5">
              {trendIcon}
              <span className={classification.color}>{classification.label}</span>
            </span>
          }
          icon={<GraduationCap className="h-4 w-4" />}
          tone="indigo"
        />
        <StatCard
          label="Target CGPA"
          value={insights?.overview.targetCgpa.toFixed(2) ?? "—"}
          sub={
            cgpa >= (insights?.overview.targetCgpa ?? 0)
              ? "You're already above it 🎉"
              : `${((insights?.overview.targetCgpa ?? 0) - cgpa).toFixed(2)} to go`
          }
          icon={<Target className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Credits earned"
          value={insights?.overview.totalCredits.toFixed(0)}
          sub={`${semesters.length} semester${semesters.length === 1 ? "" : "s"} graded`}
          icon={<BookOpen className="h-4 w-4" />}
          tone="sky"
        />
        <StatCard
          label="Projected CGPA"
          value={insights?.overview.projectedCgpa.toFixed(2)}
          sub={
            insights?.overview.pendingCredits
              ? `Based on ${insights.overview.pendingCredits} pending credits`
              : "No pending courses"
          }
          icon={<Sparkles className="h-4 w-4" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">GPA over time</h2>
              <p className="text-xs text-slate-500">Semester GPA plotted across your degree.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Semester GPA
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Target
              </span>
            </div>
          </div>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gpaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[1.5, 4]}
                  ticks={[2, 2.5, 3, 3.5, 4]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey={() => insights?.overview.targetCgpa ?? 3.5}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">By difficulty</h3>
            <p className="text-xs text-slate-500">Your average GPA per difficulty level.</p>
            {difficultyData.length > 0 ? (
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                      {difficultyData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-6 text-sm text-slate-500">Add grades to see difficulty insights.</div>
            )}
          </div>

          {insights?.strongest && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-700">
                <Trophy className="h-3.5 w-3.5" /> Strongest course
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{insights.strongest.title}</div>
              <div className="text-xs text-slate-600">{insights.strongest.code} · {insights.strongest.grade}</div>
            </div>
          )}
          {insights?.weakest && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Needs attention
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{insights.weakest.title}</div>
              <div className="text-xs text-slate-600">{insights.weakest.code} · {insights.weakest.grade}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" /> AI insights
            </h2>
            <span className="text-xs text-slate-500">
              {insights?.insights.length ?? 0} recommendations
            </span>
          </div>
          {insights?.insights.map((i) => (
            <div
              key={i.id}
              className={`animate-fade-in rounded-xl border p-4 shadow-sm ${insightToneClass(i.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 shadow-sm">
                  {insightIcon(i.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-slate-900 text-sm">{i.title}</div>
                    {i.metric && (
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                        {i.metric}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{i.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Suggested study plan</h3>
          <p className="text-xs text-slate-500">A personalized week-by-week plan based on your gaps.</p>
          <ol className="mt-4 space-y-3">
            {insights?.studyPlan.map((p, idx) => (
              <li key={idx} className="flex gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{p.focus}</div>
                    <span className="text-xs text-slate-500">{p.hours}h/wk</span>
                  </div>
                  <div className="text-xs text-slate-500">{p.week}</div>
                  <p className="mt-1 text-xs text-slate-600">{p.why}</p>
                </div>
              </li>
            ))}
            {(!insights || insights.studyPlan.length === 0) && (
              <li className="text-sm text-slate-500">Add semesters to unlock a study plan.</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
