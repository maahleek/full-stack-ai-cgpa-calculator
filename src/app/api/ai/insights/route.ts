import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { computeGpa, gradePoints, normalizeScale, scaleMax, type GradeScale } from "@/lib/grades";

type CourseRow = typeof courses.$inferSelect;
type SemesterRow = typeof semesters.$inferSelect;

function gpaFromCourses(cs: CourseRow[], scale: GradeScale) {
  return computeGpa(cs, scale).gpa;
}

function difficultyLabel(c: CourseRow): "hard" | "medium" | "easy" {
  return (c.difficulty as "hard" | "medium" | "easy") || "medium";
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scale = normalizeScale(user.scale);
  const maxPts = scaleMax(scale);

  const semList = await db
    .select()
    .from(semesters)
    .where(eq(semesters.userId, session.userId))
    .orderBy(asc(semesters.order), asc(semesters.year));

  const semestersWithCourses = await Promise.all(
    semList.map(async (s) => {
      const cs = await db.select().from(courses).where(eq(courses.semesterId, s.id));
      return { semester: s, courses: cs };
    })
  );

  const allCourses = semestersWithCourses.flatMap((s) => s.courses);
  const gradedCourses = allCourses.filter((c) => c.grade);

  // Overall CGPA
  const { gpa: cgpa, credits: totalCredits } = computeGpa(gradedCourses, scale);
  const targetCgpa = Number(user.targetCgpa) || Number((maxPts * 0.7).toFixed(2));

  // Trend analysis
  const semesterTrend = semestersWithCourses
    .map((s) => ({ name: s.semester.name, gpa: gpaFromCourses(s.courses, scale), count: s.courses.length }))
    .filter((s) => s.count > 0 && s.gpa > 0);

  const recent = semesterTrend.slice(-3);
  const trendDirection =
    recent.length >= 2 && recent[recent.length - 1].gpa - recent[0].gpa >= 0.05
      ? "up"
      : recent.length >= 2 && recent[recent.length - 1].gpa - recent[0].gpa <= -0.05
      ? "down"
      : "flat";

  // Weakest / strongest courses
  const weakest = [...gradedCourses].sort((a, b) => (gradePoints(a.grade, scale) ?? 0) - (gradePoints(b.grade, scale) ?? 0))[0];
  const strongest = [...gradedCourses].sort((a, b) => (gradePoints(b.grade, scale) ?? 0) - (gradePoints(a.grade, scale) ?? 0))[0];

  // Difficulty analysis
  const byDifficulty: Record<string, { sum: number; n: number }> = {};
  for (const c of gradedCourses) {
    const d = difficultyLabel(c);
    if (!byDifficulty[d]) byDifficulty[d] = { sum: 0, n: 0 };
    byDifficulty[d].sum += gradePoints(c.grade, scale) ?? 0;
    byDifficulty[d].n += 1;
  }
  const difficultyAvg = Object.fromEntries(
    Object.entries(byDifficulty).map(([k, v]) => [k, v.sum / v.n])
  );

  // Predicted final CGPA (assume pending courses land at current average)
  const pendingCourses = allCourses.filter((c) => !c.grade);
  const pendingCredits = pendingCourses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const avgPts = cgpa; // current CGPA on the active scale
  const projectedPts =
    totalCredits + pendingCredits > 0
      ? (cgpa * totalCredits + avgPts * pendingCredits) / (totalCredits + pendingCredits)
      : cgpa;

  // What average do I need on remaining courses to hit target?
  const neededAvg =
    pendingCredits > 0
      ? (targetCgpa * (totalCredits + pendingCredits) - cgpa * totalCredits) / pendingCredits
      : cgpa;

  // Build insights
  const insights: {
    id: string;
    type: "strength" | "warning" | "prediction" | "tip" | "goal";
    title: string;
    detail: string;
    metric?: string;
  }[] = [];

  // Strength
  if (strongest) {
    insights.push({
      id: "strength",
      type: "strength",
      title: `You thrive in ${strongest.title}`,
      detail: `With a ${strongest.grade} in ${strongest.code}, this is your strongest area. Consider electives or projects that build on it.`,
      metric: `${strongest.grade}`,
    });
  }

  // Weakness
  const lowGradeThreshold = maxPts * 0.7;
  if (weakest && gradePoints(weakest.grade, scale)! < lowGradeThreshold) {
    insights.push({
      id: "weakness",
      type: "warning",
      title: `${weakest.code} is pulling your CGPA down`,
      detail: `Your ${weakest.grade} in ${weakest.title} (${difficultyLabel(weakest)} difficulty) is your lowest result. Plan targeted review sessions or seek tutoring for follow-up classes.`,
      metric: `${weakest.grade}`,
    });
  }

  // Difficulty insight
  if (difficultyAvg.hard !== undefined && difficultyAvg.easy !== undefined) {
    const gap = (difficultyAvg.easy || 0) - (difficultyAvg.hard || 0);
    if (gap > 0.5) {
      insights.push({
        id: "difficulty",
        type: "tip",
        title: "Balance hard and lighter semesters",
        detail: `Your average on hard courses is ${difficultyAvg.hard.toFixed(2)} vs ${difficultyAvg.easy.toFixed(2)} on easy ones. Cap hard courses at 2 per term to protect your CGPA.`,
        metric: `Δ ${gap.toFixed(2)}`,
      });
    }
  }

  // Trend
  if (trendDirection === "up") {
    insights.push({
      id: "trend-up",
      type: "strength",
      title: "You're on an upward trajectory",
      detail: `Your last ${recent.length} semesters show steady improvement. Keep the momentum by protecting study routines.`,
      metric: `+${(recent[recent.length - 1].gpa - recent[0].gpa).toFixed(2)}`,
    });
  } else if (trendDirection === "down") {
    insights.push({
      id: "trend-down",
      type: "warning",
      title: "Recent semesters are trending down",
      detail: `Your GPA dropped ${(recent[0].gpa - recent[recent.length - 1].gpa).toFixed(2)} points over the last ${recent.length} semesters. Review workload, sleep, and focus time.`,
      metric: `${(recent[recent.length - 1].gpa - recent[0].gpa).toFixed(2)}`,
    });
  }

  // Target gap
  const gap = targetCgpa - cgpa;
  insights.push({
    id: "goal",
    type: "goal",
    title: gap >= 0 ? `You're ${gap.toFixed(2)} points from your target` : `You've exceeded your target by ${Math.abs(gap).toFixed(2)}`,
    detail:
      gap >= 0
        ? `Target: ${targetCgpa.toFixed(2)} · Current: ${cgpa.toFixed(2)}. ${pendingCredits > 0 ? `You need an average of ${Math.min(maxPts, Math.max(0, neededAvg)).toFixed(2)} on your ${pendingCredits} remaining credits to hit it.` : "Add upcoming courses to model your path."}`
        : `Great job — your ${cgpa.toFixed(2)} CGPA is already above your target of ${targetCgpa.toFixed(2)}.`,
    metric: `${cgpa.toFixed(2)}`,
  });

  // Pending courses prediction
  if (pendingCourses.length > 0) {
    insights.push({
      id: "projection",
      type: "prediction",
      title: `Projected CGPA: ${projectedPts.toFixed(2)}`,
      detail: `Assuming you maintain your current average across ${pendingCourses.length} ongoing course${pendingCourses.length > 1 ? "s" : ""} (${pendingCredits} credits).`,
      metric: `${projectedPts.toFixed(2)}`,
    });
  }

  // Credits load tip
  const currentSem = semestersWithCourses.find((s) => s.semester.isCurrent);
  if (currentSem) {
    const currentCredits = currentSem.courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
    if (currentCredits > 18) {
      insights.push({
        id: "overload",
        type: "warning",
        title: `Heavy credit load this term`,
        detail: `You're taking ${currentCredits} credits in ${currentSem.semester.name}. Consider dropping a non-essential course to preserve your GPA.`,
        metric: `${currentCredits} cr`,
      });
    }
  }

  // Course-specific tips
  if (gradedCourses.length >= 4) {
    const hardLow = gradedCourses
      .filter((c) => difficultyLabel(c) === "hard" && (gradePoints(c.grade, scale) ?? 0) < lowGradeThreshold)
      .length;
    if (hardLow >= 2) {
      insights.push({
        id: "hard-strategy",
        type: "tip",
        title: "Rethink your strategy for hard courses",
        detail: `${hardLow} of your hard courses finished below a B. Try the "3-pass" method: first pass for concepts, second pass for worked examples, third pass for timed practice.`,
      });
    }
  }

  const studyPlan = buildStudyPlan(semestersWithCourses, cgpa, targetCgpa, scale);

  return NextResponse.json({
    overview: {
      cgpa,
      targetCgpa,
      totalCredits,
      pendingCredits,
      projectedCgpa: projectedPts,
      neededAvgOnPending: pendingCredits > 0 ? Math.min(maxPts, Math.max(0, neededAvg)) : null,
      trend: trendDirection,
      semesterCount: semestersWithCourses.length,
      courseCount: allCourses.length,
      scale,
      scaleMax: maxPts,
    },
    insights,
    strongest: strongest
      ? { code: strongest.code, title: strongest.title, grade: strongest.grade }
      : null,
    weakest: weakest
      ? { code: weakest.code, title: weakest.title, grade: weakest.grade }
      : null,
    difficultyAverages: difficultyAvg,
    studyPlan,
  });
}

