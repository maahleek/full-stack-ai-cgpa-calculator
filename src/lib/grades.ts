// Grading scale support: Nigerian 5.0 scale (default) and US-style 4.0 scale.
export type GradeScale = "4.0" | "5.0";
export const DEFAULT_SCALE: GradeScale = "5.0";

export type GradeInfo = { label: string; points: number; min?: number; color: string; remark: string };

// US-style 4.0 scale with +/- grading
const SCALE_4_0: Record<string, GradeInfo> = {
  "A+": { label: "A+", points: 4.0, min: 90, color: "#10b981", remark: "Exceptional" },
  A: { label: "A", points: 4.0, min: 85, color: "#059669", remark: "Excellent" },
  "A-": { label: "A-", points: 3.7, min: 80, color: "#34d399", remark: "Excellent" },
  "B+": { label: "B+", points: 3.3, min: 77, color: "#14b8a6", remark: "Very Good" },
  B: { label: "B", points: 3.0, min: 73, color: "#06b6d4", remark: "Good" },
  "B-": { label: "B-", points: 2.7, min: 70, color: "#0891b2", remark: "Above Average" },
  "C+": { label: "C+", points: 2.3, min: 67, color: "#eab308", remark: "Average" },
  C: { label: "C", points: 2.0, min: 63, color: "#f59e0b", remark: "Satisfactory" },
  "C-": { label: "C-", points: 1.7, min: 60, color: "#f97316", remark: "Below Average" },
  D: { label: "D", points: 1.0, min: 50, color: "#ef4444", remark: "Poor" },
  F: { label: "F", points: 0.0, min: 0, color: "#dc2626", remark: "Fail" },
};

// Nigerian university 5.0 scale (NUC-style)
const SCALE_5_0: Record<string, GradeInfo> = {
  A: { label: "A", points: 5.0, min: 70, color: "#059669", remark: "Excellent" },
  B: { label: "B", points: 4.0, min: 60, color: "#06b6d4", remark: "Very Good" },
  C: { label: "C", points: 3.0, min: 50, color: "#eab308", remark: "Good" },
  D: { label: "D", points: 2.0, min: 45, color: "#f97316", remark: "Fair" },
  E: { label: "E", points: 1.0, min: 40, color: "#ef4444", remark: "Pass" },
  F: { label: "F", points: 0.0, min: 0, color: "#dc2626", remark: "Fail" },
};

export const GRADE_SCALES: Record<GradeScale, Record<string, GradeInfo>> = {
  "4.0": SCALE_4_0,
  "5.0": SCALE_5_0,
};

export const SCALE_LABELS: Record<GradeScale, string> = {
  "5.0": "5.0 scale (Nigerian)",
  "4.0": "4.0 scale (US-style)",
};

/** Coerce any stored/raw value (numeric string, number, etc.) into a valid GradeScale, defaulting sensibly. */
export function normalizeScale(raw: unknown): GradeScale {
  const s = String(raw ?? "").trim();
  if (s.startsWith("4")) return "4.0";
  if (s.startsWith("5")) return "5.0";
  return DEFAULT_SCALE;
}

export function scaleMax(scale: GradeScale = DEFAULT_SCALE): number {
  return scale === "4.0" ? 4.0 : 5.0;
}

export function gradeOptions(scale: GradeScale = DEFAULT_SCALE): string[] {
  return Object.keys(GRADE_SCALES[scale]);
}

export function gradeInfo(grade: string | null | undefined, scale: GradeScale = DEFAULT_SCALE): GradeInfo | null {
  if (!grade) return null;
  return GRADE_SCALES[scale][grade] ?? null;
}

export function gradePoints(grade: string | null | undefined, scale: GradeScale = DEFAULT_SCALE): number | null {
  const info = gradeInfo(grade, scale);
  return info ? info.points : null;
}

export function scoreToGrade(score: number | null | undefined, scale: GradeScale = DEFAULT_SCALE): string | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  const entries = Object.entries(GRADE_SCALES[scale]).sort((a, b) => (b[1].min ?? 0) - (a[1].min ?? 0));
  for (const [g, info] of entries) {
    if (score >= (info.min ?? 0)) return g;
  }
  return entries[entries.length - 1]?.[0] ?? "F";
}

export type CourseLike = { credits: number | string; grade: string | null };

export function computeGpa(
  courses: CourseLike[],
  scale: GradeScale = DEFAULT_SCALE
): { gpa: number; credits: number; points: number } {
  let weightedSum = 0;
  let creditSum = 0;
  for (const c of courses) {
    const pts = gradePoints(c.grade, scale);
    const credits = Number(c.credits);
    if (pts === null || !Number.isFinite(credits) || credits <= 0) continue;
    weightedSum += pts * credits;
    creditSum += credits;
  }
  return {
    gpa: creditSum > 0 ? weightedSum / creditSum : 0,
    credits: creditSum,
    points: weightedSum,
  };
}

export function gradeColor(grade: string | null | undefined, scale: GradeScale = DEFAULT_SCALE): string {
  if (!grade) return "#94a3b8";
  return GRADE_SCALES[scale][grade]?.color ?? "#94a3b8";
}

/**
 * Classification bands. On the 5.0 (Nigerian/NUC) scale these are the standard degree
 * classifications; on the 4.0 scale they're mapped to the closest equivalent standing
 * at the same proportional GPA band.
 */
export function classifyGpa(gpa: number, scale: GradeScale = DEFAULT_SCALE): { label: string; color: string } {
  if (scale === "5.0") {
    if (gpa >= 4.5) return { label: "First Class", color: "text-emerald-600" };
    if (gpa >= 3.5) return { label: "Second Class Upper", color: "text-teal-600" };
    if (gpa >= 2.4) return { label: "Second Class Lower", color: "text-cyan-600" };
    if (gpa >= 1.5) return { label: "Third Class", color: "text-amber-600" };
    if (gpa >= 1.0) return { label: "Pass", color: "text-orange-600" };
    return { label: "At Risk", color: "text-rose-600" };
  }
  const max = scaleMax(scale);
  const ratio = max > 0 ? gpa / max : 0;
  if (ratio >= 0.9) return { label: "First Class", color: "text-emerald-600" };
  if (ratio >= 0.7) return { label: "Second Class Upper", color: "text-teal-600" };
  if (ratio >= 0.48) return { label: "Second Class Lower", color: "text-cyan-600" };
  if (ratio >= 0.3) return { label: "Third Class", color: "text-amber-600" };
  if (ratio >= 0.2) return { label: "Pass", color: "text-orange-600" };
  return { label: "At Risk", color: "text-rose-600" };
}
