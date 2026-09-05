"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, MoreVertical, Pencil, Plus, Trash2, X } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { classifyGpa, normalizeScale } from "@/lib/grades";

type Semester = {
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

function SemesterForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Semester;
  onSubmit: (data: { name: string; year: number; isCurrent: boolean }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [year, setYear] = useState(initial?.year ?? new Date().getFullYear());
  const [isCurrent, setIsCurrent] = useState(initial?.isCurrent ?? false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, year, isCurrent });
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Semester name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., 100L First Semester"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
        <input
          type="number"
          min={2000}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Mark as current semester
      </label>
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
          {initial ? "Save changes" : "Create semester"}
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
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SemestersPage() {
  const { user } = useAuth();
  const scale = normalizeScale(user?.scale);
  const { data, loading, refetch } = useFetch<{ semesters: Semester[] }>("/api/semesters");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [deleting, setDeleting] = useState<Semester | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const semesters = data?.semesters ?? [];

  async function createSemester(d: { name: string; year: number; isCurrent: boolean }) {
    setSaving(true);
    await fetch("/api/semesters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(d),
    });
    setSaving(false);
    setShowCreate(false);
    refetch();
  }

  async function updateSemester(d: { name: string; year: number; isCurrent: boolean }) {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/semesters/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(d),
    });
    setSaving(false);
    setEditing(null);
    refetch();
  }

  async function deleteSemester() {
    if (!deleting) return;
    setSaving(true);
    await fetch(`/api/semesters/${deleting.id}`, { method: "DELETE" });
    setSaving(false);
    setDeleting(null);
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semesters</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your semesters and the courses inside each one.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> New semester
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-4 w-1/2 animate-pulse-soft rounded bg-slate-200" />
              <div className="mt-3 h-8 w-1/3 animate-pulse-soft rounded bg-slate-200" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-3 animate-pulse-soft rounded bg-slate-100" />
                <div className="h-3 animate-pulse-soft rounded bg-slate-100" />
                <div className="h-3 animate-pulse-soft rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No semesters yet"
          description="Create your first semester to start tracking courses and GPA."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> New semester
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((s) => {
            const cls = classifyGpa(s.gpa, scale);
            return (
              <Link
                key={s.id}
                href={`/dashboard/semester/${s.id}`}
                className="card-hover group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      {s.isCurrent && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{s.year}</div>
                  </div>
                  <div className="relative z-10" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(menuOpen === s.id ? null : s.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === s.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(null);
                          }}
                        />
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuOpen(null);
                              setEditing(s);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuOpen(null);
                              setDeleting(s);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <div className="text-3xl font-bold tracking-tight text-slate-900">
                    {s.gradedCount > 0 ? s.gpa.toFixed(2) : "—"}
                  </div>
                  {s.gradedCount > 0 && <span className={`text-xs font-semibold ${cls.color}`}>{cls.label}</span>}
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{s.courseCount}</div>
                    <div className="text-slate-500">Courses</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {s.gradedCount}/{s.courseCount}
                    </div>
                    <div className="text-slate-500">Graded</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{s.creditsAttempted}</div>
                    <div className="text-slate-500">Credits</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New semester">
        <SemesterForm
          loading={saving}
          onCancel={() => setShowCreate(false)}
          onSubmit={createSemester}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit semester">
        {editing && (
          <SemesterForm
            initial={editing}
            loading={saving}
            onCancel={() => setEditing(null)}
            onSubmit={updateSemester}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete semester?">
        <p className="text-sm text-slate-600">
          This will permanently delete <strong>{deleting?.name}</strong> and all courses inside it. This cannot be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setDeleting(null)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={deleteSemester}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete semester
          </button>
        </div>
      </Modal>
    </div>
  );
}