function buildStudyPlan(
  semestersWithCourses: { semester: SemesterRow; courses: CourseRow[] }[],
  cgpa: number,
  target: number,
  scale: GradeScale
): { week: string; focus: string; hours: number; why: string }[] {
  if (semestersWithCourses.length === 0) return [];
  const maxPts = scaleMax(scale);
  const gap = target - cgpa;
  const gapRatio = maxPts > 0 ? gap / maxPts : 0;
  const intensity = gapRatio > 0.075 ? "intensive" : gapRatio > 0 ? "moderate" : "maintenance";
  const baseHours = intensity === "intensive" ? 18 : intensity === "moderate" ? 12 : 8;

  // Focus areas based on weak courses
  const lowGradeThreshold = maxPts * 0.7;
  const all = semestersWithCourses.flatMap((s) => s.courses);
  const weak = all
    .filter((c) => c.grade && (gradePoints(c.grade, scale) ?? 0) < lowGradeThreshold)
    .sort((a, b) => (gradePoints(a.grade, scale) ?? 0) - (gradePoints(b.grade, scale) ?? 0))
    .slice(0, 3);

  const plan: { week: string; focus: string; hours: number; why: string }[] = [
    {
      week: "Week 1",
      focus: "Audit & plan",
      hours: baseHours - 2,
      why: "Review syllabi, set up a study calendar, and identify office hours for upcoming classes.",
    },
    {
      week: "Week 2–3",
      focus: weak[0] ? `Deep dive: ${weak[0].code}` : "Foundation review",
      hours: baseHours,
      why: weak[0]
        ? `Your lowest grade was in ${weak[0].title}. Prioritize active recall and weekly problem sets.`
        : "Build consistent daily study habits before layering in harder material.",
    },
    {
      week: "Week 4",
      focus: "Practice exams",
      hours: baseHours + 2,
      why: "Simulate exam conditions for all current courses. Track which topics are still shaky.",
    },
    {
      week: "Week 5–6",
      focus: weak[1] ? `Reinforce: ${weak[1].code}` : "Project work",
      hours: baseHours,
      why: weak[1]
        ? `Give ${weak[1].title} a focused pass now before midterms hit.`
        : "Allocate time to course projects so finals week isn't overwhelming.",
    },
    {
      week: "Week 7+",
      focus: "Maintenance & review",
      hours: Math.max(6, baseHours - 2),
      why: "Lock in gains with spaced repetition. Aim for 2 short sessions per day instead of one long one.",
    },
  ];
  return plan;
}
