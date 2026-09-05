"use client";

import { Download, FileText, Printer } from "lucide-react";
import { useFetch } from "@/lib/use-fetch";
import { SCALE_LABELS, normalizeScale } from "@/lib/grades";
import { EmptyState } from "@/components/empty-state";

type Course = {
  code: string;
  title: string;
  credits: number;
  grade: string | null;
  score: number | null;
};

type Semester = {
  id: string;
  name: string;
  year: number;
  gpa: number;
  credits: number;
  courses: Course[];
};

type Transcript = {
  profile: { name: string; email: string; university: string | null; program: string | null; scale: string };
  overview: { cgpa: number; totalCredits: number; classification: string; semesterCount: number };
  semesters: Semester[];
};

function toCsv(data: Transcript): string {
  const rows: string[] = ["Semester,Year,Code,Title,Credits,Grade,Score"];
  for (const s of data.semesters) {
    for (const c of s.courses) {
      const cells = [
        s.name,
        String(s.year),
        c.code,
        c.title,
        String(c.credits),
        c.grade ?? "",
        c.score !== null ? String(c.score) : "",
      ].map((v) => `"${v.replace(/"/g, '""')}"`);
      rows.push(cells.join(","));
    }
  }
  return rows.join("\n");
}

function downloadCsv(data: Transcript) {
  const csv = toCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.profile.name.replace(/\s+/g, "_")}_transcript.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TranscriptPage() {
  const { data, loading } = useFetch<Transcript>("/api/transcript");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse-soft rounded bg-slate-200" />
        <div className="h-64 animate-pulse-soft rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!data || data.semesters.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="Nothing to show yet"
        description="Add a semester and some courses first, then come back here to export your transcript."
      />
    );
  }

  const scale = normalizeScale(data.profile.scale);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" /> Transcript
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            A printable summary of every semester and course on record.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv(data)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none print:p-0">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{data.profile.name}</h2>
            <p className="text-sm text-slate-600">{data.profile.email}</p>
            {(data.profile.university || data.profile.program) && (
              <p className="mt-1 text-sm text-slate-600">
                {[data.profile.university, data.profile.program].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-700">{data.overview.cgpa.toFixed(2)}</div>
            <div className="text-xs text-slate-500">CGPA · {SCALE_LABELS[scale]}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">{data.overview.classification}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-slate-500">Total credits</div>
            <div className="font-semibold text-slate-900">{data.overview.totalCredits}</div>
          </div>
          <div>
            <div className="text-slate-500">Semesters</div>
            <div className="font-semibold text-slate-900">{data.overview.semesterCount}</div>
          </div>
          <div>
            <div className="text-slate-500">Grading scale</div>
            <div className="font-semibold text-slate-900">{SCALE_LABELS[scale]}</div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {data.semesters.map((s) => (
            <div key={s.id} className="break-inside-avoid">
              <div className="mb-2 flex items-baseline justify-between border-b border-slate-100 pb-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  {s.name} · {s.year}
                </h3>
                <span className="text-xs text-slate-500">
                  GPA {s.gpa.toFixed(2)} · {s.credits} credits
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-1 pr-3 font-medium">Code</th>
                    <th className="py-1 pr-3 font-medium">Title</th>
                    <th className="py-1 pr-3 font-medium">Credits</th>
                    <th className="py-1 pr-3 font-medium">Grade</th>
                    <th className="py-1 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {s.courses.map((c, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="py-1 pr-3 font-medium text-slate-800">{c.code}</td>
                      <td className="py-1 pr-3 text-slate-700">{c.title}</td>
                      <td className="py-1 pr-3 text-slate-700">{c.credits}</td>
                      <td className="py-1 pr-3 font-semibold text-slate-800">{c.grade ?? "—"}</td>
                      <td className="py-1 text-slate-700">{c.score ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
