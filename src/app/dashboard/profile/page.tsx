"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { normalizeScale, scaleMax, type GradeScale } from "@/lib/grades";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [university, setUniversity] = useState(user?.university ?? "");
  const [program, setProgram] = useState(user?.program ?? "");
  const [scale, setScale] = useState<GradeScale>(normalizeScale(user?.scale));
  const [targetCgpa, setTargetCgpa] = useState(user?.targetCgpa ?? String(scaleMax(normalizeScale(user?.scale)) - 0.5));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, university, program, targetCgpa: Number(targetCgpa), scale }),
    });
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteAccount() {
    setDeleting(true);
    await fetch("/api/profile", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <User className="h-6 w-6 text-indigo-600" /> Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">Your account and academic details.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-semibold text-white">
            {user?.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Target CGPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={scaleMax(scale)}
              value={targetCgpa}
              onChange={(e) => setTargetCgpa(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Grading scale</label>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as GradeScale)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="5.0">5.0 scale (Nigerian)</option>
              <option value="4.0">4.0 scale (US-style)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Changes how your grades are converted to points and how CGPA is calculated.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">University</label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g., University of Lagos"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Program</label>
            <input
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="e.g., B.S. Computer Science"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          {saved && <span className="text-sm font-medium text-emerald-600">✓ Saved</span>}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-900">
          <AlertTriangle className="h-4 w-4" /> Danger zone
        </h2>
        <p className="mt-1 text-sm text-rose-700">
          Permanently delete your account and all of your semesters, courses, and history. This cannot be undone.
        </p>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Delete account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-rose-700">
              Type <strong>DELETE</strong> below to confirm. This is permanent.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full max-w-xs rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 sm:w-auto"
            />
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={confirmText !== "DELETE" || deleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Permanently delete
              </button>
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                  setConfirmText("");
                }}
                disabled={deleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
