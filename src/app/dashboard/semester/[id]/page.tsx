"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, X, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { StatCard, CardSkeleton } from "@/components/stat-card";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { gradeOptions, GRADE_SCALES, classifyGpa, gradeColor, scoreToGrade, normalizeScale, type GradeScale } from "@/lib/grades";

type Semester = {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
  courseCount: number;
  gradedCount: number;
  creditsAttempted: number;
  creditsEarned: number;
  gpa: number;
};

type Course = {
  id: string;
  semesterId: string;
  code: string;
  title: string;
  credits: string;
  grade: string | null;
  score: string | null;
  difficulty: string;
  notes: string | null;
};

type FormData = {
  code: string;
  title: string;
  credits: string;
  grade: string;
  score: string;
  difficulty: string;
  notes: string;
};

const EMPTY: FormData = {
  code: "",
  title: "",
  credits: "3",
  grade: "",
  score: "",
  difficulty: "medium",
  notes: "",
};

function CourseForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  scale,
  error,
}: {
  initial?: Course;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  loading: boolean;
  scale: GradeScale;
  error?: string | null;
}) {
  const [form, setForm] = useState<FormData>(
    initial
      ? {
          code: initial.code,
          title: initial.title,
          credits: initial.credits,
          grade: initial.grade ?? "",
          score: initial.score ?? "",
          difficulty: initial.difficulty ?? "medium",
          notes: initial.notes ?? "",
        }
      : EMPTY
  );

  function autoGradeFromScore(scoreStr: string) {
    const n = Number(scoreStr);
    if (!Number.isFinite(n)) return;
    const g = scoreToGrade(n, scale);
    setForm((f) => ({ ...f, score: scoreStr, grade: g ?? "" }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="CS201"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Credits</label>
          <input
            required
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Course title</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Algorithms"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Score (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.score}
            onChange={(e) => autoGradeFromScore(e.target.value)}
            placeholder="85"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Grade</label>
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">— Pending —</option>
            {gradeOptions(scale).map((g) => (
              <option key={g} value={g}>
                {g} ({GRADE_SCALES[scale][g].points.toFixed(1)})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Difficulty</label>
        <div className="flex gap-2">
          {["easy", "medium", "hard"].map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setForm({ ...form, difficulty: d })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                form.difficulty === d
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Office hours, project topics, tips for next time…"
          rows={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {initial ? "Save changes" : "Add course"}
        </button>
      </div>
    </form>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SemesterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const scale = normalizeScale(user?.scale);

  const { data, loading, refetch } = useFetch<{ semester: Semester; courses: Course[] }>(
    `/api/semesters/${id}`
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const semester = data?.semester;
  const courses = data?.courses ?? [];

  // Grade distribution for pie chart
  const gradeCounts: Record<string, number> = {};
  for (const c of courses) {
    if (!c.grade) continue;
    gradeCounts[c.grade] = (gradeCounts[c.grade] ?? 0) + 1;
  }
  const pieData = Object.entries(gradeCounts).map(([g, v]) => ({
    name: g,
    value: v,
    color: gradeColor(g, scale),
  }));

  // Credits by difficulty
  const diffCredits: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  for (const c of courses) {
    const k = (c.difficulty as "easy" | "medium" | "hard") || "medium";
    diffCredits[k] += Number(c.credits) || 0;
  }
  const barData = Object.entries(diffCredits).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    credits: v,
    color: k === "hard" ? "#ef4444" : k === "medium" ? "#f59e0b" : "#10b981",
  }));

  async function createCourse(d: FormData) {
    if (!semester) return;
    setFormError(null);
    setSaving(true);

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ semesterId: semester.id, ...d, grade: d.grade || null, score: d.score || null }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Couldn't save that course. Please check the values and try again.");
      setSaving(false);
      return;
    }

    setShowCreate(false);
    setSaving(false);
    refetch();
  }

  async function updateCourse(d: FormData) {
    if (!editing) return;
    setFormError(null);
    setSaving(true);

    const res = await fetch(`/api/courses/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...d, grade: d.grade || null, score: d.score || null }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Couldn't save that course. Please check the values and try again.");
      setSaving(false);
      return;
    }

    setEditing(null);
    setSaving(false);
    refetch();
  }

  async function deleteCourse() {
    if (!deleting) return;
    setSaving(true);
    setDeleting(null);
    await fetch(`/api/courses/${deleting.id}`, { method: "DELETE" });
    setSaving(false);
    refetch();
  }

  // Inline quick grade change
  async function quickGrade(course: Course, grade: string) {
    await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grade: grade || null }),
    });
    refetch();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 animate-pulse-soft rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (!semester) {
    return (
      <EmptyState
        title="Semester not found"
        description="This semester may have been deleted."
        action={
          <Link
            href="/dashboard/semesters"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to semesters
          </Link>
        }
      />
    );
  }

  const cls = classifyGpa(semester.gpa, scale);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/semesters")}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All semesters
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{semester.name}</h1>
              {semester.isCurrent && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">{semester.year}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Add course
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Semester GPA"
          value={semester.gradedCount > 0 ? semester.gpa.toFixed(2) : "—"}
          sub={semester.gradedCount > 0 ? <span className={cls.color}>{cls.label}</span> : "No graded courses yet"}
          tone="indigo"
        />
        <StatCard
          label="Courses"
          value={`${semester.gradedCount} / ${semester.courseCount}`}
          sub="Graded / Total"
          tone="sky"
        />
        <StatCard
          label="Credits"
          value={semester.creditsAttempted}
          sub={`${semester.creditsEarned} earned`}
          tone="emerald"
        />
        <StatCard
          label="Target gap"
          value={`${Math.max(0, 3.8 - semester.gpa).toFixed(2)}`}
          sub="Points to 3.80"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">Courses</h3>
              <span className="text-xs text-slate-500">{courses.length} total</span>
            </div>
            {courses.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Sparkles className="h-6 w-6" />}
                  title="No courses yet"
                  description="Add your first course for this semester."
                  action={
                    <button
                      onClick={() => setShowCreate(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" /> Add course
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-3 py-3 font-medium">Credits</th>
                      <th className="px-3 py-3 font-medium">Score</th>
                      <th className="px-3 py-3 font-medium">Grade</th>
                      <th className="px-3 py-3 font-medium">Diff.</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c) => (
                      <tr key={c.id} className="group hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-1 rounded-full"
                              style={{ background: gradeColor(c.grade, scale) }}
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-900">{c.title}</div>
                              <div className="text-xs text-slate-500">{c.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{c.credits}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{c.score ?? "—"}</td>
                        <td className="px-3 py-3">
                          <select
                            value={c.grade ?? ""}
                            onChange={(e) => quickGrade(c, e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-indigo-500"
                            style={{ color: gradeColor(c.grade, scale) }}
                          >
                            <option value="">—</option>
                            {gradeOptions(scale).map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              c.difficulty === "hard"
                                ? "bg-rose-100 text-rose-700"
                                : c.difficulty === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {c.difficulty}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => setEditing(c)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleting(c)}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Grade distribution</h3>
            {pieData.length > 0 ? (
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-slate-500">No graded courses yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Credits by difficulty</h3>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="credits" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormError(null); }} title="Add course">
        <CourseForm
          loading={saving}
          onCancel={() => { setShowCreate(false); setFormError(null); }}
          onSubmit={createCourse}
          scale={scale}
          error={formError}
        />
      </Modal>
      <Modal open={!!editing} onClose={() => { setEditing(null); setFormError(null); }} title="Edit course">
        {editing && (
          <CourseForm
            initial={editing}
            loading={saving}
            onCancel={() => { setEditing(null); setFormError(null); }}
            onSubmit={updateCourse}
            scale={scale}
            error={formError}
          />
        )}
      </Modal>
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete course?">
        <p className="text-sm text-slate-600">
          Delete <strong>{deleting?.code} – {deleting?.title}</strong>? This cannot be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={() => setDeleting(null)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={deleteCourse}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
