"use client";

import { useMemo, useState } from "react";
import { Calculator, Plus, RotateCcw, Trash2 } from "lucide-react";

import { GRADE_SCALES, gradeOptions, classifyGpa, computeGpa, type GradeScale } from "@/lib/grades";
import { StatCard } from "@/components/stat-card";

type TempCourse = { id: string; code: string; title: string; credits: string; grade: string };

const uid = () => Math.random().toString(36).slice(2);

const SEED_5_0: TempCourse[] = [
  { id: uid(), code: "CS401", title: "Advanced Algorithms", credits: "3", grade: "A" },
  { id: uid(), code: "MATH301", title: "Numerical Methods", credits: "4", grade: "B" },
  { id: uid(), code: "ECON201", title: "Macroeconomics", credits: "3", grade: "B" },
];

const SEED_4_0: TempCourse[] = [
  { id: uid(), code: "CS401", title: "Advanced Algorithms", credits: "3", grade: "A" },
  { id: uid(), code: "MATH301", title: "Numerical Methods", credits: "4", grade: "A-" },
  { id: uid(), code: "ECON201", title: "Macroeconomics", credits: "3", grade: "B+" },
];

/** When switching scales, remap each course's grade to the closest equivalent by point ratio. */
function remapGrade(grade: string, from: GradeScale, to: GradeScale): string {
  if (GRADE_SCALES[to][grade]) return grade;
  const fromInfo = GRADE_SCALES[from][grade];
  if (!fromInfo) return gradeOptions(to)[0];
  const fromMax = from === "5.0" ? 5 : 4;
  const toMax = to === "5.0" ? 5 : 4;
  const targetRatio = fromInfo.points / fromMax;
  let best = gradeOptions(to)[0];
  let bestDiff = Infinity;
  for (const [g, info] of Object.entries(GRADE_SCALES[to])) {
    const diff = Math.abs(info.points / toMax - targetRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = g;
    }
  }
  return best;
}

export default function CalculatorPage() {
  const [scale, setScale] = useState<GradeScale>("5.0");
  const [courses, setCourses] = useState<TempCourse[]>(SEED_5_0);

  const { gpa, credits } = useMemo(() => computeGpa(courses, scale), [courses, scale]);
  const cls = classifyGpa(gpa, scale);

  function switchScale(next: GradeScale) {
    if (next === scale) return;
    setCourses((cs) => cs.map((c) => ({ ...c, grade: remapGrade(c.grade, scale, next) })));
    setScale(next);
  }

  function add() {
    setCourses([...courses, { id: uid(), code: "", title: "", credits: "3", grade: gradeOptions(scale)[1] ?? gradeOptions(scale)[0] }]);
  }

  function remove(id: string) {
    setCourses(courses.filter((c) => c.id !== id));
  }

  function update(id: string, patch: Partial<TempCourse>) {
    setCourses(courses.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function reset() {
    setCourses(scale === "5.0" ? SEED_5_0 : SEED_4_0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-indigo-600" /> Quick CGPA calculator
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Scratchpad for hypothetical semesters. Data here isn&apos;t saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
            <button
              onClick={() => switchScale("5.0")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                scale === "5.0" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              5.0 scale
            </button>
            <button
              onClick={() => switchScale("4.0")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                scale === "4.0" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              4.0 scale
            </button>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </button>
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Add course
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Projected CGPA"
          value={credits > 0 ? gpa.toFixed(2) : "—"}
          sub={credits > 0 ? <span className={cls.color}>{cls.label}</span> : "Add courses to see your GPA"}
          tone="indigo"
        />
        <StatCard label="Total credits" value={credits.toFixed(1)} sub={`${courses.length} courses`} tone="sky" />
        <StatCard
          label="Quality points"
          value={(gpa * credits).toFixed(1)}
          sub="Sum of (grade × credits)"
          tone="emerald"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Credits</th>
                <th className="px-3 py-3 font-medium">Grade</th>
                <th className="px-3 py-3 font-medium">Points</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => {
                const pts = (GRADE_SCALES[scale][c.grade]?.points ?? 0) * Number(c.credits || 0);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <input
                        value={c.code}
                        onChange={(e) => update(c.id, { code: e.target.value.toUpperCase() })}
                        placeholder="CS101"
                        className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={c.title}
                        onChange={(e) => update(c.id, { title: e.target.value })}
                        placeholder="Course title"
                        className="w-full min-w-40 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={c.credits}
                        onChange={(e) => update(c.id, { credits: e.target.value })}
                        className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={c.grade}
                        onChange={(e) => update(c.id, { grade: e.target.value })}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-indigo-500"
                      >
                        {gradeOptions(scale).map((g) => (
                          <option key={g} value={g}>
                            {g} ({GRADE_SCALES[scale][g].points.toFixed(1)})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-700">{pts.toFixed(1)}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => remove(c.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    No courses yet. Click &quot;Add course&quot; to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50/60 p-5">
        <h3 className="text-sm font-semibold text-indigo-900">
          Grade reference · {scale === "5.0" ? "5.0 scale (Nigerian)" : "4.0 scale (US-style)"}
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {gradeOptions(scale).map((g) => (
            <div key={g} className="rounded-lg bg-white/70 px-3 py-2 text-xs">
              <div className="font-semibold text-slate-900">{g}</div>
              <div className="text-slate-500">
                {GRADE_SCALES[scale][g].points.toFixed(1)} pts · {GRADE_SCALES[scale][g].remark}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
