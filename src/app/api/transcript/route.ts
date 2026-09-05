import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { computeGpa, classifyGpa, normalizeScale } from "@/lib/grades";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scale = normalizeScale(user.scale);

  const semList = await db
    .select()
    .from(semesters)
    .where(eq(semesters.userId, session.userId))
    .orderBy(asc(semesters.order));

  const allCourses = await db
    .select()
    .from(courses)
    .innerJoin(semesters, eq(courses.semesterId, semesters.id))
    .where(eq(semesters.userId, session.userId));

  const bySemester = new Map<string, typeof allCourses[number]["courses"][]>();
  for (const row of allCourses) {
    const list = bySemester.get(row.courses.semesterId) ?? [];
    list.push(row.courses);
    bySemester.set(row.courses.semesterId, list);
  }

  const semestersOut = semList.map((s) => {
    const cs = bySemester.get(s.id) ?? [];
    const { gpa, credits } = computeGpa(cs, scale);
    return {
      id: s.id,
      name: s.name,
      year: s.year,
      gpa,
      credits,
      courses: cs.map((c) => ({
        code: c.code,
        title: c.title,
        credits: Number(c.credits),
        grade: c.grade,
        score: c.score ? Number(c.score) : null,
      })),
    };
  });

  const allFlatCourses = semestersOut.flatMap((s) => s.courses);
  const { gpa: cgpa, credits: totalCredits } = computeGpa(allFlatCourses, scale);
  const classification = classifyGpa(cgpa, scale);

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      university: user.university,
      program: user.program,
      scale,
    },
    overview: {
      cgpa,
      totalCredits,
      classification: classification.label,
      semesterCount: semestersOut.length,
    },
    semesters: semestersOut,
  });
}
